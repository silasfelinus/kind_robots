// /utils/wonderlab/previewFixtureCatalog.ts
import {
  getWonderLabPreviewFixture as getCoreFixture,
  listWonderLabPreviewFixtureKeys as listCoreFixtureKeys,
} from './previewFixtures'
import {
  getWonderLabAchievementNavigationFixture,
  listWonderLabAchievementNavigationFixtureKeys,
} from './previewFixturesAchievementNavigation'
import {
  getWonderLabPassiveCardFixture,
  listWonderLabPassiveCardFixtureKeys,
} from './previewFixturesPassiveCards'
import {
  getWonderLabLearningControlFixture,
  listWonderLabLearningControlFixtureKeys,
} from './previewFixturesLearningControls'
import {
  getWonderLabBuilderRulerFixture,
  listWonderLabBuilderRulerFixtureKeys,
} from './previewFixturesBuilderRuler'
import {
  getWonderLabInteractionDisplayFixture,
  listWonderLabInteractionDisplayFixtureKeys,
} from './previewFixturesInteractionDisplays'

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
    getWonderLabAchievementNavigationFixture(componentName, sourcePath) ??
    getWonderLabPassiveCardFixture(componentName, sourcePath) ??
    getWonderLabLearningControlFixture(componentName, sourcePath) ??
    getWonderLabBuilderRulerFixture(componentName, sourcePath) ??
    getWonderLabInteractionDisplayFixture(componentName, sourcePath)
  )
}

export function listWonderLabPreviewFixtureKeys(): string[] {
  return [
    ...new Set([
      ...listCoreFixtureKeys(),
      ...listWonderLabAchievementNavigationFixtureKeys(),
      ...listWonderLabPassiveCardFixtureKeys(),
      ...listWonderLabLearningControlFixtureKeys(),
      ...listWonderLabBuilderRulerFixtureKeys(),
      ...listWonderLabInteractionDisplayFixtureKeys(),
    ]),
  ].sort()
}
