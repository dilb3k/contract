<script setup>
import { h, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Button, notification } from 'ant-design-vue'
import { storeToRefs } from 'pinia'
import useCore from '@/store/core.pinia.js'

const { t } = useI18n()
const router = useRouter()
const corePinia = useCore()
const { redirectUrl, toastContent } = storeToRefs(corePinia)

watch(redirectUrl, () => {
  if (redirectUrl.value && redirectUrl.value !== '') {
    router.push(`${redirectUrl.value}`)
    corePinia.redirect(null)
  }
})

watch(toastContent, () => {
  const key = `open${Math.random()}`
  if (toastContent.value) {
    const toastMessage = toastContent.value?.message
    const toastFields = toastContent.value?.fields
    const type = toastContent.value?.type || 'success'
    const localeMessage = toastContent.value?.locale
    if (toastFields?.length > 0) {
      notification.open({
        message: toastMessage
          ? toastMessage
          : t(`notification_component.${type}`),
        description: () =>
          h(
            'ul',
            {},
            toastFields.map((item) => h('li', { class: 'py-1' }, item?.message))
          ),
        duration: 10,
        btn: () =>
          h(
            Button,
            {
              size: 'large',
              class: 'px-4',
              onClick: () => notification.close(key)
            },
            { default: () => 'Ok' }
          ),
        key,
        class: `notification-custom-class  notification-${type}`
      })
    } else {
      notification.open({
        message: t(`notification_component.${type}`),
        description: toastMessage ? toastMessage : t(`${localeMessage}`),
        duration: 10,
        btn: () =>
          h(
            Button,
            {
              size: 'large',
              class: 'px-4',
              onClick: () => notification.close(key)
            },
            { default: () => 'Ok' }
          ),
        key,
        class: `notification-custom-class notification-${type}`
      })
    }
  }
})
</script>

<template></template>

<style scoped></style>
