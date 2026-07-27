// Static closure contract for the canonical Facet migration.
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { FACET_EMERGENCY_FALLBACKS } from '../facetEmergencyFallbacks'

const root = process.cwd()

async function source(path: string): Promise<string> {
  return readFile(resolve(root, path), 'utf8')
}

function requireText(path: string, text: string, fragment: string): void {
  if (!text.includes(fragment)) {
    throw new Error(`${path} is missing Facet closure contract text: ${fragment}`)
  }
}

function forbidText(path: string, text: string, fragment: string): void {
  if (text.includes(fragment)) {
    throw new Error(`${path} contains retired Facet closure text: ${fragment}`)
  }
}

async function main(): Promise<void> {
  const files = {
    generator: 'stores/generatorStore.ts',
    fallback: 'utils/facetEmergencyFallbacks.ts',
    audit: 'utils/scripts/auditFacetCatalogData.ts',
    proseAudit: 'utils/scripts/auditFacetProseAssignments.ts',
    package: 'package.json',
    workflow: '.github/workflows/facet-catalog-contract.yml',
  } as const

  const text = Object.fromEntries(
    await Promise.all(
      Object.entries(files).map(
        async ([key, path]) => [key, await source(path)] as const,
      ),
    ),
  ) as Record<keyof typeof files, string>

  for (const key of [
    'genre',
    'species',
    'class',
    'alignment',
    'gender',
    'personality',
    'quirks',
    'backstory',
  ] as const) {
    const values = FACET_EMERGENCY_FALLBACKS[key]
    if (!values.length || values.length > 3) {
      throw new Error(
        `Emergency fallback ${key} must contain 1-3 values, found ${values.length}.`,
      )
    }
  }

  requireText(files.fallback, text.fallback, 'not a second creative catalog')
  requireText(files.generator, text.generator, 'useFacetCatalogStore')
  requireText(files.generator, text.generator, 'FACET_EMERGENCY_FALLBACKS')
  requireText(files.generator, text.generator, "facetValue('gender', 'gender')")
  requireText(files.generator, text.generator, "facetValue('backstory', 'backstory')")
  requireText(files.generator, text.generator, "facetValues('personality', count, 'personality')")
  requireText(files.generator, text.generator, "facetValues('quirks', count, 'quirks')")
  requireText(files.generator, text.generator, 'Names and honorifics are procedural language lexicons')

  for (const retired of [
    'const PERSONALITIES =',
    'const QUIRKS =',
    'const GENRES =',
    'const SPECIES =',
    'const CLASSES =',
    'const ALIGNMENTS =',
    'const GENDERS =',
    'const BACKGROUNDS =',
    'legacyFacetClassList',
    'legacyFacetGenreList',
    'legacyFacetBackstoryList',
    'legacyFacetPersonalityList',
    'legacyFacetQuirkList',
  ]) {
    forbidText(files.generator, text.generator, retired)
  }

  for (const code of [
    'FACET_WITHOUT_PROFILE',
    'PROFILE_WITHOUT_FACET',
    'ACTIVE_FACET_WITHOUT_ALIAS',
    'DUPLICATE_CANONICAL_VALUE',
    'MISSING_REQUIRED_ART',
    'ASSIGNMENT_WITHOUT_FACET',
    'ASSIGNMENT_WITHOUT_PROFILE',
    'INACTIVE_FACET_REFERENCED',
    'CHARACTER_ASSIGNMENT_TAXONOMY_MISMATCH',
    'BOT_ASSIGNMENT_TAXONOMY_MISMATCH',
    'CHARACTER_SCALAR_WITHOUT_ASSIGNMENT',
    'BOT_SCALAR_WITHOUT_ASSIGNMENT',
    'SCENARIO_GENRE_WITHOUT_ASSIGNMENT',
  ]) {
    requireText(files.audit, text.audit, code)
  }
  requireText(files.audit, text.audit, "const strict = args.has('--strict')")
  requireText(files.audit, text.audit, "const jsonOnly = args.has('--json')")
  requireText(files.audit, text.audit, "outputArg?.slice('--output='.length)")
  requireText(files.audit, text.audit, 'if (strict && severe.length)')
  requireText(files.audit, text.audit, 'prisma.$disconnect()')

  requireText(files.proseAudit, text.proseAudit, "taxonomy: { in: ['BACKSTORY', 'QUIRK'] }")
  requireText(files.proseAudit, text.proseAudit, "fieldKey: { in: ['backstory', 'quirks'] }")
  requireText(files.proseAudit, text.proseAudit, 'bespoke prose remains intentionally unlinked')
  requireText(files.proseAudit, text.proseAudit, 'if (strict && findings.length)')
  requireText(files.proseAudit, text.proseAudit, 'prisma.$disconnect()')

  // Both live audits are read-only. File-system writes are allowed only for the
  // primary audit's requested JSON report; Prisma mutations are not.
  for (const mutation of [
    'prisma.$transaction',
    '.create({',
    '.createMany({',
    '.update({',
    '.updateMany({',
    '.upsert({',
    '.delete({',
    '.deleteMany({',
  ]) {
    forbidText(files.audit, text.audit, mutation)
    forbidText(files.proseAudit, text.proseAudit, mutation)
  }

  requireText(files.package, text.package, '"audit:facet-data"')
  requireText(files.package, text.package, '"test:facet-closure"')
  requireText(files.workflow, text.workflow, 'Verify Facet closure')
  requireText(files.workflow, text.workflow, 'npm run test:facet-closure')

  process.stdout.write(
    'Facet closure verified: creative generation is catalog-first, emergency pools are bounded, and live audits are read-only.\n',
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
