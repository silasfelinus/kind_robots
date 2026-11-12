// /utils/achievements/catalog/main/memory-dungeon.ts
//
// Memory Dungeon. A curated subset of the local Chronicle medals and the
// reality completions, mapped by utils/memoryDungeon/siteAchievements.ts and
// awarded by memoryWorldStore from play only (never hydrate or a loaded
// checkpoint). The site-level `memory-master` code (Classic Match) is separate
// and unchanged.

import type { GameAchievementDef } from '../../gameAchievements'

const STYLE =
  'Storybook fairy-tale illustration with ink linework and soft watercolor, briar-thorn green, candle amber and memory-jar blue palette, drifting glowing motes, gentle vignette, centered emblem composition, no text or lettering, every surface bare and unmarked.'

export const MEMORY_DUNGEON_ACHIEVEMENTS: GameAchievementDef[] = [
  {
    game: 'memory-dungeon',
    key: 'first-medal',
    tier: 1,
    label: 'A Chronicle Begins',
    message:
      'The first medal is pinned in your Chronicle. Somebody in the Marches will remember what you did.',
    tooltip: 'In Memory Dungeon, earn any Chronicle medal.',
    subtleHint: 'Medals come from choices that change how a story ends.',
    icon: 'kind-icon:book-open',
    rule: { kind: 'event' },
    artPrompt: `An open leather-bound chronicle on a mossy stone table in a thorny forest clearing, a single small bronze medal resting on the first page beside a quill and a candle stub, briar vines curling around the book's edges. ${STYLE}`,
  },
  {
    game: 'memory-dungeon',
    key: 'briar-cleared',
    tier: 1,
    label: 'Out of the Briar',
    message:
      'The gate of the Briar Marches opens. Rowan walks out of the first world with every memory carried.',
    tooltip: 'In Memory Dungeon, complete the Briar Marches.',
    subtleHint: 'Match the map, open the rooms, and find the gate.',
    icon: 'kind-icon:door',
    rule: { kind: 'event' },
    artPrompt: `A tall wrought-iron gate tangled with briar roses swinging open onto a golden meadow at dawn, a young researcher with a satchel of memory jars stepping through, thorns parting like curtains behind them. ${STYLE}`,
  },
  {
    game: 'memory-dungeon',
    key: 'minefield',
    tier: 1,
    label: 'Safe Steps',
    message:
      'Every hazard deduced, every thorn avoided. The archive door yields to careful feet.',
    tooltip: 'In Memory Dungeon, escape a thorn minefield chamber.',
    subtleHint: 'Count the thorns around each safe square.',
    icon: 'kind-icon:grid',
    rule: { kind: 'event' },
    artPrompt: `A checkerboard floor of old archive tiles in a dim stone chamber, some tiles sprouting sharp briar thorns and others glowing safely, a careful pair of boots stepping on a lit tile while a small lantern floats overhead. ${STYLE}`,
  },
  {
    game: 'memory-dungeon',
    key: 'ordinary-kindness',
    tier: 1,
    label: 'Small Kindnesses',
    message:
      'On ordinary Earth, a small choice was the bravest thing in the room. The Chronicle kept it.',
    tooltip:
      "In Memory Dungeon, earn a medal in Morrow's Earth or the Unbelieving City.",
    subtleHint: 'A bus stop, a shelter, a gate: small places matter.',
    icon: 'kind-icon:hand-heart',
    rule: { kind: 'event' },
    artPrompt: `A rainy city bus stop at night under a single streetlamp, one person holding an umbrella over a stranger, a tiny glowing thorn sprig tucked in the umbrella's handle, puddles reflecting warm light. ${STYLE}`,
  },
  {
    game: 'memory-dungeon',
    key: 'fourth-column',
    tier: 2,
    label: 'A Fourth Way Out',
    message:
      'Oren keeps the fourth column open: a list of the people the first plan forgot.',
    tooltip:
      'In Memory Dungeon, make Oren account for someone his first evacuation plan left behind.',
    subtleHint: 'Ask who the evacuation plan did not see.',
    icon: 'kind-icon:checklist',
    rule: { kind: 'event' },
    artPrompt: `A weathered evacuation ledger pinned to a wooden post in a village square, three neat columns of names and a fourth column freshly ruled in red ink, a lantern-bearing guide pointing toward a forgotten cottage at the edge of the briars. ${STYLE}`,
  },
  {
    game: 'memory-dungeon',
    key: 'guardian',
    tier: 2,
    label: 'Guardian Down',
    message:
      "The Warden yields to remembered pairs, not to ownership of anyone else's past.",
    tooltip:
      'In Memory Dungeon, win the Warden fight in the House That Remembers.',
    subtleHint: 'The vault is guarded by the thing that keeps the jars.',
    icon: 'kind-icon:shield',
    rule: { kind: 'event' },
    artPrompt: `A towering stone warden made of stacked memory jars kneeling in a vaulted hall, its glowing eyes dimming, a young researcher standing before it holding two matching cards that shine, shelves of jars rising into the shadows. ${STYLE}`,
  },
  {
    game: 'memory-dungeon',
    key: 'other-marches',
    tier: 2,
    label: 'The Other Marches',
    message:
      'You walked the mirrored Briar and came back. Both versions of the Marches remember you now.',
    tooltip: 'In Memory Dungeon, complete the Briar Understory.',
    subtleHint: 'The same map, seen from underneath.',
    icon: 'kind-icon:mirror',
    rule: { kind: 'event' },
    artPrompt: `A thorny forest reflected upside down in a still black pool, the mirrored version darker and stranger with lantern-eyed shapes among the roots, a single traveler standing at the waterline where the two forests meet. ${STYLE}`,
  },
  {
    game: 'memory-dungeon',
    key: 'both-marches',
    tier: 2,
    label: 'Both Marches Remember',
    message:
      'A choice in one Marches echoed in the other. The medal needs both worlds to be true.',
    tooltip:
      'In Memory Dungeon, earn a mirrored-Briar medal that needs a choice in both realities.',
    subtleHint: 'Make the same promise on both sides of the mirror.',
    icon: 'kind-icon:link',
    rule: { kind: 'event' },
    artPrompt: `Two bronze bells hanging from the same crooked branch, one in bright storybook daylight and one in the mirrored dark understory, a single ribbon tied between them across the seam where the two worlds touch. ${STYLE}`,
  },
  {
    game: 'memory-dungeon',
    key: 'morrow-earth',
    tier: 2,
    label: "Morrow's Earth",
    message:
      "You lived a shift of Morrow's ordinary life, and found it stranger than any dungeon.",
    tooltip: "In Memory Dungeon, complete Morrow's Shift.",
    subtleHint: 'The person whose life you swapped has a job to get to.',
    icon: 'kind-icon:clock',
    rule: { kind: 'event' },
    artPrompt: `A fairy-tale wanderer in a cloak standing bewildered inside a modern city commuter train at sunrise, holding a paper coffee cup like a precious relic, thorny briar sprigs poking from their satchel among the briefcases. ${STYLE}`,
  },
  {
    game: 'memory-dungeon',
    key: 'earth-decided',
    tier: 2,
    label: 'An Ordinary Life',
    message:
      'The city did not believe in magic, and you made a choice that mattered anyway.',
    tooltip: 'In Memory Dungeon, complete The Unbelieving City.',
    subtleHint: 'An ending on Earth still needs a decision.',
    icon: 'kind-icon:home',
    rule: { kind: 'event' },
    artPrompt: `A small apartment window at dusk overlooking a busy city, a potted briar rose blooming on the sill beside a stack of library books and a memory jar used as a pencil cup, warm light inside and rain outside. ${STYLE}`,
  },
  {
    game: 'memory-dungeon',
    key: 'scylla',
    tier: 2,
    label: "Scylla's Tide",
    message:
      'Scylla decided for herself whether to run again. You only made sure she could.',
    tooltip: "In Memory Dungeon, complete Scylla's Shore.",
    subtleHint: 'A departure means more when it is hers to choose.',
    icon: 'kind-icon:wave',
    rule: { kind: 'event' },
    artPrompt: `A rocky moonlit shore with a small rowboat pulled up on the pebbles, a young sea princess in a travel cloak looking out at the tide with a folded itinerary in hand, gulls asleep on the rocks and a lantern on the bow. ${STYLE}`,
  },
  {
    game: 'memory-dungeon',
    key: 'twin-tide',
    tier: 2,
    label: 'Twin Tide',
    message:
      'Under the waves, two sisters kept two answers. Nobody signed for both of them.',
    tooltip: 'In Memory Dungeon, complete the Undertide Crown.',
    subtleHint: 'Let Char answer for Char.',
    icon: 'kind-icon:crown',
    rule: { kind: 'event' },
    artPrompt: `Two coral crowns resting side by side on a sunken throne in an underwater palace, one neat and pearl-studded and one scribbled with bright sea-glass, schools of silver fish circling through shafts of blue light. ${STYLE}`,
  },
  {
    game: 'memory-dungeon',
    key: 'hearth-release',
    tier: 2,
    label: 'The Jars Go Home',
    message:
      'You released the Memory Hearth. The neighbors carried their memories home in mismatched baskets.',
    tooltip:
      'In Memory Dungeon, resolve the Memory Hearth by releasing its jars.',
    subtleHint: 'Some things kept safe were never yours to keep.',
    icon: 'kind-icon:butterfly',
    rule: { kind: 'event' },
    artPrompt: `Hundreds of glowing memory jars uncorked on the shelves of an old stone house, soft lights rising out of them like fireflies and drifting through open windows toward a village of cottages below. ${STYLE}`,
  },
  {
    game: 'memory-dungeon',
    key: 'hearth-renew',
    tier: 2,
    label: 'Hearth Renewed',
    message:
      'You renewed the Memory Hearth as a commons that opens only when its witnesses arrive.',
    tooltip:
      'In Memory Dungeon, resolve the Memory Hearth by renewing its custody.',
    subtleHint: 'A keeper can learn to ask first.',
    icon: 'kind-icon:flame',
    rule: { kind: 'event' },
    artPrompt: `A great stone hearth relit with a gentle blue flame in a round meeting hall, villagers seated in a circle around it with memory jars resting in their laps, an empty chair left open for one more witness. ${STYLE}`,
  },
  {
    game: 'memory-dungeon',
    key: 'hearth-break',
    tier: 2,
    label: 'Hearth Broken',
    message:
      'You broke the Memory Hearth. The village builds something quieter from the pieces.',
    tooltip:
      'In Memory Dungeon, resolve the Memory Hearth by breaking its mechanism.',
    subtleHint: 'Some machines cannot be made kind.',
    icon: 'kind-icon:hammer',
    rule: { kind: 'event' },
    artPrompt: `Shards of a shattered brass-and-glass memory machine scattered across a stone floor, each fragment holding a tiny reflected scene, morning light pouring through a cracked dome above, a broom leaning patiently against the wall. ${STYLE}`,
  },
  {
    game: 'memory-dungeon',
    key: 'briar-medals',
    tier: 3,
    label: 'Every Thread Tied',
    message:
      'All eight Briar medals are pinned. Every rare convergence in the first world found its ending.',
    tooltip: 'In Memory Dungeon, earn all eight Briar Marches medals.',
    subtleHint: 'Each quest in the Marches hides a rarer, kinder answer.',
    icon: 'kind-icon:trophy',
    rule: { kind: 'event' },
    artPrompt: `Eight small bronze medals arranged in a ring on a velvet cloth inside an open wooden keepsake box, each engraved with a different emblem of the Briar Marches, a wolf, a bell, a ledger, a key, a crown, bread, a letter and a road. ${STYLE}`,
  },
  {
    game: 'memory-dungeon',
    key: 'hoshimori',
    tier: 3,
    label: 'Hoshimori Warm',
    message:
      'Vesper answered for the map. The families marked it with questions, and the record stays open.',
    tooltip:
      "In Memory Dungeon, finish Vesper's Hoshimori hearings and earn an accountability medal.",
    subtleHint: 'Three hearings, three choices, one honest record.',
    icon: 'kind-icon:lamp',
    rule: { kind: 'event' },
    artPrompt: `A warm lantern-lit wooden hall in a misty mountain village, an atlas spread on a long table with handwritten questions in its margins, villagers leaning in to read while a cloaked mapmaker sits apart holding no pen. ${STYLE}`,
  },
  {
    game: 'memory-dungeon',
    key: 'cold-oven',
    tier: 3,
    label: 'The Oven Goes Cold',
    message:
      'The Red Oven owes what it took. You set up a remedy that the harmed can still reopen.',
    tooltip:
      'In Memory Dungeon, complete the Red Oven hearings and earn a Cinder Wing restitution medal.',
    subtleHint: 'A remedy should be revocable by the people it serves.',
    icon: 'kind-icon:scale',
    rule: { kind: 'event' },
    artPrompt: `A great iron oven gone cold in a stone bakery hall, its red glow fading to embers, a child's worn ledger resting open on the cooling brick beside a set of brass scales, villagers gathered quietly at a long table. ${STYLE}`,
  },
  {
    game: 'memory-dungeon',
    key: 'hoshimori-night',
    tier: 3,
    label: 'Night Council',
    message:
      'The sixteen-site night procession is finished, and three witnesses signed the council charter.',
    tooltip:
      'In Memory Dungeon, finish the Hoshimori night procession and earn a council charter medal.',
    subtleHint: 'Walk the whole procession before you ask for a charter.',
    icon: 'kind-icon:moon',
    rule: { kind: 'event' },
    artPrompt: `A procession of paper lanterns winding up a mountain path at night toward a small shrine, three witnesses standing at the top holding a single rolled charter between them, stars and yokai silhouettes in the mist. ${STYLE}`,
  },
  {
    game: 'memory-dungeon',
    key: 'medal-case',
    tier: 3,
    label: 'A Full Medal Case',
    message:
      'Twenty-four medals in your Chronicle. You have changed the endings of a lot of stories.',
    tooltip: 'In Memory Dungeon, earn 24 Chronicle medals.',
    subtleHint: 'Every world has its own medals. Visit them all.',
    icon: 'kind-icon:collection',
    rule: { kind: 'event' },
    artPrompt: `A tall glass-fronted cabinet in a cozy study filled with rows of small bronze and silver medals on velvet shelves, briar vines framing the cabinet, a reading chair and a stack of chronicles beside it in warm candlelight. ${STYLE}`,
  },
]
