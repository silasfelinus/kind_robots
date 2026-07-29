import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useConductorStore } from '@/stores/conductorStore'
import { suggestArtAssetPrompt } from '@/stores/helpers/artAssetSuggest'
import { useProjectStore } from '@/stores/projectStore'
import { useUserStore } from '@/stores/userStore'
import { performFetch } from '@/stores/utils'
import {
  normalizeArtModelType,
  type ArtModelRef,
  type ArtModelType,
} from '@/utils/artModelContext'

type ProjectArtContext = {
  id?: number
  slug?: string
  title?: string
  kind?: string
  status?: string
  goal?: string
  description?: string
  flavorText?: string
  notes?: string
  milestones?: string[]
  tasks?: string[]
}

type MissingImageReport = {
  src: string
  pageUrl: string
  alt?: string
  label?: string
  subject?: string
  purpose?: string
  artDescription?: string
  artStyle?: string
  artExclusions?: string
  variant?: string
  size?: string
  pageTitle?: string
  pageDescription?: string
  nearestHeading?: string
  nearbyText?: string
  imageClass?: string
  modelType?: ArtModelType
  modelId?: number
  modelSlug?: string
  modelField?: string
  projectId?: number
  projectSlug?: string
  projectField?: string
  project?: ProjectArtContext
}

const IMAGE_EXTENSIONS = ['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg']
const VARIANT_SIZES: Record<string, string> = {
  icon: '256x256',
  card: '512x768',
  hero: '1280x720',
}

const GENERIC_LABEL_PATTERNS = [
  /^image\s*#?\s*\d+$/i,
  /^art\s*image\s*#?\s*\d+$/i,
  /^asset\s*#?\s*\d+$/i,
  /^image$/i,
  /^artwork$/i,
  /^generated art$/i,
  /^missing image$/i,
  /^untitled$/i,
]

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function compact(value: unknown, maxLength = 700): string {
  const clean = cleanString(value)
  if (clean.length <= maxLength) return clean
  return `${clean.slice(0, maxLength - 1).trim()}…`
}

function isGenericLabel(value: unknown): boolean {
  const label = cleanString(value)
  if (!label) return true
  return GENERIC_LABEL_PATTERNS.some((pattern) => pattern.test(label))
}

function imageSource(img: HTMLImageElement): string {
  return (
    cleanString(img.getAttribute('src')) ||
    cleanString(img.currentSrc) ||
    cleanString(img.src)
  )
}

function hasImageExtension(src: string): boolean {
  const path = src.split('?')[0]!.split('#')[0]!.toLowerCase()
  return IMAGE_EXTENSIONS.some((ext) => path.endsWith(ext))
}

function shouldIgnoreSource(src: string): boolean {
  if (!src) return true
  if (/^(data|blob):/i.test(src)) return true
  if (src.includes('/_nuxt/') || src.includes('/node_modules/')) return true
  if (src.includes('coming-soon') || src.includes('placeholder')) return true
  if (/\/api\/art\/image\//i.test(src)) return true
  if (!hasImageExtension(src)) return true

  try {
    const url = new URL(src, window.location.origin)
    const host = url.hostname.toLowerCase()
    const allowedHosts = new Set([
      window.location.hostname.toLowerCase(),
      'kindrobots.org',
      'www.kindrobots.org',
      'raw.githubusercontent.com',
      'media.acrocatranch.com',
    ])
    return !allowedHosts.has(host)
  } catch {
    return false
  }
}

function artContextElement(img: HTMLImageElement): HTMLElement | null {
  return img.closest<HTMLElement>(
    '[data-art-model], [data-project-id], [data-project-slug], [data-art-context]',
  )
}

function datasetValue(
  img: HTMLImageElement,
  context: HTMLElement | null,
  key: keyof DOMStringMap,
): string {
  return cleanString(img.dataset[key] || context?.dataset[key])
}

function datasetId(
  img: HTMLImageElement,
  context: HTMLElement | null,
  key: keyof DOMStringMap,
): number | undefined {
  const value = Number(datasetValue(img, context, key))
  return Number.isInteger(value) && value > 0 ? value : undefined
}

function inferVariant(img: HTMLImageElement, src: string): string | undefined {
  const explicit = cleanString(img.dataset.variant).toLowerCase()
  if (['icon', 'card', 'hero'].includes(explicit)) return explicit

  const className = cleanString(img.getAttribute('class')).toLowerCase()
  if (className.includes('icon')) return 'icon'
  if (className.includes('card')) return 'card'
  if (className.includes('hero')) return 'hero'

  const basename = src.split('/').pop()?.toLowerCase() ?? ''
  if (/(^|-|_)icon\./.test(basename)) return 'icon'
  if (/(^|-|_)card\./.test(basename)) return 'card'
  if (/(^|-|_)hero\./.test(basename)) return 'hero'

  return undefined
}

function labelForImage(img: HTMLImageElement): string | undefined {
  const context = artContextElement(img)
  const candidates = [
    img.dataset.artSubject,
    context?.dataset.artSubject,
    img.alt,
    img.title,
    img.getAttribute('aria-label'),
    img.dataset.slug,
    img.dataset.projectSlug,
    context?.dataset.projectSlug,
  ]

  for (const candidate of candidates) {
    const label = cleanString(candidate)
    if (label && !isGenericLabel(label)) return label
  }

  return undefined
}

function nearestHeading(img: HTMLImageElement): string | undefined {
  let current: HTMLElement | null = img.parentElement

  while (current) {
    const heading = current.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6')
    const text = cleanString(heading?.textContent)
    if (text) return compact(text, 180)
    if (current.matches('article, section, main, button, li, figure')) break
    current = current.parentElement
  }

  const pageHeading = cleanString(document.querySelector('h1')?.textContent)
  return pageHeading ? compact(pageHeading, 180) : undefined
}

function nearbyText(img: HTMLImageElement): string | undefined {
  const container = img.closest<HTMLElement>(
    '[data-art-context], figure, article, li, button, .card, section',
  )
  const text = compact(container?.innerText || img.parentElement?.innerText, 900)
  return text || undefined
}

function pageDescription(): string | undefined {
  const description = cleanString(
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content,
  )
  return description || undefined
}

function shouldIgnoreImage(img: HTMLImageElement): boolean {
  if (img.dataset.missingImageReport === 'false') return true
  const label = labelForImage(img)
  return Boolean(label && isGenericLabel(label))
}

function modelRef(report: MissingImageReport): ArtModelRef | undefined {
  if (!report.modelType) return undefined
  if (!report.modelId && !report.modelSlug) return undefined

  return {
    modelType: report.modelType,
    ...(report.modelId ? { id: report.modelId } : {}),
    ...(report.modelSlug ? { slug: report.modelSlug } : {}),
  }
}

function assetPurpose(report: MissingImageReport): string {
  const title =
    report.project?.title ||
    report.subject ||
    report.label ||
    report.modelSlug ||
    report.projectSlug
  const model = report.modelType ? `${report.modelType} ` : ''
  const subject = title ? `${model}${title}` : 'this gallery record'

  if (report.variant === 'icon') {
    return `Square icon that makes ${subject} immediately recognizable`
  }
  if (report.variant === 'card') {
    return `Portrait gallery-card artwork that communicates the identity and purpose of ${subject}`
  }
  if (report.variant === 'hero') {
    return `Landscape hero artwork that introduces the identity, world, and purpose of ${subject}`
  }

  return `Primary gallery artwork that makes the identity and purpose of ${subject} visually clear`
}

export default defineNuxtPlugin(() => {
  const route = useRoute()
  const conductorStore = useConductorStore()
  const projectStore = useProjectStore()
  const userStore = useUserStore()
  const queued = new Map<string, MissingImageReport>()
  const submitted = new Set<string>()

  function projectContext(report: MissingImageReport): ProjectArtContext | undefined {
    if (report.modelType !== 'project' && !report.projectId && !report.projectSlug) {
      return undefined
    }

    const record =
      (report.projectId
        ? projectStore.projects.find((project) => project.id === report.projectId)
        : null) || projectStore.projectForSlug(report.projectSlug)
    const roadmap = conductorStore.projects.find(
      (project) => project.slug === report.projectSlug,
    )

    if (!record && !roadmap && !report.projectSlug) return undefined

    const tasks = roadmap?.tasks
      .filter((task) => task.status !== 'done')
      .slice(0, 10)
      .map((task) =>
        compact(
          [task.title, task.stakes, task.note].filter(Boolean).join(' — '),
          260,
        ),
      )
      .filter(Boolean)

    return {
      ...(record?.id ? { id: record.id } : {}),
      ...(report.projectSlug || record?.slug || record?.conductorSlug
        ? { slug: report.projectSlug || record?.conductorSlug || record?.slug || '' }
        : {}),
      ...(record?.title || roadmap?.name
        ? { title: record?.title || roadmap?.name }
        : {}),
      ...(roadmap?.kind ? { kind: roadmap.kind } : {}),
      ...(record?.status ? { status: record.status } : {}),
      ...(record?.goal ? { goal: compact(record.goal, 600) } : {}),
      ...(record?.description
        ? { description: compact(record.description, 900) }
        : {}),
      ...(record?.flavorText
        ? { flavorText: compact(record.flavorText, 500) }
        : {}),
      ...(roadmap?.notesFromSilas
        ? { notes: compact(roadmap.notesFromSilas, 900) }
        : {}),
      ...(roadmap?.milestones.length
        ? {
            milestones: roadmap.milestones
              .slice(0, 10)
              .map((milestone) => `${milestone.title} (${milestone.status})`),
          }
        : {}),
      ...(tasks?.length ? { tasks } : {}),
    }
  }

  function enrichReport(report: MissingImageReport): MissingImageReport {
    const project = projectContext(report)
    const subject =
      report.subject ||
      project?.title ||
      report.label ||
      report.modelSlug ||
      report.projectSlug
    const enriched = {
      ...report,
      ...(subject ? { subject } : {}),
      ...(project ? { project } : {}),
    }

    return {
      ...enriched,
      purpose: report.purpose || assetPurpose(enriched),
    }
  }

  async function submit(report: MissingImageReport) {
    if (submitted.has(report.src)) return
    submitted.add(report.src)

    const enriched = enrichReport(report)
    const prompt = await suggestArtAssetPrompt({
      subject: enriched.subject || enriched.label,
      purpose: enriched.purpose,
      entityRef: modelRef(enriched),
      asset: {
        source: enriched.src,
        role:
          enriched.modelField ||
          enriched.projectField ||
          enriched.variant ||
          'gallery image',
        variant: enriched.variant,
        size: enriched.size,
        className: enriched.imageClass,
        description: enriched.artDescription,
        preferredStyle: enriched.artStyle,
        exclusions: enriched.artExclusions,
      },
      project: enriched.project,
      page: {
        url: enriched.pageUrl,
        title: enriched.pageTitle,
        description: enriched.pageDescription,
        heading: enriched.nearestHeading,
        localText: enriched.nearbyText,
      },
    }).catch(() => '')

    const result = await performFetch(
      '/api/conductor/art-request',
      {
        method: 'POST',
        body: JSON.stringify({
          ...enriched,
          ...(prompt ? { prompt } : {}),
        }),
      },
      1,
      15000,
    )

    if (!result.success) submitted.delete(report.src)
  }

  function flushQueue() {
    if (!userStore.isAdmin) return

    for (const [src, report] of queued.entries()) {
      queued.delete(src)
      void submit(report)
    }
  }

  function queueReport(img: HTMLImageElement) {
    if (shouldIgnoreImage(img)) return

    const src = imageSource(img)
    if (shouldIgnoreSource(src)) return
    if (submitted.has(src) || queued.has(src)) return

    const context = artContextElement(img)
    const variant = inferVariant(img, src)
    const label = labelForImage(img)
    const projectId = datasetId(img, context, 'projectId')
    const projectSlug = datasetValue(img, context, 'projectSlug') || undefined
    const explicitModel = normalizeArtModelType(
      datasetValue(img, context, 'artModel'),
    )
    const modelType =
      explicitModel || (projectId || projectSlug ? 'project' : undefined)
    const modelId =
      datasetId(img, context, 'artModelId') ||
      (modelType === 'project' ? projectId : undefined)
    const modelSlug =
      datasetValue(img, context, 'artModelSlug') ||
      (modelType === 'project' ? projectSlug : undefined)

    const report: MissingImageReport = {
      src,
      pageUrl: window.location.href || route.fullPath,
      alt: label,
      label,
      subject:
        datasetValue(img, context, 'artSubject') || label,
      purpose: datasetValue(img, context, 'artPurpose') || undefined,
      artDescription:
        datasetValue(img, context, 'artDescription') || undefined,
      artStyle: datasetValue(img, context, 'artStyle') || undefined,
      artExclusions:
        datasetValue(img, context, 'artExclusions') || undefined,
      variant,
      size: variant ? VARIANT_SIZES[variant] : undefined,
      pageTitle: cleanString(document.title) || undefined,
      pageDescription: pageDescription(),
      nearestHeading: nearestHeading(img),
      nearbyText: nearbyText(img),
      imageClass: cleanString(img.getAttribute('class')) || undefined,
      modelType,
      modelId,
      modelSlug: modelSlug || undefined,
      modelField:
        datasetValue(img, context, 'artModelField') || undefined,
      projectId,
      projectSlug,
      projectField:
        datasetValue(img, context, 'projectField') || undefined,
    }

    if (!userStore.isAdmin) {
      queued.set(src, report)
      return
    }

    void submit(report)
  }

  window.addEventListener(
    'error',
    (event) => {
      const target = event.target
      if (target instanceof HTMLImageElement) queueReport(target)
    },
    true,
  )

  watch(
    () => userStore.isAdmin,
    () => flushQueue(),
    { immediate: true },
  )
})
