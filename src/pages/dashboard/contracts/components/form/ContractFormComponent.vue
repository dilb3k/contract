<template>
  <div class="scroll-wrapper">
    <a-form :model="formState" layout="vertical" @finish="handleSubmit">
      <a-form-item
        :label="t('ContractsView.name')"
        name="name"
        :rules="[{ required: true, message: t('REQUIRED_FIELD') }]"
      >
        <a-input
          v-model:value="formState.name"
          :placeholder="t('ContractsView.enterName')"
        />
      </a-form-item>

      <a-form-item
        v-for="(field, index) in formState.values"
        :key="index"
        :label="field.field.keyName"
      >
        <a-input v-model:value="field.value" />
      </a-form-item>

      <div class="form-actions flex items-center justify-end gap-4">
        <a-button @click="closeModal">{{ t('CANCEL') }}</a-button>
        <a-button
          class="btn-save"
          type="primary"
          html-type="submit"
          :loading="loading"
        >
          {{ t('SAVE') }}
        </a-button>
      </div>
    </a-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useContract } from '@/store/contract.pinia'
import useModal from '@/composables/useModal'
import { message } from 'ant-design-vue'

const { t } = useI18n()
const { close } = useModal()
const contractStore = useContract()

const props = defineProps({
  contractData: Object,
  selectedContracts: Array,
  modalKey: Number
})

const loading = ref(false)
const formState = reactive({
  name: props.contractData?.name || '',
  sampleId: props.contractData?.sample?.id || null,
  values: props.contractData?.values || []
})
const sampleOptions = ref([])

onMounted(async () => {
  try {
    const samples = await contractStore.getSamples()
    if (Array.isArray(samples) && samples.length > 0) {
      sampleOptions.value = samples.map((sample) => ({
        value: sample.id,
        label: sample.name
      }))
    } else {
      sampleOptions.value = []
      console.warn('No samples returned from API')
    }
  } catch (error) {
    console.error('Error fetching samples:', error)
    message.error(t('notification_component.error_fetch_samples'))
  }
})

function closeModal() {
  close(props.modalKey)
}

async function handleSubmit() {
  loading.value = true
  try {
    const payload = {
      name: formState.name,
      sampleId: formState.sampleId,
      values: formState.values.map((v) => ({
        value: v.value,
        fieldId: v.field.id
      }))
    }
    if (props.contractData) {
      await contractStore.editContract(props.contractData.id, payload)
      message.success(t('ContractsView.edited'))
    } else if (props.selectedContracts) {
      await contractStore.generateContracts(props.selectedContracts, payload)
      message.success(t('ContractsView.generated'))
    } else {
      await contractStore.createContract(payload)
      message.success(t('ContractsView.created'))
    }
    closeModal()
  } catch (error) {
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

.scroll-wrapper {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 12px;
  padding-bottom: 12px;
}

.form-actions {
  margin-top: 16px;
}

.btn-save {
  background-color: $primary;
  color: white;
  &:hover {
    background-color: darken($primary, 5%);
  }
  &:active {
    background-color: darken($primary, 8%);
  }
}
</style>
