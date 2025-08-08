<template>
  <a-form
    ref="formRef"
    :model="formState"
    layout="vertical"
    @finish="handleSubmit"
  >
    <div class="flex items-center w-full justify-between flex-wrap">
      <a-form-item
        :label="t('OrganizationView.organization_name')"
        name="name"
        :rules="[{ required: true, message: t('REQUIRED_FIELD') }]"
      >
        <a-input
          v-model:value="formState.name"
          :placeholder="t('OrganizationView.enter_name')"
          size="large"
        />
      </a-form-item>
      <a-form-item
        :label="t('OrganizationView.identifier_number')"
        name="identifierNumber"
        :rules="[{ required: true, message: t('REQUIRED_FIELD') }]"
      >
        <a-input
          v-model:value="formState.identifierNumber"
          :placeholder="t('OrganizationView.enter_identifier_number')"
          size="large"
        />
      </a-form-item>
    </div>
    <div class="form-actions">
      <a-button danger size="large" @click="closeModal">{{
        t('CANCEL')
      }}</a-button>
      <a-button
        type="primary"
        html-type="submit"
        :loading="loading"
        size="large"
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
import { useOrganization } from '@/store/organization.pinia'
import useModal from '@/composables/useModal'
import useQueryParams from '@/composables/useQueryParams'

const { t } = useI18n()
const { close } = useModal()
const { setQueries, getQueries } = useQueryParams()
const organizationStore = useOrganization()
const props = defineProps({
  organizationData: Object,
  modalKey: Number
})
const loading = ref(false)
const formRef = ref(null)
const formState = reactive({
  name: '',
  identifierNumber: ''
})

watch(
  () => props.organizationData,
  (newData) => {
    formState.name = newData?.name || ''
    formState.identifierNumber = newData?.identifierNumber || ''
  },
  { immediate: true }
)

const closeModal = () => {
  formRef.value?.resetFields()
  close(props.modalKey)
}

const handleSubmit = async () => {
  if (organizationStore.organizationLoader) return

  loading.value = true
  try {
    const payload = {
      name: formState.name.trim(),
      identifierNumber: formState.identifierNumber.trim()
    }

    if (props.organizationData) {
      await organizationStore.editOrganization(
        props.organizationData.id,
        payload
      )
      message.success(t('OrganizationView.edited'))
    } else {
      await organizationStore.createOrganization(payload)
      message.success(t('OrganizationView.created'))
    }

    const query = getQueries()
    await organizationStore.getAllOrganizations({
      page: query.page ? Math.max(0, Number(query.page) - 1) : 0,
      size: query.size ? Number(query.size) : 10,
      search: query.search || undefined
    })

    if (!props.organizationData) {
      await setQueries(
        { page: 1, size: 10, search: '' },
        { saveHistory: false }
      )
    }

    closeModal()
  } catch (error) {
    console.error('Submit Error:', error)
    message.error(
      error?.response?.data?.message ||
        error?.message ||
        t('notification_component.error')
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
:deep(.ant-input) {
  &:focus {
    border-color: $primary;
    box-shadow: 0 0 0 2px rgba($primary, 0.2);
  }
}
</style>
