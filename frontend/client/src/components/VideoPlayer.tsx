import { Button } from "@/components/ui/button";
import {
  ChevronsLeft,
  FastForward,
  Maximize,
  Minimize,
  Pause,
  Play,
  Rewind,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";

// --- TYPES ---
interface VideoPlayerProps {
  title: string;
  episode: number;
  videoUrl?: string;
  duration?: string;
  onPreviousEpisode?: () => void;
  onNextEpisode?: () => void;
  hasPreviousEpisode?: boolean;
  hasNextEpisode?: boolean;
}

// Định nghĩa State chuẩn theo Source Code Official
interface PlayerState {
  playing: boolean;
  controls: boolean;
  volume: number;
  muted: boolean;
  played: number; // 0 -> 1
  playedSeconds: number;
  loaded: number; // 0 -> 1 (Buffer)
  loadedSeconds: number;
  duration: number;
  playbackRate: number;
  seeking: boolean; // Trạng thái đang kéo thanh trượt
}

const INITIAL_STATE: PlayerState = {
  playing: false,
  controls: false,
  volume: 0.8,
  muted: false,
  played: 0,
  playedSeconds: 0,
  loaded: 0,
  loadedSeconds: 0,
  duration: 0,
  playbackRate: 1.0,
  seeking: false,
};

export function VideoPlayer({
  title,
  episode,
  videoUrl,
  duration: initialDuration,
  onPreviousEpisode,
  onNextEpisode,
  hasPreviousEpisode = false,
  hasNextEpisode = false,
}: VideoPlayerProps) {
  // --- REFS ---
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- STATE ---
  const [state, setState] = useState<PlayerState>(INITIAL_STATE);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const prevVideoUrlRef = useRef<string | undefined>(undefined);

  const {
    playing,
    volume,
    muted,
    played,
    playedSeconds,
    duration,
    seeking,
    loaded,
  } = state;

  // --- HELPER FORMAT TIME ---
  const formatTime = (seconds: number): string => {
    if (!seconds && seconds !== 0) return "00:00";
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, "0");
    if (hh) return `${hh}:${mm.toString().padStart(2, "0")}:${ss}`;
    return `${mm}:${ss}`;
  };

  // --- EFFECT: VIDEO URL CHANGE (Abort + Reset) ---
  useEffect(() => {
    if (videoUrl && videoUrl !== prevVideoUrlRef.current) {
      // Abort request cũ nếu có
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      prevVideoUrlRef.current = videoUrl;
      
      // 1. Bật ngay loading
      setIsLoadingVideo(true);

      // 2. Reset state và BẬT AUTOPLAY (playing: true)
      setState(prev => ({
        ...prev,
        playing: true, // Quan trọng: Set true để video tự chạy khi ready
        playedSeconds: 0,
        played: 0,
        loaded: 0,
        loadedSeconds: 0,
        duration: 0,
      }));
    }
  }, [videoUrl, episode]);

  // --- EFFECTS: AUTO HIDE CONTROLS ---
  useEffect(() => {
    if (showControls && playing) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showControls, playing]);

  // --- HANDLERS (Logic từ Official Demo) ---

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
  };

  const handlePlayPause = () => {
    setState((prev) => ({ ...prev, playing: !prev.playing }));
  };

  const handleStart = () => {
     console.log("Video Started");
     setIsLoadingVideo(false); // Đảm bảo tắt loading chắc chắn
  };

  const handlePlay = () => {
    setState((prev) => ({ ...prev, playing: true }));
  };

  const handlePause = () => {
    setState((prev) => ({ ...prev, playing: false }));
  };

  const handleEnded = () => {
    setState((prev) => ({ ...prev, playing: false }));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({
      ...prev,
      volume: parseFloat(e.target.value),
      muted: parseFloat(e.target.value) === 0, // Tự động mute nếu kéo về 0
    }));
  };

  const handleToggleMute = () => {
    setState((prev) => ({
      ...prev,
      muted: !prev.muted,
      // Nếu unmute mà volume đang 0, set lại 0.5
      volume: prev.muted && prev.volume === 0 ? 0.5 : prev.volume,
    }));
  };

  // Logic Seek chuẩn (MouseDown -> Change -> MouseUp)
  const handleSeekMouseDown = () => {
    setState((prev) => ({ ...prev, seeking: true }));
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Chỉ update UI (played), chưa seek video
    setState((prev) => ({ ...prev, played: parseFloat(e.target.value) }));
  };

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, seeking: false }));
    const seekValue = parseFloat((e.target as HTMLInputElement).value);
    // Set currentTime trực tiếp như trong demo
    if (playerRef.current) {
      playerRef.current.currentTime = seekValue * playerRef.current.duration;
    }
  };

  const handleTimeUpdate = () => {
    const player = playerRef.current;
    // Không update khi đang seek
    if (!player || state.seeking) return;

    if (!player.duration) return;

    setState((prev) => ({
      ...prev,
      playedSeconds: player.currentTime,
      played: player.currentTime / player.duration,
    }));
  };

  const handleProgress = () => {
    const player = playerRef.current;
    if (!player || state.seeking || !player.buffered?.length) return;

    const loadedSeconds = player.buffered?.end(player.buffered?.length - 1);
    const loaded = loadedSeconds / player.duration;

    setState((prev) => ({
      ...prev,
      loadedSeconds: loadedSeconds,
      loaded: loaded,
    }));
  };

  const handleDurationChange = () => {
    const player = playerRef.current;
    if (!player) return;

    setState((prev) => ({ ...prev, duration: player.duration }));
  };

  const handleSkipForward = () => {
    const player = playerRef.current;
    if (!player) return;
    player.currentTime = Math.min(player.currentTime + 10, player.duration);
  };

  const handleSkipBackward = () => {
    const player = playerRef.current;
    if (!player) return;
    player.currentTime = Math.max(player.currentTime - 10, 0);
  };

  const handleVideoReady = () => {
    if (!isMountedRef.current) return;
    console.log("Video Ready - Prepared to play");
    // Lưu ý: Có thể tắt loading ở đây, hoặc đợi onStart
    // Nhưng để chắc chắn, ta chưa tắt hẳn ở đây nếu muốn đợi khung hình đầu tiên
    // Tuy nhiên, với Google Drive, onReady thường là lúc an toàn để tắt loading.
    setIsLoadingVideo(false); 
  };

  const handleWaiting = () => {
    console.log("Buffering...");
    setIsLoadingVideo(true);
  };

  const handlePlaying = () => {
    console.log("Playing...");
    setIsLoadingVideo(false);
  };


  // Fullscreen Logic
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Callback để set ref cho ReactPlayer
  const setPlayerRef = React.useCallback((player: HTMLVideoElement) => {
    if (!player) return;
    playerRef.current = player;
  }, []);

  // Listen thoát fullscreen bằng ESC
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Cleanup on unmount - abort pending requests and mark component as unmounted
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-md overflow-hidden group select-none"
      onMouseMove={handleMouseMove}
      data-testid="video-player"
    >
      {videoUrl ? (
        <ReactPlayer
          ref={setPlayerRef}
          className="react-player"
          width="100%"
          height="100%"
          src={videoUrl}
          playing={playing}
          volume={volume}
          muted={muted}
          onReady={handleVideoReady}
          
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onStart={handleStart}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onError={(e: any) => {
            console.error("Video playback error:", e);
            
            // 1. Tắt loading để không bị quay mãi
            setIsLoadingVideo(false);
            
            // 2. QUAN TRỌNG: Chuyển playing về false
            // Để nút Play to giữa màn hình hiện ra lại -> User bấm vào đó sẽ hết Error
            setState(prev => ({ ...prev, playing: false }));
        }}
          onTimeUpdate={handleTimeUpdate}
          onProgress={handleProgress}
          onDurationChange={handleDurationChange}

          crossOrigin ="anonymous"
          
          

        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-900/40">
          <div className="text-center text-white">
            <Play className="h-20 w-20 mx-auto mb-4 opacity-50" />
            <p className="text-xl font-semibold">No video source</p>
            <p className="text-sm text-white/70">Please select an episode</p>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoadingVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-lg font-semibold drop-shadow-md">Đang tải</p>
            <p className="text-sm text-white/70 drop-shadow-md">Vui lòng chờ...</p>
          </div>
        </div>
      )}

      {/* Overlay Play Button (Big Center) */}
      {!playing && !isLoadingVideo && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer z-10"
          onClick={handlePlayPause}
        >
          <div className="text-center text-white">
            <Play className="h-20 w-20 mx-auto mb-4 opacity-70 hover:opacity-100 transition-opacity" />
            <p className="text-xl font-semibold drop-shadow-md">{title}</p>
            <p className="text-sm text-white/80 drop-shadow-md">
              Episode {episode}
            </p>
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent transition-opacity duration-300 pointer-events-none z-20 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Top Info */}
        <div className="absolute top-4 left-4 right-4 text-white pointer-events-auto">
          <h2 className="text-xl font-semibold drop-shadow-md">
            {title} - Episode {episode}
          </h2>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
          {/* Progress Bar Container */}
          <div className="relative mb-4 h-1 group/slider flex items-center">
            {/* Background Track */}
            <div className="absolute w-full h-1 bg-white/20 rounded-full" />

            {/* Loaded (Buffer) Track */}
            <div
              className="absolute h-1 bg-white/40 rounded-full transition-all duration-300"
              style={{ width: `${loaded * 100}%` }}
            />

            {/* Played Track & Input */}
            <input
              type="range"
              min={0}
              max={0.999999}
              step="any"
              value={played}
              onMouseDown={handleSeekMouseDown}
              onChange={handleSeekChange}
              onMouseUp={handleSeekMouseUp}
              className="absolute w-full h-1 appearance-none cursor-pointer bg-transparent z-20 focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:opacity-0 group-hover/slider:[&::-webkit-slider-thumb]:opacity-100 transition-opacity"
              style={{
                // Tạo hiệu ứng màu trắng cho phần đã chạy
                backgroundImage: `linear-gradient(to right, white ${
                  played * 100
                }%, transparent ${played * 100}%)`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePlayPause}
                className="text-white hover:bg-white/20 hover:text-white h-8 w-8"
              >
                {playing ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="h-5 w-5 fill-current" />
                )}
              </Button>

              {/* Skips */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 hover:text-white h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={onPreviousEpisode}
                disabled={!hasPreviousEpisode}
                title="Previous Episode"
              >
                <SkipBack className="h-4 w-4 fill-current" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkipBackward}
                className="text-white hover:bg-white/20 hover:text-white h-8 w-8"
              >
                {/* <SkipBack className="h-4 w-4 fill-current" /> */}
                <Rewind className="h-4 w-4 fill-current" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkipForward}
                className="text-white hover:bg-white/20 hover:text-white h-8 w-8"
              >
                {/* <SkipForward className="h-4 w-4 fill-current" /> */}
                <FastForward className="h-4 w-4 fill-current" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 hover:text-white h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={onNextEpisode}
                disabled={!hasNextEpisode}
                title="Next Episode"
              >
                <SkipForward className="h-4 w-4 fill-current" />
              </Button>

              {/* Volume */}
              <div className="flex items-center gap-1 group/volume">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleMute}
                  className="text-white hover:bg-white/20 hover:text-white h-8 w-8"
                >
                  {muted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step="any"
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-200 h-1 accent-white bg-white/30 rounded cursor-pointer ml-1"
                />
              </div>

              {/* Time */}
              <span className="text-xs font-medium ml-2 select-none opacity-90">
                {formatTime(playedSeconds)} / {formatTime(duration || 0)}
              </span>
            </div>

            {/* Right Side: Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20 hover:text-white h-8 w-8"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
