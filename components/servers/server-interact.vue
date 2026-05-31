<!-- /components/server/server-interact.vue -->
<template>
  <section class="flex w-full flex-col gap-4 rounded-2xl bg-base-200 p-4">
    <header class="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 text-center shadow-md lg:flex-row lg:items-center lg:justify-between lg:text-left">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold text-primary md:text-3xl">
          Server Tools
        </h1>
        <p class="mx-auto mt-2 max-w-3xl text-sm text-base-content/70 lg:mx-0">
          Manage only real access points. Routes decide capabilities. Mana decides billing.
        </p>
      </div>

      <div class="flex flex-wrap justify-center gap-2 lg:justify-end">
        <button class="btn btn-primary rounded-xl" type="button" @click="startServerPreset('COMFY')">
          Comfy
        </button>
        <button class="btn btn-secondary rounded-xl" type="button" @click="startServerPreset('A1111')">
          A1111
        </button>
        <button class="btn rounded-xl" type="button" @click="startServerPreset('OPENAI')">
          OpenAI
        </button>
        <button class="btn rounded-xl" type="button" @click="startServerPreset('ANTHROPIC')">
          Anthropic
        </button>
      </div>
    </header>

    <add-server v-if="showServerForm" />

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <h2 class="font-black text-primary">Active Art Server</h2>
        <p class="mt-1 text-sm text-base-content/60">
          {{ artSummary }}
        </p>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <h2 class="font-black text-secondary">Active Text Server</h2>
        <p class="mt-1 text-sm text-base-content/60">
          {{ textSummary }}
        </p>
      </div>
    </div>

    <server-gallery mode="all" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import type { ServerType } from '~/prisma/generated/prisma/client'

const serverStore = useServerStore()
const showServerForm = ref(false)

const artSummary = computed(() => {
  const server = serverStore.activeArtServer
  return server ? `${server.label || server.title} · ${server.serverType}` : 'No art server selected.'
})

const textSummary = computed(() => {
  const server = serverStore.activeTextServer
  return server ? `${server.label || server.title} · ${server.serverType}` : 'No text server selected.'
})

function startServerPreset(serverType: ServerType) {
  serverStore.createNewServer?.(serverType)
  serverStore.openServerForm?.()
  showServerForm.value = true
}

onMounted(async () => {
  if (!serverStore.hasLoaded) {
    await serverStore.initialize({
      fetchRemote: true,
    })
  }
})
</script>
