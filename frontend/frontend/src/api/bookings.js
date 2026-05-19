import api from './axios'

export const createBooking      = (data) => api.post('/bookings/create/', data)
export const getMyBookings      = (params) => api.get('/bookings/my-bookings/', { params })
export const getWorkerBookings  = (params) => api.get('/bookings/worker-bookings/', { params })
export const getBookingById     = (id)   => api.get(`/bookings/${id}/`)
export const updateBookingStatus = (id, data) => api.patch(`/bookings/${id}/update-status/`, data)
export const getBookingStats    = ()     => api.get('/bookings/stats/')