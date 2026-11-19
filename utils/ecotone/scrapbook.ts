import {
  COMPANIONS,
  ENDING_IDS,
  LENSES,
  type CompanionId,
  type Fate,
} from './content'
import { endingDossier } from './endingDossier'
import type { RunState } from './engine'

/**
 * The Scrapbook: one browser-local page per finished weekend, kept across
 * runs (main-game standard, STANDARD-AUDIT-2026-11-12 "per-run scrapbook
 * pages"). A page is written once, when a played step reaches the ending, and
 * only from facts the run actually recorded: who you met and followed, a few
 * decisive choices and how their checks went, and the ending you earned.
 */
export const SCRAPBOOK_KEY = 'kr.ecotone.runs.v1'
export const SCRAPBOOK_LIMIT = 30
export const SCRAPBOOK_HIGHLIGHTS = 6

export type ScrapbookHighlight = {
  day: number
  title: string
  choice: string
  outcome: 'success' | 'complication' | null
}

export type ScrapbookPage = {
  /** `<seed>:<ending id>`: one page per finished run, however often it re-saves. */
  id: string
  finishedAt: string
  playerName: string
  archetype: string
  event: string | null
  openingState: string | null
  endingId: string
  endingTitle: string
  fate: Fate
  meetingOrder: CompanionId[]
  /** Who you followed at each crossroads; `null` means you went alone. */
  followed: (CompanionId | null)[]
  decisions: number
  checksPassed: number
  checksFailed: number
  highlights: ScrapbookHighlight[]
}

const COMPANION_IDS = new Set<string>(COMPANIONS.map((c) => c.id))
const LENS_IDS = new Set<string>(LENSES.map((lens) => lens.id))

function companionIds(values: unknown): CompanionId[] {
  return Array.isArray(values)
    ? values.filter(
        (id): id is CompanionId =>
          typeof id === 'string' && COMPANION_IDS.has(id),
      )
    : []
}

function pickHighlights(run: RunState): ScrapbookHighlight[] {
  // Rolled checks are the weekend's turning points; fall back to the
  // earliest choices for a gentle run that never rolled.
  const rolled = run.log.filter((entry) => entry.roll)
  const chosen = (
    rolled.length >= SCRAPBOOK_HIGHLIGHTS
      ? rolled.slice(-SCRAPBOOK_HIGHLIGHTS)
      : [
          // The weekend's event pick already heads the page.
          ...run.log
            .filter((entry) => !entry.roll && entry.source !== 'EVENT')
            .slice(0, SCRAPBOOK_HIGHLIGHTS - rolled.length),
          ...rolled,
        ]
  ).sort((a, b) => a.step - b.step)
  return chosen.map((entry) => ({
    day: entry.day,
    title: entry.title,
    choice: entry.choice,
    outcome: entry.roll
      ? entry.roll.success
        ? 'success'
        : 'complication'
      : null,
  }))
}

/** The page a finished run earns, or null while the weekend is still going. */
export function scrapbookPage(
  run: RunState,
  finishedAt: string,
): ScrapbookPage | null {
  if (run.phase !== 'end' || !run.ending || !ENDING_IDS.includes(run.ending))
    return null
  const dossier = endingDossier(run.ending)
  if (!dossier) return null
  const rolls = run.log.filter((entry) => entry.roll)
  return {
    id: `${run.seed}:${run.ending}`,
    finishedAt,
    playerName: run.playerName || 'Wanderer',
    archetype: run.archetype,
    event: run.event,
    openingState: run.openingState,
    endingId: run.ending,
    endingTitle: dossier.title,
    fate: dossier.fate,
    meetingOrder: companionIds(run.meetingOrder),
    followed: run.followHistory.map((step) =>
      step.to && COMPANION_IDS.has(step.to) ? step.to : null,
    ),
    decisions: run.log.length,
    checksPassed: rolls.filter((entry) => entry.roll?.success).length,
    checksFailed: rolls.filter((entry) => !entry.roll?.success).length,
    highlights: pickHighlights(run),
  }
}

/** Newest first, one page per run, capped so localStorage stays small. */
export function addScrapbookPage(
  pages: readonly ScrapbookPage[],
  page: ScrapbookPage,
): ScrapbookPage[] {
  if (pages.some((existing) => existing.id === page.id)) return [...pages]
  return [page, ...pages].slice(0, SCRAPBOOK_LIMIT)
}

function text(value: unknown, max = 200): string | null {
  return typeof value === 'string' && value.length <= max ? value : null
}

function count(value: unknown): number {
  return Number.isInteger(value) && (value as number) >= 0
    ? (value as number)
    : 0
}

/** Drops anything malformed or forged from storage; never throws. */
export function sanitizeScrapbook(raw: unknown): ScrapbookPage[] {
  if (!Array.isArray(raw)) return []
  const pages: ScrapbookPage[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const page = item as Record<string, unknown>
    const endingId = text(page.endingId)
    const id = text(page.id)
    if (!endingId || !ENDING_IDS.includes(endingId) || !id) continue
    if (pages.some((existing) => existing.id === id)) continue
    const dossier = endingDossier(endingId)
    if (!dossier) continue
    const opening = text(page.openingState)
    pages.push({
      id,
      finishedAt: text(page.finishedAt, 40) ?? '',
      playerName: text(page.playerName, 32) || 'Wanderer',
      archetype: text(page.archetype, 40) ?? '',
      event: text(page.event, 40),
      openingState: opening && LENS_IDS.has(opening) ? opening : null,
      endingId,
      // Titles are re-read from the story so an edited save can't rename one.
      endingTitle: dossier.title,
      fate: dossier.fate,
      meetingOrder: companionIds(page.meetingOrder),
      followed: Array.isArray(page.followed)
        ? page.followed.map((to) =>
            typeof to === 'string' && COMPANION_IDS.has(to)
              ? (to as CompanionId)
              : null,
          )
        : [],
      decisions: count(page.decisions),
      checksPassed: count(page.checksPassed),
      checksFailed: count(page.checksFailed),
      highlights: Array.isArray(page.highlights)
        ? page.highlights
            .flatMap((entry): ScrapbookHighlight[] => {
              if (!entry || typeof entry !== 'object') return []
              const h = entry as Record<string, unknown>
              const title = text(h.title)
              const choice = text(h.choice, 400)
              if (!title || !choice) return []
              const outcome =
                h.outcome === 'success' || h.outcome === 'complication'
                  ? h.outcome
                  : null
              return [{ day: count(h.day), title, choice, outcome }]
            })
            .slice(0, SCRAPBOOK_HIGHLIGHTS)
        : [],
    })
    if (pages.length >= SCRAPBOOK_LIMIT) break
  }
  return pages
}

/** Every guide met on any finished weekend in the scrapbook. */
export function scrapbookGuides(
  pages: readonly ScrapbookPage[],
): CompanionId[] {
  const met = new Set<CompanionId>()
  for (const page of pages) for (const id of page.meetingOrder) met.add(id)
  return COMPANIONS.map((c) => c.id).filter((id) => met.has(id))
}
