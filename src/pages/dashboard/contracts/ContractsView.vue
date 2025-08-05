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
import { ref, computed, onMounted } from 'vue'
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
const contracts = computed(() => contractStore.contracts)

onMounted(() => {
  const page = parseInt(route.query.page) || 0
  const size = parseInt(route.query.size) || 10
  const search = route.query.search || null
  fetchContracts({ page, size, search })
})

async function fetchContracts({ page = 0, size = 10, search = null } = {}) {
  if (contractStore.contractLoader) return
  try {
    await contractStore.getAllContracts(page, size, search)
  } catch (error) {
    message.error(t('notification_component.error_fetch_contracts'))
  }
}

async function handleSearch(search) {
  const page = 0
  const size = contracts.value?.size || 10
  await router.push({
    query: { ...route.query, page, search: search || undefined }
  })
  await fetchContracts({ page, size, search })
}

function onSelectChange(selectedKeys) {
  selectedRowKeys.value = selectedKeys
}

async function handleSizeChange(size) {
  const page = 0
  const search = route.query.search || null
  await router.push({ query: { ...route.query, page, size } })
  await fetchContracts({ page, size, search })
}

async function handlePageChange(page) {
  const size = contracts.value?.size || 10
  const search = route.query.search || null
  const adjustedPage = page - 1
  await router.push({ query: { ...route.query, page: adjustedPage, size } })
  await fetchContracts({ page: adjustedPage, size, search })
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
.page-wrapper {
  width: 100%;
  min-height: 100vh;
}

.desktop-filters {
  display: block;
}

.mobile-filters {
  display: none;
}

@media (max-width: 864px) {
  .desktop-filters {
    display: none;
  }
  .mobile-filters {
    display: block;
  }
}
</style>
