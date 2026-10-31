import { BRIAR_SCENES } from './scenes'
import { DARK_BRIAR_SCENES, DARK_BRIAR_SEALS } from './darkBriar'
import { HOSHIMORI_WARM_SITES } from './hoshimoriWarm'
import { HOSHIMORI_NIGHT_SITES } from './hoshimoriNight'
import { EARTH_PHOTOS } from './chronicle'
import recipes from './overworldEventRecipes.json'
import { BRIAR_SITES } from '../memoryDungeonWorld'

export type OverworldKind =
  | 'memory' | 'challenge' | 'treasure' | 'monster'
  | 'dungeon' | 'merchant' | 'puzzle' | 'companion'

export interface OverworldArt {
  path: string
  prompt: string
  status: 'placeholder'
}
export interface OverworldChoice {
  id: string
  label: string
  outcome: string
  flag: string
  effects: { supplies?: number; trust?: number; evidence?: number; danger?: number }
  art: OverworldArt
}
export interface OverworldEvent {
  id: string
  experience: string
  key: string
  title: string
  opening: string
  speaker: string
  kind: OverworldKind
  portrait: OverworldArt
  sceneArt: OverworldArt
  choices: readonly OverworldChoice[]
  photographId?: string
  memoryFragment?: string
  originalSite?: string
  source: 'existing-playable' | 'new-authoring'
}
export interface OverworldEventProgress {
  version: 1
  experience: string
  revealed: string[]
  choices: Record<string, string>
  flags: string[]
  supplies: number
  trust: number
  evidence: number
  danger: number
}

const kinds: readonly OverworldKind[] = [
  'memory', 'challenge', 'treasure', 'monster',
  'challenge', 'merchant', 'puzzle', 'companion',
]
const mirrorTitles = new Map(HOSHIMORI_WARM_SITES.map((site) => [site.key, site.title]))
const photos = new Map(
  Array.from({ length: 12 }, (_, i) => {
    const id = 'e' + String(i + 1).padStart(2, '0')
    return [id, EARTH_PHOTOS.filter((photo) => photo.experience === id)] as const
  }),
)
function slug(text: string): string {
  return text.normalize('NFKD').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
function art(experience: string, key: string, subject: string, action: string, style: string): OverworldArt {
  return {
    path: '/images/memory-dungeon/events/' + experience + '-' +
      key.replace(',', '-') + '-' + slug(action) + '.webp',
    prompt: 'Original illustration, ' + style + '. Coordinate ' + key +
      ': ' + subject + '. ' + action +
      '. Cinematic staging, legible human expressions and physical actions, no text, no lettering, no collage.',
    status: 'placeholder',
  }
}
function category(x: number, y: number): OverworldKind {
  return (x === 6 && y === 2) || (x === 3 && y === 6)
    ? 'dungeon'
    : kinds[(x + y * 3) % kinds.length]!
}
function effects(kind: OverworldKind, careful: boolean): OverworldChoice['effects'] {
  if (kind === 'treasure') return careful ? { supplies: 1, trust: 1 } : { supplies: 2, danger: 1 }
  if (kind === 'monster') return careful ? { danger: -1, evidence: 1 } : { danger: 1, supplies: 1 }
  if (kind === 'merchant') return careful ? { supplies: -1, trust: 1 } : { supplies: 1, trust: -1 }
  if (kind === 'dungeon') return careful ? { evidence: 1, danger: 1 } : { evidence: 1, supplies: -1 }
  if (kind === 'companion') return careful ? { trust: 1 } : { evidence: 1, trust: -1 }
  if (kind === 'puzzle') return careful ? { evidence: 1 } : { supplies: -1, danger: -1 }
  return careful ? { trust: 1, evidence: 1 } : { evidence: 1, danger: 1 }
}

function generated(
  world: (typeof recipes.worlds)[number],
  x: number,
  y: number,
): OverworldEvent {
  const district = world.districts[y - 1]!
  const device = world.devices[x - 1]!
  const key = x + ',' + y
  const title = district.name + ' / ' + device.name
  const mirror = world.id === 'e08' ? mirrorTitles.get(key) : undefined
  const photo = photos.get(world.id)?.find((item) => item.site === key)
  const fragment = ['e09', 'e10', 'e11', 'e12'].includes(world.id) &&
    ((x === 2 && y === (world.id === 'e11' ? 3 : 2)) || (x === 7 && y === 6))
  const kind = photo ? 'memory' : category(x, y)
  const opening = [
    mirror ? 'This was once ' + mirror + '.' : '',
    district.scene, device.intrusion,
    district.character + ' must decide ' + district.stake + '.',
    photo ? 'A dated Earth photograph surfaces: ' + photo.caption : '',
    fragment ? 'A displaced map fragment belongs to someone in another reality; its recovery must remain in the Chronicle.' : '',
  ].filter(Boolean).join(' ')
  const raw = photo ? [
    { id: 'challenge', label: photo.challenge, outcome: photo.challengeReflection },
    { id: 'hold', label: photo.hold, outcome: photo.holdReflection },
  ] : [
    {
      id: 'care',
      label: 'At ' + device.name + ', ' + device.offer,
      outcome: 'You ' + device.offer + '. ' + district.character +
        ' can now testify about ' + district.stake +
        '. The care and its cost belong to this coordinate.',
    },
    {
      id: 'risk',
      label: 'At ' + device.name + ', ' + device.warning,
      outcome: 'You ' + device.warning + '. ' + district.character +
        ' witnesses what changes about ' + district.stake +
        '. The choice opens information while leaving a real obligation.',
    },
  ]
  let choices: OverworldChoice[] = raw.map((option, index) => ({
    ...option,
    flag: world.id + ':' + key + ':' + option.id,
    effects: effects(kind, index === 0),
    art: art(world.id, key, title, 'choice-' + (index + 1) + ': ' + option.label, world.visual),
  }))
  if (world.id === 'e04' && key === '8,8') {
    choices = [
      {
        id: 'open-the-tide-gate',
        label: 'Evacuate the commuters; Char may die holding the failing sea anchor',
        outcome: 'The commuters escape. Scylla witnesses Char die holding the crossing in the present. The rescue and the death are real.',
        flag: 'e04:char-lost-in-present',
        effects: { trust: 1, danger: 1 },
      },
      {
        id: 'seal-the-tide-gate',
        label: 'Seal the crossing, keeping Char alive but trapping the commuters',
        outcome: 'Char lives. The party owes the stranded commuters a credible rescue, not a convenient line in a journal.',
        flag: 'e04:char-alive-commuters-stranded',
        effects: { danger: -1, evidence: 1 },
      },
      {
        id: 'divert-the-current',
        label: 'Divert the surge to the supposedly empty maintenance district',
        outcome: 'Char lives but the district floods. Someone may have lived beyond the abandoned route on the map.',
        flag: 'e04:char-alive-district-at-risk',
        effects: { danger: 1, evidence: 1 },
      },
    ].map((option, index) => ({
      ...option,
      art: art(world.id, key, 'Char and Scylla at the broken sea gate', 'crisis-option-' + (index + 1) + ': ' + option.label, world.visual),
    }))
  }
  if (world.id === 'e05' && key === '8,8') {
    choices = [
      {
        id: 'run-again',
        label: 'Invite Char to run away together again',
        outcome: 'The sisters prepare their escape, with full knowledge of Scylla’s risk and no presumption that Char is a passive prize.',
        flag: 'e05:run-again',
        effects: { trust: 1, danger: 1 },
      },
      {
        id: 'stay',
        label: 'Stay beneath the sea and face the court together',
        outcome: 'The palace has time to impose its will. Char refuses to accept safe confinement as a gift.',
        flag: 'e05:stay',
        effects: { trust: -1, evidence: 1 },
      },
      {
        id: 'tell-char',
        label: 'Tell Char the remembered future and give her the decision',
        outcome: 'Scylla shares her impossible account. Char is frightened, angry and finally informed, and the changed timeline must respect her answer.',
        flag: 'e05:tell-char',
        effects: { trust: 1, evidence: 1 },
      },
    ].map((option, index) => ({
      ...option,
      art: art(world.id, key, 'Younger Char with Scylla at the royal departure gate', 'departure-option-' + (index + 1) + ': ' + option.label, world.visual),
    }))
  }
  return {
    id: world.id + ':' + key,
    experience: world.id,
    key,
    title,
    opening,
    speaker: district.character,
    kind,
    sceneArt: art(world.id, key, title, 'establishing-scene', world.visual),
    portrait: art(world.id, key, district.character, 'speaking-portrait', world.visual),
    choices,
    ...(photo ? { photographId: photo.id } : {}),
    ...(fragment ? { memoryFragment: world.id + ':' + key } : {}),
    ...(mirror ? { originalSite: mirror } : {}),
    source: 'new-authoring',
  }
}

function legacyKind(world: string, key: string): OverworldKind {
  if (photos.get(world)?.some((photo) => photo.site === key)) return 'memory'
  if (world === 'e02' && Object.hasOwn(DARK_BRIAR_SEALS, key)) return 'puzzle'
  if (world === 'e01') {
    const kind = BRIAR_SITES[key]?.kind
    if (kind === 'merchant') return 'merchant'
    if (kind === 'dungeon') return 'dungeon'
    if (kind === 'chest') return 'treasure'
    if (kind === 'enemy') return 'monster'
    if (kind === 'puzzle' || kind === 'rune' || kind === 'sealed') return 'puzzle'
    if (kind === 'camp') return 'companion'
  }
  return 'challenge'
}

function legacyChoices(
  world: string,
  key: string,
  title: string,
  options: readonly { id: string; label: string; outcome: string }[],
): OverworldChoice[] {
  return options.map((choice, index) => ({
    id: choice.id,
    label: choice.label,
    outcome: choice.outcome,
    flag: world + ':' + key + ':' + choice.id,
    effects: {},
    art: art(world, key, title, 'choice-' + (index + 1) + ': ' + choice.label, 'painted storybook'),
  }))
}
function legacy(): OverworldEvent[] {
  const records: OverworldEvent[] = []
  function add(world: string, key: string, title: string, opening: string,
    options: readonly { id: string; label: string; outcome: string }[],
  ) {
    records.push({
      id: world + ':' + key, experience: world, key, title, opening,
      kind: legacyKind(world, key), speaker: 'local witness',
      portrait: art(world, key, title, 'speaking-portrait', 'painted storybook'),
      sceneArt: art(world, key, title, 'establishing-scene', 'painted storybook'),
      choices: legacyChoices(world, key, title, options),
      ...(world === 'e08' && mirrorTitles.has(key)
        ? { originalSite: mirrorTitles.get(key)! }
        : {}),
      ...(photos.get(world)?.find((photo) => photo.site === key)
        ? { photographId: photos.get(world)!.find((photo) => photo.site === key)!.id }
        : {}),
      source: 'existing-playable',
    })
  }
  for (const [key, scene] of Object.entries(BRIAR_SCENES))
    add('e01', key, scene.title, scene.opening, scene.choices)
  for (const scene of Object.values(DARK_BRIAR_SCENES))
    add('e02', scene.key, scene.title, scene.opening, scene.choices)
  for (const seal of Object.values(DARK_BRIAR_SEALS))
    add('e02', seal.key, seal.title, seal.opening, [
      { id: 'witness', label: 'Witness the seal without breaking its inscription',
        outcome: 'The inscription survives intact. Its hint remains available to compare with the other three seals: ' + seal.hint },
      { id: 'trace', label: 'Trace the seal as evidence for the crossing',
        outcome: 'You sketch the exact marks and carry their testimony to the next crossing. The original stone remains where it belongs.' },
    ])
  for (const site of HOSHIMORI_WARM_SITES)
    add('e07', site.key, site.title, site.opening, site.choices)
  for (const site of HOSHIMORI_NIGHT_SITES)
    add('e08', site.key, site.title, site.opening, site.choices)
  return records
}

/** Content registry only. The non-legacy worlds are not yet connected to the RPG map UI. */
export const OVERWORLD_EVENT_CATALOG: readonly OverworldEvent[] = [
  ...legacy(),
  ...recipes.worlds.flatMap((world) =>
    Array.from({ length: 64 }, (_, index) =>
      generated(world, (index % 8) + 1, Math.floor(index / 8) + 1),
    ).filter((event) =>
      world.id !== 'e08' || !HOSHIMORI_NIGHT_SITES.some((site) => site.key === event.key),
    ),
  ),
]
const index = new Map<string, Map<string, OverworldEvent>>()
for (const event of OVERWORLD_EVENT_CATALOG) {
  let entries = index.get(event.experience)
  if (!entries) {
    entries = new Map()
    index.set(event.experience, entries)
  }
  entries.set(event.key, event)
}
export function worldEvents(experience: string): readonly OverworldEvent[] {
  return OVERWORLD_EVENT_CATALOG.filter((event) => event.experience === experience)
}
export function worldEvent(experience: string, key: string): OverworldEvent | null {
  return index.get(experience)?.get(key) ?? null
}
export function eventNeighbors(key: string): string[] {
  const match = /^([1-8]),([1-8])$/.exec(key)
  if (!match) return []
  const x = Number(match[1])
  const y = Number(match[2])
  return [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]
    .filter(([a, b]) => a! >= 1 && a! <= 8 && b! >= 1 && b! <= 8)
    .map(([a, b]) => a + ',' + b)
}
export function newOverworldEventProgress(experience: string): OverworldEventProgress {
  return {
    version: 1, experience, revealed: ['1,1'], choices: {}, flags: [],
    supplies: 0, trust: 0, evidence: 0, danger: 0,
  }
}
export function revealOverworldEvent(progress: OverworldEventProgress, key: string): OverworldEventProgress {
  if (!worldEvent(progress.experience, key) || progress.revealed.includes(key)) return progress
  if (!eventNeighbors(key).some((neighbor) => progress.revealed.includes(neighbor))) return progress
  return { ...progress, revealed: [...progress.revealed, key] }
}
export function chooseOverworldEvent(
  progress: OverworldEventProgress, key: string, choiceId: string,
): OverworldEventProgress {
  const event = worldEvent(progress.experience, key)
  if (!event || !progress.revealed.includes(key) || progress.choices[key]) return progress
  const choice = event.choices.find((option) => option.id === choiceId)
  if (!choice) return progress
  return {
    ...progress,
    choices: { ...progress.choices, [key]: choiceId },
    flags: [...progress.flags, choice.flag],
    supplies: progress.supplies + (choice.effects.supplies ?? 0),
    trust: progress.trust + (choice.effects.trust ?? 0),
    evidence: progress.evidence + (choice.effects.evidence ?? 0),
    danger: Math.max(0, progress.danger + (choice.effects.danger ?? 0)),
  }
}
/** Ignore serialized totals and replay only valid, once-only choices. */
export function restoreOverworldEventProgress(value: unknown): OverworldEventProgress | null {
  if (!value || typeof value !== 'object') return null
  const data = value as Partial<OverworldEventProgress>
  if (data.version !== 1 || typeof data.experience !== 'string' || !worldEvents(data.experience).length) return null
  let progress = newOverworldEventProgress(data.experience)
  const pending = new Set(Array.isArray(data.revealed)
    ? data.revealed.filter((key): key is string => typeof key === 'string') : [])
  for (let step = 0; step < 64 && pending.size > 0; step++) {
    let changed = false
    for (const key of pending) {
      const next = revealOverworldEvent(progress, key)
      if (next !== progress) {
        progress = next
        pending.delete(key)
        changed = true
      }
    }
    if (!changed) break
  }
  if (data.choices && typeof data.choices === 'object')
    for (const [key, choice] of Object.entries(data.choices))
      if (typeof choice === 'string') progress = chooseOverworldEvent(progress, key, choice)
  return progress
}
export function validateOverworldEventCatalog(): string[] {
  const problems: string[] = []
  const artPaths = new Set<string>()
  for (let n = 1; n <= 12; n++) {
    const id = 'e' + String(n).padStart(2, '0')
    const events = worldEvents(id)
    if (events.length !== 64) problems.push(id + ': ' + events.length + '/64 sites')
    const keys = new Set<string>()
    for (const event of events) {
      if (keys.has(event.key)) problems.push(event.id + ': duplicate coordinate')
      keys.add(event.key)
      if (!/^([1-8]),([1-8])$/.test(event.key)) problems.push(event.id + ': invalid coordinate')
      if (!event.title.trim() || !event.opening.trim() || event.choices.length < 2)
        problems.push(event.id + ': incomplete narrative')
      if (new Set(event.choices.map((choice) => choice.id)).size !== event.choices.length)
        problems.push(event.id + ': duplicate choice')
      for (const image of [event.sceneArt, event.portrait, ...event.choices.map((c) => c.art)]) {
        if (artPaths.has(image.path)) problems.push(image.path + ': duplicate art')
        artPaths.add(image.path)
        if (image.prompt.length < 80 || image.status !== 'placeholder')
          problems.push(image.path + ': incomplete art contract')
      }
    }
    const visited = new Set(['1,1'])
    const queue = ['1,1']
    for (let at = 0; at < queue.length; at++)
      for (const key of eventNeighbors(queue[at]!))
        if (keys.has(key) && !visited.has(key)) {
          visited.add(key)
          queue.push(key)
        }
    if (visited.size !== 64) problems.push(id + ': disconnected')
    for (const photo of photos.get(id) ?? [])
      if (worldEvent(id, photo.site)?.photographId !== photo.id)
        problems.push(id + ': missing fixed photo at ' + photo.site)
  }
  for (const id of ['e04', 'e05'])
    if (worldEvent(id, '8,8')?.choices.length !== 3)
      problems.push(id + ': missing three-way choice')
  for (const id of ['e09', 'e10', 'e11', 'e12'])
    if (worldEvents(id).filter((event) => event.memoryFragment).length !== 2)
      problems.push(id + ': missing two map fragments')
  return problems
}
