import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
     
    }
    return config
  },
  (error) => Promise.reject(error)
)


api.interceptors.response.use(
  (response) => response, 

  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refresh = localStorage.getItem('refresh_token')
        const res     = await axios.post(
          'http://127.0.0.1:8000/api/auth/token/refresh/',
          { refresh }
        )

        
        const newAccess = res.data.access
        localStorage.setItem('access_token', newAccess)

        
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return api(originalRequest)

      } catch (refreshError) {
        
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api