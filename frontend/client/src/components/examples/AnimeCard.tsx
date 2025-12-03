import { AnimeCard } from "../AnimeCard";
import magicalGirlImage from "@assets/generated_images/magical_girl_anime_poster.png";

export default function AnimeCardExample() {
  return (
    <div className="w-48">
      <AnimeCard
        id={1}
        title="Magical Dreams"
        image={magicalGirlImage}
        episodes={24}
        genres={["Fantasy", "Action"]}
      />
    </div>
  );
}
