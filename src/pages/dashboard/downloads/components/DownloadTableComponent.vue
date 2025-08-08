<template>
  ,\n
  <div class="download-table">
    <a-table
      :columns="columns"
      :data-source="downloads?.content || []"
      :loading="downloadStore.downloadLoader"
      :pagination="false"
      size="middle"
      bordered
      :scroll="{ x: 800 }"
      rowKey="id"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.dataIndex === 'ni'">
          {{ index + 1 + (downloads?.page * downloads?.size || 0) }}
        </template>
        <template v-if="column.dataIndex === 'format'">
          {{ record.format?.toUpperCase() || 'N/A' }}
        </template>
        <template v-if="column.dataIndex === 'status'">
          <a-tag :color="getStatusColor(record)">
            {{
              isFileDownloading(record)
                ? t('PENDING')
                : t(`status.${record.status}`) || record.status
            }}
          </a-tag>
        </template>
        <template v-if="column.dataIndex === 'createdDate'">
          {{ formatDate(record.createdDate) }}
        </template>
        <template v-if="column.dataIndex === 'fileCount'">
          <a-space>
            <a-button
              type="default"
              size="large"
              class="btn-view"
              @click="showDetailsModal(record)"
            >
              <template #icon><eye-outlined /></template>
              <span class="file-count">
                {{ record.documentationIds?.length || 0 }}
              </span>
            </a-button>
          </a-space>
        </template>
        <template v-if="column.dataIndex === 'actions'">
          <a-space>
            <a-button
              type="primary"
              class="btn-download"
              :loading="isFileDownloading(record)"
              :disabled="!isDownloadable(record)"
              @click="downloadFile(record)"
            >
              <template #icon><icon-download /></template>
            </a-button>
            <a-popconfirm
              :title="t('SURE_DELETE')"
              :description="t('DELETE_CONFIRMATION', { name: record.name })"
              :ok-text="t('OK')"
              :cancel-text="t('CANCEL')"
              placement="topRight"
              :disabled="isFileDownloading(record)"
              @confirm="deleteFile(record)"
            >
              <a-tooltip :title="t('DELETE')">
                <a-button danger style="display: flex; justify-content: center">
                  <template #icon><icon-delete /></template>
                </a-button>
              </a-tooltip>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>
    <pagination-component
      v-if="downloads?.totalElements > 0"
      :total="downloads?.totalElements"
      :current="currentPage"
      :page-size="downloads?.size || 10"
      :disabled="downloadStore.downloadLoader"
      @change="handlePageChange"
      @showSizeChange="handleSizeChange"
    />
    <download-details-modal
      v-model:visible="isModalVisible"
      :download-id="selectedDownloadId"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { debounce } from 'lodash-es'
import { watch } from 'vue'
import { useDownload } from '@/store/download.pinia'
import { EyeOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import useQueryParams from '@/composables/useQueryParams.js'
import PaginationComponent from '@/components/PaginationComponent.vue'
import IconDownload from '@/components/icons/outline/IconDownload.vue'
import IconDelete from '@/components/icons/outline/IconDelete.vue'
import DownloadDetailsModal from './DownloadViewContractComponent.vue'

const { t } = useI18n()
const downloadStore = useDownload()
const { getQueries, setQueries } = useQueryParams()

const downloads = computed(() => downloadStore.downloads)
const maxPage = computed(() =>
  Math.max(
    1,
    Math.ceil(
      (downloads.value?.totalElements || 0) / (downloads.value?.size || 10)
    )
  )
)
const currentPage = computed(() => (downloads.value?.page || 0) + 1)
const isModalVisible = ref(false)
const selectedDownloadId = ref(null)

const columns = [
  { title: '№', dataIndex: 'ni', width: 80, align: 'center' },
  {
    title: t('DownloadsView.fileType'),
    dataIndex: 'format',
    width: 120,
    align: 'center'
  },
  {
    title: t('DownloadsView.status'),
    dataIndex: 'status',
    width: 120,
    align: 'center'
  },
  {
    title: t('DownloadsView.date'),
    dataIndex: 'createdDate',
    width: 180,
    align: 'center'
  },
  {
    title: t('DownloadsView.fileCount'),
    dataIndex: 'fileCount',
    width: 120,
    align: 'center'
  },
  { title: '', dataIndex: 'actions', width: 200, align: 'center' }
]

watch(
  () => getQueries(),
  debounce(async (query) => {
    if (downloadStore.downloadLoader) return
    const page = Math.max(0, Number(query.page) - 1)
    const size = [10, 20, 50].includes(Number(query.size))
      ? Number(query.size)
      : 10
    const status = query.status || undefined
    const validPage = Math.min(page, maxPage.value - 1)
    try {
      await setQueries({ page: validPage + 1, size, status })
      await downloadStore.getAllDownloads({ page: validPage, size, status })
    } catch (error) {
      message.error(t('notification_component.error_fetch_downloads'))
    }
  }, 300),
  { immediate: true }
)

const handleSizeChange = debounce(async (current, size) => {
  if (downloadStore.downloadLoader) return
  const validSize = [10, 20, 50].includes(Number(size)) ? Number(size) : 10
  const validPage = 0
  const status = getQueries().status || undefined
  try {
    await setQueries({ page: validPage + 1, size: validSize, status })
    await downloadStore.getAllDownloads({
      page: validPage,
      size: validSize,
      status
    })
  } catch (error) {
    message.error(t('notification_component.error'))
  }
}, 300)

const handlePageChange = debounce(async (page) => {
  if (downloadStore.downloadLoader) return
  const query = getQueries()
  const validPage = Math.min(Math.max(0, page - 1), maxPage.value - 1)
  const size = [10, 20, 50].includes(Number(query.size))
    ? Number(query.size)
    : 10
  const status = query.status || undefined
  try {
    await setQueries({ page: validPage + 1, size, status })
    await downloadStore.getAllDownloads({ page: validPage, size, status })
  } catch (error) {
    message.error(t('notification_component.error'))
  }
}, 300)

const showDetailsModal = (record) => {
  const documentId = extractDocumentId(record.id)
  if (documentId) {
    selectedDownloadId.value = documentId
    isModalVisible.value = true
  } else {
    message.error(t('notification_component.invalid_document_data'))
  }
}

const downloadFile = async (record) => {
  if (!isDownloadable(record)) {
    message.error(t('notification_component.download_not_available'))
    return
  }
  const documentId = extractDocumentId(record.id)
  if (!documentId || !record.format) {
    message.error(t('notification_component.invalid_document_data'))
    return
  }
  try {
    await downloadStore.downloadDocument(
      documentId,
      record.format.toLowerCase()
    )
    message.success(t('DownloadsView.success'))
  } catch (error) {
    message.error(t(error.message || 'notification_component.error'))
  }
}

const deleteFile = async (record) => {
  const documentId = extractDocumentId(record.id)
  if (!documentId) {
    message.error(t('notification_component.invalid_document_data'))
    return
  }
  try {
    await downloadStore.deleteDownload(documentId)
    message.success(t('DownloadsView.deleteSuccess'))
    const query = getQueries()
    const page = Math.max(0, Number(query.page) - 1)
    const size = [10, 20, 50].includes(Number(query.size))
      ? Number(query.size)
      : 10
    const status = query.status || undefined
    await downloadStore.getAllDownloads({ page, size, status })
  } catch (error) {
    message.error(t(error.message || 'notification_component.delete_error'))
  }
}

const extractDocumentId = (id) => {
  return Array.isArray(id) && id.length > 0
    ? id[0]
    : typeof id === 'string' || typeof id === 'number'
      ? id
      : null
}

const isDownloadable = (record) => {
  const documentId = extractDocumentId(record.id)
  const validFormats = ['zip', 'pdf', 'docx']
  return (
    documentId &&
    record.status === 'DOWNLOADED' &&
    record.format &&
    validFormats.includes(record.format.toLowerCase()) &&
    !isFileDownloading(record)
  )
}

const isFileDownloading = (record) => {
  const documentId = extractDocumentId(record.id)
  return documentId ? downloadStore.isDownloading(documentId) : false
}

const getStatusColor = (record) => {
  if (isFileDownloading(record)) return 'cyan'
  const colors = {
    CREATED: 'gold',
    PROCESSING: 'gold',
    PENDING: 'gold',
    FAILED: 'red',
    ERROR: 'red',
    DOWNLOADED: 'green'
  }
  return colors[record.status] || 'default'
}

const formatDate = (dateStr) => {
  return dateStr ? dayjs(dateStr).format('DD.MM.YYYY HH:mm') : 'N/A'
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/variable.scss';

.download-table {
  width: 100%;
  margin-bottom: 32px;
}

.btn-download {
  background-color: $primary;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;

  &:hover:not(:disabled) {
    background-color: darken($primary, 5%);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-view {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.file-count {
  color: #666;
  font-size: 14px;
}

:deep(.ant-tag) {
  font-weight: 600;
  font-size: 14px;
  padding: 4px 8px;
}

:deep(.ant-table-thead > tr > th) {
  background: #f8fafc;
  font-weight: 600;
}
</style>
