const API_URL = import.meta.env.API_URL ?? import.meta.env.VITE_API_URL;
import { checkTokenAndLogout } from "@/utils/tokenUtils";

interface Login{
    email: string;
    password: string;
}

interface Register extends Login {
    phoneNumber: string;
    firstName: string;
    lastName: string;
}

interface UserInfo {
    token: string;
    email: string;
    fullName: string;
    photoUrl: string;
    phoneNumber: string;
}

export async function GetUserInfoApi() {
    const response = await fetch(`${API_URL}/api/account/user`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    if (!response.ok) {
        const errorText = await response.json();
        throw new Error(`Failed to fetch user info: ${errorText.message}`);
    }
    return response.json() as Promise<UserInfo>;
}

export async function RegisterApi(payload: Register) {
    const response = await fetch(`${API_URL}/api/account/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
    }

    // Parse response body as JSON and read token from the parsed object
    const data = await response.json() as { token?: string; [key: string]: any };
    if (data && data.token) {
        localStorage.setItem('token', data.token);
    }

    return data;
}

export async function LoginApi(payload: Login) {
    const response = await fetch(`${API_URL}/api/account/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Login failed: ${errorText}`);
    }
    const data = await response.json() as { token?: string; [key: string]: any };
    if (data && data.token) {
        localStorage.setItem('token', data.token);
    }
}

export async function LogoutApi() {
    localStorage.removeItem('token');
}

export function LoginWithGoogle() {
    window.location.href = `${API_URL}/api/account/login-google`;
}

/**
 * Xử lý token từ URL sau khi redirect về từ backend
 * Trả về true nếu tìm thấy và lưu token thành công
 */
export function handleAuthRedirect(): boolean {
    // Lấy token từ URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
        // Lưu token vào localStorage
        localStorage.setItem('token', token);
        
        // Xóa token khỏi URL để bảo mật
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        return true;
    }
    
    return false;
}

/**
 * Kiểm tra xem user đã đăng nhập chưa
 */
export function isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
}

/**
 * Lấy token hiện tại
 */
export function getToken(): string | null {
    return localStorage.getItem('token');
}

/**
 * Cập nhật thông tin user profile với FormData (bao gồm avatar)
 */
export async function UpdateUserProfileApi(formData: FormData) {
    // Check token expiration first
    if (!checkTokenAndLogout()) {
        throw new Error('Session expired. Please login again.');
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/api/account/update-user`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type - browser will set it automatically with multipart/form-data boundary
        },
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update profile');
    }

    return response.json() as Promise<UserInfo>;
}

/**
 * Đổi mật khẩu
 */
interface ChangePasswordPayload {
    oldPassword?: string;
    newPassword: string;
}

export async function ChangePasswordApi(payload: ChangePasswordPayload) {
    // Check token expiration first
    if (!checkTokenAndLogout()) {
        throw new Error('Session expired. Please login again.');
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/api/account/change-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.json();
        throw new Error(errorText.message || 'Failed to change password');
    }

    const data = await response.json();

    return data;
}