<template>
  <div class="template-table">
    <a-table
      :columns="columns"
      :data-source="templates?.content || []"
      :loading="templateStore.templateLoader"
      :pagination="false"
      size="middle"
      bordered
      :scroll="{ x: 800 }"
      row-key="id"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.dataIndex === 'ni'">
          {{ index + 1 + (templates?.page * templates?.size || 0) }}
        </template>
        <template v-else-if="column.dataIndex === 'name'">
          <span>{{ record.name }}</span>
        </template>
        <template v-else-if="column.dataIndex === 'contract'">
          <a-space>
            <a-button
              type="primary"
              :disabled="templateStore.templateLoader"
              @click="openContractModal(record)"
            >
              <icon-document />
              {{ t('ContractsView.create') }}
            </a-button>
          </a-space>
        </template>
        <template v-else-if="column.dataIndex === 'actions'">
          <a-space>
            <a-tooltip
              v-if="
                record.permissions.includes('READ') || user?.role === 'DIRECTOR'
              "
              :title="t('VIEW')"
            >
              <a-button
                :loading="openingFileId === record.id"
                :disabled="templateStore.templateLoader"
                @click="openFile(record)"
              >
                <template #icon><icon-eye /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip
              v-if="user?.role === 'DIRECTOR'"
              :title="t('PermissionsView.title')"
            >
              <a-button
                :disabled="templateStore.templateLoader"
                @click="openPermissionsPage(record.id)"
              >
                <template #icon><icon-users /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip
              v-if="user?.role === 'DIRECTOR'"
              :title="t('TemplatesView.edit_fields')"
            >
              <a-button
                :disabled="templateStore.templateLoader"
                @click="openFieldsModal(record)"
              >
                <template #icon><icon-ellipsis /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip
              v-if="
                record.permissions.includes('UPDATE') ||
                user?.role === 'DIRECTOR'
              "
              :title="t('EDIT')"
            >
              <a-button
                :disabled="templateStore.templateLoader"
                @click="editTemplate(record)"
              >
                <template #icon><icon-edit /></template>
              </a-button>
            </a-tooltip>
            <a-popconfirm
              v-if="
                record.permissions.includes('DELETE') ||
                user?.role === 'DIRECTOR'
              "
              :title="t('SURE_DELETE')"
              :description="`${record.name} ${t('SURE_DELETE')}`"
              :ok-text="t('OK')"
              :cancel-text="t('CANCEL')"
              placement="topRight"
              @confirm="deleteTemplate(record)"
            >
              <a-tooltip :title="t('DELETE')">
                <a-button danger :disabled="templateStore.templateLoader">
                  <template #icon><icon-delete /></template>
                </a-button>
              </a-tooltip>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <pagination-component
      v-if="templates?.totalElements && templates.totalElements > 0"
      :total="templates.totalElements"
      :page="(templates.page || 0) + 1"
      :size="templates.size || 10"
      :disabled="templateStore.templateLoader"
      @change-size="handleSizeChange"
      @on-change="handlePageChange"
    />

    <template-contract-component
      v-model:open="contractModalVisible"
      :sample-id="selectedTemplateId"
      :sample-fields="selectedSampleFields"
      :modal-key="contractModalKey"
      @success="handleContractModalSuccess"
    />

    <template-create-template-component
      v-model:open="fieldsModalVisible"
      :sample-id="selectedTemplateId"
      :sample-fields="selectedSampleFields"
      :modal-key="fieldsModalKey"
      @success="handleFieldsModalSuccess"
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
      <a-spin
        v-if="isLoading"
        :tip="t('LOADING_FILE') || 'Fayl yuklanmoqda...'"
      />

      <template v-else-if="errorMessage">
        <div class="error-container">
          <p>{{ errorMessage }}</p>
          <a-button v-if="fileBlob" type="primary" @click="downloadFile">
            {{ t('DOWNLOAD') || 'Yuklab olish' }}
          </a-button>
        </div>
      </template>

      <div
        v-else-if="fileFormat === 'docx'"
        ref="docxContainer"
        class="docx-content"
      />

      <div v-else class="no-preview">
        <p>{{ t('NO_PREVIEW_AVAILABLE') || "Oldin ko'rish mumkin emas" }}</p>
        <a-button v-if="fileBlob" type="primary" @click="downloadFile">
          {{ t('DOWNLOAD') || 'Yuklab olish' }}
        </a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, nextTick, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { debounce } from '@/utils/helpers'
import TemplateFormComponent from './form/TemplateFormComponent.vue'
import TemplateContractComponent from './TemplateContractComponent.vue'
import TemplateCreateTemplateComponent from './TemplateEditFieldsComponent.vue'
import useModal from '@/composables/useModal'
import { useTemplate } from '@/store/template.pinia'
import { useContract } from '@/store/contract.pinia'
import { useUser } from '@/store/user.pinia'
import useQueryParams from '@/composables/useQueryParams'
import { storeToRefs } from 'pinia'
import { renderAsync } from 'docx-preview'

const { t } = useI18n()
const { open, close } = useModal()
const router = useRouter()
const templateStore = useTemplate()
const contractStore = useContract()
const userStore = useUser()
const { getQueries } = useQueryParams()
const { user } = storeToRefs(userStore)

const templates = computed(() => templateStore.templates)
const contractModalVisible = ref(false)
const fieldsModalVisible = ref(false)
const selectedTemplateId = ref(null)
const selectedSampleFields = ref([])
const contractModalKey = ref(Date.now())
const fieldsModalKey = ref(Date.now())

const openingFileId = ref(null)
const modalVisible = ref(false)
const fileBlob = ref(null)
const fileFormat = ref(null)
const fileUrl = ref(null)
const isLoading = ref(false)
const errorMessage = ref(null)
const docxContainer = ref(null)

const columns = [
  {
    title: '№',
    dataIndex: 'ni',
    width: 80,
    align: 'center'
  },
  {
    title: t('TemplatesView.name'),
    dataIndex: 'name',
    ellipsis: true
  },
  {
    title: '',
    dataIndex: 'contract',
    width: 250,
    align: 'center'
  },
  {
    title: '',
    dataIndex: 'actions',
    width: 300,
    align: 'center'
  }
]

const handleSizeChange = debounce((size) => {
  const currentPage = templates.value?.page || 0
  templateStore.getAllTemplates({ page: currentPage, size })
}, 300)

const handlePageChange = debounce((page) => {
  const currentSize = templates.value?.size || 10
  templateStore.getAllTemplates({ page: page - 1, size: currentSize })
}, 300)

watch(
  () => getQueries().search,
  (newSearch) => {
    const currentSize = templates.value?.size || 10
    templateStore.getAllTemplates({
      page: 0,
      size: currentSize,
      search: newSearch || ''
    })
  },
  { immediate: true }
)

watch(modalVisible, async (isVisible) => {
  if (!isVisible) {
    return
  }

  if (fileFormat.value !== 'docx' || !fileBlob.value) {
    return
  }

  try {
    await nextTick()

    if (!docxContainer.value) {
      throw new Error('DOCX container element not found')
    }

    docxContainer.value.innerHTML = ''

    const arrayBuffer = await fileBlob.value.arrayBuffer()

    if (arrayBuffer.byteLength === 0) {
      throw new Error('File is empty')
    }

    await renderAsync(arrayBuffer, docxContainer.value, null, {
      className: 'docx-wrapper',
      Old: true,
      inWrapper: true,
      ignoreFonts: false,
      breakPages: true,
      ignoreWidth: false,
      ignoreHeight: false,
      renderChanges: false,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      useBase64URL: false,
      trimXmlDeclaration: true
    })

    message.success(t('FILE_OPENED_SUCCESSFULLY'))
  } catch (error) {
    if (error.message?.includes('container')) {
      errorMessage.value = t('CONTAINER_ERROR') || 'Konteyner xatoligi'
    } else if (error.message?.includes('empty')) {
      errorMessage.value = t('EMPTY_FILE_ERROR') || "Fayl bo'sh yoki buzilgan"
    } else {
      errorMessage.value =
        t('DOCX_RENDER_ERROR') || "Hujjatni ko'rsatishda xatolik"
    }

    message.error(errorMessage.value)
  }
})

const openFile = async (record) => {
  if (
    !record?.id ||
    openingFileId.value === record.id ||
    templateStore.templateLoader
  ) {
    return
  }

  openingFileId.value = record.id
  isLoading.value = true
  errorMessage.value = null
  fileBlob.value = null
  fileFormat.value = null
  fileUrl.value = null

  try {
    const result = await templateStore.openFile(record.id)

    if (!result) {
      throw new Error('Store method returned null/undefined')
    }

    if (!result.blob) {
      throw new Error('No blob in store result')
    }

    if (result.blob.size === 0) {
      throw new Error('Received empty file blob')
    }

    const mimeType =
      result.mimeType ||
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    if (mimeType.includes('wordprocessingml') || mimeType.includes('docx')) {
      fileFormat.value = 'docx'
    } else if (mimeType.includes('pdf')) {
      fileFormat.value = 'pdf'
      fileUrl.value = URL.createObjectURL(result.blob)
    } else {
      fileFormat.value = 'unknown'
    }

    fileBlob.value = result.blob
    modalVisible.value = true
  } catch (error) {
    if (error.response?.status === 404) {
      errorMessage.value = t('FILE_NOT_FOUND') || 'Fayl topilmadi'
    } else if (error.response?.status === 403) {
      errorMessage.value = t('ACCESS_DENIED') || 'Ruxsat berilmagan'
    } else if (error.response?.status === 500) {
      errorMessage.value = t('SERVER_ERROR') || 'Server xatoligi'
    } else if (
      error.message?.includes('Network') ||
      error.code === 'NETWORK_ERROR'
    ) {
      errorMessage.value = t('NETWORK_ERROR') || 'Tarmoq xatoligi'
    } else if (error.message?.includes('empty')) {
      errorMessage.value = t('EMPTY_FILE') || "Fayl bo'sh"
    } else if (error.message?.includes('blob')) {
      errorMessage.value = t('FILE_DATA_ERROR') || "Fayl ma'lumotlari xato"
    } else {
      errorMessage.value = `${t('FILE_OPEN_ERROR')}`
    }

    message.error(errorMessage.value)
    modalVisible.value = true
  } finally {
    isLoading.value = false
    openingFileId.value = null
  }
}

const closeModal = () => {
  modalVisible.value = false
  fileBlob.value = null
  fileFormat.value = null
  errorMessage.value = null

  if (fileUrl.value) {
    URL.revokeObjectURL(fileUrl.value)
    fileUrl.value = null
  }

  if (docxContainer.value) {
    docxContainer.value.innerHTML = ''
  }
}

const downloadFile = () => {
  if (!fileBlob.value) {
    message.error(
      t('NO_FILE_TO_DOWNLOAD') || 'Yuklab olish uchun fayl mavjud emas'
    )
    return
  }

  try {
    const url = URL.createObjectURL(fileBlob.value)
    const link = document.createElement('a')

    const extension =
      fileFormat.value === 'docx'
        ? 'docx'
        : fileFormat.value === 'pdf'
          ? 'pdf'
          : 'file'
    const filename = `template_${selectedTemplateId.value || Date.now()}.${extension}`

    link.href = url
    link.download = filename
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setTimeout(() => URL.revokeObjectURL(url), 100)

    message.success(t('DOWNLOAD_STARTED') || 'Yuklab olish boshlandi')
  } catch (error) {
    message.error(t('DOWNLOAD_FAILED') || 'Yuklab olishda xatolik')
  }
}

const openContractModal = async (template) => {
  if (!template?.id || templateStore.templateLoader) return
  try {
    const fields = await templateStore.getSampleFields(template.id)
    if (!fields?.sampleFields || fields.sampleFields.length === 0) {
      message.warning(t('ContractsView.noFields'))
      return
    }
    selectedTemplateId.value = template.id
    selectedSampleFields.value = fields.sampleFields
    contractModalKey.value = Date.now()
    contractModalVisible.value = true
  } catch (error) {
    message.error(t('notification_component.error_fetch_fields'))
  }
}

const openFieldsModal = async (template) => {
  if (!template?.id || templateStore.templateLoader) return

  try {
    const fields = await templateStore.getSampleFields(template.id)
    selectedTemplateId.value = template.id
    selectedSampleFields.value = fields?.sampleFields || []
    fieldsModalKey.value = Date.now()
    if (!fields?.sampleFields || fields.sampleFields.length === 0) {
      message.warning(t('ContractsView.noFields'))
      return
    }
    fieldsModalVisible.value = true
  } catch (error) {
    message.error(t('notification_component.error_fetch_fields'))
  }
}

const deleteTemplate = async (record) => {
  if (templateStore.templateLoader || !record?.id) return
  try {
    await templateStore.deleteTemplate(record.id)
    message.success(t('TemplatesView.deleted'))
  } catch (error) {
    message.error(t('notification_component.error'))
  }
}

const handleContractModalSuccess = () => {
  const currentPage = templates.value?.page || 0
  const currentSize = templates.value?.size || 10
  templateStore.getAllTemplates({
    page: currentPage,
    size: currentSize
  })
  contractStore.getAllContracts()
}

const handleFieldsModalSuccess = () => {
  const currentPage = templates.value?.page || 0
  const currentSize = templates.value?.size || 10
  templateStore.getAllTemplates({
    page: currentPage,
    size: currentSize
  })
}

const openPermissionsPage = (sampleId) => {
  if (templateStore.templateLoader || !sampleId) return
  router.push(`/dashboard/templates/permissions/${sampleId}`)
}

const editTemplate = (template) => {
  if (templateStore.templateLoader || !template?.id) {
    message.error('Invalid template or operation in progress')
    return
  }
  const modalKey = Date.now()
  open({
    title: t('TemplatesView.edit'),
    width: 800,
    component: TemplateFormComponent,
    props: {
      templateData: { ...template },
      modalKey,
      readonly: false
    },
    emits: {
      submit: ({ modalKey: key }) => {
        close(key)
        const currentPage = templates.value?.page || 0
        const currentSize = templates.value?.size || 10
        templateStore.editTemplate({
          page: currentPage,
          size: currentSize
        })
      },
      cancel: ({ modalKey: key }) => {
        close(key)
      }
    }
  })
}

onMounted(() => {
  if (!templates.value?.content?.length) {
    templateStore.getAllTemplates({ page: 0, size: 10 })
  }
})

onUnmounted(() => {
  if (fileUrl.value) {
    URL.revokeObjectURL(fileUrl.value)
  }
})
</script>

<style scoped lang="scss">
@import '@/assets/styles/variable.scss';

.template-table {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.error-container {
  text-align: center;
  padding: 20px;
}

.pdf-container {
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.no-preview {
  text-align: center;
  padding: 40px;
}

:deep(.ant-btn-primary) {
  background-color: $primary;
  border-color: $primary;
  &:hover:not(:disabled) {
    background-color: darken($primary, 5%);
    border-color: darken($primary, 5%);
  }
  &:active:not(:disabled) {
    background-color: darken($primary, 8%);
    border-color: darken($primary, 8%);
  }
}

:deep(.ant-table-thead > tr > th) {
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
}

:deep(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid #e8e8e8;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f9fafb;
}

:deep(.ant-btn) {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
  min-height: 32px;
}

:deep(.ant-space) {
  gap: 8px !important;
}

:deep(.ant-table-cell) {
  padding: 12px 16px;
}

.docx-content {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 2px;
  background: #fff;
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
  word-wrap: break-word;
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

:deep(.docx-wrapper h1, .docx-wrapper h2, .docx-wrapper h3) {
  margin: 16px 0 8px 0;
  font-weight: bold;
}

:deep(.docx-wrapper ul, .docx-wrapper ol) {
  margin: 8px 0;
  padding-left: 20px;
}
</style>
