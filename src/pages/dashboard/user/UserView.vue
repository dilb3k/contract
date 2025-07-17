<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import useUser from '@/store/user.pinia.js'
import UserFilters from '@/pages/dashboard/user/components/UserFiltersComponent.vue'
import UserTableComponent from '@/pages/dashboard/user/components/UserTableComponent.vue'
import PageHeaderComponent from '@/components/PageHeaderComponent.vue'

const route = useRoute()

watch(
  route,
  () => {
    useUser().getAllUsers({
      page: route?.query.page ? +route.query.page - 1 : 0,
      size: route?.query.size,
      search: route?.query.search,
      status: route?.query?.status || null
    })
  },
  { immediate: true }
)
</script>

<template>
  <page-header-component>
    <template #actions>
      <user-filters />
    </template>
  </page-header-component>
  <user-table-component />
</template>

<style scoped></style>
