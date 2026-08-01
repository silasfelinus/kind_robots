// /scripts/vercel-build.mjs
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { resolveFacetCatalogSeedDecision } from './lib/facetCatalogSeedPolicy.mjs'

const binExtension = process.platform === 'win32' ? '.cmd' : ''
const prismaBinary = path.resolve(`node_modules/.bin/prisma${binExtension}`)
const tsxBinary = path.resolve(`node_modules/.bin/tsx${binExtension}`)
const nuxtBinary = path.resolve('node_modules/.bin/nuxt')

function run(command, args, label) {
  console.log(`[vercel-build] ${label}`)

  const result = spawnSync(command, args, {
    env: process.env,
    stdio: 'inherit',
  })

  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`${label} exited with code ${result.status ?? 'unknown'}`)
  }
}

const isVercelBuild = process.env.VERCEL === '1'
const isProductionDeployment = process.env.VERCEL_ENV === 'production'

run(prismaBinary, ['generate'], 'Generating Prisma client')

if (!isVercelBuild || isProductionDeployment) {
  run(
    process.execPath,
    ['scripts/prisma-migrate-deploy.mjs'],
    'Applying production migrations',
  )

  run(
    tsxBinary,
    ['scripts/seed_achievements.ts', '--write'],
    'Reconciling canonical Achievement catalog',
  )

  run(
    tsxBinary,
    ['scripts/generate_achievement_art.ts', '--write'],
    'Queueing missing Achievement artwork',
  )

  const facetSeedDecision = resolveFacetCatalogSeedDecision()
  run(
    tsxBinary,
    [
      'scripts/run_facet_catalog_maintenance.ts',
      facetSeedDecision.run ? '--seed' : '--skip-seed',
      `--reason=${facetSeedDecision.reason}`,
    ],
    'Running serialized Facet catalog maintenance',
  )

  run(
    tsxBinary,
    ['scripts/seed_contenders.ts', '--write'],
    'Seeding Challenge Center contenders',
  )
} else {
  console.log(
    `[vercel-build] Skipping migrations and database seeds for Vercel ${process.env.VERCEL_ENV || 'unknown'} deployment`,
  )
}

run(
  process.execPath,
  ['--max-old-space-size=8192', nuxtBinary, 'build'],
  'Building Nuxt application',
)
