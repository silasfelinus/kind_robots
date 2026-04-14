<!-- /components/server/server-gallery.vue -->
<template>
  <div class="container mx-auto p-4 space-y-6">
    <div
      class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
    >
      <div class="space-y-1">
        <h1 class="text-3xl font-bold text-primary">Server Gallery</h1>
        <p class="text-sm opacity-70">
          Browse, select, create, edit, test, and manage your servers.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          class="btn btn-primary btn-sm rounded-2xl"
          @click="openAddModal"
        >
          <icon name="kind-icon:add" class="text-lg" />
          Add Server
        </button>

        <NuxtLink to="/servers" class="btn btn-outline btn-sm rounded-2xl">
          Full Server Page
        </NuxtLink>
      </div>
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
        <option value="art">Select Art Server</option>
        <option value="text">Select Text Server</option>
      </select>
    </div>

    <div class="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
      <div
        v-for="server in filteredServers"
        :key="server.id"
        class="relative flex flex-col gap-3 rounded-2xl border bg-base-100 p-4 shadow-md"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex flex-col gap-1">
            <div class="text-lg font-bold">
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

        <div class="flex flex-wrap gap-2 text-xs">
          <span v-if="isOwner(server)" class="badge badge-accent">Yours</span>
          <span v-if="isAdminValue" class="badge badge-info">Admin</span>
          <span v-if="server.isOfficial" class="badge badge-primary">
            Official
          </span>
          <span v-if="server.isDefault" class="badge badge-secondary">
            Default
          </span>
          <span v-if="server.isPublic" class="badge badge-outline">
            Public
          </span>
        </div>

        <div class="text-sm">
          {{ server.description || 'No description yet.' }}
        </div>

        <div class="break-all text-xs opacity-70">
          {{ server.baseUrl }}{{ server.endpointPath || '' }}
        </div>

        <div class="flex flex-wrap gap-2 text-xs">
          <span v-if="server.supportsTxt2Img" class="badge badge-outline">
            Txt2Img
          </span>
          <span v-if="server.supportsImg2Img" class="badge badge-outline">
            Img2Img
          </span>
          <span v-if="server.supportsChat" class="badge badge-outline">
            Chat
          </span>
          <span v-if="server.supportsComfyWorkflow" class="badge badge-outline">
            Comfy
          </span>
        </div>

        <div class="mt-2 flex flex-wrap gap-2">
          <button
            v-if="activeMode === 'art'"
            class="btn btn-sm rounded-2xl"
            :class="isActiveArt(server.id) ? 'btn-secondary' : 'btn-outline'"
            :disabled="!canSelect(server)"
            @click="toggleArtServer(server)"
          >
            {{ isActiveArt(server.id) ? 'Selected Art Server' : 'Use for Art' }}
          </button>

          <button
            v-if="activeMode === 'text'"
            class="btn btn-sm rounded-2xl"
            :class="isActiveText(server.id) ? 'btn-secondary' : 'btn-outline'"
            :disabled="!canSelect(server)"
            @click="toggleTextServer(server)"
          >
            {{
              isActiveText(server.id) ? 'Selected Text Server' : 'Use for Text'
            }}
          </button>

          <button
            v-if="activeMode === 'browse'"
            class="btn btn-outline btn-sm rounded-2xl"
            :disabled="!canSelect(server)"
            @click="handleBrowseSelect(server)"
          >
            Select
          </button>

          <button
            class="btn btn-outline btn-sm rounded-2xl"
            :disabled="!canEdit(server)"
            @click="startEdit(server)"
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
            class="btn btn-error btn-sm rounded-2xl"
            :disabled="!canDelete(server)"
            @click="removeServer(server)"
          >
            Delete
          </button>
        </div>

        <div v-if="permissionText(server)" class="text-xs opacity-60">
          {{ permissionText(server) }}
        </div>

        <div v-if="healthText(server.id)" class="mt-2 text-xs opacity-70">
          {{ healthText(server.id) }}
        </div>
      </div>
    </div>

    <div
      v-if="adding"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="closeAddModal"
    >
      <div class="w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        <add-server />
      </div>
    </div>

    <div
      v-if="editing"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="closeEditor"
    >
      <div class="w-full max-w-5xl max-h-[95vh] overflow-y-auto">
        <edit-server @close="closeEditor" />
      </div>
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
const adding = ref(false)

onMounted(async () => {
  await serverStore.initialize()
})

const currentUserId = computed<number | null>(() => userStore.user?.id ?? null)

const isAdminValue = computed<boolean>(() => {
  return Boolean(userStore.isAdmin)
})

const filteredServers = computed<Server[]>(() =>
  servers.value.filter((server: Server) => {
    if (filterScope.value === 'user' && server.userId !== currentUserId.value) {
      return false
    }

    if (filterScope.value === 'public' && !server.isPublic) {
      return false
    }

    if (filterScope.value === 'official' && !server.isOfficial) {
      return false
    }

    if (filterType.value && server.serverType !== filterType.value) {
      return false
    }

    return true
  }),
)

function isOwner(server: Server): boolean {
  return Boolean(currentUserId.value && server.userId === currentUserId.value)
}

function canEdit(server: Server): boolean {
  return isAdminValue.value || isOwner(server)
}

function canDelete(server: Server): boolean {
  return isAdminValue.value || isOwner(server)
}

function canUseAsArt(server: Server): boolean {
  return (
    server.isActive &&
    (server.supportsTxt2Img ||
      server.supportsImg2Img ||
      server.serverType === 'ART' ||
      server.serverType === 'COMFY' ||
      server.serverType === 'A1111')
  )
}

function canUseAsText(server: Server): boolean {
  return (
    server.isActive &&
    (server.supportsChat ||
      server.serverType === 'TEXT' ||
      server.serverType === 'OPENAI_COMPATIBLE')
  )
}

function canSelect(server: Server): boolean {
  if (activeMode.value === 'art') return canUseAsArt(server)
  if (activeMode.value === 'text') return canUseAsText(server)
  return server.isActive
}

function isActiveArt(id: number): boolean {
  return serverStore.activeArtServerId === id
}

function isActiveText(id: number): boolean {
  return serverStore.activeTextServerId === id
}

function openAddModal(): void {
  serverStore.deselectServer()
  serverStore.createNewServer('ART')
  adding.value = true
}

function closeAddModal(): void {
  adding.value = false
}

async function toggleArtServer(server: Server): Promise<void> {
  if (!canUseAsArt(server)) return
  serverStore.setActiveArtServer(
    serverStore.activeArtServerId === server.id ? null : server.id,
  )
}

async function toggleTextServer(server: Server): Promise<void> {
  if (!canUseAsText(server)) return
  serverStore.setActiveTextServer(
    serverStore.activeTextServerId === server.id ? null : server.id,
  )
}

function handleBrowseSelect(server: Server): void {
  if (!canSelect(server)) return
  serverStore.selectServer(server.id)
}

function startEdit(server: Server): void {
  if (!canEdit(server)) return
  serverStore.selectServer(server.id)
  editing.value = true
}

function closeEditor(): void {
  editing.value = false
}

async function testServer(id: number): Promise<void> {
  await serverStore.testServerHealth(id)
}

async function removeServer(server: Server): Promise<void> {
  if (!canDelete(server)) return

  const result = await serverStore.deleteServer(server.id)

  if (result.success && serverStore.selectedServer?.id === server.id) {
    closeEditor()
  }
}

function permissionText(server: Server): string {
  if (!canEdit(server) && !canDelete(server)) {
    return 'Owner or Admin required for editing and deletion'
  }

  if (activeMode.value === 'art' && !canUseAsArt(server)) {
    return 'Not compatible with art selection'
  }

  if (activeMode.value === 'text' && !canUseAsText(server)) {
    return 'Not compatible with text selection'
  }

  if (activeMode.value === 'browse' && !server.isActive) {
    return 'Inactive servers cannot be selected'
  }

  return ''
}

function healthText(id: number): string {
  const result = serverStore.healthResults[id]

  if (!result) {
    return ''
  }

  return result.ok
    ? `Online · ${result.status} ${result.statusText} · ${result.latencyMs}ms`
    : `Offline · ${result.status} ${result.statusText} · ${result.latencyMs}ms`
}
</script>
