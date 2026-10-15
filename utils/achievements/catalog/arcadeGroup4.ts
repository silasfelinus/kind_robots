// Arcade cabinet achievements, group 4 (three per cabinet).
import type { GameAchievementDef } from '../gameAchievements'

export const GROUP_4: GameAchievementDef[] = [
  {
    game: 'lantern-swarm',
    key: 'first-glow-stage',
    tier: 1,
    label: 'Into the Glow!',
    message:
      'You beamed two swarms home and flew your lantern into the aurora of the first Glow Stage.',
    tooltip:
      'Reach Stage 3, the first Glow Stage, in one game of Lantern Swarm.',
    subtleHint: 'Every third night, the moths only want to dance.',
    icon: 'kind-icon:lamp',
    rule: { kind: 'level', min: 3 },
    artPrompt:
      'A round glowing paper lantern hovering at the centre of the scene, twin beams of warm light rising into a shimmering green and pink aurora, dozens of soft lavender moths swirling happily through the glow in looping ribbons, a starry night sky behind, centered badge-like composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'lantern-swarm',
    key: 'moth-wrangler',
    tier: 2,
    label: 'Moth Wrangler',
    message:
      'Twenty-five thousand points of light: the whole swarm is learning your lantern by heart.',
    tooltip: 'Score 25,000 points in one game of Lantern Swarm.',
    subtleHint: 'Beam them mid-dive, when they are bravest. It pays double.',
    icon: 'kind-icon:butterfly',
    rule: { kind: 'score', min: 25_000 },
    artPrompt:
      'A glowing paper lantern firing a bright beam that catches a diving lavender luna moth mid-swoop, the moth melting into a happy shower of golden sparkles, a swaying formation of moths arching above like a crown, deep purple night sky, centered emblem composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'lantern-swarm',
    key: 'fifth-glow-stage',
    tier: 3,
    label: 'Queen of the Night Sky',
    message:
      'Stage 15! Fourteen swarms beamed home, and the fifth Glow Stage lights the whole night for you.',
    tooltip: 'Reach Stage 15 in one game of Lantern Swarm.',
    subtleHint:
      'Let a queen borrow your lantern, then win it back twice as bright.',
    icon: 'kind-icon:crown',
    rule: { kind: 'level', min: 15 },
    artPrompt:
      'Two paper lanterns docked side by side in triumph, twin beams of light lifting a grand purple-and-pink queen moth gently back toward the stars, a ring of grateful moths circling them like a halo, a huge aurora rippling across the night, centered heroic badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'rover-ramble',
    key: 'checkpoint-b',
    tier: 1,
    label: 'Past Checkpoint B!',
    message:
      'Two lettered posts behind you, and your six wheels have found the rhythm of the moon.',
    tooltip:
      'Pass checkpoints A and B to reach section C in one game of Rover Ramble.',
    subtleHint: 'The craters are only holes if you forget to hop.',
    icon: 'kind-icon:flag',
    rule: { kind: 'level', min: 3 },
    artPrompt:
      'A chunky orange six-wheeled moon rover leaping high over a wide crater, dust trailing behind its wheels, a tall striped checkpoint post with a little flag rushing past below, a cratered lavender moonscape and a ringed planet in a starry sky, centered badge-like composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'rover-ramble',
    key: 'moon-cruiser',
    tier: 2,
    label: 'Moon Cruiser',
    message:
      'Boulders zapped, meteor sprites popped, craters cleared: you are cruising the moon like a pro.',
    tooltip: 'Score 25,000 points in one game of Rover Ramble.',
    subtleHint: 'Beat the par time and every checkpoint pays a little extra.',
    icon: 'kind-icon:moon',
    rule: { kind: 'score', min: 25_000 },
    artPrompt:
      'A chunky orange six-wheeled moon rover racing across a bumpy moon, zapping a boulder ahead into sparkling gravel while a second beam pops a swooping purple meteor saucer overhead, jagged mountain ridges and a ringed planet behind, centered emblem composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'rover-ramble',
    key: 'section-k',
    tier: 3,
    label: 'Ten Checkpoints Deep',
    message:
      'Checkpoint J falls behind you: rolling boulders, twin craters and pebble storms could not stop your rover.',
    tooltip:
      'Pass checkpoint J to reach section K in one game of Rover Ramble.',
    subtleHint: 'Big rocks take two zaps, and the rolling ones will not wait.',
    icon: 'kind-icon:trophy',
    rule: { kind: 'level', min: 11 },
    artPrompt:
      'A triumphant chunky orange six-wheeled moon rover soaring between twin craters as a rolling boulder tumbles harmlessly beneath it, a trail of checkpoint flags winding back to the far horizon, meteor saucers scattering away, a giant ringed planet glowing above, centered heroic badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'cable-crawler',
    key: 'starfield',
    tier: 1,
    label: 'Screensaver Time!',
    message:
      'Three Power Strip mazes slurped clean, and the Starfield screensaver flickers on just for you.',
    tooltip:
      'Clear the first three Power Strip mazes and reach the Starfield screensaver in one game of Cable Crawler.',
    subtleHint: 'Walls only pause you. Your own tail is another story.',
    icon: 'kind-icon:stars',
    rule: { kind: 'level', min: 4 },
    artPrompt:
      'A cheerful charging-cable robot with a steel plug head and a long glowing sky-blue cable body curling across a circuit-board maze, slurping the last bright spark, an old monitor screen behind blooming into a field of twinkling screensaver stars, centered badge-like composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'cable-crawler',
    key: 'surge-protector',
    tier: 2,
    label: 'Surge Protector Unplugged',
    message:
      'You out-crawled the Surge Protector and brought the whole Power Strip humming back to life.',
    tooltip:
      'Defeat the Surge Protector boss and reach RAM Rows in one game of Cable Crawler.',
    subtleHint: 'Plug into a socket and let the current do the slurping.',
    icon: 'kind-icon:bolt',
    rule: { kind: 'level', min: 8 },
    artPrompt:
      'A charging-cable robot with a steel plug head jamming itself into a glowing socket, bright current racing down its long coiled cable body, a big grumpy surge-protector boss box sparking and powering down in defeat, circuit-board traces lighting up all around, centered emblem composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'cable-crawler',
    key: 'mainframe-maestro',
    tier: 3,
    label: 'Mainframe Maestro',
    message:
      'So many sparks, surges and reboots that the old Mainframe hums with your current from end to end.',
    tooltip: 'Score 400,000 points in one game of Cable Crawler.',
    subtleHint:
      'Deeper components multiply every spark. A longer cable makes a longer surge.',
    icon: 'kind-icon:lightning',
    rule: { kind: 'score', min: 400_000 },
    artPrompt:
      'A charging-cable robot with a steel plug head coiled in a triumphant spiral at the heart of a giant old computer, RAM sticks, a cooling fan, speaker cones and a graphics card all around it glowing back to life with racing current, centered heroic badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'petal-post',
    key: 'first-blooms',
    tier: 1,
    label: 'Petals Delivered!',
    message:
      'Seed packets landed, mailbox flags went up, and the whole street is starting to sprout.',
    tooltip: 'Score 10,000 points in one game of Petal Post.',
    subtleHint: 'Aim for the mailbox. The doorstep is only second best.',
    icon: 'kind-icon:sprout',
    rule: { kind: 'score', min: 10_000 },
    artPrompt:
      'A small pink-and-steel delivery robot on a scooter tossing a seed packet in a perfect arc into a cheerful mailbox, its little flag popping up, a burst of flowers sprouting across the lawn of a bright cottage on a sunny street, centered badge-like composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'petal-post',
    key: 'full-week',
    tier: 2,
    label: 'A Whole Week of Blooms',
    message:
      'Seven days of deliveries done, and your route is the bloomiest in the whole neighbourhood.',
    tooltip:
      'Finish seven delivery days and reach Day 8 in one game of Petal Post.',
    subtleHint: 'Deliver to every bright house and a neighbour signs up.',
    icon: 'kind-icon:gift',
    rule: { kind: 'level', min: 8 },
    artPrompt:
      'A small pink-and-steel delivery robot on a scooter with an overflowing satchel of seed packets riding down a street where every cottage blooms with flower boxes, a skateboarding cat waving as it passes, neighbours of many backgrounds cheering from their porches, centered emblem composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'petal-post',
    key: 'legend-of-the-lane',
    tier: 3,
    label: 'Legend of the Lane',
    message:
      'Day after perfect day: every mailbox on the route flies its flag in your honour.',
    tooltip: 'Score 100,000 points in one game of Petal Post.',
    subtleHint: 'Perfect days pay more the longer the week runs.',
    icon: 'kind-icon:rainbow',
    rule: { kind: 'score', min: 100_000 },
    artPrompt:
      'A small pink-and-steel delivery robot on a scooter leaping triumphantly through a ring of bonus targets, seed packets fanning out behind it like a bouquet, a whole neighbourhood bursting into rainbow gardens below with every mailbox flag raised, centered heroic badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'bumper-bubbles',
    key: 'bottling-hall',
    tier: 1,
    label: 'Up the Bottling Hall!',
    message:
      'Five floors of grumps popped into treats, and the Bottling Hall is fizzing again.',
    tooltip:
      'Clear five floors and reach floor 6 in one game of Bumper Bubbles.',
    subtleHint: 'Hold HOP as you land on a bubble and it carries you up.',
    icon: 'kind-icon:bubbles',
    rule: { kind: 'level', min: 6 },
    artPrompt:
      'A small round teal robot hopping on top of a shimmering soap bubble that holds a trapped grumpy little gremlin, more bubbles bursting into falling candy treats all around, the brass pipes and bottles of a fizzy bottling hall behind, centered badge-like composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'bumper-bubbles',
    key: 'big-cork',
    tier: 2,
    label: 'Uncorked!',
    message:
      'The Big Cork popped right out of floor 25, and all of Fizzwick Tower fizzed with joy.',
    tooltip:
      'Defeat The Big Cork on floor 25 and climb to floor 26 in one game of Bumper Bubbles.',
    subtleHint: 'Something big is wedged in a quarter of the way up.',
    icon: 'kind-icon:star',
    rule: { kind: 'level', min: 26 },
    artPrompt:
      'A small round teal robot bouncing on bubbles as a giant grumpy cork boss pops free from a bottle neck in a fizzy explosion, foam and candy treats raining down, the glowing floors of a tall tower stretching up behind, centered emblem composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'bumper-bubbles',
    key: 'fizzwick-titan',
    tier: 3,
    label: 'Fizzwick Tower Titan',
    message:
      'A climb so bubbly and bold that whole clusters of grumps tumbled out as treats for you.',
    tooltip: 'Score 400,000 points in one game of Bumper Bubbles.',
    subtleHint: 'Pop a whole cluster at once and the treats climb the ladder.',
    icon: 'kind-icon:crown',
    rule: { kind: 'score', min: 400_000 },
    artPrompt:
      'Four bubble robots in teal, pink, gold and purple riding a column of shimmering bubbles up the side of a towering fizzy-drink tower, a huge cluster of trapped grumps bursting into a cascade of glittering treats, the tower windows lighting up floor by floor, centered heroic badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'crate-stack-shuffle',
    key: 'sticky-tape',
    tier: 1,
    label: 'Here Comes the Tape!',
    message:
      'Twenty rows shipped, and Stacker is ready for the sticky-taped crates.',
    tooltip:
      'Ship 20 rows to reach level 3 in one game of Crate Stack Shuffle.',
    subtleHint: 'A full row is a happy row. Send it out!',
    icon: 'kind-icon:crate',
    rule: { kind: 'level', min: 3 },
    artPrompt:
      'A small teal warehouse robot with a cream round head and a gold belt buckle cheering as a full row of colourful odd-shaped crates slides away on a conveyor, a cream-taped crate drifting down from above, a cosmic candy city glowing through the warehouse windows, centered badge-like composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'crate-stack-shuffle',
    key: 'heavy-hauler',
    tier: 2,
    label: 'Heavy Hauler',
    message:
      'Heavy crates plummeted and tape stuck fast, but the bay stayed tidy and the rows kept shipping.',
    tooltip: 'Score 25,000 points in one game of Crate Stack Shuffle.',
    subtleHint: 'Four rows at once ship for far more than four singles.',
    icon: 'kind-icon:target',
    rule: { kind: 'score', min: 25_000 },
    artPrompt:
      'A small teal warehouse robot with a cream round head and a gold belt buckle bracing proudly as a heavy iron-banded crate thunders down into a perfect gap, four stacked rows of colourful crates bursting away in a shower of sparkles, centered emblem composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'crate-stack-shuffle',
    key: 'top-speed',
    tier: 3,
    label: 'Top Shelf Speed',
    message:
      'Level 12! The crates fall as fast as they ever will, and Stacker never missed a beat.',
    tooltip:
      'Ship 110 rows to reach level 12 in one game of Crate Stack Shuffle.',
    subtleHint: 'There is a speed the crates cannot go past. Can you meet it?',
    icon: 'kind-icon:lightning',
    rule: { kind: 'level', min: 12 },
    artPrompt:
      'A small teal warehouse robot with a cream round head and a gold belt buckle standing calm and heroic as a blur of colourful odd-shaped crates rains down at full speed, each one snapping perfectly into place, bright speed lines and a glowing cosmic candy city behind, centered heroic badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'lamp-lighter-run',
    key: 'first-street',
    tier: 1,
    label: 'Street Lit!',
    message: 'All ten lamps glowing: Wick has relit the first night street.',
    tooltip:
      'Light all ten lamps on the first street to reach level 2 in one game of Lamp Lighter Run.',
    subtleHint: 'Hop a gloom-ball and it pays you for the trouble.',
    icon: 'kind-icon:lamp',
    rule: { kind: 'level', min: 2 },
    artPrompt:
      'A small teal lamplighter robot with a cream round head and a tall gold hat touching a long glowing lighting-pole to a street lamp that bursts into warm golden light, a row of freshly lit lamps along sloping steel girders, a crescent moon above the night street, centered badge-like composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'lamp-lighter-run',
    key: 'lantern-keeper',
    tier: 2,
    label: 'Lantern Keeper',
    message:
      'Streets relit, gloom-balls hopped, and a spare lantern earned for all that warm light.',
    tooltip: 'Score 10,000 points in one game of Lamp Lighter Run.',
    subtleHint: 'The lantern timer you have left over turns into points.',
    icon: 'kind-icon:flame',
    rule: { kind: 'score', min: 10_000 },
    artPrompt:
      'A small teal lamplighter robot with a cream round head and a tall gold hat hopping high over a rolling purple gloom-ball with sleepy yellow eyes, a little paper lantern swinging bright from its pole, sloping girders and glowing lamps behind, centered emblem composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'lamp-lighter-run',
    key: 'master-lamplighter',
    tier: 3,
    label: 'Master Lamplighter',
    message:
      'Nine streets relit on ever-steeper girders, and the lantern timer has nothing shorter left to give.',
    tooltip: 'Reach level 10 in one game of Lamp Lighter Run.',
    subtleHint: 'Every street, the girders tilt and the gloom rolls faster.',
    icon: 'kind-icon:trophy',
    rule: { kind: 'level', min: 10 },
    artPrompt:
      'A small teal lamplighter robot with a cream round head and a tall gold hat standing triumphant atop a steeply tilted scaffold, lighting-pole raised high, three night streets below glowing with rows of golden lamps, gloom-balls rolling away into the dark, centered heroic badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'dune-digger-dash',
    key: 'third-dune',
    tier: 1,
    label: 'Dune Hopper',
    message:
      'Two rounds of sand-sprites popped, and Dig rolls on to the third dune.',
    tooltip:
      'Clear two rounds to reach round 3 in one game of Dune Digger Dash.',
    subtleHint: 'Four pumps pop a sprite. Stop halfway and it deflates.',
    icon: 'kind-icon:path',
    rule: { kind: 'level', min: 3 },
    artPrompt:
      'A small teal digger robot with a cream round head and a golden drill helmet pumping a round orange sand-sprite with sleepy yellow eyes until it pops into a burst of glittering sand sparkles, a winding tunnel through layered gold, rose and rust-orange sand, centered badge-like composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'dune-digger-dash',
    key: 'boulder-buster',
    tier: 2,
    label: 'Boulder Buster',
    message:
      'Pumps, pops and perfectly timed boulders: the dunes paid out a spare digger.',
    tooltip: 'Score 20,000 points in one game of Dune Digger Dash.',
    subtleHint:
      'One boulder, two sprites underneath. Worth more than a whole round of pumping.',
    icon: 'kind-icon:rock',
    rule: { kind: 'score', min: 20_000 },
    artPrompt:
      'A small teal digger robot with a cream round head and a golden drill helmet ducking aside in a tunnel as a grey boulder tumbles onto two surprised orange sand-sprites, a puff of sparkly dust, layered gold, rose and rust-orange sand all around, centered emblem composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'dune-digger-dash',
    key: 'king-of-the-dunes',
    tier: 3,
    label: 'King of the Dunes',
    message:
      'Ten rounds cleared against the fastest, most crowded sand the dunes could throw at you.',
    tooltip:
      'Clear ten rounds to reach round 11 in one game of Dune Digger Dash.',
    subtleHint: 'Deep sprites pay more. Deeper still, they hunt faster.',
    icon: 'kind-icon:trophy',
    rule: { kind: 'level', min: 11 },
    artPrompt:
      'A small teal digger robot with a cream round head and a golden drill helmet standing triumphantly on the crest of rolling candy dunes, pump hose raised like a banner, a maze of tunnels glowing beneath, defeated sand-sprite eyes drifting away under a crescent moon, centered heroic badge composition with a clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
]
