import api from "./axios";

export const getInsights = (limit = 10) =>
  api.get("/insights", { params: { limit } });

export const getWeekInsight = (date) =>
  api.get("/insights/week", { params: { date } });
