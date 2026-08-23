import { useServerStore } from '@/stores/serverStore'
import { performFetch } from '@/stores/utils'
import type { ArtModelRef } from '@/utils/artModelContext'

type ArtAssetContext = {
  source?: string
  role?: string
  variant?: string
  size?: string
  className?: string
  description?: string
  preferredStyle?: string
  exclusions?: string
}

type ArtPageContext = {
  url?: string
  title?: string
  description?: string
  heading?: string
  localText?: string
}

export type ArtAssetSuggestionInput = {
  subject?: string
  purpose?: string
  current?: string
  entityRef?: ArtModelRef
  asset?: ArtAssetContext
  project?: Record<string, unknown>
  page?: ArtPageContext
  maxTokens?: number
}

type SuggestResult = {
  value: string
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

export async function suggestArtAssetPrompt(
  input: ArtAssetSuggestionInput,
): Promise<string> {
  const serverStore = useServerStore()
  await serverStore.initialize({ fetchRemote: true })

  const activeServer = serverStore.activeTextServer
  const server = activeServer
    ? {
        id: activeServer.id ?? null,
        serverType: activeServer.serverType ?? null,
        baseUrl: activeServer.baseUrl ?? null,
        endpointPath: activeServer.endpointPath ?? null,
        model: activeServer.model ?? null,
      }
    : undefined

  const result = await performFetch<SuggestResult>(
    '/api/suggest',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        builder: 'art-asset',
        field: 'prompt',
        stepKey: 'model-art',
        current: input.current || '',
        server,
        maxTokens: input.maxTokens ?? 500,
        context: {
          subject: input.subject,
          purpose: input.purpose,
          entityRef: input.entityRef,
          asset: input.asset,
          project: input.project,
          page: input.page,
        },
      }),
    },
    1,
    30000,
  )

  if (!result.success) {
    throw new Error(result.message || 'Prompt suggestion failed.')
  }

  const value = cleanString(result.data?.value)
  if (!value) {
    throw new Error('The suggestion model returned no prompt.')
  }

  return value
}
