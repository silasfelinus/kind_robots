<template>
  <streaming-tooltip
    v-if="page?.tooltip && page?.amitip"
    :tooltip="page.tooltip"
    :amitip="page.amitip"
    class="w-full h-full overflow-visible"
  />
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
  tooltip?: string
}

// Fetch the page data using Nuxt Content v3
const { data: page } = await useAsyncData<PageData>(`${name}`, async () => {
  const result = await queryCollection('content').path(`${name}`).first()
  return result || {}
})
</script>
