import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  availableFollowers,
  availableHorde,
  dayAt,
  dispatchFollowers,
  neglectIncident,
  previewDispatch,
} from '~/utils/emperorOfDust/engine'
import {
  earnStoryFlag,
  recruitFollower,
  recruitmentStatus,
  remainingRecoveryDays,
  scriptedFollowerDeath,
} from '~/utils/emperorOfDust/progression'
import { advancePilotClock } from '~/utils/emperorOfDust/pilot'
import {
  acquireRelic,
  chooseNextLoadout,
  decodeRelicVault,
  earnSecondSlot,
  emptyRelicVault,
  encodeRelicVault,
  startWithRelics,
} from '~/utils/emperorOfDust/relics'
import type { RelicId, RelicVault } from '~/utils/emperorOfDust/relics'
import {
  decodeEmperorSave,
  encodeEmperorSave,
} from '~/utils/emperorOfDust/save'
import type { Campaign, Incident } from '~/utils/emperorOfDust/types'

const SAVE_KEY = 'kr-emperor-of-dust-campaign-v1'
const RELIC_KEY = 'kr-emperor-of-dust-relic-vault-v1'
const newSeed = (): number => Date.now() >>> 0 || 1

export const useEmperorOfDustStore = defineStore('emperorOfDust', () => {
  const campaign = ref<Campaign | null>(null)
  const relicVault = ref<RelicVault>(emptyRelicVault())
  const loaded = ref(false)
  const storageWarning = ref('')

  const day = computed(() => (campaign.value ? dayAt(campaign.value.hour) : 1))
  const ready = computed(() =>
    campaign.value ? availableFollowers(campaign.value) : [],
  )
  const freeHorde = computed(() =>
    campaign.value ? availableHorde(campaign.value) : 0,
  )
  const wounded = computed(() =>
    campaign.value
      ? campaign.value.followers.filter(
          (follower) => remainingRecoveryDays(campaign.value!, follower) > 0,
        )
      : [],
  )

  function persist() {
    if (!campaign.value || typeof localStorage === 'undefined') return
    try {
      localStorage.setItem(SAVE_KEY, encodeEmperorSave(campaign.value))
      storageWarning.value = ''
    } catch {
      storageWarning.value =
        'Local save unavailable. This session is not backed up.'
    }
  }

  function load() {
    if (loaded.value) return
    if (typeof localStorage === 'undefined') return
    try {
      const rawRelics = localStorage.getItem(RELIC_KEY)
      const savedRelics = decodeRelicVault(rawRelics)
      if (rawRelics && !savedRelics) {
        storageWarning.value = 'The relic vault could not be read; it was not overwritten.'
      }
      relicVault.value = savedRelics ?? emptyRelicVault()
      const raw = localStorage.getItem(SAVE_KEY)
      const saved = decodeEmperorSave(raw)
      if (raw && !saved) {
        storageWarning.value =
          'An existing campaign could not be read. It was not overwritten.'
      }
      campaign.value = saved ?? startWithRelics(newSeed(), relicVault.value)
    } catch {
      campaign.value = startWithRelics(newSeed(), emptyRelicVault())
      storageWarning.value =
        'Browser storage is blocked. This run may not persist.'
    }
    loaded.value = true
  }

  function update(next: Campaign) {
    if (!loaded.value || !campaign.value)
      throw new Error('Load the court first')
    campaign.value = next
    persist()
  }

  function beginNewRun() {
    if (!loaded.value) load()
    update(startWithRelics(newSeed(), relicVault.value))
  }

  function saveRelics(next: RelicVault) {
    if (!loaded.value || typeof localStorage === 'undefined')
      throw new Error('Load the court first')
    const encoded = encodeRelicVault(next)
    try {
      localStorage.setItem(RELIC_KEY, encoded)
    } catch {
      storageWarning.value = 'Relic unlock could not be saved. No change was made.'
      throw new Error('Browser storage is full or unavailable for relics')
    }
    relicVault.value = next
  }

  function claimRelic(id: RelicId) {
    if (!campaign.value) throw new Error('Load the court first')
    saveRelics(acquireRelic(relicVault.value, campaign.value, id))
  }

  function setNextRelics(ids: RelicId[]) {
    saveRelics(chooseNextLoadout(relicVault.value, ids))
  }

  function unlockSecondRelicSlot() {
    if (!campaign.value) throw new Error('Load the court first')
    saveRelics(earnSecondSlot(relicVault.value, campaign.value))
  }

  function recruit(id: string) {
    if (!campaign.value) throw new Error('Load the court first')
    update(recruitFollower(campaign.value, id))
  }

  function availability(id: string) {
    if (!campaign.value)
      return { eligible: false, reason: 'Not loaded', cost: 0 }
    return recruitmentStatus(campaign.value, id)
  }

  function dispatch(
    incident: Incident,
    leaders: string[],
    troops: number,
    choice: string,
    useHourglass = false,
  ) {
    if (!campaign.value) throw new Error('Load the court first')
    update(dispatchFollowers(campaign.value, incident, leaders, troops, choice, useHourglass))
  }

  function estimate(
    incident: Incident,
    leaders: string[],
    troops: number,
    choice: string,
  ) {
    if (!campaign.value) throw new Error('Load the court first')
    return previewDispatch(campaign.value, incident, leaders, troops, choice, useHourglass)
  }

  function ignore(incident: Incident) {
    if (!campaign.value) throw new Error('Load the court first')
    update(neglectIncident(campaign.value, incident))
  }

  function advanceTo(hour: number) {
    if (!campaign.value) throw new Error('Load the court first')
    update(advancePilotClock(campaign.value, hour))
  }

  function earnFlag(flag: string) {
    if (!campaign.value) throw new Error('Load the court first')
    update(earnStoryFlag(campaign.value, flag))
  }

  function recordAuthoredFatality(
    leaderId: string,
    eventId: string,
    reason: string,
  ) {
    if (!campaign.value) throw new Error('Load the court first')
    update(scriptedFollowerDeath(campaign.value, leaderId, eventId, reason))
  }

  return {
    campaign,
    loaded,
    storageWarning,
    relicVault,
    claimRelic,
    setNextRelics,
    unlockSecondRelicSlot,
    day,
    ready,
    freeHorde,
    wounded,
    load,
    beginNewRun,
    recruit,
    availability,
    dispatch,
    estimate,
    ignore,
    advanceTo,
    earnFlag,
    recordAuthoredFatality,
  }
})
