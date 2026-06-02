// /stores/helpers/artCards.ts
//
// Card definitions for the Art Builder.
// Drives image generation: subject -> figures -> style -> punk mix ->
// background -> mood -> resources (LoRA / checkpoint / server) -> generate.
//
// Conforms strictly to builderCards.ts. Every step.inputType is a real
// BuilderInputType. Prompt scaffolding and resource hints ride in
// choice.payload / step.payload so the art LLM and resource system can
// read them without a parallel type.

import type {
  BuilderCard,
  BuilderChoice,
  BuilderSplash,
  BuilderSheet,
  BuilderStep,
} from '@/stores/helpers/builderCards'
import {
  styleList,
  themeList,
  colorList,
  prettifierList,
  negativeList,
} from '@/stores/seeds/artList'

export type ArtStep = BuilderStep
export type ArtCard = BuilderCard
export type ArtChoice = BuilderChoice

// Turn a seed string[] into BuilderChoice[]. The first `featured` entries
// become full preset choices; the remainder fold into a single "More..."
// entry via opensList so the deck stays scannable while keeping the whole
// vocabulary reachable. Each choice carries its value as a promptHint so the
// art LLM and prompt assembler get the literal term.
function choicesFromList(
  list: string[],
  options: { featured?: number; deck?: string; folder?: string } = {},
): BuilderChoice[] {
  const { featured = 10, deck, folder } = options
  const slug = (value: string) =>
    value
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

  const head = list.slice(0, featured)
  const tail = list.slice(featured)

  const choices: BuilderChoice[] = head.map((value) => ({
    value,
    label: value,
    payload: { promptHint: value },
    ...(deck && folder
      ? { image: `/images/${deck}/${folder}/${slug(value)}.webp` }
      : {}),
  }))

  if (tail.length) {
    choices.push({
      value: '',
      label: 'More options...',
      subtext: `${tail.length} more in the full list.`,
      opensList: true,
      listOptions: tail,
    })
  }

  choices.push({
    value: '',
    label: 'Write my own',
    subtext: 'Any term that fits — the model will interpret it.',
    opensCustom: true,
  })

  return choices
}

// ── Extended lists (shown after gallery via opensList) ─────────────────────

const EXTENDED_PUNK: string[] = [
  'Cyberpunk',
  'Steampunk',
  'Solarpunk',
  'Dieselpunk',
  'Atompunk',
  'Clockpunk',
  'Biopunk',
  'Mythpunk',
  'Cottagepunk',
  'Carnivalpunk',
  'Barbiepunk',
  'Hellpunk',
  'Glitterpunk',
  'Fungalpunk',
  'Oceanpunk',
  'Desertpunk',
  'Snowpunk',
  'Junkpunk',
  'Cathedralpunk',
  'Neonpunk',
  'Pastelpunk',
  'Witchpunk',
  'Bonepunk',
  'Teapunk',
  'Vaporpunk',
  'Nanopunk',
  'Rococopunk',
  'Stonepunk',
]

// ── Sheet ──────────────────────────────────────────────────────────────────

export type ArtBuilderSheet = BuilderSheet & {
  subject: string
  figureCount: string
  figureSpecies: string
  style: string
  punk: string
  theme: string
  background: string
  palette: string[]
  objects: string
  emotion: string
  prettifiers: string[]
  loras: string[]
  checkpoint: string
  artServer: string
  artPrompt: string
  negativePrompt: string
  negativeFilters: string[]
  imagePath: string | null
  artImageId: number | null
  userId: number
  isPublic: boolean
  isMature: boolean
}

export function defaultArtSheet(userId = 10): ArtBuilderSheet {
  return {
    subject: '',
    figureCount: '',
    figureSpecies: '',
    style: '',
    punk: '',
    theme: '',
    background: '',
    palette: [],
    objects: '',
    emotion: '',
    prettifiers: [],
    loras: [],
    checkpoint: '',
    artServer: '',
    artPrompt: '',
    negativePrompt: '',
    negativeFilters: [],
    imagePath: null,
    artImageId: null,
    userId,
    isPublic: true,
    isMature: false,
  }
}

export const ART_SPLASH: BuilderSplash = {
  title: 'Art Builder',
  subtitle: 'Prompt assembly for entities, scenes, and beautiful accidents.',
  tagline: 'Pick the parts. Stack the punk. Make the server earn its keep.',
  description:
    'Build an image one card at a time: subject, figures, style, the punk mix, background, mood, and the resources — LoRAs, checkpoint, and art server — that bring it to life.',
  imagePath: '/images/art/splash.webp',
  ctaLabel: 'Start the Canvas',
  secondaryLabel: 'Surprise Me',
}

// ── Cards ──────────────────────────────────────────────────────────────────

export const ART_CARDS: ArtCard[] = [
  // ── Subject ───────────────────────────────────────────────────────────────
  {
    key: 'subject',
    label: 'Subject',
    title: 'What are we looking at',
    icon: 'kind-icon:palette',
    flourish: '◐',
    deckImage: '/images/art/subject.webp',
    heroImage: '/images/art/subject.webp',
    tagline: 'Every image is about something. Even the abstract ones.',
    narrative:
      'Before anything else, the canvas needs a center of gravity. A person, a crowd, a place, a thing, an avatar pulled from somewhere on the site. Choose what the image is fundamentally about. Everything after this — style, light, mood — orbits this decision.',
    required: true,
    restoresFields: ['subject'],
    steps: [
      {
        key: 'subject',
        title: 'Subject Type',
        narrative:
          'What is the image fundamentally about? Pick the type of thing at its center, then refine it in the steps that follow.',
        inputType: 'preset',
        field: 'subject',
        choices: [
          {
            value: 'person',
            label: 'Person',
            subtext: 'A single figure. The portrait, the hero shot, the study.',
            image: '/images/art/subject/person.webp',
            payload: { promptHint: 'a single figure, centered subject' },
          },
          {
            value: 'group',
            label: 'Group',
            subtext: 'Two or more figures. Dynamics, scale, crowd, ensemble.',
            image: '/images/art/subject/group.webp',
            payload: { promptHint: 'a group of figures, ensemble composition' },
          },
          {
            value: 'landscape',
            label: 'Landscape',
            subtext: 'The place is the point. Vista, terrain, weather, scale.',
            image: '/images/art/subject/landscape.webp',
            payload: {
              promptHint: 'a wide landscape, environment as subject',
            },
          },
          {
            value: 'object',
            label: 'Object',
            subtext: 'A thing, isolated and considered. Still life energy.',
            image: '/images/art/subject/object.webp',
            payload: { promptHint: 'a single object, still life, isolated' },
          },
          {
            value: 'avatar',
            label: 'Avatar',
            subtext: 'A profile-ready icon. Centered, readable at small sizes.',
            image: '/images/art/subject/avatar.webp',
            payload: {
              promptHint: 'avatar portrait, centered, readable at small size',
            },
          },
          {
            value: 'creature',
            label: 'Creature',
            subtext: 'A beast, a monster, a thing with intent and teeth.',
            image: '/images/art/subject/creature.webp',
            payload: { promptHint: 'a creature, full body, characterful' },
          },
          {
            value: 'scene',
            label: 'Scene',
            subtext: 'A moment in motion. Figures and place doing something.',
            image: '/images/art/subject/scene.webp',
            payload: {
              promptHint: 'a scene in progress, figures within environment',
            },
          },
          {
            value: 'abstract',
            label: 'Abstract',
            subtext: 'Shape, color, and feeling without a literal anchor.',
            image: '/images/art/subject/abstract.webp',
            payload: {
              promptHint: 'abstract composition, non-representational',
            },
          },
          {
            value: '',
            label: 'Pull from the site',
            subtext: 'Use a character, dream, scenario, or gallery image.',
            opensCustom: true,
            payload: { source: 'site-model' },
          },
          {
            value: '',
            label: 'Write my own',
            subtext: 'Any subject, concept, or visual premise that fits.',
            opensCustom: true,
          },
        ],
      },
    ],
  },

  // ── Figures ───────────────────────────────────────────────────────────────
  {
    key: 'figures',
    label: 'Figures',
    title: 'Who is in frame',
    icon: 'kind-icon:person',
    flourish: '☍',
    deckImage: '/images/art/figures.webp',
    heroImage: '/images/art/figures.webp',
    tagline: 'How many, and what kind of body they have.',
    narrative:
      'If there are figures in the image, the count and the species change everything — composition, scale, the negative space, the way the eye travels. One figure is a portrait. Five is a story. A figure that is not human is a different problem and a more interesting one.',
    required: false,
    unlockCondition: 'always',
    restoresFields: ['figureCount', 'figureSpecies'],
    steps: [
      {
        key: 'figureCount',
        title: 'How Many',
        narrative:
          'How many figures share the frame? This sets the composition before the first brushstroke.',
        inputType: 'preset',
        field: 'figureCount',
        choices: [
          {
            value: 'none',
            label: 'None',
            subtext: 'No figures. The subject carries itself.',
            payload: { promptHint: 'no figures, no people' },
          },
          {
            value: 'solo',
            label: 'Solo',
            subtext: 'One. The undivided attention of the canvas.',
            payload: { promptHint: 'solo, single figure' },
          },
          {
            value: 'duo',
            label: 'Duo',
            subtext: 'Two. A relationship, a tension, a conversation.',
            payload: { promptHint: 'two figures, duo, paired composition' },
          },
          {
            value: 'small-group',
            label: 'Small Group',
            subtext: 'Three to five. An ensemble with room to breathe.',
            payload: { promptHint: 'small group of three to five figures' },
          },
          {
            value: 'crowd',
            label: 'Crowd',
            subtext: 'Many. Scale, density, the individual lost in the mass.',
            payload: { promptHint: 'a crowd, many figures, dense composition' },
          },
        ],
      },
      {
        key: 'figureSpecies',
        title: 'Species',
        narrative:
          'What kind of bodies are these? Human is one option among many. The species shifts anatomy, silhouette, and the entire vocabulary of the pose.',
        inputType: 'text',
        field: 'figureSpecies',
        generatorKey: 'species',
        placeholder: 'human, elf, robot, fox-person, sentient weather...',
        inputLabel: 'Species',
      },
    ],
  },

  // ── Style ─────────────────────────────────────────────────────────────────
  {
    key: 'style',
    label: 'Style',
    title: 'The visual language',
    icon: 'kind-icon:paintbrush',
    flourish: '✦',
    deckImage: '/images/art/style.webp',
    heroImage: '/images/art/style.webp',
    tagline: 'The same subject in two styles is two different images.',
    narrative:
      'Style is the accent the image speaks in. Oil paint and pixel art can render the identical subject and produce two unrelated emotional experiences. Pick the rendering language. This pairs with the punk mix on the next card to produce something specific.',
    required: true,
    restoresFields: ['style'],
    steps: [
      {
        key: 'style',
        title: 'Render Style',
        narrative:
          'How is this image rendered? Choose the medium and visual tradition — these come from the same curated list the randomizer uses. Expand for the full set, or name your own.',
        inputType: 'preset',
        field: 'style',
        choices: choicesFromList(styleList, {
          featured: 12,
          deck: 'art',
          folder: 'style',
        }),
      },
    ],
  },

  // ── Punk Mix ──────────────────────────────────────────────────────────────
  {
    key: 'punk',
    label: 'Punk Mix',
    title: 'The special sauce',
    icon: 'kind-icon:sparkles',
    flourish: '⚡',
    deckImage: '/images/art/punk.webp',
    heroImage: '/images/art/punk.webp',
    tagline: 'Bolt a whole aesthetic onto the thing. Watch it transform.',
    narrative:
      'The punk mix is an entire world bolted onto your subject. Carnivalpunk drapes it in faded big-top glory. Barbiepunk floods it in plastic pink maximalism. Each mix can pull in special resources — LoRAs and prompt fragments — that push the model hard in one direction. Optional, but this is where images get a personality.',
    required: false,
    unlockCondition: 'always',
    restoresFields: ['punk'],
    steps: [
      {
        key: 'punk',
        title: 'Choose a Punk',
        narrative:
          'Bolt an aesthetic world onto the subject. Each mix may add LoRAs and prompt fragments automatically. Pick one, expand the list, or skip it entirely.',
        inputType: 'preset',
        field: 'punk',
        choices: [
          {
            value: 'Cyberpunk',
            label: 'Cyberpunk',
            subtext: 'Neon rain, chrome, corporate decay, bad Wi-Fi rebellion.',
            image: '/images/art/punk/cyberpunk.webp',
            payload: {
              loras: ['cyberpunk-style'],
              promptHint:
                'cyberpunk, neon lights, rain-slicked streets, chrome and grime, high contrast',
            },
          },
          {
            value: 'Steampunk',
            label: 'Steampunk',
            subtext: 'Brass, steam, gears, goggles, very fancy hats.',
            image: '/images/art/punk/steampunk.webp',
            payload: {
              loras: ['steampunk-style'],
              promptHint:
                'steampunk, brass gears, steam pipes, victorian machinery, sepia tones',
            },
          },
          {
            value: 'Carnivalpunk',
            label: 'Carnivalpunk',
            subtext:
              'Faded big-top glory. Tarnished gilt. Joy with rust on it.',
            image: '/images/art/punk/carnivalpunk.webp',
            payload: {
              loras: ['carnival-style', 'vintage-circus'],
              promptHint:
                'carnivalpunk, faded circus tent, tarnished gilt, string lights, peeling paint, melancholy spectacle',
            },
          },
          {
            value: 'Barbiepunk',
            label: 'Barbiepunk',
            subtext: 'Plastic maximalism. Hot pink everything. Glossy excess.',
            image: '/images/art/punk/barbiepunk.webp',
            payload: {
              loras: ['barbie-style', 'plastic-glossy'],
              promptHint:
                'barbiepunk, hot pink, glossy plastic, maximalist, pastel saturation, doll aesthetic',
            },
          },
          {
            value: 'Solarpunk',
            label: 'Solarpunk',
            subtext:
              'Green cities, repaired futures, optimism with blueprints.',
            image: '/images/art/punk/solarpunk.webp',
            payload: {
              loras: ['solarpunk-style'],
              promptHint:
                'solarpunk, lush greenery, solar panels, warm sunlight, hopeful architecture',
            },
          },
          {
            value: 'Dieselpunk',
            label: 'Dieselpunk',
            subtext:
              'Interwar muscle. Riveted steel, propaganda, engine grime.',
            image: '/images/art/punk/dieselpunk.webp',
            payload: {
              loras: ['dieselpunk-style'],
              promptHint:
                'dieselpunk, riveted steel, art deco machinery, interwar industrial, muted palette',
            },
          },
          {
            value: 'Fungalpunk',
            label: 'Fungalpunk',
            subtext: 'Mushroom architecture, spore light, gentle decay.',
            image: '/images/art/punk/fungalpunk.webp',
            payload: {
              loras: ['fungal-style', 'mycelium'],
              promptHint:
                'fungalpunk, mushroom structures, bioluminescent spores, mycelium networks, damp organic',
            },
          },
          {
            value: 'Witchpunk',
            label: 'Witchpunk',
            subtext: 'Candlelight, herbs in jars, sigils, soft menace.',
            image: '/images/art/punk/witchpunk.webp',
            payload: {
              loras: ['witch-style', 'occult-aesthetic'],
              promptHint:
                'witchpunk, candlelight, dried herbs, arcane sigils, moody occult atmosphere',
            },
          },
          {
            value: '',
            label: 'More punks...',
            subtext: 'Atompunk, cottagepunk, oceanpunk, and twenty more.',
            opensList: true,
            listOptions: EXTENDED_PUNK,
          },
          {
            value: '',
            label: 'Write my own',
            subtext: 'Coin a new -punk. The model will try its best.',
            opensCustom: true,
          },
        ],
      },
    ],
  },

  // ── Setting ───────────────────────────────────────────────────────────────
  {
    key: 'setting',
    label: 'Setting',
    title: 'Theme and surroundings',
    icon: 'kind-icon:map',
    flourish: '❖',
    deckImage: '/images/art/setting.webp',
    heroImage: '/images/art/setting.webp',
    tagline: 'Where this happens, and what is lying around.',
    narrative:
      'The subject does not float in a void unless you want it to. The theme sets the overarching idea, the background fills the space behind, and the objects are the props that tell the story without saying a word. Build the world the subject lives in.',
    required: false,
    unlockCondition: 'always',
    restoresFields: ['theme', 'background', 'palette', 'objects'],
    steps: [
      {
        key: 'theme',
        title: 'Theme',
        narrative:
          'The overarching idea or mood-concept tying the image together. Pulled from the curated theme list — pick one, expand for more, or write your own.',
        inputType: 'preset',
        field: 'theme',
        choices: choicesFromList(themeList, { featured: 12 }),
      },
      {
        key: 'palette',
        title: 'Color Palette',
        narrative:
          'The color story. Pick one or more palettes — they stack into the prompt and steer the whole emotional temperature of the render. Same curated list the randomizer draws from.',
        inputType: 'preset',
        field: 'palette',
        multiSelect: true,
        choices: choicesFromList(colorList, { featured: 12 }),
      },
      {
        key: 'background',
        title: 'Background',
        narrative:
          'What fills the space behind the subject? A place, a color field, a blur, a whole second story happening out of focus.',
        inputType: 'text',
        field: 'background',
        generatorKey: 'background',
        placeholder: 'foggy harbor, blank studio, neon alley, deep forest...',
        inputLabel: 'Background',
      },
      {
        key: 'objects',
        title: 'Objects',
        narrative:
          'The props in frame. The things that imply a life, a history, a reason the subject is here. Optional, but objects do a lot of quiet narrative work.',
        inputType: 'text',
        field: 'objects',
        generatorKey: 'objects',
        placeholder:
          'a chipped teacup, a sword, scattered papers, a lantern...',
        inputLabel: 'Objects',
      },
    ],
  },

  // ── Mood ──────────────────────────────────────────────────────────────────
  {
    key: 'mood',
    label: 'Mood',
    title: 'How it should feel',
    icon: 'kind-icon:heart',
    flourish: '☾',
    deckImage: '/images/art/mood.webp',
    heroImage: '/images/art/mood.webp',
    tagline: 'The emotion the viewer catches before they understand the image.',
    narrative:
      'Before the eye parses the content, it catches the feeling. Mood is set by light, color, and posture, and it decides whether the same scene reads as safe or threatening, tender or cold. Choose the emotional temperature of the piece.',
    required: false,
    unlockCondition: 'always',
    restoresFields: ['emotion'],
    steps: [
      {
        key: 'emotion',
        title: 'Emotional Tone',
        narrative:
          'What should the viewer feel in the first half-second? Pick the dominant emotional register — or name your own.',
        inputType: 'preset',
        field: 'emotion',
        choices: [
          {
            value: 'serene',
            label: 'Serene',
            subtext: 'Calm, balanced, unhurried. The breath out.',
            payload: { promptHint: 'serene, calm, soft light, peaceful mood' },
          },
          {
            value: 'joyful',
            label: 'Joyful',
            subtext: 'Bright, warm, alive. Color turned up.',
            payload: { promptHint: 'joyful, bright, vibrant, warm and lively' },
          },
          {
            value: 'melancholy',
            label: 'Melancholy',
            subtext: 'Wistful, muted, beautiful in a sad way.',
            payload: {
              promptHint: 'melancholy, muted palette, wistful, soft shadows',
            },
          },
          {
            value: 'ominous',
            label: 'Ominous',
            subtext: 'Something is wrong. The light knows it first.',
            payload: {
              promptHint: 'ominous, dark, high contrast, foreboding atmosphere',
            },
          },
          {
            value: 'epic',
            label: 'Epic',
            subtext: 'Vast, dramatic, scaled up past human size.',
            payload: {
              promptHint: 'epic, dramatic scale, sweeping, grandiose lighting',
            },
          },
          {
            value: 'whimsical',
            label: 'Whimsical',
            subtext: 'Playful, odd, lightly impossible.',
            payload: {
              promptHint: 'whimsical, playful, quirky, soft surreal touch',
            },
          },
          {
            value: 'tense',
            label: 'Tense',
            subtext: 'Held breath. The moment before the moment.',
            payload: {
              promptHint:
                'tense, suspenseful, sharp shadows, charged stillness',
            },
          },
          {
            value: 'dreamy',
            label: 'Dreamy',
            subtext: 'Soft focus, glow, the logic of half-sleep.',
            payload: {
              promptHint: 'dreamy, ethereal, soft glow, hazy and surreal',
            },
          },
          {
            value: '',
            label: 'Write my own',
            subtext: 'Any emotional register that fits.',
            opensCustom: true,
          },
        ],
      },
    ],
  },

  // ── Resources ─────────────────────────────────────────────────────────────
  {
    key: 'resources',
    label: 'Resources',
    title: 'LoRAs, checkpoint, and engine',
    icon: 'kind-icon:blueprint',
    flourish: '⚙',
    deckImage: '/images/art/resources.webp',
    heroImage: '/images/art/resources.webp',
    tagline: 'The machinery under the hood. Pick what runs the render.',
    narrative:
      'The technical layer. LoRAs are the fine-tuned modifiers that push the model toward a specific look — stack as many as you like, though more is not always better. The checkpoint is the base model itself. The art server is the engine doing the actual work. The punk mix may have already added LoRAs for you; this is where you review and refine them.',
    required: false,
    unlockCondition: 'coreComplete',
    restoresFields: ['loras', 'checkpoint', 'artServer'],
    steps: [
      {
        key: 'loras',
        title: 'LoRAs',
        narrative:
          'Select the fine-tuned modifiers to apply. These nudge the model toward specific looks, characters, or styles. The punk mix may have pre-loaded some — adjust freely.',
        inputType: 'collection-picker',
        field: 'loras',
        multiSelect: true,
        payload: {
          resource: 'lora',
          source: 'lora-resource-system',
        },
      },
      {
        key: 'checkpoint',
        title: 'Checkpoint',
        narrative:
          'The base model that everything is built on. Different checkpoints have radically different default aesthetics and strengths.',
        inputType: 'relation-picker',
        field: 'checkpoint',
        payload: {
          resource: 'checkpoint',
          source: 'art-server-checkpoints',
        },
      },
      {
        key: 'artServer',
        title: 'Art Server',
        narrative:
          'The engine that does the actual generating — SD WebUI Forge, ComfyUI, or whichever backend is online. This is the muscle behind the magic.',
        inputType: 'relation-picker',
        field: 'artServer',
        payload: {
          resource: 'art-server',
          source: 'server-store-art',
        },
      },
    ],
  },

  // ── Generate ──────────────────────────────────────────────────────────────
  {
    key: 'generate',
    label: 'Generate',
    title: 'Make it real',
    icon: 'kind-icon:sparkles',
    flourish: '▣',
    deckImage: '/images/art/generate.webp',
    heroImage: '/images/art/generate.webp',
    tagline: 'Assemble the prompt. Send it. See what comes back.',
    narrative:
      'Everything assembled so far folds into a single prompt. Review it, let the language model sharpen it, adjust the negative prompt to keep out what you do not want, and send it to the server. The first result is rarely the last. That is the fun part.',
    required: false,
    unlockCondition: 'allComplete',
    restoresFields: [
      'prettifiers',
      'negativeFilters',
      'artPrompt',
      'negativePrompt',
      'imagePath',
      'artImageId',
    ],
    steps: [
      {
        key: 'prettifiers',
        title: 'Enhancements',
        narrative:
          'Optional quality boosters that get appended to the positive prompt — the same "make pretty" terms the randomizer uses. Stack a few, or let the model pick on Suggest.',
        inputType: 'preset',
        field: 'prettifiers',
        multiSelect: true,
        choices: choicesFromList(prettifierList, { featured: 12 }),
      },
      {
        key: 'negativeFilters',
        title: 'Negative Filters',
        narrative:
          'What to keep out. These feed the negative prompt — anatomy problems, artifacts, watermarks, whatever you do not want the model reaching for. Curated from the shared negative list.',
        inputType: 'preset',
        field: 'negativeFilters',
        multiSelect: true,
        choices: choicesFromList(negativeList, { featured: 12 }),
      },
      {
        key: 'art',
        title: 'Assemble and Generate',
        narrative:
          'The sheet folds into a prompt. The language model has opinions on phrasing and will share them. Tune the negative prompt, then send it to the active server and bring the image into existence.',
        inputType: 'art',
        needsLLM: true,
        payload: {
          assembleFrom: [
            'subject',
            'figureCount',
            'figureSpecies',
            'style',
            'punk',
            'theme',
            'palette',
            'background',
            'objects',
            'emotion',
            'prettifiers',
          ],
          negativeFrom: ['negativeFilters'],
          resourceFrom: ['loras', 'checkpoint', 'artServer'],
        },
      },
    ],
  },
]
