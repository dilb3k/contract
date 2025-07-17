<script setup>
import { reactive, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { debounce } from '@/utils/helpers/index.js'
import useModal from '@/composables/useModal.js'
import useQueryParams from '@/composables/useQueryParams.js'
import useUser from '@/store/user.pinia.js'
import IconPlus from '@/components/icons/solid/IconPlus.vue'
import UserFormComponent from '@/pages/dashboard/user/components/form/UserFormComponent.vue'

const { t } = useI18n()
const {open} = useModal()
const { setQueries, getQueries } = useQueryParams()
const userPinia = useUser()
const {user}=storeToRefs(userPinia)
const statuses = reactive([
  {
    label: t('ACTIVE'),
    value: 'ACTIVE'
  },
  {
    label: t('IN_ACTIVE'),
    value: 'IN_ACTIVE'
  }
])

const selectedStatus = ref(getQueries().status)

function handleChangeStatus(value) {
  setQueries({
    page: 1,
    status: value?.trim() || undefined
  })
}

const handleSearch = debounce(({ target }) => {
  setQueries({
    page: 1,
    search: target.value?.trim() || undefined
  })
}, 500)

function createUser(){
  open({
    title: t('UserView.create'),
    closable: true,
    width: '600px',
    component: shallowRef(UserFormComponent),
  })
}
</script>

<template>
  <a-space class="px-4">
    <a-input
      :placeholder="t('SEARCH')"
      allow-clear
      size="large"
      style="width: 180px"
      @input="handleSearch"
    />

    <a-select
      v-model:value="selectedStatus"
      :options="statuses"
      :placeholder="t('SELECT_STATUS')"
      allow-clear
      size="large"
      style="width: 160px"
      @change="handleChangeStatus"
    />

    <a-button v-if="user.role !== 'ROLE_OPERATOR'" size="large" type="primary" @click="createUser">
      <template #icon>
        <IconPlus class="text-lg" />
      </template>
      {{ t('ADD') }}
    </a-button>
  </a-space>
</template>
