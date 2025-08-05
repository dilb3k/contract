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
        v-for="field in sampleFields"
        :key="field.id || field.keyName"
        :label="field.keyName"
        :name="['values', field.keyName]"
        :rules="[{ required: field.isRequired, message: t('REQUIRED_FIELD') }]"
      >
        <a-input
          v-model:value="formState.values[field.keyName]"
          :placeholder="field.keyName"
        />
      </a-form-item>

      <div class="form-actions">
        <a-button @click="closeModal">{{ t('CANCEL') }}</a-button>
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
import useModal from '@/composables/useModal'

const { t } = useI18n()
const { close } = useModal()
const contractStore = useContract()

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  sampleId: {
    type: [Number, String],
    required: true
  },
  sampleFields: {
    type: Array,
    default: () => []
  },
  modalKey: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:open', 'success'])

const loading = ref(false)
const formRef = ref(null)
const formState = reactive({
  name: '',
  values: {}
})

const initializeForm = () => {
  formState.name = ''
  formState.values = {}

  if (props.sampleFields && props.sampleFields.length > 0) {
    props.sampleFields.forEach((field) => {
      if (field.keyName) {
        formState.values[field.keyName] = ''
      }
    })
  }
}

watch(
  () => [props.open, props.sampleFields],
  ([newOpen]) => {
    if (newOpen) {
      nextTick(() => {
        initializeForm()
        if (formRef.value) {
          formRef.value.clearValidate()
        }
      })
    }
  },
  { immediate: true, deep: true }
)

const closeModal = () => {
  emit('update:open', false)
  if (props.modalKey) {
    close(props.modalKey)
  }
}

const handleSubmit = async (values) => {
  try {
    loading.value = true

    if (!props.sampleFields || props.sampleFields.length === 0) {
      throw new Error(t('ContractsView.noFields'))
    }

    if (!props.sampleId) {
      throw new Error('Sample ID is required')
    }

    const contractData = {
      name: values.name,
      sampleId: Number(props.sampleId),
      values: props.sampleFields
        .filter((field) => field.id && field.keyName)
        .map((field) => ({
          fieldId: field.id,
          value: values.values[field.keyName] || ''
        }))
    }

    if (contractData.values.length === 0) {
      throw new Error(t('ContractsView.invalidField'))
    }

    await contractStore.createContract(contractData)
    message.success(t('ContractsView.created'))
    closeModal()
  } catch (error) {
    console.error('Create contract error:', error)
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      t('notification_component.error')
    message.error(errorMessage)
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

.input-name {
  color: #000;
  border-color: rgba($primary, 0.5);

  &:hover {
    border-color: $primary;
  }

  &:focus {
    border-color: $primary;
    box-shadow: 0 0 0 2px rgba($primary, 0.2);
  }
}

:deep(.ant-input) {
  border-color: #d9d9d9;
  border-radius: 4px;
  color: #000;

  &::placeholder {
    color: rgba(0, 0, 0, 0.45);
  }

  &:focus {
    border-color: $primary;
    box-shadow: 0 0 0 2px rgba($primary, 0.2);
  }

  &:hover {
    border-color: $primary;
  }
}

:deep(.ant-form-item-label) {
  color: #000;
  font-weight: 500;
}

:deep(.ant-form-item-required):before {
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
