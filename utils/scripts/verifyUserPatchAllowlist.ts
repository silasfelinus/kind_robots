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

const patchRoute = read('server/api/users/[id].patch.ts')
const cypressSpec = read('cypress/e2e/api/users.cy.ts')

// The self-service patch derives writes from an explicit allowlist, not a
// blocklist. The old DENY set (which let every un-denied column through) must
// be gone, and the loop must no longer end with an unconditional passthrough.
requireText(patchRoute, 'const TEXT_FIELDS = new Set([', 'User patch allowlist')
requireText(patchRoute, 'const BOOL_FIELDS = new Set([', 'User patch booleans')
requireText(patchRoute, 'const ENUM_FIELDS', 'User patch enum validation')
forbidText(patchRoute, 'const DENY = new Set(', 'User patch blocklist removed')

// Privilege / economy / membership / moderation columns must NOT be listed as
// self-editable text fields.
for (const forbidden of [
  "'Role'",
  "'karma'",
  "'mana'",
  "'isMember'",
  "'memberUntil'",
  "'isRestricted'",
  "'apiKey'",
  "'password'",
]) {
  forbidText(
    patchRoute,
    `TEXT_FIELDS = new Set([\n${forbidden}`,
    'User patch privileged field',
  )
}

// Ownership is still verified before any write.
requireText(
  patchRoute,
  'user?.id !== userId',
  'User patch ownership verification',
)

// Deployed regression pins the allowlist behavior.
requireText(
  cypressSpec,
  'ignores privileged fields on self-service update',
  'User patch deployed regression',
)

console.log('User patch allowlist contract passed.')
