<script setup>
import IconLoader from './icons/solid/IconLoader.vue'

const props = defineProps({
  loading: {
    type: [Object, String, Boolean, null],
    required: true
  },
  size: {
    type: String,
    default: 'default'
  },
  wrapperClassName: {
    type: String
  }
})

</script>

<template>
  <a-spin
    :spinning="loading"
    :wrapper-class-name="wrapperClassName"
    v-bind="$attrs"
  >
    <template #indicator>
      <IconLoader :size="size"/>
    </template>
    <slot />
  </a-spin>
</template>
