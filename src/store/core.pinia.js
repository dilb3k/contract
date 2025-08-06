
import { defineStore } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

export const useCore = defineStore('core', {
  state: () => ({
    locale: localStorage.getItem('lang') || 'uz',
    collapsed: JSON.parse(localStorage.getItem('collapsed')) || false,
    loadingUrl: new Set(),
    loadingMain: false,
    toastContent: null,
    toastTimeoutId: null,
    drawer: { id: null, open: false },
    redirectUrl: null,
    innerHeight: window.innerHeight,
    innerWidth: window.innerWidth,
    lastVisitedRoute: localStorage.getItem('lastVisitedRoute') || null,
  }),
  actions: {
    loading(key) {
      this.loadingUrl.has(key) ? this.loadingUrl.delete(key) : this.loadingUrl.add(key)
    },
    changeCollapsed() {
      this.collapsed = !this.collapsed
      localStorage.setItem('collapsed', JSON.stringify(this.collapsed))
    },
    changeLocale(locale) {
      const i18n = useI18n()
      localStorage.setItem('lang', locale)
      i18n.locale.value = locale
    },
    redirect(url = null) {
      if (url) {
        this.redirectUrl = url
        setTimeout(() => {
          router.push(url).catch(err => console.error(err))
        }, 300)
      }
    },
    setToast(obj = null) {
      if (this.toastTimeoutId) {
        clearTimeout(this.toastTimeoutId)
        this.toastTimeoutId = null
      }
      this.toastContent = obj
      if (obj) {
        this.toastTimeoutId = setTimeout(() => {
          this.toastContent = null
          this.toastTimeoutId = null
        }, 3000)
      }
    },
    switchStatus(err) {
      const { response } = err
      const status = response?.status
      const data = response?.data
      if (status >= 500) {
        this.redirect('/500')
        return
      }
      if (status === 401) {
        this.logout()
        return
      }
      const toastMessage = {
        type: status >= 200 && status < 300 ? 'success' : 'error',
        message: data?.message || this.getStatusMessage(status)
      }
      this.setToast(toastMessage)
    },
    getStatusMessage(status, customMessage = null) {
      if (customMessage) return customMessage
      switch (status) {
        case 400:
          return 'Noto\'g\'ri so\'rov'
        case 401:
          return 'Avtorizatsiya xatosi'
        case 403:
          return 'Ruxsat berilmagan'
        case 404:
          return 'Topilmadi'
        case 422:
          return 'Ma\'lumotlar xato'
        case 500:
          return 'Server xatosi'
        default:
          return 'Xatolik yuz berdi'
      }
    },
    logout() {
      localStorage.clear()
      this.redirectUrl = null
      this.redirect('/auth/login')
    },
    setLastVisitedRoute(routeName) {
      this.lastVisitedRoute = routeName
      localStorage.setItem('lastVisitedRoute', routeName)
    }
  },
  getters: {
    isLoading: (state) => (key) => state.loadingUrl.has(key)
  }
})
