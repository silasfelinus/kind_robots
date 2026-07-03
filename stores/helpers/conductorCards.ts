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

function card(
  key: string,
  label: string,
  icon: string,
  tagline: string,
  description: string,
  projectKind: ConductorProjectKind,
  taskStatus: ConductorTaskStatus,
  priority: number,
): ConductorCard {
  return {
    key,
    label,
    title: label,
    icon,
    tagline,
    deckImage: `https://raw.githubusercontent.com/silasfelinus/conductor/main/projects/images/${key}-card.webp`,
    heroImage: `https://raw.githubusercontent.com/silasfelinus/conductor/main/projects/images/${key}-hero.webp`,
    projectKind,
    taskStatus,
    priority,
    narrative: description,
    description,
    steps: [],
    restoresFields: [],
  }
}

export const CONDUCTOR_CARDS: ConductorCard[] = [
  card(
    'appmaker',
    'AppMaker',
    'kind-icon:toolbox',
    'The app factory',
    'Create and manage apps on the conductor system: each app gets a workspace folder, a project roadmap, and a Dream sharing one slug — agents build, humans gate releases.',
    'software',
    'ready',
    1,
  ),
  card(
    'challenge-center',
    'Challenge Center',
    'kind-icon:trophy',
    'Agent benchmark arena',
    'Competitive benchmark arena where Conductor and Portos agents produce artifacts, users vote, and leaderboards expose what actually works.',
    'software',
    'ready',
    1,
  ),
  card(
    'humboldt-scoop',
    'Humboldt Scoop',
    'kind-icon:globe',
    'Import and modernize the site',
    'Importing the existing site and getting it building cleanly, then refreshing content without redesigning.',
    'software',
    'ready',
    2,
  ),
  card(
    'humboldt-scoop-cms',
    'Humboldt Scoop CMS',
    'kind-icon:toolbox',
    'Simple self-hostable CMS',
    'Building the customer-management tool for Humboldt Scoop with a simple self-hostable content workflow.',
    'software',
    'ready',
    3,
  ),
  card(
    'approval-portal',
    'Approval Portal',
    'kind-icon:portal',
    'Dashboard for steering everything',
    'The console for reviewing projects, picking from pitches, validating upgrades, confirming updates, and rolling back when needed.',
    'software',
    'waiting',
    4,
  ),
  card(
    'digital-storefront',
    'Digital Storefront',
    'kind-icon:cart',
    'Content pipeline for digital goods',
    'Research stores, brainstorm content, create drafts, market, and advertise with human gates before outward-facing steps.',
    'content',
    'ready',
    5,
  ),
  card(
    'humboldt-impropriety-calendar',
    'Humboldt Impropriety Calendar',
    'kind-icon:calendar',
    'Local weirdness calendar',
    'A content project for collecting and presenting Humboldt-flavored oddities, events, and improprieties.',
    'content',
    'ready',
    6,
  ),
  card(
    'kind-robots',
    'Kind Robots',
    'kind-icon:robot-color',
    'AI playground for humans and robots',
    'The main Kind Robots application: shared backend, project UI, Dream records, and the human/agent cockpit.',
    'software',
    'ready',
    7,
  ),
  card(
    'global-ui',
    'Global UI',
    'kind-icon:palette',
    'Shared interface polish',
    'Cross-project interface cleanup for shared navigation, sheets, cards, display behavior, and dashboard consistency.',
    'software',
    'ready',
    8,
  ),
  card(
    'conductor',
    'Conductor',
    'kind-icon:gearhammer',
    'Agent orchestration hub',
    'The GitHub-based coordination layer for roadmaps, task claims, approvals, worker loops, and handoffs.',
    'software',
    'ready',
    9,
  ),
  card(
    'storymaker',
    'Storymaker',
    'kind-icon:book',
    'Structured story creation',
    'A software surface for drafting, organizing, and expanding story ideas into reusable narrative artifacts.',
    'software',
    'ready',
    10,
  ),
  card(
    'art-generator-connect',
    'Art Generator Connect',
    'kind-icon:image',
    'Conductor to art API wiring',
    'Bridge Conductor project art requests into Kind Robots image generation and asset distribution workflows.',
    'software',
    'ready',
    11,
  ),
  card(
    'alexa-integration',
    'Alexa Integration',
    'kind-icon:microphone',
    'Voice skill and relay flow',
    'Alexa skill and Unraid relay integration work for voice-driven Kind Robots interactions.',
    'software',
    'ready',
    12,
  ),
  card(
    'conductor-app',
    'Conductor App',
    'kind-icon:phone',
    'Mobile and desktop client',
    'A Flutter client for monitoring and steering the Conductor system from outside the main web app.',
    'software',
    'ready',
    13,
  ),
  card(
    'media-watchlist',
    'Media Watchlist',
    'kind-icon:movie',
    'Track what to watch next',
    'A media tracking project for cataloging, importing, and prioritizing watchlist data.',
    'software',
    'ready',
    14,
  ),
  card(
    'sketchy',
    'Sketchy',
    'kind-icon:pencil',
    'Drawing practice and critique',
    'An art-learning project for drawing practice, critique loops, and possible AI-assisted image analysis.',
    'software',
    'ready',
    15,
  ),
  card(
    'pinball-hero',
    'Pinball Hero',
    'kind-icon:star',
    'Pinball-flavored content project',
    'A content/game-adjacent project for pinball-themed assets, copy, and playful project experiments.',
    'content',
    'ready',
    16,
  ),
  card(
    'career-transition',
    'Career Transition',
    'kind-icon:briefcase',
    'Remote developer path',
    'A content and planning project for job targeting, portfolio framing, and remote developer transition work.',
    'content',
    'ready',
    17,
  ),
  card(
    'brainstorm',
    'Brainstorm',
    'kind-icon:brain',
    'Recurring pitch generation',
    'Generating and cycling pitches for new projects and directions. Recurring task that never reaches done.',
    'proposal',
    'ready',
    18,
  ),
  card(
    'engagement',
    'Engagement',
    'kind-icon:sparkles',
    'User engagement systems',
    'A software project for improving how people interact with Kind Robots loops, prompts, rewards, and project surfaces.',
    'software',
    'ready',
    19,
  ),
  card(
    'wishmaster',
    'Wishmaster',
    'kind-icon:wish',
    'Dream-backed wishes',
    'A Kind Robots surface for creating and managing wish-style Dream records without collapsing them into Todo state.',
    'software',
    'ready',
    20,
  ),
  card(
    'mermaids-of-venice',
    'Mermaids of Venice',
    'kind-icon:mermaid',
    'Paused brainstorm concept',
    'A paused brainstorm/content concept retained in the Conductor project universe for future revival.',
    'proposal',
    'waiting',
    21,
  ),
  card(
    'coat-dance',
    'Coat Dance',
    'kind-icon:dance',
    'Paused brainstorm concept',
    'A paused brainstorm concept retained in the Conductor project universe until it earns active work again.',
    'proposal',
    'waiting',
    22,
  ),
]
