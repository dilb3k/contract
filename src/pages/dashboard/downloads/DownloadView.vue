<template>
  <div class="download-view">
    <page-header :title="t('document_title.DownloadsView')">
      <template #actions>
        <div class="desktop-filters">
          <download-filters />
        </div>
      </template>
    </page-header>
    <div class="mobile-filters">
      <download-filters />
    </div>
    <download-table />
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDownload } from '@/store/download.pinia'
import DownloadFilters from './components/DownloadFilterComponent.vue'
import DownloadTable from './components/DownloadTableComponent.vue'
import PageHeader from '@/components/PageHeaderComponent.vue'

const { t } = useI18n()
const route = useRoute()
const downloadStore = useDownload()

watch(
  () => route.query,
  (query) => {
    downloadStore.getAllDownloads({
      page: Number(query.page) || 0,
      size: Number(query.size) || 10,
      status: query.status || null
    })
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
@import '@/assets/styles/variable.scss';

.desktop-filters {
  display: block;
}

.mobile-filters {
  display: none;
}

@media (max-width: 864px) {
  .desktop-filters {
    display: none;
  }
  .mobile-filters {
    display: block;
  }
}
</style>