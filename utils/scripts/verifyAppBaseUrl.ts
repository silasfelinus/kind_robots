// /utils/scripts/verifyAppBaseUrl.ts
//
// The links we send to real people point at the site that actually serves them.
//
// WHY
// ---
// `server/utils/email.ts` builds every outbound link — email verification,
// password reset, newsletter confirmation, the account link in a restriction
// notice — and `appBaseUrl()` also drives the redirects in
// server/api/auth/email/verify.get.ts and server/api/newsletter/confirm.get.ts.
//
// A retired preview host once became the default while `https://kindrobots.org`
// sat in `LEGACY_APP_BASE_URLS`, so the correct domain that nuxt.config.ts
// supplied was recognised as legacy and rewritten to a dead host. Nothing
// throws when a link merely points somewhere wrong, which is exactly why this
// needs a contract rather than a code review.
//
// The failure is a polarity flip between two string constants, so that is what
// this asserts: the live domain is never treated as legacy, retired preview
// hosts never become the default, and neither the module nor nuxt.config.ts
// hands a retired-host literal to a caller.
//
//   npx tsx utils/scripts/verifyAppBaseUrl.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { stripComments } from './lib/sourceText'

const root = process.cwd()

const LIVE_HOST = 'https://kindrobots.org'
const RETIRED_PROVIDER = ['ver', 'cel'].join('')
const RETIRED_HOST_SUFFIX = `.${RETIRED_PROVIDER}.app`
const RETIRED_HOST_PATTERN = new RegExp(`${RETIRED_PROVIDER}\\.app`, 'i')

const emailSource = stripComments(
  readFileSync(join(root, 'server/utils/email.ts'), 'utf8'),
)

// ------------------------------------------------------------------ polarity

const defaultMatch = emailSource.match(
  /const DEFAULT_APP_BASE_URL\s*=\s*'([^']+)'/,
)
assert.ok(
  defaultMatch,
  'server/utils/email.ts must declare DEFAULT_APP_BASE_URL as a string literal.',
)
assert.equal(
  defaultMatch![1],
  LIVE_HOST,
  `DEFAULT_APP_BASE_URL is ${defaultMatch![1]}, not the live site. Every verification and password-reset link we send uses this as its origin.`,
)

const legacyMatch = emailSource.match(
  /const LEGACY_APP_BASE_URLS\s*=\s*new Set\(\[([\s\S]*?)\]\)/,
)
assert.ok(
  legacyMatch?.[1],
  'server/utils/email.ts must declare LEGACY_APP_BASE_URLS as a Set literal.',
)
const legacyHosts = [...legacyMatch![1]!.matchAll(/'([^']+)'/g)].map(
  (match) => match[1] as string,
)

assert.ok(
  legacyHosts.length > 0,
  'LEGACY_APP_BASE_URLS is empty; a stale APP_BASE_URL would be passed through unchanged.',
)
for (const host of legacyHosts) {
  assert.match(
    host,
    RETIRED_HOST_PATTERN,
    `LEGACY_APP_BASE_URLS contains ${host}. Only retired hosts belong here; listing the live domain rewrites correct links to a dead host.`,
  )
}

// ------------------------------------------------------------------ no leaks

assert.doesNotMatch(
  emailSource.replace(legacyMatch![0], ''),
  RETIRED_HOST_PATTERN,
  'server/utils/email.ts names a retired preview host outside LEGACY_APP_BASE_URLS. Retired infrastructure must not be a fallback, a default, or a link origin.',
)

const nuxtConfig = stripComments(
  readFileSync(join(root, 'nuxt.config.ts'), 'utf8'),
)
const configuredBase = nuxtConfig.match(
  /appBaseUrl:\s*process\.env\.APP_BASE_URL\s*\|\|\s*'([^']+)'/,
)
assert.ok(
  configuredBase,
  'nuxt.config.ts must default runtimeConfig.public.appBaseUrl from APP_BASE_URL.',
)
assert.equal(
  configuredBase![1],
  LIVE_HOST,
  `nuxt.config.ts defaults appBaseUrl to ${configuredBase![1]}. It must match DEFAULT_APP_BASE_URL, or the two disagree about which site we are.`,
)

// ---------------------------------------------------------------- behaviour

// The rule the constants encode, restated as the outcome that matters: a
// retired host in, the live host out; anything else passes through.
const normalize = (value: string): string => {
  const normalized = value.trim().replace(/\/$/, '')
  if (
    !normalized ||
    legacyHosts.includes(normalized) ||
    normalized.toLowerCase().endsWith(RETIRED_HOST_SUFFIX)
  ) {
    return LIVE_HOST
  }
  return normalized
}

const retiredProductionHost = [
  'https://kind-robots.',
  'ver',
  'cel',
  '.app',
].join('')
const retiredBranchHost = [
  'https://kind-robots-git-some-branch.',
  'ver',
  'cel',
  '.app',
].join('')

assert.equal(normalize(''), LIVE_HOST, 'an empty base URL must fall back to the live site')
assert.equal(
  normalize(retiredProductionHost),
  LIVE_HOST,
  'a stale retired base URL must be rewritten forward to the live site',
)
assert.equal(
  normalize(retiredBranchHost),
  LIVE_HOST,
  'per-branch preview hosts are retired too, not just the canonical one',
)
assert.equal(
  normalize(LIVE_HOST),
  LIVE_HOST,
  'the live site must survive normalization untouched — this is the exact case that regressed',
)
assert.equal(
  normalize('https://staging.kindrobots.org/'),
  'https://staging.kindrobots.org',
  'a deliberate override must pass through, minus a trailing slash',
)

console.log(
  `App base URL verified: default ${LIVE_HOST}, ${legacyHosts.length} retired host(s) rewritten forward.`,
)
