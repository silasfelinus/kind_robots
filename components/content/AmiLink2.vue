<template>
  <div class="flex items-center">
    <SiteLogo />
    <button v-if="!isLoading" class="ml-4 btn btn-primary" @click="openPageAndReleaseButterflies">
      We are AMIb0t!
    </button>
    <div v-if="isLoading" class="fixed inset-0 flex items-center justify-center">
      <div
        class="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary-500"
      ></div>
    </div>
    <AmiSwarm v-if="showButterflies" />
  </div>
</template>

<script setup>
let isLoading = ref(false)
let showButterflies = ref(false)
const router = useRouter()

const openPageAndReleaseButterflies = () => {
  isLoading.value = true
  setTimeout(() => {
    showButterflies.value = true
    router.push('/kindrobots/amibot')
    isLoading.value = false
  }, 2000)
}
</script>
