#!/usr/bin/env node
// Live front-door probe (2026-11-17 PT). Run after deploy:
//   node utils/scripts/checkFrontDoorRoutesLive.mjs [https://kindrobots.org]
//
// Fails when a hub or guessable URL is a soft 404 (HTTP 200 whose body is the
// not-found panel), when a hub alias does not redirect, or when a nonsense URL
// answers anything but 404. Read-only: plain GET requests, no login.

const base = (process.argv[2] || 'https://kindrobots.org').replace(/\/$/, '')

const HUBS = {
  '/play': '/play/arcade',
  '/games': '/play/arcade',
  '/projects': '/storybook',
  '/support': '/giving',
  '/donate': '/giving',
  '/give': '/giving',
  '/shop': '/sanctuary',
  '/giftshop': '/sanctuary',
  '/home': '/',
  '/signup': '/register',
}
const NOT_FOUND_MARKERS = [
  'data-testid="page-not-found"',
  'No Nuxt Content page was found',
]

const problems = []

for (const [from, to] of Object.entries(HUBS)) {
  const res = await fetch(base + from, { redirect: 'manual' })
  const location = res.headers.get('location') || ''
  const target = location ? new URL(location, base).pathname : ''
  if (res.status < 300 || res.status >= 400) {
    problems.push(`${from}: expected redirect to ${to}, got ${res.status}`)
  } else if (target !== to) {
    problems.push(`${from}: redirects to ${target}, expected ${to}`)
  }
}

for (const path of Object.values(HUBS)) {
  const res = await fetch(base + path)
  const body = await res.text()
  if (res.status !== 200) problems.push(`${path}: hub answered ${res.status}`)
  else if (NOT_FOUND_MARKERS.some((m) => body.includes(m)))
    problems.push(`${path}: hub is a soft 404`)
}

const nonsense = `/no-such-page-${Date.now().toString(36)}`
const missing = await fetch(base + nonsense)
if (missing.status !== 404)
  problems.push(`${nonsense}: expected 404, got ${missing.status}`)

if (problems.length) {
  console.error(`front-door probe: ${problems.length} problem(s)`)
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}
console.log(
  `front-door probe: ${Object.keys(HUBS).length} hubs redirect, targets load, unknown URL is 404`,
)
