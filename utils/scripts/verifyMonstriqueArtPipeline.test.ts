import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { MONSTRESS_CONVENTION } from '../playbookKit/games/monstressConvention'
import {
  GENERAL_INTRO,
  MATURE_INTRO,
  MONSTRIQUE_GENERAL_SPEC,
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
import {
  CAST_FIGURES,
  CAST_PORTRAITS,
  ROOM_BACKDROPS,
  STAGE_MARKS,
  portraitFor,
} from '../monstrique/stageArt'

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
assert.match(
  repoFile('server/utils/monstriqueSplash.ts'),
  /wide: 268798,\s+tall: 268801,/,
  'Silas approved the mature splash (2026-11-11)',
)
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

// Main-game standard item 6: every ending has its own painted plate, served
// as a static general-safe file (ArtImages 270458 and 270459, round
// monstrique-endings-1) in both editions' endings and on the ending card.
// The Fifth Hexblade's plate is queued in conductor
// projects/monstress-convention/art/ENDINGS-R2.yaml (mc-ending-fifth-hexblade);
// until it is delivered the ending keeps its brief and alt and no src, so the
// kit shows its image-shaped fallback and the ending card shows no picture.
// Chapter Two's I Made Five Knives plate is queued the same way in
// projects/monstress-convention/art/CH2-ENDING-R1.yaml (mc-ending-five-knives).
const PLATES_QUEUED = new Set(['fifth-hexblade', 'five-knives'])
for (const spec of [MONSTRESS_CONVENTION, MONSTRIQUE_GENERAL_SPEC])
  for (const ending of spec.endings) {
    const src = ending.art?.src
    if (PLATES_QUEUED.has(ending.id)) {
      assert.equal(src, undefined, ending.id + ' waits for its queued plate')
      assert.ok(ending.art.brief.length > 40, ending.id + ' brief')
      assert.ok((ending.art.alt ?? '').length > 20, ending.id + ' alt text')
      continue
    }
    assert.ok(src, spec.id + '/' + ending.id + ' has a plate')
    assert.match(src, /^\/monstress-convention\/endings\/[a-z-]+\.webp$/)
    assert.ok(
      existsSync(new URL('../../public' + src, import.meta.url)),
      src + ' is committed',
    )
    assert.ok((ending.art?.alt ?? '').length > 20, ending.id + ' alt text')
  }
assert.match(
  repoFile('components/monstress-convention/monstress-convention-scene.vue'),
  /data-testid="monstrique-ending-plate"[\s\S]*?:src="endingPlate\.src"/,
)
assert.match(
  repoFile('components/monstress-convention/monstress-convention-scene.vue'),
  /<img\s+v-if="endingPlate"/,
  'an ending without a delivered plate renders no image',
)

// t-017: Chapter 1 painted rooms and cut-out cast (round CH1-CAST-AND-MOTEL-R1,
// ArtImages 280900-280911, all general-safe) replace the vector stage art;
// SVG survives only as the missing-art fallback.
const painted = Object.keys(ROOM_BACKDROPS) as RoomId[]
assert.deepEqual(painted.sort(), [
  'balcony',
  'front-office',
  'ice-alcove',
  'investigators-room',
  'motel-exterior',
  'neighbor-room',
  'odette-room',
])
const publicFile = (src: string) =>
  existsSync(new URL('../../public' + src, import.meta.url))
for (const room of painted) {
  const art = ROOM_BACKDROPS[room]!
  assert.match(art.src, /^\/monstress-convention\/rooms\/[a-z0-9-]+\.webp$/)
  assert.ok(publicFile(art.src), art.src + ' is committed')
  assert.ok(art.alt.length > 40, room + ' backdrop alt text')
  assert.ok(art.artImageId >= 280905 && art.artImageId <= 280911)
  for (const audience of audiences)
    for (const hotspot of roomForAudience(room, audience).hotspots) {
      assert.ok(
        hotspot.x >= 2 && hotspot.x <= 98 && hotspot.y >= 14 && hotspot.y <= 92,
        room + '/' + hotspot.id + ' pip sits inside the painting safe area',
      )
      const model = modelForHotspot(hotspot.id)
      if (model && model.id !== 'norb')
        assert.ok(
          STAGE_MARKS[hotspot.id],
          hotspot.id + ' stands on a mark in a painted room',
        )
    }
}
assert.ok(!ROOM_BACKDROPS['city-map'] && !ROOM_BACKDROPS['convention-center'])
for (const [id, figure] of Object.entries(CAST_FIGURES)) {
  assert.match(figure.src, /^\/monstress-convention\/cast\/[a-z]+\.webp$/)
  assert.ok(publicFile(figure.src), figure.src + ' is committed')
  assert.ok(figure.alt.length > 30, id + ' figure alt text')
  assert.ok(figure.artImageId >= 280900 && figure.artImageId <= 280904)
  assert.ok(figure.width > 0 && figure.height > figure.width)
  assert.ok(
    CHARACTER_MODELS[id as keyof typeof CHARACTER_MODELS].hotspots.some(
      (hotspot) => STAGE_MARKS[hotspot],
    ),
    id + ' has a stage mark',
  )
}
assert.ok(!CAST_FIGURES.iris && !CAST_FIGURES.norb && !CAST_FIGURES.cleo)
for (const [id, set] of Object.entries(CAST_PORTRAITS)) {
  assert.ok(set.neutral, id + ' has a neutral portrait')
  for (const portrait of Object.values(set)) {
    assert.ok(publicFile(portrait.src), portrait.src + ' is committed')
    assert.ok(portrait.alt.length > 0)
  }
}
for (const mark of Object.values(STAGE_MARKS))
  assert.ok(mark.x > 0 && mark.x < 100 && mark.y > 0 && mark.y <= 100)
assert.equal(
  portraitFor('odette', 'shock')?.src.endsWith('double-take.webp'),
  true,
)
assert.equal(
  portraitFor('violet', 'smirk')?.src.endsWith('laughing.webp'),
  true,
)
assert.equal(
  portraitFor('marta', 'shock')?.src.endsWith('marta-neutral.webp'),
  true,
)
assert.equal(portraitFor('iris', 'neutral'), null)
assert.match(
  scene,
  /v-if="backdrop"[\s\S]*?:src="backdrop\.src"[\s\S]*?:alt="backdrop\.alt"[\s\S]*?<svg\s+v-else[\s\S]*?data-testid="monstrique-room-fallback"/,
  'painted backdrop first, SVG only as the fallback',
)
for (const room of painted)
  assert.doesNotMatch(
    scene,
    new RegExp("story\\.state\\.room === '" + room + "'"),
    room + ' no longer carries hand-drawn SVG',
  )
assert.match(
  scene,
  /data-testid="monstrique-stage-figure"[\s\S]*?:src="actor\.figure\.src"/,
)
assert.match(scene, /v-if="speakerPortrait"[\s\S]*?:src="speakerPortrait\.src"/)

console.log(
  'Monstrique art pipeline: model sheets, multi-style prompts, LoRA datasets, dual-medium cutscenes, score and narrator passed',
)
