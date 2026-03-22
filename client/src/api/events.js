import api from "./axios";

export const getEvents = (from, to) =>
  api.get("/events", { params: { from, to } });
