<template>
  <div class="permission-filters">
    <a-input
      v-model:value="searchText"
      :placeholder="t('SEARCH')"
      allow-clear
      style="width: 200px"
      size="large"
      @input="emitSearch"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { debounce } from 'lodash-es'
import useQueryParams from '@/composables/useQueryParams'

const { t } = useI18n()
const { getQueries, setQueries } = useQueryParams()

const props = defineProps({
  searchText: String
})
const emit = defineEmits(['update:searchText', 'search'])

const searchText = ref(props.searchText || getQueries().search || '')

const emitSearch = debounce(() => {
  const query = {
    page: 1,
    size: getQueries().size || 10,
    search: searchText.value?.trim() || undefined
  }
  setQueries(query, { saveHistory: false })
  emit('update:searchText', searchText.value)
  emit('search')
}, 500)

watch(
  () => getQueries().search,
  (newSearch) => {
    if (searchText.value !== newSearch) {
      searchText.value = newSearch || ''
      emit('update:searchText', searchText.value)
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
@import '@/assets/styles/variable.scss';
.permission-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  margin-left: 2px;
}
:deep(.ant-input) {
  border-color: #d9d9d9;
  border-radius: 4px;
  &:focus {
    border-color: $primary;
    box-shadow: 0 0 0 2px rgba($primary, 0.2);
  }
}
</style>
