const API_URL = import.meta.env.API_URL ?? import.meta.env.VITE_API_URL;
import { Episode } from "@/models/EpisodeModel";
import { checkTokenAndLogout } from "@/utils/tokenUtils";

/**
 * Upload a single chunk of an episode video file
 */
export const UploadEpisodeChunkApi = async (formData: FormData) => {
    // Check token expiration first
    if (!checkTokenAndLogout()) {
        throw new Error('Session expired. Please login again.');
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/api/episode/upload-episode-chunk`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
            // Don't set Content-Type - browser will set it automatically with multipart/form-data boundary
        },
        body: formData,
    });

    if (!response.ok) {
        // Check for 401 Unauthorized
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            window.dispatchEvent(new Event('storage'));
            throw new Error('Session expired. Please login again.');
        }

        // Try to parse error message - clone response to read body multiple times
        let errorMessage = 'Failed to upload chunk';
        try {
            const errorData = await response.clone().json();
            errorMessage = errorData.message || errorData.title || JSON.stringify(errorData);
        } catch {
            try {
                const errorText = await response.text();
                if (errorText) {
                    errorMessage = errorText;
                }
            } catch {
                // If both fail, use default message
            }
        }
        
        throw new Error(errorMessage);
    }

    return response.json();
};

/**
 * Get list of episodes for a specific anime
 */
export const GetEpisodesApi = async (animeName: string) => {
    const response = await fetch(`${API_URL}/api/episode/get-animeepisodes?animeName=${animeName}`, {
        method: 'GET'
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || errorData.title || JSON.stringify(errorData);
        throw new Error(errorMessage);
    }
    
    return response.json() as Promise<Array<Episode>>;
};

/**
 * Delete an episode
 */
export const DeleteEpisodeApi = async (episodeId: number) => {
    // Check token expiration first
    if (!checkTokenAndLogout()) {
        throw new Error('Session expired. Please login again.');
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/api/episode/delete-episode?episodeId=${episodeId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            window.dispatchEvent(new Event('storage'));
            throw new Error('Session expired. Please login again.');
        }

        const errorData = await response.json();
        const errorMessage = errorData.message || errorData.title || JSON.stringify(errorData);
        throw new Error(errorMessage);
    }

    return response.json();
};
