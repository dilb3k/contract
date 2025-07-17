<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import useQueryParams from '@/composables/useQueryParams.js'

const route = useRoute()
const { setQueries } = useQueryParams()
const emits = defineEmits(['changeSize', 'onChange'])
const pageSizeOptions = ref([10, 20, 30])
const currentPage = computed(() => (route.query.page ? +route.query.page : 1))
const size = computed(() => (route.query.size ? +route.query.size : 10))

const props = defineProps({
  total: {
    type: Number,
    default: 100
  }
})

function handleChangeSelect(event) {
  emits('changeSize', event)
  setQueries({
    page: 1,
    size: event
  })
}

const onChange = (e) => {
  emits('onChange', e)
  setQueries({
    page: e
  })
}
</script>

<template>
  <div class="pagination w-full flex items-center justify-between gap-2 mt-4">
    <div class="p-[8px] bg-white rounded-2xl">
      <a-select
        size="large"
        ref="select"
        :value="size"
        class="w-20 md:w-[180px]"
        @change="handleChangeSelect"
      >
        <a-select-option
          v-for="item in pageSizeOptions"
          :value="item"
          :key="item"
        >
          <p>
            <span class="text-sm font-bold">{{ item }}</span>
          </p>
        </a-select-option>
      </a-select>
    </div>
    <div class="p-[8px] bg-white rounded-2xl">
      <a-pagination
        :current="currentPage"
        :page-size="size"
        :total="total"
        :show-size-changer="false"
        @change="onChange"
      />
    </div>
  </div>
</template>

<style lang="scss">
@import '@/assets/styles/variable.scss';
</style>
