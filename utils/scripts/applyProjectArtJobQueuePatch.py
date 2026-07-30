from pathlib import Path


def read(path: str) -> str:
    return Path(path).read_text(encoding='utf-8')


def write(path: str, content: str) -> None:
    Path(path).write_text(content, encoding='utf-8')


def replace_once(source: str, old: str, new: str, label: str) -> str:
    if old not in source:
        if new in source:
            return source
        raise RuntimeError(f'Missing patch anchor: {label}')
    return source.replace(old, new, 1)


entity_path = 'server/utils/entityArt.ts'
entity = read(entity_path)
entity = replace_once(
    entity,
    "export type EntityArtType =\n  | 'bot'\n  | 'character'\n  | 'scenario'\n  | 'reward'\n  | 'facet'\n",
    "export type EntityArtType =\n  | 'bot'\n  | 'character'\n  | 'scenario'\n  | 'reward'\n  | 'facet'\n  | 'project'\n",
    'EntityArtType project member',
)
entity = replace_once(
    entity,
    "  },\n}\n\nconst IMAGE_API_PATTERN",
    "  },\n  project: {\n    imagePath: {\n      label: 'Icon',\n      width: 256,\n      height: 256,\n      primary: true,\n    },\n    cardPath: {\n      label: 'Card',\n      width: 512,\n      height: 768,\n      primary: false,\n    },\n    heroPath: {\n      label: 'Hero',\n      width: 1280,\n      height: 720,\n      primary: false,\n    },\n  },\n}\n\nconst IMAGE_API_PATTERN",
    'Project field configuration',
)
entity = replace_once(
    entity,
    "    type === 'reward' ||\n    type === 'facet'\n",
    "    type === 'reward' ||\n    type === 'facet' ||\n    type === 'project'\n",
    'Project entity normalization',
)
entity = replace_once(
    entity,
    "    message: 'Choose Bot, Character, Scenario, Reward, or Facet.',",
    "    message: 'Choose Bot, Character, Scenario, Reward, Facet, or Project.',",
    'Project entity validation message',
)
entity = replace_once(
    entity,
    "    case 'facet':\n      return (await db.facet.findUnique({ where: { id: entityId } })) as\n        | EntityArtRecord\n        | null\n  }\n}",
    "    case 'facet':\n      return (await db.facet.findUnique({ where: { id: entityId } })) as\n        | EntityArtRecord\n        | null\n    case 'project':\n      return (await db.project.findUnique({ where: { id: entityId } })) as\n        | EntityArtRecord\n        | null\n  }\n}",
    'Project record resolver',
)
entity = replace_once(
    entity,
    "  return db.artImage.create({",
    "  const history = await db.artImage.create({",
    'History row creation assignment',
)
entity = replace_once(
    entity,
    "    },\n  })\n}\n\nexport async function archiveCurrentEntityArt",
    "    },\n  })\n\n  if (input.entityType === 'project') {\n    await db.projectArtImage.upsert({\n      where: {\n        projectId_artImageId: {\n          projectId: input.entityId,\n          artImageId: history.id,\n        },\n      },\n      create: { projectId: input.entityId, artImageId: history.id },\n      update: {},\n    })\n  }\n\n  return history\n}\n\nexport async function archiveCurrentEntityArt",
    'Project history relation',
)
entity = replace_once(
    entity,
    "  if (!referencePath) return null\n\n  return createHistoryReference(db, {",
    "  if (!referencePath) return null\n\n  if (input.entityType === 'project' && sourceArtImageId) {\n    await db.projectArtImage.upsert({\n      where: {\n        projectId_artImageId: {\n          projectId: input.entityId,\n          artImageId: sourceArtImageId,\n        },\n      },\n      create: { projectId: input.entityId, artImageId: sourceArtImageId },\n      update: {},\n    })\n    return db.artImage.findUnique({ where: { id: sourceArtImageId } })\n  }\n\n  return createHistoryReference(db, {",
    'Reuse Project ArtImage history relation',
)
entity = replace_once(
    entity,
    "    case 'facet': {",
    "    case 'project': {\n      const data =\n        input.field === 'cardPath'\n          ? { cardPath: input.imagePath }\n          : input.field === 'heroPath'\n            ? { heroPath: input.imagePath }\n            : { imagePath: input.imagePath, artImageId: input.artImageId }\n      const project = await db.project.update({\n        where: { id: input.entityId },\n        data,\n      })\n      await db.projectArtImage.upsert({\n        where: {\n          projectId_artImageId: {\n            projectId: input.entityId,\n            artImageId: input.artImageId,\n          },\n        },\n        create: { projectId: input.entityId, artImageId: input.artImageId },\n        update: {},\n      })\n      return project as EntityArtRecord\n    }\n    case 'facet': {",
    'Project entity update',
)
entity = replace_once(
    entity,
    "  let archivedId: number | null = null\n  if (input.preserveOriginal) {",
    "  const previousArtImageId = currentArtImageId(\n    target.record,\n    target.field,\n    target.config.primary,\n  )\n  if (\n    target.entityType === 'project' &&\n    !input.preserveOriginal &&\n    previousArtImageId &&\n    previousArtImageId !== artImage.id\n  ) {\n    await db.projectArtImage.deleteMany({\n      where: {\n        projectId: target.entityId,\n        artImageId: previousArtImageId,\n      },\n    })\n  }\n\n  let archivedId: number | null = null\n  if (input.preserveOriginal) {",
    'Project previous relation cleanup',
)
entity = replace_once(
    entity,
    "    facet: [\n      ['Title', record.title],\n      ['Kind', record.kind],\n      ['Description', record.description],\n      ['Flavor text', record.flavorText],\n      ['Examples', record.examples],\n      ['Existing art prompt', record.artPrompt],\n    ],",
    "    facet: [\n      ['Title', record.title],\n      ['Kind', record.kind],\n      ['Description', record.description],\n      ['Flavor text', record.flavorText],\n      ['Examples', record.examples],\n      ['Existing art prompt', record.artPrompt],\n    ],\n    project: [\n      ['Title', record.title],\n      ['Description', record.description],\n      ['Pitch', record.pitch],\n      ['Goal', record.goal],\n      ['Flavor text', record.flavorText],\n      ['Status', record.status],\n      ['Priority', record.priority],\n    ],",
    'Project prompt context',
)
write(entity_path, entity)

component_path = 'components/pages/conductor-art-gallery.vue'
component = read(component_path)
component = replace_once(
    component,
    "type GenerationEngine = 'krea2' | 'openai' | 'flux' | 'comfy'",
    "type GenerationEngine = 'krea2' | 'flux' | 'comfy'",
    'Project queue engine type',
)
component = replace_once(
    component,
    "type ArtQueueResult = {\n  created?: boolean\n  forced?: boolean\n  branch?: string\n  entry?: { id?: string; image_path?: string; engine?: string }\n}",
    "type ArtQueueResult = {\n  jobId: number\n  status: string\n}",
    'Project ArtJob response type',
)
component = replace_once(
    component,
    "  { label: string; variant: ProjectArtVariant; size: string }",
    "  {\n    label: string\n    variant: ProjectArtVariant\n    size: string\n    width: number\n    height: number\n  }",
    'Project field metadata type',
)
component = replace_once(
    component,
    "  imagePath: { label: 'Icon', variant: 'icon', size: '256×256' },\n  cardPath: { label: 'Card', variant: 'card', size: '512×768' },\n  heroPath: { label: 'Hero', variant: 'hero', size: '1280×720' },",
    "  imagePath: {\n    label: 'Icon',\n    variant: 'icon',\n    size: '256×256',\n    width: 256,\n    height: 256,\n  },\n  cardPath: {\n    label: 'Card',\n    variant: 'card',\n    size: '512×768',\n    width: 512,\n    height: 768,\n  },\n  heroPath: {\n    label: 'Hero',\n    variant: 'hero',\n    size: '1280×720',\n    width: 1280,\n    height: 720,\n  },",
    'Project field dimensions',
)
component = replace_once(
    component,
    "            Describe the image you want. It will be queued as a forced Project\n            replacement, using Krea 2 by default.",
    "            Describe the image you want. It will be queued as an ArtJob and\n            attached to this Project automatically, using Krea 2 by default.",
    'Project queue explanation',
)
component = replace_once(
    component,
    "            <option value=\"openai\">OpenAI Images</option>\n",
    "",
    'Remove unsupported synchronous engine',
)
component = replace_once(
    component,
    "const generationError = ref(false)\n",
    "const generationError = ref(false)\nlet activeJobId: number | null = null\nlet pollTimer: ReturnType<typeof setTimeout> | null = null\nlet stopped = false\n",
    'Project ArtJob polling state',
)
start = component.find('async function submitGeneration() {')
end = component.find('\nasync function submitReplacement()', start)
if start < 0 or end < 0:
    raise RuntimeError('Missing Project submitGeneration function anchors')
new_generation = '''async function submitGeneration() {
  const projectId = resolvedProjectId.value
  const prompt = generationPrompt.value.trim()
  if (!projectId || prompt.length < 3 || generating.value) return

  generating.value = true
  generationMessage.value = ''
  generationError.value = false

  try {
    const project = resolvedProject.value
    const queueResponse = await performFetch<ArtQueueResult>(
      '/api/art/enqueue',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engine: generationEngine.value,
          promptString: prompt,
          width: generationMeta.value.width,
          height: generationMeta.value.height,
          projectSlug: props.slug,
          isPublic: project?.isPublic ?? true,
          isMature: project?.isMature ?? false,
          designer:
            project?.designer || userStore.user?.username || 'Kind Robots',
          entityArt: {
            entityType: 'project',
            entityId: projectId,
            field: generationField.value,
            preserveOriginal: generationPreserveOriginal.value,
            mode: 'recreate',
          },
        }),
      },
      1,
      30_000,
    )
    const jobId = Number(queueResponse.data?.jobId)
    if (!queueResponse.success || !Number.isInteger(jobId) || jobId <= 0) {
      throw new Error(
        queueResponse.message || 'Project art generation was not queued.',
      )
    }

    activeJobId = jobId
    generationMessage.value = `${generationMeta.value.label} queued as ArtJob ${jobId}. It will replace the Project asset when generation finishes.`
    generationPrompt.value = ''
    startPolling(jobId)
  } catch (error) {
    generationError.value = true
    generationMessage.value =
      error instanceof Error ? error.message : 'Project art generation failed to queue.'
  } finally {
    generating.value = false
  }
}

function startPolling(jobId: number) {
  if (pollTimer) clearTimeout(pollTimer)
  const poll = async () => {
    if (stopped || activeJobId !== jobId) return
    try {
      const response = await performFetch<{
        job: {
          id: number
          status: string
          error?: string | null
        }
      }>(`/api/art/queue/${jobId}`, { cache: 'no-store' })
      if (!response.success) {
        throw new Error(response.message || 'Queue check failed.')
      }
      const status = String(response.data?.job?.status || '')
      if (status === 'DONE') {
        const projectId = resolvedProjectId.value
        await Promise.all([
          projectId ? projectStore.fetchProject(projectId) : Promise.resolve(),
          fetchProjectArt(true),
        ])
        generationMessage.value = `ArtJob ${jobId} finished and the ${generationMeta.value.label.toLowerCase()} was replaced.`
        generationError.value = false
        activeJobId = null
        pollTimer = null
        return
      }
      if (status === 'FAILED' || status === 'CANCELLED') {
        generationMessage.value =
          response.data?.job?.error || `ArtJob ${jobId} ended as ${status}.`
        generationError.value = true
        activeJobId = null
        pollTimer = null
        return
      }
      generationMessage.value = `ArtJob ${jobId}: ${status || 'PENDING'}. It will attach automatically when complete.`
    } catch {
      // Completion is durable on the server; transient polling failures should
      // not turn a valid queued job into a visible failure.
    }
    pollTimer = setTimeout(poll, 5000)
  }
  void poll()
}
'''
component = component[:start] + new_generation + component[end:]
component = replace_once(
    component,
    "    generationEngine.value = 'krea2'\n    void fetchProjectArt(true)",
    "    generationEngine.value = 'krea2'\n    activeJobId = null\n    if (pollTimer) {\n      clearTimeout(pollTimer)\n      pollTimer = null\n    }\n    void fetchProjectArt(true)",
    'Reset Project ArtJob polling on navigation',
)
component = replace_once(
    component,
    "onBeforeUnmount(() => {\n  if (advanceTimer) clearInterval(advanceTimer)\n})",
    "onBeforeUnmount(() => {\n  stopped = true\n  if (advanceTimer) clearInterval(advanceTimer)\n  if (pollTimer) clearTimeout(pollTimer)\n})",
    'Stop Project ArtJob polling on unmount',
)
write(component_path, component)

verify_path = 'utils/scripts/verifyEntityArtManager.ts'
verify = read(verify_path)
verify = replace_once(
    verify,
    "  'bot' | 'character' | 'scenario' | 'reward' | 'facet' | 'artImage'",
    "  | 'bot'\n  | 'character'\n  | 'scenario'\n  | 'reward'\n  | 'facet'\n  | 'project'\n  | 'projectArtImage'\n  | 'artImage'",
    'Entity art verifier Prisma delegates',
)
verify = replace_once(
    verify,
    "  \"| 'facet'\",\n  'buildEntityArtPrompt',",
    "  \"| 'facet'\",\n  \"| 'project'\",\n  \"case 'project'\",\n  'projectArtImage.upsert',\n  'buildEntityArtPrompt',",
    'Entity art verifier Project service coverage',
)
insert_anchor = "expectContains('server/api/art/enqueue.post.ts', ["
project_contract = """expectContains('components/pages/conductor-art-gallery.vue', [
  \"'/api/art/enqueue'\",
  \"entityType: 'project'\",
  'Queued as ArtJob',
  'startPolling(jobId)',
])

const projectGallerySource = read('components/pages/conductor-art-gallery.vue')
for (const obsolete of [
  \"'/api/conductor/art-request'\",
  '/art/prepare-generation',
]) {
  if (projectGallerySource.includes(obsolete)) {
    throw new Error(`Project gallery still uses obsolete queue path: ${obsolete}`)
  }
}

"""
if project_contract not in verify:
    if insert_anchor not in verify:
        raise RuntimeError('Missing verifier insertion anchor')
    verify = verify.replace(insert_anchor, project_contract + insert_anchor, 1)
write(verify_path, verify)

print('Project ArtJob queue patch applied.')
