// /utils/scripts/verifyNoHiddenRoutes.ts
//
// Is there any page you can only reach by already knowing its URL?
//
// WHY THIS EXISTS
// ---------------
// Silas, 2026-09-30, after hunting for the Media Watchlist: "I don't want
// things to be hidden behind a secret url. if it's not to be seen, then it
// should be in admin." The audit that followed found eleven routable pages
// with no navigation tab and no in-app link at all. The Forum, Servers,
// Shared With Me, the Rebel Button, the Butterfly Gallery, two /admin pages,
// the UI gallery and a test page were all served, and none could be found.
//
// THE RULE
// --------
// Every route the app serves, whether a content/**/*.md page or a static
// pages/**/*.vue file, must be ONE of:
//   1. a navigation tab route (content/channels/<channel>/*.md `route:`),
//      in Admin with requiredRole: ADMIN if it is not for everyone;
//   2. a sub-route of a tab (e.g. /play/aquarium/leaderboard under
//      /play/aquarium), reached from inside its parent;
//   3. a project page reached from the Projects tab (utils/projectPlacements.ts);
//   4. a `redirect:` stub for a legacy URL;
//   5. on SYSTEM_ROUTES below, with the reason it is not a destination.
//
// A new page that is none of these fails CI. The fix is almost always a
// channel tab file, not an allowlist entry.
//
//   npx tsx utils/scripts/verifyNoHiddenRoutes.ts
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { PROJECT_PLACEMENTS } from '@/utils/projectPlacements'

const root = process.cwd()

// Routes that are deliberately not destinations. Each needs a reason, and
// "nobody got round to adding a tab" is not one.
export const SYSTEM_ROUTES: Record<string, string> = {
  '/login': 'sign-in screen, opened by every "sign in" prompt',
  '/error': 'the 404 room, rendered when a route is not found',
  '/reset-password': 'landing page for the password-reset email link',
  '/email-confirmation': 'landing page for the email-confirmation link',
  '/auth/google': 'OAuth callback target',
  '/shop/success': 'Stripe checkout success return URL',
  '/shop/cancel': 'Stripe checkout cancel return URL',
  '/dashboard':
    'post-sign-in landing, linked from registration and the user menu',
  '/coloring-page':
    'per-image action, opened from an image card with ?imageId=',
  '/build-bench': 'Art dashboard tab, reached from the Art page',
}

function walk(dir: string, ext: string, out: string[] = []): string[] {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const name of entries) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, ext, out)
    else if (name.endsWith(ext)) out.push(path)
  }
  return out
}

function frontMatter(source: string): Record<string, string> {
  const match = source.match(/^---\n([\s\S]*?)\n---/)
  const fields: Record<string, string> = {}
  if (!match) return fields
  for (const line of match[1].split('\n')) {
    const field = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/)
    if (field) fields[field[1]] = field[2].trim().replace(/^['"]|['"]$/g, '')
  }
  return fields
}

function normalize(route: string): string {
  const path = route.split(/[?#]/)[0].trim().replace(/\/+$/, '')
  return path || '/'
}

function routeFor(base: string, file: string, ext: string): string {
  const path = relative(base, file).slice(0, -ext.length).split('\\').join('/')
  return normalize('/' + path.replace(/(^|\/)index$/, ''))
}

export type RouteSource = { route: string; file: string }

export function collectServedRoutes(): RouteSource[] {
  const routes: RouteSource[] = []
  const contentDir = resolve(root, 'content')
  const channelsDir = resolve(contentDir, 'channels')
  for (const file of walk(contentDir, '.md')) {
    if (file.startsWith(channelsDir)) continue
    if (frontMatter(readFileSync(file, 'utf8')).redirect) continue
    routes.push({
      route: routeFor(contentDir, file, '.md'),
      file: relative(root, file),
    })
  }
  const pagesDir = resolve(root, 'pages')
  for (const file of walk(pagesDir, '.vue')) {
    const route = routeFor(pagesDir, file, '.vue')
    if (route.includes('[')) continue // dynamic: reached from a list, not typed
    routes.push({ route, file: relative(root, file) })
  }
  return routes
}

export function collectTabRoutes(): Set<string> {
  const tabs = new Set<string>()
  for (const file of walk(resolve(root, 'content/channels'), '.md')) {
    const route = frontMatter(readFileSync(file, 'utf8')).route
    if (route) tabs.add(normalize(route))
  }
  return tabs
}

export function hiddenRoutes(
  served: RouteSource[],
  tabs: Set<string>,
  placements: string[],
  system: Record<string, string>,
): RouteSource[] {
  const reachable = new Set([...tabs, ...placements.map(normalize)])
  return served.filter(({ route }) => {
    if (route === '/' || reachable.has(route) || route in system) return false
    for (const tab of tabs) {
      if (tab !== '/' && route.startsWith(tab + '/')) return false
    }
    return true
  })
}

function selfTest(): void {
  const tabs = new Set(['/play/aquarium', '/forum'])
  const served = [
    { route: '/forum', file: 'a' },
    { route: '/play/aquarium/leaderboard', file: 'b' },
    { route: '/secret', file: 'c' },
    { route: '/login', file: 'd' },
    { route: '/plan/projects/x', file: 'e' },
  ]
  const hidden = hiddenRoutes(served, tabs, ['/plan/projects/x'], {
    '/login': 'x',
  })
  if (hidden.length !== 1 || hidden[0].route !== '/secret') {
    throw new Error(`self-test failed: ${JSON.stringify(hidden)}`)
  }
}

function main(): void {
  selfTest()
  const served = collectServedRoutes()
  const tabs = collectTabRoutes()
  const placements = Object.values(PROJECT_PLACEMENTS).map((p) => p.route)
  const hidden = hiddenRoutes(served, tabs, placements, SYSTEM_ROUTES)

  const stale = Object.keys(SYSTEM_ROUTES).filter(
    (route) => !served.some((s) => s.route === route),
  )
  if (stale.length) {
    console.error(
      `SYSTEM_ROUTES lists route(s) the app no longer serves: ${stale.join(', ')}. Remove them.`,
    )
    process.exitCode = 1
  }

  if (hidden.length) {
    console.error(
      `❌ ${hidden.length} page(s) can only be reached by typing the URL:`,
    )
    for (const { route, file } of hidden) console.error(`  ${route}  (${file})`)
    console.error(
      '\nAdd a tab under content/channels/<channel>/ for each one. Anything not for everyone goes in admin with requiredRole: ADMIN. If it is a legacy URL, make it a `redirect:` stub. If it really is a system endpoint (callback, return URL, error page), add it to SYSTEM_ROUTES with the reason.',
    )
    process.exitCode = 1
    return
  }
  if (!process.exitCode) {
    console.log(
      `✅ No hidden routes: ${served.length} served routes, all reachable from ${tabs.size} nav tabs, sub-routes, project placements, or ${Object.keys(SYSTEM_ROUTES).length} documented system routes.`,
    )
  }
}

main()
