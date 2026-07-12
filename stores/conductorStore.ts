// stores/conductorStore.ts
// Single source of truth for conductor workspace state.
// Owns the API fetch, localStorage-backed pitch votes, and any shared state
// consumed by conductor-page or future conductor components. Project records
// (status, priority, goal…) live in projectStore against /api/projects.
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

const VOTE_KEY = 'kr.workspacePitchVotes'
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

function lsGet<T>(key: string): T | null {
  if (!import.meta.client) return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function lsSet(key: string, value: unknown): void {
  if (!import.meta.client) return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export const useConductorStore = defineStore('conductor', () => {
  // ── API state ─────────────────────────────────────────────────────────────
  const data = ref<ConductorData | null>(null)
  const pending = ref(false)
  const error = ref<string | null>(null)

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

  const pendingPitches = computed(() =>
    pitches.value.filter((p) => p.status.includes('awaiting')),
  )

  async function fetchProjects(force = false): Promise<void> {
    if (pending.value) return
    if (data.value !== null && !force) return
    pending.value = true
    error.value = null
    try {
      data.value = await $fetch<ConductorData>('/api/conductor/projects')
    } catch (e) {
      error.value = fallbackProjects.length
        ? null
        : e instanceof Error
          ? e.message
          : String(e)
    } finally {
      pending.value = false
    }
  }

  // ── Pitch votes ───────────────────────────────────────────────────────────
  // Stored in localStorage for instant UI feedback; each vote is also
  // persisted to the conductor repo via the pitch-vote API so agents see it.
  const votedPitches = ref<Record<string, PitchVote>>(
    lsGet<Record<string, PitchVote>>(VOTE_KEY) ?? {},
  )

  function pitchVote(slug: string): PitchVote | null {
    return votedPitches.value[slug] ?? null
  }

  function voteOnPitch(slug: string, choice: PitchVote): void {
    votedPitches.value = { ...votedPitches.value, [slug]: choice }
    lsSet(VOTE_KEY, votedPitches.value)
    // pitch-vote is admin-gated server-side; send the signed-in user's JWT.
    performFetch('/api/conductor/pitch-vote', {
      method: 'POST',
      body: JSON.stringify({ slug, vote: choice }),
    }).catch((err) => {
      console.error('[conductor] pitch vote failed to persist to repo:', err)
    })
  }

  function clearVote(slug: string): void {
    const next = { ...votedPitches.value }
    delete next[slug]
    votedPitches.value = next
    lsSet(VOTE_KEY, next)
  }

  return {
    // API state
    data,
    pending,
    error,
    projects,
    pitches,
    fetchedAt,
    hasLoaded,
    pendingPitches,
    fetchProjects,
    // Pitch votes
    votedPitches,
    pitchVote,
    voteOnPitch,
    clearVote,
  }
})
