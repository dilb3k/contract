import { defineStore, storeToRefs } from 'pinia'
import {
  ApiGetMe,
  ApiGetAllUser,
  ApiGetOneUser,
  ApiEditUser,
  ApiCreateUser,
  ApiDeleteUser, ApiGetAllOperators
} from '@/api/user.api.js'
import useCore from '@/store/core.pinia.js'
import useModal from '@/composables/useModal.js'
const {close} = useModal()

const useUser = defineStore('user', {
  state: () => ({
    users: {
      content: [],
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0
    },
    user:{},
    operators:[],
    selectedOperators: [6],
    userForm:{
      firstName: null,
      lastName: null,
      username: null,
      password: null,
    },
    userLoader: false,
    userMe: true,
  }),
  actions: {
    getUserMe(callback){
      const coreStore = useCore()
      this.userMe = true
      ApiGetMe()
        .then(({data}) => {
          if (data.status !== 'ACTIVE') coreStore.logout()
          callback(data.role)
          this.user = data
        })
        .catch((error) => {
          coreStore.switchStatus(error)
        })
        .finally(() => {
          this.userMe = false
        })
    },

    getAllUsers({page, size, search, status}) {
      this.userLoader = true
      const core = useCore()

      ApiGetAllUser(page, size, search, status)
        .then(({ data }) => {
          this.users.content = data.content
          this.users.page = data.pageable.pageNumber
          this.users.totalElements = data.totalElements
          this.users.totalPages = data.totalPages
        })
        .catch((error) => {
          core.switchStatus(error)
        })
        .finally(() => {
          this.userLoader = false
        })
    },

    getAllOperators() {
      this.userLoader = true
      const core = useCore()

      ApiGetAllOperators()
        .then(({ data }) => {
          this.operators = data
        })
        .catch((error) => {
          core.switchStatus(error)
        })
        .finally(() => {
          this.userLoader = false
        })
    },

    getOneUser(id) {
      this.userLoader = true
      const { switchStatus } = useCore()

      ApiGetOneUser(id)
        .then(({data}) => {
          this.userForm = {
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.username,
            password: null
          }
        })
        .catch((error) => {
          switchStatus(error)
        })
        .finally(() => {
          this.userLoader = false
        })
    },

    givePermissionUser(form) {
    },

    changeRoleUser(userId, role) {
    },

    changeStatusUser(userId, status) {
    },

    createUser(modalKey) {
      this.userLoader = true
      const {switchStatus, setToast } = useCore()

      ApiCreateUser(this.userForm)
        .then(({data}) => {
          close(modalKey)
          this.users.content.push(data)
          setToast({
            type: 'success',
            locale: `UserView.created`
          })
        })
        .catch((error) => {
          switchStatus(error)
        })
        .finally(() => {
          this.userLoader = false
        })
    },

    editUser(userId, modalKey) {
      this.userLoader = true
      const {switchStatus, setToast } = useCore()
      const form = this.userForm
        ApiEditUser(userId, form)
        .then(({data}) => {
          this.userForm = {}
          close(modalKey)
          this.findAndUpdate(userId, data)
          setToast({
            type: 'success',
            locale: `UserView.edited`
          })
        })
        .catch((error) => {
          switchStatus(error)
        })
        .finally(() => {
          this.userLoader = false
        })
    },

    deleteUser(userId) {
      this.userLoader = true
      const {switchStatus, setToast } = useCore()
      ApiDeleteUser(userId)
        .then(() => {
          this.findAndDelete(userId)
          setToast({
            type: 'success',
            locale: `UserView.deleted`
          })
        })
        .catch((error) => {
          switchStatus(error)
        })
        .finally(() => {
          this.userLoader = false
        })
    },

    findAndUpdate(id, data) {
      const elIndex = this.users.content.findIndex(item => item.id === id)

      this.users?.content.splice(elIndex, 1, data)
    },
    findAndDelete(id) {
      const elIndex = this.users?.content.findIndex(item => item.id === id)

      this.users?.content.splice(elIndex, 1)
    },

  }
})

export default useUser
