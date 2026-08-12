import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = process.cwd()
const failures = []
for (const forbidden of ['app', 'composables']) {
  const full = resolve(root, forbidden)
  if (existsSync(full) && statSync(full).isDirectory()) failures.push(`root ${forbidden}/ is forbidden by the Kind Robots architecture`)
}

const skip = new Set(['.git', 'node_modules', '.nuxt', '.output', 'dist', 'public', 'prisma'])
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (skip.has(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(ts|vue|js|mjs|md|yml|yaml)$/.test(entry)) out.push(full)
  }
  return out
}
for (const file of walk(root)) {
  const rel = relative(root, file).replace(/\\/g, '/')
  if (rel === 'utils/scripts/verify-project-architecture.mjs') continue
  const text = readFileSync(file, 'utf8')
  if (/[~@]\/composables\//.test(text)) failures.push(`${rel} still imports from composables/`)
}

const clientMiddleware = resolve(root, 'middleware/navigation-access.global.ts')
if (!existsSync(clientMiddleware)) failures.push('client route middleware must remain at middleware/navigation-access.global.ts')
const middlewareText = existsSync(clientMiddleware) ? readFileSync(clientMiddleware, 'utf8') : ''
if (!middlewareText.includes('defineNuxtRouteMiddleware')) failures.push('root middleware must remain Nuxt route middleware')

const agents = readFileSync(resolve(root, 'AGENTS.md'), 'utf8')
if (!agents.includes('Root-first client layout')) failures.push('AGENTS.md must document the root-first client layout')
if (!agents.includes('Do not create a root `composables/` directory')) failures.push('AGENTS.md must document the composables ban')

if (failures.length) throw new Error(`Project architecture contract failed:\n- ${failures.join('\n- ')}`)
console.log('Project architecture verified: root-first layout, no composables island, client/server middleware remain distinct.')
