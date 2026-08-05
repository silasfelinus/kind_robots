// /scripts/ensure-prisma-mariadb-connector.mjs
//
// @prisma/adapter-mariadb 7.9.1 installs a private mariadb 3.4.5 copy.
// That connector only grows a pool while idleConnections < minimumIdle, so a
// serverless pool configured with minimumIdle=0 never opens its first socket
// for a waiting query. It consequently times out forever at active=0 idle=0.
//
// The repository already installs a fixed top-level MariaDB connector. Remove
// only the adapter's known-broken private copy before Prisma-backed scripts or
// Nuxt bundling run, then prove Node resolves the adapter to a connector whose
// pool can grow on demand. This is idempotent and modifies node_modules only.

import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { readFile, rm } from 'node:fs/promises'
import path from 'node:path'

const require = createRequire(import.meta.url)
const minimumFixedVersion = [3, 5, 0]

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version)
  if (!match) throw new Error(`Unsupported MariaDB connector version: ${version}`)
  return match.slice(1).map(Number)
}

function compareVersions(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index]
  }
  return 0
}

function supportsZeroIdlePools(version) {
  return compareVersions(parseVersion(version), minimumFixedVersion) >= 0
}

async function readPackageVersion(packagePath) {
  const packageJson = JSON.parse(await readFile(packagePath, 'utf8'))
  if (typeof packageJson.version !== 'string') {
    throw new Error(`Package at ${packagePath} has no string version`)
  }
  return packageJson.version
}

function findPackageRoot(entryPath) {
  let directory = path.dirname(entryPath)

  while (true) {
    if (existsSync(path.join(directory, 'package.json'))) return directory
    const parent = path.dirname(directory)
    if (parent === directory) {
      throw new Error(`Could not find package root for ${entryPath}`)
    }
    directory = parent
  }
}

const adapterEntry = require.resolve('@prisma/adapter-mariadb')
const adapterRoot = findPackageRoot(adapterEntry)
const nestedConnectorRoot = path.join(adapterRoot, 'node_modules', 'mariadb')
const nestedConnectorPackage = path.join(nestedConnectorRoot, 'package.json')
const topLevelConnectorPackage = path.resolve('node_modules/mariadb/package.json')

if (!existsSync(topLevelConnectorPackage)) {
  throw new Error(
    'The fixed top-level mariadb connector is missing; install dependencies before running this guard.',
  )
}

const topLevelVersion = await readPackageVersion(topLevelConnectorPackage)
if (!supportsZeroIdlePools(topLevelVersion)) {
  throw new Error(
    `Top-level mariadb ${topLevelVersion} cannot grow a minimumIdle=0 pool; require mariadb >=3.5.0.`,
  )
}

let removedNestedVersion = null
if (existsSync(nestedConnectorPackage)) {
  const nestedVersion = await readPackageVersion(nestedConnectorPackage)

  if (!supportsZeroIdlePools(nestedVersion)) {
    removedNestedVersion = nestedVersion
    await rm(nestedConnectorRoot, { recursive: true, force: true })
  }
}

const adapterRequire = createRequire(path.join(adapterRoot, 'package.json'))
const resolvedConnectorEntry = adapterRequire.resolve('mariadb')
const resolvedConnectorRoot = findPackageRoot(resolvedConnectorEntry)
const resolvedVersion = await readPackageVersion(
  path.join(resolvedConnectorRoot, 'package.json'),
)

if (!supportsZeroIdlePools(resolvedVersion)) {
  throw new Error(
    `Prisma adapter still resolves mariadb ${resolvedVersion}; require >=3.5.0 for minimumIdle=0.`,
  )
}

console.log('[database] Prisma MariaDB connector supports zero-idle pools', {
  removedNestedVersion,
  resolvedVersion,
  resolvedFromTopLevel: path.resolve(resolvedConnectorRoot) === path.resolve('node_modules/mariadb'),
})
