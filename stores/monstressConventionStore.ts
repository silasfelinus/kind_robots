import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import { useUserStore } from '~/stores/userStore'
import { performFetch } from '~/stores/utils'
import {
  newCase,
  monstrexxKitId,
  performAction,
  restoreCase,
  switchInvestigator,
  travel,
  type CaseAction,
  type CaseState,
  type RoomId,
} from '~/utils/monstressConvention/prologue'
import {
  cutsceneTriggeredBy,
  type Cutscene,
} from '~/utils/monstrique/cutscenes'

export const useMonstressConventionStore = defineStore(
  'monstressConvention',
  () => {
    const user = useUserStore()
    const kit = usePlaybookKitStore()
    const authorized = ref(false)
    const checking = ref(false)
    const opened = ref(false)
    const hasSavedCase = ref(false)
    const accountId = ref<number | null>(null)
    const feedback = ref('')
    const state = ref<CaseState>(newCase())
    const storageWarning = ref('')
    const activeCutscene = ref<Cutscene | null>(null)
    const currentLine = computed(
      () =>
        feedback.value ||
        state.value.transcript[state.value.transcript.length - 1] ||
        '',
    )
    const saveKey = computed(
      () => 'kr-monstress-case-v2-' + (user.user?.id ?? 'guest'),
    )

    async function verifyAccess(): Promise<void> {
      authorized.value = false
      if (!user.isAdmin || !user.showMature || !user.token) return
      checking.value = true
      try {
        const response = await performFetch<{ canPlay: boolean }>(
          '/api/monstress-convention/access',
          {},
          1,
        )
        authorized.value = response.success && response.data?.canPlay === true
        if (authorized.value && accountId.value !== user.user?.id) {
          accountId.value = user.user?.id ?? null
          state.value = newCase()
          feedback.value = ''
          opened.value = true
          load()
          kit.open(monstrexxKitId(accountId.value ?? 0))
        }
      } catch {
        authorized.value = false
      } finally {
        checking.value = false
      }
    }

    function load(): void {
      hasSavedCase.value = false
      if (!authorized.value || !import.meta.client) return
      try {
        const raw = localStorage.getItem(saveKey.value)
        if (!raw) return
        const restored = restoreCase(JSON.parse(raw))
        if (!restored) {
          storageWarning.value =
            'Save data is unreadable and has been left untouched.'
          return
        }
        state.value = restored
        hasSavedCase.value = true
        storageWarning.value = ''
      } catch {
        storageWarning.value =
          'Save data is unreadable and has been left untouched.'
      }
    }

    function persist(): void {
      if (!authorized.value || !import.meta.client || storageWarning.value)
        return
      try {
        localStorage.setItem(saveKey.value, JSON.stringify(state.value))
        hasSavedCase.value = true
      } catch {
        storageWarning.value = 'This browser cannot save progress.'
      }
    }

    function commit(next: CaseState): void {
      if (!authorized.value) return
      activeCutscene.value =
        cutsceneTriggeredBy(state.value, next, 'mature') ?? activeCutscene.value
      state.value = next
      feedback.value = ''
      if (next.flags.includes('double-murder-discovered'))
        kit.unlock('moments', 'double-murder')
      if (
        next.flags.includes('odette-met') &&
        next.flags.includes('violet-met')
      )
        kit.unlock('moments', 'two-ghosts')
      if (next.flags.includes('odette-hired-us'))
        kit.unlock('moments', 'dead-client')
      if (next.flags.includes('fangs-returned'))
        kit.unlock('moments', 'rental-fangs')
      if (next.flags.includes('ghost-kiss')) kit.unlock('moments', 'cold-kiss')
      if (next.ending) kit.unlock('endings', next.ending)
      persist()
    }

    function begin(): void {
      if (!authorized.value) return
      commit(newCase())
      activeCutscene.value = null
      opened.value = true
    }

    function finishCutscene(): void {
      activeCutscene.value = null
    }

    function takeAction(action: CaseAction): void {
      if (!authorized.value) return
      const result = performAction(state.value, action)
      if (result.changed) commit(result.state)
      else feedback.value = result.line
    }

    function move(room: RoomId): void {
      if (!authorized.value) return
      const result = travel(state.value, room)
      if (result.changed) commit(result.state)
      else feedback.value = result.line
    }

    function switchActor(): void {
      if (!authorized.value) return
      const result = switchInvestigator(state.value)
      if (result.changed) commit(result.state)
      else feedback.value = result.line
    }

    return {
      authorized,
      checking,
      opened,
      hasSavedCase,
      state,
      currentLine,
      storageWarning,
      activeCutscene,
      finishCutscene,
      verifyAccess,
      load,
      begin,
      takeAction,
      move,
      switchActor,
    }
  },
)
