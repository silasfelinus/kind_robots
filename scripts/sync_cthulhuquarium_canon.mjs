#!/usr/bin/env node
// scripts/sync_cthulhuquarium_canon.mjs
//
// Pull the Cthulhuquarium canon (github.com/silasfelinus/cthulhuquarium) into
// this app: story scenes, backgrounds, character poses, per-species sprite
// motion, and the built art. The canon repo is the source of truth; the files
// this writes are mirrors and are never hand-edited.
//
//   node scripts/sync_cthulhuquarium_canon.mjs [path/to/cthulhuquarium]
//
// Writes utils/cthulhuquariumCanon.generated.ts and
// utils/cthulhuquariumArtPrompts.generated.ts, and copies built art into
// assets/images/cthulhuquarium/{sprites,portraits,backgrounds,plates}/.

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { execFileSync } from 'node:child_process'
import { basename, join, resolve } from 'node:path'
import { parse } from 'yaml'

const repoRoot = resolve(import.meta.dirname, '..')
const canon = resolve(process.argv[2] ?? join(repoRoot, '..', 'cthulhuquarium'))
if (!existsSync(join(canon, 'fish'))) {
  console.error(`No cthulhuquarium canon at ${canon}`)
  process.exit(1)
}

const readYaml = (path) => parse(readFileSync(path, 'utf8'))

const flat = (text) =>
  String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()

const motions = {}
const masses = []
const voices = {}
const plates = {}
const traits = {}
const speciesPrompts = {}
for (const file of readdirSync(join(canon, 'fish'))
  .filter((name) => name.endsWith('.yaml'))
  .sort()) {
  const fish = readYaml(join(canon, 'fish', file))
  if (fish?.sprite?.motion) motions[fish.slug] = fish.sprite.motion
  if (fish?.sprite?.mass === true) masses.push(fish.slug)
  if (fish?.plate) plates[fish.slug] = fish.plate
  if (!flat(fish?.art_prompt)) throw new Error(`${file} has no art_prompt`)
  speciesPrompts[fish.slug] = flat(fish.art_prompt)
  traits[fish.slug] = {
    name: fish.name,
    behavior: fish.behavior ?? 'drift',
    size: fish.size ?? 1,
    hue: fish.hue ?? null,
  }
  if (fish?.voices) {
    voices[fish.slug] = {
      charlotte: String(fish.voices.charlotte ?? '')
        .replace(/\s+/g, ' ')
        .trim(),
      wilbur: String(fish.voices.wilbur ?? '')
        .replace(/\s+/g, ' ')
        .trim(),
    }
  }
}

const { scenes } = readYaml(join(canon, 'story', 'scenes.yaml'))
const { backgrounds } = readYaml(join(canon, 'backgrounds', 'backgrounds.yaml'))
const barksPath = join(canon, 'story', 'barks.yaml')
const barks = existsSync(barksPath) ? (readYaml(barksPath).barks ?? {}) : {}
const characters = {}
const characterPrompts = {}
for (const file of readdirSync(join(canon, 'characters')).filter((name) =>
  name.endsWith('.yaml'),
)) {
  const who = readYaml(join(canon, 'characters', file))
  characters[who.slug] = {
    name: who.name,
    role: who.role,
    poses: Object.keys(who.art?.portraits ?? {}),
  }
  const compact = flat(who.art?.hero?.compact)
  if (!compact || compact.length > 900) {
    throw new Error(
      `characters/${file}: art.hero.compact must be one prompt of 900 characters or fewer`,
    )
  }
  characterPrompts[who.slug] = compact
}

const speakerSlug = {
  charlotte: 'charlotte-fishmonger',
  wilbur: 'wilbur-stint',
}
// Keys a scene or beat may name as its plate: a still (story/plates.yaml) or a
// moving picture (videos/videos.yaml), which includes each character's hero.
const stillPlates = readYaml(join(canon, 'story', 'plates.yaml')).plates ?? []
const plateKeys = new Set([
  ...stillPlates.map((entry) => entry.key),
  ...(readYaml(join(canon, 'videos', 'videos.yaml')).videos ?? []).map(
    (entry) => entry.key,
  ),
])
// A plate is shown only once its art is built: a scene that names a plate
// still waiting on its render plays as it did before the plate was written,
// instead of opening a full-screen stage with nothing on it. The plate's
// prompt is still carried (cthulhuquariumArtPrompts.generated.ts).
const builtPlate = (key) =>
  !!key &&
  (existsSync(join(canon, 'story', 'built', `${key}.webp`)) ||
    existsSync(join(canon, 'videos', 'built', `${key}.webp`)))
const outScenes = {}
for (const [id, scene] of Object.entries(scenes)) {
  outScenes[id] = {
    id,
    trigger: scene.trigger,
    plate: builtPlate(scene.plate) ? scene.plate : null,
    background: scene.background ?? null,
    covers: scene.covers ?? [],
    beats: scene.beats.map((beat) => {
      const slug = speakerSlug[beat.speaker]
      if (!slug || !characters[slug]?.poses.includes(beat.pose)) {
        throw new Error(
          `scene ${id}: unknown speaker/pose ${beat.speaker}/${beat.pose}`,
        )
      }
      if (beat.plate && !plateKeys.has(beat.plate)) {
        throw new Error(`scene ${id}: unknown beat plate ${beat.plate}`)
      }
      return {
        speaker: beat.speaker,
        pose: beat.pose,
        text: String(beat.text).replace(/\s+/g, ' ').trim(),
        focus: beat.focus ?? null,
        await: beat.await ?? null,
        plate: builtPlate(beat.plate) ? beat.plate : null,
      }
    }),
  }
}

const outBarks = {}
for (const [context, bark] of Object.entries(barks)) {
  const slug = speakerSlug[bark.speaker]
  if (!slug || !characters[slug]?.poses.includes(bark.pose)) {
    throw new Error(
      `bark ${context}: unknown speaker/pose ${bark.speaker}/${bark.pose}`,
    )
  }
  outBarks[context] = {
    speaker: bark.speaker,
    pose: bark.pose,
    lines: (bark.lines ?? []).map((line) =>
      String(line).replace(/\s+/g, ' ').trim(),
    ),
  }
}

const outBackgrounds = backgrounds.map(({ key, name, unlock, field_note }) => {
  const fieldNote = flat(field_note)
  if (!fieldNote) throw new Error(`background ${key} has no field_note`)
  return { key, name, unlock, fieldNote }
})
for (const scene of Object.values(outScenes)) {
  if (
    scene.background &&
    !outBackgrounds.some((bg) => bg.key === scene.background)
  ) {
    throw new Error(
      `scene ${scene.id} hands over unknown background ${scene.background}`,
    )
  }
}

const banner = `// GENERATED by scripts/sync_cthulhuquarium_canon.mjs from the cthulhuquarium
// canon repo. Do not edit by hand -- edit the canon and re-run the sync.
`
const ts = `${banner}
export type CanonSpeaker = 'charlotte' | 'wilbur'

export interface CanonBeat {
  speaker: CanonSpeaker
  pose: string
  text: string
  focus: string | null
  await: string | null
  /** This beat's own plate, replacing the scene's (a \`*-hero\` key is a character's full-length portrait). */
  plate: string | null
}

export interface CanonScene {
  id: string
  trigger: string
  plate: string | null
  background: string | null
  covers: string[]
  beats: CanonBeat[]
}

export interface CanonBackground {
  key: string
  name: string
  unlock: string
  /** The shop's placard for this tank (canon backgrounds.yaml \`field_note\`). */
  fieldNote: string
}

export const CTHULHUQUARIUM_SPRITE_MOTIONS: Record<string, string> = ${JSON.stringify(motions, null, 2)}

/** Species whose sprite already draws the whole group (fish bible sprite.mass). */
export const CTHULHUQUARIUM_MASS_SPRITES: string[] = ${JSON.stringify(masses, null, 2)}

export const CTHULHUQUARIUM_VOICES: Record<
  string,
  { charlotte: string; wilbur: string }
> = ${JSON.stringify(voices, null, 2)}

export const CTHULHUQUARIUM_SPECIES: Record<
  string,
  { name: string; behavior: string; size: number; hue: number | null }
> = ${JSON.stringify(traits, null, 2)}

export const CTHULHUQUARIUM_PLATES: Record<string, string> = ${JSON.stringify(plates, null, 2)}

export const CTHULHUQUARIUM_SCENES: Record<string, CanonScene> = ${JSON.stringify(outScenes, null, 2)}

export interface CanonBark {
  speaker: CanonSpeaker
  pose: string
  lines: string[]
}

export const CTHULHUQUARIUM_BARKS: Record<string, CanonBark> = ${JSON.stringify(outBarks, null, 2)}

export const CTHULHUQUARIUM_BACKGROUNDS: CanonBackground[] = ${JSON.stringify(outBackgrounds, null, 2)}

export const CTHULHUQUARIUM_CHARACTERS: Record<CanonSpeaker, { name: string; role: string }> = ${JSON.stringify(
  {
    charlotte: {
      name: characters['charlotte-fishmonger'].name,
      role: characters['charlotte-fishmonger'].role,
    },
    wilbur: {
      name: characters['wilbur-stint'].name,
      role: characters['wilbur-stint'].role,
    },
  },
  null,
  2,
)}
`
writeFileSync(join(repoRoot, 'utils', 'cthulhuquariumCanon.generated.ts'), ts)

const backgroundPrompts = Object.fromEntries(
  backgrounds.map((bg) => {
    if (!flat(bg.prompt)) throw new Error(`background ${bg.key} has no prompt`)
    return [bg.key, flat(bg.prompt)]
  }),
)
const platePrompts = Object.fromEntries(
  stillPlates.map((entry) => [entry.key, flat(entry.prompt)]),
)
const scenePrompts = {}
for (const [id, scene] of Object.entries(scenes)) {
  const prompt =
    (scene.plate && platePrompts[scene.plate]) ||
    (scene.background && backgroundPrompts[scene.background])
  if (!prompt) {
    throw new Error(
      `scene ${id} has neither a still plate nor a background prompt`,
    )
  }
  scenePrompts[id] = prompt
}
writeFileSync(
  join(repoRoot, 'utils', 'cthulhuquariumArtPrompts.generated.ts'),
  `${banner}
// The canon's Krea 2 prompts, one per picture the Playbook Forge shows: each
// species' Ichthyonomicon plate (fish/*.yaml art_prompt), each tank background,
// each story scene's plate (story/plates.yaml, or the background a milestone
// hands over), and each shopkeeper's full-length sitting (art.hero.compact).
// Kept out of cthulhuquariumCanon.generated.ts so the tank never bundles them.

export const CTHULHUQUARIUM_ART_PROMPTS: {
  species: Record<string, string>
  backgrounds: Record<string, string>
  scenes: Record<string, string>
  characters: Record<string, string>
} = ${JSON.stringify(
    {
      species: speciesPrompts,
      backgrounds: backgroundPrompts,
      scenes: scenePrompts,
      characters: characterPrompts,
    },
    null,
    2,
  )}
`,
)
writeFileSync(
  join(repoRoot, 'server', 'utils', 'cthulhuquariumBackgrounds.generated.ts'),
  `${banner}
export const CTHULHUQUARIUM_BACKGROUND_UNLOCKS: Record<string, string> = ${JSON.stringify(
    Object.fromEntries(outBackgrounds.map((bg) => [bg.key, bg.unlock])),
    null,
    2,
  )}

export const CTHULHUQUARIUM_SCENE_IDS: string[] = ${JSON.stringify(Object.keys(outScenes), null, 2)}
`,
)

const assetRoot = join(repoRoot, 'assets', 'images', 'cthulhuquarium')
function copyBuilt(fromDir, toDir, rename = (name) => name) {
  const src = join(canon, fromDir)
  if (!existsSync(src)) return 0
  mkdirSync(join(assetRoot, toDir), { recursive: true })
  let count = 0
  for (const name of readdirSync(src).filter((file) =>
    file.endsWith('.webp'),
  )) {
    copyFileSync(join(src, name), join(assetRoot, toDir, rename(name)))
    count++
  }
  return count
}

const copied = {
  sprites: copyBuilt('sprites', 'sprites'),
  portraits: copyBuilt('characters/portraits', 'portraits'),
  backgrounds: copyBuilt('backgrounds/built', 'backgrounds'),
  plates: copyBuilt('story/built', 'plates'),
  videos: copyBuilt('videos/built', 'videos'),
  clips: copyBuilt('clips', 'clips'),
}
for (const who of ['charlotte-fishmonger', 'wilbur-stint']) {
  const hero = join(canon, 'characters', 'portraits', 'hero', `${who}.webp`)
  if (existsSync(hero)) {
    copyFileSync(hero, join(assetRoot, `cthulhuquarium-char-${basename(hero)}`))
    copied[`${who} hero`] = 1
  }
}

execFileSync(
  'npx',
  [
    'prettier',
    '--write',
    'utils/cthulhuquariumCanon.generated.ts',
    'utils/cthulhuquariumArtPrompts.generated.ts',
    'server/utils/cthulhuquariumBackgrounds.generated.ts',
  ],
  { cwd: repoRoot, stdio: 'ignore' },
)

console.log(
  `synced ${Object.keys(motions).length} sprite motions, ${Object.keys(outScenes).length} scenes, ` +
    `${outBackgrounds.length} backgrounds, ${Object.keys(outBarks).length} bark contexts; copied ${JSON.stringify(copied)}`,
)
