import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch } from '~/stores/utils'
import {
  CHARACTER_MODELS,
  type MonstriqueCharacterId,
} from '~/utils/monstrique/characterModels'
import type { BibleArtKind, LoraStatus } from '~/utils/monstrique/bibleLanes'

export interface BibleGalleryItem {
  jobId: number
  kind: string
  lane: string
  status: string
  artImageId: number | null
  imagePath: string | null
}

export interface BibleCharacter {
  key: MonstriqueCharacterId
  displayName: string | null
  notes: string
  loraStatus: LoraStatus
  loraResourceName: string | null
  heroArtImageId: number | null
  heroImagePath: string | null
  gallery: BibleGalleryItem[]
}

export const useMonstriqueBibleStore = defineStore('monstriqueBible', () => {
  const characters = ref<BibleCharacter[]>([])
  const selectedKey = ref<MonstriqueCharacterId>('iris')
  const loading = ref(false)
  const saving = ref(false)
  const message = ref('')

  const selected = computed(
    () =>
      characters.value.find((entry) => entry.key === selectedKey.value) ?? null,
  )

  function nameOf(key: MonstriqueCharacterId): string {
    return (
      characters.value.find((entry) => entry.key === key)?.displayName ||
      CHARACTER_MODELS[key].name
    )
  }

  function coverOf(key: MonstriqueCharacterId): string | null {
    const character = characters.value.find((item) => item.key === key)
    if (!character) return null
    return (
      character.heroImagePath ??
      character.gallery.find((item) => item.imagePath)?.imagePath ??
      null
    )
  }

  async function load(): Promise<void> {
    loading.value = true
    try {
      const response = await performFetch<{ characters: BibleCharacter[] }>(
        '/api/monstrique/bible',
        {},
        1,
        30000,
      )
      if (response.success && response.data)
        characters.value = response.data.characters
      else message.value = response.message || 'The bible did not load.'
    } finally {
      loading.value = false
    }
  }

  async function save(
    key: MonstriqueCharacterId,
    patch: Partial<
      Pick<
        BibleCharacter,
        | 'displayName'
        | 'notes'
        | 'loraStatus'
        | 'loraResourceName'
        | 'heroArtImageId'
      >
    >,
  ): Promise<boolean> {
    saving.value = true
    try {
      const response = await performFetch(`/api/monstrique/bible/${key}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      if (!response.success) {
        message.value = response.message || 'Save failed.'
        return false
      }
      const entry = characters.value.find((item) => item.key === key)
      if (entry) Object.assign(entry, patch)
      if (entry && patch.heroArtImageId !== undefined)
        entry.heroImagePath =
          entry.gallery.find((item) => item.artImageId === patch.heroArtImageId)
            ?.imagePath ?? null
      message.value = 'Saved.'
      return true
    } finally {
      saving.value = false
    }
  }

  async function requestArt(
    key: MonstriqueCharacterId,
    kind: BibleArtKind,
    lanes: string[],
  ): Promise<boolean> {
    saving.value = true
    try {
      const response = await performFetch<{ queued: unknown[] }>(
        `/api/monstrique/bible/${key}/request`,
        { method: 'POST', body: JSON.stringify({ kind, lanes }) },
        1,
        60000,
      )
      message.value =
        response.message ||
        (response.success ? 'Queued.' : 'The request failed.')
      if (response.success) await load()
      return response.success
    } finally {
      saving.value = false
    }
  }

  return {
    characters,
    selectedKey,
    selected,
    loading,
    saving,
    message,
    nameOf,
    coverOf,
    load,
    save,
    requestArt,
  }
})
