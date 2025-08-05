<template>
  <a-space class="template-filters">
    <a-input
      v-model:value="searchQuery"
      :placeholder="t('SEARCH')"
      allow-clear
      size="large"
      style="width: 200px"
      @input="handleSearch"
    />
    <a-button type="primary" size="large" @click="openCreateModal">
      <icon-plus />
      {{ t('TemplatesView.create') }}
    </a-button>
  </a-space>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { debounce } from '@/utils/helpers'
import { useTemplate } from '@/store/template.pinia'
import useQueryParams from '@/composables/useQueryParams'
import useModal from '@/composables/useModal'
import IconPlus from '@/components/icons/solid/IconPlus.vue'
import TemplateFormComponent from './form/TemplateFormComponent.vue'

const { t } = useI18n()
const templateStore = useTemplate()
const { getQueries, setQueries } = useQueryParams()
const { open, close } = useModal()
const searchQuery = ref(getQueries().search || '')

const handleSearch = debounce(() => {
  const query = {
    page: 0,
    size: templateStore.templates.size,
    search: searchQuery.value?.trim() || undefined
  }
  setQueries(query, { saveHistory: false })
  templateStore.getAllTemplates(query)
}, 500)

watch(
  () => getQueries().search,
  (newSearch) => {
    searchQuery.value = newSearch || ''
  }
)

const openCreateModal = () => {
  open({
    title: t('TemplatesView.create'),
    width: 800,
    component: TemplateFormComponent,
    props: { modalKey: Date.now() },
    emits: {
      submit: async ({ name, file, modalKey }) => {
        if (!name || typeof name !== 'string') {
          return
        }

        const formData = new FormData()
        formData.append('name', name.trim())
        formData.append('file', file)

        try {
          await templateStore.createTemplate(formData)
          message.success(t('TemplatesView.created'))
          close(modalKey)
        } catch (error) {
          message.error(
            error.response?.data?.message ||
              t('notification_component.error_create_template')
          )
        }
      },
      cancel: ({ modalKey }) => close(modalKey)
    }
  })
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/variable.scss';
.template-filters {
  margin-bottom: 16px;
  margin-left: 2px;
}
:deep(.ant-btn-primary) {
  background-color: $primary;
  border-color: $primary;
  display: flex;
  align-items: center;
  gap: 4px;
  &:hover {
    background-color: darken($primary, 5%);
    border-color: darken($primary, 5%);
  }
}
</style>
