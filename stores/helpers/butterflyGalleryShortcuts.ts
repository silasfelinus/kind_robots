// Non-drag keyboard sorting shortcuts (butterfly-gallery/t-020). Pure intent
// resolution, kept separate from pages/butterfly-gallery.vue's DOM wiring so
// the guard conditions (no modifier keys, no editable-target capture, gallery
// must be `ready`, a selection must exist for sort/trash) are unit-testable
// without mounting the page. A PR review on t-020 flagged an earlier version
// that bound this handler on `window` -- global capture meant `Delete` could
// trash the selected image while focus sat on unrelated page chrome. The fix
// is DOM-side (bind on the page's own root element instead of `window`, so
// only keydowns that bubble from inside the gallery reach the handler); this
// module is the part of the fix that regression-tests actually reach.
import type {
  ButterflyBinConfig,
  ButterflyGalleryStatus,
} from '@/types/butterflyGallery'

export type ButterflyShortcutIntent =
  | { type: 'select'; entryId: number }
  | { type: 'sort'; binId: string }
  | { type: 'trash' }

export interface ButterflyShortcutContext {
  key: string
  hasModifier: boolean
  isEditableTarget: boolean
  status: ButterflyGalleryStatus
  selectedEntryId: number | null
  pileEntryIds: number[]
  leftBins: Pick<ButterflyBinConfig, 'id' | 'label'>[]
}

/** Extracts the digit from a preset bin label like `"5★ Keep"`, matching the
 * page's own presetRating()/presetLabel() convention. */
export function presetShortcutKey(label: string): string | undefined {
  return label.match(/(\d)★/)?.[1]
}

/** Resolves a keydown to a gallery intent, or null if this key isn't a
 * sorting shortcut right now. Callers own actually invoking the store. */
export function resolveButterflyShortcutIntent(
  ctx: ButterflyShortcutContext,
): ButterflyShortcutIntent | null {
  if (ctx.hasModifier || ctx.isEditableTarget || ctx.status !== 'ready') {
    return null
  }

  if (ctx.key === 'ArrowRight' || ctx.key === 'ArrowLeft') {
    const ids = ctx.pileEntryIds
    if (!ids.length) return null
    const currentIndex = ids.indexOf(ctx.selectedEntryId ?? -1)
    if (currentIndex === -1) return { type: 'select', entryId: ids[0]! }
    const nextIndex = currentIndex + (ctx.key === 'ArrowRight' ? 1 : -1)
    if (nextIndex < 0 || nextIndex >= ids.length) return null
    return { type: 'select', entryId: ids[nextIndex]! }
  }

  if (ctx.selectedEntryId === null) return null

  if (/^[1-5]$/.test(ctx.key)) {
    const bin = ctx.leftBins.find(
      (candidate) => presetShortcutKey(candidate.label) === ctx.key,
    )
    return bin ? { type: 'sort', binId: bin.id } : null
  }

  if (ctx.key === 'Delete') return { type: 'trash' }

  return null
}
