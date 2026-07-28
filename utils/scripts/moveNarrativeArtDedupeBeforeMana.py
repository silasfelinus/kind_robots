from pathlib import Path


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one match in {path}, found {count}: {old[:120]!r}")
    path.write_text(text.replace(old, new, 1))


path = Path("server/api/art/enqueue.post.ts")

replace_once(
    path,
    """import { authAndGate } from '../../utils/comfyGate'
""",
    """import { authAndGate } from '../../utils/comfyGate'
import { requireMachineUser } from '../../utils/authGuard'
""",
)

replace_once(
    path,
    """    const narrativeContext = narrativeRequest(body)

    const videoFrames = VIDEO_ENGINES.has(engine)
""",
    """    const narrativeContext = narrativeRequest(body)

    if (narrativeContext) {
      const { user } = await requireMachineUser(event)
      const existingJob = await prisma.artJob.findFirst({
        where: {
          userId: user.id,
          projectSlug,
          status: { notIn: ['FAILED', 'CANCELLED'] },
          payload: {
            contains: `\"dedupeKey\":\"${narrativeContext.dedupeKey}\"`,
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (existingJob) {
        event.node.res.statusCode = 200
        return {
          success: true,
          message: 'Existing narrative art job reused.',
          statusCode: 200,
          data: {
            jobId: existingJob.id,
            status: existingJob.status,
            deduplicated: true,
            mana: { charged: 0 },
          },
        }
      }
    }

    const videoFrames = VIDEO_ENGINES.has(engine)
""",
)

replace_once(
    path,
    """    if (narrativeContext) {
      const existingJob = await prisma.artJob.findFirst({
        where: {
          userId: gate.user.id,
          projectSlug,
          status: { notIn: ['FAILED', 'CANCELLED'] },
          payload: {
            contains: `\"dedupeKey\":\"${narrativeContext.dedupeKey}\"`,
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (existingJob) {
        event.node.res.statusCode = 200
        return {
          success: true,
          message: 'Existing narrative art job reused.',
          statusCode: 200,
          data: {
            jobId: existingJob.id,
            status: existingJob.status,
            deduplicated: true,
            mana: { charged: 0 },
          },
        }
      }
    }

""",
    """,
)

print("Moved narrative art dedupe before mana gate")
