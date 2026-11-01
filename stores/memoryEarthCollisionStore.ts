import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useMemoryWorldStore } from './memoryWorldStore'
import { useMemoryHoshimoriStore } from './memoryHoshimoriStore'
import { useMemoryBriarCollisionStore } from './memoryBriarCollisionStore'
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
import { earthCollisionHistory } from '~/utils/memoryDungeon/earthCollisionProgress'
import {
  EARTH_CROSSROAD_CHOICES,
  EARTH_CROSSROAD_SCENE,
  earthCollisionCrossroadStory,
} from '~/utils/memoryDungeon/earthCollisionCrossroad'
import earthCollision from '~/utils/memoryDungeon/earthCollision.json'

const STORAGE_KEY = 'memory-dungeon-earth-collision-e10-v1'

export const useMemoryEarthCollisionStore = defineStore(
  'memoryEarthCollision',
  () => {
    const world = useMemoryWorldStore()
    const hoshimori = useMemoryHoshimoriStore()
    const briar = useMemoryBriarCollisionStore()
    const journal = ref<EarthJournalAction[]>([])
    const hydrated = ref(false)
    const notice = ref('')

    const replay = computed(
      () =>
        replayEarthJournal('e10', journal.value) ?? {
          progress: newOverworldEventProgress('e10'),
          position: '1,1',
        },
    )
    const progress = computed(() => replay.value.progress)
    const position = computed(() => replay.value.position)
    const current = computed(() => worldEvent('e10', position.value))
    const chosen = computed(() =>
      current.value?.choices.find(
        (choice) => choice.id === progress.value.choices[position.value],
      ),
    )
    const history = computed(() =>
      earthCollisionHistory(world.campaign, hoshimori.progress, briar.journal),
    )
    const completed = computed(() => world.campaign.completed.includes('e10'))
    const unlocked = computed(() => Boolean(history.value))
    const fragments = computed(
      () =>
        earthCollision.filter((scene) =>
          scene.choices.some(
            (choice) => choice.id === progress.value.choices[scene.key],
          ),
        ).length,
    )
    const crossroadEarned = computed(
      () =>
        fragments.value === 2 &&
        Object.keys(progress.value.choices).length >= 12,
    )
    const readyForCrossroad = computed(
      () =>
        crossroadEarned.value &&
        position.value === '8,8' &&
        !completed.value,
    )
    const crossroadStory = computed(() =>
      earthCollisionCrossroadStory(
        history.value,
        world.campaign.pairDecisions?.e10,
      ),
    )
    const tiles = computed(() =>
      worldEvents('e10').map((event) => ({
        key: event.key,
        title: event.title,
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
        notice.value =
          'The city route is playable, but this browser cannot save it.'
      }
    }

    function hydrate(): void {
      hoshimori.hydrate()
      briar.hydrate()
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
          const restored =
            candidate.version === 1
              ? replayEarthJournal('e10', candidate.journal)
              : null
          if (restored) {
            journal.value = candidate.journal as EarthJournalAction[]
          } else {
            notice.value =
              'The city rejected an altered route. Your earlier campaign is intact.'
          }
        }
      } catch {
        notice.value = 'The city route could not be read.'
      }
      if (unlocked.value && !completed.value && journal.value.length)
        world.syncEarthCollisionJournal(
          journal.value,
          hoshimori.progress,
          briar.journal,
        )
    }

    function ensureJournalRoom(): boolean {
      if (journal.value.length < EARTH_JOURNAL_COMPACT_AT) return true
      const compacted = compactEarthJournal('e10', journal.value)
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
        !worldEvent('e10', key) ||
        !ensureJournalRoom()
      )
        return
      journal.value = [...journal.value, { type: 'travel', key }]
      notice.value = ''
      persist()
    }

    function choose(choiceId: string): void {
      if (!unlocked.value || completed.value || readyForCrossroad.value) return
      const next = chooseOverworldEvent(
        progress.value,
        position.value,
        choiceId,
      )
      if (next === progress.value || !ensureJournalRoom()) return
      const updated: EarthJournalAction[] = [
        ...journal.value,
        { type: 'choose', key: position.value, choiceId },
      ]
      if (
        !world.syncEarthCollisionJournal(
          updated,
          hoshimori.progress,
          briar.journal,
        )
      ) {
        notice.value = 'The encounter could not be recorded safely.'
        return
      }
      journal.value = updated
      notice.value =
        current.value?.choices.find((choice) => choice.id === choiceId)
          ?.outcome ?? ''
      persist()
    }

    function conclude(verdict: string): void {
      if (!unlocked.value || !readyForCrossroad.value) return
      if (
        !world.finishEarthCollision(
          journal.value,
          hoshimori.progress,
          briar.journal,
          verdict,
        )
      ) {
        notice.value = 'The city needs a witnessed route and a valid verdict.'
        return
      }
      notice.value = earthCollisionCrossroadStory(history.value, verdict).outcome
      persist()
    }

    return {
      journal,
      hydrated,
      notice,
      progress,
      position,
      current,
      chosen,
      history,
      completed,
      unlocked,
      fragments,
      crossroadEarned,
      readyForCrossroad,
      crossroadStory,
      crossroadChoices: EARTH_CROSSROAD_CHOICES,
      crossroadScene: EARTH_CROSSROAD_SCENE,
      tiles,
      hydrate,
      travel,
      choose,
      conclude,
    }
  },
)
