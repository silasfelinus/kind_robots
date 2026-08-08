// /scripts/vercel-build.mjs
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const binExtension = process.platform === 'win32' ? '.cmd' : ''
const prismaBinary = path.resolve(`node_modules/.bin/prisma${binExtension}`)
const tsxBinary = path.resolve(`node_modules/.bin/tsx${binExtension}`)
const nuxtBinary = path.resolve('node_modules/.bin/nuxt')
const connectorGuard = path.resolve(
  'scripts/ensure-prisma-mariadb-connector.mjs',
)
const TRANSIENT_DATABASE_OUTPUT =
  /ER_USER_LIMIT_REACHED|max_user_connections|pool timeout|failed to retrieve a connection|Max connect timeout reached|P1001|P1002|P1017|P2024|connection (?:closed|refused|reset)|connect(?:ion)? timeout/i

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

function runOptionalDatabaseMaintenance(command, args, label) {
  console.log(`[vercel-build] ${label}`)

  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env: process.env,
  })

  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  if (result.error) throw result.error
  if (result.status === 0) return

  const output = `${result.stdout || ''}\n${result.stderr || ''}`
  if (TRANSIENT_DATABASE_OUTPUT.test(output)) {
    console.warn(
      `[vercel-build] ${label} exhausted its bounded database retries; continuing so the application can deploy the safer runtime connection policy. Re-run this idempotent maintenance task after database capacity recovers.`,
    )
    return
  }

  throw new Error(`${label} exited with code ${result.status ?? 'unknown'}`)
}

const isVercelBuild = process.env.VERCEL === '1'
const isProductionDeployment = process.env.VERCEL_ENV === 'production'

run(
  process.execPath,
  [connectorGuard],
  'Ensuring Prisma MariaDB connector supports zero-idle pools',
)
run(prismaBinary, ['generate'], 'Generating Prisma client')

if (!isVercelBuild || isProductionDeployment) {
  run(
    process.execPath,
    ['scripts/prisma-migrate-deploy.mjs'],
    'Applying production migrations',
  )

  runOptionalDatabaseMaintenance(
    tsxBinary,
    ['scripts/seed_achievements.ts', '--write'],
    'Reconciling canonical Achievement catalog',
  )

  runOptionalDatabaseMaintenance(
    tsxBinary,
    ['scripts/generate_achievement_art.ts', '--write'],
    'Queueing missing Achievement artwork',
  )

  console.log(
    '[vercel-build] Skipping Facet catalog maintenance during deployment; run scripts/run_facet_catalog_maintenance.ts explicitly so a long-lived database mutation session cannot block application delivery.',
  )

  runOptionalDatabaseMaintenance(
    tsxBinary,
    ['scripts/seed_contenders.ts', '--write'],
    'Seeding Challenge Center contenders',
  )

  runOptionalDatabaseMaintenance(
    tsxBinary,
    ['scripts/seed_kr_logo_art_image.ts', '--write'],
    'Seeding Kind Robots logo storefront ArtImage row (digital-storefront/t-003)',
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
