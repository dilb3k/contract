<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <a-row class="h-screen">
    <a-col
      :md="14"
      class="md:flex hidden flex-col justify-center items-center bg-gray-300 lg:px-12 px-8"
    >
      <h2
        class="lg:text-5xl md:text-4xl text-xl mx-auto w-full font-bold leading-[130%]"
      >
        {{ t('LoginView.about') }}
      </h2>
      <p class="lg:text-xl sm:text-lg">{{ t('LoginView.description') }}</p>
    </a-col>
    <a-col :md="10" class="bg-white flex items-center justify-center">
      <a-row :justify="'center'" class="w-full">
        <a-col :xl="14" :lg="20" :md="22" :sm="14" :span="20">
          <h1
            class="my-3 lg:text-3xl md:text-2xl md:text-center text-4xl lg:text-left font-bold leading-[130%]"
          >
            {{ t(`LoginView.enter`) }}
          </h1>
          <p class="text-gray text-left md:text-center lg:text-left">
            {{ t(`LoginView.loginDescription`) }}
          </p>
          <router-view />
        </a-col>
      </a-row>
    </a-col>
  </a-row>
</template>

<style lang="scss" scoped></style>
