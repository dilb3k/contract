<script setup>
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";

const {t} = useI18n()
const router = useRouter()
</script>
<template>
  <div class="p-6 h-screen flex flex-col justify-center items-center">
    <a-result :sub-title="t('PAGE500')" status="500" title="500" class="flex flex-col justify-center items-center">
      <template
        #extra>
        <a-button size="large" type="primary" @click="router.push('/dashboard')">
          {{ t('GO_HOME') }}
        </a-button>
      </template>
    </a-result>
  </div>
</template>