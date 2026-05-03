<!-- /components/server/server-card.vue -->
<template>
  <reactable-card
    :selected="activeSelected"
    :compact="compact"
    :show-reaction="false"
    :target-title="serverTitle"
    @select="selectServer"
  >
    <template #actions>
      <button
        v-if="showActions && allowEdit && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-primary shadow transition hover:bg-primary hover:text-primary-content"
        type="button"
        title="Edit Server"
        @click.stop="emit('edit', server.id)"
      >
        <Icon name="kind-icon:pencil" class="h-4 w-4" />
      </button>

      <button
        v-if="showActions && allowTest && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-info shadow transition hover:bg-info hover:text-info-content"
        type="button"
        title="Test Server"
        @click.stop="testServer"
      >
        <Icon name="kind-icon:activity" class="h-4 w-4" />
      </button>

      <button
        v-if="showActions && canDelete && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-error shadow transition hover:bg-error hover:text-error-content"
        type="button"
        title="Delete Server"
        @click.stop="deleteServer"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
      </button>
    </template>

    <div class="flex items-start gap-3">
      <div
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-base-300"
        :class="iconBgClass"
      >
        <Icon :name="serverIcon" class="h-7 w-7" :class="iconTextClass" />
      </div>

      <div class="min-w-0 flex-1">
        <h2
          :class="[
            'font-black leading-tight text-base-content',
            compact ? 'line-clamp-1 text-base' : 'text-lg',
          ]"
          :title="serverTitle"
        >
          {{ serverTitle }}
        </h2>

        <p
          v-if="showDescription"
          :class="[
            'text-base-content/70',
            compact ? 'line-clamp-2 text-sm' : 'text-sm',
          ]"
        >
          {{ server.description || server.baseUrl || 'No server description.' }}
        </p>
      </div>
    </div>

    <div v-if="showMeta" class="flex flex-wrap gap-2">
      <span class="badge badge-outline badge-sm">
        {{ server.serverType }}
      </span>

      <span v-if="server.isDefault" class="badge badge-primary badge-sm">
        Default
      </span>

      <span v-if="server.isOfficial" class="badge badge-secondary badge-sm">
        Official
      </span>

      <span v-if="server.isPublic" class="badge badge-info badge-sm">
        Public
      </span>

      <span
        class="badge badge-sm"
        :class="server.isActive ? 'badge-success' : 'badge-warning'"
      >
        {{ server.isActive ? 'Active' : 'Inactive' }}
      </span>

      <span v-if="activeSelected" class="badge badge-accent badge-sm">
        Selected
      </span>
    </div>

    <div v-if="!compact" class="grid grid-cols-1 gap-2 md:grid-cols-3">
      <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
        <div class="text-xs font-bold uppercase text-base-content/50">URL</div>

        <div class="truncate font-mono text-xs">
          {{ server.baseUrl || 'n/a' }}
        </div>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
        <div class="text-xs font-bold uppercase text-base-content/50">
          Access
        </div>

        <div class="truncate text-xs font-bold">
          {{ server.accessMode || 'n/a' }}
        </div>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
        <div class="text-xs font-bold uppercase text-base-content/50">
          Status
        </div>

        <div class="flex items-center gap-2">
          <span
            class="inline-block h-2 w-2 rounded-full"
            :class="statusClass"
          />

          <span class="text-xs font-bold">
            {{ server.lastStatus ?? 'UNKNOWN' }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="showCapabilities" class="flex flex-wrap gap-2">
      <span v-if="server.supportsTxt2Img" class="badge badge-primary badge-sm">
        txt2img
      </span>

      <span v-if="server.supportsImg2Img" class="badge badge-primary badge-sm">
        img2img
      </span>

      <span
        v-if="server.supportsComfyWorkflow"
        class="badge badge-secondary badge-sm"
      >
        workflow
      </span>

      <span v-if="server.supportsChat" class="badge badge-accent badge-sm">
        chat
      </span>

      <span
        v-if="server.supportsCheckpointOverride"
        class="badge badge-ghost badge-sm"
      >
        checkpoint
      </span>

      <span v-if="server.supportsSampler" class="badge badge-ghost badge-sm">
        sampler
      </span>
    </div>

    <div v-if="showUseButtons" class="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <button
        v-if="isArtCapable"
        class="btn btn-primary btn-sm rounded-xl text-white"
        type="button"
        @click.stop="emit('use-art', server.id)"
      >
        <Icon name="kind-icon:palette" class="h-4 w-4" />
        Use for Art
      </button>

      <button
        v-if="isTextCapable"
        class="btn btn-secondary btn-sm rounded-xl"
        type="button"
        @click.stop="emit('use-text', server.id)"
      >
        <Icon name="kind-icon:chat" class="h-4 w-4" />
        Use for Text
      </button>
    </div>

    <details
      v-if="showDebug"
      class="rounded-2xl border border-base-300 bg-base-100 p-2"
      @click.stop
    >
      <summary class="cursor-pointer text-xs font-bold text-base-content/70">
        Debug
      </summary>

      <pre class="mt-2 max-h-48 overflow-auto text-xs text-base-content/70">{{
        JSON.stringify(server, null, 2)
      }}</pre>
    </details>
  </reactable-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Server } from '~/prisma/generated/prisma/client'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'

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
    showCapabilities: true,
    showUseButtons: true,
    showDebug: false,
    allowEdit: true,
    allowDelete: true,
    allowTest: true,
  },
)

const emit = defineEmits<{
  select: [id: number]
  edit: [id: number]
  delete: [id: number]
  test: [id: number]
  'use-art': [id: number]
  'use-text': [id: number]
}>()

const serverStore = useServerStore()
const userStore = useUserStore()

const activeSelected = computed(() => {
  return (
    props.selected ||
    serverStore.selectedServer?.id === props.server.id ||
    serverStore.activeArtServer?.id === props.server.id ||
    serverStore.activeTextServer?.id === props.server.id
  )
})

const serverTitle = computed(() => {
  return (
    props.server.label || props.server.title || `Server #${props.server.id}`
  )
})

const isArtCapable = computed(() => {
  const server = props.server

  return (
    server.serverType === 'ART' ||
    server.serverType === 'A1111' ||
    server.serverType === 'COMFY' ||
    Boolean(server.supportsTxt2Img) ||
    Boolean(server.supportsImg2Img) ||
    Boolean(server.supportsComfyWorkflow)
  )
})

const isTextCapable = computed(() => {
  const server = props.server

  return (
    server.serverType === 'TEXT' ||
    server.serverType === 'OPENAI_COMPATIBLE' ||
    Boolean(server.supportsChat)
  )
})

const canDelete = computed(() => {
  const server = props.server

  return (
    props.allowDelete &&
    Boolean(userStore.user?.id) &&
    server.userId === userStore.user?.id &&
    !server.isOfficial &&
    !server.isDefault &&
    !server.isPublic
  )
})

const serverIcon = computed(() => {
  if (props.server.serverType === 'TEXT') return 'kind-icon:chat'
  if (props.server.serverType === 'OPENAI_COMPATIBLE') return 'kind-icon:chat'
  if (props.server.serverType === 'COMFY') return 'kind-icon:workflow'
  if (props.server.serverType === 'A1111') return 'kind-icon:palette'
  if (props.server.serverType === 'ART') return 'kind-icon:palette'

  return 'kind-icon:server'
})

const iconBgClass = computed(() => {
  if (isTextCapable.value && !isArtCapable.value) {
    return 'bg-secondary/10'
  }

  if (isArtCapable.value && !isTextCapable.value) {
    return 'bg-primary/10'
  }

  return 'bg-accent/10'
})

const iconTextClass = computed(() => {
  if (isTextCapable.value && !isArtCapable.value) {
    return 'text-secondary'
  }

  if (isArtCapable.value && !isTextCapable.value) {
    return 'text-primary'
  }

  return 'text-accent'
})

const statusClass = computed(() => {
  if (props.server.lastStatus === 'ONLINE') return 'bg-success'
  if (props.server.lastStatus === 'OFFLINE') return 'bg-error'

  return 'bg-warning'
})

function selectServer() {
  serverStore.selectServer(props.server.id)
  emit('select', props.server.id)
}

async function testServer() {
  emit('test', props.server.id)
  await serverStore.testServerHealth(props.server.id)
}

async function deleteServer() {
  const result = await serverStore.deleteServer(props.server.id)

  if (result.success) {
    emit('delete', props.server.id)
  }
}
</script>
