import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch } from './utils'
import type { AgentCredentialScope } from '@/utils/agentCredentialScopes'

export type AgentCredentialRow = {
  id: number
  userId: number
  botId: number | null
  label: string
  keyPrefix: string
  scopes: AgentCredentialScope[]
  createdAt: string
  updatedAt: string
  expiresAt: string | null
  lastUsedAt: string | null
  revokedAt: string | null
}

export type CreateAgentCredentialPayload = {
  label: string
  botId: number
  scopes: AgentCredentialScope[]
  expiresAt: string | null
}

type CredentialListResponse = {
  credentials?: AgentCredentialRow[]
}

type CredentialCreateResponse = {
  credential?: AgentCredentialRow
  token?: string
}

export const useAgentCredentialStore = defineStore('agentCredentialStore', () => {
  const credentials = ref<AgentCredentialRow[]>([])
  const isLoading = ref(false)
  const isCreating = ref(false)
  const revokingId = ref<number | null>(null)
  const errorMessage = ref('')
  const justCreatedToken = ref<string | null>(null)
  const replacementSourceId = ref<number | null>(null)

  const activeCredentials = computed(() =>
    credentials.value.filter((credential) => !credential.revokedAt),
  )

  function clearError(): void {
    errorMessage.value = ''
  }

  function clearCreatedToken(): void {
    justCreatedToken.value = null
    replacementSourceId.value = null
  }

  async function load(): Promise<void> {
    isLoading.value = true
    clearError()

    try {
      const response = await performFetch<CredentialListResponse>(
        '/api/agent-credentials',
      )

      if (!response.success) {
        credentials.value = []
        errorMessage.value =
          response.message || 'Failed to load agent credentials.'
        return
      }

      credentials.value = Array.isArray(response.data?.credentials)
        ? response.data.credentials
        : []
    } finally {
      isLoading.value = false
    }
  }

  async function create(
    payload: CreateAgentCredentialPayload,
    replacingId: number | null = null,
  ): Promise<boolean> {
    isCreating.value = true
    clearError()
    clearCreatedToken()

    try {
      const response = await performFetch<CredentialCreateResponse>(
        '/api/agent-credentials',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      )

      if (!response.success || !response.data?.token) {
        errorMessage.value =
          response.message || 'Failed to create agent credential.'
        return false
      }

      justCreatedToken.value = response.data.token
      replacementSourceId.value = replacingId
      await load()
      return true
    } finally {
      isCreating.value = false
    }
  }

  async function revoke(id: number): Promise<boolean> {
    revokingId.value = id
    clearError()

    try {
      const response = await performFetch(`/api/agent-credentials/${id}`, {
        method: 'DELETE',
      })

      if (!response.success) {
        errorMessage.value =
          response.message || 'Failed to revoke agent credential.'
        return false
      }

      await load()
      return true
    } finally {
      revokingId.value = null
    }
  }

  return {
    credentials,
    activeCredentials,
    isLoading,
    isCreating,
    revokingId,
    errorMessage,
    justCreatedToken,
    replacementSourceId,
    load,
    create,
    revoke,
    clearError,
    clearCreatedToken,
  }
})
