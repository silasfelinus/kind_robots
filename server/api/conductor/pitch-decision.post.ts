// /server/api/conductor/pitch-decision.post.ts
// Public, signature-gated. Performs the vote the confirm page (GET) offered. The
// signature covers exactly one pitch, one vote and an expiry; replaying it is
// harmless because writing the same status again is a no-op.
import { readFormData } from 'h3'
import {
  applyPitchVote,
  pitchTitleOf,
} from '@/server/utils/conductorPitchVote'
import { conductorGet } from '@/server/utils/conductor-github'
import {
  escapeHtml,
  renderPitchDecisionPage,
  verifyPitchDecision,
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
  const fields = {
    slug: form.get('slug'),
    vote: form.get('vote'),
    exp: form.get('exp'),
    sig: form.get('sig'),
  }
  const check = secret ? verifyPitchDecision(secret, fields) : null

  if (!check || !check.ok) {
    setResponseStatus(event, secret ? 400 : 503)
    return renderPitchDecisionPage({
      heading: 'This link could not be used',
      body: '<p>It is invalid, expired, or not set up. Decide from the Conductor project page instead.</p>',
    })
  }

  const result = await applyPitchVote(check.slug, check.vote)
  const file = await conductorGet(`pitches/${check.slug}.md`)
  const title = file ? pitchTitleOf(file.content, check.slug) : check.slug

  return renderPitchDecisionPage({
    heading: check.vote === 'approved' ? 'Approved' : 'Passed',
    body: `<p>“${escapeHtml(title)}” is now marked <strong>${escapeHtml(result.status)}</strong>${
      result.changed ? '' : ' (it already was)'
    }. The next Conductor session turns an approved pitch into a project.</p>`,
  })
})
