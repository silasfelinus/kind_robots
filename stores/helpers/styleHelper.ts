// /stores/helpers/styleHelper.ts
//
// Shared style-transfer types used by art-styler.vue and the AI Art
// Academy surfaces. Lives outside the SFC because <script setup>
// cannot re-export types.

export type StyleCategory =
  | 'Painterly'
  | 'Illustration'
  | 'Cartoon'
  | 'Anime'
  | 'Trippy'
  | '3D/Craft'
  | 'Realism'
  | 'Ink'
  | 'Line Art'
  | 'History'

export interface StyleEntry {
  /**
   * LoRA reference on the art server. Optional: prompt-mode styles
   * (e.g. Academy historical styles) rely on base-model knowledge and
   * carry only a triggerPhrase.
   */
  loraPath?: string
  loraWeight?: number
  triggerPhrase: string
  label: string
  category: StyleCategory
  /** Stable identity for external registries; falls back to loraPath/label. */
  slug?: string
  previewImageSrc?: string
  resourceId?: number
}

export const STYLE_CATEGORY_ICONS: Record<StyleCategory, string> = {
  Painterly: '🎨',
  Illustration: '✏️',
  Cartoon: '🎬',
  Anime: '⛩️',
  Trippy: '🌈',
  '3D/Craft': '🏺',
  Realism: '📸',
  Ink: '🖋️',
  'Line Art': '🖍️',
  History: '🏛️',
}

export function styleEntryKey(style: StyleEntry): string {
  return style.slug ?? style.loraPath ?? style.label
}

// Coloring-book conversions. Prompt-only (no LoRA): Kontext turns any photo or
// finished design into printable line art from the instruction alone. Shared
// as the single source of truth between art-styler's builtin grid and the
// dedicated /coloring-page maker so both stay in sync.
export const COLORING_STYLES: StyleEntry[] = [
  {
    slug: 'coloring-page',
    triggerPhrase:
      'Convert this image into a clean black-and-white coloring book page: crisp bold black outlines on a pure white background, no shading, no grayscale, no color fills — just clear line art ready to be colored in',
    label: 'Coloring Page',
    category: 'Line Art',
  },
  {
    slug: 'coloring-bold',
    triggerPhrase:
      'Convert this image into a simple bold coloring book page for young children: thick clean black outlines, large open areas, minimal fine detail, no shading and no color on a pure white background',
    label: 'Bold Coloring',
    category: 'Line Art',
  },
]
