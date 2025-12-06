const API_URL = import.meta.env.API_URL ?? import.meta.env.VITE_API_URL;

interface Login{
    email: string;
    password: string;
}

interface Register extends Login {
    phoneNumber: string;
    firstName: string;
    lastName: string;
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
        localStorage.setItem('fullName', `${payload.firstName} ${payload.lastName}`);
        localStorage.setItem('email', payload.email);
        localStorage.setItem('photoUrl', data.photoUrl || '');
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
        localStorage.setItem('fullName', data.fullName || '');
        localStorage.setItem('email', payload.email);
        localStorage.setItem('photoUrl', data.photoUrl || '');
    }
}

export async function LogoutApi() {
    localStorage.removeItem('token');
}

export function LoginWithGoogle() {
    window.location.href = `${API_URL}/api/account/login-google`;
}