import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";

interface HeroAnime {
  id: number;
  title: string;
  description: string;
  image: string;
  genres: string[];
  episodes: number;
}

interface HeroCarouselProps {
  animes: HeroAnime[];
}

export function HeroCarousel({ animes }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % animes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [animes.length]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % animes.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + animes.length) % animes.length);
  };

  const currentAnime = animes[currentIndex];

  return (
    <div className="relative h-[70vh] overflow-hidden" data-testid="hero-carousel">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{ backgroundImage: `url(${currentAnime.image})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      </div>

      <div className="relative h-full flex items-center px-8 md:px-16 max-w-7xl mx-auto">
        <div className="max-w-2xl text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-4" data-testid="text-hero-title">
            {currentAnime.title}
          </h1>
          <div className="flex flex-wrap gap-2 mb-4">
            {currentAnime.genres.map((genre) => (
              <Badge
                key={genre}
                variant="outline"
                className="bg-white/10 backdrop-blur-md border-white/30 text-white"
              >
                {genre}
              </Badge>
            ))}
            <Badge
              variant="outline"
              className="bg-white/10 backdrop-blur-md border-white/30 text-white"
            >
              {currentAnime.episodes} Episodes
            </Badge>
          </div>
          <p className="text-lg mb-6 line-clamp-3 text-white/90">
            {currentAnime.description}
          </p>
          <div className="flex gap-4">
            <Link href={`/watch/${currentAnime.id}`}>
              <Button size="lg" className="gap-2" data-testid="button-play">
                <Play className="h-5 w-5" />
                Watch Now
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20"
              data-testid="button-more-info"
            >
              <Info className="h-5 w-5" />
              More Info
            </Button>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 text-white hover:bg-white/20"
        onClick={goToPrev}
        data-testid="button-carousel-prev"
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 text-white hover:bg-white/20"
        onClick={goToNext}
        data-testid="button-carousel-next"
      >
        <ChevronRight className="h-8 w-8" />
      </Button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {animes.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1 rounded-full transition-all ${
              index === currentIndex ? "w-8 bg-white" : "w-4 bg-white/50"
            }`}
            data-testid={`button-carousel-dot-${index}`}
          />
        ))}
      </div>
    </div>
  );
}
