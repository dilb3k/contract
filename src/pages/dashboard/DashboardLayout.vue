<script setup>
import { onBeforeMount } from 'vue'
import { storeToRefs } from 'pinia'
import useUser from '@/store/user.pinia.js'
import useCore from '@/store/core.pinia.js'
import SidebarMenuComponent from '@/layouts/components/SidebarMenuComponent.vue'
import NavbarComponent from '@/layouts/components/NavbarComponent.vue'
import LoaderMainComponent from '@/components/LoaderMainComponent.vue'
import { useRoute, useRouter } from 'vue-router'
import dashboardRouter from '@/routers/dashboard.router.js'

const corePinia = useCore()
const { collapsed } = storeToRefs(corePinia)
const userStore = useUser()
const router = useRouter()
const route = useRoute()

onBeforeMount(() => {
  userStore.getUserMe((userRole) => {
    const defaultPage = dashboardRouter.find((item) =>
      item.meta?.roles?.includes(userRole)
    )

    if (defaultPage && route.name === 'DashboardView') {
      router.replace({ name: defaultPage?.name })
    }
  })
})
</script>

<template>
  <loader-main-component :loading="userStore.userMe" size="large">
    <a-layout class="layout-container">
      <a-layout-sider :collapsed="collapsed" :width="270">
        <div class="logo flex items-center gap-1">
          <img src="../../assets/images/logo.svg" alt="" class="w-10 h-10" />
          <p class="p-0 !text-xl !leading-[18px] !mt-0.5">CONTRACTS</p>
        </div>
        <sidebar-menu-component />
      </a-layout-sider>
      <a-layout class="layout-main">
        <a-layout-header>
          <navbar-component />
        </a-layout-header>
        <a-layout-content>
          <router-view />
        </a-layout-content>
      </a-layout>
    </a-layout>
  </loader-main-component>
</template>
<style lang="scss" scoped>
.logo {
  height: 64px;
  border-bottom: 1px solid #c8cbd9;
  display: flex;
  justify-content: center;
  align-items: center;

  p {
    margin: auto;
    font-family: Arial, serif;
    font-size: 32px;
    //color: #5a67ba;
    font-weight: bold;
  }
}
</style>
