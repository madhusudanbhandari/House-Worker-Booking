
import { createSlice } from "@reduxjs/toolkit";

const storedUser = localStorage.getItem("user");
const storedAccess = localStorage.getItem("accessToken");
const storedRefresh = localStorage.getItem("refreshToken");

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  // user shape from your API:
  // { id, phone, full_name, email, role, area, created_at }
  accessToken: storedAccess || null,
  refreshToken: storedRefresh || null,
  isAuthenticated: !!storedAccess,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const payload = action.payload;

      // Handle both flat shape { user, access, refresh }
      // and nested shape { user, tokens: { access, refresh } }
      // This way login and register both work regardless of shape
      const access = payload.access ?? payload.tokens?.access;
      const refresh = payload.refresh ?? payload.tokens?.refresh;
      const user = payload.user;

      state.user = user;
      state.accessToken = access;
      state.refreshToken = refresh;
      state.isAuthenticated = true;

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);
    },

    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;

      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAccessToken = (state) => state.auth.accessToken;