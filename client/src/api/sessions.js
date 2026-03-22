import api from "./axios";

export const getSessions = (from, to) =>
  api.get("/sessions", { params: { from, to } });

export const getSession = (sessionId) => api.get(`/sessions/${sessionId}`);
