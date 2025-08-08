import { api } from '@/utils/api/index.js'

const getCommonHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    'ngrok-skip-browser-warning': '69420',
    'Content-Type': 'application/json',
});

export const ApiGetAllOrganizations = (page = 0, size = 10, search = null) =>
    api({
        url: '/organizations',
        method: 'GET',
        params: { page, size, search },
        headers: getCommonHeaders(),
    });

export const ApiCreateOrganization = (form) =>
    api({
        url: '/organizations',
        method: 'POST',
        data: JSON.stringify(form),
        headers: getCommonHeaders(),
    });

export const ApiEditOrganization = (orgId, form) =>
    api({
        url: `/organizations/${orgId}`,
        method: 'PUT',
        data: JSON.stringify(form),
        headers: getCommonHeaders(),
    });

export const ApiDeleteOrganization = (orgId) =>
    api({
        url: `/organizations/${orgId}`,
        method: 'DELETE',
        headers: getCommonHeaders(),
    });

export const ApiGetOrganizationUsers = (
    page = 0,
    size = 10,
    search = null,
    sortDirection = 'DESC',
    role = null,
    status = null,
    sortField = 'fullName'
) =>
    api({
        url: '/users',
        method: 'GET',
        params: {
            page,
            size,
            search,
            role,
            status: status !== null ? (status ? 'ACTIVE' : 'INACTIVE') : undefined,
            sortField,
            orderDirection: sortDirection,
        },
        headers: getCommonHeaders(),
    });

export const ApiCreateUser = (form) => {
    const payload = { ...form }
    if (typeof form.status === 'boolean') {
        payload.status = form.status ? 'ACTIVE' : 'INACTIVE'
    } else if (form.status) {
        payload.status = form.status
    } else {
        payload.status = 'ACTIVE'
    }
    console.log('ApiCreateUser payload:', payload)
    return api({
        url: '/users',
        method: 'POST',
        data: JSON.stringify(payload),
        headers: getCommonHeaders(),
    })
}

export const ApiUpdateUser = (userId, form) => {
    const payload = { ...form }
    if ('status' in form) {
        if (typeof form.status === 'boolean') {
            payload.status = form.status ? 'ACTIVE' : 'INACTIVE'
        } else {
            payload.status = form.status
        }
    }
    console.log('ApiUpdateUser payload:', payload)
    return api({
        url: `/users/${userId}`,
        method: 'PUT',
        data: JSON.stringify(payload),
        headers: getCommonHeaders(),
    })
}

export const ApiDeleteUser = (userId) =>
    api({
        url: `/users/${userId}`,
        method: 'DELETE',
        headers: getCommonHeaders(),
    });

export const ApiSetPassword = ({ username, password }) =>
    api({
        url: '/users/set-password-admin',
        method: 'POST',
        params: { username, password },
        headers: getCommonHeaders(),
    });