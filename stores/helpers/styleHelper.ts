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
  History: '🏛️',
}

export function styleEntryKey(style: StyleEntry): string {
  return style.slug ?? style.loraPath ?? style.label
}
