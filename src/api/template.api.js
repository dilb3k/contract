import { api } from '@/utils/api/index.js'

const getCommonHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
});

export const ApiGetAllTemplates = (page = 0, size = 10, search = null) =>
    api({
        url: 'samples',
        method: 'GET',
        params: { page, size, search },
    });

export const ApiCreateTemplate = (formData) =>
    api({
        url: 'samples/upload',
        method: 'POST',
        data: formData,
        headers: {
            ...getCommonHeaders(),
            'Content-Type': 'multipart/form-data',
        },
    });

export const ApiEditTemplate = (sampleId, formData) =>
    api({
        url: `samples/update-file/${sampleId}`,
        method: 'PUT',
        data: formData,
        headers: {
            ...getCommonHeaders(),
            'Content-Type': 'multipart/form-data',
        },
    });

export const ApiDeleteTemplate = (sampleId) =>
    api({
        url: `samples/${sampleId}`,
        method: 'DELETE',
        headers: getCommonHeaders(),
    });

export const ApiGetSampleFields = (sampleId) =>
    api({
        url: `samples/${sampleId}`,
        method: 'GET',
        headers: getCommonHeaders(),
    });

export const ApiViewTemplateFile = (sampleId) =>
    api({
        url: `samples/show-sample/${sampleId}`,
        method: 'GET',
        responseType: 'blob',
        headers: getCommonHeaders(),
    });

export const ApiEditTemplateFields = (sampleId, fields) =>
    api({
        url: `samples/update-fields/${sampleId}`,
        method: 'PUT',
        data: fields,
        headers: {
            ...getCommonHeaders(),
            'Content-Type': 'application/json',
        },
    });