// /scripts/lib/facetCatalogSeedPolicy.mjs
import { spawnSync } from 'node:child_process'

const FACET_CATALOG_SOURCE_FILES = new Set([
  'prisma/facet-alias.prisma',
  'prisma/facet-catalog.prisma',
  'prisma/schema.prisma',
  'stores/helpers/adventureCards.ts',
  'stores/helpers/scenarioCards.ts',
  'stores/seeds/artList.ts',
  'stores/utils/animalData.ts',
  'stores/utils/randomBackstory.ts',
  'stores/utils/randomClass.ts',
  'stores/utils/randomColor.ts',
  'stores/utils/randomGenre.ts',
  'stores/utils/randomMaterial.ts',
  'stores/utils/randomPersonality.ts',
  'stores/utils/randomQuirks.ts',
  'utils/facetAliases.ts',
  'utils/seeds/facetGenderArtwork.ts',
  'utils/seeds/facetGenderValues.ts',
  'utils/seeds/facetLegacyCharacterLists.ts',
  'utils/seeds/facetLegacyCreativeLists.ts',
  'utils/scripts/runFacetCatalogSeed.ts',
  'utils/scripts/seedFacetCatalog.ts',
  'utils/scripts/seedGenderFacetCatalog.ts',
  'utils/scripts/seedScenarioGenreFacetCatalog.ts',
])

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on'])

export function isFacetCatalogSourcePath(filePath) {
  const normalized = String(filePath ?? '').trim().replaceAll('\\', '/')
  if (!normalized) return false
  if (FACET_CATALOG_SOURCE_FILES.has(normalized)) return true
  return normalized.startsWith('prisma/migrations/')
}

export function decideFacetCatalogSeed({
  isVercelBuild,
  isProductionDeployment,
  forceValue,
  changedFiles,
  diffError,
}) {
  if (!isVercelBuild) {
    return {
      run: true,
      reason: 'non-Vercel build preserves explicit local seed behavior',
    }
  }
  if (!isProductionDeployment) {
    return { run: false, reason: 'non-production Vercel deployment' }
  }
  if (TRUE_VALUES.has(String(forceValue ?? '').trim().toLowerCase())) {
    return { run: true, reason: 'FACET_CATALOG_SEED_ON_BUILD forced the seed' }
  }
  if (diffError) {
    return {
      run: true,
      reason: `commit diff unavailable; seeding defensively (${diffError})`,
    }
  }

  const relevantFiles = (changedFiles ?? []).filter(isFacetCatalogSourcePath)
  if (relevantFiles.length > 0) {
    return {
      run: true,
      reason: `catalog source changed: ${relevantFiles.join(', ')}`,
      relevantFiles,
    }
  }

  return {
    run: false,
    reason: 'no canonical Facet source, schema, or migration changed',
    relevantFiles: [],
  }
}

export function readVercelChangedFiles(env = process.env) {
  const previousSha = env.VERCEL_GIT_PREVIOUS_SHA?.trim()
  const currentSha = env.VERCEL_GIT_COMMIT_SHA?.trim()

  if (!previousSha || !currentSha) {
    return { changedFiles: [], diffError: 'missing Vercel commit ancestry' }
  }

  const diff = spawnSync(
    'git',
    ['diff', '--name-only', '--diff-filter=ACMRTUXB', previousSha, currentSha],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  )

  if (diff.status !== 0) {
    return {
      changedFiles: [],
      diffError:
        diff.stderr?.trim() ||
        `git diff exited with ${diff.status ?? 'unknown status'}`,
    }
  }

  return {
    changedFiles: diff.stdout
      .split('\n')
      .map((filePath) => filePath.trim())
      .filter(Boolean),
    diffError: null,
  }
}

export function resolveFacetCatalogSeedDecision(env = process.env) {
  const { changedFiles, diffError } = readVercelChangedFiles(env)
  return decideFacetCatalogSeed({
    isVercelBuild: env.VERCEL === '1',
    isProductionDeployment: env.VERCEL_ENV === 'production',
    forceValue: env.FACET_CATALOG_SEED_ON_BUILD,
    changedFiles,
    diffError,
  })
}
