import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface VideoPlayerProps {
  title: string;
  episode: number;
}

export function VideoPlayer({ title, episode }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (showControls && isPlaying) {
      timeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [showControls, isPlaying]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    console.log(isPlaying ? "Paused" : "Playing");
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    console.log(isMuted ? "Unmuted" : "Muted");
  };

  const handleFullscreen = () => {
    console.log("Fullscreen toggled");
  };

  const skipForward = () => {
    console.log("Skip forward 10s");
  };

  const skipBackward = () => {
    console.log("Skip backward 10s");
  };

  return (
    <div
      className="relative aspect-video bg-black rounded-md overflow-hidden group"
      onMouseMove={handleMouseMove}
      data-testid="video-player"
    >
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-900/40">
        <div className="text-center text-white">
          <Play className="h-20 w-20 mx-auto mb-4 opacity-50" />
          <p className="text-xl font-semibold">{title}</p>
          <p className="text-sm text-white/70">Episode {episode}</p>
        </div>
      </div>

      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute top-4 left-4 right-4 text-white">
          <h2 className="text-xl font-semibold" data-testid="text-video-title">
            {title} - Episode {episode}
          </h2>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="mb-2">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
              data-testid="input-video-progress"
            />
          </div>

          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="text-white hover:bg-white/20"
                data-testid="button-play-pause"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={skipBackward}
                className="text-white hover:bg-white/20"
                data-testid="button-skip-back"
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={skipForward}
                className="text-white hover:bg-white/20"
                data-testid="button-skip-forward"
              >
                <SkipForward className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
                data-testid="button-mute"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <span className="text-sm">0:00 / 24:00</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleFullscreen}
              className="text-white hover:bg-white/20"
              data-testid="button-fullscreen"
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
