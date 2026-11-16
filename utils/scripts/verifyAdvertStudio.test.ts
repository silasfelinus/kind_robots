// /utils/scripts/verifyAdvertStudio.test.ts
//
// Advert Studio contract (pages/admin/adverts.vue): the poster registry, its
// art slots and default art, the admin tab, the render-sync route, and the
// rule that the store, not the components, talks to the API.
//
//   npx tsx utils/scripts/verifyAdvertStudio.test.ts
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  ADVERT_EDIT_FIELDS,
  ADVERT_MAX_CHIPS,
  ADVERT_POSTERS,
  ADVERT_PROJECT_SLUG,
  ADVERT_SLOT_KEYS,
  ADVERT_SLOT_KEY_PATTERN,
  advertEditDescription,
  advertPlayPath,
  advertEditMarker,
  advertEditTitle,
  advertFontStylesheetUrl,
  advertPromptNegations,
  advertRequestKey,
  advertSlotByKey,
  advertSlots,
  parseAdvertSlotKey,
  slotKeyFromAdvertRequestKey,
} from '../adverts/posters'
import {
  normalizeTutorialPath,
  normalizeTutorialText,
  publicTutorialText,
  TUTORIAL_NOTE_LIMIT,
} from '../../server/utils/tutorialNotes'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'
import { normalizeArtRequestKey } from '../../server/utils/artRequestKey'
import { normalizeSlotKey } from '../../server/utils/artSlotRules'

const ROOT = process.cwd()
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8')

const EXPECTED_SLUGS = [
  'arcade',
  'slime-city',
  'emperor-of-dust',
  'memory-dungeon',
  'crystal-street',
  'prom-of-doom',
  'space-couch',
  'hybridizer',
  'the-elevator-only-goes-down',
  'ecotone',
  'rainbow-princess',
  'save-the-plumber',
  'zuzu-gamebook',
  'shifting-lands',
  'aquarium',
  'ruler-hooked',
]

assert.equal(ADVERT_POSTERS.length, 16, 'sixteen advert posters')
assert.deepEqual(
  ADVERT_POSTERS.map((p) => p.slug).sort(),
  [...EXPECTED_SLUGS].sort(),
  'the poster set is the Arcade plus the fifteen Play games',
)
assert.equal(
  new Set(ADVERT_POSTERS.map((p) => p.slug)).size,
  16,
  'poster slugs are unique',
)

assert.ok(ADVERT_SLOT_KEYS.length >= 16 * 3, 'every poster has card slots')
assert.equal(
  new Set(ADVERT_SLOT_KEYS).size,
  ADVERT_SLOT_KEYS.length,
  'slot keys are unique',
)

const storeSource = read('stores/advertStore.ts')
const bundledGlob = storeSource.match(
  /import\.meta\.glob<string>\(\s*\[([\s\S]*?)\]/,
)
assert.ok(bundledGlob, 'the store globs the bundled poster art')
const bundledPaths = [...(bundledGlob?.[1] ?? '').matchAll(/'([^']+)'/g)].map(
  (m) => m[1],
)
assert.ok(bundledPaths.length > 0, 'the bundled poster art glob lists files')

function assertDefaultSource(src: string, where: string): void {
  if (/^\/api\/art\/images\/\d+\/file$/.test(src)) return
  if (src.startsWith('/images/')) return
  if (src.startsWith('asset:')) {
    const rel = src.slice('asset:'.length)
    assert.ok(
      existsSync(join(ROOT, 'assets/images', rel)),
      `${where}: bundled asset assets/images/${rel} exists`,
    )
    assert.ok(
      bundledPaths.includes(`../assets/images/${rel}`),
      `${where}: bundled asset ${rel} is in the store's import.meta.glob`,
    )
    return
  }
  assert.ok(src.startsWith('/'), `${where}: ${src} is a same-origin path`)
  assert.ok(
    existsSync(join(ROOT, 'public', src.split('?')[0]!)),
    `${where}: public${src} exists`,
  )
}

for (const poster of ADVERT_POSTERS) {
  const where = `poster ${poster.slug}`
  assert.ok(poster.name.trim(), `${where}: name`)
  assert.ok(poster.copy.title.trim(), `${where}: title is non-empty`)
  assert.ok(poster.copy.statValue.trim(), `${where}: stat value`)
  assert.ok(poster.copy.statUnit.trim(), `${where}: stat unit`)
  assert.ok(poster.copy.hook.trim(), `${where}: hook`)
  assert.ok(poster.copy.hookHighlight.trim(), `${where}: hook highlight`)
  assert.ok(poster.copy.blurb.trim(), `${where}: blurb`)
  assert.ok(
    poster.copy.chips.length > 0 &&
      poster.copy.chips.length <= ADVERT_MAX_CHIPS,
    `${where}: 1-${ADVERT_MAX_CHIPS} chips`,
  )
  assert.ok(poster.copy.strip.length >= 3, `${where}: stat strip`)
  assert.ok(poster.path.startsWith('/'), `${where}: URL path starts with /`)
  assert.ok(
    /^[a-z0-9][a-z0-9-]*$/.test(poster.conductorSlug),
    `${where}: conductor slug`,
  )
  for (const color of Object.values(poster.palette))
    assert.match(color, /^#[0-9a-f]{6}$/i, `${where}: palette color ${color}`)
  assert.equal(poster.cards.length, 3, `${where}: three cards`)
  assert.ok(
    Boolean(poster.hero) !== poster.wall.length > 0,
    `${where}: either a hero slot or a fixed wall`,
  )
  for (const src of poster.wall)
    assert.match(src, /^\/images\//, `${where}: wall art is site-served`)

  const slots = advertSlots(poster)
  for (const slot of slots) {
    const slotWhere = `${where} ${slot.name}`
    assert.match(
      slot.key,
      /^adverts\/[a-z0-9-]+\/(hero|card-[123])$/,
      `${slotWhere}: slot key shape`,
    )
    assert.ok(ADVERT_SLOT_KEY_PATTERN.test(slot.key))
    assert.equal(
      normalizeSlotKey(slot.key),
      slot.key,
      `${slotWhere}: valid art slot key`,
    )
    assert.deepEqual(parseAdvertSlotKey(slot.key), {
      posterSlug: poster.slug,
      slotName: slot.name,
    })
    assert.equal(advertSlotByKey(slot.key)?.slot, slot)
    assertDefaultSource(slot.defaultSrc, slotWhere)
    assert.deepEqual(
      advertPromptNegations(slot.prompt),
      [],
      `${slotWhere}: default prompt is positive-only`,
    )
    assert.deepEqual(
      checkArtPromptContract({ prompt: slot.prompt, engine: 'krea2' }).map(
        (v) => v.rule,
      ),
      [],
      `${slotWhere}: default prompt passes the art prompt contract`,
    )
    const requestKey = advertRequestKey(slot.key, 'm3k9x2')
    assert.equal(normalizeArtRequestKey(requestKey), requestKey)
    assert.equal(slotKeyFromAdvertRequestKey(requestKey), slot.key)
    assert.equal(
      `${slot.width}x${slot.height}`,
      slot.name === 'hero' ? '1344x768' : '1024x1024',
      `${slotWhere}: render size`,
    )
  }
}

assert.equal(slotKeyFromAdvertRequestKey('conductor:x#y@z'), null)
assert.equal(slotKeyFromAdvertRequestKey('advert-studio:adverts/../x@1'), null)
assert.equal(slotKeyFromAdvertRequestKey(42), null)
assert.deepEqual(advertPromptNegations('a fox, no text, without hats'), [
  'no',
  'without',
])

const hybridizer = ADVERT_POSTERS.find((p) => p.slug === 'hybridizer')!
assert.ok(
  hybridizer.copy.chips.includes('BROWSE FREE') &&
    hybridizer.copy.chips.includes('NO ACCOUNT NEEDED'),
  'Hybridizer chips say browsing is free without an account',
)
const elevator = ADVERT_POSTERS.find(
  (p) => p.slug === 'the-elevator-only-goes-down',
)!
assert.equal(elevator.path, '/shifting-desks')
assert.equal(elevator.conductorSlug, 'shifting-desks')
assert.equal(
  `${elevator.copy.title} ${elevator.copy.title2}`,
  'The Elevator Only Goes Down',
)
assert.ok(
  !ADVERT_POSTERS.some((p) => /shifting desks/i.test(p.copy.title + p.name)),
  'no poster is still titled Shifting Desks',
)
assert.equal(
  ADVERT_POSTERS.find((p) => p.slug === 'slime-city')!.hero!.defaultSrc,
  '/api/art/images/272640/file',
)
assert.equal(
  ADVERT_POSTERS.find((p) => p.slug === 'crystal-street')!.hero!.defaultSrc,
  '/api/art/images/272634/file',
)
const arcade = ADVERT_POSTERS.find((p) => p.slug === 'arcade')!
assert.equal(arcade.variant, 'arcade')
assert.equal(arcade.copy.statValue, '36')
assert.equal(new Set(arcade.wall).size, 33, 'the Arcade wall shows 33 cabinets')

const fontUrl = advertFontStylesheetUrl()
for (const poster of ADVERT_POSTERS)
  assert.ok(
    fontUrl.includes(`family=${poster.type.fontQuery}`),
    `${poster.slug}: its title font is in the stylesheet`,
  )

const edit = advertEditDescription(arcade, 'stat', 'Make it 40 games')
assert.ok(edit.includes(advertEditMarker('arcade')))
assert.ok(edit.includes('Field: stat'))
assert.ok(edit.includes('Make it 40 games'))
assert.equal(advertEditTitle('  \nBigger title\nmore'), 'Advert: Bigger title')
assert.ok(advertEditTitle('x'.repeat(300)).length <= 120)
assert.deepEqual(
  [...ADVERT_EDIT_FIELDS],
  ['headline', 'stat', 'chips', 'cards', 'colors', 'other'],
)

const tab = read('content/channels/admin/adverts.md')
assert.match(tab, /\nchannelKey: admin\n/)
assert.match(tab, /\ntabKey: adverts\n/)
assert.match(tab, /\nlabel: Advert Studio\n/)
assert.match(tab, /\nroute: \/admin\/adverts\n/)
assert.match(
  tab,
  /\nrequiredRole: ADMIN\n/,
  'the Advert Studio tab is admin-only',
)
assert.doesNotMatch(tab, /\nnavigation: false\n/)
const icon = tab.match(/\nicon: kind-icon:([a-z0-9-]+)\n/)?.[1]
assert.ok(
  icon && existsSync(join(ROOT, 'assets/icons', `${icon}.svg`)),
  'tab icon exists',
)
assert.ok(existsSync(join(ROOT, 'pages/admin/adverts.vue')))

const advertPage = read('pages/admin/adverts.vue')
assert.match(
  advertPage,
  /overflow-hidden md:flex-row/,
  'tablet advert view places the poster beside the editor',
)
assert.match(
  advertPage,
  /kr-scroll min-h-0 flex-1 flex-col/,
  'the editor owns bounded scrolling',
)
assert.match(
  advertPage,
  /bg-base-100\/95/,
  'the editor has its own high-contrast reading surface',
)
assert.match(
  advertPage,
  /md:w-\[23rem\]/,
  'the tablet editor stays compact beside the artwork',
)
assert.match(
  advertPage,
  /@media \(min-width: 768px\)/,
  'the poster stage switches sizing at tablet width',
)
assert.match(
  advertPage,
  /min-height: 0;\n\s+overflow: hidden;/,
  'the preview cannot spill into the control deck',
)

const sync = read('server/api/adverts/art/sync.post.ts')
assert.match(sync, /requireAdminApiUser\(event\)/, 'sync route is admin-only')
assert.match(sync, /registerCandidates\(/, 'sync route registers candidates')
assert.match(sync, /selectIfEmpty: false/, 'sync never chooses for the admin')
assert.match(sync, /projectSlug: ADVERT_PROJECT_SLUG/)
assert.match(sync, /status: 'DONE'/)
assert.match(sync, /errorHandler\(error\)/)
assert.match(sync, /event\.node\.res\.statusCode =/)
assert.equal(ADVERT_PROJECT_SLUG, 'adverts')

assert.match(storeSource, /\/api\/art\/slots\/selected\?prefix=/)
assert.match(storeSource, /'\/api\/art\/enqueue'/)
assert.match(storeSource, /requestKey: advertRequestKey\(/)
assert.match(storeSource, /projectSlug: ADVERT_PROJECT_SLUG/)
assert.match(storeSource, /'\/api\/adverts\/art\/sync'/)
assert.match(storeSource, /category: 'AGENT'/)
assert.match(storeSource, /scale: ADVERT_EXPORT_PIXEL_RATIO/)
assert.match(storeSource, /import\('modern-screenshot'\)/)

const FETCHES =
  /\$fetch|performFetch|useFetch|\bfetch\(|localStorage|sessionStorage/
const uiFiles = [
  'pages/admin/adverts.vue',
  ...readdirSync(join(ROOT, 'components/adverts')).map(
    (file) => `components/adverts/${file}`,
  ),
]
for (const file of uiFiles)
  assert.doesNotMatch(
    read(file),
    FETCHES,
    `${file} leaves API calls to the store`,
  )

const pkg = JSON.parse(read('package.json')) as {
  dependencies?: Record<string, string>
}
assert.ok(
  pkg.dependencies?.['modern-screenshot'],
  'modern-screenshot is a dependency',
)

assert.equal(normalizeTutorialPath('/play/slime-city'), '/play/slime-city')
assert.equal(normalizeTutorialPath('/'), '/')
assert.throws(() => normalizeTutorialPath('/play/../private'))
assert.throws(() => normalizeTutorialPath('/play/slime-city?admin=true'))
assert.throws(() => normalizeTutorialPath('//example.com'))
assert.equal(normalizeTutorialText('  Roadmap draft  '), 'Roadmap draft')
assert.throws(() => normalizeTutorialText('x'.repeat(TUTORIAL_NOTE_LIMIT + 1)))
assert.equal(publicTutorialText('/play/slime-city', 'Published'), 'Published')
assert.equal(publicTutorialText('/admin/adverts', 'Private'), '')
assert.equal(publicTutorialText('/play/slime-city', null), '')
const publicNoteRoute = read('server/api/tutorial-notes/index.get.ts')
assert.match(publicNoteRoute, /hasRecord: Boolean\(note\)/)
const tutorialNotesStore = read('stores/tutorialNotesStore.ts')
assert.match(
  tutorialNotesStore,
  /overrides.value\[path\] = response.data.hasRecord/,
)
assert.match(tutorialNotesStore, /overrides.value\[path\] = true/)

const publicSelections = read('server/api/adverts/public-art.get.ts')
assert.match(publicSelections, /isPublic: true/)
assert.match(publicSelections, /isMature: false/)
assert.match(publicSelections, /isActive: true/)
assert.match(storeSource, /async function loadPublicSelections/)
assert.match(storeSource, /'\/api\/adverts\/public-art'/)

const publicHighlights = read('components/home/home-visitor-directory.vue')
assert.match(publicHighlights, /data-testid="visitor-poster-toggle"/)
assert.match(publicHighlights, /data-testid="visitor-poster-gallery"/)
assert.match(publicHighlights, /advertPlayPath\(view.poster\)/)
assert.match(publicHighlights, /advertStore.loadPublicSelections\(\)/)

const tutorialSheet = read('components/navigation/workspace-sheet.vue')
assert.match(tutorialSheet, /data-testid="workspace-game-poster"/)
assert.match(tutorialSheet, /data-testid="workspace-silas-says"/)
assert.match(tutorialSheet, /data-testid="workspace-conversation"/)
assert.match(tutorialSheet, /data-testid="silas-says-edit"/)
assert.match(tutorialSheet, /data-testid="silas-says-save-draft"/)
assert.match(tutorialSheet, /data-testid="silas-says-publish"/)
assert.match(tutorialSheet, /tutorialNotesStore.save\(/)
assert.match(read('stores/tutorialNotesStore.ts'), /loadEditor\(path:/)
assert.match(
  read('server/api/admin/tutorial-notes/index.get.ts'),
  /requireAdminApiUser\(event\)/,
)
assert.match(
  read('server/api/admin/tutorial-notes/index.put.ts'),
  /requireAdminApiUser\(event\)/,
)
assert.match(
  read('server/api/tutorial-notes/index.get.ts'),
  /publishedText: true/,
)
assert.match(read('server/utils/tutorialNotes.ts'), /publicTutorialText/)
assert.match(tutorialSheet, /reaction-category="PROJECT"/)
assert.match(tutorialSheet, /advertStore.loadPublicSelections\(\)/)
assert.match(
  read('content.config.ts'),
  /silasSays: z\.string\(\)\.optional\(\)/,
)
assert.match(
  read('stores/helpers/channelContent.ts'),
  /silasSays: text\(item.silasSays\)/,
)
assert.match(read('content/silas.md'), /navigation: false/)
for (const poster of ADVERT_POSTERS)
  assert.equal(
    advertPlayPath(poster),
    `/play${poster.path}`,
    `${poster.slug}: visitor poster opens its game`,
  )

console.log(
  `Advert Studio contract passed: ${ADVERT_POSTERS.length} posters, ${ADVERT_SLOT_KEYS.length} art slots.`,
)
