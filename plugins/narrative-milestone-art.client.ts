// /plugins/narrative-milestone-art.client.ts
//
// Taskmaster's half of this plugin was removed on 2026-09-14 (storybook/t-047)
// when /taskmaster retired into Storybook's `taskmaster` MODE. It watched
// stores/taskmasterStore.ts's client-held beat list and wrote art back into a
// `taskmaster-session` localStorage blob; a taskmaster quest is a server-side
// run now (server/utils/storybookQuest.ts), so there is no browser-held session
// for this plugin to watch and nothing for it to persist.
//
// The Storybook half below is still the old client beat loop and is scheduled
// for the same treatment by storybook/t-037, which retires that loop and the
// localStorage library together. Left intact deliberately -- removing it here
// would break the storymaker's art on a task that is about the taskmaster
// route.
import { watch } from 'vue'
import { createNarrativeArtJobsController } from '@/stores/helpers/narrativeArtJobsHelper'
import {
  useStorybookStore,
  type StorybookBeat,
  type StorybookIngredient,
} from '@/stores/storybookStore'
import type { NarrativeArtJobState } from '@/utils/narrativeArtJobs'
import { selectStorybookArtMilestone } from '@/utils/narrativeArtMilestones'

const STORYBOOK_STORAGE_KEY = 'storybook-session'

function nowIso(): string {
  return new Date().toISOString()
}

function describeIngredient(ingredient: StorybookIngredient): string {
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
  const storyStore = useStorybookStore()
  const artJobs = createNarrativeArtJobsController()
  const seenStoryBeats = new Map<string, Set<string>>()

  function updateStoryArt(beatId: string, art: NarrativeArtJobState): void {
    const active = storyStore.session
    const beat = active?.beats.find((entry) => entry.id === beatId)
    if (!active || !beat) return
    beat.art = art
    active.updatedAt = nowIso()
    persistSession(STORYBOOK_STORAGE_KEY, active)
  }

  function requestStoryArt(beat: StorybookBeat): void {
    const active = storyStore.session
    if (!active) return
    const moment = selectStorybookArtMilestone(active, beat)
    if (!moment) return

    void artJobs.enqueue(
      {
        product: 'storybook',
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

  watch(
    () =>
      `${storyStore.session?.id || ''}:${storyStore.session?.beats
        .map((beat) => beat.id)
        .join(',') || ''}`,
    scanStoryBeats,
    { flush: 'post' },
  )
})
