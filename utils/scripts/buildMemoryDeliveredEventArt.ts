/**
 * Rebuild utils/memoryDungeon/deliveredEventArt.json from the live media host.
 *
 * Lists every Memory Dungeon overworld-event and e10 crossroad image path the
 * game can display, requests the first bytes of each (the media host returns
 * 404 to HEAD requests even for files it serves), and records the paths that
 * answer with an image. Run: npm run memory:delivered-art
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { OVERWORLD_EVENT_CATALOG } from '../memoryDungeon/overworldEventCatalog'
import {
  EARTH_CROSSROAD_CHOICES,
  EARTH_CROSSROAD_SCENE,
} from '../memoryDungeon/earthCollisionCrossroad'

const ORIGIN = process.env.MEMORY_ART_ORIGIN ?? 'https://kindrobots.org'
const OUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../memoryDungeon/deliveredEventArt.json',
)

export function memoryEventArtPaths(): string[] {
  const paths = new Set<string>()
  for (const event of OVERWORLD_EVENT_CATALOG) {
    paths.add(event.sceneArt.path)
    paths.add(event.portrait.path)
    for (const choice of event.choices) paths.add(choice.art.path)
  }
  paths.add(EARTH_CROSSROAD_SCENE.art.path)
  for (const choice of EARTH_CROSSROAD_CHOICES) paths.add(choice.art.path)
  return [...paths].sort()
}

async function served(artPath: string): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(ORIGIN + artPath, {
        headers: { Range: 'bytes=0-63' },
      })
      await response.body?.cancel()
      if (response.status === 404) return false
      if (response.status === 200 || response.status === 206)
        return (response.headers.get('content-type') ?? '').startsWith('image/')
    } catch {
      // retry transient network failures
    }
  }
  throw new Error('Could not verify ' + artPath)
}

async function main(): Promise<void> {
  const all = memoryEventArtPaths()
  const delivered: string[] = []
  let next = 0
  await Promise.all(
    Array.from({ length: 16 }, async () => {
      while (next < all.length) {
        const artPath = all[next++]!
        if (await served(artPath)) delivered.push(artPath)
      }
    }),
  )
  delivered.sort()
  writeFileSync(
    OUT,
    JSON.stringify(
      { checkedAt: new Date().toISOString(), origin: ORIGIN, paths: delivered },
      null,
      2,
    ) + '\n',
  )
  console.log(`${delivered.length} of ${all.length} event images served`)
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
)
  await main()
