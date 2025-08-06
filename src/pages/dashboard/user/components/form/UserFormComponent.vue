<template>
  <a-form
    :model="formState"
    layout="vertical"
    @finish="handleSubmit"
    autocomplete="off"
  >
    <a-form-item
      :label="t('UserView.firstName')"
      name="fullName"
      :rules="[{ required: true, message: t('REQUIRED_FIELD') }]"
    >
      <a-input
        v-model:value="formState.fullName"
        :placeholder="t('UserView.enterFirstName')"
        autocomplete="off"
      />
    </a-form-item>
    <a-form-item
      :label="t('UserView.username')"
      name="username"
      :rules="[{ required: true, message: t('REQUIRED_FIELD') }]"
      autocomplete="off"
    >
      <a-input
        v-model:value="formState.username"
        :placeholder="t('UserView.enterUsername')"
        :rules="[
          { required: true, message: t('REQUIRED_FIELD') },
          { max: 24, message: t('MAX_LENGTH_24') }
        ]"
        autocomplete="off"
      />
    </a-form-item>
    <template v-if="!props.userData">
      <a-form-item
        :label="t('UserView.password')"
        name="password"
        :rules="[{ required: true, message: t('REQUIRED_FIELD') }]"
        autocomplete="new-password"
      >
        <a-input-password
          v-model:value="formState.password"
          :placeholder="t('UserView.enterPassword')"
          autocomplete="new-password"
        />
      </a-form-item>
    </template>
    <a-form-item
      v-if="!isProfileEdit"
      :label="t('UserView.role')"
      name="role"
      :rules="[{ required: true, message: t('REQUIRED_FIELD') }]"
    >
      <a-select
        v-model:value="formState.role"
        :placeholder="t('OrganizationView.select_role')"
      >
        <a-select-option value="DIRECTOR">
          {{ t('ROLE_DIRECTOR') }}
        </a-select-option>
        <a-select-option value="OPERATOR">
          {{ t('ROLE_OPERATOR') }}
        </a-select-option>
      </a-select>
    </a-form-item>

    <a-form-item
      v-if="props.userData && !isProfileEdit"
      :label="t('UserView.status')"
      name="status"
    >
      <a-switch v-model:checked="formState.status" />
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
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { storeToRefs } from 'pinia'
import { useOrganization } from '@/store/organization.pinia'
import { useUser } from '@/store/user.pinia'
import useModal from '@/composables/useModal'
import { useRoute } from 'vue-router'

const { t } = useI18n()
const { close } = useModal()
const organizationStore = useOrganization()
const userStore = useUser()
const { user } = storeToRefs(userStore)
const route = useRoute()

const props = defineProps({
  orgId: { type: Number, default: null },
  userData: { type: Object, default: null },
  modalKey: { type: Number, default: null },
  isProfileEdit: { type: Boolean, default: false }
})

const loading = ref(false)

const defaultFormState = {
  fullName: '',
  username: '',
  password: '',
  role: '',
  status: true,
  organizationId: null
}

const formState = reactive({ ...defaultFormState })

const organizationId = computed(
  () => props.orgId || user.value.organization?.id || route.params.id
)

watch(
  () => [props.userData, organizationId.value],
  ([newUserData, newOrgId]) => {
    formState.fullName = newUserData?.fullName || ''
    formState.username = newUserData?.username || ''
    if (!props.isProfileEdit) {
      formState.role = newUserData?.role || ''
    }
    formState.organizationId = newOrgId
    formState.password = ''
    const rawStatus = newUserData?.status
    formState.status =
      typeof rawStatus === 'string'
        ? rawStatus.toUpperCase() === 'ACTIVE'
        : !!rawStatus
  },
  { immediate: true }
)

const closeModal = () => {
  close(props.modalKey)
}

const handleSubmit = async () => {
  if (!organizationId.value && !props.isProfileEdit) {
    message.error(t('notification_component.organization_not_selected'))
    return
  }

  try {
    loading.value = true

    const updatePayload = {
      fullName: formState.fullName,
      username: formState.username
    }

    if (!props.isProfileEdit) {
      updatePayload.role = formState.role
      updatePayload.status = formState.status ? 'ACTIVE' : 'INACTIVE'
    }

    if (props.userData) {
      const hasUserChanges =
        updatePayload.fullName !== props.userData.fullName ||
        updatePayload.username !== props.userData.username ||
        (!props.isProfileEdit && updatePayload.role !== props.userData.role) ||
        (!props.isProfileEdit && updatePayload.status !== props.userData.status)

      if (hasUserChanges) {
        await organizationStore.updateUser(
          props.userData.id,
          updatePayload,
          organizationId.value
        )
      }

      message.success(t('notification_component.user_updated'))
    } else {
      if (!formState.fullName || !formState.username || !formState.password) {
        message.error(t('notification_component.required_fields_missing'))
        return
      }

      updatePayload.password = formState.password
      updatePayload.role = formState.role
      updatePayload.status = formState.status ? 'ACTIVE' : 'INACTIVE'
      await organizationStore.createUser(updatePayload, organizationId.value)
      message.success(t('notification_component.user_created'))
    }

    closeModal()
  } catch (error) {
    message.error(
      error.response?.data?.message ||
        t(
          props.userData
            ? 'notification_component.error_update_user'
            : 'notification_component.error_already_user'
        )
    )
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

:deep(.ant-input),
:deep(.ant-input-password),
:deep(.ant-select-selector) {
  border-color: rgba($primary, 0.5);

  &:hover {
    border-color: darken($primary, 5%);
  }

  &:active {
    border-color: darken($primary, 8%);
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
