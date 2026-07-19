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
  `type ArtImageCreateInput = Partial<ArtImage> &
  Record<string, unknown> & {
    rarity?: number | null
    connectedModelType?: string | null
    connectedModelId?: number | null
  }`,
  `type ArtImageCreateInput = {
  imageData?: string | null
  thumbnailData?: string | null
  fileName?: string | null
  fileType?: string | null
  imagePath?: string | null
  path?: string | null
  promptString?: string | null
  artPrompt?: string | null
  negativePrompt?: string | null
  checkpoint?: string | null
  sampler?: string | null
  seed?: number | null
  steps?: number | null
  cfg?: number | null
  cfgHalf?: boolean | null
  designer?: string | null
  genres?: string | null
  isPublic?: boolean | null
  isMature?: boolean | null
  isActive?: boolean | null
  serverName?: string | null
  serverUrl?: string | null
}`,
  'ArtImage scalar create input type',
)

replaceExact(
  'stores/artStore.ts',
  `      const response = await performFetch<ArtImage>('/api/art/image', {
        method: 'POST',
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
      })`,
  `      const payload: ArtImageCreateInput = {
        imageData: input.imageData,
        thumbnailData: input.thumbnailData,
        fileName: input.fileName,
        fileType: input.fileType,
        imagePath: input.imagePath,
        path: input.path,
        promptString: input.promptString,
        artPrompt: input.artPrompt,
        negativePrompt: input.negativePrompt,
        checkpoint: input.checkpoint,
        sampler: input.sampler,
        seed: input.seed,
        steps: input.steps,
        cfg: input.cfg,
        cfgHalf: input.cfgHalf,
        designer: input.designer,
        genres: input.genres,
        isPublic: input.isPublic,
        isMature: input.isMature,
        isActive: input.isActive,
        serverName: input.serverName,
        serverUrl: input.serverUrl,
      }

      const response = await performFetch<ArtImage>('/api/art/image', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      })`,
  'ArtImage scalar create payload',
)

replaceExact(
  'cypress/e2e/api/artcollection.cy.ts',
  `        seed: null,
        userId,
        isPublic: false,`,
  `        seed: null,
        isPublic: false,`,
  'ArtCollection fixture ArtImage identity field',
)

replaceExact(
  'cypress/e2e/api/relationships.cy.ts',
  `      fileName: \`relationship-\${time}.webp\`,
      fileType: 'webp',
      userId,
      seed: null,`,
  `      fileName: \`relationship-\${time}.webp\`,
      fileType: 'webp',
      seed: null,`,
  'relationship fixture ArtImage identity field',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  'Resolved since this audit: achievement writes are authenticated and ownership-aware; Stripe billing identity comes from authentication; Component mutations require admins; bot seed is admin-only; dead SD model switching was removed; art resources and browser health reports enforce ownership; log reads, writes, and deletion are self-scoped with admin override.',
  'Resolved since this audit: achievement writes are authenticated and ownership-aware; Stripe billing identity comes from authentication; Component mutations require admins; bot seed is admin-only; dead SD model switching was removed; art upload, ArtImage create/collections, browser health reports, and logs enforce ownership.',
  'ArtImage create security resolution note',
)

replaceExact(
  'docs/architecture/thin-resource-api-audit.md',
  '| Logs | Any authenticated user could list, read, or delete another user’s logs; POST accepted forged identity/timestamps; errors often returned HTTP 200 | Reads and deletes are owner/admin scoped, lists default to self, POST derives identity/time from auth, and every route returns explicit HTTP status envelopes |',
  '| Logs | Any authenticated user could list, read, or delete another user’s logs; POST accepted forged identity/timestamps; errors often returned HTTP 200 | Reads and deletes are owner/admin scoped, lists default to self, POST derives identity/time from auth, and every route returns explicit HTTP status envelopes |\n| ArtImage create and lookup | Create accepted caller ownership plus Server/Checkpoint and many unrelated relationship IDs; the by-IDs helper posted lookup bodies to the create route | Create derives ownership from auth and accepts scalar metadata only; relationship writes stay explicit; bounded visibility-aware `/by-ids` lookup now owns batch retrieval |',
  'ArtImage create and lookup audit row',
)
