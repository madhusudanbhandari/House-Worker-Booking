// src/api/auth.js
import api from "./axios";

// Helper — converts your API's nested tokens shape to the flat shape
// { message, user, tokens: { access, refresh } }  →  { user, access, refresh }
const normalizeAuthResponse = (data) => ({
  user: data.user,
  access: data.tokens.access,
  refresh: data.tokens.refresh,
});

export const loginUser = async ({ phone, password }) => {
  const response = await api.post("/auth/login/", { phone, password });
  return normalizeAuthResponse(response.data);
};

export const registerUser = async (formData) => {
  const response = await api.post("/auth/register/", formData);
  return normalizeAuthResponse(response.data);
};

export const logoutUser = async (refreshToken) => {
  const response = await api.post("/auth/logout/", { refresh: refreshToken });
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get("/auth/profile/");
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put("/auth/profile/", data);
  return response.data;
};