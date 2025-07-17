<script setup>
import { computed, h, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import useUser from '@/store/user.pinia.js'
import IconUsers from '@/components/icons/outline/IconUsers.vue'
import IconCopy from '@/components/icons/outline/IconCopy.vue'
import IconEdit from '@/components/icons/outline/IconEdit.vue'
import IconDownload from '@/components/icons/outline/IconDownload.vue'
import IconOrganization from '@/components/icons/outline/IconOrganization.vue'

const route = useRoute()
const router = useRouter()

const { t } = useI18n()

const pages = reactive([
  {
    path: 'users',
    key: 'users',
    name: 'UserView',
    label: t('document_title.UserView'),
    icon: () => h(IconUsers)
  },
  {
    path: 'templates',
    key: 'templates',
    name: 'TemplatesView',
    label: t('document_title.TemplatesView'),
    icon: () => h(IconCopy)
  },
  {
    path: 'contracts',
    key: 'contracts',
    name: 'ContractsView',
    label: t('document_title.ContractsView'),
    icon: () => h(IconEdit)
  },
  {
    path: 'downloads',
    key: 'downloads',
    name: 'DownloadsView',
    label: t('document_title.DownloadsView'),
    icon: () => h(IconDownload)
  },
  {
    path: 'organizations',
    key: 'organizations',
    name: 'OrganizationView',
    label: t('document_title.OrganizationView'),
    icon: () => h(IconOrganization)
  },
])

const activeLink = computed(() => {
  return route?.path.replace('/dashboard/', '')?.split('/')?.[0]
})

const userPinia = useUser()
const {user} = storeToRefs(userPinia)

const menuList = computed(() => {
  if (user.value.role === 'ROLE_DEV'){
    return pages.filter(item => item.path === 'organizations')
  } else if (user.value.role === 'ROLE_DIRECTOR'){
    return pages.filter(item => item.path !== 'organizations')
  } else if (user.value.role === 'ROLE_OPERATOR'){
    return pages.filter(item => item.path !== 'organizations' && item.path !== 'users')
  } else return pages
})

function handleClickMenu({ item }) {
  const { path, name } = item
  if (name !== route.name) {
    router.push(`/dashboard/${path}`)
  }
}
</script>

<template>
  <div class="sidebar-menu-component">
    <a-menu
      :items="menuList"
      mode="inline"
      :selectedKeys="[activeLink]"
      @click="handleClickMenu"
    />
  </div>
</template>

<style lang="scss"></style>
