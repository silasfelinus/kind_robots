// /utils/achievements/catalog/main/ruler-hooked.ts
//
// The Ruler Is Hooked. Judged by utils/rulerHooked/achievements.ts and awarded
// at the deed by rulerHookedStore and rulerHookedQuizStore, never from init()
// or loadSlot().

import type { GameAchievementDef } from '../../gameAchievements'

const STYLE =
  'Cozy storybook kingdom illustration, lakeside green, royal plum and sunset gold palette, soft painterly brushwork, gentle morning light on the water, whimsical and warm, centered emblem composition, no text or lettering, every surface bare and unmarked.'

export const RULER_HOOKED_ACHIEVEMENTS: GameAchievementDef[] = [
  {
    game: 'ruler-hooked',
    key: 'crowned',
    tier: 1,
    label: 'Long May You Fish',
    message:
      'You swore the oath and took the throne. The lake is officially yours to fish.',
    tooltip: 'In The Ruler Is Hooked, begin a new reign.',
    subtleHint: 'Every reign starts with a name and a crown.',
    icon: 'kind-icon:crown',
    rule: { kind: 'event' },
    artPrompt: `A small jeweled crown resting on a wooden dock beside a fishing rod and a tackle box at sunrise, a cozy lakeside castle in the background, ducks paddling past and mist rising from the water. ${STYLE}`,
  },
  {
    game: 'ruler-hooked',
    key: 'own-face',
    tier: 1,
    label: 'A Face for the Coins',
    message: 'Your own portrait now graces the realm, and the royal coinage.',
    tooltip: 'In The Ruler Is Hooked, give your ruler a portrait of your own.',
    subtleHint: 'Rulers can change their look whenever they like.',
    icon: 'kind-icon:portrait',
    rule: { kind: 'event' },
    artPrompt: `A royal painter's easel in a sunny castle gallery holding a fresh portrait framed in gold, a stack of shiny new coins on a velvet cushion beside it, a fishing hat hanging from the corner of the frame. ${STYLE}`,
  },
  {
    game: 'ruler-hooked',
    key: 'first-catch',
    tier: 1,
    label: 'Hooked',
    message: 'The first fish of your reign. The court pretends not to cheer.',
    tooltip: 'In The Ruler Is Hooked, land your first fish.',
    subtleHint: 'Cast a line between royal duties.',
    icon: 'kind-icon:fish',
    rule: { kind: 'event' },
    artPrompt: `A gleaming silver fish leaping from a calm green lake at the end of a taut fishing line, droplets sparkling in the morning sun, a royal pennant fluttering on the boat behind it. ${STYLE}`,
  },
  {
    game: 'ruler-hooked',
    key: 'tackle-shop',
    tier: 1,
    label: 'Better Tackle',
    message:
      'Royal coin, spent on royal gear. The treasury will understand. Eventually.',
    tooltip: 'In The Ruler Is Hooked, buy a gear upgrade from the shop.',
    subtleHint: 'Coins turn up with your catches.',
    icon: 'kind-icon:toolbox',
    rule: { kind: 'event' },
    artPrompt: `A cozy village tackle shop counter piled with polished reels, bright feathered lures, a new carbon rod and a little crown-shaped bobber, a bell over the door and lake light through the window. ${STYLE}`,
  },
  {
    game: 'ruler-hooked',
    key: 'one-more-cast',
    tier: 1,
    label: 'Just One More Cast',
    message:
      'The kingdom offered you an ending, and you went back to the water instead.',
    tooltip: 'In The Ruler Is Hooked, turn down an ending to keep fishing.',
    subtleHint: 'A reign does not have to end when it could.',
    icon: 'kind-icon:refresh',
    rule: { kind: 'event' },
    artPrompt: `A ruler in a crown and wading boots casting a line from a rowboat at dusk while a herald on the shore waves a rolled-up proclamation, fireflies drifting over the lake and the castle lights coming on. ${STYLE}`,
  },
  {
    game: 'ruler-hooked',
    key: 'legendary-catch',
    tier: 2,
    label: "The One That Didn't Get Away",
    message:
      'You landed a legendary fish. The story will grow with every telling.',
    tooltip: 'In The Ruler Is Hooked, land a legendary or mythic fish.',
    subtleHint: 'Some fish only rise for a patient ruler.',
    icon: 'kind-icon:legendary',
    rule: { kind: 'event' },
    artPrompt: `An enormous shimmering golden fish with fins like royal banners breaking the surface of a misty lake at dawn, ripples glowing, a tiny rowboat with a crowned angler holding on for dear life. ${STYLE}`,
  },
  {
    game: 'ruler-hooked',
    key: 'trophy-catch',
    tier: 2,
    label: 'Mounted Over the Throne',
    message: 'A trophy-quality catch. It deserves a place in the great hall.',
    tooltip: 'In The Ruler Is Hooked, land a trophy-quality fish.',
    subtleHint: 'A clean, careful reel makes a finer fish.',
    icon: 'kind-icon:trophy',
    rule: { kind: 'event' },
    artPrompt: `A magnificent fish mounted on a carved oak plaque above a velvet throne in a castle great hall, banners and candlelight around it, a proud little measuring tape draped over the armrest. ${STYLE}`,
  },
  {
    game: 'ruler-hooked',
    key: 'naturalist',
    tier: 2,
    label: 'Field Naturalist',
    message: 'Half the lake is in your Fishopedia, with notes in the margins.',
    tooltip:
      'In The Ruler Is Hooked, record half of the species in the Fishopedia in one reign.',
    subtleHint: 'Different waters, different fish.',
    icon: 'kind-icon:book-open',
    rule: { kind: 'event' },
    artPrompt: `An open leather field journal on a lakeside rock full of watercolor sketches of colorful fish, half the pages filled and half still blank, a magnifying glass and a pressed water lily beside it. ${STYLE}`,
  },
  {
    game: 'ruler-hooked',
    key: 'scholar',
    tier: 2,
    label: 'Scholar of the Shallows',
    message:
      'Twenty-five correct answers while fishing. The fish are impressed.',
    tooltip:
      'In The Ruler Is Hooked, answer 25 study questions correctly in one subject.',
    subtleHint: 'Study mode lands fish with knowledge.',
    icon: 'kind-icon:lightbulb',
    rule: { kind: 'event' },
    artPrompt: `A scholarly fish in tiny spectacles reading a book on a lily pad while a crowned angler sits on the dock with flash cards of world flags and capitals, a quill and inkpot on the planks. ${STYLE}`,
  },
  {
    game: 'ruler-hooked',
    key: 'arc-elope',
    tier: 2,
    label: 'Love Finds a Way',
    message:
      "The heir's secret sweetheart story is settled, and there is room at the dock for everyone.",
    tooltip:
      "In The Ruler Is Hooked, see the heir's elopement story through to its end.",
    subtleHint: 'The heir has been sneaking out at night.',
    icon: 'kind-icon:heart',
    rule: { kind: 'event' },
    artPrompt: `Three fishing lines in the water from a sunny castle dock, a young heir and their sweetheart sitting beside a smiling crowned ruler, a picnic basket and a ribbon-tied rod between them. ${STYLE}`,
  },
  {
    game: 'ruler-hooked',
    key: 'arc-treaty',
    tier: 2,
    label: 'Ink and Salt',
    message:
      "The foreign envoy's treaty is signed. The fish do not get a vote.",
    tooltip: "In The Ruler Is Hooked, settle the foreign envoy's treaty.",
    subtleHint: 'An envoy is waiting for your terms.',
    icon: 'kind-icon:signature',
    rule: { kind: 'event' },
    artPrompt: `A parchment treaty with a wax seal shaped like a fish on a table by an open castle window overlooking the lake, two quills crossed beside it and a foreign flag and the royal flag hanging together. ${STYLE}`,
  },
  {
    game: 'ruler-hooked',
    key: 'arc-witch',
    tier: 2,
    label: 'A Bargain Kept',
    message: 'You dealt with the bog witch, and both sides kept their word.',
    tooltip: "In The Ruler Is Hooked, finish the bog witch's bargain.",
    subtleHint: 'Something in the fen wants to make a deal.',
    icon: 'kind-icon:magic',
    rule: { kind: 'event' },
    artPrompt: `A friendly bog witch in a moss-green shawl shaking hands with a crowned angler over a misty fen, will-o'-the-wisps glowing, a bubbling cauldron and a basket of fish exchanged between them. ${STYLE}`,
  },
  {
    game: 'ruler-hooked',
    key: 'ending-boomtown',
    tier: 2,
    label: 'Boomtown by the Lake',
    message: 'Progress, at a price. The skyline is very impressive.',
    tooltip:
      'In The Ruler Is Hooked, end your reign with the Boomtown by the Lake ending.',
    subtleHint: 'Prosperity can climb very high.',
    icon: 'kind-icon:construction',
    rule: { kind: 'event' },
    artPrompt: `A bustling lakeside boomtown of brass towers, cranes and smoking workshops crowding the shoreline at sunset, a single small fishing boat drifting in the busy harbor, a warlock's glowing workshop on the hill. ${STYLE}`,
  },
  {
    game: 'ruler-hooked',
    key: 'ending-empire',
    tier: 2,
    label: 'The Thistlewood Empire',
    message: 'An empire, built between casts. The treasury overflows.',
    tooltip:
      'In The Ruler Is Hooked, end your reign with the Thistlewood Empire ending.',
    subtleHint: 'Fill the treasury and keep the realm prosperous.',
    icon: 'kind-icon:castle',
    rule: { kind: 'event' },
    artPrompt: `A grand castle flying many foreign banners beside the royal thistle flag, overflowing treasure chests on the parapets, a satisfied treasurer counting coins and a fishing rod leaning against the throne room balcony. ${STYLE}`,
  },
  {
    game: 'ruler-hooked',
    key: 'fishopedia-complete',
    tier: 3,
    label: 'Royal Ichthyologist',
    message: 'Every species in the lake, caught and recorded in one reign.',
    tooltip:
      'In The Ruler Is Hooked, complete the Fishopedia with every species in one reign.',
    subtleHint: 'Some fish only appear once the kingdom changes.',
    icon: 'kind-icon:collection',
    rule: { kind: 'event' },
    artPrompt: `A royal library wall of framed fish illustrations, every frame filled with a different colorful species, a ladder and a crowned ruler adding the final frame, sunlight through a round window showing the lake. ${STYLE}`,
  },
  {
    game: 'ruler-hooked',
    key: 'fluent',
    tier: 3,
    label: 'Fluent Angler',
    message:
      'One hundred Mandarin answers landed. 好! The lake says hello back.',
    tooltip:
      'In The Ruler Is Hooked, answer 100 Mandarin study questions correctly.',
    subtleHint: 'Turn on the Mandarin subject in the fishing settings.',
    icon: 'kind-icon:language',
    rule: { kind: 'event' },
    artPrompt: `A cheerful angler on a red lacquered bridge over a lotus pond, paper lanterns overhead, a fish leaping beside a stack of hand-drawn study cards, koi gathering in the water below and willow branches swaying. ${STYLE}`,
  },
  {
    game: 'ruler-hooked',
    key: 'ending-grove',
    tier: 3,
    label: "The Angler's Grove",
    message:
      'Your kingdom is a garden. You have caught every fish. Twice. The druids approve.',
    tooltip:
      "In The Ruler Is Hooked, end your reign with The Angler's Grove ending.",
    subtleHint: 'Nature and joy, both running high.',
    icon: 'kind-icon:tree',
    rule: { kind: 'event' },
    artPrompt: `A lush lakeside kingdom grown into a living garden, cottages wrapped in flowering vines, ancient trees leaning over clear water full of fish, druids and villagers fishing together under golden light. ${STYLE}`,
  },
  {
    game: 'ruler-hooked',
    key: 'ending-never-ruled',
    tier: 3,
    label: 'The Ruler Who Never Ruled',
    message:
      'The secret ending. You stopped ruling and just fished, and the kingdom did fine.',
    tooltip: 'In The Ruler Is Hooked, find the secret ending.',
    subtleHint: 'What if you just went fishing? A lot.',
    icon: 'kind-icon:sparkles',
    rule: { kind: 'event' },
    artPrompt: `An empty throne in a sunlit castle hall with a crown left on the cushion, while through the open doors a contented ruler sits fishing on the dock in a straw hat, the kingdom peaceful and happy behind them. ${STYLE}`,
  },
]
