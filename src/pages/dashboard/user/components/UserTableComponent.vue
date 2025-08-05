<template>
  <div class="users-view">
    <a-table
      :columns="userColumns"
      :data-source="users.content"
      :loading="organizationStore.organizationLoader"
      :pagination="false"
      size="middle"
      bordered
      :scroll="{ x: 800 }"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.dataIndex === 'ni'">
          {{ index + 1 + Number(users.page) * Number(users.size) }}
        </template>
        <template v-if="column.dataIndex === 'fullName'">
          {{ record.fullName }}
        </template>
        <template v-if="column.dataIndex === 'username'">
          {{ record.username }}
        </template>
        <template
          v-if="column.dataIndex === 'role' && user.role === 'DIRECTOR'"
        >
          <a-badge
            v-if="user.role === 'DIRECTOR' && user.id === record.id"
            :text="t('ROLE_DIRECTOR')"
            status="processing"
          />
          <a-select
            v-else
            v-model:value="record.role"
            @change="handleRoleChange(record.id, $event)"
            :disabled="user.role === 'DIRECTOR' && record.role === 'DIRECTOR'"
          >
            <a-select-option value="DIRECTOR">{{
              t('ROLE_DIRECTOR')
            }}</a-select-option>
            <a-select-option value="OPERATOR">{{
              t('ROLE_OPERATOR')
            }}</a-select-option>
          </a-select>
        </template>
        <template v-if="column.dataIndex === 'status'">
          <a-tooltip
            v-if="user.role === 'DIRECTOR' && record.role === 'DIRECTOR'"
            :title="t('UserOrganizationView.role_change_disabled')"
          >
            <a-switch :checked="record.status === 'ACTIVE'" :disabled="true" />
          </a-tooltip>
          <a-switch
            v-else
            :checked="record.status === 'ACTIVE'"
            :loading="loadingSwitches[record.id] || false"
            @change="handleStatusChange(record.id, $event)"
          />
        </template>
        <template v-if="column.dataIndex === 'actions'">
          <a-space v-if="canPerformActions(record)">
            <a-tooltip v-if="user.role === 'DIRECTOR'" :title="t('EDIT')">
              <a-button @click="editUser(record)">
                <template #icon><icon-edit /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip v-if="user.role === 'ADMIN'" :title="t('SET_PASSWORD')">
              <a-button @click="setPassword(record)">
                <template #icon><icon-lock /></template>
              </a-button>
            </a-tooltip>
            <a-popconfirm
              :title="t('SURE_DELETE')"
              :description="`${t('DELETE')} ${record.fullName}?`"
              :ok-text="t('OK')"
              :cancel-text="t('NO')"
              placement="topRight"
              @confirm="deleteUser(record)"
            >
              <a-tooltip :title="t('DELETE')">
                <a-button danger>
                  <template #icon><icon-delete /></template>
                </a-button>
              </a-tooltip>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>
    <pagination-component
      v-if="users.totalElements > 0"
      :total="users.totalElements"
      :page="users.page"
      :size="users.size"
      @change-size="handleSizeChange"
      @change-page="handlePageChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { storeToRefs } from 'pinia'
import { useOrganization } from '@/store/organization.pinia'
import { useUser } from '@/store/user.pinia'
import useModal from '@/composables/useModal'
import UserForm from './form/UserFormComponent.vue'
import SetPasswordModal from './form/UserPasswordFormComponent.vue'
import PaginationComponent from '@/components/PaginationComponent.vue'
import IconEdit from '@/components/icons/outline/IconEdit.vue'
import IconDelete from '@/components/icons/outline/IconDelete.vue'
import IconLock from '@/components/icons/outline/IconKey.vue'

const { t } = useI18n()
const route = useRoute()
const organizationStore = useOrganization()
const userStore = useUser()
const { open } = useModal()
const { user } = storeToRefs(userStore)

const searchText = ref('')
const roleFilter = ref(null)
const statusFilter = ref(null)
const loadingSwitches = ref({})
const sortField = ref('fullName')
const sortDirection = ref('DESC')
const isSearching = ref(false)

const organizationId = computed(() => {
  return user.value.role === 'DIRECTOR'
    ? user.value.organization?.id
    : Number(route.params.id) || null
})

const users = computed(() => {
  const defaultUsers = { content: [], page: 0, size: 10, totalElements: 0 }
  const storeUsers = organizationStore.users || defaultUsers
  return {
    ...storeUsers,
    page: Number(storeUsers.page) || 0,
    size: Number(storeUsers.size) || 10
  }
})

const setPassword = (userData) => {
  open({
    title: t('SET_PASSWORD'),
    width: 600,
    component: SetPasswordModal,
    type: 'set-password-form',
    props: {
      username: userData.username
    }
  })
}

const canPerformActions = (record) => {
  if (user.value.role === 'ADMIN') {
    return true
  }
  if (user.value.role === 'DIRECTOR') {
    return record.id !== user.value.id && record.role !== 'DIRECTOR'
  }
  return false
}

const fetchUsers = async () => {
  if (isSearching.value) return
  isSearching.value = true

  try {
    await organizationStore.fetchOrganizationUsers(
      user.value.role === 'DIRECTOR' ? 'ADMIN' : organizationId.value,
      searchText.value?.trim() || null,
      +(route.query.size || 10),
      +(route.query.page || 1) - 1,
      roleFilter.value,
      statusFilter.value,
      sortField.value,
      sortDirection.value
    )
  } catch (error) {
    message.error(t('notification_component.error_fetch_users'))
  } finally {
    isSearching.value = false
  }
}

const editUser = (userData) => {
  open({
    title: t('UserOrganizationView.edit'),
    width: 800,
    component: UserForm,
    type: 'user-form',
    props: {
      orgId: organizationId.value,
      userData: { ...userData, status: userData.status === 'ACTIVE' },
      isProfileEdit: false
    }
  })
}

const deleteUser = async (userData) => {
  try {
    await organizationStore.deleteUser(userData.id, organizationId.value)
    message.success(t('UserOrganizationView.deleted'))
    fetchUsers(users.value.page + 1, users.value.size)
  } catch (error) {
    message.error(t('notification_component.error_delete_user'))
  }
}


const handleRoleChange = async (userId, role) => {
  const originalUser = users.value.content.find((u) => u.id === userId)
  const originalRole = originalUser?.role
  const originalStatus = originalUser?.status

  try {
    if (originalUser) {
      originalUser.role = role
    }

    const updatePayload = { 
      role: role,
      status: originalStatus
    }

    await organizationStore.updateUser(userId, updatePayload, organizationId.value)
    message.success(t('notification_component.role_updated'))
    
    await fetchUsers()
  } catch (error) {
    if (originalUser && originalRole) {
      originalUser.role = originalRole
    }
    
    message.error(t('notification_component.error_update_role'))
    console.error('Role update error:', error)
    
    await fetchUsers()
  }
}


const handleStatusChange = async (userId, checked) => {
  loadingSwitches.value[userId] = true

  const originalUser = users.value.content.find((u) => u.id === userId)
  const originalStatus = originalUser?.status

  try {
    if (originalUser) {
      originalUser.status = checked ? 'ACTIVE' : 'INACTIVE'
    }

    const statusValue = checked ? 'ACTIVE' : 'INACTIVE'

    await organizationStore.updateUser(
      userId,
      { status: statusValue },
      organizationId.value
    )

    message.success(t('notification_component.success'))
  } catch (error) {
    if (originalUser && originalStatus) {
      originalUser.status = originalStatus
    }

    message.error(t('notification_component.error'))
    console.error('Status update error:', error)
  } finally {
    loadingSwitches.value[userId] = false
  }
}

const handleSizeChange = (size) => {
  fetchUsers(1, size)
}

const handlePageChange = (page) => {
  fetchUsers(page, users.value.size)
}

const initializeFiltersFromUrl = () => {
  const query = route.query
  searchText.value = query.search || ''
  roleFilter.value = query.role || null
  statusFilter.value =
    query.status !== undefined ? query.status === 'true' : null
}

watch(
  () => organizationId.value,
  (newId, oldId) => {
    if (newId && newId !== oldId) fetchUsers()
  }
)

watch(
  () => route.query,
  (newQuery, oldQuery) => {
    if (JSON.stringify(newQuery) === JSON.stringify(oldQuery)) return

    if (!Object.keys(newQuery).length) {
      searchText.value = ''
      roleFilter.value = null
      statusFilter.value = null
      fetchUsers()
      return
    }

    initializeFiltersFromUrl()
    fetchUsers()
  },
  { deep: true, immediate: true }
)

onMounted(() => {
  initializeFiltersFromUrl()
  if (organizationId.value) fetchUsers()
})

const userColumns = computed(() => {
  const baseColumns = [
    { title: '№', dataIndex: 'ni', width: 80, align: 'center' },
    { title: t('UserView.firstName'), dataIndex: 'fullName' },
    { title: t('UserView.username'), dataIndex: 'username' }
  ]

  if (user.value.role === 'DIRECTOR') {
    baseColumns.push(
      {
        title: t('UserView.role'),
        dataIndex: 'role',
        width: 150,
        align: 'center'
      },
      {
        title: t('UserView.status'),
        dataIndex: 'status',
        width: 100,
        align: 'center'
      }
    )
  }

  baseColumns.push({
    title: '',
    dataIndex: 'actions',
    width: 150,
    align: 'center'
  })
  return baseColumns
})
</script>

<style scoped lang="scss">
@import '@/assets/styles/variable.scss';

:deep(.ant-table-thead > tr > th) {
  background: $table-header-bg;
  font-weight: 600;
}

:deep(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid $table-border;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: $table-hover-bg;
}

:deep(.ant-btn) {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  justify-content: center;
}

:deep(.ant-btn .anticon) {
  font-size: 14px;
}

:deep(.ant-space-item) {
  display: flex;
}
</style>
