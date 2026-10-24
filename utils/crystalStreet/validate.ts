import {
  EMOTIONS,
  SKILLS,
  TAGS,
  TARGETS,
  type Avatar,
  type Choice,
  type Companion,
  type Effects,
  type Encounter,
  type Item,
  type Location,
  type TagDeck,
  type Villain,
} from './types'
import {
  CLUE_LOCATION_IDS,
  COMPANION_IDS,
  ITEM_IDS,
  LOCATION_IDS,
  VILLAIN_IDS,
} from './ids'

const INTENTS = ['brave', 'clever', 'kind', 'camp', 'sneaky', 'reckless']
const HEX = /^#[0-9a-f]{6}$/i
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

type Problems = string[]

function has<T extends readonly unknown[]>(list: T, value: unknown): boolean {
  return (list as readonly unknown[]).includes(value)
}

function text(p: Problems, where: string, value: unknown, min: number): void {
  if (typeof value !== 'string' || value.trim().length < min)
    p.push(`${where}: needs at least ${min} characters`)
}

const NEGATION = /\b(no|not|without|never|nothing|none|nobody)\b/i

function art(p: Problems, where: string, value: unknown, min: number): void {
  text(p, where, value, min)
  if (typeof value === 'string' && NEGATION.test(value))
    p.push(
      `${where}: art prompts describe what is there (Krea 2 paints negated nouns)`,
    )
}

function effects(p: Problems, where: string, e: Effects | undefined): void {
  if (!e || typeof e !== 'object') {
    p.push(`${where}: missing effects object`)
    return
  }
  for (const key of ['nerve', 'dread', 'quarters'] as const) {
    const v = e[key]
    if (v !== undefined && (!Number.isInteger(v) || Math.abs(v) > 6))
      p.push(`${where}.${key}: integer between -6 and 6`)
  }
  for (const [skill, v] of Object.entries(e.skills ?? {})) {
    if (!has(SKILLS, skill)) p.push(`${where}.skills: unknown skill ${skill}`)
    if (!Number.isInteger(v) || Math.abs(v as number) > 1)
      p.push(`${where}.skills.${skill}: must be -1 or 1`)
  }
  for (const item of [...(e.items ?? []), ...(e.loseItems ?? [])])
    if (!has(ITEM_IDS, item)) p.push(`${where}: unknown item ${item}`)
  if (e.teleport !== undefined && !has(TAGS, e.teleport))
    p.push(`${where}.teleport: unknown tag ${e.teleport}`)
  for (const flag of e.flags ?? [])
    if (typeof flag !== 'string' || !/^[a-z0-9:-]+$/.test(flag))
      p.push(`${where}.flags: bad flag ${String(flag)}`)
}

function choice(p: Problems, where: string, c: Choice): void {
  if (!ID.test(c.id ?? '')) p.push(`${where}: bad choice id`)
  text(p, `${where}.label`, c.label, 8)
  if (!INTENTS.includes(c.intent)) p.push(`${where}: unknown intent`)
  if (!has(SKILLS, c.skill)) p.push(`${where}: unknown skill ${c.skill}`)
  if (!has(TARGETS, c.target)) p.push(`${where}: target must be 7, 9 or 11`)
  if (c.bonus) {
    if (!Number.isInteger(c.bonus.amount) || c.bonus.amount < 1)
      p.push(`${where}.bonus: amount 1+`)
    if (c.bonus.item && !has(ITEM_IDS, c.bonus.item))
      p.push(`${where}.bonus: unknown item ${c.bonus.item}`)
    if (c.bonus.companion && !has(COMPANION_IDS, c.bonus.companion))
      p.push(`${where}.bonus: unknown companion ${c.bonus.companion}`)
  }
  if (c.requires?.item && !has(ITEM_IDS, c.requires.item))
    p.push(`${where}.requires: unknown item ${c.requires.item}`)
  for (const side of ['success', 'failure'] as const) {
    const o = c[side]
    if (!o) {
      p.push(`${where}: missing ${side}`)
      continue
    }
    text(p, `${where}.${side}.text`, o.text, 60)
    art(p, `${where}.${side}.art`, o.art, 30)
    effects(p, `${where}.${side}.effects`, o.effects)
  }
  if (c.success && c.failure && c.success.text === c.failure.text)
    p.push(`${where}: success and failure share text`)
}

export function validateEncounter(
  p: Problems,
  where: string,
  e: Encounter,
): void {
  if (!e || typeof e !== 'object') {
    p.push(`${where}: missing encounter`)
    return
  }
  if (!ID.test(e.id ?? '')) p.push(`${where}: bad id ${String(e.id)}`)
  text(p, `${where}.title`, e.title, 3)
  text(p, `${where}.place`, e.place, 3)
  text(p, `${where}.text`, e.text, 80)
  art(p, `${where}.art`, e.art, 40)
  if (!Array.isArray(e.choices) || e.choices.length < 2 || e.choices.length > 3)
    p.push(`${where}: needs 2 or 3 choices`)
  const ids = new Set<string>()
  for (const [i, c] of (e.choices ?? []).entries()) {
    if (ids.has(c.id)) p.push(`${where}: duplicate choice id ${c.id}`)
    ids.add(c.id)
    choice(p, `${where}.choices[${i}]`, c)
  }
  if ((e.choices ?? []).every((c) => c.requires))
    p.push(`${where}: at least one choice must have no requirement`)
}

export function validateVillain(p: Problems, v: Villain): void {
  const w = `villain ${v?.id}`
  if (!has(VILLAIN_IDS, v.id)) p.push(`${w}: id not in VILLAIN_IDS`)
  text(p, `${w}.name`, v.name, 3)
  text(p, `${w}.epithet`, v.epithet, 3)
  if (!Array.isArray(v.tags) || v.tags.length < 2 || v.tags.length > 3)
    p.push(`${w}: needs 2 or 3 tags`)
  for (const t of v.tags ?? [])
    if (!has(TAGS, t)) p.push(`${w}: unknown tag ${t}`)
  if (!Array.isArray(v.palette) || v.palette.length !== 3)
    p.push(`${w}: palette needs 3 colors`)
  for (const c of v.palette ?? [])
    if (!HEX.test(c)) p.push(`${w}: bad palette color ${c}`)
  text(p, `${w}.sigil`, v.sigil, 3)
  const insp = v.inspiration
  text(p, `${w}.inspiration.original`, insp?.original, 3)
  text(p, `${w}.inspiration.film`, insp?.film, 3)
  if (!Number.isInteger(insp?.year) || insp.year < 1920 || insp.year > 1990)
    p.push(`${w}.inspiration.year: a classic film year`)
  if (!['flip', 'bend', 'remix'].includes(insp?.kind))
    p.push(`${w}.inspiration.kind: flip, bend or remix`)
  text(p, `${w}.inspiration.oldScript`, insp?.oldScript, 40)
  text(p, `${w}.inspiration.newLens`, insp?.newLens, 40)
  text(p, `${w}.logline`, v.logline, 40)
  text(p, `${w}.backstory`, v.backstory, 300)
  text(p, `${w}.centralIssue.title`, v.centralIssue?.title, 3)
  text(p, `${w}.centralIssue.summary`, v.centralIssue?.summary, 80)
  art(p, `${w}.poster`, v.poster, 60)
  art(p, `${w}.portrait`, v.portrait, 60)
  art(p, `${w}.endingPhoto`, v.endingPhoto, 120)
  if (!Array.isArray(v.taunts) || v.taunts.length < 3)
    p.push(`${w}: needs 3+ taunts`)
  if (!Array.isArray(v.clues) || v.clues.length !== 3)
    p.push(`${w}: needs exactly 3 clues`)
  const places = new Set<string>()
  for (const [i, clue] of (v.clues ?? []).entries()) {
    const cw = `${w}.clues[${i}]`
    if (!ID.test(clue.id ?? '')) p.push(`${cw}: bad id`)
    if (!clue.id?.startsWith(`${v.id}-`))
      p.push(`${cw}: id must start with ${v.id}-`)
    if (!has(CLUE_LOCATION_IDS, clue.location))
      p.push(`${cw}: unknown location ${clue.location}`)
    if (places.has(clue.location)) p.push(`${cw}: two clues share a location`)
    places.add(clue.location)
    text(p, `${cw}.title`, clue.title, 3)
    text(p, `${cw}.hint`, clue.hint, 30)
    validateEncounter(p, `${cw}.encounter`, clue.encounter)
    if (
      !(clue.encounter?.choices ?? []).every((c) =>
        c.success?.effects?.clues?.includes(clue.id),
      )
    )
      p.push(`${cw}: every choice's success must grant the clue`)
  }
  for (const act of [1, 2, 3] as const) {
    const cards = (v.signature ?? []).filter((e) => e.act === act).length
    if (cards < 2) p.push(`${w}: act ${act} needs at least 2 villain cards`)
  }
  for (const e of v.signature ?? [])
    if (![1, 2, 3].includes(e.act as number))
      p.push(`${w}: villain card ${e.id} needs act 1, 2 or 3`)
  for (const [i, e] of (v.signature ?? []).entries())
    validateEncounter(p, `${w}.signature[${i}]`, e)
  validateEncounter(p, `${w}.finale`, v.finale)
  const finaleIds = (v.finale?.choices ?? []).map((c) => c.id)
  for (const id of ['fight', 'trick', 'heart'])
    if (!finaleIds.includes(id)) p.push(`${w}.finale: needs a ${id} choice`)
  // Edge choices: unlocked by beating an act's villain card, they count as one
  // of the three approaches and offer a straighter path than the base checks.
  for (const c of v.finale?.choices ?? []) {
    if (['fight', 'trick', 'heart'].includes(c.id)) continue
    if (!/^edge-[123]$/.test(c.requires?.flag ?? ''))
      p.push(
        `${w}.finale.${c.id}: an extra finale choice must require edge-1, edge-2 or edge-3`,
      )
    if (!['fight', 'trick', 'heart'].includes(c.approach ?? ''))
      p.push(`${w}.finale.${c.id}: an extra finale choice needs an approach`)
    if (c.approach === 'heart' && c.requires?.clues !== 3)
      p.push(`${w}.finale.${c.id}: a heart edge must also require 3 clues`)
  }
  const heart = v.finale?.choices?.find((c) => c.id === 'heart')
  if (heart && heart.requires?.clues !== 3)
    p.push(`${w}.finale: heart must require 3 clues`)
  for (const tier of ['best', 'good', 'bittersweet', 'bad'] as const) {
    const e = v.endings?.[tier]
    text(p, `${w}.endings.${tier}.title`, e?.title, 3)
    text(p, `${w}.endings.${tier}.text`, e?.text, 160)
    art(p, `${w}.endings.${tier}.art`, e?.art, 40)
  }
}

export function validateCompanion(p: Problems, c: Companion): void {
  const w = `companion ${c?.id}`
  if (!has(COMPANION_IDS, c.id)) p.push(`${w}: id not in COMPANION_IDS`)
  text(p, `${w}.name`, c.name, 2)
  text(p, `${w}.pronouns`, c.pronouns, 2)
  if (!Number.isInteger(c.age)) p.push(`${w}: age`)
  text(p, `${w}.role`, c.role, 3)
  text(p, `${w}.bio`, c.bio, 160)
  if (!has(LOCATION_IDS, c.location)) p.push(`${w}: unknown location`)
  if (!Array.isArray(c.skills) || c.skills.length < 1 || c.skills.length > 2)
    p.push(`${w}: 1 or 2 skills`)
  for (const s of c.skills ?? [])
    if (!has(SKILLS, s)) p.push(`${w}: unknown skill ${s}`)
  text(p, `${w}.perk.name`, c.perk?.name, 3)
  text(p, `${w}.perk.text`, c.perk?.text, 20)
  const kind = c.perk?.effect?.kind
  if (
    ![
      'dawn-nerve',
      'reroll',
      'quarters',
      'shield',
      'clue-sense',
      'tag-ward',
    ].includes(kind)
  )
    p.push(`${w}: unknown perk kind`)
  for (const color of c.palette ?? [])
    if (!HEX.test(color)) p.push(`${w}: bad palette color`)
  art(p, `${w}.poster`, c.poster, 60)
  for (const emotion of EMOTIONS) {
    text(p, `${w}.emotions.${emotion}.line`, c.emotions?.[emotion]?.line, 10)
    art(p, `${w}.emotions.${emotion}.art`, c.emotions?.[emotion]?.art, 40)
  }
  validateEncounter(p, `${w}.meet`, c.meet)
  if (
    !(c.meet?.choices ?? []).some((ch) =>
      ch.success?.effects?.flags?.includes(`recruit:${c.id}`),
    )
  )
    p.push(`${w}.meet: a success must carry flag recruit:${c.id}`)
}

export function validateLocation(p: Problems, l: Location): void {
  const w = `location ${l?.id}`
  if (!has(LOCATION_IDS, l.id)) p.push(`${w}: id not in LOCATION_IDS`)
  text(p, `${w}.name`, l.name, 3)
  text(p, `${w}.blurb`, l.blurb, 60)
  art(p, `${w}.art`, l.art, 40)
  if (!has(SKILLS, l.train)) p.push(`${w}: unknown train skill`)
  for (const k of ['x', 'y'] as const)
    if (typeof l[k] !== 'number' || l[k] < 0 || l[k] > 100)
      p.push(`${w}: ${k} must be 0..100`)
  if (!Array.isArray(l.beats) || l.beats.length < 3)
    p.push(`${w}: needs 3+ daylight beats`)
  for (const [i, e] of (l.beats ?? []).entries())
    validateEncounter(p, `${w}.beats[${i}]`, e)
}

export function validateDeck(p: Problems, d: TagDeck): void {
  const w = `deck ${d?.tag}`
  if (!has(TAGS, d.tag)) p.push(`${w}: unknown tag`)
  text(p, `${w}.name`, d.name, 3)
  text(p, `${w}.blurb`, d.blurb, 40)
  if (!Array.isArray(d.encounters) || d.encounters.length < 5)
    p.push(`${w}: needs 5+ encounters`)
  for (const [i, e] of (d.encounters ?? []).entries())
    validateEncounter(p, `${w}.encounters[${i}]`, e)
}

export function validateItem(p: Problems, item: Item): void {
  const w = `item ${item?.id}`
  if (!has(ITEM_IDS, item.id)) p.push(`${w}: id not in ITEM_IDS`)
  text(p, `${w}.name`, item.name, 3)
  text(p, `${w}.text`, item.text, 20)
  art(p, `${w}.art`, item.art, 30)
  if (!Number.isInteger(item.price) || item.price < 1) p.push(`${w}: price`)
  if (item.skill && !has(SKILLS, item.skill)) p.push(`${w}: skill`)
  if (item.ward && !has(TAGS, item.ward)) p.push(`${w}: ward`)
}

export function validateAvatar(p: Problems, a: Avatar): void {
  const w = `avatar ${a?.id}`
  if (!/^[a-z][a-z-]+$/.test(a.id ?? '')) p.push(`${w}: id`)
  text(p, `${w}.name`, a.name, 3)
  text(p, `${w}.blurb`, a.blurb, 10)
  art(p, `${w}.art`, a.art, 80)
}

export function duplicateIds(encounters: Encounter[]): string[] {
  const seen = new Set<string>()
  const dupes: string[] = []
  for (const e of encounters) {
    if (seen.has(e.id)) dupes.push(e.id)
    seen.add(e.id)
  }
  return dupes
}
