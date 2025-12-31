import { Anime } from "@/models/AnimeModel";

const API_URL = import.meta.env.API_URL ?? import.meta.env.VITE_API_URL;

export const AddAnimeApi = async (payload: FormData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/anime/add-anime`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: payload
    });

    // Xử lý kết quả trả về
    const data = await response.json();

    if (!response.ok) {
        
        const errorMessage = data.message || data.title || JSON.stringify(data);
        throw new Error(errorMessage);
    }

    return data;
};

export const GetAnimeListApi = async () => {
    const response = await fetch(`${API_URL}/api/anime/get-animes`, {
        method: 'GET'
    });
    // Xử lý kết quả trả về
    const data = await response.json();
    if (!response.ok) {
        const errorMessage = data.message || data.title || JSON.stringify(data);
        throw new Error(errorMessage);
    }
    return data as Promise<Array<Anime>>;
}

export const GetAnimeDetailApi = async (animeNameSlug: string) => {
    const response = await fetch(`${API_URL}/api/anime/get-anime-detail?animeNameSlug=${animeNameSlug}`, {
        method: 'GET'
    });
    // Xử lý kết quả trả về
    const data = await response.json();
    if (!response.ok) {
        const errorMessage = data.message || data.title || JSON.stringify(data);
        throw new Error(errorMessage);
    }
    return data as Promise<Anime>;
}
export const UpdateAnimeApi = async (payload: FormData, animeSlug: string) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found. Please login again.');
    }
    
    const response = await fetch(`${API_URL}/api/anime/update-anime?animeSlug=${animeSlug}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: payload,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        const errorMessage = data.message || data.title || JSON.stringify(data);
        throw new Error(errorMessage);
    }

    return data;
}