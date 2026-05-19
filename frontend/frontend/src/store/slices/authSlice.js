import { createSlice } from '@reduxjs/toolkit'

// Try to load saved user from localStorage on app start
const savedUser = localStorage.getItem('user')

const initialState = {
  user        : savedUser ? JSON.parse(savedUser) : null,
  accessToken : localStorage.getItem('access_token')  || null,
  refreshToken: localStorage.getItem('refresh_token') || null,
  isLoading   : false,
  error       : null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,

  reducers: {
    // Called after successful login or register
    setCredentials: (state, action) => {
      const { user, tokens } = action.payload
      state.user         = user
      state.accessToken  = tokens.access
      state.refreshToken = tokens.refresh
      state.error        = null

      // Persist to localStorage so user stays logged in on page refresh
      localStorage.setItem('user',          JSON.stringify(user))
      localStorage.setItem('access_token',  tokens.access)
      localStorage.setItem('refresh_token', tokens.refresh)
    },

    // Called on logout
    clearCredentials: (state) => {
      state.user         = null
      state.accessToken  = null
      state.refreshToken = null

      localStorage.removeItem('user')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    },

    // Update user info after profile edit
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
      localStorage.setItem('user', JSON.stringify(state.user))
    },

    setError: (state, action) => {
      state.error = action.payload
    },
  },
})

export const { setCredentials, clearCredentials, updateUser, setError } = authSlice.actions

// Selectors — used in components to read state
export const selectUser         = (state) => state.auth.user
export const selectIsLoggedIn   = (state) => !!state.auth.user
export const selectUserRole     = (state) => state.auth.user?.role
export const selectAccessToken  = (state) => state.auth.accessToken

export default authSlice.reducer