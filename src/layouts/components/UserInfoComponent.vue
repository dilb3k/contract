<script setup>
import { shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import useModal from '@/composables/useModal.js'
import useCore from '@/store/core.pinia.js'
import useUser from '@/store/user.pinia.js'
import UserFormComponent from '@/pages/dashboard/user/components/form/UserFormComponent.vue'

const { t } = useI18n()
const {open} = useModal()
const corePinia = useCore()
const userPinia = useUser()
const {user, userLoader} = storeToRefs(userPinia)

const logOut = () => {
  corePinia.logout()
}

function openProfileForm(){
  open({
    title: t('UserView.editProfile'),
    closable: true,
    width: '600px',
    component: shallowRef(UserFormComponent),
    props:{
      user: user.value
    }
  })
}
</script>
<template>
  <div class="user-info">
    <a-menu class="" :selectable="false">
      <a-menu-item @click="openProfileForm">
        <span class="text-base">{{ t('UserView.editProfile') }}</span>
      </a-menu-item>

      <a-popconfirm
        :title="t('SURE_LOGOUT')"
        @confirm="logOut"
        :ok-text="t('OUT')"
        :cancel-text="t('CANCEL')"
      >
        <a-menu-item>
          <span class="text-red-500">{{ t('LOG_OUT') }}</span>
        </a-menu-item>
      </a-popconfirm>
    </a-menu>
  </div>
</template>

<style lang="scss" scoped></style>
