// /plugins/narrative-milestone-art.client.ts
import { watch } from 'vue'
import { useNarrativeArtJobs } from '@/composables/useNarrativeArtJobs'
import {
  useStorymakerStore,
  type StorymakerBeat,
  type StorymakerIngredient,
} from '@/stores/storymakerStore'
import {
  useTaskmasterStore,
  type TaskmasterBeat,
  type TaskmasterIngredient,
} from '@/stores/taskmasterStore'
import type { NarrativeArtJobState } from '@/utils/narrativeArtJobs'
import {
  selectStorymakerArtMilestone,
  selectTaskmasterArtMilestone,
} from '@/utils/narrativeArtMilestones'

const STORYMAKER_STORAGE_KEY = 'storymaker-session'
const TASKMASTER_STORAGE_KEY = 'taskmaster-session'

function nowIso(): string {
  return new Date().toISOString()
}

function describeIngredient(
  ingredient: StorymakerIngredient | TaskmasterIngredient,
): string {
  return [ingredient.title, ingredient.description, ingredient.flavorText]
    .filter(Boolean)
    .join(' — ')
}

function persistSession(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Narrative text remains usable if private browsing or a quota blocks storage.
  }
}

export default defineNuxtPlugin(() => {
  const storyStore = useStorymakerStore()
  const taskStore = useTaskmasterStore()
  const artJobs = useNarrativeArtJobs()
  const seenStoryBeats = new Map<string, Set<string>>()
  const seenTaskBeats = new Map<string, Set<string>>()

  function updateStoryArt(beatId: string, art: NarrativeArtJobState): void {
    const active = storyStore.session
    const beat = active?.beats.find((entry) => entry.id === beatId)
    if (!active || !beat) return
    beat.art = art
    active.updatedAt = nowIso()
    persistSession(STORYMAKER_STORAGE_KEY, active)
  }

  function updateTaskArt(beatId: string, art: NarrativeArtJobState): void {
    const active = taskStore.session
    const beat = active?.beats.find((entry) => entry.id === beatId)
    if (!active || !beat) return
    beat.art = art
    active.updatedAt = nowIso()
    persistSession(TASKMASTER_STORAGE_KEY, active)
  }

  function requestStoryArt(beat: StorymakerBeat): void {
    const active = storyStore.session
    if (!active) return
    const moment = selectStorymakerArtMilestone(active, beat)
    if (!moment) return

    void artJobs.enqueue(
      {
        product: 'storymaker',
        sessionId: active.id,
        beatId: beat.id,
        moment,
        narrative: beat.narrative,
        title: active.bible.title,
        location: active.bible.location
          ? describeIngredient(active.bible.location)
          : null,
        cast: active.bible.cast.map(describeIngredient),
        facets: active.bible.facets.map(describeIngredient),
      },
      (art) => updateStoryArt(beat.id, art),
    )
  }

  function requestTaskArt(beat: TaskmasterBeat): void {
    const active = taskStore.session
    if (!active) return
    const moment = selectTaskmasterArtMilestone(active, beat)
    if (!moment) return

    void artJobs.enqueue(
      {
        product: 'taskmaster',
        sessionId: active.id,
        beatId: beat.id,
        moment,
        narrative: beat.narrative,
        title: active.seed.taskTitle || 'Taskmaster quest',
        objective: active.seed.taskTitle,
        location: active.location ? describeIngredient(active.location) : null,
        facets: [
          active.genre ? describeIngredient(active.genre) : '',
          ...active.seed.vibeTags,
        ].filter(Boolean),
      },
      (art) => updateTaskArt(beat.id, art),
    )
  }

  function scanStoryBeats(): void {
    const active = storyStore.session
    if (!active) return
    let seen = seenStoryBeats.get(active.id)
    if (!seen) {
      seen = new Set(active.beats.map((beat) => beat.id))
      seenStoryBeats.set(active.id, seen)
      return
    }

    for (const beat of active.beats) {
      if (seen.has(beat.id)) continue
      seen.add(beat.id)
      if (!beat.art) requestStoryArt(beat)
    }
  }

  function scanTaskBeats(): void {
    const active = taskStore.session
    if (!active) return
    let seen = seenTaskBeats.get(active.id)
    if (!seen) {
      seen = new Set(active.beats.map((beat) => beat.id))
      seenTaskBeats.set(active.id, seen)
      return
    }

    for (const beat of active.beats) {
      if (seen.has(beat.id)) continue
      seen.add(beat.id)
      if (!beat.art) requestTaskArt(beat)
    }
  }

  watch(
    () =>
      `${storyStore.session?.id || ''}:${storyStore.session?.beats
        .map((beat) => beat.id)
        .join(',') || ''}`,
    scanStoryBeats,
    { flush: 'post' },
  )
  watch(
    () =>
      `${taskStore.session?.id || ''}:${taskStore.session?.beats
        .map((beat) => beat.id)
        .join(',') || ''}`,
    scanTaskBeats,
    { flush: 'post' },
  )
})
