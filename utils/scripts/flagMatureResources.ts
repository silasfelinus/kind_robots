// /utils/scripts/flagMatureResources.ts
//
// Sweep the Resource catalog and flag adult LoRAs/checkpoints that arrived
// untagged.
//
// WHY
// ---
// Silas, 2026-08-07: "we NEED to do an automatic pass on our resources. It's
// much better to have false positives for things wrongly tagged mature than
// those that are tagged safe, and there are clearly resources with nsfw phrases
// not tagged ... right now changing them requires me to manually edit, adjust,
// and save, which is time consuming and an nsfw activity."
//
// Two problems, both addressed here: untagged adult content is served to
// signed-out guests, and fixing it by hand means opening every offending record
// one at a time.
//
// SAFETY PROPERTIES, ON PURPOSE
// -----------------------------
//   1. DRY RUN BY DEFAULT. Nothing is written without --apply. The default run
//      prints exactly what would change, so the hit list can be read before the
//      catalog is touched.
//   2. IT ONLY EVER SETS isMature = true. It never clears a flag. Silas is
//      going to vet these by hand afterwards, and a later run must not undo
//      that work -- a sweep that can revert human judgment is a sweep nobody
//      can afford to re-run.
//   3. It reports WHICH terms matched, so a wrong flag can be traced to the
//      word that caused it rather than argued with.
//
// The false-positive bias is the point, not a defect -- see utils/matureTerms.
//
//   npx tsx utils/scripts/flagMatureResources.ts                 # dry run
//   npx tsx utils/scripts/flagMatureResources.ts --apply         # write
//   npx tsx utils/scripts/flagMatureResources.ts --tier explicit # strong only
//   npx tsx utils/scripts/flagMatureResources.ts --self-test     # no database
import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import {
  matchMatureTerms,
  matureScanText,
  type MatureTier,
} from './../matureTerms'

const apply = process.argv.includes('--apply')
const selfTest = process.argv.includes('--self-test')
const tierIndex = process.argv.indexOf('--tier')
const tierArg = tierIndex === -1 ? null : process.argv[tierIndex + 1]
const explicitOnly = tierArg === 'explicit'

/* -------------------------------------------------------------------------- */
/* self-test — the matcher's behaviour, provable without a database            */
/* -------------------------------------------------------------------------- */

if (selfTest) {
  const failures: string[] = []
  const hits = (text: string) => matchMatureTerms(text).map((m) => m.term)

  const mustMatch: [string, string][] = [
    ['nsfw_lora_v2.safetensors', 'nsfw'],
    ['big-boobs-slider', 'boobs'],
    ['style.nude.v2', 'nude'],
    ['Realistic Hentai Style', 'hentai'],
    ['a very sexy pinup', 'sexy'],
    ['[Exp] uncensored model', 'uncensored'],
  ]
  for (const [text, term] of mustMatch) {
    if (!hits(text).includes(term)) {
      failures.push(`expected ${JSON.stringify(text)} to match "${term}"`)
    }
  }

  /*
   * The substring trap. Every one of these is an ordinary English word that a
   * naive `includes()` pass flags, and flagging them would mean flagging most
   * of the catalog -- which is how a moderation list gets switched off.
   */
  const mustNotMatch = [
    'classic portrait style',
    'glass and brass textures',
    'analog film grain',
    'data analysis charts',
    'a document scanner',
    'cumulus clouds over a canal',
    'title card generator',
    'competitive constitution',
    'Cassandra character sheet',
    'passage through the grass',
    'brassica vegetables',
    'assassin creed armor',
  ]
  for (const text of mustNotMatch) {
    const found = hits(text)
    if (found.length) {
      failures.push(
        `${JSON.stringify(text)} wrongly matched ${found.join(', ')}`,
      )
    }
  }

  if (failures.length) {
    console.error('❌ matureTerms self-test FAILED:')
    for (const failure of failures) console.error(`  - ${failure}`)
    process.exit(1)
  }

  console.log(
    `✅ matureTerms self-test passed (${mustMatch.length} match, ${mustNotMatch.length} no-match cases).`,
  )
  process.exit(0)
}

/* -------------------------------------------------------------------------- */
/* the sweep                                                                   */
/* -------------------------------------------------------------------------- */

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({
  adapter: createDatabaseAdapter(databaseUrl),
})

const resources = await prisma.resource.findMany({
  select: {
    id: true,
    name: true,
    customLabel: true,
    description: true,
    triggerWords: true,
    defaultTrigger: true,
    artPrompt: true,
    localPath: true,
    resourceType: true,
    isMature: true,
  },
  orderBy: { id: 'asc' },
})

type Candidate = {
  id: number
  label: string
  type: string
  terms: string[]
  tiers: Set<MatureTier>
}

const candidates: Candidate[] = []
let alreadyFlagged = 0

for (const resource of resources) {
  if (resource.isMature) {
    alreadyFlagged += 1
    continue
  }

  const matches = matchMatureTerms(matureScanText(resource))
  const kept = explicitOnly
    ? matches.filter((match) => match.tier === 'explicit')
    : matches

  if (!kept.length) continue

  candidates.push({
    id: resource.id,
    label: resource.customLabel || resource.name || `Resource ${resource.id}`,
    type: String(resource.resourceType),
    terms: kept.map((match) => match.term),
    tiers: new Set(kept.map((match) => match.tier)),
  })
}

console.log(
  `Scanned ${resources.length} Resource(s). ${alreadyFlagged} already mature, ` +
    `${candidates.length} newly flagged${explicitOnly ? ' (explicit tier only)' : ''}.\n`,
)

/*
 * Explicit hits first, then by how many terms matched. A reviewer working down
 * this list should meet the least arguable rows first and reach the
 * single-soft-term maybes -- the ones most likely to be wrong -- last.
 */
const ranked = [...candidates].sort((a, b) => {
  const aExplicit = a.tiers.has('explicit') ? 1 : 0
  const bExplicit = b.tiers.has('explicit') ? 1 : 0
  if (aExplicit !== bExplicit) return bExplicit - aExplicit
  return b.terms.length - a.terms.length
})

for (const candidate of ranked) {
  const tier = candidate.tiers.has('explicit') ? 'EXPLICIT ' : 'suggestive'
  console.log(
    `  ${tier}  #${String(candidate.id).padEnd(6)} ${candidate.label.slice(0, 52).padEnd(54)} ${candidate.terms.join(', ')}`,
  )
}

const softOnly = ranked.filter((c) => !c.tiers.has('explicit'))
if (softOnly.length) {
  console.log(
    `\n${softOnly.length} of these matched ONLY suggestive terms. Those are the` +
      ` likeliest false positives — review them first in the gallery's` +
      ` "Mature only" view.`,
  )
}

if (!apply) {
  console.log(
    `\nDRY RUN — nothing was written. Re-run with --apply to set isMature on` +
      ` the ${candidates.length} Resource(s) above.` +
      `\nThis sweep only ever ADDS the flag; it never clears one, so hand-vetting` +
      ` afterwards is safe from a later re-run.`,
  )
  await prisma.$disconnect()
  process.exit(0)
}

if (!candidates.length) {
  console.log('\nNothing to write.')
  await prisma.$disconnect()
  process.exit(0)
}

const result = await prisma.resource.updateMany({
  where: { id: { in: candidates.map((candidate) => candidate.id) } },
  data: { isMature: true },
})

console.log(`\n✅ Flagged ${result.count} Resource(s) as mature.`)
await prisma.$disconnect()
