import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { audienceAftermath } from '../emperorOfDust/fortress/answeredAudienceArt'
import { DAYS } from '../emperorOfDust/fortress/content'
import {
  chooseAudienceOption,
  createRun,
} from '../emperorOfDust/fortress/engine'
import { decodeBook, encodeBook } from '../emperorOfDust/fortress/saves'
import { talkChoiceImages } from '../emperorOfDust/fortress/talkChoiceArt'
import { TALKS } from '../emperorOfDust/fortress/talks'
import type { FortressRun } from '../emperorOfDust/fortress/types'

const root = join(process.cwd(), 'public')
const validAssets = new Map<string, boolean>()
const physicallyShipped = (url: string): boolean => {
  if (!url.startsWith('/emperor-of-dust/')) return false
  const previous = validAssets.get(url)
  if (previous !== undefined) return previous
  const full = join(root, url.slice(1))
  if (!existsSync(full)) {
    validAssets.set(url, false)
    return false
  }
  const bytes = readFileSync(full)
  const valid =
    bytes.length >= 20 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  validAssets.set(url, valid)
  return valid
}

let audiencesChecked = 0
let answersChecked = 0
let barracksChoicesChecked = 0

for (const day of DAYS) {
  for (const audience of day.audiences) {
    audiencesChecked += 1
    const options = [
      ...audience.options,
      ...(audience.beats ?? []).flatMap((beat) => beat.options),
    ]
    const ids = [...new Set(options.map((option) => option.id))]
    assert.equal(
      audienceAftermath({ flags: [] }, audience),
      null,
      audience.id + ': no chosen answer means no invented aftermath',
    )
    for (const id of ids) {
      const resolved = audienceAftermath(
        { flags: [`chose:${audience.id}:${id}`] },
        audience,
      )
      assert.ok(resolved, audience.id + '/' + id + ': answer reconstructs')
      assert.equal(resolved.option.id, id)
      assert.ok(resolved.option.response.trim())
      assert.ok(
        resolved.images.some(physicallyShipped),
        audience.id + '/' + id + ': at least one real painted image ships',
      )
      assert.equal(
        new Set(resolved.images).size,
        resolved.images.length,
        'art candidates must not repeat',
      )
      answersChecked += 1
    }
    if (ids.length > 1) {
      const orderedFlags = ids.map((id) => `chose:${audience.id}:${id}`)
      const resolved = audienceAftermath(
        { flags: orderedFlags },
        audience,
      )
      assert.equal(
        resolved?.option.id,
        ids[ids.length - 1],
        audience.id + ': last completed choice controls aftermath',
      )
    }
    assert.equal(
      audienceAftermath(
        { flags: [`chose:${audience.id}:nonexistent`] },
        audience,
      ),
      null,
      'orphaned old choice flags should not invent artwork',
    )
  }
}

const aqueduct = DAYS.find((day) => day.day === 1)!.audiences.find(
  (audience) => audience.id === 'd01-aqueduct',
)!
const directRepair = audienceAftermath(
  { flags: ['chose:d01-aqueduct:repair'] },
  aqueduct,
)
const investigatedRepair = audienceAftermath(
  {
    flags: [
      'chose:d01-aqueduct:ask-why',
      'chose:d01-aqueduct:repair',
    ],
  },
  aqueduct,
)
assert.ok(directRepair)
assert.ok(investigatedRepair)
assert.match(directRepair.option.response, /far wards/)
assert.match(investigatedRepair.option.response, /kept peace with the millers/)
assert.notEqual(
  directRepair.option.response,
  investigatedRepair.option.response,
  'The same id in a later beat has a different, recoverable authored answer',
)
assert.ok(investigatedRepair.images.some(physicallyShipped))

for (const talk of TALKS) {
  const options = [
    ...talk.options,
    ...(talk.beats ?? []).flatMap((beat) => beat.options),
  ]
  for (const [index] of options.entries()) {
    const candidates = talkChoiceImages(talk.follower, index)
    assert.ok(
      candidates.some(physicallyShipped),
      talk.id + ': conversation choice has real painted art',
    )
    assert.equal(new Set(candidates).size, candidates.length)
    barracksChoicesChecked += 1
  }
}

const original = createRun(592)
const day18: FortressRun = {
  ...original,
  day: 18,
  brass: 120,
  audiencesHeard: [],
  dayAudiences: undefined,
  audienceBeats: undefined,
}
const source = DAYS.find((entry) => entry.day === 18)!.audiences.find(
  (audience) => audience.id === 'd18-strangers',
)!
const first = chooseAudienceOption(
  day18,
  'd18-strangers',
  'ask-road',
).run
assert.equal(audienceAftermath(first, source)?.option.id, 'ask-road')
const completed = chooseAudienceOption(
  first,
  'd18-strangers',
  'wagon-escort',
).run
assert.ok(completed.audiencesHeard.includes('d18-strangers'))
assert.equal(
  audienceAftermath(completed, source)?.option.id,
  'wagon-escort',
)

const book = {
  version: 3 as const,
  current: completed,
  dawns: Array.from({ length: completed.day }, (_, index) => ({
    ...original,
    day: index + 1,
  })),
}
const saved = decodeBook(encodeBook(book))
assert.ok(saved, 'all day snapshots validate against the real save codec')
const restored = audienceAftermath(saved.current, source)
assert.equal(
  restored?.option.id,
  'wagon-escort',
  'reload must reconstruct the final choice, not the earlier beat',
)
assert.ok(
  restored?.images.some(physicallyShipped),
  'after reload, the selected answer still points to shipped painted art',
)

const throne = readFileSync(
  new URL('../../components/EmperorFortressThrone.vue', import.meta.url),
  'utf8',
)
const barracks = readFileSync(
  new URL('../../components/EmperorFortressBarracks.vue', import.meta.url),
  'utf8',
)
const illustration = readFileSync(
  new URL('../../components/EmperorFortressAnswerArt.vue', import.meta.url),
  'utf8',
)
assert.match(throne, /audienceAftermath\(props\.run, selected\.value\)/)
assert.match(throne, /<EmperorFortressAnswerArt/)
assert.match(throne, /answered\?\.option\.response/)
assert.match(barracks, /image: talkChoiceImages\(talk\.value\?\.follower/)
assert.match(illustration, /@error="tryNext"/)
assert.match(illustration, /position\.value < props\.candidates\.length/)

console.log(
  'Emperor illustrated aftermath: ' +
    JSON.stringify({
      audiences: audiencesChecked,
      answers: answersChecked,
      barracksChoices: barracksChoicesChecked,
      physicalImagesChecked: validAssets.size,
      liveChoiceAndSaveRestore: true,
    }),
)
