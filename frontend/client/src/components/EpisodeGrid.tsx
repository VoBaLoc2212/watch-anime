import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Check } from "lucide-react";

interface Episode {
  number: number;
  title: string;
  thumbnail: string;
  duration: string;
  watched: boolean;
}

interface EpisodeGridProps {
  episodes: Episode[];
  currentEpisode: number;
  onEpisodeSelect: (episode: number) => void;
}

export function EpisodeGrid({ episodes, currentEpisode, onEpisodeSelect }: EpisodeGridProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Episodes</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {episodes.map((episode) => (
          <Card
            key={episode.number}
            className={`hover-elevate active-elevate-2 cursor-pointer overflow-hidden ${
              episode.number === currentEpisode ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onEpisodeSelect(episode.number)}
            data-testid={`card-episode-${episode.number}`}
          >
            <CardContent className="p-0">
              <div className="relative aspect-video bg-muted">
                <img
                  src={episode.thumbnail}
                  alt={`Episode ${episode.number}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Play className="h-12 w-12 text-white" />
                </div>
                {episode.watched && (
                  <Badge className="absolute top-2 right-2 bg-primary">
                    <Check className="h-3 w-3 mr-1" />
                    Watched
                  </Badge>
                )}
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                  {episode.duration}
                </div>
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm mb-1">
                  Episode {episode.number}
                  {episode.number === currentEpisode && (
                    <Badge variant="outline" className="ml-2">
                      Now Playing
                    </Badge>
                  )}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {episode.title}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
