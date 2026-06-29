<template>
  <div class="inline-flex flex-col gap-3">
    <!-- Server selection modal -->
    <dialog ref="serverModalRef" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Select Art Server</h3>
        <p class="py-2 text-sm opacity-70">
          No preferred art server found. Choose one to generate inspiration images:
        </p>
        <select v-model="selectedServerId" class="select select-bordered w-full mt-2">
          <option :value="null" disabled>-- Select a server --</option>
          <option v-for="srv in availableServers" :key="srv.id" :value="srv.id">
            {{ srv.title }}
          </option>
        </select>
        <div class="modal-action">
          <button class="btn btn-ghost btn-sm" @click="closeModal">Cancel</button>
          <button
            class="btn btn-primary btn-sm"
            :disabled="!selectedServerId"
            @click="confirmServer"
          >
            Generate
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="closeModal" />
    </dialog>

    <!-- Trigger button -->
    <button
      class="btn btn-accent gap-2"
      :disabled="generating || pendingPrompts.length === 0"
      @click="handleClick"
    >
      <span v-if="generating" class="loading loading-spinner loading-sm" />
      <span v-else>Generate Inspiration</span>
      <span v-if="pendingPrompts.length > 0" class="badge badge-neutral">
        {{ pendingPrompts.length }}
      </span>
      <span v-else class="badge badge-ghost">up to date</span>
    </button>

    <!-- Per-image status row -->
    <div v-if="statuses.length > 0" class="flex flex-wrap gap-2">
      <div
        v-for="s in statuses"
        :key="s.promptId"
        class="badge gap-1"
        :class="{
          'badge-warning': s.status === 'generating',
          'badge-success': s.status === 'done',
          'badge-error':   s.status === 'failed',
          'badge-ghost':   s.status === 'pending',
        }"
      >
        <span v-if="s.status === 'generating'" class="loading loading-spinner loading-xs" />
        {{ s.label }}
      </div>
    </div>

    <p v-if="errorMsg" class="text-error text-sm">{{ errorMsg }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{ slug: string }>()

const serverModalRef = ref<HTMLDialogElement | null>(null)
const selectedServerId = ref<number | null>(null)
const availableServers = ref<Array<{ id: number; title: string }>>([])
const pendingPrompts = ref<Array<{ id: number; imagePath: string | null }>>([])
const generating = ref(false)
const errorMsg = ref('')

interface PromptStatus {
  promptId: number
  label: string
  status: 'pending' | 'generating' | 'done' | 'failed'
}
const statuses = ref<PromptStatus[]>([])

const pathPrefix = computed(() => `public/images/artcollections/${props.slug}/`)

async function loadPendingPrompts() {
  try {
    const res = await $fetch<{ success: boolean; data: Array<{
      id: number
      imagePath: string | null
      artStatus: string | null
    }> }>('/api/prompts')
    const all = res?.data ?? []
    pendingPrompts.value = all.filter(
      p => p.imagePath?.startsWith(pathPrefix.value) &&
           (!p.artStatus || p.artStatus === 'PENDING'),
    )
  } catch {
    pendingPrompts.value = []
  }
}

async function checkPreferredServer(): Promise<number | null> {
  try {
    const res = await $fetch<{ success: boolean; data: { preferredArtServerId: number | null } }>(
      '/api/users/me',
    )
    return res?.data?.preferredArtServerId ?? null
  } catch {
    return null
  }
}

async function loadServers() {
  try {
    const res = await $fetch<{ success: boolean; data: Array<{
      id: number
      title: string
      serverType: string
      isActive: boolean
    }> }>('/api/servers')
    availableServers.value = (res?.data ?? []).filter(
      s => s.isActive && ['A1111', 'COMFY', 'OPENAI'].includes(s.serverType),
    )
  } catch {
    availableServers.value = []
  }
}

async function handleClick() {
  if (pendingPrompts.value.length === 0) return
  errorMsg.value = ''

  const preferred = await checkPreferredServer()
  if (!preferred) {
    await loadServers()
    serverModalRef.value?.showModal()
    return
  }

  selectedServerId.value = preferred
  await runGeneration()
}

function closeModal() {
  serverModalRef.value?.close()
}

async function confirmServer() {
  if (!selectedServerId.value) return
  closeModal()
  await runGeneration()
}

function labelFor(imagePath: string | null): string {
  if (!imagePath) return 'image'
  const parts = imagePath.split('/')
  return parts[parts.length - 1] ?? 'image'
}

async function runGeneration() {
  generating.value = true
  errorMsg.value = ''
  statuses.value = pendingPrompts.value.map(p => ({
    promptId: p.id,
    label: labelFor(p.imagePath),
    status: 'pending' as const,
  }))

  for (const prompt of pendingPrompts.value) {
    const entry = statuses.value.find(s => s.promptId === prompt.id)
    if (entry) entry.status = 'generating'

    try {
      await $fetch('/api/prompts/generate', {
        method: 'POST',
        body: {
          promptId: prompt.id,
          ...(selectedServerId.value != null ? { serverId: selectedServerId.value } : {}),
        },
      })
      if (entry) entry.status = 'done'
    } catch (err: unknown) {
      if (entry) entry.status = 'failed'
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`Failed to generate ${prompt.imagePath}:`, msg)
    }
  }

  generating.value = false
  await loadPendingPrompts()
}

onMounted(loadPendingPrompts)
</script>
