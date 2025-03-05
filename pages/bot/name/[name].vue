<template>
  <main>
    <NuxtLayout :name="layout">
      <ContentRenderer v-if="page" :value="page" />
      <template v-else>
        <p>Bot Not Found</p>
      </template>
    </NuxtLayout>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAsyncData } from '#app'
import type { LayoutKey } from '#build/types/layouts'

// Get the route params
const route = useRoute()
const name = route.params.name as string

// Define the expected bot page structure
interface BotPage {
  layout?: string
  title?: string
  content?: string
  subtitle?: string
}

// Fetch the bot's page data using the latest Nuxt Content v3 syntax
const { data: page } = await useAsyncData<BotPage>(`bot-${name}`, async () => {
  const result = await queryCollection('content').path(`/bot/${name}`).first()
  return result || {}
})

// Compute the layout key properly
const layout = computed(() => (page.value?.layout ?? 'default') as LayoutKey)
</script>
