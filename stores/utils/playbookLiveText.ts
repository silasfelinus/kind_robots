import { performFetch } from '../utils'
import type { liveTextStore } from '~/utils/playbook/textOverlay'

// Loads the Playbook Manager edits an admin marked live for one game into
// that game's text overlay (conductor weird-humboldt t-037). Resolves true
// when the overlay changed, so the caller can nudge its state and re-render.
export async function loadPlaybookLiveText(
  game: string,
  target: ReturnType<typeof liveTextStore>,
): Promise<boolean> {
  if (!import.meta.client) return false
  const response = await performFetch<Record<string, unknown>>(
    `/api/playbook/${game}/live`,
  )
  if (!response.success || !response.data) return false
  target.set(response.data)
  return true
}
