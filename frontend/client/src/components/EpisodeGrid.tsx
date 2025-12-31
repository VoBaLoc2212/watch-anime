import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Check } from "lucide-react";
import { useState } from "react";
import { Episode } from "@/models/EpisodeModel";


interface EpisodeGridProps {
  episodes: Episode[];
  currentEpisode: number;
  onEpisodeSelect: (episode: number) => void;
}

export function EpisodeGrid({ episodes, currentEpisode, onEpisodeSelect }: EpisodeGridProps) {
  const [failedThumbnails, setFailedThumbnails] = useState<Set<number>>(new Set());
  const extractDriveFileId = (videoUrl?: string) => {
    if (!videoUrl) return null;
    try {
      const u = new URL(videoUrl);
      // Try to capture the segment after /files/
      const filesMatch = u.pathname.match(/\/files\/([^\/]+)/);
      if (filesMatch && filesMatch[1]) return filesMatch[1];

      // Fallback: try id query param
      const idParam = u.searchParams.get("id") || u.searchParams.get("fileId");
      if (idParam) return idParam;
    } catch (err) {
      // If it's not a valid URL, try regex on raw string
      const rawMatch = videoUrl.match(/drive\/v3\/files\/([^?&/]+)/);
      if (rawMatch && rawMatch[1]) return rawMatch[1];
    }
    return null;
  };

  const getThumbnailForEpisode = (videoUrl?: string) => {
    const id = extractDriveFileId(videoUrl);
    if (!id) return undefined;
    return `https://drive.google.com/thumbnail?id=${id}`;
  };
  const fallbackSvg = () => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='225'><defs><linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:%231f2937;stop-opacity:1' /><stop offset='100%' style='stop-color:%23374151;stop-opacity:1' /></linearGradient></defs><rect fill='url(%23grad)' width='100%' height='100%'/><circle cx='200' cy='112' r='30' fill='%23ffffff' opacity='0.2'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='18' font-family='Arial,Helvetica,sans-serif' font-weight='500'>No thumbnail available</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const handleThumbnailError = (episodeNumber: number) => {
    setFailedThumbnails(prev => new Set([...Array.from(prev), episodeNumber]));
  };
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Episodes</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {episodes.map((episode) => (
          <Card
            key={episode.episodeNumber}
            className={`hover-elevate active-elevate-2 cursor-pointer overflow-hidden ${
              episode.episodeNumber === currentEpisode ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onEpisodeSelect(episode.episodeNumber)}
            data-testid={`card-episode-${episode.episodeNumber}`}
          >
            <CardContent className="p-0">
              <div className="relative aspect-video bg-muted">
                <img
                  src={failedThumbnails.has(episode.episodeNumber) ? fallbackSvg() : (getThumbnailForEpisode(episode.videoUrl) ?? fallbackSvg())}
                  alt={`Episode ${episode.episodeNumber}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => handleThumbnailError(episode.episodeNumber)}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Play className="h-12 w-12 text-white" />
                </div>
                {/* {episode.watched && (
                  <Badge className="absolute top-2 right-2 bg-primary">
                    <Check className="h-3 w-3 mr-1" />
                    Watched
                  </Badge>
                )} */}
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                  {episode.duration}
                </div>
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm mb-1">
                  Episode {episode.episodeNumber}
                  {episode.episodeNumber === currentEpisode && (
                    <Badge variant="outline" className="ml-2">
                      Now Playing
                    </Badge>
                  )}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {episode.episodeName}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
