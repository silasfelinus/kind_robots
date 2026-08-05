// /utils/wonderlab/previewFixturesAchievementNavigation.ts
import type { WonderLabPreviewFixture } from './previewFixtures'

const fixtureDate = new Date('2026-01-01T00:00:00.000Z')

const fixtures: Record<string, WonderLabPreviewFixture> = {
  'earned-achievement-card': {
    title: 'Earned Achievement specimen',
    description:
      'Uses a synthetic earned achievement with no image or page link, so the card remains fully local to the preview.',
    viewport: 'mobile',
    minHeight: '24rem',
    props: {
      achievement: {
        id: -401,
        createdAt: fixtureDate,
        updatedAt: fixtureDate,
        label: 'Curious Curator',
        subtleHint: 'Inspect a component before changing it.',
        tooltip: 'Awarded for reading the placard and the source path.',
        karma: 25,
        icon: 'kind-icon:sparkles',
        imagePath: null,
        pageHint: null,
        isActive: true,
      },
      acquiredAt: '2026-01-01T00:00:00.000Z',
    },
  },
  'unearned-achievement-card': {
    title: 'Unearned Achievement specimen',
    description:
      'Uses a synthetic locked achievement; its hint toggle changes only local component state.',
    viewport: 'mobile',
    minHeight: '18rem',
    props: {
      achievement: {
        id: -402,
        createdAt: fixtureDate,
        updatedAt: fixtureDate,
        label: 'Fixture Finisher',
        subtleHint: 'Give every required prop a safe home.',
        tooltip: 'Complete another measured WonderLab fixture batch.',
        karma: 50,
        icon: 'kind-icon:question',
        imagePath: null,
        pageHint: null,
        isActive: true,
      },
    },
  },
  'leaderboard-table': {
    title: 'Leaderboard Table specimen',
    description:
      'Renders a static synthetic ranking with no store, API, or user-session dependency.',
    viewport: 'tablet',
    minHeight: '14rem',
    props: {
      rows: [
        { id: -1, username: 'Mira', matchRecord: 18 },
        { id: -2, username: 'Dotti', matchRecord: 15 },
        { id: -3, username: 'Catbot', matchRecord: 9 },
      ],
      scoreLabel: 'Matches',
      scoreKey: 'matchRecord',
    },
  },
  'channel-tab-list': {
    title: 'Channel route groups',
    description:
      'Shows ordinary Play routes in the first column and clearly labeled admin-only routes in the second.',
    viewport: 'desktop',
    minHeight: '26rem',
    props: {
      channel: {
        key: 'play',
        channelKey: 'play',
        dashboardKey: 'dream',
        label: 'Play',
        title: 'Play',
        room: 'Creative Worlds',
        subtitle: 'Explore, remix, and play',
        description: 'A synthetic mixed-access channel for responsive navigation.',
        summary: 'Creative routes and their administrative counterparts.',
        narrative: '',
        tooltip: '',
        icon: 'kind-icon:dice',
        image: '',
        route: '/play',
        defaultTab: 'dreams',
        sort: 0,
        requiredRole: '',
        requiredPermission: '',
        loadingMessage: 'Loading Play…',
        refreshLabel: 'Refresh Play',
        dottiTip: '',
        amiTip: '',
        tutorial: null,
        tabs: [
          {
            key: 'dreams',
            channelKey: 'play',
            tabKey: 'dreams',
            label: 'Dreams',
            title: 'Dreams',
            subtitle: 'Explore worlds',
            description: 'Browse and create collaborative worlds.',
            summary: 'Explore worlds, characters, and stories.',
            icon: 'kind-icon:moon',
            image: '',
            route: '/dreams',
            sort: 10,
            requiredRole: '',
            requiredPermission: '',
          },
          {
            key: 'art',
            channelKey: 'play',
            tabKey: 'art',
            label: 'Art',
            title: 'Art Studio',
            subtitle: 'Make something visual',
            description: 'Generate, browse, collect, and remix images.',
            summary: 'Create and explore art.',
            icon: 'kind-icon:image',
            image: '',
            route: '/art',
            sort: 20,
            requiredRole: '',
            requiredPermission: '',
          },
          {
            key: 'art-curation',
            channelKey: 'play',
            tabKey: 'art-curation',
            label: 'Art Curation',
            title: 'Art Curation',
            subtitle: 'Review generated work',
            description: 'Curate and manage generated artwork.',
            summary: 'Review artwork that needs administrative attention.',
            icon: 'kind-icon:palette',
            image: '',
            route: '/admin/art-curation',
            sort: 90,
            requiredRole: 'ADMIN',
            requiredPermission: '',
          },
          {
            key: 'resource-admin',
            channelKey: 'play',
            tabKey: 'resource-admin',
            label: 'Resource Admin',
            title: 'Resource Administration',
            subtitle: 'Manage generation resources',
            description: 'Inspect and manage checkpoints and LoRAs.',
            summary: 'Administrative controls for generation resources.',
            icon: 'kind-icon:database',
            image: '',
            route: '/admin/resources',
            sort: 100,
            requiredRole: 'ADMIN',
            requiredPermission: '',
          },
        ],
      },
      activeChannelKey: 'play',
      activeTabKey: 'dreams',
      columns: 2,
    },
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

export function getWonderLabAchievementNavigationFixture(
  componentName: string,
  sourcePath = '',
): WonderLabPreviewFixture | null {
  const sourceKey = normalizeFixtureKey(sourcePath)
  const componentKey = normalizeFixtureKey(componentName)

  return fixtures[sourceKey] ?? fixtures[componentKey] ?? null
}

export function listWonderLabAchievementNavigationFixtureKeys(): string[] {
  return Object.keys(fixtures).sort()
}
