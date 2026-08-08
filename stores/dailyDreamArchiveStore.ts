import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  ArtCollection,
  ArtImage,
  Bot,
  Character,
  Dream,
  DreamRelation,
  PitchSheet,
  Reward,
  Scenario,
} from '~/prisma/generated/prisma/client'
import { performFetch } from '@/stores/utils'
import {
  artContextRules,
  artSlotFraming,
} from '~/utils/entityArtPromptFraming'

export type DailyDreamArchiveArt = Pick<
  ArtImage,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'fileName'
  | 'fileType'
  | 'path'
  | 'imagePath'
  | 'thumbnailPath'
  | 'cardPath'
  | 'heroPath'
  | 'iconPath'
  | 'artPrompt'
  | 'promptString'
  | 'userId'
  | 'isPublic'
  | 'isMature'
>

export type DailyDreamArchiveCollection = Pick<
  ArtCollection,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'label'
  | 'description'
  | 'imagePath'
  | 'isPublic'
  | 'isMature'
  | 'isActive'
  | 'artPrompt'
> & {
  ArtImages: DailyDreamArchiveArt[]
}

export type DailyDreamRelatedDream = Dream & {
  PitchSheet: PitchSheet | null
  ArtImage: DailyDreamArchiveArt | null
  ArtImages: DailyDreamArchiveArt[]
  ArtCollection: DailyDreamArchiveCollection | null
  ArtCollections: DailyDreamArchiveCollection[]
}

export type DailyDreamArchiveEntry = Dream & {
  PitchSheet: PitchSheet | null
  ArtImage: DailyDreamArchiveArt | null
  ArtImages: DailyDreamArchiveArt[]
  ArtCollection: DailyDreamArchiveCollection | null
  ArtCollections: DailyDreamArchiveCollection[]
  Characters: Character[]
  Rewards: Reward[]
  Scenarios: Scenario[]
  Bots: Bot[]
  RelationsFrom: Array<
    DreamRelation & {
      ToDream: DailyDreamRelatedDream
    }
  >
  RelationsTo: Array<
    DreamRelation & {
      FromDream: DailyDreamRelatedDream
    }
  >
}

export type DailyDreamArchiveObjectType =
  | 'dream'
  | 'character'
  | 'reward'
  | 'scenario'
  | 'bot'

export type DailyDreamArchiveObject = Record<string, unknown> & {
  id: number
  userId?: number | null
  artImageId?: number | null
  title?: string | null
  name?: string | null
  slug?: string | null
  artPrompt?: string | null
  designer?: string | null
  isPublic?: boolean | null
  isMature?: boolean | null
  imagePath?: string | null
  avatarImage?: string | null
  iconPath?: string | null
  cardPath?: string | null
  heroPath?: string | null
  ArtImage?: DailyDreamArchiveArt | null
  ArtImages?: DailyDreamArchiveArt[]
}

export type DailyDreamArtSlot = {
  field: string
  label: string
  width: number
  height: number
  aspect: string
}

export type DailyDreamArtQueueInput = {
  objectType: DailyDreamArchiveObjectType
  entity: DailyDreamArchiveObject
  slot: DailyDreamArtSlot
  prompt: string
  mode: 'recreate' | 'img2img'
  engine: string
  preserveOriginal: boolean
  denoise?: number
  originalWeight?: number
  steps?: number
}

type ArtQueueResult = {
  jobId: number
  status: string
}

type ArtQueueJob = {
  id: number
  status: string
  artImageId?: number | null
  error?: string | null
}

type MutationResult = {
  success: boolean
  message: string
  data: DailyDreamArchiveObject | null
}

const endpointByType: Record<DailyDreamArchiveObjectType, string> = {
  dream: 'dreams',
  character: 'characters',
  reward: 'rewards',
  scenario: 'scenarios',
  bot: 'bots',
}

function asObject(value: unknown): DailyDreamArchiveObject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const id = Number((value as { id?: unknown }).id)
  if (!Number.isInteger(id) || id <= 0) return null
  return value as DailyDreamArchiveObject
}

function artImageIdFromPath(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const id = Number(value.match(/\/api\/art\/images\/(\d+)\/file/)?.[1])
  return Number.isInteger(id) && id > 0 ? id : null
}

function normalizeImageSource(value: unknown): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed || trimmed.toLowerCase() === 'undefined') return ''
  if (/^(https?:|data:image\/|\/)/.test(trimmed)) return trimmed
  if (trimmed.startsWith('images/')) return `/${trimmed}`
  return `/images/${trimmed}`
}

async function imageSourceToDataUri(source: string): Promise<string> {
  if (source.startsWith('data:image/')) return source

  const response = await fetch(source)
  if (!response.ok) {
    throw new Error(`Current image could not be loaded (${response.status}).`)
  }

  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Current image could not be read.'))
    reader.readAsDataURL(blob)
  })
}

function dreamArtPrompt(
  entity: DailyDreamArchiveObject,
  slot: DailyDreamArtSlot,
  prompt: string,
): string {
  const context = [
    ['Title', entity.title],
    ['Dream type', entity.dreamType],
    ['Description', entity.description],
    ['Pitch', entity.pitch],
    ['Flavor text', entity.flavorText],
    ['Examples', entity.examples],
    ['Existing art prompt', entity.artPrompt],
  ].flatMap(([label, value]) => {
    const text = typeof value === 'string' ? value.trim() : ''
    return text ? [`${label}: ${text}`] : []
  })

  return [
    prompt.trim(),
    '',
    // Shape, not slot name: "the card artwork" made Krea 2 draw a literal
    // trading card. See utils/entityArtPromptFraming.ts.
    `Compose this as ${artSlotFraming(slot)} for the following dream.`,
    ...context,
    '',
    ...artContextRules('dream'),
  ].join('\n')
}

export const useDailyDreamArchiveStore = defineStore(
  'daily-dream-archive',
  () => {
    const dreams = ref<DailyDreamArchiveEntry[]>([])
    const loading = ref(false)
    const loaded = ref(false)
    const lastError = ref('')

    function mergeObject(
      objectType: DailyDreamArchiveObjectType,
      objectId: number,
      update: DailyDreamArchiveObject,
    ): void {
      for (const dream of dreams.value) {
        if (objectType === 'dream' && dream.id === objectId) {
          Object.assign(dream, update)
        }

        if (objectType === 'dream') {
          for (const relation of dream.RelationsFrom) {
            if (relation.ToDream.id === objectId) {
              Object.assign(relation.ToDream, update)
            }
          }
          for (const relation of dream.RelationsTo) {
            if (relation.FromDream.id === objectId) {
              Object.assign(relation.FromDream, update)
            }
          }
        }

        const collections: Partial<
          Record<DailyDreamArchiveObjectType, DailyDreamArchiveObject[]>
        > = {
          character: dream.Characters as unknown as DailyDreamArchiveObject[],
          reward: dream.Rewards as unknown as DailyDreamArchiveObject[],
          scenario: dream.Scenarios as unknown as DailyDreamArchiveObject[],
          bot: dream.Bots as unknown as DailyDreamArchiveObject[],
        }
        const found = collections[objectType]?.find((item) => item.id === objectId)
        if (found) Object.assign(found, update)
      }
    }

    function findObject(
      objectType: DailyDreamArchiveObjectType,
      objectId: number,
    ): DailyDreamArchiveObject | null {
      for (const dream of dreams.value) {
        if (objectType === 'dream' && dream.id === objectId) {
          return dream as unknown as DailyDreamArchiveObject
        }
        if (objectType === 'dream') {
          const related = [
            ...dream.RelationsFrom.map((relation) => relation.ToDream),
            ...dream.RelationsTo.map((relation) => relation.FromDream),
          ].find((item) => item.id === objectId)
          if (related) return related as unknown as DailyDreamArchiveObject
        }

        const collections: Partial<
          Record<DailyDreamArchiveObjectType, DailyDreamArchiveObject[]>
        > = {
          character: dream.Characters as unknown as DailyDreamArchiveObject[],
          reward: dream.Rewards as unknown as DailyDreamArchiveObject[],
          scenario: dream.Scenarios as unknown as DailyDreamArchiveObject[],
          bot: dream.Bots as unknown as DailyDreamArchiveObject[],
        }
        const found = collections[objectType]?.find((item) => item.id === objectId)
        if (found) return found
      }
      return null
    }

    async function fetchArchive(force = false): Promise<boolean> {
      if (loading.value) return false
      if (loaded.value && !force) return true

      loading.value = true
      lastError.value = ''

      try {
        const response = await performFetch<DailyDreamArchiveEntry[]>(
          '/api/dreams/daily-archive',
          force ? { cache: 'no-store' } : {},
          2,
          30_000,
        )

        if (!response.success || !Array.isArray(response.data)) {
          lastError.value =
            response.message || 'Daily Dream archive could not be loaded.'
          return false
        }

        dreams.value = response.data
        loaded.value = true
        return true
      } catch (error) {
        lastError.value =
          error instanceof Error
            ? error.message
            : 'Daily Dream archive could not be loaded.'
        return false
      } finally {
        loading.value = false
      }
    }

    async function updateObject(
      objectType: DailyDreamArchiveObjectType,
      objectId: number,
      patch: Record<string, unknown>,
    ): Promise<MutationResult> {
      try {
        const response = await performFetch<DailyDreamArchiveObject>(
          `/api/${endpointByType[objectType]}/${objectId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
          },
          1,
          30_000,
        )
        const data = asObject(response.data)

        if (!response.success || !data) {
          return {
            success: false,
            message: response.message || 'The object could not be updated.',
            data: null,
          }
        }

        mergeObject(objectType, objectId, data)
        return {
          success: true,
          message: response.message || 'Object updated.',
          data,
        }
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'The object could not be updated.',
          data: null,
        }
      }
    }

    async function queueObjectArt(
      input: DailyDreamArtQueueInput,
    ): Promise<{ success: boolean; message: string; jobId: number | null }> {
      try {
        const directSource = normalizeImageSource(input.entity[input.slot.field])
        const nestedSource = normalizeImageSource(
          input.entity.ArtImage?.imagePath || input.entity.ArtImage?.path,
        )
        const primarySource = input.entity.artImageId
          ? `/api/art/images/${input.entity.artImageId}/file`
          : input.entity.ArtImage?.id
            ? `/api/art/images/${input.entity.ArtImage.id}/file`
            : ''
        const source = directSource || nestedSource || primarySource
        const sourceImageBase64 =
          input.objectType === 'dream' && input.mode === 'img2img'
            ? await imageSourceToDataUri(source)
            : undefined

        const response = await performFetch<ArtQueueResult>(
          '/api/art/enqueue',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              engine: input.engine,
              promptString:
                input.objectType === 'dream'
                  ? dreamArtPrompt(input.entity, input.slot, input.prompt)
                  : input.prompt.trim(),
              width: input.slot.width,
              height: input.slot.height,
              isPublic: input.entity.isPublic ?? true,
              isMature: input.entity.isMature ?? false,
              designer: input.entity.designer || null,
              priority: 100,
              ...(input.steps ? { steps: input.steps } : {}),
              ...(input.denoise != null ? { denoise: input.denoise } : {}),
              ...(input.originalWeight != null
                ? { originalWeight: input.originalWeight }
                : {}),
              ...(sourceImageBase64 ? { sourceImageBase64 } : {}),
              ...(input.objectType === 'dream'
                ? {}
                : {
                    entityArt: {
                      entityType: input.objectType,
                      entityId: input.entity.id,
                      field: input.slot.field,
                      preserveOriginal: input.preserveOriginal,
                      mode: input.mode,
                    },
                  }),
            }),
          },
          1,
          30_000,
        )
        const jobId = Number(response.data?.jobId)

        if (!response.success || !Number.isInteger(jobId) || jobId <= 0) {
          return {
            success: false,
            message: response.message || 'Art generation could not be queued.',
            jobId: null,
          }
        }

        return {
          success: true,
          message: `Queued as ArtJob ${jobId}.`,
          jobId,
        }
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Art generation could not be queued.',
          jobId: null,
        }
      }
    }

    async function fetchArtJob(
      jobId: number,
    ): Promise<{ success: boolean; message: string; job: ArtQueueJob | null }> {
      try {
        const response = await performFetch<{ job: ArtQueueJob }>(
          `/api/art/queue/${jobId}`,
          { cache: 'no-store' },
        )
        return {
          success: response.success,
          message: response.message || '',
          job: response.data?.job || null,
        }
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Queue check failed.',
          job: null,
        }
      }
    }

    async function applyDreamArt(input: {
      entity: DailyDreamArchiveObject
      slot: DailyDreamArtSlot
      artImageId: number
      prompt: string
      preserveOriginal: boolean
    }): Promise<MutationResult> {
      const currentIds = new Set<number>()
      for (const image of input.entity.ArtImages || []) {
        if (Number.isInteger(image.id) && image.id > 0) currentIds.add(image.id)
      }
      if (input.entity.ArtImage?.id) currentIds.add(input.entity.ArtImage.id)
      if (input.entity.artImageId) currentIds.add(input.entity.artImageId)
      const previousSlotId = artImageIdFromPath(input.entity[input.slot.field])
      if (previousSlotId) currentIds.add(previousSlotId)
      currentIds.add(input.artImageId)

      const imagePath = `/api/art/images/${input.artImageId}/file?v=${Date.now()}`
      const patch: Record<string, unknown> = {
        [input.slot.field]: imagePath,
        artPrompt: input.prompt.trim(),
      }

      if (input.slot.field === 'imagePath') {
        patch.artImageId = input.artImageId
      }
      if (input.preserveOriginal) {
        patch.artImageIds = Array.from(currentIds)
      }

      const result = await updateObject('dream', input.entity.id, patch)
      if (result.success) {
        await fetchArchive(true)
        const refreshed = findObject('dream', input.entity.id)
        if (refreshed) Object.assign(input.entity, refreshed)
      }
      return result
    }

    return {
      dreams,
      loading,
      loaded,
      lastError,
      fetchArchive,
      findObject,
      updateObject,
      queueObjectArt,
      fetchArtJob,
      applyDreamArt,
    }
  },
)
