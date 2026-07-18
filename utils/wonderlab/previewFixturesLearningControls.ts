// /utils/wonderlab/previewFixturesLearningControls.ts
import type { WonderLabPreviewFixture } from './previewFixtures'

const fixtures: Record<string, WonderLabPreviewFixture> = {
  'academy-style-detail': {
    title: 'Academy Style Lesson specimen',
    description:
      'Uses a synthetic image-free lesson and disables close, remix, and viewed-progress mutation.',
    viewport: 'tablet',
    minHeight: '36rem',
    props: {
      lesson: {
        slug: 'wonderlab-luminous-craft',
        name: 'Luminous Craft',
        era: 'Imagined Contemporary',
        region: 'WonderLab',
        keyIdeas:
          'Clear silhouettes, deliberate negative space, readable visual hierarchy, and a visible relationship between form and purpose.',
        recognitionCues: [
          'Strong shapes that remain legible at card size',
          'A restrained background that supports the subject',
          'Small details reserved for meaningful emphasis',
        ],
        artists: [
          {
            name: 'Mira the Mapmaker',
            years: 'Current',
            note: 'Uses hierarchy and spacing to make complex systems approachable.',
          },
          {
            name: 'Dotti Fixturewright',
            years: 'Current',
            note: 'Labels every dependency before inviting visitors inside.',
          },
        ],
        exampleWorks: [],
        remix: {
          mode: 'prompt',
          template:
            'Rebuild the subject with crisp shapes, generous negative space, and one clearly emphasized interaction point.',
        },
        failureMode:
          'Decorative detail competing with the main interaction or reducing readability at small sizes.',
      },
      showClose: false,
      showRemixButton: false,
      allowMarkViewed: false,
    },
  },
  'butterfly-slider': {
    title: 'Butterfly Range Slider specimen',
    description:
      'A local two-handle range control. Input changes emit only to the preview host.',
    viewport: 'tablet',
    minHeight: '12rem',
    props: {
      min: 0,
      max: 100,
      step: 1,
      modelValue: { min: 24, max: 72 },
      label: 'Flutter range',
      sliderId: 'wonderlab-butterfly-range',
      originalMin: 10,
      originalMax: 90,
    },
  },
  'single-slider': {
    title: 'Single Slider specimen',
    description:
      'A local numeric control. Input changes emit only to the preview host.',
    viewport: 'tablet',
    minHeight: '10rem',
    props: {
      min: 0,
      max: 20,
      step: 1,
      modelValue: 8,
      label: 'Butterfly count',
      sliderId: 'wonderlab-butterfly-count',
    },
  },
  'butterfly-toggle': {
    title: 'Butterfly Layout Toggle',
    skipReason:
      'This fixed full-viewport animation measures a real DOM target, runs an animation frame loop, and mutates global display layout state when clicked. It should be exercised from the application shell rather than nested inside a component preview.',
  },
  'choice-manager': {
    title: 'Choice Manager',
    skipReason:
      'Choice Manager resolves and mutates a seeded Choice Store entry by label and model. A useful preview requires a dedicated store fixture with disposable options and selection state, not just a label prop.',
  },
  'fx-region': {
    title: 'Screen FX Region',
    skipReason:
      'FX Region renders the active global animation-store surface for a named page region. Mounting it in WonderLab could duplicate live effects and pointer-blocking layers, so it must be tested within the Screen FX shell.',
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

export function getWonderLabLearningControlFixture(
  componentName: string,
  sourcePath = '',
): WonderLabPreviewFixture | null {
  const sourceKey = normalizeFixtureKey(sourcePath)
  const componentKey = normalizeFixtureKey(componentName)

  return fixtures[sourceKey] ?? fixtures[componentKey] ?? null
}

export function listWonderLabLearningControlFixtureKeys(): string[] {
  return Object.keys(fixtures).sort()
}
