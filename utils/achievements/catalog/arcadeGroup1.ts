// Arcade cabinet achievements, group 1 (three per cabinet).
import type { GameAchievementDef } from '../gameAchievements'

export const GROUP_1: GameAchievementDef[] = [
  {
    game: 'butterfly-blaster',
    key: 'riverbend-safe',
    tier: 1,
    label: 'Riverbend Kept Safe!',
    message:
      'Four nights on watch over Riverbend, and every hut on the savanna sleeps easy.',
    tooltip:
      'Clear all four Riverbend nights and reach the Rice Terraces (level 5) in one game of Butterfly Blaster.',
    subtleHint: 'The first village is always the one that teaches you to fly.',
    icon: 'kind-icon:butterfly',
    rule: { kind: 'level', min: 5 },
    artPrompt:
      'A rainbow-winged butterfly with glowing wingtips hovering proudly above a ring of round thatched savanna huts at dawn, every warm window still lit, a broken swarm of grumpy cartoon mosquitoes scattering into harmless pink sparkles, a tiny blue fairy girl with glittering wings waving a white mosquito net in celebration, a moonlit river curling behind. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'butterfly-blaster',
    key: 'hum-netted',
    tier: 2,
    label: 'The Hum, Netted!',
    message:
      'The swarm that holds a shape came apart in your ribbon, and the First Rains are over.',
    tooltip:
      'Defeat The Hum, the First Rains nest boss, and reach the Mangrove Delta (level 10) in one game of Butterfly Blaster.',
    subtleHint:
      'A swarm that hums in one shape can be unravelled by a long ribbon.',
    icon: 'kind-icon:wind',
    rule: { kind: 'level', min: 10 },
    artPrompt:
      'A rainbow-winged butterfly trailing a long glowing ribbon lasso looped around a giant mega-swarm of grumpy cartoon mosquitoes bunched into the shape of a huge buzzing face, the swarm bursting apart into golden sparkles inside the loop, stepped rice terraces and rain-filled paddies below a deep purple night sky. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'butterfly-blaster',
    key: 'night-queen',
    tier: 3,
    label: 'Face the Night Queen',
    message:
      'You flew the whole Rainy Season down the river to the swamp matriarch herself.',
    tooltip:
      "Reach The Night Queen, the Great Swamp's final nest boss (level 27), in one game of Butterfly Blaster.",
    subtleHint: 'Three Moons of rain all end where the swamp runs deepest.',
    icon: 'kind-icon:crown',
    rule: { kind: 'level', min: 27 },
    artPrompt:
      "A rainbow-winged butterfly with blazing wingtips facing down a towering crowned mosquito queen with gauzy violet wings above a misty moonlit swamp of mangrove roots and glowing decoy lights, a tiny blue fairy girl holding a white mosquito net at the butterfly's side, a stilt village glowing warm and safe behind them. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars",
  },
  {
    game: 'battery-maze',
    key: 'spark-snacker',
    tier: 1,
    label: 'Spark Snacker!',
    message:
      'Sparks, power cells and sleepy-gremlin bumps: the Cozy Charger is humming with your points.',
    tooltip: 'Score 10,000 points in one game of Battery Maze.',
    subtleHint:
      'Bump sleepy gremlins in a row and each one is worth double the last.',
    icon: 'kind-icon:bolt',
    rule: { kind: 'score', min: 10_000 },
    artPrompt:
      'A little cat-eared robot racing through a neon purple and teal maze gobbling a trail of glowing yellow energy sparks, a bright power cell crackling in its hands, four sleepy blue gremlins with droopy eyes tumbling dizzily behind it, rivet-studded walls of a cozy charger glowing warm. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'battery-maze',
    key: 'mama-napping',
    tier: 2,
    label: 'Gremlin Mama Naps',
    message:
      'You trapped Gremlin Mama in her bay and bumped her home for a nap. Morning Boot is done!',
    tooltip:
      'Beat Gremlin Mama at the end of Morning Boot and reach the Greenhouse Grid (level 8) in one game of Battery Maze.',
    subtleHint:
      'Mama is too big for the narrow halls, and a bay gate can shut behind her.',
    icon: 'kind-icon:moon',
    rule: { kind: 'level', min: 8 },
    artPrompt:
      'A huge round gremlin mama yawning and curling up for a nap inside a glowing gated trap bay, a little cat-eared robot pulling a big rewire switch lever beside the closing gates, tiny baby gremlins snoozing in a pile, neon maze halls of a power grid den around them. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'battery-maze',
    key: 'grid-restored',
    tier: 3,
    label: 'The Grid Hums Again!',
    message:
      'The Overload rebooted, the gremlins waved you home, and the whole city grid glows again.',
    tooltip:
      'Beat The Overload, the final boss, and play on past the credits to level 22 in one game of Battery Maze.',
    subtleHint:
      'The great face in the dock rewires the maze; your switch flips can rewire it back.',
    icon: 'kind-icon:lightning',
    rule: { kind: 'level', min: 22 },
    artPrompt:
      'A little cat-eared robot standing triumphant atop a giant glowing charging dock as a huge stormy gremlin face melts into a friendly smile, a long friend train of rebooted gremlins waving behind the robot, a night city skyline flickering back to light with power lines glowing gold. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'rescue-rally',
    key: 'plaza-rebooted',
    tier: 1,
    label: 'Neon Plaza Rebooted!',
    message:
      'The Big Wind-Up wound down, and every glitched helper bot in the plaza is a friend again.',
    tooltip:
      'Reach wave 9 in one game of Rescue Rally (in the campaign: clear the Neon Plaza and the Big Wind-Up).',
    subtleHint: 'Even a wind-up giant runs out of turns eventually.',
    icon: 'kind-icon:robot',
    rule: { kind: 'level', min: 9 },
    artPrompt:
      'An android hero firing a glowing pink kindness beam at a giant wind-up toy robot with a huge brass key in its back, the giant slumping into sparkles as its key stops turning, rebooted friendly drones cheering around a neon plaza floor painted with a big heart, a diverse family of rescued people and a puppy waving. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'rescue-rally',
    key: 'parade-master',
    tier: 2,
    label: 'Parade Master',
    message:
      'Rescues, parades and reboots by the hundred thousand: the whole city is cheering for you.',
    tooltip: 'Score 300,000 points in one game of Rescue Rally.',
    subtleHint: 'Lead three to the beacon and their thank-yous come doubled.',
    icon: 'kind-icon:players',
    rule: { kind: 'score', min: 300_000 },
    artPrompt:
      'An android hero leading a happy parade of a grandmother, a child in a raincoat and a small dog onto a glowing golden beacon pad that bursts with light, rebooted helper bots looping overhead, toy factory conveyor belts and crates around the neon arena. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'rescue-rally',
    key: 'glitch-core',
    tier: 3,
    label: 'Face the Glitch Core',
    message:
      'Five districts swept and four bosses rebooted: only the Glitch Core is left on the rooftops.',
    tooltip:
      'Reach wave 40 in one game of Rescue Rally (in the campaign: the Glitch Core on the Storm Rooftops).',
    subtleHint: 'The glitch began somewhere, and it hides its heart up high.',
    icon: 'kind-icon:storm',
    rule: { kind: 'level', min: 40 },
    artPrompt:
      "An android hero standing firm on rain-swept neon rooftops, lightning cracking across a stormy purple sky, aiming a brilliant kindness beam at a giant pulsing glitch crystal core of jagged static, an orbiting squad of small friendly bots at the hero's side, city lights twinkling far below. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars",
  },
  {
    game: 'sink-suds',
    key: 'kitchen-sparkle',
    tier: 1,
    label: 'Kitchen Sink Sparkles!',
    message:
      'All four kitchen basins scrubbed clean by one brave little soap bubble.',
    tooltip:
      'Clean all four Kitchen Sink basins and reach Bath Time (level 5) in one game of Sink Suds.',
    subtleHint: 'Crumbs today, a bigger bubble tomorrow.',
    icon: 'kind-icon:bubbles',
    rule: { kind: 'level', min: 5 },
    artPrompt:
      'A glossy rainbow-sheened soap bubble with a cheerful face rolling across a gleaming kitchen sink basin, a film of grime peeling away into sparkles behind it, crumbs and grease drops being gobbled up, floating plates and a dripping faucet in a cozy robot house kitchen. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'sink-suds',
    key: 'bristleton-swept',
    tier: 2,
    label: 'Bristleton Swept Away!',
    message:
      'Bristleton the Big Brush went down the drain, and the Morning Rinse is done.',
    tooltip:
      'Beat Bristleton the Big Brush at the end of the Morning Rinse and reach the Laundry Drum (level 10) in one game of Sink Suds.',
    subtleHint: 'Big bubbles tip brushes; bigger bubbles tip big brushes.',
    icon: 'kind-icon:water',
    rule: { kind: 'level', min: 10 },
    artPrompt:
      'A giant bristly scrub brush boss with grumpy bushy eyebrows tipping over backward into a swirling bathtub drain, a big triumphant soap bubble hero glowing above it, a faucet current spraying, yellow rubber ducks bobbing and cheering in the foamy water. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'sink-suds',
    key: 'grime-king-drained',
    tier: 3,
    label: 'Down Goes the Grime King!',
    message:
      'A giant bubble swept the Grime King down the drain, and the whole robot house is squeaky clean.',
    tooltip:
      "Beat the Grime King, the Evening Shine's final boss, and play on to level 28 in one game of Sink Suds.",
    subtleHint: 'Every wash cycle ends with someone bigger to wash away.',
    icon: 'kind-icon:crown',
    rule: { kind: 'level', min: 28 },
    artPrompt:
      'An enormous shimmering soap bubble engulfing a sludgy crowned grime monster and sweeping it down a swirling drain, a robot car wash around them with spinning brushes and a conveyor, rainbow soap-film light and clean sparkles bursting outward. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'pipe-pals',
    key: 'rooftop-fixed',
    tier: 1,
    label: 'Rooftop Reservoir Fixed!',
    message:
      'Five phases of flipped critters later, the rooftop pipes run clear and the bonus round is yours.',
    tooltip:
      'Clear all five Rooftop Reservoir phases and reach its bonus round (level 6) in one game of Pipe Pals.',
    subtleHint: 'Bump from below, then kick: the ledge does the rest.',
    icon: 'kind-icon:platform',
    rule: { kind: 'level', min: 6 },
    artPrompt:
      'A teal cat-eared android leaping up beneath a brick ledge to bump a grumpy critter flipped onto its back, a row of flipped crab bots bowling off the ledge in a chain, big green pipes on a rooftop water reservoir under a sunset sky. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'pipe-pals',
    key: 'big-shell-bowled',
    tier: 2,
    label: 'Big Shell Bowled Over!',
    message:
      'The Big Shell flipped, the Day Shift is done, and the whole morning crew cheers for the pals.',
    tooltip:
      'Beat the Big Shell at the end of the Day Shift and reach Cold Storage (level 20) in one game of Pipe Pals.',
    subtleHint: 'Even the biggest armour has to come off first.',
    icon: 'kind-icon:shield',
    rule: { kind: 'level', min: 20 },
    artPrompt:
      'A teal cat-eared android and a pink cat-eared android high-fiving above a giant armoured shell knight boss flipped onto its back with its legs wiggling, inside a bubbling laundry works full of steam, soap bubbles and big green pipes. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'pipe-pals',
    key: 'clog-king',
    tier: 3,
    label: 'Face the Clog King',
    message:
      'Two shifts and seven districts behind you: the Clog King waits in the storm drain at midnight.',
    tooltip:
      "Reach the Clog King, the Night Shift's final boss (level 50), in one game of Pipe Pals.",
    subtleHint:
      'At midnight the storm drain is lit only by lamps and lightning.',
    icon: 'kind-icon:lamp',
    rule: { kind: 'level', min: 50 },
    artPrompt:
      'A teal cat-eared android standing heroically in a dark storm drain lit by hanging lamps and a flash of lightning, a towering gooey crowned clog monster plugging a giant pipe ahead, rushing water swirling below, a pink cat-eared android pal bracing beside her. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'butterfly-joust',
    key: 'bumbleton-bested',
    tier: 1,
    label: 'Sir Bumbleton Bested!',
    message: 'You flew higher than Sir Bumbleton and won the Sunset Pond.',
    tooltip:
      "Beat Sir Bumbleton, Sunset Pond's champion, and reach Spring Meadow (level 8) in one game of Butterfly Joust.",
    subtleHint: 'He wins every level clash, so never meet him level.',
    icon: 'kind-icon:bee',
    rule: { kind: 'level', min: 8 },
    artPrompt:
      'A teal cat-eared robot riding a rainbow butterfly swooping down from above to bonk a portly bumblebee knight in shining armour, who tumbles into a soft cocoon, a golden sunset pond with lily pads below and the eyes of a lurking frog peeking from the water. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'butterfly-joust',
    key: 'thunderhead-tamed',
    tier: 2,
    label: 'Over Thunderhead Heights',
    message:
      "Three gardens and three champions down: Old Thunderhead's open eye could not stop your lance.",
    tooltip:
      'Beat Old Thunderhead, the champion of Thunderhead Heights, and reach Autumn Orchard (level 22) in one game of Butterfly Joust.',
    subtleHint: 'Wait for the eye to open, then meet it level, lance first.',
    icon: 'kind-icon:lightning',
    rule: { kind: 'level', min: 22 },
    artPrompt:
      'A teal cat-eared robot on a rainbow butterfly charging level and lance-first into the glowing open eye of a huge grumpy storm cloud champion, rain streaking and lightning crackling around high cliff ledges, the cloud bursting into sunlit sparkles. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'butterfly-joust',
    key: 'mirror-moth',
    tier: 3,
    label: 'Face the Mirror Moth',
    message:
      'Six gardens crossed, and in the Moon Garden the Mirror Moth flies your own flight back at you.',
    tooltip:
      'Reach the Mirror Moth, the Moon Garden champion (level 43), in one game of Butterfly Joust.',
    subtleHint: 'The last champion knows every move you have ever made.',
    icon: 'kind-icon:moon',
    rule: { kind: 'level', min: 43 },
    artPrompt:
      'A teal cat-eared robot on a rainbow butterfly facing a shimmering silver moth rider that mirrors its pose exactly, both lances raised, beneath a huge glowing full moon in a night garden of fading stone ledges and drifting silver clouds. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'kind-pinball',
    key: 'first-village',
    tier: 1,
    label: 'First Village Lit!',
    message: 'You shot the saucer and set off your very first village rescue.',
    tooltip:
      'Shoot the award saucer to start a village rescue in one game of Kind Pinball (the 3D table).',
    subtleHint: 'A-M-I readies the saucer, and the saucer readies a village.',
    icon: 'kind-icon:target',
    rule: { kind: 'mastery', id: 'first-village' },
    artPrompt:
      'A gleaming steel pinball dropping into a glowing award saucer on a candy-coloured pinball playfield, a burst of light waking up a tiny painted village of round huts on the table, a small delivery drone lifting off with a white mosquito net, flippers and ramps framing the scene. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'kind-pinball',
    key: 'ami-multiball',
    tier: 2,
    label: 'AMI Multiball!',
    message:
      'Locks lit and balls loose: three steel balls flying at once over the village table.',
    tooltip:
      'Lock the balls to start AMI Multiball in one game of Kind Pinball (the 3D table).',
    subtleHint: 'The lock likes company before the fun begins.',
    icon: 'kind-icon:orbit',
    rule: { kind: 'mastery', id: 'multiball' },
    artPrompt:
      'Three gleaming steel pinballs flying at once across a glowing candy-coloured pinball playfield, light trails curving up two crossing ramps, flashers blazing, a small drone carrying a white mosquito net toward a painted village of round huts, flippers raised mid-flip. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'kind-pinball',
    key: 'super-jackpot',
    tier: 3,
    label: 'Super Jackpot!',
    message:
      'Two ramp jackpots in multiball, then the lock: the whole table erupted for the Super Jackpot.',
    tooltip:
      'During AMI Multiball, make two ramp jackpots and then shoot the lock for the Super Jackpot in one game of Kind Pinball (the 3D table).',
    subtleHint: 'Jackpot, jackpot, and then the lock is worth everything.',
    icon: 'kind-icon:treasure',
    rule: { kind: 'mastery', id: 'super-jackpot' },
    artPrompt:
      'A steel pinball slamming into a glowing lock as the whole candy-coloured pinball table erupts in golden fireworks, every lamp blazing, a beacon tower shooting a column of light, painted villages of round huts glowing safe under white mosquito nets, flippers raised in triumph. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'gloom-invaders',
    key: 'sunny-skies',
    tier: 1,
    label: 'Sunny Skies Ahead!',
    message:
      'Two skies of gloom turned into smiling rain clouds, and the garden got its first drink.',
    tooltip: 'Score 2,000 points in one game of Gloom Invaders.',
    subtleHint:
      'The top-row clouds are worth the most, and a cleared sky pays a bonus.',
    icon: 'kind-icon:sun',
    rule: { kind: 'score', min: 2000 },
    artPrompt:
      'A little solar robot on treads shining a bright golden sunbeam straight up into a grumpy grey gloom cloud that transforms into a smiling blue rain cloud, rows of gloom clouds marching above, a striped rainbow umbrella sheltering the robot, a garden of green sprouts drinking the rain below. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'gloom-invaders',
    key: 'garden-grows',
    tier: 2,
    label: 'The Garden Grows',
    message:
      'Five skies cleared, and five new flowers bloom in the garden below Sunny.',
    tooltip: 'Clear five waves and reach wave 6 in one game of Gloom Invaders.',
    subtleHint: 'Each wave starts lower, and each flower makes it worth it.',
    icon: 'kind-icon:sprout',
    rule: { kind: 'level', min: 6 },
    artPrompt:
      'A little solar robot on treads beaming proudly beside a row of five freshly bloomed rainbow flowers, smiling rain clouds drifting overhead watering them, worn rainbow umbrellas standing guard, the last gloom clouds retreating across a twilight sky. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
  {
    game: 'gloom-invaders',
    key: 'full-bloom',
    tier: 3,
    label: 'Full Bloom Garden!',
    message:
      'The gloom kept marching, Sunny kept shining, and the whole garden burst into bloom.',
    tooltip: 'Score 20,000 points in one game of Gloom Invaders.',
    subtleHint:
      'Catch the rainbow kite, keep an umbrella standing, and keep shining.',
    icon: 'kind-icon:rainbow',
    rule: { kind: 'score', min: 20_000 },
    artPrompt:
      'A little solar robot on treads standing in a garden in full bloom with flowers of every colour, a rainbow kite soaring overhead, dozens of smiling rain clouds raining gently, one last tattered rainbow umbrella beside the robot, sunbeams breaking through to scatter the final gloom. Centered emblem-like hero composition with a bold clear silhouette. 80s Saturday-morning cartoon cel painting, bold black ink outlines, flat cel colour with soft two-tone shadows, candy palette of teal, pink, purple and gold, glossy highlights, neon glow, sparkles and tiny stars',
  },
]
