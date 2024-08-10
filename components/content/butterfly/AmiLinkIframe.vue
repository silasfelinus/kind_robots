<template>
  <div class="flex items-center">
    <SiteLogo />
    <button
      v-if="!isLoading"
      class="ml-4 btn btn-primary"
      @click="showIframe"
    >
      AMI's Fundraiser!
    </button>
    <div
      v-if="isLoading"
      class="fixed inset-0 flex items-center justify-center"
    >
      <div class="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary-500" />
    </div>
    <iframe
      v-if="iframeVisible"
      :src="iframeSrc"
      class="iframe-class"
    />
  </div>
</template>

<script setup>
const isLoading = ref(false)
const iframeVisible = ref(false)
const iframeSrc = ref('')

const showIframe = () => {
  isLoading.value = true
  setTimeout(() => {
    iframeSrc.value = 'https://www.againstmalaria.com/amibot'
    iframeVisible.value = true
    isLoading.value = false
  }, 2000)
}
</script>

<style>
.iframe-class {
  width: 100%;
  height: 600px;
  border: none;
}
</style>
