<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import IconLeft from './icons/solid/IconLeft.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const props = defineProps({
  title: String,
  back: {
    type: [Boolean, Object, Function],
    default: false
  }
})

function handleBack() {
  if (typeof props.back === 'function') {
    props.back()
  } else {
    router.push(props?.back)
  }
}
</script>

<template>
  <a-page-header class="site-page-header">
    <template #title>
      <div class="flex gap-x-4 items-center">
        <a-button
          v-if="back"
          class="px-2.5 !py-1 bg-gray-light outline-none border border-gray-extra !h-max"
          type="link"
          @click="handleBack"
        >
          <template #icon>
            <IconLeft class="text-gray text-2xl" />
          </template>
        </a-button>
        {{ title ? title : t(`document_title.${route.name}`) }}
      </div>
    </template>
    <template #extra>
      <slot name="actions" />
    </template>

    <slot name="content" />
  </a-page-header>
</template>
<style lang="scss">
.ant-page-header {
  padding: 0 0 16px;
  display: flex;
  flex-direction: column;
  row-gap: 24px;

  .ant-page-header-heading {
    display: flex;
    align-items: center;

    .ant-page-header-heading-left,
    .ant-page-header-heading-extra {
      margin: 0;
      height: max-content;
    }
  }

  .ant-page-header-content {
    padding: 0;
  }
}

.ant-page-header-heading-title {
  font-size: 28px !important;
  font-weight: 700 !important;
  line-height: 40px !important;
}
@media (max-width: 760px) {
  .ant-page-header-heading-title {
    font-size: 24px !important;
    font-weight: 700 !important;
    line-height: 40px !important;
    padding: 0px !important;
  }
}
@media (max-width: 460px) {
  .ant-page-header-heading-title {
    font-size: 20px !important;
    font-weight: 700 !important;
    line-height: 40px !important;
    padding: 0px !important;
  }
}
</style>
