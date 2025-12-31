import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  exp: number;
  [key: string]: any;
}

/**
 * Check if token is expired
 * @param token JWT token string
 * @returns true if expired, false if valid
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const currentTime = Date.now() / 1000; // Convert to seconds
    
    // Token expired if exp is less than current time
    return decoded.exp < currentTime;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true; // Consider invalid token as expired
  }
};

/**
 * Check token and logout if expired
 * @returns true if token is valid, false if expired
 */
export const checkTokenAndLogout = (): boolean => {
  const token = localStorage.getItem("token");
  
  if (!token || isTokenExpired(token)) {
    // Clear token and user data
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    
    // Dispatch storage event to notify other components
    window.dispatchEvent(new Event('storage'));
    
    return false;
  }
  
  return true;
};

/**
 * Get time until token expires (in seconds)
 * @param token JWT token string
 * @returns seconds until expiration, or 0 if expired/invalid
 */
export const getTokenExpiresIn = (token: string | null): number => {
  if (!token) return 0;

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const currentTime = Date.now() / 1000;
    const expiresIn = decoded.exp - currentTime;
    
    return expiresIn > 0 ? expiresIn : 0;
  } catch (error) {
    return 0;
  }
};
