<script setup>
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";

const {t} = useI18n()
const router = useRouter()
const route = useRoute()
</script>
<template>
  <div class="p-6 h-screen flex flex-col justify-center items-center">
    <a-result :sub-title="t('PAGE404')" status="404" title="404" class="flex flex-col justify-center items-center">
      <template
        #extra>
        <a-button size="large" type="primary" @click="router.back()">
          {{ t('BACK') }}
        </a-button>
      </template>
    </a-result>
  </div>
</template>