import { api } from '@/utils/api/index.js'

const getCommonHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    'ngrok-skip-browser-warning': '69420',
    'Content-Type': 'application/json',
});

export const ApiGetAllContracts = (page = 0, size = 10, search = null) =>
    api({
        url: '/documentations',
        method: 'GET',
        params: { page, size, search },
        headers: getCommonHeaders(),
    });

export const ApiGetContractById = (contractId) =>
    api({
        url: `/documentations/${contractId}`,
        method: 'GET',
        headers: getCommonHeaders(),
    });

export const ApiCreateContract = (form) =>
    api({
        url: '/documentations',
        method: 'POST',
        data: JSON.stringify(form),
        headers: getCommonHeaders(),
    });

export const ApiEditContract = (contractId, form) =>
    api({
        url: `/documentations/${contractId}`,
        method: 'PUT',
        data: JSON.stringify(form),
        headers: getCommonHeaders(),
    });

export const ApiDeleteContract = (contractId) =>
    api({
        url: `/documentations/${contractId}`,
        method: 'DELETE',
        headers: getCommonHeaders(),
    });

export const ApiGetSamples = () =>
    api({
        url: '/samples',
        method: 'GET',
        headers: getCommonHeaders(),
    });

export const ApiGenerateContracts = (contractIds, formData) =>
    api({
        url: '/documentations/generate',
        method: 'POST',
        data: JSON.stringify({ contractIds, ...formData }),
        headers: getCommonHeaders(),
    });

export const ApiGrantPermission = (permissionData) =>
    api({
        url: '/documentation-permissions/grant',
        method: 'POST',
        data: JSON.stringify(permissionData),
        headers: getCommonHeaders(),
    });

export const ApiGetPermissions = (contractId) =>
    api({
        url: `/documentation-permissions/${contractId}`,
        method: 'GET',
        headers: getCommonHeaders(),
    });

export const ApiDeletePermissions = (userId, contractId) =>
    api({
        url: `/documentation-permissions/${userId}/${contractId}`,
        method: 'DELETE',
        headers: getCommonHeaders(),
    });

export const ApiViewContractFile = (sampleId, format) =>
    api({
        url: `documentations/download/${sampleId}?format=${format}`,
        method: 'POST',
        responseType: 'blob',
        headers: getCommonHeaders(),
    });