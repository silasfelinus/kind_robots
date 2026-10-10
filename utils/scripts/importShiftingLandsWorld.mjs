import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const output = fileURLToPath(
  new URL('../shiftingLands/worldSnapshot.json', import.meta.url),
)
const defaultSource = resolve(
  '../conductor/projects/zuzu-shifting-lands/WORLD-DECKS.json',
)

export function makeSnapshot(sourceText) {
  const world = JSON.parse(sourceText)
  if (
    world.schema_version !== 2 ||
    world.conductor_project !== 'zuzu-shifting-lands' ||
    world.lands?.length !== 5 ||
    world.lands.some((land) => land.locations?.length !== 3)
  ) {
    throw new Error('Expected five-land Shifting Lands source manifest v2')
  }
  const hash = createHash('sha1')
    .update('blob ' + Buffer.byteLength(sourceText) + '\0')
    .update(sourceText)
    .digest('hex')
  const art = new Map(
    world.art_refs.map((ref) => [
      ref.key,
      ref.status === 'repository-file' && ref.repo_path.startsWith('public/')
        ? '/' + ref.repo_path.slice(7)
        : null,
    ]),
  )
  const illustration = (key) => (key === null ? null : (art.get(key) ?? null))
  return {
    schemaVersion: 2,
    source: {
      repository: 'silasfelinus/conductor',
      path: 'projects/zuzu-shifting-lands/WORLD-DECKS.json',
      blobSha: hash,
    },
    lands: world.lands.map((land) => ({
      id: land.id,
      name: land.name,
      chapter: land.chapter,
      biome: land.biome,
      locations: land.locations.map((location) => ({
        id: location.id,
        label: location.label,
        teaser: location.front_teaser,
        skill: location.skill,
        difficulty: location.difficulty,
        art: illustration(location.art_ref),
      })),
      boss: {
        id: land.major_challenge.id,
        label: land.major_challenge.label,
        teaser: land.major_challenge.front_teaser,
        art: illustration(land.major_challenge.art_ref),
      },
    })),
  }
}

const invoked =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) {
  const check = process.argv.includes('--check')
  const sourceFile =
    process.argv.find((arg, i) => i > 1 && !arg.startsWith('--')) ??
    defaultSource
  const generated =
    JSON.stringify(makeSnapshot(readFileSync(sourceFile, 'utf8')), null, 2) +
    '\n'
  if (check) {
    if (readFileSync(output, 'utf8') !== generated)
      throw new Error(
        'Shifting Lands world snapshot differs from Conductor; regenerate',
      )
    console.log('Shifting Lands snapshot matches Conductor source manifest')
  } else {
    writeFileSync(output, generated)
    console.log('Updated spoiler-safe Shifting Lands world snapshot')
  }
}
