import { defineStore } from 'pinia';
import { ApiGetAllContractUser, ApiUpdateContractPermission, ApiGetAllTemplateUser, ApiUpdateTemplatePermission } from '@/api/permission.api.js';

export const usePermission = defineStore('Permission', {
    state: () => ({
        users: {
            content: [],
            pageable: { pageNumber: 0, pageSize: 10 },
            totalElements: 0,
            totalPages: 1
        },
        permissionLoader: false
    }),
    actions: {
        async getContractUsers({ page = 0, size = 10, search = null, status = null, targetId = null } = {}) {
            this.permissionLoader = true;
            try {
                const res = await ApiGetAllContractUser(page, size, search, status, targetId);
                this.users = res.data;
            } catch (error) {
                throw error;
            } finally {
                this.permissionLoader = false;
            }
        },
        async updateContractPermission(payload) {
            this.permissionLoader = true;
            try {
                const res = await ApiUpdateContractPermission(payload);
                return res.data;
            } catch (error) {
                throw error;
            } finally {
                this.permissionLoader = false;
            }
        },
        async getTemplateUsers({ page = 0, size = 10, search = null, status = null, role = null, targetId = null } = {}) {
            this.permissionLoader = true;
            try {
                const res = await ApiGetAllTemplateUser(page, size, search, status, role, targetId);
                this.users = res.data;
            } catch (error) {
                throw error;
            } finally {
                this.permissionLoader = false;
            }
        },
        async updateTemplatePermission(payload) {
            this.permissionLoader = true;
            try {
                const res = await ApiUpdateTemplatePermission(payload);
                return res.data;
            } catch (error) {
                throw error;
            } finally {
                this.permissionLoader = false;
            }
        }
    }
});