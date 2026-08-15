// /utils/scripts/verifyModelBuilderFacetSync.ts
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { containsCode } from './lib/sourceText'

const root = process.cwd()

async function source(path: string): Promise<string> {
  return readFile(resolve(root, path), 'utf8')
}

function requireText(path: string, text: string, fragment: string): void {
  if (!text.includes(fragment)) {
    throw new Error(`${path} is missing Model Builder Facet contract text: ${fragment}`)
  }
}

function forbidText(path: string, text: string, fragment: string): void {
  if (containsCode(text, fragment)) {
    throw new Error(`${path} contains retired Model Builder Facet text: ${fragment}`)
  }
}

async function main(): Promise<void> {
  const files = {
    fields: 'stores/helpers/modelBuilderFields.ts',
    commit: 'server/api/model-builder/items/[id]/commit.post.ts',
    characterSync: 'server/utils/characterFacetSync.ts',
    botSync: 'server/utils/botFacetSync.ts',
    profileInput: 'server/utils/facetProfileInput.ts',
  } as const

  const entries = await Promise.all(
    Object.entries(files).map(
      async ([key, path]) => [key, await source(path)] as const,
    ),
  )
  const text = Object.fromEntries(entries) as Record<keyof typeof files, string>

  requireText(files.fields, text.fields, 'const FACET_TAXONOMIES = [')
  requireText(files.fields, text.fields, "key: 'taxonomy'")
  requireText(files.fields, text.fields, "'PROMPT_ENHANCEMENT'")
  forbidText(files.fields, text.fields, 'const FACET_KINDS')
  forbidText(files.fields, text.fields, "key: 'kind'")

  requireText(files.commit, text.commit, 'syncCharacterFacetsInTransaction')
  requireText(files.commit, text.commit, 'syncBotFacetsInTransaction')
  /* t-072 dropped the physical Facet.kind column, which made the
     legacyFacetKindForTaxonomy() derivation dead code -- so these flipped from
     "must derive it" to "must not resurrect it". FacetProfile.taxonomy is the
     only classification left. */
  forbidText(files.commit, text.commit, 'legacyFacetKindForTaxonomy')
  requireText(files.commit, text.commit, 'buildFacetProfileCreateData')
  requireText(files.commit, text.commit, 'buildFacetProfileUpdateData')
  requireText(files.commit, text.commit, "pickChoice<FacetTaxonomy>(fields, 'Facet', 'taxonomy')")
  requireText(files.commit, text.commit, 'await syncCharacterFacetsInTransaction(tx, character, syncOptions)')
  requireText(files.commit, text.commit, 'await syncBotFacetsInTransaction(tx, bot, syncOptions)')
  requireText(files.commit, text.commit, 'await prisma.$transaction((tx) =>')
  requireText(files.commit, text.commit, 'syncFacetProfileUpdate(tx, id, fields)')
  forbidText(files.commit, text.commit, 'import type { FacetKind')
  forbidText(files.commit, text.commit, "pickChoice<FacetKind>(fields, 'Facet', 'kind')")
  /* t-029: two UPDATE-type build runs can target the same existing Facet at
     once (nothing serializes runs by sourceId). A plain create-if-missing on
     FacetProfile races on its `facetId` unique key and aborts the whole
     commit transaction for the loser. facetProfile.upsert() resolves
     create-vs-update atomically at the database instead of crashing. */
  requireText(files.commit, text.commit, 'await tx.facetProfile.upsert({')
  forbidText(files.commit, text.commit, 'await tx.facetProfile.create({ data: { facetId: id')

  requireText(files.characterSync, text.characterSync, "backstory: ['BACKSTORY']")
  requireText(files.characterSync, text.characterSync, "quirks: ['QUIRK']")
  requireText(files.botSync, text.botSync, "taxonomy: { in: ['BOT_TYPE', 'PERSONALITY'] }")
  requireText(files.profileInput, text.profileInput, 'Facet kind is deprecated. Use taxonomy instead.')

  process.stdout.write(
    'Model Builder Facet synchronization verified: Character/Bot writes and Facet taxonomy updates are transactional.\n',
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
