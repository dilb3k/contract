<template>
  <a-space class="organization-filters">
    <a-input
      v-model:value="searchText"
      :placeholder="t('SEARCH')"
      allow-clear
      size="large"
      style="width: 200px"
      :disabled="organizationStore.organizationLoader"
      @input="handleSearch"
    />
    <a-button
      type="primary"
      size="large"
      :disabled="organizationStore.organizationLoader"
      @click="openCreateModal"
    >
      <icon-plus />
      {{ t('OrganizationView.create') }}
    </a-button>
  </a-space>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { debounce } from 'lodash-es'
import useQueryParams from '@/composables/useQueryParams'
import useModal from '@/composables/useModal'
import { useOrganization } from '@/store/organization.pinia'
import IconPlus from '@/components/icons/solid/IconPlus.vue'
import OrganizationFormComponent from './form/OrganizationFormComponent.vue'

const { t } = useI18n()
const { getQueries, setQueries } = useQueryParams()
const { open, close } = useModal()
const organizationStore = useOrganization()
const searchText = ref(getQueries().search || '')

const handleSearch = debounce(() => {
  const query = {
    page: 0,
    size: organizationStore.organizations?.size || 10,
    search: searchText.value?.trim() || undefined
  }
  setQueries(query, { saveHistory: false })
  organizationStore.getAllOrganizations(query)
}, 500)

watch(
  () => getQueries().search,
  (newSearch) => {
    searchText.value = newSearch || ''
    if (newSearch && !organizationStore.organizations.content.length) {
      handleSearch()
    }
  },
  { immediate: true }
)

const openCreateModal = () => {
  setQueries({ page: 1, size: 10, search: '' }, { saveHistory: false })
  open({
    title: t('OrganizationView.create'),
    width: 800,
    component: OrganizationFormComponent,
    props: { modalKey: Date.now() }
  })
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/variable.scss';
.organization-filters {
  display: flex;
  gap: 12px;
  margin-left: 2px;
  margin-top: 2px;
  margin-bottom: 16px;
}
:deep(.ant-btn-primary) {
  background-color: $primary;
  border-color: $primary;
  display: flex;
  color: white;
  align-items: center;
  gap: 4px;
  &:hover {
    background-color: darken($primary, 5%);
    border-color: darken($primary, 5%);
  }
}
</style>
