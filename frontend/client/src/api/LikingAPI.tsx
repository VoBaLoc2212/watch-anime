const API_URL = import.meta.env.API_URL ?? import.meta.env.VITE_API_URL;

export const AddLikingApi = async (animeSlug: string): Promise<string> => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${API_URL}/api/liking/add-liking?animeSlug=${animeSlug}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    let errorMessage =
      errorData.message || errorData.title || JSON.stringify(errorData);
    throw new Error(errorMessage);
  }
  return response.json() as Promise<string>;
};

export const RemoveLikingApi = async (animeSlug: string): Promise<string> => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Authentication required");
  }
  const response = await fetch(
    `${API_URL}/api/liking/remove-liking?animeSlug=${animeSlug}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    let errorMessage =
      errorData.message || errorData.title || JSON.stringify(errorData);
    throw new Error(errorMessage);
  }

  return response.json() as Promise<string>;
};
