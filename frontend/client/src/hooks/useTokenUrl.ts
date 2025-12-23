import { useEffect } from "react";
import { useLocation } from "wouter"; // Vì bạn đang dùng wouter
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";
import { GetUserInfoApi } from "@/api/Auth";
import { useQuery } from "@tanstack/react-query";
export const useTokenFromUrl = () => {
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      // Lưu token vào localStorage
      localStorage.setItem("token", token);
      
      // Xóa token khỏi URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Hiển thị thông báo thành công
      toast({
        
        title: "Đăng nhập thành công!",
        description: "Chào mừng bạn đã quay trở lại.",
      });

      //Call API Get User Info here if needed
      
      // Trigger re-render cho các component đang lắng nghe
      window.dispatchEvent(new Event('storage'));
    }
  }, [toast]);
};


export function useUserInfo() {
  const token = localStorage.getItem("token");

  return useQuery({
    queryKey: ["userInfo"],
    queryFn: async () => {
      const userInfo = await GetUserInfoApi(DecodeToken(token!).unique_name);
      return {
        fullName: userInfo.fullName,
        email: userInfo.email,
        photoUrl: userInfo.photoUrl ?? "",
        phoneNumber: userInfo.phoneNumber ?? "",
      };
    },
    enabled: !!token,
  });
}


interface MyJwtPayload {
  nameid: string[];        
  unique_name: string;   
  photoUrl: string;     
  exp: number;    
  iat: number;
}
export const DecodeToken = (token: string) => {
  return jwtDecode<MyJwtPayload>(token)
}