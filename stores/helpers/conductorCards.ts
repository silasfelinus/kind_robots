// /stores/helpers/conductorCards.ts
import type { BuilderCard } from './builderCards'

export type ConductorProjectKind = 'software' | 'content' | 'proposal'
export type ConductorTaskStatus =
  | 'ready'
  | 'claimed'
  | 'review'
  | 'done'
  | 'blocked'
  | 'needs-human'
  | 'waiting'

export type ConductorCard = Omit<BuilderCard, 'steps' | 'restoresFields'> & {
  projectKind: ConductorProjectKind
  taskStatus: ConductorTaskStatus
  priority: number
  description: string
  steps: []
  restoresFields: []
}

export const STATUS_LABEL: Record<ConductorTaskStatus, string> = {
  ready: 'Ready',
  claimed: 'In Progress',
  review: 'In Review',
  done: 'Done',
  blocked: 'Blocked',
  'needs-human': 'Needs You',
  waiting: 'Waiting',
}

export const STATUS_CLASS: Record<ConductorTaskStatus, string> = {
  ready: 'badge-info',
  claimed: 'badge-warning',
  review: 'badge-secondary',
  done: 'badge-success',
  blocked: 'badge-error',
  'needs-human': 'badge-primary',
  waiting: 'badge-ghost',
}

export const KIND_LABEL: Record<ConductorProjectKind, string> = {
  software: 'Software',
  content: 'Content',
  proposal: 'Proposal',
}

export const CONDUCTOR_CARDS: ConductorCard[] = [
  {
    key: 'humboldt-scoop',
    label: 'Humboldt Scoop',
    title: 'Humboldt Scoop',
    icon: 'kind-icon:globe',
    tagline: 'Import and modernize the site',
    deckImage: '/images/nav/thumbs/sanctuary.webp',
    heroImage: '/images/nav/heroes/sanctuary.webp',
    projectKind: 'software',
    taskStatus: 'ready',
    priority: 1,
    narrative:
      'Importing the existing site and getting it building cleanly, then refreshing content without redesigning.',
    description:
      'Importing the existing site and getting it building cleanly, then refreshing content without redesigning.',
    steps: [],
    restoresFields: [],
  },
  {
    key: 'humboldt-poop-scoop-cms',
    label: 'Poop Scoop CMS',
    title: 'Customer Management',
    icon: 'kind-icon:toolbox',
    tagline: 'Simple self-hostable CMS',
    deckImage: '/images/nav/thumbs/builder.webp',
    heroImage: '/images/nav/heroes/builder.webp',
    projectKind: 'software',
    taskStatus: 'ready',
    priority: 2,
    narrative:
      'Building the customer-management tool for the poop-scoop business. Simple and self-hostable with dummy data only until approved.',
    description:
      'Building the customer-management tool for the poop-scoop business. Simple and self-hostable with dummy data only until approved.',
    steps: [],
    restoresFields: [],
  },
  {
    key: 'brainstorm',
    label: 'Brainstorm',
    title: 'Brainstorm',
    icon: 'kind-icon:brain',
    tagline: 'Recurring pitch generation',
    deckImage: '/images/nav/thumbs/brainstorm.webp',
    heroImage: '/images/nav/heroes/brainstorm.webp',
    projectKind: 'proposal',
    taskStatus: 'ready',
    priority: 3,
    narrative:
      'Generating and cycling pitches for new projects and directions. Recurring task that never reaches done.',
    description:
      'Generating and cycling pitches for new projects and directions. Recurring task that never reaches done.',
    steps: [],
    restoresFields: [],
  },
  {
    key: 'approval-portal',
    label: 'Approval Portal',
    title: "Silas's Console",
    icon: 'kind-icon:portal',
    tagline: 'Dashboard for steering everything',
    deckImage: '/images/nav/thumbs/home.webp',
    heroImage: '/images/nav/heroes/home.webp',
    projectKind: 'software',
    taskStatus: 'ready',
    priority: 4,
    narrative:
      'The console Silas lives in: review projects, pick from pitches, validate upgrades, confirm updates, and roll back when needed.',
    description:
      'The console Silas lives in: review projects, pick from pitches, validate upgrades, confirm updates, and roll back when needed.',
    steps: [],
    restoresFields: [],
  },
  {
    key: 'digital-storefront',
    label: 'Digital Storefront',
    title: 'Online Store',
    icon: 'kind-icon:cart',
    tagline: 'Content pipeline for digital goods',
    deckImage: '/images/nav/thumbs/giftshop.webp',
    heroImage: '/images/nav/heroes/giftshop.webp',
    projectKind: 'content',
    taskStatus: 'waiting',
    priority: 4,
    narrative:
      'Research stores, brainstorm content, create drafts, market, and advertise — every outward step is gated.',
    description:
      'Research stores, brainstorm content, create drafts, market, and advertise — every outward step is gated.',
    steps: [],
    restoresFields: [],
  },
  {
    key: 'kind-robots',
    label: 'Kind Robots',
    title: 'Kind Robots App',
    icon: 'kind-icon:robot-color',
    tagline: 'AI playground for humans and robots',
    deckImage: '/images/nav/thumbs/bot.webp',
    heroImage: '/images/nav/heroes/bot.webp',
    projectKind: 'software',
    taskStatus: 'ready',
    priority: 5,
    narrative:
      'Consuming the shared backend to build app-owned logic. This very app — full roadmap coming soon.',
    description:
      'Consuming the shared backend to build app-owned logic. This very app — full roadmap coming soon.',
    steps: [],
    restoresFields: [],
  },
]
