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
import DownloadFilters from './components/DownloadFilterComponent.vue'
import DownloadTable from './components/DownloadTableComponent.vue'
import PageHeader from '@/components/PageHeaderComponent.vue'

const { t } = useI18n()
const route = useRoute()

watch(
  () => route.query,
  (query) => {
    const page = Number(query.page) > 0 ? Number(query.page) - 1 : 0
    const size = [10, 20, 50].includes(Number(query.size))
      ? Number(query.size)
      : 10
    const status = query.status || undefined
  },
  { immediate: true, deep: true }
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

@media (max-width: 964px) {
  .desktop-filters {
    display: none;
  }
  .mobile-filters {
    display: block;
  }
}
</style>
