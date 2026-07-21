export type NomRole = 'ADMIN' | 'RECRUTEUR' | 'USER';

export interface Utilisateur {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: NomRole;
}

/**
 * Matches the backend's AuthResponse (dto/response/AuthResponse.java) returned
 * by POST /api/auth/login and POST /api/auth/register.
 * Field names must stay in sync with the backend - note it's `userId`, not `id`.
 */
export interface AuthResponse {
  token: string;
  role: NomRole;
  userId: number;
  email: string;
  nom: string;
  prenom: string;
}
