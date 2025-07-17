import { useRoute, useRouter } from 'vue-router'

function useQueryParams() {
  const route = useRoute()
  const router = useRouter()

  const getQueries = () => {
    const queries = { ...route?.query }
    queries.page =
      route?.query.page && +route?.query.page > 0 ? +route.query.page - 1 : 0
    queries.size = route?.query.size ? +route.query.size : null

    return queries
  }
  const setQueries = async ({ ...props }) => {
    if (!Object.keys(props).length) {
      await router.push({
        query: null
      })
      return
    }
    await router.push({
      query: Object.assign({ ...route?.query }, props)
    })
  }
  return {
    getQueries,
    setQueries
  }
}

export default useQueryParams
