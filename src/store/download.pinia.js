import { defineStore } from 'pinia';
import { ApiGetDownloadInfo, ApiDownloadDocument, ApiCreateDownloadInfo } from '@/api/download.api.js';

export const useDownload = defineStore('Download', {
    state: () => ({
        downloads: { content: [], page: 0, size: 10, totalElements: 0 },
        downloadLoader: false,
        activeDownloads: new Set()
    }),
    getters: {
        isDownloading: (state) => (id) => state.activeDownloads.has(id),
        hasDownloads: (state) => state.downloads.content.length > 0
    },
    actions: {
        async getAllDownloads({ page = 0, size = 10, status = null } = {}) {
            if (this.downloadLoader) return;
            this.downloadLoader = true;
            try {
                const response = await ApiGetDownloadInfo(page, size, status);
                this.downloads = response?.data || { content: [], page: 0, size: 10, totalElements: 0 };
                return this.downloads;
            } catch (error) {
                throw error;
            } finally {
                this.downloadLoader = false;
            }
        },
        async createDownloadInfo(formData, status = null) {
            if (!formData?.documentationIds?.length) throw new Error('Document IDs are required');
            this.downloadLoader = true;
            try {
                const response = await ApiCreateDownloadInfo(formData);
                await this.getAllDownloads({ page: this.downloads.page, size: this.downloads.size, status });
                return response;
            } catch (error) {
                throw error;
            } finally {
                this.downloadLoader = false;
            }
        },
        async downloadDocument(id, format) {
            if (!id || !format) throw new Error('Document ID and format are required');
            if (this.activeDownloads.has(id)) return;
            this.activeDownloads.add(id);
            try {
                const response = await ApiDownloadDocument(id, format);
                if (!response?.data || response.data.size === 0) throw new Error('Empty file received');
                const blob = new Blob([response.data], { type: 'application/zip' });
                const fileName = this.extractFilenameFromResponse(response, format);
                const zipFileName = fileName.endsWith('.zip') ? fileName : `${fileName.split('.')[0]}.zip`;
                this.triggerDownload(blob, zipFileName);
            } catch (error) {
                throw error;
            } finally {
                this.activeDownloads.delete(id);
            }
        },
        extractFilenameFromResponse(response, format) {
            const contentDisposition = response.headers?.['content-disposition'];
            if (contentDisposition) {
                const patterns = [/filename\*=UTF-8''(.+)/, /filename="(.+)"/, /filename=(.+)/];
                for (const pattern of patterns) {
                    const match = contentDisposition.match(pattern);
                    if (match?.[1]) return decodeURIComponent(match[1].replace(/['"]/g, ''));
                }
            }
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '');
            return `document_${timestamp}.${format}`;
        },
        triggerDownload(blob, filename) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        },
        clearDownloads() {
            this.downloads = { content: [], page: 0, size: 10, totalElements: 0 };
        },
        cancelAllDownloads() {
            this.activeDownloads.clear();
        }
    }
});