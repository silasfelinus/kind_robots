<!-- /components/server/server-card.vue -->
<template>
  <article
    class="flex flex-col gap-3 rounded-2xl border bg-base-100 p-4 shadow-sm transition"
    :class="
      activeSelected ? 'border-primary shadow-primary/20' : 'border-base-300'
    "
  >
    <kr-entity-card-body
      :title="serverTitle"
      :description="server.description || undefined"
      :show-description="showDescription"
      :show-image="false"
      :badges="serverBadges"
      :meta="showMeta ? serverMeta : []"
    >
      <div v-if="showActions" class="mt-3 flex flex-wrap gap-1">
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

      <div v-if="showUseButtons" class="mt-3 flex flex-wrap gap-2">
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
      </div>
    </kr-entity-card-body>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Server } from '~/prisma/generated/prisma/client'
import type { EntityCardChip } from '@/components/gallery/kr-entity-card-body.vue'
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

const emit = defineEmits<{
  open: [id: number]
  edit: [id: number]
}>()

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

const statusBadgeClass = computed(() => {
  if (props.server.lastStatus === 'ONLINE') return 'badge-success'
  if (props.server.lastStatus === 'OFFLINE') return 'badge-error'
  if (props.server.lastStatus === 'DEGRADED') return 'badge-warning'
  return 'badge-ghost'
})

const ownershipLabel = computed(() => {
  if (props.server.isOfficial) return 'Official'
  if (props.server.isPublic) return 'Public'
  return 'Private'
})

const serverBadges = computed<EntityCardChip[]>(() => {
  const badges: EntityCardChip[] = [
    { label: props.server.lastStatus || 'UNKNOWN', class: statusBadgeClass.value },
    { label: String(props.server.serverType), class: 'badge-primary' },
  ]

  if (props.server.accessMode) {
    badges.push({ label: String(props.server.accessMode), class: 'badge-outline' })
  }

  badges.push({ label: ownershipLabel.value, class: 'badge-ghost' })
  return badges
})

const serverMeta = computed<EntityCardChip[]>(() => {
  const chips: EntityCardChip[] = []

  if (props.server.authType) chips.push({ label: `Auth: ${props.server.authType}` })
  if (props.server.baseUrl) chips.push({ label: `Base: ${props.server.baseUrl}`, title: props.server.baseUrl })
  if (props.server.endpointPath) chips.push({ label: `Endpoint: ${props.server.endpointPath}`, title: props.server.endpointPath })
  if (props.server.healthPath) chips.push({ label: `Health: ${props.server.healthPath}`, title: props.server.healthPath })

  return chips
})

function selectServer() {
  emit('open', props.server.id)
  serverStore.setCurrentServer?.(props.server.id)
}

function editServer() {
  emit('edit', props.server.id)
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
