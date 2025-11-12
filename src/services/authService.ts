import { AxiosResponse } from 'axios';
import { LoginRequest, AuthResponse, RefreshTokenRequest, User, ApiResponse, UpdateUserRequest, UpdatePasswordRequest } from '../types/auth';
import apiClient, { handleApiError } from './apiClient';

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

  // Update user profile
  async updateUserProfile(request: UpdateUserRequest): Promise<AxiosResponse<ApiResponse<string>>> {
    return apiClient.put('/Users', request);
  },

  // Change password
  async changePassword(request: UpdatePasswordRequest): Promise<AxiosResponse<ApiResponse<string>>> {
    return apiClient.put('/Users/ChangePassword', request);
  },

  // Helper function to get user-friendly error messages
  getErrorMessage(error: any): string {
    return handleApiError(error);
  },
};

export default authService;