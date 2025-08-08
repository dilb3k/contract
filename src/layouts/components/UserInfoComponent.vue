<template>
  <div class="user-info" :key="renderKey">
    <a-menu class="user-info-menu" :selectable="false">
      <a-menu-item @click="openProfileForm" class="menu-item">
        <div class="menu-content">
          <icon-user />
          <span class="menu-text">{{ t(`UserView.editProfile`) }}</span>
        </div>
      </a-menu-item>
      <a-menu-item @click="openPasswordForm" class="menu-item">
        <div class="menu-content">
          <icon-lock />
          <span class="menu-text">{{ t('SET_PASSWORD') }}</span>
        </div>
      </a-menu-item>
      <a-popconfirm
        :title="t('SURE_LOGOUT')"
        @confirm="logOut"
        :ok-text="t('OUT')"
        :cancel-text="t('CANCEL')"
      >
        <a-menu-item class="menu-item">
          <div class="menu-content">
            <icon-logout />
            <span class="menu-text text-red-600">{{ t('LOG_OUT') }}</span>
          </div>
        </a-menu-item>
      </a-popconfirm>
      <a-menu-item class="menu-item">
        <a-dropdown :trigger="['click']">
          <div class="menu-content">
            <component
              :is="getCurrentLanguageIcon()"
              class="flag-icon current-lang-icon"
            />
            <span class="menu-text">{{
              t(`UserView.${corePinia.locale}`)
            }}</span>
            <svg
              class="dropdown-arrow"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </div>
          <template #overlay>
            <a-menu class="language-dropdown">
              <a-menu-item @click="changeLanguage('uz')" class="dropdown-item">
                <template #icon class="dropdown-content">
                  <icon-uz class="flag-icon" />
                </template>
                <span>{{ t('UserView.uz') }}</span>
              </a-menu-item>
              <a-menu-item @click="changeLanguage('ru')" class="dropdown-item">
                <template #icon class="dropdown-content">
                  <icon-ru class="flag-icon" />
                </template>
                <span>{{ t('UserView.ru') }}</span>
              </a-menu-item>
              <a-menu-item @click="changeLanguage('en')" class="dropdown-item">
                <template #icon class="dropdown-content">
                  <icon-en class="flag-icon" />
                </template>
                <span>{{ t('UserView.en') }}</span>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </a-menu-item>
    </a-menu>
  </div>
</template>

<script setup>
import { shallowRef, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import useModal from '@/composables/useModal.js'
import { useCore } from '@/store/core.pinia.js'
import { useUser } from '@/store/user.pinia.js'
import UserFormComponent from '@/pages/dashboard/user/components/form/UserFormComponent.vue'
import UserPasswordFormComponent from '../../pages/dashboard/user/components/form/UserPasswordFormComponent.vue'
import IconRu from '../../components/icons/lang/IconRu.vue'
import IconUz from '../../components/icons/lang/IconUz.vue'
import IconLogout from '../../components/icons/outline/IconLogout.vue'
import IconUser from '../../components/icons/outline/IconUser.vue'
import IconLock from '../../components/icons/outline/IconKey.vue'
import IconEn from '../../components/icons/lang/IconEn.vue'

const { t, locale } = useI18n()
const { open } = useModal()
const corePinia = useCore()
const userPinia = useUser()
const { user } = storeToRefs(userPinia)
const renderKey = ref(0)

const logOut = () => {
  window.onbeforeunload = null
  corePinia.logout()
  setTimeout(() => {
    window.location.reload(true)
  })
}

const changeLanguage = (newLocale) => {
  locale.value = newLocale
  corePinia.setLocale(newLocale)
  renderKey.value += 1
}

const getCurrentLanguageIcon = () => {
  const currentLocale = corePinia.locale
  switch (currentLocale) {
    case 'uz':
      return IconUz
    case 'ru':
      return IconRu
    case 'en':
      return IconEn
    default:
      return IconEn
  }
}

function openProfileForm() {
  if (!user.value) {
    console.error('User data is not available')
    return
  }
  open({
    title: t('UserView.editProfile'),
    closable: true,
    width: '600px',
    component: UserFormComponent,
    props: {
      userData: user.value,
      isProfileEdit: true,
      modalKey: `profile-${Date.now()}`
    }
  })
}

function openPasswordForm() {
  if (!user.value) {
    console.error('User data is not available')
    return
  }
  open({
    title: t('SET_PASSWORD'),
    closable: true,
    width: '600px',
    component: UserPasswordFormComponent,
    props: {
      userData: user.value,
      modalKey: `password-${Date.now()}`
    }
  })
}
</script>

<style lang="scss" scoped>
.user-info {
  width: 300px;
  .user-info-menu {
    border: none;
    box-shadow: none;
    background: transparent;
    .menu-item {
      padding: 8px 12px;
      margin-bottom: 2px;
      border-radius: 4px;

      &:hover {
        background: #f5f5f5;
      }

      .menu-content {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 180px;
        .menu-icon {
          width: 16px;
          height: 16px;
          color: #666;
        }

        .menu-text {
          font-size: 14px;
          font-weight: 500;
        }

        .dropdown-arrow {
          width: 18px;
          height: 18px;
          color: #666;
        }

        .current-lang-icon {
          width: 18px;
          height: 18px;
        }
      }
    }
  }

  .language-dropdown {
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .dropdown-item {
      padding: 6px 12px;

      &:hover {
        background: #f5f5f5;
      }

      .dropdown-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;

        .flag-icon {
          width: 16px;
          height: 12px;
        }

        span {
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }
      }
    }
  }
}
</style>
