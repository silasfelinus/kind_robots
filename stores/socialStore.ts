// /stores/socialStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { performFetch, handleError } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import {
  formatVariants,
  type SocialVariant,
  type SocialMedia,
} from '@/utils/social/formatSocialPost'
import type {
  SocialPost,
  SocialTarget,
  SocialPlatform,
  PostAudience,
} from '~/prisma/generated/prisma/client'

export type SocialTargetSummary = Pick<
  SocialTarget,
  'id' | 'postId' | 'platform' | 'status'
>

export type SocialPostWithTargets = SocialPost & {
  targets?: SocialTargetSummary[]
}

export interface SocialPostForm extends Partial<SocialPost> {
  platforms?: SocialPlatform[] // selected targets for the draft
  media?: SocialMedia[] // parsed mediaUrls for editing
  url?: string | null // canonical link back
  hashtags?: string[]
}

// Pre-fill shape for "share this generation/dream/devlog" entry points.
export interface DraftFromSourceInput {
  sourceType: string // 'GENERATION' | 'DREAM' | 'DEVLOG' | 'BLOG' ...
  sourceId?: number | null
  title?: string
  body?: string
  url?: string | null
  media?: SocialMedia[]
  hashtags?: string[]
  audience?: PostAudience
  platforms?: SocialPlatform[]
}

// SSR guard — localStorage is undefined during server render.
const isClient = typeof window !== 'undefined'

function safeGetLocalStorage(key: string): string | null {
  if (!isClient) return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLocalStorage(key: string, value: string): void {
  if (!isClient) return
  try {
    localStorage.setItem(key, value)
  } catch {}
}

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function safeParseObject<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as T) : null
  } catch {
    return null
  }
}

export const useSocialStore = defineStore('socialStore', () => {
  const items = ref<SocialPostWithTargets[]>([])
  const selected = ref<SocialPostWithTargets | null>(null)
  const form = ref<SocialPostForm>(blankForm())
  const isSaving = ref(false)
  const isPublishing = ref(false)
  const isInitialized = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const userStore = useUserStore()

  const ownedItems = computed(() =>
    items.value.filter((i) => i.userId === userStore.user?.id),
  )

  // Live per-platform previews derived from the current form.
  const variants = computed<SocialVariant[]>(() => {
    const platforms = form.value.platforms ?? []
    if (!platforms.length) return []
    return formatVariants(platforms, {
      title: form.value.title ?? '',
      body: form.value.body ?? '',
      url: form.value.url ?? null,
      media: form.value.media ?? [],
      hashtags: form.value.hashtags ?? [],
    })
  })

  function blankForm(): SocialPostForm {
    return {
      title: '',
      body: '',
      url: '',
      platforms: [],
      media: [],
      hashtags: [],
      isPublic: false,
      isMature: false,
      audience: 'SOCIAL' as PostAudience,
    }
  }

  function mergeTargets(
    existing: SocialTargetSummary[] = [],
    incoming: SocialTargetSummary[] = [],
  ): SocialTargetSummary[] {
    const current = new Map(existing.map((target) => [target.id, target]))

    return incoming.map((target) => ({
      ...current.get(target.id),
      ...target,
    }))
  }

  function mergePost(
    existing: SocialPostWithTargets,
    incoming: SocialPostWithTargets,
  ): SocialPostWithTargets {
    return {
      ...existing,
      ...incoming,
      targets:
        incoming.targets !== undefined
          ? mergeTargets(existing.targets, incoming.targets)
          : existing.targets,
    }
  }

  // Merge, never overwrite: a remote fetch must not drop locally-created
  // drafts the server response doesn't include. Existing rows keep their
  // position, while bounded mutation targets merge into any richer GET data.
  function mergeItems(incoming: SocialPostWithTargets[]) {
    const map = new Map<number, SocialPostWithTargets>()
    for (const item of items.value) map.set(item.id, item)
    for (const item of incoming) {
      if (!item?.id) continue
      const existing = map.get(item.id)
      map.set(item.id, existing ? mergePost(existing, item) : item)
    }
    items.value = Array.from(map.values())
    syncToLocalStorage()
  }

  function upsertItem(item: SocialPostWithTargets) {
    const index = items.value.findIndex((entry) => entry.id === item.id)
    const existing = index >= 0 ? items.value[index] : null
    const next = existing ? mergePost(existing, item) : item

    if (index >= 0) items.value[index] = next
    else items.value.unshift(next)

    if (selected.value?.id === item.id) selected.value = next
    syncToLocalStorage()

    return next
  }

  function syncToLocalStorage() {
    safeSetLocalStorage('socialPosts', JSON.stringify(items.value))
    safeSetLocalStorage('socialPostForm', JSON.stringify(form.value))
  }

  async function initialize() {
    if (isInitialized.value) return
    try {
      const localItems = safeParseArray<SocialPostWithTargets>(
        safeGetLocalStorage('socialPosts'),
      )
      const localForm = safeParseObject<SocialPostForm>(
        safeGetLocalStorage('socialPostForm'),
      )
      if (localItems.length) items.value = localItems
      if (localForm) form.value = localForm

      // fetchAll merges into the local items loaded above.
      await fetchAll()
      isInitialized.value = true
    } catch (err) {
      handleError(err, 'initializing social store')
    }
  }

  async function fetchAll(): Promise<SocialPostWithTargets[]> {
    loading.value = true
    error.value = null
    try {
      const res = await performFetch<SocialPostWithTargets[]>('/api/socials')
      if (res.success && res.data) {
        mergeItems(res.data)
        return res.data
      }
      throw new Error(res.message || 'Failed to fetch social posts')
    } catch (err) {
      error.value = (err as Error).message
      handleError(err, 'fetching social posts')
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: number): Promise<SocialPostWithTargets | null> {
    try {
      const res = await performFetch<SocialPostWithTargets>(
        `/api/socials/${id}`,
      )
      if (res.success && res.data) return upsertItem(res.data)
      throw new Error(res.message)
    } catch (err) {
      handleError(err, 'fetching social post by ID')
      return null
    }
  }

  // Serialize the form into the API payload shape.
  function toPayload(f: SocialPostForm) {
    return {
      title: f.title,
      body: f.body,
      mediaUrls: f.media ?? [],
      isPublic: f.isPublic ?? false,
      isMature: f.isMature ?? false,
      audience: f.audience ?? ('SOCIAL' as PostAudience),
      sourceType: f.sourceType ?? null,
      sourceId: f.sourceId ?? null,
      // platforms drive target creation server-side
      platforms: f.platforms ?? [],
    }
  }

  async function addPost(payload?: SocialPostForm) {
    isSaving.value = true

    try {
      const res = await performFetch<SocialPostWithTargets>('/api/socials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(payload ?? form.value)),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to create social post')
      }

      const created = upsertItem(res.data)

      return { success: true, data: created }
    } catch (err) {
      handleError(err, 'creating social post')
      return { success: false, message: (err as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  async function updatePost(id: number, updates: Partial<SocialPostForm>) {
    isSaving.value = true

    try {
      const res = await performFetch<SocialPostWithTargets>(
        `/api/socials/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        },
      )

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to update social post')
      }

      const updated = upsertItem(res.data)

      return { success: true, data: updated }
    } catch (err) {
      handleError(err, 'updating social post')
      return { success: false, message: (err as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  async function deletePost(id: number) {
    try {
      const res = await performFetch(`/api/socials/${id}`, { method: 'DELETE' })
      if (res.success) {
        items.value = items.value.filter((i) => i.id !== id)
        if (selected.value?.id === id) deselect()
        syncToLocalStorage()
      } else {
        throw new Error(res.message)
      }
    } catch (err) {
      handleError(err, 'deleting social post')
    }
  }

  // Dispatch automatable platforms. dryRun returns variants without sending.
  async function publish(
    id: number,
    opts: { platforms?: SocialPlatform[]; dryRun?: boolean } = {},
  ) {
    isPublishing.value = true
    try {
      const res = await performFetch(`/api/socials/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      })
      if (!res.success) throw new Error(res.message)
      // Refresh the post so target statuses reflect the dispatch.
      const refreshed = await fetchById(id)
      if (refreshed) upsertItem(refreshed)
      return { success: true, data: res.data }
    } catch (err) {
      handleError(err, 'publishing social post')
      return { success: false, message: (err as Error).message }
    } finally {
      isPublishing.value = false
    }
  }

  async function markTargetCopied(postId: number, platform: SocialPlatform) {
    try {
      const res = await performFetch<SocialPostWithTargets>(
        `/api/socials/${postId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetUpdate: { platform, status: 'COPIED' },
          }),
        },
      )

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to mark target copied')
      }

      upsertItem(res.data)

      return { success: true }
    } catch (err) {
      handleError(err, 'marking target copied')
      return { success: false, message: (err as Error).message }
    }
  }

  function select(id: number) {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      selected.value = item
      form.value = {
        ...blankForm(),
        ...item,
        media: Array.isArray(item.mediaUrls)
          ? (item.mediaUrls as unknown as SocialMedia[])
          : [],
        platforms: (item.targets ?? []).map((t) => t.platform),
      }
    }
  }

  function deselect() {
    selected.value = null
    form.value = blankForm()
  }

  function startNew() {
    selected.value = null
    form.value = blankForm()
    syncToLocalStorage()
  }

  // Pre-fill the composer from an existing generation / dream / devlog.
  // Wire a "Share" button anywhere on the site to call this, then open the
  // giftshop social tab. The form is staged but NOT saved — user reviews first.
  function draftFromSource(input: DraftFromSourceInput) {
    selected.value = null
    form.value = {
      ...blankForm(),
      title: input.title ?? '',
      body: input.body ?? '',
      url: input.url ?? '',
      media: input.media ?? [],
      hashtags: input.hashtags ?? [],
      audience: input.audience ?? ('SOCIAL' as PostAudience),
      platforms: input.platforms ?? [],
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? null,
    }
    syncToLocalStorage()
    return form.value
  }

  async function save() {
    if (!form.value) return { success: false, message: 'No form loaded.' }
    isSaving.value = true
    try {
      if ('id' in form.value && form.value.id) {
        return await updatePost(form.value.id, form.value)
      }
      return await addPost(form.value)
    } catch (err) {
      handleError(err, 'saving social post')
      return { success: false, message: (err as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  return {
    items,
    selected,
    form,
    isSaving,
    isPublishing,
    isInitialized,
    loading,
    error,
    ownedItems,
    variants,
    initialize,
    fetchAll,
    fetchById,
    addPost,
    updatePost,
    deletePost,
    publish,
    markTargetCopied,
    select,
    deselect,
    startNew,
    draftFromSource,
    save,
    syncToLocalStorage,
  }
})

export type { SocialPost, SocialTarget, SocialPlatform, PostAudience }
