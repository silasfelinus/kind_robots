// /utils/scripts/reportCthulhuquariumCoverage.ts
//
// conductor cthulhuquarium/t-092: the machine-readable event and canon
// coverage report. For every authored scene, bark pool, background and
// species it says what makes it happen in live code, and it fails (exit 1)
// when anything authored can never be reached or shown.
//
//   npx tsx utils/scripts/reportCthulhuquariumCoverage.ts            # check + summary
//   npx tsx utils/scripts/reportCthulhuquariumCoverage.ts --json out # also write the JSON
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  BESTIARY_MILESTONES,
  FIRST_EVOLUTION_MILESTONE,
  FIRST_FULL_TANK_MILESTONE,
  FIRST_SPOTLESS_TANK_MILESTONE,
} from '../../server/utils/aquariumEconomy'
import { FIRST_RIVALRY_RESOLVED_MILESTONE_ID } from '../../server/utils/aquariumRivalryMilestone'
import {
  CTHULHUQUARIUM_BACKGROUNDS,
  CTHULHUQUARIUM_BARKS,
  CTHULHUQUARIUM_PLATES,
  CTHULHUQUARIUM_SCENES,
  CTHULHUQUARIUM_SPECIES,
  CTHULHUQUARIUM_SPRITE_MOTIONS,
  CTHULHUQUARIUM_VOICES,
} from '../cthulhuquariumCanon.generated'
import { CTHULHUQUARIUM_FLOORS, floorForDepth } from '../cthulhuquariumFloors'

// The game's own source, where a scene id or bark context has to be named for
// it to ever play.
function sources(dir: string): string {
  let text = ''
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) text += sources(path)
    else if (/\.(ts|vue)$/.test(name) && !name.includes('.generated.'))
      text += readFileSync(path, 'utf8')
  }
  return text
}
const code = [
  sources('components/cthulhuquarium'),
  readFileSync('stores/cthulhuquariumTankStore.ts', 'utf8'),
  readFileSync('stores/helpers/cthulhuquariumStory.ts', 'utf8'),
].join('\n')

const milestoneIds = new Set<string>([
  ...BESTIARY_MILESTONES.map((m) => m.id),
  FIRST_FULL_TANK_MILESTONE.id,
  FIRST_SPOTLESS_TANK_MILESTONE.id,
  FIRST_EVOLUTION_MILESTONE.id,
  FIRST_RIVALRY_RESOLVED_MILESTONE_ID,
])
const keyFloors = new Set<number>(
  CTHULHUQUARIUM_FLOORS.filter((f) => f.floor > 1).map((f) => f.floor),
)

function sceneReach(trigger: string, id: string): string | null {
  if (trigger === 'intro') return 'first visit (loadStory)'
  if (trigger === 'first_unlock')
    return code.includes("queueScene('first_unlock')")
      ? 'first species bought'
      : null
  if (trigger === 'bestiary_complete')
    return code.includes("queueScene('bestiary_complete')")
      ? 'book completed'
      : null
  if (trigger === 'finale')
    return code.includes('queueFinaleScene') ? 'Last Aquarium bought' : null
  const milestone = /^milestone:(.+)$/.exec(trigger)?.[1]
  if (milestone)
    return milestoneIds.has(milestone) ? `milestone ${milestone}` : null
  const open = /^floor_open:(\d)$/.exec(trigger)?.[1]
  if (open)
    return keyFloors.has(Number(open)) && code.includes('announceFloorKey')
      ? `key to floor ${open} bought`
      : null
  const first = /^floor_first:(\d)$/.exec(trigger)?.[1]
  if (first)
    return code.includes('announceFirstOfFloor')
      ? `first species from floor ${first}`
      : null
  void id
  return null
}

const scenes = Object.values(CTHULHUQUARIUM_SCENES).map((scene) => ({
  id: scene.id,
  title: scene.title,
  trigger: scene.trigger,
  floor: scene.floor,
  plate: scene.plate,
  background: scene.background,
  beats: scene.beats.length,
  replies: scene.beats.flatMap((b) => b.choices ?? []).length,
  reachedBy: sceneReach(scene.trigger, scene.id),
}))

// A bark pool plays when its context is named in the game's code.
const barks = Object.entries(CTHULHUQUARIUM_BARKS).map(([context, bark]) => ({
  context,
  speaker: bark.speaker,
  lines: bark.lines.length,
  shownBy:
    code.includes(`'${context}'`) || code.includes(`context="${context}"`)
      ? 'named in game code'
      : null,
}))

const backgrounds = CTHULHUQUARIUM_BACKGROUNDS.map((bg) => ({
  key: bg.key,
  unlock: bg.unlock,
  reachable: bg.unlock === 'default' || milestoneIds.has(bg.unlock),
}))

const species = Object.entries(CTHULHUQUARIUM_SPECIES).map(([slug, s]) => ({
  slug,
  name: s.name,
  floor: floorForDepth(s.tier),
  motion: CTHULHUQUARIUM_SPRITE_MOTIONS[slug] ?? null,
  plate: CTHULHUQUARIUM_PLATES[slug] ?? null,
  voices: !!(
    CTHULHUQUARIUM_VOICES[slug]?.charlotte &&
    CTHULHUQUARIUM_VOICES[slug]?.wilbur
  ),
}))

const problems = [
  ...scenes
    .filter((s) => !s.reachedBy)
    .map((s) => `scene ${s.id} (${s.trigger}) is never played`),
  ...barks
    .filter((b) => !b.shownBy)
    .map((b) => `bark pool ${b.context} is never shown`),
  ...backgrounds
    .filter((b) => !b.reachable)
    .map((b) => `background ${b.key} (${b.unlock}) can never unlock`),
  ...species
    .filter((s) => !s.motion || !s.voices)
    .map((s) => `species ${s.slug} lacks ${!s.motion ? 'a motion' : 'voices'}`),
]

const perFloor = CTHULHUQUARIUM_FLOORS.map((f) => ({
  floor: f.floor,
  name: f.name,
  species: species.filter((s) => s.floor === f.floor).length,
  scenes: scenes.filter((s) => s.floor === f.floor).length,
}))

const report = {
  generatedFrom: 'kind_robots utils/cthulhuquariumCanon.generated.ts',
  totals: {
    scenes: scenes.length,
    replies: scenes.reduce((n, s) => n + s.replies, 0),
    barkPools: barks.length,
    barkLines: barks.reduce((n, b) => n + b.lines, 0),
    backgrounds: backgrounds.length,
    species: species.length,
  },
  perFloor,
  problems,
  scenes,
  barks,
  backgrounds,
  species,
}

const jsonAt = process.argv.indexOf('--json')
if (jsonAt > -1 && process.argv[jsonAt + 1]) {
  writeFileSync(process.argv[jsonAt + 1]!, JSON.stringify(report, null, 2))
}
console.log(
  `Cthulhuquarium coverage: ${report.totals.scenes} scenes (${report.totals.replies} replies), ` +
    `${report.totals.barkPools} bark pools (${report.totals.barkLines} lines), ` +
    `${report.totals.backgrounds} backgrounds, ${report.totals.species} species`,
)
for (const f of perFloor)
  console.log(
    `  floor ${f.floor} ${f.name}: ${f.species} species, ${f.scenes} scenes`,
  )
if (problems.length) {
  for (const p of problems) console.error(`  ✗ ${p}`)
  process.exit(1)
}
console.log('✅ every authored scene, bark pool and background can be reached')
