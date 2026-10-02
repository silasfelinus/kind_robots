// /server/api/conductor/pitch-decision.get.ts
// Public, signature-gated. The digest email links here; this only SHOWS the pitch and
// a confirm button (a GET must never change state: mail scanners prefetch links).
import { conductorGet } from '@/server/utils/conductor-github'
import {
  escapeHtml,
  renderPitchDecisionPage,
  verifyPitchDecision,
} from '@/server/utils/pitchDecisionLink'
import {
  pitchIdeaOf,
  pitchStatusOf,
  pitchTitleOf,
} from '@/server/utils/conductorPitchVote'

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Robots-Tag': 'noindex',
  })

  const secret = (process.env.PITCH_LINK_SECRET || '').trim()
  if (!secret) {
    setResponseStatus(event, 503)
    return renderPitchDecisionPage({
      heading: 'Pitch links are not set up yet',
      body: '<p>PITCH_LINK_SECRET is not configured on this server. Decide from the Conductor project page instead.</p>',
    })
  }

  const query = getQuery(event)
  const check = verifyPitchDecision(secret, query)
  if (!check.ok) {
    setResponseStatus(event, check.reason === 'expired' ? 410 : 400)
    return renderPitchDecisionPage({
      heading:
        check.reason === 'expired'
          ? 'This link has expired'
          : 'This link is not valid',
      body: '<p>Open the Conductor project page to decide this pitch.</p>',
    })
  }

  const file = await conductorGet(`pitches/${check.slug}.md`)
  if (!file) {
    setResponseStatus(event, 404)
    return renderPitchDecisionPage({
      heading: 'Pitch not found',
      body: `<p>${escapeHtml(check.slug)} is no longer in the pitch list.</p>`,
    })
  }

  const title = pitchTitleOf(file.content, check.slug)
  const approve = check.vote === 'approved'
  return renderPitchDecisionPage({
    heading: `${approve ? 'Approve' : 'Pass on'} “${title}”?`,
    body: `<p>${escapeHtml(pitchIdeaOf(file.content))}</p><p><small>Current status: ${escapeHtml(pitchStatusOf(file.content))}</small></p>`,
    form: {
      slug: check.slug,
      vote: check.vote,
      exp: check.exp,
      sig: String(query.sig),
      button: approve ? 'Yes, approve this pitch' : 'Yes, pass on this pitch',
    },
  })
})
