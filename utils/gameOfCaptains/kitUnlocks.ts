import { SPACE_COUCH_KIT } from '../playbookKit/games/spaceCouch'
import { slugify } from './artSlots'
import { antagonistFor, type VoyageRun } from './rules'

// Space Couch -> Playbook Kit: which scrapbook moments, reveals and endings a
// voyage has earned, read only from the VoyageRun the game already saves under
// game-of-captains-voyage-v1. Pure and idempotent: the store feeds the result
// to kit.unlock after every save, and the kit keeps the first-seen stamp, so
// a moment once earned stays earned even after the run moves on.

export const SPACE_COUCH_KIT_ID = SPACE_COUCH_KIT.id

export type SpaceCouchKitUnlocks = {
  moments: string[]
  reveals: string[]
  endings: string[]
}

const COUNTER_ENDINGS = new Set(
  ['THE UNION CANCELLATION', 'THE WITNESS COALITION'].map(slugify),
)
const SPEC_ENDINGS = new Set(SPACE_COUCH_KIT.endings.map((e) => e.id))
const FOLLOWER_MOMENTS = SPACE_COUCH_KIT.moments.filter(
  (m) => m.kind === 'follower',
)

export function spaceCouchKitUnlocks(
  run: VoyageRun | null | undefined,
): SpaceCouchKitUnlocks {
  const out: SpaceCouchKitUnlocks = { moments: [], reveals: [], endings: [] }
  if (!run) return out
  const moment = (id: string, when: unknown) => {
    if (when) out.moments.push(id)
  }
  const reveal = (id: string, when: unknown) => {
    if (when) out.reveals.push(id)
  }

  const history = run.missionHistory ?? []
  const answered = (missionId: string) =>
    history.some((h) => h.missionId === missionId && h.policy !== 'missed')
  const launched = history.length > 0 || run.phase !== 'briefing'
  const nemesisActive =
    (run.nemesisPressure ?? 0) > 0 || !!run.nemesisEnding || !!run.ending
  const nemesis = antagonistFor(run).id
  const detoured = new Set((run.journeyHistory ?? []).map((j) => j.crewId))
  const endingId = run.ending ? slugify(run.ending) : null
  const finale = run.phase === 'finale' || run.phase === 'ending'

  // Act one: choosing a captain is what starts a voyage.
  moment('captain-choice', true)
  moment('couch-launch', true)
  moment('mission-board', true)
  moment('bubble-glint', launched)
  moment(
    'first-contact',
    history.some((h) => h.policy !== 'missed'),
  )
  moment('holodeck-fold', run.pocketRoom === 'holodeck')
  // Act two.
  moment('war-room', run.pocketRoom === 'war-room')
  moment(
    'vox-refuge',
    answered('serendipity-last-call') ||
      (run.venueProgress?.choices ?? []).some((c) => c.venue === 'bar'),
  )
  moment('auditor-ledger', nemesis === 'auditor' && nemesisActive)
  moment('showrunner-casting', nemesis === 'showrunner' && nemesisActive)
  // Act three.
  moment('final-gate', finale || !!run.ending)
  moment('homeward', !!run.ending)
  for (const m of FOLLOWER_MOMENTS)
    moment(
      m.id,
      m.about.some((id) => detoured.has(id as never)),
    )

  reveal('shield-secret', run.shieldCharge === 0)
  reveal('fold-secret', !!run.pocketRoom)
  reveal('odyssey-secret', detoured.size > 0)
  reveal('nemesis-secret', nemesisActive)
  reveal('strike-secret', answered('foundry-strike'))
  reveal('council-secret', !!endingId && COUNTER_ENDINGS.has(endingId))

  if (endingId && SPEC_ENDINGS.has(endingId)) out.endings.push(endingId)
  return out
}
