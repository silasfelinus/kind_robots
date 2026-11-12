import { defineStore } from 'pinia'
import { useMandarinTutorStore } from './mandarinTutorStore'
import { performFetch } from './utils'
import { useRulerHookedStore } from './rulerHookedStore'
import { useAchievementStore } from './achievementStore'
import { rulerHookedQuizDeeds } from '~/utils/rulerHooked/achievements'
import {
  animalMandarinCards,
  geographyQuestion,
  isMandarinQuizScope,
  mandarinTopicCards,
  mandarinFrontier,
  mandarinQuestion,
  type FishingMode,
  type FishingQuizModule,
  type FishingQuizQuestion,
  type FishingQuizDifficulty,
  type FishingLessonMode,
  type FishingPromptDirection,
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
  const lessonMode = ref<FishingLessonMode>('guided')
  const difficulty = ref<FishingQuizDifficulty>('standard')
  const promptDirection = ref<FishingPromptDirection>('forward')
  const referenceDetail = ref<'quick' | 'full'>('full')
  const introducedKeys = ref<string[]>([])
  const topicCorrect = ref<Record<string, number>>({})
  const attempts = ref<Progress>({ flags: 0, capitals: 0, mandarin: 0 })
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
  const answerWasCorrect = computed(
    () => answerSheet.value && pendingCatch.value,
  )
  const loading = ref(false)
  const error = ref('')
  const mandarinSynced = ref(false)
  const tracked = ref<Record<string, CardProgress>>({})
  const lastId = ref<string | null>(null)
  const lastModule = ref<FishingQuizModule | null>(null)
  let initialized = false
  let catalogAttempted = false
  let progressScopeLoaded: string | null = null

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
        lessonMode: lessonMode.value,
        difficulty: difficulty.value,
        promptDirection: promptDirection.value,
        referenceDetail: referenceDetail.value,
        introducedKeys: introducedKeys.value,
        topicCorrect: topicCorrect.value,
        attempts: attempts.value,
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
        lessonMode?: FishingLessonMode
        difficulty?: FishingQuizDifficulty
        promptDirection?: FishingPromptDirection
        referenceDetail?: 'quick' | 'full'
        introducedKeys?: string[]
        topicCorrect?: Record<string, number>
        attempts?: Partial<Progress>
        modules?: Partial<ModuleToggles>
        correct?: Partial<Progress>
      }
      if (parsed.mode === 'quiz' || parsed.mode === 'classic')
        mode.value = parsed.mode
      if (parsed.mandarinScope && isMandarinQuizScope(parsed.mandarinScope))
        mandarinScope.value = parsed.mandarinScope
      if (
        parsed.lessonMode === 'guided' ||
        parsed.lessonMode === 'always' ||
        parsed.lessonMode === 'quiz-first'
      )
        lessonMode.value = parsed.lessonMode
      if (
        parsed.difficulty === 'easy' ||
        parsed.difficulty === 'standard' ||
        parsed.difficulty === 'challenge'
      )
        difficulty.value = parsed.difficulty
      if (
        parsed.promptDirection === 'forward' ||
        parsed.promptDirection === 'reverse' ||
        parsed.promptDirection === 'mixed'
      )
        promptDirection.value = parsed.promptDirection
      if (
        parsed.referenceDetail === 'quick' ||
        parsed.referenceDetail === 'full'
      )
        referenceDetail.value = parsed.referenceDetail
      if (Array.isArray(parsed.introducedKeys))
        introducedKeys.value = parsed.introducedKeys
          .filter((key): key is string => typeof key === 'string')
          .slice(-1500)
      if (parsed.topicCorrect && typeof parsed.topicCorrect === 'object') {
        for (const [key, value] of Object.entries(parsed.topicCorrect))
          if (
            isMandarinQuizScope(key) &&
            Number.isSafeInteger(value) &&
            value >= 0
          )
            topicCorrect.value[key] = value
      }
      if (parsed.attempts) {
        for (const module of MODULES) {
          const value = parsed.attempts[module]
          if (
            typeof value === 'number' &&
            Number.isSafeInteger(value) &&
            value >= 0
          )
            attempts.value[module] = value
        }
      }
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
    if (!isMandarinQuizScope(next)) return
    mandarinScope.value = next
    progressScopeLoaded = null
    resetQuestion()
    saveSettings()
  }

  function setLessonMode(next: FishingLessonMode) {
    lessonMode.value = next
    resetQuestion()
    saveSettings()
  }

  function setDifficulty(next: FishingQuizDifficulty) {
    difficulty.value = next
    resetQuestion()
    saveSettings()
  }

  function setPromptDirection(next: FishingPromptDirection) {
    promptDirection.value = next
    resetQuestion()
    saveSettings()
  }

  function setReferenceDetail(next: 'quick' | 'full') {
    referenceDetail.value = next
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
    if (catalogAttempted && progressScopeLoaded === mandarinScope.value) return
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
        ...mandarinTopicCards(tutor.cards, mandarinScope.value).map(
          (card) => card.key,
        ),
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
        tracked.value = { ...tracked.value, ...response.data.cards }
        mandarinSynced.value = true
      }
    } catch {
      mandarinSynced.value = false
    }
    progressScopeLoaded = mandarinScope.value
  }

  function reversedQuestion(): boolean {
    return (
      promptDirection.value === 'reverse' ||
      (promptDirection.value === 'mixed' && Math.random() < 0.5)
    )
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
          mandarinScope.value === 'all'
            ? correct.value.mandarin
            : (topicCorrect.value[mandarinScope.value] ?? 0),
          Math.random,
          mandarinScope.value,
          difficulty.value,
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
            Math.random,
            difficulty.value,
            reversedQuestion(),
          )
        } else {
          question.value = mandarinQuestion(
            card,
            mandarinScope.value === 'animals'
              ? animalMandarinCards(tutor.cards)
              : mandarinTopicCards(tutor.cards, mandarinScope.value),
            Math.random,
            difficulty.value,
            reversedQuestion(),
          )
          void tutor.probeCanonicalIllustration(card.key)
        }
      } else {
        question.value = geographyQuestion(
          selected,
          correct.value[selected],
          lastId.value,
          Math.random,
          difficulty.value,
          reversedQuestion(),
        )
      }
      if (question.value)
        introduction.value =
          question.value.module === 'mandarin' &&
          (lessonMode.value === 'always' ||
            (lessonMode.value === 'guided' &&
              !introducedKeys.value.includes(question.value.id)))
      lastId.value = question.value?.id ?? null
      lastModule.value = question.value?.module ?? null
    } finally {
      loading.value = false
    }
  }

  async function finishIntroduction() {
    const active = question.value
    if (!active) return
    introduction.value = false
    if (!introducedKeys.value.includes(active.id))
      introducedKeys.value = [...introducedKeys.value, active.id].slice(-1500)
    saveSettings()
    const card = currentMandarinCard.value
    if (card && !tutor.lessonIsComplete(card.key))
      await tutor.completeLesson(card.key)
  }

  function answer(id: string): boolean {
    const active = question.value
    if (
      !active ||
      introduction.value ||
      answerSheet.value ||
      feedback.value ||
      !fishing.activeFishing
    )
      return false
    const succeeded = id === active.correctId
    attempts.value[active.module] += 1
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
      if (active.module === 'mandarin')
        topicCorrect.value[mandarinScope.value] =
          (topicCorrect.value[mandarinScope.value] ?? 0) + 1
      saveSettings()
      const achievements = useAchievementStore()
      for (const code of rulerHookedQuizDeeds(
        active.module,
        correct.value[active.module],
      ))
        void achievements.rewardAchievementByCode(code)
      feedback.value = active.explanation
      settleAnswer(true)
      return true
    }
    feedback.value =
      'Not quite. ' +
      active.explanation +
      ' Another question can still land this fish.'
    answerSheet.value = true
    saveSettings()
    return false
  }

  function settleAnswer(caught: boolean) {
    const card = currentMandarinCard.value
    answerSheet.value = false
    pendingCatch.value = false
    if (card && !tutor.lessonIsComplete(card.key))
      void tutor.completeLesson(card.key)
    if (caught) fishing.landQuizFish()
    else void nextQuestion()
  }

  function finishAnswerSheet() {
    if (!answerSheet.value || !question.value) return
    settleAnswer(pendingCatch.value)
  }

  function retryLoading() {
    catalogAttempted = false
    progressScopeLoaded = null
    error.value = ''
    void nextQuestion()
  }

  return {
    mode,
    mandarinScope,
    lessonMode,
    difficulty,
    promptDirection,
    referenceDetail,
    topicCorrect,
    attempts,
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
    setLessonMode,
    setDifficulty,
    setPromptDirection,
    setReferenceDetail,
    toggleModule,
    nextQuestion,
    finishIntroduction,
    answer,
    finishAnswerSheet,
    retryLoading,
    resetQuestion,
  }
})
