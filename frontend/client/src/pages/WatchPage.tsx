import { Navbar } from "@/components/Navbar";
import { VideoPlayer } from "@/components/VideoPlayer";
import { EpisodeGrid } from "@/components/EpisodeGrid";
import { AnimeRow } from "@/components/AnimeRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRoute } from "wouter";
import { useState } from "react";
import heroImage from "@assets/generated_images/hero_banner_anime_warrior.png";
import magicalGirlImage from "@assets/generated_images/magical_girl_anime_poster.png";
import darkFantasyImage from "@assets/generated_images/dark_fantasy_anime_poster.png";
import schoolAnimeImage from "@assets/generated_images/school_anime_poster.png";

export default function WatchPage() {
  const [, params] = useRoute("/watch/:id");
  const [currentEpisode, setCurrentEpisode] = useState(1);

  const animeDetails = {
    id: Number(params?.id) || 1,
    title: "Magical Dreams",
    description: "In a world where magic and reality intertwine, a young girl discovers her hidden powers and must learn to harness them to protect her friends and the world from an ancient darkness.",
    genres: ["Fantasy", "Action", "Adventure"],
    episodes: 24,
    rating: "PG-13",
    year: 2024,
  };

  const episodes = Array.from({ length: 12 }, (_, i) => ({
    number: i + 1,
    title: `The Beginning of Adventure - Part ${i + 1}`,
    thumbnail: heroImage,
    duration: "24:00",
    watched: i < 2,
  }));

  const relatedAnime = [
    { id: 2, title: "Dark Realm", image: darkFantasyImage, episodes: 12, genres: ["Dark Fantasy", "Adventure"] },
    { id: 3, title: "School Days", image: schoolAnimeImage, episodes: 13, genres: ["Slice of Life", "Comedy"] },
    { id: 1, title: "Magical Dreams", image: magicalGirlImage, episodes: 24, genres: ["Fantasy", "Action"] },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-8 py-6 max-w-7xl mx-auto space-y-8">
        <VideoPlayer title={animeDetails.title} episode={currentEpisode} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>{animeDetails.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {animeDetails.genres.map((genre) => (
                    <Badge key={genre} variant="secondary">
                      {genre}
                    </Badge>
                  ))}
                  <Badge variant="outline">{animeDetails.rating}</Badge>
                  <Badge variant="outline">{animeDetails.year}</Badge>
                  <Badge variant="outline">{animeDetails.episodes} Episodes</Badge>
                </div>
                <p className="text-muted-foreground">{animeDetails.description}</p>
              </CardContent>
            </Card>

            <EpisodeGrid
              episodes={episodes}
              currentEpisode={currentEpisode}
              onEpisodeSelect={setCurrentEpisode}
            />
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Related Anime</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {relatedAnime.map((anime) => (
                  <div
                    key={anime.id}
                    className="flex gap-3 hover-elevate active-elevate-2 p-2 rounded-md cursor-pointer -m-2"
                  >
                    <img
                      src={anime.image}
                      alt={anime.title}
                      className="w-20 h-28 object-cover rounded-md"
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

        <AnimeRow title="You Might Also Like" animes={relatedAnime} />
      </main>
    </div>
  );
}
