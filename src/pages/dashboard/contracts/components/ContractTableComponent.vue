<template>
  <div class="contracts-page">
    <a-table
      :columns="columns"
      :data-source="contracts?.content || []"
      :loading="contractStore.contractLoader"
      :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
      :pagination="false"
      size="middle"
      bordered
      :scroll="{ x: 600 }"
      rowKey="id"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.dataIndex === 'ni'">
          {{ index + 1 + (contracts?.page * contracts?.size || 0) }}
        </template>
        <template v-if="column.dataIndex === 'name'">
          {{ record.name || t('NO_DATA') }}
        </template>
        <template v-if="column.dataIndex === 'actions'">
          <a-space>
            <a-tooltip
              v-if="user?.role === 'DIRECTOR'"
              :title="t('ContractsView.give_permission')"
            >
              <a-button
                class="action-btn users-btn"
                :disabled="contractStore.contractLoader"
                @click="openPermissionsPage(record.id)"
              >
                <template #icon><icon-users /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip
              v-if="record.permissions.includes('UPDATE')"
              :title="t('EDIT')"
            >
              <a-button
                :disabled="contractStore.contractLoader || !record?.id"
                @click="handleEditContract(record)"
              >
                <template #icon><icon-edit /></template>
              </a-button>
            </a-tooltip>
            <a-popconfirm
              v-if="record.permissions.includes('DELETE')"
              :title="t('SURE_DELETE')"
              :description="`${record.name || 'Shartnoma'} ni o'chirishni xohlaysizmi?`"
              :ok-text="t('OK')"
              :cancel-text="t('CANCEL')"
              placement="topRight"
              @confirm="handleDeleteContract(record.id)"
            >
              <a-tooltip :title="t('DELETE')">
                <a-button
                  danger
                  :disabled="contractStore.contractLoader || !record?.id"
                >
                  <template #icon><icon-delete /></template>
                </a-button>
              </a-tooltip>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <pagination-component
      v-if="contracts?.totalElements > 0"
      :total="contracts?.totalElements"
      :current="(contracts?.page || 0) + 1"
      :page-size="contracts?.size || 10"
      :disabled="contractStore.contractLoader"
      @change="handlePageChange"
      @change-size="handleSizeChange"
    />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { debounce } from 'lodash-es'
import PaginationComponent from '@/components/PaginationComponent.vue'
import IconEdit from '@/components/icons/outline/IconEdit.vue'
import IconUsers from '@/components/icons/outline/IconUsers.vue'
import IconDelete from '@/components/icons/outline/IconDelete.vue'
import { useUser } from '@/store/user.pinia'
import { useContract } from '@/store/contract.pinia'
import { storeToRefs } from 'pinia'

const { t } = useI18n()
const router = useRouter()
const userStore = useUser()
const contractStore = useContract()
const { user } = storeToRefs(userStore)

const props = defineProps({
  contracts: {
    type: Object,
    default: () => ({ content: [], page: 0, size: 10, totalElements: 0 })
  },
  contractLoader: Boolean,
  selectedRowKeys: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'update:selected-row-keys',
  'edit-contract',
  'delete-contract',
  'change-size',
  'change-page'
])

const columns = [
  { title: '№', dataIndex: 'ni', width: 80, align: 'center' },
  { title: t('ContractsView.name'), dataIndex: 'name' },
  { title: '', dataIndex: 'actions', width: 150, align: 'center' }
]

function onSelectChange(selectedKeys) {
  emit('update:selected-row-keys', selectedKeys)
}

function handleEditContract(record) {
  if (contractStore.contractLoader || !record?.id) {
    message.error(t('ContractsView.INVALID_ID'))
    return
  }
  emit('edit-contract', record)
}

function handleDeleteContract(contractId) {
  if (contractStore.contractLoader || !contractId) {
    message.error(t('ContractsView.INVALID_ID'))
    return
  }
  emit('delete-contract', contractId)
}

function openPermissionsPage(contractId) {
  if (contractStore.contractLoader || !contractId) {
    message.error(t('ContractsView.INVALID_ID'))
    return
  }
  try {
    router.push({ path: `/dashboard/contracts/permissions/${contractId}/` })
  } catch (error) {
    message.error(t('notification_component.error'))
  }
}

const handlePageChange = debounce((page) => {
  if (contractStore.contractLoader) return
  emit('change-page', page - 1)
}, 300)

const handleSizeChange = debounce((newSize) => {
  if (contractStore.contractLoader) return
  emit('change-size', newSize)
  emit('change-page', 0)
}, 300)
</script>

<style scoped lang="scss">
@import '@/assets/styles/variable.scss';

:deep(.ant-table-thead > tr > th) {
  background: #f8fafc;
  font-weight: 600;
}

:deep(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid #f1f5f9;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f8fafc;
}

:deep(.ant-btn) {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

:deep(.ant-btn .anticon) {
  font-size: 14px;
}
</style>
