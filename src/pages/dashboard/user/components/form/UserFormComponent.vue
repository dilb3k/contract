<script setup>
import { onBeforeMount, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import useValidation from '@/composables/validations.js'
import useUser from '@/store/user.pinia.js'
import useModal from '@/composables/useModal.js'

const props = defineProps({
  user: Object,
  modalKey: Number,
})

const { t } = useI18n()
const {close}= useModal()
const { requiredField } = useValidation()
const userPinia = useUser()
const { userForm, userLoader } = storeToRefs(userPinia)
onBeforeMount(()=>{
  if (props.user){
    userForm.value.firstName = props.user?.firstName
    userForm.value.lastName = props.user?.lastName
    userForm.value.username = props.user?.username
  }
})
onUnmounted(()=>{
  userForm.value = {}
})

function closeForm(){
  close(props.modalKey)
  userForm.value = {}
}
function formFinish() {
  if (props.user?.id){
    userPinia.editUser(props.user?.id, props.modalKey)
  }else {
    userPinia.createUser(props.modalKey)
  }
}
</script>

<template>
    <a-form :model="userForm" layout="vertical" :id="modalKey" @finish="formFinish">
      <div class="modal-form">
      <a-row :gutter="[16, 0]">
        <a-col :lg="12" :md="24" :sm="24">
          <a-form-item
            :label="t('UserView.firstName')"
            name="firstName"
            :rules="[requiredField]"
          >
            <a-input size="large" v-model:value="userForm.firstName" :placeholder="t('UserView.enterFirstName')"/>
          </a-form-item>
        </a-col>

        <a-col :lg="12" :md="24" :sm="24">
          <a-form-item
            :label="t('UserView.lastName')"
            name="lastName"
            :rules="[requiredField]"
          >
            <a-input size="large" v-model:value="userForm.lastName" :placeholder="t('UserView.enterLastName')"/>
          </a-form-item>
        </a-col>

        <a-col :lg="12" :md="24" :sm="24">
          <a-form-item
            :label="t('UserView.username')"
            name="username"
            :rules="[requiredField]"
          >
            <a-input size="large" v-model:value="userForm.username" :placeholder="t('UserView.enterUsername')"/>
          </a-form-item>
        </a-col>

        <a-col :lg="12" :md="24" :sm="24">
          <a-form-item
            :label="t('UserView.password')"
            name="password"
            :rules="[user?.id ? {} : requiredField]"
          >
            <a-input-password size="large" :placeholder="t('UserView.enterPassword')" v-model:value="userForm.password" />
          </a-form-item>
        </a-col>
      </a-row>
      </div>

      <div class="modal-buttons">
        <a-button size="large" @click="closeForm">{{t('CLOSE')}}</a-button>
        <a-button size="large" type="primary" html-type="submit" :loading="userLoader">{{t('SAVE')}}</a-button>
      </div>
    </a-form>
</template>
