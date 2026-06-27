// stores/conductorStore.ts
// Single source of truth for conductor workspace state.
// Owns the API fetch, localStorage-backed pitch votes and project priorities,
// and any shared state consumed by conductor-page or future conductor components.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  ConductorData,
  ConductorProject,
  ConductorPitch,
} from '@/server/api/conductor/projects.get'

export type DreamPriority = 'LOW' | 'NORMAL' | 'HIGH'
export type PitchVote = 'approved' | 'passed'

const VOTE_KEY = 'kr.workspacePitchVotes'
const PRIORITY_KEY = 'kr.projectPriorities'

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

  const projects = computed<ConductorProject[]>(() => data.value?.projects ?? [])
  const pitches = computed<ConductorPitch[]>(() => data.value?.pitches ?? [])
  const fetchedAt = computed(() => data.value?.fetchedAt ?? null)
  const hasLoaded = computed(() => data.value !== null)

  const pendingPitches = computed(() =>
    pitches.value.filter((p) => p.status.includes('awaiting')),
  )

  async function fetchProjects(force = false): Promise<void> {
    if (pending.value) return
    if (hasLoaded.value && !force) return
    pending.value = true
    error.value = null
    try {
      data.value = await $fetch<ConductorData>('/api/conductor/projects')
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      pending.value = false
    }
  }

  // ── Pitch votes (localStorage-backed) ─────────────────────────────────────
  const votedPitches = ref<Record<string, PitchVote>>(
    lsGet<Record<string, PitchVote>>(VOTE_KEY) ?? {},
  )

  function pitchVote(slug: string): PitchVote | null {
    return votedPitches.value[slug] ?? null
  }

  function voteOnPitch(slug: string, choice: PitchVote): void {
    votedPitches.value = { ...votedPitches.value, [slug]: choice }
    lsSet(VOTE_KEY, votedPitches.value)
  }

  function clearVote(slug: string): void {
    const next = { ...votedPitches.value }
    delete next[slug]
    votedPitches.value = next
    lsSet(VOTE_KEY, votedPitches.value)
  }

  // ── Project priorities (localStorage-backed, synced to API) ───────────────
  const localPriorities = ref<Record<number, DreamPriority>>(
    lsGet<Record<number, DreamPriority>>(PRIORITY_KEY) ?? {},
  )

  function getProjectPriority(dreamId?: number | null): DreamPriority {
    if (!dreamId) return 'NORMAL'
    return localPriorities.value[dreamId] ?? 'NORMAL'
  }

  async function setProjectPriority(
    dreamId: number,
    priority: DreamPriority,
  ): Promise<{ ok: boolean; message?: string }> {
    localPriorities.value = { ...localPriorities.value, [dreamId]: priority }
    lsSet(PRIORITY_KEY, localPriorities.value)
    try {
      await $fetch(`/api/dreams/${dreamId}/priority`, {
        method: 'PATCH',
        body: { priority },
      })
      return { ok: true }
    } catch {
      return { ok: false, message: 'Priority save failed (local only)' }
    }
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
    // Project priorities
    localPriorities,
    getProjectPriority,
    setProjectPriority,
  }
})
