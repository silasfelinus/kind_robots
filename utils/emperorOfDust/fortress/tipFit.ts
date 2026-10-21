// The fortress header carries daisyUI tooltips on the court-ledger chip, the room tabs and the
// faction chips. Below the wide layout the tabs are icons only, so their tooltip is the room's name
// and its waiting count; a player needs it. daisyUI centres each tooltip on its own button, so a
// long tip on a tab near the edge ran past the page shell: invisible, it still widened the shell's
// scroll range by ~24px, and anything that scrolled a tab into view slid the whole fortress
// sideways (conductor emperor-of-dust/t-034); visible, it was cut off mid-word at 390px.
// tipShift keeps the bubble inside the header and leaves the tail on its button.

/** Gap kept between a tooltip and the header's edge, in px. */
export const TIP_INSET = 6

/**
 * The horizontal offset, in px from the anchor's centre, of a tooltip's left edge so that a tip
 * `tipWidth` wide stays inside [boundLeft + inset, boundRight - inset]. A tip that fits centred
 * stays centred (offset -tipWidth / 2); one wider than the bound starts at its left edge.
 */
export function tipShift(
  anchorLeft: number,
  anchorWidth: number,
  tipWidth: number,
  boundLeft: number,
  boundRight: number,
  inset = TIP_INSET,
): number {
  const centre = anchorLeft + anchorWidth / 2
  const min = boundLeft + inset
  const max = boundRight - inset - tipWidth
  const left = Math.max(min, Math.min(centre - tipWidth / 2, max))
  return Math.round((left - centre) * 100) / 100
}
