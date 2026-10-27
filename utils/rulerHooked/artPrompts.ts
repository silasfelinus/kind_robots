// utils/rulerHooked/artPrompts.ts
//
// Krea 2 art prompts for every picture The Ruler Is Hooked shows: the opening,
// every event and arc card, the endings, the Fishopedia plates, the cast
// portraits, the coronation portraits, the rewards and the shop. Krea 2 paints
// the nouns it is given, so every prompt names only what is visible: who, where,
// doing what, under what light, from where. Each recurring character is drawn
// from one description in CAST_LOOK, so Vex is the same Vex on every card.
//
// Point of view (conductor art-direction.md, 2026-10-23): the ruler is the
// viewer and appears only in the coronation portraits. Card scenes are seen
// from the royal fishing dock, with the petitioners facing the viewer.

const STYLE =
  'Cartoon storybook painting with soft rounded shapes, loose brown ink lines and warm saturated colours.'

const DOCK =
  'Eye-level view from a wooden lakeside fishing dock, the tip of a bamboo fishing rod in the lower left corner.'

const PLATE =
  'Shown whole in side view on plain cream paper, soft even daylight, hand-painted natural-history watercolour with fine ink outlines.'

const OBJECT =
  'Centred on a plain warm ochre backdrop, soft light from the upper left, close-up still life.'

const SITTER =
  'Head and torso in three-quarter view against a plain warm ochre backdrop, soft light from the left.'

/** One literal description per recurring character, reused everywhere they appear. */
export const CAST_LOOK: Record<string, string> = {
  'steward-quill':
    'Quill, a slim upright steward in his fifties with light brown skin, a neat black bun pierced by a long grey goose quill, round wire spectacles and a dark green high-collared coat with brass buttons',
  'warlock-vex':
    'Vex, a broad well-fed warlock in his forties with olive skin, two short curled black horns, a purple robe open over a mustard waistcoat',
  'druid-sela':
    'Sela, a slight elderly druid woman with dark brown skin, white hair full of twigs and moss, a cloak of overlapping green leaves and bare feet',
  'heir-robin':
    'Robin, a lanky freckled teenager with pale skin and short copper hair, a green travelling jacket and laced brown boots',
  'sweetheart-ash':
    'Ash, a soft broad-shouldered young angler with warm tan skin, shaggy dark hair, patched brown waders and an oversized blue wool coat',
  'envoy-thistle':
    'Thistle, a tall envoy woman with deep brown skin, a high black braided bun, a high-collared plum and silver travelling coat and white gloves',
  'taxman-gristle':
    'Gristle, a thin stooped old tax clerk with grey skin, half-moon spectacles low on his nose and a long black coat',
  'captain-cordelia':
    'Captain Cordelia, a powerfully built middle-aged woman with light brown skin, close-cropped grey hair, dented steel half-armour and a blue tabard',
  'bard-fen':
    'Fen, a small round bard with freckled brown skin, a curly black topknot, mismatched striped and checked layers and a battered lute with a red ribbon',
  'smuggler-brack':
    'Brack, a rangy frog-folk smuggler with mottled green skin, a scruffy grey beard, a long brown oilskin coat and a battered tricorn hat',
  'witch-mossy':
    'Mossy, an enormously round cheerful bog witch with silver-blue skin, long green hair of pond weed and strings of clay beads and little glass bottles across her chest',
  'lake-spirit-nix':
    'Nix, a tall translucent figure of clear lake water with drifting silt, water grass and a few old copper coins turning inside its body, a smooth face with two pale glowing eyes',
}

/** The unnamed boastful noble of the two catch-off cards. */
const RIVAL =
  'a boastful young noble angler with a waxed blond moustache, a crimson doublet and a hat with a long white feather'

const who = (slug: string): string => {
  const look = CAST_LOOK[slug]
  if (!look) throw new Error(`ruler-hooked art: no CAST_LOOK for ${slug}`)
  return look
}

const scene = (text: string, view: string = DOCK) => `${text} ${view} ${STYLE}`

/** Event and arc cards, keyed by card id (their art key is `card-<id>`). */
export const CARD_PROMPTS: Record<string, string> = {
  'warlock-druid-north': scene(
    `${who('warlock-vex')}, grins and unrolls a large blue blueprint across a wooden tackle box on the dock. Behind him at the edge of a pine forest stands ${who('druid-sela')}, holding a tin watering can and waiting. Bright morning light from the left.`,
  ),
  'harvest-festival': scene(
    'A cheerful crowd of villagers in aprons and straw hats gathers at the foot of the dock, holding up a long string of orange and yellow bunting, baskets of apples and pumpkins at their feet, a fiddler playing, and a woman holding a large golden pie out toward the viewer. Warm late afternoon light.',
  ),
  'rival-angler': scene(
    `On the next dock over stands ${RIVAL}, one boot on a crate, pointing a silver-trimmed fishing rod at the viewer and grinning, a large empty wicker creel at his feet. Bright midday sun on a calm blue lake.`,
  ),
  'warlock-return': scene(
    `${who('warlock-vex')}, stands on the dock beaming and holds up a huge unrolled blueprint drawn with rows of barges. Across the lake on the far shore a line of grey barges with purple smokestacks is moored. Flat overcast light.`,
  ),
  'druid-sanctuary': scene(
    `${who('druid-sela')}, kneels on the muddy bank at the end of the dock and presses a small oak sapling into the ground with both hands, a dense wild treeline of oaks and ferns behind her. Dappled green morning light.`,
  ),
  'tax-season': scene(
    `${who('taxman-gristle')}, stands beside the viewer on the dock and holds a huge open leather ledger out toward the viewer, its pages ruled with thin blue lines, his mouth turned down. Grey overcast light over a still lake.`,
  ),
  'guard-captain-wall': scene(
    `${who('captain-cordelia')}, stands at attention on the shore path and points a gloved hand at a half-built grey stone wall behind her, where two guards stack blocks, village rooftops beyond. Cool clear morning light.`,
  ),
  'bard-ballad': scene(
    `${who('bard-fen')}, perches on a mooring post at the end of the dock, strumming the lute with mouth wide open in song and one foot kicking, five ducks watching from the water. Warm afternoon light.`,
  ),
  'smuggler-dock': scene(
    `${who('smuggler-brack')}, leans out of a low flat-bottomed boat tied to the castle dock and lifts the lid of a wooden crate packed with straw and glass bottles, fog drifting over the reeds behind him. Dim grey dawn light.`,
  ),
  'duck-census': scene(
    'A nervous young clerk with a ginger bowl haircut and a brown tunic stands on the bank holding a pencil and a notched wooden tally stick, counting a row of twelve mallard ducks paddling past the dock while a thirteenth duck peeks out of the reeds. Soft morning light.',
  ),
  'rival-angler-2': scene(
    `On the next dock over stands ${RIVAL}, chin raised, gripping an enormous gold-trimmed fishing rod three times his height while two servants in livery hold up its far end. Bright midday light on the lake.`,
  ),
  'robin-ash-garden': scene(
    `${who('heir-robin')}, and ${who('sweetheart-ash')}, kneel side by side in a freshly dug vegetable patch on the lakeshore. Robin holds a crooked tomato seedling, Ash pats soil around a straight one, a watering can between them. Soft warm morning light.`,
  ),
  'nix-riddle': scene(
    `The lake beside the dock lies flat and glassy, and ${who('lake-spirit-nix')}, rises out of the water to the waist and leans toward the viewer with its head tilted. Cool silver-blue light and low mist on the water.`,
  ),
  'sunken-cache': scene(
    `${who('smuggler-brack')}, sits in a rowboat in the middle of the lake holding up a creased chart drawn with coves and dotted lines and points down at the dark water, where a rope with a red float leads under the surface. Late afternoon light and long reflections.`,
  ),
  'golden-hour-catch': scene(
    'The whole lake glows gold at sunset. A taut fishing line runs from the rod tip down into the water, where a huge dark fish twice the length of a rowboat circles just below the shining surface. Low orange sun straight ahead and long golden reflections.',
  ),
  'nix-warning': scene(
    `${who('lake-spirit-nix')}, rises from murky green-brown water beside the dock with lowered brows over its glowing eyes and one arm stretched toward the viewer, dead reeds and grey scum floating around its waist and a smoky far shore behind. Dim green-grey overcast light.`,
  ),
  'elope-1': scene(
    `A wet silver trout lies on the dock planks with a small rolled paper note tied around it by a blue ribbon. In the background ${who('heir-robin')}, runs along the shore path carrying a bundle and glancing back. Pale pink dawn light.`,
  ),
  'elope-blessing': scene(
    `At the end of the dock under strings of paper lanterns, ${who('heir-robin')}, wears a flower crown and holds hands with ${who('sweetheart-ash')}, who holds out a spare fishing rod toward the viewer with a shy hopeful face. Warm golden evening light.`,
  ),
  'elope-defiance': scene(
    'A castle dining hall at dawn: a long oak table set for breakfast with one high-backed chair pushed back and empty, an untouched plate before it, an empty coat hook on the wall, and through the open window behind it a small white sailboat leaving across the lake.',
    'Cool pale dawn light through the window, eye-level view from the head of the table.',
  ),
  'envoy-1': scene(
    `At the castle gate stands ${who('envoy-thistle')}, holding a long rolled scroll with a heavy red wax seal and smiling politely at the viewer. Behind her shoulder ${who('taxman-gristle')}, peers at the scroll with narrowed eyes. Bright midday light and blue pennants on the gatehouse.`,
    'Eye-level view from the castle steps.',
  ),
  'envoy-generous': scene(
    `Under an open-air pavilion beside the lake, ${who('envoy-thistle')}, lays a long parchment with a dangling red ribbon and a wax seal across a wooden table and taps the bottom of it with one gloved finger, lips moving as she counts. Warm afternoon light.`,
    'Eye-level view from across the table, a quill pen and inkpot in the lower left corner.',
  ),
  'envoy-tough': scene(
    `Across a wooden table under a lakeside pavilion, ${who('envoy-thistle')}, sits stiffly with arms folded and a thin tight smile, while beside her ${who('taxman-gristle')}, stands grinning broadly with a huge open ledger. Cool late afternoon light.`,
    'Eye-level view from across the table, a quill pen and inkpot in the lower left corner.',
  ),
  'bog-1': scene(
    `${who('witch-mossy')}, stands knee-deep in a reedy bog at the lake edge and holds out an open palm toward the viewer with a wide grin. On the bank behind her ${who('captain-cordelia')}, stands with arms crossed and a frown. Hazy green afternoon light and fireflies in the reeds.`,
  ),
  'bog-accept': scene(
    `Thick flowering vines climb the whole treeline across the lake, enormous purple and white blossoms open on every branch. ${who('witch-mossy')}, sits humming on a stump among the vines while two castle guards with lanterns stare up at them. Blue twilight with glowing flowers.`,
  ),
  'bog-refuse': scene(
    `${who('captain-cordelia')}, stands on the dock with relaxed shoulders and her helmet tucked under one arm, smiling slightly, while thin white mist drifts over an empty bog at the lake edge behind her. Soft early evening light.`,
  ),
  'vex-model-village': scene(
    `${who('warlock-vex')}, sets a large wooden scale model on a tackle box on the dock: rows of identical tiny white cottages with little balconies climbing a green wooded hillside. He spreads his hands wide and smiles. Bright midday light.`,
  ),
  'sela-tree-sit': scene(
    `On a hillside above rows of new white cottages, ${who('druid-sela')}, sits against the trunk of a huge old oak with an iron chain around her waist and her arms folded. At the foot of the oak ${who('captain-cordelia')}, looks up at her, and builders eat lunch on a pile of timber. Warm afternoon light.`,
    'Wide view from the lake shore.',
  ),
  'lake-watch': scene(
    `${who('captain-cordelia')}, stands at the end of the dock at night holding up a brass lantern and pointing across the lake, where a line of small rowboats with lanterns floats on the dark water. Deep blue moonlight with warm lantern glow.`,
  ),
  'brack-lures': scene(
    `${who('smuggler-brack')}, crouches on the dock beside an open wooden crate full of shining fishing lures in gold, silver and bright enamel, each in a twist of paper, and holds up a gold fish-shaped lure toward the viewer with a wink. Soft grey morning light.`,
  ),
  'brack-trial': scene(
    `${who('smuggler-brack')}, stands at the end of the dock with iron cuffs on his wrists, gripping a fishing rod in both hands and grinning, while ${who('captain-cordelia')}, holds the end of his chain and frowns. Villagers watch from the shore. Bright morning light.`,
  ),
  'thistle-fish-exports': scene(
    `${who('envoy-thistle')}, stands on the dock with her white gloves tucked into her belt, holding a silver fish up by the tail in one bare hand and pointing at the far shore, where long foreign fishing nets hang on poles over the water. Cool bright morning light.`,
  ),
  'fish-tithe': scene(
    `${who('taxman-gristle')}, stands at the end of the dock beside a set of brass weighing scales piled with small fish and holds out an open hand toward the viewer, a wooden bucket of fish at his feet. Flat grey overcast light.`,
  ),
  'fen-satire': scene(
    `In a cobbled village square, ${who('bard-fen')}, stands on an upturned barrel singing with the lute raised high, while a crowd of laughing villagers in aprons and caps sing along, one man stretching his arms in a huge pretend yawn. Warm afternoon light.`,
    'Eye-level view from the edge of the crowd.',
  ),
  'mossy-price': scene(
    `${who('witch-mossy')}, stands on the dock holding out an empty wicker basket toward the viewer with a broad grin, a thin crescent moon low in the evening sky behind her and flowering vines covering the far treeline. Violet dusk light.`,
  ),
  'public-dock': scene(
    `${who('sweetheart-ash')}, stands on the shore holding a flat cap in both hands and looking hopefully at the viewer. Behind Ash an old grey village dock with missing planks sticks out into the lake, and village children sit on the bank with fishing poles. Warm morning light.`,
  ),
  'vex-sela-truce': scene(
    `${who('warlock-vex')}, and ${who('druid-sela')}, stand together on the dock holding opposite ends of one long blueprint drawn with a wooden lodge among trees and gardens on its roofs, Vex smiling broadly and Sela smiling stiffly. Bright morning light.`,
  ),
  'quill-day-off': scene(
    `${who('steward-quill')}, stands on the dock with a thick bundle of papers tied with string under one arm and a straw sun hat in his other hand, smiling with embarrassment. Soft morning light on a calm lake.`,
  ),
  'nix-old-name': scene(
    `${who('lake-spirit-nix')}, rises out of the dark water at the end of the dock under a starry sky and holds out cupped watery hands toward the viewer, a small glowing white pearl resting in them. Cool blue moonlight and mist on the water.`,
  ),
  'drowned-surface': scene(
    'Beside a small village dock, dozens of pale bloated carp float belly-up on murky green water while a few have rolled over and begun to swim away. Villagers in aprons crowd the dock edge, pointing and holding their noses. Grey overcast light.',
  ),
  'heron-delegation': scene(
    'Seven tall grey herons stand in a neat row along the dock planks, each on one leg, all facing the viewer, the tallest heron in front with a silver fish lying at its feet. Reed beds and calm water behind them. Soft golden morning light.',
  ),
}

/** Character portraits, keyed by cast slug (neutral expression). */
export const CHARACTER_PROMPTS: Record<string, string> = Object.fromEntries(
  (
    [
      [
        'steward-quill',
        'holds a slim green ledger against his chest with both hands, calm attentive face, a ring of iron keys at his belt',
      ],
      [
        'warlock-vex',
        'holds out a small paper business square between two fingers with a warm easy smile, a rolled blue blueprint under the other arm',
      ],
      [
        'druid-sela',
        'raises one finger mid-lecture with a serene smile, a tin watering can in her other hand',
      ],
      [
        'heir-robin',
        'grins sideways with a thin gold circlet poking out of a jacket pocket and a travelling bundle over one shoulder',
      ],
      [
        'sweetheart-ash',
        'cradles a wooden bucket with two fish in it and talks to them with a soft nervous smile',
      ],
      [
        'envoy-thistle',
        'stands with gloved hands folded and chin lifted, lips pressed together, a rolled scroll with a red seal tucked under one arm',
      ],
      [
        'taxman-gristle',
        'holds a huge open leather ledger across both forearms and sighs with heavy eyelids',
      ],
      [
        'captain-cordelia',
        'stands at rigid attention and rubs one round steel pauldron with her thumb',
      ],
      [
        'bard-fen',
        'strums the lute mid-song with mouth open and eyebrows raised high',
      ],
      [
        'smuggler-brack',
        'squints off to one side with one hand shading his eyes and a small wooden crate under his other arm',
      ],
      [
        'witch-mossy',
        'holds out a glowing green glass jar with a cheerful open-mouthed grin',
      ],
      [
        'lake-spirit-nix',
        'stands waist-deep in dark still water with its head tilted, small ripples circling it',
      ],
    ] as const
  ).map(([slug, pose]) => [slug, `${who(slug)}, ${pose}. ${SITTER} ${STYLE}`]),
)

/** The three opening beats, in order. */
export const OPENING_PROMPTS: string[] = [
  `A small tidy grey stone castle with two short round towers on a green lawn beside a calm blue lake, a vegetable garden of cabbages and bean poles, a laundry line of white sheets, and a wooden fishing dock reaching into the water, one blue pennant on a tower. Warm morning sun from the left, wide view across the lawn. ${STYLE}`,
  `The far bank of a wide calm lake seen across the water: untouched reed beds, a grey heron standing in the shallows, willow trees and a dark green forest edge, low blue hills behind. Clear midday light from the left, wide view at water level. ${STYLE}`,
  CHARACTER_PROMPTS['steward-quill']!,
]

/** Ending illustrations, keyed by outcome key. Wide landscapes; the ruler stays out of view. */
export const ENDING_PROMPTS: Record<string, string> = {
  'druid-utopia': `A lakeside kingdom grown into one huge garden: flowering orchards and wild meadows run down to the water, a small mossy stone castle covered in ivy, herons and otters in the shallows, and a wooden fishing dock with a resting fishing rod and an overflowing basket of bright fish. Warm golden late afternoon light, wide view from the lake. ${STYLE}`,
  'warlock-metropolis': `A lakeside boomtown: crooked brick towers, purple-roofed warehouses, cranes and smokestacks puffing lavender smoke along the far shore, barges crowding the water, and in the foreground a small wooden fishing dock with a tin bucket holding one tiny fish. Hazy orange sunset light, wide view. ${STYLE}`,
  'thistlewood-empire': `A lakeside castle trimmed in gold, its towers hung with plum and silver foreign banners beside blue ones, wagon caravans streaming along the shore road, open chests of gold coins stacked on the dock, and a thin stooped old tax clerk in a black coat grinning on the castle steps. Bright clear midday light, wide view. ${STYLE}`,
  'fishers-peace': `A quiet lakeside dock at dawn with a worn cushioned chair, a fishing rod propped against it and a full basket of fish, a gold crown hanging on a mooring post, and beyond it the village and castle with chimney smoke rising and two rowboats on the water. Soft pink and gold dawn light, wide view. ${STYLE}`,
}

/** Fishopedia plates, keyed by species slug. */
export const FISH_PROMPTS: Record<string, string> = Object.fromEntries(
  (
    [
      [
        'choirfish',
        'Three slender pale blue fish with long ribbon fins swim in a rising diagonal line, each throat glowing a different colour: gold, rose and teal.',
      ],
      [
        'sunspoke-koi',
        'A deep-bodied white and orange koi with six long clear glassy fins spread around its body, small bands of rainbow light falling through the fins.',
      ],
      [
        'orchardjaw-perch',
        'A chunky green-striped perch with a wide jaw and a thick mossy back carrying three miniature flowering apple trees hung with tiny red apples.',
      ],
      [
        'bridgeback-sturgeon',
        'An enormous silver sturgeon with a long whiskered snout and a row of broad flat grey stone scutes forming steps along its back, two small green frogs and a mallard riding on the scutes.',
      ],
      [
        'crown-of-reeds-pike',
        'An immense pale green-white pike with a long toothy jaw and a crown of tall living reeds, white water lilies and a tiny bird nest with two small birds growing from the top of its head.',
      ],
      [
        'parlour-rustfish',
        'A small cheerful rust-orange goldfish with a flowing double tail, shining coppery scales and round black eyes.',
      ],
      [
        'errand-guppy',
        'A tiny bright yellow and turquoise guppy with a fan tail, carrying a small brass key in its mouth.',
      ],
      [
        'moebius-crab',
        'A small red hermit crab with raised claws carrying a pearly orange shell twisted into one continuous looping ribbon with a single half twist.',
      ],
      [
        'masquerade-ray',
        'A broad violet freshwater ray seen from above, the white and gold pattern on its back shaped into a theatrical half-mask with two eye holes, long trailing ribbon fins.',
      ],
      [
        'tollbell-sturgeon',
        'A long bronze-grey sturgeon with a pointed whiskered snout and a row of hollow bronze bell-shaped scutes down its flank.',
      ],
      [
        'drowned-carp',
        'A bloated pale translucent carp with ragged torn fins, faint grey bones visible through its skin, cloudy white eyes and an open mouth.',
      ],
      [
        'lamplight-angler',
        'A rotund dark brown anglerfish with a huge underbite of needle teeth and a drooping stalk on its forehead ending in a bright yellow glowing bulb inside a small iron cage.',
      ],
      [
        'ashbelly-gar',
        'A long black armoured gar with sooty plated scales, a glowing furnace-orange belly and short chimney-shaped gill vents puffing a ring of grey smoke.',
      ],
      [
        'tithe-lamprey',
        'A thick black and gold lamprey with a round open sucker mouth ringed by gold coin-shaped teeth, patches of stolen silver and gold fish scales stuck along its body.',
      ],
      [
        'the-pleasant-island',
        'A small sunny island with three palm trees and white sand sits on the lake, and below the waterline, cut away in cross-section, an enormous dark green monster with huge round eyes and long tentacles holds the island up on its back.',
      ],
    ] as const
  ).map(([slug, look]) => [slug, `${look} ${PLATE}`]),
)

/** Coronation portraits for the twelve playable rulers, keyed by preset id. */
export const RULER_PROMPTS: Record<string, string> = Object.fromEntries(
  (
    [
      [
        'king-osric',
        'A plump smiling middle-aged king with deep brown skin and grey-streaked locs, a slightly too large gold crown tipped to one side, a red velvet robe',
      ],
      [
        'queen-mabel',
        'A tall broad-shouldered queen in her fifties with close-cropped silver hair under a slim gold circlet, an embroidered green fishing coat over blue royal robes',
      ],
      [
        'sovereign-wren',
        'A lanky young androgynous monarch with dark hair shaved at the sides, a gold circlet hung loose around the throat, patched waders under a short crimson half-cape',
      ],
      [
        'regent-halvard',
        'A very old wiry monarch with a long white beard tucked into a belt, swimming in purple robes several sizes too big, a folding stool under one arm and a thermos in the other hand',
      ],
      [
        'matriarch-oshun',
        'A short round queen with a huge coiled crown of braided black hair with a small gold crown perched on top, beaded rings on every finger and a gold and orange robe',
      ],
      [
        'chieftain-brakka',
        'A powerfully built orc monarch with moss-green skin, small tusks, a crown of shed antlers and thick muscled forearms, a fur-trimmed brown cloak',
      ],
      [
        'heron-queen-sedge',
        'A tall heron-folk queen with soft grey-blue feathers and a long neck, a small gold crown between two white head plumes, standing on one leg in a silver robe',
      ],
      [
        'little-monarch-pip',
        'A tiny grey mouse-folk monarch with an oversized gold crown resting on both ears, sitting on a stack of thick leather ledgers in a little blue cape',
      ],
      [
        'boy-king-tobin',
        'A small boy king of about eight with a mop of red hair and a gold crown much too big for him pushed back off his forehead, sitting on a tall throne with his feet dangling',
      ],
      [
        'girl-queen-marisol',
        'A small girl queen of about nine with two tight dark buns, a gap-toothed frown of concentration and a gold crown fixed in place with hairpins',
      ],
      [
        'cub-prince-bramble',
        'A round shaggy brown bear-cub child prince with a circlet of woven green river reeds, holding a tiny fishing reel in two big paws',
      ],
      [
        'elder-tortoise-yew',
        'An ancient tortoise-folk sovereign with a mossy green shell, a kindly wrinkled face and a smooth worn gold crown, leaning on a wooden staff',
      ],
    ] as const
  ).map(([id, look]) => [
    id,
    `${look}, standing alone in a sunlit stone throne room on coronation day, full-length view with rich ceremonial fabric. ${STYLE}`,
  ]),
)

/** Reward keepsakes, keyed by reward slug. */
export const REWARD_PROMPTS: Record<string, string> = Object.fromEntries(
  (
    [
      [
        'druid-charm',
        'A small woven charm of braided river reeds and green twine with a polished acorn and a single blue feather bound into it.',
      ],
      [
        'gilded-lure',
        'An ornate gold fishing lure shaped into a fat little fish with a jewelled red eye and three barbed hooks.',
      ],
      [
        'buildpermit-scroll',
        'A stiff cream scroll half unrolled, its face covered in ruled boxes and inked squiggle patterns, with a heavy blob of purple wax seal at the bottom.',
      ],
      [
        'treaty-seal',
        'A heavy plum-red wax seal disc on a trailing silver ribbon, two clasped hands pressed into the wax.',
      ],
      [
        'smugglers-map',
        'A creased weathered chart covered in wandering ink coastlines, dotted route lines, tiny drawn coves and small red crosses.',
      ],
      [
        'mossy-hex',
        'A knobbly brown clay bottle stoppered with cork and moss, wrapped in clay beads and dried herbs, a faint green glow inside it.',
      ],
      [
        'captains-pin',
        'A dented brass pin in the form of a lake perch crossed with a spear, its blue enamel chipped and the brass polished bright.',
      ],
      [
        'bards-ballad',
        'A rolled sheet of song parchment tied with red string, its face covered in inked staves, dots and swirling flourishes.',
      ],
      [
        'nix-pearl',
        'A single enormous rainbow-sheened freshwater pearl resting in an open oyster shell, with fine silt and two tiny old copper coins beside it.',
      ],
    ] as const
  ).map(([slug, look]) => [slug, `${look} ${OBJECT} ${STYLE}`]),
)

/** Shop gear and kingdom upgrades, keyed by catalog id. */
export const SHOP_PROMPTS: Record<string, string> = {
  'reinforced-rod': `A sturdy fishing rod of dark ash wood wrapped with bands of brass wire and fitted with a heavy brass reel, lying across a wooden shop counter beside coils of line and a box of hooks. Warm lamplight from the left, close-up still life. ${STYLE}`,
  'silk-line': `A spool of fine pale gold silk fishing line wound on a carved wooden reel, one loose shining strand trailing across a green felt counter. ${OBJECT} ${STYLE}`,
  'balanced-lure': `A small hand-carved wooden fishing lure painted with red and white stripes, a tiny brass weight under its belly and two hooks, resting on a little brass stand. ${OBJECT} ${STYLE}`,
  'riverbank-market': `A row of striped canvas market stalls along a grassy riverbank beside a lake, baskets of fish, bread and apples on the counters, villagers in aprons bargaining and rowboats tied up at the bank. Bright midday light, wide view. ${STYLE}`,
  'lakeside-shrine': `A small round stone shrine with a mossy domed roof on a grassy point by a lake, flowers, smooth river stones and lit candles on its step, a carved stone fish on top of the dome. Soft early morning light and mist on the water. ${STYLE}`,
  'festival-fund': `A village green beside a lake strung with paper lanterns and coloured bunting, a wooden bandstand with two fiddlers, and a heavy leather coin purse spilling gold coins on a trestle table in the foreground. Warm dusk light. ${STYLE}`,
  'watch-patrol': `Two castle guards in blue tabards and steel caps walk a gravel road along a lake carrying lanterns and spears, a shaggy guard dog trotting ahead of them. Blue dusk light with warm lantern glow. ${STYLE}`,
}

/** The authored prompt for one Playbook beat key, or undefined when none is written. */
export function rulerHookedArtPrompt(key: string): string | undefined {
  const [kind, id = ''] = key.split(/:(.*)/s)
  switch (kind) {
    case 'opening':
      return OPENING_PROMPTS[Number(id) - 1]
    case 'card':
      return CARD_PROMPTS[id]
    case 'ending':
      return ENDING_PROMPTS[id]
    case 'fish':
      return FISH_PROMPTS[id]
    case 'character':
      return CHARACTER_PROMPTS[id]
    case 'ruler':
      return RULER_PROMPTS[id]
    case 'reward':
      return REWARD_PROMPTS[id]
    case 'shop':
      return SHOP_PROMPTS[id]
    default:
      return undefined
  }
}
