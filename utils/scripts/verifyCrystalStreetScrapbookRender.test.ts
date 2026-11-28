// /utils/scripts/verifyCrystalStreetScrapbookRender.test.ts
/*
 * Rendered spoiler regression for the Crystal Street scrapbook (conductor
 * crystal-street/t-026).
 *
 * kind_robots#5240 (the silhouette slice) was verified with discoveryProgress
 * unit tests and template compilation only. Nothing rendered the tabs, so
 * nothing proved a locked slot never leaks a name, portrait path or alt text.
 * This script renders every scrapbook tab through Vite's SSR loader with
 * @vitejs/plugin-vue, against an empty, a partial and a complete save, and
 * reads the HTML the player would get:
 *
 *   - an unmet nightmare's name and its /crystal-street/villains/<id>-* art
 *     never appear, on any tab;
 *   - an unrecruited friend's name never appears on the Friends tab;
 *   - locked slots are the generic "Undiscovered <kind>" silhouette with "???",
 *     one per missing entry;
 *   - the tab counts match the save (met nightmares, X/N endings, friends).
 *
 * The real store pulls in the achievement and run-review stores (network,
 * auth), so the store module is swapped for a fixture with the same fields
 * the scrapbook reads. Nuxt auto-imported components are resolved from
 * components/crystal-street by name; icon and the shared achievement strip
 * are stubbed.
 *
 *   npx tsx utils/scripts/verifyCrystalStreetScrapbookRender.test.ts
 */
import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..')
const STORE_ID = '\0crystal-street-store-fixture'
const ART_STORE_ID = '\0crystal-street-art-store-fixture'

// The fixture store: plain reactive state, filled per scenario before render.
const storeFixture: Plugin = {
  name: 'crystal-street-store-fixture',
  enforce: 'pre',
  resolveId(id) {
    if (id.includes('stores/crystalStreetArtStore')) return ART_STORE_ID
    // Before or after the ~/ alias has rewritten it.
    if (
      /(?:^~|\/stores)\/crystalStreetStore(?:\.ts)?$/.test(id) &&
      id.includes('stores/crystalStreetStore')
    ) {
      return STORE_ID
    }
    return null
  },
  load(id) {
    if (id === ART_STORE_ID)
      return `export function useCrystalStreetArtStore() {
        return { canLoad: false, sessionToken: '', sourceFor: (path) => path, ensure: async () => {} }
      }`
    if (id !== STORE_ID) return null
    return `
      import { computed, reactive } from 'vue'
      import { VILLAINS, endingKey } from '~/utils/crystalStreet/rules'
      const state = reactive({
        scrapbook: { runs: [], endings: [], friends: [] },
        run: null,
      })
      const metVillains = computed(
        () => new Set(state.scrapbook.runs.map((r) => r.villain)),
      )
      const bestFound = computed(
        () => VILLAINS.filter((v) =>
          state.scrapbook.endings.includes(endingKey(v.id, 'best'))).length,
      )
      export function setScrapbook(next) {
        state.scrapbook = next
      }
      export function useCrystalStreetStore() {
        return {
          get scrapbook() { return state.scrapbook },
          get run() { return state.run },
          get metVillains() { return metVillains.value },
          get bestFound() { return bestFound.value },
          dismiss() {},
        }
      }
    `
  },
}

// The Endings tab's "every ending at once" wall is an internal toggle that a
// server render never reaches, and it lists every nightmare by row. Expose its
// initial value to this script only; fail loudly if the source line moves.
const WALL_FLAG = '__crystalStreetEndingsWall'
let wallHookApplied = false
const wallHook: Plugin = {
  name: 'crystal-street-endings-wall-hook',
  enforce: 'pre',
  transform(code, id) {
    if (!id.endsWith('/crystal-street-endings.vue')) return null
    const line = 'const wall = ref(false)'
    if (!code.includes(line)) return null
    wallHookApplied = true
    return code.replace(
      line,
      `const wall = ref(Boolean((globalThis as any).${WALL_FLAG}))`,
    )
  },
}

const server = await createServer({
  root: ROOT,
  configFile: false,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
  resolve: { alias: [{ find: /^~\//, replacement: `${ROOT}/` }] },
  plugins: [storeFixture, wallHook, vue()],
})

try {
  const { createSSRApp, defineComponent, h } = await import('vue')
  const { renderToString } = await import('vue/server-renderer')
  const fixture = (await server.ssrLoadModule(STORE_ID)) as {
    setScrapbook: (s: unknown) => void
  }
  const rules = (await server.ssrLoadModule(
    '/utils/crystalStreet/rules.ts',
  )) as typeof import('../crystalStreet/rules')
  const { VILLAINS, COMPANIONS, ENDING_KEYS, endingKey } = rules
  const Scrapbook = (
    await server.ssrLoadModule(
      '/components/crystal-street/crystal-street-scrapbook.vue',
    )
  ).default

  // Nuxt registers components/crystal-street/<name>.vue as <name>; do the same
  // for the whole folder, so a child added later is rendered rather than
  // silently skipped (an unresolved component fails the run below).
  const csComponents: Record<string, unknown> = {}
  for (const file of readdirSync(`${ROOT}/components/crystal-street`)) {
    if (!file.endsWith('.vue')) continue
    csComponents[file.replace(/\.vue$/, '')] = (
      await server.ssrLoadModule(`/components/crystal-street/${file}`)
    ).default
  }
  const Stub = (tag: string) =>
    defineComponent({
      name: tag,
      render: () => h('span', { 'data-stub': tag }),
    })

  async function render(
    tab: string,
    view: { component?: unknown; initial?: string; wall?: boolean } = {},
  ): Promise<string> {
    ;(globalThis as Record<string, unknown>)[WALL_FLAG] = Boolean(view.wall)
    const root = view.component
      ? () => h(view.component as never, { initial: view.initial })
      : () => h(Scrapbook, { initial: tab })
    const app = createSSRApp({ render: root })
    for (const [name, component] of Object.entries(csComponents)) {
      app.component(name, component as never)
    }
    app.component('icon', Stub('icon'))
    app.component('Icon', Stub('icon'))
    app.component('GameAchievementStrip', Stub('achievement-strip'))
    const unresolved: string[] = []
    app.config.warnHandler = (msg) => {
      if (msg.startsWith('Failed to resolve component')) unresolved.push(msg)
    }
    const html = await renderToString(app)
    assert.deepEqual(unresolved, [], `${tab}: every child component renders`)
    return html
  }

  const run = (villain: string, tier = 'good') => ({
    seed: `seed-${villain}`,
    villain,
    tier,
    name: 'Tester',
    archetype: 'final-girl',
    crew: [],
    clues: 1,
    wins: 1,
    day: 5,
    endedAt: 1_700_000_000_000,
    highlights: [],
  })

  const half = Math.max(1, Math.floor(VILLAINS.length / 2))
  const metPartial = VILLAINS.slice(0, half).map((v) => v.id)
  const friendsPartial = COMPANIONS.slice(0, 2).map((c) => c.id)
  const SCENARIOS = {
    empty: { runs: [], endings: [], friends: [] },
    partial: {
      runs: metPartial.map((id) => run(id)),
      endings: metPartial.map((id) => endingKey(id, 'good')),
      friends: friendsPartial,
    },
    complete: {
      runs: VILLAINS.map((v) => run(v.id, 'best')),
      endings: [...ENDING_KEYS],
      friends: COMPANIONS.map((c) => c.id),
    },
  } as const
  const TABS = ['weeks', 'nightmares', 'endings', 'friends', 'achievements']
  const count = (html: string, needle: string) => html.split(needle).length - 1
  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/"/g, '&quot;')
  // A label inside the tab nav: <span class="cs-micro ...">N</span>.
  const navCount = (html: string, tab: string) => {
    const at = html.indexOf(`data-testid="cs-scrapbook-${tab}"`)
    assert.ok(at >= 0, `tab button ${tab} rendered`)
    const m = html.slice(at).match(/class="cs-micro[^"]*">([^<]*)</)
    return m?.[1]
  }

  let checks = 0
  for (const [scenario, scrapbook] of Object.entries(SCENARIOS)) {
    fixture.setScrapbook(structuredClone(scrapbook))
    const met = new Set(scrapbook.runs.map((r) => r.villain))
    const friends = new Set<string>(scrapbook.friends)
    const unmet = VILLAINS.filter((v) => !met.has(v.id))
    const strangers = COMPANIONS.filter((c) => !friends.has(c.id))

    // Every tab as it opens, plus the states a click reaches: the endings
    // wall, and the gallery and endings with each unmet nightmare selected
    // (the villain list and the wall both let a player pick a locked row).
    const views: { tab: string; label: string; html: string }[] = []
    for (const tab of TABS) {
      views.push({ tab, label: tab, html: await render(tab) })
    }
    views.push({
      tab: 'endings-only',
      label: 'endings-wall',
      html: await render('endings', {
        component: csComponents['crystal-street-endings'],
        wall: true,
      }),
    })
    for (const v of unmet) {
      for (const name of ['gallery', 'endings']) {
        views.push({
          tab: `${name}-only`,
          label: `${name}@${v.id}`,
          html: await render(name, {
            component: csComponents[`crystal-street-${name}`],
            initial: v.id,
          }),
        })
      }
    }

    for (const { tab, label, html } of views) {
      const where = `${scenario}/${label}`

      for (const v of unmet) {
        assert.ok(
          !html.includes(`/crystal-street/villains/${v.id}-`),
          `${where}: unmet nightmare ${v.id} art path leaked`,
        )
        assert.ok(
          !html.includes(escapeHtml(v.name)),
          `${where}: unmet nightmare name "${v.name}" leaked`,
        )
        for (const alt of [v.portrait, v.poster, v.endingPhoto]) {
          assert.ok(
            !alt || !html.includes(escapeHtml(alt)),
            `${where}: unmet nightmare ${v.id} alt text leaked`,
          )
        }
        checks += 5
      }

      // Tab counts in the nav, the same on every scrapbook tab.
      if (TABS.includes(tab)) {
        assert.equal(navCount(html, 'nightmares'), String(met.size), where)
        assert.equal(
          navCount(html, 'endings'),
          `${new Set(scrapbook.endings).size}/${ENDING_KEYS.length}`,
          where,
        )
        assert.equal(navCount(html, 'friends'), String(friends.size), where)
        assert.equal(
          navCount(html, 'weeks'),
          String(scrapbook.runs.length),
          where,
        )
        checks += 4
      }

      if (tab === 'nightmares') {
        assert.equal(
          count(html, 'aria-label="Undiscovered nightmare"'),
          unmet.length,
          `${where}: one locked silhouette per unmet nightmare`,
        )
        assert.ok(
          html.includes(`${met.size}/${VILLAINS.length} nightmares met`),
        )
        checks += 2
      }
      if (tab === 'friends') {
        assert.equal(
          count(html, 'aria-label="Undiscovered friend"'),
          strangers.length,
          `${where}: one locked silhouette per unrecruited friend`,
        )
        for (const c of strangers) {
          assert.ok(
            !html.includes(`>${escapeHtml(c.name)}<`) &&
              !html.includes(`"${escapeHtml(c.name)}"`),
            `${where}: unrecruited friend name "${c.name}" leaked`,
          )
          checks += 1
        }
        checks += 1
      }
      // Every locked silhouette is generic: "???" and no name.
      const locked = html.match(
        /aria-label="Undiscovered (?:nightmare|friend|ending)"[\s\S]*?<\/div>\s*(?:<span[^>]*>([^<]*)<\/span>)?/g,
      )
      for (const slot of locked ?? []) {
        const label = slot.match(/<span[^>]*cs-label[^>]*>([^<]*)<\/span>\s*$/)
        if (!label) continue
        assert.equal(label[1]?.trim() ?? '', '???', `${where}: locked label`)
      }
    }
  }
  assert.ok(
    wallHookApplied,
    'the endings wall hook found `const wall = ref(false)`',
  )
  console.log(
    `Crystal Street scrapbook render: passed (${checks} checks over 3 saves: every tab, the endings wall, each locked nightmare selected)`,
  )
} finally {
  await server.close()
}
