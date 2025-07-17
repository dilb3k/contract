<script setup>
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import useValidation from '@/composables/validations.js'
import useAuth from '@/store/auth.pinia.js'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import useCore from '@/store/core.pinia.js'

const { t } = useI18n()
const { requiredField } = useValidation()
const authPinia = useAuth()
const corePinia = useCore()
const {loginLoader} = storeToRefs(authPinia)
const router = useRouter()

const form = reactive({
  username: null,
  password: null,
})

function onFinish() {
  authPinia.login(form)
}
</script>

<template>
  <a-form
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
      />
    </a-form-item>

    <a-flex>
      <a-button
        :loading="loginLoader"
        html-type="submit"
        type="primary"
      >
        {{ t('LoginView.enter') }}
      </a-button>
    </a-flex>

  </a-form>

</template>

<style lang="scss" scoped></style>
