import { HeroCarousel } from "@/components/HeroCarousel";
import { AnimeRow } from "@/components/AnimeRow";
import { Navbar } from "@/components/Navbar";
import heroImage1 from "@assets/generated_images/hero_banner_anime_warrior.png";
import heroImage2 from "@assets/generated_images/fantasy_battle_hero_banner.png";
import magicalGirlImage from "@assets/generated_images/magical_girl_anime_poster.png";
import darkFantasyImage from "@assets/generated_images/dark_fantasy_anime_poster.png";
import schoolAnimeImage from "@assets/generated_images/school_anime_poster.png";
import mechaImage from "@assets/generated_images/mecha_robot_anime_poster.png";
import sportsImage from "@assets/generated_images/sports_anime_poster.png";
import romanceImage from "@assets/generated_images/romance_anime_poster.png";
import adventureImage from "@assets/generated_images/adventure_anime_poster.png";
import cyberpunkImage from "@assets/generated_images/cyberpunk_anime_poster.png";

export default function Dashboard() {
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

  const continueWatching = [
    { id: 1, title: "Magical Dreams", image: magicalGirlImage, episodes: 24, genres: ["Fantasy", "Action"] },
    { id: 2, title: "Dark Realm", image: darkFantasyImage, episodes: 12, genres: ["Dark Fantasy", "Adventure"] },
    { id: 3, title: "School Days", image: schoolAnimeImage, episodes: 13, genres: ["Slice of Life", "Comedy"] },
  ];

  const trending = [
    { id: 4, title: "Mecha Warriors", image: mechaImage, episodes: 26, genres: ["Mecha", "Sci-Fi"] },
    { id: 5, title: "Victory Sprint", image: sportsImage, episodes: 24, genres: ["Sports", "Drama"] },
    { id: 6, title: "Cherry Love", image: romanceImage, episodes: 12, genres: ["Romance", "Drama"] },
    { id: 7, title: "Mountain Quest", image: adventureImage, episodes: 13, genres: ["Adventure", "Action"] },
    { id: 8, title: "Cyber City", image: cyberpunkImage, episodes: 24, genres: ["Sci-Fi", "Thriller"] },
  ];

  const newReleases = [
    { id: 6, title: "Cherry Love", image: romanceImage, episodes: 12, genres: ["Romance", "Drama"] },
    { id: 1, title: "Magical Dreams", image: magicalGirlImage, episodes: 24, genres: ["Fantasy", "Action"] },
    { id: 7, title: "Mountain Quest", image: adventureImage, episodes: 13, genres: ["Adventure", "Action"] },
    { id: 4, title: "Mecha Warriors", image: mechaImage, episodes: 26, genres: ["Mecha", "Sci-Fi"] },
    { id: 8, title: "Cyber City", image: cyberpunkImage, episodes: 24, genres: ["Sci-Fi", "Thriller"] },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroCarousel animes={heroAnimes} />
        <div className="py-8 space-y-12">
          <AnimeRow title="Continue Watching" animes={continueWatching} />
          <AnimeRow title="Trending Now" animes={trending} />
          <AnimeRow title="New Releases" animes={newReleases} />
        </div>
      </main>
    </div>
  );
}
