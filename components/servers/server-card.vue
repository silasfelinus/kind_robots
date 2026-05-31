<!-- /components/server/server-card.vue -->
<template>
  <article
    class="flex flex-col gap-3 rounded-2xl border bg-base-100 p-4 shadow-sm transition"
    :class="
      activeSelected ? 'border-primary shadow-primary/20' : 'border-base-300'
    "
  >
    <header class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <Icon :name="serverIcon" class="h-5 w-5 text-primary" />
          <h3 class="truncate text-lg font-black">
            {{ serverTitle }}
          </h3>
          <span class="badge badge-sm" :class="statusBadgeClass">
            {{ server.lastStatus || 'UNKNOWN' }}
          </span>
        </div>

        <p
          v-if="showDescription && server.description"
          class="mt-1 line-clamp-2 text-sm text-base-content/60"
        >
          {{ server.description }}
        </p>
      </div>

      <div v-if="showActions" class="flex shrink-0 gap-1">
        <button
          class="btn btn-xs btn-ghost rounded-xl"
          type="button"
          title="Select"
          @click="selectServer"
        >
          <Icon name="kind-icon:cursor-click" class="h-4 w-4" />
        </button>

        <button
          v-if="allowEdit"
          class="btn btn-xs btn-ghost rounded-xl"
          type="button"
          title="Edit"
          @click="editServer"
        >
          <Icon name="kind-icon:pencil" class="h-4 w-4" />
        </button>

        <button
          v-if="allowTest"
          class="btn btn-xs btn-ghost rounded-xl"
          type="button"
          title="Test health"
          @click="testServer"
        >
          <Icon name="kind-icon:activity" class="h-4 w-4" />
        </button>
      </div>
    </header>

    <section
      class="grid gap-2 text-sm"
      :class="compact ? 'grid-cols-1' : 'sm:grid-cols-2'"
    >
      <div class="rounded-xl bg-base-200 p-3">
        <p class="text-xs font-black uppercase text-base-content/50">Type</p>
        <p class="font-bold">{{ server.serverType }}</p>
      </div>

      <div class="rounded-xl bg-base-200 p-3">
        <p class="text-xs font-black uppercase text-base-content/50">Access</p>
        <p class="font-bold">{{ server.accessMode }}</p>
      </div>

      <div class="rounded-xl bg-base-200 p-3">
        <p class="text-xs font-black uppercase text-base-content/50">Auth</p>
        <p class="font-bold">{{ server.authType }}</p>
      </div>

      <div class="rounded-xl bg-base-200 p-3">
        <p class="text-xs font-black uppercase text-base-content/50">Owner</p>
        <p class="font-bold">
          {{
            server.isOfficial
              ? 'Official'
              : server.isPublic
                ? 'Public'
                : 'Private'
          }}
        </p>
      </div>
    </section>

    <section
      v-if="showMeta"
      class="flex flex-col gap-2 rounded-xl bg-base-200 p-3 text-xs"
    >
      <p class="break-all">
        <span class="font-black text-base-content/50">Base:</span>
        {{ server.baseUrl || 'n/a' }}
      </p>
      <p class="break-all">
        <span class="font-black text-base-content/50">Endpoint:</span>
        {{ server.endpointPath || 'n/a' }}
      </p>
      <p class="break-all">
        <span class="font-black text-base-content/50">Health:</span>
        {{ server.healthPath || 'n/a' }}
      </p>
    </section>

    <footer v-if="showUseButtons" class="flex flex-wrap gap-2">
      <button
        v-if="isArtServer"
        class="btn btn-sm btn-primary rounded-xl"
        type="button"
        @click="useForArt"
      >
        Use for Art
      </button>

      <button
        v-if="isTextServer"
        class="btn btn-sm btn-secondary rounded-xl"
        type="button"
        @click="useForText"
      >
        Use for Text
      </button>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Server } from '~/prisma/generated/prisma/client'
import { useServerStore } from '@/stores/serverStore'

const props = withDefaults(
  defineProps<{
    server: Server
    selected?: boolean
    compact?: boolean
    showActions?: boolean
    showDescription?: boolean
    showMeta?: boolean
    showCapabilities?: boolean
    showUseButtons?: boolean
    showDebug?: boolean
    showWorkflow?: boolean
    showDefaults?: boolean
    showStatus?: boolean
    statusCompact?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
    allowTest?: boolean
  }>(),
  {
    selected: false,
    compact: false,
    showActions: true,
    showDescription: true,
    showMeta: true,
    showCapabilities: false,
    showUseButtons: true,
    showDebug: false,
    showWorkflow: false,
    showDefaults: false,
    showStatus: true,
    statusCompact: false,
    allowEdit: true,
    allowDelete: false,
    allowTest: true,
  },
)

const serverStore = useServerStore()

const serverTitle = computed(() => {
  return (
    props.server.label || props.server.title || `Server #${props.server.id}`
  )
})

const activeSelected = computed(() => {
  return (
    props.selected ||
    serverStore.currentServer?.id === props.server.id ||
    serverStore.activeArtServer?.id === props.server.id ||
    serverStore.activeTextServer?.id === props.server.id
  )
})

const isArtServer = computed(() => {
  return (
    props.server.serverType === 'A1111' || props.server.serverType === 'COMFY'
  )
})

const isTextServer = computed(() => {
  return (
    props.server.serverType === 'OPENAI' ||
    props.server.serverType === 'ANTHROPIC' ||
    props.server.serverType === 'CUSTOM'
  )
})

const serverIcon = computed(() => {
  if (props.server.serverType === 'COMFY') return 'kind-icon:workflow'
  if (props.server.serverType === 'A1111') return 'kind-icon:image'
  if (props.server.serverType === 'OPENAI') return 'kind-icon:openai'
  if (props.server.serverType === 'ANTHROPIC') return 'kind-icon:anthropic'
  return 'kind-icon:server'
})

const statusBadgeClass = computed(() => {
  if (props.server.lastStatus === 'ONLINE') return 'badge-success'
  if (props.server.lastStatus === 'OFFLINE') return 'badge-error'
  if (props.server.lastStatus === 'DEGRADED') return 'badge-warning'
  return 'badge-ghost'
})

function selectServer() {
  serverStore.setCurrentServer?.(props.server.id)
}

function editServer() {
  serverStore.setCurrentServer?.(props.server.id)
  serverStore.startEditingServer?.(props.server.id)
  serverStore.openServerForm?.()
}

async function testServer() {
  if (!props.server.id) return
  await serverStore.testServerHealth?.(props.server.id)
}

function useForArt() {
  serverStore.setCurrentServer?.(props.server.id)
  serverStore.startEditingServer?.(props.server.id)
}

function useForText() {
  serverStore.setCurrentServer?.(props.server.id)
  serverStore.setActiveTextServer?.(props.server.id)
}
</script>
