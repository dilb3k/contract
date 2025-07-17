<script setup>
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { userColumns } from '@/constants/table.js'
import useUser from '@/store/user.pinia.js'
import useCore from '@/store/core.pinia.js'
import EmptyComponent from '@/components/EmptyComponent.vue'
import PaginationComponent from '@/components/PaginationComponent.vue'
import IconDown from '@/components/icons/solid/IconDown.vue'
import IconEdit from '@/components/icons/outline/IconEdit.vue'
import { shallowRef } from 'vue'
import UserFormComponent from '@/pages/dashboard/user/components/form/UserFormComponent.vue'
import useModal from '@/composables/useModal.js'
import IconTrash from '@/components/icons/outline/IconTrash.vue'

const { t } = useI18n()
const {open} = useModal()
const columns = userColumns()
const corePinia = useCore()
const userPinia = useUser()
const { users, userLoader } = storeToRefs(userPinia)
const roles = [
  'ROLE_OPERATOR',
  'ROLE_DIRECTOR',
]

function handleChangeRole(id, role) {
  userPinia.changeRoleUser(id, role)
}

function changeUserStatus(record) {
  const newStatus = record.status === 'ACTIVE' ? 'IN_ACTIVE' : 'ACTIVE'
  userPinia.changeStatusUser(record.id, newStatus)
}

function deleteUser(userId){
  userPinia.deleteUser(userId)
}

function editUser(row){
  open({
    title: t('UserView.create'),
    closable: true,
    width: '600px',
    component: shallowRef(UserFormComponent),
    props:{
      user: row
    }
  })
}
</script>
<template>
    <a-table
      class="custom-table-class"
      :columns="columns"
      :loading="userLoader"
      :data-source="users.content"
      :pagination="false"
      bordered
    >
      <template #emptyText>
        <empty-component />
      </template>
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.dataIndex === 'colIndex'">
          {{(index + 1) + users.page * users.size}}
        </template>
        <template v-if="column.dataIndex === 'firstName'">
          <span>{{record?.firstName }} {{ record?.lastName}}</span>
        </template>
        <template v-if="column.dataIndex === 'role'">
          <a-dropdown :disabled="record.role === 'ROLE_DIRECTOR'" placement="bottomRight" trigger="click" @click.stop>
            <a-button
              :loading="corePinia.isLoading(`user-change-role-${record.id}`)"
              size="small"
              class="flex items-center gap-x-2"
            >
              {{ t(record.role) }}
              <IconDown/>
            </a-button>
            <template #overlay>
                <a-menu>
                  <a-menu-item
                    v-for="role in roles"
                    :key="role"
                    @click="record.role !== role ? handleChangeRole(record?.id, role) : null"
                  >
                    {{ t(role) }}
                  </a-menu-item>
                </a-menu>
              </template>
          </a-dropdown>
        </template>
        <template v-if="column.dataIndex === 'status'">
          <a-switch
            :disabled="record.role === 'ROLE_DIRECTOR'"
            @change="changeUserStatus(record)"
            :loading="corePinia.isLoading(`user-change-status-${record.id}`)"
            :checked-children="t('ACTIVE')"
            :checked="record.status === 'ACTIVE'"
            :un-checked-children="t('IN_ACTIVE')"
          />
        </template>

        <template v-if="column.dataIndex === 'actions'">
          <a-flex v-if="record.role !== 'ROLE_DIRECTOR'" gap="small" justify="center">
            <a-button @click="editUser(record)" size="small">
              <IconEdit />
            </a-button>

            <a-popconfirm
              :ok-text="t('DELETE')"
              :cancel-text="t('CANCEL')"
              :title="t('SURE_DELETE')"
              @confirm="deleteUser(record.id)"
            >
              <a-button danger size="small">
                <IconTrash/>
              </a-button>
            </a-popconfirm>
          </a-flex>
        </template>


      </template>
    </a-table>
  <pagination-component :total="users.totalElements" />
</template>

<style lang="scss" scoped></style>
