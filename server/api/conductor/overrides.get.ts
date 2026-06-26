import { conductorGet } from '~/server/utils/conductor-github'

export interface OverrideEntry {
  status: string
  priority: string
  kind?: string
}

type OverrideMap = Record<string, OverrideEntry>

export default defineEventHandler(async (): Promise<OverrideMap> => {
  const file = await conductorGet('project-overrides.yaml')
  if (!file) return {}

  const overrides: OverrideMap = {}
  const entries = file.content.split(/\n  - slug: /).slice(1)
  for (const entry of entries) {
    const slug = entry.split('\n')[0]?.trim()
    if (!slug) continue
    const statusMatch = entry.match(/\n    status: (\S+)/)
    const priorityMatch = entry.match(/\n    priority: (\S+)/)
    const kindMatch = entry.match(/\n    kind: (\S+)/)
    overrides[slug] = {
      status: statusMatch?.[1] ?? 'active',
      priority: priorityMatch?.[1] ?? 'normal',
      ...(kindMatch?.[1] ? { kind: kindMatch[1] } : {}),
    }
  }
  return overrides
})
