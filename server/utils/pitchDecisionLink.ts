// /server/utils/pitchDecisionLink.ts
// Signed, expiring email links that let Silas decide a Conductor pitch straight
// from the daily digest. The signature is the capability: it covers exactly one
// pitch + one vote + an expiry, so a leaked link can do nothing else. Pure
// (node:crypto only) so utils/scripts/verifyPitchDecision.test.ts can pin it.
//
// The digest builder in silasfelinus/conductor (scripts/pitch_links.py) signs the
// identical message with the same PITCH_LINK_SECRET; keep the two in lockstep.
import { createHmac, timingSafeEqual } from 'node:crypto'

export const PITCH_LINK_VOTES = ['approved', 'rejected'] as const
export type PitchLinkVote = (typeof PITCH_LINK_VOTES)[number]

// A pitch file stem such as 2026-10-01-kind-jigsaw (pitches/<slug>.md).
const PITCH_SLUG = /^[a-z0-9][a-z0-9-]{0,120}$/

export function isPitchSlug(value: unknown): value is string {
  return typeof value === 'string' && PITCH_SLUG.test(value)
}

export function isPitchLinkVote(value: unknown): value is PitchLinkVote {
  return PITCH_LINK_VOTES.includes(value as PitchLinkVote)
}

function message(slug: string, vote: string, exp: number): string {
  return `pitch-decision|${slug}|${vote}|${exp}`
}

export function signPitchDecision(
  secret: string,
  slug: string,
  vote: string,
  exp: number,
): string {
  return createHmac('sha256', secret)
    .update(message(slug, vote, exp))
    .digest('hex')
}

export type PitchLinkCheck =
  | { ok: true; slug: string; vote: PitchLinkVote; exp: number }
  | { ok: false; reason: 'malformed' | 'expired' | 'bad-signature' }

export function verifyPitchDecision(
  secret: string,
  params: { slug?: unknown; vote?: unknown; exp?: unknown; sig?: unknown },
  nowMs: number = Date.now(),
): PitchLinkCheck {
  const exp = Number(params.exp)
  if (
    !secret ||
    !isPitchSlug(params.slug) ||
    !isPitchLinkVote(params.vote) ||
    !Number.isInteger(exp) ||
    typeof params.sig !== 'string' ||
    !/^[0-9a-f]{64}$/.test(params.sig)
  ) {
    return { ok: false, reason: 'malformed' }
  }

  const expected = Buffer.from(
    signPitchDecision(secret, params.slug, params.vote, exp),
    'hex',
  )
  const given = Buffer.from(params.sig, 'hex')
  if (!timingSafeEqual(expected, given)) {
    return { ok: false, reason: 'bad-signature' }
  }
  if (exp * 1000 < nowMs) return { ok: false, reason: 'expired' }

  return { ok: true, slug: params.slug, vote: params.vote, exp }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export interface PitchDecisionPage {
  heading: string
  body: string
  /** Present only on the confirm step: the form that performs the vote. */
  form?: {
    slug: string
    vote: PitchLinkVote
    exp: number
    sig: string
    button: string
  }
}

// Tiny self-contained page (no app shell, no scripts): the link is opened from a
// mail client, usually on a phone, by someone who is not necessarily signed in.
export function renderPitchDecisionPage(page: PitchDecisionPage): string {
  const form = page.form
    ? `<form method="post" action="/api/conductor/pitch-decision">
  <input type="hidden" name="slug" value="${escapeHtml(page.form.slug)}">
  <input type="hidden" name="vote" value="${escapeHtml(page.form.vote)}">
  <input type="hidden" name="exp" value="${page.form.exp}">
  <input type="hidden" name="sig" value="${escapeHtml(page.form.sig)}">
  <button type="submit">${escapeHtml(page.form.button)}</button>
</form>`
    : ''
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${escapeHtml(page.heading)}</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f5f3ff;color:#1e1b4b;font:16px/1.5 system-ui,sans-serif}
main{max-width:30rem;margin:1rem;padding:1.5rem;background:#fff;border-radius:1rem;box-shadow:0 2px 12px #0002}
h1{margin:0 0 .5rem;font-size:1.3rem}p{margin:.5rem 0}
button{margin-top:1rem;width:100%;padding:.8rem;border:0;border-radius:.6rem;background:#7e22ce;color:#fff;font-size:1rem;font-weight:700}
@media (prefers-color-scheme:dark){body{background:#1e1b4b;color:#ede9fe}main{background:#312e81}}
</style></head>
<body><main><h1>${escapeHtml(page.heading)}</h1>${page.body}${form}</main></body></html>`
}
