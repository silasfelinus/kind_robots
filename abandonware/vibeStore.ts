// /stores/vibeStore.ts
import { defineStore } from 'pinia'
import { useUserStore } from '@/stores/userStore'

export enum PitchTypeLocal {
  VIBE = 'VIBE',
}

export interface ApiPitch {
  id: number
  title?: string | null
  pitch?: string | null
  description?: string | null
  flavorText?: string | null
  highlightImage?: string | null
  imagePrompt?: string | null
  examples?: string | null
  designer?: string | null
  isPublic?: boolean | null
  isMature?: boolean | null
  userId?: number | null
  artImageId?: number | null
  icon?: string | null
  [k: string]: unknown
}

interface DataWrapper<T> {
  data: T
}

export interface VibeDef {
  id?: number
  title: string
  slug: string
  description?: string
  flavorText?: string | null
  highlightImage?: string | null
  imagePrompt?: string | null
  examples?: string | null
  designer?: string | null
  isPublic?: boolean
  isMature?: boolean
  userId?: number | null
  artImageId?: number | null
  icon?: string | null
}

export interface UserVibe {
  title: string
  slug: string
}

interface VibeState {
  vibes: VibeDef[]
  loading: boolean
  saving: boolean
  error: string | null
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null
}

function hasData<T>(x: unknown): x is DataWrapper<T> {
  return isRecord(x) && 'data' in x
}

function unwrap<T>(res: T | DataWrapper<T>): T {
  return hasData<T>(res as unknown) ? (res as DataWrapper<T>).data : (res as T)
}

interface CreatePitchBody {
  title: string
  pitch: string
  description: string
  isPublic: boolean
  PitchType: PitchTypeLocal
  userId: number
  designer: string
  icon: string | null
  artImageId: number | null
  flavorText: string | null
  highlightImage: string | null
  imagePrompt: string | null
  examples: string | null
  isMature: boolean
}

type UpdatePitchBody = Partial<
  Pick<
    CreatePitchBody,
    | 'title'
    | 'pitch'
    | 'description'
    | 'isPublic'
    | 'isMature'
    | 'icon'
    | 'artImageId'
    | 'flavorText'
    | 'highlightImage'
    | 'imagePrompt'
    | 'examples'
    | 'designer'
  >
>

type PatchUserBody = { vibes: UserVibe[] }

export const useVibeStore = defineStore('vibeStore', {
  state: (): VibeState => ({
    vibes: [],
    loading: false,
    saving: false,
    error: null,
  }),

  getters: {
    bySlug:
      (s) =>
      (slug: string): VibeDef | undefined =>
        s.vibes.find((v) => v.slug === slug),

    academyChoiceSlug: () => {
      const userStore = useUserStore()
      const raw = (userStore.user as { vibes?: unknown } | undefined)?.vibes

      try {
        if (Array.isArray(raw)) {
          return (raw[0] as UserVibe | undefined)?.slug ?? null
        }

        if (typeof raw === 'string') {
          const arr = JSON.parse(raw) as UserVibe[]
          return (arr[0] as UserVibe | undefined)?.slug ?? null
        }
      } catch {}

      return null
    },

    academyChoice: (s) => {
      const userStore = useUserStore()
      const raw = (userStore.user as { vibes?: unknown } | undefined)?.vibes
      let slug: string | null = null

      try {
        if (Array.isArray(raw)) {
          slug = (raw[0] as UserVibe | undefined)?.slug ?? null
        } else if (typeof raw === 'string') {
          const arr = JSON.parse(raw) as UserVibe[]
          slug = (arr[0] as UserVibe | undefined)?.slug ?? null
        }
      } catch {
        slug = null
      }

      return slug ? (s.vibes.find((v) => v.slug === slug) ?? null) : null
    },
  },

  actions: {
    toSlug(title: string): string {
      return (
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 64) || 'vibe'
      )
    },

    toVibeDef(p: Partial<ApiPitch> | undefined): VibeDef {
      const title = (p?.title ?? p?.pitch ?? 'untitled') as string

      return {
        id: p?.id,
        title,
        slug: this.toSlug(title),
        description: p?.description ?? p?.flavorText ?? '',
        flavorText: p?.flavorText ?? null,
        highlightImage: p?.highlightImage ?? null,
        imagePrompt: p?.imagePrompt ?? null,
        examples: p?.examples ?? null,
        designer: p?.designer ?? null,
        isPublic: typeof p?.isPublic === 'boolean' ? p.isPublic : true,
        isMature: typeof p?.isMature === 'boolean' ? p.isMature : false,
        userId: p?.userId ?? null,
        artImageId: p?.artImageId ?? null,
        icon: p?.icon ?? null,
      }
    },

    async fetchVibes(params?: { includePrivate?: boolean }): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const q: Record<string, string> = { type: PitchTypeLocal.VIBE }

        if (params?.includePrivate) {
          q.includePrivate = '1'
        }

        const res = await $fetch<ApiPitch[] | DataWrapper<ApiPitch[]>>(
          '/api/pitches',
          {
            method: 'GET',
            query: q,
          },
        )

        const arr = unwrap(res)
        this.vibes = (Array.isArray(arr) ? arr : []).map((p) =>
          this.toVibeDef(p),
        )
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to fetch vibes'
      } finally {
        this.loading = false
      }
    },

    async createVibe(input: {
      title: string
      description?: string
      isPublic?: boolean
      icon?: string | null
      artImageId?: number | null
      flavorText?: string | null
      highlightImage?: string | null
      imagePrompt?: string | null
      examples?: string | null
      isMature?: boolean
    }): Promise<ApiPitch> {
      this.saving = true
      this.error = null

      try {
        const userStore = useUserStore()
        const slug = this.toSlug(input.title)

        const body: CreatePitchBody = {
          title: input.title,
          pitch: input.title,
          description: input.description ?? '',
          isPublic: input.isPublic ?? true,
          PitchType: PitchTypeLocal.VIBE,
          userId: userStore.user?.id ?? 10,
          designer: userStore.user?.designerName ?? 'kind-designer',
          icon: input.icon ?? null,
          artImageId: input.artImageId ?? null,
          flavorText: input.flavorText ?? null,
          highlightImage: input.highlightImage ?? null,
          imagePrompt: input.imagePrompt ?? null,
          examples: input.examples ?? null,
          isMature:
            typeof input.isMature === 'boolean' ? input.isMature : false,
        }

        const res = await $fetch<ApiPitch | DataWrapper<ApiPitch>>(
          '/api/pitches',
          {
            method: 'POST',
            body,
          },
        )

        const created = unwrap(res)
        const v = this.toVibeDef(
          created?.id ? created : (body as unknown as ApiPitch),
        )

        v.id = created?.id ?? v.id
        v.slug = slug
        this.vibes.unshift(v)

        return created
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to create vibe'
        throw e
      } finally {
        this.saving = false
      }
    },

    async updateVibe(
      id: number,
      updates: Partial<VibeDef>,
    ): Promise<ApiPitch | unknown> {
      this.saving = true
      this.error = null

      try {
        const body: UpdatePitchBody = {
          ...(updates.title
            ? { title: updates.title, pitch: updates.title }
            : {}),
          ...(typeof updates.description === 'string'
            ? { description: updates.description }
            : {}),
          ...(typeof updates.isPublic === 'boolean'
            ? { isPublic: updates.isPublic }
            : {}),
          ...(typeof updates.isMature === 'boolean'
            ? { isMature: updates.isMature }
            : {}),
          ...(updates.icon !== undefined ? { icon: updates.icon } : {}),
          ...(updates.artImageId !== undefined
            ? { artImageId: updates.artImageId }
            : {}),
          ...(updates.flavorText !== undefined
            ? { flavorText: updates.flavorText }
            : {}),
          ...(updates.highlightImage !== undefined
            ? { highlightImage: updates.highlightImage }
            : {}),
          ...(updates.imagePrompt !== undefined
            ? { imagePrompt: updates.imagePrompt }
            : {}),
          ...(updates.examples !== undefined
            ? { examples: updates.examples }
            : {}),
          ...(updates.designer !== undefined
            ? { designer: updates.designer ?? undefined }
            : {}),
        }

        const res = await $fetch<ApiPitch | DataWrapper<ApiPitch>>(
          `/api/pitches/${id}`,
          {
            method: 'PATCH',
            body,
          },
        )

        const updated = unwrap(res)
        const i = this.vibes.findIndex((v) => v.id === id)

        if (i >= 0) {
          const current = this.vibes[i]

          if (!current) {
            return updated
          }

          const nextTitle = body.title ?? current.title

          this.vibes[i] = {
            ...current,
            ...updates,
            title: nextTitle,
            slug: updates.title ? this.toSlug(nextTitle) : current.slug,
          }
        }

        return updated
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to update vibe'
        throw e
      } finally {
        this.saving = false
      }
    },

    async deleteVibe(id: number): Promise<void> {
      this.saving = true
      this.error = null

      try {
        await $fetch<unknown>(`/api/pitches/${id}`, { method: 'DELETE' })
        this.vibes = this.vibes.filter((v) => v.id !== id)
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to delete vibe'
        throw e
      } finally {
        this.saving = false
      }
    },

    getUserVibes(): UserVibe[] {
      const userStore = useUserStore()
      const raw = (userStore.user as { vibes?: unknown } | undefined)?.vibes

      if (!raw) return []

      try {
        if (Array.isArray(raw)) {
          return raw as UserVibe[]
        }

        if (typeof raw === 'string') {
          return JSON.parse(raw) as UserVibe[]
        }

        return []
      } catch {
        return []
      }
    },

    async addVibeToUser(slug: string): Promise<UserVibe[]> {
      const v = this.bySlug(slug)

      if (!v) {
        throw new Error('Unknown vibe')
      }

      const current: UserVibe[] = this.getUserVibes() ?? []

      if (current.some((x) => x.slug === slug)) {
        return current
      }

      const next: UserVibe[] = [...current, { title: v.title, slug: v.slug }]
      await this.patchUserVibes(next)

      return next
    },

    async removeVibeFromUser(slug: string): Promise<UserVibe[]> {
      const current: UserVibe[] = this.getUserVibes() ?? []
      const next: UserVibe[] = current.filter((x) => x.slug !== slug)

      await this.patchUserVibes(next)

      return next
    },

    async setAcademyChoice(slug: string | null): Promise<void> {
      if (!slug) {
        await this.patchUserVibes([])
        return
      }

      const v = this.bySlug(slug)

      if (!v) {
        throw new Error('Unknown vibe')
      }

      const current: UserVibe[] = this.getUserVibes().filter(
        (x) => x.slug !== slug,
      )
      const next: UserVibe[] = [{ title: v.title, slug: v.slug }, ...current]

      await this.patchUserVibes(next)
    },

    async patchUserVibes(vibes: UserVibe[]): Promise<unknown> {
      const userStore = useUserStore()
      const userId = userStore.user?.id

      if (!userId) {
        throw new Error('No active user')
      }

      this.saving = true
      this.error = null

      try {
        const res = await $fetch<unknown | DataWrapper<{ vibes?: UserVibe[] }>>(
          `/api/users/${userId}`,
          {
            method: 'PATCH',
            body: { vibes } satisfies PatchUserBody,
          },
        )

        const updated = unwrap(res)

        const nextVibes =
          isRecord(updated) &&
          Array.isArray((updated as { vibes?: unknown }).vibes)
            ? ((updated as { vibes?: UserVibe[] }).vibes ?? [])
            : vibes

        if (userStore.user) {
          ;(userStore.user as { vibes?: string | null }).vibes =
            JSON.stringify(nextVibes)
        }

        return updated
      } catch (e) {
        this.error =
          e instanceof Error ? e.message : 'Failed to update user vibes'
        throw e
      } finally {
        this.saving = false
      }
    },
  },
})
