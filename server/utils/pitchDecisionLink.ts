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

// One signed link for the whole inbox: it covers only an expiry, and the page it opens
// lists every undecided pitch. The digest's per-pitch buttons link here too (the
// optional `pick` preselection is a UI default, never part of the capability).
function inboxMessage(exp: number): string {
  return `pitch-inbox|${exp}`
}

export function signPitchInbox(secret: string, exp: number): string {
  return createHmac('sha256', secret).update(inboxMessage(exp)).digest('hex')
}

export type PitchInboxCheck =
  | { ok: true; exp: number }
  | { ok: false; reason: 'malformed' | 'expired' | 'bad-signature' }

export function verifyPitchInbox(
  secret: string,
  params: { exp?: unknown; sig?: unknown },
  nowMs: number = Date.now(),
): PitchInboxCheck {
  const exp = Number(params.exp)
  if (
    !secret ||
    !Number.isInteger(exp) ||
    typeof params.sig !== 'string' ||
    !/^[0-9a-f]{64}$/.test(params.sig)
  ) {
    return { ok: false, reason: 'malformed' }
  }
  const expected = Buffer.from(signPitchInbox(secret, exp), 'hex')
  const given = Buffer.from(params.sig, 'hex')
  if (!timingSafeEqual(expected, given)) {
    return { ok: false, reason: 'bad-signature' }
  }
  if (exp * 1000 < nowMs) return { ok: false, reason: 'expired' }
  return { ok: true, exp }
}

export const PITCH_NOTES_MAX = 2000

export const PITCH_INBOX_CHOICES = [
  'approve',
  'approve-changes',
  'pass',
  'later',
] as const
export type PitchInboxChoice = (typeof PITCH_INBOX_CHOICES)[number]

export function isPitchInboxChoice(value: unknown): value is PitchInboxChoice {
  return PITCH_INBOX_CHOICES.includes(value as PitchInboxChoice)
}

/** `slug:choice` pairs from the repeatable `pick` query param (digest preselection). */
export function parsePitchPicks(
  raw: unknown,
): Record<string, PitchInboxChoice> {
  const values = Array.isArray(raw) ? raw : raw === undefined ? [] : [raw]
  const picks: Record<string, PitchInboxChoice> = {}
  for (const value of values) {
    const [slug, choice] = String(value).split(':')
    if (isPitchSlug(slug) && isPitchInboxChoice(choice)) picks[slug] = choice
  }
  return picks
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

const PAGE_STYLE = `body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f5f3ff;color:#1e1b4b;font:16px/1.5 system-ui,sans-serif}
main{max-width:30rem;margin:1rem;padding:1.5rem;background:#fff;border-radius:1rem;box-shadow:0 2px 12px #0002}
h1{margin:0 0 .5rem;font-size:1.3rem}p{margin:.5rem 0}
button{margin-top:1rem;width:100%;padding:.8rem;border:0;border-radius:.6rem;background:#7e22ce;color:#fff;font-size:1rem;font-weight:700}
@media (prefers-color-scheme:dark){body{background:#1e1b4b;color:#ede9fe}main{background:#312e81}}`

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
${PAGE_STYLE}
</style></head>
<body><main><h1>${escapeHtml(page.heading)}</h1>${page.body}${form}</main></body></html>`
}

export interface PitchInboxCard {
  slug: string
  title: string
  idea: string
  choice: PitchInboxChoice
  /** Shown above the card when the last save could not apply this pitch. */
  problem?: string
}

const INBOX_CHOICE_LABELS: Record<PitchInboxChoice, string> = {
  approve: '✅ Approve',
  'approve-changes': '✏️ Approve with changes',
  pass: '🚫 Pass',
  later: '⏳ Decide later',
}

const INBOX_STYLE = `
.inbox{max-width:40rem;margin:1rem auto;padding:0 1rem}
.inbox h1{margin:.5rem 0}
.card{background:#fff;border-radius:1rem;box-shadow:0 2px 12px #0002;padding:1rem 1.25rem;margin:0 0 1rem}
.card h2{margin:0 0 .25rem;font-size:1.1rem}
.card .problem{color:#b91c1c;font-weight:600}
.choices{display:flex;flex-wrap:wrap;gap:.4rem;margin:.6rem 0}
.choices label{display:block;position:relative}
.choices input{position:absolute;opacity:0}
.choices span{display:block;padding:.45rem .7rem;border:2px solid #c4b5fd;border-radius:.6rem;font-size:.9rem}
.choices input:checked+span{background:#7e22ce;border-color:#7e22ce;color:#fff}
.choices input:focus-visible+span{outline:2px solid #1e1b4b}
.card textarea{width:100%;box-sizing:border-box;min-height:3.5rem;padding:.5rem;border:1px solid #c4b5fd;border-radius:.5rem;font:inherit}
.inbox .save{position:sticky;bottom:.75rem;margin:0}
.inbox .empty,.inbox .results{background:#fff;border-radius:1rem;padding:1rem 1.25rem;box-shadow:0 2px 12px #0002}
.inbox a.back{display:block;margin-top:1rem;text-align:center;color:inherit}
@media (prefers-color-scheme:dark){.card,.inbox .empty,.inbox .results{background:#312e81}.choices span{border-color:#6d28d9}.card textarea{background:#1e1b4b;color:inherit;border-color:#6d28d9}.card .problem{color:#fca5a5}}
`

function inboxShell(heading: string, body: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${escapeHtml(heading)}</title>
<style>
${PAGE_STYLE}
body{display:block;min-height:0}
${INBOX_STYLE}
</style></head>
<body><div class="inbox"><h1>${escapeHtml(heading)}</h1>${body}</div></body></html>`
}

export function renderPitchInboxPage(page: {
  exp: number
  sig: string
  cards: PitchInboxCard[]
  notes?: Record<string, string>
}): string {
  if (!page.cards.length) {
    return inboxShell(
      'Pitch inbox',
      '<div class="empty"><p>Nothing is waiting for you. Every pitch has been decided. 🎉</p></div>',
    )
  }
  const cards = page.cards
    .map((card) => {
      const choices = PITCH_INBOX_CHOICES.map(
        (choice) =>
          `<label><input type="radio" name="vote:${escapeHtml(card.slug)}" value="${choice}"${
            card.choice === choice ? ' checked' : ''
          }><span>${INBOX_CHOICE_LABELS[choice]}</span></label>`,
      ).join('')
      return `<section class="card">
${card.problem ? `<p class="problem">${escapeHtml(card.problem)}</p>` : ''}<h2>${escapeHtml(card.title)}</h2>
<p>${escapeHtml(card.idea)}</p>
<div class="choices">${choices}</div>
<textarea name="notes:${escapeHtml(card.slug)}" maxlength="${PITCH_NOTES_MAX}" placeholder="Changes or notes (required for Approve with changes)">${escapeHtml(page.notes?.[card.slug] ?? '')}</textarea>
</section>`
    })
    .join('\n')
  return inboxShell(
    `Pitch inbox (${page.cards.length})`,
    `<p>Choose for each pitch, then save once. Anything left on “Decide later” stays here.</p>
<form method="post" action="/api/conductor/pitch-inbox">
<input type="hidden" name="exp" value="${page.exp}">
<input type="hidden" name="sig" value="${escapeHtml(page.sig)}">
${cards}
<button class="save" type="submit">Save decisions</button>
</form>`,
  )
}

/** `lines` are trusted HTML: callers escape titles themselves. */
export function renderPitchInboxResults(page: {
  exp: number
  sig: string
  lines: string[]
  remaining: number
}): string {
  const back = `/api/conductor/pitch-inbox?exp=${page.exp}&sig=${encodeURIComponent(page.sig)}`
  return inboxShell(
    'Decisions saved',
    `<div class="results"><ul>${page.lines
      .map((line) => `<li>${line}</li>`)
      .join(
        '',
      )}</ul><p>Approved pitches become projects in the next Conductor session.</p></div>
<a class="back" href="${back}">${
      page.remaining
        ? `Back to the ${page.remaining} still waiting`
        : 'Back to the inbox'
    }</a>`,
  )
}
