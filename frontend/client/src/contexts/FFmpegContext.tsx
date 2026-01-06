import { createContext, useContext, useRef, useState, useEffect, ReactNode } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

interface FFmpegContextType {
  ffmpeg: FFmpeg | null;
  isLoaded: boolean;
  isLoading: boolean;
  loadProgress: number;
  error: string | null;
}

const FFmpegContext = createContext<FFmpegContextType>({
  ffmpeg: null,
  isLoaded: false,
  isLoading: false,
  loadProgress: 0,
  error: null,
});

export const useFFmpeg = () => useContext(FFmpegContext);

interface FFmpegProviderProps {
  children: ReactNode;
  autoLoad?: boolean; // Tự động load khi mount
}

export function FFmpegProvider({ children, autoLoad = false }: FFmpegProviderProps) {
  const ffmpegRef = useRef<FFmpeg>(new FFmpeg());
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoLoad && !isLoaded && !isLoading) {
      loadFFmpeg();
    }
  }, [autoLoad]);

  const loadFFmpeg = async () => {
    if (isLoaded || isLoading) return;

    setIsLoading(true);
    setLoadProgress(0);
    setError(null);

    const ffmpeg = ffmpegRef.current;

    ffmpeg.on('log', ({ message }) => {
      console.log('FFmpeg:', message);
    });

    try {
      setLoadProgress(10);
      
      // Dùng CDN với cache tốt
      const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
      
      setLoadProgress(30);
      const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
      
      setLoadProgress(60);
      const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
      
      setLoadProgress(80);
      await ffmpeg.load({ coreURL, wasmURL });
      
      setIsLoaded(true);
      setLoadProgress(100);
      console.log('✅ FFmpeg loaded and cached successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('❌ Failed to load FFmpeg:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FFmpegContext.Provider
      value={{
        ffmpeg: ffmpegRef.current,
        isLoaded,
        isLoading,
        loadProgress,
        error,
      }}
    >
      {children}
    </FFmpegContext.Provider>
  );
}
