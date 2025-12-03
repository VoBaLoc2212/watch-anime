import { EpisodeGrid } from "../EpisodeGrid";
import { useState } from "react";
import heroImage from "@assets/generated_images/hero_banner_anime_warrior.png";

export default function EpisodeGridExample() {
  const [currentEpisode, setCurrentEpisode] = useState(1);

  const episodes = Array.from({ length: 6 }, (_, i) => ({
    number: i + 1,
    title: `The Beginning of Adventure Part ${i + 1}`,
    thumbnail: heroImage,
    duration: "24:00",
    watched: i < 2,
  }));

  return (
    <EpisodeGrid
      episodes={episodes}
      currentEpisode={currentEpisode}
      onEpisodeSelect={setCurrentEpisode}
    />
  );
}
