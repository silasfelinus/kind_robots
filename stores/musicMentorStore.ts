// /stores/musicMentorStore.ts
//
// Front-end store for the Music Mentor page. Extracts audio features in the
// browser (composables/useAudioAnalysis), then POSTs only the compact numeric
// summary + setlist + selected dimensions to /api/music-mentor/analyze and keeps
// the returned coaching feedback. The audio itself never leaves the device and
// nothing is persisted. A single synchronous request — no enqueue/poll — so this
// is a slimmer cousin of stores/videoStore.ts.
import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'
import { performFetch } from '@/stores/utils'
import {
  analyzeAudioFile,
  type AudioFeatureSummary,
} from '@/composables/useAudioAnalysis'

export type MentorDimension =
  'intonation' | 'timing' | 'dynamics' | 'arrangement'

export type MentorStatus = 'idle' | 'extracting' | 'thinking' | 'done' | 'error'

export interface AnalyzeParams {
  file: File
  setlist: string
  dimensions: MentorDimension[]
}

interface AnalyzeResponse {
  feedback: string
  dimensions: MentorDimension[]
}

export const useMusicMentorStore = defineStore('musicMentorStore', () => {
  const state = reactive({
    status: 'idle' as MentorStatus,
    features: null as AudioFeatureSummary | null,
    feedback: '',
    dimensions: [] as MentorDimension[],
    message: '',
    error: '',
  })

  const isBusy = computed(
    () => state.status === 'extracting' || state.status === 'thinking',
  )

  function reset(): void {
    state.status = 'idle'
    state.features = null
    state.feedback = ''
    state.dimensions = []
    state.message = ''
    state.error = ''
  }

  async function analyze(params: AnalyzeParams): Promise<void> {
    reset()
    state.status = 'extracting'
    state.message = 'Listening to your recording in the browser…'

    try {
      const features = await analyzeAudioFile(params.file)
      state.features = features

      state.status = 'thinking'
      state.message = 'Thinking through your take and arrangement…'

      const res = await performFetch<AnalyzeResponse>(
        '/api/music-mentor/analyze',
        {
          method: 'POST',
          body: JSON.stringify({
            features,
            setlist: params.setlist,
            dimensions: params.dimensions,
          }),
        },
        2,
        90_000,
      )

      if (!res.success || !res.data?.feedback) {
        throw new Error(
          res.message || 'The mentor could not generate feedback.',
        )
      }

      state.feedback = res.data.feedback
      state.dimensions = res.data.dimensions ?? params.dimensions
      state.status = 'done'
      state.message = ''
    } catch (err) {
      state.status = 'error'
      state.error = err instanceof Error ? err.message : String(err)
      state.message = ''
    }
  }

  return { state, isBusy, reset, analyze }
})
