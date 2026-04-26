<!-- /components/server/server-manager.vue -->
<template>
  <section class="server-manager">
    <header class="sm-header">
      <div class="sm-header-brand">
        <Icon name="kind-icon:server" class="sm-logo" />
        <div>
          <h1 class="sm-title">Server Manager</h1>
          <p class="sm-subtitle">
            Choose your default engines for text and image processing.
          </p>
        </div>
      </div>

      <div class="sm-header-actions">
        <button
          type="button"
          class="sm-btn sm-btn-secondary"
          :disabled="serverStore.loading"
          @click="refreshServers"
        >
          <Icon name="kind-icon:refresh" class="sm-btn-icon" />
          Refresh
        </button>
        <button
          type="button"
          class="sm-btn sm-btn-primary"
          @click="startNewServer(activeCreateType)"
        >
          <Icon name="kind-icon:plus" class="sm-btn-icon" />
          Add Server
        </button>
      </div>
    </header>

    <main class="sm-body">
      <!-- ── TEXT COLUMN ── -->
      <section class="sm-column sm-column-text">
        <div class="sm-column-header">
          <div class="sm-column-heading">
            <Icon name="kind-icon:chat" class="sm-column-icon" />
            <div>
              <h2 class="sm-column-title">Text Servers</h2>
              <p class="sm-column-subtitle">
                Chat, bots, prompts, language models
              </p>
            </div>
          </div>
          <div class="sm-active-pill">
            <span class="sm-active-label">Active</span>
            <span class="sm-active-value">{{
              serverStore.activeTextServer?.title || 'Kind Robots Default'
            }}</span>
          </div>
        </div>

        <div class="sm-column-scroll">
          <!-- Kind Default -->
          <button
            type="button"
            class="sm-default-card"
            :class="{ active: !serverStore.activeTextServerId }"
            @click="selectKindDefault('text')"
          >
            <div class="sm-default-icon-wrap">
              <Icon name="kind-icon:robot" class="sm-default-icon" />
            </div>
            <div class="sm-default-copy">
              <div class="sm-default-title-row">
                <h3 class="sm-default-title">Kind Robots Default</h3>
                <span
                  v-if="!serverStore.activeTextServerId"
                  class="sm-badge sm-badge-primary"
                  >Selected</span
                >
              </div>
              <p class="sm-default-description">
                Use whichever text server Kind Robots currently recommends.
              </p>
            </div>
          </button>

          <!-- Official + Public catalog -->
          <div v-if="publicTextServers.length" class="sm-section">
            <div class="sm-section-label">
              <Icon name="kind-icon:verified" class="sm-section-icon" />
              Official &amp; Public
            </div>
            <div class="sm-card-list">
              <server-catalog-card
                v-for="server in publicTextServers"
                :key="`pub-text-${server.id}`"
                :server="server"
                :active="serverStore.activeTextServer?.id === server.id"
                :health-result="serverStore.healthResults[server.id]"
                @select="selectTextServer(server.id)"
                @edit="editServer(server.id)"
                @test="testServer(server.id)"
              />
            </div>
          </div>

          <!-- My text servers -->
          <div class="sm-section">
            <div class="sm-section-label">
              <Icon name="kind-icon:user" class="sm-section-icon" />
              My Servers
              <button
                type="button"
                class="sm-add-inline"
                @click="startNewServer('TEXT')"
              >
                <Icon name="kind-icon:plus" class="sm-add-icon" />
                New
              </button>
            </div>

            <div v-if="myTextServers.length" class="sm-card-list">
              <server-catalog-card
                v-for="server in myTextServers"
                :key="`my-text-${server.id}`"
                :server="server"
                :active="serverStore.activeTextServer?.id === server.id"
                :health-result="serverStore.healthResults[server.id]"
                owned
                @select="selectTextServer(server.id)"
                @edit="editServer(server.id)"
                @test="testServer(server.id)"
              />
            </div>
            <div v-else class="sm-empty-mine">
              <p>No personal text servers yet.</p>
              <button
                type="button"
                class="sm-btn sm-btn-secondary sm-btn-sm"
                @click="startNewServer('OPENAI_COMPATIBLE')"
              >
                OpenAI Compatible
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ── IMAGE COLUMN ── -->
      <section class="sm-column sm-column-image">
        <div class="sm-column-header">
          <div class="sm-column-heading">
            <Icon name="kind-icon:art" class="sm-column-icon" />
            <div>
              <h2 class="sm-column-title">Image Servers</h2>
              <p class="sm-column-subtitle">
                Art, ComfyUI, Stable Diffusion, image pipelines
              </p>
            </div>
          </div>
          <div class="sm-active-pill">
            <span class="sm-active-label">Active</span>
            <span class="sm-active-value">{{
              serverStore.activeArtServer?.title || 'Kind Robots Default'
            }}</span>
          </div>
        </div>

        <div class="sm-column-scroll">
          <!-- Kind Default -->
          <button
            type="button"
            class="sm-default-card"
            :class="{ active: !serverStore.activeArtServerId }"
            @click="selectKindDefault('image')"
          >
            <div class="sm-default-icon-wrap">
              <Icon name="kind-icon:robot" class="sm-default-icon" />
            </div>
            <div class="sm-default-copy">
              <div class="sm-default-title-row">
                <h3 class="sm-default-title">Kind Robots Default</h3>
                <span
                  v-if="!serverStore.activeArtServerId"
                  class="sm-badge sm-badge-primary"
                  >Selected</span
                >
              </div>
              <p class="sm-default-description">
                Use whichever image server Kind Robots currently recommends.
              </p>
            </div>
          </button>

          <!-- Official + Public catalog -->
          <div v-if="publicImageServers.length" class="sm-section">
            <div class="sm-section-label">
              <Icon name="kind-icon:verified" class="sm-section-icon" />
              Official &amp; Public
            </div>
            <div class="sm-card-list">
              <server-catalog-card
                v-for="server in publicImageServers"
                :key="`pub-img-${server.id}`"
                :server="server"
                :active="serverStore.activeArtServer?.id === server.id"
                :health-result="serverStore.healthResults[server.id]"
                @select="selectImageServer(server.id)"
                @edit="editServer(server.id)"
                @test="testServer(server.id)"
              />
            </div>
          </div>

          <!-- My image servers -->
          <div class="sm-section">
            <div class="sm-section-label">
              <Icon name="kind-icon:user" class="sm-section-icon" />
              My Servers
              <button
                type="button"
                class="sm-add-inline"
                @click="startNewServer('ART')"
              >
                <Icon name="kind-icon:plus" class="sm-add-icon" />
                New
              </button>
            </div>

            <div v-if="myImageServers.length" class="sm-card-list">
              <server-catalog-card
                v-for="server in myImageServers"
                :key="`my-img-${server.id}`"
                :server="server"
                :active="serverStore.activeArtServer?.id === server.id"
                :health-result="serverStore.healthResults[server.id]"
                owned
                @select="selectImageServer(server.id)"
                @edit="editServer(server.id)"
                @test="testServer(server.id)"
              />
            </div>
            <div v-else class="sm-empty-mine">
              <p>No personal image servers yet.</p>
              <div class="sm-empty-mine-actions">
                <button
                  type="button"
                  class="sm-btn sm-btn-secondary sm-btn-sm"
                  @click="startNewServer('COMFY')"
                >
                  ComfyUI
                </button>
                <button
                  type="button"
                  class="sm-btn sm-btn-secondary sm-btn-sm"
                  @click="startNewServer('A1111')"
                >
                  A1111
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── EDITOR PANEL ── -->
      <transition name="sm-slide">
        <aside v-if="showEditor" class="sm-editor">
          <!-- Clone notice banner -->
          <div v-if="isCloning" class="sm-clone-notice">
            <Icon name="kind-icon:copy" class="sm-clone-icon" />
            <div>
              <strong>Creating your copy</strong>
              <p>
                Changes here create a private version you control. The original
                is unchanged.
              </p>
            </div>
          </div>

          <div class="sm-editor-header">
            <div>
              <h2 class="sm-editor-title">
                {{
                  isCloning
                    ? 'Customize Server'
                    : serverStore.serverForm.id
                      ? 'Edit Server'
                      : 'Configure Server'
                }}
              </h2>
              <p class="sm-editor-subtitle">{{ editorSubtitle }}</p>
            </div>
            <button type="button" class="sm-icon-btn" @click="closeEditor">
              <Icon name="kind-icon:x" class="sm-icon" />
            </button>
          </div>

          <form class="sm-form" @submit.prevent="saveServer">
            <!-- Quick-edit: URL + Key at the top for fast configuration -->
            <div class="sm-quick-edit">
              <h3 class="sm-quick-label">Quick Setup</h3>

              <label class="sm-field">
                <span>Base URL</span>
                <input
                  v-model="serverStore.serverForm.baseUrl"
                  class="sm-input sm-input-mono"
                  placeholder="http://localhost:7860"
                />
              </label>

              <label class="sm-field">
                <span>Endpoint Path</span>
                <input
                  v-model="serverStore.serverForm.endpointPath"
                  class="sm-input sm-input-mono"
                  placeholder="/v1/chat/completions"
                />
              </label>

              <!-- Inline API key row -->
              <div class="sm-key-row">
                <label class="sm-field sm-field-grow">
                  <span>API Key</span>
                  <input
                    v-model="apiKey"
                    class="sm-input sm-input-mono"
                    type="password"
                    autocomplete="off"
                    placeholder="sk-… (leave blank to keep existing)"
                  />
                </label>
                <label class="sm-field sm-field-shrink">
                  <span>Key Label</span>
                  <input
                    v-model="apiKeyName"
                    class="sm-input"
                    placeholder="OpenAI, Groq…"
                  />
                </label>
              </div>

              <div class="sm-key-status-row">
                <span
                  class="sm-badge"
                  :class="
                    serverHasStoredKey ? 'sm-badge-success' : 'sm-badge-neutral'
                  "
                >
                  {{ serverHasStoredKey ? '🔑 Key stored' : 'No key stored' }}
                </span>
                <div class="sm-key-actions">
                  <button
                    type="button"
                    class="sm-btn sm-btn-secondary sm-btn-sm"
                    :disabled="!apiKey.trim() || serverStore.isSaving"
                    @click="saveApiKeyOnly"
                  >
                    Save Key Only
                  </button>
                  <button
                    type="button"
                    class="sm-btn sm-btn-ghost sm-btn-sm"
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
            </div>

            <!-- Server details (collapsible feel via separator) -->
            <details class="sm-details">
              <summary class="sm-details-summary">More Settings</summary>
              <div class="sm-form-grid">
                <label class="sm-field">
                  <span>Title</span>
                  <input
                    v-model="serverStore.serverForm.title"
                    class="sm-input"
                  />
                </label>

                <label class="sm-field">
                  <span>Label</span>
                  <input
                    v-model="serverStore.serverForm.label"
                    class="sm-input"
                  />
                </label>

                <label class="sm-field">
                  <span>Server Type</span>
                  <select
                    v-model="serverStore.serverForm.serverType"
                    class="sm-input"
                  >
                    <option value="ART">ART</option>
                    <option value="TEXT">TEXT</option>
                    <option value="COMFY">COMFY</option>
                    <option value="A1111">A1111</option>
                    <option value="OPENAI_COMPATIBLE">OPENAI_COMPATIBLE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </label>

                <label class="sm-field">
                  <span>Category</span>
                  <input
                    v-model="serverStore.serverForm.category"
                    class="sm-input"
                  />
                </label>

                <label class="sm-field">
                  <span>Health Path</span>
                  <input
                    v-model="serverStore.serverForm.healthPath"
                    class="sm-input sm-input-mono"
                    placeholder="/health"
                  />
                </label>

                <label class="sm-field sm-field-wide">
                  <span>Description</span>
                  <textarea
                    v-model="serverStore.serverForm.description"
                    class="sm-textarea"
                    rows="2"
                  />
                </label>
              </div>

              <div class="sm-toggle-grid">
                <label class="sm-toggle">
                  <input
                    v-model="serverStore.serverForm.supportsChat"
                    type="checkbox"
                  />
                  <span>Chat</span>
                </label>
                <label class="sm-toggle">
                  <input
                    v-model="serverStore.serverForm.supportsTxt2Img"
                    type="checkbox"
                  />
                  <span>Txt2Img</span>
                </label>
                <label class="sm-toggle">
                  <input
                    v-model="serverStore.serverForm.supportsImg2Img"
                    type="checkbox"
                  />
                  <span>Img2Img</span>
                </label>
                <label class="sm-toggle">
                  <input
                    v-model="serverStore.serverForm.supportsComfyWorkflow"
                    type="checkbox"
                  />
                  <span>Comfy Workflow</span>
                </label>
                <label class="sm-toggle">
                  <input
                    v-model="serverStore.serverForm.requiresApiKey"
                    type="checkbox"
                  />
                  <span>Requires API Key</span>
                </label>
                <label class="sm-toggle">
                  <input
                    v-model="serverStore.serverForm.isActive"
                    type="checkbox"
                  />
                  <span>Active</span>
                </label>
              </div>
            </details>

            <div class="sm-editor-actions">
              <button
                type="button"
                class="sm-btn sm-btn-secondary"
                @click="closeEditor"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="sm-btn sm-btn-primary"
                :disabled="serverStore.isSaving"
              >
                <Icon name="kind-icon:save" class="sm-btn-icon" />
                {{ isCloning ? 'Save My Copy' : 'Save Server' }}
              </button>
            </div>
          </form>
        </aside>
      </transition>
    </main>

    <!-- Loading overlay -->
    <transition name="sm-fade">
      <div
        v-if="serverStore.loading || serverStore.isSaving"
        class="sm-loading"
      >
        <span class="loading loading-spinner loading-lg" />
        <span>Negotiating with the server goblins…</span>
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
const sourcePublicServerId = ref<number | null>(null)

// ── Computed helpers ────────────────────────────────────────────────────────

const myUserId = computed(() => userStore.user?.id)

/** All image servers deduplicated */
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

/** Public / official text servers (not owned by current user) */
const publicTextServers = computed(() =>
  serverStore.textServers.filter(
    (s) => (s.isOfficial || s.isPublic) && s.userId !== myUserId.value,
  ),
)

/** User-owned text servers */
const myTextServers = computed(() =>
  serverStore.textServers.filter((s) => s.userId === myUserId.value),
)

/** Public / official image servers (not owned by current user) */
const publicImageServers = computed(() =>
  allImageServers.value.filter(
    (s) => (s.isOfficial || s.isPublic) && s.userId !== myUserId.value,
  ),
)

/** User-owned image servers */
const myImageServers = computed(() =>
  allImageServers.value.filter((s) => s.userId === myUserId.value),
)

const serverHasStoredKey = computed(() =>
  Boolean(serverStore.serverForm.apiKey),
)

/** True when the editor is operating on a public/official/unowned server (clone mode) */
const isCloning = computed(() => {
  const formId = serverStore.serverForm.id
  if (!formId) return false
  const server = serverStore.getServerById(formId)
  if (!server) return !!sourcePublicServerId.value
  return (
    server.userId !== myUserId.value || !!server.isPublic || !!server.isOfficial
  )
})

const editorSubtitle = computed(() => {
  if (isCloning.value) return 'Your edits will be saved as a private copy.'
  if (serverStore.serverForm.id) return 'Adjust this server configuration.'
  return `New ${serverStore.serverForm.serverType || activeCreateType.value} server setup.`
})

// ── Actions ─────────────────────────────────────────────────────────────────

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
  showEditor.value = true
}

async function ensurePrivateEditableServer(): Promise<number | null> {
  if (!userStore.isLoggedIn) return null

  if (serverStore.serverForm.id && !isCloning.value) {
    return serverStore.serverForm.id
  }

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

watch(
  () => serverStore.serverForm.apiKeyName,
  (value) => {
    if (!apiKeyName.value && value) apiKeyName.value = value
  },
)

function closeEditor() {
  sourcePublicServerId.value = null
  apiKey.value = ''
  apiKeyName.value = ''
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

onMounted(async () => {
  await serverStore.initialize()
})

// ── Sub-components ───────────────────────────────────────────────────────────

/**
 * ServerCatalogCard — used for both public catalog entries and owned servers.
 * Replaces the old ServerCard; adds `owned` prop to control action visibility.
 */
const ServerCatalogCard = defineComponent({
  name: 'ServerCatalogCard',
  emits: ['select', 'edit', 'test'],
  props: {
    server: { type: Object as () => Server, required: true },
    active: { type: Boolean, required: true },
    healthResult: { type: Object, required: false, default: null },
    owned: { type: Boolean, default: false },
  },
  setup(props, { emit }) {
    const statusBadgeClass = computed(() => {
      const s = props.server.lastStatus
      if (s === 'ONLINE') return 'sm-badge-success'
      if (s === 'OFFLINE') return 'sm-badge-danger'
      if (s === 'DEGRADED') return 'sm-badge-warning'
      return 'sm-badge-neutral'
    })

    const mainIcon = computed(() => {
      if (props.server.supportsChat) return 'kind-icon:chat'
      if (props.server.supportsComfyWorkflow) return 'kind-icon:workflow'
      return 'kind-icon:art'
    })

    return () =>
      h(
        'article',
        { class: ['sm-server-card', props.active ? 'active' : ''] },
        [
          // Top: icon + title/description + active badge
          h('div', { class: 'sm-server-main' }, [
            h('div', { class: 'sm-server-icon-wrap' }, [
              h(resolveComponent('Icon'), {
                name: mainIcon.value,
                class: 'sm-server-icon',
              }),
            ]),
            h('div', { class: 'sm-server-copy' }, [
              h('div', { class: 'sm-server-title-row' }, [
                h(
                  'h3',
                  { class: 'sm-server-title' },
                  props.server.label || props.server.title,
                ),
                props.active
                  ? h('span', { class: 'sm-badge sm-badge-primary' }, 'Active')
                  : null,
                props.server.isOfficial
                  ? h('span', { class: 'sm-badge sm-badge-info' }, 'Official')
                  : null,
              ]),
              h(
                'p',
                { class: 'sm-server-description' },
                props.server.description || props.server.baseUrl,
              ),
            ]),
          ]),

          // URL + endpoint meta
          h('div', { class: 'sm-server-meta' }, [
            h('span', { class: 'sm-meta-type' }, props.server.serverType),
            h('span', { class: 'sm-meta-url' }, props.server.baseUrl),
            props.server.endpointPath
              ? h('span', { class: 'sm-meta-path' }, props.server.endpointPath)
              : null,
          ]),

          // Capability badges + status
          h('div', { class: 'sm-server-badges' }, [
            props.server.supportsChat
              ? h('span', { class: 'sm-badge sm-badge-secondary' }, 'chat')
              : null,
            props.server.supportsTxt2Img
              ? h('span', { class: 'sm-badge sm-badge-accent' }, 'txt2img')
              : null,
            props.server.supportsImg2Img
              ? h('span', { class: 'sm-badge sm-badge-accent' }, 'img2img')
              : null,
            props.server.supportsComfyWorkflow
              ? h('span', { class: 'sm-badge sm-badge-warning' }, 'comfy')
              : null,
            props.server.requiresApiKey
              ? h('span', { class: 'sm-badge sm-badge-neutral' }, 'api key')
              : null,
            h(
              'span',
              { class: ['sm-badge', statusBadgeClass.value] },
              props.server.lastStatus || 'UNKNOWN',
            ),
          ]),

          // Health result line
          props.healthResult
            ? h('p', { class: 'sm-health-result' }, [
                props.healthResult.ok ? '✓ Healthy' : '✗ Failed',
                ` · ${props.healthResult.latencyMs}ms`,
              ])
            : null,

          // Actions
          h('div', { class: 'sm-server-actions' }, [
            h(
              'button',
              {
                type: 'button',
                class: 'sm-btn sm-btn-primary sm-btn-sm',
                disabled: props.active || !props.server.isActive,
                onClick: () => emit('select'),
              },
              props.active ? 'Selected' : 'Use',
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'sm-btn sm-btn-secondary sm-btn-sm',
                onClick: () => emit('test'),
              },
              'Test',
            ),
            // Owned servers: Edit directly. Public servers: Edit = customize/clone.
            h(
              'button',
              {
                type: 'button',
                class: 'sm-btn sm-btn-ghost sm-btn-sm',
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
/* ── Layout ─────────────────────────────────────────────────────────── */

.server-manager {
  display: flex;
  position: relative;
  min-height: 100%;
  width: 100%;
  flex-direction: column;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid oklch(var(--b3));
  background: oklch(var(--b2));
  color: oklch(var(--bc));
}

.sm-header {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid oklch(var(--b3));
  background: oklch(var(--b1));
  padding: 1rem;
}

.sm-header-brand {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.75rem;
}

.sm-logo {
  height: 2.5rem;
  width: 2.5rem;
  flex-shrink: 0;
  color: oklch(var(--p));
}

.sm-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.sm-subtitle {
  margin: 0.15rem 0 0;
  font-size: 0.85rem;
  opacity: 0.7;
}

.sm-header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Body layout: columns + optional editor */
.sm-body {
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  overflow: hidden;
  padding: 1rem;
}

/* When editor is open, shrink columns and show editor */
.sm-body:has(.sm-editor) {
  grid-template-columns: repeat(2, minmax(0, 1fr)) minmax(320px, 400px);
}

/* ── Columns ────────────────────────────────────────────────────────── */

.sm-column {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid oklch(var(--b3));
  background: oklch(var(--b1));
}

.sm-column-text {
  box-shadow: inset 0 0 0 1px
    color-mix(in oklch, oklch(var(--info)) 20%, transparent);
}

.sm-column-image {
  box-shadow: inset 0 0 0 1px
    color-mix(in oklch, oklch(var(--accent)) 20%, transparent);
}

.sm-column-header {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-bottom: 1px solid oklch(var(--b3));
  padding: 0.75rem;
}

.sm-column-heading {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.65rem;
}

.sm-column-icon {
  height: 1.75rem;
  width: 1.75rem;
  flex-shrink: 0;
  color: oklch(var(--p));
}

.sm-column-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
}

.sm-column-subtitle {
  margin: 0.1rem 0 0;
  font-size: 0.72rem;
  opacity: 0.6;
}

.sm-active-pill {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  border-radius: 0.85rem;
  border: 1px solid oklch(var(--b3));
  background: oklch(var(--b2));
  padding: 0.35rem 0.6rem;
}

.sm-active-label {
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  opacity: 0.5;
  text-transform: uppercase;
}

.sm-active-value {
  max-width: 14rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
  font-weight: 700;
}

/* Scrollable column body */
.sm-column-scroll {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  padding: 0.75rem;
}

/* ── Sections (Official / My Servers) ───────────────────────────────── */

.sm-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sm-section-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  opacity: 0.55;
  text-transform: uppercase;
  padding: 0.25rem 0;
  border-top: 1px solid oklch(var(--b3));
}

.sm-section-icon {
  height: 0.8rem;
  width: 0.8rem;
}

.sm-add-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  margin-left: auto;
  border-radius: 999px;
  border: 1px solid oklch(var(--b3));
  background: oklch(var(--b2));
  padding: 0.15rem 0.45rem;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0;
  color: oklch(var(--p));
  cursor: pointer;
  text-transform: none;
  transition: background 0.15s ease;
}

.sm-add-inline:hover {
  background: color-mix(in oklch, oklch(var(--p)) 15%, oklch(var(--b2)));
}

.sm-add-icon {
  height: 0.65rem;
  width: 0.65rem;
}

.sm-card-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.sm-empty-mine {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  border-radius: 0.85rem;
  border: 1px dashed oklch(var(--b3));
  padding: 1rem;
  text-align: center;
  font-size: 0.8rem;
  opacity: 0.7;
}

.sm-empty-mine p {
  margin: 0;
}

.sm-empty-mine-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem;
}

/* ── Default (Kind Robots) card ─────────────────────────────────────── */

.sm-default-card {
  display: flex;
  width: 100%;
  flex-shrink: 0;
  align-items: center;
  gap: 0.75rem;
  border-radius: 1rem;
  border: 1px solid oklch(var(--b3));
  background: oklch(var(--b2));
  padding: 0.75rem;
  text-align: left;
  color: inherit;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    transform 0.15s ease,
    background 0.15s ease;
}

.sm-default-card:hover,
.sm-default-card.active {
  border-color: oklch(var(--p));
  background: color-mix(in oklch, oklch(var(--p)) 10%, oklch(var(--b2)));
}

.sm-default-card:hover {
  transform: translateY(-1px);
}

.sm-default-icon-wrap {
  display: flex;
  height: 2.5rem;
  width: 2.5rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background: oklch(var(--b1));
}

.sm-default-icon {
  height: 1.5rem;
  width: 1.5rem;
  color: oklch(var(--p));
}

.sm-default-copy {
  min-width: 0;
  flex: 1;
}

.sm-default-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.sm-default-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 800;
}

.sm-default-description {
  margin: 0.1rem 0 0;
  font-size: 0.75rem;
  opacity: 0.65;
}

/* ── Server cards ───────────────────────────────────────────────────── */

.sm-server-card {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  border-radius: 1rem;
  border: 1px solid oklch(var(--b3));
  background: oklch(var(--b2));
  padding: 0.75rem;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    transform 0.15s ease;
}

.sm-server-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in oklch, oklch(var(--p)) 50%, oklch(var(--b3)));
}

.sm-server-card.active {
  border-color: oklch(var(--p));
  background: color-mix(in oklch, oklch(var(--p)) 9%, oklch(var(--b2)));
}

.sm-server-main {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}

.sm-server-icon-wrap {
  display: flex;
  height: 2.25rem;
  width: 2.25rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background: oklch(var(--b1));
}

.sm-server-icon {
  height: 1.25rem;
  width: 1.25rem;
  color: oklch(var(--p));
}

.sm-server-copy {
  min-width: 0;
  flex: 1;
}

.sm-server-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}

.sm-server-title {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9rem;
  font-weight: 800;
}

.sm-server-description {
  margin: 0.1rem 0 0;
  font-size: 0.73rem;
  line-height: 1.4;
  opacity: 0.65;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sm-server-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.75rem;
  border-radius: 0.65rem;
  background: oklch(var(--b1));
  padding: 0.4rem 0.55rem;
  font-family: ui-monospace, 'Cascadia Code', monospace;
  font-size: 0.67rem;
  opacity: 0.7;
}

.sm-meta-type {
  font-weight: 700;
  color: oklch(var(--p));
}

.sm-meta-url,
.sm-meta-path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sm-server-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.sm-health-result {
  margin: 0;
  font-size: 0.7rem;
  opacity: 0.65;
}

.sm-server-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

/* ── Editor panel ───────────────────────────────────────────────────── */

.sm-editor {
  display: flex;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid oklch(var(--b3));
  background: oklch(var(--b1));
}

/* Clone notice */
.sm-clone-notice {
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  gap: 0.65rem;
  background: color-mix(in oklch, oklch(var(--wa)) 18%, oklch(var(--b1)));
  border-bottom: 1px solid
    color-mix(in oklch, oklch(var(--wa)) 40%, transparent);
  padding: 0.75rem 1rem;
  font-size: 0.78rem;
  line-height: 1.4;
}

.sm-clone-icon {
  height: 1.25rem;
  width: 1.25rem;
  flex-shrink: 0;
  color: oklch(var(--wa));
  margin-top: 0.1rem;
}

.sm-clone-notice strong {
  display: block;
  font-size: 0.82rem;
  font-weight: 800;
}

.sm-clone-notice p {
  margin: 0.1rem 0 0;
  opacity: 0.75;
}

.sm-editor-header {
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid oklch(var(--b3));
  padding: 1rem;
}

.sm-editor-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
}

.sm-editor-subtitle {
  margin: 0.15rem 0 0;
  font-size: 0.75rem;
  opacity: 0.6;
}

.sm-form {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  padding: 1rem;
}

/* Quick-edit block */
.sm-quick-edit {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  border-radius: 0.85rem;
  border: 1px solid oklch(var(--b3));
  background: oklch(var(--b2));
  padding: 0.85rem;
}

.sm-quick-label {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  opacity: 0.5;
  text-transform: uppercase;
}

.sm-key-row {
  display: flex;
  gap: 0.65rem;
}

.sm-field-grow {
  flex: 1 1 0;
  min-width: 0;
}
.sm-field-shrink {
  flex: 0 0 9rem;
}

.sm-key-status-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.sm-key-actions {
  display: flex;
  gap: 0.4rem;
}

/* Collapsible more settings */
.sm-details {
  border-radius: 0.85rem;
  border: 1px solid oklch(var(--b3));
  overflow: hidden;
}

.sm-details-summary {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.65rem 0.85rem;
  font-size: 0.78rem;
  font-weight: 800;
  background: oklch(var(--b2));
  user-select: none;
  list-style: none;
}

.sm-details-summary::-webkit-details-marker {
  display: none;
}

.sm-details[open] .sm-details-summary {
  border-bottom: 1px solid oklch(var(--b3));
}

.sm-form-grid {
  display: grid;
  gap: 0.65rem;
  padding: 0.85rem;
}

.sm-toggle-grid {
  display: grid;
  gap: 0.4rem;
  padding: 0 0.85rem 0.85rem;
}

.sm-field {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  font-size: 0.72rem;
  font-weight: 800;
}

.sm-field-wide {
  grid-column: 1 / -1;
}

.sm-input,
.sm-textarea {
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid oklch(var(--b3));
  background: oklch(var(--b2));
  color: oklch(var(--bc));
  font: inherit;
  font-size: 0.82rem;
  outline: none;
}

.sm-input {
  min-height: 2.4rem;
  padding: 0 0.7rem;
}

.sm-input-mono {
  font-family: ui-monospace, 'Cascadia Code', monospace;
  font-size: 0.78rem;
}

.sm-textarea {
  resize: vertical;
  padding: 0.6rem 0.7rem;
}

.sm-input:focus,
.sm-textarea:focus {
  border-color: oklch(var(--p));
}

.sm-toggle {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  border-radius: 0.75rem;
  border: 1px solid oklch(var(--b3));
  background: oklch(var(--b2));
  padding: 0.5rem 0.65rem;
  font-size: 0.78rem;
  font-weight: 700;
}

.sm-editor-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-top: 0.25rem;
}

/* ── Buttons ────────────────────────────────────────────────────────── */

.sm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  border-radius: 0.85rem;
  border: 1px solid transparent;
  padding: 0.5rem 0.85rem;
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  transition:
    opacity 0.15s ease,
    transform 0.12s ease,
    background 0.15s ease,
    border-color 0.15s ease;
}

.sm-btn-sm {
  padding: 0.35rem 0.6rem;
  font-size: 0.72rem;
}

.sm-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}
.sm-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.sm-btn-primary {
  background: oklch(var(--p));
  color: oklch(var(--pc));
}

.sm-btn-secondary {
  border-color: oklch(var(--b3));
  background: oklch(var(--b2));
  color: oklch(var(--bc));
}

.sm-btn-ghost {
  background: transparent;
  color: oklch(var(--bc));
  opacity: 0.7;
}

.sm-btn-ghost:hover {
  background: oklch(var(--b1));
  opacity: 1;
}

.sm-btn-icon {
  height: 0.9rem;
  width: 0.9rem;
}

.sm-icon-btn {
  display: inline-flex;
  height: 2rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid oklch(var(--b3));
  background: oklch(var(--b2));
  color: inherit;
  cursor: pointer;
  flex-shrink: 0;
}

.sm-icon {
  height: 0.95rem;
  width: 0.95rem;
}

/* ── Badges ─────────────────────────────────────────────────────────── */

.sm-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.12rem 0.4rem;
  font-size: 0.62rem;
  font-weight: 800;
  line-height: 1;
}

.sm-badge-primary {
  background: oklch(var(--p));
  color: oklch(var(--pc));
}
.sm-badge-secondary {
  background: oklch(var(--s));
  color: oklch(var(--sc));
}
.sm-badge-accent {
  background: oklch(var(--a));
  color: oklch(var(--ac));
}
.sm-badge-info {
  background: oklch(var(--info));
  color: oklch(var(--b1));
}
.sm-badge-warning {
  background: oklch(var(--wa));
  color: oklch(var(--b1));
}
.sm-badge-success {
  background: oklch(var(--su));
  color: oklch(var(--b1));
}
.sm-badge-danger {
  background: oklch(var(--er));
  color: oklch(var(--b1));
}
.sm-badge-neutral {
  background: oklch(var(--b3));
  color: oklch(var(--bc));
}

/* ── Loading overlay ────────────────────────────────────────────────── */

.sm-loading {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: color-mix(in oklch, oklch(var(--b1)) 85%, transparent);
  font-size: 0.85rem;
  font-weight: 800;
}

/* ── Transitions ────────────────────────────────────────────────────── */

.sm-fade-enter-active,
.sm-fade-leave-active {
  transition: opacity 0.2s ease;
}
.sm-fade-enter-from,
.sm-fade-leave-to {
  opacity: 0;
}

.sm-slide-enter-active,
.sm-slide-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.sm-slide-enter-from,
.sm-slide-leave-to {
  opacity: 0;
  transform: translateX(12px);
}

/* ── Responsive ─────────────────────────────────────────────────────── */

@media (min-width: 768px) {
  .sm-form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .sm-toggle-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Collapse to single column on narrow screens */
@media (max-width: 900px) {
  .sm-body,
  .sm-body:has(.sm-editor) {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  .sm-column {
    max-height: 60vh;
  }
}

@media (max-width: 640px) {
  .sm-header {
    align-items: stretch;
  }
  .sm-header-brand,
  .sm-header-actions {
    width: 100%;
  }
  .sm-header-actions .sm-btn {
    flex: 1;
  }
  .sm-body {
    padding: 0.75rem;
    gap: 0.75rem;
  }
  .sm-key-row {
    flex-direction: column;
  }
  .sm-field-shrink {
    flex: 1;
  }
}
</style>
