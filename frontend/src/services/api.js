import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    withCredentials: true
});

api.interceptors.request.use((config) => {
    let token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        if (token === 'guest-demo-token') {
            config.headers['x-guest-mode'] = 'true';
        }
    } else {
        token = 'guest-demo-token';
        localStorage.setItem('token', token);
        config.headers.Authorization = `Bearer ${token}`;
        config.headers['x-guest-mode'] = 'true';
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const token = localStorage.getItem('token');
            if (token === 'guest-demo-token') {
                localStorage.setItem('token', 'guest-demo-token');
            }
        }
        return Promise.reject(error);
    }
);

export default api;
