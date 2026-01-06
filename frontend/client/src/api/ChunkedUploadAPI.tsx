const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface InitiateChunkedUploadRequest {
  fileName: string;
  totalSize: number;
  totalChunks: number;
  animeSlug: string;
  episodeNumber: number;
  episodeName: string;
}

export interface InitiateChunkedUploadResponse {
  uploadId: string;
  chunkSize: number;
  totalChunks: number;
}

export interface UploadChunkResponse {
  success: boolean;
  chunkIndex: number;
  message: string;
}

export interface CompleteChunkedUploadResponse {
  success: boolean;
  message: string;
  hlsMasterUrl: string;
  episodeId: number;
}

/**
 * Step 1: Initiate chunked upload session
 */
export const InitiateChunkedUploadApi = async (
  request: InitiateChunkedUploadRequest
): Promise<InitiateChunkedUploadResponse> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/chunkedupload/initiate-chunked-upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to initiate upload');
  }
  return data;
};

/**
 * Step 2: Upload individual chunk
 */
export const UploadChunkApi = async (
  uploadId: string,
  chunkIndex: number,
  chunkData: Blob
): Promise<UploadChunkResponse> => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('UploadId', uploadId);
  formData.append('ChunkIndex', chunkIndex.toString());
  formData.append('ChunkData', chunkData, `chunk_${chunkIndex}`);

  const response = await fetch(`${API_BASE_URL}/api/ChunkedUpload/upload-chunk`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to upload chunk');
  }
  return data;
};

/**
 * Step 3: Complete upload and start HLS conversion
 */
export const CompleteChunkedUploadApi = async (
  uploadId: string,
  duration: string
): Promise<CompleteChunkedUploadResponse> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/ChunkedUpload/complete-chunked-upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uploadId, duration }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to complete upload');
  }
  return data;
};

/**
 * Get upload progress
 */
export const GetUploadProgressApi = async (uploadId: string) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/ChunkedUpload/upload-progress/${uploadId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to get upload progress');
  }
  return data;
};

/**
 * Cancel upload
 */
export const CancelUploadApi = async (uploadId: string) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/ChunkedUpload/cancel-upload/${uploadId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to cancel upload');
  }
  return data;
};
