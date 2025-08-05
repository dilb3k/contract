import { defineStore } from 'pinia'
import { useCore } from '@/store/core.pinia.js'
import { ApiLogin } from '@/api/auth.api.js'

const useAuth = defineStore('Auth', {
  state: () => ({
    loginLoader: false,
    isAuthenticated: false,
    user: null,
  }),
  actions: {
    async login(form) {
      const core = useCore()
      this.loginLoader = true

      try {
        const { data } = await ApiLogin(form)

        if (!data?.token) {
          throw new Error('Invalid response from server')
        }

        localStorage.setItem('access_token', data.token)
        localStorage.setItem('refresh_token', data.refresh_token || data.token)

        this.isAuthenticated = true
        this.user = data.user

        core.setToast({
          type: 'success',
          locale: 'LoginView.loginSuccess'
        })

        setTimeout(() => {
          core.redirect('/dashboard')
        }, 100)

      } catch (error) {
        const errorMessage = this.getErrorMessage(error)
        core.setToast({
          type: 'error',
          message: errorMessage
        })

      } finally {
        this.loginLoader = false
      }
    },

    getErrorMessage(error) {
      const status = error?.response?.status
      const data = error?.response?.data

      if (data?.message) {
        return data.message
      }

      switch (status) {
        case 400:
          return 'Login yoki parol noto\'g\'ri'
        case 401:
          return 'Login yoki parol noto\'g\'ri'
        case 403:
          return 'Ruxsat berilmagan'
        case 500:
          return 'Server xatosi'
        default:
          return 'Xatolik yuz berdi'
      }
    },

    logout() {
      const core = useCore()
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      this.isAuthenticated = false
      this.user = null
      core.redirect('/auth/login')
    },

    checkAuth() {
      const token = localStorage.getItem('access_token')
      this.isAuthenticated = !!token
      return this.isAuthenticated
    }
  }
})

export default useAuth