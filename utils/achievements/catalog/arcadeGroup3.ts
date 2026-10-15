// Arcade achievements, group 3: rain-catcher, brick-bloom, seed-lander, pixel-hop, glitch-garden, quilt-quest, cocoa-counter, seed-burst.
import type { GameAchievementDef } from '../gameAchievements'

export const GROUP_3: GameAchievementDef[] = [
  {
    game: 'rain-catcher',
    key: 'storm-shelter',
    tier: 1,
    label: 'Storm Shelter!',
    message:
      'Two storms weathered, and your seedlings are still reaching for the sun.',
    tooltip: 'Reach Wave 3 in one game of Rain Catcher.',
    subtleHint:
      'The clouds run out of hail before a careful catcher runs out of umbrellas.',
    icon: 'kind-icon:raindrop',
    rule: { kind: 'level', min: 3 },
    artPrompt:
      'A centered badge-like hero moment: three cheerful sprout launchers on a hillside fire a ring of rainbow umbrella bursts into a stormy dusk sky, icy hailstones bouncing harmlessly off the bright canopies while a row of tiny seedlings below lifts its leaves toward a peeking moon, clear bold silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'rain-catcher',
    key: 'umbrella-virtuoso',
    tier: 2,
    label: 'Umbrella Virtuoso',
    message:
      'Fifteen thousand points of caught hail, and the thunder-goose is starting to take it personally.',
    tooltip: 'Score 15,000 points in one game of Rain Catcher.',
    subtleHint:
      'Later waves multiply every catch, so the deeper storms pay the best.',
    icon: 'kind-icon:rainbow',
    rule: { kind: 'score', min: 15000 },
    artPrompt:
      'A centered emblem scene: a grumpy grey thunder-goose tumbling backward in a puff of feathers as a giant rainbow umbrella burst blooms right in front of its beak, scattered hailstones frozen mid-air and glittering, six little seedling beds safe and green on the hills below a swirling indigo storm. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'rain-catcher',
    key: 'eye-of-the-storm',
    tier: 3,
    label: 'Eye of the Storm',
    message:
      'Ten waves of hail, geese and lightning sprites, and the garden is still growing.',
    tooltip: 'Reach Wave 10 in one game of Rain Catcher.',
    subtleHint:
      'Lightning sprites swerve around blooms; catch them where they dodge to.',
    icon: 'kind-icon:storm',
    rule: { kind: 'level', min: 10 },
    artPrompt:
      'A heroic centered badge: a tall sprout launcher stands defiant in the calm eye of a towering spiral storm, zigzagging golden lightning sprites caught in a crown of overlapping rainbow umbrella bursts, hailstones raining around the edges, six seedling beds blooming into flowers at its feet under a bright moon. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },

  {
    game: 'brick-bloom',
    key: 'first-bloom',
    tier: 1,
    label: 'First Bloom!',
    message:
      'Every crate in your first wall cracked open and burst into flowers.',
    tooltip: 'Clear the first wall (reach Stage 2) in one game of Brick Bloom.',
    subtleHint:
      'Hit the ball with the paddle edge to send it into the corners.',
    icon: 'kind-icon:sprout',
    rule: { kind: 'level', min: 2 },
    artPrompt:
      'A centered badge-like moment inside a glowing glasshouse at dusk: a cheerful paddle bot looks up as the last glitch crate of a wall shatters, a glowing pollen ball arcing away and a fountain of pink, gold and lilac flowers spilling from the broken crates, petals drifting down onto a little flower bed. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'brick-bloom',
    key: 'pollen-chain',
    tier: 2,
    label: 'Pollen Powerhouse',
    message:
      'Thirty thousand points of crate-cracking, chain after blooming chain.',
    tooltip: 'Score 30,000 points in one game of Brick Bloom.',
    subtleHint:
      'Crates cracked before the ball comes home pay more with every link.',
    icon: 'kind-icon:crate',
    rule: { kind: 'score', min: 30000 },
    artPrompt:
      'A centered emblem: a white-hot pollen ball ricochets through a wall of glitch crates in a dazzling zigzag, each crate it touches bursting into a bigger flower than the last, a delighted paddle bot below and a fuzzy bumblebee helper buzzing beside it, glasshouse panes glittering overhead. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'brick-bloom',
    key: 'cage-breaker',
    tier: 3,
    label: 'Cage Breaker',
    message:
      'Eight walls bloomed, and you rolled right up to the Bolted Cages.',
    tooltip: 'Reach Stage 9, the Bolted Cages, in one game of Brick Bloom.',
    subtleHint: 'Bolted crates never break, so learn the angles around them.',
    icon: 'kind-icon:trophy',
    rule: { kind: 'level', min: 9 },
    artPrompt:
      'A heroic centered badge: a determined paddle bot sends a blazing pollen ball through a gap in a cage of steel-bolted crates, flowers erupting from the crates inside while the unbreakable bolts gleam, a grumpy gloom puff swept aside in a gust of petals, moonlit glasshouse arching above. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },

  {
    game: 'seed-lander',
    key: 'soft-touchdown',
    tier: 1,
    label: 'Soft Touchdown!',
    message:
      'Your seed pod set down soft and level, and the hillside sprouted its first blooms.',
    tooltip: 'Score 3,000 points in one game of Seed Lander.',
    subtleHint: 'When every gauge turns green, the ground is ready for you.',
    icon: 'kind-icon:sprout',
    rule: { kind: 'score', min: 3000 },
    artPrompt:
      'A centered badge-like moment: a little round seed pod with a leafy cap settles feather-soft onto a tilled garden bed on a windy floating hillside, tiny puffs of golden sunlight under it, a fresh flower bursting open beside its feet, sunflowers swaying nearby against a sky of drifting clouds. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'seed-lander',
    key: 'scarecrow-shooed',
    tier: 2,
    label: 'Scarecrow Shooed!',
    message:
      'Meadow Isle is replanted and the Old Scarecrow has taken a well-earned nap.',
    tooltip:
      'In Seed Lander, beat the Old Scarecrow to replant Meadow Isle, or reach Hill 7 in Free Flight.',
    subtleHint:
      'Even a scarecrow can be a garden bed, if you land on the right spot.',
    icon: 'kind-icon:wind',
    rule: { kind: 'level', min: 7 },
    artPrompt:
      'A centered emblem scene: a tall patchwork Old Scarecrow on a floating meadow island slumps into a sleepy smile as flowers bloom across its straw shoulders and hat brim, a small seed pod with a leafy cap hovering triumphantly above on puffs of sunlight, golden acorns sparkling around them. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'seed-lander',
    key: 'great-replanting',
    tier: 3,
    label: 'The Great Replanting',
    message:
      'The Gale Mill is calm and both sky islands are blooming again, thanks to you.',
    tooltip:
      'In Seed Lander, beat the Gale Mill to replant both sky islands, or reach Hill 13 in Free Flight.',
    subtleHint: 'Ride the gusts instead of fighting them.',
    icon: 'kind-icon:crown',
    rule: { kind: 'level', min: 13 },
    artPrompt:
      'A heroic centered badge: a tiny seed pod with a leafy cap lands perfectly on the hub of a giant stormy windmill whose sails slow to a gentle stop and sprout vines and flowers, two floating sky islands bursting into full bloom below, swirling wind ribbons turning into petals. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },

  {
    game: 'pixel-hop',
    key: 'fresh-coat',
    tier: 1,
    label: 'Fresh Coat!',
    message:
      'Pip hopped the pyramid into its target colours, tile after shining tile.',
    tooltip: 'Score 3,000 points in one game of Pixel Hop.',
    subtleHint: 'Every round cleared pays more than the one before.',
    icon: 'kind-icon:platform',
    rule: { kind: 'score', min: 3000 },
    artPrompt:
      'A centered badge-like moment: Pip, a round tangerine pixel-bot with a snorkel nose and big purple sneakers, leaps joyfully off the top of a stepped pyramid of cubes whose tops have all just flipped to one bright matching colour, paint sparkles bursting from every tile, a starry sky behind. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'pixel-hop',
    key: 'double-hop-pro',
    tier: 2,
    label: 'Double-Hop Pro',
    message:
      'Eight pyramids painted, two-hop tiles included, and Boing never caught you.',
    tooltip: 'Reach Level 3 in one game of Pixel Hop.',
    subtleHint:
      'A floating disc at the right moment sends a grumpy spring bot over the edge.',
    icon: 'kind-icon:rainbow',
    rule: { kind: 'level', min: 3 },
    artPrompt:
      'A centered emblem scene: Pip, a round tangerine pixel-bot with big purple sneakers, rides a spinning rainbow disc up into the sky while Boing, a grumpy purple head on a steel spring, boings helplessly off the edge of a colourful cube pyramid below, bouncing gumballs scattering. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'pixel-hop',
    key: 'flip-flop-master',
    tier: 3,
    label: 'Flip-Flop Master',
    message:
      'Two hops a tile, finished tiles flipping back, and you painted them all anyway.',
    tooltip: 'Reach Level 5 in one game of Pixel Hop.',
    subtleHint:
      'When finished tiles flip back, plan a path that never steps twice.',
    icon: 'kind-icon:crown',
    rule: { kind: 'level', min: 5 },
    artPrompt:
      'A heroic centered badge: Pip, a round tangerine pixel-bot with a snorkel nose and big purple sneakers, strikes a victory pose atop a gleaming cube pyramid painted in perfect rainbow rows, a sneaky repaint gremlin caught dangling by its paintbrush, frozen green gumballs glittering around the base. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },

  {
    game: 'glitch-garden',
    key: 'worm-fixed',
    tier: 1,
    label: 'Glitch Fixed!',
    message:
      'Every segment of the first glitch-worm dropped out as a happy little sprout.',
    tooltip:
      'Fix the whole first glitch-worm (reach Wave 2) in one game of Glitch Garden.',
    subtleHint: 'Fix a segment in the middle and the worm splits in two.',
    icon: 'kind-icon:sprout',
    rule: { kind: 'level', min: 2 },
    artPrompt:
      'A centered badge-like moment: a little gardening bot with a nozzle on top, lamp eyes and rolling treads sprays a glowing fix-it beam upward, and a long pixelated glitch-worm dissolves segment by segment into rows of fresh green sprouts among glowing mushroom lamps in a twilight garden. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'glitch-garden',
    key: 'garden-guardian',
    tier: 2,
    label: 'Garden Guardian',
    message:
      'Worms fixed, the beetle shooed and the moth turned home: the flowerbed is yours.',
    tooltip: 'Score 6,000 points in one game of Glitch Garden.',
    subtleHint: 'The beetle pays most when it wanders closest to your nozzle.',
    icon: 'kind-icon:wand',
    rule: { kind: 'score', min: 6000 },
    artPrompt:
      'A centered emblem scene: a brave gardening bot with lamp eyes and rolling treads stands in a flowerbed, its fix-it beam sparkling into a zig-zagging beetle that turns into a shower of petals, a dusty moth fluttering away overhead, glitchy mushroom lamps blooming into flowers all around. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'glitch-garden',
    key: 'full-bloom',
    tier: 3,
    label: 'Garden in Full Bloom',
    message:
      'Ten waves of glitch-worms fixed, and the garden glows with flowers where the lamps once flickered.',
    tooltip: 'Reach Wave 10 in one game of Glitch Garden.',
    subtleHint:
      'A crowded garden brings the worm down faster, so keep the lamps blooming.',
    icon: 'kind-icon:trophy',
    rule: { kind: 'level', min: 10 },
    artPrompt:
      'A heroic centered badge: a triumphant gardening bot with a nozzle on top raises its spray beam like a torch as several split glitch-worms and loose worm heads burst into a whirlwind of blossoms, the whole garden of mushroom lamps transformed into a glowing field of flowers under a starry sky. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },

  {
    game: 'quilt-quest',
    key: 'first-quilt',
    tier: 1,
    label: 'First Quilt!',
    message: 'Patch by colourful patch, you stitched your very first quilt.',
    tooltip:
      'Finish your first quilt (reach Quilt 2) in one game of Quilt Quest.',
    subtleHint:
      'Keep moving mid-stitch, or the fuse starts unpicking your thread.',
    icon: 'kind-icon:gem',
    rule: { kind: 'level', min: 2 },
    artPrompt:
      'A centered badge-like moment: a shiny steel needle-bot pulls a final golden thread taut across a quilt that blooms into bright patchwork squares of pink, teal and gold, a fluffy tangle sprite spinning away confused in the last open corner, tiny sparkles along every seam. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'quilt-quest',
    key: 'double-stitch',
    tier: 2,
    label: 'Double-Stitch Darling',
    message: 'Twenty thousand points of patient, double-paying slow stitches.',
    tooltip: 'Score 20,000 points in one game of Quilt Quest.',
    subtleHint:
      'Slow stitches pay double, and every percent past the target pays a bonus.',
    icon: 'kind-icon:sparkles',
    rule: { kind: 'score', min: 20000 },
    artPrompt:
      'A centered emblem scene: a needle-bot glowing rose-pink takes a slow, careful stitch across a vast patchwork quilt, a huge new patch filling with colour behind its thread, crackling sparks racing harmlessly along the outer seams and a tangle sprite pouting in a shrinking corner. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'quilt-quest',
    key: 'heirloom-quilter',
    tier: 3,
    label: 'Heirloom Quilter',
    message:
      'Five quilts finished through tangles and racing sparks: a true family heirloom.',
    tooltip: 'Reach Quilt 6 (finish five quilts) in one game of Quilt Quest.',
    subtleHint:
      'More tangles mean smaller gaps; split them apart with one bold line.',
    icon: 'kind-icon:crown',
    rule: { kind: 'level', min: 6 },
    artPrompt:
      'A heroic centered badge: a proud needle-bot stands atop a tall stack of finished patchwork quilts, a final masterpiece quilt unfurling behind it like a cape, three tangle sprites and a crackle of edge sparks tied up neatly in a bow of golden thread at its feet. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },

  {
    game: 'cocoa-counter',
    key: 'first-round',
    tier: 1,
    label: 'Cocoa for Everyone!',
    message: 'Every thirsty robot in your first round went home warm and cosy.',
    tooltip: 'Clear Round 1 (reach Round 2) in one game of Cocoa Counter.',
    subtleHint:
      'A mug sent down an empty counter has nowhere to go but the floor.',
    icon: 'kind-icon:heart',
    rule: { kind: 'level', min: 2 },
    artPrompt:
      'A centered badge-like moment: a cheerful mug-bot behind a long polished counter slides a steaming mug of cocoa toward a row of delighted little robots, swirls of steam curling into heart shapes, a warm glowing cocoa urn beside it and cosy lamplight over the cafe. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'cocoa-counter',
    key: 'tip-jar-hero',
    tier: 2,
    label: 'Tip Jar Hero',
    message:
      'Twelve thousand points of pours, catches and tips, and not a drop wasted.',
    tooltip: 'Score 12,000 points in one game of Cocoa Counter.',
    subtleHint: 'Tips wait on the counter, but not forever.',
    icon: 'kind-icon:coin',
    rule: { kind: 'score', min: 12000 },
    artPrompt:
      'A centered emblem scene: a nimble mug-bot leaps along a cocoa counter catching an empty mug in one hand and scooping a glittering gold coin tip in the other, a happy robot customer gliding out the cafe door behind, four long counters stretching away. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'cocoa-counter',
    key: 'rush-hour',
    tier: 3,
    label: 'Rush Hour Barista',
    message:
      'Seven rounds of ever-thirstier robots, served without missing a beat.',
    tooltip: 'Reach Round 8 in one game of Cocoa Counter.',
    subtleHint:
      'Thirstier crowds slide more empties back; never leave the urn end unguarded.',
    icon: 'kind-icon:trophy',
    rule: { kind: 'level', min: 8 },
    artPrompt:
      'A heroic centered badge: a mug-bot whirls between four packed cocoa counters at once, a fan of steaming mugs sliding out in perfect lines toward crowds of colourful thirsty robots, empty mugs arcing back into its waiting hands, golden steam swirling into a starburst overhead. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },

  {
    game: 'seed-burst',
    key: 'first-flutter',
    tier: 1,
    label: 'First Flutter!',
    message:
      'Your seed pods burst into blooms and the grumpy gnats fluttered off as butterflies.',
    tooltip: 'Score 2,000 points in one game of Seed Burst.',
    subtleHint:
      'Plant, then step clear: blooms are friendly to gnats, not gardeners.',
    icon: 'kind-icon:butterfly',
    rule: { kind: 'score', min: 2000 },
    artPrompt:
      'A centered badge-like moment: a little gardener bot peeks around a leafy hedge as its seed pod bursts into a bright cross of blooms down a maze path, a grumpy gnat caught in the petals transforming into a sparkling rainbow butterfly, flowers spilling over the hedges. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'seed-burst',
    key: 'hedge-maze-hero',
    tier: 2,
    label: 'Hedge Maze Hero',
    message: 'Four whole gardens bloomed and not a single gnat left grumpy.',
    tooltip: 'Reach Round 5 in one game of Seed Burst.',
    subtleHint: 'Hedges hide extra pods, longer blooms and quicker shoes.',
    icon: 'kind-icon:sprout',
    rule: { kind: 'level', min: 5 },
    artPrompt:
      'A centered emblem scene: a team of diverse little gardener bots in sun hats cheer in the middle of a hedge maze as overlapping crosses of blooms ripple outward, seed packets, fertiliser bags and winged quick shoes tumbling out of burst hedges, butterflies rising everywhere. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'seed-burst',
    key: 'butterfly-blizzard',
    tier: 3,
    label: 'Butterfly Blizzard',
    message:
      'Forty thousand points of blooms: the whole hedge maze is a cloud of butterflies.',
    tooltip: 'Score 40,000 points in one game of Seed Burst.',
    subtleHint:
      'One burst that catches several gnats pays double for each one after the first.',
    icon: 'kind-icon:bee',
    rule: { kind: 'score', min: 40000 },
    artPrompt:
      'A heroic centered badge: a gardener bot stands at the heart of a hedge maze as a chain of seed pods bursts in a giant blooming starburst, a swarm of grumpy gnats and hedge-drifting ghost gnats all turning at once into a swirling blizzard of rainbow butterflies, a gust of wind scattering petals. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
]
