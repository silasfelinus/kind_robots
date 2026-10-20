import { defineStore } from 'pinia'
import { journeyCharacterSheet } from '~/utils/shiftingLands/progression'
import {
  migrateJourneyLedger,
  restoreJourneyLedger,
  stepJourneyLedger,
  type JourneyLedgerAction,
  type JourneyLedger,
} from '~/utils/shiftingLands/saveLedger'
import {
  activeFiveLandEncounter,
  findFiveLandCard,
} from '~/utils/shiftingLands/authoredFiveLands'
import {
  encounterArt,
  landScenery,
  locationArt,
  outcomeArt,
  trialArt,
} from '~/utils/shiftingLands/sceneArt'
import {
  trialForLand,
  canChooseTrial,
  type TrialResult,
} from '~/utils/shiftingLands/authoredBosses'
import {
  restoreJourneyLedgerV5,
  stepJourneyLedgerV5,
  type JourneyActionV5,
  type JourneyLedgerV5,
} from '~/utils/shiftingLands/saveLedgerV5'
import {
  restoreJourneyLedgerV4,
  stepJourneyLedgerV4,
  type JourneyLedgerV4,
} from '~/utils/shiftingLands/saveLedgerV4'
import {
  newJourneyLedgerV6,
  restoreJourneyLedgerV6,
  stepJourneyLedgerV6,
  v6CharacterSheet,
  type JourneyActionV6,
  type JourneyLedgerV6,
} from '~/utils/shiftingLands/saveLedgerV6'
import {
  activeV6Card,
  choiceLock,
  v6Card,
  SHIFTING_LANDS_LIVE_TEXT,
  type V6Choice,
} from '~/utils/shiftingLands/deckV6'
import { authoredEndingV6 } from '~/utils/shiftingLands/endingsV6'
import { computed, ref } from 'vue'
import { useAchievementStore } from './achievementStore'
import { loadPlaybookLiveText } from './utils/playbookLiveText'
import {
  JOURNEY_WORLD,
  reachableLocations,
  type BossApproach,
  type EncounterApproach,
} from '~/utils/shiftingLands/journey'
import {
  activeAuthoredEncounter,
  type AuthoredJourneyState,
  type AuthoredResult,
} from '~/utils/shiftingLands/authoredJourney'

const SAVE_KEY = 'kr.shiftingLands.journeyLedger.v6'
const LEGACY_V5_SAVE_KEY = 'kr.shiftingLands.journeyLedger.v5'
const LEGACY_V4_SAVE_KEY = 'kr.shiftingLands.journeyLedger.v4'
const LEGACY_V3_SAVE_KEY = 'kr.shiftingLands.journeyLedger.v3'
const LEGACY_SAVE_KEY = 'kr.shiftingLands.authoredJourney.v2'

export type JourneyResult = Omit<AuthoredResult, 'roll'> & {
  roll: AuthoredResult['roll'] | null
  success: boolean
}

export const useShiftingLandsJourneyStore = defineStore(
  'shiftingLandsJourney',
  () => {
    const ledger = ref<
      JourneyLedger | JourneyLedgerV4 | JourneyLedgerV5 | JourneyLedgerV6
    >(newJourneyLedgerV6(20261011))
    const session = computed(() => ledger.value.current)
    const state = computed(() => session.value.journey)
    const characterSheet = computed(() =>
      ledger.value.version === 6
        ? v6CharacterSheet(ledger.value.current, ledger.value.usedRewards)
        : journeyCharacterSheet(
            ledger.value.current as AuthoredJourneyState,
            ledger.value.usedRewards,
          ),
    )
    const findCard = (id: string) => v6Card(id) ?? findFiveLandCard(id)
    const lockFor = (choice: V6Choice): string | null =>
      ledger.value.version === 6
        ? choiceLock(ledger.value.current, choice)
        : null
    const marks = computed(() =>
      ledger.value.version === 6 ? ledger.value.current.marks : null,
    )
    const loaded = ref(false)
    const restoreWarning = ref(false)
    const currentLand = computed(
      () => JOURNEY_WORLD.lands[state.value.landIndex]!,
    )
    const locations = computed(() => {
      const land = currentLand.value
      return state.value.layouts[land.id]!.map((id) =>
        land.locations.find((item) => item.id === id)!,
      )
    })
    const reachable = computed(() => reachableLocations(state.value))
    const resolved = computed(() =>
      state.value.resolved.filter(
        (entry) => entry.landId === currentLand.value.id,
      ),
    )
    const activeCard = computed(
      () =>
        locations.value.find((card) => card.id === state.value.active) ?? null,
    )
    const activeEncounter = computed(() =>
      ledger.value.version === 6
        ? activeV6Card(ledger.value.current)
        : ledger.value.version >= 4
          ? activeFiveLandEncounter(
              ledger.value.current as AuthoredJourneyState,
            )
          : activeAuthoredEncounter(ledger.value.current),
    )
    const landArt = computed(() => landScenery(currentLand.value.id))
    const activeArt = computed(() =>
      encounterArt(
        currentLand.value.id,
        activeEncounter.value,
        activeCard.value,
      ),
    )
    const bossArt = computed(() =>
      trialArt(currentLand.value.id, currentLand.value.boss.art),
    )
    const roadArt = (locationId: string): string => {
      const land = JOURNEY_WORLD.lands.find((item) =>
        item.locations.some((location) => location.id === locationId),
      )
      const location = land?.locations.find((item) => item.id === locationId)
      return land && location ? locationArt(land.id, location) : landArt.value
    }
    const playedArt = (locationId: string): string => {
      const land = JOURNEY_WORLD.lands.find((item) =>
        item.locations.some((location) => location.id === locationId),
      )
      const location =
        land?.locations.find((item) => item.id === locationId) ?? null
      const drawnId = session.value.drawn?.[locationId]
      const encounter = drawnId ? findCard(drawnId) : null
      return land ? encounterArt(land.id, encounter, location) : landArt.value
    }
    const outcomePlate = (
      result: JourneyResult,
    ): { src: string; painted: boolean } => {
      const painted = outcomeArt(
        result.encounterId,
        result.choiceId,
        result.success,
      )
      return {
        src: painted ?? playedArt(result.locationId),
        painted: !!painted,
      }
    }
    const trialPlate = (
      result: TrialResult,
    ): { src: string; painted: boolean } => {
      const land = JOURNEY_WORLD.lands.find((item) => item.id === result.landId)
      const painted = outcomeArt(
        'trial-' + result.landId,
        result.choiceId,
        result.roll.success,
      )
      return {
        src: painted ?? trialArt(result.landId, land?.boss.art ?? null),
        painted: !!painted,
      }
    }
    const encounterHistory = computed<JourneyResult[]>(() =>
      (session.value.outcomes as Array<AuthoredResult | JourneyResult>).map(
        (result) => ({
          ...result,
          success:
            'success' in result ? result.success : !!result.roll?.success,
        }),
      ),
    )
    const lastAuthoredOutcome = computed(
      () => encounterHistory.value.at(-1) ?? null,
    )
    const currentTrial = computed(() =>
      ledger.value.version >= 5 && state.value.phase === 'boss'
        ? trialForLand(currentLand.value.id)
        : null,
    )
    const trialResults = computed(() =>
      ledger.value.version === 5 || ledger.value.version === 6
        ? ledger.value.trialResults
        : [],
    )
    const lastTrialOutcome = computed(() => trialResults.value.at(-1) ?? null)
    const ending = computed(() =>
      ledger.value.version === 6
        ? authoredEndingV6(ledger.value.current, ledger.value.trialResults)
        : null,
    )
    const canTrial = (choiceId: string): boolean => {
      const choice = currentTrial.value?.choices.find(
        (item) => item.id === choiceId,
      )
      return (
        !!choice &&
        canChooseTrial(choice, session.value.flags, state.value.provisions)
      )
    }
    const currentShift = computed(
      () =>
        [...state.value.shifts]
          .reverse()
          .find((shift) => shift.landId === currentLand.value.id) ?? null,
    )
    const remaining = computed(() =>
      locations.value.filter(
        (card) =>
          !state.value.resolved.some((entry) => entry.locationId === card.id),
      ),
    )
    const bossReady = computed(() => state.value.phase === 'boss')
    const completed = computed(() => state.value.phase === 'complete')
    const finished = computed(() =>
      ['complete', 'fallen', 'retired'].includes(state.value.phase),
    )
    const savedEncounter = (locationId: string) =>
      encounterHistory.value.find(
        (result) => result.locationId === locationId,
      ) ?? null

    function initialize() {
      if (loaded.value) return
      loaded.value = true
      if (!import.meta.client) return
      void loadPlaybookLiveText(
        'shifting-lands',
        SHIFTING_LANDS_LIVE_TEXT,
      ).then((changed) => {
        if (changed) ledger.value = { ...ledger.value }
      })
      try {
        const saved = window.localStorage.getItem(SAVE_KEY)
        if (saved !== null) {
          const restored = restoreJourneyLedgerV6(JSON.parse(saved))
          if (restored) ledger.value = restored
          else restoreWarning.value = true
          return
        }
        const savedV5 = window.localStorage.getItem(LEGACY_V5_SAVE_KEY)
        if (savedV5 !== null) {
          const restored = restoreJourneyLedgerV5(JSON.parse(savedV5))
          if (restored) ledger.value = restored
          else restoreWarning.value = true
          return
        }
        const savedV4 = window.localStorage.getItem(LEGACY_V4_SAVE_KEY)
        if (savedV4 !== null) {
          const restored = restoreJourneyLedgerV4(JSON.parse(savedV4))
          if (restored) ledger.value = restored
          else restoreWarning.value = true
          return
        }
        const savedV3 = window.localStorage.getItem(LEGACY_V3_SAVE_KEY)
        if (savedV3 !== null) {
          const restored = restoreJourneyLedger(JSON.parse(savedV3))
          if (restored) ledger.value = restored
          else restoreWarning.value = true
          return
        }
        const legacy = window.localStorage.getItem(LEGACY_SAVE_KEY)
        if (legacy === null) return
        const migrated = migrateJourneyLedger(JSON.parse(legacy))
        if (!migrated) {
          restoreWarning.value = true
          return
        }
        ledger.value = migrated
        persist()
      } catch {
        restoreWarning.value = true
      }
    }
    function persist() {
      if (!import.meta.client) return
      try {
        const key =
          ledger.value.version === 6
            ? SAVE_KEY
            : ledger.value.version === 5
              ? LEGACY_V5_SAVE_KEY
              : ledger.value.version === 4
                ? LEGACY_V4_SAVE_KEY
                : LEGACY_V3_SAVE_KEY
        window.localStorage.setItem(key, JSON.stringify(ledger.value))
      } catch {
        restoreWarning.value = true
      }
    }
    function dispatch(action: JourneyActionV5 | JourneyActionV6): boolean {
      if (!loaded.value) return false
      const active = ledger.value
      if (
        active.version < 5 &&
        (action.type === 'TRIAL' || action.type === 'RETREAT')
      )
        return false
      const next =
        active.version === 6
          ? stepJourneyLedgerV6(active, action as JourneyActionV6)
          : active.version === 5
            ? stepJourneyLedgerV5(active, action as JourneyActionV5)
            : active.version === 4
              ? stepJourneyLedgerV4(active, action as JourneyLedgerAction)
              : stepJourneyLedger(active, action as JourneyLedgerAction)
      if (next === ledger.value) return false
      const before = active.current.journey
      ledger.value = next
      restoreWarning.value = false
      persist()
      awardJourneyDeeds(before, next.current.journey)
      return true
    }
    function awardJourneyDeeds(
      before: AuthoredJourneyState['journey'],
      after: AuthoredJourneyState['journey'],
    ) {
      const achievements = useAchievementStore()
      if (after.bosses.length > before.bosses.length) {
        const passed = after.bosses[after.bosses.length - 1]!.landId
        if (passed === 'homestead')
          void achievements.rewardAchievementByCode(
            'zuzu-shifting-lands-open-door',
          )
        if (passed === 'tablelands')
          void achievements.rewardAchievementByCode(
            'zuzu-shifting-lands-canyon-warden',
          )
      }
      if (after.phase === 'complete' && before.phase !== 'complete')
        void achievements.rewardAchievementByCode(
          'zuzu-shifting-lands-beyond-the-verge',
        )
    }
    function travel(id: string) {
      return dispatch({ type: 'TRAVEL', locationId: id })
    }
    function draw() {
      const next = reachable.value.find((id) =>
        remaining.value.some((card) => card.id === id),
      )
      return next ? travel(next) : false
    }
    function choose(choiceId: string) {
      return dispatch({ type: 'CHOOSE', choiceId })
    }
    function resolve(approach: EncounterApproach) {
      return dispatch({ type: 'RESOLVE', approach })
    }
    function confront(approach: BossApproach) {
      if (ledger.value.version >= 5)
        return approach === 'retreat' ? dispatch({ type: 'RETREAT' }) : false
      return dispatch({ type: 'BOSS', approach })
    }
    function attemptTrial(choiceId: string) {
      return dispatch({ type: 'TRIAL', choiceId })
    }
    function useReward(rewardId: string) {
      return dispatch({ type: 'USE_REWARD', rewardId })
    }
    function fresh() {
      if (!loaded.value) return
      ledger.value = newJourneyLedgerV6(Date.now() % 2147483647)
      restoreWarning.value = false
      persist()
    }
    return {
      ledger,
      session,
      findCard,
      lockFor,
      marks,
      ending,
      state,
      characterSheet,
      loaded,
      restoreWarning,
      currentLand,
      locations,
      reachable,
      resolved,
      activeCard,
      activeEncounter,
      landArt,
      activeArt,
      bossArt,
      roadArt,
      playedArt,
      outcomePlate,
      trialPlate,
      currentTrial,
      lastTrialOutcome,
      canTrial,
      attemptTrial,
      lastAuthoredOutcome,
      encounterHistory,
      savedEncounter,
      currentShift,
      remaining,
      bossReady,
      completed,
      finished,
      world: JOURNEY_WORLD,
      initialize,
      travel,
      draw,
      choose,
      useReward,
      resolve,
      confront,
      fresh,
    }
  },
)
