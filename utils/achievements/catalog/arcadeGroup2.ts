// Arcade achievements, group 2: three per cabinet, thresholds checked against each game module.
import type { GameAchievementDef } from '../gameAchievements'

export const GROUP_2: GameAchievementDef[] = [
  // --- Hedgehog Crossing -------------------------------------------------------------------
  {
    game: 'hedgehog-crossing',
    key: 'family-home',
    tier: 1,
    label: 'Family Home!',
    message:
      'All five hedgehogs are tucked into their burrows, and the whole family is home for the night.',
    tooltip:
      'Bring all five hedgehogs home and reach Level 2 in one game of Hedgehog Crossing.',
    subtleHint: 'Five burrows in the hedge, five little noses to count.',
    icon: 'kind-icon:heart',
    rule: { kind: 'level', min: 2 },
    artPrompt:
      'A round little hedgehog with a cream belly hopping happily into the last cosy burrow of a moonlit hedge, four sibling hedgehogs peeking out of the neighbouring burrows with beaming faces, fireflies and glowing flowers framing the hedge like a badge, a sparkling creek with drifting logs below, centered emblem composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'hedgehog-crossing',
    key: 'creek-commuter',
    tier: 2,
    label: 'Creek Commuter',
    message:
      'Robot traffic, drifting logs and paddling turtles: you have walked family after family home.',
    tooltip: 'Score 15,000 points in one game of Hedgehog Crossing.',
    subtleHint:
      'Every new step forward counts, and a full row of burrows counts a lot more.',
    icon: 'kind-icon:wave',
    rule: { kind: 'score', min: 15000 },
    artPrompt:
      'A brave hedgehog mid-hop from a drifting log onto the shell of a friendly paddling turtle in a glittering moonlit creek, little robot cars and a chunky robot tractor whizzing along the road behind with motion streaks, splashes and lily pads around, centered heroic badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'hedgehog-crossing',
    key: 'fox-tiptoer',
    tier: 3,
    label: 'Hedgerow Legend',
    message:
      'Faster lanes, shorter logs, diving turtles and a snoozing fox, and still every hedgehog made it home.',
    tooltip: 'Reach Level 8 in one game of Hedgehog Crossing.',
    subtleHint:
      'Let sleeping foxes lie, and watch which turtles are about to dive.',
    icon: 'kind-icon:crown',
    rule: { kind: 'level', min: 8 },
    artPrompt:
      'A proud hedgehog tiptoeing past a fox curled up asleep in a hedge burrow, a spotted ladybug riding on the hedgehog spines, turtles diving beneath the creek ripples and robot racers zooming past in a blur, the hedgehog lit by a golden glow as the hero of the night, centered badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },

  // --- Ribbon Riders -----------------------------------------------------------------------
  {
    game: 'ribbon-riders',
    key: 'ribbon-rookie',
    tier: 1,
    label: 'Ribbon Rookie',
    message:
      'Your rainbow ribbon boxed in its first rivals under the lanterns of the Old Square.',
    tooltip: 'Score 5,000 points in one game of Ribbon Riders.',
    subtleHint: 'Close a loop around a rival and see what gets gift-wrapped.',
    icon: 'kind-icon:rainbow',
    rule: { kind: 'score', min: 5000 },
    artPrompt:
      'A sleek glowing light-bike with a small cheerful robot rider unrolling a shining rainbow ribbon that curls in a perfect loop around a rival bike, the rival popping out tied up in a giant satin bow, a lantern-strung festival square at night with paper lanterns overhead, centered badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'ribbon-riders',
    key: 'through-the-mirrors',
    tier: 2,
    label: 'Through the Mirrors',
    message:
      'The Old Square, Lamp Post Row and the Hall of Mirrors are cleared, copycats and all.',
    tooltip:
      'Clear the Old Square, Lamp Post Row and the Hall of Mirrors to reach Round 4 in one game of Ribbon Riders.',
    subtleHint: 'A copycat steers just like you do. Use that.',
    icon: 'kind-icon:lightning',
    rule: { kind: 'level', min: 4 },
    artPrompt:
      'A robot rider on a neon light-bike banking hard through a shimmering hall of mirrors, its rainbow ribbon reflected into endless glowing curves, a mirrored copycat bike bumping into a ribbon wall in a burst of sparks, festival lanterns glowing beyond the mirrors, centered dynamic badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'ribbon-riders',
    key: 'festival-champion',
    tier: 3,
    label: 'Lantern Festival Champ',
    message:
      'All six arenas of the Lantern Festival Circuit are cleared, and the next lap brings a bigger crew.',
    tooltip:
      'Clear all six Midway arenas, through the Pier Loop, to reach Round 7 in one game of Ribbon Riders.',
    subtleHint:
      'The Pier Loop is crowded. Ride close, and let the others bump first.',
    icon: 'kind-icon:trophy',
    rule: { kind: 'level', min: 7 },
    artPrompt:
      'A triumphant robot rider leaping a glowing light-bike over a seaside pier loop at night, a rainbow ribbon spiralling behind like a comet tail, four rival bikes below wrapped up in giant bows, fireworks and paper lanterns bursting over the water, centered heroic badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },

  // --- Burrow Buddy ------------------------------------------------------------------------
  {
    game: 'burrow-buddy',
    key: 'first-garden',
    tier: 1,
    label: 'Green Thumb Digger',
    message:
      'Tunnels dug, grumpy grubs puffed up and floated away: the garden is safe and sound.',
    tooltip: 'Score 2,500 points in one game of Burrow Buddy.',
    subtleHint: 'The deeper the soil, the bigger the pop.',
    icon: 'kind-icon:sprout',
    rule: { kind: 'score', min: 2500 },
    artPrompt:
      'Buddy, a little round robot mole with digging claws, puffing a stream of shiny bubbles at a grumpy grub in an underground tunnel, the grub swelling into a balloon and floating gently upward, a cross-section of colourful soil layers with flowers and a sunny garden on the surface above, centered badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'burrow-buddy',
    key: 'fifth-garden',
    tier: 2,
    label: 'Fifth Garden Found',
    message:
      'Four gardens cleared, fire-breathing beetles and all, and the veggies keep growing.',
    tooltip: 'Reach Garden 5 in one game of Burrow Buddy.',
    subtleHint: 'Dig under a turnip, then wait for company.',
    icon: 'kind-icon:flame',
    rule: { kind: 'level', min: 5 },
    artPrompt:
      'Buddy the little robot mole ducking a puff of flame from a grumpy fire-breathing beetle in a twisting soil tunnel, while a huge purple turnip tumbles from above onto a cluster of startled grubs, clods of earth and stars bursting around, layered garden soil in warm bands, centered action badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'burrow-buddy',
    key: 'turnip-titan',
    tier: 3,
    label: 'Turnip Titan',
    message:
      'Gardens deep, turnips dropped on whole crowds, veggie bonuses grabbed: the soil has a new legend.',
    tooltip: 'Score 25,000 points in one game of Burrow Buddy.',
    subtleHint: 'Two dropped turnips bring a veggie to the middle. Be there.',
    icon: 'kind-icon:crown',
    rule: { kind: 'score', min: 25000 },
    artPrompt:
      'Buddy the little robot mole standing proudly on top of a giant glowing turnip at the heart of a sprawling underground tunnel network, holding up a shining carrot like a trophy, popped grubs drifting away as rainbow bubbles, a garden of flowers blooming on the surface above, centered triumphant badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },

  // --- Repair Rampage ----------------------------------------------------------------------
  {
    game: 'repair-rampage',
    key: 'city-fixer',
    tier: 1,
    label: 'City Fixer',
    message:
      'Every window shines again, and the first city cheers for its friendly giant.',
    tooltip:
      'Fix every window in City 1 and move on to City 2 in one game of Repair Rampage.',
    subtleHint: 'Fix a tower before it starts to wobble.',
    icon: 'kind-icon:robot',
    rule: { kind: 'level', min: 2 },
    artPrompt:
      'Bolt, a giant friendly robot with big gentle hands, clinging to the side of a storm-battered city tower and pressing the last shining pane of glass into place, golden light blooming from every repaired window, rain clouds parting into a sunset sky behind, centered heroic badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'repair-rampage',
    key: 'kitten-courier',
    tier: 2,
    label: 'Kitten Courier',
    message:
      'Towers mended, kittens rescued from the ledges, and the news drones politely shooed away.',
    tooltip: 'Score 25,000 points in one game of Repair Rampage.',
    subtleHint: 'A kitten on a broken window is only waiting for a fix.',
    icon: 'kind-icon:cat',
    rule: { kind: 'score', min: 25000 },
    artPrompt:
      'Bolt the giant friendly robot clinging to a tall tower with one hand while cradling a fluffy rescued kitten in the other, gently waving away a little hovering news drone with a camera flash, mended windows glowing up the tower face, a twilight city skyline behind, centered badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'repair-rampage',
    key: 'skyline-savior',
    tier: 3,
    label: 'Skyline Savior',
    message:
      'Five storm-wrecked cities rebuilt window by window before Bolt ran out of charge.',
    tooltip: 'Reach City 6 in one game of Repair Rampage.',
    subtleHint: 'Bolt drains as it works. A grateful city tops it back up.',
    icon: 'kind-icon:bolt',
    rule: { kind: 'level', min: 6 },
    artPrompt:
      'Bolt the giant friendly robot standing tall on the rooftop of the highest tower at dawn, arms raised in triumph, a whole skyline of repaired towers glowing below, three kittens perched on its shoulders, a rainbow arching over the city as the last storm clouds drift away, centered triumphant badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },

  // --- Kindness Gauntlet -------------------------------------------------------------------
  {
    game: 'kindness-gauntlet',
    key: 'tape-library',
    tier: 1,
    label: 'Into the Tape Library',
    message:
      'The Punch-Card Vault is behind you, and the reels of the Tape Library are spinning ahead.',
    tooltip:
      'Reach Floor 9 of the Deep Archive in one game of Kindness Gauntlet.',
    subtleHint: 'Every glitch has a tell, and the Card Sorter has a few.',
    icon: 'kind-icon:shield',
    rule: { kind: 'level', min: 9 },
    artPrompt:
      'Four small kind robots, a big huggable bot, a sturdy toolbox bot, a wizardly sage bot and a speedy wheeled bot, stepping together through an archway from a beige vault of punch cards into a hall of giant spinning tape reels, a calmed card-sorting machine waving goodbye behind them, sparks of kindness swirling around, centered badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'kindness-gauntlet',
    key: 'archive-explorer',
    tier: 2,
    label: 'Archive Explorer',
    message:
      'Glitches soothed by the hundred, secrets found, and two wings of the Deep Archive remembered.',
    tooltip: 'Score 200,000 points in one game of Kindness Gauntlet.',
    subtleHint:
      'Secrets, Memory Cards and Guardians all pay more the deeper you go.',
    icon: 'kind-icon:scroll',
    rule: { kind: 'score', min: 200000 },
    artPrompt:
      'A speedy wheeled robot and a wizardly sage robot firing bright kindness sparks through a maze of tall tape-reel racks, glitchy pixel critters turning into happy little sparkles as the sparks touch them, a glowing memory card floating overhead like a treasure, cables and blinking lights all around, centered action badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'kindness-gauntlet',
    key: 'old-mainframe',
    tier: 3,
    label: 'At the Old Mainframe',
    message:
      'Down through all five wings to the Core, where the Old Mainframe waits to remember herself.',
    tooltip:
      'Reach Floor 40, the Old Mainframe herself, in one game of Kindness Gauntlet.',
    subtleHint: 'Five Memory Cards help her remember everything.',
    icon: 'kind-icon:crystal-ball',
    rule: { kind: 'level', min: 40 },
    artPrompt:
      'Four small kind robots standing hand in hand before an enormous kindly vintage mainframe computer with a gentle face made of glowing amber lights, her reels starting to turn as she wakes, five glowing memory cards orbiting her like stars, warm light flooding the deep machine hall, centered emotional badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },

  // --- Prize Show Panic --------------------------------------------------------------------
  {
    game: 'prize-show-panic',
    key: 'opening-night',
    tier: 1,
    label: 'Opening Night Star',
    message:
      'Crashers confettied into a happy dance, prizes grabbed, and the Opening Night crowd is on its feet.',
    tooltip: 'Score 100,000 points in one game of Prize Show Panic.',
    subtleHint: 'The ratings meter loves style. Keep moving, keep cheering.',
    icon: 'kind-icon:sparkles',
    rule: { kind: 'score', min: 100000 },
    artPrompt:
      'A cheerful little contestant robot blasting a confetti cannon across a glittering game-show stage, a crowd of party-crasher robots turning happy and dancing off the set, sweeping spotlight beams, a shiny prize toaster and gift boxes tumbling around, a festive parade float in the background, centered badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'prize-show-panic',
    key: 'concert-bound',
    tier: 2,
    label: 'Backstage Pass',
    message:
      'Nineteen studio rooms survived, pies, hot plates and all, and the Countdown Concert is calling.',
    tooltip:
      'Make it to the 19th studio room in one game of Prize Show Panic (the Countdown Concert, on a straight run).',
    subtleHint: 'Safe doors or rich doors? The map tells you which is which.',
    icon: 'kind-icon:theater',
    rule: { kind: 'level', min: 19 },
    artPrompt:
      'A nimble contestant robot cartwheeling between flying custard pies in a candy-coloured television kitchen, a pie cart circling and lobbing pies, a giant souffle rising in the background, flour clouds puffing from glowing hot plates, a concert stage door glowing with speaker stacks just beyond, centered action badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'prize-show-panic',
    key: 'prime-time-legend',
    tier: 3,
    label: 'Prime Time Legend',
    message:
      'Four episodes of studio chaos conquered at Prime Time ratings: the Live Finale has its star.',
    tooltip: 'Score 5,000,000 points in one game of Prize Show Panic.',
    subtleHint:
      'Prime Time multiplies everything. Never let the ratings drain.',
    icon: 'kind-icon:trophy',
    rule: { kind: 'score', min: 5000000 },
    artPrompt:
      'A triumphant contestant robot standing on top of a giant spinning prize wheel machine, arms raised as golden tickets and confetti rain down, a long dancing conga dragon made of party segments curling around the stage, a flying saucer mothership and a jumbotron glowing in the background, centered triumphant badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },

  // --- Zuzu: Ghost Trail -------------------------------------------------------------------
  {
    game: 'zuzu-ghost-trail',
    key: 'grave-marshal',
    tier: 1,
    label: 'Marshal Laid to Rest',
    message:
      'The Ghost Town falls quiet: the Grave Marshal is down and Zuzu walks on toward the Bone Yard.',
    tooltip:
      'Beat the Grave Marshal and reach Stage 2, the Bone Yard, in one game of Zuzu: Ghost Trail.',
    subtleHint:
      'Every boss shows its attack before it lands. Watch the Marshal.',
    icon: 'kind-icon:ghost',
    rule: { kind: 'level', min: 2 },
    artPrompt:
      'Zuzu the koala ronin, short and stocky with a stern serious face, broad conical straw kasa and rust-brown poncho with orange zigzag trim, katana hilt over his right shoulder, standing in a dusty ghost-town street at dusk as a spectral lawman in a long riding coat fades into wisps of cyan light, weathered wooden porches and tumbleweeds behind, centered badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, dusty ochre and moon-blue palette with amber lantern glow and spectral cyan',
  },
  {
    game: 'zuzu-ghost-trail',
    key: 'trail-hardened',
    tier: 2,
    label: 'Trail Hardened',
    message:
      'Spirits, bone hyenas and storm crows stayed down, and the trail remembers your name.',
    tooltip: 'Score 150,000 points in one game of Zuzu: Ghost Trail.',
    subtleHint:
      'Bosses, act clears and the clock all pay more the further down the trail you go.',
    icon: 'kind-icon:swords',
    rule: { kind: 'score', min: 150000 },
    artPrompt:
      'Zuzu the koala ronin, stern and serious, straw kasa and rust-brown poncho with orange zigzag trim, mid-leap above a moonlit bone yard throwing a fan of three spinning shuriken at a charging skeletal bull wreathed in cyan ghost-fire, bleached bones and crooked grave markers below, a huge pale moon behind, centered action badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, dusty ochre and moon-blue palette with amber lantern glow and spectral cyan',
  },
  {
    game: 'zuzu-ghost-trail',
    key: 'beneath-the-bell',
    tier: 3,
    label: 'Beneath the Bell',
    message:
      'Past the Ferryman, the Storm-Crow Matriarch and the Bell Heretic: only the Abbess remains.',
    tooltip:
      'Reach Stage 6, the abbey beneath the mission bell, in one game of Zuzu: Ghost Trail.',
    subtleHint: 'The bell tolls from the tower, but the answer lies below it.',
    icon: 'kind-icon:moon',
    rule: { kind: 'level', min: 6 },
    artPrompt:
      'Zuzu the koala ronin, stern and serious, straw kasa and rust-brown poncho with orange zigzag trim, katana hilt over his right shoulder, standing at the top of a stone stair beneath a great silent mission bell, a candlelit abbey glowing below in spectral cyan, storm crows scattering into the night sky, midnight indigo and dusty plum shadows, centered heroic badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, dusty ochre and moon-blue palette with amber lantern glow and spectral cyan',
  },

  // --- Station Sweep -----------------------------------------------------------------------
  {
    game: 'station-sweep',
    key: 'spick-and-span',
    tier: 1,
    label: 'Spick and Span',
    message:
      'Every egg sac popped and every critter swept: your first space station sparkles.',
    tooltip: 'Score 7,500 points in one game of Station Sweep.',
    subtleHint: 'Crouch to catch the rollers bowling along the floor.',
    icon: 'kind-icon:sparkle',
    rule: { kind: 'score', min: 7500 },
    artPrompt:
      'Mop, a cheerful little cleaning robot with a sweeper nozzle arm, firing a bright sweeper beam down a gleaming space-station corridor, wobbly glitch critters bursting into sparkles, popped goo egg sacs on the shining floor, a round porthole full of stars behind, centered badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'station-sweep',
    key: 'deck-hand',
    tier: 2,
    label: 'Deck Hand Deluxe',
    message:
      'Decks cleaned against the clock, lifts ridden, crawlers shaken off: the station is gleaming.',
    tooltip: 'Score 35,000 points in one game of Station Sweep.',
    subtleHint: 'A critter left alone grows big. Sweep it while it is small.',
    icon: 'kind-icon:rocket',
    rule: { kind: 'score', min: 35000 },
    artPrompt:
      'Mop the little cleaning robot jumping high inside a glowing space-station lift to shake off a clingy ceiling crawler critter, sweeping a rolling glitch critter with its beam at the same time, decks stacked above and below seen through the lift glass, stars and a ringed planet outside, centered action badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'station-sweep',
    key: 'spotless-station',
    tier: 3,
    label: 'Spotless Station Chief',
    message:
      'Station after station scrubbed clean while the critters grew faster and the clock ran shorter.',
    tooltip: 'Score 100,000 points in one game of Station Sweep.',
    subtleHint:
      'Time left on the station clock is paid out when the station is clean.',
    icon: 'kind-icon:star',
    rule: { kind: 'score', min: 100000 },
    artPrompt:
      'Mop the little cleaning robot standing proudly on the outer hull of a gleaming space station, sweeper arm raised like a banner, every window of the station shining clean, swept glitch critters drifting away as harmless sparkles, a galaxy swirl and twinkling stars all around, centered triumphant badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
]
