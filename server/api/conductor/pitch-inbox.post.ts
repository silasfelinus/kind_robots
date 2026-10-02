// /server/api/conductor/pitch-inbox.post.ts
// Public, signature-gated. Applies every decision on the inbox form in one submit.
// Pitches left on "later" are untouched; "approve-changes" needs notes, which are
// written into the pitch file as a modifications section and approve it.
import { readFormData } from 'h3'
import {
  applyPitchVote,
  listPendingPitches,
} from '@/server/utils/conductorPitchVote'
import {
  escapeHtml,
  isPitchInboxChoice,
  isPitchSlug,
  PITCH_NOTES_MAX,
  renderPitchDecisionPage,
  renderPitchInboxPage,
  renderPitchInboxResults,
  verifyPitchInbox,
  type PitchInboxChoice,
} from '@/server/utils/pitchDecisionLink'

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Robots-Tag': 'noindex',
  })

  const secret = (process.env.PITCH_LINK_SECRET || '').trim()
  const form = await readFormData(event)
  const sig = String(form.get('sig') ?? '')
  const check = secret
    ? verifyPitchInbox(secret, { exp: form.get('exp'), sig })
    : null

  if (!check || !check.ok) {
    setResponseStatus(event, secret ? 400 : 503)
    return renderPitchDecisionPage({
      heading: 'This link could not be used',
      body: '<p>It is invalid, expired, or not set up. Decide from the Conductor project page instead.</p>',
    })
  }

  const pending = await listPendingPitches()
  const known = new Set(pending.map((p) => p.slug))
  const choices: Record<string, PitchInboxChoice> = {}
  const notes: Record<string, string> = {}
  for (const [key, value] of form.entries()) {
    const split = key.indexOf(':')
    const kind = key.slice(0, split)
    const slug = key.slice(split + 1)
    if (split < 0 || !isPitchSlug(slug) || !known.has(slug)) continue
    if (typeof value !== 'string') continue
    if (kind === 'vote' && isPitchInboxChoice(value)) choices[slug] = value
    if (kind === 'notes') notes[slug] = value.slice(0, PITCH_NOTES_MAX).trim()
  }

  const lines: string[] = []
  const problems: Record<string, string> = {}
  for (const pitch of pending) {
    const choice = choices[pitch.slug] ?? 'later'
    const note = notes[pitch.slug] ?? ''
    if (choice === 'later') continue
    if (choice === 'approve-changes' && !note) {
      problems[pitch.slug] =
        'Approve with changes needs a note saying what to change. Nothing was saved for this one.'
      continue
    }
    try {
      await applyPitchVote(
        pitch.slug,
        choice === 'pass' ? 'rejected' : 'approved',
        { notes: choice === 'pass' ? '' : note },
      )
      const label =
        choice === 'approve-changes'
          ? 'approved with changes'
          : choice === 'approve'
            ? 'approved'
            : 'passed'
      lines.push(`“${escapeHtml(pitch.title)}”: <strong>${label}</strong>`)
    } catch {
      problems[pitch.slug] = 'Saving failed. Try again.'
    }
  }

  if (Object.keys(problems).length) {
    const left = await listPendingPitches()
    setResponseStatus(event, 422)
    return renderPitchInboxPage({
      exp: check.exp,
      sig,
      notes,
      cards: left.map((pitch) => ({
        ...pitch,
        choice: choices[pitch.slug] ?? 'later',
        problem: problems[pitch.slug],
      })),
    })
  }

  const remaining = (await listPendingPitches()).length
  if (!lines.length) lines.push('Nothing was changed.')
  return renderPitchInboxResults({ exp: check.exp, sig, lines, remaining })
})
