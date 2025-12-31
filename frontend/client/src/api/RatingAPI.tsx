const API_URL = import.meta.env.API_URL ?? import.meta.env.VITE_API_URL;

import { Rating } from "@/models/RatingModel";

export const GetRatingsForAnimeApi = async (animeId: string): Promise<Rating[]> => {
    const response = await fetch(`${API_URL}/api/rating/get-animeratings?animeSlug=${animeId}`, {
        method: 'GET'
    });
    if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.message || errorData.title || JSON.stringify(errorData);
        throw new Error(errorMessage);
    }
    return response.json() as Promise<Rating[]>;
}

