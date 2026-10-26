import assert from 'node:assert/strict'
import { BRIAR_LINKS, BRIAR_START, BRIAR_TILES } from '../memoryDungeonWorld'
import { BRIAR_SCENES } from '../memoryDungeon/scenes'
import { HOUSE_ENTRY, HOUSE_ROOMS } from '../memoryDungeon/house'
import { WORLD_ONE_ART_SHOTS } from '../memoryDungeon/artManifest'
import {
  validateRealmManifest,
  type RealmManifest,
  type RealmSite,
} from '../memoryDungeon/realmManifestValidator'

const shots = new Map(WORLD_ONE_ART_SHOTS.map((shot) => [shot.id, shot]))
function artFor(id: string): RealmSite['art'] {
  const shot = shots.get(id)
  return shot
    ? { path: shot.targetPath, prompt: shot.prompt, status: 'placeholder' }
    : undefined
}

const briar: RealmManifest = {
  name: 'Briar Marches',
  coordinates: BRIAR_TILES.map((tile) => tile.key),
  start: BRIAR_START,
  links: BRIAR_LINKS,
  sites: BRIAR_TILES.map((tile) => ({
    key: tile.key,
    title: BRIAR_SCENES[tile.key]?.title ?? '',
    persistenceKey: BRIAR_SCENES[tile.key] ? `sceneChoices.${tile.key}` : '',
    choices: BRIAR_SCENES[tile.key]?.choices ?? [],
    art: artFor(`briar-${tile.key.replace(',', '-')}`),
  })),
}
const houseRooms = Object.values(HOUSE_ROOMS)
const house: RealmManifest = {
  name: 'House That Remembers',
  coordinates: houseRooms.map((room) => room.id),
  start: HOUSE_ENTRY,
  links: Object.fromEntries(houseRooms.map((room) => [room.id, room.exits])),
  sites: houseRooms.map((room) => ({
    key: room.id,
    title: room.title,
    persistenceKey: `house.decisions.${room.id}`,
    choices: room.choices,
    art: artFor(`house-${room.id}`),
  })),
}

assert.deepEqual(validateRealmManifest(briar), [])
assert.deepEqual(validateRealmManifest(house), [])

function mutateFirst(change: (site: RealmSite) => RealmSite): RealmManifest {
  return { ...briar, sites: [change(briar.sites[0]!), ...briar.sites.slice(1)] }
}
function catches(manifest: RealmManifest, reason: string) {
  assert.ok(
    validateRealmManifest(manifest).some((issue) => issue.includes(reason)),
    reason,
  )
}
catches(
  { ...briar, coordinates: [...briar.coordinates, briar.start] },
  'Duplicate coordinate',
)
catches(
  { ...briar, sites: [...briar.sites, briar.sites[0]!] },
  'Duplicate site',
)
catches(
  { ...briar, links: { ...briar.links, [BRIAR_START]: [] } },
  'Unreachable site',
)
catches(
  mutateFirst((s) => ({ ...s, persistenceKey: '' })),
  'persistent consequence',
)
catches(
  mutateFirst((s) => ({ ...s, choices: [] })),
  'Too few choices',
)
catches(
  mutateFirst((s) => ({
    ...s,
    choices: s.choices.map((c, i) => (i ? c : { ...c, outcome: '' })),
  })),
  'Missing choice outcome',
)
catches(
  mutateFirst((s) => ({ ...s, art: undefined })),
  'Missing art or placeholder',
)
catches(
  mutateFirst((s) => ({ ...s, art: { ...s.art!, prompt: '' } })),
  'Incomplete art brief',
)
catches(
  mutateFirst((s) => ({
    ...s,
    art: { ...s.art!, status: 'queued', jobId: null },
  })),
  'Unverified ArtJob',
)
catches(
  mutateFirst((s) => ({
    ...s,
    art: { ...s.art!, status: 'delivered', jobId: 42 },
  })),
  'Undelivered art',
)
console.log(
  'Memory Dungeon: Briar, House, and manifest mutation contracts verified',
)
