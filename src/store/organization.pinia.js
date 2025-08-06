import { defineStore } from 'pinia'
import {
    ApiGetAllOrganizations,
    ApiCreateOrganization,
    ApiEditOrganization,
    ApiDeleteOrganization,
    ApiGetOrganizationUsers,
    ApiCreateUser,
    ApiUpdateUser,
    ApiDeleteUser,
    ApiSetPassword
} from '@/api/organization.api.js'

export const useOrganization = defineStore('Organization', {
    state: () => ({
        organizations: { content: [], page: 0, size: 10, totalElements: 0 },
        users: { content: [], page: 0, size: 10, totalElements: 0 },
        organizationLoader: false,
        organizationForm: { name: '', identifierNumber: '' },
        lastRequestId: null
    }),
    actions: {
        async fetchOrganizationUsers(
            orgId = 'ME',
            search = null,
            size = 10,
            page = 0,
            role = null,
            status = null,
            sortField = 'fullName',
            sortDirection = 'DESC'
        ) {
            const requestId = JSON.stringify({ orgId, search, size, page, role, status, sortField, sortDirection })
            if (this.lastRequestId === requestId && this.organizationLoader) return this.users
            this.lastRequestId = requestId
            this.organizationLoader = true
            try {
                const effectiveOrgId = orgId === 'ME' ? 'ME' : orgId || 1
                const response = await ApiGetOrganizationUsers(effectiveOrgId, page, size, search, sortDirection, role, status, sortField)
                this.users = {
                    ...response.data,
                    page: Number(response.data.page) || 0,
                    size: Number(response.data.size) || 10,
                    totalElements: Number(response.data.totalElements) || 0
                }
                return this.users
            } catch (error) {
                throw error
            } finally {
                this.organizationLoader = false
                setTimeout(() => (this.lastRequestId = null), 100)
            }
        },

        async updateUser(userId, formData, orgId) {
            if (!userId) throw new Error('Invalid user ID')
            const userIndex = this.users.content.findIndex((user) => user.id === userId)
            const originalUser = userIndex !== -1 ? { ...this.users.content[userIndex] } : null
            try {
                const effectiveOrgId = orgId === 'ME' ? 'ME' : orgId
                const apiPayload = { ...formData }
                if ('status' in formData) {
                    if (typeof formData.status === 'boolean') {
                        apiPayload.status = formData.status ? 'ACTIVE' : 'INACTIVE'
                    } else if (typeof formData.status === 'string') {
                        apiPayload.status = formData.status
                    }
                }
                console.log('API Update payload:', apiPayload)
                const response = await ApiUpdateUser(userId, apiPayload, effectiveOrgId)
                if (userIndex !== -1) {
                    const updatedUser = { ...this.users.content[userIndex] }
                    Object.keys(formData).forEach(key => {
                        if (key === 'status') {
                            if (typeof formData.status === 'boolean') {
                                updatedUser.status = formData.status ? 'ACTIVE' : 'INACTIVE'
                            } else {
                                updatedUser.status = formData.status
                            }
                        } else {
                            updatedUser[key] = formData[key]
                        }
                    })
                    this.users.content[userIndex] = updatedUser
                    console.log('Local state updated:', updatedUser)
                }
                return response
            } catch (error) {
                if (originalUser && userIndex !== -1) {
                    this.users.content[userIndex] = originalUser
                }
                console.error('Update user error:', error)
                throw error
            }
        },

        async createUser(formData, orgId) {
            this.organizationLoader = true
            try {
                const effectiveOrgId = orgId === 'ME' ? 'ME' : orgId || 1
                console.log('Sending createUser payload:', formData)
                const response = await ApiCreateUser(formData, effectiveOrgId)
                console.log('Received createUser response:', response.data)
                await this.fetchOrganizationUsers(effectiveOrgId, null, this.users.size, this.users.page)
                return response
            } catch (error) {
                console.error('Create user error:', error.response?.data || error.message)
                throw error
            } finally {
                this.organizationLoader = false
            }
        },

        async getAllOrganizations({ page = 0, size = 10, search = null } = {}) {
            const pageValid = Math.max(0, Number(page))
            const requestId = JSON.stringify({ page: pageValid, size, search })
            if (this.lastRequestId === requestId && this.organizationLoader) return this.organizations
            this.lastRequestId = requestId
            this.organizationLoader = true
            try {
                const response = await ApiGetAllOrganizations(pageValid, size, search)
                this.organizations = response.data
                return response.data
            } catch (error) {
                throw error
            } finally {
                this.organizationLoader = false
                setTimeout(() => (this.lastRequestId = null), 100)
            }
        },
        async createOrganization(formData) {
            this.organizationLoader = true
            try {
                const response = await ApiCreateOrganization(formData)
                await this.getAllOrganizations()
                this.resetOrganizationForm()
                return response
            } catch (error) {
                throw error
            } finally {
                this.organizationLoader = false
            }
        },
        async editOrganization(orgId, formData) {
            if (!orgId) throw new Error('Invalid organization ID')
            this.organizationLoader = true
            try {
                const payload = {
                    name: formData.name.trim(),
                    identifierNumber: formData.identifierNumber.trim()
                }
                const response = await ApiEditOrganization(orgId, payload)
                this.resetOrganizationForm()
                return response
            } catch (error) {
                throw error
            } finally {
                this.organizationLoader = false
            }
        },

        async deleteOrganization(orgId) {
            if (!orgId) throw new Error('Invalid organization ID')
            this.organizationLoader = true
            try {
                const response = await ApiDeleteOrganization(orgId)
                await this.getAllOrganizations()
                return response
            } catch (error) {
                throw error
            } finally {
                this.organizationLoader = false
            }
        },

        async deleteUser(userId, orgId) {
            if (!orgId || !userId) throw new Error('Invalid organization or user ID')
            this.organizationLoader = true
            try {
                const response = await ApiDeleteUser(userId)
                this.users.content = this.users.content.filter((user) => user.id !== userId)
                this.users.totalElements = Math.max(0, this.users.totalElements - 1)
                return response
            } catch (error) {
                throw error
            } finally {
                this.organizationLoader = false
            }
        },

        async setUserPassword({ username, password }, orgId) {
            if (!username || !password) throw new Error('Invalid username or password')
            this.organizationLoader = true
            try {
                await ApiSetPassword({ username, password })
                return true
            } catch (error) {
                throw error
            } finally {
                this.organizationLoader = false
            }
        },

        resetOrganizationForm() {
            this.organizationForm = { name: '', identifierNumber: '' }
        },

        clearUsers() {
            this.users = { content: [], page: 0, size: 10, totalElements: 0 }
        }
    }
})