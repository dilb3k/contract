import { defineStore } from 'pinia'
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
    ApiViewContractFile,
} from '@/api/contract.api.js'

export const useContract = defineStore('Contract', {
    state: () => ({
        contracts: { content: [], page: 0, size: 10, totalElements: 0 },
        contractLoader: false,
    }),
    actions: {
        async withLoading(promise) {
            if (this.contractLoader) return
            this.contractLoader = true
            try {
                return await promise
            } catch (error) {
                throw error
            } finally {
                this.contractLoader = false
            }
        },
        async getAllContracts(page = 0, size = 10, search = null) {
            return this.withLoading(
                ApiGetAllContracts(page, size, search).then((response) => {
                    this.contracts = response.data
                    return response.data
                })
            )
        },
        async getContractById(contractId) {
            if (!contractId) throw new Error('Contract ID is required')
            return this.withLoading(ApiGetContractById(contractId).then((response) => response.data))
        },
        async createContract(formData) {
            if (!formData) throw new Error('Form data is required')
            return this.withLoading(
                ApiCreateContract(formData).then((response) => {
                    this.getAllContracts(this.contracts.page, this.contracts.size)
                    return response
                })
            )
        },
        async editContract(contractId, formData) {
            if (!contractId || !formData) throw new Error('Invalid contract ID or form data')
            return this.withLoading(
                ApiEditContract(contractId, formData).then((response) => {
                    this.getAllContracts(this.contracts.page, this.contracts.size)
                    return response
                })
            )
        },
        async deleteContract(contractId) {
            if (!contractId) throw new Error('Invalid contract ID')
            return this.withLoading(
                ApiDeleteContract(contractId).then((response) => {
                    this.getAllContracts(this.contracts.page, this.contracts.size)
                    return response
                })
            )
        },
        async getSamples() {
            return this.withLoading(
                ApiGetSamples().then((response) => {
                    return Array.isArray(response.data) ? response.data : []
                })
            )
        },
        async generateContracts(contractIds, formData) {
            if (!contractIds?.length || !formData) throw new Error('Contract IDs and form data are required')
            return this.withLoading(
                ApiGenerateContracts(contractIds, formData).then((response) => {
                    this.getAllContracts(this.contracts.page, this.contracts.size)
                    return response
                })
            )
        },
        async grantPermission(permissionData) {
            if (!permissionData) throw new Error('Permission data is required')
            return this.withLoading(ApiGrantPermission(permissionData).then((response) => response.data))
        },
        async getPermissions(contractId) {
            if (!contractId) throw new Error('Contract ID is required')
            return this.withLoading(ApiGetPermissions(contractId).then((response) => response.data))
        },
        async deletePermissions(userId, contractId) {
            if (!userId || !contractId) throw new Error('User ID and Contract ID are required')
            return this.withLoading(ApiDeletePermissions(userId, contractId))
        },
        async openContractFile(contractId, format) {
            return this.withLoading(
                ApiViewContractFile(contractId, format).then((response) => {
                    const mimeType = response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    const blob = new Blob([response.data], { type: mimeType })
                    return { blob, mimeType }
                })
            )
        },

        downloadFile(blob, filename) {
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(link.href)
        },
    },
})