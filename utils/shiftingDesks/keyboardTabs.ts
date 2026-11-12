export function nextKeyboardTabIndex(
  key: string,
  current: number,
  count: number,
): number | null {
  if (count < 1 || current < 0 || current >= count) return null
  switch (key) {
    case 'ArrowRight':
      return (current + 1) % count
    case 'ArrowLeft':
      return (current + count - 1) % count
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}

export function handleKeyboardTabs(
  event: KeyboardEvent,
  selectedIndex: number,
  count: number,
  select: (index: number) => void,
): void {
  if (event.altKey || event.ctrlKey || event.metaKey) return
  const next = nextKeyboardTabIndex(event.key, selectedIndex, count)
  if (next === null) return
  event.preventDefault()
  select(next)
  const strip = event.currentTarget as HTMLElement | null
  strip?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
}
