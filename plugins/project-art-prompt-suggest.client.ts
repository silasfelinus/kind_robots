import { suggestArtAssetPrompt } from '@/stores/helpers/artAssetSuggest'

type VueInstanceLike = {
  props?: Record<string, unknown>
  parent?: VueInstanceLike | null
}

type VueElement = HTMLElement & {
  __vueParentComponent?: VueInstanceLike | null
}

type ProjectContext = {
  id?: number
  slug: string
  title: string
}

type ProjectArtField = 'imagePath' | 'cardPath' | 'heroPath'

type ProjectArtMeta = {
  label: string
  variant: 'icon' | 'card' | 'hero'
  width: number
  height: number
}

const FIELD_META: Record<ProjectArtField, ProjectArtMeta> = {
  imagePath: { label: 'Icon', variant: 'icon', width: 256, height: 256 },
  cardPath: { label: 'Card', variant: 'card', width: 512, height: 768 },
  heroPath: { label: 'Hero', variant: 'hero', width: 1280, height: 720 },
}

const attached = new WeakSet<HTMLTextAreaElement>()

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function positiveInteger(value: unknown): number | undefined {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : undefined
}

function projectContext(element: HTMLElement): ProjectContext | null {
  let instance: VueInstanceLike | null | undefined =
    (element as VueElement).__vueParentComponent

  while (instance) {
    const props = instance.props ?? {}
    const slug = cleanString(props.slug)
    const id = positiveInteger(props.projectId)
    const isProjectGallery =
      slug &&
      ('heroPath' in props || 'cardPath' in props || 'iconPath' in props)

    if (isProjectGallery) {
      return {
        ...(id ? { id } : {}),
        slug,
        title:
          cleanString(document.querySelector('h1')?.textContent) ||
          cleanString(document.title) ||
          slug,
      }
    }

    instance = instance.parent
  }

  return null
}

function selectedField(form: HTMLFormElement): ProjectArtField {
  const select = Array.from(
    form.querySelectorAll<HTMLSelectElement>('select'),
  ).find((candidate) =>
    Array.from(candidate.options).some((option) => option.value === 'heroPath'),
  )
  const value = select?.value
  return value === 'imagePath' || value === 'heroPath' ? value : 'cardPath'
}

function currentImageSource(form: HTMLFormElement): string | undefined {
  const image = form.closest('section')?.querySelector<HTMLImageElement>('img')
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

function addSuggestButton(textarea: HTMLTextAreaElement): void {
  if (attached.has(textarea)) return
  const form = textarea.closest<HTMLFormElement>('form')
  if (!form) return
  const context = projectContext(textarea)
  if (!context) return

  const hasProjectTarget = Array.from(
    form.querySelectorAll<HTMLSelectElement>('select'),
  ).some((select) =>
    Array.from(select.options).some((option) => option.value === 'heroPath'),
  )
  if (!hasProjectTarget) return

  attached.add(textarea)
  const button = document.createElement('button')
  button.type = 'button'
  button.dataset.projectArtPromptSuggest = 'true'
  button.className =
    'btn btn-ghost btn-xs w-fit gap-1 rounded-lg border border-secondary/30'
  button.textContent = '✨ Suggest prompt'
  button.title = 'Generate an editable art prompt from the canonical Project record'
  textarea.insertAdjacentElement('beforebegin', button)

  button.addEventListener('click', async () => {
    if (button.dataset.loading === 'true') return
    const currentContext = projectContext(textarea)
    if (!currentContext) return

    const field = selectedField(form)
    const meta = FIELD_META[field]
    const initialLabel = button.textContent || '✨ Suggest prompt'
    button.dataset.loading = 'true'
    button.disabled = true
    button.textContent = 'Suggesting…'

    try {
      const suggestion = await suggestArtAssetPrompt({
        subject: currentContext.title,
        purpose: `Fresh ${meta.label} replacement for ${currentContext.title}, grounded in the canonical Project record and what the project actually does.`,
        current: textarea.value,
        entityRef: {
          modelType: 'project',
          ...(currentContext.id ? { id: currentContext.id } : {}),
          slug: currentContext.slug,
        },
        asset: {
          source: currentImageSource(form),
          role: field,
          variant: meta.variant,
          size: `${meta.width}x${meta.height}`,
          description: `Create a prompt-driven replacement for the Project ${meta.label.toLowerCase()} slot.`,
        },
        page: {
          url: window.location.href,
          title: document.title,
          heading: cleanString(document.querySelector('h1')?.textContent),
          localText: cleanString(form.innerText).slice(0, 900),
        },
        maxTokens: meta.variant === 'icon' ? 300 : 500,
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
        button.title =
          'Generate an editable art prompt from the canonical Project record'
      }, 2600)
    } finally {
      button.dataset.loading = 'false'
      button.disabled = textarea.disabled
    }
  })
}

function scan(root: ParentNode = document): void {
  for (const textarea of root.querySelectorAll<HTMLTextAreaElement>(
    'textarea[maxlength="4000"]',
  )) {
    addSuggestButton(textarea)
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    scan()
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue
          if (node.matches('textarea[maxlength="4000"]')) {
            addSuggestButton(node as HTMLTextAreaElement)
          }
          scan(node)
        }
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('beforeunload', () => observer.disconnect(), {
      once: true,
    })
  })
})
