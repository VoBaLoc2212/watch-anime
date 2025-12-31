import { HeroCarousel } from "@/components/HeroCarousel";
import { AnimeRow } from "@/components/AnimeRow";
import { GetAnimeListApi } from "@/api/AnimeAPI";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import heroImage1 from "@assets/generated_images/hero_banner_anime_warrior.png";
import heroImage2 from "@assets/generated_images/fantasy_battle_hero_banner.png";
import { Anime } from "@/models/AnimeModel";


export default function Dashboard() {
  const { toast } = useToast();

  const { data: animes = [], isLoading, isError, error } = useQuery({
    queryKey: ['animes'],
    queryFn: GetAnimeListApi,
    staleTime: 1000 * 60 * 5, // Cache dữ liệu trong 5 phút
    gcTime: 1000 * 60 * 10, // Giữ cache trong 10 phút
  });

  // Hiển thị toast khi có lỗi
  if (isError) {
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to load anime list",
      variant: "destructive",
    });
  }

  const heroAnimes = [
    {
      id: 1,
      title: "Eternal Warriors",
      description: "In a world where warriors battle for supremacy, one hero rises to challenge the dark forces threatening humanity. An epic tale of courage, friendship, and the eternal struggle between light and darkness.",
      image: heroImage1,
      genres: ["Action", "Fantasy", "Adventure"],
      episodes: 24,
    },
    {
      id: 2,
      title: "Fantasy Saga",
      description: "An epic tale of magic, friendship, and courage as heroes unite to save their realm from an ancient evil. Journey through mystical lands filled with wonder and danger.",
      image: heroImage2,
      genres: ["Fantasy", "Magic", "Drama"],
      episodes: 12,
    },
  ];

  // Sắp xếp theo rating (cao nhất) cho Trending Now
  const trending: Anime[] = [...animes]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8)
    .map(anime => ({
      slug: anime.slug,
      animeName: anime.animeName,
      description: anime.description,
      thumbnailUrl: anime.thumbnailUrl,
      totalEpisodes: anime.totalEpisodes || 0,
      genres: anime.genres,
      rating: anime.rating,
      releaseYear: anime.releaseYear,
      studio: anime.studio,
      status: anime.status
    }));

  // Sắp xếp theo releaseYear (mới nhất) cho New Releases
  const newReleases: Anime[] = [...animes]
    .sort((a, b) => b.releaseYear - a.releaseYear)
    .slice(0, 8)
    .map(anime => ({
      slug: anime.slug,
      animeName: anime.animeName,
      description: anime.description,
      thumbnailUrl: anime.thumbnailUrl,
      totalEpisodes: anime.totalEpisodes || 0,
      genres: anime.genres,
      rating: anime.rating,
      releaseYear: anime.releaseYear,
      studio: anime.studio,
      status: anime.status
    }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading anime...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <HeroCarousel animes={heroAnimes} />
      <div className="py-8 space-y-12">
        <AnimeRow title="Trending Now" animes={trending} />
        <AnimeRow title="New Releases" animes={newReleases} />
      </div>
    </>
  );
}

