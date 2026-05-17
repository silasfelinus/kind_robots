// /stores/seeds/builderSections.ts
export type BuilderSectionKey =
  | 'setup'
  | 'select'
  | 'design'
  | 'generate'
  | 'connect'
  | 'configure'
  | 'summary'

export type BuilderChoiceSummary = {
  key: string
  label: string
  value?: string | number | boolean | null
  image?: string | null
  icon?: string | null
  description?: string | null
  editSection?: BuilderSectionKey
}

export type BuilderSectionConfig = {
  key: BuilderSectionKey
  label: string
  icon: string
  title: string
  summary: string
}

export const defaultBuilderSections: BuilderSectionConfig[] = [
  {
    key: 'setup',
    label: 'Setup',
    icon: 'kind-icon:sparkles',
    title: 'Setup',
    summary: 'Start with the intent, context, and basic shape of this builder step.',
  },
  {
    key: 'select',
    label: 'Select',
    icon: 'kind-icon:check',
    title: 'Select',
    summary: 'Choose existing records, defaults, or linked creative material.',
  },
  {
    key: 'design',
    label: 'Design',
    icon: 'kind-icon:edit',
    title: 'Design',
    summary: 'Create or refine the main content for this builder step.',
  },
  {
    key: 'connect',
    label: 'Connect',
    icon: 'kind-icon:link',
    title: 'Connect',
    summary: 'Attach this work to related dreams, collections, art, characters, rewards, or scenarios.',
  },
  {
    key: 'summary',
    label: 'Summary',
    icon: 'kind-icon:blueprint',
    title: 'Summary',
    summary: 'Review the current choices, images, links, and next actions.',
  },
]

export const artBuilderSections: BuilderSectionConfig[] = [
  {
    key: 'setup',
    label: 'Goal',
    icon: 'kind-icon:compass',
    title: 'Art Goal',
    summary: 'Choose whether this image is a cover, reference, portrait, location, reward, or scenario moment.',
  },
  {
    key: 'select',
    label: 'Source',
    icon: 'kind-icon:image',
    title: 'Image Source',
    summary: 'Start from an upload, existing image, collection, pitch, dream, or empty prompt.',
  },
  {
    key: 'design',
    label: 'Prompt',
    icon: 'kind-icon:prompt',
    title: 'Prompt Design',
    summary: 'Shape the visual prompt, style, subject, setting, and constraints.',
  },
  {
    key: 'generate',
    label: 'Generate',
    icon: 'kind-icon:wand',
    title: 'Generate Art',
    summary: 'Send the prompt to the active art server and review the result.',
  },
  {
    key: 'connect',
    label: 'Attach',
    icon: 'kind-icon:link',
    title: 'Attach Art',
    summary: 'Connect the image to collections, dreams, characters, rewards, or scenarios.',
  },
  {
    key: 'summary',
    label: 'Summary',
    icon: 'kind-icon:blueprint',
    title: 'Art Summary',
    summary: 'Review the selected image, prompt, destination, and connected records.',
  },
]

export const pitchBuilderSections: BuilderSectionConfig[] = [
  {
    key: 'setup',
    label: 'Seed',
    icon: 'kind-icon:sparkles',
    title: 'Pitch Seed',
    summary: 'Start with the rough idea, genre, mood, and creative direction.',
  },
  {
    key: 'design',
    label: 'Pitch',
    icon: 'kind-icon:idea',
    title: 'Pitch Design',
    summary: 'Write, generate, revise, or select the big-picture concept.',
  },
  {
    key: 'connect',
    label: 'Links',
    icon: 'kind-icon:link',
    title: 'Pitch Links',
    summary: 'Attach art, collections, dreams, tags, or related inspirations.',
  },
  {
    key: 'summary',
    label: 'Summary',
    icon: 'kind-icon:blueprint',
    title: 'Pitch Summary',
    summary: 'Review the core idea and decide what to build next.',
  },
]

export const dreamBuilderSections: BuilderSectionConfig[] = [
  {
    key: 'setup',
    label: 'Vibe',
    icon: 'kind-icon:moon',
    title: 'Dream Vibe',
    summary: 'Choose the pitch, mood, genre, and world direction.',
  },
  {
    key: 'design',
    label: 'World',
    icon: 'kind-icon:world',
    title: 'World Design',
    summary: 'Expand the pitch into setting, tone, hooks, conflicts, and locations.',
  },
  {
    key: 'connect',
    label: 'Links',
    icon: 'kind-icon:link',
    title: 'Dream Links',
    summary: 'Attach collections, art, characters, rewards, and scenario seeds.',
  },
  {
    key: 'summary',
    label: 'Summary',
    icon: 'kind-icon:blueprint',
    title: 'Dream Summary',
    summary: 'Review the evolved world and prepare it for characters and scenarios.',
  },
]