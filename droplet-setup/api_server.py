#!/usr/bin/env python3
"""
FFmpeg Video Conversion API Server
Runs on DigitalOcean Droplet
Uploads to Azure Blob Storage
"""

import os
import subprocess
import tempfile
import shutil
import logging
from pathlib import Path
from flask import Flask, request, jsonify
from azure.storage.blob import BlobServiceClient, ContentSettings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Load config from environment
AZURE_CONNECTION_STRING = os.getenv('AZURE_CONNECTION_STRING')
AZURE_CONTAINER_NAME = os.getenv('AZURE_CONTAINER_NAME', 'media')

# Initialize Azure Blob client
blob_service_client = BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING)

def convert_to_hls(input_path, output_dir):
    """Convert video to HLS with 2 quality variants"""
    
    # Create master playlist path
    master_playlist = os.path.join(output_dir, 'master.m3u8')
    
    # FFmpeg command for HLS conversion (2 variants: 360p, 720p)
    cmd = [
        '/usr/bin/ffmpeg',
        '-i', input_path,
        '-filter_complex',
        '[0:v]split=2[v1][v2];[v1]scale=w=640:h=360[v1out];[v2]scale=w=1280:h=720[v2out]',
        
        # 360p variant
        '-map', '[v1out]',
        '-c:v:0', 'libx264',
        '-b:v:0', '500k',
        '-preset', 'fast',
        '-g', '48',
        '-sc_threshold', '0',
        
        # 720p variant
        '-map', '[v2out]',
        '-c:v:1', 'libx264',
        '-b:v:1', '1500k',
        '-preset', 'fast',
        '-g', '48',
        '-sc_threshold', '0',
        
        # Audio (same for both variants)
        '-map', 'a:0',
        '-map', 'a:0',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-ar', '48000',
        
        # HLS settings
        '-f', 'hls',
        '-hls_time', '10',
        '-hls_playlist_type', 'vod',
        '-hls_segment_type', 'mpegts',
        '-hls_segment_filename', os.path.join(output_dir, 'v%v/seg_%03d.ts'),
        '-master_pl_name', 'master.m3u8',
        '-var_stream_map', 'v:0,a:0 v:1,a:1',
        os.path.join(output_dir, 'v%v/index.m3u8')
    ]
    
    logger.info(f"Running FFmpeg command: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
            text=True
        )
        logger.info("FFmpeg conversion completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"FFmpeg error: {e.stderr}")
        raise Exception(f"FFmpeg conversion failed: {e.stderr}")

def upload_to_azure(local_dir, blob_path):
    """Upload HLS files to Azure Blob Storage"""
    
    logger.info(f"Uploading from {local_dir} to {blob_path}")
    
    container_client = blob_service_client.get_container_client(AZURE_CONTAINER_NAME)
    uploaded_files = []
    
    # Walk through all files in output directory
    for root, dirs, files in os.walk(local_dir):
        for filename in files:
            local_path = os.path.join(root, filename)
            
            # Calculate relative path for Azure
            relative_path = os.path.relpath(local_path, local_dir)
            blob_name = os.path.join(blob_path, relative_path).replace('\\', '/')
            
            # Determine content type
            if filename.endswith('.m3u8'):
                content_type = 'application/x-mpegURL'
            elif filename.endswith('.ts'):
                content_type = 'video/MP2T'
            else:
                content_type = 'application/octet-stream'
            
            # Upload file
            logger.info(f"Uploading {blob_name}")
            blob_client = container_client.get_blob_client(blob_name)
            
            with open(local_path, 'rb') as data:
                blob_client.upload_blob(
                    data,
                    overwrite=True,
                    content_settings=ContentSettings(content_type=content_type)
                )
            
            uploaded_files.append(blob_name)
    
    # Return master playlist URL
    account_name = blob_service_client.account_name
    master_url = f"https://{account_name}.blob.core.windows.net/{AZURE_CONTAINER_NAME}/{blob_path}/master.m3u8"
    
    logger.info(f"Upload complete. Master URL: {master_url}")
    
    return {
        'master_url': master_url,
        'files': uploaded_files
    }

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'ffmpeg-api'})

@app.route('/convert', methods=['POST'])
def convert_video():
    """
    Convert video to HLS and upload to Azure Blob
    
    Request:
    - video: file upload
    - blob_path: path in Azure Blob (e.g., "anime/naruto/ep1")
    
    Response:
    - master_url: URL to master.m3u8
    """
    
    logger.info("Received conversion request")
    
    # Check if file uploaded
    if 'video' not in request.files:
        return jsonify({'error': 'No video file uploaded'}), 400
    
    video_file = request.files['video']
    blob_path = request.form.get('blob_path', 'videos')
    
    if video_file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    
    # Create temporary directories
    temp_dir = tempfile.mkdtemp()
    input_path = os.path.join(temp_dir, 'input.mp4')
    output_dir = os.path.join(temp_dir, 'hls_output')
    os.makedirs(output_dir)
    
    try:
        # Save uploaded file
        logger.info(f"Saving uploaded video to {input_path}")
        video_file.save(input_path)
        
        file_size = os.path.getsize(input_path)
        logger.info(f"Video file size: {file_size} bytes")
        
        # Convert to HLS
        logger.info("Starting HLS conversion")
        convert_to_hls(input_path, output_dir)
        
        # Upload to Azure Blob
        logger.info("Uploading to Azure Blob Storage")
        upload_result = upload_to_azure(output_dir, blob_path)
        
        # Cleanup
        logger.info("Cleaning up temporary files")
        shutil.rmtree(temp_dir)
        
        return jsonify({
            'success': True,
            'master_url': upload_result['master_url'],
            'files_uploaded': len(upload_result['files'])
        })
        
    except Exception as e:
        logger.error(f"Conversion error: {str(e)}", exc_info=True)
        
        # Cleanup on error
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Run with Gunicorn in production
    # gunicorn -w 2 -b 0.0.0.0:5000 api_server:app
    app.run(host='0.0.0.0', port=5000, debug=False)
