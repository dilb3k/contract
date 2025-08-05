<script setup>
import AppModalComponent from '@/components/AppModalComponent.vue'
</script>

<template>
  <div class="app-layout">
    <div class="app-content">
      <router-view />
    </div>
    <app-modal-component />
  </div>
</template>

<style scoped lang="scss">
.app-layout {
  min-height: 100vh;

  .app-content {
    padding-bottom: 0;

    @media (max-width: 768px) {
      padding-bottom: 70px;
    }
  }
}
</style>
