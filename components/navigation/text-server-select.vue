<!-- /components/servers/text-server-select.vue -->
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
      <option value="">System OpenAI · mana</option>

      <option v-for="server in textServers" :key="server.id" :value="server.id">
        {{ server.label || server.title || `Server #${server.id}` }}
        · {{ server.serverType }} · {{ serverBillingLabel(server) }}
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

const textServers = computed<Server[]>(() => {
  return serverStore.textServers
    .filter((server) => server.isActive)
    .sort((a, b) => {
      const defaultSort =
        Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault))

      if (defaultSort) return defaultSort

      return String(a.label || a.title || '').localeCompare(
        String(b.label || b.title || ''),
      )
    }) as Server[]
})

const activeServer = computed<Server | null>(() => {
  return (serverStore.activeTextServer as Server | null) ?? null
})

const selectedValue = computed(() => {
  return activeServer.value?.id ? String(activeServer.value.id) : ''
})

const activeLabel = computed(() => {
  const server = activeServer.value

  if (!server) return 'System OpenAI'

  return server.label || server.title || `Server #${server.id}`
})

const usesOwnResource = computed(() => {
  const server = activeServer.value

  if (!server) return false

  return chatStore.serverUsesOwnResource(server)
})

const billingLabel = computed(() => {
  return usesOwnResource.value ? 'Own resource' : 'Mana'
})

const billingBadgeClass = computed(() => {
  return usesOwnResource.value ? 'badge-success' : 'badge-warning'
})

const helperText = computed(() => {
  const server = activeServer.value

  if (!server) {
    return 'Using the hosted OpenAI fallback. This spends mana.'
  }

  if (usesOwnResource.value) {
    return 'Using your selected private/local text server. This should not spend mana.'
  }

  return 'Using an official hosted text server. This spends mana.'
})

function serverBillingLabel(server: Server) {
  return chatStore.serverUsesOwnResource(server) ? 'own resource' : 'mana'
}

async function handleSelect(event: Event) {
  const target = event.target as HTMLSelectElement
  const serverId = Number(target.value) || null

  const result = await serverStore.setActiveTextServer(serverId)

  if (!result.success) {
    chatStore.setGenerationMessage(
      'error',
      result.message || 'Unable to select text server.',
    )
    return
  }

  chatStore.selectGenerationServer(serverId)

  const server = serverId
    ? (textServers.value.find((entry) => entry.id === serverId) ?? null)
    : null

  chatStore.setTextForm({
    serverId,
    serverName: server?.label || server?.title || null,
    serverSelectionMode: serverId ? 'specific' : 'default',
    generationRequirement: {
      provider: server?.serverType === 'ANTHROPIC' ? 'anthropic' : 'any',
    },
  })
}

onMounted(async () => {
  isLoading.value = true

  try {
    await serverStore.initialize({
      fetchRemote: true,
    })

    if (!serverStore.hasLoaded || !serverStore.servers.length) {
      await serverStore.fetchAllServers(true)
    }

    const activeTextServer = serverStore.activeTextServer as Server | null

    chatStore.setTextForm({
      serverId: activeTextServer?.id ?? null,
      serverName: activeTextServer?.label || activeTextServer?.title || null,
      serverSelectionMode: activeTextServer ? 'specific' : 'default',
      generationRequirement: {
        provider:
          activeTextServer?.serverType === 'ANTHROPIC' ? 'anthropic' : 'any',
      },
    })
  } finally {
    isLoading.value = false
  }
})
</script>
