import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import { useAchievementStore } from '~/stores/achievementStore'
import { useUserStore } from '~/stores/userStore'
import { performFetch } from '~/stores/utils'
import {
  actionForAudience,
  travelForAudience,
  type MonstriqueAudience,
} from '~/utils/monstressConvention/edition'
import {
  newCase,
  restoreCase,
  switchInvestigator,
  type CaseAction,
  type CaseResult,
  type CaseState,
  type RoomId,
} from '~/utils/monstressConvention/prologue'
import { travelRoute } from '~/utils/monstressConvention/navigation'
import {
  chooseSync,
  mergeAccountRuns,
  mergeKitProgress,
  parseAccountSave,
  type MonstriqueAccountSave,
} from '~/utils/monstressConvention/accountSave'
import {
  achievementsFor,
  MONSTRIQUE_ENDINGS,
} from '~/utils/monstressConvention/achievements'
import {
  cutsceneTriggeredBy,
  type Cutscene,
} from '~/utils/monstrique/cutscenes'
import {
  nextCaseSeed,
  parseRuns,
  recordRun,
  type CaseRun,
} from '~/utils/monstressConvention/runHistory'

export const useMonstriquePublicStore = defineStore('monstriquePublic', () => {
  const user = useUserStore()
  const kit = usePlaybookKitStore()
  const generalState = ref<CaseState>(newCase())
  const matureState = ref<CaseState>(newCase())
  const generalSaved = ref(false)
  const matureSaved = ref(false)
  const generalRuns = ref<CaseRun[]>([])
  const matureRuns = ref<CaseRun[]>([])
  const runsUnreadable: Record<MonstriqueAudience, boolean> = {
    general: false,
    mature: false,
  }
  const adultVerified = ref(false)
  const verifiedUserId = ref<number | null>(null)
  let verifiedToken: string | undefined
  const loadedAccount = ref<string | number | null>(null)
  const checking = ref(false)
  const feedback = ref('')
  const storageWarning = ref('')
  const activeCutscene = ref<Cutscene | null>(null)
  const matureSplash = ref<{ wide: string; tall: string } | null>(null)
  let accessRequest = 0
  let splashRequest = 0
  const accountStatus = ref<'local' | 'checking' | 'synced' | 'offline'>(
    'local',
  )
  const revisions: Record<MonstriqueAudience, number | null | undefined> = {
    general: undefined,
    mature: undefined,
  }
  const syncRequests: Record<MonstriqueAudience, number> = {
    general: 0,
    mature: 0,
  }
  const saveTimers: Partial<
    Record<MonstriqueAudience, ReturnType<typeof setTimeout>>
  > = {}
  let accountWrites: Promise<void> = Promise.resolve()

  const accountId = computed(() =>
    user.isLoggedIn ? (user.user?.id ?? 'guest') : 'guest',
  )
  const audience = computed<MonstriqueAudience>(() =>
    user.isLoggedIn &&
    user.showMature &&
    !user.isMaturityRestricted &&
    adultVerified.value &&
    verifiedUserId.value === user.user?.id &&
    verifiedToken === user.token
      ? 'mature'
      : 'general',
  )
  const state = computed(() =>
    audience.value === 'mature' ? matureState.value : generalState.value,
  )
  const hasSavedCase = computed(() =>
    audience.value === 'mature' ? matureSaved.value : generalSaved.value,
  )
  const runs = computed(() =>
    audience.value === 'mature' ? matureRuns.value : generalRuns.value,
  )
  const currentLine = computed(
    () =>
      feedback.value ||
      state.value.transcript[state.value.transcript.length - 1] ||
      '',
  )

  function key(mode: MonstriqueAudience): string {
    return 'kr-monstrique-' + mode + '-v1-' + accountId.value
  }

  function savedAtKey(mode: MonstriqueAudience): string {
    return key(mode) + '-saved-at'
  }

  function runsKey(mode: MonstriqueAudience): string {
    return key(mode) + '-runs'
  }

  function runsRef(mode: MonstriqueAudience) {
    return mode === 'mature' ? matureRuns : generalRuns
  }

  function loadRuns(mode: MonstriqueAudience): void {
    const destination = runsRef(mode)
    destination.value = []
    runsUnreadable[mode] = false
    try {
      const raw = localStorage.getItem(runsKey(mode))
      if (!raw) return
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed)) throw new Error('unreadable case files')
      destination.value = parseRuns(parsed, mode)
    } catch {
      runsUnreadable[mode] = true
    }
  }

  // Unreadable case files are left untouched, like an unreadable case save.
  function storeRuns(mode: MonstriqueAudience, next: CaseRun[]): void {
    runsRef(mode).value = next
    if (!import.meta.client || runsUnreadable[mode]) return
    try {
      localStorage.setItem(runsKey(mode), JSON.stringify(next))
    } catch {
      storageWarning.value = 'This browser cannot save case files.'
    }
  }

  function readSavedAt(mode: MonstriqueAudience): string | null {
    try {
      return localStorage.getItem(savedAtKey(mode))
    } catch {
      return null
    }
  }

  function kitId(mode: MonstriqueAudience): string {
    return 'monstrique-' + mode + '-' + accountId.value
  }

  function syncOwner(): number | null {
    return import.meta.client &&
      user.token &&
      !user.isGuest &&
      user.authenticatedUserId
      ? user.authenticatedUserId
      : null
  }

  function editionReady(mode: MonstriqueAudience): boolean {
    return mode === 'general' || audience.value === 'mature'
  }

  function adoptAccountCopy(
    mode: MonstriqueAudience,
    remote: MonstriqueAccountSave,
  ): void {
    if (mode === 'mature') {
      matureState.value = remote.case
      matureSaved.value = true
    } else {
      generalState.value = remote.case
      generalSaved.value = true
    }
    try {
      localStorage.setItem(key(mode), JSON.stringify(remote.case))
      localStorage.setItem(savedAtKey(mode), remote.savedAt)
    } catch {
      storageWarning.value = 'This browser cannot save progress.'
    }
  }

  function mergeAccountKit(
    mode: MonstriqueAudience,
    remote: MonstriqueAccountSave | null,
  ): boolean {
    if (!remote?.kit) return false
    const local = kit.accountSnapshot(kitId(mode))
    if (!local) return false
    const progress = mergeKitProgress(local.progress, remote.kit.progress)
    const changed = JSON.stringify(progress) !== JSON.stringify(local.progress)
    if (changed) kit.restoreAccount(kitId(mode), { ...local, progress })
    return (
      JSON.stringify(progress) !== JSON.stringify(remote.kit.progress) ||
      changed
    )
  }

  function mergeRemoteRuns(
    mode: MonstriqueAudience,
    remote: MonstriqueAccountSave | null,
  ): boolean {
    const merged = mergeAccountRuns(runsRef(mode).value, remote)
    if (JSON.stringify(merged.runs) !== JSON.stringify(runsRef(mode).value))
      storeRuns(mode, merged.runs)
    return merged.upload
  }

  async function syncAccount(mode: MonstriqueAudience): Promise<void> {
    const owner = syncOwner()
    if (!owner || !editionReady(mode)) return
    const sequence = ++syncRequests[mode]
    accountStatus.value = 'checking'
    try {
      const result = await performFetch<{
        edition: MonstriqueAudience
        save: unknown
        revision: number | null
      }>('/api/monstrique/account-save', {}, 1)
      if (
        sequence !== syncRequests[mode] ||
        owner !== syncOwner() ||
        !editionReady(mode)
      )
        return
      if (!result.success || !result.data || result.data.edition !== mode) {
        accountStatus.value = 'offline'
        return
      }
      const remote = result.data.save
        ? parseAccountSave(result.data.save, mode)
        : null
      revisions[mode] = result.data.revision ?? null
      const decision = chooseSync(
        {
          case: mode === 'mature' ? matureState.value : generalState.value,
          savedAt: readSavedAt(mode),
          saved: mode === 'mature' ? matureSaved.value : generalSaved.value,
        },
        remote,
      )
      if (decision === 'adopt-remote' && remote) adoptAccountCopy(mode, remote)
      const kitDiffers = mergeAccountKit(mode, remote)
      const runsDiffer = mergeRemoteRuns(mode, remote)
      accountStatus.value = 'synced'
      if (
        decision === 'upload' ||
        decision === 'keep-local' ||
        runsDiffer ||
        (kitDiffers && decision !== 'adopt-remote')
      )
        scheduleAccountSave(mode, 0)
    } catch {
      if (sequence === syncRequests[mode]) accountStatus.value = 'offline'
    }
  }

  function scheduleAccountSave(mode: MonstriqueAudience, delay = 1200): void {
    if (!syncOwner() || revisions[mode] === undefined) return
    if (saveTimers[mode]) clearTimeout(saveTimers[mode])
    saveTimers[mode] = setTimeout(() => {
      saveTimers[mode] = undefined
      pushAccountSave(mode)
    }, delay)
  }

  function pushAccountSave(mode: MonstriqueAudience): void {
    const owner = syncOwner()
    if (!owner) return
    accountWrites = accountWrites.then(async () => {
      if (
        owner !== syncOwner() ||
        !editionReady(mode) ||
        revisions[mode] === undefined
      )
        return
      const save: MonstriqueAccountSave = {
        version: 1,
        savedAt: readSavedAt(mode) ?? new Date().toISOString(),
        case: mode === 'mature' ? matureState.value : generalState.value,
        kit: kit.accountSnapshot(kitId(mode)),
        runs: runsRef(mode).value,
      }
      try {
        const result = await performFetch<{ revision: number }>(
          '/api/monstrique/account-save',
          {
            method: 'PUT',
            body: JSON.stringify({
              edition: mode,
              save,
              expectedRevision: revisions[mode],
            }),
          },
          1,
        )
        if (owner !== syncOwner()) return
        if (result.success && result.data) {
          revisions[mode] = result.data.revision
          accountStatus.value = 'synced'
        } else if (result.status === 409) {
          revisions[mode] = undefined
          void syncAccount(mode)
        } else {
          accountStatus.value = 'offline'
        }
      } catch {
        accountStatus.value = 'offline'
      }
    })
  }

  function loadMode(mode: MonstriqueAudience): void {
    if (
      !import.meta.client ||
      (mode === 'mature' && audience.value !== 'mature')
    )
      return
    const destination = mode === 'mature' ? matureState : generalState
    const saved = mode === 'mature' ? matureSaved : generalSaved
    destination.value = newCase()
    saved.value = false
    loadRuns(mode)
    try {
      const raw = localStorage.getItem(key(mode))
      if (!raw) return
      const restored = restoreCase(JSON.parse(raw))
      if (!restored) {
        storageWarning.value = 'Unreadable case save left untouched.'
        return
      }
      destination.value = restored
      saved.value = true
      storageWarning.value = ''
    } catch {
      storageWarning.value = 'Unreadable case save left untouched.'
    }
  }

  function initialize(): void {
    if (loadedAccount.value === accountId.value) return
    loadedAccount.value = accountId.value
    adultVerified.value = false
    verifiedUserId.value = null
    verifiedToken = undefined
    matureState.value = newCase()
    matureSaved.value = false
    generalState.value = newCase()
    generalSaved.value = false
    generalRuns.value = []
    matureRuns.value = []
    feedback.value = ''
    storageWarning.value = ''
    loadMode('general')
    kit.open('monstrique-general-' + accountId.value)
    revisions.general = undefined
    revisions.mature = undefined
    accountStatus.value = 'local'
  }

  async function verifyAudience(): Promise<void> {
    initialize()
    const sequence = ++accessRequest
    const token = user.token
    adultVerified.value = false
    verifiedUserId.value = null
    verifiedToken = undefined
    feedback.value = ''
    kit.open('monstrique-general-' + accountId.value)
    void syncAccount('general')
    if (
      !token ||
      !user.isLoggedIn ||
      !user.showMature ||
      user.isMaturityRestricted
    )
      return
    checking.value = true
    try {
      const result = await performFetch<{ audience: MonstriqueAudience }>(
        '/api/monstrique/audience',
        {},
        1,
      )
      if (
        sequence === accessRequest &&
        token === user.token &&
        user.isLoggedIn &&
        user.showMature &&
        !user.isMaturityRestricted &&
        result.success &&
        result.data?.audience === 'mature'
      ) {
        adultVerified.value = true
        verifiedUserId.value = user.user?.id ?? null
        verifiedToken = token
        loadMode('mature')
        kit.open('monstrique-mature-' + accountId.value)
        void syncAccount('mature')
      }
    } catch {
      adultVerified.value = false
    } finally {
      if (sequence === accessRequest) checking.value = false
    }
  }

  function persist(): void {
    if (!import.meta.client || storageWarning.value) return
    const mode = audience.value
    try {
      localStorage.setItem(key(mode), JSON.stringify(state.value))
      localStorage.setItem(savedAtKey(mode), new Date().toISOString())
      if (mode === 'mature') matureSaved.value = true
      else generalSaved.value = true
    } catch {
      storageWarning.value = 'This browser cannot save progress.'
      return
    }
    scheduleAccountSave(mode)
  }

  function commit(result: CaseResult): void {
    if (!result.changed) {
      feedback.value = result.line
      return
    }
    const prev = state.value
    activeCutscene.value =
      cutsceneTriggeredBy(state.value, result.state, audience.value) ??
      activeCutscene.value
    if (audience.value === 'mature') matureState.value = result.state
    else generalState.value = result.state
    feedback.value = ''
    if (result.state.flags.includes('double-murder-discovered'))
      kit.unlock('moments', 'double-murder')
    if (result.state.flags.includes('odette-hired-us'))
      kit.unlock('moments', 'dead-client')
    if (result.state.flags.includes('fangs-returned'))
      kit.unlock('moments', 'rental-fangs')
    if (
      result.state.flags.includes('odette-met') &&
      result.state.flags.includes('violet-met')
    )
      kit.unlock('moments', 'two-ghosts')
    if (
      audience.value === 'mature' &&
      result.state.flags.includes('ghost-kiss')
    )
      kit.unlock('moments', 'cold-kiss')
    if (result.state.ending) kit.unlock('endings', result.state.ending)
    if (result.state.ending && !prev.ending)
      storeRuns(
        audience.value,
        recordRun(
          runs.value,
          result.state,
          audience.value,
          new Date().toISOString(),
        ),
      )
    awardAchievements(prev, result.state)
    persist()
  }

  // Achievements follow the action that changed the case, in either edition;
  // a loaded save only becomes the next comparison's starting point.
  function awardAchievements(prev: CaseState, next: CaseState): void {
    const endingsSeen = MONSTRIQUE_ENDINGS.filter((id) =>
      kit.isUnlocked('endings', id),
    ).length
    const achievements = useAchievementStore()
    for (const code of achievementsFor(prev, next, endingsSeen))
      void achievements.rewardAchievementByCode(code)
  }

  function forgetCase(): boolean {
    if (!import.meta.client || loadedAccount.value !== accountId.value)
      return false
    const mode = audience.value
    try {
      localStorage.removeItem(key(mode))
      localStorage.removeItem(runsKey(mode))
      localStorage.setItem(savedAtKey(mode), new Date().toISOString())
    } catch {
      storageWarning.value = 'Could not erase the case on this device.'
      return false
    }
    if (mode === 'mature') {
      matureState.value = newCase()
      matureSaved.value = false
    } else {
      generalState.value = newCase()
      generalSaved.value = false
    }
    runsRef(mode).value = []
    runsUnreadable[mode] = false
    feedback.value = ''
    activeCutscene.value = null
    storageWarning.value = ''
    scheduleAccountSave(mode)
    return true
  }

  function begin(): void {
    const fresh = newCase(nextCaseSeed(runs.value))
    if (audience.value === 'mature') matureState.value = fresh
    else generalState.value = fresh
    feedback.value = ''
    activeCutscene.value = null
    persist()
  }

  function finishCutscene(): void {
    activeCutscene.value = null
  }

  async function loadSplash(): Promise<void> {
    const sequence = ++splashRequest
    const token = user.token
    if (
      !token ||
      !user.isLoggedIn ||
      !user.showMature ||
      user.isMaturityRestricted
    ) {
      matureSplash.value = null
      return
    }
    try {
      const result = await performFetch<{
        splash: { wide: string; tall: string } | null
      }>('/api/monstrique/splash', {}, 1)
      if (sequence !== splashRequest || token !== user.token) return
      matureSplash.value =
        result.success && user.showMature && !user.isMaturityRestricted
          ? (result.data?.splash ?? null)
          : null
    } catch {
      if (sequence === splashRequest) matureSplash.value = null
    }
  }

  function takeAction(action: CaseAction): void {
    commit(actionForAudience(state.value, action, audience.value))
  }

  function move(room: RoomId): void {
    commit(travelForAudience(state.value, room, audience.value))
  }

  function travelTo(room: RoomId): void {
    commit(
      travelRoute(state.value, room, (here, destination) =>
        travelForAudience(here, destination, audience.value),
      ),
    )
  }

  function switchActor(): void {
    commit(switchInvestigator(state.value))
  }

  return {
    audience,
    accountStatus,
    checking,
    state,
    hasSavedCase,
    runs,
    currentLine,
    storageWarning,
    activeCutscene,
    finishCutscene,
    matureSplash,
    loadSplash,
    initialize,
    verifyAudience,
    begin,
    forgetCase,
    takeAction,
    move,
    travelTo,
    switchActor,
  }
})
