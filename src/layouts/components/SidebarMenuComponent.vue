<script setup>
import { computed, reactive, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useUser } from '@/store/user.pinia.js'
import IconUsers from '@/components/icons/outline/IconUsers.vue'
import IconCopy from '@/components/icons/outline/IconCopy.vue'
import IconEdit from '@/components/icons/outline/IconEdit.vue'
import IconDownload from '@/components/icons/outline/IconDownload.vue'
import IconOrganization from '@/components/icons/outline/IconOrganization.vue'
import '@/assets/styles/variable.scss'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const screenWidth = ref(window.innerWidth)

const handleResize = () => {
  screenWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const pages = reactive([
  {
    path: 'users',
    key: 'users',
    name: 'UserView',
    label: t('document_title.UserView'),
    icon: IconUsers
  },
  {
    path: 'templates',
    key: 'templates',
    name: 'TemplatesView',
    label: t('document_title.TemplatesView'),
    icon: IconCopy
  },
  {
    path: 'contracts',
    key: 'contracts',
    name: 'ContractsView',
    label: t('document_title.ContractsView'),
    icon: IconEdit
  },
  {
    path: 'downloads',
    key: 'downloads',
    name: 'DownloadsView',
    label: t('document_title.DownloadsView'),
    icon: IconDownload
  },
  {
    path: 'organizations',
    key: 'organizations',
    name: 'OrganizationView',
    label: t('document_title.OrganizationView'),
    icon: IconOrganization
  }
])

const activeLink = computed(
  () => route?.path.replace('/dashboard/', '')?.split('/')?.[0]
)
const userPinia = useUser()
const { user } = storeToRefs(userPinia)

const menuList = computed(() => {
  if (user.value.role === 'ADMIN')
    return pages.filter((item) => item.path === 'organizations')
  if (user.value.role === 'DIRECTOR')
    return pages.filter((item) => item.path !== 'organizations')
  if (user.value.role === 'ROLE_DEV')
    return pages.filter((item) => item.path === 'organizations')
  if (user.value.role === 'OPERATOR')
    return pages.filter(
      (item) => item.path !== 'organizations' && item.path !== 'users'
    )
  return pages
})

function handleClickMenu(item) {
  if (item.name !== route.name) {
    router.push(`/dashboard/${item.path}`)
  }
}

const isMobile = computed(() => screenWidth.value <= 576)
const isTablet = computed(
  () => screenWidth.value > 576 && screenWidth.value <= 768
)
const isDesktop = computed(() => screenWidth.value > 768)

const currentTooltip = ref(null)

function showTooltip(key) {
  currentTooltip.value = key
}

function hideTooltip() {
  currentTooltip.value = null
}
</script>
<template>
  <div class="sidebar-menu-component">
    <div
      class="menu-wrapper"
      :class="{ tablet: isTablet, mobile: isMobile, desktop: isDesktop }"
    >
      <div
        v-for="item in menuList"
        :key="item.key"
        :class="['menu-entry', { active: item.path === activeLink }]"
        @click="handleClickMenu(item)"
      >
        <a-tooltip
          v-if="isMobile"
          :title="item.label"
          placement="top"
          overlayClassName="custom-tooltip"
          :open="currentTooltip === item.key"
          @mouseenter="showTooltip(item.key)"
          @mouseleave="hideTooltip"
        >
          <div class="icon-container">
            <component :is="item.icon" class="menu-icon" />
          </div>
        </a-tooltip>
        <div v-else class="icon-container">
          <component :is="item.icon" class="menu-icon" />
        </div>
        <span v-if="!isMobile" class="menu-label">{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
@import '@/assets/styles/variable.scss';

.sidebar-menu-component {
  .menu-wrapper {
    display: flex;
    flex-direction: column;
    gap: 6px;

    .menu-entry {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      min-height: 48px;

      &:hover {
        background-color: rgba($primary, 0.08);
      }

      &.active {
        background-color: rgba($primary, 0.12);
        border-left: 3px solid $primary;

        .menu-icon {
          color: $primary;
        }

        .menu-label {
          color: $primary;
          font-weight: 600;
        }
      }

      .icon-container {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        background-color: rgba($primary, 0.05);
        flex-shrink: 0;
      }

      .menu-icon {
        font-size: 18px;
        color: $primary;
      }

      .menu-label {
        font-size: 14px;
        font-weight: 500;
        color: $primary;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    &.desktop {
      padding: 14px 10px;

      .menu-entry {
        justify-content: flex-start;
        width: 100%;
      }
    }

    &.tablet,
    &.mobile {
      flex-direction: row;
      justify-content: space-around;
      padding: 10px 12px;
      background: #fff;
      border: 1px solid $table_border;
      border-radius: 14px;

      .menu-entry {
        flex-direction: column;
        align-items: center;
        padding: 8px;
        min-width: 60px;
        flex: 1;
        max-width: 90px;

        &:hover {
          background-color: rgba($primary, 0.06);
        }

        &.active {
          background-color: rgba($primary, 0.12);
          border-radius: 12px;
          border-left: none;
        }

        .icon-container {
          width: 36px;
          height: 36px;
        }

        .menu-icon {
          font-size: 18px;
        }

        .menu-label {
          font-size: 11px;
          text-align: center;
          margin-top: 4px;
          line-height: 1.2;
        }
      }
    }

    &.mobile {
      .menu-label {
        display: none;
      }
    }
  }

  :deep(.custom-tooltip) {
    .ant-tooltip-inner {
      font-size: 12px;
      padding: 6px 10px;
      background: $primary;
      border-radius: 6px;
    }

    .ant-tooltip-arrow {
      display: none;
    }

    .ant-tooltip-placement-top {
      transform: translateX(-50%) !important;
      left: 50% !important;
    }
  }
}
</style>
