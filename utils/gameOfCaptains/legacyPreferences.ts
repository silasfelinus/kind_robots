import type { KitSettings } from '~/utils/playbookKit/settings'

/**
 * Space Couch's pre-Playbook-Kit settings used a separate localStorage key.
 * Import only explicitly enabled preferences on a first Kit save. An existing
 * Kit save always wins, and the legacy record is never deleted or rewritten.
 */
export function legacyCouchSettings(
  raw: unknown,
): Partial<Pick<KitSettings, 'textSize' | 'motion'>> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const value = raw as Record<string, unknown>
  return {
    ...(value.largeText === true ? { textSize: 'large' as const } : {}),
    ...(value.reducedMotion === true ? { motion: 'reduced' as const } : {}),
  }
}
