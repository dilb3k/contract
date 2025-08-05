<template>
  <a-space class="organization-filters">
    <a-input
      v-model:value="searchQuery"
      :placeholder="t('SEARCH')"
      allow-clear
      size="large"
      class="input-search"
      style="width: 200px"
      @change="handleSearch"
    />
  </a-space>
</template>

<script setup>
import { ref } from 'vue'
import { debounce } from '@/utils/helpers'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useContract } from '@/store/contract.pinia'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const contractStore = useContract()

const searchQuery = ref(route.query.search || '')

const handleSearch = debounce(() => {
  const search = searchQuery.value.trim() || null
  if (!route.params.organizationId) {
    message.error(t('notification_component.organization_not_selected'))
    return
  }
  router.push({
    query: { ...route.query, search, page: 1 }
  })
  contractStore.getAllOrganizationContracts(
    0,
    contractStore.contracts.size,
    search,
    route.params.organizationId
  )
}, 300)
</script>

<style scoped lang="scss">
@import '@/assets/styles/variable.scss';

.organization-filters {
  padding: 2px;
  display: flex;
}
</style>
