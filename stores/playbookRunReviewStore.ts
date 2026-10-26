import { defineStore } from 'pinia'
import { ref } from 'vue'
import { performFetch } from '~/stores/utils'
import { collectPlaybookHistory } from '~/utils/playbook/runReview'

type Session = { runId: string; status: 'open' | 'submitted' | 'skipped' }
const SAVE_KEY = 'kr.playbook.run-reviews.v1'

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const value = Math.floor(Math.random() * 16)
    return (c === 'x' ? value : (value & 3) | 8).toString(16)
  })
}

export const usePlaybookRunReviewStore = defineStore('playbookRunReview', () => {
  const sessions = ref<Record<string, Session>>({})
  const saving = ref(false)
  const error = ref('')
  let initialized = false

  function load() {
    if (initialized || !import.meta.client) return
    initialized = true
    try {
      const found = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') as Record<string, Session>
      if (found && typeof found === 'object' && !Array.isArray(found))
        sessions.value = found
    } catch {
      sessions.value = {}
    }
  }

  function persist() {
    if (!import.meta.client) return
    try {
      const recent = Object.entries(sessions.value).slice(-250)
      localStorage.setItem(SAVE_KEY, JSON.stringify(Object.fromEntries(recent)))
    } catch {
      error.value = 'Your browser cannot remember reviewed runs.'
    }
  }

  function key(game: string, runKey: string) {
    return game + ':' + runKey
  }

  function ensure(game: string, runKey: string): Session {
    load()
    const id = key(game, runKey)
    if (!sessions.value[id]) {
      sessions.value[id] = { runId: newId(), status: 'open' }
      persist()
    }
    return sessions.value[id]!
  }

  function begin(game: string, runKey: string) {
    load()
    sessions.value[key(game, runKey)] = { runId: newId(), status: 'open' }
    persist()
  }

  function skip(game: string, runKey: string) {
    ensure(game, runKey).status = 'skipped'
    persist()
  }

  async function submit(game: string, runKey: string, ending: string, stars: number, comment: string, run: unknown) {
    error.value = ''
    const current = ensure(game, runKey)
    if (current.status === 'submitted') return true
    saving.value = true
    try {
      const response = await performFetch('/api/playbook/reviews', {
        method: 'POST',
        body: JSON.stringify({
          game, runId: current.runId, ending, stars, comment,
          history: collectPlaybookHistory(run),
        }),
      })
      if (!response.success) {
        error.value = response.message || 'Review could not be saved. Try again.'
        return false
      }
      current.status = 'submitted'
      persist()
      return true
    } finally {
      saving.value = false
    }
  }

  return { sessions, saving, error, ensure, begin, skip, submit }
})
