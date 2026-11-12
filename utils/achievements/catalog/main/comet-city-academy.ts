// /utils/achievements/catalog/main/comet-city-academy.ts
//
// Prom of Doom (/play/comet-city-academy). stores/cometAcademyStore.ts awards
// these from what each action newly earned (utils/cometAcademy/achievements.ts):
// endings when the term ends, Yearbook milestones when an ending or mantle is
// first written into it. Loading or importing a save never awards.

import type { GameAchievementDef } from '../../gameAchievements'

const STYLE =
  'Comet City at night, original saturated superhero comic illustration, inked silhouettes, colored night light, adult heroes in original costumes, centered emblem composition, no words, every surface bare and unmarked.'

export const COMET_CITY_ACADEMY_ACHIEVEMENTS: GameAchievementDef[] = [
  {
    game: 'comet-city-academy',
    key: 'enrolled',
    tier: 1,
    label: 'First Day of the Last Month',
    message:
      'You enrolled at Comet City Academy. Thirty days to the Prom of Doom.',
    tooltip: 'In Prom of Doom, begin a term at Comet City Academy.',
    subtleHint: 'Pick a power. Pick a vow. Pick up your schedule.',
    icon: 'kind-icon:comet',
    rule: { kind: 'event' },
    artPrompt: `A nervous new student hero in a fresh academy jacket stands at the foot of the grand Comet City Academy steps at dawn, a comet streaking over the clock tower and a countdown banner shape of thirty glowing marks above the doors. ${STYLE}`,
  },
  {
    game: 'comet-city-academy',
    key: 'graduated',
    tier: 1,
    label: 'Survived the Prom of Doom',
    message: 'The real prom is over and you walked out of it. Mostly intact.',
    tooltip: 'In Prom of Doom, reach any ending of the real prom.',
    subtleHint: 'Thirty days, one ballroom, one choice at the chandelier.',
    icon: 'kind-icon:party',
    rule: { kind: 'event' },
    artPrompt: `A battered young hero in a torn formal suit and cape walks out of a smoking art deco ballroom at sunrise, corsage still pinned on, while the shattered chandelier glitters behind them and the city skyline wakes up. ${STYLE}`,
  },
  {
    game: 'comet-city-academy',
    key: 'sim-honors',
    tier: 2,
    label: 'Honors in the Simulation',
    message: 'You aced week one. The simulator will remember your name.',
    tooltip:
      'In Prom of Doom, earn the HONORS IN THE PROM SIMULATION ending of the week-one simulation.',
    subtleHint:
      'Protect your classmates with influence earned and danger kept low.',
    icon: 'kind-icon:star',
    rule: { kind: 'event' },
    artPrompt: `Inside a glowing holographic training dome shaped like a ballroom, a student hero shields three classmates as the simulated chandelier dissolves into blue pixels and a gold honors seal lights up overhead. ${STYLE}`,
  },
  {
    game: 'comet-city-academy',
    key: 'thousand-keys',
    tier: 3,
    label: 'A City with a Thousand Keys',
    message:
      'You handed the shield to the neighborhoods. The grid belongs to everyone.',
    tooltip: 'In Prom of Doom, reach the ending A CITY WITH A THOUSAND KEYS.',
    subtleHint: 'Allies, evidence and standing, all at once.',
    icon: 'kind-icon:key',
    rule: { kind: 'event' },
    artPrompt: `Across a night skyline, every neighborhood lights its own brass key-shaped shield tower in a different color, linking into a woven dome of light over Comet City while ordinary citizens raise their keys from rooftops. ${STYLE}`,
  },
  {
    game: 'comet-city-academy',
    key: 'last-dance',
    tier: 2,
    label: 'The Last Dance Leaves by Boat',
    message: 'Everyone got out of the ballroom, by the harbor, alive.',
    tooltip: 'In Prom of Doom, reach the ending THE LAST DANCE LEAVES BY BOAT.',
    subtleHint: 'Put the guests before the hardware, with support behind you.',
    icon: 'kind-icon:paper-ship',
    rule: { kind: 'event' },
    artPrompt: `A flotilla of small lantern-lit boats carries prom guests in gowns and tuxedos across a dark harbor, student heroes rowing and flying escort, while the ballroom tower flickers ominously on the shore behind them. ${STYLE}`,
  },
  {
    game: 'comet-city-academy',
    key: 'master-shield',
    tier: 2,
    label: 'Master of the Shield',
    message: 'You seized the console and held it. The city answers to you now.',
    tooltip: 'In Prom of Doom, reach the ending MASTER OF THE SHIELD.',
    subtleHint: 'Seize the controls with the standing to keep them.',
    icon: 'kind-icon:shield',
    rule: { kind: 'event' },
    artPrompt: `A lone hero stands at a towering shield control console high above the city, one hand on a great glowing lever as a vast hexagonal energy dome locks into place over Comet City, their silhouette both heroic and unsettling. ${STYLE}`,
  },
  {
    game: 'comet-city-academy',
    key: 'transmitter-dark',
    tier: 2,
    label: 'The Transmitter Goes Dark',
    message:
      'You killed the signal at its source. The city gave up its shield to be rid of it.',
    tooltip: 'In Prom of Doom, reach the ending THE TRANSMITTER GOES DARK.',
    subtleHint:
      'Break the transmitter, with earned support, at the ballroom’s cost.',
    icon: 'kind-icon:bolt',
    rule: { kind: 'event' },
    artPrompt: `A colossal villain transmitter spire atop the ballroom cracks apart in a shower of sparks as a student hero drives a fist of light through its core, the sinister broadcast rings collapsing into silence over the dark city. ${STYLE}`,
  },
  {
    game: 'comet-city-academy',
    key: 'collateral',
    tier: 1,
    label: 'Collateral Damage',
    message: 'Not every prom ends well. The city remembers this one.',
    tooltip:
      'In Prom of Doom, reach a costly ending: THE BROKEN GRID, THE MUSIC AFTER GLASS, THE PRICE OF A SINGLE SWITCH or THE SHIELD CHANGES HANDS.',
    subtleHint: 'Try the big play without the allies to back it.',
    icon: 'kind-icon:alert-triangle',
    rule: { kind: 'event' },
    artPrompt: `A rain-soaked street after the prom, broken glass from a fallen chandelier glinting on the pavement, a weary student hero sitting on the curb with a dented mask in hand as half the city's lights flicker out behind them. ${STYLE}`,
  },
  {
    game: 'comet-city-academy',
    key: 'all-endings',
    tier: 3,
    label: 'Every Prom, Every Doom',
    message:
      'All twelve endings are in your Yearbook. You have seen every way it goes.',
    tooltip: 'In Prom of Doom, record all 12 endings in your Yearbook.',
    subtleHint:
      'Some endings belong to the simulation, some to the real night.',
    icon: 'kind-icon:book',
    rule: { kind: 'event' },
    artPrompt: `An open academy yearbook glowing on a desk, its pages fanning out into twelve floating comic panels of different prom finales, harbor boats, a dark transmitter, a shield dome and shattered glass, all orbiting a small golden comet. ${STYLE}`,
  },
  {
    game: 'comet-city-academy',
    key: 'unmasked',
    tier: 2,
    label: 'J’Accuse',
    message: 'You named the mastermind, and the evidence held.',
    tooltip:
      'In Prom of Doom, correctly name the mastermind from the first weeks’ evidence.',
    subtleHint: 'The case board rewards patience, not guesses.',
    icon: 'kind-icon:magnify',
    rule: { kind: 'event' },
    artPrompt: `A determined student detective hero pins a shadowy villain silhouette to the center of a red-string case board in a cluttered academy war room, photos and omens radiating outward as a desk lamp casts dramatic light. ${STYLE}`,
  },
  {
    game: 'comet-city-academy',
    key: 'dossiers',
    tier: 3,
    label: 'Rogues’ Gallery',
    message:
      'Every mastermind dossier is filed. None of them can surprise you now.',
    tooltip:
      'In Prom of Doom, meet every possible mastermind across your terms, filling their dossiers in the Scrapbook.',
    subtleHint: 'Each term hides a different hand behind the curtain.',
    icon: 'kind-icon:folder',
    rule: { kind: 'event' },
    artPrompt: `A long wall of framed villain dossiers in an academy archive, each frame holding a dramatic masked silhouette of a different mastermind, a student hero standing before them with arms folded and a satisfied smile. ${STYLE}`,
  },
  {
    game: 'comet-city-academy',
    key: 'honors-fight',
    tier: 1,
    label: 'Honors Grade',
    message: 'A clean, honors-grade win in a tactical fight.',
    tooltip: 'In Prom of Doom, win a tactical mission with an honors grade.',
    subtleHint: 'Fewer turns, nobody down, ground secured.',
    icon: 'kind-icon:target',
    rule: { kind: 'event' },
    artPrompt: `A squad of three student heroes stands unhurt on a rooftop battle grid after a tactical victory, a captured objective beacon glowing between them and a rival crew retreating across the skyline at night. ${STYLE}`,
  },
  {
    game: 'comet-city-academy',
    key: 'parley',
    tier: 2,
    label: 'Not Today, Villain',
    message: 'You talked a lieutenant into switching sides mid-fight.',
    tooltip:
      'In Prom of Doom, persuade a villain’s lieutenant to defect during a tactical mission.',
    subtleHint: 'Some lieutenants have their own agenda. Listen to it.',
    icon: 'kind-icon:handshake',
    rule: { kind: 'event' },
    artPrompt: `In the middle of a rain-lashed street battle, a student hero lowers their glowing fists and offers an open hand to a hulking villain lieutenant who hesitates, the lieutenant's crew frozen in surprise behind them. ${STYLE}`,
  },
  {
    game: 'comet-city-academy',
    key: 'prom-date',
    tier: 1,
    label: 'Corsage Secured',
    message:
      'You have a date to the Prom of Doom. Whatever happens, you will not dance alone.',
    tooltip: 'In Prom of Doom, start a romance with a classmate.',
    subtleHint:
      'Spend your evenings with someone, and ask at the right moment.',
    icon: 'kind-icon:heart',
    rule: { kind: 'event' },
    artPrompt: `Two student heroes in costume share a quiet moment on the academy rooftop under a streaking comet, one pinning a glowing star-shaped corsage onto the other's cape while the city glitters below. ${STYLE}`,
  },
  {
    game: 'comet-city-academy',
    key: 'case-secret',
    tier: 1,
    label: 'The Hidden Truth',
    message: 'A night case had a secret, and you were the one who found it.',
    tooltip:
      'In Prom of Doom, uncover a district secret while personally leading a night case.',
    subtleHint: 'Lead the case yourself and look past the obvious.',
    icon: 'kind-icon:eye',
    rule: { kind: 'event' },
    artPrompt: `A student hero shines a flashlight into a hidden chamber behind a false wall in a neon-lit alley, revealing a secret villain workshop of blueprints and humming machinery while the city's sirens glow in the distance. ${STYLE}`,
  },
  {
    game: 'comet-city-academy',
    key: 'mantle',
    tier: 2,
    label: 'Earned the Mantle',
    message: 'Your hero evolved. That form is yours to replay now.',
    tooltip:
      'In Prom of Doom, evolve your hero into a new hero or villain form during a term.',
    subtleHint: 'Who you become depends on what you keep choosing.',
    icon: 'kind-icon:sparkles',
    rule: { kind: 'event' },
    artPrompt: `A student hero transforms in a spiral of comet light on the academy rooftop, their old jacket burning away into a magnificent new costume and cape, eyes blazing with power as classmates shield their faces below. ${STYLE}`,
  },
  {
    game: 'comet-city-academy',
    key: 'many-faces',
    tier: 3,
    label: 'Many Faces',
    message: 'Five different heroes have reached an ending under your hand.',
    tooltip:
      'In Prom of Doom, reach an ending with five different signature identities.',
    subtleHint: 'The Yearbook has room for many signatures.',
    icon: 'kind-icon:users',
    rule: { kind: 'event' },
    artPrompt: `A yearbook group photo of five wildly different student heroes standing together on the academy steps, each in a distinct costume and power aura, flame, ice, lightning, shadow and starlight, grinning at the camera at dusk. ${STYLE}`,
  },
  {
    game: 'comet-city-academy',
    key: 'reconciled',
    tier: 2,
    label: 'Second Chances',
    message: 'A classmate betrayed you, and you brought them back anyway.',
    tooltip: 'In Prom of Doom, reconcile with the classmate who betrayed you.',
    subtleHint: 'A betrayal is a story, not always an ending.',
    icon: 'kind-icon:hand-heart',
    rule: { kind: 'event' },
    artPrompt: `Two student heroes sit together on a fire escape at night after a hard fight, one offering the other a patched academy jacket back as rain clears and the comet breaks through the clouds above them. ${STYLE}`,
  },
]
