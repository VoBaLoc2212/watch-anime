import { Episode } from "@/models/EpisodeModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface EpisodeGridProps {
  episodes: Episode[];
  currentEpisode: number;
  onEpisodeSelect: (episodeNumber: number) => void;
}

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

export function EpisodeGrid({ episodes, currentEpisode, onEpisodeSelect }: EpisodeGridProps) {
  // Sắp xếp các tập phim theo số thứ tự để đảm bảo đúng thứ tự
  const sortedEpisodes = [...episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);

  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle>Episodes ({episodes.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Sử dụng ScrollArea cho danh sách tập phim dài */}
        <ScrollArea className="h-[500px] w-full">
          <div className="flex flex-col gap-1 p-2">
            {sortedEpisodes.map((ep) => {
              const thumbnailUrl = getThumbnailForEpisode(ep.videoUrl);
              return (
                <div
                  key={ep.episodeNumber}
                  onClick={() => onEpisodeSelect(ep.episodeNumber)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors",
                    ep.episodeNumber === currentEpisode
                      ? "bg-muted font-semibold"
                      : "hover:bg-muted/50"
                  )}
                >
                  <span className="w-8 flex-shrink-0 text-center text-base text-muted-foreground">
                    {ep.episodeNumber}
                  </span>
                  <img
                    src={thumbnailUrl}
                    alt={`Thumbnail for Episode ${ep.episodeNumber}`}
                    className="h-14 w-24 flex-shrink-0 rounded-md bg-muted object-cover"
                  />
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm">
                      {/* API có thể không cung cấp tiêu đề, nên sẽ fallback về tên mặc định */}
                      {`Episode ${ep.episodeNumber}`}
                    </p>
                    {ep.duration && ep.duration !== "00:00:00" && (
                      <p className="text-xs text-muted-foreground">{ep.duration}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
