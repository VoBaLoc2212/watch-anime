import { AnimeRow } from "../AnimeRow";
import magicalGirlImage from "@assets/generated_images/magical_girl_anime_poster.png";
import darkFantasyImage from "@assets/generated_images/dark_fantasy_anime_poster.png";
import schoolAnimeImage from "@assets/generated_images/school_anime_poster.png";
import mechaImage from "@assets/generated_images/mecha_robot_anime_poster.png";
import sportsImage from "@assets/generated_images/sports_anime_poster.png";
import romanceImage from "@assets/generated_images/romance_anime_poster.png";

export default function AnimeRowExample() {
  const animes = [
    { id: 1, title: "Magical Dreams", image: magicalGirlImage, episodes: 24, genres: ["Fantasy", "Action"] },
    { id: 2, title: "Dark Realm", image: darkFantasyImage, episodes: 12, genres: ["Dark Fantasy", "Adventure"] },
    { id: 3, title: "School Days", image: schoolAnimeImage, episodes: 13, genres: ["Slice of Life", "Comedy"] },
    { id: 4, title: "Mecha Warriors", image: mechaImage, episodes: 26, genres: ["Mecha", "Sci-Fi"] },
    { id: 5, title: "Victory Sprint", image: sportsImage, episodes: 24, genres: ["Sports", "Drama"] },
    { id: 6, title: "Cherry Love", image: romanceImage, episodes: 12, genres: ["Romance", "Drama"] },
  ];

  return <AnimeRow title="Trending Now" animes={animes} />;
}
