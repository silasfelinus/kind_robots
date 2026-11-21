import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { TALK_ART } from '../emperorOfDust/fortress/talkArt'
import {
  talkChoicePlateUrl,
  talkPlateUrl,
} from '../emperorOfDust/fortress/talkPlates'
import { TALKS } from '../emperorOfDust/fortress/talks'

// Every curated secret-talk plate ships as a real WebP, names an authored
// talk, and a choice plate only exists for an option the talk actually has.
const root = join(process.cwd(), 'public', 'emperor-of-dust', 'talks')
const talks = new Map(TALKS.map((talk) => [talk.id, talk]))

assert.ok(TALK_ART.length > 0, 'expected curated talk plates')
assert.equal(new Set(TALK_ART).size, TALK_ART.length, 'duplicate talk plates')

for (const entry of TALK_ART) {
  const match = /^([a-z0-9-]+)\/(notice|choice-a|choice-b)$/.exec(entry)
  assert.ok(match, `${entry}: expected <talk>/<notice|choice-a|choice-b>`)
  const [, talkId, plate] = match
  const talk = talks.get(talkId!)
  assert.ok(talk, `${entry}: no authored talk ${talkId}`)
  if (plate === 'choice-a') assert.ok(talk.options[0], `${entry}: no option 1`)
  if (plate === 'choice-b') assert.ok(talk.options[1], `${entry}: no option 2`)

  const file = join(root, `${entry}.webp`)
  assert.ok(existsSync(file), `${entry}: missing ${file}`)
  const bytes = readFileSync(file)
  assert.ok(bytes.length > 10_000, `${entry}: suspiciously small file`)
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', `${entry}: not RIFF`)
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', `${entry}: not WebP`)

  assert.equal(
    talkPlateUrl(talkId!, plate as 'notice' | 'choice-a' | 'choice-b'),
    `/emperor-of-dust/talks/${entry}.webp`,
  )
}

// Lookups never invent a plate that did not ship.
assert.equal(talkPlateUrl('nettle-1', 'notice'), undefined)
assert.equal(talkChoicePlateUrl('nettle-2', 1), undefined)
assert.equal(talkChoicePlateUrl('nettle-2', 2), undefined)
assert.equal(
  talkChoicePlateUrl('nettle-2', 0),
  '/emperor-of-dust/talks/nettle-2/choice-a.webp',
)

console.log(`verifyEmperorTalkPlates: ${TALK_ART.length} talk plates verified`)
