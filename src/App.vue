<script setup>
import NotificationsComponent from '@/components/NotificationsComponent.vue'
import theme from '@/utils/ant/theme.js'
</script>

<template>
  <a-config-provider :theme="theme">
    <router-view />
    <notifications-component />
  </a-config-provider>
</template>

<style scoped></style>
