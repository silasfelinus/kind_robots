export const CONDUCTOR_TASK_ACTIONS = [
  'approve',
  'proceed',
  'reject',
  'comment',
  'answer',
] as const

export type ConductorTaskAction = (typeof CONDUCTOR_TASK_ACTIONS)[number]

export function taskActionRequiresMessage(
  action: ConductorTaskAction,
): boolean {
  return action !== 'approve'
}

export function buildConductorTaskEvent(
  action: ConductorTaskAction,
  actor: string,
  message: string,
  softGate: boolean,
): Record<string, unknown> {
  switch (action) {
    case 'approve':
      return {
        operation: 'done',
        approved_by_human: true,
        note: `ACCEPTED COMPLETE by ${actor} via Kind Robots For You.${message ? ` ${message}` : ''}`,
      }
    case 'proceed':
      return {
        operation: 'ready',
        approved_by_human: true,
        note: `APPROVED TO CONTINUE by ${actor} via Kind Robots. Gate released for the next agent. ${message}`,
      }
    case 'reject':
      return {
        operation: 'ready',
        approved_by_human: false,
        note: `SENT BACK by ${actor} via Kind Robots For You. ${message}`,
      }
    case 'answer':
      return {
        operation: 'ready',
        note: `HUMAN ANSWER from ${actor} via Kind Robots. Gate released for the next agent. ${message}`,
      }
    case 'comment':
      return {
        operation: 'needs-human',
        soft_gate: softGate,
        note: `HUMAN NOTE from ${actor} via Kind Robots. Still gated. ${message}`,
      }
  }
}
