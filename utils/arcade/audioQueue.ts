export type ArcadeAudioJobSummary = {
  id: number
  status: string
  createdAt: string
}

export type ArcadeAudioQueueEntry = {
  game: string
  cue: string
  jobKey: string
  brief: {
    kind: 'music' | 'sfx'
    mood: string
    instrumentation: readonly string[]
    prompt: string
    seconds: number
    bpm?: number
  }
  job: ArcadeAudioJobSummary | null
}

export type ArcadeAudioQueueData = {
  generationEnabled: boolean
  relay: { ready: boolean; reason: string; agentIds: string[] }
  entries: ArcadeAudioQueueEntry[]
}

const COVERED_JOB_STATES = new Set(['PENDING', 'RUNNING', 'DONE'])

export function arcadeAudioCueState(
  entry: ArcadeAudioQueueEntry,
  queue: ArcadeAudioQueueData,
): { label: string; eligible: boolean } {
  if (entry.job && COVERED_JOB_STATES.has(entry.job.status)) {
    return {
      label:
        entry.job.status === 'DONE'
          ? 'Render complete · needs verified ingestion'
          : entry.job.status === 'RUNNING'
            ? 'Rendering'
            : 'Queued',
      eligible: false,
    }
  }
  if (!queue.generationEnabled)
    return { label: 'Generation disabled by server', eligible: false }
  if (!queue.relay.ready)
    return { label: queue.relay.reason, eligible: false }
  if (entry.job)
    return { label: 'Retry failed render', eligible: true }
  return { label: 'Ready for explicit approval', eligible: true }
}

export function arcadeAudioQueueGames(
  entries: readonly ArcadeAudioQueueEntry[],
): string[] {
  return [...new Set(entries.map((entry) => entry.game))].sort((a, b) =>
    a.localeCompare(b),
  )
}
