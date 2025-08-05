import { api } from '@/utils/api/index.js'

export function ApiLogin(form) {
  return api({
    url: 'users/auth/login',
    method: 'POST',
    open: true,
    params: form
  })
}
