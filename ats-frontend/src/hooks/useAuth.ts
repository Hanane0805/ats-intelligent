import { api } from '../services/api';

export const useAuth = () => {
  const login = async (credentials: any) => {
    // This calls your backend via the api service we created
    return await api.login(credentials);
  };

  const signup = async (userData: any) => {
    return await api.signup(userData);
  };

  return { login, signup };
};