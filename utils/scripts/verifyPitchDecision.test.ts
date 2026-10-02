// /utils/scripts/verifyPitchDecision.test.ts
// Pins the signed-email-link contract for deciding a Conductor pitch. The Python
// signer in silasfelinus/conductor (scripts/pitch_links.py) must produce the same
// signature for the same inputs: the fixed vector below is asserted on both sides
// (conductor's tests/test_pitch_links.py).
import assert from 'node:assert/strict'

import {
  escapeHtml,
  isPitchSlug,
  renderPitchDecisionPage,
  signPitchDecision,
  verifyPitchDecision,
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

console.log('verifyPitchDecision: ok')
