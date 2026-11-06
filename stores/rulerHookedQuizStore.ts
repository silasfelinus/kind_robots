import { defineStore } from 'pinia'
import { useMandarinTutorStore } from './mandarinTutorStore'
import { performFetch } from './utils'
import { useRulerHookedStore } from './rulerHookedStore'
import {
  animalMandarinCards,
  geographyQuestion,
  mandarinFrontier,
  mandarinQuestion,
  type FishingMode,
  type FishingQuizModule,
  type FishingQuizQuestion,
  type MandarinQuizScope,
} from '~/utils/rulerHooked/quiz'

const SETTINGS_KEY = 'kind-robots:ruler-hooked:study-mode:v1'
const MODULES: FishingQuizModule[] = ['flags', 'capitals', 'mandarin']
type ModuleToggles = Record<FishingQuizModule, boolean>
type Progress = Record<FishingQuizModule, number>
type CardProgress = { repetitions: number; dueAt: string }

export const useRulerHookedQuizStore = defineStore('rulerHookedQuiz', () => {
  const fishing = useRulerHookedStore()
  const tutor = useMandarinTutorStore()
  const mode = ref<FishingMode>('classic')
  const mandarinScope = ref<MandarinQuizScope>('all')
  const modules = ref<ModuleToggles>({
    flags: true,
    capitals: true,
    mandarin: false,
  })
  const correct = ref<Progress>({ flags: 0, capitals: 0, mandarin: 0 })
  const question = ref<FishingQuizQuestion | null>(null)
  const introduction = ref(false)
  const feedback = ref('')
  const answerSheet = ref(false)
  const pendingCatch = ref(false)
  const answerWasCorrect = computed(() => answerSheet.value && pendingCatch.value)
  const loading = ref(false)
  const error = ref('')
  const mandarinSynced = ref(false)
  const tracked = ref<Record<string, CardProgress>>({})
  const lastId = ref<string | null>(null)
  const lastModule = ref<FishingQuizModule | null>(null)
  let initialized = false
  let catalogAttempted = false

  const enabled = computed(() =>
    MODULES.filter((module) => modules.value[module]),
  )
  const currentMandarinCard = computed(() =>
    question.value?.cardKey
      ? (tutor.cards.find((card) => card.key === question.value?.cardKey) ??
        null)
      : null,
  )
  const currentArt = computed(() => {
    const key = question.value?.cardKey
    return key
      ? tutor.canonicalArtUrls[key] || tutor.illustrationUrl(key) || ''
      : ''
  })

  function saveSettings() {
    if (!import.meta.client) return
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        mode: mode.value,
        mandarinScope: mandarinScope.value,
        modules: modules.value,
        correct: correct.value,
      }),
    )
  }

  function initialize() {
    if (initialized || !import.meta.client) return
    initialized = true
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        mode?: FishingMode
        mandarinScope?: MandarinQuizScope
        modules?: Partial<ModuleToggles>
        correct?: Partial<Progress>
      }
      if (parsed.mode === 'quiz' || parsed.mode === 'classic')
        mode.value = parsed.mode
      if (parsed.mandarinScope === 'animals' || parsed.mandarinScope === 'all')
        mandarinScope.value = parsed.mandarinScope
      if (parsed.modules) {
        for (const module of MODULES) {
          if (typeof parsed.modules[module] === 'boolean')
            modules.value[module] = parsed.modules[module]
        }
      }
      if (parsed.correct) {
        for (const module of MODULES) {
          const value = parsed.correct[module]
          if (
            typeof value === 'number' &&
            Number.isFinite(value) &&
            value >= 0
          ) {
            correct.value[module] = Math.floor(value)
          }
        }
      }
      if (!enabled.value.length) modules.value.flags = true
    } catch {
      localStorage.removeItem(SETTINGS_KEY)
    }
  }

  function setMode(next: FishingMode) {
    mode.value = next
    resetQuestion()
    saveSettings()
  }

  function setMandarinScope(next: MandarinQuizScope) {
    mandarinScope.value = next
    resetQuestion()
    saveSettings()
  }

  function toggleModule(module: FishingQuizModule) {
    modules.value[module] = !modules.value[module]
    if (!enabled.value.length) modules.value[module] = true
    resetQuestion()
    saveSettings()
  }

  function resetQuestion() {
    question.value = null
    introduction.value = false
    feedback.value = ''
    answerSheet.value = false
    pendingCatch.value = false
    error.value = ''
  }

  async function loadMandarin() {
    if (catalogAttempted) return
    catalogAttempted = true
    await tutor.initialize()
    if (!tutor.cards.length) {
      error.value =
        tutor.error ||
        'Mandarin lessons are unavailable. Retry or choose Classic.'
      return
    }
    const keys = [
      ...new Set([
        ...tutor.cards
          .filter((card) => (card.hskLevel ?? 99) <= 2)
          .slice(0, 300)
          .map((card) => card.key),
        ...animalMandarinCards(tutor.cards).map((card) => card.key),
      ]),
    ].slice(0, 500)
    try {
      const response = await performFetch<{
        cards?: Record<string, CardProgress>
      }>(
        '/api/mandarin/study/progress?cardKeys=' +
          encodeURIComponent(keys.join(',')),
        {},
        1,
        15000,
      )
      if (response.success && response.data?.cards) {
        tracked.value = response.data.cards
        mandarinSynced.value = true
      }
    } catch {
      mandarinSynced.value = false
    }
  }

  async function nextQuestion() {
    initialize()
    resetQuestion()
    if (mode.value !== 'quiz' || !fishing.activeFishing) return
    loading.value = true
    try {
      const available = [...enabled.value]
      if (!available.length) return
      const rotate = available.filter((module) => module !== lastModule.value)
      const choices = rotate.length ? rotate : available
      const selected = choices[Math.floor(Math.random() * choices.length)]!
      if (selected === 'mandarin') {
        await loadMandarin()
        const card = mandarinFrontier(
          tutor.cards,
          tracked.value,
          lastId.value?.replace(/^mandarin:/, '') ?? null,
          correct.value.mandarin,
          Math.random,
          mandarinScope.value,
        )
        if (!card) {
          const backup = available.find((module) => module !== 'mandarin')
          if (!backup) {
            error.value =
              'No Mandarin words loaded. Choose Retry or switch to Classic in Settings.'
            return
          }
          question.value = geographyQuestion(
            backup,
            correct.value[backup],
            lastId.value,
          )
        } else {
          question.value = mandarinQuestion(
            card,
            mandarinScope.value === 'animals'
              ? animalMandarinCards(tutor.cards)
              : tutor.cards,
          )
          introduction.value =
            mandarinScope.value !== 'animals' &&
            !tutor.lessonIsComplete(card.key) &&
            (tracked.value[card.key]?.repetitions ?? 0) === 0
          void tutor.probeCanonicalIllustration(card.key)
        }
      } else {
        question.value = geographyQuestion(
          selected,
          correct.value[selected],
          lastId.value,
        )
      }
      lastId.value = question.value?.id ?? null
      lastModule.value = question.value?.module ?? null
    } finally {
      loading.value = false
    }
  }

  async function finishIntroduction() {
    const card = currentMandarinCard.value
    if (!card) return
    introduction.value = false
    if (!tutor.lessonIsComplete(card.key)) {
      await tutor.completeLesson(card.key)
    }
  }

  function answer(id: string): boolean {
    const active = question.value
    if (
      !active ||
      introduction.value ||
      feedback.value ||
      !fishing.activeFishing
    )
      return false
    const succeeded = id === active.correctId
    if (active.module === 'mandarin' && active.cardKey) {
      tutor.rateCard(active.cardKey, succeeded ? 'good' : 'again')
      tracked.value[active.cardKey] = {
        repetitions: succeeded
          ? (tracked.value[active.cardKey]?.repetitions ?? 0) + 1
          : 0,
        dueAt: succeeded
          ? new Date(Date.now() + 86400000).toISOString()
          : new Date(0).toISOString(),
      }
    }
    if (succeeded) {
      correct.value[active.module] += 1
      saveSettings()
      feedback.value = active.explanation
      if (active.module === 'mandarin') {
        answerSheet.value = true
        pendingCatch.value = true
      } else {
        fishing.landQuizFish()
      }
      return true
    }
    feedback.value =
      'Not quite. ' +
      active.explanation +
      ' Another question can still land this fish.'
    if (active.module === 'mandarin') answerSheet.value = true
    return false
  }

  function finishAnswerSheet() {
    if (!answerSheet.value || !question.value || question.value.module !== 'mandarin') return
    const card = currentMandarinCard.value
    const caught = pendingCatch.value
    answerSheet.value = false
    pendingCatch.value = false
    if (card && !tutor.lessonIsComplete(card.key)) void tutor.completeLesson(card.key)
    if (caught) fishing.landQuizFish()
    else void nextQuestion()
  }

  function retryLoading() {
    catalogAttempted = false
    error.value = ''
    void nextQuestion()
  }

  return {
    mode,
    mandarinScope,
    modules,
    correct,
    enabled,
    question,
    introduction,
    feedback,
    answerSheet,
    answerWasCorrect,
    loading,
    error,
    mandarinSynced,
    currentMandarinCard,
    currentArt,
    initialize,
    setMode,
    setMandarinScope,
    toggleModule,
    nextQuestion,
    finishIntroduction,
    answer,
    finishAnswerSheet,
    retryLoading,
    resetQuestion,
  }
})
