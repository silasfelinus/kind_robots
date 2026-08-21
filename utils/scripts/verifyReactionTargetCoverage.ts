// /utils/scripts/verifyReactionTargetCoverage.ts
//
// Every reaction category this route accepts must name a target column, and
// every reviewable object must be able to show its reviews.
//
// WHY
// ---
// getExpectedTargetField's map was Partial, and three enum values -- FACET,
// PROJECT, CHALLENGE_SUBMISSION -- were simply missing from it. `map[category]
// ?? null` returned null for all three, buildTargetWhere answered an empty
// where clause instead of throwing, and POST /api/reactions cheerfully wrote a
// Reaction with every foreign key null. The dedupe findFirst inherited that
// same empty clause, so a user's SECOND such reaction updated their first one
// -- across the whole table, not per object. One row per user, globally,
// silently overwritten.
//
// Nothing caught it because a missing map key is not a type error against a
// Partial Record. This script is the constraint that comment could not be:
//
//   1. the map is exhaustive over Reaction_reactionCategory;
//   2. a category with no target column is rejected, not accepted-and-ignored;
//   3. the store, the karma ref types and the route agree on the column names;
//   4. every KARMA_REF_TYPES entry can actually be read back.
//
//   npx tsx utils/scripts/verifyReactionTargetCoverage.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  KARMA_REF_TARGET_COLUMNS,
  KARMA_REF_TYPES,
  isKarmaRefType,
} from '@/utils/karmaRefTypes'

const root = process.cwd()
const routeSource = readFileSync(
  join(root, 'server/api/reactions/index.post.ts'),
  'utf8',
)
const schemaSource = readFileSync(join(root, 'prisma/schema.prisma'), 'utf8')

// ---------------------------------------------------------------- 1. exhaustive

const enumBlock = schemaSource.match(
  /enum Reaction_reactionCategory \{([\s\S]*?)\n\}/,
)?.[1]
assert.ok(enumBlock, 'Reaction_reactionCategory not found in the schema')

const categories = enumBlock
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => /^[A-Z_]+$/.test(line))

// A floor, not a count: it exists so a regex that silently matched an empty or
// truncated block cannot pass this file trivially. The real constraint is the
// exhaustiveness loop below. Lower it only when a value is deliberately
// retired from the enum -- 17 -> 16 when BUTTERFLY went in
// 20260821230000_retire_butterfly_reaction_target -- never to make a failure
// go away.
assert.ok(
  categories.length >= 16,
  `expected the full category enum, saw ${categories.length}`,
)

const mapBlock = routeSource.match(
  /const map: Record<\s*Reaction_reactionCategory,\s*ExpectedTargetField\s*> = \{([\s\S]*?)\n {2}\}/,
)?.[1]
assert.ok(
  mapBlock,
  'getExpectedTargetField no longer declares a total Record. A Partial map is how the untargeted-write bug happened; do not go back to one.',
)

for (const category of categories) {
  assert.ok(
    mapBlock.includes(`Reaction_reactionCategory.${category}`),
    `${category} is missing from getExpectedTargetField. Give it a target column or map it to null, but do not leave it out -- an unmapped category used to be written as an untargeted row.`,
  )
}

// ---------------------------------------------------------------- 2. fail closed

assert.match(
  routeSource,
  /if \(expectedField === TARGETLESS\) return \{\}/,
  'buildTargetWhere must treat a deliberately targetless category separately',
)
assert.match(
  routeSource,
  /is not supported\./,
  'buildTargetWhere must reject an unmapped category rather than returning an empty where clause',
)
assert.doesNotMatch(
  routeSource,
  /const expectedField = getExpectedTargetField\(category\)\n {2}if \(!expectedField\) return \{\}/,
  'the fail-open branch is back: an unmapped category would write an untargeted Reaction again',
)
assert.match(
  routeSource,
  /No access check is defined for/,
  'a target with no access check must be rejected, not silently allowed',
)

// ---------------------------------------------------------------- 3. one map

for (const target of KARMA_REF_TYPES) {
  const column = KARMA_REF_TARGET_COLUMNS[target]
  assert.equal(
    column,
    `${target}Id`,
    `${target} maps to ${column}; the convention is <target>Id and the route derives karma refType by stripping the Id suffix`,
  )

  // MESSAGE is the only targetless category and has no karma ref type, so every
  // entry here must appear as a real column in the route's map.
  assert.ok(
    routeSource.includes(`'${column}'`),
    `${column} is a karma ref type but the reaction route never names it`,
  )
}

// -------------------------------------------------- 3b. writable, not just named
//
// The check above only asks whether the column is mentioned anywhere in the
// file, and that is not enough. `facetId` appeared in the body type, the create
// allow-list, getTargetFields, getExpectedTargetField, the owner lookup,
// contentTargetLabels and REVIEWABLE_TARGETS -- seven places -- but NOT in
// contentTargetModel. So assertReactionTargetAccessible fell through to its
// fail-closed branch and every FACET reaction 400'd with "No access check is
// defined for facetId", while 961 published facet comments sat there unreplyable.
// A mention is not a wiring; the access-check map is the one that has to be
// complete, because it is the one that fails closed.

const accessModelBlock = routeSource.match(
  /function contentTargetModel\(field: string\) \{[\s\S]*?const map: Record<[\s\S]*?> = \{([\s\S]*?)\n {2}\}/,
)?.[1]
assert.ok(
  accessModelBlock,
  'contentTargetModel no longer declares its map; the access check is what keeps an unchecked reaction from being written.',
)

for (const target of KARMA_REF_TYPES) {
  const column = KARMA_REF_TARGET_COLUMNS[target]
  // chat has its own participant branch above the fail-closed fallthrough and
  // deliberately never reaches contentTargetModel.
  if (column === 'chatId') continue

  assert.ok(
    new RegExp(`\\b${column}:`).test(accessModelBlock),
    `${column} has no entry in contentTargetModel, so every reaction on a ${target} is rejected with "No access check is defined for ${column}." Being listed in the other maps is not enough -- this is the one that fails closed.`,
  )
}

assert.ok(isKarmaRefType('facet'), 'facet must be a reaction target')
assert.ok(!isKarmaRefType('message'), 'MESSAGE has no target column and earns no karma')

// ---------------------------------------------------------------- 4. readable

// Reviews were write-only: four hand-written read routes (art, chat, component,
// dream) served thirteen target types, and the store asks for
// /api/reactions/<targetType>/<id> using camelCase names that never matched the
// `art` directory. The catch-all is what makes a review survive a page reload.
const readRoute = readFileSync(
  join(root, 'server/api/reactions/[target]/[id].get.ts'),
  'utf8',
)

assert.match(
  readRoute,
  /isKarmaRefType\(target\)/,
  'the catch-all read route must validate its target against the shared list',
)
assert.match(
  readRoute,
  /KARMA_REF_TARGET_COLUMNS\[target\]/,
  'the read route must resolve its column from the shared map, not a local copy',
)
assert.match(
  readRoute,
  /statusCode: 403/,
  'reactions are only as public as the object they hang on; a private target must not leak its list',
)

const storeSource = readFileSync(join(root, 'stores/reactionStore.ts'), 'utf8')
assert.match(
  storeSource,
  /KARMA_REF_TARGET_COLUMNS/,
  'the store must share the column map rather than restating it',
)
assert.match(
  storeSource,
  /payload\?\.reactions \|\| \[\]/,
  'the store must tolerate both the flat and { reactions } envelopes -- the mismatch was swallowed as an error and left every list empty',
)

console.log(
  `Reaction target coverage verified: ${categories.length} categories mapped, ${KARMA_REF_TYPES.length} readable target types.`,
)
