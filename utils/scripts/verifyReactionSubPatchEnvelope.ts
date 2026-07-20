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

function forbidText(source: string, text: string, label: string): void {
  if (source.includes(text)) {
    throw new Error(`${label}: forbidden text found ${JSON.stringify(text)}`)
  }
}

// The nested art/dream reaction PATCH routes previously returned a broken error
// shape (data: { message }, no top-level message, no statusCode) and a non-standard
// success shape. Both now return the standard { success, message, data, statusCode }
// envelope while keeping the legacy top-level `reaction` alias.
const routes = [
  'server/api/reactions/art/[id].patch.ts',
  'server/api/reactions/dream/[id].patch.ts',
] as const

for (const path of routes) {
  const source = read(path)

  requireText(source, 'data: reaction,', `${path} success data is the record`)
  requireText(source, 'reaction,', `${path} legacy reaction alias preserved`)
  requireText(
    source,
    'statusCode: event.node.res.statusCode,',
    `${path} envelope statusCode`,
  )
  requireText(source, 'data: null,', `${path} error envelope data`)
  // The old error wrapper put the message inside data.
  forbidText(source, 'data: {\n        message', `${path} legacy error wrapper`)
}

console.log('Reaction sub-patch response envelope contract passed.')
