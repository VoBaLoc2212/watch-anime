const API_URL = import.meta.env.API_URL ?? import.meta.env.VITE_API_URL;

import { Rating } from "@/models/RatingModel";
import axios from "axios";

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

export const AddAnimeRatingApi = async (
    animeSlug: string, 
    score: number, 
    review: string
): Promise<string> => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/api/rating/add-animerating?animeSlug=${animeSlug}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            score,
            review
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.message || errorData.title || JSON.stringify(errorData);
        throw new Error(errorMessage);
    }


    return response.json() as Promise<string>;
}

export const UpdateAnimeRatingApi = async (animeSlug : string, score: number, review: string): Promise<string> => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/api/rating/update-animerating?animeSlug=${animeSlug}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            score,
            review
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.message || errorData.title || JSON.stringify(errorData);
        throw new Error(errorMessage);
    }

    return response.json() as Promise<string>;

}