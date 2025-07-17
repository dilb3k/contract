<script setup>
import useModal from '@/composables/useModal.js'

const { modal, close } = useModal()
</script>

<template>
  <a-modal
    :title="item.title"
    v-for="item in modal.list"
    :width="item.width"
    :key="item.props.modalKey"
    @cancel="close(item.props.modalKey)"
    :open="modal.visible.has(item.props.modalKey)"
    :closable="item.closable"
    :centered="true"
    :footer="false"
    destroy-on-close
    class="app-modal"
  >
    <component :is="item.component" v-bind="item.props" v-on="item.emits" />
  </a-modal>
</template>

<style scoped></style>
