import { defineStore } from 'pinia';
import {
    ApiGetAllContracts,
    ApiGetContractById,
    ApiCreateContract,
    ApiEditContract,
    ApiDeleteContract,
    ApiGetSamples,
    ApiDeletePermissions,
    ApiGetPermissions,
    ApiGenerateContracts,
    ApiGrantPermission,
    ApiGetAllOrganizationContracts,
    ApiViewContractFile,
} from '@/api/contract.api.js';

export const useContract = defineStore('Contract', {
    state: () => ({
        contracts: { content: [], page: 0, size: 10, totalElements: 0 },
        contractLoader: false,
    }),
    actions: {
        async getAllContracts(page = 0, size = 10, search = null) {
            this.contractLoader = true;
            try {
                const response = await ApiGetAllContracts(page, size, search);
                this.contracts = response.data;
                return response.data;
            } catch (error) {
                throw error;
            } finally {
                this.contractLoader = false;
            }
        },
        async getAllOrganizationContracts(page = 0, size = 10, search = null, organizationId) {
            if (!organizationId) throw new Error('Organization ID is required');
            this.contractLoader = true;
            try {
                const response = await ApiGetAllOrganizationContracts(page, size, search, organizationId);
                this.contracts = response.data;
                return response.data;
            } catch (error) {
                throw error;
            } finally {
                this.contractLoader = false;
            }
        },
        async getContractById(contractId) {
            if (!contractId) throw new Error('Contract ID is required');
            this.contractLoader = true;
            try {
                const response = await ApiGetContractById(contractId);
                return response.data;
            } catch (error) {
                throw error;
            } finally {
                this.contractLoader = false;
            }
        },
        async createContract(formData) {
            if (!formData) throw new Error('Form data is required');
            this.contractLoader = true;
            try {
                const response = await ApiCreateContract(formData);
                await this.getAllContracts(this.contracts.page, this.contracts.size);
                return response;
            } catch (error) {
                throw error;
            } finally {
                this.contractLoader = false;
            }
        },
        async editContract(contractId, formData) {
            if (!contractId || !formData) throw new Error('Invalid contract ID or form data');
            this.contractLoader = true;
            try {
                const response = await ApiEditContract(contractId, formData);
                await this.getAllContracts(this.contracts.page, this.contracts.size);
                return response;
            } catch (error) {
                throw error;
            } finally {
                this.contractLoader = false;
            }
        },
        async deleteContract(contractId) {
            if (!contractId) throw new Error('Invalid contract ID');
            this.contractLoader = true;
            try {
                const response = await ApiDeleteContract(contractId);
                await this.getAllContracts(this.contracts.page, this.contracts.size);
                return response;
            } catch (error) {
                throw error;
            } finally {
                this.contractLoader = false;
            }
        },
        async getSamples() {
            this.contractLoader = true;
            try {
                const response = await ApiGetSamples();
                // Ensure response.data is an array; return empty array if not
                const samples = Array.isArray(response.data) ? response.data : [];
                return samples;
            } catch (error) {
                console.error('Error fetching samples:', error);
                throw error;
            } finally {
                this.contractLoader = false;
            }
        },
        async generateContracts(contractIds, formData) {
            if (!contractIds?.length || !formData) throw new Error('Contract IDs and form data are required');
            this.contractLoader = true;
            try {
                const response = await ApiGenerateContracts(contractIds, formData);
                await this.getAllContracts(this.contracts.page, this.contracts.size);
                return response;
            } catch (error) {
                throw error;
            } finally {
                this.contractLoader = false;
            }
        },
        async grantPermission(permissionData) {
            if (!permissionData) throw new Error('Permission data is required');
            this.contractLoader = true;
            try {
                const response = await ApiGrantPermission(permissionData);
                return response.data;
            } catch (error) {
                throw error;
            } finally {
                this.contractLoader = false;
            }
        },
        async getPermissions(contractId) {
            if (!contractId) throw new Error('Contract ID is required');
            this.contractLoader = true;
            try {
                const response = await ApiGetPermissions(contractId);
                return response.data;
            } catch (error) {
                throw error;
            } finally {
                this.contractLoader = false;
            }
        },
        async deletePermissions(userId, contractId) {
            if (!userId || !contractId) throw new Error('User ID and Contract ID are required');
            this.contractLoader = true;
            try {
                await ApiDeletePermissions(userId, contractId);
            } catch (error) {
                throw error;
            } finally {
                this.contractLoader = false;
            }
        },
        async openContractFile(contractId, format) {
            try {
                const response = await ApiViewContractFile(contractId, format)
                const mimeType = response.headers['content-type'] || 'application/octet-stream'
                const blob = new Blob([response.data], { type: mimeType })
                return { blob, mimeType } // Return Blob and MIME type for handling in the component
            } catch (error) {
                throw error
            }
        },
        downloadFile(blob, filename) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }
    }
});