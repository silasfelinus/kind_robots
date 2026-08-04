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
