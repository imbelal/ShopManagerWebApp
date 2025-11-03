import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '../types/auth';
import authService from './authService';

// Create global axios instance
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7093/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

// Process the queue of failed requests
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) {
      resolve(token);
    } else {
      reject(error);
    }
  });

  failedQueue = [];
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If it's a 401 error and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If already refreshing, add to queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return apiClient(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Validate refresh token format before sending
        if (refreshToken.split('.').length !== 3) {
          throw new Error('Invalid refresh token format - not a JWT');
        }

        // Use authService for consistent token refresh
        const refreshResponse = await authService.refreshAccessToken(refreshToken);

        if (refreshResponse.data.succeeded && refreshResponse.data.data) {
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;

          // Validate we received a proper access token
          if (!newAccessToken || newAccessToken.length < 10) {
            throw new Error('Invalid access token received from refresh');
          }

          // Store new access token
          localStorage.setItem('accessToken', newAccessToken);

          // Store new refresh token if provided (backend should always return a new one)
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          // Process queue with new token
          processQueue(null, newAccessToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } else {
          const errorMsg = refreshResponse.data.message || 'Refresh token response was invalid';
          throw new Error(errorMsg);
        }
      } catch (refreshError) {
        // Refresh token failed, clear tokens and redirect to login
        processQueue(refreshError, null);

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Only redirect to login if we're not already on the login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API errors consistently
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Handle backend Errors array (capital E) - this is the primary format
  if (error.response?.data?.Errors && Array.isArray(error.response.data.Errors)) {
    return error.response.data.Errors.join(', ');
  }

  // Handle validation errors object (lowercase) - for ModelState errors
  if (error.response?.data?.errors) {
    const errors = Object.values(error.response.data.errors).flat();
    return errors.join(', ');
  }

  // Handle single error string
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

// Export the configured axios instance
export default apiClient;

// Export a typed version for better type safety
export type ApiResponse<T = any> = {
  succeeded: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
};

// Export request/response types for services
export type { AxiosResponse };