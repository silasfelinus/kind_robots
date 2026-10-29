import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch } from '~/stores/utils'
import { useArtJobStore } from '~/stores/artJobStore'
import {
  CAPES_STYLE_CRITERIA,
  CAPES_STYLE_LANES,
  CAPES_STYLE_SUBJECTS,
  capesStyleCellKey,
  type CapesStyleJob,
  type CapesStyleSubjectKey,
} from '~/utils/capesStyleCheck'

type Criterion = (typeof CAPES_STYLE_CRITERIA)[number]['key']
type Review = { scores: Partial<Record<Criterion, number>>; note: string }

const REVIEW_STORAGE_KEY = 'capes-western-style-check-v1-reviews'

export const useCapesStyleCheckStore = defineStore(
  'capesStyleCheckStore',
  () => {
    const artJobs = useArtJobStore()
    const selectedSubject = ref<CapesStyleSubjectKey>(
      CAPES_STYLE_SUBJECTS[0].key,
    )
    const jobs = ref<CapesStyleJob[]>([])
    const reviews = ref<Record<string, Review>>({})
    const loading = ref(false)
    const error = ref('')
    const lastRefresh = ref('')

    const jobMap = computed(() =>
      Object.fromEntries(
        jobs.value.map((job) => [
          capesStyleCellKey(job.subjectKey, job.laneKey),
          job,
        ]),
      ),
    )

    const submitted = computed(() => jobs.value.length)
    const rendered = computed(
      () =>
        jobs.value.filter((job) => job.status === 'DONE' && job.artImageId)
          .length,
    )
    const failed = computed(
      () => jobs.value.filter((job) => job.status === 'FAILED').length,
    )
    const pending = computed(
      () =>
        jobs.value.filter(
          (job) => job.status === 'PENDING' || job.status === 'RUNNING',
        ).length,
    )

    const leaderboard = computed(() =>
      CAPES_STYLE_LANES.map((lane) => {
        const scores = CAPES_STYLE_SUBJECTS.flatMap((subject) => {
          const review = reviews.value[capesStyleCellKey(subject.key, lane.key)]
          return Object.values(review?.scores ?? {}).filter(
            (value): value is number =>
              typeof value === 'number' && value >= 1 && value <= 5,
          )
        })
        return {
          key: lane.key,
          title: lane.title,
          reviewed: scores.length,
          average: scores.length
            ? scores.reduce((total, score) => total + score, 0) / scores.length
            : null,
        }
      }).sort((a, b) => (b.average ?? -1) - (a.average ?? -1)),
    )

    function jobFor(subject: string, lane: string): CapesStyleJob | null {
      return jobMap.value[capesStyleCellKey(subject, lane)] ?? null
    }

    function imageFor(subject: string, lane: string): string {
      const id = jobFor(subject, lane)?.artImageId
      return typeof id === 'number' ? (artJobs.imageSrcById[id] ?? '') : ''
    }

    async function loadImagesForSubject(
      subject: CapesStyleSubjectKey,
    ): Promise<void> {
      const current = jobs.value.filter(
        (job) =>
          job.subjectKey === subject && job.status === 'DONE' && job.artImageId,
      )
      await Promise.all(
        current.map((job) =>
          artJobs.loadJobImage(
            job.artImageId!,
            job.updatedAt ? '?v=' + new Date(job.updatedAt).getTime() : '',
          ),
        ),
      )
    }

    async function refresh(): Promise<void> {
      loading.value = true
      error.value = ''
      try {
        const result = await performFetch<{ jobs: CapesStyleJob[] }>(
          '/api/capes/style-check',
          {},
          1,
          30_000,
        )
        if (!result.success || !result.data) {
          throw new Error(result.message || 'Style check unavailable.')
        }
        jobs.value = result.data.jobs
        lastRefresh.value = new Date().toISOString()
        await loadImagesForSubject(selectedSubject.value)
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : 'Could not load style check.'
      } finally {
        loading.value = false
      }
    }

    async function selectSubject(value: CapesStyleSubjectKey): Promise<void> {
      selectedSubject.value = value
      await loadImagesForSubject(value)
    }

    function restoreReviews(): void {
      if (!import.meta.client) return
      try {
        const saved = localStorage.getItem(REVIEW_STORAGE_KEY)
        if (!saved) return
        const parsed: unknown = JSON.parse(saved)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
          reviews.value = parsed as Record<string, Review>
      } catch {
        reviews.value = {}
      }
    }

    function saveReviews(): void {
      if (!import.meta.client) return
      try {
        localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews.value))
      } catch {
        // Rating still works within the current session without storage.
      }
    }

    function scoreFor(
      subject: string,
      lane: string,
      criterion: Criterion,
    ): number {
      return (
        reviews.value[capesStyleCellKey(subject, lane)]?.scores[criterion] ?? 0
      )
    }

    function noteFor(subject: string, lane: string): string {
      return reviews.value[capesStyleCellKey(subject, lane)]?.note ?? ''
    }

    function setScore(
      subject: string,
      lane: string,
      criterion: Criterion,
      score: number,
    ): void {
      const key = capesStyleCellKey(subject, lane)
      const previous = reviews.value[key] ?? { scores: {}, note: '' }
      const nextScores = { ...previous.scores }
      if (score >= 1 && score <= 5) nextScores[criterion] = score
      else nextScores[criterion] = undefined
      reviews.value = {
        ...reviews.value,
        [key]: { ...previous, scores: nextScores },
      }
      saveReviews()
    }

    function setNote(subject: string, lane: string, value: string): void {
      const key = capesStyleCellKey(subject, lane)
      const previous = reviews.value[key] ?? { scores: {}, note: '' }
      reviews.value = {
        ...reviews.value,
        [key]: { ...previous, note: value.slice(0, 500) },
      }
      saveReviews()
    }

    return {
      selectedSubject,
      jobs,
      loading,
      error,
      lastRefresh,
      submitted,
      rendered,
      failed,
      pending,
      leaderboard,
      jobFor,
      imageFor,
      refresh,
      selectSubject,
      restoreReviews,
      scoreFor,
      noteFor,
      setScore,
      setNote,
    }
  },
)
