// src/services/storageService.js
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_info';

export const storageService = {
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  getToken: () => localStorage.getItem(TOKEN_KEY),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  getUser: () => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },
  clearUser: () => localStorage.removeItem(USER_KEY),
  
  clearAll: () => localStorage.clear(),
};

export default storageService;
