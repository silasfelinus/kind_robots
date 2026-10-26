import type { KitArt, PlaybookKitSpec, PlaybookTier } from './types'

// The complexity budget. Every playbook declares a tier; the tier caps how
// many of each moving part it may carry, and two composite limits cap what
// the player has to hold in their head at once:
//   attention — numbers on screen at all times (meters)
//   threads   — plotlines running in parallel (villains + romances + factions)
// Going over a cap is an error and fails CI. Coming in under a minimum is a
// rung still to build, never an error, so a freshly scaffolded game is green.

export type BudgetDimension =
  | 'acts'
  | 'meters'
  | 'factions'
  | 'followers'
  | 'villains'
  | 'figures'
  | 'romances'
  | 'reveals'
  | 'endings'
  | 'moments'
  | 'trailer'
  | 'attention'
  | 'threads'

export type Range = { min: number; max: number }

export const DIMENSION_LABELS: Record<BudgetDimension, string> = {
  acts: 'Acts',
  meters: 'Meters',
  factions: 'Factions',
  followers: 'Followers',
  villains: 'Villains',
  figures: 'Other figures',
  romances: 'Romances',
  reveals: 'Reveals',
  endings: 'Endings',
  moments: 'Scrapbook moments',
  trailer: 'Trailer beats',
  attention: 'Attention load',
  threads: 'Parallel threads',
}

export const TIER_INFO: Record<
  PlaybookTier,
  { label: string; length: string; blurb: string }
> = {
  vignette: {
    label: 'Vignette',
    length: 'One sitting, 20–40 minutes',
    blurb:
      'One villain, a handful of companions, a few endings. Every new playbook starts here.',
  },
  standard: {
    label: 'Standard',
    length: 'An evening, replayed a few times',
    blurb:
      'Rival factions, a small ensemble and a dozen endings. Earned once the vignette is fun.',
  },
  saga: {
    label: 'Saga',
    length: 'A campaign across many sessions',
    blurb:
      'The full production floor of This Means Warp or Prom of Doom. Only for a proven playbook.',
  },
}

export const TIER_BUDGETS: Record<
  PlaybookTier,
  Record<BudgetDimension, Range>
> = {
  vignette: {
    acts: { min: 1, max: 2 },
    meters: { min: 1, max: 3 },
    factions: { min: 0, max: 2 },
    followers: { min: 1, max: 3 },
    villains: { min: 1, max: 1 },
    figures: { min: 0, max: 3 },
    romances: { min: 0, max: 1 },
    reveals: { min: 1, max: 3 },
    endings: { min: 3, max: 5 },
    moments: { min: 6, max: 12 },
    trailer: { min: 3, max: 5 },
    attention: { min: 1, max: 3 },
    threads: { min: 1, max: 4 },
  },
  standard: {
    acts: { min: 2, max: 3 },
    meters: { min: 2, max: 5 },
    factions: { min: 2, max: 4 },
    followers: { min: 3, max: 8 },
    villains: { min: 1, max: 3 },
    figures: { min: 0, max: 8 },
    romances: { min: 0, max: 3 },
    reveals: { min: 3, max: 8 },
    endings: { min: 5, max: 12 },
    moments: { min: 12, max: 30 },
    trailer: { min: 4, max: 6 },
    attention: { min: 2, max: 5 },
    threads: { min: 3, max: 9 },
  },
  saga: {
    acts: { min: 3, max: 5 },
    meters: { min: 3, max: 7 },
    factions: { min: 3, max: 6 },
    followers: { min: 6, max: 16 },
    villains: { min: 2, max: 8 },
    figures: { min: 0, max: 16 },
    romances: { min: 0, max: 6 },
    reveals: { min: 6, max: 16 },
    endings: { min: 8, max: 32 },
    moments: { min: 24, max: 80 },
    trailer: { min: 5, max: 8 },
    attention: { min: 3, max: 7 },
    threads: { min: 5, max: 16 },
  },
}

export const TIERS: PlaybookTier[] = ['vignette', 'standard', 'saga']

export type IssueLevel = 'error' | 'warn' | 'info'

export type BudgetIssue = { level: IssueLevel; code: string; message: string }

export type DimensionReport = Range & {
  count: number
  status: 'under' | 'ok' | 'near' | 'over' | 'stretched'
  /** The written allowance that lets this dimension run past its cap. */
  allowance?: string
}

export type RungId =
  | 'premise'
  | 'cast'
  | 'endings'
  | 'scrapbook'
  | 'trailer'
  | 'factions'
  | 'reveals'
  | 'romance'
  | 'art'

export type Rung = {
  id: RungId
  label: string
  goal: string
  status: 'done' | 'todo' | 'optional'
}

export type BudgetReport = {
  tier: PlaybookTier
  counts: Record<BudgetDimension, DimensionReport>
  issues: BudgetIssue[]
  ladder: Rung[]
  next: Rung | null
  /** Smallest tier whose caps the spec already fits. */
  fitsTier: PlaybookTier | null
  art: { rendered: number; total: number }
  ok: boolean
}

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function countDimensions(
  spec: PlaybookKitSpec,
): Record<BudgetDimension, number> {
  const role = (r: string) => spec.cast.filter((c) => c.role === r).length
  const romances = spec.cast.filter((c) => c.romance).length
  return {
    acts: spec.acts.length,
    meters: spec.meters.length,
    factions: spec.factions.length,
    followers: role('follower'),
    villains: role('villain'),
    figures: role('figure'),
    romances,
    reveals: spec.reveals.length,
    endings: spec.endings.length,
    moments: spec.moments.length,
    trailer: spec.trailer.beats.length,
    attention: spec.meters.length,
    threads: role('villain') + romances + spec.factions.length,
  }
}

function dimensionStatus(
  count: number,
  range: Range,
): DimensionReport['status'] {
  if (count > range.max) return 'over'
  if (count < range.min) return 'under'
  return range.max > 1 && count >= Math.ceil(range.max * 0.9) ? 'near' : 'ok'
}

export function allArt(spec: PlaybookKitSpec): KitArt[] {
  return [
    spec.keyArt,
    ...spec.factions.map((f) => f.emblem),
    ...spec.cast.map((c) => c.portrait),
    ...spec.endings.map((e) => e.art),
    ...spec.moments.map((m) => m.art),
  ]
}

function integrityIssues(spec: PlaybookKitSpec): BudgetIssue[] {
  const issues: BudgetIssue[] = []
  const error = (code: string, message: string) =>
    issues.push({ level: 'error', code, message })
  const warn = (code: string, message: string) =>
    issues.push({ level: 'warn', code, message })

  if (!ID_PATTERN.test(spec.id))
    error('bad-id', `Playbook id "${spec.id}" must be kebab-case.`)

  const groups = {
    meter: spec.meters,
    faction: spec.factions,
    cast: spec.cast,
    reveal: spec.reveals,
    ending: spec.endings,
    moment: spec.moments,
  }
  const seen = new Map<string, string>()
  for (const [group, items] of Object.entries(groups))
    for (const item of items) {
      if (!ID_PATTERN.test(item.id))
        error('bad-id', `The ${group} id "${item.id}" must be kebab-case.`)
      const prior = seen.get(item.id)
      if (prior)
        error(
          'duplicate-id',
          `"${item.id}" is used by both a ${prior} and a ${group}; ids are unique across a playbook.`,
        )
      else seen.set(item.id, group)
    }

  const factionIds = new Set(spec.factions.map((f) => f.id))
  const castIds = new Set(spec.cast.map((c) => c.id))
  const actIds = new Set(spec.acts.map((a) => a.id))
  const moments = new Map(spec.moments.map((m) => [m.id, m]))
  const subjects = new Set([...factionIds, ...castIds])

  const checkAbout = (owner: string, about: string[]) => {
    for (const id of about)
      if (!subjects.has(id))
        error(
          'dangling-ref',
          `${owner} points at "${id}", which is not a cast member or faction.`,
        )
  }
  const checkAct = (owner: string, act: number) => {
    if (!actIds.has(act))
      error(
        'dangling-ref',
        `${owner} sits in act ${act}, which is not declared.`,
      )
  }

  for (const meter of spec.meters) {
    if (
      meter.min >= meter.max ||
      meter.start < meter.min ||
      meter.start > meter.max
    )
      error(
        'meter-range',
        `Meter "${meter.id}" needs min < max and a start inside that range.`,
      )
    if (meter.faction && !factionIds.has(meter.faction))
      error(
        'dangling-ref',
        `Meter "${meter.id}" tracks an unknown faction "${meter.faction}".`,
      )
  }

  for (const member of spec.cast) {
    if (member.faction && !factionIds.has(member.faction))
      error(
        'dangling-ref',
        `${member.name} belongs to an unknown faction "${member.faction}".`,
      )
    if (member.primary && member.role !== 'villain')
      error(
        'primary-villain',
        `${member.name} is marked primary but is not a villain.`,
      )
    if (member.romance) {
      if (!member.romance.moments.length)
        error(
          'romance-moments',
          `${member.name}'s romance needs at least one romance moment in the scrapbook.`,
        )
      for (const id of member.romance.moments) {
        const moment = moments.get(id)
        if (!moment)
          error(
            'dangling-ref',
            `${member.name}'s romance names an unknown moment "${id}".`,
          )
        else if (moment.kind !== 'romance')
          error(
            'romance-moments',
            `${member.name}'s romance moment "${id}" must be of kind romance, so the romance setting can hide it.`,
          )
      }
    }
  }

  const villains = spec.cast.filter((c) => c.role === 'villain')
  const primaries = villains.filter((v) => v.primary)
  if (villains.length && primaries.length !== 1)
    error(
      'primary-villain',
      `Mark exactly one villain as primary (found ${primaries.length}).`,
    )

  for (const reveal of spec.reveals) {
    checkAbout(`Reveal "${reveal.id}"`, reveal.about)
    checkAct(`Reveal "${reveal.id}"`, reveal.act)
    const answer = reveal.text.trim().toLowerCase().slice(0, 24)
    if (answer.length === 24 && reveal.teaser.toLowerCase().includes(answer))
      warn(
        'teaser-spoils',
        `Reveal "${reveal.id}"'s teaser repeats its answer.`,
      )
  }
  for (const ending of spec.endings)
    checkAbout(`Ending "${ending.id}"`, ending.about)
  for (const moment of spec.moments) {
    checkAbout(`Moment "${moment.id}"`, moment.about)
    checkAct(`Moment "${moment.id}"`, moment.act)
  }

  for (const beat of spec.trailer.beats) {
    const moment = moments.get(beat.moment)
    if (!moment)
      error(
        'dangling-ref',
        `A trailer beat names an unknown moment "${beat.moment}".`,
      )
    else if (['ending', 'reveal', 'romance'].includes(moment.kind))
      error(
        'trailer-spoiler',
        `The trailer shows "${moment.title}", a ${moment.kind} moment. Trailers sell the premise; they never spoil it.`,
      )
  }

  const briefless = [
    ['key art', spec.keyArt],
    ...spec.factions.map((f) => [f.name, f.emblem] as const),
    ...spec.cast.map((c) => [c.name, c.portrait] as const),
    ...spec.endings.map((e) => [e.title, e.art] as const),
    ...spec.moments.map((m) => [m.title, m.art] as const),
  ].filter(([, art]) => !(art as KitArt).brief.trim())
  for (const [name] of briefless)
    error(
      'art-brief',
      `${name} has no art brief, so its ArtJob cannot be queued.`,
    )

  const felt = new Set([
    ...spec.reveals.flatMap((r) => r.about),
    ...spec.endings.flatMap((e) => e.about),
    ...spec.moments.flatMap((m) => m.about),
  ])
  for (const villain of villains) {
    const inReveal = spec.reveals.some((r) => r.about.includes(villain.id))
    const inEnding = spec.endings.some((e) => e.about.includes(villain.id))
    if (!inReveal || !inEnding)
      warn(
        'flat-villain',
        `${villain.name} needs a reveal and an ending of their own, not just a final confrontation.`,
      )
  }
  for (const faction of spec.factions)
    if (!felt.has(faction.id))
      warn(
        'unfelt-faction',
        `${faction.name} never appears in a reveal, ending or moment. Cut it or give it consequences.`,
      )
  for (const member of spec.cast.filter((c) => c.role === 'follower'))
    if (!felt.has(member.id))
      warn(
        'unfelt-follower',
        `${member.name} has no moment, reveal or ending of their own.`,
      )

  const tones = new Set(spec.endings.map((e) => e.tone))
  if (spec.endings.length >= 3 && tones.size < 2)
    warn(
      'one-note-endings',
      'Every ending shares one tone. Give the player a real range of fates.',
    )

  return issues
}

function ladderFor(
  spec: PlaybookKitSpec,
  counts: Record<BudgetDimension, DimensionReport>,
  hasErrors: boolean,
): Rung[] {
  const meets = (d: BudgetDimension) => counts[d].count >= counts[d].min
  const art = allArt(spec)
  const rung = (
    id: RungId,
    label: string,
    goal: string,
    done: boolean,
    optional = false,
  ): Rung => ({
    id,
    label,
    goal,
    status: done ? 'done' : optional ? 'optional' : 'todo',
  })
  return [
    rung(
      'premise',
      'Premise and key art',
      'Title, tagline, the dramatic question and a key-art brief.',
      !!(
        spec.title.trim() &&
        spec.tagline.trim() &&
        spec.premise.trim() &&
        spec.keyArt.brief.trim()
      ),
    ),
    rung(
      'cast',
      'Cast',
      'At least one follower and exactly one principal villain.',
      meets('followers') &&
        spec.cast.some((c) => c.role === 'villain' && c.primary),
    ),
    rung(
      'endings',
      'Endings',
      `At least ${counts.endings.min} endings across more than one tone.`,
      meets('endings'),
    ),
    rung(
      'scrapbook',
      'Scrapbook',
      `At least ${counts.moments.min} cinematic moments.`,
      meets('moments'),
    ),
    rung(
      'trailer',
      'Trailer',
      `${counts.trailer.min}+ spoiler-free beats built from scrapbook moments.`,
      meets('trailer') && !hasErrors,
    ),
    rung(
      'factions',
      'Factions',
      'Rival groups whose standing changes what the player can do.',
      meets('factions') && counts.factions.count > 0,
      counts.factions.min === 0,
    ),
    rung(
      'reveals',
      'Reveals',
      `At least ${counts.reveals.min} secrets that change how a character reads.`,
      meets('reveals'),
    ),
    rung(
      'romance',
      'Romance',
      'Optional, player-chosen, and hidden when the romance setting is off.',
      counts.romances.count > 0,
      true,
    ),
    rung(
      'art',
      'Rendered art',
      'Every brief rendered, delivered and its URL verified.',
      art.every((a) => !!a.src),
    ),
  ]
}

export function fitsTier(spec: PlaybookKitSpec): PlaybookTier | null {
  const counts = countDimensions(spec)
  return (
    TIERS.find((tier) =>
      (Object.keys(counts) as BudgetDimension[]).every(
        (d) => counts[d] <= TIER_BUDGETS[tier][d].max,
      ),
    ) ?? null
  )
}

export function auditPlaybookKit(spec: PlaybookKitSpec): BudgetReport {
  const raw = countDimensions(spec)
  const budget = TIER_BUDGETS[spec.tier]
  const issues: BudgetIssue[] = []
  const allowances = new Map<string, { max: number; reason: string }>()
  for (const allowance of spec.allowances ?? []) {
    if (!(allowance.dimension in raw))
      issues.push({
        level: 'error',
        code: 'bad-allowance',
        message: `Allowance names an unknown dimension "${allowance.dimension}".`,
      })
    else if (allowance.reason.trim().length < 20)
      issues.push({
        level: 'error',
        code: 'bad-allowance',
        message: `The ${allowance.dimension} allowance needs a real reason, not "${allowance.reason}".`,
      })
    else allowances.set(allowance.dimension, allowance)
  }

  const counts = Object.fromEntries(
    (Object.keys(raw) as BudgetDimension[]).map((d) => {
      const status = dimensionStatus(raw[d], budget[d])
      const allowance = allowances.get(d)
      const stretched =
        status === 'over' && !!allowance && raw[d] <= allowance.max
      return [
        d,
        {
          ...budget[d],
          count: raw[d],
          status: stretched ? 'stretched' : status,
          ...(allowance ? { allowance: allowance.reason } : {}),
        },
      ]
    }),
  ) as Record<BudgetDimension, DimensionReport>

  for (const d of Object.keys(counts) as BudgetDimension[])
    if (counts[d].status === 'stretched')
      issues.push({
        level: 'warn',
        code: 'stretched',
        message: `${DIMENSION_LABELS[d]} runs past the ${TIER_INFO[spec.tier].label} cap (${counts[d].count}/${counts[d].max}): ${counts[d].allowance}`,
      })
    else if (counts[d].status === 'over')
      issues.push({
        level: 'error',
        code: 'over-budget',
        message: `${DIMENSION_LABELS[d]}: ${counts[d].count} is over the ${TIER_INFO[spec.tier].label} cap of ${counts[d].max}. Cut, merge, or move the playbook up a tier.`,
      })
  issues.push(...integrityIssues(spec))

  const fits = fitsTier(spec)
  if (fits && TIERS.indexOf(fits) < TIERS.indexOf(spec.tier))
    issues.push({
      level: 'info',
      code: 'smaller-tier',
      message: `Everything here already fits a ${TIER_INFO[fits].label}. Ship that first, then grow.`,
    })

  const hasErrors = issues.some((i) => i.level === 'error')
  const ladder = ladderFor(spec, counts, hasErrors)
  const art = allArt(spec)
  return {
    tier: spec.tier,
    counts,
    issues,
    ladder,
    next: ladder.find((r) => r.status === 'todo') ?? null,
    fitsTier: fits,
    art: { rendered: art.filter((a) => !!a.src).length, total: art.length },
    ok: !hasErrors,
  }
}
