import { HeroCarousel } from "../HeroCarousel";
import heroImage1 from "@assets/generated_images/hero_banner_anime_warrior.png";
import heroImage2 from "@assets/generated_images/fantasy_battle_hero_banner.png";

export default function HeroCarouselExample() {
  const animes = [
    {
      id: 1,
      title: "Eternal Warriors",
      description: "In a world where warriors battle for supremacy, one hero rises to challenge the dark forces threatening humanity.",
      image: heroImage1,
      genres: ["Action", "Fantasy", "Adventure"],
      episodes: 24,
    },
    {
      id: 2,
      title: "Fantasy Saga",
      description: "An epic tale of magic, friendship, and courage as heroes unite to save their realm from an ancient evil.",
      image: heroImage2,
      genres: ["Fantasy", "Magic", "Drama"],
      episodes: 12,
    },
  ];

  return <HeroCarousel animes={animes} />;
}
