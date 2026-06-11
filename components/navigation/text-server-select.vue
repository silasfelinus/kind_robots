<template>
  <section
    class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="min-w-0">
        <p
          class="text-xs font-black uppercase tracking-widest text-base-content/50"
        >
          Text server
        </p>

        <p class="truncate text-sm font-black text-base-content">
          {{ activeLabel }}
        </p>
      </div>

      <div class="badge shrink-0 rounded-xl" :class="billingBadgeClass">
        {{ billingLabel }}
      </div>
    </div>

    <select
      class="select select-sm select-bordered w-full rounded-2xl"
      :value="selectedValue"
      :disabled="isLoading"
      @change="handleSelect"
    >
      <option value="">Default text server</option>

      <option
        v-for="server in chatStore.generationServers"
        :key="server.id"
        :value="server.id"
      >
        {{ server.label || server.title || `Server #${server.id}` }}
        · {{ server.serverType }}
      </option>
    </select>

    <p class="text-xs leading-relaxed text-base-content/60">
      {{ helperText }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { useServerStore } from '@/stores/serverStore'
import type { Server } from '~/prisma/generated/prisma/client'

const chatStore = useChatStore()
const serverStore = useServerStore()
const isLoading = ref(false)

const activeServer = computed<Server | null>(() => {
  return chatStore.activeGenerationServer
})

const selectedValue = computed(() => {
  return activeServer.value?.id ? String(activeServer.value.id) : ''
})

const activeLabel = computed(() => {
  const server = activeServer.value

  if (!server) return 'Default OpenAI'

  return server.label || server.title || `Server #${server.id}`
})

const usesOwnResource = computed(() => {
  const server = activeServer.value

  if (!server) return false

  return chatStore.serverUsesOwnResource(server)
})

const billingLabel = computed(() => {
  if (!activeServer.value) return 'Mana'
  if (usesOwnResource.value) return 'Own resource'

  return 'Mana'
})

const billingBadgeClass = computed(() => {
  return usesOwnResource.value ? 'badge-success' : 'badge-warning'
})

const helperText = computed(() => {
  const server = activeServer.value

  if (!server) {
    return 'Using the hosted default text model. This spends mana.'
  }

  if (usesOwnResource.value) {
    return 'Using a local, browser, BYOK, owned, or non-official public text server. This should not spend mana.'
  }

  return 'Using an official hosted text server. This spends mana.'
})

async function handleSelect(event: Event) {
  const target = event.target as HTMLSelectElement
  const serverId = Number(target.value) || null

  chatStore.selectGenerationServer(serverId)

  if (serverId && typeof serverStore.setActiveTextServer === 'function') {
    serverStore.setActiveTextServer(serverId)
  }
}

onMounted(async () => {
  isLoading.value = true

  try {
    await chatStore.prepareTextGenerator()
  } finally {
    isLoading.value = false
  }
})
</script>
