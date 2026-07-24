type WeakPromptRepairProgressDetail = {
  phase: 'starting' | 'scanning' | 'repairing' | 'complete' | 'error'
  dryRun: boolean
  scannedCount: number
  totalCount: number
  candidateCount: number
  recoverableCount: number
  unresolvedCount: number
  limited: boolean
  message: string
}

type ProgressWindow = Window & {
  __kindRobotsArtJobRepairProgressBound?: boolean
}

const PANEL_ID = 'kind-robots-artjob-repair-progress'
let dismissTimer: ReturnType<typeof setTimeout> | null = null

function ensurePanel(): {
  panel: HTMLElement
  title: HTMLElement
  message: HTMLElement
  counts: HTMLElement
  bar: HTMLElement
} {
  let panel = document.getElementById(PANEL_ID)

  if (!panel) {
    panel = document.createElement('aside')
    panel.id = PANEL_ID
    panel.setAttribute('role', 'status')
    panel.setAttribute('aria-live', 'polite')
    Object.assign(panel.style, {
      position: 'fixed',
      right: '1rem',
      bottom: '1rem',
      zIndex: '9999',
      width: 'min(28rem, calc(100vw - 2rem))',
      padding: '0.9rem',
      borderRadius: '1rem',
      border: '1px solid color-mix(in srgb, currentColor 18%, transparent)',
      background: 'color-mix(in srgb, Canvas 94%, transparent)',
      color: 'CanvasText',
      boxShadow: '0 1rem 3rem rgb(0 0 0 / 0.24)',
      backdropFilter: 'blur(16px)',
      fontFamily: 'inherit',
    })

    const title = document.createElement('div')
    title.dataset.role = 'title'
    Object.assign(title.style, {
      fontSize: '0.82rem',
      fontWeight: '800',
      letterSpacing: '0.02em',
    })

    const message = document.createElement('div')
    message.dataset.role = 'message'
    Object.assign(message.style, {
      marginTop: '0.35rem',
      fontSize: '0.78rem',
      lineHeight: '1.35',
      opacity: '0.82',
    })

    const track = document.createElement('div')
    Object.assign(track.style, {
      height: '0.55rem',
      marginTop: '0.75rem',
      overflow: 'hidden',
      borderRadius: '999px',
      background: 'color-mix(in srgb, currentColor 12%, transparent)',
    })

    const bar = document.createElement('div')
    bar.dataset.role = 'bar'
    Object.assign(bar.style, {
      height: '100%',
      width: '0%',
      borderRadius: 'inherit',
      background: 'linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6)',
      transition: 'width 180ms ease',
    })
    track.append(bar)

    const counts = document.createElement('div')
    counts.dataset.role = 'counts'
    Object.assign(counts.style, {
      marginTop: '0.55rem',
      fontSize: '0.72rem',
      fontWeight: '700',
      opacity: '0.68',
    })

    panel.append(title, message, track, counts)
    document.body.append(panel)
  }

  return {
    panel,
    title: panel.querySelector('[data-role="title"]') as HTMLElement,
    message: panel.querySelector('[data-role="message"]') as HTMLElement,
    counts: panel.querySelector('[data-role="counts"]') as HTMLElement,
    bar: panel.querySelector('[data-role="bar"]') as HTMLElement,
  }
}

function handleProgress(event: Event): void {
  const detail = (event as CustomEvent<WeakPromptRepairProgressDetail>).detail
  if (!detail) return

  if (dismissTimer) {
    clearTimeout(dismissTimer)
    dismissTimer = null
  }

  const { panel, title, message, counts, bar } = ensurePanel()
  const total = Math.max(detail.totalCount, 0)
  const scanned = Math.max(detail.scannedCount, 0)
  const percent = total > 0 ? Math.min((scanned / total) * 100, 100) : 0
  const weakCount = detail.recoverableCount + detail.unresolvedCount

  panel.style.display = 'block'
  panel.style.borderColor =
    detail.phase === 'error'
      ? 'rgb(239 68 68 / 0.55)'
      : detail.phase === 'complete'
        ? 'rgb(34 197 94 / 0.55)'
        : 'rgb(139 92 246 / 0.45)'

  title.textContent =
    detail.phase === 'error'
      ? 'Weak-prompt scan stopped'
      : detail.phase === 'complete'
        ? detail.dryRun
          ? 'Weak-prompt scan complete'
          : 'Weak-prompt repair complete'
        : detail.dryRun
          ? 'Finding bad prompts'
          : 'Repairing bad prompts'

  message.textContent = detail.message
  counts.textContent = total
    ? `${scanned.toLocaleString()} of ${total.toLocaleString()} scanned · ${weakCount.toLocaleString()} weak · ${detail.recoverableCount.toLocaleString()} recoverable · ${detail.unresolvedCount.toLocaleString()} need a human${detail.limited && detail.candidateCount > total ? ` · limited from ${detail.candidateCount.toLocaleString()} eligible` : ''}`
    : 'Preparing the ArtJob snapshot…'
  bar.style.width = `${percent}%`

  if (detail.phase === 'complete' || detail.phase === 'error') {
    bar.style.width = detail.phase === 'complete' ? '100%' : `${percent}%`
    dismissTimer = setTimeout(
      () => {
        panel.style.display = 'none'
      },
      detail.phase === 'complete' ? 8000 : 12000,
    )
  }
}

export default defineNuxtPlugin(() => {
  const progressWindow = window as ProgressWindow
  if (progressWindow.__kindRobotsArtJobRepairProgressBound) return

  progressWindow.__kindRobotsArtJobRepairProgressBound = true
  window.addEventListener('artjob-repair-progress', handleProgress)
})
