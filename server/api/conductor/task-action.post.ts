import { randomUUID } from 'node:crypto'
import { stringify as stringifyYaml } from 'yaml'
import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { conductorGet, conductorPut } from '@/server/utils/conductor-github'
import { parseRoadmapYaml } from '@/server/utils/conductorRoadmap'

const PROJECT_RE = /^[a-z0-9][a-z0-9-]*$/
const TASK_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/
const ACTIONS = new Set(['approve', 'reject', 'comment', 'answer'] as const)
type TaskAction = 'approve' | 'reject' | 'comment' | 'answer'

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
      statusMessage: 'action must be approve, reject, comment, or answer',
    })
  }
  if (action !== 'approve' && !message) {
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
  } else if (action === 'answer') {
    /*
     * THE MISSING LINK IN THE GATE PIPELINE. Silas, 2026-08-29: "if I click on
     * one of the human gate notifications, it lets me enter a comment and that
     * comment is fed to the next agent dealing with that problem ... we might
     * be missing whatever ties the response to the project referenced. follow
     * it end to end."
     *
     * Following it end to end found the break, and it is here rather than in
     * the front end. `comment` writes the note and leaves the task at
     * `needs-human`. Conductor's worker only ever selects `status: ready`
     * (scripts/select_role.py -> run_worker.find_ready_task), so a commented
     * gate is never picked up by anything: the answer lands in a YAML field
     * and waits for a human to happen to read it. Answering a question and
     * having nothing happen is the bug he could feel from the outside.
     *
     * `answer` is the action that was missing: the same note, plus the release
     * back to `ready` that actually hands it to the next agent. It is NOT
     * `reject` -- that sets approved_by_human: false, which is a verdict on the
     * work, and stamps the note "SENT BACK". An answer is neither. This leaves
     * approved_by_human untouched and says what it is.
     */
    eventPayload.operation = 'ready'
    eventPayload.note = `HUMAN ANSWER from ${actor} via Kind Robots. Gate released for the next agent. ${message}`
  } else {
    /*
     * `comment` deliberately still parks. It is for adding context to a gate
     * that should STAY gated. Conductor's audit_human_gates.py flags a gate
     * whose newest note is one of these so the next session surfaces it rather
     * than letting it sit unread -- which is the other half of the fix above.
     */
    eventPayload.operation = 'needs-human'
    eventPayload.soft_gate = task.softGate
    eventPayload.note = `HUMAN NOTE from ${actor} via Kind Robots. Still gated. ${message}`
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
