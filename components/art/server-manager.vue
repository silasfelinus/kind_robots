<!-- /components/server/server-manager.vue -->
<template>
  <section
    class="relative flex min-h-full w-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200 text-base-content"
  >
    <!-- ══ HEADER ══════════════════════════════════════════════════════════ -->
    <header
      class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-base-300 bg-base-100 px-5 py-4"
    >
      <div class="flex min-w-0 items-center gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10"
        >
          <Icon name="kind-icon:server" class="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 class="text-xl font-black tracking-tight">Server Manager</h1>
          <p class="text-xs opacity-60">
            Choose your default engines for text and image processing.
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <!-- Search filter -->
        <label
          class="input input-bordered input-sm flex items-center gap-2 rounded-xl pr-2"
        >
          <Icon name="kind-icon:search" class="h-3.5 w-3.5 opacity-50" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Filter servers…"
            class="w-32 bg-transparent text-xs outline-none placeholder:opacity-50"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="opacity-40 hover:opacity-80"
            @click="searchQuery = ''"
          >
            <Icon name="kind-icon:x" class="h-3 w-3" />
          </button>
        </label>

        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-xl gap-1.5"
          :disabled="serverStore.loading"
          @click="refreshServers"
        >
          <Icon
            v-if="!serverStore.loading"
            name="kind-icon:refresh"
            class="h-3.5 w-3.5"
          />
          <span v-else class="loading loading-spinner loading-xs" />
          Refresh
        </button>

        <button
          type="button"
          class="btn btn-primary btn-sm rounded-xl gap-1.5"
          @click="startNewServer(activeCreateType)"
        >
          <Icon name="kind-icon:plus" class="h-3.5 w-3.5" />
          Add Server
        </button>
      </div>
    </header>

    <!-- ══ BODY ════════════════════════════════════════════════════════════ -->
    <main
      class="body-grid min-h-0 flex-1 gap-4 overflow-hidden p-4"
      :class="{ 'has-editor': showEditor }"
    >
      <!-- ── TEXT COLUMN ─────────────────────────────────────────────────── -->
      <section
        class="col-section flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 ring-1 ring-info/10"
      >
        <div
          class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-base-300 px-4 py-3"
        >
          <div class="flex min-w-0 items-center gap-2.5">
            <Icon name="kind-icon:chat" class="h-5 w-5 shrink-0 text-info" />
            <div>
              <h2 class="text-sm font-black">Text Servers</h2>
              <p class="text-[10px] opacity-50">
                Chat · Bots · Language models
              </p>
            </div>
          </div>
          <div
            class="flex flex-col items-end gap-0.5 rounded-xl border border-base-300 bg-base-200 px-3 py-1.5"
          >
            <span
              class="text-[9px] font-black uppercase tracking-widest opacity-40"
              >Active</span
            >
            <span class="max-w-48 truncate text-[11px] font-bold">
              {{ serverStore.activeTextServer?.title || 'Kind Robots Default' }}
            </span>
          </div>
        </div>

        <div
          class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 scrollbar-thin"
        >
          <kind-default-button
            :active="!serverStore.activeTextServerId"
            label="Kind Robots Default"
            description="Use whichever text server Kind Robots currently recommends."
            @select="selectKindDefault('text')"
          />

          <template v-if="filteredPublicTextServers.length">
            <server-section-header
              label="Official & Public"
              icon="kind-icon:verified"
              :count="filteredPublicTextServers.length"
            />
            <server-card
              v-for="server in filteredPublicTextServers"
              :key="`pub-t-${server.id}`"
              :server="server"
              :active="serverStore.activeTextServer?.id === server.id"
              :health-result="serverStore.healthResults[server.id]"
              @select="selectTextServer(server.id)"
              @edit="editServer(server.id)"
              @test="testServer(server.id)"
            />
          </template>
          <p
            v-else-if="searchQuery && publicTextServers.length"
            class="rounded-xl border border-dashed border-base-300 p-3 text-center text-xs opacity-50"
          >
            No official text servers match "{{ searchQuery }}"
          </p>

          <server-section-header
            label="My Servers"
            icon="kind-icon:user"
            :count="myTextServers.length"
          >
            <button
              type="button"
              class="btn btn-ghost btn-xs ml-auto gap-1 rounded-lg text-primary"
              @click="startNewServer('TEXT')"
            >
              <Icon name="kind-icon:plus" class="h-3 w-3" /> New
            </button>
          </server-section-header>

          <template v-if="filteredMyTextServers.length">
            <server-card
              v-for="server in filteredMyTextServers"
              :key="`my-t-${server.id}`"
              :server="server"
              :active="serverStore.activeTextServer?.id === server.id"
              :health-result="serverStore.healthResults[server.id]"
              owned
              @select="selectTextServer(server.id)"
              @edit="editServer(server.id)"
              @test="testServer(server.id)"
            />
          </template>
          <div
            v-else
            class="flex flex-col items-center gap-2 rounded-xl border border-dashed border-base-300 p-4 text-center"
          >
            <p class="text-xs opacity-50">
              {{
                searchQuery
                  ? `No personal servers match "${searchQuery}"`
                  : 'No personal text servers yet.'
              }}
            </p>
            <div
              v-if="!searchQuery"
              class="flex flex-wrap justify-center gap-1.5"
            >
              <button
                type="button"
                class="btn btn-outline btn-xs rounded-lg"
                @click="startNewServer('TEXT')"
              >
                Custom
              </button>
              <button
                type="button"
                class="btn btn-outline btn-xs rounded-lg"
                @click="startNewServer('OPENAI_COMPATIBLE')"
              >
                OpenAI Compatible
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ── IMAGE COLUMN ────────────────────────────────────────────────── -->
      <section
        class="col-section flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 ring-1 ring-accent/10"
      >
        <div
          class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-base-300 px-4 py-3"
        >
          <div class="flex min-w-0 items-center gap-2.5">
            <Icon name="kind-icon:art" class="h-5 w-5 shrink-0 text-accent" />
            <div>
              <h2 class="text-sm font-black">Image Servers</h2>
              <p class="text-[10px] opacity-50">
                Art · ComfyUI · Stable Diffusion
              </p>
            </div>
          </div>
          <div
            class="flex flex-col items-end gap-0.5 rounded-xl border border-base-300 bg-base-200 px-3 py-1.5"
          >
            <span
              class="text-[9px] font-black uppercase tracking-widest opacity-40"
              >Active</span
            >
            <span class="max-w-48 truncate text-[11px] font-bold">
              {{ serverStore.activeArtServer?.title || 'Kind Robots Default' }}
            </span>
          </div>
        </div>

        <div
          class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 scrollbar-thin"
        >
          <kind-default-button
            :active="!serverStore.activeArtServerId"
            label="Kind Robots Default"
            description="Use whichever image server Kind Robots currently recommends."
            @select="selectKindDefault('image')"
          />

          <template v-if="filteredPublicImageServers.length">
            <server-section-header
              label="Official & Public"
              icon="kind-icon:verified"
              :count="filteredPublicImageServers.length"
            />
            <server-card
              v-for="server in filteredPublicImageServers"
              :key="`pub-i-${server.id}`"
              :server="server"
              :active="serverStore.activeArtServer?.id === server.id"
              :health-result="serverStore.healthResults[server.id]"
              @select="selectImageServer(server.id)"
              @edit="editServer(server.id)"
              @test="testServer(server.id)"
            />
          </template>
          <p
            v-else-if="searchQuery && publicImageServers.length"
            class="rounded-xl border border-dashed border-base-300 p-3 text-center text-xs opacity-50"
          >
            No official image servers match "{{ searchQuery }}"
          </p>

          <server-section-header
            label="My Servers"
            icon="kind-icon:user"
            :count="myImageServers.length"
          >
            <button
              type="button"
              class="btn btn-ghost btn-xs ml-auto gap-1 rounded-lg text-primary"
              @click="startNewServer('ART')"
            >
              <Icon name="kind-icon:plus" class="h-3 w-3" /> New
            </button>
          </server-section-header>

          <template v-if="filteredMyImageServers.length">
            <server-card
              v-for="server in filteredMyImageServers"
              :key="`my-i-${server.id}`"
              :server="server"
              :active="serverStore.activeArtServer?.id === server.id"
              :health-result="serverStore.healthResults[server.id]"
              owned
              @select="selectImageServer(server.id)"
              @edit="editServer(server.id)"
              @test="testServer(server.id)"
            />
          </template>
          <div
            v-else
            class="flex flex-col items-center gap-2 rounded-xl border border-dashed border-base-300 p-4 text-center"
          >
            <p class="text-xs opacity-50">
              {{
                searchQuery
                  ? `No personal servers match "${searchQuery}"`
                  : 'No personal image servers yet.'
              }}
            </p>
            <div
              v-if="!searchQuery"
              class="flex flex-wrap justify-center gap-1.5"
            >
              <button
                type="button"
                class="btn btn-outline btn-xs rounded-lg"
                @click="startNewServer('COMFY')"
              >
                ComfyUI
              </button>
              <button
                type="button"
                class="btn btn-outline btn-xs rounded-lg"
                @click="startNewServer('A1111')"
              >
                A1111
              </button>
              <button
                type="button"
                class="btn btn-outline btn-xs rounded-lg"
                @click="startNewServer('ART')"
              >
                Custom
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ── EDITOR PANEL ────────────────────────────────────────────────── -->
      <transition name="editor-slide">
        <aside
          v-if="showEditor"
          class="col-editor flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <!-- Clone notice -->
          <div
            v-if="isCloning"
            class="flex shrink-0 items-start gap-3 border-b border-warning/30 bg-warning/10 px-4 py-3"
          >
            <Icon
              name="kind-icon:copy"
              class="mt-0.5 h-4 w-4 shrink-0 text-warning"
            />
            <div>
              <p class="text-xs font-black">Creating a personal copy</p>
              <p class="mt-0.5 text-[11px] opacity-70">
                The original is unchanged. Only you can see this version.
              </p>
            </div>
          </div>

          <!-- Editor header -->
          <div
            class="flex shrink-0 items-start justify-between gap-4 border-b border-base-300 px-4 py-3"
          >
            <div>
              <h2 class="text-sm font-black">
                {{
                  isCloning
                    ? 'Customize Server'
                    : serverStore.serverForm.id
                      ? 'Edit Server'
                      : 'Configure Server'
                }}
              </h2>
              <p class="mt-0.5 text-[11px] opacity-55">{{ editorSubtitle }}</p>
            </div>
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-circle shrink-0"
              title="Close (Esc)"
              @click="closeEditor"
            >
              <Icon name="kind-icon:x" class="h-4 w-4" />
            </button>
          </div>

          <form
            class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 scrollbar-thin"
            @submit.prevent="saveServer"
          >
            <!-- Quick Setup -->
            <fieldset
              class="flex flex-col gap-3 rounded-xl border border-base-300 bg-base-200 p-4"
            >
              <legend
                class="px-1 text-[10px] font-black uppercase tracking-widest opacity-45"
              >
                Quick Setup
              </legend>

              <label class="flex flex-col gap-1">
                <span class="text-[11px] font-bold opacity-70">Base URL</span>
                <div class="flex gap-1.5">
                  <input
                    v-model="serverStore.serverForm.baseUrl"
                    class="input input-bordered input-sm flex-1 rounded-xl font-mono text-xs"
                    placeholder="http://localhost:7860"
                  />
                  <button
                    v-if="serverStore.serverForm.baseUrl"
                    type="button"
                    class="btn btn-ghost btn-sm btn-square rounded-xl"
                    title="Copy URL"
                    @click="copyToClipboard(serverStore.serverForm.baseUrl)"
                  >
                    <Icon
                      :name="copiedUrl ? 'kind-icon:check' : 'kind-icon:copy'"
                      class="h-3.5 w-3.5"
                      :class="copiedUrl ? 'text-success' : ''"
                    />
                  </button>
                </div>
              </label>

              <label class="flex flex-col gap-1">
                <span class="text-[11px] font-bold opacity-70"
                  >Endpoint Path</span
                >
                <input
                  v-model="serverStore.serverForm.endpointPath"
                  class="input input-bordered input-sm rounded-xl font-mono text-xs"
                  placeholder="/v1/chat/completions"
                />
              </label>

              <!-- API Key -->
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold opacity-70">API Key</span>
                  <span
                    class="badge badge-xs"
                    :class="
                      serverHasStoredKey ? 'badge-success' : 'badge-neutral'
                    "
                  >
                    {{ serverHasStoredKey ? '🔑 Stored' : 'Not set' }}
                  </span>
                </div>
                <div class="flex gap-1.5">
                  <input
                    v-model="apiKey"
                    class="input input-bordered input-sm flex-1 rounded-xl font-mono text-xs"
                    :type="showApiKey ? 'text' : 'password'"
                    autocomplete="off"
                    placeholder="Leave blank to keep existing"
                  />
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm btn-square shrink-0 rounded-xl"
                    :title="showApiKey ? 'Hide' : 'Show'"
                    @click="showApiKey = !showApiKey"
                  >
                    <Icon
                      :name="showApiKey ? 'kind-icon:eye-off' : 'kind-icon:eye'"
                      class="h-3.5 w-3.5"
                    />
                  </button>
                </div>
                <input
                  v-model="apiKeyName"
                  class="input input-bordered input-sm rounded-xl text-xs"
                  placeholder="Label: OpenAI, Groq, Stability…"
                />
                <div class="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    class="btn btn-outline btn-xs rounded-lg"
                    :disabled="!apiKey.trim() || serverStore.isSaving"
                    @click="saveApiKeyOnly"
                  >
                    Save Key Only
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs rounded-lg opacity-60"
                    :disabled="
                      !serverStore.serverForm.id ||
                      isCloning ||
                      serverStore.isSaving
                    "
                    @click="clearApiKey"
                  >
                    Clear Key
                  </button>
                </div>
              </div>
            </fieldset>

            <!-- More Settings (collapsible) -->
            <details
              class="group overflow-hidden rounded-xl border border-base-300"
            >
              <summary
                class="flex cursor-pointer select-none list-none items-center gap-2 bg-base-200 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider opacity-60 transition-opacity hover:opacity-90"
              >
                <Icon name="kind-icon:settings" class="h-3.5 w-3.5" />
                More Settings
                <Icon
                  name="kind-icon:chevron-down"
                  class="ml-auto h-3.5 w-3.5 transition-transform group-open:rotate-180"
                />
              </summary>

              <div class="flex flex-col gap-3 p-4">
                <div class="grid grid-cols-2 gap-3">
                  <label class="flex flex-col gap-1">
                    <span class="text-[11px] font-bold opacity-70">Title</span>
                    <input
                      v-model="serverStore.serverForm.title"
                      class="input input-bordered input-sm rounded-xl text-xs"
                    />
                  </label>
                  <label class="flex flex-col gap-1">
                    <span class="text-[11px] font-bold opacity-70">Label</span>
                    <input
                      v-model="serverStore.serverForm.label"
                      class="input input-bordered input-sm rounded-xl text-xs"
                    />
                  </label>
                  <label class="flex flex-col gap-1">
                    <span class="text-[11px] font-bold opacity-70"
                      >Server Type</span
                    >
                    <select
                      v-model="serverStore.serverForm.serverType"
                      class="select select-bordered select-sm rounded-xl text-xs"
                    >
                      <option value="ART">ART</option>
                      <option value="TEXT">TEXT</option>
                      <option value="COMFY">COMFY</option>
                      <option value="A1111">A1111</option>
                      <option value="OPENAI_COMPATIBLE">
                        OPENAI_COMPATIBLE
                      </option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </label>
                  <label class="flex flex-col gap-1">
                    <span class="text-[11px] font-bold opacity-70"
                      >Category</span
                    >
                    <input
                      v-model="serverStore.serverForm.category"
                      class="input input-bordered input-sm rounded-xl text-xs"
                    />
                  </label>
                  <label class="col-span-2 flex flex-col gap-1">
                    <span class="text-[11px] font-bold opacity-70"
                      >Health Path</span
                    >
                    <input
                      v-model="serverStore.serverForm.healthPath"
                      class="input input-bordered input-sm rounded-xl font-mono text-xs"
                      placeholder="/health"
                    />
                  </label>
                  <label class="col-span-2 flex flex-col gap-1">
                    <span class="text-[11px] font-bold opacity-70"
                      >Description</span
                    >
                    <textarea
                      v-model="serverStore.serverForm.description"
                      class="textarea textarea-bordered rounded-xl text-xs"
                      rows="2"
                    />
                  </label>
                </div>

                <!-- Capability toggles -->
                <div class="grid grid-cols-2 gap-1.5">
                  <label
                    v-for="toggle in capabilityToggles"
                    :key="toggle.key"
                    class="flex cursor-pointer items-center gap-2 rounded-xl border border-base-300 bg-base-200 px-3 py-2 text-xs font-bold transition-colors hover:border-primary/40"
                  >
                    <input
                      v-model="(serverStore.serverForm as any)[toggle.key]"
                      type="checkbox"
                      class="checkbox checkbox-primary checkbox-xs"
                    />
                    {{ toggle.label }}
                  </label>
                </div>
              </div>
            </details>

            <!-- Save / Cancel -->
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="btn btn-ghost btn-sm flex-1 rounded-xl"
                @click="closeEditor"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary btn-sm flex-1 gap-1.5 rounded-xl"
                :disabled="serverStore.isSaving"
              >
                <span
                  v-if="serverStore.isSaving"
                  class="loading loading-spinner loading-xs"
                />
                <Icon v-else name="kind-icon:save" class="h-3.5 w-3.5" />
                {{
                  isCloning
                    ? 'Save My Copy'
                    : serverStore.serverForm.id
                      ? 'Save Changes'
                      : 'Create Server'
                }}
              </button>
            </div>
          </form>
        </aside>
      </transition>
    </main>

    <!-- Loading overlay -->
    <transition name="fade">
      <div
        v-if="serverStore.loading || serverStore.isSaving"
        class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-base-100/80 backdrop-blur-sm"
      >
        <span class="loading loading-spinner loading-lg text-primary" />
        <span class="text-sm font-bold opacity-70"
          >Negotiating with the server goblins…</span
        >
      </div>
    </transition>
  </section>
</template>

<script setup lang="ts">
import {
  computed,
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  ref,
  resolveComponent,
  watch,
} from 'vue'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'
import type { Server, ServerType } from '~/prisma/generated/prisma/client'

const serverStore = useServerStore()
const userStore = useUserStore()

type ServerMode = 'text' | 'image'

const showEditor = ref(false)
const activeCreateType = ref<ServerType>('TEXT')
const apiKey = ref('')
const apiKeyName = ref('')
const showApiKey = ref(false)
const sourcePublicServerId = ref<number | null>(null)
const searchQuery = ref('')
const copiedUrl = ref(false)

// ── Computed ─────────────────────────────────────────────────────────────────

const myUserId = computed(() => userStore.user?.id)

const allImageServers = computed(() => {
  const ids = new Set<number>()
  return [...serverStore.artServers, ...serverStore.comfyServers].filter(
    (s) => {
      if (ids.has(s.id)) return false
      ids.add(s.id)
      return true
    },
  )
})

const publicTextServers = computed(() =>
  serverStore.textServers.filter(
    (s) => (s.isOfficial || s.isPublic) && s.userId !== myUserId.value,
  ),
)
const myTextServers = computed(() =>
  serverStore.textServers.filter((s) => s.userId === myUserId.value),
)
const publicImageServers = computed(() =>
  allImageServers.value.filter(
    (s) => (s.isOfficial || s.isPublic) && s.userId !== myUserId.value,
  ),
)
const myImageServers = computed(() =>
  allImageServers.value.filter((s) => s.userId === myUserId.value),
)

function matchesSearch(s: Server, q: string): boolean {
  if (!q) return true
  const lower = q.toLowerCase()
  return !!(
    s.title?.toLowerCase().includes(lower) ||
    s.label?.toLowerCase().includes(lower) ||
    s.baseUrl?.toLowerCase().includes(lower) ||
    s.description?.toLowerCase().includes(lower)
  )
}

const filteredPublicTextServers = computed(() =>
  publicTextServers.value.filter((s) => matchesSearch(s, searchQuery.value)),
)
const filteredMyTextServers = computed(() =>
  myTextServers.value.filter((s) => matchesSearch(s, searchQuery.value)),
)
const filteredPublicImageServers = computed(() =>
  publicImageServers.value.filter((s) => matchesSearch(s, searchQuery.value)),
)
const filteredMyImageServers = computed(() =>
  myImageServers.value.filter((s) => matchesSearch(s, searchQuery.value)),
)

const serverHasStoredKey = computed(() =>
  Boolean(serverStore.serverForm.apiKey),
)

const isCloning = computed(() => {
  const formId = serverStore.serverForm.id
  if (!formId) return !!sourcePublicServerId.value
  const server = serverStore.getServerById(formId)
  if (!server) return !!sourcePublicServerId.value
  return (
    server.userId !== myUserId.value || !!server.isPublic || !!server.isOfficial
  )
})

const editorSubtitle = computed(() => {
  if (isCloning.value)
    return 'Your edits create a private copy — original unchanged.'
  if (serverStore.serverForm.id) return 'Adjust this server configuration.'
  return `New ${serverStore.serverForm.serverType || activeCreateType.value} server.`
})

const capabilityToggles = [
  { key: 'supportsChat', label: 'Chat' },
  { key: 'supportsTxt2Img', label: 'Txt → Img' },
  { key: 'supportsImg2Img', label: 'Img → Img' },
  { key: 'supportsComfyWorkflow', label: 'Comfy Workflow' },
  { key: 'requiresApiKey', label: 'Requires API Key' },
  { key: 'isActive', label: 'Active' },
] as const

// ── Actions ───────────────────────────────────────────────────────────────────

async function refreshServers() {
  await serverStore.fetchAllServers(true)
}

function selectKindDefault(mode: ServerMode) {
  if (mode === 'text') serverStore.setActiveTextServer(null)
  else serverStore.setActiveArtServer(null)
}
function selectTextServer(id: number) {
  serverStore.setActiveTextServer(id)
}
function selectImageServer(id: number) {
  serverStore.setActiveArtServer(id)
}

function startNewServer(serverType: ServerType) {
  activeCreateType.value = serverType
  sourcePublicServerId.value = null
  apiKey.value = ''
  apiKeyName.value = ''
  showApiKey.value = false
  serverStore.createNewServer(serverType)
  showEditor.value = true
}

function editServer(id: number) {
  const server = serverStore.getServerById(id)
  if (!server) return

  const isOwner = server.userId === myUserId.value
  const shouldClone = !isOwner || !!server.isPublic || !!server.isOfficial

  if (shouldClone) {
    sourcePublicServerId.value = id
    serverStore.serverForm = {
      ...server,
      id: undefined,
      userId: myUserId.value ?? 10,
      title: `${server.title} (My Copy)`,
      label: server.label ? `${server.label} (My Copy)` : 'My Server',
      isPublic: false,
      isOfficial: false,
      isDefault: false,
      isEditable: true,
      apiKey: null,
      apiKeyName: server.apiKeyName || '',
    }
  } else {
    sourcePublicServerId.value = null
    serverStore.selectServer(id)
  }

  apiKey.value = ''
  apiKeyName.value = serverStore.serverForm.apiKeyName || ''
  showApiKey.value = false
  showEditor.value = true
}

async function ensurePrivateEditableServer(): Promise<number | null> {
  if (!userStore.isLoggedIn) return null
  if (serverStore.serverForm.id && !isCloning.value)
    return serverStore.serverForm.id

  const payload = {
    ...serverStore.serverForm,
    id: undefined,
    userId: myUserId.value ?? 10,
    isPublic: false,
    isOfficial: false,
    isDefault: false,
    isEditable: true,
    apiKey: undefined,
    apiKeyName:
      apiKeyName.value || serverStore.serverForm.apiKeyName || 'API Key',
  }
  serverStore.serverForm = payload
  const result = await serverStore.saveServer()
  if (!result.success || !result.data) return null
  serverStore.selectServer(result.data.id)
  return result.data.id
}

async function saveApiKeyOnly() {
  if (!apiKey.value.trim()) return
  const serverId = await ensurePrivateEditableServer()
  if (!serverId) return
  await serverStore.updateServerApiKey(serverId, {
    apiKey: apiKey.value,
    apiKeyName:
      apiKeyName.value || serverStore.serverForm.apiKeyName || 'API Key',
  })
  apiKey.value = ''
  sourcePublicServerId.value = null
}

async function clearApiKey() {
  if (!serverStore.serverForm.id || isCloning.value) return
  await serverStore.updateServerApiKey(serverStore.serverForm.id, {
    clearKey: true,
    apiKeyName:
      apiKeyName.value || serverStore.serverForm.apiKeyName || 'API Key',
  })
  apiKey.value = ''
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copiedUrl.value = true
    setTimeout(() => {
      copiedUrl.value = false
    }, 1500)
  } catch {}
}

function closeEditor() {
  sourcePublicServerId.value = null
  apiKey.value = ''
  apiKeyName.value = ''
  showApiKey.value = false
  serverStore.deselectServer()
  showEditor.value = false
}

async function saveServer() {
  const payload = {
    ...serverStore.serverForm,
    apiKey: undefined,
    apiKeyName: apiKeyName.value || serverStore.serverForm.apiKeyName || null,
  }
  serverStore.serverForm = payload
  const result = await serverStore.saveServer()
  if (!result.success || !result.data) return

  if (apiKey.value.trim()) {
    await serverStore.updateServerApiKey(result.data.id, {
      apiKey: apiKey.value,
      apiKeyName:
        apiKeyName.value || serverStore.serverForm.apiKeyName || 'API Key',
    })
  }
  apiKey.value = ''
  sourcePublicServerId.value = null
  showEditor.value = false
}

async function testServer(id: number) {
  await serverStore.testServerHealth(id)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && showEditor.value) closeEditor()
}

watch(
  () => serverStore.serverForm.apiKeyName,
  (value) => {
    if (!apiKeyName.value && value) apiKeyName.value = value
  },
)

onMounted(async () => {
  await serverStore.initialize()
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// ── Sub-components ────────────────────────────────────────────────────────────

const KindDefaultButton = defineComponent({
  name: 'KindDefaultButton',
  emits: ['select'],
  props: {
    active: { type: Boolean, required: true },
    label: { type: String, required: true },
    description: { type: String, required: true },
  },
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          type: 'button',
          class: [
            'flex w-full flex-shrink-0 items-center gap-3 rounded-xl border p-3 text-left',
            'transition-all duration-150 hover:-translate-y-px',
            props.active
              ? 'border-primary bg-primary/10'
              : 'border-base-300 bg-base-200 hover:border-primary/40',
          ],
          onClick: () => emit('select'),
        },
        [
          h(
            'div',
            {
              class:
                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-base-100',
            },
            [
              h(resolveComponent('Icon'), {
                name: 'kind-icon:robot',
                class: 'h-5 w-5 text-primary',
              }),
            ],
          ),
          h('div', { class: 'min-w-0 flex-1' }, [
            h('div', { class: 'flex flex-wrap items-center gap-1.5' }, [
              h('span', { class: 'text-sm font-black' }, props.label),
              props.active
                ? h(
                    'span',
                    { class: 'badge badge-primary badge-xs' },
                    'Selected',
                  )
                : null,
            ]),
            h('p', { class: 'mt-0.5 text-xs opacity-60' }, props.description),
          ]),
        ],
      )
  },
})

const ServerSectionHeader = defineComponent({
  name: 'ServerSectionHeader',
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

function makeStatusDot(status: string | null) {
  const clsMap: Record<string, string> = {
    ONLINE: 'bg-success',
    OFFLINE: 'bg-error',
    DEGRADED: 'bg-warning',
  }
  const pulse = status === 'ONLINE' ? ' status-pulse' : ''
  return h('span', {
    class: `inline-block h-2 w-2 flex-shrink-0 rounded-full ${clsMap[status ?? ''] ?? 'bg-base-300'}${pulse}`,
  })
}

const ServerCard = defineComponent({
  name: 'ServerCard',
  emits: ['select', 'edit', 'test'],
  props: {
    server: { type: Object as () => Server, required: true },
    active: { type: Boolean, required: true },
    healthResult: { type: Object, required: false, default: null },
    owned: { type: Boolean, default: false },
  },
  setup(props, { emit }) {
    const mainIcon = computed(() => {
      if (props.server.supportsChat) return 'kind-icon:chat'
      if (props.server.supportsComfyWorkflow) return 'kind-icon:workflow'
      return 'kind-icon:art'
    })

    const statusBadge = computed(() => {
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
        ).filter(Boolean) as Array<{ label: string; cls: string }>,
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
          // Title + icon
          h('div', { class: 'flex items-start gap-2.5' }, [
            h(
              'div',
              {
                class:
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-base-100',
              },
              [
                h(resolveComponent('Icon'), {
                  name: mainIcon.value,
                  class: 'h-4 w-4 text-primary',
                }),
              ],
            ),
            h('div', { class: 'min-w-0 flex-1' }, [
              h('div', { class: 'flex flex-wrap items-center gap-1' }, [
                makeStatusDot(props.server.lastStatus),
                h(
                  'span',
                  { class: 'truncate text-sm font-black' },
                  props.server.label || props.server.title,
                ),
                props.active
                  ? h(
                      'span',
                      { class: 'badge badge-primary badge-xs' },
                      'Active',
                    )
                  : null,
                props.server.isOfficial
                  ? h(
                      'span',
                      { class: 'badge badge-info badge-xs' },
                      'Official',
                    )
                  : null,
              ]),
              h(
                'p',
                { class: 'mt-0.5 truncate text-[11px] opacity-55' },
                props.server.description || props.server.baseUrl,
              ),
            ]),
          ]),

          // URL meta strip
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
              props.server.endpointPath
                ? h('span', { class: 'opacity-60' }, props.server.endpointPath)
                : null,
            ],
          ),

          // Cap badges + status
          h('div', { class: 'flex flex-wrap gap-1' }, [
            ...capBadges.value.map((b) =>
              h('span', { class: `badge badge-xs ${b.cls}` }, b.label),
            ),
            h(
              'span',
              { class: `badge badge-xs ${statusBadge.value}` },
              props.server.lastStatus || 'UNKNOWN',
            ),
          ]),

          // Health line
          props.healthResult
            ? h('p', { class: 'text-[10px] opacity-60' }, [
                props.healthResult.ok ? '✓ Healthy' : '✗ Failed',
                ` · ${props.healthResult.latencyMs}ms`,
              ])
            : null,

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
/* Grid layout — needs :has() and dynamic columns, not possible in Tailwind alone */
.body-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.body-grid.has-editor {
  grid-template-columns: repeat(2, minmax(0, 1fr)) minmax(300px, 380px);
}

/* Thin scrollbar */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: oklch(var(--b3)) transparent;
}
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: oklch(var(--b3));
}

/* Gentle status pulse for ONLINE servers */
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

/* Editor slide-in */
.editor-slide-enter-active,
.editor-slide-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.editor-slide-enter-from,
.editor-slide-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

/* Backdrop fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Stack columns on narrow viewports */
@media (max-width: 900px) {
  .body-grid,
  .body-grid.has-editor {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
  .col-section {
    max-height: 55vh;
  }
}
@media (max-width: 640px) {
  .col-editor {
    max-height: 70vh;
  }
}
</style>
