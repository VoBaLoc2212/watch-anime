export const availableGenres = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
  "Mecha",
  "Music",
] as const;

export const statusOptions = ["Ongoing", "Completed", "Upcoming"] as const;

export type AnimeGenre = typeof availableGenres[number];
export type AnimeStatus = typeof statusOptions[number];
