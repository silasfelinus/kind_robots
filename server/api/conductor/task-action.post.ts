import { randomUUID } from 'node:crypto'
import { stringify as stringifyYaml } from 'yaml'
import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { conductorGet, conductorPut } from '@/server/utils/conductor-github'
import { parseRoadmapYaml } from '@/server/utils/conductorRoadmap'
import {
  CONDUCTOR_TASK_ACTIONS,
  buildConductorTaskEvent,
  taskActionRequiresMessage,
  type ConductorTaskAction,
} from '@/utils/conductorTaskActions'

const PROJECT_RE = /^[a-z0-9][a-z0-9-]*$/
const TASK_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/
const ACTIONS = new Set<string>(CONDUCTOR_TASK_ACTIONS)

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
  const action = body.action?.trim() as ConductorTaskAction
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
      statusMessage:
        'action must be approve, proceed, reject, comment, or answer',
    })
  }
  if (taskActionRequiresMessage(action) && !message) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'message is required unless accepting the task as complete',
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

  Object.assign(
    eventPayload,
    buildConductorTaskEvent(action, actor, message, task.softGate),
  )

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
