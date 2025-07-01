import axios from 'axios';

const BASE_URL = 'https://restaurantchat-production.up.railway.app';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('restaurant_user') || '{}');
    if (user?.access_token) {
      config.headers.Authorization = `Bearer ${user.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

if (error.response?.status === 401 && !originalRequest._retry) {
  const safeEndpoints = ['/chat/logs/latest', '/clients/logs', '/chat/logs/client'];

  const isPublicSafe = safeEndpoints.some(path => originalRequest?.url?.includes(path));
  if (isPublicSafe) {
    // Skip redirect in public chat mode
    console.warn('🔒 Public endpoint unauthorized, skipping login redirect:', originalRequest.url);
    return Promise.reject(error);
  }

  originalRequest._retry = true;

  const user = JSON.parse(localStorage.getItem('restaurant_user') || '{}');
  if (!user?.refresh_token) {
    localStorage.removeItem('restaurant_user');
    window.location.href = '/login';
    return Promise.reject(error);
  }

  try {
    const response = await axios.post(`${BASE_URL}/restaurant/refresh-token`, {
      refresh_token: user.refresh_token,
    });

    const { access_token, refresh_token, role } = response.data;
    const updatedUser = {
      ...user,
      access_token,
      refresh_token,
      role,
    };

    localStorage.setItem('restaurant_user', JSON.stringify(updatedUser));

    originalRequest.headers.Authorization = `Bearer ${access_token}`;
    return api(originalRequest);
  } catch (refreshError) {
    console.error('Token refresh failed:', refreshError);
    localStorage.removeItem('restaurant_user');
    window.location.href = '/login';
    return Promise.reject(refreshError);
  }
}


    return Promise.reject(error);
  }
);

export default api;