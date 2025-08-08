<template>
  <div class="page-wrapper">
    <page-header :title="t('document_title.ContractsView')">
      <template #actions>
        <div class="desktop-filters">
          <contract-filter-component
            :selected-row-keys="selectedRowKeys"
            @generate="generateContracts"
            @search="handleSearch"
          />
        </div>
      </template>
    </page-header>

    <div class="mobile-filters">
      <contract-filter-component
        :selected-row-keys="selectedRowKeys"
        @generate="generateContracts"
        @search="handleSearch"
      />
    </div>

    <contract-table-component
      :contracts="contracts"
      :contract-loader="contractLoader"
      :selected-row-keys="selectedRowKeys"
      @update:selected-row-keys="onSelectChange"
      @edit-contract="editContract"
      @delete-contract="deleteContract"
      @change-size="handleSizeChange"
      @change-page="handlePageChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import PageHeader from '@/components/PageHeaderComponent.vue'
import ContractFilterComponent from './components/ContractFilterComponent.vue'
import ContractTableComponent from './components/ContractTableComponent.vue'
import ContractForm from './components/form/ContractFormComponent.vue'
import useModal from '@/composables/useModal'
import { useContract } from '@/store/contract.pinia'
import { useDownload } from '@/store/download.pinia'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { open } = useModal()
const contractStore = useContract()
const downloadStore = useDownload()

const selectedRowKeys = ref([])
const contractLoader = computed(() => contractStore.contractLoader)
const contracts = computed(
  () =>
    contractStore.contracts || {
      content: [],
      page: 0,
      size: 10,
      totalElements: 0
    }
)

const fetchContracts = async (page = 0, size = 10, search = null) => {
  if (contractStore.contractLoader) return
  try {
    await contractStore.getAllContracts(page, size, search)
  } catch (error) {
    message.error(t('notification_component.error_fetch_contracts'))
    console.error('Fetch contracts error:', error)
  }
}

const syncQueryParams = async () => {
  const page = parseInt(route.query.page, 10) || 1
  const size = parseInt(route.query.size, 10) || 10
  const search = route.query.search || null
  const backendPage = Math.max(0, page - 1)

  if (
    !contracts.value?.content ||
    contracts.value.content.length === 0 ||
    backendPage !== contracts.value.page ||
    size !== contracts.value.size ||
    search !== route.query.search
  ) {
    await fetchContracts(backendPage, size, search)
  }
}

onMounted(() => {
  syncQueryParams()
})

watch(
  () => route.query,
  () => syncQueryParams(),
  { deep: true }
)

async function handleSearch(search) {
  try {
    await router.push({
      query: { ...route.query, page: 1, search: search || undefined }
    })
    await fetchContracts(0, contracts.value?.size || 10, search)
  } catch (error) {
    message.error(t('notification_component.error_updating_pagination'))
    console.error('Search error:', error)
  }
}

function onSelectChange(selectedKeys) {
  selectedRowKeys.value = selectedKeys
}

async function handleSizeChange(size) {
  try {
    await router.push({ query: { ...route.query, page: 1, size } })
    await fetchContracts(0, size, route.query.search || null)
  } catch (error) {
    message.error(t('notification_component.error_updating_pagination'))
    console.error('Page size change error:', error)
  }
}

async function handlePageChange(page) {
  try {
    await router.push({ query: { ...route.query, page } })
    await fetchContracts(
      page - 1,
      contracts.value?.size || 10,
      route.query.search || null
    )
  } catch (error) {
    message.error(t('notification_component.error_updating_pagination'))
    console.error('Page change error:', error)
  }
}

function editContract(contract) {
  if (!contract?.id) {
    message.error(t('ContractsView.INVALID_ID'))
    return
  }
  open({
    title: t('ContractsView.edit'),
    width: 800,
    component: ContractForm,
    type: 'contract-form',
    props: { contractData: contract }
  })
}

async function deleteContract(contractId) {
  if (!contractId) {
    message.error(t('ContractsView.INVALID_ID'))
    return
  }
  try {
    await contractStore.deleteContract(contractId)
    selectedRowKeys.value = selectedRowKeys.value.filter(
      (id) => id !== contractId
    )
    message.success(t('ContractsView.deleted'))
  } catch (error) {
    message.error(
      error.response?.data?.message ||
        t('notification_component.error_delete_contract')
    )
  }
}

async function generateContracts(selectedContractIds, format) {
  if (!selectedContractIds?.length) {
    message.error(t('notification_component.error_generate_contracts'))
    return
  }
  const validContractIds = selectedContractIds.filter((id) => id)
  if (!validContractIds.length) {
    message.error(t('ContractsView.INVALID_ID'))
    return
  }
  try {
    const payload = {
      documentationIds: validContractIds,
      format
    }
    await downloadStore.createDownloadInfo(payload, route.query.status || null)
    message.success(t('ContractsView.generated'))
    selectedRowKeys.value = []
  } catch (error) {
    message.error(
      error.response?.data?.message ||
        t('notification_component.error_generate_contracts')
    )
  }
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/variable.scss';

.page-wrapper {
  width: 100%;
  min-height: 100vh;
  margin-bottom: 32px;
}

.desktop-filters {
  display: block;
}

.mobile-filters {
  display: none;
}

@media (max-width: 1264px) {
  .desktop-filters {
    display: none;
  }
  .mobile-filters {
    display: block;
  }
}
</style>
