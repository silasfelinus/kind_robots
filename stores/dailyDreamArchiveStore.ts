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

export const useDailyDreamArchiveStore = defineStore(
  'daily-dream-archive',
  () => {
    const dreams = ref<DailyDreamArchiveEntry[]>([])
    const loading = ref(false)
    const loaded = ref(false)
    const lastError = ref('')

    async function fetchArchive(force = false): Promise<boolean> {
      if (loading.value) return false
      if (loaded.value && !force) return true

      loading.value = true
      lastError.value = ''

      try {
        const response = await performFetch<DailyDreamArchiveEntry[]>(
          '/api/dreams/daily-archive',
          {},
          2,
          30_000,
        )

        if (!response.success || !Array.isArray(response.data)) {
          lastError.value = response.message || 'Daily Dream archive could not be loaded.'
          return false
        }

        dreams.value = response.data
        loaded.value = true
        return true
      } finally {
        loading.value = false
      }
    }

    return {
      dreams,
      loading,
      loaded,
      lastError,
      fetchArchive,
    }
  },
)
