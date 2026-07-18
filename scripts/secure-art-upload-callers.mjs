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

const normalizerBlock = [
  "// API/storage expects the short form ('png', 'jpeg', 'webp'), not the MIME type.",
  'function normalizeFileType(value: string | null | undefined): string {',
  "  if (!value) return 'png'",
  '  const lower = value.toLowerCase().trim()',
  "  const short = lower.replace(/^image\\//, '')",
  "  return short === 'jpg' ? 'jpeg' : short || 'png'",
  '}',
  '',
  '',
].join('\n')

replaceExact(
  'stores/uploadStore.ts',
  normalizerBlock,
  '',
  'dead client file-type normalizer',
)

replaceExact(
  'stores/uploadStore.ts',
  `  function getCurrentUser() {
    const userStore = useUserStore()

    return {
      userId: userStore.userId ?? userStore.user?.id ?? 10,
      username: userStore.username ?? userStore.user?.username ?? 'Kind Guest',
    }
  }`,
  `  function getCurrentUsername(): string {
    const userStore = useUserStore()

    return userStore.username ?? userStore.user?.username ?? 'Kind Designer'
  }`,
  'upload caller user fallback',
)

replaceExact(
  'stores/uploadStore.ts',
  `    userId: number,
`,
  '',
  'upload form user ID parameter',
)

replaceExact(
  'stores/uploadStore.ts',
  `    collectionLabel?: string,
    connectedModelType?: ConnectableModel | null,
    connectedModelId?: number | null,
`,
  '',
  'upload form relationship parameters',
)

replaceExact(
  'stores/uploadStore.ts',
  `    const galleryId = target.galleryId ?? 21
`,
  '',
  'upload form gallery ID',
)

replaceExact(
  'stores/uploadStore.ts',
  `    const collectionId = getSelectedCollectionId(target)
`,
  '',
  'upload form collection ID',
)

replaceExact(
  'stores/uploadStore.ts',
  `    formData.append('galleryId', String(galleryId))
    formData.append('userId', String(userId))
    formData.append('fileType', normalizeFileType(file.type))
`,
  '',
  'upload identity and derived file type fields',
)

replaceExact(
  'stores/uploadStore.ts',
  `    appendOptionalString(formData, 'collectionLabel', collectionLabel)

    appendOptionalNumber(formData, 'artCollectionId', collectionId)
    appendOptionalNumber(formData, 'collectionId', collectionId)

`,
  '',
  'upload collection relationship fields',
)

replaceExact(
  'stores/uploadStore.ts',
  `    appendOptionalString(formData, 'checkpoint', metadata?.checkpoint)
`,
  '',
  'unsupported checkpoint field',
)

replaceExact(
  'stores/uploadStore.ts',
  `    appendOptionalString(formData, 'serverName', metadata?.serverName)
    appendOptionalString(formData, 'serverUrl', metadata?.serverUrl)
`,
  '',
  'unsupported server metadata fields',
)

replaceExact(
  'stores/uploadStore.ts',
  `    appendOptionalNumber(formData, 'rarity', metadata?.rarity)
    appendOptionalNumber(formData, 'serverId', metadata?.serverId)
`,
  '',
  'unsupported rarity and server fields',
)

replaceExact(
  'stores/uploadStore.ts',
  `
    if (connectedModelType && connectedModelId) {
      formData.append('connectedModelType', connectedModelType)
      formData.append('connectedModelId', String(connectedModelId))
    }
`,
  '',
  'upload target relationship fields',
)

replaceExact(
  'stores/uploadStore.ts',
  `    userId: number,
    username: string,
`,
  `    username: string,
`,
  'single upload user ID parameter',
)

replaceExact(
  'stores/uploadStore.ts',
  `    const formData = buildUploadFormData(
      file,
      target,
      userId,
      username,
      collectionLabel,
      connectedModelType,
      connectedModelId,
      metadata,
    )`,
  `    const formData = buildUploadFormData(file, target, username, metadata)`,
  'single upload payload call',
)

replaceExact(
  'stores/uploadStore.ts',
  `      const { userId, username } = getCurrentUser()
`,
  `      const username = getCurrentUsername()
`,
  'single upload authenticated identity removal',
)

replaceExact(
  'stores/uploadStore.ts',
  `        userId,
        username,
`,
  `        username,
`,
  'single upload user ID argument',
)

replaceExact(
  'stores/uploadStore.ts',
  `    const { userId, username } = getCurrentUser()
`,
  `    const username = getCurrentUsername()
`,
  'batch upload authenticated identity removal',
)

replaceExact(
  'stores/uploadStore.ts',
  `          userId,
          username,
`,
  `          username,
`,
  'batch upload user ID argument',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  'Resolved since this audit: achievement writes are authenticated and ownership-aware; Stripe billing identity comes from authentication; Component mutations require admins; bot seed is admin-only; the unused unauthenticated SD model-switch route and its dead Pinia action were removed.',
  'Resolved since this audit: achievement writes are authenticated and ownership-aware; Stripe billing identity comes from authentication; Component mutations require admins; bot seed is admin-only; dead SD model switching was removed; art uploads now derive ownership from authentication and reject relationship fields.',
  'art upload security resolution note',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  '| `server/api/art/upload.post.ts:97`                    | unauth; `userId = getNumberField(...) \\|\\| 10` → anon uploads as any user                |\n',
  '',
  'resolved art upload exposure row',
)

replaceExact(
  'docs/architecture/thin-resource-api-audit.md',
  '| SD model switch | Unauthenticated route hard-coded a live GPU server, disagreed with the store request shape, and had no repository caller | Removed the dead route, unused Pinia action, and setter-only helper instead of preserving an unsafe global server mutation |',
  '| SD model switch | Unauthenticated route hard-coded a live GPU server, disagreed with the store request shape, and had no repository caller | Removed the dead route, unused Pinia action, and setter-only helper instead of preserving an unsafe global server mutation |\n| Art upload | Public multipart POST trusted caller user IDs, defaulted ownership to user 10, and connected unrelated resources during file creation | Upload requires authentication, derives owner from the token, validates image type/size, rejects identity and relationship fields, and creates only one ArtImage; callers link collections and targets through explicit APIs |',
  'art upload audit row',
)
