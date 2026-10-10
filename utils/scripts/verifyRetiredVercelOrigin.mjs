#!/usr/bin/env node
// Prevent executable test requests from silently targeting retired hosting.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const oldHost = ['kind-robots.', 'ver', 'cel', '.app'].join('')
const watched = [
  'cypress',
  'cypress.config.ts',
  'sample/sample.http',
  'server/api/art/queue/queue.http',
  'server/api/art/collection/folder/collections.http',
]

const files = (name) => {
  const full = join(root, name)
  if (statSync(full).isDirectory()) {
    return readdirSync(full).flatMap((entry) => files(join(name, entry)))
  }
  return [full]
}

const offenders = watched
  .flatMap(files)
  .filter((file) => readFileSync(file, 'utf8').includes(oldHost))
if (offenders.length) {
  throw new Error(
    'Retired hosting target in runnable tests/examples: ' +
      offenders.map((file) => relative(root, file)).join(', '),
  )
}

process.stdout.write(
  'Cypress and HTTP examples use no retired hosting targets.\n',
)
