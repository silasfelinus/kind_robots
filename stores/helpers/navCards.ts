// /stores/helpers/navCards.ts
//
// Navigation deck. These cards populate builder-hand as jump-to destinations
// rather than sheet-builders. They mirror channel-select.vue.
//
// Conforms to BuilderCard. Since BuilderInputType has no 'nav' member, each
// card carries a single 'custom' step and stows its routing target in
// card.payload ({ path, dashboardKey?, tab? }). The builder-hand click
// handler should read payload.path to route. restoresFields is [] because
// nav cards collect no sheet data.

import type { BuilderCard } from '@/stores/helpers/builderCards'

export type NavCard = BuilderCard

// Small helper to keep nav cards consistent and DRY. Every nav card is a
// single non-data 'custom' step whose payload mirrors the card payload.
// One image per concept: deckImage and heroImage point at the same flat
// /images/nav/<key>.webp file (downscaled at render time where needed).
function navCard(input: {
  key: string
  label: string
  title: string
  icon: string
  tagline: string
  narrative: string
  path: string
  dashboardKey?: string
  tab?: string
  flourish?: string
  deckImage?: string
  heroImage?: string
}): NavCard {
  const payload = {
    path: input.path,
    ...(input.dashboardKey ? { dashboardKey: input.dashboardKey } : {}),
    ...(input.tab ? { tab: input.tab } : {}),
  }

  const image = `/images/nav/${input.key}.webp`

  return {
    key: input.key,
    label: input.label,
    title: input.title,
    icon: input.icon,
    flourish: input.flourish,
    deckImage: input.deckImage ?? image,
    heroImage: input.heroImage ?? image,
    tagline: input.tagline,
    narrative: input.narrative,
    required: false,
    restoresFields: [],
    unlockCondition: 'always',
    payload,
    steps: [
      {
        key: input.key,
        title: input.title,
        narrative: input.narrative,
        inputType: 'custom',
        payload,
      },
    ],
  }
}

export const NAV_CARDS: NavCard[] = [
  // ── Utility ───────────────────────────────────────────────────────────────
  navCard({
    key: 'home',
    label: 'Home',
    title: 'Home',
    icon: 'kind-icon:home',
    flourish: '⌂',
    path: '/',
    tagline: 'Back to the beginning.',
    narrative: 'Return to the front door of Kind Robots.',
  }),
  navCard({
    key: 'themes',
    label: 'Themes',
    title: 'Themes',
    icon: 'kind-icon:paintbrush',
    flourish: '✦',
    path: '/themes',
    dashboardKey: 'theme',
    tagline: 'Change the look and the vibe.',
    narrative: 'Browse and activate themes, or build a custom palette.',
  }),

  // ── Models ────────────────────────────────────────────────────────────────
  navCard({
    key: 'art',
    label: 'Art',
    title: 'Art',
    icon: 'kind-icon:palette',
    flourish: '◐',
    path: '/art',
    dashboardKey: 'art',
    tagline: 'Generate and browse AI artwork.',
    narrative:
      'Build prompts, generate images, browse the gallery, and remix styles through the active art server.',
  }),
  navCard({
    key: 'dreams',
    label: 'Locations',
    title: 'Locations',
    icon: 'kind-icon:moon',
    flourish: '☾',
    path: '/dreams',
    dashboardKey: 'dream',
    tagline: 'Explore imagined places and dreamscapes.',
    narrative:
      'Coordinate collaborative dreams — prompts, art, collections, and the places your stories happen.',
  }),
  navCard({
    key: 'rewards',
    label: 'Rewards',
    title: 'Rewards',
    icon: 'kind-icon:trophy',
    flourish: '♛',
    path: '/rewards',
    dashboardKey: 'reward',
    tagline: 'Earn and collect rewards for your creations.',
    narrative:
      'Browse powers, items, and plot grenades. Build new rewards or turn one into a story encounter.',
  }),
  navCard({
    key: 'characters',
    label: 'Characters',
    title: 'Characters',
    icon: 'kind-icon:mask',
    flourish: '⚜',
    path: '/characters',
    dashboardKey: 'character',
    tagline: 'Design and meet the cast of your world.',
    narrative:
      'Create characters with the adventure builder, pair them with scenarios and rewards, and bring them to the stage.',
  }),

  // ── Featured ──────────────────────────────────────────────────────────────
  navCard({
    key: 'stories',
    label: 'Stories',
    title: 'Stories',
    icon: 'kind-icon:story',
    flourish: '§',
    path: '/stories',
    dashboardKey: 'scenario',
    tagline: 'Bring everything into one narrative space.',
    narrative:
      'Combine characters, places, treasures, and art into a single unfolding story.',
  }),
  navCard({
    key: 'builder',
    label: 'Builder',
    title: 'Builder',
    icon: 'kind-icon:blueprint',
    flourish: '▣',
    path: '/builder',
    dashboardKey: 'builder',
    tagline: 'Assemble pages, systems, tools, and machinery.',
    narrative:
      'The workshop for pages, systems, tools, and weird useful machinery.',
  }),

  // ── Projects ──────────────────────────────────────────────────────────────
  navCard({
    key: 'brainstorm',
    label: 'Brainstorm',
    title: 'Brainstorm',
    icon: 'kind-icon:brain',
    flourish: '✺',
    path: '/brainstorm',
    dashboardKey: 'brainstorm',
    tagline: 'Catch loose ideas before they escape into the walls.',
    narrative:
      'Work with pitches, prompts, and generated ideas. Build a pitch or let the brainstorm run.',
  }),
  navCard({
    key: 'bots',
    label: 'Bots',
    title: 'Bots',
    icon: 'kind-icon:robot-color',
    flourish: '◈',
    path: '/bots',
    dashboardKey: 'bot',
    tagline: 'Build personalities, assistants, and accomplices.',
    narrative:
      'Build bots with the builder cards, chat with them, forge new ones, or compose your own endpoint.',
  }),
  navCard({
    key: 'lab',
    label: 'Lab',
    title: 'WonderLab',
    icon: 'kind-icon:foundry',
    flourish: '⚗',
    path: '/wonderlab',
    dashboardKey: 'wonder',
    tagline: 'Let the robots touch the shiny buttons.',
    narrative:
      'Experiment, test reactions, and play with the toys that are not quite ready for the front page.',
  }),

  // ── Extras present in the app but not the channel grid ─────────────────────
  navCard({
    key: 'butterflies',
    label: 'Butterflies',
    title: 'Butterfly Sanctuary',
    icon: 'kind-icon:butterfly',
    flourish: '✿',
    path: '/butterflies',
    dashboardKey: 'footer',
    tab: 'fx',
    tagline: 'The swarm that absolutely does not run this website.',
    narrative:
      'Summon, inspect, and interact with the butterflies, and tune the screen effects they pretend not to control.',
  }),
  navCard({
    key: 'giftshop',
    label: 'Giftshop',
    title: 'Butterfly Giftshop',
    icon: 'kind-icon:gift',
    flourish: '❦',
    path: '/giftshop',
    dashboardKey: 'giftshop',
    tagline: 'Merch, prints, tokens, and swarm-approved artifacts.',
    narrative:
      'Browse the shop, manage your mana purse, and sponsor the anti-malaria mission behind AMI.',
  }),
  navCard({
    key: 'dashboard',
    label: 'User',
    title: 'User Dashboard',
    icon: 'kind-icon:person',
    flourish: '☉',
    path: '/dashboard',
    dashboardKey: 'user',
    tagline: 'Account, profile, and settings.',
    narrative:
      'Manage your account, subscription, milestones, themes, and chat history.',
  }),
]
