import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
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
import {
  cutsceneTriggeredBy,
  type Cutscene,
} from '~/utils/monstrique/cutscenes'

export const useMonstriquePublicStore = defineStore('monstriquePublic', () => {
  const user = useUserStore()
  const kit = usePlaybookKitStore()
  const generalState = ref<CaseState>(newCase())
  const matureState = ref<CaseState>(newCase())
  const generalSaved = ref(false)
  const matureSaved = ref(false)
  const adultVerified = ref(false)
  const verifiedUserId = ref<number | null>(null)
  let verifiedToken: string | undefined
  const loadedAccount = ref<string | number | null>(null)
  const checking = ref(false)
  const feedback = ref('')
  const storageWarning = ref('')
  const activeCutscene = ref<Cutscene | null>(null)
  let accessRequest = 0

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
  const currentLine = computed(
    () =>
      feedback.value ||
      state.value.transcript[state.value.transcript.length - 1] ||
      '',
  )

  function key(mode: MonstriqueAudience): string {
    return 'kr-monstrique-' + mode + '-v1-' + accountId.value
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
    feedback.value = ''
    storageWarning.value = ''
    loadMode('general')
    kit.open('monstrique-general-' + accountId.value)
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
      }
    } catch {
      adultVerified.value = false
    } finally {
      if (sequence === accessRequest) checking.value = false
    }
  }

  function persist(): void {
    if (!import.meta.client || storageWarning.value) return
    try {
      localStorage.setItem(key(audience.value), JSON.stringify(state.value))
      if (audience.value === 'mature') matureSaved.value = true
      else generalSaved.value = true
    } catch {
      storageWarning.value = 'This browser cannot save progress.'
    }
  }

  function commit(result: CaseResult): void {
    if (!result.changed) {
      feedback.value = result.line
      return
    }
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
    persist()
  }

  function begin(): void {
    if (audience.value === 'mature') matureState.value = newCase()
    else generalState.value = newCase()
    feedback.value = ''
    activeCutscene.value = null
    persist()
  }

  function finishCutscene(): void {
    activeCutscene.value = null
  }

  function takeAction(action: CaseAction): void {
    commit(actionForAudience(state.value, action, audience.value))
  }

  function move(room: RoomId): void {
    commit(travelForAudience(state.value, room, audience.value))
  }

  function switchActor(): void {
    commit(switchInvestigator(state.value))
  }

  return {
    audience,
    checking,
    state,
    hasSavedCase,
    currentLine,
    storageWarning,
    activeCutscene,
    finishCutscene,
    initialize,
    verifyAudience,
    begin,
    takeAction,
    move,
    switchActor,
  }
})
