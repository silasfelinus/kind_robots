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
