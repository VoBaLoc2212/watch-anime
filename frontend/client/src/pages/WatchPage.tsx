import { VideoPlayer } from "@/components/VideoPlayer";
import { EpisodeGrid } from "@/components/EpisodeGrid";
import { AnimeRow } from "@/components/AnimeRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSearch, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useTokenCheck } from "@/hooks/useTokenCheck";
import heroImage from "@assets/generated_images/hero_banner_anime_warrior.png";
import magicalGirlImage from "@assets/generated_images/magical_girl_anime_poster.png";
import darkFantasyImage from "@assets/generated_images/dark_fantasy_anime_poster.png";
import schoolAnimeImage from "@assets/generated_images/school_anime_poster.png";
import { GetAnimeDetailApi } from "@/api/AnimeAPI";
import { Anime } from "@/models/AnimeModel";
import { Episode } from "@/models/EpisodeModel";
import { GetEpisodesApi } from "@/api/EpisodeAPI";

export default function WatchPage() {
  // Enforce token validity for watch pages only
  useTokenCheck();
  const searchParams = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(searchParams);
  const animeName = params.get("animeName");
  const episodeParam = params.get("episode");
  const [currentEpisode, setCurrentEpisode] = useState(episodeParam ? parseInt(episodeParam) : 1);

  const [animeDetails, setAnimeDetails] = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<Array<Episode>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!animeName) {
        setError("No anime selected. Please select an anime from the home page.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await GetAnimeDetailApi(animeName);
        setAnimeDetails(data);
      } catch (err) {
        console.error("Failed to load anime:", err);
        setError(err instanceof Error ? err.message : "Failed to load anime");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [animeName]);

  useEffect(() => {
    const loadEpisodes = async () => {
      if (!animeName) return;

      try {
        const listEpisodes = await GetEpisodesApi(animeName);
        setEpisodes(listEpisodes);
      } catch (err) {
        console.error("Failed to load episodes:", err);
      }
    };
    loadEpisodes();
  }, [animeName]);

  // Update episode from URL when it changes
  useEffect(() => {
    if (episodeParam) {
      const episodeNum = parseInt(episodeParam);
      if (!isNaN(episodeNum)) {
        setCurrentEpisode(episodeNum);
      }
    }
  }, [episodeParam]);

  // Handler to navigate to previous episode
  const handlePreviousEpisode = () => {
    if (currentEpisode > 1) {
      const newEpisode = currentEpisode - 1;
      setCurrentEpisode(newEpisode);
      setLocation(`/watch?animeName=${animeName}&episode=${newEpisode}`);
    }
  };

  // Handler to navigate to next episode
  const handleNextEpisode = () => {
    const totalEps = animeDetails?.totalEpisodes || episodes.length;
    if (currentEpisode < totalEps) {
      const newEpisode = currentEpisode + 1;
      setCurrentEpisode(newEpisode);
      setLocation(`/watch?animeName=${animeName}&episode=${newEpisode}`);
    }
  };

  // Handler when clicking episode in grid
  const handleEpisodeSelect = (episodeNumber: number) => {
    setCurrentEpisode(episodeNumber);
    setLocation(`/watch?animeName=${animeName}&episode=${episodeNumber}`);
  };

  // const episodes = Array.from({ length: 12 }, (_, i) => ({
  //   number: i + 1,
  //   title: `The Beginning of Adventure - Part ${i + 1}`,
  //   thumbnail: heroImage,
  //   duration: "24:00",
  //   watched: i < 2,
  // }));

  const relatedAnime = [
    { id: 2, title: "Dark Realm", image: darkFantasyImage, episodes: 12, genres: ["Dark Fantasy", "Adventure"] },
    { id: 3, title: "School Days", image: schoolAnimeImage, episodes: 13, genres: ["Slice of Life", "Comedy"] },
    { id: 1, title: "Magical Dreams", image: magicalGirlImage, episodes: 24, genres: ["Fantasy", "Action"] },
  ];

  // Find current episode's videoUrl
  const currentEpisodeData = episodes.find(ep => ep.episodeNumber === currentEpisode);
  const videoUrl = currentEpisodeData?.videoUrl || "";
  const duration = currentEpisodeData?.duration || "00:00:00";

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

  if (error || !animeDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-lg font-medium text-destructive mb-2">Error</p>
              <p className="text-muted-foreground mb-4">
                {error || "Failed to load anime"}
              </p>
              <a href="/" className="text-primary hover:underline">
                Return to Home
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
      <main className="px-8 py-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <VideoPlayer
              title={animeDetails?.animeName || ""}
              episode={currentEpisode}
              videoUrl={videoUrl}
              duration={duration}
              onPreviousEpisode={handlePreviousEpisode}
              onNextEpisode={handleNextEpisode}
              hasPreviousEpisode={currentEpisode > 1}
              hasNextEpisode={currentEpisode < (animeDetails?.totalEpisodes || episodes.length)}
            />
            <Card>
              <CardHeader>
                <CardTitle>{animeDetails?.animeName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {animeDetails?.genres.map((genre) => (
                    <Badge key={genre} variant="secondary">
                      {genre}
                    </Badge>
                  ))}
                  <Badge variant="outline">{animeDetails?.rating}</Badge>
                  <Badge variant="outline">{animeDetails?.releaseYear}</Badge>
                  <Badge variant="outline">{animeDetails?.totalEpisodes} Episodes</Badge>
                </div>
                <p className="text-muted-foreground">{animeDetails?.description}</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <EpisodeGrid
              episodes={episodes}
              currentEpisode={currentEpisode}
              onEpisodeSelect={handleEpisodeSelect}
            />
            <Card>
              <CardHeader>
                <CardTitle>Related Anime</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {relatedAnime.map((anime) => (
                  <div
                    key={anime.id}
                    className="flex gap-3 p-2 -m-2 rounded-md cursor-pointer hover-elevate active-elevate-2"
                  >
                    <img
                      src={anime.image}
                      alt={anime.title}
                      className="object-cover rounded-md w-20 h-28"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">{anime.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        {anime.episodes} Episodes
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {anime.genres.slice(0, 2).map((genre) => (
                          <Badge key={genre} variant="secondary" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* <AnimeRow title="You Might Also Like" animes={relatedAnime} /> */}
      </main>
  );
}
