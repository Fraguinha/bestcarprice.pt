export interface User {
  id: number;
  email: string;
  role: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user?: User;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  error?: string;
}
