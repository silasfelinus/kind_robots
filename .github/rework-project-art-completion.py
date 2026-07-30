from pathlib import Path
import subprocess

FILES_TO_RESET = [
    'components/pages/conductor-page.vue',
    'components/pages/conductor-project-gallery-page.vue',
    'stores/projectStore.ts',
    'utils/scripts/verifyEntityArtManager.ts',
]

subprocess.run(['git', 'checkout', 'origin/main', '--', *FILES_TO_RESET], check=True)


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


# Completion is durable server work. A job that declares entityArt must never be
# marked DONE if its attachment metadata is malformed or silently skipped.
completion_path = 'server/api/art/queue/[id]/complete.post.ts'
completion = read(completion_path)
completion = replace_once(
    completion,
    "import { applyEntityArtCompletion } from '../../../../utils/entityArt'",
    "import {\n  applyEntityArtCompletion,\n  readEntityArtMetadata,\n} from '../../../../utils/entityArt'",
    'entity art imports',
)
completion = replace_once(
    completion,
    """    if (job.status !== 'RUNNING') {
      throw createError({
        statusCode: 409,
        message: `Job ${id} is ${job.status}, not RUNNING — nothing to complete.`,
      })
    }

    let updated
""",
    """    if (job.status !== 'RUNNING') {
      throw createError({
        statusCode: 409,
        message: `Job ${id} is ${job.status}, not RUNNING — nothing to complete.`,
      })
    }

    const parsedJobPayload = parseArtJobPayload(job.payload)
    const declaredEntityArt = asRecord(parsedJobPayload.entityArt)
    const expectsEntityArtCompletion = Object.keys(declaredEntityArt).length > 0
    if (expectsEntityArtCompletion && !readEntityArtMetadata(parsedJobPayload)) {
      throw createError({
        statusCode: 409,
        message:
          'ArtJob declares entity artwork, but its entityArt metadata is invalid. Completion refused before marking the job DONE.',
      })
    }

    let updated
""",
    'declared entity art validation',
)
completion = replace_once(
    completion,
    """          const entityArt = await applyEntityArtCompletion(
            tx,
            tracedPayload,
            targetArtImageId,
            archived.id,
          )

          const completed = await tx.artJob.update({
""",
    """          const entityArt = await applyEntityArtCompletion(
            tx,
            tracedPayload,
            targetArtImageId,
            archived.id,
          )
          if (expectsEntityArtCompletion && !entityArt) {
            throw createError({
              statusCode: 409,
              message:
                'Entity artwork attachment was not applied. Completion rolled back instead of marking the job DONE.',
            })
          }

          const completed = await tx.artJob.update({
""",
    'overwrite entity attachment assertion',
)
completion = replace_once(
    completion,
    """          const entityArt = await applyEntityArtCompletion(
            tx,
            tracedPayload,
            uploadedArtImageId,
          )

          const completed = await tx.artJob.update({
""",
    """          const entityArt = await applyEntityArtCompletion(
            tx,
            tracedPayload,
            uploadedArtImageId,
          )
          if (expectsEntityArtCompletion && !entityArt) {
            throw createError({
              statusCode: 409,
              message:
                'Entity artwork attachment was not applied. Completion rolled back instead of marking the job DONE.',
            })
          }

          const completed = await tx.artJob.update({
""",
    'normal entity attachment assertion',
)
write(completion_path, completion)

# Project views must re-read canonical server state when opened. This makes a
# finished relay job visible after navigation, tab close, or browser restart;
# no page needs to remain alive while generation runs.
page_path = 'components/pages/conductor-page.vue'
page = read(page_path)
page = replace_once(
    page,
    "const work: Promise<unknown>[] = [projectStore.fetchProjects(projectOptions)]",
    "const work: Promise<unknown>[] = [\n    projectStore.fetchProjects(projectOptions, true),\n  ]",
    'workspace forced Project refresh',
)
write(page_path, page)

gallery_path = 'components/pages/conductor-project-gallery-page.vue'
gallery = read(gallery_path)
gallery = replace_once(
    gallery,
    "await load(false) })",
    "await load(true) })",
    'gallery forced Project refresh',
)
write(gallery_path, gallery)

contract_path = 'utils/scripts/verifyEntityArtManager.ts'
contract = read(contract_path)
contract = replace_once(
    contract,
    """expectContains('server/api/art/queue/[id]/complete.post.ts', [
  'applyEntityArtCompletion',
  'completedEntityArt',
])
""",
    """expectContains('server/api/art/queue/[id]/complete.post.ts', [
  'applyEntityArtCompletion',
  'readEntityArtMetadata',
  'expectsEntityArtCompletion',
  'Completion rolled back instead of marking the job DONE',
  'completedEntityArt',
])

expectContains('components/pages/conductor-page.vue', [
  'projectStore.fetchProjects(projectOptions, true)',
])

expectContains('components/pages/conductor-project-gallery-page.vue', [
  'await load(true)',
])
""",
    'durable completion contract',
)
write(contract_path, contract)

for temporary in [
    '.github/rework-project-art-completion.py',
    '.github/workflows/rework-project-art-completion.yml',
]:
    Path(temporary).unlink(missing_ok=True)
