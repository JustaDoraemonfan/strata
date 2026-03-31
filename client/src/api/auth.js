import api from "./axios";

export const register = (displayName, email, password) =>
  api.post("/auth/register", { displayName, email, password });

export const login = (email, password) =>
  api.post("/auth/login", { email, password });

export const logout = () => api.post("/auth/logout");

export const refresh = () => api.post("/auth/refresh");

export const getMe = () => api.get("/auth/me");

export const updateMe = (updates) => api.patch("/auth/me", updates);
