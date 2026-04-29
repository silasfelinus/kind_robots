<!-- /components/server/server-gallery.vue -->
<template>
  <section
    :class="[
      'flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100',
      mode === 'text' ? 'ring-1 ring-info/10' : 'ring-1 ring-accent/10',
    ]"
  >
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

        <div
          class="flex flex-col items-end gap-0.5 rounded-xl border border-base-300 bg-base-200 px-3 py-1.5"
        >
          <span
            class="text-[9px] font-black uppercase tracking-widest opacity-40"
          >
            Active
          </span>
          <span
            class="max-w-48 truncate text-[11px] font-bold"
            :title="activeServer?.title ?? 'Kind Robots Default'"
          >
            {{ activeServer?.title ?? 'Kind Robots Default' }}
          </span>
        </div>
      </div>
    </div>

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

    <div
      class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-base-300"
    >
      <button
        type="button"
        :class="[
          'flex w-full shrink-0 items-center gap-3 rounded-xl border p-3 text-left',
          'transition-all duration-150 hover:-translate-y-px',
          !activeServerId
            ? 'border-primary bg-primary/10'
            : 'border-base-300 bg-base-200/80 hover:border-primary/30',
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
            <span v-if="!activeServerId" class="badge badge-primary badge-xs">
              Selected
            </span>
          </div>
          <p class="mt-0.5 text-xs opacity-60">
            Use whichever {{ mode }} server Kind Robots currently recommends.
          </p>
        </div>
      </button>

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

      <gallery-section-header
        label="My Servers"
        icon="kind-icon:user"
        :count="filteredMine.length"
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
          :key="`mine-${server.id}`"
          :server="server"
          :active="activeServerId === server.id"
          :expanded="expandedCardId === server.id"
          :health-result="serverStore.healthResults[server.id]?.data ?? null"
          :hidden="isServerHidden(server.id)"
          owned
          @select="selectServer(server.id)"
          @edit="beginEdit(server)"
          @test="serverStore.testServerHealth(server.id)"
          @hide="hideServer(server.id)"
          @restore="restoreServer(server.id)"
          @update:expanded="handleExpanded(server.id, $event)"
        />
      </template>

      <div
        v-else-if="!isLoadingFresh"
        class="flex flex-col items-center gap-2 rounded-xl border border-dashed border-base-300 bg-base-200/50 p-4 text-center"
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

      <div class="w-full">
        <details class="dropdown dropdown-end w-full">
          <summary
            class="btn btn-outline btn-sm w-full justify-between rounded-xl border-base-300 bg-base-200/70"
          >
            <span class="flex min-w-0 items-center gap-2">
              <Icon name="kind-icon:plus" class="h-4 w-4 shrink-0" />
              <span class="truncate">Add from public servers</span>
            </span>
            <span class="flex items-center gap-2">
              <span class="badge badge-xs badge-neutral">
                {{ filteredPublic.length }}
              </span>
              <Icon name="kind-icon:chevron-down" class="h-4 w-4" />
            </span>
          </summary>

          <div
            class="dropdown-content z-20 mt-2 flex max-h-72 w-full flex-col gap-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-2 shadow-xl"
          >
            <p
              v-if="!filteredPublic.length"
              class="rounded-xl border border-dashed border-base-300 p-3 text-center text-xs opacity-50"
            >
              {{
                searchQuery
                  ? `No public servers match "${searchQuery}"`
                  : 'No public servers available.'
              }}
            </p>

            <button
              v-for="server in filteredPublic"
              :key="`public-option-${server.id}`"
              type="button"
              :class="[
                'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-base-200',
                activeServerId === server.id ? 'bg-primary/10' : '',
                isServerHidden(server.id) ? 'opacity-45' : 'opacity-75',
              ]"
              @click="beginEdit(server)"
            >
              <div
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-base-200"
              >
                <Icon :name="serverIcon(server)" class="h-4 w-4 opacity-70" />
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex min-w-0 items-center gap-1.5">
                  <span class="truncate text-xs font-black">
                    {{ server.label || server.title }}
                  </span>
                  <span
                    v-if="activeServerId === server.id"
                    class="badge badge-primary badge-xs"
                  >
                    Active
                  </span>
                </div>
                <p class="truncate text-[10px] opacity-50">
                  {{ server.description || server.baseUrl }}
                </p>
                <div class="mt-1 flex flex-wrap gap-1">
                  <span
                    :class="[
                      'badge badge-xs',
                      accessModeBadgeClass(server.accessMode),
                    ]"
                  >
                    {{ accessModeLabel(server.accessMode) }}
                  </span>
                  <span
                    v-if="server.requiresClientSideCheck"
                    class="badge badge-xs badge-info"
                  >
                    Browser test
                  </span>
                  <span
                    v-if="server.isPrivateNetwork"
                    class="badge badge-xs badge-success"
                  >
                    Private
                  </span>
                </div>
              </div>

              <span class="badge badge-xs badge-neutral shrink-0 opacity-70">
                {{ server.serverType }}
              </span>
            </button>
          </div>
        </details>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, defineComponent, h, resolveComponent } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'
import { useErrorStore } from '@/stores/errorStore'
import type {
  Server,
  ServerAccessMode,
  ServerType,
} from '~/prisma/generated/prisma/client'

const props = defineProps<{
  mode: 'text' | 'image'
  searchQuery?: string
}>()

const emit = defineEmits<{
  (e: 'open-add', serverType: ServerType): void
  (e: 'open-edit'): void
}>()

const serverStore = useServerStore()
const userStore = useUserStore()
const errorStore = useErrorStore()
const myUserId = computed(() => userStore.user?.id)

const expandedCardId = ref<number | null>(null)
const testingAll = ref(false)

const isLoadingFresh = computed(
  () => serverStore.loading && serverStore.servers.length === 0,
)

const fetchFailed = computed(
  () =>
    !serverStore.loading && serverStore.isInitialized && !!errorStore.message,
)

const latestError = computed(() => errorStore.message ?? null)

const modeServers = computed<Server[]>(() => {
  if (props.mode === 'text') return serverStore.textServers

  const seen = new Set<number>()

  return [...serverStore.artServers, ...serverStore.comfyServers].filter(
    (server: Server) => {
      if (seen.has(server.id)) return false
      seen.add(server.id)
      return true
    },
  )
})

const publicServers = computed<Server[]>(() =>
  modeServers.value.filter(
    (server: Server) =>
      (server.isOfficial ||
        server.isPublic ||
        server.category === 'official') &&
      server.userId !== myUserId.value &&
      shouldShowServer(server.id),
  ),
)

const myServers = computed<Server[]>(() =>
  modeServers.value.filter(
    (server: Server) =>
      server.userId === myUserId.value &&
      !server.isOfficial &&
      server.category !== 'official' &&
      shouldShowServer(server.id),
  ),
)

const q = computed(() => (props.searchQuery ?? '').trim().toLowerCase())

function matches(server: Server): boolean {
  if (!q.value) return true

  return Boolean(
    server.title?.toLowerCase().includes(q.value) ||
    server.label?.toLowerCase().includes(q.value) ||
    server.baseUrl?.toLowerCase().includes(q.value) ||
    server.description?.toLowerCase().includes(q.value) ||
    server.accessMode?.toLowerCase().includes(q.value) ||
    server.oidcProvider?.toLowerCase().includes(q.value),
  )
}

const filteredPublic = computed<Server[]>(() =>
  publicServers.value.filter(matches),
)

const filteredMine = computed<Server[]>(() => myServers.value.filter(matches))

const visibleServers = computed<Server[]>(() => [
  ...filteredMine.value,
  ...filteredPublic.value,
])

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
          { type: 'A1111', label: 'A1111 / Forge' },
          { type: 'ART', label: 'Custom' },
        ],
)

function setExpanded(id: number, value: boolean) {
  expandedCardId.value = value ? id : null
}

function handleExpanded(id: number, value: boolean) {
  setExpanded(id, value)
}

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
      accessMode: server.accessMode ?? 'LOCAL',
      requiresClientSideCheck: server.requiresClientSideCheck ?? false,
      isPrivateNetwork: server.isPrivateNetwork ?? false,
      allowBrowserRequests: server.allowBrowserRequests ?? true,
      useOidc: server.useOidc ?? false,
      oidcProvider: server.oidcProvider ?? null,
    }
  } else {
    serverStore.selectServer(server.id)
  }

  emit('open-edit')
}

async function testAll() {
  if (testingAll.value) return

  testingAll.value = true

  try {
    await Promise.allSettled(
      visibleServers.value.map((server: Server) =>
        serverStore.testServerHealth(server.id),
      ),
    )
  } finally {
    testingAll.value = false
  }
}

function isServerHidden(id: number): boolean {
  const store = serverStore as typeof serverStore & {
    isServerHidden?: (id: number) => boolean
  }

  return store.isServerHidden?.(id) ?? false
}

function shouldShowServer(id: number): boolean {
  const store = serverStore as typeof serverStore & {
    showHiddenServers?: boolean
  }

  return Boolean(store.showHiddenServers) || !isServerHidden(id)
}

function hideServer(id: number) {
  const store = serverStore as typeof serverStore & {
    hideServer?: (id: number) => void
  }

  store.hideServer?.(id)
}

function restoreServer(id: number) {
  const store = serverStore as typeof serverStore & {
    unhideServer?: (id: number) => void
  }

  store.unhideServer?.(id)
}

function accessModeLabel(mode?: ServerAccessMode | null): string {
  const labels: Record<ServerAccessMode, string> = {
    LOCAL: 'Local',
    TAILSCALE: 'Tailscale',
    PUBLIC_PROTECTED: 'Protected',
    PUBLIC_API_KEY: 'API Key',
    PUBLIC_OIDC: 'OIDC',
    PUBLIC_UNPROTECTED: 'Unprotected',
  }

  return mode ? labels[mode] : 'Local'
}

function accessModeBadgeClass(mode?: ServerAccessMode | null): string {
  if (mode === 'TAILSCALE') return 'badge-success'
  if (mode === 'LOCAL') return 'badge-info'
  if (mode === 'PUBLIC_OIDC') return 'badge-secondary'
  if (mode === 'PUBLIC_API_KEY') return 'badge-warning'
  if (mode === 'PUBLIC_PROTECTED') return 'badge-warning'
  if (mode === 'PUBLIC_UNPROTECTED') return 'badge-error'
  return 'badge-neutral'
}

function serverIcon(server: Server): string {
  if (server.accessMode === 'TAILSCALE') return 'kind-icon:shield'
  if (server.useOidc || server.accessMode === 'PUBLIC_OIDC')
    return 'kind-icon:user-check'
  if (server.requiresApiKey || server.accessMode === 'PUBLIC_API_KEY')
    return 'kind-icon:key'
  if (server.serverType === 'COMFY') return 'kind-icon:node'
  if (server.serverType === 'A1111') return 'kind-icon:art'
  if (server.supportsChat) return 'kind-icon:chat'
  return 'kind-icon:server'
}

const GallerySectionHeader = defineComponent({
  name: 'GallerySectionHeader',
  props: {
    label: { type: String, required: true },
    icon: { type: String, required: true },
    count: { type: Number, required: true },
  },
  setup(sectionProps, { slots }) {
    return () =>
      h(
        'div',
        { class: 'flex items-center gap-1.5 border-t border-base-300 pt-2' },
        [
          h(resolveComponent('Icon'), {
            name: sectionProps.icon,
            class: 'h-3 w-3 opacity-40',
          }),
          h(
            'span',
            {
              class:
                'text-[10px] font-black uppercase tracking-widest opacity-40',
            },
            sectionProps.label,
          ),
          sectionProps.count > 0
            ? h(
                'span',
                { class: 'badge badge-xs badge-neutral ml-0.5' },
                String(sectionProps.count),
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
