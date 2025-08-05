import { createRouter, createWebHistory } from 'vue-router'
import AppView from '@/layouts/AppLayout.vue'
import DashboardView from '../pages/dashboard/DashboardLayout.vue'
import NotFound from '@/_404.vue'
import InternalServerError from '@/_500.vue'
import LoginView from '@/pages/auth/login/LoginView.vue'
import AuthView from '@/pages/auth/AuthView.vue'
import dashboardRouter from './dashboard.router.js'
import {useUser} from '@/store/user.pinia.js'
import { storeToRefs } from 'pinia'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'AppView',
      component: AppView,
      children: [
        {
          path: 'auth',
          name: 'AuthView',
          component: AuthView,
          redirect: { name: 'LoginView' },
          children: [
            {
              path: 'login',
              name: 'LoginView',
              component: LoginView
            }
          ]
        },
        {
          path: 'dashboard',
          name: 'DashboardView',
          component: DashboardView,
          children: dashboardRouter
        }
      ]
    },
    {
      path: '/500',
      component: InternalServerError,
      name: 'InternalServerError'
    },
    {
      path: '/:pathMatch(.*)*',
      component: NotFound,
      name: 'PageNotFound'
    }
  ]
})

const routerFactory = (i18n) => {
  router.beforeEach(async (to, from, next) => {
    document.title = i18n.t(`document_title.${to.name}`)
    const token = localStorage.getItem('access_token')
    const userStore = useUser()
    const { user } = storeToRefs(userStore)

    if (to.name === 'InternalServerError') return next()

    if (!token) {
      return to.path.includes('auth') ? next() : next({ name: 'AuthView' })
    }

    if (!user.value?.role) {
      try {
        await new Promise((resolve) => {
          userStore.getUserMe((role) => resolve(role))
        })
      } catch (error) {
        console.error('Failed to fetch user role:', error)
        return next({ name: 'AuthView' }) 
      }
    }

    if (to.meta?.roles && !to.meta.roles.includes(user.value?.role)) {
      return next({ name: 'PageNotFound' })
    }

    if (to.path.includes('dashboard')) {
      return next()
    }

    return next({ name: 'DashboardView' })
  })

  return router
}

export default routerFactory