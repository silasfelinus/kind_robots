<template>
  <div class="flex items-center">
    <SiteLogo />
    <button v-if="!isLoading" class="ml-4 btn btn-primary" @click="openExternalLink">
      AMI's Fundraiser!
    </button>
    <div v-if="isLoading" class="fixed inset-0 flex items-center justify-center">
      <div
        class="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary-500"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

let isLoading = ref(false)

const openExternalLink = () => {
  isLoading.value = true
  setTimeout(() => {
    window.open('https://www.againstmalaria.com/amibot', '_blank')
    isLoading.value = false
  }, 2000)
}
</script>
