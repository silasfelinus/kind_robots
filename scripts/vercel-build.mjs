// /scripts/vercel-build.mjs
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const binExtension = process.platform === 'win32' ? '.cmd' : ''
const prismaBinary = path.resolve(`node_modules/.bin/prisma${binExtension}`)
const nuxtBinary = path.resolve('node_modules/.bin/nuxt')

function run(command, args, label) {
  console.log(`[vercel-build] ${label}`)

  const result = spawnSync(command, args, {
    env: process.env,
    stdio: 'inherit',
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(`${label} exited with code ${result.status ?? 'unknown'}`)
  }
}

const isVercelBuild = process.env.VERCEL === '1'
const isProductionDeployment = process.env.VERCEL_ENV === 'production'

run(prismaBinary, ['generate'], 'Generating Prisma client')

if (!isVercelBuild || isProductionDeployment) {
  run(process.execPath, ['scripts/prisma-migrate-deploy.mjs'], 'Applying production migrations')
} else {
  console.log(`[vercel-build] Skipping migrations for Vercel ${process.env.VERCEL_ENV || 'unknown'} deployment`)
}

run(
  process.execPath,
  ['--max-old-space-size=8192', nuxtBinary, 'build'],
  'Building Nuxt application',
)
