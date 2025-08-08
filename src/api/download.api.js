import { api } from '@/utils/api/index.js'

export const ApiCreateDownloadInfo = (data) =>
    api({
        url: '/download-info/create',
        method: 'POST',
        data,
    });

export const ApiGetDownloadInfo = (page = 0, size = 10, status = null) =>
    api({
        url: '/download-info',
        method: 'GET',
        params: { page, size, status },
    });

export const ApiDownloadDocument = (id) =>
    api({
        url: `/download-info/${id}/download`,
        method: 'GET',
        responseType: 'arraybuffer',
    });
export const ApiDownloadContracts = (downloadId) =>
    api({
        url: `/download-info/${downloadId}/documents`,
        method: 'GET'
    });
export const ApiDeleteDownload = (downloadId) =>
    api({
        url: `/download-info/${downloadId}`,
        method: 'DELETE'
    });