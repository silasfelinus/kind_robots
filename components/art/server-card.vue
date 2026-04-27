<!-- /components/server/server-card.vue -->
<!--
  Server card with collapsible quick-edit drawer.

  Props
    server         Server          the record to display
    active         boolean         is this the current default for its mode?
    expanded       boolean         is the quick-edit drawer open? (parent-controlled)
    healthResult   optional        latest health result, if any
    owned          boolean         true for "My Servers" rendering

  Emits
    select               user clicked Use → set as active
    edit                 user clicked Edit/Customize → open the wide editor panel
    test                 user clicked Test → run health check
    update:expanded      drawer toggle requested (parent decides which card stays open)
    saved                a save just succeeded — gallery may want to react
-->
<template>
  <article
    :class="[
      'flex flex-col gap-2 rounded-xl border p-3 transition-all duration-200',
      saveFlash
        ? 'border-success bg-success/10'
        : active
          ? 'border-primary bg-primary/8'
          : 'border-base-300 bg-base-200 hover:-translate-y-px hover:border-primary/30',
    ]"
  >
    <!-- ── Title row ────────────────────────────────────────────────────── -->
    <div class="flex items-start gap-2.5">
      <div
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-base-100"
      >
        <Icon :name="mainIcon" class="h-4 w-4 text-primary" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-1">
          <span
            :class="[
              'inline-block h-2 w-2 shrink-0 rounded-full',
              statusDotClass,
            ]"
          />
          <span
            class="truncate text-sm font-black"
            :title="server.label || server.title"
          >
            {{ server.label || server.title }}
          </span>
          <span v-if="active" class="badge badge-primary badge-xs">Active</span>
          <span v-if="server.isOfficial" class="badge badge-info badge-xs"
            >Official</span
          >
          <span
            v-if="hasStoredKey"
            class="badge badge-success badge-xs gap-0.5"
            title="API key stored"
          >
            <Icon name="kind-icon:key" class="h-2.5 w-2.5" />
            Key
          </span>
          <span v-if="saveFlash" class="badge badge-success badge-xs gap-0.5">
            <Icon name="kind-icon:check" class="h-2.5 w-2.5" />
            Saved
          </span>
        </div>
        <p
          class="mt-0.5 truncate text-[11px] opacity-55"
          :title="server.description || server.baseUrl"
        >
          {{ server.description || server.baseUrl }}
        </p>
      </div>
    </div>

    <!-- ── URL strip (full URL on hover) ────────────────────────────────── -->
    <div
      class="flex flex-wrap gap-x-3 gap-y-0.5 rounded-lg bg-base-100 px-2.5 py-1.5 font-mono text-[10px] opacity-65"
      :title="`${server.baseUrl}${server.endpointPath ?? ''}`"
    >
      <span class="font-sans font-bold text-primary not-italic">{{
        server.serverType
      }}</span>
      <span class="truncate">{{ server.baseUrl }}</span>
      <span v-if="server.endpointPath" class="opacity-60">{{
        server.endpointPath
      }}</span>
    </div>

    <!-- ── Capability + status badges ───────────────────────────────────── -->
    <div class="flex flex-wrap gap-1">
      <span
        v-for="b in capBadges"
        :key="b.label"
        :class="['badge badge-xs', b.cls]"
        >{{ b.label }}</span
      >
      <span :class="['badge badge-xs', statusBadgeClass]">{{
        server.lastStatus || 'UNKNOWN'
      }}</span>
    </div>

    <!-- ── Health line with relative time ───────────────────────────────── -->
    <p v-if="healthResult || lastTested" class="text-[10px] opacity-60">
      <template v-if="healthResult">
        {{ healthResult.ok ? '✓ Healthy' : '✗ Failed' }} ·
        {{ healthResult.latencyMs }}ms{{ lastTested ? ` · ${lastTested}` : '' }}
      </template>
      <template v-else> Last tested {{ lastTested }} </template>
    </p>

    <!-- ── Action buttons ───────────────────────────────────────────────── -->
    <div class="flex flex-wrap gap-1.5 pt-0.5">
      <button
        type="button"
        class="btn btn-primary btn-xs flex-1 rounded-lg"
        :disabled="active || !server.isActive"
        @click="emit('select')"
      >
        {{ active ? 'Selected' : 'Use' }}
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-xs rounded-lg"
        @click="emit('test')"
      >
        Test
      </button>
      <button
        type="button"
        :class="[
          'btn btn-xs rounded-lg',
          expanded ? 'btn-warning' : 'btn-ghost',
        ]"
        :title="expanded ? 'Close quick-edit' : 'Quick-edit URL & API key'"
        @click="toggleDrawer"
      >
        <Icon
          :name="expanded ? 'kind-icon:x' : 'kind-icon:key'"
          class="h-3 w-3"
        />
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-xs rounded-lg"
        @click="emit('edit')"
      >
        {{ owned ? 'Edit' : 'Customize' }}
      </button>
    </div>

    <!-- ── Quick-edit drawer ────────────────────────────────────────────── -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1 max-h-0"
      enter-to-class="opacity-100 translate-y-0 max-h-[500px]"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 max-h-[500px]"
      leave-to-class="opacity-0 -translate-y-1 max-h-0"
    >
      <div
        v-if="expanded"
        class="flex flex-col gap-2 overflow-hidden rounded-xl border border-base-300 bg-base-100 p-3"
      >
        <!-- Cloning notice -->
        <div
          v-if="willClone"
          class="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-2.5 py-2"
        >
          <Icon
            name="kind-icon:copy"
            class="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning"
          />
          <p class="text-[10px] leading-snug">
            <span class="font-black">Saves as a private copy.</span>
            The original {{ server.isOfficial ? 'official' : 'shared' }} server
            is left unchanged.
          </p>
        </div>

        <!-- Base URL -->
        <label class="flex flex-col gap-1">
          <span class="text-[10px] font-bold opacity-70">Base URL</span>
          <input
            v-model="form.baseUrl"
            class="input input-bordered input-xs rounded-lg font-mono text-[11px]"
            :placeholder="server.baseUrl"
          />
        </label>

        <!-- Endpoint Path -->
        <label class="flex flex-col gap-1">
          <span class="text-[10px] font-bold opacity-70">Endpoint Path</span>
          <input
            v-model="form.endpointPath"
            class="input input-bordered input-xs rounded-lg font-mono text-[11px]"
            :placeholder="server.endpointPath ?? '/v1/...'"
          />
        </label>

        <!-- API Key -->
        <label class="flex flex-col gap-1">
          <span class="text-[10px] font-bold opacity-70">
            API Key
            <span v-if="server.requiresApiKey" class="text-error">*</span>
          </span>
          <div class="flex gap-1">
            <input
              v-model="form.apiKey"
              :type="showKey ? 'text' : 'password'"
              autocomplete="off"
              :placeholder="
                hasStoredKey ? '•••• stored, leave blank to keep' : 'sk-...'
              "
              class="input input-bordered input-xs flex-1 rounded-lg font-mono text-[11px]"
            />
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-square rounded-lg"
              :title="showKey ? 'Hide' : 'Show'"
              @click="showKey = !showKey"
            >
              <Icon
                :name="showKey ? 'kind-icon:eye-off' : 'kind-icon:eye'"
                class="h-3 w-3"
              />
            </button>
          </div>
        </label>

        <!-- Key Label -->
        <label class="flex flex-col gap-1">
          <span class="text-[10px] font-bold opacity-70">Key Label</span>
          <input
            v-model="form.apiKeyName"
            class="input input-bordered input-xs rounded-lg text-[11px]"
            :placeholder="server.apiKeyName ?? 'OPENAI_API_KEY'"
          />
        </label>

        <!-- Save / Cancel -->
        <div class="flex gap-1.5 pt-1">
          <button
            type="button"
            class="btn btn-ghost btn-xs flex-1 rounded-lg"
            @click="cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary btn-xs flex-1 gap-1 rounded-lg"
            :disabled="!hasChanges || saving"
            @click="save"
          >
            <span v-if="saving" class="loading loading-spinner loading-xs" />
            <Icon v-else name="kind-icon:save" class="h-3 w-3" />
            {{ willClone ? 'Save Copy' : 'Save' }}
          </button>
        </div>

        <p v-if="saveError" class="text-[10px] text-error">{{ saveError }}</p>
      </div>
    </Transition>
  </article>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'
import type { Server } from '~/prisma/generated/prisma/client'

// ── Props / emits ─────────────────────────────────────────────────────────────

const props = defineProps<{
  server: Server
  active: boolean
  expanded?: boolean
  healthResult?: { ok: boolean; latencyMs: number } | null
  owned?: boolean
}>()

const emit = defineEmits<{
  (e: 'select'): void
  (e: 'edit'): void
  (e: 'test'): void
  (e: 'update:expanded', value: boolean): void
  (e: 'saved'): void
}>()

const serverStore = useServerStore()
const userStore = useUserStore()
const myUserId = computed(() => userStore.user?.id)

// ── Local form state ──────────────────────────────────────────────────────────

const showKey = ref(false)
const saving = ref(false)
const saveError = ref<string | null>(null)
const saveFlash = ref(false)

const form = reactive({
  baseUrl: props.server.baseUrl ?? '',
  endpointPath: props.server.endpointPath ?? '',
  apiKey: '',
  apiKeyName: props.server.apiKeyName ?? '',
})

// Reset form whenever the underlying server swaps (e.g. after a clone)
watch(
  () => props.server.id,
  () => resetForm(),
)

// Reset form whenever the drawer closes
watch(
  () => props.expanded,
  (open) => {
    if (!open) resetForm()
  },
)

function resetForm() {
  form.baseUrl = props.server.baseUrl ?? ''
  form.endpointPath = props.server.endpointPath ?? ''
  form.apiKey = ''
  form.apiKeyName = props.server.apiKeyName ?? ''
  showKey.value = false
  saveError.value = null
}

function toggleDrawer() {
  emit('update:expanded', !props.expanded)
}

function cancel() {
  emit('update:expanded', false)
}

// ── Derived ───────────────────────────────────────────────────────────────────

const willClone = computed(() => {
  if (!props.server.id) return true
  if (props.server.isPublic || props.server.isOfficial) return true
  if (props.server.userId !== myUserId.value) return true
  return false
})

const hasStoredKey = computed(() =>
  Boolean((props.server as Server & { apiKey?: string }).apiKey),
)

const hasChanges = computed(
  () =>
    form.baseUrl !== (props.server.baseUrl ?? '') ||
    form.endpointPath !== (props.server.endpointPath ?? '') ||
    form.apiKey.trim().length > 0 ||
    form.apiKeyName !== (props.server.apiKeyName ?? ''),
)

const mainIcon = computed(() => {
  if (props.server.supportsChat) return 'kind-icon:chat'
  if (props.server.supportsComfyWorkflow) return 'kind-icon:workflow'
  return 'kind-icon:art'
})

const statusDotClass = computed(() => {
  const map: Record<string, string> = {
    ONLINE: 'bg-success status-pulse',
    OFFLINE: 'bg-error',
    DEGRADED: 'bg-warning',
  }
  return map[props.server.lastStatus ?? ''] ?? 'bg-base-300'
})

const statusBadgeClass = computed(() => {
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
        props.server.supportsChat && { label: 'chat', cls: 'badge-secondary' },
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

// ── "Last tested" relative time, ticks once a minute ──────────────────────────

const now = ref(Date.now())
let tick: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  tick = setInterval(() => {
    now.value = Date.now()
  }, 60_000)
})
onUnmounted(() => {
  if (tick) clearInterval(tick)
})

const lastTested = computed(() => {
  const date = props.server.lastCheckedAt
  if (!date) return ''
  const time =
    typeof date === 'string' ? new Date(date).getTime() : date.getTime()
  const seconds = Math.floor((now.value - time) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
})

// ── Save logic ────────────────────────────────────────────────────────────────

async function save() {
  if (!hasChanges.value || saving.value) return
  saving.value = true
  saveError.value = null

  try {
    const savedId = willClone.value ? await saveAsClone() : await saveInPlace()
    flashSuccess()
    emit('update:expanded', false)
    emit('saved')

    // Auto-test the server we just configured — gives instant feedback
    if (savedId) {
      // Don't await — let it run in background, the card will update reactively
      void serverStore.testServerHealth(savedId)
    }
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : 'Save failed.'
  } finally {
    saving.value = false
  }
}

function flashSuccess() {
  saveFlash.value = true
  setTimeout(() => {
    saveFlash.value = false
  }, 2000)
}

async function saveInPlace(): Promise<number> {
  const id = props.server.id
  if (!id) throw new Error('Server has no id.')

  const dataChanged =
    form.baseUrl !== (props.server.baseUrl ?? '') ||
    form.endpointPath !== (props.server.endpointPath ?? '') ||
    form.apiKeyName !== (props.server.apiKeyName ?? '')

  if (dataChanged) {
    const result = await serverStore.updateServer(id, {
      baseUrl: form.baseUrl,
      endpointPath: form.endpointPath,
      apiKeyName: form.apiKeyName || null,
    })
    if (!result.success) throw new Error(result.message ?? 'Update failed.')
  }

  if (form.apiKey.trim()) {
    const keyResult = await serverStore.updateServerApiKey(id, {
      apiKey: form.apiKey,
      apiKeyName: form.apiKeyName || props.server.apiKeyName || 'API Key',
    })
    if (!keyResult.success)
      throw new Error(keyResult.message ?? 'Key update failed.')
  }

  return id
}

async function saveAsClone(): Promise<number> {
  if (!userStore.isLoggedIn || !myUserId.value) {
    throw new Error('You must be logged in to save a personal copy.')
  }

  const cloneResult = await serverStore.addServer({
    ...props.server,
    id: undefined,
    userId: myUserId.value,
    title: `${props.server.title} (My Copy)`,
    label: props.server.label ? `${props.server.label} (My Copy)` : 'My Server',
    baseUrl: form.baseUrl,
    endpointPath: form.endpointPath,
    apiKeyName: form.apiKeyName || props.server.apiKeyName || null,
    isPublic: false,
    isOfficial: false,
    isDefault: false,
    isEditable: true,
  })

  if (!cloneResult.success || !cloneResult.data) {
    throw new Error(cloneResult.message ?? 'Could not create a private copy.')
  }

  if (form.apiKey.trim()) {
    const keyResult = await serverStore.updateServerApiKey(
      cloneResult.data.id,
      {
        apiKey: form.apiKey,
        apiKeyName: form.apiKeyName || props.server.apiKeyName || 'API Key',
      },
    )
    if (!keyResult.success) {
      throw new Error(keyResult.message ?? 'Created copy, but key save failed.')
    }
  }

  return cloneResult.data.id
}
</script>

<style scoped>
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
