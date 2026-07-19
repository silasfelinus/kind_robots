import { readFileSync, writeFileSync } from 'node:fs'

function replaceExact(path, target, replacement, label) {
  const source = readFileSync(path, 'utf8')
  const newline = source.includes('\r\n') ? '\r\n' : '\n'
  const normalizedSource = source.replace(/\r\n/g, '\n')

  if (!normalizedSource.includes(target)) {
    throw new Error(`Expected ${label} was not found in ${path}.`)
  }

  const updated = normalizedSource.replace(target, replacement)
  writeFileSync(path, updated.replace(/\n/g, newline), 'utf8')
}

replaceExact(
  'stores/artStore.ts',
  `type ArtImageConnectionInput = {
  userId?: number | null
  serverId?: number | null
  checkpointResourceId?: number | null

  dreamIds?: number[]
  scenarioIds?: number[]
  reactionIds?: number[]
  butterflyIds?: number[]
  artCollectionIds?: number[]

  disconnectDreamIds?: number[]
  disconnectScenarioIds?: number[]
  disconnectReactionIds?: number[]
  disconnectButterflyIds?: number[]
  disconnectArtCollectionIds?: number[]

  clearDirectLinks?: boolean
  clearDreams?: boolean
  clearScenarios?: boolean
  clearReactions?: boolean
  clearButterflies?: boolean
  clearArtCollections?: boolean
}`,
  `type ArtImageConnectionInput = {
  artCollectionIds?: number[]
  disconnectArtCollectionIds?: number[]
  clearArtCollections?: boolean
}`,
  'ArtImage collection-only connection type',
)

replaceExact(
  'stores/artStore.ts',
  `  async function updateArtImageDreams(
    id: number,
    dreamIds: number[],
  ): Promise<ApiResponse<ArtImage>> {
    return await updateArtImageConnections(id, {
      dreamIds,
    })
  }

`,
  '',
  'dead ArtImage Dream connection action',
)

replaceExact(
  'stores/artStore.ts',
  `    updateArtImageDreams,
`,
  '',
  'dead ArtImage Dream connection export',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  'Resolved since this audit: achievement writes are authenticated and ownership-aware; Stripe billing identity comes from authentication; Component mutations require admins; bot seed is admin-only; dead SD model switching was removed; art uploads now derive ownership from authentication and reject relationship fields.',
  'Resolved since this audit: achievement writes are authenticated and ownership-aware; Stripe billing identity comes from authentication; Component mutations require admins; bot seed is admin-only; dead SD model switching was removed; art upload derives ownership from authentication; ArtImage connection PATCH is collection-only and checks collection ownership.',
  'ArtImage connection security resolution note',
)

replaceExact(
  'docs/architecture/thin-resource-api-audit.md',
  '| Art upload | Public multipart POST trusted caller user IDs, defaulted ownership to user 10, and connected unrelated resources during file creation | Upload requires authentication, derives owner from the token, validates image type/size, rejects identity and relationship fields, and creates only one ArtImage; callers link collections and targets through explicit APIs |',
  '| Art upload | Public multipart POST trusted caller user IDs, defaulted ownership to user 10, and connected unrelated resources during file creation | Upload requires authentication, derives owner from the token, validates image type/size, rejects identity and relationship fields, and creates only one ArtImage; callers link collections and targets through explicit APIs |\n| ArtImage collection links | Generic connection PATCH let image owners transfer ownership and attach arbitrary Bots, Dreams, Rewards, Servers, and other resources | Endpoint now manages collection membership only, requires image ownership, requires collection ownership for connects, validates all IDs, and rejects unrelated fields |',
  'ArtImage collection connection audit row',
)
