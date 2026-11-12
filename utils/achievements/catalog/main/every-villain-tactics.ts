// /utils/achievements/catalog/main/every-villain-tactics.ts
//
// Every Villain Tactics (ADMIN-ONLY: /admin/every-villain-tactics). Awarded by
// stores/everyVillainTacticsStore.ts from utils/everyVillainTactics/achievements.ts:
// a live save that grows the scrapbook awards what the book now proves.

import type { GameAchievementDef } from '../../gameAchievements'

const STYLE =
  'Original costumed teen heroes and villains of a superhero academy campus, bold comic-book inks, flat cel shading, saturated primaries against night-blue shadows, tactical game-board framing, centered emblem composition, every surface bare and unmarked.'

export const EVERY_VILLAIN_TACTICS_ACHIEVEMENTS: GameAchievementDef[] = [
  {
    game: 'every-villain-tactics',
    key: 'first-bell-cleared',
    tier: 1,
    label: 'Doors Open',
    message: 'The auditorium finally gave. Everyone inside heard you coming.',
    tooltip: 'In Every Villain Tactics, win the First Bell story battle.',
    subtleHint: 'Somebody sealed the auditorium. Somebody has to open it.',
    icon: 'kind-icon:door',
    rule: { kind: 'event' },
    artPrompt: `Heavy double doors of a school auditorium burst open in a shaft of stage light as a ragtag squad of young caped heroes and reluctant henchmen shoulder through together, rescued students streaming past them under a dangling fire-alarm bell. ${STYLE}`,
  },
  {
    game: 'every-villain-tactics',
    key: 'first-bell-lost',
    tier: 1,
    label: 'Patrol Held',
    message: 'Not the way you planned. The story kept going anyway.',
    tooltip: 'In Every Villain Tactics, lose the First Bell story battle.',
    subtleHint: 'Not every bell ends in applause.',
    icon: 'kind-icon:shield',
    rule: { kind: 'event' },
    artPrompt: `A battered squad of young costumed fighters sits on the school steps at dusk, masks pushed up, while a smug rival patrol in matching armor holds the sealed auditorium doors behind them and a single hall light flickers overhead. ${STYLE}`,
  },
  {
    game: 'every-villain-tactics',
    key: 'mercy',
    tier: 1,
    label: 'Spared',
    message: 'A rival walked away. You decided that was the stronger move.',
    tooltip:
      'In Every Villain Tactics, spare the first fallen rival in First Bell and finish the story.',
    subtleHint: 'When the first enemy falls, you do not have to press on.',
    icon: 'kind-icon:hand-heart',
    rule: { kind: 'event' },
    artPrompt: `In a smoky school gymnasium a young masked hero lowers a glowing fist and offers a hand up to a defeated rival in a dented villain helmet, while scattered teammates watch in surprised silence beneath a cracked scoreboard. ${STYLE}`,
  },
  {
    game: 'every-villain-tactics',
    key: 'rescue-call',
    tier: 1,
    label: 'Second Bell',
    message: 'You chose people over evidence. The cry behind the wall stopped.',
    tooltip:
      'In Every Villain Tactics, answer the cry behind the wall when the second alarm sounds in First Bell.',
    subtleHint: 'Two emergencies, one squad. Listen to the wall.',
    icon: 'kind-icon:bullhorn',
    rule: { kind: 'event' },
    artPrompt: `A caped teen hero punches through a cracked hallway wall to reach a frightened student trapped behind it, while a folder of glowing evidence slips forgotten from a teammate's hand and a red alarm bell rings overhead. ${STYLE}`,
  },
  {
    game: 'every-villain-tactics',
    key: 'every-side',
    tier: 3,
    label: "Everyone's Villain",
    message:
      'Hero, villain, henchman and sidekick: you won First Bell from all four sides.',
    tooltip:
      'In Every Villain Tactics, win First Bell as the hero, the villain, the henchman and the sidekick.',
    subtleHint: 'Every side of the doors has a story worth winning.',
    icon: 'kind-icon:mask',
    rule: { kind: 'event' },
    artPrompt: `Four masks hang side by side on a school locker door, a gleaming hero mask, a spiked villain visor, a plain henchman balaclava and a bright sidekick domino, each lit by its own colored spotlight as the auditorium doors glow open behind them. ${STYLE}`,
  },
  {
    game: 'every-villain-tactics',
    key: 'rival-foil',
    tier: 2,
    label: 'Chosen Nemesis',
    message: 'You picked your own rival and beat them anyway.',
    tooltip:
      'In Every Villain Tactics, choose a rival foil for a story and win the battle.',
    subtleHint: 'The New Story screen lets you choose who stands against you.',
    icon: 'kind-icon:swords',
    rule: { kind: 'event' },
    artPrompt: `Two young costumed rivals face each other across a tactical grid drawn in chalk on a rooftop, one hero in a flowing cape and one hand-picked nemesis in mirrored armor, sparks of opposing powers meeting in the middle under a full moon. ${STYLE}`,
  },
  {
    game: 'every-villain-tactics',
    key: 'untouched',
    tier: 3,
    label: 'Untouched',
    message: 'From the first move to victory, not one point of damage.',
    tooltip:
      'In Every Villain Tactics, win a battle without the squad taking any damage.',
    subtleHint: 'Cover, overwatch and patience. Nobody bleeds.',
    icon: 'kind-icon:sparkles',
    rule: { kind: 'event' },
    artPrompt: `A spotless young hero squad stands in perfect formation amid a wrecked campus courtyard, scorch marks and broken props all around them but not a scratch on their bright costumes, a single gold medal glinting in the leader's raised hand. ${STYLE}`,
  },
  {
    game: 'every-villain-tactics',
    key: 'no-knockouts',
    tier: 2,
    label: 'Nobody Down',
    message: 'The whole squad walked out on their own feet.',
    tooltip:
      'In Every Villain Tactics, win a battle with no squad member knocked out.',
    subtleHint: 'Bring everyone home.',
    icon: 'kind-icon:users',
    rule: { kind: 'event' },
    artPrompt: `A full squad of costumed teen heroes and henchmen walks arm in arm out of a smoking school science wing, bruised and grinning, every one of them upright, as sirens glow blue and red across the parking lot behind them. ${STYLE}`,
  },
  {
    game: 'every-villain-tactics',
    key: 'every-civilian',
    tier: 2,
    label: 'Headcount',
    message: 'Every civilian safe. The roll call came back complete.',
    tooltip:
      'In Every Villain Tactics, win a battle with every civilian evacuated.',
    subtleHint: 'Count the bystanders before you count the villains.',
    icon: 'kind-icon:checklist',
    rule: { kind: 'event' },
    artPrompt: `A young sidekick with a clipboard stands at a safety cone line checking off a crowd of rescued students, picnickers and a lunch lady, everyone accounted for, while the battle smoke drifts harmlessly away behind a bandstand. ${STYLE}`,
  },
  {
    game: 'every-villain-tactics',
    key: 'quick-clear',
    tier: 2,
    label: 'Bell to Bell',
    message: 'Objective done before the next period started.',
    tooltip:
      'In Every Villain Tactics, win a battle early enough to earn the fast-objective medal.',
    subtleHint: 'Waves arrive on schedule. So can you.',
    icon: 'kind-icon:clock',
    rule: { kind: 'event' },
    artPrompt: `A caped teen speedster skids to a stop beneath a giant school hallway clock whose minute hand has barely moved, the defeated rivals stacked neatly behind her and a trail of motion lines curling across the polished floor. ${STYLE}`,
  },
  {
    game: 'every-villain-tactics',
    key: 'evidence',
    tier: 1,
    label: 'Case File',
    message: 'You won and kept the evidence. Somebody has questions to answer.',
    tooltip:
      'In Every Villain Tactics, win First Bell with evidence recovered.',
    subtleHint: 'The alarm controls remember who sealed the doors.',
    icon: 'kind-icon:magnify',
    rule: { kind: 'event' },
    artPrompt: `A masked teen detective hero holds up a glowing magnifying lens over a pried-open alarm control panel, wires and a torn villain badge revealed inside, as her squadmates guard the doorway of a dim school maintenance room. ${STYLE}`,
  },
  {
    game: 'every-villain-tactics',
    key: 'picnic-rescued',
    tier: 2,
    label: 'Behind the Bandstand',
    message: 'Every picnicker got clear before the lawn gave way.',
    tooltip:
      'In Every Villain Tactics, walk every picnicker to safety in Picnic Panic.',
    subtleHint: 'The dust rings warn you where the lawn will open.',
    icon: 'kind-icon:people',
    rule: { kind: 'event' },
    artPrompt: `Families with picnic baskets and blankets huddle safely behind a striped park bandstand while young costumed heroes hold back a sprawl of dust rings and burrowing molehills spreading across a sunny plaza lawn. ${STYLE}`,
  },
  {
    game: 'every-villain-tactics',
    key: 'overtime',
    tier: 2,
    label: 'Time and a Half',
    message: 'The overtime shift tunneled in. You outlasted it.',
    tooltip:
      'In Every Villain Tactics, hold Picnic Panic until the overtime shift arrives.',
    subtleHint: 'Foreman Thumpkin always calls one more shift.',
    icon: 'kind-icon:construction',
    rule: { kind: 'event' },
    artPrompt: `A stout rabbit foreman in a hard hat blows a whistle as a third shift of burrowing bunny men pops up from molehills ringed with traffic cones, while a tired squad of young heroes braces on the picnic lawn for one more round. ${STYLE}`,
  },
  {
    game: 'every-villain-tactics',
    key: 'picnic-won',
    tier: 1,
    label: 'Leftovers for Everyone',
    message: 'The plaza held and the picnic went on.',
    tooltip: 'In Every Villain Tactics, win the Picnic Panic one-shot.',
    subtleHint: 'Seal the molehills and the sandwiches are safe.',
    icon: 'kind-icon:party',
    rule: { kind: 'event' },
    artPrompt: `A cheerful victory picnic on a restored plaza lawn, young costumed heroes sharing sandwiches and lemonade with grateful families on checkered blankets, the last molehill plugged with a traffic cone and bunting strung across the bandstand. ${STYLE}`,
  },
  {
    game: 'every-villain-tactics',
    key: 'one-shot-sweep',
    tier: 3,
    label: 'Stage Veteran',
    message: 'All eight one-shots won. Every stage knows your name.',
    tooltip:
      'In Every Villain Tactics, win every one-shot battle on the One-Shot menu.',
    subtleHint: 'Quad, lab, boiler room, quarry and four more.',
    icon: 'kind-icon:trophy',
    rule: { kind: 'event' },
    artPrompt: `A young caped hero stands on a podium of eight stacked stage miniatures, a fountain quad, a science lab, a boiler room, a quarry, a picnic plaza and more, each topped with a tiny victory flag, under a sweep of spotlights. ${STYLE}`,
  },
  {
    game: 'every-villain-tactics',
    key: 'stage-architect',
    tier: 1,
    label: 'Stage Studio',
    message:
      'Your first custom stage is saved. Somebody will have to fight on it.',
    tooltip:
      'In Every Villain Tactics, save a stage draft in the stage studio.',
    subtleHint: 'Paint walls, place a boss, name it, keep it.',
    icon: 'kind-icon:blueprint',
    rule: { kind: 'event' },
    artPrompt: `A teen villain-turned-designer leans over a glowing blueprint table painting walls, water and cover onto a tactical grid with a light pen, tiny figurines of heroes and henchmen waiting at the edge of the map. ${STYLE}`,
  },
  {
    game: 'every-villain-tactics',
    key: 'scrapbook-full',
    tier: 3,
    label: 'Yearbook',
    message: 'Every moment witnessed. The scrapbook is full.',
    tooltip:
      'In Every Villain Tactics, witness every moment in the scrapbook, from First Bell to Picnic Panic.',
    subtleHint: 'Victory and defeat both earn a page.',
    icon: 'kind-icon:book-open',
    rule: { kind: 'event' },
    artPrompt: `An open school yearbook-style scrapbook overflows with pasted snapshots of superhero battles, sealed auditorium doors, alarm bells, burrowing bunny men and picnic victories, every page filled, ribbon bookmark trailing across a dorm desk. ${STYLE}`,
  },
]
