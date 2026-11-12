import type { ConductorTask } from './conductorRoadmap'

/**
 * Mirror Conductor's playtest readiness contract. An authored game cannot be
 * promoted while finite agent-owned work remains or before its subjective
 * acceptance task is actually awaiting the human. Recurring polish can continue.
 */
export function playtestReadinessErrors(tasks: ConductorTask[]): string[] {
  if (!tasks.length) return ['The Conductor roadmap has no tasks.']

  const unfinished = tasks
    .filter(
      (task) =>
        !task.recurring &&
        !task.gateHuman &&
        !['done', 'cancelled'].includes(task.status),
    )
    .map((task) => task.id)

  const errors: string[] = []
  if (unfinished.length) {
    errors.push(`Finish agent-owned roadmap tasks: ${unfinished.slice(0, 12).join(', ')}.`)
  }
  const finalGate = tasks.some(
    (task) =>
      task.gateHuman &&
      ['subjective-acceptance', 'creative-approval'].includes(
        task.gateReason || '',
      ) &&
      task.status === 'needs-human' &&
      !task.approvedByHuman,
  )
  if (!finalGate) {
    errors.push('The final human playtest gate must be needs-human and unapproved.')
  }
  return errors
}
