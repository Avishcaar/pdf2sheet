import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    withCredentials: true
});

api.interceptors.request.use((config) => {
    let token = localStorage.getItem('token');

    // If no token or explicit demo mode flag or guest-demo-token:
    const isGuest = !token || token === 'guest-demo-token' || localStorage.getItem('demo_mode') === 'true';

    if (isGuest) {
        token = 'guest-demo-token';
        localStorage.setItem('token', token);
        config.headers.Authorization = `Bearer ${token}`;
        config.headers['x-guest-mode'] = 'true';
    } else {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.setItem('token', 'guest-demo-token');
            localStorage.setItem('demo_mode', 'true');
        }
        return Promise.reject(error);
    }
);

export default api;
