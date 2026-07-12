import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  useProjectStore,
  type ProjectWithRelations,
} from '@/stores/projectStore'
import { usePageStore } from '@/stores/pageStore'
import { useSheetStore } from '@/stores/sheetStore'
import type { BuilderCard } from '@/stores/helpers/builderCards'

const PROJECT_IMAGE_BASE =
  'https://raw.githubusercontent.com/silasfelinus/conductor/main/projects/images'
const WORKSPACE_OVERVIEW_HERO = '/images/dashboard-tabs/wonder/workspace.webp'

type SheetProfile = {
  key: string
  label: string
  title: string
  narrative: string
  imagePath: string
  icon: string
}

type ImageRecord = Record<string, unknown>

type ImageCard = BuilderCard & {
  image?: string
  imagePath?: string
  splashImage?: string
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function firstString(values: unknown[]): string {
  const found = values.find((value) => stringValue(value).length > 0)
  return stringValue(found)
}

function recordValue(value: unknown): ImageRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as ImageRecord)
    : null
}

function conductorImagePath(
  slug: string,
  kind: 'icon' | 'card' | 'hero',
): string {
  return slug ? `${PROJECT_IMAGE_BASE}/${slug}-${kind}.webp` : ''
}

function projectImagePath(
  project: ProjectWithRelations | null,
  slug: string,
): string {
  const artImage = recordValue(project?.ArtImage)

  return firstString([
    project?.heroPath,
    project?.cardPath,
    project?.imagePath,
    project?.highlightImage,
    artImage?.imagePath,
    artImage?.path,
    artImage?.fileName,
    conductorImagePath(slug, 'hero'),
  ])
}

function cardImagePath(card: BuilderCard | null): string {
  const imageCard = card as ImageCard | null
  const payload = recordValue(card?.payload)

  return firstString([
    imageCard?.heroImage,
    imageCard?.deckImage,
    imageCard?.image,
    imageCard?.imagePath,
    imageCard?.splashImage,
    payload?.heroImage,
    payload?.deckImage,
    payload?.image,
    payload?.imagePath,
    payload?.splashImage,
  ])
}

function profileFromProject(
  key: string,
  card: BuilderCard | null,
  project: ProjectWithRelations | null,
): SheetProfile {
  const title = firstString([project?.title, card?.title, card?.label, key])
  const narrative = firstString([
    project?.description,
    project?.pitch,
    project?.flavorText,
    project?.goal,
    card?.narrative,
    card?.tagline,
    card?.title,
  ])

  return {
    key,
    label: firstString([card?.label, project?.status, 'Project']),
    title,
    narrative,
    imagePath: firstString([
      projectImagePath(project, key),
      cardImagePath(card),
    ]),
    icon: firstString([project?.icon, card?.icon, 'kind-icon:gearhammer']),
  }
}

function overviewProfile(card: BuilderCard | null): SheetProfile {
  return {
    key: 'overview',
    label: 'Conductor',
    title: firstString([card?.title, 'Conductor Workspace']),
    narrative: firstString([
      card?.narrative,
      card?.tagline,
      'The private cockpit for the Conductor loop: project progress, pitches awaiting your vote, and what needs a human.',
    ]),
    imagePath: firstString([cardImagePath(card), WORKSPACE_OVERVIEW_HERO]),
    icon: firstString([card?.icon, 'kind-icon:gearhammer']),
  }
}

function brainstormProfile(
  card: BuilderCard | null,
  project: ProjectWithRelations | null,
): SheetProfile {
  return {
    ...profileFromProject('brainstorm', card, project),
    label: firstString([card?.label, 'Brainstorm']),
    title: firstString([card?.title, project?.title, 'Brainstorm']),
    narrative: firstString([
      project?.description,
      project?.pitch,
      project?.goal,
      card?.narrative,
      card?.tagline,
      'Review generated pitches, sort future project ideas, and decide what deserves agent attention next.',
    ]),
    imagePath: firstString([
      projectImagePath(project, 'brainstorm'),
      cardImagePath(card),
      conductorImagePath('brainstorm', 'hero'),
    ]),
  }
}

export default defineNuxtPlugin(() => {
  const route = useRoute()
  const projectStore = useProjectStore()
  const pageStore = usePageStore()
  const sheetStore = useSheetStore()

  const isWorkspace = computed(() => {
    return (
      route.path === '/conductor' ||
      route.path === '/workspace' ||
      (pageStore.dashboardKey === 'wonder' &&
        pageStore.dashboardTab === 'workspace')
    )
  })

  const activeKey = computed(() => pageStore.workspaceCardKey || 'overview')

  const activeCard = computed(() => {
    return pageStore.cards.find((card) => card.key === activeKey.value) ?? null
  })

  const activeProject = computed(() => {
    return projectStore.projectForSlug(activeKey.value)
  })

  const sheetProfile = computed<SheetProfile | null>(() => {
    if (!isWorkspace.value) return null

    if (activeKey.value === 'overview') {
      return overviewProfile(activeCard.value)
    }

    if (activeKey.value === 'brainstorm') {
      return brainstormProfile(activeCard.value, activeProject.value)
    }

    return profileFromProject(
      activeKey.value,
      activeCard.value,
      activeProject.value,
    )
  })

  watch(
    sheetProfile,
    (profile) => {
      const currentSource = sheetStore.override?.source ?? ''

      if (!profile) {
        if (currentSource.startsWith('conductor-page:')) {
          sheetStore.clearSheet(currentSource)
        }
        return
      }

      sheetStore.setSheet({
        source: `conductor-page:${profile.key}`,
        label: profile.label,
        title: profile.title,
        narrative: profile.narrative,
        imagePath: profile.imagePath,
        icon: profile.icon,
      })
    },
    { immediate: true },
  )
})
