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
        <template v-else-if="column.dataIndex === 'actions'">
          <a-space>
            <a-tooltip
              v-if="
                record.ownerId === null ||
                record.permissions.includes('READ') ||
                user?.role === 'DIRECTOR'
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
              v-if="record.ownerId === null || user?.role === 'DIRECTOR'"
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
              v-if="
                record.ownerId === null ||
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
                record.ownerId === null ||
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

    <a-modal
      :open="modalVisible"
      :title="t('VIEW_FILE')"
      width="80%"
      :body-style="{
        height: '65vh',
        overflow: 'hidden',
        background: '#fff',
        padding: 0
      }"
      :closable="true"
      @cancel="closeModal"
      wrap-class-name="custom-modal"
    >
      <a-spin
        v-if="isLoading"
        :tip="t('LOADING_FILE') || 'Fayl yuklanmoqda...'"
        style="display: block; text-align: center; padding: 20px"
      />
      <template v-else-if="errorMessage">
        <div class="error-container">
          <p>{{ errorMessage }}</p>
          <a-button v-if="fileBlob" type="primary" @click="downloadFile">
            {{ t('DOWNLOAD') || 'Yuklab olish' }}
          </a-button>
        </div>
      </template>
      <div v-else class="modal-content-wrapper">
        <div class="fields-section">
          <template-create-template-component
            v-if="fieldsModalVisible"
            ref="templateForm"
            v-model:open="fieldsModalVisible"
            :sample-id="selectedTemplateId"
            :sample-fields="selectedSampleFields"
            :modal-key="fieldsModalKey"
            @success="handleFieldsModalSuccess"
          />
        </div>
        <div class="docx-section">
          <div
            v-if="fileFormat === 'docx'"
            ref="docxContainer"
            class="docx-content"
          />
          <div v-else class="no-preview">
            <p>
              {{ t('NO_PREVIEW_AVAILABLE') || "Oldin ko'rish mumkin emas" }}
            </p>
            <a-button v-if="fileBlob" type="primary" @click="downloadFile">
              {{ t('DOWNLOAD') || 'Yuklab olish' }}
            </a-button>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="modal-footer">
          <a-button @click="closeModal">{{ t('CANCEL') }}</a-button>
          <a-button type="primary" @click="handleFieldsModalOk">{{
            t('OK')
          }}</a-button>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, nextTick, onUnmounted } from 'vue'
import { toRaw } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { debounce } from '@/utils/helpers'
import TemplateFormComponent from './form/TemplateFormComponent.vue'
import TemplateCreateTemplateComponent from './TemplateEditFieldsComponent.vue'
import PaginationComponent from '@/components/PaginationComponent.vue'
import { useTemplate } from '@/store/template.pinia'
import { useUser } from '@/store/user.pinia'
import useModal from '@/composables/useModal'
import useQueryParams from '@/composables/useQueryParams'
import { storeToRefs } from 'pinia'
import { renderAsync } from 'docx-preview'
import IconEdit from '@/components/icons/outline/IconEdit.vue'
import IconDelete from '@/components/icons/outline/IconDelete.vue'
import IconUsers from '@/components/icons/outline/IconUsers.vue'
import IconEye from '@/components/icons/outline/IconEye.vue'

const { t } = useI18n()
const { open, close } = useModal()
const router = useRouter()
const templateStore = useTemplate()
const userStore = useUser()
const { getQueries } = useQueryParams()
const { user } = storeToRefs(userStore)

const templates = computed(() => templateStore.templates)
const openingFileId = ref(null)
const modalVisible = ref(false)
const fileBlob = ref(null)
const fileFormat = ref(null)
const fileUrl = ref(null)
const isLoading = ref(false)
const errorMessage = ref(null)
const docxContainer = ref(null)
const fieldsModalVisible = ref(false)
const selectedTemplateId = ref(null)
const selectedSampleFields = ref([])
const fieldsModalKey = ref(Date.now())
const templateForm = ref(null) 

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
  if (!isVisible || fileFormat.value !== 'docx' || !fileBlob.value) return
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
      inWrapper: true,
      breakPages: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true
    })
    message.success(t('notification_component.file_opened_successfully'))
  } catch (error) {
    errorMessage.value = t(
      error.message?.includes('container')
        ? 'CONTAINER_ERROR'
        : error.message?.includes('empty')
          ? 'EMPTY_FILE_ERROR'
          : 'DOCX_RENDER_ERROR'
    )
    message.error(errorMessage.value)
  }
})

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

const deleteTemplate = async (record) => {
  if (templateStore.templateLoader || !record?.id) return
  try {
    await templateStore.deleteTemplate(record.id)
    message.success(t('TemplatesView.deleted'))
  } catch (error) {
    message.error(t('notification_component.error'))
  }
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

const openFile = async (record) => {
  if (
    !record?.id ||
    openingFileId.value === record.id ||
    templateStore.templateLoader
  )
    return
  openingFileId.value = record.id
  isLoading.value = true
  errorMessage.value = null
  fileBlob.value = null
  fileFormat.value = null
  fileUrl.value = null
  fieldsModalVisible.value = false
  selectedTemplateId.value = null
  selectedSampleFields.value = []
  try {
    const result = await templateStore.openFile(record.id)
    if (!result?.blob) throw new Error('No blob in store result')
    if (result.blob.size === 0) throw new Error('Received empty file blob')
    const mimeType =
      result.mimeType ||
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    fileFormat.value =
      mimeType.includes('wordprocessingml') || mimeType.includes('docx')
        ? 'docx'
        : mimeType.includes('pdf')
          ? 'pdf'
          : 'unknown'
    fileBlob.value = result.blob
    if (fileFormat.value === 'pdf') {
      fileUrl.value = URL.createObjectURL(result.blob)
    }
    try {
      const fields = await templateStore.getSampleFields(record.id)
      selectedTemplateId.value = record.id
      selectedSampleFields.value = fields?.sampleFields || []
      fieldsModalKey.value = Date.now()
      if (fields?.sampleFields?.length > 0) {
        fieldsModalVisible.value = true
      } else {
        message.warning(t('ContractsView.noFields'))
      }
    } catch (error) {
      message.error(t('notification_component.error_fetch_fields'))
    }
    modalVisible.value = true
  } catch (error) {
    errorMessage.value = t(
      error.response?.status === 404
        ? 'FILE_NOT_FOUND'
        : error.response?.status === 403
          ? 'ACCESS_DENIED'
          : error.response?.status === 500
            ? 'SERVER_ERROR'
            : error.message?.includes('Network') ||
                error.code === 'NETWORK_ERROR'
              ? 'NETWORK_ERROR'
              : error.message?.includes('empty')
                ? 'EMPTY_FILE'
                : error.message?.includes('blob')
                  ? 'FILE_DATA_ERROR'
                  : 'FILE_OPEN_ERROR'
    )
    message.error(errorMessage.value)
    modalVisible.value = true
  } finally {
    isLoading.value = false
    openingFileId.value = null
  }
}

const handleFieldsModalOk = async () => {
  if (!templateForm.value || !templateForm.value.formState) {
    message.error(t('FORM_STATE_NOT_FOUND') || 'Form state not found')
    return
  }
  try {
    const payload = toRaw(templateForm.value.formState).map((field) => ({
      id: field.id,
      keyName: field.keyName,
      fieldType: field.fieldType,
      isRequired: field.isRequired,
      fieldReplaceType: field.fieldReplaceType
    }))
    await templateStore.editTemplateFields(selectedTemplateId.value, payload)
    message.success(t('notification_component.success'))
    closeModal()
  } catch (error) {
    message.error(
      error.response?.data?.message || t('notification_component.error')
    )
  }
}

const closeModal = () => {
  modalVisible.value = false
  fieldsModalVisible.value = false
  fileBlob.value = null
  fileFormat.value = null
  errorMessage.value = null
  selectedTemplateId.value = null
  selectedSampleFields.value = []
  if (fileUrl.value) {
    URL.revokeObjectURL(fileUrl.value)
    fileUrl.value = null
  }
  if (docxContainer.value) docxContainer.value.innerHTML = ''
}

const handleFieldsModalSuccess = () => {
  templateStore.getAllTemplates({
    page: templates.value?.page || 0,
    size: templates.value?.size || 10
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

.error-container,
.no-preview {
  text-align: center;
  padding: 20px;
}

.modal-content-wrapper {
  display: flex;
  height: 100%;
  width: 100%;
}

.fields-section {
  width: 30%;
  height: 100%;
  overflow-y: auto;
  background: #f9fafb;
}

.docx-section {
  width: 70%;
  height: 100%;
  overflow-y: auto;
  border-left: 1px solid #e8e8e8;
}

.docx-content {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background: #fff;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px;
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

:deep(.custom-modal .ant-modal-content) {
  background: #fff;
  box-shadow: none;
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
}

:deep(.docx-wrapper) {
  font-family: 'Times New Roman', serif;
  line-height: 1.4;
  background: #fff;
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
