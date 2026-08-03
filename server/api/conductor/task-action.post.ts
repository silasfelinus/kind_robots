import { randomUUID } from 'node:crypto'
import { stringify as stringifyYaml } from 'yaml'
import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { conductorGet, conductorPut } from '@/server/utils/conductor-github'
import { parseRoadmapYaml } from '@/server/utils/conductorRoadmap'

const PROJECT_RE = /^[a-z0-9][a-z0-9-]*$/
const TASK_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/
const ACTIONS = new Set(['approve', 'reject', 'comment'] as const)
type TaskAction = 'approve' | 'reject' | 'comment'

type TaskActionBody = {
  projectSlug?: string
  taskId?: string
  action?: string
  message?: string
}

export default defineEventHandler(async (event) => {
  const { user } = await requireAdminApiUser(event)
  const body = await readBody<TaskActionBody>(event)
  const projectSlug = body.projectSlug?.trim() ?? ''
  const taskId = body.taskId?.trim() ?? ''
  const action = body.action?.trim() as TaskAction
  const message = body.message?.trim() ?? ''

  if (!PROJECT_RE.test(projectSlug)) {
    throw createError({ statusCode: 400, statusMessage: 'invalid projectSlug' })
  }
  if (!TASK_RE.test(taskId)) {
    throw createError({ statusCode: 400, statusMessage: 'invalid taskId' })
  }
  if (!ACTIONS.has(action)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'action must be approve, reject, or comment',
    })
  }
  if ((action === 'reject' || action === 'comment') && !message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'message is required for reject and comment actions',
    })
  }

  const roadmapPath = `projects/${projectSlug}/roadmap.yaml`
  const roadmap = await conductorGet(roadmapPath)
  if (!roadmap) {
    throw createError({
      statusCode: 404,
      statusMessage: `Conductor project not found: ${projectSlug}`,
    })
  }

  const task = parseRoadmapYaml(roadmap.content).tasks.find(
    (entry) => entry.id === taskId,
  )
  if (!task) {
    throw createError({
      statusCode: 404,
      statusMessage: `Conductor task not found: ${projectSlug}/${taskId}`,
    })
  }
  if (task.status !== 'needs-human') {
    throw createError({
      statusCode: 409,
      statusMessage: `Task is no longer waiting for human attention (status: ${task.status})`,
    })
  }

  const actor = user.username || `user-${user.id}`
  const timestamp = new Date().toISOString()
  const eventPayload: Record<string, unknown> = {
    version: 1,
    project: projectSlug,
    task: taskId,
    updated: timestamp,
  }

  if (action === 'approve') {
    eventPayload.operation = 'done'
    eventPayload.approved_by_human = true
    eventPayload.note = `APPROVED by ${actor} via Kind Robots For You.${message ? ` ${message}` : ''}`
  } else if (action === 'reject') {
    eventPayload.operation = 'ready'
    eventPayload.approved_by_human = false
    eventPayload.note = `SENT BACK by ${actor} via Kind Robots For You. ${message}`
  } else {
    eventPayload.operation = 'needs-human'
    eventPayload.soft_gate = task.softGate
    eventPayload.note = `HUMAN NOTE from ${actor} via Kind Robots For You. ${message}`
  }

  const stamp = timestamp.replace(/[-:.]/g, '')
  const eventPath = `task-events/${stamp}-${projectSlug}-${taskId}-${action}-${randomUUID().slice(0, 8)}.yaml`
  await conductorPut(
    eventPath,
    stringifyYaml(eventPayload, { lineWidth: 100 }),
    `event: ${action} ${projectSlug}/${taskId} from For You`,
  )

  return {
    success: true,
    data: { eventPath, projectSlug, taskId, action, queuedAt: timestamp },
  }
})
