<!-- /components/server/server-gallery.vue -->
<!--
  Props
    mode         'text' | 'image'   which half of the store to show
    searchQuery  string             forwarded from parent for filtering

  Emits
    open-add(serverType)            ask parent to open add-server panel
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

      <!-- Active chip -->
      <div
        class="flex flex-col items-end gap-0.5 rounded-xl border border-base-300 bg-base-200 px-3 py-1.5"
      >
        <span class="text-[9px] font-black uppercase tracking-widest opacity-40"
          >Active</span
        >
        <span class="max-w-48 truncate text-[11px] font-bold">
          {{ activeServer?.title ?? 'Kind Robots Default' }}
        </span>
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
      <template
        v-if="
          filteredPublic.length ||
          (!searchQuery && publicServers.length === 0 && !serverStore.loading)
        "
      >
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

        <p
          v-if="
            searchQuery &&
            filteredPublic.length === 0 &&
            publicServers.length > 0
          "
          class="rounded-xl border border-dashed border-base-300 p-3 text-center text-xs opacity-50"
        >
          No official servers match "{{ searchQuery }}"
        </p>
      </template>

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
import { computed, defineComponent, h, resolveComponent } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'
import type { Server, ServerType } from '~/prisma/generated/prisma/client'

// ── Props & emits ─────────────────────────────────────────────────────────────

const props = defineProps<{
  mode: 'text' | 'image'
  searchQuery?: string
}>()

const emit = defineEmits<{
  (e: 'open-add', serverType: ServerType): void
}>()

// ── Stores ────────────────────────────────────────────────────────────────────

const serverStore = useServerStore()
const userStore = useUserStore()
const myUserId = computed(() => userStore.user?.id)

// ── Derive server sets from store computed properties ─────────────────────────
// We intersect the store's mode-specific lists with ownership/visibility lists.
// No local filtering logic — all classification lives in serverStore.

const modeServers = computed<Server[]>(() => {
  if (props.mode === 'text') return serverStore.textServers
  // Deduplicate artServers ∪ comfyServers by id
  const seen = new Set<number>()
  return [...serverStore.artServers, ...serverStore.comfyServers].filter(
    (s) => {
      if (seen.has(s.id)) return false
      seen.add(s.id)
      return true
    },
  )
})

// Official or public within this mode
const publicServers = computed<Server[]>(() =>
  modeServers.value.filter((s) => s.isOfficial || s.isPublic),
)

// Owned by current user and not official (private copies / custom)
const myServers = computed<Server[]>(() =>
  modeServers.value.filter((s) => s.userId === myUserId.value && !s.isOfficial),
)

// ── Search filtering ──────────────────────────────────────────────────────────

const q = computed(() => (props.searchQuery ?? '').toLowerCase())

function matches(s: Server): boolean {
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

// Pre-fill the form then ask parent to open the panel
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
  emit('open-add', server.serverType)
}

// ── Quick-add presets (UI only — no data) ─────────────────────────────────────

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
  const pulse =
    status === 'ONLINE'
      ? ' [animation:status-pulse_2.5s_ease-in-out_infinite]'
      : ''
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
          // Title row
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

          // URL strip
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

          // Capability + status badges
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

          // Health result
          props.healthResult &&
            h(
              'p',
              { class: 'text-[10px] opacity-60' },
              `${props.healthResult.ok ? '✓ Healthy' : '✗ Failed'} · ${props.healthResult.latencyMs}ms`,
            ),

          // Actions
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
/* Tailwind doesn't ship scrollbar utilities in base — keep these three */
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
</style>
