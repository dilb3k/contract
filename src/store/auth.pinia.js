import { defineStore } from 'pinia'
import { useCore } from '@/store/core.pinia.js'
import { ApiLogin } from '@/api/auth.api.js'
import { message } from 'ant-design-vue'

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
        message.success('Tizimga muvaffaqiyatli kirdingiz!')
        setTimeout(() => {
          core.redirect('/dashboard')
        }, 100)
      } catch (error) {
        const errorMessage = error.response?.data?.message || core.getStatusMessage(error.response?.status)
        message.error(errorMessage)
      } finally {
        this.loginLoader = false
      }
    },
    logout() {
      const core = useCore()
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      this.isAuthenticated = false
      this.user = null
      message.info('Tizimdan chiqdingiz')
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
