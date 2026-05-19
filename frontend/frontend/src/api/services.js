// src/api/services.js
import api from "./axios";

export const getCategories = async () => {
  const response = await api.get("/services/categories/");
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.categories)) return data.categories;
  return [];
};

export const getServices = async () => {
  const response = await api.get("/services/");
  return response.data;
};

export const getWorkers = async (params = {}) => {
  // params: { category, area, search }
  // Removes empty string params so URL stays clean
  const cleanParams = {};
  for (const key in params) {
    if (params[key] !== "" && params[key] !== null && params[key] !== undefined) {
      cleanParams[key] = params[key];
    }
  }
  const response = await api.get("/services/workers/", { params: cleanParams });
  const data = response.data;
  // Response is paginated: { count, next, previous, results: [...] }
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
};

export const getWorkerDetail = async (id) => {
  const response = await api.get(`/services/workers/${id}/`);
  return response.data;
};