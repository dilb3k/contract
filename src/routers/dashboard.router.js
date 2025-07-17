import UserView from '../pages/dashboard/user/UserView.vue'

const dashboardRouter = [
  {
    path: 'users',
    name: 'UserView',
    component: UserView,
    meta: {
      roles: ['ROLE_DIRECTOR']
    }
  },
]

export default dashboardRouter