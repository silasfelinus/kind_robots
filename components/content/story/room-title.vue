<template>
  <div class="text-center">
    <h1
      v-if="page && page.title"
      class="text-xl inline-block rounded-2xl p-1 border m-1 bg-secondary shadow-lg"
    >
      The {{ page.title }} Room
    </h1>
    <h1 v-else class="text-xl inline-block rounded-2xl border m-1 shadow-lg">
      🌈 Fetching details...
    </h1>
    <pre>{{ page }}</pre>
    <!-- Debugging output -->
  </div>
</template>

<script setup lang="ts">
import type { ContentType } from '~/content.config'

// Get the route params
const route = useRoute()

const { data: page } = await useAsyncData(route.path, async () => {
  return (await queryCollection('content')
    .path(route.path)
    .first()) as ContentType | null
})
</script>
