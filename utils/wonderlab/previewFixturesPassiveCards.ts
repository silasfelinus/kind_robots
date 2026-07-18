// /utils/wonderlab/previewFixturesPassiveCards.ts
import type { WonderLabPreviewFixture } from './previewFixtures'

const fixtureDate = new Date('2026-01-01T00:00:00.000Z')

const fixtures: Record<string, WonderLabPreviewFixture> = {
  'stage-message': {
    title: 'Stage Message specimen',
    description:
      'Renders a synthetic speaker transcript entry without artwork resolution, stores, or streaming state.',
    viewport: 'tablet',
    minHeight: '10rem',
    props: {
      entry: {
        id: 'wonderlab-message',
        kind: 'speaker',
        speakerId: 'fixture-guide',
        speakerLabel: 'Fixture Guide',
        speakerArtImageId: null,
        speakerImagePath: null,
        content:
          'A useful preview should reveal a dependency instead of hiding it behind a mysterious blank panel.',
        createdAt: fixtureDate.toISOString(),
      },
    },
  },
  'stage-preset': {
    title: 'Stage Preset specimen',
    description:
      'Uses a selected synthetic stage preset with image-free role badges. Selection emits only to the preview host.',
    viewport: 'mobile',
    minHeight: '16rem',
    props: {
      preset: {
        id: 'museum-tour',
        label: 'Museum Tour',
        tagline: 'A narrator and curator inspect one component at a time.',
        icon: 'kind-icon:stage',
        imagePath: null,
        roles: [
          {
            key: 'narrator',
            label: 'Narrator',
            description: 'Guides the exhibit tour.',
            badgeImagePath: null,
          },
          {
            key: 'curator',
            label: 'Curator',
            description: 'Explains status and context.',
            badgeImagePath: null,
          },
        ],
      },
      isSelected: true,
    },
  },
  'honeydo-card': {
    title: 'Honey-do Card specimen',
    description:
      'Uses a synthetic high-priority task. All controls emit local events; archive, delete, project navigation, and relative time are hidden.',
    viewport: 'tablet',
    minHeight: '10rem',
    props: {
      todo: {
        id: -501,
        createdAt: fixtureDate.toISOString(),
        updatedAt: fixtureDate.toISOString(),
        title: 'Label context-dependent exhibits',
        description:
          'Replace naked mounting failures with a useful explanation of required props, stores, or parent slots.',
        status: 'OPEN',
        priority: 'HIGH',
        category: 'HONEYDO',
        projectId: null,
        userId: 0,
      },
      project: null,
      showRelativeTime: false,
      showCategoryBadge: true,
      showArchiveAction: false,
      showDeleteAction: false,
    },
  },
  'feed-card': {
    title: 'News Feed Card specimen',
    description:
      'Uses a synthetic image-free news item and renders as an article rather than an external link.',
    viewport: 'mobile',
    minHeight: '16rem',
    props: {
      item: {
        id: 'wonderlab-news',
        title: 'WonderLab fixture coverage expands again',
        summary:
          'The component museum now measures required-prop coverage and publishes the remaining backlog on every pull request.',
        url: 'https://example.invalid/wonderlab-preview',
        source: 'Kind Robots Development Desk',
        publishedAt: fixtureDate.toISOString(),
        image: null,
        category: ['Development', 'WonderLab'],
      },
      showImage: false,
      allowNavigation: false,
    },
  },
  'loading-messages': {
    title: 'Application Loading Overlay',
    skipReason:
      'This full-screen boot overlay owns fixed document coverage, timed message rotation, and the global load store reveal sequence. It should be verified through application startup rather than nested inside the museum.',
  },
  'tutorial-flyer': {
    title: 'Channel Tutorial Flyer',
    skipReason:
      'This surface awaits channel-content initialization and coordinates tutorial-store visibility, persistence, keyboard handling, and document body overflow. It needs a dedicated store-aware wrapper before standalone museum rendering is appropriate.',
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

export function getWonderLabPassiveCardFixture(
  componentName: string,
  sourcePath = '',
): WonderLabPreviewFixture | null {
  const sourceKey = normalizeFixtureKey(sourcePath)
  const componentKey = normalizeFixtureKey(componentName)

  return fixtures[sourceKey] ?? fixtures[componentKey] ?? null
}

export function listWonderLabPassiveCardFixtureKeys(): string[] {
  return Object.keys(fixtures).sort()
}
