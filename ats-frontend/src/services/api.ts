const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ─── Token Management ────────────────────────────────────────────────────────

export const auth = {
  getToken: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem('ats_token') : null,
  setSession: (data: AuthResponse) => {
    localStorage.setItem('ats_token', data.token);
    localStorage.setItem('ats_user', JSON.stringify({
      id: data.userId,
      email: data.email,
      nom: data.nom,
      prenom: data.prenom,
      role: data.role,
    }));
  },
  getUser: (): User | null => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('ats_user') : null;
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  clearSession: () => {
    localStorage.removeItem('ats_token');
    localStorage.removeItem('ats_user');
  },
  isAuthenticated: (): boolean => !!auth.getToken(),
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  role: string;
  userId: number;
  email: string;
  nom: string;
  prenom: string;
}

export interface FichePoste {
  id: number;
  titre: string;
  description: string;
  dateCreation: string;
  statut: string; // OUVERT | FERME
  recruteurId: number;
  recruteurNom: string;
}

export interface Candidature {
  id: number;
  datePostulation: string;
  scoreCompatibilite: number;
  statut: string; // EN_ATTENTE | ANALYSE | ACCEPTE | REJETE
  candidatId: number;
  candidatNom: string;
  fichePosteId: number;
  fichePosteTitre: string;
  analyseIA?: {
    id: number;
    scoreCompatibilite: number;
    pointsForts: string;
    pointsFaibles: string;
    recommendation: string;
    dateAnalyse: string;
  };
}

export interface DashboardStats {
  totalCandidats: number;
  totalCandidatures: number;
  totalPostes: number;
  postesActifs: number;
  candidaturesEnAttente: number;
  scoreMoyenAnalyse: number;
  candidaturesAcceptees: number;
  candidaturesRejetees: number;
}

// ─── HTTP Helper ──────────────────────────────────────────────────────────────

const request = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = auth.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401) {
    auth.clearSession();
    window.location.href = '/';
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Erreur ${response.status}`);
  return data as T;
};

// ─── API Methods ──────────────────────────────────────────────────────────────

export const api = {
  // Auth
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const data = await request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: credentials.email, motDePasse: credentials.password }),
    });
    auth.setSession(data);
    return data;
  },

  register: async (userData: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    departement?: string;
  }): Promise<AuthResponse> => {
    const data = await request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nom: userData.nom,
        prenom: userData.prenom,
        email: userData.email,
        motDePasse: userData.password,
        departement: userData.departement || 'RH',
      }),
    });
    auth.setSession(data);
    return data;
  },

  logout: () => {
    auth.clearSession();
    window.location.href = '/';
  },

  // Dashboard
  getDashboardStats: (): Promise<DashboardStats> =>
    request<DashboardStats>('/api/dashboard/stats'),

  // Job Positions (Fiches de Poste)
  getJobs: (): Promise<FichePoste[]> =>
    request<FichePoste[]>('/api/fiches-poste'),

  getJob: (id: number): Promise<FichePoste> =>
    request<FichePoste>(`/api/fiches-poste/${id}`),

  createJob: (data: { titre: string; description: string; recruteurId: number }): Promise<FichePoste> =>
    request<FichePoste>('/api/fiches-poste', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Candidatures
  getCandidatures: (): Promise<Candidature[]> =>
    request<Candidature[]>('/api/candidatures'),

  getCandidature: (id: number): Promise<Candidature> =>
    request<Candidature>(`/api/candidatures/${id}`),

  updateCandidatureStatus: (id: number, statut: string): Promise<Candidature> =>
    request<Candidature>(`/api/candidatures/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ statut }),
    }),

  createCandidature: (candidatId: number, fichePosteId: number): Promise<Candidature> =>
    request<Candidature>('/api/candidatures', {
      method: 'POST',
      body: JSON.stringify({ candidatId, fichePosteId }),
    }),

  getCandidaturesByPoste: (fichePosteId: number): Promise<Candidature[]> =>
    request<Candidature[]>(`/api/candidatures/poste/${fichePosteId}`),


  // Users (Recruteurs)
  getUsers: (): Promise<any[]> => request<any[]>('/api/recruteurs'),

  createUser: (data: any): Promise<any> =>
    request<any>('/api/recruteurs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteUser: (id: number): Promise<void> =>
    request<void>(`/api/recruteurs/${id}`, { method: 'DELETE' }),

  updateProfile: (id: number, data: { nom: string, prenom: string, email: string, motDePasse?: string, departement?: string }): Promise<any> =>
    request<any>(`/api/recruteurs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Configurations
  getConfigurations: (): Promise<any[]> => request<any[]>('/api/configurations'),

  updateConfiguration: (cle: string, valeurParametre: string): Promise<any> =>
    request<any>(`/api/configurations/${cle}`, {
      method: 'PUT',
      body: JSON.stringify({ valeurParametre }),
    }),

  // Admin / Roles / Logs
  getAdminStats: (): Promise<{ totalUsers: number, totalRoles: number, totalLogs: number }> => 
    request<any>('/api/dashboard/admin-stats'),
    
  getRoles: (): Promise<any[]> => request<any[]>('/api/roles'),
  
  createRole: (data: { nomRole: string, description: string }): Promise<any> =>
    request<any>('/api/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  deleteRole: (id: number): Promise<void> =>
    request<void>(`/api/roles/${id}`, { method: 'DELETE' }),
    
  getAuditLogs: (): Promise<any[]> => request<any[]>('/api/logs'),

  getHistory: (): Promise<any[]> => request<any[]>('/api/historiques'),

  // Candidats (personnes)

  getCandidats: (): Promise<any[]> => request<any[]>('/api/candidats'),

  // Document CV / Analysis
  uploadAndAnalyzeCV: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = auth.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/api/documents-cv/analyze-bulk`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.status === 401) {
      auth.clearSession();
      window.location.href = '/';
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Erreur ${response.status}`);
    return data;
  },
};