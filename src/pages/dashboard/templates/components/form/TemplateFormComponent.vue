<template>
  <a-form
    :model="formState"
    layout="vertical"
    @finish="handleSubmit"
    :disabled="readonly"
  >
    <a-form-item
      :label="t('TemplatesView.name')"
      name="name"
      :rules="[{ required: true, message: t('TemplatesView.REQUIRED_NAME') }]"
    >
      <a-input
        v-model:value="formState.name"
        :placeholder="t('TemplatesView.enter_name')"
      />
    </a-form-item>
    <a-form-item
      v-if="!readonly"
      :label="t('TemplatesView.file')"
      name="file"
      :rules="[
        {
          required: !props.templateData,
          message: t('TemplatesView.REQUIRED_FILE')
        }
      ]"
    >
      <a-upload
        v-model:file-list="fileList"
        name="file"
        :multiple="false"
        :maxCount="1"
        :custom-request="customUploadRequest"
        :show-upload-list="{ showRemoveIcon: true }"
        accept=".docx"
        @change="handleFileChange"
      >
        <a-button type="primary" :loading="loading">
          <icon-upload />
          {{ t('TemplatesView.UploadFile') }}
        </a-button>
      </a-upload>
    </a-form-item>
    <div class="form-actions">
      <a-button @click="closeModal">{{ t('CANCEL') }}</a-button>
      <a-button
        v-if="!readonly"
        type="primary"
        html-type="submit"
        :loading="loading"
      >
        {{ t('SAVE') }}
      </a-button>
    </div>
  </a-form>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import useModal from '@/composables/useModal'
import IconUpload from '@/components/icons/outline/IconUpload.vue'
import { useTemplate } from '@/store/template.pinia'

const { t } = useI18n()
const { close } = useModal()
const templateStore = useTemplate()
const props = defineProps({
  templateData: Object,
  modalKey: Number,
  readonly: Boolean
})
const loading = ref(false)
const formState = reactive({ name: '', file: null })
const fileList = ref([])

watch(
  () => props.templateData,
  (newData) => {
    formState.name = newData?.name || ''
    formState.file = null
    fileList.value = newData?.file
      ? [{ name: newData.file, status: 'done', uid: '-1' }]
      : []
  },
  { immediate: true }
)

const closeModal = () => close(props.modalKey)

const customUploadRequest = ({ file, onSuccess }) => {
  loading.value = true
  formState.file = file
  setTimeout(() => {
    onSuccess()
    loading.value = false
  }, 1000)
}

const handleFileChange = ({ fileList: newFileList }) => {
  fileList.value = newFileList.map((file) => ({
    ...file,
    status: file.status || 'done'
  }))
  formState.file = newFileList.length ? newFileList[0].originFileObj : null
}

const handleSubmit = async () => {
  loading.value = true
  try {
    const name = formState.name.trim()
    if (!name) {
      message.error(t('TemplatesView.REQUIRED_NAME'))
      return
    }

    const formData = new FormData()
    formData.append('name', name)
    if (formState.file) {
      formData.append('file', formState.file)
    }

    if (props.templateData) {
      if (!props.templateData.id) {
        message.error('Template ID is required')
        return
      }
      console.log('Editing template:', {
        id: props.templateData.id,
        name,
        file: formState.file
      })
      await templateStore.editTemplate(props.templateData.id, formData)
    } else {
      if (!formState.file) {
        message.error(t('TemplatesView.REQUIRED_FILE'))
        return
      }
      console.log('Creating template:', { name, file: formState.file })
      await templateStore.createTemplate(formData)
    }

    message.success(
      t(props.templateData ? 'TemplatesView.edited' : 'TemplatesView.created')
    )
    closeModal()
  } catch (error) {
    console.error('Submit error:', error, error.response?.data)
    message.error(
      error.response?.data?.message || t('notification_component.error')
    )
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/variable.scss';
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
:deep(.ant-btn-primary) {
  background-color: $primary;
  border-color: $primary;
  &:hover {
    background-color: darken($primary, 5%);
    border-color: darken($primary, 5%);
  }
}
</style>
