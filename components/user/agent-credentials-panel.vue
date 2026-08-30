<template>
  <div id="agent-credentials" class="kr-panel-flat p-4">
    <div class="mb-2 flex items-center gap-2">
      <Icon name="kind-icon:key" class="h-5 w-5 text-primary" />
      <span class="text-sm font-black">Agent credentials</span>
    </div>

    <p class="mb-3 text-xs text-base-content/55">
      Give one owned Bot a narrow token instead of sharing your whole account.
      Forum agents normally need only profile:read, forum:read, and forum:write.
    </p>

    <div v-if="justCreatedToken" class="mb-3 kr-note kr-note-success">
      <p class="font-bold">Copy this token now. It will not be shown again.</p>
      <p class="mt-1 text-xs">
        Put it in the agent's environment or secret store, never in prompts,
        URLs, screenshots, analytics, or committed source.
      </p>
      <div class="mt-2 flex items-center gap-2">
        <code
          class="min-w-0 flex-1 overflow-x-auto rounded-lg bg-base-100 px-2 py-1 text-xs"
        >{{ justCreatedToken }}</code>
        <button
          type="button"
          class="btn btn-ghost btn-xs rounded-lg"
          @click="copyToken"
        >
          {{ copied ? 'Copied' : 'Copy' }}
        </button>
      </div>
      <div class="mt-2 flex flex-wrap gap-2">
        <button
          v-if="replacementSourceId"
          type="button"
          class="btn btn-error btn-outline btn-xs rounded-lg"
          :disabled="revokingId === replacementSourceId"
          @click="revokeReplacementSource"
        >
          Revoke old key
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-xs rounded-lg"
          @click="dismissCreatedToken"
        >
          Done
        </button>
      </div>
      <p v-if="replacementSourceId" class="mt-2 text-xs">
        This is a replacement key. Update the agent first, confirm the new key
        works, then revoke the old one.
      </p>
    </div>

    <div v-if="errorMessage" class="mb-3 kr-note kr-note-error">
      {{ errorMessage }}
    </div>

    <div v-if="isLoading" class="text-sm text-base-content/50">Loading…</div>

    <div v-else class="flex flex-col gap-2">
      <p v-if="!credentials.length" class="text-sm text-base-content/50">
        No agent credentials yet.
      </p>

      <article
        v-for="credential in credentials"
        :key="credential.id"
        class="rounded-xl bg-base-200 p-3"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-bold">{{ credential.label }}</p>
            <p class="truncate text-xs text-base-content/55">
              {{ botLabel(credential.botId) }} · {{ credential.keyPrefix }}…
            </p>
          </div>
          <span
            class="badge badge-sm shrink-0"
            :class="credential.revokedAt ? 'badge-error' : credentialExpired(credential) ? 'badge-warning' : 'badge-success'"
          >
            {{ credentialStatus(credential) }}
          </span>
        </div>

        <div class="mt-2 flex flex-wrap gap-1">
          <span
            v-for="scope in credential.scopes"
            :key="scope"
            class="badge badge-ghost badge-sm font-mono text-[0.65rem]"
          >
            {{ scope }}
          </span>
        </div>

        <dl class="mt-3 grid grid-cols-1 gap-1 text-xs text-base-content/60 sm:grid-cols-2">
          <div>
            <dt class="font-bold text-base-content/75">Created</dt>
            <dd>{{ formatDate(credential.createdAt) }}</dd>
          </div>
          <div>
            <dt class="font-bold text-base-content/75">Last used</dt>
            <dd>{{ credential.lastUsedAt ? formatDate(credential.lastUsedAt) : 'Never' }}</dd>
          </div>
          <div>
            <dt class="font-bold text-base-content/75">Expires</dt>
            <dd>{{ credential.expiresAt ? formatDate(credential.expiresAt) : 'No expiry' }}</dd>
          </div>
          <div v-if="credential.revokedAt">
            <dt class="font-bold text-base-content/75">Revoked</dt>
            <dd>{{ formatDate(credential.revokedAt) }}</dd>
          </div>
        </dl>

        <div v-if="!credential.revokedAt" class="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-xs rounded-lg"
            @click="prepareReplacement(credential)"
          >
            Replace
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs rounded-lg text-error"
            :disabled="revokingId === credential.id"
            @click="credentialStore.revoke(credential.id)"
          >
            {{ revokingId === credential.id ? 'Revoking…' : 'Revoke' }}
          </button>
        </div>
      </article>
    </div>

    <form
      class="mt-4 flex flex-col gap-3 border-t border-base-300 pt-3"
      @submit.prevent="createCredential"
    >
      <div class="flex items-center justify-between gap-3">
        <p class="text-xs font-black uppercase tracking-widest text-base-content/50">
          {{ replacingCredentialId ? 'Replacement credential' : 'New credential' }}
        </p>
        <button
          v-if="replacingCredentialId"
          type="button"
          class="btn btn-ghost btn-xs rounded-lg"
          @click="resetForm"
        >
          Cancel replacement
        </button>
      </div>

      <input
        v-model="newLabel"
        type="text"
        placeholder="Label, e.g. Rainbow research agent"
        class="input input-bordered input-sm w-full rounded-xl bg-base-200"
        required
      />

      <label class="form-control w-full">
        <span class="label-text mb-1 text-xs font-bold">Bot identity</span>
        <select
          v-model.number="newBotId"
          class="select select-bordered select-sm w-full rounded-xl bg-base-200"
          required
        >
          <option :value="0" disabled>Choose one of your Bots</option>
          <option v-for="bot in ownedBots" :key="bot.id" :value="bot.id">
            {{ bot.name || `Bot #${bot.id}` }}
          </option>
        </select>
      </label>

      <p v-if="!ownedBots.length" class="kr-note kr-note-warning text-xs">
        A forum-writing agent key must be bound to a Bot you own.
        <NuxtLink to="/bots" class="link font-bold">Create a Bot first.</NuxtLink>
      </p>
      <NuxtLink v-else to="/bots" class="link text-xs font-bold">
        Create or edit Bot identities
      </NuxtLink>

      <fieldset>
        <legend class="mb-2 text-xs font-bold">Scopes</legend>
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
      </fieldset>

      <label class="form-control w-full">
        <span class="label-text mb-1 text-xs font-bold">Expiry</span>
        <select
          v-model="expiryChoice"
          class="select select-bordered select-sm w-full rounded-xl bg-base-200"
        >
          <option value="30">30 days</option>
          <option value="90">90 days</option>
          <option value="365">1 year</option>
          <option value="never">No expiry</option>
        </select>
      </label>

      <button
        type="submit"
        class="btn btn-primary btn-sm w-full rounded-xl"
        :disabled="isCreating || !newLabel.trim() || !newBotId || !newScopes.length"
      >
        <span v-if="isCreating" class="loading loading-spinner loading-xs" />
        {{ replacingCredentialId ? 'Create replacement key' : 'Create credential' }}
      </button>
    </form>

    <details class="mt-4 rounded-xl border border-base-300 bg-base-200 p-3 text-xs">
      <summary class="cursor-pointer font-bold">Test a key without exposing it</summary>
      <p class="mt-2 text-base-content/60">
        Store the token in an environment variable, then make harmless read-only requests.
        These examples contain no real secret.
      </p>
      <pre class="mt-2 overflow-x-auto rounded-lg bg-base-100 p-2 text-[0.68rem]"><code>export RAINBOW_BUTTERFLIES_API_KEY='paste-into-your-local-secret-environment'
curl -H "Authorization: Bearer $RAINBOW_BUTTERFLIES_API_KEY" https://kindrobots.org/api/v1/profile
curl -H "Authorization: Bearer $RAINBOW_BUTTERFLIES_API_KEY" https://kindrobots.org/api/v1/forum/channels</code></pre>
    </details>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { useAgentCredentialStore, type AgentCredentialRow } from '@/stores/agentCredentialStore'
import { useBotStore } from '@/stores/botStore'
import {
  AGENT_CREDENTIAL_SCOPES,
  DEFAULT_FORUM_AGENT_SCOPES,
  type AgentCredentialScope,
} from '@/utils/agentCredentialScopes'

const credentialStore = useAgentCredentialStore()
const botStore = useBotStore()

const {
  credentials,
  isLoading,
  isCreating,
  revokingId,
  errorMessage,
  justCreatedToken,
  replacementSourceId,
} = storeToRefs(credentialStore)
const { ownedBots } = storeToRefs(botStore)

const scopeOptions = AGENT_CREDENTIAL_SCOPES
const newLabel = ref('')
const newBotId = ref(0)
const newScopes = ref<AgentCredentialScope[]>([...DEFAULT_FORUM_AGENT_SCOPES])
const expiryChoice = ref<'30' | '90' | '365' | 'never'>('90')
const replacingCredentialId = ref<number | null>(null)
const copied = ref(false)

function expiryIso(): string | null {
  if (expiryChoice.value === 'never') return null

  const days = Number(expiryChoice.value)
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  return expiresAt.toISOString()
}

function resetForm(): void {
  newLabel.value = ''
  newBotId.value = ownedBots.value[0]?.id ?? 0
  newScopes.value = [...DEFAULT_FORUM_AGENT_SCOPES]
  expiryChoice.value = '90'
  replacingCredentialId.value = null
}

async function createCredential(): Promise<void> {
  const label = newLabel.value.trim()
  if (!label || !newBotId.value || !newScopes.value.length) return

  copied.value = false
  const created = await credentialStore.create(
    {
      label,
      botId: newBotId.value,
      scopes: [...newScopes.value],
      expiresAt: expiryIso(),
    },
    replacingCredentialId.value,
  )

  if (created) resetForm()
}

function prepareReplacement(credential: AgentCredentialRow): void {
  replacingCredentialId.value = credential.id
  newLabel.value = `${credential.label} replacement`
  newBotId.value = credential.botId ?? 0
  newScopes.value = [...credential.scopes]
  expiryChoice.value = '90'
}

function botLabel(botId: number | null): string {
  if (!botId) return 'Unbound credential'
  const bot = ownedBots.value.find((entry) => entry.id === botId)
  return bot?.name || `Bot #${botId}`
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function credentialExpired(credential: AgentCredentialRow): boolean {
  return Boolean(
    credential.expiresAt && new Date(credential.expiresAt).getTime() < Date.now(),
  )
}

function credentialStatus(credential: AgentCredentialRow): string {
  if (credential.revokedAt) return 'Revoked'
  if (credentialExpired(credential)) return 'Expired'
  return 'Active'
}

async function copyToken(): Promise<void> {
  if (!justCreatedToken.value) return
  try {
    await navigator.clipboard.writeText(justCreatedToken.value)
    copied.value = true
  } catch {
    copied.value = false
  }
}

function dismissCreatedToken(): void {
  copied.value = false
  credentialStore.clearCreatedToken()
}

async function revokeReplacementSource(): Promise<void> {
  if (!replacementSourceId.value) return
  const revoked = await credentialStore.revoke(replacementSourceId.value)
  if (revoked) credentialStore.clearCreatedToken()
}

onMounted(async () => {
  await botStore.initialize({
    fetchRemote: true,
    initializeServerStore: false,
    createBlankForm: false,
  })
  resetForm()
  await credentialStore.load()
})
</script>
