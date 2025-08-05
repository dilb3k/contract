import { defineStore } from 'pinia';
import {
  ApiGetMe,
  ApiGetAllUser,
  ApiGetOneUser,
  ApiEditUser,
  ApiCreateUser,
  ApiDeleteUser,
  ApiGetAllOperators,
  ApiChangeRoleUser,
  ApiChangeStatusUser,
  ApiSetPassword
} from '@/api/user.api.js';
import { useCore } from './core.pinia.js';
import useModal from '@/composables/useModal.js';

const { close } = useModal();

export const useUser = defineStore('user', {
  state: () => ({
    users: { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 },
    user: { role: null },
    operators: [],
    selectedOperators: [],
    userForm: { firstName: null, lastName: null, username: null, password: null },
    userLoader: false,
    userMe: true
  }),
  actions: {
    async getUserMe(callback) {
      this.userMe = true;
      const coreStore = useCore();
      try {
        const { data } = await ApiGetMe();
        this.user = { ...data, role: data.role || null };
        callback?.(data.role);
      } catch (error) {
        coreStore.switchStatus(error);
        this.user = { role: null };
      } finally {
        this.userMe = false;
      }
    },

    async getAllUsers({ page = 0, size = 10, search = null, status = null }) {
      this.userLoader = true;
      try {
        const { data } = await ApiGetAllUser(page, size, search, status);
        this.users.content = data.content;
        this.users.page = data.pageable.pageNumber;
        this.users.totalElements = data.totalElements;
        this.users.totalPages = data.totalPages;
      } catch (error) {
        useCore().switchStatus(error);
      } finally {
        this.userLoader = false;
      }
    },

    async getAllOperators() {
      this.userLoader = true;
      try {
        const { data } = await ApiGetAllOperators();
        this.operators = data;
      } catch (error) {
        useCore().switchStatus(error);
      } finally {
        this.userLoader = false;
      }
    },

    async getOneUser(id) {
      if (!id) return;
      this.userLoader = true;
      try {
        const { data } = await ApiGetOneUser(id);
        this.userForm = {
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username,
          password: null
        };
      } catch (error) {
        useCore().switchStatus(error);
      } finally {
        this.userLoader = false;
      }
    },

    async changeRoleUser(userId, role) {
      if (!userId || !role) return;
      this.userLoader = true;
      try {
        await ApiChangeRoleUser(userId, role);
      } catch (error) {
        useCore().switchStatus(error);
      } finally {
        this.userLoader = false;
      }
    },

    async changeStatusUser(userId, status) {
      if (!userId || status === null) return;
      this.userLoader = true;
      try {
        await ApiChangeStatusUser(userId, status);
      } catch (error) {
        useCore().switchStatus(error);
      } finally {
        this.userLoader = false;
      }
    },

    async createUser(modalKey) {
      if (!this.userForm.username || !this.userForm.password) return;
      this.userLoader = true;
      try {
        const { data } = await ApiCreateUser(this.userForm);
        close(modalKey);
        this.users.content.push(data);
      } catch (error) {
        useCore().switchStatus(error);
      } finally {
        this.userLoader = false;
      }
    },

    async editUser(userId, modalKey) {
      if (!userId || !this.userForm.username) return;
      this.userLoader = true;
      try {
        const { data } = await ApiEditUser(userId, this.userForm);
        this.userForm = {};
        close(modalKey);
        const elIndex = this.users.content.findIndex((item) => item.id === userId);
        if (elIndex !== -1) this.users.content.splice(elIndex, 1, data);
      } catch (error) {
        useCore().switchStatus(error);
      } finally {
        this.userLoader = false;
      }
    },

    async deleteUser(userId) {
      if (!userId) return;
      this.userLoader = true;
      try {
        await ApiDeleteUser(userId);
        const elIndex = this.users.content.findIndex((item) => item.id === userId);
        if (elIndex !== -1) this.users.content.splice(elIndex, 1);
      } catch (error) {
        useCore().switchStatus(error);
      } finally {
        this.userLoader = false;
      }
    },

          async setUserPassword(userId, passwordData) {
      if (!passwordData.oldPassword || !passwordData.newPassword) {
        throw new Error('Old password and new password are required')
      }
      this.userLoader = true
      try {
        const response = await ApiSetPassword(userId, passwordData)
        return response
      } catch (error) {
        useCore().switchStatus(error)
        throw error
      } finally {
        this.userLoader = false
      }
    }}
});
