from pathlib import Path
import re


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing patch anchor: {label}")
    return text.replace(old, new, 1)


def regex_once(text: str, pattern: str, replacement: str, label: str) -> str:
    next_text, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f"Expected one regex patch for {label}, found {count}")
    return next_text


root = Path(__file__).resolve().parents[1]

# ---------------------------------------------------------------------------
# Project gallery: active by default, friendly status toggles, stable sorting,
# and explicit image metadata for the missing-cover reporter.
# ---------------------------------------------------------------------------
gallery_path = root / "components/pages/conductor-overview-gallery-page.vue"
gallery = gallery_path.read_text()

gallery = replace_once(
    gallery,
    "    </header>\n\n    <main",
    """    </header>

    <nav
      v-if="userStore.isAdmin"
      class="flex shrink-0 flex-wrap items-center gap-1 rounded-2xl border border-base-300 bg-base-100 p-2"
      aria-label="Project status filters"
    >
      <button
        v-for="option in projectFilterOptions"
        :key="option.value"
        type="button"
        class="btn btn-xs gap-1 rounded-2xl"
        :class="projectFilter === option.value ? 'btn-primary' : 'btn-ghost'"
        @click="projectFilter = option.value"
      >
        <Icon :name="option.icon" class="size-3" />
        {{ option.label }}
        <span class="badge badge-xs" :class="projectFilter === option.value ? 'badge-ghost' : 'badge-outline'">
          {{ projectFilterCount(option.value) }}
        </span>
      </button>
    </nav>

    <main""",
    "gallery filter navigation",
)

for source, field, variant in (
    ('item.cardPath', 'cardPath', 'card'),
    ('item.heroPath', 'heroPath', 'hero'),
    ('item.iconPath', 'imagePath', 'icon'),
):
    gallery = gallery.replace(
        f'            :src="{source}"\n',
        f'''            :src="{source}"
            :data-project-id="item.projectId || undefined"
            :data-project-slug="item.slug"
            data-project-field="{field}"
            data-variant="{variant}"
''',
    )
    gallery = gallery.replace(
        f'              :src="{source}"\n',
        f'''              :src="{source}"
              :data-project-id="item.projectId || undefined"
              :data-project-slug="item.slug"
              data-project-field="{field}"
              data-variant="{variant}"
''',
    )

gallery = replace_once(
    gallery,
    "type GalleryMode = 'cards' | 'heroes' | 'icons' | 'list'\n",
    """type GalleryMode = 'cards' | 'heroes' | 'icons' | 'list'
type ProjectFilter = 'ACTIVE' | 'PAUSED' | 'DONE' | 'BRAINSTORM' | 'ARCHIVED' | 'ALL'
""",
    "project filter type",
)

gallery = replace_once(
    gallery,
    "  status: string\n  priority: ProjectPriorityLevel\n",
    "  status: string\n  isActive: boolean\n  updatedAt: number\n  priority: ProjectPriorityLevel\n",
    "gallery item activity fields",
)

gallery = replace_once(
    gallery,
    "const projectGalleryMode = ref<GalleryMode>('cards')\n",
    """const projectGalleryMode = ref<GalleryMode>('cards')
const projectFilter = ref<ProjectFilter>('ACTIVE')
const projectFilterOptions: Array<{
  value: ProjectFilter
  label: string
  icon: string
}> = [
  { value: 'ACTIVE', label: 'Active', icon: 'kind-icon:sparkles' },
  { value: 'PAUSED', label: 'Paused', icon: 'kind-icon:pause' },
  { value: 'DONE', label: 'Completed', icon: 'kind-icon:check-circle' },
  { value: 'BRAINSTORM', label: 'Ideas', icon: 'kind-icon:lightbulb' },
  { value: 'ARCHIVED', label: 'Archived', icon: 'kind-icon:archive' },
  { value: 'ALL', label: 'All', icon: 'kind-icon:cards' },
]
""",
    "project filter state",
)

replacement_block = """const brainstormProjects = computed(() => {
  return conductorStore.projects.filter(
    (project) => dbProjectForSlug(project.slug)?.status === 'BRAINSTORM',
  )
})

const priorityOrder: Record<ProjectPriorityLevel, number> = {
  HIGH: 0,
  NORMAL: 1,
  LOW: 2,
}

const adminItems = computed<ProjectGalleryItem[]>(() => {
  const conductorItems = conductorStore.projects.map((project) =>
    itemFromProject(project),
  )
  const conductorSlugs = new Set(
    conductorStore.projects.map((project) => project.slug),
  )
  const databaseOnlyItems = projectStore.projects.flatMap((project) => {
    const slug = project.conductorSlug || project.slug
    return slug && !conductorSlugs.has(slug)
      ? [itemFromProjectRecord(project)]
      : []
  })
  return [...conductorItems, ...databaseOnlyItems]
})

const publicItems = computed<ProjectGalleryItem[]>(() => {
  return projectStore.publicProjects
    .flatMap((project) =>
      project.slug ? [itemFromProjectRecord(project)] : [],
    )
    .sort((a, b) => a.title.localeCompare(b.title))
})

function matchesProjectFilter(
  item: ProjectGalleryItem,
  filter: ProjectFilter,
): boolean {
  if (filter === 'ALL') return true
  if (filter === 'ARCHIVED') {
    return !item.isActive || item.status === 'ARCHIVED'
  }
  if (filter === 'ACTIVE') {
    return item.isActive && item.status === 'ACTIVE'
  }
  return item.isActive && item.status === filter
}

function sortProjectItems(
  items: ProjectGalleryItem[],
): ProjectGalleryItem[] {
  return [...items].sort((a, b) => {
    const priority =
      (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)
    if (priority !== 0) return priority
    if (a.updatedAt !== b.updatedAt) return b.updatedAt - a.updatedAt
    return a.title.localeCompare(b.title)
  })
}

const galleryItems = computed(() => {
  if (!userStore.isAdmin) return publicItems.value
  return sortProjectItems(
    adminItems.value.filter((item) =>
      matchesProjectFilter(item, projectFilter.value),
    ),
  )
})

function projectFilterCount(filter: ProjectFilter): number {
  return adminItems.value.filter((item) => matchesProjectFilter(item, filter))
    .length
}
"""

gallery = regex_once(
    gallery,
    r"const activeProjects = computed\(\(\) => \{.*?const galleryItems = computed\(\(\) => \{\n  return userStore\.isAdmin \? adminItems\.value : publicItems\.value\n\}\)\n",
    replacement_block,
    "gallery status filtering block",
)

gallery = replace_once(
    gallery,
    "watch(projectGalleryMode, (mode) => {\n  if (!import.meta.client) return\n\n  localStorage.setItem('conductor-gallery-mode', mode)\n})\n",
    """watch(projectGalleryMode, (mode) => {
  if (!import.meta.client) return
  localStorage.setItem('conductor-gallery-mode', mode)
})

watch(projectFilter, (filter) => {
  if (!import.meta.client) return
  localStorage.setItem('conductor-project-filter', filter)
})
""",
    "project filter persistence watcher",
)

gallery = replace_once(
    gallery,
    """    if (saved && galleryModeOptions.some((mode) => mode.value === saved)) {
      projectGalleryMode.value = saved
    }
  }

  await ensureData()
""",
    """    if (saved && galleryModeOptions.some((mode) => mode.value === saved)) {
      projectGalleryMode.value = saved
    }

    const savedFilter = localStorage.getItem(
      'conductor-project-filter',
    ) as ProjectFilter | null
    if (
      savedFilter &&
      projectFilterOptions.some((option) => option.value === savedFilter)
    ) {
      projectFilter.value = savedFilter
    }
  }

  await ensureData()
""",
    "restore project filter",
)

gallery = replace_once(
    gallery,
    "    status: record?.status || 'ACTIVE',\n    priority,\n",
    """    status: record?.status || 'ACTIVE',
    isActive: record?.isActive ?? true,
    updatedAt: record?.updatedAt ? new Date(record.updatedAt).getTime() : 0,
    priority,
""",
    "conductor gallery activity metadata",
)

gallery = replace_once(
    gallery,
    "    status: record.status,\n    priority: record.priority as ProjectPriorityLevel,\n",
    """    status: record.status,
    isActive: record.isActive,
    updatedAt: record.updatedAt ? new Date(record.updatedAt).getTime() : 0,
    priority: record.priority as ProjectPriorityLevel,
""",
    "database gallery activity metadata",
)

gallery_path.write_text(gallery)

# ---------------------------------------------------------------------------
# Browser missing-image reporter: observe self-hosted media and carry project
# identity/field metadata through the queue.
# ---------------------------------------------------------------------------
reporter_path = root / "plugins/missing-image-reporter.client.ts"
reporter = reporter_path.read_text()
reporter = replace_once(
    reporter,
    "  imageClass?: string\n}",
    """  imageClass?: string
  projectId?: number
  projectSlug?: string
  projectField?: string
}""",
    "missing-image project metadata type",
)
reporter = replace_once(
    reporter,
    "      'raw.githubusercontent.com',\n",
    "      'raw.githubusercontent.com',\n      'media.acrocatranch.com',\n",
    "self-hosted media allowlist",
)
reporter = replace_once(
    reporter,
    """      imageClass: cleanString(img.getAttribute('class')) || undefined,
    }
""",
    """      imageClass: cleanString(img.getAttribute('class')) || undefined,
      projectId:
        Number.isInteger(Number(img.dataset.projectId)) &&
        Number(img.dataset.projectId) > 0
          ? Number(img.dataset.projectId)
          : undefined,
      projectSlug: cleanString(img.dataset.projectSlug) || undefined,
      projectField: cleanString(img.dataset.projectField) || undefined,
    }
""",
    "missing-image project metadata payload",
)
reporter_path.write_text(reporter)

# ---------------------------------------------------------------------------
# YAML request contract: preserve project metadata and only suppress a retry
# while a matching request is actively pending/running.
# ---------------------------------------------------------------------------
yaml_path = root / "server/utils/artRequestYaml.ts"
yaml_text = yaml_path.read_text()
yaml_text = replace_once(
    yaml_text,
    "  label: string\n  prompt: string\n}",
    """  label: string
  prompt: string
  project_id?: number
  project_slug?: string
  project_field?: string
}""",
    "art queue project metadata type",
)
yaml_text = replace_once(
    yaml_text,
    """  if (normalized.label) lines.push(`  label: ${yamlQuoted(normalized.label)}`)
  lines.push(`  ${yamlFolded('prompt', normalized.prompt, '    ')}`)
""",
    """  if (normalized.label) lines.push(`  label: ${yamlQuoted(normalized.label)}`)
  if (normalized.project_id) lines.push(`  project_id: ${normalized.project_id}`)
  if (normalized.project_slug) {
    lines.push(`  project_slug: ${yamlQuoted(normalized.project_slug)}`)
  }
  if (normalized.project_field) {
    lines.push(`  project_field: ${yamlQuoted(normalized.project_field)}`)
  }
  lines.push(`  ${yamlFolded('prompt', normalized.prompt, '    ')}`)
""",
    "render project metadata",
)
yaml_text = replace_once(
    yaml_text,
    """export function requestAlreadyQueued(content: string, entry: ArtQueueEntry): boolean {
  const normalized = normalizeArtQueueEntry(entry)
  return content.includes(normalized.id) || content.includes(normalized.image_path)
}
""",
    """const ACTIVE_REQUEST_STATUSES = new Set([
  'pending',
  'queued',
  'running',
  'processing',
])

function requestValue(block: string, key: string): string {
  const match = block.match(new RegExp(`^\\s{2}${key}:\\s*(.+?)\\s*$`, 'm'))
  if (!match?.[1]) return ''
  const value = match[1].trim()
  if (value.startsWith('"')) {
    try {
      return String(JSON.parse(value))
    } catch {}
  }
  return value.replace(/^['\"]|['\"]$/g, '')
}

function requestBlocks(content: string): string[] {
  return content.match(/^- id:[\\s\\S]*?(?=^- id:|\\s*$)/gm) ?? []
}

export function requestAlreadyQueued(content: string, entry: ArtQueueEntry): boolean {
  const normalized = normalizeArtQueueEntry(entry)

  return requestBlocks(content).some((block) => {
    const status = requestValue(block, 'status').toLowerCase() || 'pending'
    if (!ACTIVE_REQUEST_STATUSES.has(status)) return false
    return (
      requestValue(block, 'id') === normalized.id ||
      requestValue(block, 'image_path') === normalized.image_path
    )
  })
}
""",
    "status-aware art request dedupe",
)
yaml_path.write_text(yaml_text)

# ---------------------------------------------------------------------------
# Request endpoint: accept project metadata and generate a unique attempt ID so
# a terminal historical request can be retried without duplicate YAML IDs.
# ---------------------------------------------------------------------------
request_path = root / "server/api/conductor/art-request.post.ts"
request_text = request_path.read_text()
request_text = replace_once(
    request_text,
    "  imageClass?: string\n}",
    """  imageClass?: string
  projectId?: number
  projectSlug?: string
  projectField?: string
}""",
    "art request project metadata body",
)
request_text = replace_once(
    request_text,
    """  const id = `${slugify(`${repoName}-${target.slug}-${target.variant}`)}-${hash}`
  const fallbackPrompt = buildFallbackPrompt(body, target)
""",
    """  const attempt = Date.now().toString(36)
  const id = `${slugify(`${repoName}-${target.slug}-${target.variant}`)}-${hash}-${attempt}`
  const fallbackPrompt = buildFallbackPrompt(body, target)
""",
    "unique art request attempt ID",
)
request_text = replace_once(
    request_text,
    """    label: cleanString(body.alt || body.label) || titleFromSlug(target.slug),
    prompt,
  }
""",
    """    label: cleanString(body.alt || body.label) || titleFromSlug(target.slug),
    prompt,
    ...(Number.isInteger(Number(body.projectId)) && Number(body.projectId) > 0
      ? { project_id: Number(body.projectId) }
      : {}),
    ...(cleanString(body.projectSlug)
      ? { project_slug: cleanString(body.projectSlug) }
      : {}),
    ...(['imagePath', 'cardPath', 'heroPath'].includes(
      cleanString(body.projectField),
    )
      ? { project_field: cleanString(body.projectField) }
      : {}),
  }
""",
    "art request queue metadata",
)
request_path.write_text(request_text)

# ---------------------------------------------------------------------------
# Completion endpoint: synchronize a verified generated cover to Project and
# ArtImage path fields.
# ---------------------------------------------------------------------------
completion_path = root / "server/api/conductor/project-art-complete.post.ts"
completion_path.write_text("""// /server/api/conductor/project-art-complete.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireMachineUser } from '~/server/utils/authGuard'
import { normalizeKindRobotsImagePath } from '~/server/utils/artJobNormalization'

const KIND_ROBOTS_REPO = 'silasfelinus/kind_robots'
const CONDUCTOR_REPO = 'silasfelinus/conductor'
const PROJECT_FIELDS = new Set(['imagePath', 'cardPath', 'heroPath'])

type ProjectArtCompleteBody = {
  projectId?: number | null
  projectSlug?: string | null
  projectField?: string | null
  variant?: string | null
  targetRepo?: string | null
  imagePath?: string | null
  sourceUrl?: string | null
  artImageId?: number | null
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function projectField(body: ProjectArtCompleteBody): 'imagePath' | 'cardPath' | 'heroPath' {
  const explicit = clean(body.projectField)
  if (PROJECT_FIELDS.has(explicit)) {
    return explicit as 'imagePath' | 'cardPath' | 'heroPath'
  }

  const variant = clean(body.variant).toLowerCase()
  if (variant === 'icon') return 'imagePath'
  if (variant === 'card') return 'cardPath'
  if (variant === 'hero') return 'heroPath'
  throw createError({ statusCode: 400, message: 'Invalid project cover field.' })
}

function assetPath(body: ProjectArtCompleteBody): string {
  const targetRepo = clean(body.targetRepo)
  const imagePath = clean(body.imagePath)
  const sourceUrl = clean(body.sourceUrl)

  if (targetRepo === KIND_ROBOTS_REPO) {
    return `/${normalizeKindRobotsImagePath(imagePath).replace(/^public\//, '')}`
  }

  if (targetRepo === CONDUCTOR_REPO) {
    if (sourceUrl) return sourceUrl
    const path = imagePath.replace(/^\/+/, '')
    return `https://raw.githubusercontent.com/silasfelinus/conductor/main/${path}`
  }

  const value = sourceUrl || imagePath
  if (!value) {
    throw createError({ statusCode: 400, message: 'Missing completed image path.' })
  }
  return value
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({ statusCode: 403, message: 'Admin access required.' })
    }

    const body = (await readBody<ProjectArtCompleteBody>(event)) || {}
    const id = Number(body.projectId)
    const slug = clean(body.projectSlug)
    const artImageId = Number(body.artImageId)

    if ((!Number.isInteger(id) || id <= 0) && !slug) {
      throw createError({ statusCode: 400, message: 'Missing project identity.' })
    }
    if (!Number.isInteger(artImageId) || artImageId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid ArtImage id.' })
    }

    const project = await prisma.project.findFirst({
      where:
        Number.isInteger(id) && id > 0
          ? { id }
          : { OR: [{ slug }, { conductorSlug: slug }] },
    })
    if (!project) {
      throw createError({ statusCode: 404, message: `Project ${slug || id} not found.` })
    }

    const image = await prisma.artImage.findUnique({ where: { id: artImageId } })
    if (!image) {
      throw createError({ statusCode: 404, message: `ArtImage ${artImageId} not found.` })
    }

    const field = projectField(body)
    const path = assetPath(body)
    const artImageField = field === 'imagePath' ? 'iconPath' : field
    const shouldAttachPrimaryImage = field === 'imagePath' || !project.artImageId

    const updated = await prisma.$transaction(async (tx) => {
      await tx.artImage.update({
        where: { id: artImageId },
        data: { [artImageField]: path } as Prisma.ArtImageUncheckedUpdateInput,
      })

      return tx.project.update({
        where: { id: project.id },
        data: {
          [field]: path,
          ...(shouldAttachPrimaryImage ? { artImageId } : {}),
        } as Prisma.ProjectUncheckedUpdateInput,
      })
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: `Project ${updated.slug || updated.id} ${field} synchronized.`,
      data: { project: updated, field, path, artImageId },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
""")

# ---------------------------------------------------------------------------
# Regression contract: terminal entries may be re-enqueued; active entries may
# not duplicate.
# ---------------------------------------------------------------------------
test_path = root / "utils/scripts/verifyArtRequestYaml.ts"
test_text = test_path.read_text()
test_text = replace_once(
    test_text,
    """  check(
    'appendRequest is idempotent by image_path',
    appendRequest(once, sampleEntry({ id: 'different-id-99999999' })) === once,
  )
}
""",
    """  check(
    'appendRequest is idempotent by active image_path',
    appendRequest(once, sampleEntry({ id: 'different-id-99999999' })) === once,
  )

  const completed = once.replace('status: \"pending\"', 'status: \"done\"')
  const retried = appendRequest(
    completed,
    sampleEntry({ id: 'retry-id-99999999' }),
  )
  check('completed image_path can be queued again', retried !== completed)
  check('retry receives its own request block', retried.includes('retry-id-99999999'))
}
""",
    "terminal request retry regression",
)
test_path.write_text(test_text)

print('Applied project gallery and art completion pipeline patch.')
