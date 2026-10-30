import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CAPES_STYLE_CRITERIA,
  CAPES_STYLE_DESIGNER,
  CAPES_STYLE_DESIGNERS,
  CAPES_STYLE_LANES,
  CAPES_STYLE_SUBJECTS,
  capesStyleCellKey,
  capesStyleLaneFromModel,
} from '../capesStyleCheck'

assert.equal(CAPES_STYLE_SUBJECTS.length, 8)
assert.equal(CAPES_STYLE_LANES.length, 6)
assert.equal(CAPES_STYLE_CRITERIA.length, 4)
assert.equal(
  new Set(CAPES_STYLE_SUBJECTS.map((subject) => subject.seed)).size,
  8,
)
assert.equal(
  new Set(CAPES_STYLE_SUBJECTS.map((subject) => subject.key)).size,
  8,
)
assert.equal(new Set(CAPES_STYLE_LANES.map((lane) => lane.key)).size, 6)
assert.equal(
  new Set(
    CAPES_STYLE_SUBJECTS.flatMap((subject) =>
      CAPES_STYLE_LANES.map((lane) => capesStyleCellKey(subject.key, lane.key)),
    ),
  ).size,
  48,
)
assert.ok(CAPES_STYLE_DESIGNER.includes('Capes Style Check'))
assert.equal(CAPES_STYLE_DESIGNERS.length, 2)
assert.ok(
  CAPES_STYLE_SUBJECTS.some(
    (subject) => subject.key === 'academy-city-quad-map',
  ),
)
assert.ok(
  CAPES_STYLE_SUBJECTS.some(
    (subject) => subject.key === 'firewall-alert-portrait',
  ),
)
assert.deepEqual(
  new Set(CAPES_STYLE_LANES.map((lane) => lane.key)),
  new Set([
    'krea2',
    'arthemy',
    'nova-comic',
    'illustrij',
    'dreamshaper',
    'unstable',
  ]),
)
for (const lane of CAPES_STYLE_LANES) {
  assert.ok(
    !/furry|pony|flux/i.test(lane.model),
    lane.key + ' is an excluded model',
  )
  assert.equal(
    capesStyleLaneFromModel('models/' + lane.model + '.safetensors'),
    lane.key,
  )
}
assert.equal(capesStyleLaneFromModel('Flux2-Klein.gguf'), null)
assert.equal(capesStyleLaneFromModel('furrytoonmix_xlV3.safetensors'), null)
assert.equal(capesStyleLaneFromModel('ponyFaetality_v11.safetensors'), null)

const atlas = readFileSync(
  new URL('../../components/admin/capes-cast-atlas.vue', import.meta.url),
  'utf8',
)
assert.match(atlas, /data-testid="capes-cast-atlas"/)
assert.match(atlas, /data-testid="capes-cast-search"/)
assert.match(atlas, /IDENTITY_ARCS/)
assert.match(atlas, /henchmanForVillain/)
assert.match(atlas, /data-testid="capes-henchman-poster"/)
assert.match(atlas, /data-testid="capes-lieutenant-poster"/)
assert.match(atlas, /promArt\(group \+/)
assert.match(atlas, /campaignStagesFor/)
assert.match(atlas, /promArt\(identityArtKey/)
assert.match(atlas, /Not attached/)
assert.match(atlas, /48 PERMANENT CHARACTERS/)

const page = readFileSync(
  new URL('../../pages/admin/capes.vue', import.meta.url),
  'utf8',
)
const api = readFileSync(
  new URL('../../server/api/capes/style-check.get.ts', import.meta.url),
  'utf8',
)
const store = readFileSync(
  new URL('../../stores/capesStyleCheckStore.ts', import.meta.url),
  'utf8',
)
const channel = readFileSync(
  new URL('../../content/channels/admin/capes.md', import.meta.url),
  'utf8',
)
assert.match(page, /data-testid="capes-style-check"/)
assert.match(page, /data-testid="'capes-lane-' \+ lane.key"/)
assert.match(page, /store\.scoreFor/)
assert.match(page, /store\.noteFor/)
assert.match(page, /store\.imageFor/)
assert.match(api, /requireMachineUser/)
assert.match(api, /auth\.isAdmin/)
assert.match(api, /CAPES_STYLE_DESIGNERS\.map/)
assert.match(api, /requireMachineUser/)
assert.match(store, /loadJobImage/)
assert.match(store, /localStorage\.setItem/)
assert.match(channel, /route: \/admin\/capes/)
assert.match(channel, /requiredRole: ADMIN/)
assert.match(channel, /tabKey: capes/)
assert.match(page, /'capes-section-' \+ section.key/)
assert.match(page, /key: 'cast'/)
assert.match(page, /<CapesCastAtlas/)
assert.match(page, /data-testid="capes-model-proposals"/)
assert.match(page, /data-testid="capes-asset-plan"/)

console.log(
  'Capes style gate: 48 slots, six approved models, live jobs, scoring and cast atlas: OK',
)
