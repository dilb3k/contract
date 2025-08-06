import axios from 'axios'
import { apiBaseUrl, apiVersion } from '@/utils/config/api.js'
import { useCore } from '@/store/core.pinia.js'

const instance = axios.create({
  baseURL: `${apiBaseUrl}/${apiVersion}`,
  headers: { 'ngrok-skip-browser-warning': '69420' },
  timeout: 30000
})

const langObj = {
  uz: 'uz',
  ru: 'ru',
  en: 'en'
}

let isRefreshing = false
let failedQueue = []
let refreshAttempts = 0
const maxRefreshAttempts = 1

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
  const core = useCore()
  const lang = localStorage.getItem('lang') || 'uz'
  const validLang = langObj[lang] || 'uz'
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
    Hl: validLang
  }

  return instance({ url, ...props })
}

export const Clear = () => {
  const core = useCore()
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  core.redirect('/auth/login')
}

const refreshAccessToken = async () => {
  const core = useCore()
  const refreshToken = localStorage.getItem('refresh_token')

  try {
    const { data } = await axios({
      url: `${apiBaseUrl}/${apiVersion}/auth/refresh`,
      method: 'POST',
      data: { refreshToken },
      headers: { Hl: langObj[localStorage.getItem('lang') || 'uz'] }
    })

    localStorage.setItem('access_token', data.accessToken)
    localStorage.setItem('refresh_token', data.refreshToken)
    refreshAttempts = 0
    return data.accessToken
  } catch (error) {
    throw error
  }
}

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const core = useCore()
    const originalRequest = error.config

    if (error.response?.status !== 401) {
      return Promise.reject(error)
    }

    if (originalRequest._retry || refreshAttempts >= maxRefreshAttempts) {
      Clear()
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
    refreshAttempts++

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
