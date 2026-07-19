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
  console.log(`Applied ${label}.`)
}

replaceExact(
  'stores/collectionStore.ts',
  `type CollectionPatchInput = {
  label?: string
  description?: string
  isPublic?: boolean
  isMature?: boolean
  artImageIds?: number[]
  disconnectArtImageIds?: number[]
}`,
  `type CollectionPatchInput = {
  label?: string
  slug?: string | null
  parentFolder?: string | null
  description?: string | null
  isPublic?: boolean
  isMature?: boolean
  artPrompt?: string | null
  artImageIds?: number[]
  addArtImageIds?: number[]
  removeArtImageIds?: number[]
  mode?: 'replace' | 'add'
}`,
  'ArtCollection patch input contract',
)

replaceExact(
  'stores/collectionStore.ts',
  `  function getCurrentUserId(): number {
    return Number(userStore.userId ?? userStore.user?.id ?? 10)
  }`,
  `  function getCurrentUserId(): number {
    return Number(userStore.userId ?? userStore.user?.id ?? 0)
  }`,
  'collection user 10 fallback',
)

replaceExact(
  'stores/collectionStore.ts',
  `  async function createCollection(
    label: string,
    userId: number,
    isPublic?: boolean,
    isMature?: boolean,
  ): Promise<ArtCollection> {
    const body: Record<string, unknown> = { label, userId }

    if (typeof isPublic === 'boolean') body.isPublic = isPublic
    if (typeof isMature === 'boolean') body.isMature = isMature`,
  `  async function createCollection(
    label: string,
    isPublic?: boolean,
    isMature?: boolean,
  ): Promise<ArtCollection> {
    const body: Record<string, unknown> = { label }

    if (typeof isPublic === 'boolean') body.isPublic = isPublic
    if (typeof isMature === 'boolean') body.isMature = isMature`,
  'collection create signature and body identity',
)

replaceExact(
  'stores/collectionStore.ts',
  '    return await createCollection(label, userId, isPublic, isMature)',
  '    return await createCollection(label, isPublic, isMature)',
  'get-or-create collection call',
)

replaceExact(
  'components/art/add-collection.vue',
  `:disabled="isSaving || disabled || !label.trim() || !resolvedUserId"`,
  `:disabled="isSaving || disabled || !label.trim()"`,
  'collection create button identity dependency',
)

replaceExact(
  'components/art/add-collection.vue',
  `import { useCollectionStore } from '@/stores/collectionStore'
import { useUserStore } from '@/stores/userStore'`,
  `import { useCollectionStore } from '@/stores/collectionStore'`,
  'unused collection component user store import',
)

replaceExact(
  'components/art/add-collection.vue',
  `const collectionStore = useCollectionStore()
const userStore = useUserStore()`,
  `const collectionStore = useCollectionStore()`,
  'unused collection component user store',
)

replaceExact(
  'components/art/add-collection.vue',
  `
const resolvedUserId = computed(() => {
  return userStore.userId || userStore.user?.id || 0
})
`,
  ``,
  'collection component resolved user identity',
)

replaceExact(
  'components/art/add-collection.vue',
  `async function createCollection() {
  const cleanLabel = label.value.trim()
  const userId = resolvedUserId.value`,
  `async function createCollection() {
  const cleanLabel = label.value.trim()`,
  'collection component body identity variable',
)

replaceExact(
  'components/art/add-collection.vue',
  `
  if (!userId) {
    setMessage('error', 'You need a user before creating a collection.')
    return
  }
`,
  ``,
  'collection component user identity gate',
)

replaceExact(
  'components/art/add-collection.vue',
  `    const collection = await collectionStore.createCollection(
      cleanLabel,
      userId,
      isPublic.value,
      isMature.value,
    )`,
  `    const collection = await collectionStore.createCollection(
      cleanLabel,
      isPublic.value,
      isMature.value,
    )`,
  'collection component create call',
)

replaceExact(
  'cypress/e2e/api/artcollection.cy.ts',
  `        description: 'Cypress ArtCollection test fixture',
        userId,
        artImageIds: [artImageId],`,
  `        description: 'Cypress ArtCollection test fixture',
        artImageIds: [artImageId],`,
  'ArtCollection Cypress body identity',
)

replaceExact(
  'cypress/e2e/api/relationships.cy.ts',
  `          label: \`cypress-relationship-collection-\${time}\`,
          description: 'Cypress relationship ArtCollection fixture',
          userId,
          artImageIds: [id('artImage')],`,
  `          label: \`cypress-relationship-collection-\${time}\`,
          description: 'Cypress relationship ArtCollection fixture',
          artImageIds: [id('artImage')],`,
  'relationship ArtCollection body identity',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  'Resolved since this audit: achievement writes are authenticated and ownership-aware; Stripe billing identity comes from authentication; Component mutations require admins; bot seed is admin-only; dead SD model switching was removed; art upload, ArtImage create/collections, browser health reports, and logs enforce ownership.',
  'Resolved since this audit: achievement writes are authenticated and ownership-aware; Stripe billing identity comes from authentication; Component mutations require admins; bot seed is admin-only; dead SD model switching was removed; art upload, ArtImage and ArtCollection mutations, browser health reports, and logs enforce ownership.',
  'ArtCollection ownership security resolution note',
)

replaceExact(
  'docs/architecture/thin-resource-api-audit.md',
  '| ArtImage create and lookup | Create accepted caller ownership plus Server/Checkpoint and many unrelated relationship IDs; the by-IDs helper posted lookup bodies to the create route | Create derives ownership from auth and accepts scalar metadata only; relationship writes stay explicit; bounded visibility-aware `/by-ids` lookup now owns batch retrieval |',
  '| ArtImage create and lookup | Create accepted caller ownership plus Server/Checkpoint and many unrelated relationship IDs; the by-IDs helper posted lookup bodies to the create route | Create derives ownership from auth and accepts scalar metadata only; relationship writes stay explicit; bounded visibility-aware `/by-ids` lookup now owns batch retrieval |\n| ArtCollection membership | Create/PATCH accepted any existing ArtImage ID, so collection owners could attach another user’s private images; store and fixtures still sent body identity | Collection ownership comes from auth, add/replace requires owned active images, relation commands are bounded and unambiguous, empty replace clears membership, and callers no longer send user IDs |',
  'ArtCollection ownership audit row',
)
