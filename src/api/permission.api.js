import { api } from '@/utils/api/index.js'

export const ApiGetAllContractUser = (page = 0, size = 10, search = null, status = null, targetId) =>
    api({
        url: `users/documentation-permissions/${targetId}`,
        method: 'GET',
        params: { page, size, search, status },
    });

export const ApiUpdateContractPermission = (payload) =>
    api({
        url: `documentation-permissions/grant`,
        method: 'POST',
        data: payload,
    });

export const ApiGetAllTemplateUser = (page = 0, size = 10, search = null, status = null, role = null, targetId) =>
    api({
        url: `users/sample-permissions/${targetId}`,
        method: 'GET',
        params: { page, size, search, status, role },
    });

export const ApiUpdateTemplatePermission = (payload) =>
    api({
        url: `sample-permissions/grant`,
        method: 'POST',
        data: payload,
        
    });