import axios, { AxiosResponse } from 'axios';
import { LoginRequest, AuthResponse, RefreshTokenRequest, User, ApiResponse } from '../types/auth';

// Create axios instance
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await refreshAccessToken(refreshToken);
          if (response.data.succeeded && response.data.data) {
            const { accessToken } = response.data.data;

            localStorage.setItem('accessToken', accessToken);

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh token failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  // Login user
  async login(credentials: LoginRequest): Promise<AxiosResponse<ApiResponse<AuthResponse>>> {
    return apiClient.post('/Users/Login', credentials);
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<AxiosResponse<ApiResponse<User>>> {
    return apiClient.get(`/Users/GetById/${userId}`);
  },

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<AxiosResponse<ApiResponse<AuthResponse>>> {
    return apiClient.post('/Users/RefreshToken', { refreshToken } as RefreshTokenRequest);
  },

  // Logout user (client-side only - server doesn't have logout endpoint)
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
};

// Helper function for token refresh
async function refreshAccessToken(refreshToken: string): Promise<AxiosResponse<ApiResponse<AuthResponse>>> {
  const response = await axios.post(`${API_BASE_URL}/Users/RefreshToken`, { refreshToken } as RefreshTokenRequest);
  return response;
}

export default authService;