// /composables/useStorymakerMode.ts
import { computed, ref } from 'vue'

/**
 * The reading mode for the Storymaker surface.
 *
 * Silas, 2026-08-02: "the story maker should let the user pick from all three,
 * but I would call them Classic (daisy ui defaults), story maker, and story
 * maker-dark."
 *
 * These are the three t-001 mockups, renamed and promoted from a throwaway
 * comparison page into a real per-reader preference:
 *
 *   classic         mockup C. NO theme override and no bespoke narrative
 *                   chrome -- the story renders in whatever daisyUI theme the
 *                   reader picked globally, with standard app components. This
 *                   is the one that must NOT pin a theme, or it stops meaning
 *                   "daisyUI defaults" the moment someone changes theirs.
 *   storymaker      mockup B, the warm-paper plate. Default.
 *   storymaker-dark mockup A, the lit stage in a dark house.
 *
 * The two non-classic modes are applied as `data-theme` on the story SUBTREE
 * rather than on <html>, so choosing one does not hijack the rest of the app --
 * a reader who runs the site in `synthwave` keeps synthwave everywhere else.
 * That is also why this is a separate preference from themeStore rather than a
 * second writer to it: two writers to `data-theme` on the root would race.
 */
export type StorymakerMode = 'classic' | 'storymaker' | 'storymaker-dark'

export const STORYMAKER_MODES: {
  key: StorymakerMode
  label: string
  hint: string
}[] = [
  {
    key: 'classic',
    label: 'Classic',
    hint: 'Your own theme, standard layout',
  },
  {
    key: 'storymaker',
    label: 'Storymaker',
    hint: 'Warm paper, serif narration',
  },
  {
    key: 'storymaker-dark',
    label: 'Storymaker Dark',
    hint: 'A lit stage in a dark house',
  },
]

const STORAGE_KEY = 'storymakerMode'
const DEFAULT_MODE: StorymakerMode = 'storymaker'

function isMode(value: unknown): value is StorymakerMode {
  return STORYMAKER_MODES.some((mode) => mode.key === value)
}

// Module-level so every Storymaker surface on the page agrees, and so the
// choice survives navigating between them within a session.
const mode = ref<StorymakerMode>(DEFAULT_MODE)
let hydrated = false

function read(): StorymakerMode {
  if (typeof window === 'undefined') return DEFAULT_MODE
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isMode(stored) ? stored : DEFAULT_MODE
  } catch {
    return DEFAULT_MODE
  }
}

export function useStorymakerMode() {
  // Hydrate lazily rather than at module scope: this file is imported during
  // SSR, where localStorage does not exist, and reading it at import time would
  // also bake the first visitor's choice into the module for the whole process.
  if (!hydrated && typeof window !== 'undefined') {
    mode.value = read()
    hydrated = true
  }

  function setMode(next: StorymakerMode): void {
    if (!isMode(next)) return
    mode.value = next
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // A reader with storage disabled still gets the mode for this session.
    }
  }

  /**
   * What to bind to `:data-theme` on the story subtree.
   *
   * `undefined` for classic, NOT the empty string: Vue drops an attribute bound
   * to undefined, whereas `data-theme=""` is a real attribute that daisyUI
   * treats as an unknown theme and resolves to its fallback -- which would
   * silently override the reader's global choice, the exact thing classic
   * exists to preserve.
   */
  const dataTheme = computed<string | undefined>(() =>
    mode.value === 'classic' ? undefined : mode.value,
  )

  /** True when the reader wants the bespoke narrative treatment. */
  const isStoryStyled = computed(() => mode.value !== 'classic')

  return { mode, setMode, dataTheme, isStoryStyled, modes: STORYMAKER_MODES }
}
