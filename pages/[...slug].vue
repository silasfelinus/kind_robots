<template>
  <div>
    <NuxtLayout v-if="isMobile" name="mobile"> <ContentDoc /> </NuxtLayout>
    <NuxtLayout v-else :name="pageLayout"> <ContentDoc /> </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { page } = useContent()
const pageLayout = ref(page.layout || 'default')
const isMobile = ref(false)

onMounted(() => {
  isMobile.value = window.innerWidth <= 800
})
</script>
