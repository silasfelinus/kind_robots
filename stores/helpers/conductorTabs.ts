// /stores/helpers/conductorTabs.ts

import type { DashboardConfig, DashboardTabConfig } from '@/stores/helpers/dashboardHelper'

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
    flourish: '⚙',
    tagline: 'Steer agents, review work, and keep the human in the loop.',
    narrative:
      'Review Conductor project progress, pitches awaiting your vote, task gates, roadmap state, and the agent-loop items that need a human checkpoint.',
    route: '/conductor',
    requiredRole: 'ADMIN',
  },
  {
    key: 'wishmaster',
    label: 'Wishmaster',
    icon: 'kind-icon:wand',
    title: 'Wishmaster Wishes',
    summary: 'Treat one-shot Todo requests as wishes without pretending each one is a full project.',
    image: '/images/dashboard-tabs/conductor/conductor.webp',
    flourish: '✦',
    tagline: 'A wish is the single-shot request; a project is the infrastructure machine.',
    narrative:
      'Wishmaster turns lightweight requests into agent-ready wishes: scoped, prioritized, tracked until done, and only promoted into project infrastructure when the request actually needs a larger system.',
    route: '/conductor',
    requiredRole: 'ADMIN',
  },
  {
    key: 'portos',
    label: 'Portos',
    icon: 'kind-icon:server',
    title: 'Portos Servers',
    summary: 'Add a Porto server address and save the user/server pairing cleanly.',
    image: '/images/dashboard-tabs/conductor/portos.webp',
    flourish: '◌',
    tagline: 'Connect Portos without burying server state in component goo.',
    narrative:
      'Add a Porto server address, validate it, and save the user/server relationship through the proper server-entry flow once that persistence contract is built.',
    route: '/conductor',
    requiredRole: 'ADMIN',
  },
] as const satisfies readonly DashboardTabConfig[]

export type ConductorTabKey = (typeof conductorTabs)[number]['key']
export type ConductorDashboardKey = typeof CONDUCTOR_DASHBOARD_KEY

export const conductorDashboardConfig: DashboardConfig = {
  key: CONDUCTOR_DASHBOARD_KEY,
  label: 'Conductor',
  defaultTab: CONDUCTOR_DEFAULT_TAB,
  tabs: [...conductorTabs],
}

export function isConductorDashboardKey(
  value: string,
): value is ConductorDashboardKey {
  return value === CONDUCTOR_DASHBOARD_KEY
}

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
