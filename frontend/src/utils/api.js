const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

import axios from 'axios';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial for sending/receiving refresh token HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle token expiration (401)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and request hasn't been retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop if refreshing fails
      if (originalRequest.url === '/auth/refresh' || originalRequest.url === '/auth/login') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue up the requests while token is refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Request token refresh
        const res = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (res.data.success && res.data.accessToken) {
          const newToken = res.data.accessToken;
          localStorage.setItem('accessToken', newToken);
          api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          processQueue(null, newToken);
          isRefreshing = false;
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Log out user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth-logout')); // Notify AuthContext
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
