<script setup>
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import UserInfoComponent from '@/layouts/components/UserInfoComponent.vue'
import IconUser from '@/components/icons/outline/IconUser.vue'
import IconDown from '@/components/icons/solid/IconDown.vue'
import {useUser} from '@/store/user.pinia.js'

const { t } = useI18n()
const userPinia = useUser()
const { user } = storeToRefs(userPinia)
</script>
<template>
  <a-popover
    placement="topRight"
    trigger="click"
    :overlayInnerStyle="{
      width: '200px',
      padding: 0,
      borderRadius: '8px',
      overflow: 'hidden'
    }"
  >
    <template #content>
      <user-info-component :user="user" />
    </template>
    <div class="flex items-center gap-x-2 cursor-pointer">
      <a-avatar class="bg-[#f1f2f7] w-[40px] h-[40px]">
        <template #icon>
          <div class="flex justify-center items-center w-full h-full">
            <IconUser class="text-black text-xl" />
          </div>
        </template>
      </a-avatar>
      <div class="flex flex-col h-max">
        <p class="text-sm text-[#1F384C] font-semibold">
          {{ user?.firstName }} {{user?.lastName}}
        </p>
        <p class="text-[12px]">{{ user?.role ? t(`${user.role}`) : '' }}</p>
      </div>
      <IconDown class="text-[#a6abc8] text-xl" />
    </div>
  </a-popover>
</template>

<style lang="scss" scoped></style>
