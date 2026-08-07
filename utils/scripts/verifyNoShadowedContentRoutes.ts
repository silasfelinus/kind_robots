// /utils/scripts/verifyNoShadowedContentRoutes.ts
//
// Does a file in pages/ silently take over a route that content/ owns?
//
// WHY THIS EXISTS
// ---------------
// /resources had BOTH `pages/resources.vue` and `content/resources.md`. Nuxt
// resolves a concrete page before the `[...slug]` content catch-all, so the
// page won and the markdown never rendered -- along with everything the front
// matter drives: `channelKey: play`, `tabKey: resources`, the backdrop art, the
// loading copy, the tooltip.
//
// The symptom was not "the page looks wrong". It was that arriving at
// /resources left the channel navigation showing whatever it showed before.
// Silas, 2026-08-07: "when I load it, it doesn't change dashboard entry. I
// truly don't understand that one." Nothing in the file you are reading
// explains it, because the cause is the EXISTENCE of a second file somewhere
// else -- which is exactly the kind of thing a human cannot be expected to
// notice and a script finds instantly.
//
// A second instance was already present: `pages/error.vue`, a hardcoded "Page
// Not Found", shadowing `content/error.md`, the designed Lost & Found Room.
//
// WHAT COUNTS AS A SHADOW
// -----------------------
// Same resolved route, both sources. `pages/play/challenges/leaderboard.vue`
// alongside `content/play/challenges.md` is NOT a shadow -- it is a deeper
// route under a content parent, which is a normal and useful arrangement.
//
//   npx tsx utils/scripts/verifyNoShadowedContentRoutes.ts
import { readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = process.cwd()

function walk(dir: string, ext: string, out: string[] = []): string[] {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, ext, out)
    else if (entry.endsWith(ext)) out.push(full)
  }
  return out
}

/** File path -> the route Nuxt resolves it to. */
export function routeOf(file: string, base: string, ext: string): string {
  const rel = relative(base, file).replace(/\\/g, '/')
  return `/${rel.slice(0, -ext.length).replace(/\/index$/, '')}`
}

const contentRoutes = new Map(
  walk(resolve(root, 'content'), '.md').map((file) => [
    routeOf(file, resolve(root, 'content'), '.md'),
    relative(root, file),
  ]),
)

/*
 * `[...slug]` IS the content renderer, so it is the one page that must not be
 * reported -- it does not shadow content, it serves it. Dynamic segments are
 * skipped for the same reason: `/users/[id]` resolves per-request and cannot
 * collide with a static markdown route.
 */
const pageFiles = walk(resolve(root, 'pages'), '.vue').filter(
  (file) => !file.includes('[') || !file.includes(']'),
)

const shadows: string[] = []
for (const file of pageFiles) {
  const route = routeOf(file, resolve(root, 'pages'), '.vue')
  const markdown = contentRoutes.get(route)
  if (markdown) {
    shadows.push(
      `  ${route}\n      page:    ${relative(root, file)}\n      content: ${markdown}  (never renders)`,
    )
  }
}

console.log(
  `Checked ${pageFiles.length} static page(s) against ${contentRoutes.size} content route(s).`,
)

if (shadows.length) {
  console.error(
    `\nFAIL - ${shadows.length} content route(s) are shadowed by a file in pages/:\n\n` +
      shadows.join('\n\n') +
      `\n\nA page beats the [...slug] catch-all, so the markdown never renders and\n` +
      `everything its front matter drives -- channelKey, tabKey, backdrop art,\n` +
      `loading copy -- silently stops applying. Move the page's markup into a\n` +
      `component, mount it from the markdown, and delete the page.`,
  )
  process.exit(1)
}

console.log('\nNo content route is shadowed by a page. ✅')
