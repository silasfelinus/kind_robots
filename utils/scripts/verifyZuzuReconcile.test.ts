// /utils/scripts/verifyZuzuReconcile.test.ts
//
// kind-robots/t-142 (GitHub #3390). The Zuzu reconciliation runs against
// production rows with an admin token that the API lets patch ANY row, so the
// planner is the only thing standing between a canon sync and someone else's
// Character. These checks pin ownership, ambiguity, visibility and idempotence.
import assert from 'node:assert/strict'
import {
  assertZuzuWriteIsSafe,
  auditZuzuResources,
  mapZuzuDreams,
  normalizeZuzuIdentity,
  planZuzuReconciliation,
  simulateZuzuApply,
  zuzuDesiredPayload,
  zuzuPatchPreconditionsHold,
  zuzuRowMayMatch,
  type ZuzuExistingState,
  type ZuzuPatchAction,
  type ZuzuPlanAction,
  type ZuzuSubmissions,
} from '../zuzuReconcile'

const ADMIN = 1
const OTHER = 42
const GENRE = 'dark weird-west samurai animal fable'

const submissions: ZuzuSubmissions = {
  characters: [
    {
      key: 'zuzu-koala-assassin',
      canon_scope: 'Book One canon',
      source_path:
        'projects/comic-creator/issues/zuzu-koala-assassin-01/BOOK-ONE.md',
      payload: {
        name: 'Zuzu',
        slug: 'zuzu-koala-assassin',
        species: 'koala',
        genre: GENRE,
        backstory: 'A small, grave koala ronin.',
        presentation: 'short and stocky; rust-brown poncho',
        isPublic: false,
        isMature: false,
        artImageId: 242395,
      },
    },
    {
      key: 'coyote-vagrant',
      canon_scope: 'Book One canon',
      payload: {
        name: 'Coyote Vagrant',
        slug: 'coyote-vagrant',
        species: 'coyote',
        genre: GENRE,
        backstory: 'A hungry, battered one-eyed drifter.',
        isPublic: false,
        isMature: false,
      },
    },
    {
      key: 'storm-crow',
      canon_scope: 'Showdown/world faction, not Book One established',
      payload: {
        name: 'Storm Crow',
        slug: 'storm-crow',
        species: 'crow',
        genre: GENRE,
        backstory: 'A captain of the Storm Crows.',
        // A submission that forgot the privacy flag must still create private.
        isPublic: true,
        isMature: false,
      },
    },
  ],
  rewards: [
    {
      key: 'zuzu-travel-kasa',
      canon_scope: 'story prop, mechanical reward effect is editorial',
      payload: {
        name: "Zuzu's Kasa",
        slug: 'zuzu-travel-kasa',
        description: 'The broad straw travel hat.',
        effect: 'Mundane apparel.',
        collection: 'Zuzu: Koala Assassin',
        isPublic: false,
        isMature: false,
      },
    },
  ],
  scenarios: [
    {
      key: 'zuzu-watering-hole',
      canon_scope: 'Book One canonical sequence.',
      payload: {
        title: 'The Watering Hole',
        slug: 'zuzu-watering-hole',
        description: 'A lone koala ronin and a desperate coyote.',
        inspirations: 'Zuzu: Koala Assassin project canon',
        isPublic: false,
        isMature: false,
      },
    },
  ],
  model_resources: [
    { name: 'Zuzu character LoRA', trigger: 'zuzukoala' },
    { name: 'Coyote LoRA', trigger: 'zkacoyote' },
    { name: 'Abbess LoRA', trigger: 'zkaabbess' },
  ],
}

function emptyState(): ZuzuExistingState {
  return { Character: [], Reward: [], Scenario: [], Dream: [], Resource: [] }
}

function find(actions: ZuzuPlanAction[], key: string): ZuzuPlanAction {
  const action = actions.find((candidate) => candidate.key === key)
  assert.ok(action, `no action for ${key}`)
  return action
}

function writes(actions: ZuzuPlanAction[]): ZuzuPlanAction[] {
  return actions.filter(
    (action) => action.action === 'create' || action.action === 'patch',
  )
}

// --- Identity normalization -------------------------------------------------
assert.equal(normalizeZuzuIdentity('The Fennec Sister'), 'fennec sister')
assert.equal(normalizeZuzuIdentity("  Zuzu's   KASA "), 'zuzu s kasa')
assert.equal(normalizeZuzuIdentity(null), '')

// --- Empty database: everything is a private create -------------------------
{
  const plan = planZuzuReconciliation({
    submissions,
    existing: emptyState(),
    adminUserId: ADMIN,
  })
  assert.deepEqual(plan.counts, { create: 5, patch: 0, skip: 0, conflict: 0 })
  for (const action of plan.actions) {
    assert.equal(action.action, 'create')
    if (action.action === 'create') {
      assert.equal(
        action.payload.isPublic,
        false,
        `${action.key} must be private`,
      )
      assertZuzuWriteIsSafe(action, ADMIN)
    }
  }

  // Game-only and editorial material is labeled, never silently canon.
  const crow = find(plan.actions, 'storm-crow')
  assert.ok(crow.action === 'create')
  assert.match(String(crow.payload.backstory), /Showdown\/game continuity only/)
  const kasa = find(plan.actions, 'zuzu-travel-kasa')
  assert.ok(kasa.action === 'create')
  assert.match(String(kasa.payload.effect), /Game mechanic: editorial/)
  const zuzu = find(plan.actions, 'zuzu-koala-assassin')
  assert.ok(zuzu.action === 'create')
  assert.equal(zuzu.payload.backstory, 'A small, grave koala ronin.')

  // Labeling is idempotent: a labeled payload is not labeled twice.
  const relabeled = zuzuDesiredPayload('Character', {
    ...submissions.characters[2]!,
    payload: {
      ...submissions.characters[2]!.payload,
      backstory: crow.payload.backstory,
    },
  })
  assert.equal(relabeled.backstory, crow.payload.backstory)

  // Idempotence: planning against the applied state writes nothing.
  const after = simulateZuzuApply(emptyState(), plan)
  const second = planZuzuReconciliation({
    submissions,
    existing: after,
    adminUserId: ADMIN,
  })
  assert.deepEqual(second.counts, { create: 0, patch: 0, skip: 5, conflict: 0 })
  for (const row of [...after.Character, ...after.Reward, ...after.Scenario]) {
    assert.equal(row.isPublic, false)
    assert.equal(row.userId, ADMIN)
  }
}

// --- Mixed legacy state -----------------------------------------------------
function legacyState(): ZuzuExistingState {
  return {
    Character: [
      // Admin-owned legacy filler for Zuzu: patch creative fields only.
      {
        id: 10,
        userId: ADMIN,
        name: 'Zuzu',
        slug: null,
        species: 'koala',
        genre: 'Gallowsun gothic western',
        backstory: 'An ancient assassin of the Gallowsun order. (LLM filler)',
        presentation: null,
        quirks: 'Collects bells',
        isPublic: true,
        isMature: false,
        artImageId: 999,
      },
      // Another account's Zuzu-flavoured coyote: never ours to patch.
      {
        id: 11,
        userId: OTHER,
        name: 'Coyote Vagrant',
        slug: 'coyote-vagrant',
        genre: GENRE,
        backstory: 'Fan fiction about Zuzu.',
        isPublic: true,
      },
      // An unrelated Storm Crow from another world, another owner: ignored.
      {
        id: 12,
        userId: OTHER,
        name: 'Storm Crow',
        slug: 'storm-crow',
        genre: 'space opera',
        backstory: 'A starship pilot.',
        isPublic: true,
      },
      // Similar-name Zuzu row next to an exact match: related, not blocking.
      {
        id: 13,
        userId: ADMIN,
        name: "Zuzu's Last Name",
        backstory: 'A riddle about Zuzu.',
        isPublic: true,
      },
      // Legacy filler coyote under another name, linked from Dream 183.
      { id: 14, userId: ADMIN, name: 'Dusty', species: 'coyote' },
    ],
    Reward: [
      // Admin-owned legacy Kasa; the name itself is Zuzu provenance.
      {
        id: 20,
        userId: ADMIN,
        name: "Zuzu's Kasa",
        slug: 'zuzus-kasa',
        description: 'A hat.',
        collection: 'Hats',
        isPublic: false,
      },
    ],
    Scenario: [
      // No text markers, but linked from legacy Dream 183: provenance holds.
      {
        id: 30,
        userId: ADMIN,
        title: 'The Watering Hole',
        slug: 'zuzu-watering-hole',
        description: 'An oasis encounter. (LLM filler)',
        inspirations: null,
        isPublic: false,
        isMature: false,
      },
      // Legacy Dream scenario that maps to no canon entry: reported only.
      { id: 31, userId: ADMIN, title: 'Gallows Hill', isPublic: true },
    ],
    Dream: [
      {
        id: 183,
        userId: ADMIN,
        title: 'Legacy Dream',
        isPublic: true,
        isMature: false,
        Characters: [{ id: 10 }, { id: 14 }],
        Scenarios: [{ id: 30 }, { id: 31 }],
        Rewards: [],
      },
      {
        id: 184,
        userId: ADMIN,
        title: 'Unrelated garden dream',
        Characters: [],
      },
    ],
    Resource: [
      {
        id: 500,
        userId: ADMIN,
        name: 'Zuzu Koala',
        resourceType: 'LORA',
        triggerWords: ['zuzukoala'],
        localPath: 'loras/zuzukoala.safetensors',
        isPublic: false,
      },
      { id: 501, name: 'zkacoyote_v1-000002', defaultTrigger: 'zkacoyote' },
      { id: 502, name: 'zkacoyote_v1', triggerWords: 'zkacoyote, western' },
    ],
  }
}

{
  // The admin token is admin. Name the user the plan is acting as wrong and
  // the "owned" rows become someone else's: nothing may be patched.
  const asOther = planZuzuReconciliation({
    submissions,
    existing: legacyState(),
    adminUserId: 7,
  })
  assert.equal(asOther.counts.patch, 0)

  const plan = planZuzuReconciliation({
    submissions,
    existing: legacyState(),
    adminUserId: ADMIN,
  })

  const zuzu = find(plan.actions, 'zuzu-koala-assassin')
  assert.equal(zuzu.action, 'patch')
  const zuzuPatch = zuzu as ZuzuPatchAction
  assert.equal(zuzuPatch.id, 10)
  assert.equal(zuzuPatch.ownerId, ADMIN)
  assert.ok(!('isPublic' in zuzuPatch.payload), 'patch must not touch isPublic')
  assert.ok(!('isMature' in zuzuPatch.payload), 'patch must not touch isMature')
  assert.ok(!('name' in zuzuPatch.payload), 'patch must not rename')
  assert.equal(
    zuzuPatch.payload.slug,
    'zuzu-koala-assassin',
    'missing slug is filled',
  )
  assert.ok(
    !('artImageId' in zuzuPatch.payload),
    'existing art is not replaced',
  )
  assert.ok(!('species' in zuzuPatch.payload), 'unchanged field is not sent')
  assert.equal(zuzuPatch.payload.genre, GENRE)
  assert.equal(zuzuPatch.payload.backstory, 'A small, grave koala ronin.')
  assert.deepEqual(
    zuzuPatch.diffs.find((diff) => diff.field === 'backstory')?.before,
    'An ancient assassin of the Gallowsun order. (LLM filler)',
  )
  assert.deepEqual(zuzuPatch.untouchedLegacyFields, ['quirks'])
  assert.ok(zuzuPatch.advisories.some((note) => note.includes('artImageId')))
  assert.ok(zuzuPatch.advisories.some((note) => note.includes('public')))
  assert.deepEqual(
    zuzuPatch.related.map((row) => [row.id, row.basis]),
    [[13, 'similar-name']],
    'a similar-name Zuzu row does not block the exact owned match',
  )
  assertZuzuWriteIsSafe(zuzuPatch, ADMIN)

  const coyote = find(plan.actions, 'coyote-vagrant')
  assert.equal(coyote.action, 'conflict')
  assert.ok(
    coyote.action === 'conflict' &&
      /not owned by the admin/.test(coyote.reason),
  )
  assert.deepEqual(
    coyote.action === 'conflict' &&
      coyote.candidates.map((row) => [row.id, row.basis]),
    [
      [11, 'slug'],
      [14, 'linked-species'],
    ],
  )

  const crow = find(plan.actions, 'storm-crow')
  assert.equal(
    crow.action,
    'create',
    'unrelated other-world row is not a duplicate',
  )
  assert.ok(
    crow.action === 'create' &&
      crow.advisories.some((note) => note.includes('#12')),
  )

  const kasa = find(plan.actions, 'zuzu-travel-kasa')
  assert.equal(kasa.action, 'patch')
  const kasaPatch = kasa as ZuzuPatchAction
  assert.ok(
    !('slug' in kasaPatch.payload),
    'an existing slug is never rewritten',
  )
  assert.ok(kasaPatch.advisories.some((note) => note.includes('slug')))
  assert.match(String(kasaPatch.payload.effect), /Game mechanic: editorial/)

  const hole = find(plan.actions, 'zuzu-watering-hole')
  assert.equal(hole.action, 'patch', 'Dream 183 link counts as provenance')

  assert.deepEqual(plan.counts, { create: 1, patch: 3, skip: 0, conflict: 1 })

  // The CLI only detail-fetches rows zuzuRowMayMatch keeps, so it must keep
  // every row the planner can target or name in a conflict.
  const state = legacyState()
  const linkedCharacters = new Set(plan.dreams.flatMap((d) => d.characterIds))
  for (const action of plan.actions) {
    const ids =
      action.action === 'patch' || action.action === 'skip'
        ? [action.id, ...action.related.map((row) => row.id)]
        : action.action === 'conflict'
          ? action.candidates.map((candidate) => candidate.id)
          : []
    for (const id of ids) {
      const row = state[action.kind].find((candidate) => candidate.id === id)!
      assert.ok(
        zuzuRowMayMatch(
          action.kind,
          row,
          submissions,
          action.kind === 'Character' ? linkedCharacters : undefined,
        ),
        `prefilter drops #${id}`,
      )
    }
  }
  assert.equal(
    zuzuRowMayMatch('Character', { id: 99, name: 'Garden Gnome' }, submissions),
    false,
  )

  // Dreams are mapped, never planned.
  assert.deepEqual(
    plan.dreams.map((dream) => dream.id),
    [183],
  )
  assert.deepEqual(plan.dreams[0]!.characterIds, [10, 14])

  // Legacy Dream rows that match no canon entry are surfaced, not touched.
  assert.deepEqual(
    plan.unmatchedLegacyRows.map((row) => [row.kind, row.id]),
    [['Scenario', 31]],
  )

  // Resources are audited against actual rows only; epochs are not finals.
  assert.deepEqual(
    plan.resources.map((audit) => [
      audit.trigger,
      audit.status,
      audit.finalResourceId,
    ]),
    [
      ['zuzukoala', 'resource-row-found', 500],
      ['zkacoyote', 'resource-row-found', 502],
      ['zkaabbess', 'not-imported', null],
    ],
  )
  assert.equal(plan.resources[1]!.matches.length, 2)

  // Idempotence against a simulated apply: no writes, conflicts unchanged.
  const after = simulateZuzuApply(legacyState(), plan)
  const second = planZuzuReconciliation({
    submissions,
    existing: after,
    adminUserId: ADMIN,
  })
  assert.equal(writes(second.actions).length, 0)
  assert.deepEqual(second.counts, { create: 0, patch: 0, skip: 4, conflict: 1 })
  assert.equal(after.Character.find((row) => row.id === 10)!.isPublic, true)
  assert.equal(
    after.Character.find((row) => row.id === 11)!.backstory,
    'Fan fiction about Zuzu.',
  )
  const third = planZuzuReconciliation({
    submissions,
    existing: simulateZuzuApply(after, second),
    adminUserId: ADMIN,
  })
  assert.equal(third.hash, second.hash)

  // The hash is deterministic and moves when a row the plan relies on moves.
  const again = planZuzuReconciliation({
    submissions,
    existing: legacyState(),
    adminUserId: ADMIN,
  })
  assert.equal(again.hash, plan.hash)
  const edited = legacyState()
  edited.Character[0]!.backstory = 'Edited by Silas between dry run and apply.'
  const moved = planZuzuReconciliation({
    submissions,
    existing: edited,
    adminUserId: ADMIN,
  })
  assert.notEqual(moved.hash, plan.hash)

  // Optimistic concurrency at apply time.
  assert.equal(
    zuzuPatchPreconditionsHold(zuzuPatch, legacyState().Character[0]!),
    true,
  )
  assert.equal(
    zuzuPatchPreconditionsHold(zuzuPatch, edited.Character[0]!),
    false,
  )
  assert.equal(
    zuzuPatchPreconditionsHold(zuzuPatch, {
      ...legacyState().Character[0]!,
      userId: OTHER,
    }),
    false,
  )
}

// --- Ambiguity --------------------------------------------------------------
{
  const state = emptyState()
  state.Character.push(
    { id: 1, userId: ADMIN, name: 'Zuzu', genre: GENRE },
    {
      id: 2,
      userId: ADMIN,
      name: 'zuzu',
      slug: 'zuzu-koala-assassin',
      genre: GENRE,
    },
    // Similar-name Zuzu row with no exact twin.
    { id: 3, userId: ADMIN, name: 'Coyote', backstory: 'Met Zuzu once.' },
    // Admin-owned same-name row from some other world.
    { id: 4, userId: ADMIN, name: 'Storm Crow', genre: 'space opera' },
  )
  const plan = planZuzuReconciliation({
    submissions,
    existing: state,
    adminUserId: ADMIN,
  })
  const crow = find(plan.actions, 'storm-crow')
  assert.equal(crow.action, 'conflict')
  assert.ok(
    crow.action === 'conflict' && /no Zuzu provenance/.test(crow.reason),
  )
  const zuzu = find(plan.actions, 'zuzu-koala-assassin')
  assert.equal(zuzu.action, 'conflict')
  assert.ok(zuzu.action === 'conflict' && zuzu.candidates.length === 2)
  const coyote = find(plan.actions, 'coyote-vagrant')
  assert.equal(coyote.action, 'conflict')
  assert.ok(coyote.action === 'conflict' && /similar-name/.test(coyote.reason))
}

// One row may never be the target of two submission entries.
{
  const doubled: ZuzuSubmissions = {
    characters: [
      submissions.characters[0]!,
      {
        key: 'zuzu-alias',
        payload: {
          name: 'Zuzu Alias',
          slug: 'zuzu-koala-assassin',
          genre: GENRE,
        },
      },
    ],
    rewards: [],
    scenarios: [],
  }
  const state = emptyState()
  state.Character.push({
    id: 9,
    userId: ADMIN,
    name: 'Zuzu',
    slug: 'zuzu-koala-assassin',
    genre: GENRE,
  })
  const plan = planZuzuReconciliation({
    submissions: doubled,
    existing: state,
    adminUserId: ADMIN,
  })
  assert.deepEqual(plan.counts, { create: 0, patch: 0, skip: 0, conflict: 2 })
}

// --- Write gate -------------------------------------------------------------
{
  const base = {
    kind: 'Character' as const,
    key: 'x',
    label: 'X',
    canonScope: null,
    sourcePath: null,
  }
  assert.throws(() =>
    assertZuzuWriteIsSafe(
      {
        ...base,
        action: 'create',
        payload: { name: 'X', isPublic: true },
        advisories: [],
      },
      ADMIN,
    ),
  )
  const patch: ZuzuPatchAction = {
    ...base,
    action: 'patch',
    id: 5,
    ownerId: OTHER,
    diffs: [],
    payload: { backstory: 'y' },
    advisories: [],
    untouchedLegacyFields: [],
    related: [],
  }
  assert.throws(() => assertZuzuWriteIsSafe(patch, ADMIN), /not admin/)
  assert.throws(
    () =>
      assertZuzuWriteIsSafe(
        { ...patch, ownerId: ADMIN, payload: { isPublic: false } },
        ADMIN,
      ),
    /isPublic/,
  )
  assert.throws(() =>
    assertZuzuWriteIsSafe(
      { ...base, action: 'conflict', reason: 'r', candidates: [] },
      ADMIN,
    ),
  )
  assert.throws(() =>
    planZuzuReconciliation({
      submissions,
      existing: emptyState(),
      adminUserId: 0,
    }),
  )
}

// --- Standalone helpers -----------------------------------------------------
assert.deepEqual(
  mapZuzuDreams([{ id: 7, title: 'Koala Assassin reprise' }])[0]!.id,
  7,
)
assert.deepEqual(mapZuzuDreams([{ id: 8, title: 'Garden' }]), [])
assert.equal(
  auditZuzuResources(
    [{ name: 'n', trigger: 'ZKASISTER' }],
    [{ id: 1, name: 'zkasister v2' }],
  )[0]!.status,
  'resource-row-found',
)
// Two final-looking rows for one trigger: no Resource id is claimed.
const twoFinals = auditZuzuResources(
  [{ name: 'n', trigger: 'zkaabbess' }],
  [
    { id: 1, name: 'zkaabbess_v1' },
    { id: 2, name: 'zkaabbess_v2' },
  ],
)[0]!
assert.equal(twoFinals.status, 'ambiguous')
assert.equal(twoFinals.finalResourceId, null)

console.log('verifyZuzuReconcile: all assertions passed')
