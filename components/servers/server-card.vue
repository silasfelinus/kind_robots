<!-- /components/server/server-card.vue -->
<template>
  <article
    :class="[
      'relative flex cursor-pointer flex-col rounded-2xl border bg-base-200 transition-all hover:shadow-lg',
      compact ? 'gap-2 p-3' : 'gap-4 p-4',
      selected ? 'border-primary bg-primary/10' : 'border-base-300',
    ]"
    @click="selectServer"
  >
    <div
      v-if="showActions && (selected || compact)"
      class="absolute right-2 top-2 z-20 flex items-center gap-2"
    >
      <button
        v-if="allowEdit"
        class="rounded-full bg-base-100 p-2 text-primary shadow hover:bg-primary hover:text-primary-content"
        type="button"
        title="Edit Server"
        @click.stop="emit('edit', server.id)"
      >
        <Icon name="kind-icon:pencil" class="h-4 w-4" />
      </button>

      <button
        v-if="allowTest"
        class="rounded-full bg-base-100 p-2 text-info shadow hover:bg-info hover:text-info-content"
        type="button"
        title="Test Server"
        @click.stop="testServer"
      >
        <Icon name="kind-icon:activity" class="h-4 w-4" />
      </button>

      <button
        v-if="canDelete"
        class="rounded-full bg-base-100 p-2 text-error shadow hover:bg-error hover:text-error-content"
        type="button"
        title="Delete Server"
        @click.stop="deleteServer"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
      </button>
    </div>

    <div class="flex items-start gap-3">
      <div
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
        :class="iconBgClass"
      >
        <Icon :name="serverIcon" class="h-7 w-7" :class="iconTextClass" />
      </div>

      <div class="min-w-0 flex-1">
        <h2
          :class="[
            'font-bold leading-tight text-base-content',
            compact ? 'line-clamp-1 text-base' : 'text-lg',
          ]"
        >
          {{ server.label || server.title || 'Untitled Server' }}
        </h2>

        <p
          v-if="showDescription"
          :class="[
            'text-base-content/70',
            compact ? 'line-clamp-2 text-sm' : 'text-sm',
          ]"
        >
          {{ server.description || server.baseUrl }}
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
    </div>

    <div v-if="!compact" class="grid grid-cols-1 gap-2 md:grid-cols-3">
      <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
        <div class="text-xs font-bold uppercase text-base-content/50">URL</div>
        <div class="truncate font-mono text-xs">
          {{ server.baseUrl }}
        </div>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
        <div class="text-xs font-bold uppercase text-base-content/50">
          Access
        </div>
        <div class="truncate text-xs font-bold">
          {{ server.accessMode }}
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

    <div v-if="showUseButtons" class="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <button
        v-if="isArtCapable"
        class="btn btn-primary btn-sm rounded-xl"
        type="button"
        @click.stop="emit('use-art', server.id)"
      >
        Use for Art
      </button>

      <button
        v-if="isTextCapable"
        class="btn btn-secondary btn-sm rounded-xl"
        type="button"
        @click.stop="emit('use-text', server.id)"
      >
        Use for Text
      </button>
    </div>
  </article>
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
    showUseButtons?: boolean
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
    showUseButtons: true,
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

const iconBgClass = computed(() =>
  isTextCapable.value && !isArtCapable.value
    ? 'bg-secondary/10'
    : 'bg-primary/10',
)

const iconTextClass = computed(() =>
  isTextCapable.value && !isArtCapable.value
    ? 'text-secondary'
    : 'text-primary',
)

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
