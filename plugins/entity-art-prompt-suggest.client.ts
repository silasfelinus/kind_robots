import { suggestArtAssetPrompt } from '@/stores/helpers/artAssetSuggest'
import { usePageStore } from '@/stores/pageStore'
import { useProjectStore } from '@/stores/projectStore'
import {
  normalizeArtModelType,
  type ArtModelRef,
  type ArtModelType,
} from '@/utils/artModelContext'

type EntityRecord = Record<string, unknown> & {
  id?: number | string | null
  title?: string | null
  name?: string | null
  slug?: string | null
}

type EntityArtSlot = {
  field?: string
  label?: string
  width?: number
  height?: number
}

type VueInstanceLike = {
  props?: Record<string, unknown>
  parent?: VueInstanceLike | null
}

type VueElement = HTMLElement & {
  __vueParentComponent?: VueInstanceLike | null
}

type ManagerContext = {
  entityType: ArtModelType
  entity: EntityRecord
  slots: EntityArtSlot[]
}

type PageStore = ReturnType<typeof usePageStore>
type ProjectStore = ReturnType<typeof useProjectStore>

const BUTTON_MARKER = 'data-entity-art-prompt-suggest'
const attached = new WeakSet<HTMLTextAreaElement>()
const PROJECT_ART_SLOTS: EntityArtSlot[] = [
  { field: 'heroPath', label: 'Hero', width: 1280, height: 720 },
  { field: 'cardPath', label: 'Card', width: 512, height: 768 },
  { field: 'imagePath', label: 'Icon', width: 256, height: 256 },
]

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function positiveInteger(value: unknown): number | undefined {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : undefined
}

function managerContextFromVue(element: HTMLElement): ManagerContext | null {
  let instance: VueInstanceLike | null | undefined =
    (element as VueElement).__vueParentComponent

  while (instance) {
    const props = instance.props ?? {}
    const entityType = normalizeArtModelType(props.entityType)
    const entity =
      props.entity && typeof props.entity === 'object'
        ? (props.entity as EntityRecord)
        : null
    const slots = Array.isArray(props.slots)
      ? (props.slots as EntityArtSlot[])
      : []

    if (
      entityType &&
      entity &&
      (positiveInteger(entity.id) || cleanString(entity.slug))
    ) {
      return { entityType, entity, slots }
    }
    instance = instance.parent
  }

  return null
}

function pathModelReference(): {
  entityType: ArtModelType
  id?: number
  slug?: string
} | null {
  const segments = window.location.pathname
    .split('/')
    .map((segment) => decodeURIComponent(segment).trim())
    .filter(Boolean)

  for (let index = 0; index < segments.length; index += 1) {
    const entityType = normalizeArtModelType(segments[index])
    if (
      !entityType ||
      !['bot', 'character', 'scenario', 'reward', 'facet'].includes(entityType)
    ) {
      continue
    }

    const identifier = cleanString(segments[index + 1])
    const id = positiveInteger(identifier)
    const slug = !id && identifier ? identifier : undefined
    if (id || slug) return { entityType, ...(id ? { id } : {}), ...(slug ? { slug } : {}) }
  }

  return null
}

function managerContextFromPage(element: HTMLElement): ManagerContext | null {
  const pathRef = pathModelReference()
  const context = element.closest<HTMLElement>(
    '[data-art-model], [data-model-id], [data-model-slug]',
  )
  const entityType =
    normalizeArtModelType(context?.dataset.artModel || context?.dataset.modelType) ||
    pathRef?.entityType
  if (!entityType) return null

  const id = positiveInteger(
    context?.dataset.modelId || context?.dataset.artModelId || pathRef?.id,
  )
  const slug = cleanString(
    context?.dataset.modelSlug || context?.dataset.artModelSlug || pathRef?.slug,
  )
  if (!id && !slug) return null

  return {
    entityType,
    entity: {
      ...(id ? { id } : {}),
      ...(slug ? { slug } : {}),
      title:
        cleanString(context?.dataset.artSubject) ||
        cleanString(document.querySelector('h1')?.textContent) ||
        cleanString(document.title),
    },
    slots: [],
  }
}

function managerContextFromWorkspaceProject(
  element: HTMLElement,
  pageStore: PageStore,
  projectStore: ProjectStore,
): ManagerContext | null {
  if (!element.closest('.project-art-compact')) return null

  const workspaceSlug = cleanString(pageStore.workspaceCardKey)
  if (!workspaceSlug) return null
  const project = projectStore.projectForSlug(workspaceSlug)
  if (!project) return null

  const slug = cleanString(
    project.conductorSlug || project.slug || workspaceSlug,
  )
  return {
    entityType: 'project',
    entity: {
      id: project.id,
      ...(slug ? { slug } : {}),
      title: project.title,
    },
    slots: PROJECT_ART_SLOTS,
  }
}

function managerContext(
  element: HTMLElement,
  pageStore: PageStore,
  projectStore: ProjectStore,
): ManagerContext | null {
  const section = element.closest<HTMLElement>('section')
  return (
    managerContextFromVue(element) ||
    (section ? managerContextFromVue(section) : null) ||
    managerContextFromPage(element) ||
    managerContextFromWorkspaceProject(element, pageStore, projectStore)
  )
}

function selectedValue(
  form: HTMLFormElement,
  predicate: (select: HTMLSelectElement) => boolean,
): string {
  return (
    Array.from(form.querySelectorAll<HTMLSelectElement>('select')).find(predicate)
      ?.value || ''
  )
}

function selectedSlot(
  form: HTMLFormElement,
  context: ManagerContext,
): EntityArtSlot {
  const field = selectedValue(form, (select) =>
    context.slots.some((slot) => slot.field === select.value),
  )
  return (
    context.slots.find((slot) => slot.field === field) || {
      field: field || 'imagePath',
      label: 'Image',
      width: 1024,
      height: 1024,
    }
  )
}

function generationMode(form: HTMLFormElement): 'recreate' | 'img2img' {
  const value = selectedValue(form, (select) =>
    Array.from(select.options).some((option) => option.value === 'recreate'),
  )
  return value === 'img2img' ? 'img2img' : 'recreate'
}

function variantForSlot(slot: EntityArtSlot): string {
  const value = `${slot.field || ''} ${slot.label || ''}`.toLowerCase()
  if (value.includes('hero')) return 'hero'
  if (value.includes('card')) return 'card'
  if (value.includes('icon') || value.includes('avatar')) return 'icon'
  return 'image'
}

function titleForContext(context: ManagerContext): string {
  return (
    cleanString(context.entity.title) ||
    cleanString(context.entity.name) ||
    `${context.entityType} ${context.entity.id || context.entity.slug || ''}`.trim()
  )
}

function entityRef(context: ManagerContext): ArtModelRef {
  const id = positiveInteger(context.entity.id)
  const slug = cleanString(context.entity.slug)
  return {
    modelType: context.entityType,
    ...(id ? { id } : {}),
    ...(slug ? { slug } : {}),
  }
}

function currentImageSource(form: HTMLFormElement): string | undefined {
  const section = form.closest('section')
  const image = section?.querySelector<HTMLImageElement>('img')
  return cleanString(image?.currentSrc || image?.src) || undefined
}

function setTextareaValue(textarea: HTMLTextAreaElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    'value',
  )?.set
  if (setter) setter.call(textarea, value)
  else textarea.value = value
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  textarea.dispatchEvent(new Event('change', { bubbles: true }))
}

function addSuggestButton(
  textarea: HTMLTextAreaElement,
  pageStore: PageStore,
  projectStore: ProjectStore,
): void {
  if (attached.has(textarea)) return
  const form = textarea.closest<HTMLFormElement>('form')
  if (!form) return

  const hasGenerationMode = Array.from(
    form.querySelectorAll<HTMLSelectElement>('select'),
  ).some((select) =>
    Array.from(select.options).some((option) => option.value === 'recreate'),
  )
  if (!hasGenerationMode) return

  attached.add(textarea)
  const button = document.createElement('button')
  button.type = 'button'
  button.setAttribute(BUTTON_MARKER, 'true')
  button.className =
    'btn btn-ghost btn-xs w-fit gap-1 rounded-lg border border-secondary/30'
  button.textContent = '✨ Suggest prompt'
  button.title = 'Generate an editable art prompt from the canonical record'
  textarea.insertAdjacentElement('beforebegin', button)

  button.addEventListener('click', async () => {
    if (button.dataset.loading === 'true') return
    const context = managerContext(textarea, pageStore, projectStore)
    if (!context) {
      button.textContent = 'Could not identify record'
      window.setTimeout(() => {
        button.textContent = '✨ Suggest prompt'
      }, 2400)
      return
    }

    const slot = selectedSlot(form, context)
    const mode = generationMode(form)
    const title = titleForContext(context)
    const variant = variantForSlot(slot)
    const width = positiveInteger(slot.width) || 1024
    const height = positiveInteger(slot.height) || 1024
    const initialLabel = button.textContent || '✨ Suggest prompt'

    button.dataset.loading = 'true'
    button.disabled = true
    button.textContent = 'Suggesting…'

    try {
      const suggestion = await suggestArtAssetPrompt({
        subject: title,
        purpose:
          mode === 'img2img'
            ? `Image-guided ${slot.label || 'image'} replacement for ${title}; preserve canonical identity and useful composition while applying the requested change.`
            : `Fresh ${slot.label || 'image'} replacement for ${title}, grounded in the canonical ${context.entityType} record.`,
        current: textarea.value,
        entityRef: entityRef(context),
        asset: {
          source: currentImageSource(form),
          role: slot.field || slot.label || 'gallery image',
          variant,
          size: `${width}x${height}`,
          description:
            mode === 'img2img'
              ? 'Create an image-guided replacement using the current artwork as visual context.'
              : 'Create a new prompt-driven replacement for the selected gallery slot.',
        },
        page: {
          url: window.location.href,
          title: document.title,
          heading: cleanString(document.querySelector('h1')?.textContent),
          localText: cleanString(form.innerText).slice(0, 900),
        },
        maxTokens: variant === 'icon' ? 300 : 500,
      })

      if (!suggestion) throw new Error('The suggestion endpoint returned no prompt.')
      setTextareaValue(textarea, suggestion)
      textarea.focus()
      button.textContent = 'Prompt suggested ✓'
      window.setTimeout(() => {
        button.textContent = initialLabel
      }, 1800)
    } catch (error) {
      button.textContent = 'Suggestion failed'
      button.title =
        error instanceof Error ? error.message : 'Prompt suggestion failed.'
      window.setTimeout(() => {
        button.textContent = initialLabel
        button.title = 'Generate an editable art prompt from the canonical record'
      }, 2600)
    } finally {
      button.dataset.loading = 'false'
      button.disabled = textarea.disabled
    }
  })
}

function scanForEntityArtPrompts(
  root: ParentNode,
  pageStore: PageStore,
  projectStore: ProjectStore,
): void {
  for (const textarea of root.querySelectorAll<HTMLTextAreaElement>(
    'textarea[maxlength="5000"]',
  )) {
    addSuggestButton(textarea, pageStore, projectStore)
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const pageStore = usePageStore()
  const projectStore = useProjectStore()

  nuxtApp.hook('app:mounted', () => {
    scanForEntityArtPrompts(document, pageStore, projectStore)
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue
          if (node.matches('textarea[maxlength="5000"]')) {
            addSuggestButton(
              node as HTMLTextAreaElement,
              pageStore,
              projectStore,
            )
          }
          scanForEntityArtPrompts(node, pageStore, projectStore)
        }
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('beforeunload', () => observer.disconnect(), {
      once: true,
    })
  })
})