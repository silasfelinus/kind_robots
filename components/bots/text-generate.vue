<!-- /components/chat/text-generate-button.vue -->
<template>
  <section class="flex w-full flex-col gap-3">
    <div
      class="grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
    >
      <label class="form-control w-full">
        <div class="label py-1">
          <span class="label-text text-xs font-black uppercase tracking-wide">
            Text Server
          </span>
        </div>

        <select
          class="select select-bordered w-full rounded-2xl font-semibold"
          :class="props.compact ? 'select-sm text-sm' : 'min-h-14 text-base'"
          :value="selectedServerId"
          :disabled="isResponding || !serverOptions.length"
          @change="handleServerChange"
        >
          <option disabled value="">Select text server</option>

          <option
            v-for="server in serverOptions"
            :key="server.id"
            :value="server.id"
          >
            {{ getServerDisplayLabel(server) }}
          </option>
        </select>
      </label>

      <button
        class="btn w-full rounded-2xl font-black transition-all duration-200 sm:w-auto sm:min-w-48"
        :class="[
          isResponding
            ? 'btn-primary cursor-not-allowed opacity-80'
            : canClick
              ? 'btn-primary shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:shadow-primary/40 active:translate-y-0'
              : 'btn-disabled',
          props.compact ? 'btn-sm text-sm' : 'min-h-14 text-base',
        ]"
        type="button"
        :disabled="!canClick"
        @click="handleGenerate"
      >
        <span v-if="isResponding" class="flex items-center gap-2">
          <span class="loading loading-dots loading-sm" />
          {{ busyLabel }}
        </span>

        <span v-else class="flex items-center gap-2">
          <icon :name="icon" class="h-5 w-5" />
          {{ canAfford ? label : 'Out of mana — top up' }}
        </span>
      </button>
    </div>

    <div
      v-if="activeServer"
      class="rounded-2xl border border-base-300 bg-base-200/70 p-3 text-xs font-semibold text-base-content/70"
    >
      <div class="flex flex-wrap items-center gap-2">
        <span class="badge badge-primary badge-sm rounded-2xl">
          {{ getServerEngineLabel(activeServer) }}
        </span>

        <span class="truncate">
          {{
            activeServer.title ||
            activeServer.label ||
            `Server #${activeServer.id}`
          }}
        </span>
      </div>
    </div>

    <div
      v-if="showMessage && statusMessage"
      class="flex items-start gap-2 rounded-2xl border p-3 text-sm font-semibold"
      :class="
        statusTone === 'error'
          ? 'border-error/40 bg-error/10 text-error'
          : 'border-success/40 bg-success/10 text-success'
      "
    >
      <icon
        :name="statusTone === 'error' ? 'kind-icon:alert' : 'kind-icon:check'"
        class="mt-0.5 h-4 w-4 shrink-0"
      />
      {{ statusMessage }}
    </div>

    <div
      v-if="showResult && resultText"
      class="whitespace-pre-wrap rounded-2xl border border-base-300 bg-base-100 p-3 text-sm"
    >
      {{ resultText }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Server } from '~/prisma/generated/prisma/client'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useChatStore } from '@/stores/chatStore'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'
import { useManaStore } from '@/stores/manaStore'

const props = withDefaults(
  defineProps<{
    // The text to generate from. Bind with v-model:prompt.
    prompt?: string
    // Optional bot/recipient context so the created chat is owned correctly.
    botId?: number | null
    recipientId?: number | null
    characterId?: number | null
    isPublic?: boolean
    // Generation params.
    model?: string
    temperature?: number
    maxTokens?: number
    // UI.
    label?: string
    busyLabel?: string
    icon?: string
    compact?: boolean
    showResult?: boolean
    showMessage?: boolean
    // Clear the bound prompt after a successful send.
    clearOnSuccess?: boolean
  }>(),
  {
    prompt: '',
    botId: null,
    recipientId: null,
    characterId: null,
    isPublic: false,
    model: '',
    temperature: 0.7,
    maxTokens: 2048,
    label: 'Generate Text',
    busyLabel: 'Generating…',
    icon: 'kind-icon:sparkles',
    compact: false,
    showResult: true,
    showMessage: true,
    clearOnSuccess: true,
  },
)

const emit = defineEmits<{
  generated: [payload: { chatId: number; text: string }]
  failed: [message: string]
  'update:prompt': [value: string]
}>()

const chatStore = useChatStore()
const serverStore = useServerStore()
const userStore = useUserStore()
const manaStore = useManaStore()
const errorStore = useErrorStore()

const isResponding = ref(false)
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')
const resultText = ref('')

// Use the store's canonical text-server list rather than re-deriving it.
const serverOptions = computed<Server[]>(() => serverStore.textServers)

const activeServer = computed<Server | null>(
  () => serverStore.activeTextServer ?? null,
)

const selectedServerId = computed(() =>
  activeServer.value?.id ? String(activeServer.value.id) : '',
)

// Browser-transport / user-owned servers are free; family is free; otherwise
// the user needs a positive balance. Exact cost is enforced server-side.
const canAfford = computed(() => {
  if (manaStore.isFamily) return true
  const server = activeServer.value
  // No server, or a metered platform server → needs mana.
  const metered =
    !server || (server as Server & { isMetered?: boolean }).isMetered
  if (!metered) return true
  return manaStore.balance > 0
})

const hasPrompt = computed(() => props.prompt.trim().length > 0)

const canClick = computed(
  () =>
    !isResponding.value &&
    hasPrompt.value &&
    !!activeServer.value &&
    canAfford.value,
)

onMounted(async () => {
  if (!serverStore.hasLoaded) {
    await serverStore.initialize({ fetchRemote: true })
  }
})

function setStatus(message: string, tone: 'success' | 'error') {
  statusMessage.value = message
  statusTone.value = tone
}

function getServerEngineLabel(server: Server): string {
  if (server.serverType === 'OPENAI_COMPATIBLE') return 'OpenAI-Compatible'
  if (server.serverType === 'TEXT') return 'Text'
  return server.serverType || 'Text'
}

function getServerDisplayLabel(server: Server): string {
  const title = server.label || server.title || `Server #${server.id}`
  return `${title} · ${getServerEngineLabel(server)}`
}

async function handleServerChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const serverId = Number(target.value)

  if (!Number.isInteger(serverId) || serverId <= 0) {
    await serverStore.setActiveTextServer(null)
    return
  }

  const result = await serverStore.setActiveTextServer(serverId)

  if (!result.success && result.message) {
    setStatus(result.message, 'error')
  }
}

async function handleGenerate() {
  const content = props.prompt.trim()

  if (!content || isResponding.value) return
  if (!activeServer.value) {
    setStatus('Select a text server first.', 'error')
    return
  }

  isResponding.value = true
  statusMessage.value = ''
  resultText.value = ''

  try {
    // Create the chat first so streamResponse has something to attach to.
    const newChat = await chatStore.addChat({
      botId: props.botId ?? undefined,
      content,
      isPublic: props.isPublic,
      userId: userStore.userId ?? userStore.user?.id ?? 10,
      type: props.botId ? 'ToBot' : 'ToForum',
      recipientId: props.recipientId ?? props.botId ?? undefined,
      characterId: props.characterId ?? null,
      serverId: activeServer.value.id ?? null,
    } as Parameters<typeof chatStore.addChat>[0])

    if (!newChat?.id) {
      throw new Error('Failed to create chat.')
    }

    if (props.clearOnSuccess) {
      emit('update:prompt', '')
    }

    // streamResponse promotes guests, runs the mana gate, and charges on
    // success. A 402 (insufficient mana) surfaces here as a thrown error.
    const text = await chatStore.streamResponse(newChat.id, {
      model: props.model || activeServer.value.model || 'gpt-4o-mini',
      temperature: props.temperature,
      maxTokens: props.maxTokens,
      serverId: activeServer.value.id ?? null,
    })

    resultText.value = text
    setStatus('Response generated.', 'success')

    emit('generated', { chatId: newChat.id, text })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Text generation failed.'

    // Insufficient mana → point them at the wallet instead of a dead end.
    if (/mana|⚡/i.test(message)) {
      setStatus(`${message} Visit your wallet to top up.`, 'error')
    } else {
      setStatus(message, 'error')
    }

    errorStore.addError(ErrorType.INTERACTION_ERROR, message)
    emit('failed', message)
  } finally {
    isResponding.value = false
  }
}
</script>
