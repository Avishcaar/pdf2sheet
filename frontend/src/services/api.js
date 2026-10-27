import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true
});

api.interceptors.request.use((config) => {
    let token = localStorage.getItem('token');
    if (!token) {
        token = 'guest-demo-token';
        localStorage.setItem('token', token);
    }
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['x-guest-mode'] = 'true';
    return config;
});

// Response interceptor: if 401 ever occurs, fallback to guest mode rather than throwing
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Re-seed demo token so guest user stays seamlessly connected
            localStorage.setItem('token', 'guest-demo-token');
        }
        return Promise.reject(error);
    }
);

export default api;
