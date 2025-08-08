```vue
<template>
  <a-space class="contracts-filters">
    <a-input
      v-model:value="searchQuery"
      :placeholder="t('SEARCH')"
      allow-clear
      size="large"
      class="search-input"
      :loading="contractStore.contractLoader"
      @input="onSearch"
      @clear="onClear"
    />
    <a-button
      type="primary"
      size="large"
      :disabled="contractStore.contractLoader"
      @click="openCreateModal"
    >
      {{ t('ContractsView.create') }}
      <template #icon>
        <icon-plus />
      </template>
    </a-button>
    <a-dropdown
      v-if="user?.role === 'DIRECTOR'"
      :trigger="['click']"
      :disabled="!selectedRowKeys?.length || contractStore.contractLoader"
    >
      <a-button
        class="btn-generate"
        size="large"
        type="primary"
        :loading="isGenerating"
      >
        <template #icon><icon-plus /></template>
        {{ t('Generate') }}
        <span v-if="selectedRowKeys?.length" class="count-badge"
          >({{ selectedRowKeys.length }})</span
        >
      </a-button>
      <template #overlay>
        <a-menu @click="handleFormatSelect">
          <a-menu-item key="pdf">{{ t('PDF') }}</a-menu-item>
          <a-menu-item key="docx">{{ t('DOCX') }}</a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
    <template-contract-component
      v-model:open="contractModalVisible"
      :modal-key="contractModalKey"
      @success="handleContractModalSuccess"
    />
  </a-space>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { debounce } from 'lodash-es'
import { message } from 'ant-design-vue'
import IconPlus from '@/components/icons/solid/IconPlus.vue'
import { useContract } from '@/store/contract.pinia'
import useQueryParams from '@/composables/useQueryParams'
import TemplateContractComponent from './form/ContractFormComponent.vue'
import { storeToRefs } from 'pinia'
import { useUser } from '@/store/user.pinia'

const { t } = useI18n()
const userStore = useUser()
const contractStore = useContract()
const { getQueries, setQueries } = useQueryParams()
const { user } = storeToRefs(userStore)

const props = defineProps({
  selectedRowKeys: { type: Array, default: () => [] }
})

const emit = defineEmits(['generate'])
const searchQuery = ref('')
const isGenerating = ref(false)
const contractModalVisible = ref(false)
const contractModalKey = ref(Date.now())

const handleSearch = debounce(
  async (searchValue) => {
    if (contractStore.contractLoader) return
    const trimmedSearch = searchValue?.trim() || null
    setQueries({ page: 1, search: trimmedSearch || undefined })
    try {
      await contractStore.getAllContracts(
        0,
        contractStore.contracts?.size || 10,
        trimmedSearch
      )
    } catch (error) {
      message.error(t('notification_component.error_search_contracts'))
    }
  },
  500,
  { leading: false, trailing: true }
)

const onSearch = () => {
  handleSearch(searchQuery.value)
}

const onClear = () => {
  searchQuery.value = ''
  handleSearch(null)
}

const openCreateModal = () => {
  contractModalVisible.value = true
  contractModalKey.value = Date.now()
}

const handleContractModalSuccess = () => {
  contractStore.getAllContracts()
  contractModalVisible.value = false
}

onMounted(() => {
  const queries = getQueries()
  searchQuery.value = queries.search || ''
  if (queries.search) {
    handleSearch(queries.search)
  }
})

async function handleFormatSelect({ key }) {
  if (!props.selectedRowKeys?.length) {
    message.warning(t('notification_component.error_generate_contracts'))
    return
  }
  const validKeys = props.selectedRowKeys.filter((key) => key)
  if (!validKeys.length) {
    message.error(t('ContractsView.INVALID_ID'))
    return
  }
  if (isGenerating.value) return
  isGenerating.value = true
  try {
    emit('generate', validKeys, key)
    message.success(t('ContractsView.generating'))
  } catch (error) {
    message.error(t('notification_component.error_generate_contracts'))
  } finally {
    isGenerating.value = false
  }
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/variable.scss';

.contracts-filters {
  display: flex;
  margin: 0 2px 16px 2px;
}

.btn-generate,
:deep(.ant-btn-primary) {
  background-color: $primary;
  color: white;
  &:hover {
    background-color: darken($primary, 5%);
  }
  &:active {
    background-color: darken($primary, 8%);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.count-badge {
  margin-left: 8px;
  font-size: 12px;
}
</style>
```
