import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import {
  BIBLE_PINUP_SHOTS,
  bibleEnqueueBodies,
} from '../../server/utils/monstriqueBibleArt'
import { MONSTRIQUE_BIBLE_SEED } from '../../server/utils/monstriqueBibleSeed'
import { actionForAudience } from '../monstressConvention/edition'
import {
  availableTopics,
  newCase,
  performAction,
  travel,
  type CaseState,
} from '../monstressConvention/prologue'
import { BIBLE_LANES, LORA_STATUSES } from '../monstrique/bibleLanes'
import { CHARACTER_IDS, CHARACTER_MODELS } from '../monstrique/characterModels'

const repo = (path: string) =>
  readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

// Canon from Silas, 2026-11-10 PT.
const norb = CHARACTER_MODELS.norb
assert.ok(norb.sprite.hunch, 'Norb has the Quasimodo hump')
assert.equal(norb.sprite.shirt, 'MONSTRIQUE', 'Norb wears the MONSTRIQUE shirt')
assert.match(norb.silhouette, /Quasimodo/)
assert.match(norb.identity.join(' '), /Peter-Lorre/)
assert.ok(norb.never.includes('handsome') && norb.never.includes('cute'))
assert.match(norb.canonNotes!.join(' '), /easiest way to carry it/)
const iris = CHARACTER_MODELS.iris
assert.ok(iris.sprite.streak && iris.sprite.neckBandage)
assert.match(iris.identity.join(' '), /white streak/)
assert.match(iris.canonNotes!.join(' '), /necker/)
assert.match(iris.canonNotes!.join(' '), /tramp stamp/)
const stars = CHARACTER_IDS.filter((id) => CHARACTER_MODELS[id].monsterStar)
assert.deepEqual(
  [...stars].sort(),
  [
    'albina',
    'blobzo',
    'cleo',
    'draculina',
    'francesca',
    'laguna',
    'nyx',
    'roxie',
    'siobhan',
    'vespa',
  ],
  'all ten monster women have sheets',
)
assert.doesNotMatch(
  JSON.stringify(CHARACTER_MODELS.draculina),
  /kill|murder|villain|culprit/i,
)

// Running jokes in the engine.
function act(
  state: CaseState,
  verb: Parameters<typeof performAction>[1]['verb'],
  target: string,
  topic?: string,
) {
  const result = performAction(state, { verb, target, topic })
  assert.equal(
    result.changed,
    true,
    `${verb} ${target} ${topic ?? ''}: ${result.line}`,
  )
  return result.state
}
let s = travel(newCase(), 'front-office').state
s = travel(s, 'balcony').state
s = travel(s, 'investigators-room').state
s = act(s, 'look', 'nico')
assert.ok(s.topics.includes('norb-shirt'))
s = act(s, 'ask', 'nico', 'norb-shirt')
assert.match(s.transcript.at(-1)!, /most efficient way to carry it/)
s = act(s, 'talk', 'nico')
s = act(s, 'ask', 'nico', 'iris-neck')
assert.match(s.transcript.at(-1)!, /real necker/)
assert.ok(!availableTopics(s, 'nico').includes('workplace-conduct'))
for (let n = 0; n < 3; n += 1) s = act(s, 'flirt', 'nico')
assert.ok(availableTopics(s, 'nico').includes('workplace-conduct'))
s = act(s, 'ask', 'nico', 'workplace-conduct')
assert.match(s.transcript.at(-1)!, /sexual harassment/)
s = act(s, 'ask', 'nico', 'power-structures')
assert.match(
  s.transcript.at(-1)!,
  /class-based society|leverage is not ownership/,
)
assert.match(s.transcript.at(-1)!, /unionise/)
const general = actionForAudience(
  s,
  { verb: 'ask', target: 'nico', topic: 'iris-neck' },
  'general',
)
assert.equal(
  general.changed,
  false,
  'necker jokes stay out of the general edition',
)

// Bible art recipes: mature, private, adult, never explicit.
for (const id of stars) {
  for (const kind of ['swimsuit', 'shower'] as const) {
    const bodies = bibleEnqueueBodies(
      id,
      kind,
      BIBLE_LANES.map((lane) => lane.key),
    )
    assert.equal(bodies.length, BIBLE_LANES.length)
    for (const { body } of bodies) {
      assert.equal(body.isMature, true)
      assert.equal(body.isPublic, false)
      assert.equal(body.projectSlug, 'monstress-convention')
      assert.match(String(body.promptString), /every character an adult/)
      assert.match(String(body.negativePrompt), /\bnude\b/)
      assert.match(String(body.negativePrompt), /\bchild\b/)
      assert.match(String(body.negativePrompt), /\bnipples\b/)
    }
  }
}
assert.throws(() => bibleEnqueueBodies('iris', 'swimsuit', ['arthemy']))
assert.throws(() => bibleEnqueueBodies('norb', 'shower', ['krea2']))
assert.throws(() => bibleEnqueueBodies('cleo', 'portrait', []))
const dataset = bibleEnqueueBodies('iris', 'lora-dataset', [])
assert.equal(dataset.length, 10)
assert.ok(dataset.every(({ body }) => body.isMature === false))
const portrait = bibleEnqueueBodies('norb', 'portrait', ['arthemy'])
assert.equal(portrait[0]!.body.checkpoint, BIBLE_LANES[0]!.checkpoint)
assert.ok(BIBLE_LANES.some((lane) => /arthemy/i.test(lane.checkpoint ?? '')))
assert.ok(BIBLE_LANES.some((lane) => lane.engine === 'krea2'))
assert.ok(LORA_STATUSES.includes('dataset-requested'))

// First batches: pin-ups on 7 lanes (Miaomiao 3D out) and 10 softcore unlocks.
assert.equal(MONSTRIQUE_BIBLE_SEED.length, 170)
assert.ok(
  !BIBLE_LANES.some((lane) => lane.key === 'miaomiao3d'),
  'Miaomiao 3D broke the age and body rules and stays out',
)
assert.ok(!MONSTRIQUE_BIBLE_SEED.some((row) => row.lane === 'miaomiao3d'))

// Softcore unlocks (Silas 2026-11-11): one nudity lane, mature/private/adult,
// nudity allowed but explicit sex acts excluded; other lanes refuse it.
const nudityLanes = BIBLE_LANES.filter((lane) => lane.nudity)
assert.deepEqual(nudityLanes.map((lane) => lane.key).sort(), [
  'arthemy',
  'furrytoon',
  'realism-by',
])
assert.throws(() => bibleEnqueueBodies('nyx', 'softcore', ['krea2', 'ntrmix']))
assert.throws(() => bibleEnqueueBodies('iris', 'softcore', ['realism-by']))
for (const id of stars) {
  const [softcore] = bibleEnqueueBodies(id, 'softcore', ['realism-by', 'krea2'])
  assert.ok(softcore && softcore.lane === 'realism-by')
  assert.equal(softcore.body.isMature, true)
  assert.equal(softcore.body.isPublic, false)
  const negative = String(softcore.body.negativePrompt)
  assert.match(negative, /\bchild\b/)
  assert.match(negative, /\bminor\b/)
  assert.match(negative, /\bteen\b/)
  assert.match(negative, /\(penetration:1\.5\)/)
  assert.doesNotMatch(negative, /\(nipples:/)
  assert.match(String(softcore.body.promptString), /mature female/)
  assert.match(String(softcore.body.promptString), /every character an adult/)
}
assert.equal(
  MONSTRIQUE_BIBLE_SEED.filter((row) => row.kind === 'softcore').length,
  30,
)
assert.ok(
  MONSTRIQUE_BIBLE_SEED.filter((row) => row.kind === 'softcore').every((row) =>
    nudityLanes.some((lane) => lane.key === row.lane),
  ),
)
assert.match(
  String(
    bibleEnqueueBodies('nyx', 'shower', ['arthemy'])[0]!.body.negativePrompt,
  ),
  /\(nipples:1\.6\)/,
)
assert.ok(
  MONSTRIQUE_BIBLE_SEED.every(
    (row) =>
      CHARACTER_MODELS[row.character as keyof typeof CHARACTER_MODELS]
        ?.monsterStar,
  ),
)

// Gating and the client bundle.
const gate = repo('server/utils/monstriqueBible.ts')
assert.match(gate, /requireAdminApiUser\(event\)/)
assert.match(gate, /viewerShowsMature\(auth\.user\)/)
for (const route of [
  'server/api/monstrique/bible/index.get.ts',
  'server/api/monstrique/bible/[key].patch.ts',
  'server/api/monstrique/bible/[key]/request.post.ts',
]) {
  const source = repo(route)
  assert.match(source, /await requireMonstriqueStudio\(event\)/, route)
  assert.doesNotMatch(source, /getQuery\(/, route)
}
assert.match(
  repo('server/api/monstrique/bible/index.get.ts'),
  /'Cache-Control', 'private, no-store'/,
)
// Silas 2026-11-11: "our monstrique and monstrique bible should be one link."
const channel = repo('content/channels/admin/monstress-convention.md')
assert.match(channel, /requiredRole: ADMIN/)
assert.match(channel, /requiredPermission: mature/)
assert.match(channel, /route: \/admin\/monstrique\n/)
assert.match(channel, /label: Monstrique Studio/)
assert.match(channel, /^image: \/monstrique\/front\/studio-card\.webp$/m)
readFileSync(
  new URL('../../public/monstrique/front/studio-card.webp', import.meta.url),
)
assert.ok(
  !readdirSync(
    new URL('../../content/channels/admin', import.meta.url),
  ).includes('monstrique-bible.md'),
  'one admin link for the preview and the bible',
)
const studio = repo('pages/admin/monstrique.vue')
assert.match(
  studio,
  /caseStore\.authorized && user\.isAdmin && user\.showMature/,
)
assert.match(studio, /<MonstriqueSeriesBible v-if="view === 'bible'" \/>/)
assert.match(
  repo('pages/admin/monstrique-bible.vue'),
  /navigateTo\('\/admin\/monstrique\?view=bible'/,
)

function walk(dir: string): string[] {
  return readdirSync(new URL('../../' + dir, import.meta.url)).flatMap(
    (name) => {
      const path = dir + '/' + name
      return statSync(new URL('../../' + path, import.meta.url)).isDirectory()
        ? walk(path)
        : [path]
    },
  )
}
const clientFiles = ['components', 'stores', 'pages', 'utils/monstrique']
  .flatMap(walk)
  .filter((path) => /\.(vue|ts)$/.test(path))
for (const path of clientFiles) {
  const source = repo(path)
  assert.doesNotMatch(source, /monstriqueBibleArt|monstriqueBibleSeed/, path)
  assert.ok(!source.includes(BIBLE_PINUP_SHOTS.shower.tags), path)
}

console.log(
  'Monstrique series bible: canon, running jokes, gated routes, mature recipes and first pin-up batch passed',
)
