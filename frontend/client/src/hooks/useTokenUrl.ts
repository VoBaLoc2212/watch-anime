import { useEffect } from "react";
import { useLocation } from "wouter"; // Vì bạn đang dùng wouter
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";
import { GetUserInfoApi } from "@/api/AuthAPI";
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
      const payload = token ? DecodeToken(token) : undefined;
      const email = payload?.email;
      const role = payload ? resolveRoleFromPayload(payload) : undefined;
      const userInfo = email ? await GetUserInfoApi(email) : { fullName: "", email: "", photoUrl: "", phoneNumber: "" };
      return {
        fullName: userInfo.fullName,
        email: userInfo.email,
        photoUrl: userInfo.photoUrl ?? "",
        phoneNumber: userInfo.phoneNumber ?? "",
        role: role ?? undefined,
      };
    },
    enabled: !!token,
  });
}


export interface MyJwtPayload {
  nameid?: string[];
  email?: string;
  photoUrl?: string;
  exp?: number;
  iat?: number;
  HasPassword?: string;
  // Common role claim keys
  role?: string | string[];
  roles?: string[];
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string | string[];
}

export const DecodeToken = (token: string) => {
  return jwtDecode<MyJwtPayload>(token);
}

const resolveRoleFromPayload = (payload: MyJwtPayload): string | undefined => {
  if (!payload) return undefined;
  if (payload.role) return Array.isArray(payload.role) ? payload.role[0] : payload.role;
  if (payload.roles && payload.roles.length) return payload.roles[0];
  const msRole = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
  if (msRole) return Array.isArray(msRole) ? msRole[0] : msRole;
  return undefined;
}