export function layoutViewportWidth(
  innerWidth: number,
  visualViewport?: Pick<VisualViewport, 'width' | 'scale'> | null,
): number {
  const visualWidth =
    visualViewport && visualViewport.width * visualViewport.scale
  if (visualWidth && Number.isFinite(visualWidth) && visualWidth > 0) {
    return Math.round(visualWidth)
  }
  return Number.isFinite(innerWidth) && innerWidth > 0
    ? Math.round(innerWidth)
    : 0
}

export function watchLayoutViewportWidth(view: Window): () => void {
  const root = view.document.documentElement
  const visual = view.visualViewport
  const orientation = view.screen.orientation
  let frame: number | undefined
  let timers: number[] = []

  function refresh() {
    const width = layoutViewportWidth(view.innerWidth, view.visualViewport)
    if (width > 0) {
      root.style.setProperty('--kr-layout-width', `${width}px`)
    }
  }

  function schedule() {
    if (frame !== undefined) view.cancelAnimationFrame(frame)
    frame = view.requestAnimationFrame(() => {
      frame = undefined
      refresh()
    })
  }

  function settle() {
    schedule()
    for (const timer of timers) view.clearTimeout(timer)
    timers = [100, 350, 800].map((delay) => view.setTimeout(schedule, delay))
  }

  refresh()
  view.addEventListener('resize', schedule)
  view.addEventListener('orientationchange', settle)
  view.addEventListener('pageshow', settle)
  view.document.addEventListener('visibilitychange', settle)
  visual?.addEventListener('resize', schedule)
  orientation?.addEventListener('change', settle)

  return () => {
    view.removeEventListener('resize', schedule)
    view.removeEventListener('orientationchange', settle)
    view.removeEventListener('pageshow', settle)
    view.document.removeEventListener('visibilitychange', settle)
    visual?.removeEventListener('resize', schedule)
    orientation?.removeEventListener('change', settle)
    if (frame !== undefined) view.cancelAnimationFrame(frame)
    for (const timer of timers) view.clearTimeout(timer)
    root.style.removeProperty('--kr-layout-width')
  }
}
