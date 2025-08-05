<template>
  <a-form :model="formState" layout="vertical" @finish="handleSubmit" autocomplete="off">
    <a-form-item
      v-if="showOldPassword"
      :label="t('UserView.old_password')"
      name="oldPassword"
      :rules="[{ required: true, message: t('REQUIRED_FIELD') }]"
    >
      <a-input-password
        v-model:value="formState.oldPassword"
        :placeholder="t('UserView.enterOldPassword')"
        autocomplete="current-password"
      />
    </a-form-item>

    <a-form-item
      :label="t('UserView.new_password')"
      name="newPassword"
      :rules="[{ required: true, message: t('REQUIRED_FIELD') }]"
    >
      <a-input-password
        v-model:value="formState.newPassword"
        :placeholder="t('UserView.enterNewPassword')"
        autocomplete="new-password"
      />
    </a-form-item>

    <div class="form-actions">
      <a-button @click="closeModal">{{ t('CANCEL') }}</a-button>
      <a-button type="primary" html-type="submit" :loading="loading">
        {{ t('SAVE') }}
      </a-button>
    </div>
  </a-form>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { useUser } from '@/store/user.pinia'
import { useOrganization } from '@/store/organization.pinia'
import useModal from '@/composables/useModal'

const { t } = useI18n()
const { close } = useModal()

const props = defineProps({
  userData: { type: Object, default: null },
  username: { type: String, default: '' },
  modalKey: { type: [Number, String], default: null }
})

const loading = ref(false)
const formState = reactive({
  oldPassword: '',
  newPassword: ''
})

const showOldPassword = computed(() => !!props.userData?.id)
const closeModal = () => {
  close(props.modalKey)
  formState.oldPassword = ''
  formState.newPassword = ''
}

const handleSubmit = async () => {
  loading.value = true
  try {
    if (showOldPassword.value) {
      const userStore = useUser()
      await userStore.setUserPassword(props.userData.id, {
        oldPassword: formState.oldPassword,
        newPassword: formState.newPassword
      })
    } else if (props.username) {
      const orgStore = useOrganization()
      await orgStore.setUserPassword({
        username: props.username,
        password: formState.newPassword
      })
    } else {
      message.error(t('notification_component.user_data_missing'))
      return
    }

    message.success(t('notification_component.password_updated'))
    closeModal()
  } catch (error) {
    console.error('Set password error:', error.response?.data || error.message)
    const errorMessage =
      error.response?.data?.message || t('notification_component.error_update_password')
    message.error(errorMessage)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/variable.scss';

.form-actions {
  margin-top: $spacing-md;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: $spacing-sm;
}

:deep(.ant-input-password) {
  border-color: rgba($primary, 0.5);

  &:hover {
    border-color: darken($primary, 5%);
  }

  &:active {
    border-color: darken($primary, 8%);
  }

  &::placeholder {
    color: rgba($primary, 0.6);
  }
}

:deep(.ant-btn-primary) {
  background-color: $primary;
  color: $white;

  &:hover {
    background-color: darken($primary, 5%);
  }

  &:active {
    background-color: darken($primary, 8%);
  }
}
</style>
