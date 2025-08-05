<script setup>
import {useCore} from '../store/core.pinia.js'
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

const corePinia = useCore()
</script>

<template>
      <template v-if="loading">
        <a-spin
          :spinning="loading"
          :wrapper-class-name="wrapperClassName"
          class="spinner -translate-y-1/2 -translate-x-1/2"
          v-bind="$attrs"
        >
          <template #indicator>
            <IconLoader :size="size" />
          </template>
        </a-spin>
      </template>
      <template v-else>
        <slot />
      </template>
</template>
<style lang="scss" scoped>
  .spinner{
    position: absolute;
    top: 50%;
    left: 50%;
}
</style>