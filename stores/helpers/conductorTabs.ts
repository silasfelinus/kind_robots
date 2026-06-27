// /stores/helpers/conductorTabs.ts

export const CONDUCTOR_DASHBOARD_KEY = 'conductor'
export const CONDUCTOR_DEFAULT_TAB = 'conductor'

export const conductorTabs = [
  {
    key: 'conductor',
    label: 'Conductor',
    icon: 'kind-icon:gearhammer',
    title: 'Conductor Workspace',
    summary: 'Steer agents, review roadmap state, and handle human gates.',
    image: '/images/dashboard-tabs/conductor/conductor.webp',
  },
  {
    key: 'portos',
    label: 'Portos',
    icon: 'kind-icon:server',
    title: 'Portos Servers',
    summary: 'Add a Porto server address and save the user/server pairing cleanly.',
    image: '/images/dashboard-tabs/conductor/portos.webp',
  },
] as const

export type ConductorTabKey = (typeof conductorTabs)[number]['key']

export function isConductorTabKey(value: string): value is ConductorTabKey {
  return conductorTabs.some((tab) => tab.key === value)
}

export function resolveConductorTab(value?: string | null): ConductorTabKey {
  const normalized = (value ?? '').trim()

  if (isConductorTabKey(normalized)) {
    return normalized
  }

  return CONDUCTOR_DEFAULT_TAB
}
