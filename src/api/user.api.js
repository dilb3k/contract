import { api } from '@/utils/api/index.js'

export function ApiGetAllUser(
  page = 0,
  size = 10,
  search = null,
  status = null
){
  return api({
    url: 'user',
    method: 'GET',
    params: {
      page,
      size,
      search,
      status,
    }
  })
}

export function ApiGetMe() {
  return api({
    url: 'user/me',
    method: 'GET',
  })
}

export function ApiGetOneUser(id) {
  return api({
    url: 'user',
    method: 'GET',
    pk: id
  })
}

export function ApiGetAllOperators() {
  return api({
    url: 'user/operators',
    method: 'GET',
  })
}

export function ApiGivePermission(form){
  return api({
    url: 'user/give-permission',
    method: 'PUT',
    data: form
  })
}

export function ApiChangeRoleUser(userId, role) {
  const data = new FormData()

  data.append('role', role)

  return api({
    url: 'user/change-role',
    method: 'PUT',
    pk: userId,
    data
  })
}

export function ApiChangeStatusUser(userId, status) {
  const data = new FormData()

  data.append('status', status)

  return api({
    url: 'user/change-status',
    method: 'PUT',
    pk: userId,
    data
  })
}

export function ApiCreateUser(form) {
  return api({
    url: 'user/add/operator',
    method: 'POST',
    data: form
  })
}

export function ApiEditUser(userId, form) {
  return api({
    url: 'user',
    method: 'PUT',
    pk: userId,
    data: form
  })
}

export function ApiDeleteUser(userId) {
  return api({
    url: 'user',
    method: 'DELETE',
    pk: userId,
  })
}