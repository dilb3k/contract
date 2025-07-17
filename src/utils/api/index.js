import axios from 'axios'
import { apiBaseUrl, apiVersion } from '@/utils/config/api.js'

const instance = axios.create({
  baseURL: `${apiBaseUrl}/${apiVersion}`
})
const langObj = {
  uz: 'uz_lat',
  ru: 'ru',
  en: 'en'
}

export const api = ({ url, open = false, ...props }) => {
  let lang = localStorage.getItem('lang')

  const token = localStorage.getItem('access_token')
  if (!open) {
    props.headers = {
      Authorization: `Bearer ${token}`,
      ...props.headers
    }
  }
  if ('pk' in props && props.pk) {
    url = `${url}/${props.pk}`
  }
  props.headers = {
    ...props.headers,
    hl: langObj[lang] ?? langObj.uz
  }
  return instance({
    url: url,
    ...props
  })
}


function createAxiosResponseInterceptor() {
  const interceptor = instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response.status !== 401) {
        return Promise.reject(error)
      }
      axios.interceptors.response.eject(interceptor)
      return refreshAccessToken(error)
    }
  )
}

function refreshAccessToken(error) {
  const refresh_token = localStorage.getItem('refresh_token')
  if (refresh_token) {
    return axios({
      url: `${apiBaseUrl}/${apiVersion}/auth/refresh`,
      method: 'POST',
      data: {
        refreshToken: refresh_token
      }
    })
      .then(({ data }) => {
        localStorage.setItem('access_token', data?.accessToken)
        localStorage.setItem('refresh_token', data?.refreshToken)
        return axios({
          ...error.response.config,
          headers: {
            ...error.response.config.headers,
            Authorization: `Bearer ${data?.accessToken}`
          }
        })
      })
      .catch((error2) => {
        Clear()
        return Promise.reject(error2)
      })
      .finally(createAxiosResponseInterceptor)
  }
  Clear()
  return Promise.reject('Error')
}

export function Clear() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  window.location.href = '/'
  return null
}

createAxiosResponseInterceptor()
