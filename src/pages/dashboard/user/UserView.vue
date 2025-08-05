<template>
  <div class="page-wrapper">
    <page-header
      :title="
        user.role === 'DIRECTOR'
          ? t('UserView.title')
          : t('UserOrganizationView.name')
      "
      :back-icon="user.role === 'DIRECTOR' ? false : undefined"
      @back="router.push('/dashboard/organizations')"
    >
      <template #actions>
        <div class="desktop-filters">
          <user-filter-component
            @addUser="showCreateUserModal"
            @search="handleSearch"
          />
        </div>
      </template>
    </page-header>
    <div class="mobile-filters">
      <user-filter-component
        @addUser="showCreateUserModal"
        @search="handleSearch"
      />
    </div>
    <user-table-component />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUser } from '@/store/user.pinia'
import UserTableComponent from './components/UserTableComponent.vue'
import UserFilterComponent from './components/UserFilterComponent.vue'
import PageHeader from '@/components/PageHeaderComponent.vue'
import useModal from '@/composables/useModal'
import UserForm from './components/form/UserFormComponent.vue'

const { t } = useI18n()
const router = useRouter()
const userStore = useUser()
const { open } = useModal()
const { user } = storeToRefs(userStore)

const showCreateUserModal = () => {
  open({
    title: t('UserOrganizationView.create'),
    width: 800,
    component: UserForm,
    type: 'user-form',
    props: { orgId: user.value.organization?.id }
  })
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/variable.scss';

.page-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.desktop-filters {
  display: block;
}

.mobile-filters {
  display: none;
}

@media (max-width: 1264px) {
  .desktop-filters {
    display: none;
  }

  .mobile-filters {
    display: block;
  }
}
</style>
