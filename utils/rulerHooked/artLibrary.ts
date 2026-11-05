// utils/rulerHooked/artLibrary.ts
//
// One place that knows where every rendered Ruler Is Hooked painting lives, and
// what to try next when one is missing. The illustrated console (2026-11-05
// overhaul) is art-led: every screen is a painting first and UI second, so
// every image request goes through an ordered candidate list that ends in a
// painting that already exists, never in a broken image.
//
// Paths are relative to /images/ruler-hooked/ and match the art queue's
// image_path keys in conductor's scripts/build_ruler_hooked_art_queue.py.
// Pure data, no Vue: the selftest pins the fallback chains.

import type { RegionKey, RunSave, TimeKey } from '~/types/ruler-hooked'

export const ART_ROOT = '/images/ruler-hooked'

export const art = (key: string): string => `${ART_ROOT}/${key}.webp`

/** Day/night is all most vistas were painted for; treat times map onto them. */
export function paintedTime(time: TimeKey): 'day' | 'night' | 'golden' {
  if (time === 'night') return 'night'
  if (time === 'golden' || time === 'dusk') return 'golden'
  return 'day'
}

function dayOrNight(time: TimeKey): 'day' | 'night' {
  return time === 'night' || time === 'dusk' ? 'night' : 'day'
}

/** A region painting at a state and time, degrading time then state. */
export function vistaCandidates(
  region: RegionKey,
  state: string | undefined,
  time: TimeKey,
): string[] {
  const out: string[] = []
  if (state) {
    const painted = paintedTime(time)
    out.push(art(`${region}-${state}-${painted}`))
    if (painted === 'golden')
      out.push(art(`${region}-${state}-${dayOrNight(time)}`))
    out.push(art(`${region}-${state}-day`))
  }
  return [...new Set(out)]
}

/**
 * The lake screen backdrop. The far shore is the vista that reacts to your
 * decrees (pristine / farmed / industrial), so it is the fishing view; the
 * plain lake painting is the safety net. The ruler is never in frame: the
 * game is first person (consolePOV.selftest.mjs).
 */
export function lakeBackdropCandidates(
  save: RunSave | null,
  time: TimeKey,
): string[] {
  const shore = save?.regionStates?.far_shore ?? 'pristine'
  return [
    ...new Set([
      ...vistaCandidates('far_shore', shore, time),
      art(`lake-clear-${dayOrNight(time)}`),
      art('lake-clear-day'),
    ]),
  ]
}

/** Screen backdrops. New paintings are queued under backdrops/; until they
 *  render, each screen borrows an existing painting that fits its mood. */
export const BACKDROPS = {
  title: [
    art('backdrops/title-lakeside'),
    art('concept/ui-title-screen'),
    art('lake-clear-day'),
  ],
  court: [
    art('backdrops/court-throne-room'),
    art('castle_grounds-flourishing-day'),
    art('concept/beat-the-standoff'),
  ],
  map: [art('backdrops/royal-map'), art('sky-open-day')],
  gear: [
    art('backdrops/gear-tackle-room'),
    art('near_bank-grassy'),
    art('lake-clear-day'),
  ],
  fishopedia: [
    art('backdrops/fishopedia-study'),
    art('lake-clear-night'),
    art('lake-clear-day'),
  ],
} as const satisfies Record<string, readonly string[]>

export type BackdropKey = keyof typeof BACKDROPS

/** Bottom-nav vignettes; until the painted tab icons land, crop an existing piece. */
export const TAB_ART: Record<string, string[]> = {
  lake: [art('ui/tab-lake'), art('lake-clear-day')],
  map: [art('ui/tab-map'), art('village_edge-hamlet-day')],
  court: [art('ui/tab-court'), art('castle_grounds-flourishing-day')],
  gear: [art('ui/tab-gear'), art('rewards/gilded-lure')],
  fishopedia: [art('ui/tab-fishopedia'), art('fish/sunspoke-koi/bestiary')],
}

/** Legacy renders that exist but depict the wrong thing (the steward "Quill"
 *  came back as a literal feather pen). Skipped until a real portrait lands. */
const MISRENDERED = new Set(['character-steward-quill'])

export function characterCandidates(slug: string | undefined): string[] {
  if (!slug) return []
  return [`characters/${slug}`, `character-${slug}`]
    .filter((key) => !MISRENDERED.has(key))
    .map(art)
}

export function fishCandidates(slug: string): string[] {
  return [art(`fish/${slug}/bestiary`)]
}

/** A petition's illustration: its own card art (an authored key like
 *  `card-tax-season`), then the presenter's portrait, then the court itself. */
export function cardCandidates(
  card: { art?: string },
  presenterSlug?: string,
): string[] {
  return [
    ...(card.art ? [art(card.art)] : []),
    ...characterCandidates(presenterSlug),
    ...BACKDROPS.court,
  ]
}

export function rewardCandidates(slug: string): string[] {
  return [art(`rewards/${slug}`)]
}

export function endingCandidates(key: string | null): string[] {
  return key
    ? [art(`endings/${key}`), art('concept/kingdom-preserved')]
    : [art('concept/kingdom-preserved')]
}

export function proclamationCandidates(eventKey: string): string[] {
  return [art(`events/${eventKey}`), ...characterCandidates('bard-fen')]
}

/** Gear and kingdom investments: paint by id, borrow a reward piece meanwhile. */
const SHOP_BORROW: Record<string, string> = {
  'reinforced-rod': 'rewards/captains-pin',
  'silk-line': 'rewards/bards-ballad',
  'balanced-lure': 'rewards/gilded-lure',
  'riverbank-market': 'village_edge-township-day',
  'lakeside-shrine': 'rewards/druid-charm',
  'festival-fund': 'card-harvest-festival',
  'watch-patrol': 'card-guard-captain-wall',
}
export function shopCandidates(id: string): string[] {
  const borrow = SHOP_BORROW[id]
  return [art(`gear/${id}`), ...(borrow ? [art(borrow)] : [])]
}

/** Human labels for the five-step painted day. */
export const TIME_LABEL: Record<TimeKey, string> = {
  day: 'Midday',
  golden: 'Golden hour',
  dusk: 'Dusk',
  night: 'Night',
  dawn: 'Dawn',
}
