// /utils/wonderlab/previewFixturesBuilderRuler.ts
import type { WonderLabPreviewFixture } from './previewFixtures'

const fixtures: Record<string, WonderLabPreviewFixture> = {
  'builder-card': {
    title: 'Builder Card specimen',
    description:
      'Uses a synthetic builder deck card with store selection disabled and no image asset.',
    viewport: 'tablet',
    minHeight: '18rem',
    props: {
      card: {
        key: 'wonderlab-fixture',
        label: 'Fixture Lab',
        title: 'Design a Safe Component Preview',
        tagline: 'Make context visible before making it interactive.',
        narrative:
          'Identify required props, provide synthetic values, and disable any action that could touch real application state.',
        icon: 'kind-icon:cards',
        deckImage: null,
        steps: [
          { key: 'inspect', label: 'Inspect dependencies' },
          { key: 'fixture', label: 'Build synthetic props' },
          { key: 'verify', label: 'Add a safety contract' },
        ],
      },
      allowSelect: false,
    },
  },
  'ruler-hooked-card': {
    title: 'Ruler Hooked Event Card specimen',
    description:
      'Uses a synthetic kingdom event. Choice buttons emit only to the preview host and do not apply game effects.',
    viewport: 'tablet',
    minHeight: '18rem',
    props: {
      card: {
        id: 'museum-fishing-decree',
        deck: 'wonderlab',
        kind: 'arc-step',
        characters: ['the-ruler', 'lake-warden'],
        title: 'The Lake Demands Better Labels',
        body:
          'A silver fish surfaces beside the royal dock carrying a tiny placard: “Context required.”',
        choices: [
          {
            id: 'label-it',
            text: 'Label the dependency before continuing',
            result: 'The court understands what the exhibit needs.',
          },
          {
            id: 'defer-it',
            text: 'Return it to the backlog with a clear reason',
            requeue: true,
          },
        ],
      },
    },
  },
  'ruler-hooked-health': {
    title: 'Ruler Hooked Kingdom Health specimen',
    description:
      'Renders a static synthetic kingdom-health snapshot with no store or game-engine dependency.',
    viewport: 'tablet',
    minHeight: '12rem',
    props: {
      health: {
        nature: 72,
        prosperity: 58,
        treasury: 41,
        joy: 83,
        order: 66,
      },
    },
  },
  'ruler-hooked-stage': {
    title: 'Ruler Hooked Stage specimen',
    description:
      'Renders the compositor’s color-band fallback with image asset probing disabled.',
    viewport: 'desktop',
    minHeight: '28rem',
    props: {
      regions: {
        regions: {
          sky: { z: 0, states: ['open'], times: ['day'] },
          far_shore: { z: 10, states: ['pristine', 'farmed'] },
          treeline: { z: 20, states: ['wild', 'tended'] },
          village_edge: { z: 30, states: ['hamlet', 'township'] },
          castle_grounds: { z: 40, states: ['humble', 'flourishing'] },
          lake: { z: 50, states: ['clear', 'fishing'] },
        },
      },
      scene: {
        regionStates: {
          sky: 'open',
          far_shore: 'pristine',
          treeline: 'wild',
          village_edge: 'hamlet',
          castle_grounds: 'flourishing',
          lake: 'clear',
        },
        time: 'day',
        fx: [],
      },
      showImages: false,
    },
  },
  'dream-inspire-button': {
    title: 'Dream Inspiration Generator',
    skipReason:
      'This control loads pending prompt records on mount, resolves the user’s preferred art server, and can POST generation jobs. It belongs in an authenticated Dream workflow with disposable prompt fixtures, not a passive museum preview.',
  },
  'project-gallery-strip': {
    title: 'Conductor Project Gallery Strip',
    skipReason:
      'This project-scoped strip fetches all Art Collections with images and resolves one by live collection label. A useful preview needs an explicit image-array override or a seeded collection-store wrapper before it can remain network-free.',
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

export function getWonderLabBuilderRulerFixture(
  componentName: string,
  sourcePath = '',
): WonderLabPreviewFixture | null {
  const sourceKey = normalizeFixtureKey(sourcePath)
  const componentKey = normalizeFixtureKey(componentName)

  return fixtures[sourceKey] ?? fixtures[componentKey] ?? null
}

export function listWonderLabBuilderRulerFixtureKeys(): string[] {
  return Object.keys(fixtures).sort()
}
