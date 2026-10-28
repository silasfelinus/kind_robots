export function trapMemoryDialogTab(
  event: KeyboardEvent,
  dialog: HTMLElement | null,
): void {
  if (event.key !== 'Tab' || !dialog) return

  const controls = Array.from(
    dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (element) =>
      element.getClientRects().length > 0 &&
      !element.closest('[aria-hidden="true"]'),
  )
  if (!controls.length) {
    event.preventDefault()
    dialog.focus()
    return
  }

  const first = controls[0]!
  const last = controls[controls.length - 1]!
  const active = document.activeElement
  if (event.shiftKey && (active === first || active === dialog || !dialog.contains(active))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
    event.preventDefault()
    first.focus()
  }
}
