<template>
  <div class="organization-table">
    <page-header
      :title="t('document_title.OrganizationContractsView')"
      @back="() => router.push('/dashboard/organizations')"
    >
      <template #actions>
        <organization-filter-component class="desktop-filters" />
      </template>
    </page-header>

    <organization-filter-component class="mobile-filters" />

    <a-table
      :columns="columns"
      :data-source="contracts?.content || []"
      :loading="contractLoader"
      :pagination="false"
      size="middle"
      bordered
      :scroll="{ x: 600 }"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.dataIndex === 'ni'">
          {{ index + 1 + (contracts?.page * contracts?.size || 0) }}
        </template>

        <template v-if="column.dataIndex === 'name'">
          {{ record.name || t('NO_DATA') }}
        </template>

        <template v-if="column.dataIndex === 'sample'">
          {{ record.sample?.name || t('NO_DATA') }}
        </template>

        <template v-if="column.dataIndex === 'actions'">
          <a-dropdown :trigger="['click']" placement="bottomRight">
            <a-space>
              <a-button :loading="openingFileId === record.id">
                <icon-eye />
              </a-button>
            </a-space>
            <template #overlay>
              <a-menu @click="({ key }) => openFile(record, key)">
                <a-menu-item key="pdf">
                  {{ t('PDF') }}
                </a-menu-item>
                <a-menu-item key="docx">
                  {{ t('DOCX') }}
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </template>
      </template>
    </a-table>

    <pagination-component
      v-if="contracts?.totalElements > 0"
      :total="contracts?.totalElements"
      :current="Number(contracts?.page ?? 0) + 1"
      :page-size="contracts?.size || 10"
      :disabled="contractLoader"
      @change="handlePageChange"
      @change-size="handleSizeChange"
    />
    <a-modal
      :open="modalVisible"
      :title="t('VIEW_FILE')"
      width="80%"
      :body-style="{ height: '80vh', overflow: 'auto', background: '#fff' }"
      :footer="null"
      :closable="true"
      @cancel="closeModal"
      wrap-class-name="custom-modal"
    >
      <a-spin v-if="isLoading" :tip="t('LOADING_FILE')" />
      <template v-else-if="errorMessage">
        <p>{{ errorMessage }}</p>
        <a-button v-if="fileBlob" type="primary" @click="downloadFile">
          {{ t('DOWNLOAD_FILE') }}
        </a-button>
      </template>
      <iframe
        v-else-if="fileFormat === 'pdf' && fileUrl"
        :src="fileUrl"
        class="pdf-iframe"
      />
      <div
        v-else-if="fileFormat === 'docx'"
        ref="docxContainer"
        class="docx-content"
      />
      <div v-else>
        <p>{{ t('NO_FILE_AVAILABLE') }}</p>
        <a-button v-if="fileBlob" type="primary" @click="downloadFile">
          {{ t('DOWNLOAD_FILE') }}
        </a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import PaginationComponent from '@/components/PaginationComponent.vue'
import IconEye from '@/components/icons/outline/IconEye.vue'
import { useContract } from '@/store/contract.pinia'
import OrganizationFilterComponent from './components/OrganizationContractsFilterComponent.vue'
import PageHeader from '@/components/PageHeaderComponent.vue'
import { renderAsync } from 'docx-preview'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const contractStore = useContract()

const openingFileId = ref(null)
const organizationId = computed(() => route.params.organizationId)
const contracts = computed(
  () =>
    contractStore.contracts || {
      content: [],
      page: 0,
      size: 10,
      totalElements: 0
    }
)
const contractLoader = computed(() => contractStore.contractLoader || false)
const modalVisible = ref(false)
const fileUrl = ref(null)
const fileFormat = ref(null)
const fileBlob = ref(null)
const isLoading = ref(false)
const errorMessage = ref(null)
const docxContainer = ref(null)

const columns = [
  { title: '№', dataIndex: 'ni', width: 80, align: 'center' },
  { title: t('ContractsView.name'), dataIndex: 'name' },
  { title: t('TemplatesView.title'), dataIndex: 'sample', align: 'center' },
  { title: '', dataIndex: 'actions', width: 120, align: 'center' }
]

const fetchContracts = async (page = 0, size = 10, search = null) => {
  if (!organizationId.value) {
    message.error(t('notification_component.organization_not_selected'))
    return
  }
  try {
    console.log('Fetching contracts with:', {
      page,
      size,
      search,
      organizationId: organizationId.value
    })
    await contractStore.getAllOrganizationContracts(
      page,
      size,
      search,
      organizationId.value
    )
    console.log('Fetch successful, contracts:', contractStore.contracts)
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
  } else {
    console.log('Skipping fetch, contracts already loaded:', contracts.value)
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

watch(modalVisible, async (val) => {
  if (!val) {
    closeModal()
    return
  }
  if (
    val &&
    fileFormat.value === 'docx' &&
    fileBlob.value &&
    docxContainer.value
  ) {
    try {
      isLoading.value = true
      const buffer = await fileBlob.value.arrayBuffer()
      await renderAsync(buffer, docxContainer.value, null, {
        className: 'docx-wrapper',
        inWrapper: true,
        ignoreFonts: false,
        breakPages: false,
        trimXmlDeclaration: true
      })
      message.success(t('notification_component.file_opened_successfully'))
    } catch (error) {
      errorMessage.value = t('DOCX_RENDER_ERROR') || 'Error rendering DOCX file'
      console.error('DOCX render error:', error)
    } finally {
      isLoading.value = false
    }
  }
})

const handleSizeChange = async (size) => {
  try {
    await router.push({ query: { ...route.query, size, page: 1 } })
    await fetchContracts(0, size, route.query.search || null)
  } catch (error) {
    message.error(t('notification_component.error_updating_pagination'))
    console.error('Page size change error:', error)
  }
}

const handlePageChange = async (page) => {
  try {
    await router.push({ query: { ...route.query, page } })
    await fetchContracts(
      page - 1,
      contracts.value.size,
      route.query.search || null
    )
  } catch (error) {
    message.error(t('notification_component.error_updating_pagination'))
    console.error('Page change error:', error)
  }
}

const openFile = async (record, format) => {
  if (!record?.id || !['pdf', 'docx'].includes(format)) {
    message.error(t('notification_component.invalid_file_format'))
    return
  }
  if (openingFileId.value === record.id) return
  openingFileId.value = record.id
  isLoading.value = true
  errorMessage.value = null
  fileFormat.value = format

  try {
    const { blob } = await contractStore.openContractFile(record.id, format)
    if (!blob) throw new Error('No blob received')
    fileBlob.value = blob
    fileUrl.value = URL.createObjectURL(blob)
    modalVisible.value = true
    message.success(t('notification_component.file_opened_successfully'))
  } catch (error) {
    errorMessage.value =
      t('notification_component.error') || 'Failed to open file'
    message.error(errorMessage.value)
    console.error('Open file error:', error)
  } finally {
    isLoading.value = false
    openingFileId.value = null
  }
}

const closeModal = () => {
  modalVisible.value = false
  if (fileUrl.value) {
    URL.revokeObjectURL(fileUrl.value)
  }
  fileUrl.value = null
  fileFormat.value = null
  fileBlob.value = null
  errorMessage.value = null
  if (docxContainer.value) {
    docxContainer.value.innerHTML = ''
  }
}

const downloadFile = () => {
  if (!fileBlob.value || !fileFormat.value) {
    message.error(t('notification_component.no_file_to_download'))
    return
  }
  try {
    contractStore.downloadFile(
      fileBlob.value,
      `contract_${Date.now()}.${fileFormat.value}`
    )
    message.success(t('notification_component.download_started'))
  } catch (error) {
    message.error(t('notification_component.download_failed'))
    console.error('Download error:', error)
  }
}
</script>

<style scoped>
.organization-table {
  background: #fff;
  margin-bottom: 16px;
}
.desktop-filters {
  display: block;
}
.mobile-filters {
  display: none;
  margin-bottom: 16px;
}
@media (max-width: 1200px) {
  .desktop-filters {
    display: none;
  }
  .mobile-filters {
    display: block;
  }
}
.pdf-iframe,
.docx-content {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}
.docx-content {
  overflow-y: auto;
  padding: 2px;
}
:deep(.ant-table-thead > tr > th) {
  background: #f8fafc;
  font-weight: 600;
}
:deep(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid #f1f5f9;
}
:deep(.ant-table-tbody > tr:hover > td) {
  background: #f8fafc;
}
:deep(.ant-btn) {
  display: flex;
  align-items: center;
  gap: 8px;
}
:deep(.ant-dropdown-menu) {
  min-width: 100px;
}
:deep(.ant-dropdown-menu-item) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
}
:deep(.custom-modal .ant-modal-content) {
  background: #fff;
  box-shadow: none;
  padding: 0;
}
:deep(.custom-modal .ant-modal-header) {
  background: #fff;
  border-bottom: none;
  padding: 16px;
}
:deep(.custom-modal .ant-modal-close) {
  top: 16px;
  right: 16px;
}
:deep(.custom-modal .ant-modal-body) {
  flex: 1;
  overflow: hidden;
  background: #fff;
  padding: 16px;
}
:deep(.docx-wrapper) {
  font-family: 'Times New Roman', serif;
  line-height: 1.4;
  background: #fff;
  padding: 0;
  max-width: 100%;
}
:deep(.docx-wrapper p) {
  margin: 8px 0;
  text-align: justify;
}
:deep(.docx-wrapper table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
}
:deep(.docx-wrapper table td, .docx-wrapper table th) {
  border: 1px solid #333;
  padding: 4px 8px;
}
</style>
