<!-- /components/server/server-picker.vue -->
<template>
  <div class="picker-root">
    <div class="picker-controls">
      <select
        v-model="filterType"
        class="select select-bordered select-xs bg-base-200 w-full sm:w-auto"
      >
        <option value="">All types</option>
        <option value="ART">Art</option>
        <option value="TEXT">Text</option>
        <option value="COMFY">Comfy</option>
        <option value="A1111">A1111</option>
        <option value="OPENAI_COMPATIBLE">OpenAI compat.</option>
      </select>
      <input
        v-model="query"
        type="search"
        placeholder="Search servers…"
        class="input input-bordered input-xs w-full bg-base-200"
      />
    </div>

    <div v-if="isLoading" class="picker-loading">
      <span class="loading loading-spinner loading-sm text-primary" />
    </div>

    <div v-else-if="filtered.length === 0" class="picker-empty">
      <span>🖥️</span> No servers found
    </div>

    <ul v-else class="picker-list">
      <li
        v-for="server in filtered"
        :key="server.id"
        class="picker-row"
        :class="{ 'picker-row--active': isActiveServer(server.id) }"
      >
        <!-- Status dot -->
        <span
          class="picker-icon shrink-0 text-xs"
          :class="server.isActive ? 'text-success' : 'text-base-content/30'"
          >●</span
        >

        <span class="picker-label">
          <span class="picker-name">{{ server.label || server.title }}</span>
          <span class="picker-sub">
            {{ server.serverType }}
            <span v-if="server.isOfficial" class="text-primary"
              >· Official</span
            >
          </span>
        </span>

        <!-- Art / Text toggle buttons side-by-side, compact -->
        <div class="flex gap-1 shrink-0">
          <button
            v-if="
              server.supportsTxt2Img ||
              server.serverType === 'ART' ||
              server.serverType === 'A1111' ||
              server.serverType === 'COMFY'
            "
            class="picker-action"
            :class="
              serverStore.activeArtServerId === server.id
                ? 'btn-secondary'
                : 'btn-ghost'
            "
            :disabled="!server.isActive"
            title="Use for art"
            @click.stop="toggleArt(server)"
          >
            🎨
          </button>
          <button
            v-if="
              server.supportsChat ||
              server.serverType === 'TEXT' ||
              server.serverType === 'OPENAI_COMPATIBLE'
            "
            class="picker-action"
            :class="
              serverStore.activeTextServerId === server.id
                ? 'btn-accent'
                : 'btn-ghost'
            "
            :disabled="!server.isActive"
            title="Use for text"
            @click.stop="toggleText(server)"
          >
            💬
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useServerStore } from '@/stores/serverStore'
import type { Server } from '~/prisma/generated/prisma/client'

const serverStore = useServerStore()
const { servers } = storeToRefs(serverStore)

const query = ref('')
const filterType = ref('')
const isLoading = ref(false)

onMounted(async () => {
  await serverStore.initialize({
    fetchRemote: true,
  })
})

const filtered = computed(() => {
  let list = servers.value as Server[]
  if (filterType.value)
    list = list.filter((s) => s.serverType === filterType.value)
  const q = query.value.trim().toLowerCase()
  if (q)
    list = list.filter((s) =>
      (s.label || s.title || '').toLowerCase().includes(q),
    )
  return list
})

function isActiveServer(id: number) {
  return (
    serverStore.activeArtServerId === id ||
    serverStore.activeTextServerId === id
  )
}

function toggleArt(server: Server) {
  serverStore.setActiveArtServer(
    serverStore.activeArtServerId === server.id ? null : server.id,
  )
}

function toggleText(server: Server) {
  serverStore.setActiveTextServer(
    serverStore.activeTextServerId === server.id ? null : server.id,
  )
}
</script>
