<template>
  <a-modal
    :title="t('ContractsView.edit')"
    :open="open"
    :footer="false"
    @cancel="handleCancel"
  >
    <a-form :model="formState" layout="vertical">
      <a-form-item
        v-for="field in formState"
        :key="field.id"
        :label="field.keyName"
      >
        <a-switch
          v-model:checked="field.isRequired"
          checked-children="Required"
          un-checked-children="Optional"
        />
      </a-form-item>

      <div class="form-actions">
        <a-button @click="handleCancel">
          {{ t('CANCEL') }}
        </a-button>
        <a-button type="primary" @click="handleOk">
          {{ t('OK') }}
        </a-button>
      </div>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { useTemplate } from '@/store/template.pinia'

const { t } = useI18n()
const templateStore = useTemplate()
const props = defineProps({
  open: Boolean,
  sampleFields: Array,
  sampleId: Number,
  modalKey: Number
})
const emit = defineEmits(['update:open', 'success'])
const formState = ref(props.sampleFields.map((field) => ({ ...field })))

watch(
  () => props.sampleFields,
  (newFields) => {
    formState.value = newFields.map((field) => ({ ...field }))
  },
  { deep: true }
)

async function handleOk() {
  try {
    const payload = formState.value.map((field) => ({
      id: field.id,
      keyName: field.keyName,
      fieldType: field.fieldType,
      isRequired: field.isRequired,
      fieldReplaceType: field.fieldReplaceType
    }))
    await templateStore.editTemplateFields(props.sampleId, payload)
    message.success(t('notification_component.success'))
    emit('update:open', false)
  } catch (error) {
    console.error('Edit template fields error:', error)
    message.error(
      error.response?.data?.message || t('notification_component.error')
    )
  }
}

function handleCancel() {
  emit('update:open', false)
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
