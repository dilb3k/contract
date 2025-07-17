import { defineStore } from 'pinia'

const useCore = defineStore('core', {
  state: () => ({
    locale: localStorage.getItem('lang') || 'uz',
    collapsed: JSON.parse(localStorage.getItem('collapsed')),
    loadingUrl: new Set([]),
    loadingMain: false,
    toastContent: null,
    drawer: {
      id: null,
      open: false
    },
    redirectUrl: null,
    innerHeight: window.innerHeight,
    innerWidth: window.innerWidth
  }),
  actions: {
    loading(key) {
      if (this.loadingUrl.has(key)) {
        this.loadingUrl.delete(key)
      } else {
        this.loadingUrl.add(key)
      }
    },
    changeCollapsed() {
      this.collapsed = !this.collapsed
      localStorage.setItem('collapsed', JSON.stringify(this.collapsed))
    },
    changeLocale(locale) {
      localStorage.setItem('lang', locale)
      window.location.reload()
    },
    redirect(url = null) {
      this.redirectUrl = url
    },
    setToast(obj = null) {
      this.toastContent = obj
    },
    switchStatus(err) {
      try {
        const { response, message = 'Error' } = err
        const data = response?.data
        const status = response?.status
        let toastMessage = {
          type: 'error',
          message: message,
          fields: []
        }
        if (status >= 200 && status <= 300) {
          toastMessage = {
            locale: 'SUCCESS',
            type: 'success'
          }
        }
        if (status >= 400 && status < 500) {
          if (
            typeof data !== 'string' &&
            'message' in data &&
            data.message !== ''
          ) {
            toastMessage.message = data.message ? data.message : message
            toastMessage.fields = data?.fields ? data.fields : []
          }
          if (typeof data === 'string') {
            toastMessage.message = data
            toastMessage.locale = 'ERROR'
          }
        }
        if (status >= 500) {
          toastMessage = {
            locale: 'notification_component.internal_server_error',
            type: 'error'
          }
          this.redirect(`/500`)
        }
        if (status === 403) {
          toastMessage = {
            locale: 'NOT_ALLOW',
            type: 'error'
          }
        }
        if (status !== 401) {
          this.setToast(toastMessage)
        }
      } catch (err) {
        console.log(err)
        this.setToast({
          type: 'error',
          locale: 'ERROR'
        })
      }
    },
    logout() {
      localStorage.clear()
      this.redirect(`/auth/login`)
    }
  },
  getters: {
    isLoading: (state) => (key) => {
      return state?.loadingUrl.has(key)
    }
  }
})

export default useCore
