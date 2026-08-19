// /utils/scripts/verifySocialPostDraft.test.ts
//
// Regression test for kind-economy/t-025 (labelled-AI social content
// pipeline, draft-only). Exercises server/utils/socialPostDraft.ts's pure
// core -- no prisma, no database, no Nuxt/H3 runtime -- same discipline as
// utils/scripts/verifyCreatorEarnings.test.ts and
// utils/scripts/verifyRevenueSplit.test.ts.
//
// What this does NOT cover (documented, not silently skipped): the actual
// prisma calls inside populateSocialDraftsFromDailyDreams(),
// listSocialPostDrafts(), approveSocialPostDraft(), rejectSocialPostDraft(),
// and countApprovedToday() require a real database connection and are not
// exercised here -- this sandbox has neither a live MariaDB instance nor
// Docker available to start one.
import assert from 'node:assert/strict'

import {
  DAILY_APPROVAL_CEILING_PER_PLATFORM,
  FALLBACK_DISCLOSURE_LABEL,
  SOCIAL_PLATFORMS_V1,
  assertValidSocialPostDraftInput,
  buildSocialPostDraftInput,
  composeAmiPostText,
  disclosureLabelFor,
  isEligibleForSocialDraft,
  isWithinDailyApprovalCeiling,
  planSocialDraftsForCandidates,
  startOfNextUtcDay,
  startOfUtcDay,
  type DailyDreamDraftCandidate,
} from '../../server/utils/socialPostDraft.js'

function candidate(
  overrides: Partial<DailyDreamDraftCandidate> & { sourceId: number },
): DailyDreamDraftCandidate {
  return {
    sourceId: overrides.sourceId,
    title: overrides.title ?? 'A Daily Dream',
    // `in` checks, not `??` -- a deliberately-passed `null`/`''` override
    // (used below to test ineligibility) must not be papered over by the
    // default.
    text:
      'text' in overrides
        ? (overrides.text ?? null)
        : 'A short pitch about a strange, wonderful place.',
    artImageUrl:
      'artImageUrl' in overrides
        ? (overrides.artImageUrl ?? null)
        : '/images/art/dream-1.webp',
    alreadyQueuedPlatforms: overrides.alreadyQueuedPlatforms ?? [],
  }
}

// --- disclosureLabelFor: rule #1, structurally required, never empty ------

{
  // Every v1 platform must resolve to a non-empty label.
  for (const platform of SOCIAL_PLATFORMS_V1) {
    const label = disclosureLabelFor(platform)
    assert.ok(
      label && label.trim().length > 0,
      `disclosureLabelFor(${platform}) must never return an empty label`,
    )
  }

  assert.equal(
    disclosureLabelFor('INSTAGRAM'),
    'AI info',
    'Instagram must use its native "AI info" content label',
  )
  assert.equal(
    disclosureLabelFor('BLUESKY'),
    FALLBACK_DISCLOSURE_LABEL,
    'Bluesky has no native per-post AI-content label, so it must use the fallback string',
  )
}

console.log(
  '✅ disclosureLabelFor: every v1 platform resolves to a non-empty label; Instagram uses its native label, Bluesky uses the fallback',
)

// --- composeAmiPostText: disclosure is always baked into bodyText ---------

{
  const text = composeAmiPostText(
    {
      title: 'The Glass Orchard',
      text: 'A grove where the fruit sings at dusk.',
    },
    'BLUESKY',
  )
  assert.ok(
    text.includes(FALLBACK_DISCLOSURE_LABEL),
    'composed bodyText for Bluesky must contain the disclosure text itself, not just a separate field',
  )
  assert.ok(text.length <= 300, 'must respect the Bluesky character budget')
}

{
  const longText = 'x'.repeat(5000)
  const text = composeAmiPostText(
    { title: 'Very Long Dream', text: longText },
    'INSTAGRAM',
  )
  assert.ok(
    text.includes('AI info'),
    'even a heavily-truncated Instagram post must still carry its disclosure text',
  )
  assert.ok(text.length <= 2000, 'must respect the Instagram character budget')
}

console.log(
  '✅ composeAmiPostText: disclosure text is always present in bodyText, even under truncation, for every platform',
)

// --- isEligibleForSocialDraft --------------------------------------------

{
  const withBoth = candidate({ sourceId: 1 })
  assert.equal(isEligibleForSocialDraft(withBoth, 'BLUESKY'), true)

  const noText = candidate({ sourceId: 2, text: null })
  assert.equal(
    isEligibleForSocialDraft(noText, 'BLUESKY'),
    false,
    'content with no written text is not eligible',
  )

  const blankText = candidate({ sourceId: 3, text: '   ' })
  assert.equal(isEligibleForSocialDraft(blankText, 'BLUESKY'), false)

  const noArt = candidate({ sourceId: 4, artImageUrl: null })
  assert.equal(
    isEligibleForSocialDraft(noArt, 'BLUESKY'),
    false,
    'content with no linked art is not eligible',
  )

  const alreadyQueued = candidate({
    sourceId: 5,
    alreadyQueuedPlatforms: ['BLUESKY'],
  })
  assert.equal(
    isEligibleForSocialDraft(alreadyQueued, 'BLUESKY'),
    false,
    'content already queued for this platform is not eligible again',
  )
  assert.equal(
    isEligibleForSocialDraft(alreadyQueued, 'INSTAGRAM'),
    true,
    'being queued for one platform does not block a different platform',
  )
}

console.log(
  '✅ isEligibleForSocialDraft: requires both art and text, and respects per-platform already-queued state',
)

// --- buildSocialPostDraftInput + assertValidSocialPostDraftInput ----------

{
  const input = buildSocialPostDraftInput(
    candidate({ sourceId: 10 }),
    'BLUESKY',
  )
  assert.equal(
    input.status,
    'DRAFT',
    'a freshly built draft input is always DRAFT',
  )
  assert.equal(input.sourceType, 'DREAM')
  assert.equal(input.sourceId, 10)
  assert.ok(input.disclosureLabel.trim().length > 0)
  assert.ok(
    input.bodyText.includes(input.disclosureLabel),
    'the built bodyText must contain the exact disclosureLabel text',
  )

  // Must not throw -- a well-formed input passes the backstop assertion.
  assertValidSocialPostDraftInput(input)
}

{
  // The backstop rejects a hand-assembled input with an empty disclosure --
  // this is rule #1's last line of defense.
  assert.throws(
    () =>
      assertValidSocialPostDraftInput({
        platform: 'BLUESKY',
        sourceType: 'DREAM',
        sourceId: 1,
        bodyText: 'hello',
        disclosureLabel: '',
        mediaUrl: null,
        status: 'DRAFT',
      }),
    /disclosureLabel must never be empty/,
  )

  assert.throws(
    () =>
      assertValidSocialPostDraftInput({
        platform: 'BLUESKY',
        sourceType: 'DREAM',
        sourceId: 1,
        bodyText: 'hello',
        disclosureLabel: '   ',
        mediaUrl: null,
        status: 'DRAFT',
      }),
    /disclosureLabel must never be empty/,
    'a whitespace-only disclosure must be rejected too, not just a literal empty string',
  )
}

console.log(
  '✅ buildSocialPostDraftInput / assertValidSocialPostDraftInput: every built draft is DRAFT with a populated disclosure; the backstop rejects a hand-built draft with a blank disclosure',
)

// --- planSocialDraftsForCandidates ----------------------------------------

{
  const candidates = [
    candidate({ sourceId: 1 }),
    candidate({ sourceId: 2, text: null }), // ineligible everywhere
    candidate({ sourceId: 3, alreadyQueuedPlatforms: ['BLUESKY'] }), // eligible only for INSTAGRAM
  ]

  const planned = planSocialDraftsForCandidates(candidates)

  // sourceId 1: both platforms. sourceId 2: none. sourceId 3: INSTAGRAM only.
  assert.equal(planned.length, 3)
  assert.equal(
    planned.filter((p) => p.sourceId === 1).length,
    2,
    'a fully-eligible candidate produces one draft per v1 platform',
  )
  assert.equal(
    planned.filter((p) => p.sourceId === 2).length,
    0,
    'an ineligible candidate produces no drafts',
  )
  const forThree = planned.filter((p) => p.sourceId === 3)
  assert.equal(forThree.length, 1)
  assert.equal(forThree[0]?.platform, 'INSTAGRAM')

  for (const draft of planned) {
    assert.equal(draft.status, 'DRAFT')
    assert.ok(draft.disclosureLabel.trim().length > 0)
  }
}

console.log(
  '✅ planSocialDraftsForCandidates: only eligible (content, platform) pairs are planned, and every planned draft is DRAFT with a disclosure',
)

// --- volume ceiling ---------------------------------------------------------

{
  assert.equal(isWithinDailyApprovalCeiling(0), true)
  assert.equal(
    isWithinDailyApprovalCeiling(DAILY_APPROVAL_CEILING_PER_PLATFORM - 1),
    true,
  )
  assert.equal(
    isWithinDailyApprovalCeiling(DAILY_APPROVAL_CEILING_PER_PLATFORM),
    false,
    'at the ceiling, one more approval must be rejected',
  )
  assert.equal(
    isWithinDailyApprovalCeiling(DAILY_APPROVAL_CEILING_PER_PLATFORM + 5),
    false,
  )
}

console.log(
  `✅ isWithinDailyApprovalCeiling: enforces the ${DAILY_APPROVAL_CEILING_PER_PLATFORM}/platform/day hard cap at the boundary`,
)

// --- startOfUtcDay / startOfNextUtcDay -------------------------------------

{
  const mid = new Date('2026-08-19T17:42:03.123Z')
  const start = startOfUtcDay(mid)
  assert.equal(start.toISOString(), '2026-08-19T00:00:00.000Z')

  const next = startOfNextUtcDay(mid)
  assert.equal(next.toISOString(), '2026-08-20T00:00:00.000Z')
}

console.log(
  '✅ startOfUtcDay / startOfNextUtcDay: correct UTC calendar-day boundaries for the daily ceiling query',
)

console.log('✅ verifySocialPostDraft: all assertions passed')
