import { readFileSync, writeFileSync } from 'node:fs'

function replaceExact(path, target, replacement, label) {
  const source = readFileSync(path, 'utf8')

  if (!source.includes(target)) {
    throw new Error(`Expected ${label} was not found in ${path}.`)
  }

  writeFileSync(path, source.replace(target, replacement), 'utf8')
}

replaceExact(
  'stores/uploadStore.ts',
  `// API/storage expects the short form ('png', 'jpeg', 'webp'), not the MIME type.
function normalizeFileType(value: string | null | undefined): string {
  if (!value) return 'png'
  const lower = value.toLowerCase().trim()
  const short = lower.replace(/^image\\//, '')
  return short === 'jpg' ? 'jpeg' : short || 'png'
}

`,
  ``,
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
  `  function buildUploadFormData(
    file: File,
    target: ImageUploadTarget,
    userId: number,
    username: string,
    collectionLabel?: string,
    connectedModelType?: ConnectableModel | null,
    connectedModelId?: number | null,
    metadata?: UploadMetadata | null,
  ): FormData {
    const formData = new FormData()
    const galleryId = target.galleryId ?? 21
    const galleryName = target.galleryName ?? 'userUpload'
    const collectionId = getSelectedCollectionId(target)
    const designer = metadata?.designer?.trim() || username

    formData.append('image', file)
    formData.append('galleryName', galleryName)
    formData.append('galleryId', String(galleryId))
    formData.append('userId', String(userId))
    formData.append('fileType', normalizeFileType(file.type))
    formData.append('fileName', file.name)
    formData.append('designer', designer)

    appendOptionalString(
      formData,
      'promptString',
      metadata?.promptString ||
        target.promptString ||
        target.artPrompt ||
        '[UploadedImage]',
    )
    appendOptionalString(
      formData,
      'artPrompt',
      target.artPrompt ||
        metadata?.promptString ||
        target.promptString ||
        '[UploadedImage]',
    )
    appendOptionalString(formData, 'path', target.path || '[UploadedImage]')
    appendOptionalString(formData, 'collectionLabel', collectionLabel)

    appendOptionalNumber(formData, 'artCollectionId', collectionId)
    appendOptionalNumber(formData, 'collectionId', collectionId)

    // Optional generation metadata
    appendOptionalString(formData, 'negativePrompt', metadata?.negativePrompt)
    appendOptionalString(formData, 'checkpoint', metadata?.checkpoint)
    appendOptionalString(formData, 'sampler', metadata?.sampler)
    appendOptionalString(formData, 'genres', metadata?.genres)
    appendOptionalString(formData, 'serverName', metadata?.serverName)
    appendOptionalString(formData, 'serverUrl', metadata?.serverUrl)

    appendOptionalNumber(formData, 'seed', metadata?.seed)
    appendOptionalNumber(formData, 'steps', metadata?.steps)
    appendOptionalNumber(formData, 'cfg', metadata?.cfg)
    appendOptionalNumber(formData, 'rarity', metadata?.rarity)
    appendOptionalNumber(formData, 'serverId', metadata?.serverId)

    appendOptionalBoolean(formData, 'cfgHalf', metadata?.cfgHalf)
    appendOptionalBoolean(formData, 'isPublic', metadata?.isPublic)
    appendOptionalBoolean(formData, 'isMature', metadata?.isMature)

    if (connectedModelType && connectedModelId) {
      formData.append('connectedModelType', connectedModelType)
      formData.append('connectedModelId', String(connectedModelId))
    }

    return formData
  }`,
  `  function buildUploadFormData(
    file: File,
    target: ImageUploadTarget,
    username: string,
    metadata?: UploadMetadata | null,
  ): FormData {
    const formData = new FormData()
    const galleryName = target.galleryName ?? 'userUpload'
    const designer = metadata?.designer?.trim() || username

    formData.append('image', file)
    formData.append('galleryName', galleryName)
    formData.append('fileName', file.name)
    formData.append('designer', designer)

    appendOptionalString(
      formData,
      'promptString',
      metadata?.promptString ||
        target.promptString ||
        target.artPrompt ||
        '[UploadedImage]',
    )
    appendOptionalString(
      formData,
      'artPrompt',
      target.artPrompt ||
        metadata?.promptString ||
        target.promptString ||
        '[UploadedImage]',
    )
    appendOptionalString(formData, 'path', target.path || '[UploadedImage]')
    appendOptionalString(formData, 'negativePrompt', metadata?.negativePrompt)
    appendOptionalString(formData, 'sampler', metadata?.sampler)
    appendOptionalString(formData, 'genres', metadata?.genres)

    appendOptionalNumber(formData, 'seed', metadata?.seed)
    appendOptionalNumber(formData, 'steps', metadata?.steps)
    appendOptionalNumber(formData, 'cfg', metadata?.cfg)
    appendOptionalNumber(formData, 'rarity', metadata?.rarity)

    appendOptionalBoolean(formData, 'cfgHalf', metadata?.cfgHalf)
    appendOptionalBoolean(formData, 'isPublic', metadata?.isPublic)
    appendOptionalBoolean(formData, 'isMature', metadata?.isMature)

    return formData
  }`,
  'art upload multipart payload',
)

replaceExact(
  'stores/uploadStore.ts',
  `  async function uploadSingleFile(
    file: File,
    target: ImageUploadTarget,
    userId: number,
    username: string,
    collectionLabel?: string,
    connectedModelType?: ConnectableModel | null,
    connectedModelId?: number | null,
    metadata?: UploadMetadata | null,
  ): Promise<ArtImage> {
    const artStore = useArtStore()

    const formData = buildUploadFormData(
      file,
      target,
      userId,
      username,
      collectionLabel,
      connectedModelType,
      connectedModelId,
      metadata,
    )`,
  `  async function uploadSingleFile(
    file: File,
    target: ImageUploadTarget,
    username: string,
    collectionLabel?: string,
    connectedModelType?: ConnectableModel | null,
    connectedModelId?: number | null,
    metadata?: UploadMetadata | null,
  ): Promise<ArtImage> {
    const artStore = useArtStore()

    const formData = buildUploadFormData(file, target, username, metadata)`,
  'single upload payload call',
)

replaceExact(
  'stores/uploadStore.ts',
  `      const { userId, username } = getCurrentUser()
      const label = getSelectedCollectionLabel(target, collectionLabel)

      const artImage = await uploadSingleFile(
        file,
        target,
        userId,
        username,`,
  `      const username = getCurrentUsername()
      const label = getSelectedCollectionLabel(target, collectionLabel)

      const artImage = await uploadSingleFile(
        file,
        target,
        username,`,
  'single upload authenticated identity removal',
)

replaceExact(
  'stores/uploadStore.ts',
  `    const { userId, username } = getCurrentUser()
    const label = getSelectedCollectionLabel(target, collectionLabel)`,
  `    const username = getCurrentUsername()
    const label = getSelectedCollectionLabel(target, collectionLabel)`,
  'batch upload authenticated identity removal',
)

replaceExact(
  'stores/uploadStore.ts',
  `        const artImage = await uploadSingleFile(
          file,
          target,
          userId,
          username,`,
  `        const artImage = await uploadSingleFile(
          file,
          target,
          username,`,
  'batch upload payload call',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  `Resolved since this audit: achievement writes are authenticated and ownership-aware; Stripe billing identity comes from authentication; Component mutations require admins; bot seed is admin-only; the unused unauthenticated SD model-switch route and its dead Pinia action were removed.`,
  `Resolved since this audit: achievement writes are authenticated and ownership-aware; Stripe billing identity comes from authentication; Component mutations require admins; bot seed is admin-only; dead SD model switching was removed; art uploads now derive ownership from authentication and reject relationship fields.`,
  'art upload security resolution note',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  `| \`server/api/art/upload.post.ts:97\`                    | unauth; \`userId = getNumberField(...) \\|\\| 10\` → anon uploads as any user                |
`,
  ``,
  'resolved art upload exposure row',
)

replaceExact(
  'docs/architecture/thin-resource-api-audit.md',
  `| SD model switch | Unauthenticated route hard-coded a live GPU server, disagreed with the store request shape, and had no repository caller | Removed the dead route, unused Pinia action, and setter-only helper instead of preserving an unsafe global server mutation |`,
  `| SD model switch | Unauthenticated route hard-coded a live GPU server, disagreed with the store request shape, and had no repository caller | Removed the dead route, unused Pinia action, and setter-only helper instead of preserving an unsafe global server mutation |
| Art upload | Public multipart POST trusted caller user IDs, defaulted ownership to user 10, and connected unrelated resources during file creation | Upload requires authentication, derives owner from the token, validates image type/size, rejects identity and relationship fields, and creates only one ArtImage; callers link collections and targets through explicit APIs |`,
  'art upload audit row',
)
