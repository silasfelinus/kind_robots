// stores/conductorStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  ConductorData,
  ConductorProject,
  ConductorPitch,
} from '@/server/api/conductor/projects.get'
import { CONDUCTOR_CARDS } from '@/stores/helpers/conductorCards'
import { performFetch } from '@/stores/utils'

export type PitchVote = 'approved' | 'passed'
export type PitchStatus =
  | 'awaiting-silas'
  | 'approved'
  | 'rejected'
  | 'duplicate'
  | 'superseded'
  | 'archived'
export type PitchBucket = 'review' | 'approved' | 'rejected' | 'archived'

const LEGACY_VOTE_KEY = 'kr.workspacePitchVotes'
const CONDUCTOR_IMG_BASE =
  'https://raw.githubusercontent.com/silasfelinus/conductor/main/projects/images'

const fallbackProjects: ConductorProject[] = CONDUCTOR_CARDS.map((card) => ({
  slug: card.key,
  name: card.label || card.title || card.key,
  kind: card.projectKind,
  milestones: [],
  tasks: [
    {
      id: `${card.key}-fallback`,
      milestone: 'fallback',
      title: card.description || card.title || card.label || card.key,
      status: card.taskStatus,
      owner: null,
      passes: 0,
      stakes: card.tagline,
      gateHuman: card.taskStatus === 'needs-human',
      note: card.description,
      dependsOn: null,
      approvedByHuman: false,
      updated: null,
    },
  ],
  progress: card.taskStatus === 'done' ? 100 : 0,
  imagePath: `${CONDUCTOR_IMG_BASE}/${card.key}-icon.webp`,
  cardPath: `${CONDUCTOR_IMG_BASE}/${card.key}-card.webp`,
  heroPath: `${CONDUCTOR_IMG_BASE}/${card.key}-hero.webp`,
  notesFromSilas: card.description,
}))

export function normalizePitchStatus(status?: string | null): PitchStatus {
  const value = (status ?? '').trim().toLowerCase()
  if (value === 'approved') return 'approved'
  if (['rejected', 'passed', 'declined'].includes(value)) return 'rejected'
  if (value === 'duplicate') return 'duplicate'
  if (value === 'superseded') return 'superseded'
  if (['archived', 'retired', 'withdrawn'].includes(value)) return 'archived'
  return 'awaiting-silas'
}

export function pitchBucket(status?: string | null): PitchBucket {
  const normalized = normalizePitchStatus(status)
  if (normalized === 'approved') return 'approved'
  if (normalized === 'rejected') return 'rejected'
  if (
    normalized === 'duplicate' ||
    normalized === 'superseded' ||
    normalized === 'archived'
  ) {
    return 'archived'
  }
  return 'review'
}

function clearLegacyVotes(): void {
  if (!import.meta.client) return
  try {
    localStorage.removeItem(LEGACY_VOTE_KEY)
  } catch {}
}

export const useConductorStore = defineStore('conductor', () => {
  const data = ref<ConductorData | null>(null)
  const pending = ref(false)
  const error = ref<string | null>(null)
  const pitchUpdateError = ref<string | null>(null)
  const updatingPitchSlugs = ref<string[]>([])
  const optimisticPitchStatuses = ref<Record<string, PitchStatus>>({})

  const liveProjects = computed<ConductorProject[]>(
    () => data.value?.projects ?? [],
  )
  const projects = computed<ConductorProject[]>(() =>
    liveProjects.value.length ? liveProjects.value : fallbackProjects,
  )
  const pitches = computed<ConductorPitch[]>(() => data.value?.pitches ?? [])
  const fetchedAt = computed(() => data.value?.fetchedAt ?? null)
  const hasLoaded = computed(
    () => data.value !== null || fallbackProjects.length > 0,
  )

  function pitchStatus(slug: string): PitchStatus {
    const optimistic = optimisticPitchStatuses.value[slug]
    if (optimistic) return optimistic
    const pitch = pitches.value.find((entry) => entry.slug === slug)
    return normalizePitchStatus(pitch?.status)
  }

  const pendingPitches = computed(() =>
    pitches.value.filter((pitch) => pitchBucket(pitchStatus(pitch.slug)) === 'review'),
  )
  const approvedPitches = computed(() =>
    pitches.value.filter(
      (pitch) => pitchBucket(pitchStatus(pitch.slug)) === 'approved',
    ),
  )
  const rejectedPitches = computed(() =>
    pitches.value.filter(
      (pitch) => pitchBucket(pitchStatus(pitch.slug)) === 'rejected',
    ),
  )
  const archivedPitches = computed(() =>
    pitches.value.filter(
      (pitch) => pitchBucket(pitchStatus(pitch.slug)) === 'archived',
    ),
  )

  async function fetchProjects(force = false): Promise<void> {
    if (pending.value) return
    if (data.value !== null && !force) return
    pending.value = true
    error.value = null
    try {
      data.value = await $fetch<ConductorData>('/api/conductor/projects')
      clearLegacyVotes()
    } catch (cause) {
      error.value = fallbackProjects.length
        ? null
        : cause instanceof Error
          ? cause.message
          : String(cause)
    } finally {
      pending.value = false
    }
  }

  function replacePitchStatus(slug: string, status: PitchStatus): void {
    if (!data.value) return
    data.value = {
      ...data.value,
      pitches: data.value.pitches.map((pitch) =>
        pitch.slug === slug ? { ...pitch, status } : pitch,
      ),
    }
  }

  async function updatePitchStatus(
    slug: string,
    status: PitchStatus,
  ): Promise<boolean> {
    if (updatingPitchSlugs.value.includes(slug)) return false

    updatingPitchSlugs.value = [...updatingPitchSlugs.value, slug]
    optimisticPitchStatuses.value = {
      ...optimisticPitchStatuses.value,
      [slug]: status,
    }
    pitchUpdateError.value = null

    try {
      const response = await performFetch<{ status: PitchStatus }>(
        '/api/conductor/pitch-vote',
        {
          method: 'POST',
          body: JSON.stringify({ slug, vote: status }),
        },
      )

      if (!response.success) {
        throw new Error(response.message || 'Pitch status update failed')
      }

      replacePitchStatus(slug, status)
      return true
    } catch (cause) {
      pitchUpdateError.value =
        cause instanceof Error ? cause.message : 'Pitch status update failed'
      return false
    } finally {
      const next = { ...optimisticPitchStatuses.value }
      delete next[slug]
      optimisticPitchStatuses.value = next
      updatingPitchSlugs.value = updatingPitchSlugs.value.filter(
        (entry) => entry !== slug,
      )
    }
  }

  function pitchVote(slug: string): PitchVote | null {
    const status = pitchStatus(slug)
    if (status === 'approved') return 'approved'
    if (status !== 'awaiting-silas') return 'passed'
    return null
  }

  function voteOnPitch(slug: string, choice: PitchVote): Promise<boolean> {
    return updatePitchStatus(
      slug,
      choice === 'approved' ? 'approved' : 'rejected',
    )
  }

  function clearVote(slug: string): Promise<boolean> {
    return updatePitchStatus(slug, 'awaiting-silas')
  }

  return {
    data,
    pending,
    error,
    pitchUpdateError,
    updatingPitchSlugs,
    projects,
    pitches,
    fetchedAt,
    hasLoaded,
    pendingPitches,
    approvedPitches,
    rejectedPitches,
    archivedPitches,
    fetchProjects,
    pitchStatus,
    updatePitchStatus,
    pitchVote,
    voteOnPitch,
    clearVote,
  }
})
