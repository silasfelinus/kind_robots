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
        <!-- Debug toggle -->
        <button
          type="button"
          :class="[
            'btn btn-xs rounded-lg gap-1',
            showDebug ? 'btn-warning' : 'btn-ghost opacity-40 hover:opacity-80',
          ]"
          title="Toggle store debug info"
          @click="showDebug = !showDebug"
        >
          <Icon name="kind-icon:bug" class="h-3 w-3" />
          <span class="hidden sm:inline">Debug</span>
        </button>

        <!-- Active chip -->
        <div
          class="flex flex-col items-end gap-0.5 rounded-xl border border-base-300 bg-base-200 px-3 py-1.5"
        >
          <span
            class="text-[9px] font-black uppercase tracking-widest opacity-40"
            >Active</span
          >
          <span class="max-w-48 truncate text-[11px] font-bold">
            {{ activeServer?.title ?? 'Kind Robots Default' }}
          </span>
        </div>
      </div>
    </div>

    <!-- ── Error banner (visible without debug, shown when fetch clearly failed) -->
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
          {{
            latestError ??
            'Could not load servers from the API. Check the console for details.'
          }}
        </p>
      </div>
      <button
        type="button"
        class="btn btn-error btn-xs rounded-lg shrink-0"
        @click="serverStore.fetchAllServers(true)"
      >
        Retry
      </button>
    </div>

    <!-- ── Debug panel ───────────────────────────────────────────────────── -->
    <div
      v-if="showDebug"
      class="shrink-0 border-b border-warning/30 bg-warning/5 px-4 py-3 text-[11px] space-y-2"
    >
      <p class="font-black text-warning">Store Debug — {{ mode }} gallery</p>

      <!-- State badges -->
      <div class="flex flex-wrap gap-1.5">
        <span
          :class="[
            'badge badge-xs',
            serverStore.isInitialized ? 'badge-success' : 'badge-error',
          ]"
        >
          {{ serverStore.isInitialized ? 'initialized' : 'not initialized' }}
        </span>
        <span
          :class="[
            'badge badge-xs',
            serverStore.hasLoaded ? 'badge-success' : 'badge-warning',
          ]"
        >
          {{ serverStore.hasLoaded ? 'hasLoaded' : 'not loaded' }}
        </span>
        <span
          :class="[
            'badge badge-xs',
            serverStore.loading ? 'badge-warning' : 'badge-neutral',
          ]"
        >
          {{ serverStore.loading ? 'loading…' : 'idle' }}
        </span>
        <span class="badge badge-xs badge-neutral"
          >{{ serverStore.servers.length }} total</span
        >
        <span class="badge badge-xs badge-info"
          >{{ serverStore.textServers.length }} text</span
        >
        <span class="badge badge-xs badge-accent"
          >{{ serverStore.artServers.length }} art</span
        >
        <span class="badge badge-xs badge-secondary"
          >{{ serverStore.comfyServers.length }} comfy</span
        >
        <span class="badge badge-xs badge-neutral"
          >{{ modeServers.length }} in this column</span
        >
      </div>

      <!-- Active IDs -->
      <div class="flex flex-wrap gap-x-4 gap-y-0.5 opacity-70">
        <span
          >activeTextServerId:
          <code class="text-info">{{
            serverStore.activeTextServerId ?? 'null'
          }}</code></span
        >
        <span
          >activeArtServerId:
          <code class="text-accent">{{
            serverStore.activeArtServerId ?? 'null'
          }}</code></span
        >
      </div>

      <!-- Error store -->
      <div
        v-if="errorStore.message"
        class="rounded-lg border border-error/30 bg-error/10 px-3 py-2"
      >
        <p
          class="font-black text-error text-[10px] uppercase tracking-widest mb-1"
        >
          Error Store
        </p>
        <p class="text-error opacity-80">
          {{ errorStore.message }}
        </p>
        <p v-if="errorStore.type" class="opacity-50 mt-0.5">
          type: {{ errorStore.type }}
        </p>
      </div>
      <p v-else class="text-[10px] opacity-40">No errors in errorStore.</p>

      <!-- Server list -->
      <div v-if="serverStore.servers.length" class="space-y-1">
        <p class="font-bold opacity-60">All servers in store:</p>
        <div
          v-for="s in serverStore.servers"
          :key="s.id"
          :class="[
            'flex flex-wrap gap-x-3 gap-y-0.5 rounded-lg px-2 py-1 font-mono text-[10px]',
            modeServers.some((m) => m.id === s.id)
              ? 'bg-warning/10'
              : 'bg-base-200 opacity-40',
          ]"
        >
          <span class="font-bold text-primary">#{{ s.id }}</span>
          <span>{{ s.title || s.label || '(untitled)' }}</span>
          <span class="opacity-60">{{ s.serverType }}</span>
          <span :class="s.isActive ? 'text-success' : 'text-error'">{{
            s.isActive ? 'active' : 'inactive'
          }}</span>
          <span v-if="s.isOfficial" class="text-info">official</span>
          <span v-if="s.isPublic" class="text-secondary">public</span>
          <span class="opacity-40">uid:{{ s.userId ?? '—' }}</span>
        </div>
      </div>
      <div
        v-else
        class="rounded-lg bg-error/10 px-3 py-2 text-error text-[11px]"
      >
        ⚠ serverStore.servers is empty — fetch may have failed or not run yet.
      </div>

      <div class="flex gap-1.5">
        <button
          type="button"
          class="btn btn-xs btn-outline rounded-lg"
          @click="serverStore.fetchAllServers(true)"
        >
          Force refetch
        </button>
        <button
          type="button"
          class="btn btn-xs btn-ghost rounded-lg opacity-60"
          @click="serverStore.initialize()"
        >
          Re-initialize
        </button>
        <button
          v-if="errorStore.message"
          type="button"
          class="btn btn-xs btn-ghost rounded-lg opacity-60"
          @click="errorStore.clearError()"
        >
          Clear error
        </button>
      </div>
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
          :health-result="serverStore.healthResults[server.id] ?? null"
          @select="selectServer(server.id)"
          @edit="beginEdit(server)"
          @test="serverStore.testServerHealth(server.id)"
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
          :health-result="serverStore.healthResults[server.id] ?? null"
          owned
          @select="selectServer(server.id)"
          @edit="beginEdit(server)"
          @test="serverStore.testServerHealth(server.id)"
        />
      </template>

      <!-- Empty state -->
      <div
        v-else
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
const showDebug = ref(false)

// ── Error surfacing ───────────────────────────────────────────────────────────

/**
 * Show the error banner when:
 *   - the store has finished attempting to load (not loading, initialize ran)
 *   - servers is still empty
 *   - OR errorStore has a current error
 * Don't show it while loading is in progress.
 */
const fetchFailed = computed(
  () =>
    !serverStore.loading &&
    serverStore.isInitialized &&
    (serverStore.servers.length === 0 || !!errorStore.message),
)

const latestError = computed(() => errorStore.message ?? null)

// ── Server sets — all from store computed properties ──────────────────────────

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

// ← this goes here, right after modeServers
const publicServers = computed(() =>
  modeServers.value.filter(
    (s) => s.isOfficial || s.isPublic || s.category === 'official',
  ),
)

const myServers = computed(() =>
  modeServers.value.filter((s) => s.userId === myUserId.value && !s.isOfficial),
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

// ── Active server ─────────────────────────────────────────────────────────────

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

// ── Inline sub-components ─────────────────────────────────────────────────────

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

function statusDot(status: string | null | undefined) {
  const colors: Record<string, string> = {
    ONLINE: 'bg-success',
    OFFLINE: 'bg-error',
    DEGRADED: 'bg-warning',
  }
  const pulse = status === 'ONLINE' ? ' status-pulse' : ''
  return h('span', {
    class: `inline-block h-2 w-2 shrink-0 rounded-full ${colors[status ?? ''] ?? 'bg-base-300'}${pulse}`,
  })
}

const ServerCard = defineComponent({
  name: 'ServerCard',
  emits: ['select', 'edit', 'test'],
  props: {
    server: { type: Object as () => Server, required: true },
    active: { type: Boolean, required: true },
    healthResult: {
      type: Object as () => { ok: boolean; latencyMs: number } | null,
      default: null,
    },
    owned: { type: Boolean, default: false },
  },
  setup(props, { emit }) {
    const icon = computed(() => {
      if (props.server.supportsChat) return 'kind-icon:chat'
      if (props.server.supportsComfyWorkflow) return 'kind-icon:workflow'
      return 'kind-icon:art'
    })

    const statusBadgeCls = computed(() => {
      const map: Record<string, string> = {
        ONLINE: 'badge-success',
        OFFLINE: 'badge-error',
        DEGRADED: 'badge-warning',
      }
      return map[props.server.lastStatus ?? ''] ?? 'badge-neutral'
    })

    const capBadges = computed(
      () =>
        (
          [
            props.server.supportsChat && {
              label: 'chat',
              cls: 'badge-secondary',
            },
            props.server.supportsTxt2Img && {
              label: 'txt2img',
              cls: 'badge-accent',
            },
            props.server.supportsImg2Img && {
              label: 'img2img',
              cls: 'badge-accent',
            },
            props.server.supportsComfyWorkflow && {
              label: 'comfy',
              cls: 'badge-warning',
            },
            props.server.requiresApiKey && {
              label: 'api key',
              cls: 'badge-neutral',
            },
          ] as const
        ).filter(Boolean) as { label: string; cls: string }[],
    )

    return () =>
      h(
        'article',
        {
          class: [
            'flex flex-col gap-2 rounded-xl border p-3 transition-all duration-150 hover:-translate-y-px',
            props.active
              ? 'border-primary bg-primary/8'
              : 'border-base-300 bg-base-200 hover:border-primary/30',
          ],
        },
        [
          h('div', { class: 'flex items-start gap-2.5' }, [
            h(
              'div',
              {
                class:
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-base-100',
              },
              [
                h(resolveComponent('Icon'), {
                  name: icon.value,
                  class: 'h-4 w-4 text-primary',
                }),
              ],
            ),
            h('div', { class: 'min-w-0 flex-1' }, [
              h('div', { class: 'flex flex-wrap items-center gap-1' }, [
                statusDot(props.server.lastStatus),
                h(
                  'span',
                  { class: 'truncate text-sm font-black' },
                  props.server.label || props.server.title,
                ),
                props.active &&
                  h(
                    'span',
                    { class: 'badge badge-primary badge-xs' },
                    'Active',
                  ),
                props.server.isOfficial &&
                  h('span', { class: 'badge badge-info badge-xs' }, 'Official'),
              ]),
              h(
                'p',
                { class: 'mt-0.5 truncate text-[11px] opacity-55' },
                props.server.description || props.server.baseUrl,
              ),
            ]),
          ]),

          h(
            'div',
            {
              class:
                'flex flex-wrap gap-x-3 gap-y-0.5 rounded-lg bg-base-100 px-2.5 py-1.5 font-mono text-[10px] opacity-65',
            },
            [
              h(
                'span',
                { class: 'font-sans font-bold text-primary not-italic' },
                props.server.serverType,
              ),
              h('span', { class: 'truncate' }, props.server.baseUrl),
              props.server.endpointPath &&
                h('span', { class: 'opacity-60' }, props.server.endpointPath),
            ],
          ),

          h('div', { class: 'flex flex-wrap gap-1' }, [
            ...capBadges.value.map((b) =>
              h('span', { class: `badge badge-xs ${b.cls}` }, b.label),
            ),
            h(
              'span',
              { class: `badge badge-xs ${statusBadgeCls.value}` },
              props.server.lastStatus || 'UNKNOWN',
            ),
          ]),

          props.healthResult &&
            h(
              'p',
              { class: 'text-[10px] opacity-60' },
              `${props.healthResult.ok ? '✓ Healthy' : '✗ Failed'} · ${props.healthResult.latencyMs}ms`,
            ),

          h('div', { class: 'flex flex-wrap gap-1.5 pt-0.5' }, [
            h(
              'button',
              {
                type: 'button',
                class: 'btn btn-primary btn-xs flex-1 rounded-lg',
                disabled: props.active || !props.server.isActive,
                onClick: () => emit('select'),
              },
              props.active ? 'Selected' : 'Use',
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'btn btn-ghost btn-xs rounded-lg',
                onClick: () => emit('test'),
              },
              'Test',
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'btn btn-ghost btn-xs rounded-lg',
                onClick: () => emit('edit'),
              },
              props.owned ? 'Edit' : 'Customize',
            ),
          ]),
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

@keyframes status-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
    transform: scale(1.5);
  }
}
.status-pulse {
  animation: status-pulse 2.5s ease-in-out infinite;
}
</style>
