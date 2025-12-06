import { useEffect } from "react";
import { useLocation } from "wouter"; // Vì bạn đang dùng wouter

export const useTokenFromUrl = () => {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      console.log("Đã tìm thấy token từ Google Login");
      
      localStorage.setItem("Token", token);
      
      window.history.replaceState({}, document.title, window.location.pathname);
      
    }
  }, []);
};