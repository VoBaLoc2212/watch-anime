import { AnimeCard } from "./AnimeCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";

interface Anime {
  id: number;
  title: string;
  image: string;
  episodes: number;
  genres: string[];
}

interface AnimeRowProps {
  title: string;
  animes: Anime[];
}

export function AnimeRow({ title, animes }: AnimeRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -800 : 800;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  return (
    <div className="relative group" data-testid={`row-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <h2 className="text-2xl font-semibold mb-4 px-8">{title}</h2>
      <div className="relative px-8">
        {showLeftArrow && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-full rounded-none bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => scroll("left")}
            data-testid="button-scroll-left"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {animes.map((anime) => (
            <div key={anime.id} className="flex-none w-48">
              <AnimeCard {...anime} />
            </div>
          ))}
        </div>
        {showRightArrow && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-full rounded-none bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => scroll("right")}
            data-testid="button-scroll-right"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}
      </div>
    </div>
  );
}
