// /utils/wonderlab/previewFixtureCatalog.ts
import {
  getWonderLabPreviewFixture as getCoreFixture,
  listWonderLabPreviewFixtureKeys as listCoreFixtureKeys,
} from './previewFixtures'
import {
  getWonderLabAchievementNavigationFixture,
  listWonderLabAchievementNavigationFixtureKeys,
} from './previewFixturesAchievementNavigation'

export type {
  WonderLabPreviewFixture,
  WonderLabPreviewViewport,
} from './previewFixtures'

export function getWonderLabPreviewFixture(
  componentName: string,
  sourcePath = '',
) {
  return (
    getCoreFixture(componentName, sourcePath) ??
    getWonderLabAchievementNavigationFixture(componentName, sourcePath)
  )
}

export function listWonderLabPreviewFixtureKeys(): string[] {
  return [
    ...new Set([
      ...listCoreFixtureKeys(),
      ...listWonderLabAchievementNavigationFixtureKeys(),
    ]),
  ].sort()
}
