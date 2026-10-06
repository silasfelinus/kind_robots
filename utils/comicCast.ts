// /utils/comicCast.ts
//
// Cast model sheets for the Comic Studio (comic-creator t-015 / t-022). The Conductor
// importer files each character's locked turnaround as `cast-<character>-<angle>` subject
// slots, with the approved render as the slot's `selected` attempt. This groups those
// slots into one sheet per character in turnaround order, so the studio can show every
// character the way a model sheet does: eight angles side by side at their real aspect.
//
// Mirroring: a pick that is used flipped says so in the slot notes ("shown mirrored"), and
// a slot that reuses another slot's render says "Same render as cast-…" (an attempt row is
// unique per ArtJob, so the reuse points at the slot that holds it). Both draw mirrored.
// Pure: no Vue, no fetch.

export const COMIC_CAST_ANGLES = [
  { key: 'front', label: 'Front' },
  { key: 'front-three-quarter-left', label: '3/4 front L' },
  { key: 'profile-left', label: 'Profile L' },
  { key: 'back-three-quarter-left', label: '3/4 back L' },
  { key: 'back', label: 'Back' },
  { key: 'back-three-quarter-right', label: '3/4 back R' },
  { key: 'profile-right', label: 'Profile R' },
  { key: 'front-three-quarter-right', label: '3/4 front R' },
] as const

export const COMIC_CAST_PREFIX = 'cast-'

type CastSlot = {
  id: number
  entityId: number | null
  key: string
  title: string
  notes: string | null
  sortOrder: number
}

type CastAttempt = {
  id: number
  slotId: number
  verdict: string
  artImageId: number | null
}

export type ComicCastCard = {
  slotId: number
  angle: string
  label: string
  attemptId: number | null
  mirrored: boolean
}

export type ComicCastSheet = {
  key: string
  name: string
  entityId: number | null
  cards: ComicCastCard[]
  extras: ComicCastCard[]
}

const ANGLE_KEYS = new Set<string>(COMIC_CAST_ANGLES.map((angle) => angle.key))
const SAME_RENDER = /same render as (cast-[a-z0-9_-]+)/i

export function parseCastKey(
  key: string,
): { character: string; rest: string } | null {
  if (!key.startsWith(COMIC_CAST_PREFIX)) return null
  const body = key.slice(COMIC_CAST_PREFIX.length)
  const dash = body.indexOf('-')
  if (dash <= 0 || dash === body.length - 1) return null
  return { character: body.slice(0, dash), rest: body.slice(dash + 1) }
}

/** The render a sheet shows for a slot: the final pick, else the newest liked render. */
export function castPick<T extends CastAttempt>(
  attempts: T[],
  slotId: number,
): T | null {
  const own = attempts.filter(
    (attempt) => attempt.slotId === slotId && attempt.artImageId,
  )
  const newest = (list: T[]) =>
    list.reduce<T | null>(
      (best, attempt) => (!best || attempt.id > best.id ? attempt : best),
      null,
    )
  return (
    newest(own.filter((attempt) => attempt.verdict === 'selected')) ??
    newest(own.filter((attempt) => attempt.verdict === 'liked'))
  )
}

function splitTitle(title: string): { name: string; part: string } {
  const colon = title.indexOf(':')
  if (colon < 0) return { name: title.trim(), part: '' }
  return {
    name: title.slice(0, colon).trim(),
    part: title.slice(colon + 1).trim(),
  }
}

export function buildComicCastSheets(
  slots: CastSlot[],
  attempts: CastAttempt[],
): ComicCastSheet[] {
  const bySlotKey = new Map(slots.map((slot) => [slot.key, slot]))
  const sheets = new Map<string, ComicCastSheet & { order: number }>()

  const card = (slot: CastSlot, angle: string, label: string) => {
    const notes = slot.notes ?? ''
    let attempt = castPick(attempts, slot.id)
    let mirrored = /mirrored/i.test(notes)
    const reuse = SAME_RENDER.exec(notes)
    if (!attempt && reuse) {
      const source = reuse[1] && bySlotKey.get(reuse[1].toLowerCase())
      if (source) {
        attempt = castPick(attempts, source.id)
        mirrored = true
      }
    }
    return {
      slotId: slot.id,
      angle,
      label,
      attemptId: attempt?.id ?? null,
      mirrored,
    }
  }

  for (const slot of slots) {
    const parsed = parseCastKey(slot.key)
    if (!parsed) continue
    const { name, part } = splitTitle(slot.title)
    const sheet = sheets.get(parsed.character) ?? {
      key: parsed.character,
      name,
      entityId: slot.entityId,
      cards: [],
      extras: [],
      order: slot.sortOrder,
    }
    sheet.order = Math.min(sheet.order, slot.sortOrder)
    if (ANGLE_KEYS.has(parsed.rest)) {
      const angle = COMIC_CAST_ANGLES.find((item) => item.key === parsed.rest)
      sheet.cards.push(card(slot, parsed.rest, angle?.label ?? parsed.rest))
    } else {
      sheet.extras.push(card(slot, parsed.rest, part || parsed.rest))
    }
    sheets.set(parsed.character, sheet)
  }

  const angleIndex = (key: string) =>
    COMIC_CAST_ANGLES.findIndex((angle) => angle.key === key)
  return [...sheets.values()]
    .sort((a, b) => a.order - b.order || a.key.localeCompare(b.key))
    .map(({ order: _order, ...sheet }) => ({
      ...sheet,
      cards: sheet.cards.sort(
        (a, b) => angleIndex(a.angle) - angleIndex(b.angle),
      ),
    }))
}

/** CSS aspect-ratio for a slot aspect like "2:3"; falls back to 4 / 3. */
export function comicAspectRatio(aspect: string | null | undefined): string {
  const match = /^(\d+(?:\.\d+)?)\s*[:x/]\s*(\d+(?:\.\d+)?)$/.exec(
    String(aspect ?? '').trim(),
  )
  if (!match) return '4 / 3'
  const w = Number(match[1])
  const h = Number(match[2])
  return w > 0 && h > 0 ? `${w} / ${h}` : '4 / 3'
}

/** CSS aspect-ratio from a render's pixel size, else the slot aspect. */
export function comicRenderAspect(
  width: number | null | undefined,
  height: number | null | undefined,
  fallback?: string | null,
): string {
  if (width && height && width > 0 && height > 0) return `${width} / ${height}`
  return comicAspectRatio(fallback)
}
