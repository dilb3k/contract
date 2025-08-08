<template>
  <a-form :model="formState" layout="vertical">
    <a-form-item
      v-for="field in formState"
      :key="field.id"
      :label="field.keyName"
    >
      <a-switch
        v-model:checked="field.isRequired"
        :checked-children="t('required')"
        :un-checked-children="t('optional')"
      />
    </a-form-item>
  </a-form>
</template>


<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
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

defineExpose({ formState })
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
