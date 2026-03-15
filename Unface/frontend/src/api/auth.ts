import { api } from './client';

export interface LoginResponse {
  token: string;
  user: { id: number; email: string; schoolId: number };
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  school: string;
  birthDate: string;
  phoneNumber?: string;
  policyAgreed: boolean;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/api/auth/login', { email, password }),

  register: (data: RegisterData) =>
    api.post<LoginResponse>('/api/auth/register', data),

  logout: () => api.post('/api/auth/logout'),

  me: () => api.get('/api/auth/me'),
};
