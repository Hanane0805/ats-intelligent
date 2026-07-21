import { axiosInstance } from '../lib/axios';
import { AuthResponse } from '../types/auth';

/**
 * Matches the backend's OAuth2Response (dto/response/OAuth2Response.java)
 * returned by GET /api/auth/oauth2/google/callback.
 *
 * Unlike AuthResponse (returned by /api/auth/login and /api/auth/register),
 * this endpoint does NOT return role/userId/email/nom/prenom directly - only
 * the JWT itself, plus its type and provider. Any user info needed for the
 * session must be read from the JWT's claims (see lib/jwt.ts + AuthContext).
 */
export interface GoogleOAuth2Response {
  accessToken: string;
  tokenType: string;
  provider: string;
}

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
   * Maps to OAuth2Controller#getGoogleAuthUrl, which responds with
   * `{ authorizationUrl: string }` (NOT `authUrl`).
   */
  getGoogleAuthUrl: async (): Promise<string> => {
    const { data } = await axiosInstance.get<{ authorizationUrl: string }>(
      '/auth/oauth2/google/url'
    );
    return data.authorizationUrl;
  },

  /**
   * Exchanges the temporary code received from the Google authorization handshake
   * for a fully verified JSON Web Token session.
   *
   * Maps to OAuth2Controller#googleCallback, which returns an OAuth2Response
   * (accessToken/tokenType/provider) - a different shape than the AuthResponse
   * returned by the password-login endpoint. Callers must not treat this as an
   * AuthResponse (see AuthContext#loginWithGoogleCallback for how it's normalized).
   */
  handleGoogleCallback: async (code: string): Promise<GoogleOAuth2Response> => {
    const { data } = await axiosInstance.get<GoogleOAuth2Response>(
      `/auth/oauth2/google/callback?code=${encodeURIComponent(code)}`
    );
    return data;
  },
};
