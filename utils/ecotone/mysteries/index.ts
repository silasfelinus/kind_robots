import type { Choice, CompanionId, EncounterCard } from '../content'
import type { RouteStep } from '../story'
import type {
  Mystery,
  MysteryEffects,
  MysteryEnding,
  MysteryMessage,
  MysteryScene,
} from './types'
import { MYSTERIES } from './catalog'

export { MYSTERIES }
export type * from './types'

/** Gate verdicts as the Case Files show them. */
export type GateResult = 'pass' | 'fail' | null

export type CaseRecord = {
  id: string
  gates: [GateResult, GateResult, GateResult]
  /** Two passed gates opened the reveal at least once. */
  truePath: boolean
  /** The trail went cold at least once. */
  cold: boolean
  endings: string[]
}

export const PASSES_FOR_TRUE_PATH = 2

export type MysteryCardKind = 'gate' | 'cold' | 'reveal' | 'branch'

export type MysteryCardMeta = {
  mystery: Mystery
  kind: MysteryCardKind
  /** 1-3 for gate cards. */
  gate?: number
  message?: MysteryMessage
}

const COMPANION_IDS: CompanionId[] = ['mara', 'kit', 'juniper', 'cedar']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function mysteryCardId(
  mystery: Mystery,
  part: 'G1' | 'G2' | 'G3' | 'COLD' | 'REVEAL' | `B-${string}`,
): string {
  return `MY-${pad(mystery.number)}-${part}`
}

/** A Real Ending's own picture, shown when the finale choice lands on it. */
export function mysteryEndingArtKey(caseId: string, endingId: string): string {
  return `mysteries/${caseId}/${endingId}`
}

export function caseNumeral(n: number): string {
  return (
    ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][
      n - 1
    ] ?? String(n)
  )
}

function withFlag(
  effects: MysteryEffects | undefined,
  flag: string,
  also: string[] = [],
): Choice['success']['effects'] {
  return { ...(effects ?? {}), flag, ...(also.length ? { flags: also } : {}) }
}

/** `g2:pass`, `g2:fail` or `g2:<approach>` as the flag the engine sets. */
export function recallFlag(key: string): string | null {
  const match = /^g([123]):([a-z0-9-]+)$/.exec(key)
  if (!match?.[1] || !match[2]) return null
  const [, gate, what] = match
  return what === 'pass' || what === 'fail'
    ? `mystery_g${gate}_${what}`
    : `mystery_g${gate}_via_${what}`
}

function recallLines(
  recall: Record<string, string> | undefined,
): EncounterCard['flagLines'] {
  const lines: NonNullable<EncounterCard['flagLines']> = {}
  for (const [key, text] of Object.entries(recall ?? {})) {
    const flag = recallFlag(key)
    if (flag) lines[flag] = { all: text }
  }
  return Object.keys(lines).length ? lines : undefined
}

function sceneCard(
  mystery: Mystery,
  id: string,
  scene: MysteryScene,
  choices: Choice[],
): EncounterCard {
  return {
    id,
    kind: 'mystery',
    chapter: scene.chapter,
    place: scene.place,
    title: scene.title,
    scene: scene.scene,
    body: scene.body,
    leadLines: scene.leadLines,
    aloneLine: scene.aloneLine,
    flagLines: recallLines(scene.recall),
    choices,
    provenance: mystery.provenance,
  }
}

function endingById(mystery: Mystery, id: string): MysteryEnding | undefined {
  return mystery.endings.find((ending) => ending.id === id)
}

function finaleChoices(mystery: Mystery, scene: MysteryScene): Choice[] {
  return scene.choices.map((choice) => {
    const ending = choice.ending ? endingById(mystery, choice.ending) : null
    return {
      id: choice.id,
      label: choice.label,
      success: ending
        ? {
            text: [choice.text, ...ending.text].join('\n\n'),
            effects: {
              ...(choice.effects ?? {}),
              flag: `mystery_end_${ending.id}`,
              evidence: `Case closed: ${mystery.title}`,
            },
          }
        : {
            text: choice.text,
            effects: withFlag(choice.effects, `mystery_path_${choice.next}`),
          },
    }
  })
}

/** Every mystery scene as a playable card, with flags the engine reads back. */
export function compileMystery(mystery: Mystery): EncounterCard[] {
  const gates = mystery.gates.map((gate, index) => {
    const n = index + 1
    const choices: Choice[] = gate.approaches.map((approach) => ({
      id: approach.id,
      label: approach.label,
      check: approach.check,
      cost: approach.cost,
      success: {
        text: approach.success.text,
        effects: withFlag(approach.success.effects, `mystery_g${n}_pass`, [
          `mystery_g${n}_via_${approach.id}`,
        ]),
        leadLines: approach.success.leadLines,
      },
      failure: {
        text: approach.failure.text,
        effects: withFlag(approach.failure.effects, `mystery_g${n}_fail`, [
          `mystery_g${n}_via_${approach.id}`,
        ]),
        leadLines: approach.failure.leadLines,
      },
    }))
    if (n === 1)
      choices.push({
        id: 'decline',
        label: mystery.decline.label,
        cost: 'Walk away. This case closes for the rest of the run.',
        success: {
          text: mystery.decline.text,
          effects: { flag: 'mystery_declined' },
        },
      })
    return {
      id: mysteryCardId(mystery, `G${n}` as 'G1'),
      kind: 'mystery' as const,
      chapter: gate.chapter,
      place: gate.place,
      title: gate.title,
      scene: gate.scene,
      body: gate.body,
      leadLines: gate.leadLines,
      aloneLine: gate.aloneLine,
      flagLines: recallLines(gate.recall),
      choices,
      provenance: mystery.provenance,
    }
  })
  const cold = sceneCard(
    mystery,
    mysteryCardId(mystery, 'COLD'),
    mystery.coldCase,
    mystery.coldCase.choices.map((choice) => ({
      id: choice.id,
      label: choice.label,
      success: {
        text: choice.text,
        effects: withFlag(choice.effects, 'mystery_cold'),
      },
    })),
  )
  const reveal = {
    ...sceneCard(
      mystery,
      mysteryCardId(mystery, 'REVEAL'),
      mystery.reveal,
      finaleChoices(mystery, mystery.reveal),
    ),
    ...(mystery.reveal.afterMiss?.length
      ? { flagBody: { mystery_g3_fail: mystery.reveal.afterMiss } }
      : {}),
  }
  const branches = Object.entries(mystery.branches).map(([key, scene]) =>
    sceneCard(
      mystery,
      mysteryCardId(mystery, `B-${key}`),
      scene,
      finaleChoices(mystery, scene),
    ),
  )
  return [...gates, cold, reveal, ...branches]
}

export const MYSTERY_CARDS: EncounterCard[] = MYSTERIES.flatMap(compileMystery)

const META = new Map<string, MysteryCardMeta>()
for (const mystery of MYSTERIES) {
  mystery.gates.forEach((gate, index) =>
    META.set(mysteryCardId(mystery, `G${index + 1}` as 'G1'), {
      mystery,
      kind: 'gate',
      gate: index + 1,
      message: gate.message,
    }),
  )
  META.set(mysteryCardId(mystery, 'COLD'), { mystery, kind: 'cold' })
  META.set(mysteryCardId(mystery, 'REVEAL'), { mystery, kind: 'reveal' })
  for (const key of Object.keys(mystery.branches))
    META.set(mysteryCardId(mystery, `B-${key}`), { mystery, kind: 'branch' })
}

export function mysteryCardMeta(
  id: string | null | undefined,
): MysteryCardMeta | null {
  return (id && META.get(id)) || null
}

export function findMystery(id: string | null | undefined): Mystery | null {
  return MYSTERIES.find((mystery) => mystery.id === id) ?? null
}

function mix(seed: number, salt: number): number {
  let h = (seed ^ salt) >>> 0
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d) >>> 0
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b) >>> 0
  return (h ^ (h >>> 16)) >>> 0
}

/**
 * One random local mystery per run. Cases you have not opened yet come first,
 * so twelve runs can fill the Case Files; after that any case can return.
 */
export function pickMystery(seed: number, opened: string[] = []): string {
  const fresh = MYSTERIES.filter((mystery) => !opened.includes(mystery.id))
  const pool = fresh.length ? fresh : MYSTERIES
  return pool[mix(seed, 0xc45e) % pool.length]!.id
}

type MysteryRun = {
  seed: number
  mystery?: string
  played: string[]
  flags: string[]
}

/** The run's case: chosen at creation, or derived from the seed for older saves. */
export function runMystery(state: MysteryRun): Mystery {
  return findMystery(state.mystery) ?? findMystery(pickMystery(state.seed))!
}

export function mysteryPasses(flags: string[]): number {
  return [1, 2, 3].filter((n) => flags.includes(`mystery_g${n}_pass`)).length
}

/**
 * Where each gate interrupts the route: before the first fork, before the
 * crossroads, and before the finale.
 */
export function gateTriggers(route: RouteStep[]): [number, number, number] {
  const at = (kind: RouteStep['kind']) => {
    const index = route.findIndex((step) => step.kind === kind)
    return index < 0 ? route.length : index
  }
  return [at('fork'), at('crossroads'), at('finale')]
}

/**
 * The mystery card due before route step `index`, if any. The engine plays it
 * as a beat without moving the route, so authored step positions and older
 * saves stay stable.
 */
export function mysteryInterlude(
  state: MysteryRun,
  route: RouteStep[],
  index: number,
): string | null {
  if (index < 1 || state.flags.includes('mystery_declined')) return null
  const mystery = runMystery(state)
  const played = (part: Parameters<typeof mysteryCardId>[1]) =>
    state.played.includes(mysteryCardId(mystery, part))
  const triggers = gateTriggers(route)
  for (const [n, part] of (['G1', 'G2', 'G3'] as const).entries()) {
    if (played(part)) continue
    return index >= triggers[n]! ? mysteryCardId(mystery, part) : null
  }
  if (mysteryPasses(state.flags) < PASSES_FOR_TRUE_PATH)
    return played('COLD') ? null : mysteryCardId(mystery, 'COLD')
  if (!played('REVEAL')) return mysteryCardId(mystery, 'REVEAL')
  const path = state.flags
    .filter((flag) => flag.startsWith('mystery_path_'))
    .map((flag) => flag.slice('mystery_path_'.length))
    .find((key) => mystery.branches[key])
  if (path && !played(`B-${path}`)) return mysteryCardId(mystery, `B-${path}`)
  return null
}

/** The Real Ending this run reached, if it reached one. */
export function mysteryEnding(state: MysteryRun): MysteryEnding | null {
  const mystery = runMystery(state)
  return (
    mystery.endings.find((ending) =>
      state.flags.includes(`mystery_end_${ending.id}`),
    ) ?? null
  )
}

/** What this run adds to the Case Files; null until Gate I has been seen. */
export function caseRecord(state: MysteryRun): CaseRecord | null {
  const mystery = runMystery(state)
  if (!state.played.includes(mysteryCardId(mystery, 'G1'))) return null
  const gate = (n: number): GateResult =>
    state.flags.includes(`mystery_g${n}_pass`)
      ? 'pass'
      : state.flags.includes(`mystery_g${n}_fail`)
        ? 'fail'
        : null
  return {
    id: mystery.id,
    gates: [gate(1), gate(2), gate(3)],
    truePath: state.played.includes(mysteryCardId(mystery, 'REVEAL')),
    cold: state.flags.includes('mystery_cold'),
    endings: mystery.endings
      .filter((ending) => state.flags.includes(`mystery_end_${ending.id}`))
      .map((ending) => ending.id),
  }
}

function bestGate(a: GateResult, b: GateResult): GateResult {
  if (a === 'pass' || b === 'pass') return 'pass'
  if (a === 'fail' || b === 'fail') return 'fail'
  return null
}

/** Case Files keep your best result on every gate, across every run. */
export function mergeCaseRecord(
  previous: CaseRecord | undefined,
  next: CaseRecord,
): CaseRecord {
  if (!previous) return next
  return {
    id: next.id,
    gates: [0, 1, 2].map((n) =>
      bestGate(previous.gates[n] ?? null, next.gates[n] ?? null),
    ) as CaseRecord['gates'],
    truePath: previous.truePath || next.truePath,
    cold: previous.cold || next.cold,
    endings: [...new Set([...previous.endings, ...next.endings])],
  }
}

/** Accepts only well-formed records for known cases (localStorage is untrusted). */
export function sanitizeCaseFiles(raw: unknown): Record<string, CaseRecord> {
  const out: Record<string, CaseRecord> = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    const mystery = findMystery(id)
    if (!mystery || !value || typeof value !== 'object') continue
    const record = value as Partial<CaseRecord>
    const gates = Array.isArray(record.gates) ? record.gates : []
    out[id] = {
      id,
      gates: [0, 1, 2].map((n) =>
        gates[n] === 'pass' || gates[n] === 'fail' ? gates[n] : null,
      ) as CaseRecord['gates'],
      truePath: record.truePath === true,
      cold: record.cold === true,
      endings: Array.isArray(record.endings)
        ? record.endings.filter((ending): ending is string =>
            mystery.endings.some((known) => known.id === ending),
          )
        : [],
    }
  }
  return out
}

const SIGN_WORDS =
  /\b(aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces|zodiac|horoscopes?|astrolog\w*|star signs?)\b/i

function playerText(mystery: Mystery): string[] {
  const scenes = [
    mystery.coldCase,
    mystery.reveal,
    ...Object.values(mystery.branches),
  ]
  return [
    mystery.title,
    mystery.tagline,
    mystery.region,
    mystery.hook,
    mystery.decline.label,
    mystery.decline.text,
    ...mystery.gates.flatMap((gate) => [
      gate.title,
      gate.place,
      gate.message.from,
      ...gate.message.lines,
      ...gate.body,
      ...Object.values(gate.leadLines ?? {}),
      gate.aloneLine ?? '',
      ...Object.values(gate.recall ?? {}),
      ...gate.approaches.flatMap((approach) => [
        approach.label,
        approach.cost ?? '',
        approach.success.text,
        approach.failure.text,
      ]),
    ]),
    ...scenes.flatMap((scene) => [
      scene.title,
      scene.place,
      ...scene.body,
      ...Object.values(scene.leadLines ?? {}),
      scene.aloneLine ?? '',
      ...Object.values(scene.recall ?? {}),
      ...scene.choices.flatMap((choice) => [choice.label, choice.text]),
    ]),
    ...(mystery.reveal.afterMiss ?? []),
    ...mystery.endings.flatMap((ending) => [ending.title, ...ending.text]),
  ]
}

/** Authoring rules for a case. Returns every problem found (empty when valid). */
export function validateMystery(mystery: Mystery): string[] {
  const problems: string[] = []
  const at = (where: string, message: string) =>
    problems.push(`${mystery.id} ${where}: ${message}`)
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(mystery.id)) at('id', 'kebab-case')
  if (!(mystery.number >= 1 && mystery.number <= 12)) at('number', '1-12')
  if (mystery.gates.length !== 3) at('gates', 'exactly three')
  const smallEffects = (where: string, effects?: MysteryEffects) => {
    for (const [key, value] of Object.entries(effects ?? {}))
      if (!Number.isInteger(value) || Math.abs(value as number) > 1)
        at(where, `${key} must be -1, 0 or 1`)
  }
  const chapterAndScene = (where: string, scene: { chapter: number }) => {
    if (!(scene.chapter >= 1 && scene.chapter <= 6))
      at(where, 'chapter must be 1-6')
  }
  mystery.gates.forEach((gate, index) => {
    const where = `gate ${index + 1}`
    chapterAndScene(where, gate)
    if (gate.approaches.length < 2 || gate.approaches.length > 3)
      at(where, '2-3 approaches')
    if (!gate.message.lines.length) at(where, 'message has lines')
    if (!gate.body.length || gate.body.length > 3) at(where, '1-3 paragraphs')
    for (const id of COMPANION_IDS)
      if (!gate.leadLines?.[id]) at(where, `lead line for ${id}`)
    if (!gate.aloneLine) at(where, 'alone line')
    const ids = gate.approaches.map((approach) => approach.id)
    if (new Set(ids).size !== ids.length || ids.includes('decline'))
      at(where, 'approach ids unique and not "decline"')
    for (const approach of gate.approaches) {
      if (![7, 9, 11].includes(approach.check.target))
        at(`${where}/${approach.id}`, 'targets 7, 9 or 11')
      if (
        approach.success.text.length < 80 ||
        approach.failure.text.length < 80
      )
        at(`${where}/${approach.id}`, 'success and failure are written out')
      smallEffects(`${where}/${approach.id}`, approach.success.effects)
      smallEffects(`${where}/${approach.id}`, approach.failure.effects)
    }
  })
  const cold = mystery.coldCase
  chapterAndScene('cold case', cold)
  if (cold.choices.length !== 2) at('cold case', 'two choices')
  if (cold.choices.some((choice) => choice.next || choice.ending))
    at('cold case', 'no next or ending')
  const checkRecall = (
    where: string,
    recall: Record<string, string> | undefined,
    before: number,
  ) => {
    for (const [key, text] of Object.entries(recall ?? {})) {
      const match = /^g([123]):([a-z0-9-]+)$/.exec(key)
      const gate = Number(match?.[1])
      const what = match?.[2] ?? ''
      if (!match || gate >= before)
        at(
          where,
          `recall ${key} must name an earlier gate as g<N>:pass|fail|<approach>`,
        )
      else if (
        what !== 'pass' &&
        what !== 'fail' &&
        !mystery.gates[gate - 1]?.approaches.some((a) => a.id === what)
      )
        at(where, `recall ${key}: gate ${gate} has no approach ${what}`)
      if (text.length < 40) at(where, `recall ${key} is written out`)
    }
  }
  mystery.gates.forEach((gate, index) =>
    checkRecall(`gate ${index + 1}`, gate.recall, index + 1),
  )
  checkRecall('cold case', mystery.coldCase.recall, 4)
  if (!mystery.coldCase.recall?.['g3:pass'])
    at(
      'cold case',
      'recall g3:pass: the trail can go cold after a Gate III win (Gates I and II failed)',
    )
  checkRecall('reveal', mystery.reveal.recall, 4)
  for (const [key, scene] of Object.entries(mystery.branches))
    checkRecall(`branch ${key}`, scene.recall, 4)
  const endingIds = mystery.endings.map((ending) => ending.id)
  if (mystery.endings.length < 3) at('endings', 'at least three')
  if (!mystery.endings.some((ending) => ending.tone === 'true'))
    at('endings', 'one true ending')
  if (new Set(endingIds).size !== endingIds.length) at('endings', 'unique ids')
  const reachedEndings = new Set<string>()
  const reachedBranches = new Set<string>()
  const finale = (where: string, scene: MysteryScene, allowNext: boolean) => {
    chapterAndScene(where, scene)
    if (scene.choices.length < 2 || scene.choices.length > 4)
      at(where, '2-4 choices')
    const ids = scene.choices.map((choice) => choice.id)
    if (new Set(ids).size !== ids.length) at(where, 'unique choice ids')
    for (const choice of scene.choices) {
      smallEffects(`${where}/${choice.id}`, choice.effects)
      if (Boolean(choice.next) === Boolean(choice.ending))
        at(`${where}/${choice.id}`, 'exactly one of next or ending')
      if (choice.next) {
        if (!allowNext) at(`${where}/${choice.id}`, 'branches end the tree')
        else if (!mystery.branches[choice.next])
          at(`${where}/${choice.id}`, `unknown branch ${choice.next}`)
        reachedBranches.add(choice.next)
      }
      if (choice.ending) {
        if (!endingIds.includes(choice.ending))
          at(`${where}/${choice.id}`, `unknown ending ${choice.ending}`)
        reachedEndings.add(choice.ending)
      }
    }
  }
  finale('reveal', mystery.reveal, true)
  if (!mystery.reveal.afterMiss?.length || mystery.reveal.afterMiss.length > 3)
    at(
      'reveal',
      'afterMiss: 1-3 paragraphs for a reveal after a failed Gate III',
    )
  for (const id of COMPANION_IDS)
    if (!mystery.reveal.leadLines?.[id]) at('reveal', `lead line for ${id}`)
  for (const [key, scene] of Object.entries(mystery.branches)) {
    if (!/^[a-z0-9-]+$/.test(key)) at(`branch ${key}`, 'kebab-case key')
    finale(`branch ${key}`, scene, false)
    if (!reachedBranches.has(key)) at(`branch ${key}`, 'unreachable')
  }
  for (const id of endingIds)
    if (!reachedEndings.has(id)) at(`ending ${id}`, 'unreachable')
  const design = mystery.design
  if (design.stars.length < 5 || design.stars.length > 14)
    at('design', '5-14 stars')
  if (design.stars.some(([x, y]) => x < 0 || x > 100 || y < 0 || y > 100))
    at('design', 'stars within 0-100')
  if (
    design.links.some(
      ([a, b]) => !design.stars[a] || !design.stars[b] || a === b,
    )
  )
    at('design', 'links join two stars')
  if (!/no text/i.test(mystery.artPrompt)) at('artPrompt', 'asks for no text')
  if (!mystery.provenance) at('provenance', 'names its provenance')
  for (const text of playerText(mystery)) {
    const word = text.match(SIGN_WORDS)?.[0]
    if (word) at('text', `names "${word}" outright: “${text.slice(0, 60)}…”`)
  }
  return problems
}
