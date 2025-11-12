export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ApiResponse<T> {
  data?: T;
  succeeded: boolean;
  message?: string;
  errors?: string[];
}

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUserProfile: (userData: Partial<User>) => Promise<void>;
}

export interface LoginFormData {
  username: string;
  password: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface UpdateUserRequest {
  userId: string;
  email: string;
  firstname: string;
  lastname: string;
}

export interface UpdatePasswordRequest {
  userId: string;
  username: string;
  oldPassword: string;
  newPassword: string;
}

export interface UserFormData {
  email: string;
  firstname: string;
  lastname: string;
}

export interface PasswordFormData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}