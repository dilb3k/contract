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

        <template v-if="column.dataIndex === 'title'">
          {{ record.sample?.name || t('NO_DATA') }}
        </template>

        <template v-if="column.dataIndex === 'actions'">
          <a-space>
            <template v-if="user?.role === 'ADMIN'">
              <a-dropdown :trigger="['click']" placement="bottomRight">
                <a-tooltip :title="t('VIEW')">
                  <a-button :loading="openingFileId === record.id">
                    <template #icon>
                      <icon-eye />
                    </template>
                  </a-button>
                </a-tooltip>
                <template #overlay>
                  <a-menu @click="({ key }) => openFile(record, key)">
                    <a-menu-item key="pdf">
                      {{ t('PDF') }}
                    </a-menu-item>
                    <a-menu-item key="docx">
                      {{ t('DOCX') }}
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </template>
            <template v-else>
              <a-tooltip
                v-if="record.ownerId === null || user?.role === 'DIRECTOR'"
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
                v-if="
                  record.ownerId === null ||
                  user?.role === 'DIRECTOR' ||
                  record.permissions.includes('UPDATE')
                "
                :title="t('EDIT')"
              >
                <a-button
                  :disabled="contractStore.contractLoader || !record?.id"
                  @click="handleEditContract(record)"
                >
                  <template #icon><icon-edit /></template>
                </a-button>
              </a-tooltip>
              <a-dropdown :trigger="['click']" placement="bottomRight">
                <a-tooltip :title="t('VIEW')">
                  <a-button :loading="openingFileId === record.id">
                    <template #icon>
                      <icon-eye />
                    </template>
                  </a-button>
                </a-tooltip>
                <template #overlay>
                  <a-menu @click="({ key }) => openFile(record, key)">
                    <a-menu-item key="pdf">
                      {{ t('PDF') }}
                    </a-menu-item>
                    <a-menu-item key="docx">
                      {{ t('DOCX') }}
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
              <a-popconfirm
                v-if="
                  record.ownerId === null ||
                  user?.role === 'DIRECTOR' ||
                  record.permissions.includes('DELETE')
                "
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
            </template>
          </a-space>
        </template>
      </template>
    </a-table>
    <pagination-component
      v-if="contracts?.totalElements > 0"
      :total="contracts?.totalElements"
      :current="Number(contracts?.page ?? 0) + 1"
      :page-size="contracts?.size || 10"
      :disabled="contractStore.contractLoader"
      @change="handlePageChange"
      @change-size="handleSizeChange"
    />
    <a-modal
      :open="modalVisible"
      :title="t('VIEW_FILE')"
      width="80%"
      :body-style="{
        height: '80vh',
        overflow: 'auto',
        background: '#fff',
        padding: '16px'
      }"
      :footer="null"
      :closable="true"
      @cancel="closeModal"
      wrap-class-name="custom-modal"
    >
      <a-spin
        v-if="isLoading"
        :tip="t('LOADING_FILE') || 'Fayl yuklanmoqda...'"
        style="display: block; text-align: center; padding: 20px"
      />
      <template v-else-if="errorMessage">
        <div class="error-container">
          <p class="error-message">{{ errorMessage }}</p>
          <a-button v-if="fileBlob" type="primary" @click="downloadFile">
            {{ t('DOWNLOAD_FILE') || 'Yuklab olish' }}
          </a-button>
        </div>
      </template>
      <iframe
        v-else-if="fileFormat === 'pdf' && fileUrl"
        :src="fileUrl"
        class="pdf-iframe"
        title="PDF Preview"
      />
      <div
        v-else-if="fileFormat === 'docx'"
        ref="docxContainer"
        class="docx-content"
      />
      <div v-else class="no-preview">
        <p>{{ t('NO_FILE_AVAILABLE') || "Oldin ko'rish mumkin emas" }}</p>
        <a-button v-if="fileBlob" type="primary" @click="downloadFile">
          {{ t('DOWNLOAD_FILE') || 'Yuklab olish' }}
        </a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import PaginationComponent from '@/components/PaginationComponent.vue'
import IconEdit from '@/components/icons/outline/IconEdit.vue'
import IconUsers from '@/components/icons/outline/IconUsers.vue'
import IconDelete from '@/components/icons/outline/IconDelete.vue'
import IconEye from '@/components/icons/outline/IconEye.vue'
import { useUser } from '@/store/user.pinia'
import { useContract } from '@/store/contract.pinia'
import { storeToRefs } from 'pinia'
import { renderAsync } from 'docx-preview'

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
  { title: t('ContractsView.title'), dataIndex: 'title' },
  { title: '', dataIndex: 'actions', width: 200, align: 'center' }
]

const openingFileId = ref(null)
const modalVisible = ref(false)
const fileUrl = ref(null)
const fileFormat = ref(null)
const fileBlob = ref(null)
const isLoading = ref(false)
const errorMessage = ref(null)
const docxContainer = ref(null)

watch(modalVisible, async (val) => {
  if (!val) {
    closeModal()
    return
  }
  if (
    val &&
    fileFormat.value === 'docx' &&
    fileBlob.value &&
    docxContainer.value
  ) {
    await nextTick()
    try {
      isLoading.value = true
      if (!docxContainer.value) {
        throw new Error('DOCX container not found')
      }
      const buffer = await fileBlob.value.arrayBuffer()
      if (buffer.byteLength === 0) {
        throw new Error('File is empty')
      }
      docxContainer.value.innerHTML = ''
      console.log(
        'Rendering DOCX, Blob size:',
        buffer.byteLength,
        'Container:',
        docxContainer.value
      )
      await renderAsync(buffer, docxContainer.value, null, {
        className: 'docx-wrapper',
        inWrapper: true,
        breakPages: true,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true
      })
      message.success(
        t('notification_component.file_opened_successfully') ||
          'File opened successfully'
      )
    } catch (error) {
      console.error('DOCX render error:', error)
      errorMessage.value =
        t(
          error.message?.includes('container')
            ? 'CONTAINER_ERROR'
            : error.message?.includes('empty')
              ? 'EMPTY_FILE_ERROR'
              : 'DOCX_RENDER_ERROR'
        ) || 'Error rendering DOCX file'
      message.error(errorMessage.value)
    } finally {
      isLoading.value = false
    }
  }
})

const openFile = async (record, format) => {
  if (!record?.id || !['pdf', 'docx'].includes(format)) {
    message.error(
      t('notification_component.invalid_file_format') || 'Invalid file format'
    )
    return
  }
  if (openingFileId.value === record.id) {
    message.warning(
      t('notification_component.operation_in_progress') ||
        'Operation in progress'
    )
    return
  }
  openingFileId.value = record.id
  isLoading.value = true
  errorMessage.value = null
  fileFormat.value = format
  fileBlob.value = null
  fileUrl.value = null

  try {
    console.log('Fetching file for ID:', record.id, 'Format:', format)
    const { blob, mimeType } = await contractStore.openContractFile(
      record.id,
      format
    )
    if (!(blob instanceof Blob)) {
      throw new Error('Invalid file blob received')
    }
    if (blob.size === 0) {
      throw new Error('Received empty file blob')
    }
    console.log('Blob received:', blob, 'Type:', blob.type, 'Size:', blob.size)
    fileBlob.value = blob
    fileFormat.value = mimeType?.includes('wordprocessingml')
      ? 'docx'
      : mimeType?.includes('pdf')
        ? 'pdf'
        : format
    if (fileFormat.value === 'pdf') {
      fileUrl.value = URL.createObjectURL(blob)
    }
    modalVisible.value = true
    message.success(
      t('notification_component.file_opened_successfully') ||
        'File opened successfully'
    )
  } catch (error) {
    console.error('Open file error:', error)
    errorMessage.value =
      t(
        error.response?.status === 404
          ? 'FILE_NOT_FOUND'
          : error.response?.status === 403
            ? 'ACCESS_DENIED'
            : error.response?.status === 500
              ? 'SERVER_ERROR'
              : error.message?.includes('empty')
                ? 'EMPTY_FILE'
                : error.message?.includes('blob')
                  ? 'FILE_DATA_ERROR'
                  : 'FILE_OPEN_ERROR'
      ) || 'Failed to open file'
    message.error(errorMessage.value)
    modalVisible.value = true
  } finally {
    isLoading.value = false
    openingFileId.value = null
  }
}

const closeModal = () => {
  modalVisible.value = false
  if (fileUrl.value) {
    URL.revokeObjectURL(fileUrl.value)
  }
  fileUrl.value = null
  fileFormat.value = null
  fileBlob.value = null
  errorMessage.value = null
  if (docxContainer.value) {
    docxContainer.value.innerHTML = ''
  }
}

const downloadFile = () => {
  if (!fileBlob.value || !fileFormat.value) {
    message.error(
      t('notification_component.no_file_to_download') || 'No file to download'
    )
    return
  }
  try {
    const url = URL.createObjectURL(fileBlob.value)
    const link = document.createElement('a')
    link.href = url
    link.download = `contract_${Date.now()}.${fileFormat.value}`
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 100)
    message.success(
      t('notification_component.download_started') || 'Download started'
    )
  } catch (error) {
    message.error(
      t('notification_component.download_failed') || 'Download failed'
    )
    console.error('Download error:', error)
  }
}

function onSelectChange(selectedKeys) {
  emit('update:selected-row-keys', selectedKeys)
}

function handleEditContract(record) {
  if (contractStore.contractLoader || !record?.id) {
    message.error(t('ContractsView.INVALID_ID') || 'Invalid contract ID')
    return
  }
  emit('edit-contract', record)
}

function handleDeleteContract(contractId) {
  if (contractStore.contractLoader || !contractId) {
    message.error(t('ContractsView.INVALID_ID') || 'Invalid contract ID')
    return
  }
  emit('delete-contract', contractId)
}

function openPermissionsPage(contractId) {
  if (contractStore.contractLoader || !contractId) {
    message.error(t('ContractsView.INVALID_ID') || 'Invalid contract ID')
    return
  }
  try {
    router.push({ path: `/dashboard/contracts/permissions/${contractId}/` })
  } catch (error) {
    message.error(
      t('notification_component.error') || 'Error navigating to permissions'
    )
  }
}

function handlePageChange(page) {
  if (contractStore.contractLoader) return
  emit('change-page', page)
}

function handleSizeChange(newSize) {
  if (contractStore.contractLoader) return
  emit('change-size', newSize)
  emit('change-page', 1)
}
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

:deep(.ant-dropdown-menu) {
  min-width: 100px;
}

:deep(.ant-dropdown-menu-item) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
}

:deep(.custom-modal .ant-modal-content) {
  background: #fff;
  box-shadow: none;
  padding: 0;
}

:deep(.custom-modal .ant-modal-header) {
  background: #fff;
  border-bottom: none;
  padding: 16px;
}

:deep(.custom-modal .ant-modal-close) {
  top: 16px;
  right: 16px;
}

:deep(.custom-modal .ant-modal-body) {
  flex: 1;
  overflow: hidden;
  background: #fff;
  padding: 16px;
}

:deep(.docx-wrapper) {
  font-family: 'Times New Roman', serif;
  line-height: 1.4;
  background: #fff;
  padding: 16px;
  max-width: 100%;
}

:deep(.docx-wrapper p) {
  margin: 8px 0;
  text-align: justify;
}

:deep(.docx-wrapper table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
}

:deep(.docx-wrapper table td, .docx-wrapper table th) {
  border: 1px solid #333;
  padding: 4px 8px;
}

.pdf-iframe,
.docx-content {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}

.docx-content {
  overflow-y: auto;
  display: block;
  padding: 16px;
}

.error-container,
.no-preview {
  text-align: center;
  padding: 20px;
}

.error-message {
  color: #ff4d4f;
  margin-bottom: 16px;
}
</style>
