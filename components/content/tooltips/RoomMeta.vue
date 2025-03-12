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
import type { ContentType } from '~/content.config'

// Get the route params
const route = useRoute()

const page = computed(() => {
  const { data } = useAsyncData(route.path, async () => {
    return (await queryCollection('content')
      .path(route.path)
      .first()) as ContentType | null
  })
  return data.value
})
</script>
