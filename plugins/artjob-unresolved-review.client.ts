import { useUserStore } from '~/stores/userStore'

type UnresolvedPrompt = {
  jobId: number
  status: string
  weakPrompt: string
  reasons: string[]
  referencedArtImageId: number | null
}

type JsonRecord = Record<string, unknown>

type RepairBatch = {
  complete?: boolean
  unresolved?: UnresolvedPrompt[]
}

type ReviewWindow = Window & {
  __kindRobotsWeakPromptReviewBound?: boolean
}

const PANEL_ID = 'kind-robots-weak-prompt-review'
const STYLE_ID = 'kind-robots-weak-prompt-review-styles'
const REPAIR_PATH = '/api/art/queue/repair-weak-prompts'
const unresolvedByJobId = new Map<number, UnresolvedPrompt>()

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonRecord
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.toString()
  return input.url
}

function requestPath(input: RequestInfo | URL): string {
  try {
    return new URL(requestUrl(input), window.location.origin).pathname
  } catch {
    return requestUrl(input).split('?')[0] || ''
  }
}

function parseRequestBody(init?: RequestInit): JsonRecord {
  if (typeof init?.body !== 'string' || !init.body.trim()) return {}
  try {
    return asRecord(JSON.parse(init.body))
  } catch {
    return {}
  }
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    #${PANEL_ID} {
      position: fixed;
      inset: 4.5rem 1rem 1rem auto;
      z-index: 10020;
      display: none;
      width: min(46rem, calc(100vw - 2rem));
      max-height: calc(100vh - 5.5rem);
      overflow: hidden;
      border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
      border-radius: 1.25rem;
      background: color-mix(in srgb, Canvas 96%, transparent);
      color: CanvasText;
      box-shadow: 0 1.5rem 4rem rgb(0 0 0 / 0.32);
      backdrop-filter: blur(18px);
      font-family: inherit;
    }
    #${PANEL_ID} * { box-sizing: border-box; }
    #${PANEL_ID} .kr-review-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem;
      border-bottom: 1px solid color-mix(in srgb, currentColor 12%, transparent);
    }
    #${PANEL_ID} .kr-review-title { margin: 0; font-size: 1rem; font-weight: 850; }
    #${PANEL_ID} .kr-review-subtitle { margin: .3rem 0 0; font-size: .76rem; opacity: .68; }
    #${PANEL_ID} .kr-review-close {
      flex: 0 0 auto;
      border: 0;
      border-radius: 999px;
      background: color-mix(in srgb, currentColor 9%, transparent);
      color: inherit;
      width: 2rem;
      height: 2rem;
      cursor: pointer;
      font-size: 1rem;
    }
    #${PANEL_ID} .kr-review-summary {
      display: flex;
      flex-wrap: wrap;
      gap: .45rem;
      padding: .75rem 1rem;
      border-bottom: 1px solid color-mix(in srgb, currentColor 10%, transparent);
      font-size: .72rem;
      font-weight: 750;
    }
    #${PANEL_ID} .kr-review-pill {
      border-radius: 999px;
      padding: .28rem .55rem;
      background: color-mix(in srgb, currentColor 8%, transparent);
    }
    #${PANEL_ID} .kr-review-list {
      display: grid;
      gap: .75rem;
      max-height: calc(100vh - 14rem);
      overflow-y: auto;
      padding: .85rem;
    }
    #${PANEL_ID} .kr-review-card {
      border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
      border-radius: 1rem;
      padding: .85rem;
      background: color-mix(in srgb, Canvas 88%, currentColor 2%);
    }
    #${PANEL_ID} .kr-review-card-head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: .55rem;
    }
    #${PANEL_ID} .kr-review-meta { display: flex; flex-wrap: wrap; gap: .35rem; align-items: center; }
    #${PANEL_ID} .kr-review-badge {
      display: inline-flex;
      border-radius: 999px;
      padding: .2rem .45rem;
      background: color-mix(in srgb, currentColor 9%, transparent);
      font-size: .68rem;
      font-weight: 800;
    }
    #${PANEL_ID} .kr-review-links { display: flex; gap: .65rem; font-size: .7rem; }
    #${PANEL_ID} .kr-review-links a { color: inherit; opacity: .7; text-decoration: underline; }
    #${PANEL_ID} .kr-review-weak {
      margin: .65rem 0;
      padding: .65rem;
      border-radius: .75rem;
      background: color-mix(in srgb, currentColor 6%, transparent);
      white-space: pre-wrap;
      font-size: .76rem;
      line-height: 1.4;
    }
    #${PANEL_ID} .kr-review-reasons { display: flex; flex-wrap: wrap; gap: .3rem; margin-bottom: .6rem; }
    #${PANEL_ID} .kr-review-reason {
      border-radius: 999px;
      padding: .18rem .42rem;
      background: rgb(245 158 11 / .14);
      color: rgb(180 83 9);
      font-size: .65rem;
      font-weight: 800;
    }
    #${PANEL_ID} textarea,
    #${PANEL_ID} select {
      width: 100%;
      border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
      border-radius: .75rem;
      background: Canvas;
      color: CanvasText;
      font: inherit;
    }
    #${PANEL_ID} textarea { min-height: 6.5rem; resize: vertical; padding: .7rem; font-size: .78rem; line-height: 1.4; }
    #${PANEL_ID} select { margin-top: .55rem; padding: .55rem .65rem; font-size: .75rem; }
    #${PANEL_ID} .kr-review-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: .7rem;
      margin-top: .65rem;
    }
    #${PANEL_ID} .kr-review-message { min-height: 1.2rem; font-size: .7rem; opacity: .75; }
    #${PANEL_ID} .kr-review-save {
      flex: 0 0 auto;
      border: 0;
      border-radius: 999px;
      padding: .55rem .85rem;
      background: #7c3aed;
      color: white;
      cursor: pointer;
      font: inherit;
      font-size: .74rem;
      font-weight: 850;
    }
    #${PANEL_ID} .kr-review-save:disabled { cursor: progress; opacity: .55; }
    @media (max-width: 640px) {
      #${PANEL_ID} { inset: 3.75rem .5rem .5rem; width: auto; max-height: calc(100vh - 4.25rem); }
      #${PANEL_ID} .kr-review-list { max-height: calc(100vh - 13rem); }
      #${PANEL_ID} .kr-review-actions { align-items: stretch; flex-direction: column; }
      #${PANEL_ID} .kr-review-save { width: 100%; }
    }
  `
  document.head.append(style)
}

function ensurePanel(): HTMLElement {
  ensureStyles()
  let panel = document.getElementById(PANEL_ID)
  if (!panel) {
    panel = document.createElement('aside')
    panel.id = PANEL_ID
    panel.setAttribute('aria-live', 'polite')
    document.body.append(panel)
  }
  return panel
}

function authorizationHeaders(userStore: ReturnType<typeof useUserStore>): Headers {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  const token = userStore.token || userStore.user?.token || ''
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return headers
}

function actionLabel(item: UnresolvedPrompt, mode: string): string {
  if (item.status === 'DONE') {
    return mode === 'OVERWRITE' ? 'Generate & replace' : 'Queue new output'
  }
  return 'Save & queue'
}

function actionHint(item: UnresolvedPrompt): string {
  if (item.status === 'DONE' && item.referencedArtImageId) {
    return 'Completed image: replace it in place or preserve it and create another output.'
  }
  if (item.status === 'DONE') {
    return 'Completed job without a linked ArtImage: queue a new output.'
  }
  return 'This job will be updated in place and returned to PENDING.'
}

async function submitPrompt(
  nativeFetch: typeof window.fetch,
  userStore: ReturnType<typeof useUserStore>,
  item: UnresolvedPrompt,
  prompt: string,
  mode: string,
): Promise<string> {
  const completed = item.status === 'DONE'
  const path = completed
    ? `/api/art/queue/${item.jobId}/reenqueue`
    : `/api/art/queue/${item.jobId}/edit`
  const body = completed
    ? {
        mode: item.referencedArtImageId ? mode : 'NEW_OUTPUT',
        refreshSeed: true,
        overrides: { promptString: prompt },
      }
    : {
        refreshSeed: true,
        overrides: { promptString: prompt },
      }

  const response = await nativeFetch(path, {
    method: 'POST',
    headers: authorizationHeaders(userStore),
    body: JSON.stringify(body),
  })
  const parsed = asRecord(await response.json().catch(() => ({})))
  if (!response.ok || parsed.success === false) {
    throw new Error(
      typeof parsed.message === 'string'
        ? parsed.message
        : `Request failed with status ${response.status}`,
    )
  }
  return typeof parsed.message === 'string' ? parsed.message : 'Queued.'
}

function renderReviewPanel(
  nativeFetch: typeof window.fetch,
  userStore: ReturnType<typeof useUserStore>,
): void {
  const panel = ensurePanel()
  const items = [...unresolvedByJobId.values()].sort((a, b) => b.jobId - a.jobId)

  if (!items.length) {
    panel.style.display = 'none'
    panel.replaceChildren()
    return
  }

  const linkedCount = items.filter((item) => item.referencedArtImageId).length
  const unlinkedCount = items.length - linkedCount

  const header = document.createElement('div')
  header.className = 'kr-review-header'
  const headingWrap = document.createElement('div')
  const title = document.createElement('h2')
  title.className = 'kr-review-title'
  title.textContent = `${items.length.toLocaleString()} prompts need review`
  const subtitle = document.createElement('p')
  subtitle.className = 'kr-review-subtitle'
  subtitle.textContent =
    'These are the jobs the scanner could not safely reconstruct. Add a concrete prompt and queue each one directly.'
  headingWrap.append(title, subtitle)

  const close = document.createElement('button')
  close.type = 'button'
  close.className = 'kr-review-close'
  close.setAttribute('aria-label', 'Close unresolved prompt review')
  close.textContent = '×'
  close.addEventListener('click', () => {
    panel.style.display = 'none'
  })
  header.append(headingWrap, close)

  const summary = document.createElement('div')
  summary.className = 'kr-review-summary'
  for (const label of [
    `${items.length.toLocaleString()} unresolved`,
    `${linkedCount.toLocaleString()} linked ArtImages`,
    `${unlinkedCount.toLocaleString()} without ArtImages`,
  ]) {
    const pill = document.createElement('span')
    pill.className = 'kr-review-pill'
    pill.textContent = label
    summary.append(pill)
  }

  const list = document.createElement('div')
  list.className = 'kr-review-list'

  for (const item of items) {
    const card = document.createElement('article')
    card.className = 'kr-review-card'

    const cardHead = document.createElement('div')
    cardHead.className = 'kr-review-card-head'
    const meta = document.createElement('div')
    meta.className = 'kr-review-meta'
    for (const label of [`Job #${item.jobId}`, item.status]) {
      const badge = document.createElement('span')
      badge.className = 'kr-review-badge'
      badge.textContent = label
      meta.append(badge)
    }

    const links = document.createElement('div')
    links.className = 'kr-review-links'
    const jobLink = document.createElement('a')
    jobLink.href = `/api/art/queue/${item.jobId}`
    jobLink.target = '_blank'
    jobLink.rel = 'noopener'
    jobLink.textContent = 'Open job data'
    links.append(jobLink)
    if (item.referencedArtImageId) {
      const imageLink = document.createElement('a')
      imageLink.href = `/api/art/image/${item.referencedArtImageId}?includeImageData=true`
      imageLink.target = '_blank'
      imageLink.rel = 'noopener'
      imageLink.textContent = `ArtImage #${item.referencedArtImageId}`
      links.append(imageLink)
    }
    cardHead.append(meta, links)

    const weak = document.createElement('div')
    weak.className = 'kr-review-weak'
    weak.textContent = item.weakPrompt || 'No prompt was stored.'

    const reasons = document.createElement('div')
    reasons.className = 'kr-review-reasons'
    for (const reason of item.reasons.length ? item.reasons : ['no-recovery-source']) {
      const badge = document.createElement('span')
      badge.className = 'kr-review-reason'
      badge.textContent = reason
      reasons.append(badge)
    }

    const textarea = document.createElement('textarea')
    textarea.placeholder =
      'Describe the visible subject, action, setting, composition, mood, and concrete art direction.'
    textarea.setAttribute('aria-label', `Replacement prompt for ArtJob ${item.jobId}`)

    let mode = item.referencedArtImageId ? 'OVERWRITE' : 'NEW_OUTPUT'
    let modeSelect: HTMLSelectElement | null = null
    if (item.status === 'DONE' && item.referencedArtImageId) {
      modeSelect = document.createElement('select')
      modeSelect.innerHTML = `
        <option value="OVERWRITE">Replace linked ArtImage #${item.referencedArtImageId}</option>
        <option value="NEW_OUTPUT">Keep it and create a new output</option>
      `
      modeSelect.addEventListener('change', () => {
        mode = modeSelect?.value || 'OVERWRITE'
        save.textContent = actionLabel(item, mode)
      })
    }

    const actions = document.createElement('div')
    actions.className = 'kr-review-actions'
    const message = document.createElement('div')
    message.className = 'kr-review-message'
    message.textContent = actionHint(item)
    const save = document.createElement('button')
    save.type = 'button'
    save.className = 'kr-review-save'
    save.textContent = actionLabel(item, mode)
    save.addEventListener('click', async () => {
      const prompt = textarea.value.replace(/\s+/g, ' ').trim()
      if (!prompt) {
        message.textContent = 'Write a replacement prompt first.'
        return
      }

      save.disabled = true
      message.textContent = 'Saving…'
      try {
        const result = await submitPrompt(nativeFetch, userStore, item, prompt, mode)
        message.textContent = result
        unresolvedByJobId.delete(item.jobId)
        window.setTimeout(() => renderReviewPanel(nativeFetch, userStore), 500)
      } catch (error) {
        message.textContent = error instanceof Error ? error.message : 'Could not queue this job.'
        save.disabled = false
      }
    })
    actions.append(message, save)

    card.append(cardHead, weak, reasons, textarea)
    if (modeSelect) card.append(modeSelect)
    card.append(actions)
    list.append(card)
  }

  panel.replaceChildren(header, summary, list)
  panel.style.display = 'block'
}

function collectRepairResult(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  response: Response,
  nativeFetch: typeof window.fetch,
  userStore: ReturnType<typeof useUserStore>,
): void {
  if (requestPath(input) !== REPAIR_PATH) return
  const request = parseRequestBody(init)
  if (Number(request.cursor) === 0) {
    unresolvedByJobId.clear()
  }

  void response
    .clone()
    .json()
    .then((payload: unknown) => {
      const data = asRecord(asRecord(payload).data) as RepairBatch
      if (Array.isArray(data.unresolved)) {
        for (const unresolved of data.unresolved) {
          if (Number.isInteger(unresolved.jobId) && unresolved.jobId > 0) {
            unresolvedByJobId.set(unresolved.jobId, unresolved)
          }
        }
      }
      if (data.complete === true) {
        renderReviewPanel(nativeFetch, userStore)
      }
    })
    .catch(() => undefined)
}

export default defineNuxtPlugin(() => {
  const reviewWindow = window as ReviewWindow
  if (reviewWindow.__kindRobotsWeakPromptReviewBound) return
  reviewWindow.__kindRobotsWeakPromptReviewBound = true

  const userStore = useUserStore()
  const nativeFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await nativeFetch(input, init)
    collectRepairResult(input, init, response, nativeFetch, userStore)
    return response
  }
})
