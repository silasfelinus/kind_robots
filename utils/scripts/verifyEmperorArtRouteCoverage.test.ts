import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ACT_ONE_QUESTS } from '../emperorOfDust/fortress/actOne'
import { ACT_ONE_LATE_QUESTS } from '../emperorOfDust/fortress/actOneLate'
import { ACT_TWO_QUESTS } from '../emperorOfDust/fortress/actTwo'
import { ACT_THREE_QUESTS } from '../emperorOfDust/fortress/actThree'
import { ACT_FOUR_QUESTS } from '../emperorOfDust/fortress/actFour'
import { ACT_FIVE_QUESTS } from '../emperorOfDust/fortress/actFive'
import {
  audienceChoiceImages,
  EXPORTED_AUDIENCE_CHOICES,
} from '../emperorOfDust/fortress/audienceChoiceArt'
import { CAST_ART, followerPortrait } from '../emperorOfDust/fortress/castArt'
import {
  chanceArtCandidates,
  EXPORTED_CHANCE_PLATES,
} from '../emperorOfDust/fortress/chanceArt'
import { CHANCE_EVENTS } from '../emperorOfDust/fortress/dailyEvents'
import { DAYS, QUEST_TEMPLATES } from '../emperorOfDust/fortress/content'
import { ENDINGS } from '../emperorOfDust/fortress/endings'
import { FOLLOWERS } from '../emperorOfDust/fortress/followers'
import { QUEST_ART, questArtUrl } from '../emperorOfDust/fortress/questArt'
import { ROOM_ART, roomArtUrl } from '../emperorOfDust/fortress/rooms'
import { TALKS } from '../emperorOfDust/fortress/talks'

type Slot = {
  kind: 'audience' | 'chance' | 'quest' | 'follower' | 'ending'
  id: string
  day: number | null
  dedicated: boolean
  shipped_url: string
  missing_dedicated_url: string | null
}

const root = join(process.cwd(), 'public')
const fallback = '/emperor-of-dust/map/wasteland.webp'
const verified = new Map<string, boolean>()

const shipped = (url: string | undefined): boolean => {
  if (!url || !url.startsWith('/emperor-of-dust/')) return false
  const cached = verified.get(url)
  if (cached !== undefined) return cached
  const location = join(root, url.slice(1))
  if (!existsSync(location)) {
    verified.set(url, false)
    return false
  }
  const bytes = readFileSync(location)
  const valid =
    bytes.length >= 20 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP' &&
    ['VP8 ', 'VP8L', 'VP8X'].includes(bytes.toString('ascii', 12, 16))
  verified.set(url, valid)
  return valid
}

assert.ok(shipped(fallback), 'The shared wasteland fallback must ship as WebP')
assert.equal(new Set(DAYS.map((day) => day.day)).size, 50)
assert.equal(CHANCE_EVENTS.length, 135)
assert.equal(Object.keys(ENDINGS).length, 8)

for (const asset of CAST_ART) {
  assert.ok(
    shipped('/emperor-of-dust/cast/' + asset + '.webp'),
    'cast manifest declares missing or invalid physical art: ' + asset,
  )
}
for (const asset of QUEST_ART) {
  assert.ok(
    shipped('/emperor-of-dust/quests/' + asset + '.webp'),
    'quest manifest declares missing or invalid physical art: ' + asset,
  )
}
for (const room of ROOM_ART) {
  assert.ok(
    shipped(roomArtUrl(room)),
    'room manifest declares missing or invalid physical art: ' + room,
  )
}
for (const id of EXPORTED_CHANCE_PLATES) {
  assert.ok(
    shipped('/emperor-of-dust/chance/' + id + '.webp'),
    'chance manifest declares missing or invalid physical art: ' + id,
  )
}
for (const id of EXPORTED_AUDIENCE_CHOICES) {
  assert.ok(
    shipped('/emperor-of-dust/audiences/' + id + '.webp'),
    'audience manifest declares missing or invalid physical art: ' + id,
  )
}

const slots: Slot[] = []
const missing = (kind: Slot['kind']) =>
  slots.filter((slot) => slot.kind === kind && !slot.dedicated)
const uniqueAudienceOptions = new Set<string>()

for (const day of DAYS) {
  for (const audience of day.audiences) {
    const options = [
      ...audience.options,
      ...(audience.beats ?? []).flatMap((beat) => beat.options),
    ]
    for (const [index, option] of options.entries()) {
      const id = audience.id + '/' + option.id
      if (uniqueAudienceOptions.has(id)) continue
      uniqueAudienceOptions.add(id)
      const wanted = '/emperor-of-dust/audiences/' + id + '.webp'
      const images = audienceChoiceImages(audience.id, option.id, undefined, index)
      const selected = images.find((url) => shipped(url))
      assert.ok(selected, 'No physical image for audience choice ' + id)
      slots.push({
        kind: 'audience',
        id,
        day: day.day,
        dedicated: EXPORTED_AUDIENCE_CHOICES.includes(id) && shipped(wanted),
        shipped_url: selected,
        missing_dedicated_url: shipped(wanted) ? null : wanted,
      })
    }
  }
}

for (const event of CHANCE_EVENTS) {
  const wanted = '/emperor-of-dust/chance/' + event.id + '.webp'
  for (const [index, option] of event.choices.entries()) {
    const id = event.id + '/' + option.id
    const selected = chanceArtCandidates(event.id, index).find((url) =>
      shipped(url),
    )
    assert.ok(selected, 'No physical image for chance choice ' + id)
    slots.push({
      kind: 'chance',
      id,
      day: null,
      dedicated: EXPORTED_CHANCE_PLATES.includes(event.id) && shipped(wanted),
      shipped_url: selected,
      missing_dedicated_url: shipped(wanted) ? null : wanted,
    })
  }
}

const quests = [
  ...ACT_ONE_QUESTS,
  ...ACT_ONE_LATE_QUESTS,
  ...ACT_TWO_QUESTS,
  ...ACT_THREE_QUESTS,
  ...ACT_FOUR_QUESTS,
  ...ACT_FIVE_QUESTS,
  ...QUEST_TEMPLATES,
]
assert.equal(new Set(quests.map((quest) => quest.id)).size, quests.length)
const exportedQuests = new Set(QUEST_ART)
for (const quest of quests) {
  for (const variant of ['notice', 'success', 'failure'] as const) {
    const key =
      variant === 'notice' ? quest.id : quest.id + '-' + variant
    const wanted = '/emperor-of-dust/quests/' + key + '.webp'
    const candidate = questArtUrl(quest.id, variant)
    const selected = candidate && shipped(candidate) ? candidate : fallback
    assert.ok(shipped(selected), 'No valid quest image for ' + key)
    slots.push({
      kind: 'quest',
      id: key,
      day: quest.days?.[0] ?? null,
      dedicated: exportedQuests.has(key) && shipped(wanted),
      shipped_url: selected,
      missing_dedicated_url: shipped(wanted) ? null : wanted,
    })
  }
}

for (const follower of FOLLOWERS) {
  const wanted =
    '/emperor-of-dust/cast/followers/' + follower.id +
    '/portrait/neutral.webp'
  const portrait = followerPortrait(follower.id)
  assert.ok(
    shipped(portrait),
    'No physical portrait for the recruitable follower ' + follower.id,
  )
  slots.push({
    kind: 'follower',
    id: follower.id,
    day: null,
    dedicated: shipped(wanted),
    shipped_url: portrait!,
    missing_dedicated_url: shipped(wanted) ? null : wanted,
  })
}

const talkCoverage = TALKS.map((talk) => ({
  id: talk.id,
  follower: talk.follower,
  from_day: talk.fromDay,
  has_shipped_portrait: shipped(followerPortrait(talk.follower)),
}))
for (const talk of talkCoverage) {
  assert.ok(
    talk.has_shipped_portrait,
    'No shipped art for follower conversation ' + talk.id,
  )
}

for (const id of Object.keys(ENDINGS)) {
  const wanted = '/emperor-of-dust/endings/' + id + '.webp'
  slots.push({
    kind: 'ending',
    id,
    day: 50,
    dedicated: shipped(wanted),
    shipped_url: shipped(wanted) ? wanted : fallback,
    missing_dedicated_url: shipped(wanted) ? null : wanted,
  })
}

const byAct = [1, 2, 3, 4, 5].map((act) => {
  const options = slots.filter(
    (slot) =>
      slot.kind === 'audience' &&
      slot.day !== null &&
      Math.ceil(slot.day / 10) === act,
  )
  return {
    act,
    audience_choice_slots: options.length,
    dedicated_audience_choices: options.filter((slot) => slot.dedicated).length,
    fallback_audience_choices: options.filter((slot) => !slot.dedicated).length,
  }
})
const totals = {
  scene_slots: slots.length,
  audience_choices: slots.filter((slot) => slot.kind === 'audience').length,
  audience_dedicated: slots.filter(
    (slot) => slot.kind === 'audience' && slot.dedicated,
  ).length,
  chance_choices: slots.filter((slot) => slot.kind === 'chance').length,
  chance_dedicated: slots.filter(
    (slot) => slot.kind === 'chance' && slot.dedicated,
  ).length,
  quest_variants: slots.filter((slot) => slot.kind === 'quest').length,
  quest_dedicated: slots.filter(
    (slot) => slot.kind === 'quest' && slot.dedicated,
  ).length,
  follower_portraits: FOLLOWERS.length,
  voiced_follower_talks: talkCoverage.length,
  follower_missing_portraits: missing('follower').length,
  ending_plates: Object.keys(ENDINGS).length,
  ending_missing_plates: missing('ending').length,
}
const report = {
  method:
    'Authored 50-day scene registry joined to physically inspected local WebP ' +
    'paths; no remote ArtImage or visual approval inferred',
  kind_robots_sha: process.env.KIND_ROBOTS_SHA ?? process.env.GITHUB_SHA ?? null,
  status: 'partial_delivery_audit_not_playtest_acceptance',
  totals,
  by_act: byAct,
  follower_talk_portrait_coverage: talkCoverage,
  missing_dedicated: {
    audience: missing('audience').map((slot) => slot.id),
    chance: [...new Set(missing('chance').map((slot) => slot.id.split('/')[0]))],
    quest: missing('quest').map((slot) => slot.id),
    endings: missing('ending').map((slot) => slot.id),
  },
  slots,
}
mkdirSync('artifacts/emperor', { recursive: true })
writeFileSync(
  'artifacts/emperor/editorial-art-route-coverage.json',
  JSON.stringify(report, null, 2) + '\n',
)
console.log('EMPEROR_ART_ROUTE_COVERAGE ' + JSON.stringify(totals))
console.log(
  'Dedicated versus fallback slots are evidence only: delivered art, ' +
    'curation, model species and cross-width acceptance are still pending.',
)
