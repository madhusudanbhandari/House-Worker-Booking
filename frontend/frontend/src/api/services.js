import api from './axios'

export const getCategories   = ()      => api.get('/services/categories/')
export const getServices     = (params) => api.get('/services/', { params })
export const getWorkers      = (params) => api.get('/services/workers/', { params })
export const getWorkerById   = (id)    => api.get(`/services/workers/${id}/`)
export const getMyServices   = ()      => api.get('/services/my-services/')
export const addMyService    = (data)  => api.post('/services/my-services/', data)
export const updateMyService = (id, data) => api.put(`/services/my-services/${id}/`, data)
export const deleteMyService = (id)   => api.delete(`/services/my-services/${id}/`)
export const getMyAvailability  = ()     => api.get('/services/my-availability/')
export const addMyAvailability  = (data) => api.post('/services/my-availability/', data)