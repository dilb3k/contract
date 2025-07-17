import { useI18n } from 'vue-i18n'
export const userColumns = () => {
  const { t } = useI18n()
  return [
    {
      title: '№',
      dataIndex: 'colIndex',
      width: 50
    },
    {
      title: t('UserView.name'),
      dataIndex: 'firstName',
      width: 300
    },
    {
      title: t('UserView.userName'),
      dataIndex: 'username',
      width: 200
    },
    {
      title: t('UserView.role'),
      dataIndex: 'role',
      width: 150
    },
    {
      title: t('UserView.status'),
      dataIndex: 'status',
      width: 150
    },
    {
      dataIndex: 'actions',
      width: 150
    },
  ]
}

export const templateColumns = () => {
  const { t } = useI18n()
    return [
      {
        title: '№',
        dataIndex: 'colIndex',
        width: 50
      },
      {
        title: t('TemplatesView.name'),
        dataIndex: 'name',
        width:650
      },
      {
        dataIndex: 'create',
        width:150
      },
      {
        dataIndex: 'actions',
        width:150
      },
    ]
}

export const contractColumns = () => {
  const { t } = useI18n()
  return [
    {
      title: '№',
      dataIndex: 'colIndex',
      width: 50
    },
    {
      title: t('ContractsView.name'),
      dataIndex: 'name',
      width:800
    },
    {
      dataIndex: 'actions',
      width:150
    },
  ]
}

export const downloadColumns = () => {
  const { t } = useI18n()
  return [
    {
      title: '№',
      dataIndex: 'colIndex',
      width: 50
    },
    {
      title: t('DownloadsView.fileType'),
      dataIndex: 'fileType',
      width:300
    },
    {
      title: t('DownloadsView.status'),
      dataIndex: 'status',
      width:300
    },
    {
      title: t('DownloadsView.date'),
      dataIndex: 'date',
      width:200
    },
    {
      dataIndex: 'actions',
      width:150
    },
  ]
}

export const organizationColumns = () => {
  const { t } = useI18n()
  return [
    {
      title: '№',
      dataIndex: 'colIndex',
      width: 50
    },
    {
      title: t('OrganizationView.name'),
      dataIndex: 'name',
      width:550
    },
    {
      dataIndex: 'contracts',
      width:150
    },
    {
      dataIndex: 'actions',
      width:150
    },
  ]
}

export const organizationUserColumns = () => {
  const { t } = useI18n()
  return [
    {
      title: '№',
      dataIndex: 'colIndex',
      width: 50
    },
    {
      title: t('UserView.name'),
      dataIndex: 'firstName',
      width: 300
    },
    {
      title: t('UserView.userName'),
      dataIndex: 'username',
      width: 200
    },
    {
      title: t('UserView.role'),
      dataIndex: 'role',
      width: 150
    },
    {
      title: t('UserView.status'),
      dataIndex: 'status',
      width: 150
    },
    {
      dataIndex: 'actions',
      width: 150
    },
  ]
}

export const organizationContractsColumns = () => {
  const { t } = useI18n()
  return [
    {
      title: '№',
      dataIndex: 'colIndex',
      width: 50
    },
    {
      title: t('UserView.name'),
      dataIndex: 'name',
      width: 500
    },
    {
      title: t('OrganizationView.createdBy'),
      dataIndex: 'createdBy',
      width: 300
    },
    {
      dataIndex: 'actions',
      width: 150
    },
  ]
}
