<template>
  <div class="container mx-auto px-4">
    <div class="flex flex-col min-h-screen justify-between">
      <div>
        <nuxt-link to="/welcome">
          <img
            v-if="imageLoaded"
            :src="'/images/kindtitle.webp'"
            class="mx-auto"
            alt="Title"
            @load="onImageLoad"
          />
        </nuxt-link>
      </div>
      <nuxt-page />
    </div>
    <loading-bar />

    <h2 class="text-center text-xl font-bold mb-4">Stores Loading Status</h2>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const imageLoaded = ref(false)

const onImageLoad = () => {
  imageLoaded.value = true
}
</script>
