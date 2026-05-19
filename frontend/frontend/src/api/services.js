// src/api/services.js
import api from "./axios";

export const getCategories = async () => {
  const response = await api.get("/services/categories/");
  const data = response.data;

  // Handle all possible shapes Django might return:
  // plain array: [...]
  // paginated:   { results: [...] }
  // wrapped:     { categories: [...] }
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.categories)) return data.categories;
  return []; // fallback — never crashes the page
};
export const getServices = async () => {
  const response = await api.get("/services/");
  return response.data;
};

export const getWorkers = async (params = {}) => {
  // params can include: { category, area, service }
  const response = await api.get("/services/workers/", { params });
  return response.data;
};

export const getWorkerDetail = async (id) => {
  const response = await api.get(`/services/workers/${id}/`);
  return response.data;
};