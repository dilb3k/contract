<template>
  <div class="organization-filters">
    <a-input
      v-model:value="searchTextLocal"
      :placeholder="t('SEARCH')"
      allow-clear
      size="large"
      style="width: 200px"
      @input="debouncedSearch"
      @clear="handleSearchClear"
    />
    <a-select
      v-model:value="roleFilterLocal"
      :placeholder="t('OrganizationView.select_role')"
      size="large"
      allow-clear
      @change="handleFilterChange"
    >
      <a-select-option value="DIRECTOR">{{
        t('ROLE_DIRECTOR')
      }}</a-select-option>
      <a-select-option value="OPERATOR">{{
        t('ROLE_OPERATOR')
      }}</a-select-option>
    </a-select>
    <a-select
      v-model:value="statusFilterLocal"
      :placeholder="t('SELECT_STATUS')"
      size="large"
      allow-clear
      @change="handleFilterChange"
    >
      <a-select-option :value="true">{{ t('ACTIVE') }}</a-select-option>
      <a-select-option :value="false">{{ t('IN_ACTIVE') }}</a-select-option>
    </a-select>
    <a-button size="large" type="primary" @click="$emit('addUser')">
      <template #icon><icon-plus /></template>
      {{ t('UserOrganizationView.create') }}
    </a-button>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { debounce } from 'lodash-es'
import { useRoute, useRouter } from 'vue-router'
import useQueryParams from '@/composables/useQueryParams'
import IconPlus from '@/components/icons/solid/IconPlus.vue'

const props = defineProps({
  organizationId: { type: [String, Number], default: null },
  searchText: { type: String, default: '' },
  roleFilter: { type: String, default: null },
  statusFilter: { type: [Boolean, String], default: null }
})

const emit = defineEmits([
  'search',
  'addUser',
  'update:searchText',
  'update:roleFilter',
  'update:statusFilter'
])
const { t } = useI18n()
const { getQueries, setQueries } = useQueryParams()
const route = useRoute()
const router = useRouter()

const searchTextLocal = ref('')
const roleFilterLocal = ref(null)
const statusFilterLocal = ref(null)
const isInitialized = ref(false)
const isUpdatingFromUrl = ref(false)

watch(
  () => [props.searchText, props.roleFilter, props.statusFilter],
  ([newSearch, newRole, newStatus]) => {
    if (!isInitialized.value || isUpdatingFromUrl.value) return
    searchTextLocal.value = newSearch
    roleFilterLocal.value = newRole
    statusFilterLocal.value = newStatus
  }
)

watch(
  () => route.query,
  (newQuery, oldQuery) => {
    if (
      !isInitialized.value ||
      isUpdatingFromUrl.value ||
      JSON.stringify(newQuery) === JSON.stringify(oldQuery)
    )
      return

    isUpdatingFromUrl.value = true
    const query = getQueries()
    searchTextLocal.value = query.search || ''
    roleFilterLocal.value = query.role || null
    statusFilterLocal.value =
      query.status !== undefined ? query.status === 'true' : null

    emit('update:searchText', searchTextLocal.value)
    emit('update:roleFilter', roleFilterLocal.value)
    emit('update:statusFilter', statusFilterLocal.value)
    emit('search')
    isUpdatingFromUrl.value = false
  },
  { deep: true }
)

watch(
  () => route.path,
  async (newPath, oldPath) => {
    if (newPath !== oldPath && isInitialized.value) {
      isUpdatingFromUrl.value = true
      searchTextLocal.value = ''
      roleFilterLocal.value = null
      statusFilterLocal.value = null
      await nextTick()
      router.replace({ query: {} })
      emit('update:searchText', '')
      emit('update:roleFilter', null)
      emit('update:statusFilter', null)
      emit('search')
      isUpdatingFromUrl.value = false
    }
  }
)

const debouncedSearch = debounce(() => {
  if (!isInitialized.value) return
  emitUpdates()
  updateUrlParams()
  emit('search')
}, 300)

const handleSearchClear = () => {
  searchTextLocal.value = ''
  emitUpdates()
  updateUrlParams()
  emit('search')
}

const handleFilterChange = () => {
  if (!isInitialized.value) return
  emitUpdates()
  updateUrlParams()
  emit('search')
}

const emitUpdates = () => {
  emit('update:searchText', searchTextLocal.value || '')
  emit('update:roleFilter', roleFilterLocal.value)
  emit('update:statusFilter', statusFilterLocal.value)
}

const updateUrlParams = () => {
  if (!isInitialized.value) return
  const query = {}
  if ((searchTextLocal.value || '').trim()) {
    query.search = searchTextLocal.value.trim()
  }

  if (roleFilterLocal.value) query.role = roleFilterLocal.value
  if (statusFilterLocal.value !== null && statusFilterLocal.value !== undefined)
    query.status = statusFilterLocal.value.toString()

  setQueries(query, { saveHistory: false })
}

onMounted(async () => {
  const query = getQueries()
  searchTextLocal.value = query.search || ''
  roleFilterLocal.value = query.role || null
  statusFilterLocal.value =
    query.status !== undefined ? query.status === 'true' : null

  await nextTick()
  emitUpdates()
  isInitialized.value = true
  emit('search')
})
</script>

<style scoped lang="scss">
@import '@/assets/styles/variable.scss';

.organization-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  margin-left: 2px;
}

:deep(.ant-btn-primary) {
  background-color: $primary;
  color: $white;
  &:hover {
    background-color: darken($primary, 5%);
  }
  &:active {
    background-color: darken($primary, 8%);
  }
}
</style>
