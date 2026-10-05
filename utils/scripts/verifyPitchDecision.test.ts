// /utils/scripts/verifyPitchDecision.test.ts
// Pins the signed-email-link contract for deciding a Conductor pitch. The Python
// signer in silasfelinus/conductor (scripts/pitch_links.py) must produce the same
// signature for the same inputs: the fixed vector below is asserted on both sides
// (conductor's tests/test_pitch_links.py).
import assert from 'node:assert/strict'

import {
  withPitchModifications,
  withPitchStatus,
} from '../../server/utils/conductorPitchVote'
import {
  escapeHtml,
  isPitchSlug,
  parsePitchPicks,
  renderPitchDecisionPage,
  renderPitchInboxPage,
  signPitchDecision,
  signPitchInbox,
  verifyPitchDecision,
  verifyPitchInbox,
} from '../../server/utils/pitchDecisionLink'

const secret = 'test-secret'
const slug = '2026-10-01-kind-jigsaw'
const exp = 1_900_000_000
const nowMs = (exp - 1000) * 1000

const sig = signPitchDecision(secret, slug, 'approved', exp)
assert.equal(
  sig,
  'c0900b8ddf3e254c6d3602d3da55ccc183f961781211f94f128bec51f6f66b4d',
  'cross-language vector: Python and TypeScript sign identically',
)

assert.deepEqual(
  verifyPitchDecision(secret, { slug, vote: 'approved', exp, sig }, nowMs),
  { ok: true, slug, vote: 'approved', exp },
  'a correct signature verifies',
)
assert.deepEqual(
  verifyPitchDecision(secret, { slug, vote: 'rejected', exp, sig }, nowMs),
  { ok: false, reason: 'bad-signature' },
  'a signature for one vote cannot decide the other',
)
assert.deepEqual(
  verifyPitchDecision(
    secret,
    { slug: '2026-10-01-other', vote: 'approved', exp, sig },
    nowMs,
  ),
  { ok: false, reason: 'bad-signature' },
  'a signature for one pitch cannot decide another',
)
assert.deepEqual(
  verifyPitchDecision(
    secret,
    { slug, vote: 'approved', exp: exp + 1, sig },
    nowMs,
  ),
  { ok: false, reason: 'bad-signature' },
  'extending the expiry invalidates the signature',
)
assert.deepEqual(
  verifyPitchDecision(
    'other-secret',
    { slug, vote: 'approved', exp, sig },
    nowMs,
  ),
  { ok: false, reason: 'bad-signature' },
  'a different secret rejects the link',
)
assert.deepEqual(
  verifyPitchDecision(
    secret,
    { slug, vote: 'approved', exp, sig },
    (exp + 1) * 1000,
  ),
  { ok: false, reason: 'expired' },
  'an expired link is refused',
)
assert.deepEqual(
  verifyPitchDecision(secret, { slug, vote: 'archived', exp, sig }, nowMs),
  { ok: false, reason: 'malformed' },
  'only approve and pass are linkable votes',
)
assert.deepEqual(
  verifyPitchDecision(
    secret,
    { slug: '../etc/passwd', vote: 'approved', exp, sig },
    nowMs,
  ),
  { ok: false, reason: 'malformed' },
  'a path-like slug is rejected before any file lookup',
)
assert.deepEqual(
  verifyPitchDecision('', { slug, vote: 'approved', exp, sig }, nowMs),
  { ok: false, reason: 'malformed' },
  'an unset secret never verifies',
)
assert.deepEqual(
  verifyPitchDecision(
    secret,
    { slug, vote: 'approved', exp, sig: 'zz' },
    nowMs,
  ),
  { ok: false, reason: 'malformed' },
  'a non-hex signature is malformed, not a crash',
)

assert.equal(isPitchSlug('2026-10-01-kind-jigsaw'), true)
assert.equal(isPitchSlug('Bad Slug'), false)

assert.equal(
  escapeHtml('<b>"x" & \'y\'</b>'),
  '&lt;b&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/b&gt;',
)
const html = renderPitchDecisionPage({
  heading: '<script>alert(1)</script>',
  body: '<p>ok</p>',
  form: { slug, vote: 'approved', exp, sig, button: 'Go' },
})
assert.ok(!html.includes('<script>alert'), 'the heading is escaped')
assert.ok(html.includes('method="post"') && html.includes(`value="${sig}"`))

// The inbox link: one signature for the whole page, shared vector with conductor.
const inboxSig = signPitchInbox(secret, exp)
assert.equal(
  inboxSig,
  'e7c1d9e2e9608ca15d7a223b49cb2ce082ae079a60ed6bf2c6f86752fff6afaa',
  'cross-language vector: Python and TypeScript sign the inbox identically',
)
assert.deepEqual(verifyPitchInbox(secret, { exp, sig: inboxSig }, nowMs), {
  ok: true,
  exp,
})
assert.deepEqual(
  verifyPitchInbox(secret, { exp: exp + 1, sig: inboxSig }, nowMs),
  { ok: false, reason: 'bad-signature' },
  'extending the inbox expiry invalidates it',
)
assert.deepEqual(
  verifyPitchInbox(secret, { exp, sig }, nowMs),
  { ok: false, reason: 'bad-signature' },
  'a single-pitch signature cannot open the inbox',
)
assert.deepEqual(
  verifyPitchInbox(secret, { exp, sig: inboxSig }, (exp + 1) * 1000),
  { ok: false, reason: 'expired' },
)
assert.deepEqual(
  verifyPitchDecision(
    secret,
    { slug, vote: 'approved', exp, sig: inboxSig },
    nowMs,
  ),
  { ok: false, reason: 'bad-signature' },
  'an inbox signature cannot decide a pitch',
)

assert.deepEqual(
  parsePitchPicks([
    `${slug}:approve-changes`,
    'bad slug:pass',
    `${slug}-x:nope`,
  ]),
  { [slug]: 'approve-changes' },
  'only well-formed slug:choice preselections survive',
)
const inboxHtml = renderPitchInboxPage({
  exp,
  sig: inboxSig,
  cards: [{ slug, title: '<b>T</b>', idea: 'idea', choice: 'approve-changes' }],
})
assert.ok(!inboxHtml.includes('<b>T</b>'), 'card titles are escaped')
assert.ok(
  inboxHtml.includes(`name="vote:${slug}" value="approve-changes" checked`),
)
assert.ok(inboxHtml.includes(`name="notes:${slug}"`))

const base = '# Pitch: X\nstatus: awaiting-silas\n\n## The idea\nIdea.\n'
const withNotes = withPitchModifications(base, 'Make it\n## smaller')
assert.ok(
  withNotes.endsWith("## Silas's modifications\nMake it\n\\## smaller\n"),
)
assert.equal(
  withPitchModifications(withNotes, 'Second try').match(
    /## Silas's modifications/g,
  )?.length,
  1,
  'a repeat submission replaces the notes instead of stacking them',
)

assert.equal(
  withPitchStatus(
    '# T\nproject-target: x\nstatus: awaiting-silas\n',
    'approved',
  ),
  '# T\nproject-target: x\nstatus: approved\n',
  'an existing status line is replaced',
)
assert.equal(
  withPitchStatus('# T\nproject-target: x\n\nBody\n', 'rejected'),
  '# T\nproject-target: x\nstatus: rejected\n\nBody\n',
  'a missing status goes under project-target',
)
assert.equal(
  withPitchStatus('# Retire it\n**Status:** approved\n\nBody\n', 'approved'),
  '# Retire it\nstatus: approved\n**Status:** approved\n\nBody\n',
  'a hand-written record with no header still records the vote',
)

console.log('verifyPitchDecision: ok')
