import axios from 'axios'
import { apiBaseUrl, apiVersion } from '@/utils/config/api.js'

const instance = axios.create({
  baseURL: `${apiBaseUrl}/${apiVersion}`,
  headers: { 'ngrok-skip-browser-warning': '69420' },
  timeout: 10000
})

const langObj = {
  uz: 'uz',
  ru: 'ru',
  en: 'en',
}

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

export const api = ({ url, open = false, pk, ...props }) => {
  const lang = localStorage.getItem('lang') || 'uz'
  const token = localStorage.getItem('access_token')

  if (!open && token) {
    props.headers = {
      Authorization: `Bearer ${token}`,
      ...props.headers,
    }
  }

  if (pk) {
    url = `${url}/${pk}`
  }

  props.headers = {
    ...props.headers,
    Hl: langObj[lang],
  }

  return instance({ url, ...props })
}

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token')

  if (!refreshToken) {
    Clear()
    return Promise.reject(new Error('No refresh token'))
  }

  try {
    const { data } = await axios({
      url: `${apiBaseUrl}/${apiVersion}/auth/refresh`,
      method: 'POST',
      data: { refreshToken },
    })

    localStorage.setItem('access_token', data.accessToken)
    localStorage.setItem('refresh_token', data.refreshToken)

    return data.accessToken
  } catch (error) {
    Clear()
    throw error
  }
}

export const Clear = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  window.location.href = '/auth/login'
}

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return instance(originalRequest)
      }).catch(err => {
        return Promise.reject(err)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const newToken = await refreshAccessToken()
      processQueue(null, newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return instance(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)