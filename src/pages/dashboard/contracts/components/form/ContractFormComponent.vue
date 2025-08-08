<template>
  <a-modal
    :title="t('ContractsView.create')"
    :open="open"
    :width="800"
    :closable="true"
    :footer="null"
    :destroy-on-close="true"
    @cancel="closeModal"
  >
    <a-form
      ref="formRef"
      :model="formState"
      layout="vertical"
      @finish="handleSubmit"
      :validate-messages="{ required: t('REQUIRED_FIELD') }"
    >
      <a-form-item
        v-if="user?.role === 'ADMIN'"
        :label="t('ContractsView.organization')"
        name="organizationId"
        :rules="[{ required: true, message: t('REQUIRED_FIELD') }]"
      >
        <a-select
          v-model:value="formState.organizationId"
          :placeholder="t('ContractsView.selectOrganization')"
          show-search
          :filter-option="filterOption"
          :options="organizationOptions"
          :loading="organizationLoading"
          @change="handleOrganizationChange"
          @popupScroll="handleOrganizationScroll"
        />
      </a-form-item>

      <a-form-item
        :label="t('ContractsView.template')"
        name="sampleId"
        :rules="[{ required: true, message: t('REQUIRED_FIELD') }]"
      >
        <a-select
          v-model:value="formState.sampleId"
          :placeholder="t('ContractsView.selectTemplate')"
          show-search
          :filter-option="filterOption"
          :options="templateOptions"
          :loading="templateLoading"
          @change="handleTemplateChange"
          @popupScroll="handleScroll"
          @search="handleSearch"
        />
      </a-form-item>

      <a-form-item
        v-if="formState.sampleId"
        :label="t('ContractsView.name')"
        name="name"
        :rules="[{ required: true, message: t('REQUIRED_FIELD') }]"
      >
        <a-input
          v-model:value="formState.name"
          :placeholder="t('ContractsView.enterName')"
          class="input-name"
        />
      </a-form-item>

      <a-form-item
        v-if="formState.sampleId"
        v-for="field in sampleFields"
        :key="field.id || field.keyName"
        :label="field.keyName"
        :name="['values', field.keyName]"
        :rules="[{ required: field.isRequired, message: t('REQUIRED_FIELD') }]"
      >
        <a-input
          v-model:value="formState.values[field.keyName]"
          :placeholder="field.keyName"
          :disabled="fieldLoading"
        />
      </a-form-item>

      <div v-if="formState.sampleId" class="form-actions">
        <a-button @click="closeModal" :disabled="loading">{{
          t('CANCEL')
        }}</a-button>
        <a-button type="primary" html-type="submit" :loading="loading">
          {{ t('SAVE') }}
        </a-button>
      </div>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, reactive, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { useContract } from '@/store/contract.pinia'
import { useTemplate } from '@/store/template.pinia'
import { useOrganization } from '@/store/organization.pinia'
import { useUser } from '@/store/user.pinia'
import useModal from '@/composables/useModal'
import { debounce } from 'lodash'
import { storeToRefs } from 'pinia'

const { t } = useI18n()
const { close } = useModal()
const contractStore = useContract()
const templateStore = useTemplate()
const organizationStore = useOrganization()
const userStore = useUser()
const { user } = storeToRefs(userStore)

const props = defineProps({
  open: { type: Boolean, default: false },
  sampleId: { type: [Number, String], default: null },
  modalKey: { type: Number, default: 0 }
})

const emit = defineEmits(['update:open', 'success'])

const loading = ref(false)
const templateLoading = ref(false)
const organizationLoading = ref(false)
const fieldLoading = ref(false)
const formRef = ref(null)
const sampleFields = ref([])
const templateOptions = ref([])
const organizationOptions = ref([])
const currentTemplatePage = ref(0)
const currentOrgPage = ref(0)
const pageSize = ref(20)
const templateSearchQuery = ref('')
const orgSearchQuery = ref('')
const hasMoreTemplates = ref(true)
const hasMoreOrgs = ref(true)

const formState = reactive({
  organizationId: null,
  sampleId: props.sampleId || null,
  name: '',
  values: {}
})

const filterOption = (input, option) => {
  return option.label?.toLowerCase().includes(input.toLowerCase()) || false
}

const initializeForm = () => {
  formState.name = ''
  formState.values = {}
  formState.sampleId = null
  formState.organizationId = null
  sampleFields.value = []
  templateOptions.value = []
  organizationOptions.value = []
  currentTemplatePage.value = 0
  currentOrgPage.value = 0
  templateSearchQuery.value = ''
  orgSearchQuery.value = ''
  hasMoreTemplates.value = true
  hasMoreOrgs.value = true
}

const loadTemplates = async (
  page = 0,
  size = 20,
  append = false,
  search = ''
) => {
  if (templateLoading.value || !hasMoreTemplates.value) return
  try {
    templateLoading.value = true
    const response = await templateStore.getAllTemplates({ page, size, search })
    console.log('loadTemplates response:', response) // Debug log
    if (!response || (!Array.isArray(response) && !response.content)) {
      throw new Error('Invalid API response: Missing content')
    }
    const newOptions = Array.isArray(response)
      ? response.map((template) => ({
          value: template.id,
          label: template.name
        }))
      : response.content?.map((template) => ({
          value: template.id,
          label: template.name
        })) || []

    if (newOptions.length < size) hasMoreTemplates.value = false
    if (newOptions.length === 0 && !append) {
      message.warning(t('notification_component.no_templates_found'))
    }

    templateOptions.value = append
      ? [
          ...templateOptions.value.filter(
            (opt) => !newOptions.some((newOpt) => newOpt.value === opt.value)
          ),
          ...newOptions
        ]
      : newOptions
    currentTemplatePage.value = page
  } catch (error) {
    console.error('Error loading templates:', error)
    message.error(
      error.message || t('notification_component.error_fetch_templates')
    )
    hasMoreTemplates.value = false
  } finally {
    templateLoading.value = false
  }
}

const loadOrganizations = async (
  page = 0,
  size = 20,
  append = false,
  search = ''
) => {
  if (
    !user?.value?.role === 'ADMIN' ||
    organizationLoading.value ||
    !hasMoreOrgs.value
  )
    return
  try {
    organizationLoading.value = true
    const response = await organizationStore.getAllOrganizations({
      page,
      size,
      search
    })
    console.log('loadOrganizations response:', response) // Debug log
    if (!response || (!Array.isArray(response) && !response.content)) {
      throw new Error('Invalid API response: Missing content')
    }
    const newOptions = Array.isArray(response)
      ? response.map((org) => ({
          value: org.id,
          label: org.name
        }))
      : response.content?.map((org) => ({
          value: org.id,
          label: org.name
        })) || []

    if (newOptions.length < size) hasMoreOrgs.value = false
    if (newOptions.length === 0 && !append) {
      message.warning(t('notification_component.no_organizations_found'))
    }

    organizationOptions.value = append
      ? [
          ...organizationOptions.value.filter(
            (opt) => !newOptions.some((newOpt) => newOpt.value === opt.value)
          ),
          ...newOptions
        ]
      : newOptions
    currentOrgPage.value = page
  } catch (error) {
    console.error('Error loading organizations:', error)
    message.error(
      error.message || t('notification_component.error_fetch_organizations')
    )
    hasMoreOrgs.value = false
  } finally {
    organizationLoading.value = false
  }
}

const handleScroll = async (event) => {
  const target = event.target
  if (
    target.scrollTop + target.offsetHeight >= target.scrollHeight - 10 &&
    !templateLoading.value &&
    hasMoreTemplates.value
  ) {
    await loadTemplates(
      currentTemplatePage.value + 1,
      pageSize.value,
      true,
      templateSearchQuery.value
    )
  }
}

const handleOrganizationScroll = async (event) => {
  const target = event.target
  if (
    target.scrollTop + target.offsetHeight >= target.scrollHeight - 10 &&
    !organizationLoading.value &&
    hasMoreOrgs.value
  ) {
    await loadOrganizations(
      currentOrgPage.value + 1,
      pageSize.value,
      true,
      orgSearchQuery.value
    )
  }
}

const loadSampleFields = async (sampleId) => {
  if (!sampleId) return
  try {
    fieldLoading.value = true
    const fields = await templateStore.getSampleFields(sampleId)
    console.log('loadSampleFields response:', fields) // Debug log
    sampleFields.value = fields?.sampleFields || []
    formState.values = {}
    sampleFields.value.forEach((field) => {
      if (field.keyName) {
        formState.values[field.keyName] = ''
      }
    })
  } catch (error) {
    console.error('Error fetching sample fields:', error)
    message.error(t('notification_component.error_fetch_fields'))
  } finally {
    fieldLoading.value = false
  }
}

const handleTemplateChange = (value) => {
  formState.sampleId = value
  loadSampleFields(value)
}

const handleOrganizationChange = (value) => {
  formState.organizationId = value
}

const handleSearch = debounce(async (value) => {
  if (!value.trim()) {
    templateSearchQuery.value = ''
    templateOptions.value = []
    currentTemplatePage.value = 0
    hasMoreTemplates.value = true
    await loadTemplates(0, pageSize.value, false, '')
    return
  }
  templateSearchQuery.value = value
  await loadTemplates(0, pageSize.value, false, value)
}, 300)

const handleOrgSearch = debounce(async (value) => {
  if (!user?.value?.role === 'ADMIN') return
  if (!value.trim()) {
    orgSearchQuery.value = ''
    organizationOptions.value = []
    currentOrgPage.value = 0
    hasMoreOrgs.value = true
    await loadOrganizations(0, pageSize.value, false, '')
    return
  }
  orgSearchQuery.value = value
  await loadOrganizations(0, pageSize.value, false, value)
}, 300)

watch(
  () => props.open,
  async (newOpen) => {
    if (newOpen) {
      await nextTick()
      initializeForm()
      await loadTemplates(0, pageSize.value, false, templateSearchQuery.value)
      if (user?.value?.role === 'ADMIN') {
        await loadOrganizations(0, pageSize.value, false, orgSearchQuery.value)
      }
      if (formRef.value) {
        formRef.value.clearValidate()
      }
    }
  },
  { immediate: true }
)

watch(
  () => user?.value?.role,
  async (newRole) => {
    if (newOpen && newRole === 'ADMIN') {
      await loadOrganizations(0, pageSize.value, false, orgSearchQuery.value)
    }
  }
)

const closeModal = () => {
  emit('update:open', false)
  if (props.modalKey) {
    close(props.modalKey)
  }
}

const handleSubmit = async () => {
  try {
    loading.value = true
    if (!formState.sampleId) {
      throw new Error(t('ContractsView.selectTemplate'))
    }
    if (user?.value?.role === 'ADMIN' && !formState.organizationId) {
      throw new Error(t('ContractsView.selectOrganization'))
    }
    if (!sampleFields.value || sampleFields.value.length === 0) {
      throw new Error(t('ContractsView.noFields'))
    }
    const contractData = {
      name: formState.name,
      sampleId: Number(formState.sampleId),
      organizationId:
        user?.value?.role === 'ADMIN'
          ? Number(formState.organizationId)
          : undefined,
      values: sampleFields.value
        .filter((field) => field.id && field.keyName)
        .map((field) => ({
          fieldId: field.id,
          value: formState.values[field.keyName] || ''
        }))
    }
    if (contractData.values.length === 0) {
      throw new Error(t('ContractsView.invalidField'))
    }
    await contractStore.createContract(contractData)
    message.success(t('ContractsView.created'))
    emit('success')
    closeModal()
  } catch (error) {
    console.error('Submit error:', error)
    message.error(error.message || t('notification_component.error'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/variable.scss';

.form-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.input-name,
:deep(.ant-select-selector),
:deep(.ant-input) {
  color: #000;
  border-color: rgba($primary, 0.5);
  border-radius: 4px;
  &:hover {
    border-color: $primary;
  }
  &:focus {
    border-color: $primary;
    box-shadow: 0 0 0 2px rgba($primary, 0.2);
  }
}

:deep(.ant-input::placeholder) {
  color: rgba(0, 0, 0, 0.45);
}

:deep(.ant-form-item-label) {
  color: #000;
  font-weight: 500;
}

:deep(.ant-form-item-required::before) {
  content: '* ';
  color: #ff4d4f;
  margin-right: 4px;
}

:deep(.ant-form-item-explain-error) {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
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
</style>
