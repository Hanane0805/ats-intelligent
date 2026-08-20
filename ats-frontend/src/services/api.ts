const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ─── Token Management ────────────────────────────────────────────────────────

export const auth = {
  getToken: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem('ats_token') : null,
  setSession: async (data: AuthResponse) => {
    localStorage.setItem('ats_token', data.token);
    localStorage.setItem('ats_user', JSON.stringify({
      id: data.userId,
      email: data.email,
      nom: data.nom,
      prenom: data.prenom,
      role: data.role,
    }));

    // Mirror the token into an httpOnly cookie so middleware.ts can see the
    // session server-side. localStorage itself is invisible to middleware.
    try {
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: data.token }),
      });
    } catch {
      // Non-fatal: the app still works via localStorage/Bearer token, but
      // middleware won't see a session until this succeeds. Worth surfacing
      // in real usage (e.g. toast/log), left minimal here.
    }
  },
  getUser: (): User | null => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('ats_user') : null;
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  clearSession: async () => {
    localStorage.removeItem('ats_token');
    localStorage.removeItem('ats_user');

    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch {
      // Non-fatal — see note in setSession.
    }
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
  // 2FA fields
  requiresTwoFactor?: boolean;
  tempEmail?: string;
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

export interface DocumentCVResponse {
  id: number;
  nomFichier: string;
  cheminStockage?: string;
  texteBrut: string;
  dateUpload: string;
  candidatId: number;
  candidatNom: string;
  nombreChunks: number;
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

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers, cache: 'no-store' });

  if (response.status === 401) {
    await auth.clearSession();
    window.location.href = '/';
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    let errorMessage = data.message || data.error || `Erreur ${response.status}`;
    if (data.errors) {
      errorMessage = Object.values(data.errors).join(', ');
    }
    throw new Error(errorMessage);
  }
  return data as T;
};

// ─── API Methods ──────────────────────────────────────────────────────────────

export const api = {
  // Auth
  login: async (credentials: { email: string; password: string; rememberMe?: boolean }): Promise<AuthResponse> => {
    const data = await request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        motDePasse: credentials.password,
        rememberMe: credentials.rememberMe ?? false,
      }),
    });
    // If 2FA is required, don't set session yet
    if (!data.requiresTwoFactor) {
      await auth.setSession(data);
    }
    return data;
  },

  verify2FA: async (email: string, code: string): Promise<AuthResponse> => {
    const data = await request<AuthResponse>('/api/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
    await auth.setSession(data);
    return data;
  },

  resend2FA: async (email: string): Promise<void> => {
    await request<{ message: string }>('/api/auth/2fa/resend', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
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
    await auth.setSession(data);
    return data;
  },

  registerCandidat: async (userData: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    const data = await request<AuthResponse>('/api/auth/register/candidat', {
      method: 'POST',
      body: JSON.stringify({
        nom: userData.nom,
        prenom: userData.prenom,
        email: userData.email,
        motDePasse: userData.password,
      }),
    });
    await auth.setSession(data);
    return data;
  },

  logout: async () => {
    await auth.clearSession();
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
    
  getCandidaturesByCandidat: (candidatId: number): Promise<Candidature[]> =>
    request<Candidature[]>(`/api/candidatures/candidat/${candidatId}`),

  getCandidature: (id: number): Promise<Candidature> =>
    request<Candidature>(`/api/candidatures/${id}`),

  updateCandidatureStatus: async (id: number, statut: string): Promise<Candidature> => {
    return request<Candidature>(`/api/candidatures/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ statut }),
    });
  },

  deleteCandidature: (id: number): Promise<void> =>
    request<void>(`/api/candidatures/${id}`, {
      method: 'DELETE',
    }),

  analyzeCandidature: async (id: number): Promise<Candidature> => {
    return request<Candidature>(`/api/candidatures/${id}/analyze`, {
      method: 'POST',
    });
  },

  createCandidature: (candidatId: number, fichePosteId: number): Promise<Candidature> =>
    request<Candidature>('/api/candidatures', {
      method: 'POST',
      body: JSON.stringify({ candidatId, fichePosteId }),
    }),

  getCandidaturesByPoste: (fichePosteId: number): Promise<Candidature[]> =>
    request<Candidature[]>(`/api/candidatures/poste/${fichePosteId}`),

  // --- Sourcing (RAG) ---
  semanticSearch: async (query: string, topK: number = 10): Promise<any[]> => {
    return request<any[]>(`/api/sourcing/search?query=${encodeURIComponent(query)}&topK=${topK}`);
  },

  embedAllExistingCVs: async (): Promise<any> => {
    return request<any>('/api/sourcing/embed-all', { method: 'POST' });
  },
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
  uploadAndAnalyzeCV: async (file: File): Promise<DocumentCVResponse> => {
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
      await auth.clearSession();
      window.location.href = '/';
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Erreur ${response.status}`);
    return data;
  },
};