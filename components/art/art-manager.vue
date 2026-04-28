<!-- /components/art/art-manager.vue -->
<template>
  <section class="w-full h-full">
    <div
      class="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4 sm:p-6"
    >
      <!-- Header -->
      <div
        class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-4"
      >
        <h1 class="text-2xl font-bold text-primary sm:text-3xl">
          🎨 Art Manager
        </h1>
        <p class="text-sm text-base-content/70 sm:text-base">
          Configure your art server, load a checkpoint, build a prompt, generate
          something weird.
        </p>
      </div>

      <!-- Server Panel -->
      <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <div class="mb-3 flex items-center justify-between gap-2">
          <div class="text-lg font-semibold text-primary">🖥️ Art Server</div>
          <div class="flex items-center gap-2">
            <!-- Auth status -->
            <div
              class="badge gap-1 text-xs"
              :class="isAutheliaReady ? 'badge-success' : 'badge-warning'"
            >
              <span
                class="inline-block h-1.5 w-1.5 rounded-full"
                :class="
                  isAutheliaReady ? 'bg-success-content' : 'bg-warning-content'
                "
              />
              {{ isAutheliaReady ? 'Authenticated' : 'Not logged in' }}
            </div>
            <button
              v-if="!isAutheliaReady"
              class="btn btn-xs btn-primary"
              @click="login"
            >
              Log in
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <!-- Server selector -->
          <select
            v-model="selectedServerId"
            class="select select-bordered w-full"
            @change="onServerChange"
          >
            <option :value="null" disabled>Select an art server…</option>
            <option
              v-for="opt in serverStore.artServerOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
              <template v-if="opt.isDefault"> (default)</template>
            </option>
          </select>

          <!-- Ping -->
          <button
            class="btn btn-outline btn-sm sm:btn-md"
            :class="
              pingStatus === 'ok'
                ? 'btn-success'
                : pingStatus === 'fail'
                  ? 'btn-error'
                  : ''
            "
            :disabled="!activeServer || pinging"
            @click="pingServer"
          >
            <span v-if="pinging" class="loading loading-spinner loading-xs" />
            <span v-else>
              {{
                pingStatus === 'ok'
                  ? '✓ Online'
                  : pingStatus === 'fail'
                    ? '✗ Offline'
                    : '⚡ Ping'
              }}
            </span>
          </button>

          <!-- Fetch checkpoint -->
          <button
            class="btn btn-outline btn-sm sm:btn-md"
            :disabled="!activeServer || !isAutheliaReady || fetchingCheckpoint"
            @click="fetchCurrentCheckpoint"
          >
            <span
              v-if="fetchingCheckpoint"
              class="loading loading-spinner loading-xs"
            />
            <span v-else>🔍 Current Model</span>
          </button>

          <!-- Health badge -->
          <div
            v-if="activeServer"
            class="flex items-center gap-1 rounded-xl border border-base-300 bg-base-200 px-3 py-2 text-xs"
          >
            <span
              class="inline-block h-2 w-2 rounded-full"
              :class="{
                'bg-success': activeServer.lastStatus === 'ONLINE',
                'bg-error': activeServer.lastStatus === 'OFFLINE',
                'bg-warning': activeServer.lastStatus === 'UNKNOWN',
              }"
            />
            {{ activeServer.lastStatus ?? 'UNKNOWN' }}
          </div>
        </div>

        <!-- Server info + checkpoint row -->
        <div
          v-if="activeServer"
          class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <div
            class="rounded-xl border border-base-300 bg-base-200 px-3 py-2 text-sm"
          >
            <span class="font-semibold text-base-content/60">URL: </span>
            <span class="font-mono text-xs">{{ activeServer.baseUrl }}</span>
          </div>
          <div
            class="rounded-xl border border-base-300 bg-base-200 px-3 py-2 text-sm"
          >
            <span class="font-semibold text-base-content/60">Type: </span>
            <span class="badge badge-sm">{{ activeServer.serverType }}</span>
          </div>
        </div>

        <!-- Checkpoint section -->
        <Transition name="fade-expand">
          <div
            v-if="activeServer && isAutheliaReady"
            class="mt-3 flex flex-col gap-2"
          >
            <div class="text-sm font-semibold text-base-content/70">
              🧠 Loaded Checkpoint
            </div>

            <div v-if="serverCheckpoint" class="flex items-center gap-2">
              <div
                class="flex-1 rounded-xl border border-base-300 bg-base-200 px-3 py-2 font-mono text-sm"
              >
                {{ serverCheckpoint }}
              </div>
              <button
                class="btn btn-sm btn-ghost"
                @click="serverCheckpoint = null"
              >
                Change
              </button>
            </div>

            <div v-else class="flex items-center gap-2">
              <select
                v-model="pendingCheckpoint"
                class="select select-bordered select-sm flex-1"
              >
                <option value="">— pick a checkpoint —</option>

                <option
                  v-for="cp in checkpointStore.visibleCheckpoints"
                  :key="cp.name"
                  :value="cp.name"
                >
                  {{ cp.name }}
                </option>
              </select>
              <button
                class="btn btn-sm btn-primary"
                :disabled="!pendingCheckpoint || applyingCheckpoint"
                @click="applyCheckpoint"
              >
                <span
                  v-if="applyingCheckpoint"
                  class="loading loading-spinner loading-xs"
                />
                <span v-else>Load</span>
              </button>
            </div>

            <div v-if="serverError" class="alert alert-error py-2 text-sm">
              {{ serverError }}
            </div>
          </div>
        </Transition>
      </div>

      <!-- Main grid: Model | Prompt | Gallery -->
      <div class="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-12">
        <div class="xl:col-span-3">
          <div
            class="h-full rounded-2xl border border-base-300 bg-base-100 p-4"
          >
            <div class="mb-3 text-lg font-semibold text-primary">🧠 Model</div>
            <checkpoint-gallery />
          </div>
        </div>

        <div class="xl:col-span-6">
          <div
            class="h-full rounded-2xl border border-base-300 bg-base-100 p-4"
          >
            <div class="mb-3 text-lg font-semibold text-primary">📝 Prompt</div>
            <art-randomizer />
          </div>
        </div>

        <div class="xl:col-span-3">
          <div
            class="h-full rounded-2xl border border-base-300 bg-base-100 p-4"
          >
            <div class="mb-3 text-lg font-semibold text-primary">
              🏛️ Gallery
            </div>
            <collection-gallery />
          </div>
        </div>
      </div>

      <!-- Generate bar -->
      <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div class="flex-1">
            <label class="mb-1 block text-sm font-semibold text-base-content/70"
              >Prompt</label
            >
            <textarea
              v-model="promptStore.promptField"
              class="textarea textarea-bordered w-full resize-none"
              rows="2"
              placeholder="Enter your creative prompt…"
              :disabled="isGenerating"
            />
          </div>

          <div class="flex flex-col gap-2 sm:w-48">
            <!-- Server override toggle -->
            <label
              class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-200 px-3 py-1.5"
            >
              <span class="label-text text-xs font-semibold"
                >Use selected server</span
              >
              <input
                v-model="useSelectedServer"
                type="checkbox"
                class="toggle toggle-primary toggle-sm"
              />
            </label>

            <button
              class="btn w-full font-semibold text-white"
              :class="
                isGenerating ? 'bg-secondary' : 'bg-primary hover:bg-primary/90'
              "
              :disabled="isGenerating || !promptStore.promptField.trim()"
              @click="generateArt"
            >
              <span
                v-if="isGenerating"
                class="loading loading-spinner loading-sm"
              />
              {{ isGenerating ? 'Working…' : '🖌️ Create Art' }}
            </button>
          </div>
        </div>

        <!-- Last result -->
        <Transition name="fade-expand">
          <div v-if="lastResult" class="mt-3">
            <div
              class="rounded-xl border px-3 py-2 text-sm"
              :class="
                lastResult.success
                  ? 'border-success/30 bg-success/10 text-success'
                  : 'border-error/30 bg-error/10 text-error'
              "
            >
              {{ lastResult.message }}
            </div>
          </div>
        </Transition>
      </div>

      <!-- Art display -->
      <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <art-display />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'

const { loggedIn, login } = useOidcAuth()
const isAutheliaReady = computed(() => loggedIn.value)

const serverStore = useServerStore()
const artStore = useArtStore()
const promptStore = usePromptStore()
const checkpointStore = useCheckpointStore()
const errorStore = useErrorStore()

// ── Server selection ──────────────────────────────────────────────────────────

const selectedServerId = ref<number | null>(
  serverStore.activeArtServer?.id ?? null,
)

const activeServer = computed(() =>
  selectedServerId.value !== null
    ? serverStore.getServerById(selectedServerId.value)
    : serverStore.activeArtServer,
)

async function onServerChange() {
  if (selectedServerId.value !== null) {
    await serverStore.setActiveArtServer(selectedServerId.value)
  }
  serverCheckpoint.value = null
  pendingCheckpoint.value = ''
  serverError.value = ''
  pingStatus.value = 'idle'
}

watch(
  () => serverStore.activeArtServer?.id,
  (id) => {
    if (id !== undefined) selectedServerId.value = id
  },
)

// ── Ping / health ─────────────────────────────────────────────────────────────

const pinging = ref(false)
const pingStatus = ref<'idle' | 'ok' | 'fail'>('idle')

async function pingServer() {
  if (!activeServer.value) return
  pinging.value = true
  pingStatus.value = 'idle'
  const result = await serverStore.testServerHealth(activeServer.value.id)
  pingStatus.value = result.success && result.data?.ok ? 'ok' : 'fail'
  pinging.value = false
}

// ── Checkpoint helpers ────────────────────────────────────────────────────────

const serverCheckpoint = ref<string | null>(null)
const pendingCheckpoint = ref('')
const fetchingCheckpoint = ref(false)
const applyingCheckpoint = ref(false)
const serverError = ref('')

/**
 * ComfyUI: GET /history returns:
 * { [prompt_id]: { prompt: [num, id, {NODE_ID: {class_type, inputs}}, ...], outputs: {...}, status: {...} } }
 * We walk the most recent entry's prompt nodes looking for CheckpointLoaderSimple.
 */
function parseComfyCheckpointFromHistory(
  history: Record<string, unknown>,
): string | null {
  const entries = Object.values(history) as Array<{
    prompt?: [
      number,
      string,
      Record<string, { class_type: string; inputs: Record<string, unknown> }>,
    ]
    status?: { completed: boolean }
  }>

  if (!entries.length) return null

  // Most recent completed entry
  const completed = entries.filter((e) => e.status?.completed)
  const latest = completed.at(-1) ?? entries.at(-1)
  if (!latest?.prompt?.[2]) return null

  const nodes = latest.prompt[2]

  for (const node of Object.values(nodes)) {
    if (
      node.class_type === 'CheckpointLoaderSimple' ||
      node.class_type === 'CheckpointLoader'
    ) {
      const ckpt = node.inputs?.ckpt_name ?? node.inputs?.config_name
      if (typeof ckpt === 'string') return ckpt
    }
  }

  return null
}

async function fetchCurrentCheckpoint() {
  if (!activeServer.value) return
  fetchingCheckpoint.value = true
  serverError.value = ''

  try {
    const server = activeServer.value
    const isComfy =
      server.serverType === 'COMFY' || Boolean(server.supportsComfyWorkflow)
    const path = isComfy ? '/history' : '/sdapi/v1/options'

    const res = await serverStore.autheliaFetch(server, path)

    if (!res.ok) {
      serverError.value = `Server returned ${res.status}: ${res.statusText}`
      return
    }

    const data = await res.json()
    let found: string | null = null

    if (isComfy) {
      found = parseComfyCheckpointFromHistory(data as Record<string, unknown>)
    } else {
      // A1111 / A111-compatible
      found =
        ((data as Record<string, unknown>)?.sd_model_checkpoint as string) ??
        null
    }

    if (!found) {
      serverError.value =
        'Could not determine loaded checkpoint from server response.'
      return
    }

    serverCheckpoint.value = found

    // Sync to checkpointStore if it's a known checkpoint
    if (checkpointStore.isValidCheckpoint(found)) {
      checkpointStore.selectCheckpointByName(found)
      checkpointStore.currentApiModel = found
    }
  } catch (err) {
    serverError.value =
      err instanceof Error ? err.message : 'Failed to reach server'
  } finally {
    fetchingCheckpoint.value = false
  }
}

async function applyCheckpoint() {
  if (!activeServer.value || !pendingCheckpoint.value) return
  applyingCheckpoint.value = true
  serverError.value = ''

  try {
    const server = activeServer.value
    const name = pendingCheckpoint.value
    const isComfy =
      server.serverType === 'COMFY' || Boolean(server.supportsComfyWorkflow)

    if (isComfy) {
      // ComfyUI has no REST endpoint to swap checkpoints mid-session —
      // the checkpoint is part of the workflow payload. We set it in the
      // store so generateArt() picks it up when building the workflow.
      checkpointStore.selectCheckpointByName(name)
      checkpointStore.currentApiModel = name
      serverCheckpoint.value = name
    } else {
      // A1111: POST /sdapi/v1/options triggers a model reload server-side
      const res = await serverStore.autheliaFetch(server, '/sdapi/v1/options', {
        method: 'POST',
        body: JSON.stringify({ sd_model_checkpoint: name }),
      })

      if (!res.ok) {
        serverError.value = `Failed to apply checkpoint: ${res.status} ${res.statusText}`
        return
      }

      // A1111 returns 200 with empty body on success — no need to parse
      checkpointStore.selectCheckpointByName(name)
      checkpointStore.currentApiModel = name
      serverCheckpoint.value = name
    }

    pendingCheckpoint.value = ''
  } catch (err) {
    serverError.value =
      err instanceof Error ? err.message : 'Failed to apply checkpoint'
  } finally {
    applyingCheckpoint.value = false
  }
}

// ── Art generation ────────────────────────────────────────────────────────────

const isGenerating = ref(false)
const useSelectedServer = ref(true)
const lastResult = ref<{ success: boolean; message: string } | null>(null)

async function generateArt() {
  isGenerating.value = true
  lastResult.value = null

  const overrides =
    useSelectedServer.value && activeServer.value
      ? {
          serverId: activeServer.value.id,
          serverName: activeServer.value.title,
          // Pass the confirmed server checkpoint if we know it,
          // otherwise fall through to checkpointStore.selectedCheckpoint
          checkpoint:
            serverCheckpoint.value ??
            checkpointStore.selectedCheckpoint?.name ??
            undefined,
        }
      : {}

  const result = await artStore.generateArt({
    promptString: promptStore.promptField,
    ...overrides,
  } as Parameters<typeof artStore.generateArt>[0])

  lastResult.value = {
    success: result.success,
    message:
      result.message ??
      (result.success ? 'Art generated!' : 'Generation failed.'),
  }

  if (!result.success) {
    errorStore.addError(ErrorType.GENERAL_ERROR, result.message)
  }

  isGenerating.value = false
}

// ── Init ──────────────────────────────────────────────────────────────────────

onMounted(async () => {
  if (!serverStore.isInitialized) await serverStore.initialize()
  checkpointStore.initialize()

  if (!selectedServerId.value && serverStore.activeArtServer) {
    selectedServerId.value = serverStore.activeArtServer.id
  }
})
</script>

<style scoped>
.fade-expand-enter-active,
.fade-expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.fade-expand-enter-from,
.fade-expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.fade-expand-enter-to,
.fade-expand-leave-from {
  opacity: 1;
  max-height: 24rem;
}
</style>
