import { api } from '@/utils/api/index.js'
const getCommonHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  'ngrok-skip-browser-warning': '69420',
  'Content-Type': 'application/json',
});
export const ApiGetAllUser = (page = 0, size = 10, search = null, status = null) =>
  api({
    url: 'users',
    method: 'GET',
    params: { page, size, search, status },
  });

export const ApiGetMe = () =>
  api({
    url: 'users/me',
    method: 'GET',
  });

export const ApiGetOneUser = (id) =>
  api({
    url: 'user',
    method: 'GET',
    pk: id,
  });

export const ApiGetAllOperators = () =>
  api({
    url: 'user/operators',
    method: 'GET',
  });

export const ApiGivePermission = (form) =>
  api({
    url: 'user/give-permission',
    method: 'PUT',
    data: form,
  });

export const ApiChangeRoleUser = (userId, role) =>
  api({
    url: 'user/change-role',
    method: 'PUT',
    pk: userId,
    data: { role },
  });

export const ApiChangeStatusUser = (userId, status) =>
  api({
    url: 'user/change-status',
    method: 'PUT',
    pk: userId,
    data: { status },
  });

export const ApiCreateUser = (form) =>
  api({
    url: 'user/add/operator',
    method: 'POST',
    data: form,
  });

export const ApiEditUser = (userId, form) =>
  api({
    url: 'users',
    method: 'PUT',
    pk: userId,
    data: form,
  });

export const ApiDeleteUser = (userId) =>
  api({
    url: 'user',
    method: 'DELETE',
    pk: userId,
  });
export const ApiSetPassword = (userId, passwordData) =>
  api({
    url: `users/set-password`,
    method: 'POST',
    params:{
      oldPassword: passwordData.oldPassword,
      newPassword: passwordData.newPassword,
    },
    headers: getCommonHeaders(),
  });
