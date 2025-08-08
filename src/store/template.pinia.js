import { defineStore } from 'pinia';
import { ApiGetAllTemplates, ApiCreateTemplate, ApiEditTemplate, ApiDeleteTemplate, ApiGetSampleFields, ApiViewTemplateFile, ApiEditTemplateFields } from '@/api/template.api.js';

export const useTemplate = defineStore('Template', {
    state: () => ({
        templates: { content: [], page: 0, size: 10, totalElements: 0 },
        templateLoader: false,
        selectedTemplate: null,
    }),
    actions: {
        async getAllTemplates({ page = 0, size = 10, search = null } = {}) {
            if (this.templateLoader) return;
            this.templateLoader = true;
            try {
                const response = await ApiGetAllTemplates(page, size, search);
                console.log('ApiGetAllTemplates response:', response);
                console.log('response.data:', response.data);
                this.templates = response.data;
                return this.templates; 
            } catch (error) {
                console.error('Error in getAllTemplates:', error);
                throw error;
            } finally {
                this.templateLoader = false;
            }
        },
        async createTemplate(formData) {
            if (!formData.get('name') || !formData.get('file')) {
                throw new Error('Name and file are required');
            }
            if (this.templateLoader) return;
            this.templateLoader = true;
            try {
                const response = await ApiCreateTemplate(formData);
                this.templates.content.unshift(response.data);
                this.templates.totalElements += 1;
                return response;
            } catch (error) {
                throw error;
            } finally {
                this.templateLoader = false;
            }
        },
        async editTemplate(sampleId, formData) {
            if (!sampleId) {
                throw new Error('Template ID is required');
            }
            if (!(formData instanceof FormData)) {
                throw new Error('Expected FormData');
            }
            if (!formData.get('name')) {
                throw new Error('Template name is required');
            }
            if (this.templateLoader) return;
            this.templateLoader = true;
            try {
                const response = await ApiEditTemplate(sampleId, formData);
                const index = this.templates.content.findIndex((t) => t.id === sampleId);
                if (index !== -1) {
                    this.templates.content[index] = { ...this.templates.content[index], ...response.data };
                }
                return response;
            } catch (error) {
                throw error;
            } finally {
                this.templateLoader = false;
            }
        },
        async editTemplateFields(sampleId, fields) {
            if (!sampleId) {
                throw new Error('Template ID is required');
            }
            if (!Array.isArray(fields) || fields.length === 0) {
                throw new Error('Fields must be a non-empty array');
            }
            if (this.templateLoader) return;
            this.templateLoader = true;
            try {
                const response = await ApiEditTemplateFields(sampleId, fields);
                if (this.selectedTemplate?.sampleFields) {
                    this.selectedTemplate.sampleFields = response.data.sampleFields || fields;
                }
                return response;
            } catch (error) {
                throw error;
            } finally {
                this.templateLoader = false;
            }
        },
        async deleteTemplate(sampleId) {
            if (!sampleId) {
                throw new Error('Invalid template ID');
            }
            if (this.templateLoader) return;
            this.templateLoader = true;
            try {
                await ApiDeleteTemplate(sampleId);
                this.templates.content = this.templates.content.filter((t) => t.id !== sampleId);
                this.templates.totalElements -= 1;
            } catch (error) {
                throw error;
            } finally {
                this.templateLoader = false;
            }
        },
        async openFile(templateId) {
            console.log('Store: Starting openFile for ID:', templateId)
            this.templateLoader = true

            try {
                const response = await ApiViewTemplateFile(templateId)
                const mimeType = response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                const blob = new Blob([response.data], { type: mimeType })
                return { blob, mimeType }
            } catch (error) {
                console.error('Store: Error in openFile:', error)
                throw error
            } finally {
                this.templateLoader = false
            }
        },
        downloadFile(blob, fileName) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        },
        async getSampleFields(sampleId) {
            if (!sampleId) {
                throw new Error('Invalid template ID');
            }
            if (this.templateLoader) return;
            this.templateLoader = true;
            try {
                const response = await ApiGetSampleFields(sampleId);
                console.log('API response:', response);
                this.selectedTemplate = response.data;
                return response.data;
            } catch (error) {
                console.error('Error fetching sample fields:', error);
                throw error;
            } finally {
                this.templateLoader = false;
            }
        }
    },
}); 