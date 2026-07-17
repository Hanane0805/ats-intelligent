// Toggle this to false once your backend CORS is configured
const USE_MOCK = true; 
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Helper to handle standardized API responses
const handleResponse = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
};

export const api = {
  // --- AUTHENTICATION ---
  login: async (credentials: any) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return { success: true, token: 'mock-token-123' };
    }

    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  signup: async (userData: any) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return { success: true };
    }

    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  // --- DASHBOARD DATA ---
  getDashboardStats: async () => {
    if (USE_MOCK) {
      // Returning mock data that matches your DashboardOverviewPage stats
      return {
        activeJobs: 12,
        totalCandidates: 148,
        pendingAnalysis: 7,
        accepted: 24
      };
    }

    const response = await fetch(`${BASE_URL}/api/dashboard/stats`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(response);
  }
};