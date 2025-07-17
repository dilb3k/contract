import { defineStore } from 'pinia'
import useCore from '@/store/core.pinia.js'
import { ApiLogin } from '@/api/auth.api.js'

const useAuth = defineStore('Auth', {
  state:()=>({
    loginLoader: false,
  }),
  actions: {
    login(form) {
      const core = useCore()
      this.loginLoader = true
      ApiLogin(form)
        .then(({ data }) => {
          localStorage.setItem('access_token', data?.accessToken)
          localStorage.setItem('refresh_token', data?.refreshToken)
            core.setToast({
              type: 'success',
              locale: 'LoginView.loginSuccess'
            })
            core.redirect('/dashboard')
        })
        .catch((error) => {
          core.switchStatus(error)
        })
        .finally(() => {
          this.loginLoader = false
        })
    },
  }
})

export default useAuth
