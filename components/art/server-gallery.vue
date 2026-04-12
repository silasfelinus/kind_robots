<template>
  <div class="container mx-auto p-4 space-y-4">
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
      <h1 class="text-3xl font-bold text-primary">Server Gallery</h1>
      <NuxtLink to="/servers" class="btn btn-primary btn-sm rounded-2xl">
        ➕ Manage Servers
      </NuxtLink>
    </div>

    <div class="flex flex-wrap gap-4">
      <select v-model="filterScope" class="select select-bordered rounded-2xl">
        <option value="all">All Servers</option>
        <option value="user">My Servers</option>
        <option value="public">Public Only</option>
        <option value="official">Official Only</option>
      </select>

      <select v-model="filterType" class="select select-bordered rounded-2xl">
        <option value="">All Types</option>
        <option value="ART">ART</option>
        <option value="TEXT">TEXT</option>
        <option value="COMFY">COMFY</option>
        <option value="A1111">A1111</option>
        <option value="OPENAI_COMPATIBLE">OPENAI_COMPATIBLE</option>
        <option value="OTHER">OTHER</option>
      </select>

      <select v-model="activeMode" class="select select-bordered rounded-2xl">
        <option value="browse">Browse</option>
        <option value="art">Choose Art Server</option>
        <option value="text">Choose Text Server</option>
      </select>
    </div>

    <div class="grid grid-cols-[repeat(auto-fit,_minmax(260px,_1fr))] gap-6">
      <div
        v-for="server in filteredServers"
        :key="server.id"
        class="relative p-4 border rounded-2xl bg-base-100 shadow-md flex flex-col gap-3"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="font-bold text-lg">
              {{ server.label || server.title }}
            </div>
            <div class="text-sm opacity-70">
              {{ server.serverType }}
            </div>
          </div>

          <div class="badge badge-outline">
            {{ server.isActive ? 'Active' : 'Inactive' }}
          </div>
        </div>

        <div class="text-sm">
          {{ server.description || 'No description yet.' }}
        </div>

        <div class="text-xs opacity-70 break-all">
          {{ server.baseUrl }}{{ server.endpointPath || '' }}
        </div>

        <div class="flex flex-wrap gap-2 text-xs">
          <span v-if="server.supportsTxt2Img" class="badge badge-outline"
            >Txt2Img</span
          >
          <span v-if="server.supportsImg2Img" class="badge badge-outline"
            >Img2Img</span
          >
          <span v-if="server.supportsChat" class="badge badge-outline"
            >Chat</span
          >
          <span v-if="server.supportsComfyWorkflow" class="badge badge-outline"
            >Comfy</span
          >
          <span v-if="server.isOfficial" class="badge badge-primary"
            >Official</span
          >
          <span v-if="server.isDefault" class="badge badge-secondary"
            >Default</span
          >
        </div>

        <div class="flex flex-wrap gap-2 mt-2">
          <button
            v-if="activeMode === 'art'"
            class="btn btn-sm rounded-2xl"
            :class="isActiveArt(server.id) ? 'btn-secondary' : 'btn-outline'"
            @click="toggleArtServer(server.id)"
          >
            {{ isActiveArt(server.id) ? 'Selected Art Server' : 'Use for Art' }}
          </button>

          <button
            v-if="activeMode === 'text'"
            class="btn btn-sm rounded-2xl"
            :class="isActiveText(server.id) ? 'btn-secondary' : 'btn-outline'"
            @click="toggleTextServer(server.id)"
          >
            {{
              isActiveText(server.id) ? 'Selected Text Server' : 'Use for Text'
            }}
          </button>

          <button
            class="btn btn-outline btn-sm rounded-2xl"
            @click="startEdit(server.id)"
          >
            Edit
          </button>

          <button
            class="btn btn-outline btn-sm rounded-2xl"
            @click="testServer(server.id)"
          >
            Test
          </button>

          <button
            v-if="canDelete(server)"
            class="btn btn-error btn-sm rounded-2xl"
            @click="removeServer(server.id)"
          >
            Delete
          </button>
        </div>

        <div v-if="healthText(server.id)" class="text-xs opacity-70 mt-2">
          {{ healthText(server.id) }}
        </div>
      </div>
    </div>

    <div
      v-if="editing"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <edit-server @close="editing = false" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/userStore'
import { useServerStore } from '@/stores/serverStore'
import type { Server, ServerType } from '~/prisma/generated/prisma/client'

const userStore = useUserStore()
const serverStore = useServerStore()

const { servers } = storeToRefs(serverStore)

const filterScope = ref<'all' | 'user' | 'public' | 'official'>('all')
const filterType = ref<'' | ServerType>('')
const activeMode = ref<'browse' | 'art' | 'text'>('browse')
const editing = ref(false)

onMounted(() => {
  serverStore.initialize()
})

const filteredServers = computed<Server[]>(() =>
  servers.value.filter((server: Server) => {
    if (filterScope.value === 'user' && server.userId !== userStore.user?.id)
      return false
    if (filterScope.value === 'public' && !server.isPublic) return false
    if (filterScope.value === 'official' && !server.isOfficial) return false
    if (filterType.value && server.serverType !== filterType.value) return false
    return true
  }),
)

function isActiveArt(id: number): boolean {
  return serverStore.activeArtServerId === id
}

function isActiveText(id: number): boolean {
  return serverStore.activeTextServerId === id
}

function toggleArtServer(id: number) {
  serverStore.setActiveArtServer(
    serverStore.activeArtServerId === id ? null : id,
  )
}

function toggleTextServer(id: number) {
  serverStore.setActiveTextServer(
    serverStore.activeTextServerId === id ? null : id,
  )
}

function canDelete(server: Server): boolean {
  return server.userId === userStore.user?.id
}

function startEdit(id: number) {
  serverStore.selectServer(id)
  editing.value = true
}

async function testServer(id: number) {
  await serverStore.testServerHealth(id)
}

async function removeServer(id: number) {
  await serverStore.deleteServer(id)
}

function healthText(id: number): string {
  const result = serverStore.healthResults[id]
  if (!result) return ''
  return result.ok
    ? `Online · ${result.status} ${result.statusText} · ${result.latencyMs}ms`
    : `Offline · ${result.status} ${result.statusText} · ${result.latencyMs}ms`
}
</script>
