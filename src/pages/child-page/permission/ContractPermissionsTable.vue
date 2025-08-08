<template>
  <div class="permission-users-view">
    <div class="header-container">
      <a-page-header
        :title="t('PermissionUsers.title')"
        @back="() => router.push({ path: `/dashboard/contracts` })"
      />
      <div class="desktop-filters">
        <permission-filter-component
          :search-text="searchText"
          :role-filter="roleFilter"
          :status-filter="statusFilter"
          @update:search-text="searchText = $event"
          @update:role-filter="roleFilter = $event"
          @update:status-filter="statusFilter = $event"
          @search="handleSearch"
        />
      </div>
    </div>
    <div class="mobile-filters">
      <permission-filter-component
        :search-text="searchText"
        :role-filter="roleFilter"
        :status-filter="statusFilter"
        @update:search-text="searchText = $event"
        @update:role-filter="roleFilter = $event"
        @update:status-filter="statusFilter = $event"
        @search="handleSearch"
      />
    </div>
    <a-table
      :columns="userColumns"
      :data-source="normalizedUsers"
      :loading="userStore.permissionLoader"
      :pagination="false"
      size="middle"
      bordered
      :scroll="{ x: 1000 }"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.dataIndex === 'ni'">
          {{
            index +
            1 +
            (users.pageable?.pageNumber * users.pageable?.pageSize || 0)
          }}
        </template>
        <template v-if="column.dataIndex === 'fullName'">
          {{ record.fullName || 'N/A' }}
        </template>
        <template v-if="column.dataIndex === 'username'">
          {{ record.username || 'N/A' }}
        </template>
        <template v-if="column.dataIndex === 'role'">
          {{
            record.role === 'ADMIN'
              ? t('ROLE_ADMIN')
              : record.role === 'MANAGER'
                ? t('ROLE_MANAGER')
                : record.role === 'OPERATOR'
                  ? t('ROLE_OPERATOR')
                  : t('ROLE_DIRECTOR')
          }}
        </template>
        <template v-if="column.dataIndex === 'readPermission'">
          <div v-if="record.role !== 'ADMIN' && record.role !== 'DIRECTOR'">
            <a-switch
              :checked="record.permissions.includes('READ')"
              :loading="loadingStates[`${record.id}-READ`]"
              size="small"
              @change="(checked) => togglePermission(record, 'READ', checked)"
            />
          </div>
          <span v-else>-</span>
        </template>
        <template v-if="column.dataIndex === 'updatePermission'">
          <div v-if="record.role !== 'ADMIN' && record.role !== 'DIRECTOR'">
            <a-switch
              :checked="record.permissions.includes('UPDATE')"
              :loading="loadingStates[`${record.id}-UPDATE`]"
              size="small"
              @change="(checked) => togglePermission(record, 'UPDATE', checked)"
            />
          </div>
          <span v-else>-</span>
        </template>
        <template v-if="column.dataIndex === 'deletePermission'">
          <div v-if="record.role !== 'ADMIN' && record.role !== 'DIRECTOR'">
            <a-switch
              :checked="record.permissions.includes('DELETE')"
              :loading="loadingStates[`${record.id}-DELETE`]"
              size="small"
              @change="(checked) => togglePermission(record, 'DELETE', checked)"
            />
          </div>
          <span v-else>-</span>
        </template>
      </template>
    </a-table>
    <pagination-component
      v-if="users.totalElements > 0"
      :total="users.totalElements"
      :current="Number(users.pageable?.pageNumber ?? 0) + 1"
      :page-size="users.pageable?.pageSize || 10"
      :disabled="userStore.permissionLoader"
      @change="handlePageChange"
      @change-size="handleSizeChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, h, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { storeToRefs } from 'pinia'
import { debounce } from 'lodash-es'
import { usePermission } from '@/store/permission.pinia'
import PermissionFilterComponent from './components/PermissionFilterComponent.vue'
import PaginationComponent from '@/components/PaginationComponent.vue'
import IconEdit from '@/components/icons/outline/IconEdit.vue'
import IconDelete from '@/components/icons/outline/IconDelete.vue'
import IconEye from '@/components/icons/outline/IconEye.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const userStore = usePermission()
const { users } = storeToRefs(userStore)

const searchText = ref('')
const roleFilter = ref(null)
const statusFilter = ref(null)
const targetId = ref(route.params.id)
const loadingStates = reactive({})

const normalizedUsers = computed(() => {
  return users.value.content.map((user) => ({
    ...user,
    permissions: user.documentationPermissions || []
  }))
})

const fetchUsers = async (
  page = 0,
  size = 10,
  search = null,
  status = null,
  role = null
) => {
  if (!targetId.value) {
    message.error(t('notification_component.target_not_selected'))
    return
  }
  try {
    await userStore.getContractUsers({
      page,
      targetId: targetId.value,
      size,
      search: search?.trim() || null,
      status: status || null,
      role: role || null
    })
  } catch (error) {
    message.error(t('notification_component.error_fetch_users'))
    console.error('Fetch users error:', error)
  }
}

const syncQueryParams = async () => {
  const page = parseInt(route.query.page, 10) || 1
  const size = parseInt(route.query.size, 10) || 10
  const search = route.query.search || null
  const status = route.query.status || null
  const role = route.query.role || null
  const backendPage = Math.max(0, page - 1)

  if (
    !users.value?.content ||
    users.value.content.length === 0 ||
    backendPage !== users.value.pageable.pageNumber ||
    size !== users.value.pageable.pageSize ||
    search !== (route.query.search || null) ||
    status !== (route.query.status || null) ||
    role !== (route.query.role || null)
  ) {
    await fetchUsers(backendPage, size, search, status, role)
  }
}

const handleSearch = debounce(() => {
  const query = {
    ...(searchText.value.trim() && { search: searchText.value.trim() }),
    ...(roleFilter.value && { role: roleFilter.value }),
    ...(statusFilter.value && { status: statusFilter.value }),
    page: 1
  }
  router.replace({ query })
  fetchUsers(
    0,
    users.value.pageable?.pageSize || 10,
    searchText.value.trim(),
    statusFilter.value,
    roleFilter.value
  )
}, 300)

const togglePermission = async (record, permission, checked) => {
  const loadingKey = `${record.id}-${permission}`
  loadingStates[loadingKey] = true

  try {
    let updatedPermissions = [...record.permissions]

    if (permission === 'READ' && !checked) {
      updatedPermissions = []
    } else if (permission === 'READ' && checked) {
      updatedPermissions = [...new Set([...record.permissions, 'READ'])]
    } else if (checked && ['UPDATE', 'DELETE'].includes(permission)) {
      updatedPermissions = [
        ...new Set([...record.permissions, 'READ', permission])
      ]
    } else {
      updatedPermissions = record.permissions.filter((p) => p !== permission)
    }

    const payload = [
      {
        userId: record.id,
        targetId: targetId.value,
        permissions: updatedPermissions
      }
    ]

    await userStore.updateContractPermission(payload)
    message.success(
      checked
        ? t('notification_component.permission_added', {
            permission: t('EDIT')
          })
        : t('notification_component.permission_removed', {
            permission: t('DELETE')
          })
    )

    await fetchUsers(
      users.value.pageable?.pageNumber || 0,
      users.value.pageable?.pageSize || 10,
      searchText.value.trim(),
      statusFilter.value,
      roleFilter.value
    )
  } catch (error) {
    message.error(t('notification_component.error_updating_permission'))
    console.error('Error updating permission:', error.response?.data || error)
  } finally {
    loadingStates[loadingKey] = false
  }
}

const handleSizeChange = async (size) => {
  try {
    await router.push({ query: { ...route.query, size, page: 1 } })
    await fetchUsers(
      0,
      size,
      searchText.value.trim(),
      statusFilter.value,
      roleFilter.value
    )
  } catch (error) {
    message.error(t('notification_component.error_updating_pagination'))
    console.error('Page size change error:', error)
  }
}

const handlePageChange = async (page) => {
  try {
    await router.push({ query: { ...route.query, page } })
    await fetchUsers(
      page - 1,
      users.value.pageable?.pageSize || 10,
      searchText.value.trim(),
      statusFilter.value,
      roleFilter.value
    )
  } catch (error) {
    message.error(t('notification_component.error_updating_pagination'))
    console.error('Page change error:', error)
  }
}

onMounted(() => {
  syncQueryParams()
})

watch(
  () => route.query,
  () => syncQueryParams(),
  { deep: true }
)

const userColumns = computed(() => [
  { title: '№', dataIndex: 'ni', width: 80, align: 'center' },
  { title: t('PermissionUsers.firstName'), dataIndex: 'fullName' },
  { title: t('PermissionUsers.username'), dataIndex: 'username' },
  {
    title: t('PermissionUsers.role'),
    dataIndex: 'role',
    width: 150,
    align: 'center'
  },
  {
    title: () =>
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        },
        [h(IconEye, { style: { fontSize: '16px' } })]
      ),
    dataIndex: 'readPermission',
    width: 80,
    align: 'center'
  },
  {
    title: () =>
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        },
        [h(IconEdit, { style: { fontSize: '16px' } })]
      ),
    dataIndex: 'updatePermission',
    width: 80,
    align: 'center'
  },
  {
    title: () =>
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        },
        [h(IconDelete, { style: { fontSize: '16px' } })]
      ),
    dataIndex: 'deletePermission',
    width: 80,
    align: 'center'
  }
])
</script>

<style scoped lang="scss">
@import '@/assets/styles/variable.scss';

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: $spacing-s;
}

.desktop-filters {
  display: block;
}

.mobile-filters {
  display: none;
}

@media (max-width: $breakpoint-2xl) {
  .header-container {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-sm;
  }
  .desktop-filters {
    display: none;
  }
  .mobile-filters {
    display: block;
  }
}

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

:deep(.ant-space-item) {
  display: flex;
}
</style>
