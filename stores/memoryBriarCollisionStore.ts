import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useMemoryWorldStore } from './memoryWorldStore'
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
import { BRIAR_COLLISION_SCENES } from '~/utils/memoryDungeon/briarCollision'
import { availableMemoryExperiences } from '~/utils/memoryDungeon/reimaginerCampaign'

const STORAGE_KEY = 'memory-dungeon-briar-collision-e09-v1'

export const useMemoryBriarCollisionStore = defineStore(
  'memoryBriarCollision',
  () => {
    const world = useMemoryWorldStore()
    const journal = ref<EarthJournalAction[]>([])
    const hydrated = ref(false)
    const notice = ref('')
    const replay = computed(
      () =>
        replayEarthJournal('e09', journal.value) ?? {
          progress: newOverworldEventProgress('e09'),
          position: '1,1',
        },
    )
    const progress = computed(() => replay.value.progress)
    const position = computed(() => replay.value.position)
    const current = computed(() => worldEvent('e09', position.value))
    const chosen = computed(() =>
      current.value?.choices.find(
        (choice) => choice.id === progress.value.choices[position.value],
      ),
    )
    const completed = computed(() => world.campaign.completed.includes('e09'))
    const unlocked = computed(
      () =>
        completed.value ||
        availableMemoryExperiences(world.campaign).includes('e09'),
    )
    const committed = computed(() => world.campaign.finaleCommitted)
    const fragments = computed(
      () =>
        Object.entries(BRIAR_COLLISION_SCENES).filter(([key, scene]) =>
          scene.choices.some(
            (choice) => choice.id === progress.value.choices[key],
          ),
        ).length,
    )
    const readyToLeave = computed(
      () =>
        committed.value &&
        fragments.value === 2 &&
        Object.keys(progress.value.choices).length >= 12,
    )
    const tiles = computed(() =>
      worldEvents('e09').map((event) => ({
        key: event.key,
        title: event.title,
        kind: event.kind,
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
              ? replayEarthJournal('e09', candidate.journal)
              : null
          if (recovered) {
            journal.value = candidate.journal as EarthJournalAction[]
          } else {
            notice.value =
              'The forest rejected an altered travel record. A fresh route is ready.'
          }
        }
      } catch {
        notice.value = 'The collision route could not be read.'
      }
      if (committed.value && journal.value.length)
        world.syncBriarCollisionJournal(journal.value)
    }

    watch(
      () => [
        world.campaign.finaleCommitted,
        world.campaign.completed.join(','),
      ],
      () => {
        if (hydrated.value && committed.value && journal.value.length && !completed.value)
          world.syncBriarCollisionJournal(journal.value)
      },
    )

    function commit(): void {
      if (!unlocked.value || committed.value || completed.value) return
      if (world.commitBriarCollision()) {
        notice.value =
          'Pip takes the first step. No other world can make this decision for him.'
        persist()
      }
    }

    function ensureJournalRoom(): boolean {
      if (journal.value.length < EARTH_JOURNAL_COMPACT_AT) return true
      const compacted = compactEarthJournal('e09', journal.value)
      if (!compacted || compacted.length >= EARTH_JOURNAL_COMPACT_AT) {
        notice.value =
          'Your decisions are safe, but this route cannot be shortened yet.'
        return false
      }
      journal.value = compacted
      return true
    }

    function travel(key: string): void {
      if (!unlocked.value || !committed.value || completed.value) return
      if (
        key === position.value ||
        !eventNeighbors(position.value).includes(key) ||
        !worldEvent('e09', key) ||
        !ensureJournalRoom()
      )
        return
      journal.value = [...journal.value, { type: 'travel', key }]
      notice.value = ''
      persist()
    }

    function choose(choiceId: string): void {
      if (!unlocked.value || !committed.value || completed.value) return
      const next = chooseOverworldEvent(progress.value, position.value, choiceId)
      if (next === progress.value || !ensureJournalRoom()) return
      const updated: EarthJournalAction[] = [
        ...journal.value,
        { type: 'choose', key: position.value, choiceId },
      ]
      if (!world.syncBriarCollisionJournal(updated)) {
        notice.value = 'The encounter could not be recorded safely.'
        return
      }
      journal.value = updated
      notice.value =
        current.value?.choices.find((choice) => choice.id === choiceId)
          ?.outcome ?? ''
      persist()
    }

    function conclude(): void {
      if (!readyToLeave.value || completed.value) return
      if (world.finishBriarCollision(journal.value)) {
        notice.value =
          'Pip has recovered both displaced memories. The next crossing remembers his choices.'
        persist()
      }
    }

    return {
      journal,
      hydrated,
      notice,
      progress,
      position,
      current,
      chosen,
      completed,
      unlocked,
      committed,
      fragments,
      readyToLeave,
      tiles,
      hydrate,
      commit,
      travel,
      choose,
      conclude,
    }
  },
)
