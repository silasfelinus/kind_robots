// /server/api/conductor/pitch-inbox.get.ts
// Public, signature-gated. ONE page for every undecided pitch: the digest's links all
// land here, so Silas decides the day's five in a single visit. GET only shows state.
import { listPendingPitches } from '@/server/utils/conductorPitchVote'
import {
  parsePitchPicks,
  renderPitchDecisionPage,
  renderPitchInboxPage,
  verifyPitchInbox,
} from '@/server/utils/pitchDecisionLink'

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
  const check = verifyPitchInbox(secret, query)
  if (!check.ok) {
    setResponseStatus(event, check.reason === 'expired' ? 410 : 400)
    return renderPitchDecisionPage({
      heading:
        check.reason === 'expired'
          ? 'This link has expired'
          : 'This link is not valid',
      body: '<p>Open the Conductor project page to decide pitches.</p>',
    })
  }

  const picks = parsePitchPicks(query.pick)
  const pending = await listPendingPitches()
  return renderPitchInboxPage({
    exp: check.exp,
    sig: String(query.sig),
    cards: pending.map((pitch) => ({
      ...pitch,
      choice: picks[pitch.slug] ?? 'later',
    })),
  })
})
