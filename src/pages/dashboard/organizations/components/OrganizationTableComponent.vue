<template>
  <div class="organization-table">
    <a-table
      :columns="columns"
      :data-source="organizations?.content || []"
      :loading="organizationStore.organizationLoader"
      :pagination="false"
      size="middle"
      bordered
      :scroll="{ x: 600 }"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.dataIndex === 'ni'">
          {{ index + 1 + (organizations?.page * organizations?.size || 0) }}
        </template>
        <template v-if="column.dataIndex === 'name'">
          {{ record.name }}
        </template>
        <template v-if="column.dataIndex === 'contract'">
          <a-space>
            <a-button
              type="primary"
              class="btn-contract"
              block
              @click="viewContracts(record)"
            >
              <template #icon><icon-document /></template>
              {{ t('ContractsView.title') }}
            </a-button>
          </a-space>
        </template>
        <template v-if="column.dataIndex === 'actions'">
          <a-space>
            <a-tooltip :title="t('UserView.title')">
              <a-button size="size" @click="viewUser(record)">
                <template #icon><icon-users /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip :title="t('EDIT')">
              <a-button size="size" @click="editOrganization(record)">
                <template #icon><icon-edit /></template>
              </a-button>
            </a-tooltip>
            <a-popconfirm
              :title="t('SURE_DELETE')"
              :description="`${record.name} ni o'chirishni xohlaysizmi?`"
              :ok-text="t('OK')"
              :cancel-text="t('CANCEL')"
              placement="topRight"
              @confirm="deleteOrganization(record)"
            >
              <a-tooltip :title="t('DELETE')">
                <a-button danger size="size">
                  <template #icon><icon-delete /></template>
                </a-button>
              </a-tooltip>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>
    <pagination-component
      v-if="organizations?.totalElements"
      :total="organizations.totalElements"
      :current="organizations.page + 1"
      :page-size="organizations.size"
      :disabled="organizationStore.organizationLoader"
      @change-size="handleSizeChange"
      @on-change="handlePageChange"
    />
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { debounce } from 'lodash-es'
import PaginationComponent from '@/components/PaginationComponent.vue'
import IconDocument from '@/components/icons/outline/IconOrganization.vue'
import IconEdit from '@/components/icons/outline/IconEdit.vue'
import IconDelete from '@/components/icons/outline/IconDelete.vue'
import IconUsers from '@/components/icons/outline/IconUsers.vue'
import OrganizationFormComponent from './form/OrganizationFormComponent.vue'
import useModal from '@/composables/useModal'
import { useOrganization } from '@/store/organization.pinia'
import useQueryParams from '@/composables/useQueryParams'

const { t } = useI18n()
const router = useRouter()
const { open, close } = useModal()
const organizationStore = useOrganization()
const { getQueries } = useQueryParams()

const organizations = computed(() => organizationStore.organizations)
const columns = [
  { title: '№', dataIndex: 'ni', width: 80, align: 'center' },
  { title: t('OrganizationView.name'), dataIndex: 'name' },
  {
    title: t('OrganizationView.view'),
    dataIndex: 'contract',
    width: 200,
    align: 'center'
  },
  { title: '', dataIndex: 'actions', width: 200, align: 'center' }
]

watch(
  () => getQueries(),
  debounce((query) => {
    if (organizationStore.organizationLoader) return
    const page = query.page ? Math.max(0, Number(query.page) - 1) : 0
    organizationStore.getAllOrganizations({
      page,
      size: query.size ? Number(query.size) : 10,
      search: query.search || undefined
    })
  }, 300),
  { immediate: true, deep: true }
)

const viewUser = (record) => {
  if (organizationStore.organizationLoader) return
  router.push({
    name: 'OrganizationUsers',
    params: { id: record.id }
  })
}

const viewContracts = (record) => {
  if (organizationStore.organizationLoader) return
  router.push(`/dashboard/contracts/${record.id}`)
}

const editOrganization = (record) => {
  if (organizationStore.organizationLoader) return
  open({
    title: t('OrganizationView.edit'),
    width: 800,
    component: OrganizationFormComponent,
    props: { organizationData: record, modalKey: Date.now() }
  })
}

const deleteOrganization = async (record) => {
  if (organizationStore.organizationLoader || !record?.id) {
    message.error(t('notification_component.invalid_organization_id'))
    return
  }
  try {
    await organizationStore.deleteOrganization(record.id)
    message.success(t('OrganizationView.deleted'))
  } catch (error) {
    message.error(
      error.response?.data?.message || t('notification_component.error')
    )
  }
}

const handleSizeChange = debounce((size) => {
  if (organizationStore.organizationLoader) return
  const query = getQueries()
  organizationStore.getAllOrganizations({
    page: query.page ? Math.max(0, Number(query.page) - 1) : 0,
    size: Number(size) || 10,
    search: query.search || undefined
  })
}, 300)

const handlePageChange = debounce((page) => {
  if (organizationStore.organizationLoader) return
  const query = getQueries()
  organizationStore.getAllOrganizations({
    page: Math.max(0, Number(page) - 1),
    size: query.size ? Number(query.size) : 10,
    search: query.search || undefined
  })
}, 300)
</script>

<style scoped lang="scss">
@import '@/assets/styles/variable.scss';
.organization-table {
  background: #fff;
}
:deep(.ant-btn-primary) {
  background-color: $primary;
  border-color: $primary;
  &:hover {
    background-color: darken($primary, 5%);
    border-color: darken($primary, 5%);
  }
}
:deep(.ant-table-thead > tr > th) {
  background: #f8fafc;
  font-weight: 600;
}
:deep(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid #e8e8e8;
}
:deep(.ant-table-tbody > tr:hover > td) {
  background: #f0f0f0;
}
:deep(.ant-btn) {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}
</style>
