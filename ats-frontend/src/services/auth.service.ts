import { axiosInstance } from '../lib/axios';
import { AuthResponse } from '../types/auth';

export const authService = {
  /**
   * Authenticates administrative and recruiter profiles locally using standard credentials.
   * Maps to the backend's AuthService local authentication handler.
   */
  login: async (email: string, motDePasse: string): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post<AuthResponse>('/auth/login', {
      email,
      motDePasse,
    });
    return data;
  },

  /**
   * Requests the dynamically generated Google OAuth2 authorization URI from the backend.
   * Maps to OAuth2Service endpoints.
   */
  getGoogleAuthUrl: async (): Promise<string> => {
    const { data } = await axiosInstance.get<{ authUrl: string }>('/auth/oauth2/google/url');
    return data.authUrl;
  },

  /**
   * Exchanges the temporary code received from the Google authorization handshake 
   * for a fully verified JSON Web Token session.
   */
  handleGoogleCallback: async (code: string): Promise<AuthResponse> => {
    const { data } = await axiosInstance.get<AuthResponse>(
      `/auth/oauth2/google/callback?code=${code}`
    );
    return data;
  },
};