import type { PlaybookKitSpec } from '../types'
import { LANTERN_FERRY } from './lanternFerry'
// playbook:new imports

// Every playbook built on the kit. `npm run playbook:new` adds new ones at the
// markers; the kit's test audits every entry against its complexity budget.

export const KIT_PLAYBOOKS: PlaybookKitSpec[] = [
  LANTERN_FERRY,
  // playbook:new entries
]

export function kitPlaybook(id: string): PlaybookKitSpec | undefined {
  return KIT_PLAYBOOKS.find((spec) => spec.id === id)
}
