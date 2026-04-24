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
      <section class="sm-grid">
        <div class="sm-column sm-column-text">
          <server-column-header
            title="Text Servers"
            subtitle="Chat, bots, prompts, language models"
            icon="kind-icon:chat"
            :active-title="
              serverStore.activeTextServer?.title || 'Kind Robots Default'
            "
          />

          <kind-default-card
            label="Kind Robots Default Text"
            description="Use whichever text server Kind Robots currently recommends."
            :active="!serverStore.activeTextServerId"
            @select="selectKindDefault('text')"
          />

          <configured-empty
            v-if="!ownedTextServers.length"
            mode="text"
            @configure="startNewServer('TEXT')"
            @configure-openai="startNewServer('OPENAI_COMPATIBLE')"
          />

          <div class="sm-card-list">
            <server-card
              v-for="server in serverStore.textServers"
              :key="`text-${server.id}`"
              :server="server"
              :active="serverStore.activeTextServer?.id === server.id"
              :health-result="serverStore.healthResults[server.id]"
              @select="selectTextServer(server.id)"
              @edit="editServer(server.id)"
              @test="testServer(server.id)"
            />
          </div>
        </div>

        <div class="sm-column sm-column-image">
          <server-column-header
            title="Image Servers"
            subtitle="Art, ComfyUI, Stable Diffusion, image pipelines"
            icon="kind-icon:art"
            :active-title="
              serverStore.activeArtServer?.title || 'Kind Robots Default'
            "
          />

          <kind-default-card
            label="Kind Robots Default Image"
            description="Use whichever image server Kind Robots currently recommends."
            :active="!serverStore.activeArtServerId"
            @select="selectKindDefault('image')"
          />

          <configured-empty
            v-if="!ownedImageServers.length"
            mode="image"
            @configure="startNewServer('ART')"
            @configure-comfy="startNewServer('COMFY')"
            @configure-a1111="startNewServer('A1111')"
          />

          <div class="sm-card-list">
            <server-card
              v-for="server in imageServers"
              :key="`image-${server.id}`"
              :server="server"
              :active="serverStore.activeArtServer?.id === server.id"
              :health-result="serverStore.healthResults[server.id]"
              @select="selectImageServer(server.id)"
              @edit="editServer(server.id)"
              @test="testServer(server.id)"
            />
          </div>
        </div>
      </section>

      <aside v-if="showEditor" class="sm-editor">
        <div class="sm-editor-header">
          <div>
            <h2 class="sm-editor-title">
              {{
                serverStore.serverForm.id ? 'Edit Server' : 'Configure Server'
              }}
            </h2>
            <p class="sm-editor-subtitle">
              {{ editorSubtitle }}
            </p>
          </div>

          <button type="button" class="sm-icon-btn" @click="closeEditor">
            <Icon name="kind-icon:x" class="sm-icon" />
          </button>
        </div>

        <form class="sm-form" @submit.prevent="saveServer">
          <div class="sm-form-grid">
            <label class="sm-field">
              <span>Title</span>
              <input v-model="serverStore.serverForm.title" class="sm-input" />
            </label>

            <label class="sm-field">
              <span>Label</span>
              <input v-model="serverStore.serverForm.label" class="sm-input" />
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

            <label class="sm-field sm-field-wide">
              <span>Base URL</span>
              <input
                v-model="serverStore.serverForm.baseUrl"
                class="sm-input"
              />
            </label>

            <label class="sm-field">
              <span>Endpoint Path</span>
              <input
                v-model="serverStore.serverForm.endpointPath"
                class="sm-input"
              />
            </label>

            <label class="sm-field">
              <span>Health Path</span>
              <input
                v-model="serverStore.serverForm.healthPath"
                class="sm-input"
              />
            </label>

            <label class="sm-field sm-field-wide">
              <span>Description</span>
              <textarea
                v-model="serverStore.serverForm.description"
                class="sm-textarea"
                rows="3"
              />
            </label>
          </div>

          <div class="sm-secret-panel sm-field-wide">
            <div class="sm-secret-header">
              <div>
                <h3 class="sm-secret-title">API Key</h3>
                <p class="sm-secret-subtitle">
                  {{ apiKeyHelpText }}
                </p>
              </div>

              <span
                class="sm-badge"
                :class="
                  serverHasStoredKey ? 'sm-badge-success' : 'sm-badge-neutral'
                "
              >
                {{ serverHasStoredKey ? 'Key configured' : 'No key stored' }}
              </span>
            </div>

            <label class="sm-field">
              <span>Key Label</span>
              <input
                v-model="apiKeyName"
                class="sm-input"
                placeholder="OpenAI, Stability, Groq..."
              />
            </label>

            <label class="sm-field">
              <span>API Key</span>
              <input
                v-model="apiKey"
                class="sm-input"
                type="password"
                autocomplete="off"
                placeholder="Leave blank unless adding or replacing the key"
              />
            </label>

            <div class="sm-secret-actions">
              <button
                type="button"
                class="sm-btn sm-btn-secondary"
                :disabled="!apiKey.trim() || serverStore.isSaving"
                @click="saveApiKeyOnly"
              >
                Save Key
              </button>

              <button
                type="button"
                class="sm-btn sm-btn-ghost"
                :disabled="!serverStore.serverForm.id || serverStore.isSaving"
                @click="clearApiKey"
              >
                Clear Key
              </button>
            </div>
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
              Save Server
            </button>
          </div>
        </form>
      </aside>
    </main>

    <transition name="sm-fade">
      <div
        v-if="serverStore.loading || serverStore.isSaving"
        class="sm-loading"
      >
        <span class="loading loading-spinner loading-lg" />
        <span>Negotiating with the server goblins...</span>
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

const serverHasStoredKey = computed(() => {
  return Boolean(serverStore.serverForm.apiKey)
})

const editingPublicOrSharedServer = computed(() => {
  const formId = serverStore.serverForm.id
  if (!formId) return false

  const server = serverStore.getServerById(formId)
  if (!server) return false

  const isOwner = server.userId === userStore.user?.id
  return !isOwner || Boolean(server.isPublic) || Boolean(server.isOfficial)
})

const apiKeyHelpText = computed(() => {
  if (editingPublicOrSharedServer.value) {
    return 'Saving a key for this shared server will create your own private copy.'
  }

  return 'Keys are saved to your private server entry and are never shown again.'
})

const imageServers = computed(() => {
  const ids = new Set<number>()

  return [...serverStore.artServers, ...serverStore.comfyServers].filter(
    (server) => {
      if (ids.has(server.id)) return false
      ids.add(server.id)
      return true
    },
  )
})

const ownedTextServers = computed(() =>
  serverStore.textServers.filter(
    (server) => server.userId === userStore.user?.id,
  ),
)

const ownedImageServers = computed(() =>
  imageServers.value.filter((server) => server.userId === userStore.user?.id),
)

const editorSubtitle = computed(() => {
  if (serverStore.serverForm.id) {
    return 'Adjust this server configuration.'
  }

  return `New ${serverStore.serverForm.serverType || activeCreateType.value} server setup.`
})

async function refreshServers() {
  await serverStore.fetchAllServers(true)
}

function selectKindDefault(mode: ServerMode) {
  if (mode === 'text') {
    serverStore.setActiveTextServer(null)
    return
  }

  serverStore.setActiveArtServer(null)
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

  const isOwner = server.userId === userStore.user?.id
  const shouldClone =
    !isOwner || Boolean(server.isPublic) || Boolean(server.isOfficial)

  if (shouldClone) {
    sourcePublicServerId.value = id
    serverStore.serverForm = {
      ...server,
      id: undefined,
      userId: userStore.user?.id ?? 10,
      title: `${server.title} Custom`,
      label: server.label ? `${server.label} Custom` : 'Custom Server',
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
  if (!userStore.isLoggedIn) {
    return null
  }

  if (serverStore.serverForm.id && !editingPublicOrSharedServer.value) {
    return serverStore.serverForm.id
  }

  const payload = {
    ...serverStore.serverForm,
    id: undefined,
    userId: userStore.user?.id ?? 10,
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

  if (!result.success || !result.data) {
    return null
  }

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
  if (!serverStore.serverForm.id || editingPublicOrSharedServer.value) return

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
    if (!apiKeyName.value && value) {
      apiKeyName.value = value
    }
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

const ServerColumnHeader = defineComponent({
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    icon: { type: String, required: true },
    activeTitle: { type: String, required: true },
  },
  setup(props) {
    return () =>
      h('header', { class: 'sm-column-header' }, [
        h('div', { class: 'sm-column-heading' }, [
          h(resolveComponent('Icon'), {
            name: props.icon,
            class: 'sm-column-icon',
          }),
          h('div', [
            h('h2', { class: 'sm-column-title' }, props.title),
            h('p', { class: 'sm-column-subtitle' }, props.subtitle),
          ]),
        ]),
        h('div', { class: 'sm-active-pill' }, [
          h('span', { class: 'sm-active-label' }, 'Active'),
          h('span', { class: 'sm-active-value' }, props.activeTitle),
        ]),
      ])
  },
})

const KindDefaultCard = defineComponent({
  emits: ['select'],
  props: {
    label: { type: String, required: true },
    description: { type: String, required: true },
    active: { type: Boolean, required: true },
  },
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          type: 'button',
          class: ['sm-default-card', props.active ? 'active' : ''],
          onClick: () => emit('select'),
        },
        [
          h('div', { class: 'sm-default-icon-wrap' }, [
            h(resolveComponent('Icon'), {
              name: 'kind-icon:robot',
              class: 'sm-default-icon',
            }),
          ]),
          h('div', { class: 'sm-default-copy' }, [
            h('div', { class: 'sm-default-title-row' }, [
              h('h3', { class: 'sm-default-title' }, props.label),
              props.active
                ? h('span', { class: 'sm-badge sm-badge-primary' }, 'Selected')
                : null,
            ]),
            h('p', { class: 'sm-default-description' }, props.description),
          ]),
        ],
      )
  },
})

const ConfiguredEmpty = defineComponent({
  emits: ['configure', 'configureOpenai', 'configureComfy', 'configureA1111'],
  props: {
    mode: { type: String, required: true },
  },
  setup(props, { emit }) {
    const isText = computed(() => props.mode === 'text')

    return () =>
      h('aside', { class: 'sm-empty-config' }, [
        h('div', { class: 'sm-empty-icon-wrap' }, [
          h(resolveComponent('Icon'), {
            name: isText.value ? 'kind-icon:chat' : 'kind-icon:art',
            class: 'sm-empty-icon',
          }),
        ]),
        h(
          'h3',
          { class: 'sm-empty-title' },
          isText.value
            ? 'No personal text server configured'
            : 'No personal image server configured',
        ),
        h(
          'p',
          { class: 'sm-empty-description' },
          isText.value
            ? 'Use Kind Robots Default, or configure your own text endpoint.'
            : 'Use Kind Robots Default, or configure your own image pipeline.',
        ),
        h('div', { class: 'sm-empty-actions' }, [
          h(
            'button',
            {
              type: 'button',
              class: 'sm-btn sm-btn-primary',
              onClick: () => emit('configure'),
            },
            isText.value ? 'Configure Text Server' : 'Configure Art Server',
          ),
          isText.value
            ? h(
                'button',
                {
                  type: 'button',
                  class: 'sm-btn sm-btn-secondary',
                  onClick: () => emit('configureOpenai'),
                },
                'OpenAI Compatible',
              )
            : h(
                'button',
                {
                  type: 'button',
                  class: 'sm-btn sm-btn-secondary',
                  onClick: () => emit('configureComfy'),
                },
                'ComfyUI',
              ),
          !isText.value
            ? h(
                'button',
                {
                  type: 'button',
                  class: 'sm-btn sm-btn-secondary',
                  onClick: () => emit('configureA1111'),
                },
                'A1111',
              )
            : null,
        ]),
      ])
  },
})

const ServerCard = defineComponent({
  emits: ['select', 'edit', 'test'],
  props: {
    server: { type: Object as () => Server, required: true },
    active: { type: Boolean, required: true },
    healthResult: { type: Object, required: false, default: null },
  },
  setup(props, { emit }) {
    const badgeClass = computed(() => {
      if (props.server.lastStatus === 'ONLINE') return 'sm-badge-success'
      if (props.server.lastStatus === 'OFFLINE') return 'sm-badge-danger'
      if (props.server.lastStatus === 'DEGRADED') return 'sm-badge-warning'
      return 'sm-badge-neutral'
    })

    return () =>
      h(
        'article',
        { class: ['sm-server-card', props.active ? 'active' : ''] },
        [
          h('div', { class: 'sm-server-main' }, [
            h('div', { class: 'sm-server-icon-wrap' }, [
              h(resolveComponent('Icon'), {
                name: props.server.supportsChat
                  ? 'kind-icon:chat'
                  : props.server.supportsComfyWorkflow
                    ? 'kind-icon:workflow'
                    : 'kind-icon:art',
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

          h('div', { class: 'sm-server-meta' }, [
            h('span', props.server.serverType),
            h('span', props.server.baseUrl),
            h('span', props.server.endpointPath || 'No endpoint'),
          ]),

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
              { class: ['sm-badge', badgeClass.value] },
              props.server.lastStatus || 'UNKNOWN',
            ),
          ]),

          props.healthResult
            ? h('p', { class: 'sm-health-result' }, [
                props.healthResult.ok ? 'Healthy' : 'Health check failed',
                ` · ${props.healthResult.latencyMs}ms`,
              ])
            : null,

          h('div', { class: 'sm-server-actions' }, [
            h(
              'button',
              {
                type: 'button',
                class: 'sm-btn sm-btn-primary',
                disabled: props.active || !props.server.isActive,
                onClick: () => emit('select'),
              },
              props.active ? 'Selected' : 'Use Server',
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'sm-btn sm-btn-secondary',
                onClick: () => emit('test'),
              },
              'Test',
            ),
            props.server.isEditable
              ? h(
                  'button',
                  {
                    type: 'button',
                    class: 'sm-btn sm-btn-ghost',
                    onClick: () => emit('edit'),
                  },
                  'Edit',
                )
              : null,
          ]),
        ],
      )
  },
})
</script>

<style scoped>
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

.sm-body {
  display: grid;
  min-height: 0;
  flex: 1;
  gap: 1rem;
  overflow: hidden;
  padding: 1rem;
}

.sm-grid {
  display: grid;
  min-height: 0;
  gap: 1rem;
  overflow: hidden;
}

.sm-column {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 0.75rem;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid oklch(var(--b3));
  background: oklch(var(--b1));
  padding: 0.75rem;
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
  justify-content: space-between;
  gap: 0.75rem;
  border-bottom: 1px solid oklch(var(--b3));
  padding: 0.25rem 0.25rem 0.75rem;
}

.sm-column-heading {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.65rem;
}

.sm-column-icon {
  height: 2rem;
  width: 2rem;
  flex-shrink: 0;
  color: oklch(var(--p));
}

.sm-column-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
}

.sm-column-subtitle {
  margin: 0.1rem 0 0;
  font-size: 0.75rem;
  opacity: 0.65;
}

.sm-active-pill {
  display: flex;
  max-width: 100%;
  flex-direction: column;
  gap: 0.1rem;
  border-radius: 1rem;
  border: 1px solid oklch(var(--b3));
  background: oklch(var(--b2));
  padding: 0.45rem 0.7rem;
}

.sm-active-label {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  opacity: 0.55;
  text-transform: uppercase;
}

.sm-active-value {
  max-width: 16rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8rem;
  font-weight: 700;
}

.sm-card-list {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.sm-default-card,
.sm-server-card,
.sm-empty-config {
  border-radius: 1rem;
  border: 1px solid oklch(var(--b3));
  background: oklch(var(--b2));
}

.sm-default-card {
  display: flex;
  width: 100%;
  flex-shrink: 0;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem;
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

.sm-default-icon-wrap,
.sm-server-icon-wrap,
.sm-empty-icon-wrap {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: oklch(var(--b1));
}

.sm-default-icon-wrap {
  height: 3rem;
  width: 3rem;
}

.sm-server-icon-wrap {
  height: 2.65rem;
  width: 2.65rem;
}

.sm-empty-icon-wrap {
  height: 3.5rem;
  width: 3.5rem;
  margin: 0 auto;
}

.sm-default-icon,
.sm-empty-icon {
  height: 1.75rem;
  width: 1.75rem;
  color: oklch(var(--p));
}

.sm-server-icon {
  height: 1.4rem;
  width: 1.4rem;
  color: oklch(var(--p));
}

.sm-default-copy,
.sm-server-copy {
  min-width: 0;
  flex: 1;
}

.sm-default-title-row,
.sm-server-title-row {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.sm-default-title,
.sm-server-title {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 800;
}

.sm-default-title {
  font-size: 0.95rem;
}

.sm-server-title {
  font-size: 1rem;
}

.sm-default-description,
.sm-server-description {
  margin: 0.15rem 0 0;
  font-size: 0.78rem;
  line-height: 1.4;
  opacity: 0.65;
}

.sm-empty-config {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  text-align: center;
}

.sm-empty-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
}

.sm-empty-description {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.5;
  opacity: 0.7;
}

.sm-empty-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.sm-server-card {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 0.85rem;
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
  gap: 0.65rem;
}

.sm-server-meta {
  display: grid;
  gap: 0.35rem;
  border-radius: 0.75rem;
  background: oklch(var(--b1));
  padding: 0.55rem;
  font-size: 0.7rem;
  opacity: 0.75;
}

.sm-server-meta span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sm-server-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.sm-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.15rem 0.45rem;
  font-size: 0.65rem;
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

.sm-health-result {
  margin: 0;
  font-size: 0.72rem;
  opacity: 0.7;
}

.sm-server-actions,
.sm-editor-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.sm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  border-radius: 0.9rem;
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
  height: 1rem;
  width: 1rem;
}

.sm-icon-btn {
  display: inline-flex;
  height: 2.25rem;
  width: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid oklch(var(--b3));
  background: oklch(var(--b2));
  color: inherit;
  cursor: pointer;
}

.sm-icon {
  height: 1rem;
  width: 1rem;
}

.sm-editor {
  display: flex;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid oklch(var(--b3));
  background: oklch(var(--b1));
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
  font-size: 1.1rem;
  font-weight: 800;
}

.sm-editor-subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  opacity: 0.65;
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

.sm-form-grid {
  display: grid;
  gap: 0.75rem;
}

.sm-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 800;
}

.sm-field-wide {
  grid-column: 1 / -1;
}

.sm-input,
.sm-textarea {
  width: 100%;
  border-radius: 0.85rem;
  border: 1px solid oklch(var(--b3));
  background: oklch(var(--b2));
  color: oklch(var(--bc));
  font: inherit;
  font-size: 0.85rem;
  outline: none;
}

.sm-input {
  min-height: 2.5rem;
  padding: 0 0.75rem;
}

.sm-textarea {
  resize: vertical;
  padding: 0.65rem 0.75rem;
}

.sm-input:focus,
.sm-textarea:focus {
  border-color: oklch(var(--p));
}

.sm-toggle-grid {
  display: grid;
  gap: 0.5rem;
}

.sm-toggle {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  border-radius: 0.85rem;
  border: 1px solid oklch(var(--b3));
  background: oklch(var(--b2));
  padding: 0.55rem 0.65rem;
  font-size: 0.8rem;
  font-weight: 700;
}

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

.sm-fade-enter-active,
.sm-fade-leave-active {
  transition: opacity 0.2s ease;
}

.sm-fade-enter-from,
.sm-fade-leave-to {
  opacity: 0;
}

@media (min-width: 768px) {
  .sm-form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sm-toggle-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .sm-body {
    grid-template-columns: minmax(0, 1fr);
  }

  .sm-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sm-body:has(.sm-editor) {
    grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
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
  }
}

.sm-secret-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-radius: 1rem;
  border: 1px solid oklch(var(--b3));
  background: color-mix(in oklch, oklch(var(--b2)) 80%, oklch(var(--p)) 6%);
  padding: 0.85rem;
}

.sm-secret-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.sm-secret-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 900;
}

.sm-secret-subtitle {
  margin: 0.15rem 0 0;
  font-size: 0.75rem;
  line-height: 1.4;
  opacity: 0.7;
}

.sm-secret-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style>
