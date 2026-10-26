export const REVIEW_GAME_SLUGS = [
  'ecotone',
  'emperor-of-dust',
  'shifting-lands',
  'shifting-desks',
  'zuzu-gamebook',
  'crystal-street',
  'comet-city-academy',
  'game-of-captains',
] as const

const TRACE_FIELDS = [
  'seed', 'originSeed', 'version', 'flowVersion', 'mode', 'difficulty', 'day', 'chapter',
  'phase', 'status', 'power', 'signature', 'vow', 'captain', 'crew', 'role',
  'alignment', 'stats', 'meters', 'flags', 'visited', 'visitedSites',
  'health', 'resolve', 'brass', 'prosperity', 'horde', 'trust', 'supplies',
  'influence', 'danger', 'reputation', 'intervention', 'log', 'journal',
  'chronicle', 'reports', 'history', 'events', 'choices', 'decisionLog',
  'completedQuests', 'factions', 'local', 'roster', 'memorials',
  'outcomes', 'score', 'ending', 'bossResolved', 'endings', 'discovered',
  'encounters', 'encounterHistory', 'sceneId', 'position', 'items',
  'achievements', 'questHistory', 'questLog', 'actions', 'trialResults',
  'prepared', 'usedRewards', 'resolved', 'shifts', 'current', 'consequences',
  'riddles', 'decisions', 'quests', 'outcome', 'timeline', 'chapterHistory',
  'branch', 'loans', 'affinity', 'strength', 'mapLog', 'controllers',
  'audiencesHeard', 'chanceHistory', 'active', 'inventory', 'board',
  'revealedFactions', 'wipedOut', 'site', 'checkpoints',
] as const

const FORBIDDEN_FIELD = /^(?:name|playername|realname|username|email|phone|address|pronouns|birthdate|dob|token|password|apikey|auth|session|cookie|userid|deviceid|ipaddress)$/i

function safeValue(value: unknown, depth = 0): unknown {
  if (typeof value === 'string') return value.slice(0, 800)
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (depth >= 7 || !value || typeof value !== 'object') return null
  if (Array.isArray(value))
    return value.slice(0, 1200).map((item) => safeValue(item, depth + 1))
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !FORBIDDEN_FIELD.test(key))
      .slice(0, 70)
      .map(([key, item]) => [key, safeValue(item, depth + 1)]),
  )
}

export function collectPlaybookHistory(run: unknown): Record<string, unknown> {
  if (!run || typeof run !== 'object' || Array.isArray(run)) return {}
  const source = run as Record<string, unknown>
  return Object.fromEntries(
    TRACE_FIELDS.filter((key) => source[key] !== undefined).map((key) => [
      key,
      safeValue(source[key]),
    ]),
  )
}

export function playbookRunKey(run: unknown): string {
  const source = run && typeof run === 'object' ? (run as Record<string, unknown>) : {}
  const seed = source.originSeed ?? source.seed
  if (typeof seed === 'string' || typeof seed === 'number') return String(seed)
  const id = source.id
  if (typeof id === 'string' || typeof id === 'number') return String(id)
  const trace = JSON.stringify(collectPlaybookHistory(run))
  let hash = 2166136261
  for (let index = 0; index < trace.length; index++) {
    hash ^= trace.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return 'legacy-' + (hash >>> 0).toString(16)
}

export type RunReviewSubmission = {
  game: string
  runId: string
  ending: string
  stars: number
  comment: string
  history: Record<string, unknown>
}

export function validateRunReview(raw: unknown): RunReviewSubmission {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error('Invalid review submission.')
  const item = raw as Record<string, unknown>
  if (!REVIEW_GAME_SLUGS.includes(item.game as (typeof REVIEW_GAME_SLUGS)[number]))
    throw new Error('Unknown Playbook game.')
  if (typeof item.runId !== 'string' || !/^[a-f0-9-]{36}$/i.test(item.runId))
    throw new Error('Invalid run identifier.')
  if (!Number.isInteger(item.stars) || Number(item.stars) < 1 || Number(item.stars) > 5)
    throw new Error('Choose a rating from one to five stars.')
  if (typeof item.ending !== 'string' || !item.ending.trim() || item.ending.length > 180)
    throw new Error('A named ending is required.')
  if (item.comment !== undefined && typeof item.comment !== 'string')
    throw new Error('Invalid comment.')
  const comment = (item.comment as string | undefined)?.trim() ?? ''
  if (comment.length > 2000) throw new Error('Comment exceeds 2000 characters.')
  if (!item.history || typeof item.history !== 'object' || Array.isArray(item.history))
    throw new Error('A gameplay trace is required.')
  const history = collectPlaybookHistory(item.history)
  if (JSON.stringify(history).length > 180000)
    throw new Error('Gameplay history exceeds the supported size.')
  return {
    game: item.game as string,
    runId: item.runId,
    ending: item.ending.trim(),
    stars: Number(item.stars),
    comment,
    history,
  }
}
