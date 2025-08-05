<script setup>
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import useValidation from '@/composables/validations.js'
import useAuth from '@/store/auth.pinia.js'
import { storeToRefs } from 'pinia'

const { t } = useI18n()
const { requiredField } = useValidation()
const authPinia = useAuth()
const { loginLoader } = storeToRefs(authPinia)

const form = reactive({
  username: '',
  password: ''
})

const formRef = ref()

async function onFinish() {
  try {
    await formRef.value.validateFields()
    await authPinia.login(form)
  } catch (error) {
    console.error('Form validation error:', error)
  }
}
</script>

<template>
  <a-form
    ref="formRef"
    :model="form"
    layout="vertical"
    name="login-form"
    class="mt-4"
    @finish="onFinish"
  >
    <a-form-item
      :label="t('LoginView.login')"
      name="username"
      :rules="[requiredField]"
    >
      <a-input
        v-model:value="form.username"
        :placeholder="t('LoginView.loginPlaceholder')"
        size="large"
        :disabled="loginLoader"
        autocomplete="username"
      />
    </a-form-item>

    <a-form-item
      :label="t('LoginView.password')"
      name="password"
      :rules="[requiredField]"
    >
      <a-input-password
        v-model:value="form.password"
        :placeholder="t('LoginView.passwordPlaceholder')"
        size="large"
        :disabled="loginLoader"
        autocomplete="new-password"
      />
    </a-form-item>

    <a-flex justify="space-between" align="center">
      <a-button
        :loading="loginLoader"
        html-type="submit"
        type="primary"
        size="large"
      >
        {{ t('LoginView.enter') }}
      </a-button>
    </a-flex>
  </a-form>
</template>

<style lang="scss" scoped>
.ant-form-item {
  margin-bottom: 24px;
}
</style>
