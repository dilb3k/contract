<template>
  <div class="page-wrapper">
    <page-header :title="t('document_title.TemplatesView')">
      <template #actions>
        <div class="desktop-filters">
          <template-filter-component />
        </div>
      </template>
    </page-header>
    <div class="mobile-filters">
      <template-filter-component />
    </div>
    <template-table-component />
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTemplate } from '@/store/template.pinia'
import TemplateFilterComponent from './components/TemplateFilterComponent.vue'
import TemplateTableComponent from './components/TemplateTableComponent.vue'
import PageHeader from '@/components/PageHeaderComponent.vue'

const { t } = useI18n()
const route = useRoute()
const templateStore = useTemplate()

watch(
  () => route.query,
  (query) => {
    templateStore.getAllTemplates({
      page: query.page ? +query.page - 1 : 0,
      size: query.size || 10,
      search: query.search || null
    })
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
@import '@/assets/styles/variable.scss';
.page-wrapper {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}
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
