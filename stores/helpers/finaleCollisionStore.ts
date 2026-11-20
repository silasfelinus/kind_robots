import { computed, ref, watch } from 'vue'
import { useMemoryWorldStore } from '../memoryWorldStore'
import {
  chooseOverworldEvent,
  eventNeighbors,
  newOverworldEventProgress,
  worldEvent,
  worldEvents,
} from '~/utils/memoryDungeon/overworldEventCatalog'
import {
  compactEarthJournal,
  EARTH_JOURNAL_COMPACT_AT,
  replayEarthJournal,
  type EarthJournalAction,
} from '~/utils/memoryDungeon/earthJournal'
import {
  FINALE_CROSSING_SITE,
  FINALE_FRAGMENT_SITES,
  finaleCollisionUnlocked,
  finaleCrossingEarned,
  finaleFragmentsChosen,
  type FinaleWorld,
} from '~/utils/memoryDungeon/finaleCollision'
import {
  MEMORY_LAST_CHOICE,
  MEMORY_PAIR_ENDINGS,
  memoryCoreEnding,
  memoryEndingConsequences,
  type MemoryLastChoice,
} from '~/utils/memoryDungeon/reimaginerCampaign'

/** Shared setup for the e11 sea and e12 Hoshimori collision stores. */
export function finaleCollisionSetup(finale: FinaleWorld) {
  const STORAGE_KEY = `memory-dungeon-finale-collision-${finale}-v1`
  const world = useMemoryWorldStore()
  const journal = ref<EarthJournalAction[]>([])
  const hydrated = ref(false)
  const notice = ref('')
  const verdict = ref<string | null>(null)

  const replay = computed(
    () =>
      replayEarthJournal(finale, journal.value) ?? {
        progress: newOverworldEventProgress(finale),
        position: '1,1',
      },
  )
  const progress = computed(() => replay.value.progress)
  const position = computed(() => replay.value.position)
  const current = computed(() => worldEvent(finale, position.value))
  const chosen = computed(() =>
    current.value?.choices.find(
      (choice) => choice.id === progress.value.choices[position.value],
    ),
  )
  const completed = computed(() => world.campaign.completed.includes(finale))
  const unlocked = computed(() =>
    finaleCollisionUnlocked(world.campaign, finale),
  )
  const fragments = computed(() =>
    finaleFragmentsChosen(finale, progress.value.choices),
  )
  const crossingEarned = computed(() =>
    finaleCrossingEarned(finale, progress.value.choices),
  )
  const atCrossing = computed(
    () =>
      crossingEarned.value &&
      position.value === FINALE_CROSSING_SITE &&
      Boolean(progress.value.choices[FINALE_CROSSING_SITE]) &&
      !completed.value,
  )
  const verdictChoices = computed(() =>
    finale === 'e12'
      ? MEMORY_PAIR_ENDINGS.e12.map((choice) => ({
          id: choice.id,
          label: choice.label,
          hint: choice.publicResult,
        }))
      : [],
  )
  const lastChoices = computed(() =>
    MEMORY_LAST_CHOICE.map((choice) => ({
      id: choice.id,
      label: choice.label,
      hint: choice.consequence,
    })),
  )
  const ending = computed(() =>
    finale === 'e12' ? memoryCoreEnding(world.campaign) : null,
  )
  const endingConsequences = computed(() =>
    finale === 'e12' ? memoryEndingConsequences(world.campaign) : [],
  )
  const epilogue = computed(() =>
    finale === 'e12' && world.campaign.completed.includes('e12')
      ? (
          Object.keys(
            MEMORY_PAIR_ENDINGS,
          ) as (keyof typeof MEMORY_PAIR_ENDINGS)[]
        )
          .map((pair) =>
            MEMORY_PAIR_ENDINGS[pair].find(
              (choice) => choice.id === world.campaign.pairDecisions?.[pair],
            ),
          )
          .filter((choice) => Boolean(choice))
          .map((choice) => choice!.publicResult)
      : [],
  )
  const tiles = computed(() =>
    worldEvents(finale).map((event) => ({
      key: event.key,
      title: event.title,
      kind: event.kind,
      fragment: Boolean(FINALE_FRAGMENT_SITES[finale][event.key]),
      current: event.key === position.value,
      revealed: progress.value.revealed.includes(event.key),
      resolved: Boolean(progress.value.choices[event.key]),
      reachable:
        event.key === position.value ||
        eventNeighbors(position.value).includes(event.key),
    })),
  )

  function persist(): void {
    if (!import.meta.client || !hydrated.value) return
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 1, journal: journal.value }),
      )
    } catch {
      notice.value = 'The route is playable, but this browser cannot save it.'
    }
  }

  function hydrate(): void {
    if (hydrated.value) return
    hydrated.value = true
    if (!import.meta.client) return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const candidate = JSON.parse(raw) as {
          version?: number
          journal?: unknown
        }
        const recovered =
          candidate.version === 1
            ? replayEarthJournal(finale, candidate.journal)
            : null
        if (recovered) journal.value = candidate.journal as EarthJournalAction[]
        else
          notice.value =
            'The crossing rejected an altered travel record. A fresh route is ready.'
      }
    } catch {
      notice.value = 'The crossing route could not be read.'
    }
    if (unlocked.value && journal.value.length && !completed.value)
      world.syncFinaleCollisionJournal(finale, journal.value)
  }

  watch(
    () => world.campaign.completed.join(','),
    () => {
      if (
        hydrated.value &&
        unlocked.value &&
        journal.value.length &&
        !completed.value
      )
        world.syncFinaleCollisionJournal(finale, journal.value)
    },
  )

  function ensureJournalRoom(): boolean {
    if (journal.value.length < EARTH_JOURNAL_COMPACT_AT) return true
    const compacted = compactEarthJournal(finale, journal.value)
    if (!compacted || compacted.length >= EARTH_JOURNAL_COMPACT_AT) {
      notice.value =
        'Your decisions are safe, but this route cannot be shortened yet.'
      return false
    }
    journal.value = compacted
    return true
  }

  function travel(key: string): void {
    if (!unlocked.value || completed.value) return
    if (
      key === position.value ||
      !eventNeighbors(position.value).includes(key) ||
      !worldEvent(finale, key) ||
      !ensureJournalRoom()
    )
      return
    journal.value = [...journal.value, { type: 'travel', key }]
    notice.value = ''
    persist()
  }

  function choose(choiceId: string): void {
    if (!unlocked.value || completed.value) return
    const next = chooseOverworldEvent(progress.value, position.value, choiceId)
    if (next === progress.value || !ensureJournalRoom()) return
    const updated: EarthJournalAction[] = [
      ...journal.value,
      { type: 'choose', key: position.value, choiceId },
    ]
    if (!world.syncFinaleCollisionJournal(finale, updated)) {
      notice.value = 'The encounter could not be recorded safely.'
      return
    }
    journal.value = updated
    notice.value =
      current.value?.choices.find((choice) => choice.id === choiceId)
        ?.outcome ?? ''
    persist()
  }

  function chooseVerdict(choiceId: string): void {
    if (finale !== 'e12' || !atCrossing.value) return
    if (!MEMORY_PAIR_ENDINGS.e12.some((choice) => choice.id === choiceId))
      return
    verdict.value = choiceId
  }

  function conclude(last?: string): void {
    if (!atCrossing.value) return
    const decision =
      finale === 'e12'
        ? {
            verdict: verdict.value ?? undefined,
            last: last as MemoryLastChoice | undefined,
          }
        : {}
    if (!world.finishFinaleCollision(finale, journal.value, decision)) {
      notice.value =
        finale === 'e12'
          ? 'The Last Door needs a witnessed route, a verdict and a final choice.'
          : 'The crossing needs both displaced memories and a witnessed route.'
      return
    }
    notice.value = ''
    persist()
  }

  return {
    journal,
    hydrated,
    notice,
    verdict,
    progress,
    position,
    current,
    chosen,
    completed,
    unlocked,
    fragments,
    crossingEarned,
    atCrossing,
    verdictChoices,
    lastChoices,
    ending,
    endingConsequences,
    epilogue,
    tiles,
    hydrate,
    travel,
    choose,
    chooseVerdict,
    conclude,
  }
}
