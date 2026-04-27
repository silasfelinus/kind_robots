<!-- /components/server/server-gallery.vue -->
<!--
  Props
    mode         'text' | 'image'
    searchQuery  string

  Emits
    open-add(serverType)   parent should createNewServer(type) then show panel
    open-edit()            parent should show panel — form already prepped here
-->
<template>
  <section
    :class="[
      'flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100',
      mode === 'text' ? 'ring-1 ring-info/10' : 'ring-1 ring-accent/10',
    ]"
  >
    <!-- ── Column header ─────────────────────────────────────────────────── -->
    <div
      class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-base-300 px-4 py-3"
    >
      <div class="flex min-w-0 items-center gap-2.5">
        <Icon
          :name="mode === 'text' ? 'kind-icon:chat' : 'kind-icon:art'"
          :class="[
            'h-5 w-5 shrink-0',
            mode === 'text' ? 'text-info' : 'text-accent',
          ]"
        />
        <div>
          <h2 class="text-sm font-black">
            {{ mode === 'text' ? 'Text Servers' : 'Image Servers' }}
          </h2>
          <p class="text-[10px] opacity-50">
            {{
              mode === 'text'
                ? 'Chat · Bots · Language models'
                : 'Art · ComfyUI · Stable Diffusion'
            }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Test All visible servers -->
        <button
          v-if="visibleServers.length > 0"
          type="button"
          class="btn btn-ghost btn-xs gap-1 rounded-lg opacity-60 hover:opacity-100"
          :disabled="testingAll"
          :title="`Test all ${visibleServers.length} visible servers`"
          @click="testAll"
        >
          <span v-if="testingAll" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:activity" class="h-3 w-3" />
          <span class="hidden sm:inline">Test All</span>
        </button>

        <!-- Active chip -->
        <div
          class="flex flex-col items-end gap-0.5 rounded-xl border border-base-300 bg-base-200 px-3 py-1.5"
        >
          <span
            class="text-[9px] font-black uppercase tracking-widest opacity-40"
            >Active</span
          >
          <span
            class="max-w-48 truncate text-[11px] font-bold"
            :title="activeServer?.title ?? 'Kind Robots Default'"
          >
            {{ activeServer?.title ?? 'Kind Robots Default' }}
          </span>
        </div>
      </div>
    </div>

    <!-- ── Error banner ──────────────────────────────────────────────────── -->
    <div
      v-if="fetchFailed"
      class="flex shrink-0 items-start gap-3 border-b border-error/30 bg-error/8 px-4 py-3"
    >
      <Icon
        name="kind-icon:alert-triangle"
        class="mt-0.5 h-4 w-4 shrink-0 text-error"
      />
      <div class="min-w-0 flex-1">
        <p class="text-xs font-black text-error">Server fetch failed</p>
        <p class="mt-0.5 text-[11px] opacity-70">
          {{ latestError ?? 'Could not load servers from the API.' }}
        </p>
      </div>
      <button
        type="button"
        class="btn btn-error btn-xs shrink-0 rounded-lg"
        @click="serverStore.fetchAllServers(true)"
      >
        Retry
      </button>
    </div>

    <!-- ── Scrollable list ───────────────────────────────────────────────── -->
    <div
      class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-base-300"
    >
      <!-- Kind Robots Default -->
      <button
        type="button"
        :class="[
          'flex w-full shrink-0 items-center gap-3 rounded-xl border p-3 text-left',
          'transition-all duration-150 hover:-translate-y-px',
          !activeServerId
            ? 'border-primary bg-primary/10'
            : 'border-base-300 bg-base-200 hover:border-primary/40',
        ]"
        @click="selectDefault"
      >
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-base-100"
        >
          <Icon name="kind-icon:robot" class="h-5 w-5 text-primary" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-sm font-black">Kind Robots Default</span>
            <span v-if="!activeServerId" class="badge badge-primary badge-xs"
              >Selected</span
            >
          </div>
          <p class="mt-0.5 text-xs opacity-60">
            Use whichever {{ mode }} server Kind Robots currently recommends.
          </p>
        </div>
      </button>

      <!-- ── Loading skeleton (only while fetching with empty list) ──── -->
      <template v-if="isLoadingFresh">
        <div
          v-for="i in 3"
          :key="`skel-${i}`"
          class="flex animate-pulse flex-col gap-2 rounded-xl border border-base-300 bg-base-200 p-3"
        >
          <div class="flex items-start gap-2.5">
            <div class="h-8 w-8 shrink-0 rounded-lg bg-base-100" />
            <div class="flex-1 space-y-1.5">
              <div class="h-3 w-3/5 rounded bg-base-100" />
              <div class="h-2 w-2/5 rounded bg-base-100" />
            </div>
          </div>
          <div class="h-6 rounded-lg bg-base-100" />
          <div class="flex gap-1">
            <div class="h-3 w-12 rounded bg-base-100" />
            <div class="h-3 w-10 rounded bg-base-100" />
          </div>
        </div>
      </template>

      <!-- ── Official & Public ─────────────────────────────────────────── -->
      <template v-if="filteredPublic.length">
        <gallery-section-header
          label="Official & Public"
          icon="kind-icon:verified"
          :count="filteredPublic.length"
        />
        <server-card
          v-for="server in filteredPublic"
          :key="`pub-${server.id}`"
          :server="server"
          :active="activeServerId === server.id"
          :expanded="expandedCardId === server.id"
          :health-result="serverStore.healthResults[server.id] ?? null"
          @select="selectServer(server.id)"
          @edit="beginEdit(server)"
          @test="serverStore.testServerHealth(server.id)"
          @update:expanded="handleExpanded(server.id, $event)"
        />
      </template>
      <p
        v-else-if="searchQuery && publicServers.length"
        class="rounded-xl border border-dashed border-base-300 p-3 text-center text-xs opacity-50"
      >
        No official servers match "{{ searchQuery }}"
      </p>

      <!-- ── My Servers ────────────────────────────────────────────────── -->
      <gallery-section-header
        label="My Servers"
        icon="kind-icon:user"
        :count="myServers.length"
      >
        <button
          type="button"
          class="btn btn-ghost btn-xs ml-auto gap-1 rounded-lg text-primary"
          @click="emit('open-add', defaultNewType)"
        >
          <Icon name="kind-icon:plus" class="h-3 w-3" />
          New
        </button>
      </gallery-section-header>

      <template v-if="filteredMine.length">
        <server-card
          v-for="server in filteredMine"
          :key="`my-${server.id}`"
          :server="server"
          :active="activeServerId === server.id"
          :expanded="expandedCardId === server.id"
          :health-result="serverStore.healthResults[server.id] ?? null"
          owned
          @select="selectServer(server.id)"
          @edit="beginEdit(server)"
          @test="serverStore.testServerHealth(server.id)"
          @update:expanded="handleExpanded(server.id, $event)"
        />
      </template>

      <!-- Empty state — only when not loading -->
      <div
        v-else-if="!isLoadingFresh"
        class="flex flex-col items-center gap-2 rounded-xl border border-dashed border-base-300 p-4 text-center"
      >
        <p class="text-xs opacity-50">
          {{
            searchQuery
              ? `No personal servers match "${searchQuery}"`
              : `No personal ${mode} servers yet.`
          }}
        </p>
        <div v-if="!searchQuery" class="flex flex-wrap justify-center gap-1.5">
          <button
            v-for="preset in quickAddPresets"
            :key="preset.type"
            type="button"
            class="btn btn-outline btn-xs rounded-lg"
            @click="emit('open-add', preset.type)"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, defineComponent, h, resolveComponent } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'
import { useErrorStore } from '@/stores/errorStore'
import type { Server, ServerType } from '~/prisma/generated/prisma/client'

// ── Props & emits ─────────────────────────────────────────────────────────────

const props = defineProps<{
  mode: 'text' | 'image'
  searchQuery?: string
}>()

const emit = defineEmits<{
  (e: 'open-add', serverType: ServerType): void
  (e: 'open-edit'): void
}>()

// ── Stores ────────────────────────────────────────────────────────────────────

const serverStore = useServerStore()
const userStore = useUserStore()
const errorStore = useErrorStore()
const myUserId = computed(() => userStore.user?.id)

// ── Single-drawer state — only one card's quick-edit open at a time ───────────

const expandedCardId = ref<number | null>(null)

function setExpanded(id: number, value: boolean) {
  expandedCardId.value = value ? id : null
}

// ── Loading / error states ────────────────────────────────────────────────────

/** True only when initially fetching with no data yet (skeleton condition). */
const isLoadingFresh = computed(
  () => serverStore.loading && serverStore.servers.length === 0,
)

const fetchFailed = computed(
  () =>
    !serverStore.loading && serverStore.isInitialized && !!errorStore.message,
)

const latestError = computed(() => errorStore.message ?? null)

// ── Server sets ───────────────────────────────────────────────────────────────

const modeServers = computed<Server[]>(() => {
  if (props.mode === 'text') return serverStore.textServers
  const seen = new Set<number>()
  return [...serverStore.artServers, ...serverStore.comfyServers].filter(
    (s) => {
      if (seen.has(s.id)) return false
      seen.add(s.id)
      return true
    },
  )
})

const publicServers = computed(() =>
  modeServers.value.filter(
    (s) => s.isOfficial || s.isPublic || s.category === 'official',
  ),
)

const myServers = computed(() =>
  modeServers.value.filter(
    (s) =>
      s.userId === myUserId.value && !s.isOfficial && s.category !== 'official',
  ),
)

// ── Search ────────────────────────────────────────────────────────────────────

const q = computed(() => (props.searchQuery ?? '').toLowerCase())

function matches(s: Server) {
  if (!q.value) return true
  return !!(
    s.title?.toLowerCase().includes(q.value) ||
    s.label?.toLowerCase().includes(q.value) ||
    s.baseUrl?.toLowerCase().includes(q.value) ||
    s.description?.toLowerCase().includes(q.value)
  )
}

const filteredPublic = computed(() => publicServers.value.filter(matches))
const filteredMine = computed(() => myServers.value.filter(matches))

/** All currently visible servers — used by Test All. */
const visibleServers = computed(() => [
  ...filteredPublic.value,
  ...filteredMine.value,
])

// ── Active ────────────────────────────────────────────────────────────────────

const activeServerId = computed(() =>
  props.mode === 'text'
    ? serverStore.activeTextServerId
    : serverStore.activeArtServerId,
)
const activeServer = computed(() =>
  props.mode === 'text'
    ? serverStore.activeTextServer
    : serverStore.activeArtServer,
)

function selectDefault() {
  if (props.mode === 'text') serverStore.setActiveTextServer(null)
  else serverStore.setActiveArtServer(null)
}

function selectServer(id: number) {
  if (props.mode === 'text') serverStore.setActiveTextServer(id)
  else serverStore.setActiveArtServer(id)
}

function beginEdit(server: Server) {
  const isOwner = server.userId === myUserId.value
  const shouldClone = !isOwner || server.isPublic || server.isOfficial

  if (shouldClone) {
    serverStore.serverForm = {
      ...server,
      id: undefined,
      userId: myUserId.value ?? undefined,
      title: `${server.title} (My Copy)`,
      label: server.label ? `${server.label} (My Copy)` : 'My Server',
      isPublic: false,
      isOfficial: false,
      isDefault: false,
      isEditable: true,
      apiKey: null,
    }
  } else {
    serverStore.selectServer(server.id)
  }
  emit('open-edit')
}
function handleExpanded(id: number, value: boolean) {
  setExpanded(id, value)
}
// ── Test All ──────────────────────────────────────────────────────────────────

const testingAll = ref(false)

async function testAll() {
  if (testingAll.value) return
  testingAll.value = true
  try {
    await Promise.allSettled(
      visibleServers.value.map((s) => serverStore.testServerHealth(s.id)),
    )
  } finally {
    testingAll.value = false
  }
}

// ── Quick-add presets ─────────────────────────────────────────────────────────

const defaultNewType = computed<ServerType>(() =>
  props.mode === 'text' ? 'TEXT' : 'ART',
)

const quickAddPresets = computed<Array<{ type: ServerType; label: string }>>(
  () =>
    props.mode === 'text'
      ? [
          { type: 'TEXT', label: 'Custom' },
          { type: 'OPENAI_COMPATIBLE', label: 'OpenAI Compatible' },
        ]
      : [
          { type: 'COMFY', label: 'ComfyUI' },
          { type: 'A1111', label: 'A1111' },
          { type: 'ART', label: 'Custom' },
        ],
)

// ── Inline section header ─────────────────────────────────────────────────────

const GallerySectionHeader = defineComponent({
  name: 'GallerySectionHeader',
  props: {
    label: { type: String, required: true },
    icon: { type: String, required: true },
    count: { type: Number, required: true },
  },
  setup(props, { slots }) {
    return () =>
      h(
        'div',
        { class: 'flex items-center gap-1.5 border-t border-base-300 pt-2' },
        [
          h(resolveComponent('Icon'), {
            name: props.icon,
            class: 'h-3 w-3 opacity-40',
          }),
          h(
            'span',
            {
              class:
                'text-[10px] font-black uppercase tracking-widest opacity-40',
            },
            props.label,
          ),
          props.count > 0
            ? h(
                'span',
                { class: 'badge badge-xs badge-neutral ml-0.5' },
                String(props.count),
              )
            : null,
          slots.default?.(),
        ],
      )
  },
})
</script>

<style scoped>
.scrollbar-thin {
  scrollbar-width: thin;
}
.scrollbar-track-transparent {
  scrollbar-color: transparent transparent;
}
.scrollbar-thumb-base-300 {
  scrollbar-color: oklch(var(--b3)) transparent;
}
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  border-radius: 9999px;
  background: oklch(var(--b3));
}
</style>
