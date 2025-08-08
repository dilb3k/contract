import UserView from '../pages/dashboard/user/UserView.vue';
import DownloadsView from '../pages/dashboard/downloads/DownloadView.vue';
import OrganizationView from '../pages/dashboard/organizations/OrganizationView.vue';
import ContractsView from '../pages/dashboard/contracts/ContractsView.vue';
import TemplatesView from '../pages/dashboard/templates/TemplatesView.vue';
import ContractPermissions from '../pages/child-page/permission/ContractPermissionsTable.vue';
import TemplatePermissions from '../pages/child-page/permission/TemplatePermissionsTable.vue';

const dashboardRouter = [
  {
    path: 'users',
    name: 'UserView',
    component: UserView,
    meta: {
      roles: ['DIRECTOR', 'ADMIN'],
    },
  },
  {
    path: 'organizations',
    name: 'OrganizationView',
    component: OrganizationView,
    meta: {
      roles: ['ADMIN'],
    },
  },
  {
    path: 'templates',
    name: 'TemplatesView',
    component: TemplatesView,
    meta: {
      roles: ['DIRECTOR', 'OPERATOR'],
    },
  },
  {
    path: 'contracts',
    name: 'ContractsView',
    component: ContractsView,
    meta: {
      roles: ['DIRECTOR', 'OPERATOR', 'ADMIN'],
    },
  },
  {
    path: 'downloads',
    name: 'DownloadsView',
    component: DownloadsView,
    meta: {
      roles: ['DIRECTOR', 'OPERATOR'],
    },
  },
  {
    path: 'templates/permissions/:id',
    name: 'TemplatePermissions',
    component: TemplatePermissions,
    meta: {
      roles: ['DIRECTOR'],
    },
  },
  {
    path: 'contracts/permissions/:id',
    name: 'ContractPermissions',
    component: ContractPermissions,
    meta: {
      roles: ['DIRECTOR'],
    },
  },
];

export default dashboardRouter;