import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  encodeMissionEventLog,
  normalizeMissionDimension,
  normalizeMissionEventInput,
  parseMissionEventLog,
} from '../missionMetricsContract.js'

assert.equal(normalizeMissionDimension(' Bluesky / Launch ', 'direct'), 'bluesky-launch')
assert.equal(normalizeMissionDimension('', 'direct'), 'direct')
assert.equal(normalizeMissionDimension('X'.repeat(100), 'none').length, 48)

const input = normalizeMissionEventInput({
  event: 'fundraiser_click',
  source: 'Bluesky',
  campaign: 'Open Social Pilot',
  placement: 'Hero',
})
assert.deepEqual(input, {
  event: 'fundraiser_click',
  source: 'bluesky',
  campaign: 'open-social-pilot',
  placement: 'hero',
})
assert.deepEqual(
  normalizeMissionEventInput({
    event: 'fundraiser_click',
    source: 'someone@example.com',
    campaign: 'visitor-9f8e7d6c',
    placement: 'made-up-slot',
  }),
  {
    event: 'fundraiser_click',
    source: 'other',
    campaign: 'other',
    placement: 'unknown',
  },
)
assert.equal(normalizeMissionEventInput({ event: 'donation' }), null)

const encoded = encodeMissionEventLog(input!)
assert.deepEqual(parseMissionEventLog(encoded), {
  kind: 'rainbow-mission-event',
  version: 1,
  ...input!,
})
assert.equal(parseMissionEventLog('not json'), null)

const [ingestSource, metricsSource, summarySource] = await Promise.all([
  readFile('server/api/v1/mission/events.post.ts', 'utf8'),
  readFile('server/utils/missionMetrics.ts', 'utf8'),
  readFile('server/api/v1/mission/summary.get.ts', 'utf8'),
])

assert.match(ingestSource, /ALLOWED_FIELDS = new Set\(\['event', 'source', 'campaign', 'placement'\]\)/)
assert.doesNotMatch(ingestSource, /visitorId|fingerprint|referrer|userAgent/i)
assert.match(metricsSource, /userId: null/)
assert.match(metricsSource, /username: MISSION_LOG_USERNAME/)
assert.match(metricsSource, /getRequestIP/)
assert.match(metricsSource, /visitorIdsStored: false/)
assert.match(metricsSource, /ipAddressesStored: false/)
assert.match(metricsSource, /exactEventTimesStored: false/)
assert.match(metricsSource, /referrersStored: false/)
assert.match(metricsSource, /donationIdentitiesKnown: false/)
assert.match(metricsSource, /donationAmountsKnown: false/)
assert.match(metricsSource, /projectSlug: 'rainbow-butterflies'/)
assert.match(summarySource, /do not include donor identities or donation amounts/i)

console.log('verifyMissionMetrics.test.ts: all assertions passed')
