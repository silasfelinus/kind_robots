import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

function read(path: string): string {
  return readFileSync(resolve(root, path), 'utf8')
}

function requireText(source: string, text: string, label: string): void {
  if (!source.includes(text)) {
    throw new Error(`${label}: expected to find ${JSON.stringify(text)}`)
  }
}

// Every DELETE route must return the standard { success, message, data, statusCode }
// envelope on both success and error, setting event.node.res.statusCode to match.
const deleteRoutes = [
  'server/api/server/[id].delete.ts',
  'server/api/art/collection/[id].delete.ts',
  'server/api/art/image/[id].delete.ts',
  'server/api/themes/[id].delete.ts',
  'server/api/resources/[id].delete.ts',
  'server/api/rewards/[id].delete.ts',
  'server/api/bots/[id].delete.ts',
] as const

for (const path of deleteRoutes) {
  const source = read(path)

  // Success envelope carries an explicit status code.
  requireText(source, 'statusCode: 200,', `${path} success statusCode`)

  // Error envelope is standard: data: null + statusCode mirrored from the response.
  requireText(source, 'data: null', `${path} error envelope data`)
  requireText(
    source,
    'statusCode: event.node.res.statusCode,',
    `${path} error envelope statusCode`,
  )
}

console.log('Delete response envelope contract passed.')
