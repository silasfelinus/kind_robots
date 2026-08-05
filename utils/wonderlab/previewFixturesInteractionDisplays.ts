// /utils/wonderlab/previewFixturesInteractionDisplays.ts
import type { WonderLabPreviewFixture } from './previewFixtures'

const fixtureButterfly = {
  id: 'Prismatic Librarian',
  name: 'Prismatic Librarian',
  x: 45,
  y: 35,
  z: 1.1,
  zIndex: 4,
  baseZIndex: 4,
  rotation: 12,
  heading: 0,
  wingTopColor: 'hsl(280, 75%, 62%)',
  wingBottomColor: 'hsl(190, 80%, 55%)',
  speed: 1.2,
  wingSpeed: 0.8,
  rarity: 17,
  status: 'float',
  scale: 1,
  scaleMod: 1,
  message: 'Every component deserves a readable field guide.',
  noiseOffsetX: 0,
  noiseOffsetY: 0,
  designer: 'WonderLab',
  goal: { x: 60, y: 40 },
}

const fixtures: Record<string, WonderLabPreviewFixture> = {
  'stage-slot': {
    title: 'Filled Stage Slot specimen',
    description:
      'Uses a temporary synthetic performer so the slot renders without Character, Bot, Art, or image-resolution dependencies.',
    viewport: 'mobile',
    minHeight: '10rem',
    props: {
      slot: {
        slotId: 'wonderlab-curator',
        roleKey: 'curator',
        participantType: 'temporary-bot',
        participantId: null,
        temporary: {
          name: 'Fixture Curator',
          species: 'Helpful construct',
          imagePath: null,
          artImageId: null,
          personality:
            'Patient, precise, and unwilling to hide missing context.',
        },
      },
      characters: [],
      bots: [],
      performers: [],
      removable: false,
    },
  },
  'butterfly-component': {
    title: 'Butterfly specimen',
    description:
      'Renders one synthetic butterfly. It reads only the store’s display-name preference and does not mutate swarm state.',
    viewport: 'tablet',
    minHeight: '14rem',
    props: {
      butterfly: fixtureButterfly,
    },
  },
  'facet-picker': {
    title: 'Facet Picker',
    skipReason:
      'Facet Picker fetches the global Facet catalog on mount, may fetch persisted owner assignments, and can create or attach database records. A truthful preview needs a disposable Facet Store wrapper or explicit facet-data override.',
  },
  'reaction-card': {
    title: 'Reaction Editor',
    skipReason:
      'Reaction Card is an authenticated write surface that can create Reaction rows and copy share text. WonderLab already hosts the real editor beside each selected exhibit, so recursively mounting another writer would be misleading.',
  },
  'butterfly-modal': {
    title: 'Butterfly Capture Modal',
    skipReason:
      'Butterfly Modal teleports two full-screen overlays to document.body and also observes the global discovery butterfly. It should be tested through the capture/discovery flow or a dedicated teleport fixture, not nested in the museum viewport.',
  },
}

function normalizeFixtureKey(value: string): string {
  return value
    .trim()
    .replace(/\\/g, '/')
    .replace(/^.*\//, '')
    .replace(/\.vue$/i, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

export function getWonderLabInteractionDisplayFixture(
  componentName: string,
  sourcePath = '',
): WonderLabPreviewFixture | null {
  const sourceKey = normalizeFixtureKey(sourcePath)
  const componentKey = normalizeFixtureKey(componentName)

  return fixtures[sourceKey] ?? fixtures[componentKey] ?? null
}

export function listWonderLabInteractionDisplayFixtureKeys(): string[] {
  return Object.keys(fixtures).sort()
}
