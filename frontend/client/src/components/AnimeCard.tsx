import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import { Link } from "wouter";
import { slugify } from "@/utils/slugify";
import { Anime } from "@/models/AnimeModel";


export function AnimeCard({ slug, description, thumbnailUrl, totalEpisodes, genres, animeName }: Anime) {
  return (
    <Link href={`/watch?animeName=${slugify(animeName)}`}>
      <div
        className="group relative aspect-[2/3] overflow-hidden rounded-md hover-elevate active-elevate-2 cursor-pointer transition-transform duration-200 hover:scale-105"
        data-testid={`card-anime-${slug}`}
      >
        <img
          src={thumbnailUrl}
          alt={animeName}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{animeName}</h3>
            <div className="flex flex-wrap gap-1 mb-2">
              {genres.slice(0, 2).map((genre) => (
                <Badge
                  key={genre}
                  variant="secondary"
                  className="text-xs bg-white/20 text-white border-white/30"
                >
                  {genre}
                </Badge>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/80">{totalEpisodes} Episodes</span>
              <Play className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
