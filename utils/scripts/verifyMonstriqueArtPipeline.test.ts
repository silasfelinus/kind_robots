import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  GENERAL_INTRO,
  MATURE_INTRO,
  actionForAudience,
  roomForAudience,
  travelForAudience,
  type MonstriqueAudience,
} from '../monstressConvention/edition'
import {
  HOTEL_ROOMS,
  caseScore,
  maxScore,
  newCase,
  performAction,
  travel,
  type CaseState,
  type RoomId,
  type Verb,
} from '../monstressConvention/prologue'
import {
  ART_STYLES,
  composeCharacterPrompt,
  composeShotPrompt,
  loraDatasetPlan,
  type ArtStyleId,
} from '../monstrique/artStyles'
import {
  CHARACTER_IDS,
  CHARACTER_MODELS,
  LORA_DATASET_SHOTS,
  modelForHotspot,
  speakerOf,
} from '../monstrique/characterModels'
import {
  CUTSCENES,
  coldOpen,
  cutsceneTriggeredBy,
  cutscenesFor,
} from '../monstrique/cutscenes'

const styles = Object.keys(ART_STYLES) as ArtStyleId[]
const audiences: MonstriqueAudience[] = ['general', 'mature']

// Model sheets: adults, unique LoRA triggers, spoiler-free.
const triggers = new Set<string>()
for (const id of CHARACTER_IDS) {
  const model = CHARACTER_MODELS[id]
  assert.equal(model.id, id)
  assert.match(model.apparentAge, /adult|mature/i, id + ' is stated adult')
  assert.match(model.lora.trigger, /^mnstq_[a-z]+$/)
  assert.ok(!triggers.has(model.lora.trigger), 'unique trigger ' + id)
  triggers.add(model.lora.trigger)
  assert.ok(model.identity.length >= 3, id + ' has identity traits')
  assert.ok(model.sprite.height > 0.5 && model.sprite.height < 1.5)
  assert.equal(model.lora.status, 'dataset-needed')
}
assert.ok(
  CHARACTER_MODELS.norb.sprite.height < CHARACTER_MODELS.iris.sprite.height,
  'Norb is short',
)
assert.ok(
  CHARACTER_MODELS.norb.never.includes('handsome'),
  'Norb is never drawn handsome',
)
assert.ok(
  CHARACTER_MODELS.albina.never.includes('human face'),
  'Albina keeps crocodilian anatomy',
)
assert.doesNotMatch(
  JSON.stringify(CHARACTER_MODELS.draculina),
  /kill|murder|villain|culprit|guilty/i,
  'Draculina metadata carries no spoiler',
)
assert.doesNotMatch(
  JSON.stringify(CUTSCENES) + JSON.stringify(coldOpen('mature')),
  /draculina did|killer is|culprit/i,
  'cutscene scripts carry no spoiler',
)

// Every talkable engine character has a model sheet and a speaker tag.
for (const room of Object.values(HOTEL_ROOMS)) {
  for (const hotspot of room.hotspots) {
    if (!hotspot.verbs.includes('talk')) continue
    const model = modelForHotspot(hotspot.id)
    assert.ok(model, 'model sheet for talkable ' + hotspot.id)
  }
}
assert.equal(speakerOf('Norb: Do not touch that.')?.id, 'norb')
assert.equal(speakerOf('Dolores: Sweetie.')?.id, 'dolores')
assert.equal(speakerOf('Odette: Darling.')?.id, 'odette')
assert.equal(speakerOf('Iris pockets the purse.'), null)
assert.equal(speakerOf('You look at the sign.'), null)

// Prompt composition across styles and editions.
for (const id of CHARACTER_IDS) {
  for (const style of styles) {
    const mature = composeCharacterPrompt({
      character: id,
      style,
      audience: 'mature',
      expression: 'smirk',
    })
    assert.ok(mature, `${id} renders in ${style} for mature`)
    assert.ok(mature.promptString.includes(CHARACTER_MODELS[id].lora.trigger))
    assert.match(mature.negativePrompt, /\bchild\b/)
    assert.match(mature.negativePrompt, /\bminor\b/)
    assert.equal(mature.isPublic, false)
    assert.equal(mature.projectSlug, 'monstress-convention')
    assert.deepEqual(mature.loras, [], 'no LoRA stacked before training')
    const general = composeCharacterPrompt({
      character: id,
      style,
      audience: 'general',
    })
    if (ART_STYLES[style].matureOnly || !CHARACTER_MODELS[id].general)
      assert.equal(general, null, `${id}/${style} withheld from general`)
    else {
      assert.ok(general)
      assert.equal(general.isMature, false)
    }
  }
}
assert.equal(ART_STYLES['adventure-2d'].medium, '2d')
assert.equal(ART_STYLES['cutscene-3d'].medium, '3d')

// Cutscenes: one script, any medium.
for (const audience of audiences) {
  const open = coldOpen(audience)
  const cards = audience === 'mature' ? MATURE_INTRO : GENERAL_INTRO
  assert.equal(open.shots.length, cards.length)
  open.shots.forEach((shot, index) => {
    assert.equal(shot.caption, cards[index]!.text)
    assert.equal(shot.title, cards[index]!.title)
  })
  for (const scene of [open, ...cutscenesFor(audience)]) {
    assert.ok(scene.shots.length > 0)
    for (const shot of scene.shots) {
      assert.ok(shot.camera.seconds > 0 && shot.camera.lensMm > 0)
      for (const style of [
        'adventure-2d',
        'cutscene-3d',
        'storyboard',
      ] as const) {
        const request = composeShotPrompt(shot, style, audience)
        assert.ok(request, `${shot.id} renders as ${style} for ${audience}`)
        assert.equal(request.isMature, false)
        assert.match(request.promptString, /every character an adult/)
        for (const slot of shot.cast) {
          assert.ok(
            request.promptString.includes(
              CHARACTER_MODELS[slot.character].lora.trigger,
            ),
          )
          if (slot.living && CHARACTER_MODELS[slot.character].sprite.ghost)
            assert.match(request.negativePrompt, /\bghost\b/)
        }
      }
      assert.equal(composeShotPrompt(shot, 'scrapbook-pinup', 'general'), null)
    }
    if (audience === 'general')
      assert.doesNotMatch(
        JSON.stringify(scene),
        /\bsex|prostitute|\bgin\b|frisky|kiss/i,
        scene.id + ' is general-safe',
      )
  }
}
assert.ok(cutscenesFor('mature').some((scene) => scene.id === 'cold-kiss'))
assert.ok(!cutscenesFor('general').some((scene) => scene.id === 'cold-kiss'))
assert.ok(CUTSCENES.every((scene) => scene.trigger !== null))

// LoRA datasets: neutral model sheets, captioned with the trigger.
for (const id of CHARACTER_IDS) {
  const plan = loraDatasetPlan(id)
  assert.equal(plan.length, LORA_DATASET_SHOTS.length)
  assert.equal(
    new Set(plan.map((entry) => entry.request.seed)).size,
    plan.length,
  )
  for (const entry of plan) {
    assert.ok(entry.caption.startsWith(CHARACTER_MODELS[id].lora.trigger + ','))
    assert.equal(entry.request.isMature, false)
    assert.match(entry.request.promptString, /model sheet/)
  }
}

// Sierra score, narrator quips, wrong-item jokes and cutscene triggers.
assert.equal(maxScore('mature'), 205)
assert.ok(maxScore('general') < 205)
assert.equal(caseScore(newCase()), 0)

function step(
  state: CaseState,
  audience: MonstriqueAudience,
  verb: Verb,
  target: string,
  extra: { topic?: string; item?: string } = {},
): CaseState {
  const result = actionForAudience(state, { verb, target, ...extra }, audience)
  assert.equal(result.changed, true, `${verb} ${target}: ${result.line}`)
  return result.state
}
function go(state: CaseState, audience: MonstriqueAudience, room: RoomId) {
  const result = travelForAudience(state, room, audience)
  assert.equal(result.changed, true, result.line)
  return result.state
}

for (const audience of audiences) {
  let s = newCase(7)
  s = step(s, audience, 'photograph', 'billboard')
  assert.equal(caseScore(s), 2)
  s = go(s, audience, 'front-office')
  s = step(s, audience, 'look', 'guest-ledger')
  s = step(s, audience, 'talk', 'marta')
  s = step(s, audience, 'ask', 'marta', { topic: 'room-access' })
  const bribe = actionForAudience(
    s,
    { verb: 'use', target: 'marta', item: 'motel-key' },
    audience,
  )
  assert.equal(bribe.changed, false)
  s = go(s, audience, 'balcony')
  s = go(s, audience, 'odette-room')
  const before = s
  s = step(s, audience, 'talk', 'odette-ghost')
  assert.equal(cutsceneTriggeredBy(before, s, audience)?.id, 'the-client')
  assert.equal(cutsceneTriggeredBy(s, s, audience), null, 'never replays')
  s = step(s, audience, 'take', 'odette-purse')
  s = go(s, audience, 'balcony')
  s = go(s, audience, 'front-office')
  const joke = actionForAudience(
    s,
    { verb: 'use', target: 'marta', item: 'odette-purse' },
    audience,
  )
  assert.equal(joke.changed, false)
  assert.match(joke.line, /Bribes go through the front desk/)
  const narrated = actionForAudience(
    s,
    { verb: 'take', target: 'guest-ledger' },
    audience,
  )
  assert.equal(narrated.changed, false)
  assert.match(narrated.line, /guest register/)
  assert.ok(caseScore(s) > 2)
}

const vendingGeneral = roomForAudience('ice-alcove', 'general')
assert.ok(!vendingGeneral.hotspots.some((h) => h.id === 'vending-machine'))
assert.ok(
  !roomForAudience('investigators-room', 'general').hotspots.some(
    (h) => h.id === 'bedspread',
  ),
)
let m = travel(newCase(), 'ice-alcove').state
const bought = performAction(m, { verb: 'use', target: 'vending-machine' })
assert.equal(bought.changed, true)
m = bought.state
assert.ok(m.inventory.includes('garlic-protection'))
assert.equal(caseScore(m), 3)
assert.equal(
  performAction(m, { verb: 'use', target: 'vending-machine' }).changed,
  false,
)
m = travel(m, 'balcony').state
m = travel(m, 'investigators-room').state
const garlic = performAction(m, {
  verb: 'use',
  target: 'nico',
  item: 'garlic-protection',
})
assert.match(garlic.line, /two layers of protection/)

// The scene stages the cast, plays cutscenes and shows the score.
const scene = readFileSync(
  new URL(
    '../../components/monstress-convention/monstress-convention-scene.vue',
    import.meta.url,
  ),
  'utf8',
)
assert.match(
  scene,
  /<MonstriqueCutscenePlayer[\s\S]*:director="!publicEdition"/,
)
assert.match(scene, /data-testid="monstrique-score"/)
assert.match(scene, /data-testid="monstrique-stage-cast"/)
assert.match(scene, /data-testid="monstrexx-cold-open"/)
assert.match(scene, /story\.activeCutscene/)

// Painted title splash: general art is static, mature art is server-gated.
const repoFile = (path: string) =>
  readFileSync(new URL('../../' + path, import.meta.url), 'utf8')
const splashRoute = repoFile('server/api/monstrique/splash.get.ts')
assert.match(splashRoute, /'Cache-Control', 'private, no-store'/)
assert.match(
  splashRoute,
  /auth\?\.kind === 'jwt' && viewerShowsMature\(auth\?\.user\)/,
)
assert.match(splashRoute, /isMature: true/)
assert.doesNotMatch(splashRoute, /getQuery\(|readBody\(/)
const front = repoFile('components/monstrexx/monstrexx-front.vue')
assert.match(front, /data-testid="monstrique-splash"/)
assert.match(
  front,
  /audience\.value === 'mature' && Boolean\(publicStory\.matureSplash\)/,
)
assert.doesNotMatch(
  front,
  /<svg[\s\S]*viewBox="0 0 1440 860"/,
  'vector title scene retired',
)
for (const client of [
  front,
  repoFile('stores/monstriquePublicStore.ts'),
  repoFile('pages/play/monstrique.vue'),
  repoFile('pages/admin/monstrique.vue'),
])
  assert.doesNotMatch(client, /MONSTRIQUE_MATURE_SPLASH|monstriqueSplash'/)
for (const asset of ['splash-wide.webp', 'splash-tall.webp', 'hero.webp'])
  readFileSync(
    new URL('../../public/monstrique/front/' + asset, import.meta.url),
  )
assert.match(
  repoFile('content/channels/arcade/monstrique.md'),
  /^image: \/monstrique\/front\/hero\.webp$/m,
)

console.log(
  'Monstrique art pipeline: model sheets, multi-style prompts, LoRA datasets, dual-medium cutscenes, score and narrator passed',
)
