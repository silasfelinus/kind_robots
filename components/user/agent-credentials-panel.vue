<!-- /components/user/agent-credentials-panel.vue -->
<!--
  rainbow-butterflies/t-015: management UI for scoped per-agent credentials
  (server/utils/agentCredentials.ts, server/api/agent-credentials/*). Replaces
  the legacy whole-user apiKey for machine/agent callers -- a credential is
  shown exactly once at creation, then only ever shown as its keyPrefix.
-->
<template>
  <div class="kr-panel-flat p-4">
    <div class="mb-2 flex items-center gap-2">
      <Icon name="kind-icon:key" class="h-5 w-5 text-primary" />
      <span class="text-sm font-black">Agent credentials</span>
    </div>

    <p class="mb-3 text-xs text-base-content/55">
      Scoped tokens for bots/agents to act on your behalf without sharing your
      full account. Each secret is shown once, right after you create it -- copy
      it now.
    </p>

    <div v-if="justCreatedToken" class="mb-3 kr-note kr-note-success">
      <p class="font-bold">
        New credential created -- copy this token now, it won't be shown again:
      </p>
      <div class="mt-2 flex items-center gap-2">
        <code
          class="min-w-0 flex-1 truncate rounded-lg bg-base-100 px-2 py-1 text-xs"
        >
          {{ justCreatedToken }}
        </code>
        <button
          type="button"
          class="btn btn-ghost btn-xs rounded-lg"
          @click="copyToken"
        >
          {{ copied ? 'Copied' : 'Copy' }}
        </button>
      </div>
      <button
        type="button"
        class="btn btn-ghost btn-xs mt-2 rounded-lg"
        @click="justCreatedToken = null"
      >
        Done
      </button>
    </div>

    <div v-if="errorMessage" class="mb-3 kr-note kr-note-error">
      {{ errorMessage }}
    </div>

    <div v-if="isLoading" class="text-sm text-base-content/50">Loading…</div>

    <div v-else class="flex flex-col gap-2">
      <p v-if="!credentials.length" class="text-sm text-base-content/50">
        No agent credentials yet.
      </p>

      <div
        v-for="credential in credentials"
        :key="credential.id"
        class="flex items-center justify-between gap-2 rounded-xl bg-base-200 p-2"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-bold">{{ credential.label }}</p>
          <p class="truncate text-xs text-base-content/55">
            {{ credential.keyPrefix }}… ·
            {{ credential.scopes.join(', ') || 'no scopes' }}
            <span v-if="credential.revokedAt" class="text-error">
              · revoked</span
            >
          </p>
        </div>

        <button
          v-if="!credential.revokedAt"
          type="button"
          class="btn btn-ghost btn-xs shrink-0 rounded-lg text-error"
          :disabled="revokingId === credential.id"
          @click="revoke(credential.id)"
        >
          Revoke
        </button>
      </div>
    </div>

    <form
      class="mt-4 flex flex-col gap-2 border-t border-base-300 pt-3"
      @submit.prevent="create"
    >
      <p
        class="text-xs font-black uppercase tracking-widest text-base-content/50"
      >
        New credential
      </p>

      <input
        v-model="newLabel"
        type="text"
        placeholder="Label (e.g. Forum bot)"
        class="input input-bordered input-sm w-full rounded-xl bg-base-200"
        required
      />

      <div class="flex flex-wrap gap-3">
        <label
          v-for="scope in scopeOptions"
          :key="scope"
          class="flex items-center gap-1.5 text-xs"
        >
          <input
            v-model="newScopes"
            type="checkbox"
            :value="scope"
            class="checkbox checkbox-xs rounded"
          />
          {{ scope }}
        </label>
      </div>

      <button
        type="submit"
        class="btn btn-primary btn-sm mt-1 w-full rounded-xl"
        :disabled="isCreating || !newLabel.trim()"
      >
        <span v-if="isCreating" class="loading loading-spinner loading-xs" />
        Create credential
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { performFetch } from '@/stores/utils'
import {
  AGENT_CREDENTIAL_SCOPES,
  DEFAULT_FORUM_AGENT_SCOPES,
  type AgentCredentialScope,
} from '@/utils/agentCredentialScopes'

type CredentialRow = {
  id: number
  label: string
  keyPrefix: string
  scopes: AgentCredentialScope[]
  revokedAt: string | null
}

const scopeOptions = AGENT_CREDENTIAL_SCOPES

const credentials = ref<CredentialRow[]>([])
const isLoading = ref(false)
const isCreating = ref(false)
const revokingId = ref<number | null>(null)
const errorMessage = ref('')
const justCreatedToken = ref<string | null>(null)
const copied = ref(false)

const newLabel = ref('')
const newScopes = ref<AgentCredentialScope[]>([...DEFAULT_FORUM_AGENT_SCOPES])

async function load() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await performFetch<{ credentials: CredentialRow[] }>(
      '/api/agent-credentials',
    )
    credentials.value =
      res.success && Array.isArray(res.data?.credentials)
        ? res.data.credentials
        : []
    if (!res.success)
      errorMessage.value = res.message || 'Failed to load credentials.'
  } finally {
    isLoading.value = false
  }
}

async function create() {
  const label = newLabel.value.trim()
  if (!label) return

  isCreating.value = true
  errorMessage.value = ''
  justCreatedToken.value = null
  copied.value = false

  try {
    const res = await performFetch<{
      credential: CredentialRow
      token: string
    }>('/api/agent-credentials', {
      method: 'POST',
      body: JSON.stringify({ label, scopes: newScopes.value }),
    })

    if (res.success && res.data?.token) {
      justCreatedToken.value = res.data.token
      newLabel.value = ''
      newScopes.value = [...DEFAULT_FORUM_AGENT_SCOPES]
      await load()
    } else {
      errorMessage.value = res.message || 'Failed to create credential.'
    }
  } finally {
    isCreating.value = false
  }
}

async function revoke(id: number) {
  revokingId.value = id
  errorMessage.value = ''
  try {
    const res = await performFetch(`/api/agent-credentials/${id}`, {
      method: 'DELETE',
    })
    if (res.success) {
      await load()
    } else {
      errorMessage.value = res.message || 'Failed to revoke credential.'
    }
  } finally {
    revokingId.value = null
  }
}

async function copyToken() {
  if (!justCreatedToken.value) return
  try {
    await navigator.clipboard.writeText(justCreatedToken.value)
    copied.value = true
  } catch {
    // Clipboard access can be denied by the browser; the token stays
    // selectable in the <code> block either way.
  }
}

onMounted(load)
</script>
