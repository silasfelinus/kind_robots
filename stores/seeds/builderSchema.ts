// /stores/seeds/builderSchema.ts
import type { DashboardTabConfig } from '@/stores/helpers/dashboardHelper'

export type BuilderStageKey =
  | 'user'
  | 'pitch'
  | 'collection'
  | 'art'
  | 'dream'
  | 'character'
  | 'reward'
  | 'scenario'

export type BuilderStageConfig = DashboardTabConfig & {
  key: BuilderStageKey
  modelType: string
  route?: string
  requiredBeforeNext?: string[]
}

export const builderStages: BuilderStageConfig[] = [
  {
    key: 'user',
    label: 'User',
    icon: 'kind-icon:person',
    title: 'User Builder',
    summary:
      'Login or register, pick a designer name, choose an avatar, configure privacy, maturity, and servers.',
    modelType: 'user',
    route: '/dashboard',
    requiredBeforeNext: ['designerName'],
  },
  {
    key: 'pitch',
    label: 'Pitch',
    icon: 'kind-icon:idea',
    title: 'Pitch Builder',
    summary:
      'Start with the big-picture idea. A pitch is the seed, not the whole haunted botanical garden.',
    modelType: 'pitch',
    route: '/brainstorm',
    requiredBeforeNext: ['title', 'pitch'],
  },
  {
    key: 'collection',
    label: 'Collection',
    icon: 'kind-icon:folder',
    title: 'Collection Builder',
    summary:
      'Create a visual folder for the idea, gathering art, references, cover images, and inspiration.',
    modelType: 'artCollection',
    route: '/art',
    requiredBeforeNext: ['name'],
  },
  {
    key: 'art',
    label: 'Art',
    icon: 'kind-icon:palette',
    title: 'Art Builder',
    summary:
      'Generate or upload original images for covers, characters, locations, rewards, and scenario moments.',
    modelType: 'artImage',
    route: '/art',
  },
  {
    key: 'dream',
    label: 'Dream',
    icon: 'kind-icon:moon',
    title: 'Dream Builder',
    summary:
      'Evolve the pitch into a richer world with setting, vibe, conflicts, locations, and reusable story fuel.',
    modelType: 'dream',
    route: '/dreams',
    requiredBeforeNext: ['title'],
  },
  {
    key: 'character',
    label: 'Character',
    icon: 'kind-icon:mask',
    title: 'Character Builder',
    summary:
      'Create people, creatures, guides, rivals, disasters, and chattable weirdos who can live inside dreams.',
    modelType: 'character',
    route: '/characters',
    requiredBeforeNext: ['name'],
  },
  {
    key: 'reward',
    label: 'Reward',
    icon: 'kind-icon:gift',
    title: 'Reward Builder',
    summary:
      'Design loot, powers, skills, secrets, permissions, curses, keys, and other narrative accelerants.',
    modelType: 'reward',
    route: '/rewards',
    requiredBeforeNext: ['title'],
  },
  {
    key: 'scenario',
    label: 'Scenario',
    icon: 'kind-icon:map',
    title: 'Scenario Builder',
    summary:
      'Build multiple-choice experiences where users can also invent solutions and let the LLM narrate outcomes.',
    modelType: 'scenario',
    route: '/stories',
    requiredBeforeNext: ['title', 'intro'],
  },
]

export const builderDashboardTabs: DashboardTabConfig[] = builderStages.map(
  ({ key, label, icon, title, summary }) => ({
    key,
    label,
    icon,
    title,
    summary,
  }),
)

export const defaultBuilderStage: BuilderStageKey = 'user'

export function isBuilderStageKey(value: string): value is BuilderStageKey {
  return builderStages.some((stage) => stage.key === value)
}

export function getBuilderStage(
  key: string | null | undefined,
): BuilderStageConfig {
  return (
    builderStages.find((stage) => stage.key === key) ??
    builderStages.find((stage) => stage.key === defaultBuilderStage) ??
    builderStages[0]
  )
}