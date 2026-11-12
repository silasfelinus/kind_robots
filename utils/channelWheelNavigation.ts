/**
 * The channel launcher keeps each destination gallery scrollable, but a wheel
 * gesture at either edge should be able to continue into the neighboring room.
 */
export function canScrollVertically(
  scroll: Pick<HTMLElement, 'scrollTop' | 'scrollHeight' | 'clientHeight'>,
  deltaY: number,
): boolean {
  const tolerance = 2
  if (deltaY > 0) {
    return (
      scroll.scrollTop + scroll.clientHeight < scroll.scrollHeight - tolerance
    )
  }
  if (deltaY < 0) return scroll.scrollTop > tolerance
  return false
}

export function adjacentChannelIndex(
  currentIndex: number,
  channelCount: number,
  deltaY: number,
): number | null {
  if (currentIndex < 0 || currentIndex >= channelCount || deltaY === 0) {
    return null
  }
  const nextIndex = currentIndex + (deltaY > 0 ? 1 : -1)
  return nextIndex >= 0 && nextIndex < channelCount ? nextIndex : null
}
