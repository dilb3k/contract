<template>
  <div class="organization-view">
    <page-header :title="t('document_title.OrganizationView')">
      <template #actions>
        <div class="desktop-filter">
          <organization-filter />
        </div>
      </template>
    </page-header>
    <div class="mobile-filter">
      <organization-filter />
    </div>
    <organization-table />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import OrganizationFilter from './components/OrganizationFilterComponent.vue'
import OrganizationTable from './components/OrganizationTableComponent.vue'
import PageHeader from '@/components/PageHeaderComponent.vue'

const { t } = useI18n()
</script>

<style scoped lang="scss">
@import '@/assets/styles/variable.scss';
.organization-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
.desktop-filter {
  display: block;
}
.mobile-filter {
  display: none;
}
@media (max-width: 1264px) {
  .desktop-filter {
    display: none;
  }
  .mobile-filter {
    display: block;
  }
}
</style>
