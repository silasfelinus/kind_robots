<template>
  <div class="flex flex-col justify-center items-center">
    <!-- Image -->
    <div class="flex justify-center items-center m-1">
      <img
        v-if="page?.image"
        :src="'/images/' + page.image"
        alt="Main Image"
        class="rounded-2xl border shadow-md medium"
      />
    </div>
    <!-- Title and Subtitle -->
    <div class="flex flex-col justify-center items-center">
      <room-title class="text-lg font-semibold m-2" />
      <h2 v-if="page?.subtitle" class="text-md font-medium">
        {{ page.subtitle }}
      </h2>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAsyncData } from '#app'

// Get the route params
const route = useRoute()
const name = route.params.name as string

// Define expected content structure
interface PageData {
  title?: string
  description?: string
  subtitle?: string
  image?: string
  icon?: string
  underConstruction?: boolean
  dottitip?: string
  amitip?: string
}

// Fetch the page data using Nuxt Content v3
const { data: page } = await useAsyncData<PageData>(`${name}`, async () => {
  const result = await queryCollection('content').path(`${name}`).first()
  return result || {}
})
</script>
