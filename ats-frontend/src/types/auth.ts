export type NomRole = 'ADMIN' | 'RECRUTEUR';

export interface Utilisateur {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: NomRole;
}

export interface AuthResponse {
  token: string;
  role: NomRole;
  id: number;
  email: string;
  nom: string;
  prenom: string;
}