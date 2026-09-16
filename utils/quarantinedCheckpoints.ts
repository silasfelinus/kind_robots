// /utils/quarantinedCheckpoints.ts
//
// Checkpoints a requeue must not silently re-run, and what to do instead.
//
// A queued ArtJob carries a FROZEN ComfyUI graph, written when it was first
// enqueued. Fixing the planner changes what future jobs are built with and does
// nothing whatsoever to a graph already in the database. That gap is not
// theoretical: on 2026-09-16 two jobs were requeued from the dashboard on the
// understanding that their problems had been fixed, and both came back with the
// original defect intact because the fixes only ever applied to new work.
//
//   - ArtJob 22838 still named Pony/ponyFaetality_v11.safetensors. That
//     checkpoint hung the relay three times (conductor/t-167, still unresolved
//     with root cause unknown). kind_robots#2766 removed it from the probe's
//     base preference, which stopped NEW plans choosing it and left this row
//     pointing at it, at priority 100, near the front of the queue.
//   - ArtJob 25378 still ran a Z-Image checkpoint through CheckpointLoaderSimple.
//     kind_robots#2773 added a dedicated Z-Image lane, which is a different
//     graph shape; this row kept the SD-shaped one that cannot work, because
//     Z-Image ships its text encoder separately and there is no CLIP to find.
//
// The tell in both cases is `attempts: 0` with the payload untouched. A requeue
// resets the counter; it never re-derives the graph.
//
// Two kinds of entry, because the two failures have different remedies. A
// quarantined checkpoint with a `replacement` is mechanically repairable -- the
// swap is the whole fix, and the caller is told it happened. One without a
// replacement, and the lane mismatch below, cannot be repaired by substitution
// and must be refused so a human re-plans it.

export type QuarantinedCheckpoint = {
  /** Substring matched against the graph's ckpt_name/unet_name. */
  match: string
  reason: string
  /** Swap in automatically when set; refuse the requeue when not. */
  replacement?: string
}

export const QUARANTINED_CHECKPOINTS: QuarantinedCheckpoint[] = [
  {
    match: 'ponyFaetality',
    reason:
      'hung the relay three times (conductor/t-167, root cause unresolved)',
    // Silas, 2026-09-15: "I actually think realcartoonpony is a great default.
    // It's highly consistent in my tests and one of my favorites."
    replacement: 'Pony/realcartoonPony_v1.safetensors',
  },
]

/** Z-Image ships its text encoder separately; an SD-shaped graph finds no CLIP. */
const ZIMAGE_MARKERS = ['zimage', 'z_image', 'z-image']

export type RequeueAssessment =
  | { action: 'allow' }
  | { action: 'repoint'; from: string; to: string; reason: string }
  | { action: 'block'; reason: string }

type GraphNode = {
  class_type?: unknown
  inputs?: Record<string, unknown> | null
}

function checkpointNodes(
  workflow: Record<string, unknown> | null | undefined,
): Array<{ id: string; node: GraphNode; name: string }> {
  if (!workflow || typeof workflow !== 'object') return []
  const found: Array<{ id: string; node: GraphNode; name: string }> = []
  for (const [id, raw] of Object.entries(workflow)) {
    if (!raw || typeof raw !== 'object') continue
    const node = raw as GraphNode
    const cls = String(node.class_type ?? '')
    if (!cls.includes('Checkpoint') && cls !== 'UNETLoader' && cls !== 'UnetLoaderGGUF') {
      continue
    }
    const inputs = node.inputs ?? {}
    const name = String(inputs.ckpt_name ?? inputs.unet_name ?? '')
    if (name) found.push({ id, node, name })
  }
  return found
}

/**
 * Decide whether a frozen graph is safe to re-run as-is. Pure: callers apply
 * the repoint themselves so the change can be reported rather than done
 * silently.
 */
export function assessRequeueSafety(
  workflow: Record<string, unknown> | null | undefined,
): RequeueAssessment {
  for (const { node, name } of checkpointNodes(workflow)) {
    const lower = name.toLowerCase()

    if (
      ZIMAGE_MARKERS.some((marker) => lower.includes(marker)) &&
      String(node.class_type ?? '').includes('Checkpoint')
    ) {
      return {
        action: 'block',
        reason: `${name} is a Z-Image checkpoint on an SD-shaped graph, which cannot resolve a text encoder. Re-plan it through the zimage lane instead of requeueing this row.`,
      }
    }

    for (const entry of QUARANTINED_CHECKPOINTS) {
      if (!lower.includes(entry.match.toLowerCase())) continue
      if (!entry.replacement) {
        return { action: 'block', reason: `${name} ${entry.reason}.` }
      }
      return {
        action: 'repoint',
        from: name,
        to: entry.replacement,
        reason: `${name} ${entry.reason}`,
      }
    }
  }
  return { action: 'allow' }
}

/** Apply a `repoint` in place, returning whether anything actually changed. */
export function applyRequeueRepoint(
  workflow: Record<string, unknown> | null | undefined,
  from: string,
  to: string,
): boolean {
  let changed = false
  for (const { node, name } of checkpointNodes(workflow)) {
    if (name !== from || !node.inputs) continue
    if ('ckpt_name' in node.inputs) node.inputs.ckpt_name = to
    else if ('unet_name' in node.inputs) node.inputs.unet_name = to
    changed = true
  }
  return changed
}
