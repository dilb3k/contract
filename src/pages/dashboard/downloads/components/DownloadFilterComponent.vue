<template>
  <a-space class="contracts-filters">
    <a-select
      v-model:value="selectedStatus"
      size="large"
      :options="statusOptions"
      :placeholder="t('SELECT_STATUS')"
      class="status-select"
      allow-clear
      @change="handleSearch"
    />
    <a-tooltip :title="t('REFRESH')">
      <a-button
        type="primary"
        size="large"
        class="btn-refresh"
        @click="handleRefresh"
      >
        <template #icon><icon-refresh /></template>
      </a-button>
    </a-tooltip>
  </a-space>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { debounce } from 'lodash-es'
import { useDownload } from '@/store/download.pinia'
import useQueryParams from '@/composables/useQueryParams.js'
import { ReloadOutlined } from '@ant-design/icons-vue' // Use Ant Design's reload icon
// If you have a custom IconRefresh, replace ReloadOutlined with IconRefresh

const { t } = useI18n()
const downloadStore = useDownload()
const { setQueries, getQueries } = useQueryParams()

const selectedStatus = ref(getQueries().status || null)

const statusOptions = [
  { label: t('status.CREATED'), value: 'CREATED' },
  { label: t('status.DOWNLOADED'), value: 'DOWNLOADED' }
]

const handleSearch = debounce(() => {
  const query = {
    page: 0,
    size: 10,
    status: selectedStatus.value || undefined
  }
  setQueries(query, { saveHistory: false })
  downloadStore.getAllDownloads(query)
}, 300)

const handleRefresh = debounce(async () => {
  try {
    const query = {
      page: 0,
      size: 10,
      status: undefined // Reset status filter
    }
    selectedStatus.value = null // Clear the select input
    setQueries(query, { saveHistory: false })
    await downloadStore.getAllDownloads(query)
  } catch (error) {
    message.error(t('notification_component.error_fetch_downloads'))
  }
}, 300)

onMounted(() => {
  const query = {
    page: Number(getQueries().page) || 0,
    size: 10,
    status: getQueries().status || undefined
  }
  if (query.status || query.page !== 0) {
    downloadStore.getAllDownloads(query)
  }
})

watch(
  () => getQueries().status,
  (newStatus) => {
    selectedStatus.value = newStatus || null
  }
)
</script>

<style scoped lang="scss">
@import '@/assets/styles/variable.scss';

.contracts-filters {
  display: flex;
  gap: 16px;
  padding-bottom: 16px;
  margin-left: 2px;
}

:deep(.ant-select) {
  width: 200px;

  .ant-select-selector {
    border-color: rgba($primary, 0.5);

    &:hover {
      border-color: darken($primary, 5%);
    }

    &:active {
      border-color: darken($primary, 8%);
    }
  }
}

.btn-refresh {
  background-color: $primary;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;

  &:hover:not(:disabled) {
    background-color: darken($primary, 5%);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
