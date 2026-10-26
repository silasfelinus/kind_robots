import assert from 'node:assert/strict'
import { BRIAR_LINKS, BRIAR_START, BRIAR_TILES } from '../memoryDungeonWorld'
import { BRIAR_SCENES } from '../memoryDungeon/scenes'
import { HOUSE_ENTRY, HOUSE_ROOMS } from '../memoryDungeon/house'
import { WORLD_ONE_ART_SHOTS } from '../memoryDungeon/artManifest'
import { validateRealmManifest, type RealmManifest, type RealmSite } from '../memoryDungeon/realmManifestValidator'

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
