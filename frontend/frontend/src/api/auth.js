import api from './axios'

export const registerUser  = (data)  => api.post('/auth/register/', data)
export const loginUser     = (data)  => api.post('/auth/login/', data)
export const logoutUser    = (data)  => api.post('/auth/logout/', data)
export const getProfile    = ()      => api.get('/auth/profile/')
export const updateProfile = (data)  => api.put('/auth/profile/', data)
export const changePassword = (data) => api.post('/auth/change-password/', data)
export const getWorkerProfile  = ()     => api.get('/auth/worker-profile/')
export const updateWorkerProfile = (data) => api.put('/auth/worker-profile/', data)