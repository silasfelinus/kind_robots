<template>
  <div v-if="page">{{ page }}</div>
  <div v-else>Loading...</div>
</template>

<script setup lang="ts">
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
  tooltip?: string
  message?: string
}

// Fetch the page data using Nuxt Content v3
const { data: page } = await useAsyncData<PageData>(`${name}`, async () => {
  const result = await queryCollection('content').path(`${name}`).first()
  return result || {}
})
</script>
