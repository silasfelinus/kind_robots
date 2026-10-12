export type DpadDirection = 'up' | 'down' | 'left' | 'right'

export type DpadDirections = Record<DpadDirection, boolean>

/** Pointer position over the full pad, including the unpainted center and diagonals. */
export function directionsAtDpadPoint(
  clientX: number,
  clientY: number,
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
  deadZone = 0.22,
): DpadDirections {
  const next: DpadDirections = {
    up: false,
    down: false,
    left: false,
    right: false,
  }
  if (rect.width <= 0 || rect.height <= 0) return next
  const dx = (clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
  const dy = (clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
  if (Math.hypot(dx, dy) <= deadZone) return next

  const sector = Math.round(Math.atan2(dy, dx) / (Math.PI / 4))
  next.right = sector >= -1 && sector <= 1
  next.left = sector >= 3 || sector <= -3
  next.down = sector >= 1 && sector <= 3
  next.up = sector >= -3 && sector <= -1
  return next
}
