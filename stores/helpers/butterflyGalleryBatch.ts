export type ButterflyBatchFailure = {
  entryId: number
  message: string
}

export type ButterflyBatchResult = {
  attempted: number
  succeededIds: number[]
  failures: ButterflyBatchFailure[]
}

export type ButterflyBatchPreview = {
  count: number
  requiresConfirmation: boolean
  reason: 'destructive' | 'expensive' | null
}

export function previewButterflyBatch(
  entryIds: number[],
  options: { destructive?: boolean; expensive?: boolean } = {},
): ButterflyBatchPreview {
  const count = new Set(entryIds).size
  const reason = options.destructive
    ? 'destructive'
    : options.expensive
      ? 'expensive'
      : null

  return {
    count,
    requiresConfirmation: count > 0 && reason !== null,
    reason,
  }
}

export async function executeButterflyBatch(
  entryIds: number[],
  action: (entryId: number) => Promise<boolean>,
): Promise<ButterflyBatchResult> {
  const uniqueIds = [...new Set(entryIds)]
  const succeededIds: number[] = []
  const failures: ButterflyBatchFailure[] = []

  for (const entryId of uniqueIds) {
    try {
      const succeeded = await action(entryId)
      if (succeeded) succeededIds.push(entryId)
      else failures.push({ entryId, message: 'Action was not applied.' })
    } catch (error) {
      failures.push({
        entryId,
        message: error instanceof Error ? error.message : 'Action failed.',
      })
    }
  }

  return {
    attempted: uniqueIds.length,
    succeededIds,
    failures,
  }
}

/** One edit applied to every selected artwork. `move` relocates the real
 * files under the archive root; `new-collection` creates the collection
 * once and adds the whole selection to it. */
export type ButterflyBatchEdit =
  | { type: 'rating'; rating: number | null }
  | { type: 'move'; folder: string }
  | { type: 'add-collection'; collection: string; label?: string }
  | { type: 'new-collection'; label: string }
  | { type: 'remove-collection'; collection: string; label?: string }
  | { type: 'trash' }
  | { type: 'restore' }

export function describeButterflyBatchEdit(edit: ButterflyBatchEdit): string {
  switch (edit.type) {
    case 'rating':
      return edit.rating === null ? 'Clear rating' : `Rate ${edit.rating}★`
    case 'move':
      return `Move to ${edit.folder || 'the archive root'}`
    case 'add-collection':
      return `Add to ${edit.label || edit.collection}`
    case 'new-collection':
      return `Add to new collection ${edit.label}`
    case 'remove-collection':
      return `Remove from ${edit.label || edit.collection}`
    case 'trash':
      return 'Trash'
    case 'restore':
      return 'Restore'
  }
}
