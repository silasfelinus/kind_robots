import {
  CTHULHUQUARIUM_BACKGROUNDS,
  CTHULHUQUARIUM_CHARACTERS,
  CTHULHUQUARIUM_SCENES,
  CTHULHUQUARIUM_SPECIES,
  CTHULHUQUARIUM_VOICES,
  type CanonSpeaker,
} from '../cthulhuquariumCanon.generated'
import { CTHULHUQUARIUM_ART_PROMPTS } from '../cthulhuquariumArtPrompts.generated'
import { plateFor } from '../cthulhuquariumBook'
import {
  blankNode,
  storyOrder,
  type NodeKind,
  type Playbook,
  type PlaybookNode,
  type PlaybookRoute,
} from './types'

// Playbook Studio adapter for Cthulhuquarium (Silas, 2026-10-27: "next we
// need support for cthulhuquarium and the ruler is hooked"). An aquarium,
// not a branching story: its authored content is the bestiary (151 species
// with Charlotte's and Wilbur's lines), the story scenes the shop plays, the
// tank backgrounds and the two shopkeepers. Species plates are served from
// public/cthulhuquarium-plates; every other picture is bundled by Vite
// (utils/cthulhuquariumArt.ts), so those beats carry the asset as
// `art` ("plate:screen-arrival", "background:parlour", "name:char-…") and
// the Forge resolves it in the browser. Every beat's Krea 2 prompt is the
// canon's own (fish art_prompt, background prompt, scene plate, the
// shopkeepers' compact hero sitting), synced into
// utils/cthulhuquariumArtPrompts.generated.ts; none is built from a title.

const SPEAKER_SLUG: Record<CanonSpeaker, string> = {
  charlotte: 'charlotte-fishmonger',
  wilbur: 'wilbur-stint',
}

function beat(
  key: string,
  kind: NodeKind,
  title: string,
  options: {
    place: string
    chapter: number
    body: string[]
    artUrl?: string
    art?: string
    artPrompt?: string
    companions?: string[]
  },
): PlaybookNode {
  const node = blankNode(key, kind, title)
  node.place = options.place
  node.chapter = options.chapter
  node.body = options.body.filter((line) => line.trim())
  node.artUrl = options.artUrl ?? null
  node.art = options.art ?? null
  if (options.artPrompt) node.artPrompt = options.artPrompt
  node.needsArt = true
  node.companions = options.companions ?? []
  node.provenance = 'utils/cthulhuquariumCanon.generated'
  return node
}

const sceneTitle = (id: string) =>
  id
    .replace(/^milestone_/, '')
    .replace(/_/g, ' ')
    .replace(/^bestiary (\d+)$/, '$1 species catalogued')
    .replace(/^./, (c) => c.toUpperCase())

export function buildCthulhuquariumPlaybook(): Playbook {
  const nodes: Record<string, PlaybookNode> = {}
  const add = (node: PlaybookNode) => {
    nodes[node.key] = node
    return node.key
  }

  const scenes = Object.values(CTHULHUQUARIUM_SCENES).map((scene) => {
    const speakers = [...new Set(scene.beats.map((b) => b.speaker))]
    const milestone = scene.id.startsWith('milestone_')
    return add(
      beat(
        `scene:${scene.id}`,
        scene.id === 'intro' ? 'opening' : milestone ? 'quest' : 'spine',
        sceneTitle(scene.id),
        {
          place: `Trigger: ${scene.trigger.replace(/_/g, ' ')}`,
          chapter: milestone ? 2 : 1,
          body: scene.beats.map(
            (b) => `${CTHULHUQUARIUM_CHARACTERS[b.speaker].name}: ${b.text}`,
          ),
          art: scene.plate
            ? `plate:${scene.plate}`
            : scene.background
              ? `background:${scene.background}`
              : undefined,
          artPrompt: CTHULHUQUARIUM_ART_PROMPTS.scenes[scene.id],
          companions: speakers.map((s) => SPEAKER_SLUG[s]),
        },
      ),
    )
  })

  const species = Object.entries(CTHULHUQUARIUM_SPECIES).map(([slug, s]) => {
    const voices = CTHULHUQUARIUM_VOICES[slug]
    const plate = plateFor(slug)
    return add(
      beat(`species:${slug}`, 'encounter', s.name, {
        place: plate ? `${plate.name} (${plate.note})` : `${s.behavior}`,
        chapter: 3,
        body: voices
          ? [`Charlotte: ${voices.charlotte}`, `Wilbur: ${voices.wilbur}`]
          : [],
        artUrl: `/cthulhuquarium-plates/cthulhuquarium-fish-${slug}.webp`,
        artPrompt: CTHULHUQUARIUM_ART_PROMPTS.species[slug],
      }),
    )
  })

  const backgrounds = CTHULHUQUARIUM_BACKGROUNDS.map((bg) =>
    add(
      beat(`background:${bg.key}`, 'thread', bg.name, {
        place: `Unlock: ${bg.unlock.replace(/_/g, ' ')}`,
        chapter: 4,
        body: [bg.fieldNote],
        art: `background:${bg.key}`,
        artPrompt: CTHULHUQUARIUM_ART_PROMPTS.backgrounds[bg.key],
      }),
    ),
  )

  const shopkeepers = (
    Object.keys(CTHULHUQUARIUM_CHARACTERS) as CanonSpeaker[]
  ).map((speaker) =>
    add(
      beat(
        `character:${SPEAKER_SLUG[speaker]}`,
        'follower',
        CTHULHUQUARIUM_CHARACTERS[speaker].name,
        {
          place: 'Shopkeeper',
          chapter: 5,
          body: [CTHULHUQUARIUM_CHARACTERS[speaker].role],
          art: `name:char-${SPEAKER_SLUG[speaker]}`,
          artPrompt:
            CTHULHUQUARIUM_ART_PROMPTS.characters[SPEAKER_SLUG[speaker]],
          companions: [SPEAKER_SLUG[speaker]],
        },
      ),
    ),
  )

  const story = scenes.filter((key) => nodes[key]?.kind !== 'quest')
  const milestones = scenes.filter((key) => nodes[key]?.kind === 'quest')
  const routes: PlaybookRoute[] = [
    {
      id: 'story',
      name: 'The shop',
      kind: 'story',
      steps: story,
      headings: { 0: 'Arrivals and firsts' },
    },
    {
      id: 'milestones',
      name: 'Milestones',
      kind: 'story',
      steps: milestones,
      headings: { 0: 'The bestiary fills' },
    },
  ]

  return {
    game: 'cthulhuquarium',
    title: 'Cthulhuquarium',
    blurb:
      'A Victorian shop of impossible fish: 151 species with Charlotte and Wilbur on each, the story scenes, the tank backgrounds and the two shopkeepers.',
    routes,
    nodes,
    order: storyOrder(routes, [...species, ...backgrounds, ...shopkeepers]),
    sections: [
      {
        title: 'Bestiary',
        blurb: 'Every species and its plate.',
        keys: species,
      },
      {
        title: 'Backgrounds',
        blurb: 'The tanks behind the glass.',
        keys: backgrounds,
      },
      {
        title: 'Shopkeepers',
        blurb: 'Charlotte and Wilbur.',
        keys: shopkeepers,
      },
    ],
    people: (Object.keys(CTHULHUQUARIUM_CHARACTERS) as CanonSpeaker[]).map(
      (speaker) => ({
        id: SPEAKER_SLUG[speaker],
        label: CTHULHUQUARIUM_CHARACTERS[speaker].name,
      }),
    ),
    peopleLabel: 'Shopkeepers',
    variations: [],
    variationLabel: 'Outcome',
    dayLabel: 'Shelf',
    kindLabels: {
      opening: 'Arrival',
      spine: 'Scene',
      quest: 'Milestone',
      encounter: 'Species',
      thread: 'Background',
      follower: 'Shopkeeper',
    },
    sectionLabels: {
      opening: 'Arrival',
      spine: 'Story scenes',
      quest: 'Milestones',
      encounter: 'Bestiary',
      thread: 'Backgrounds',
      follower: 'Shopkeepers',
    },
    editable: false,
    artProject: 'cthulhuquarium',
    artLanes: ['krea2'],
    artPromptsComplete: true,
    artPipeline:
      'conductor scripts/build_cthulhuquarium_art_queue.py (prompts from the canon bible, queued in projects/art-generate.yaml)',
  }
}
