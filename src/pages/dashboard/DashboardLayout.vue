<script setup lang="ts">
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUser } from '@/store/user.pinia'
import { useCore } from '@/store/core.pinia'
import SidebarMenuComponent from '@/layouts/components/SidebarMenuComponent.vue'
import NavbarComponent from '@/layouts/components/NavbarComponent.vue'
import LoaderMainComponent from '@/components/LoaderMainComponent.vue'
import { useRoute, useRouter } from 'vue-router'
import dashboardRouter from '@/routers/dashboard.router'

const corePinia = useCore()
const { collapsed, lastVisitedRoute } = storeToRefs(corePinia)
const userStore = useUser()
const { user, userMe } = storeToRefs(userStore)
const router = useRouter()
const route = useRoute()

watch(
  () => userMe.value,
  (isLoading) => {
    if (
      !isLoading &&
      user.value?.role &&
      (route.path === '/dashboard' || route.name === 'DashboardView')
    ) {
      const targetRoute =
        dashboardRouter.find(
          (item) =>
            item.name === lastVisitedRoute.value &&
            item.meta?.roles?.includes(user.value?.role)
        ) ||
        dashboardRouter.find((item) =>
          item.meta?.roles?.includes(user.value?.role)
        )

      if (targetRoute) router.replace({ name: targetRoute.name })
    }
  },
  { immediate: true }
)

router.afterEach((to) => {
  if (to.path.includes('dashboard') && to.name !== 'DashboardView') {
    corePinia.setLastVisitedRoute(to.name)
  }
})
</script>

<template>
  <loader-main-component :loading="userMe" size="large">
    <a-layout class="layout-container">
      <a-layout-sider
        :collapsed="collapsed"
        :width="270"
        class="desktop-sidebar"
      >
        <div class="logo flex items-center gap-1">
          <img src="@/assets/images/logo.svg" alt="Logo" class="w-10 h-10" />
          <p class="!text-xl !leading-[18px] !mt-0.5">CONTRACTS</p>
        </div>
        <sidebar-menu-component />
      </a-layout-sider>

      <div class="mobile-sidebar">
        <sidebar-menu-component />
      </div>

      <a-layout class="layout-main">
        <a-layout-header>
          <navbar-component />
        </a-layout-header>
        <a-layout-content class="layout-content">
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
    font-weight: bold;
  }
}

.mobile-sidebar {
  display: none;
}

@media (max-width: 768px) {
  .desktop-sidebar {
    display: none;
  }

  .mobile-sidebar {
    display: block;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #fff;
    border-top: 1px solid #c8cbd9;
    z-index: 1000;
  }

  .layout-content {
    margin-bottom: 60px;
  }

  .layout-main {
    margin-left: 0 !important;
  }
}
</style>
