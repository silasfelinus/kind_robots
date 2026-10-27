import { defineStore } from 'pinia'
import { ref } from 'vue'
import { performFetch } from '~/stores/utils'
import {
  baseRedshirtDraft,
  redshirtBrief,
  redshirtChanges,
  redshirtPortraitPrompt,
  type RedshirtAction,
  type RedshirtDraft,
} from '~/utils/playbookForge/redshirtAtlas'
import { REDSHIRT_BY_ID } from '~/utils/gameOfCaptains/redshirts'
import { PLAYBOOK_ART_LANES, playbookArtRequest } from '~/utils/playbook/artLanes'

const KEY = 'kr-forge-redshirt-atlas-v1'
type PortraitJob = { id: number; imageUrl: string | null; status: string }
type Snapshot = {
  drafts: Record<string, RedshirtDraft>
  portraits: Record<string, PortraitJob>
}

export const usePlaybookForgeRedshirtsStore = defineStore('playbookForgeRedshirts', () => {
  const drafts = ref<Record<string, RedshirtDraft>>({})
  const portraits = ref<Record<string, PortraitJob>>({})
  const status = ref('')
  const posting = ref(false)
  const loaded = ref(false)

  function persist() {
    try {
      globalThis.localStorage?.setItem(
        KEY,
        JSON.stringify({ drafts: drafts.value, portraits: portraits.value }),
      )
    } catch {
      status.value = 'Browser storage is unavailable; local drafts last only this visit.'
    }
  }

  function load() {
    if (loaded.value) return
    loaded.value = true
    try {
      const raw = globalThis.localStorage?.getItem(KEY)
      if (!raw) return
      const data = JSON.parse(raw) as Partial<Snapshot>
      if (data.drafts && typeof data.drafts === 'object') drafts.value = data.drafts
      if (data.portraits && typeof data.portraits === 'object') portraits.value = data.portraits
    } catch {
      status.value = 'Stored redshirt drafts could not be read.'
    }
  }

  function forPerson(id: string): RedshirtDraft | null {
    const person = REDSHIRT_BY_ID[id]
    if (!person) return null
    return { ...baseRedshirtDraft(person), ...drafts.value[id] }
  }

  function save(id: string, draft: RedshirtDraft) {
    if (!REDSHIRT_BY_ID[id]) return
    drafts.value = { ...drafts.value, [id]: { ...draft } }
    persist()
  }

  async function submit(id: string, draft: RedshirtDraft, action: RedshirtAction) {
    const person = REDSHIRT_BY_ID[id]
    if (!person || posting.value) return false
    if (action === 'edit' && !redshirtChanges(person, draft).length) {
      status.value = 'No changes to propose yet.'
      return false
    }
    if (!draft.note.trim() && !draft.referenceKey && action !== 'edit') {
      status.value = 'Add a direction or linked reference first.'
      return false
    }
    save(id, draft)
    posting.value = true
    status.value = 'Sending the design brief to Space Couch’s master issue…'
    try {
      const res = await performFetch<{ issue: number; url: string }>(
        '/api/playbook-forge/adjustment',
        {
          method: 'POST',
          body: JSON.stringify({
            slug: 'game-of-captains',
            title: 'Space Couch',
            note: redshirtBrief(person, draft, action),
            changes: [],
            additions: [],
            combos: '',
          }),
        },
        0,
        20000,
      )
      if (!res.success || !res.data) {
        status.value = 'Not submitted: ' + (res.message || 'GitHub is unavailable. The draft is saved locally.')
        return false
      }
      status.value = `Posted to issue #${res.data.issue}: ${res.data.url}`
      return true
    } finally {
      posting.value = false
    }
  }

  /** Whole-roster idea, deliberately distinct from editing one named person. */
  async function submitRosterDirection(note: string) {
    const message = note.trim()
    if (!message || posting.value) return false
    posting.value = true
    status.value = 'Sending overall redshirt direction…'
    try {
      const res = await performFetch<{ issue: number; url: string }>(
        '/api/playbook-forge/adjustment',
        {
          method: 'POST',
          body: JSON.stringify({
            slug: 'game-of-captains',
            title: 'Space Couch',
            note: `Overall direction for all 100 Space Couch redshirts:\\n\\n${message}`,
            changes: [],
            additions: [],
            combos: '',
          }),
        },
        0,
        20000,
      )
      if (!res.success || !res.data) {
        status.value = 'Direction not submitted: ' + (res.message || 'GitHub is unavailable.')
        return false
      }
      status.value = `Overall direction posted to issue #${res.data.issue}: ${res.data.url}`
      return true
    } finally {
      posting.value = false
    }
  }

  /** Queue a concept portrait. The generated image is NOT canonically wired into the game. */
  async function render(id: string) {
    const person = REDSHIRT_BY_ID[id]
    const lane = PLAYBOOK_ART_LANES.find((item) => item.key === 'krea2')
    if (!person || !lane || posting.value) return
    posting.value = true
    status.value = 'Queueing the character portrait…'
    try {
      const res = await performFetch<{ jobId?: number }>(
        '/api/art/enqueue',
        {
          method: 'POST',
          body: JSON.stringify(
            playbookArtRequest(
              lane,
              redshirtPortraitPrompt(person, forPerson(id) ?? baseRedshirtDraft(person)),
              'portrait',
              Math.floor(Math.random() * 2_000_000_000),
              {
                projectSlug: 'game-of-captains',
                designer: `Space Couch redshirt ${person.id} ${person.name}`,
              },
            ),
          ),
        },
      )
      const jobId = Number(res.data?.jobId)
      if (!res.success || !Number.isInteger(jobId) || jobId <= 0) {
        status.value = 'Portrait not queued: ' + (res.message || 'No ArtJob returned.')
        return
      }
      portraits.value = { ...portraits.value, [id]: { id: jobId, status: 'QUEUED', imageUrl: null } }
      status.value = `ArtJob #${jobId} queued; delivery still needs to be wired into the game.`
      persist()
    } finally {
      posting.value = false
    }
  }

  async function refresh(id: string) {
    const portrait = portraits.value[id]
    if (!portrait) return
    const res = await performFetch<{ job?: { status?: string; artImageId?: number | null } }>(
      `/api/art/queue/${portrait.id}`,
    )
    const job = res.data?.job
    if (!res.success || !job) {
      status.value = 'Unable to retrieve the portrait job.'
      return
    }
    const imageUrl =
      job.status === 'DONE' && job.artImageId
        ? `/api/art/images/${job.artImageId}/file`
        : null
    portraits.value = {
      ...portraits.value,
      [id]: { ...portrait, status: job.status ?? 'QUEUED', imageUrl },
    }
    status.value = imageUrl
      ? `ArtJob #${portrait.id} rendered; concept ready for in-game wiring.`
      : `ArtJob #${portrait.id}: ${job.status ?? 'QUEUED'}.`
    persist()
  }

  return { drafts, portraits, status, posting, load, forPerson, save, submit, submitRosterDirection, render, refresh }
})
