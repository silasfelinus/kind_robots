// /utils/arcade/games.ts
//
// The Kind Robots Arcade registry. Adding a cabinet = one module under
// ./games/ plus one row here (and one loader). Metadata stays free of canvas
// code so the scores API can import it to validate submissions.
//
// The build queue lives in conductor projects/kr-arcade/games.yaml; queued
// games appear in the hall as "coming soon" cabinets.

import type { ArcadeGameMeta, ArcadeGameModule } from './types'
import { MASTERY_GOALS } from './pinball/rules/mastery'
import {
  RAINBOW_DIFFICULTY_NAMES,
  RAINBOW_MASTERY,
} from './games/rainbowLoadouts'

export const ARCADE_BLURB_MAX = 170

export function shortArcadeBlurb(blurb: string): string {
  if (blurb.length <= ARCADE_BLURB_MAX) return blurb
  const prefix = blurb.slice(0, ARCADE_BLURB_MAX - 1)
  const breakAt = prefix.lastIndexOf(' ')
  const end = breakAt > 120 ? breakAt : prefix.length
  return prefix.slice(0, end).trimEnd() + '…'
}

/**
 * The Canvas 2D Kind Pinball: the hall's table on a device without WebGL
 * (the 3D table's fallback, conductor kind-pinball/t-024).
 */
const KIND_PINBALL_2D: ArcadeGameMeta = {
  slug: 'kind-pinball',
  title: 'Kind Pinball',
  riffsOn: 'pinball',
  blurb:
    'AMI Village Rescue, a full Kind Robots pinball table with a dot-matrix display, two crossing ramps and two orbits. Plunge into the blinking lane for the skill shot. Roll through the N-E-T lanes to raise your bonus, hit the A-M-I targets to ready the saucer, then shoot the saucer to light a village. Light all five villages for the jackpot. Every third ramp shot starts a timed mode; play all four for the super jackpot. Chain ramps and orbits for combos. The third village lights AMI multiball: three balls, and every ramp or saucer shot flies a mosquito net to a village.',
  howTo: [
    'LEFT/RIGHT  FLIPPERS',
    'L/R OR SHOULDERS  FLIP',
    'A TO LAUNCH THE BALL',
    'PULL STICK, RELEASE',
    'UP  NUDGE THE TABLE',
    'BLINKING LANE = SKILL',
    'A-M-I READIES SAUCER',
    '5 VILLAGES = JACKPOT',
    '3 RAMPS START A MODE',
    'RAMP + ORBIT = COMBO',
    '3 VILLAGES = MULTIBALL',
  ],
  width: 288,
  height: 488,
  maxPlausibleScore: 50_000_000,
  titleArt: '/images/arcade/games/kind-pinball-title.webp',
  accent: '#facc15',
  controls: 'Flip, plunge, nudge',
}

export const ARCADE_GAMES: ArcadeGameMeta[] = [
  {
    slug: 'butterfly-blaster',
    title: 'Butterfly Blaster',
    riffsOn: 'Asteroids',
    blurb:
      'Fly a rainbow butterfly through the night sky and break up the mosquito swarms before they reach the village. Every wave you clear keeps a village safe. Seat a friend (up to four) for Co-op Flight: shared village and lives, and when your ribbons cross the team lasso pays double.',
    howTo: [
      'LEFT/RIGHT  TURN',
      'UP  FLUTTER FORWARD',
      'A  SPARKLE   B  HOP',
      'BIG SWARMS SPLIT!',
      "CATCH AMI'S NETS",
      'TWO TO FOUR: CO-OP FLIGHT',
      'CROSS RIBBONS: TEAM LASSO!',
    ],
    width: 480,
    height: 360,
    maxPlausibleScore: 12_000_000,
    titleArt: '/images/arcade/games/butterfly-blaster-title.webp',
    accent: '#f472b6',
    controls: 'Turn, flutter, sparkle, hop',
    maxPlayers: 4,
  },
  {
    slug: 'battery-maze',
    title: 'Battery Maze',
    riffsOn: 'Pac-Man',
    blurb:
      "Steer a little cat-eared robot through the city's glitchy power grid, recharging maze after maze while gremlins with their own ways of hunting give chase. Power cells make them sleepy: bump them into a Friend Train, flip Rewire switches, and face three bosses. Play co-op with a friend, chase the Rush Hour score, or play Gremlin Tag with up to four.",
    howTo: [
      'STEER THE ROBOT',
      'EAT EVERY SPARK',
      'CELLS MAKE GREMLINS SLEEPY',
      'BUMP THEM: FRIEND TRAIN!',
      'A  FLIP A REWIRE SWITCH',
      'TWO SEATED: CO-OP ROBOTS',
      'TWO TO FOUR: GREMLIN TAG',
    ],
    width: 322,
    height: 340,
    maxPlausibleScore: 3_000_000,
    titleArt: '/images/arcade/games/battery-maze-title.webp',
    accent: '#facc15',
    controls: 'Steer, flip switches',
    maxPlayers: 4,
  },
  {
    slug: 'rescue-rally',
    title: 'Rescue Rally',
    riffsOn: 'Robotron',
    blurb:
      "A glitch is spreading through the city's helper bots. Sweep five districts with a kindness beam that reboots them into friends, and get every person, pet and little bot home before stompers knock them dizzy or hypnos glitch them. Touch to rescue at once, or lead a parade of three to the beacon for double. Twin-stick aim (or move to aim, hold B to strafe). The Neon Plaza, the Toy Factory's belts and crates, the Botanic Dome's vines, the Data Docks' laser gates and the Storm Rooftops' lightning each end on a boss, from the Big Wind-Up to the Glitch Core. Reboot fifteen in a chain for a Reboot Squad bot at your side, spend thank-you hearts at the Shelter between districts, find five golden chips for the Reunion and the true ending, and the rally saves at each district. Up to four heroes play together, picking each other up when one goes down. Rally 100 is the leaderboard's main event; District Time Attack, Classic Rally and a medal board for every wave round it out.",
    howTo: [
      'MOVE, AIM WITH THE OTHER STICK',
      'ONE STICK: MOVE TO AIM, A BEAM',
      'HOLD B: STRAFE, LEAD A PARADE',
      'TOUCH THE FAMILY TO RESCUE',
      'PARADE TO THE BEACON: DOUBLE',
      'BEAM GLITCHED FRIENDS TO REBOOT',
      'STOMPERS CAN ONLY BE SHOVED',
    ],
    width: 480,
    height: 360,
    maxPlausibleScore: 20_000_000,
    titleArt: '/images/arcade/games/rescue-rally-title.webp',
    accent: '#22d3ee',
    controls: 'Twin-stick or move to aim, beam, strafe and lead',
    twinStick: true,
    maxPlayers: 4,
  },
  {
    slug: 'sink-suds',
    title: 'Sink Suds',
    riffsOn: 'Bubbles',
    blurb:
      'One brave soap bubble washes the whole robot house, room by room. Every basin has its own shape and water: the kitchen sink and its double, a long tub with a faucet current, a spinning laundry drum, a fish tank seen from the side, a rain-pocked birdbath and a car wash on a conveyor. Each starts under a film of grime that comes clean wherever you roll. Crumbs, grease and grime feed you, and your size is everything: your health (a hit shrinks you), your weapon (big bubbles eat mites and tip brushes), your ammunition (B blows a soap shot that traps a pest and floats it down the drain) and the drain key. Fourteen pests each have a tell, from sponges that soak your suds to water striders that skate a ripple line. Every room has a special basin with its own job: scrub floating plates, round up rubber ducks, pair odd socks, clear the fish-tank glass, race the rain, detail a robot car. Three Wash Cycles end on Bristleton the Big Brush, Mossback the giant snail and the Grime King, swept down the drain by a giant bubble. Soap bars buy upgrades and skins in the Soap Shop, progress saves at every room, and six golden soaps open the Bubble Bath Palace and the true ending. A clear opens Deep Clean. Seat two to four for Bubble Buddies, where bubbles that touch merge into one big bubble steered by everyone, or Suds Sumo, where the last bubble in the basin wins. Squeaky Clean races the clock basin by basin, Endless Sink is the leaderboard event, and Classic Sink keeps the original kitchen sink. Every basin holds three medals: Squeaky Clean, No Pop and Quick Rinse.',
    howTo: [
      'STEER, A TO PUFF',
      'EAT CRUMBS AND GRIME TO GROW',
      'B: A SOAP SHOT TRAPS A PEST',
      'HITS SHRINK YOU, SMALL ONES POP',
      'FULL? SAIL DOWN THE DRAIN!',
      'SIX ROOMS, THREE BOSSES',
      '2-4 PLAYERS: MERGE OR SUMO',
    ],
    width: 420,
    height: 360,
    maxPlausibleScore: 10_000_000,
    maxPlayers: 4,
    titleArt: '/images/arcade/games/sink-suds-title.webp',
    accent: '#a5f3fc',
    controls: 'Steer, puff, shoot soap',
  },
  {
    slug: 'pipe-pals',
    title: 'Pipe Pals',
    riffsOn: 'Mario Bros.',
    blurb:
      'Grumpy critters are crawling out of the Kind Robots plumbing. Bump the floor under one to flip it, then tap it to send it bowling along the ledge, taking any other flipped critter with it. Crab bots take two bumps, shell knights lose their armour first, spring fleas only flip when they land, and ember sparks are snuffed from below. Tools roll out of the pipes and the KIND block flips the whole floor. Work the city district by district: the Day Shift (a rooftop reservoir, a greenhouse of sagging vines, a bubbling laundry) ends with the Big Shell, the Swing Shift (icy cold storage, a boiler works of steam vents, a clockwork water tower) ends with the Thermostat, and the Night Shift (tidal flooded mains, a storm drain lit only by lamps and lightning) ends with the Clog King and a race up the flushing drain. Every district has its own special job and bonus round, the Workshop turns coins into upgrades, progress saves at each district, and eight golden valves open a secret ninth district and the true ending. Play the teal pal (longer bumps) or the pink pal (higher, floatier jumps), or seat two players for same-device co-op or a Versus match full of bump-steals. Overtime is the endless score attack, Time Trial races the clock district by district, and every phase holds three medals: Clean Sweep, Chain Master and Swift Fix.',
    howTo: [
      'RUN, A TO JUMP',
      'BUMP FLOORS FROM BELOW',
      'TOUCH FLIPPED CRITTERS',
      'KICKS BOWL AND CHAIN',
      'SNUFF EMBERS FROM BELOW',
      'B BLOWS WAND BUBBLES',
      'TWO PLAYERS: CO-OP OR VERSUS',
    ],
    width: 448,
    height: 336,
    maxPlausibleScore: 5_000_000,
    titleArt: '/images/arcade/games/pipe-pals-title.webp',
    accent: '#4ade80',
    controls: 'Run, jump, bump',
    maxPlayers: 2,
  },
  {
    slug: 'butterfly-joust',
    title: 'Butterfly Joust',
    riffsOn: 'Joust',
    blurb:
      "Ride a rainbow butterfly in the Four Gardens Tourney and joust the grumpy moth riders. Whoever is higher wins: bonk them from above and they curl into cocoons you can scoop up before they hatch. Bonk again before you land for an Air Combo, or hold B and let go to brace and lunge in a Charge Joust that wins a level clash. Six gardens each bring their own ledges, weather and riders. In Sunset Pond the frog lurks below. Spring Meadow's flowers fold shut, and Thunderhead Heights brings rain and lightning. Autumn Orchard drops apples and blows gusts, Lantern Snowfield has ice and a cracking pond, and in the Moon Garden the ledges fade when the clouds cross the moon. Every garden ends in a champion's bout, from Sir Bumbleton to the Mirror Moth, who flies your own flight back at you. Between gardens, spend pollen in the Wing Garden. Win a golden petal in five gardens to open the Rainbow Lists and the true ending, then ride the Champion's Circuit a lap harder. Up to four can play: together, with a team bonus for never bonking a friend, or in Last Butterfly Flapping, where the most bonks in three minutes wins. Every wave has three medals to win (Unbonked, Air Ace and Quick Lance), and the medal board keeps them garden by garden. The Endless Pond is the leaderboard's main event: endless waves with every rider in one garden. The Classic Pond keeps the old waves at sunset.",
    howTo: [
      'TAP A TO FLAP, STEER LEFT/RIGHT',
      'HIGHER RIDER WINS THE JOUST',
      'HOLD B, LET GO: CHARGE LUNGE',
      'BONK IN THE AIR FOR A COMBO',
      'SCOOP COCOONS BEFORE THEY HATCH',
      'FLAP HARD TO ESCAPE THE FROG',
      "BEAT EACH GARDEN'S CHAMPION",
      'ENDLESS POND: HOW FAR CAN YOU GO?',
    ],
    width: 448,
    height: 336,
    maxPlausibleScore: 5_000_000,
    titleArt: '/images/arcade/games/butterfly-joust-title.webp',
    accent: '#f9a8d4',
    controls: 'Flap, steer, joust',
    maxPlayers: 4,
  },
  {
    // The 3D table (conductor kind-pinball/t-024): Three.js and Rapier, the
    // Ridge past the arch and the hidden room behind the backbox. A device
    // without WebGL gets the Canvas 2D table; both play the one board.
    slug: 'kind-pinball',
    title: 'Kind Pinball',
    riffsOn: 'pinball',
    blurb:
      'AMI Village Rescue in 3D: a full pinball table in a lit arcade, with a steel ball on real physics, crossing ramps, two orbits, a dot-matrix display and a camera that follows the ball. Shoot the saucer to start a village mode, lock balls for AMI multiball, and take the upper feed to the Ridge, a second playfield past the arch with its own flippers. Somewhere behind the backbox, a secret waits.',
    howTo: [
      'LEFT/RIGHT  FLIPPERS',
      'L/R OR SHOULDERS  FLIP',
      'A TO LAUNCH THE BALL',
      'PULL STICK, RELEASE',
      'UP  NUDGE THE TABLE',
      'SAUCER STARTS A VILLAGE',
      'LOCKS LIGHT MULTIBALL',
      'UPPER FEED: THE RIDGE',
    ],
    mastery: MASTERY_GOALS,
    touchLayout: 'pinball',
    width: 360,
    height: 640,
    // Good players' games run to a few million, the best past ten (TUNING.md);
    // the Canvas table's ceiling was 50 million.
    maxPlausibleScore: 100_000_000,
    titleArt: '/images/arcade/games/kind-pinball-title.webp',
    accent: '#facc15',
    controls: 'Flip, plunge, nudge',
    renderMode: 'webgl',
    fallback: KIND_PINBALL_2D,
  },
  {
    slug: 'gloom-invaders',
    title: 'Gloom Invaders',
    riffsOn: 'Space Invaders',
    blurb:
      'Rows of grumpy gloom clouds march down the sky. Shine sunbeams up at them to turn each one into a smiling rain cloud that waters the garden, and shelter under rainbow umbrellas that wear away. Each wave starts lower and marches faster, and a rainbow kite crosses the top for a mystery bonus.',
    howTo: [
      'LEFT/RIGHT  MOVE',
      'A OR UP  SUNBEAM',
      'ONE BEAM AT A TIME',
      'UMBRELLAS WEAR AWAY',
      'KITE = MYSTERY BONUS',
    ],
    width: 288,
    height: 384,
    maxPlausibleScore: 2_000_000,
    titleArt: '/images/arcade/games/gloom-invaders-title.webp',
    accent: '#fde047',
    controls: 'Move, shine',
  },
  {
    slug: 'hedgehog-crossing',
    title: 'Hedgehog Crossing',
    riffsOn: 'Frogger',
    blurb:
      'Walk a family of hedgehogs home, one at a time: across a busy road of robot traffic, then over a creek of drifting logs and paddling turtles to the five burrows in the hedge. Turtles dive, a fox snoozes in a burrow from level two, and a ladybug visits for a bonus.',
    howTo: [
      'ARROWS  HOP',
      'A  HOP FORWARD',
      'RIDE LOGS AND TURTLES',
      'TURTLES DIVE!',
      'FILL ALL 5 BURROWS',
      'DONT WAKE THE FOX',
      'B  BRISTLE DASH',
      'LEAD HOGLETS HOME',
    ],
    width: 280,
    height: 320,
    maxPlausibleScore: 2_000_000,
    titleArt: '/images/arcade/games/hedgehog-crossing-title.webp',
    accent: '#86efac',
    controls: 'Hop, dash',
  },
  {
    slug: 'ribbon-riders',
    title: 'Ribbon Riders',
    riffsOn: 'Tron light cycles',
    blurb:
      'Ride a light-bike that unrolls a glowing rainbow ribbon. Anyone who bumps into a ribbon or the wall is out of the round, so box the rival riders in before you bump into something yourself. Each round brings another rival, smarter steering, faster bikes and an arena wall that closes in.',
    howTo: [
      'ARROWS  STEER',
      'A TURBO  B BRAKE',
      'DONT BUMP A RIBBON',
      'CLOSE A LOOP = WRAP',
      'RIDE CLOSE = CHAIN',
    ],
    width: 288,
    height: 312,
    maxPlausibleScore: 5_000_000,
    titleArt: '/images/arcade/games/ribbon-riders-title.webp',
    accent: '#22d3ee',
    controls: 'Steer, turbo, brake',
  },
  {
    slug: 'burrow-buddy',
    title: 'Burrow Buddy',
    riffsOn: 'Dig Dug',
    blurb:
      'Tunnel through a garden in layers of soil. Puff bubbles at grumpy grubs until they swell up and float gently away, or dig under a turnip and drop it on a whole group for a bonus. Grubs drift through the soil as ghosts when they get bored, beetles breathe fire from the second garden, and two turnips bring out a veggie bonus.',
    howTo: [
      'ARROWS  DIG',
      'A  PUFF BUBBLES',
      'PUFF 4 TIMES = POP',
      'DROP TURNIPS ON GRUBS',
      'WATCH FOR FIRE',
    ],
    width: 256,
    height: 262,
    maxPlausibleScore: 5_000_000,
    titleArt: '/images/arcade/games/burrow-buddy-title.webp',
    accent: '#fb923c',
    controls: 'Dig, puff',
  },
  {
    slug: 'repair-rampage',
    title: 'Repair Rampage',
    riffsOn: 'Rampage',
    blurb:
      'A storm has wrecked the city. Bolt, a giant friendly robot, climbs the towers and fixes them window by window, rescues kittens from the ledges and shoos the news drones whose flashbulbs dazzle it off the wall. Broken towers wobble and fall if you dawdle, and every dazzle, long drop and fallen tower costs charge.',
    howTo: [
      'LEFT/RIGHT  WALK',
      'UP AT A TOWER  CLIMB',
      'A  FIX A WINDOW',
      'A BY A DRONE  SHOO IT',
      'FIX THE WINDOW = KITTEN',
      'WOBBLING TOWERS FALL!',
    ],
    width: 320,
    height: 240,
    maxPlausibleScore: 5_000_000,
    titleArt: '/images/arcade/games/repair-rampage-title.webp',
    accent: '#f87171',
    controls: 'Climb, fix, shoo',
  },
  {
    slug: 'kindness-gauntlet',
    title: 'Kindness Gauntlet',
    riffsOn: 'Gauntlet II',
    blurb:
      "Below the server floors lies the Deep Archive, the memory of the Old Mainframe, a kindly machine who ran the city for decades and is forgetting herself. Pick mighty Hugs, sturdy Fix, magical Sage or speedy Zip (up to four can play) and descend through five wings of hand-built floors: the Punch-Card Vault, the Tape Library, the Arcade Basement, the Cloud Atrium and the Core. Fourteen kinds of glitch each have a tell and an answer; card walls, mirror racks, dance floors, clouds and firewall gates change every wing; sparks that hit a partner share charge, and the Hug Token draws every glitch to whoever holds it. Find each floor's secret, five Memory Cards and the medals, beat five Guardians, and wake her up. Then try Reboot, the Endless Archive, the Lost & Found or a Score Duel.",
    howTo: [
      'PICK A BOT AND A MODE',
      'A  SPARKS  HOLD A TO AIM',
      'B  KINDNESS PULSE',
      'EVERY GLITCH HAS A TELL',
      'SPARK A PARTNER: SHARE',
      'THE HUG TOKEN DRAWS THEM',
      'FIND FIVE MEMORY CARDS',
      'WAKE THE OLD MAINFRAME',
    ],
    width: 320,
    height: 240,
    maxPlausibleScore: 10_000_000,
    titleArt: '/images/arcade/games/kindness-gauntlet-title.webp',
    accent: '#fbbf24',
    controls: 'Pick a bot and a mode, move, spark, pulse',
    maxPlayers: 4,
  },
  {
    slug: 'prize-show-panic',
    title: 'Prize Show Panic',
    riffsOn: 'Smash TV',
    blurb:
      "A robot game show, broadcast as a season. Each episode is a map of studio rooms, and between rooms the map shows where every door leads (a swarm, a prize vault, a trap or a sponsor challenge) with its danger and its prize, so you pick the safe route or the rich one. Every room runs its own script: crashers pour in through the doors on cue, whoopee cushions and banana peels lie on the floor, spotlight beams step across the stage on the beat, and a wall of studio cameras fires flashbulbs. Spray the confetti cannon and the crashers get happy and dance off the set, grab the prizes, and reach a door before the host's countdown runs out. Golden tickets hide in the prize vault, in a sponsor's no-hit challenge and behind a cracked wall. Four episodes, each on its own set with its own mid-boss and boss, then a Live Finale. Opening Night is the game show: the Parade Float (past half health its cake's candles light and fire sparks), then the Big Wobble, a giant inflatable whose every arm and leg is its own target. Cooking Showdown is the kitchen, with hot plates that glow and then sizzle, conveyor counters and flour clouds: the Pie Cart circles the room lobbing pies, and the Souffle Supreme rises out of reach and falls open, then splits into cupcakes that re-form if you leave them. Countdown Concert moves to the beat, with speaker stacks thumping out bass rings (slip through the gap), strobes and mosh pits: the Mosh Mascot crowd-surfs until you clear its crowd, and the Jumbotron's face hops screen to screen until you crack the screens and corner it. Galaxy Parade floats in low gravity, round a turning ring and through teleport doors: the Mothership beams your prizes away until you break its beam, and the Conga Dragon sheds dancing segments as it speeds up. The Live Finale runs through every set to the host's own Prize Machine, a wheel of acts that ends in a dance-off. Ten golden tickets open the Grand Prize Vault and the true ending; then the credits roll and the season reruns, harder. Progress is saved at the start of every episode. Nineteen kinds of party crasher each show their move before they make it: balloon poppers, sweeper tanks with armoured fronts, stagehands laying mines, spotlight drones, a charging mascot, camera cranes, pie chefs, egg-timer bots, meatball rollers, roadies with flight cases, stage divers, hecklers, saucer cams, mirror clones and fluffballs. Ten power-ups stack with their own timers, from party poppers, bubble rockets and a glitter laser to streamer orbiters, roller skates, a foam cannon and a cardboard cutout of you. Aim with a second stick (the right stick, the on-screen aim stick, or the arrows while WASD moves), or hold B to lock your aim. TINSEL the host cuts in with a line for every big moment (and LENS, the dry camera bot, joins for the concert), a ratings meter rises with style and drains when you idle or get hit, from Off Air to Prime Time, where every tier multiplies the score, and quick cheers chain into a bigger multiplier. Between episodes the haul is tallied and the Prize Swap trades cars, toasters, cash and golden tickets for an extra contestant, a starting power-up, more time or a secret. Later loops roll room twists: Lights Out, Foam Party, Confetti Storm, Double Time, Audience Participation and Sudden Death. Pick your contestant: Sparkle the all-rounder, quick Zippy, Boomer with her slow, heavy cannon, or Glimmer with a shield that heals itself, and up to four can play at once on one shared pool of lives (in co-op each seat aims the way it moves, or holds B to lock its aim). Between episodes come the commercial breaks, four mini-games that pay out in prizes: spin the wheel, catch the prizes falling from the rafters, dodge the pies, and call higher or lower on the price cards. Clearing the season unlocks Rerun, New Game+ with every room's script remixed (other crashers, other doors, the floor flipped) and more twists, and episode select. Marathon is the leaderboard's main event: endless legs of rooms drawn from the whole season, a safe lane and a rich lane round the track to a boss, a step harder every two legs. Every room has three medals to win, Flawless (no hit), Full Haul (every prize grabbed, none lost) and Prime Time (out of the room at Prime Time), and the medal board keeps them all, episode by episode.",
    howTo: [
      'WASD OR STICK  MOVE',
      'ARROWS OR 2ND STICK  AIM',
      'A SPRAY, HOLD B LOCK AIM',
      'PICK SAFE OR RICH DOORS',
      'BEAT THE COUNTDOWN',
      'FIND THE GOLDEN TICKETS',
      'EARN 3 MEDALS PER ROOM',
      'MARATHON: GO THE DISTANCE',
    ],
    width: 320,
    height: 240,
    maxPlausibleScore: 250_000_000,
    titleArt: '/images/arcade/games/prize-show-panic-title.webp',
    accent: '#e879f9',
    controls: 'Move, spray, aim with a second stick',
    twinStick: true,
    maxPlayers: 4,
  },
  {
    slug: 'zuzu-ghost-trail',
    title: 'Zuzu: Ghost Trail',
    riffsOn: "Ghosts 'n Goblins",
    blurb:
      'Zuzu, the koala ronin, walks a haunted weird-west trail toward the mission bell that is waking the dead: six stages of hand-built acts, from a ghost town at dusk through the bone yard, a drowned watering hole whose tide rises and falls, Storm Crow Pass, the mission bell tower and the abbey beneath it. Every squad of the dead is placed by hand and stays down once beaten; every one of the six bosses (the Grave Marshal, the Bone Bull, the Drowned Ferryman, the Storm-Crow Matriarch, the Bell Heretic and the Abbess) shows its attacks before they land. The first hit knocks his poncho and kasa off; a second sends him back to the checkpoint. Crates and carried bundles hold new gear: three-way shuriken, a boomerang kasa, a lantern that leaves a ground fire, or the short, strong iai cut. Relics hide off the beaten path, and finding them all earns the true ending. Progress saves at every act, and a clear unlocks New Game+.',
    howTo: [
      'LEFT/RIGHT  WALK',
      'UP OR B JUMP  PAD A JUMP',
      'A ATTACK  PAD B ATTACK',
      'ONE HIT LOSES THE PONCHO',
      'BREAK CRATES FOR A NEW ONE',
      'WATCH FOR EACH ATTACK TELL',
      'SIX STAGES, SIX BOSSES',
      'PROGRESS SAVES EACH ACT',
    ],
    width: 320,
    height: 240,
    maxPlausibleScore: 5_000_000,
    titleArt: '/images/arcade/games/zuzu-ghost-trail-title.webp',
    accent: '#ea580c',
    controls: 'Walk, jump, throw, cut',
  },
  {
    slug: 'station-sweep',
    title: 'Station Sweep',
    riffsOn: 'Xenophobe',
    blurb:
      'Mop, the station cleaning robot, sweeps a space station overrun by glitch critters, deck by deck. Egg sacs hatch rollers that bowl along the floor (crouch to sweep them), biters that spit, and ceiling crawlers that drop and cling until Mop jumps. Critters left alone grow big, and the station is on a clock. Ride the lifts between decks; clean every one before time runs out. Up to three can sweep on one device, split screen, each on a deck of their own.',
    howTo: [
      'LEFT/RIGHT  WALK',
      'DOWN  CROUCH, SWEEP LOW',
      'UP OR B  JUMP',
      'A  SWEEPER BEAM',
      'JUMP TO SHAKE CRAWLERS',
      'IN A LIFT UP OR DOWN RIDES',
      'CLEAN EVERY DECK IN TIME',
      'UP TO 3: SPLIT SCREEN',
    ],
    width: 320,
    height: 240,
    maxPlausibleScore: 10_000_000,
    titleArt: '/images/arcade/games/station-sweep-title.webp',
    accent: '#34d399',
    controls: 'Walk, crouch, jump, sweep, ride',
    maxPlayers: 3,
  },
  {
    slug: 'rain-catcher',
    title: 'Rain Catcher',
    riffsOn: 'Missile Command',
    blurb:
      'Storm clouds drop hailstones toward six seedling beds. Steer the sight and pop rainbow umbrella bursts from three sprout launchers to catch the hail in midair. Hail splits, a grumpy thunder-goose drops more, and lightning sprites swerve around your umbrellas. Spare umbrellas and saved beds pay a bonus between waves.',
    howTo: [
      'ARROWS  MOVE THE SIGHT',
      'A OR B  UMBRELLA BURST',
      'BURSTS CATCH THE HAIL',
      'NEAREST LAUNCHER FIRES',
      'SAVE THE SEEDLINGS',
      'BEDS REGROW EVERY 10000',
    ],
    width: 320,
    height: 240,
    maxPlausibleScore: 3_000_000,
    titleArt: '/images/arcade/games/rain-catcher-title.webp',
    accent: '#38bdf8',
    controls: 'Aim, burst',
  },
  {
    slug: 'brick-bloom',
    title: 'Brick Bloom',
    riffsOn: 'Breakout / Arkanoid',
    blurb:
      'A paddle bot bounces a pollen ball into walls of glitch crates, and every crate cracked frees a flower. Where the ball meets the paddle sets its angle. Catch falling seeds for a wide paddle, a sticky paddle, three balls or a calmer ball. Tough crates take several hits, bolted crates never break, and a drifting gloom puff knocks the ball off course.',
    howTo: [
      'LEFT/RIGHT  MOVE',
      'A  LAUNCH THE BALL',
      'EDGES ANGLE IT',
      'SEEDS  W S M C +',
      'BOLTS NEVER BREAK',
      'CRACK EVERY CRATE',
    ],
    width: 256,
    height: 320,
    maxPlausibleScore: 3_000_000,
    titleArt: '/images/arcade/games/brick-bloom-title.webp',
    accent: '#f472b6',
    controls: 'Move, launch',
  },
  {
    slug: 'seed-lander',
    title: 'Seed Lander',
    riffsOn: 'Lunar Lander',
    blurb:
      'Pilot a seed pod down onto the garden pads of a windy hillside, leaning and puffing to slow the fall. Land soft, slow and level to plant the seed; the narrower the pad, the bigger the bloom. Every planting refills a little sunlight and moves on to a rougher, gustier hill.',
    howTo: [
      'LEFT/RIGHT  LEAN',
      'UP OR A  PUFF',
      'B HOP  DOWN WINCH',
      'LAND SLOW AND LEVEL',
      'GREEN GAUGES = SAFE',
      'NARROW PADS PAY MORE',
      'WATCH THE WIND',
    ],
    width: 320,
    height: 240,
    maxPlausibleScore: 2_000_000,
    titleArt: '/images/arcade/games/seed-lander-title.webp',
    accent: '#84cc16',
    controls: 'Lean, puff',
  },
  {
    slug: 'pixel-hop',
    title: 'Pixel Hop',
    riffsOn: 'Q*bert',
    blurb:
      'Hop a pyramid of tiles diagonally and repaint every top to the target colour. Gumballs bounce down from the top, and a purple one hatches into Boing, a grumpy spring bot who follows you hop by hop; lure him off the edge from a floating disc. Green gumballs freeze everyone, and the repaint gremlin undoes your work until you catch it.',
    howTo: [
      'UP  HOP UP-RIGHT',
      'RIGHT  HOP DOWN-RIGHT',
      'DOWN  HOP DOWN-LEFT',
      'LEFT  HOP UP-LEFT',
      'PAINT EVERY TILE',
      'DISCS RIDE TO THE TOP',
      'GREEN = FREEZE',
    ],
    width: 256,
    height: 240,
    maxPlausibleScore: 3_000_000,
    titleArt: '/images/arcade/games/pixel-hop-title.webp',
    accent: '#fb923c',
    controls: 'Hop diagonally',
  },
  {
    slug: 'glitch-garden',
    title: 'Glitch Garden',
    riffsOn: 'Centipede',
    blurb:
      'A long glitch-worm winds down through a garden of glitchy mushroom lamps. Spray fix-it beams up from the flowerbed: every fixed segment drops out as a sprout and the worm splits, and sprayed lamps and sprouts bloom into flowers. A beetle zig-zags through the bed nibbling lamps, and a moth dives down planting new ones.',
    howTo: [
      'ARROWS  MOVE',
      'A  FIX-IT SPRAY',
      'FIX EVERY SEGMENT',
      'WORMS SPLIT IN TWO',
      'SPRAY LAMPS TO BLOOM',
      'MIND THE BEETLE',
    ],
    width: 240,
    height: 304,
    maxPlausibleScore: 3_000_000,
    titleArt: '/images/arcade/games/glitch-garden-title.webp',
    accent: '#a855f7',
    controls: 'Move, spray',
  },
  {
    slug: 'quilt-quest',
    title: 'Quilt Quest',
    riffsOn: 'Qix',
    blurb:
      'A needle-bot stitches threads across a blank quilt to claim colourful patches, while a tangle sprite roams the open cloth; if it brushes a thread mid-stitch, the thread snaps. Hold B for a slow stitch worth double. Stop mid-stitch and a fuse starts unpicking it, and from level 2 sparks run along the edges. Claim the target share to finish each quilt.',
    howTo: [
      'ARROWS  MOVE',
      'HOLD A  STITCH',
      'HOLD B  SLOW X2',
      'REACH AN EDGE',
      'MIND THE TANGLE',
      'DONT STOP MIDWAY',
    ],
    width: 256,
    height: 240,
    maxPlausibleScore: 3_000_000,
    titleArt: '/images/arcade/games/quilt-quest-title.webp',
    accent: '#f9a8d4',
    controls: 'Move, stitch',
  },
  {
    slug: 'cocoa-counter',
    title: 'Cocoa Counter',
    riffsOn: 'Tapper',
    blurb:
      'Thirsty robots shuffle up four long counters toward the cocoa urns. Pour a mug and slide it down the right counter before a robot reaches the end, then catch every empty mug that slides back. Nudge a robot out of the door for a bonus, and walk down the counter for tips.',
    howTo: [
      'UP/DOWN  CHANGE COUNTER',
      'A  POUR A MUG',
      'LEFT/RIGHT  WALK',
      'CATCH THE EMPTIES',
      'NO ROBOT AT THE URN',
      'GRAB THE TIPS',
    ],
    width: 320,
    height: 240,
    maxPlausibleScore: 2_000_000,
    titleArt: '/images/arcade/games/cocoa-counter-title.webp',
    accent: '#f97316',
    controls: 'Change counter, pour',
  },
  {
    slug: 'seed-burst',
    title: 'Seed Burst',
    riffsOn: 'Bomberman',
    blurb:
      'Plant seed pods in a hedge maze. Each one bursts into a cross of blooms that clears hedges and turns grumpy gnats into butterflies, so step out of the way first. Hedges hide extra pods, longer blooms and quick shoes. Up to four gardeners share one garden, one score and one pool of spares.',
    howTo: [
      'ARROWS  MOVE',
      'A  PLANT A POD',
      'PODS BURST IN A +',
      'STEP CLEAR!',
      'BLOOM THE GNATS',
      'HEDGES HIDE GIFTS',
    ],
    width: 240,
    height: 232,
    maxPlausibleScore: 2_000_000,
    titleArt: '/images/arcade/games/seed-burst-title.webp',
    accent: '#22c55e',
    controls: 'Move, plant',
    maxPlayers: 4,
  },
  {
    slug: 'lantern-swarm',
    title: 'Lantern Swarm',
    riffsOn: 'Galaga',
    blurb:
      'Night moths swirl in along looping paths and settle into a swaying formation, then peel off to dive at your paper lantern. Beam them home with light. A queen moth can carry your lantern off in her glow; beam her down to win it back for twin beams. Every third stage is a glow stage: beam as many fly-by moths as you can.',
    howTo: [
      'LEFT/RIGHT  MOVE',
      'A  BEAM',
      'QUEENS TAKE TWO',
      'DODGE THE DUST',
      'SHUN THE GLOW',
      'SAVE A LANTERN',
      'FOR TWIN BEAMS',
    ],
    width: 224,
    height: 288,
    maxPlausibleScore: 3_000_000,
    titleArt: '/images/arcade/games/lantern-swarm-title.webp',
    accent: '#fb923c',
    controls: 'Move, beam',
  },
  {
    slug: 'rover-ramble',
    title: 'Rover Ramble',
    riffsOn: 'Moon Patrol',
    blurb:
      'Roll a six-wheeled rover across a bumpy moon. Jump the craters, zap the boulders ahead, and shoot up at the meteor sprites that swoop overhead dropping pebbles. Reach each lettered checkpoint under par for a bigger bonus; from section 4, boulders roll in to meet you.',
    howTo: [
      'RIGHT  FASTER',
      'LEFT  SLOWER',
      'UP OR B  JUMP',
      'A  ZAP AHEAD + UP',
      'JUMP THE CRATERS',
      'BIG ROCKS TAKE 2',
      'BEAT THE PAR TIME',
    ],
    width: 320,
    height: 240,
    maxPlausibleScore: 2_000_000,
    titleArt: '/images/arcade/games/rover-ramble-title.webp',
    accent: '#38bdf8',
    controls: 'Speed, jump, zap',
  },
  {
    slug: 'cable-crawler',
    title: 'Cable Crawler',
    riffsOn: 'Nibbler',
    blurb:
      'Steer a charging-cable bot through a circuit-board maze, slurping sparks and growing longer with every bite. Walls only pause you, and lone corners turn you by themselves, but biting your own cable or letting the battery run flat unplugs you. Clear every spark to move on to a faster board.',
    howTo: [
      'ARROWS  STEER',
      'SLURP EVERY SPARK',
      'DONT BITE YOUR CABLE',
      'MIND THE BATTERY',
      'GOLD SPARKS = BIG',
    ],
    width: 240,
    height: 224,
    maxPlausibleScore: 60_000_000,
    titleArt: '/images/arcade/games/cable-crawler-title.webp',
    accent: '#2dd4bf',
    controls: 'Steer',
  },
  {
    slug: 'petal-post',
    title: 'Petal Post',
    riffsOn: 'Paperboy',
    blurb:
      'Scoot a delivery bot up a scrolling street and toss seed packets to the bright houses on your route: a mailbox catch pays best, the doorstep next. Dodge skateboarding cats, rolling bins, parked cars and sprinklers, and grab bundles to refill. Miss a home and it cancels; deliver to all and a neighbour signs up. Each day ends with a bonus run at targets.',
    howTo: [
      'UP/DOWN  FAST/SLOW',
      'LEFT/RIGHT  STEER',
      'A  TOSS LEFT',
      'BRIGHT HOUSES ONLY',
      'MAILBOX PAYS BEST',
      'GRAB THE BUNDLES',
    ],
    width: 256,
    height: 240,
    maxPlausibleScore: 2_000_000,
    titleArt: '/images/arcade/games/petal-post-title.webp',
    accent: '#ec4899',
    controls: 'Ride, steer, toss',
  },
  {
    slug: 'bumper-bubbles',
    title: 'Bumper Bubbles',
    riffsOn: 'Bubble Bobble',
    blurb:
      'Climb the hundred floors of Fizzwick Tower, trapping grumps in bubbles and popping them for treats, up to a final boss, five recipe cards and three endings. Play alone or seat up to four robots. Earn up to three stars on every floor, then try Floor Select, Pop Party, Endless Fizz and the Time Trial.',
    howTo: [
      'LEFT/RIGHT  WALK',
      'UP OR B  HOP',
      'A  BLOW A BUBBLE',
      'TRAP GREMLINS',
      'BUMP BUBBLES TO POP',
      'POP FAST FOR CHAINS',
      'FLOORS, PARTY, TRIAL',
      'UP TO FOUR ROBOTS',
    ],
    width: 256,
    height: 240,
    maxPlayers: 4,
    maxPlausibleScore: 20_000_000,
    titleArt: '/images/arcade/games/bumper-bubbles-title.webp',
    accent: '#38bdf8',
    controls: 'Walk, hop, blow',
  },
  {
    slug: 'crate-stack-shuffle',
    title: 'Crate Stack Shuffle',
    riffsOn: 'Tetris',
    blurb:
      'Stacker, a little warehouse robot, turns and drops falling crates of seven odd shapes to finish full rows, and every finished row ships out. Each ten rows is a new level and the crates fall faster. From level 3 some crates are wrapped in sticky tape, which only comes off the first time its row fills, and from level 5 heavy crates plummet. The warehouse changes every level, through five bays.',
    howTo: [
      'LEFT/RIGHT  SLIDE',
      'A OR UP  TURN',
      'DOWN  FALL FASTER',
      'B  DROP IT ALL',
      'FILL ROWS TO SHIP',
      'TAPE NEEDS TWO FILLS',
    ],
    width: 256,
    height: 288,
    maxPlausibleScore: 5_000_000,
    titleArt: '/images/arcade/games/crate-stack-shuffle-title.webp',
    accent: '#fbbf24',
    controls: 'Slide, turn, drop',
  },
  {
    slug: 'lamp-lighter-run',
    title: 'Lamp Lighter Run',
    riffsOn: 'Donkey Kong',
    blurb:
      'Wick, a lamplighter robot, climbs a scaffold of sloping girders to relight ten street lamps before the lantern timer runs out, hopping the gloom-balls that roll down from the chute. Every level the girders tilt more, the balls roll faster and the timer shrinks, across five night streets.',
    howTo: [
      'LEFT/RIGHT  WALK',
      'UP/DOWN  CLIMB',
      'A OR B  HOP',
      'TOUCH LAMPS TO LIGHT',
      'HOP A BALL FOR BONUS',
      'LIGHT ALL TEN LAMPS',
    ],
    width: 256,
    height: 288,
    maxPlausibleScore: 2_000_000,
    titleArt: '/images/arcade/games/lamp-lighter-run-title.webp',
    accent: '#fde68a',
    controls: 'Walk, climb, hop',
  },
  {
    slug: 'dune-digger-dash',
    title: 'Dune Digger Dash',
    riffsOn: 'Dig Dug',
    blurb:
      'Dig, a small digger robot, burrows through layered sand and pumps wandering sand-sprites until they pop, or drops a loose boulder on them. Sprites that cannot reach you float through the sand as eyes and dig in nearby. Every round brings more sprites, faster pursuit and more boulders, across six dunes, from gold sand to frostglass.',
    howTo: [
      'ARROWS  DIG AND WALK',
      'A OR B  PUMP',
      'PUMP 4 TIMES TO POP',
      'DIG OUT UNDER A ROCK',
      'DEEP SPRITES PAY MORE',
      'CLEAR EVERY SPRITE',
    ],
    width: 256,
    height: 288,
    maxPlausibleScore: 2_000_000,
    titleArt: '/images/arcade/games/dune-digger-dash-title.webp',
    accent: '#f59e5b',
    controls: 'Dig, pump',
  },
  {
    slug: 'zuzu-pinball',
    title: 'Zuzu: The Last Bell',
    riffsOn: 'original multi-level pinball',
    blurb:
      'Private Zuzu pinball preview. The 3D table has three ramps, two orbits, the River Croc, the Citadel lock and three multiballs, a raised Abbey deck with its own upper flippers, and its own score namespace. It is still being built; this is not the finished FX3-class game.',
    howTo: [
      'ARROWS  FLIPPERS',
      'DOWN  CHARGE PLUNGER',
      'RELEASE  LAUNCH',
      'UP  NUDGE',
      'SHOOT RIVER CROC',
      'HOLD B  UPPER ONLY',
    ],
    width: 288,
    height: 488,
    maxPlausibleScore: 0,
    titleArt: '/images/arcade/games/zuzu-last-bell-title.webp',
    accent: '#c78e62',
    controls: 'Flippers, plunge, nudge (engineering preview)',
    renderMode: 'webgl',
    touchLayout: 'pinball',
  },
]

export type ComingSoonCabinet = {
  slug: string
  title: string
  riffsOn: string
  accent: string
  /** Title art, once the art pipeline has rendered it. */
  titleArt?: string
}

// Mirrors the queued rows of conductor projects/kr-arcade/games.yaml.
export const COMING_SOON: ComingSoonCabinet[] = []

/**
 * Unlisted preview cabinets: playable by direct link
 * (/play/arcade?game=<slug>) but not shown in the hall or the hall of fame,
 * and with no plausible score, so they never post to a leaderboard. Kind
 * Pinball's 3D rebuild lives here until it replaces the Canvas table
 * (conductor kind-pinball/t-004; the Canvas game is the rollback path).
 */
export const PREVIEW_GAMES: ArcadeGameMeta[] = [
  {
    slug: 'save-the-plumber',
    title: 'Save the Plumber',
    riffsOn: 'classic side-scrolling platform adventures',
    fourButtons: true,
    buttonLabels: { a: 'JUMP', b: 'RUN / DUCK', x: 'WRENCH', y: 'SPECIAL' },
    blurb:
      'Private full-campaign build: pick one of eight painted heroines and run all eight worlds from Bluebell Pipeworks to the Stardrain Citadel, past eight bosses from Madame Pressure to Lady Spigot, and free Teo. Or pick Endless: one life, zone after zone, faster every time.',
    howTo: [
      'ARROWS  MOVE   B  RUN',
      'A OR UP  JUMP   HOLD FOR HIGHER',
      'DOWN  DUCK AND CRAWL   IN THE AIR  DROP',
      'X  WRENCH SPLASH',
      'Y  YOUR HEROINE SPECIAL',
      'DOWN ON A PIPE  ENTER',
      'ENDLESS  SHE RUNS   B DUCKS   ONE LIFE',
    ],
    width: 480,
    height: 270,
    maxPlausibleScore: 0,
    titleArt: '',
    accent: '#f5bb83',
    controls: 'Run (B), jump (A), wrench (X), special (Y)',
  },
  {
    slug: 'rainbow-bullet-hell-space-princess',
    title: 'Rainbow Bullet Hell Space Princess',
    riffsOn: 'cinematic side-scrolling shmups',
    blurb:
      'Private preview of the whole campaign: eight Acts from Pinkwake Estuary to the Eclipse Palace and the Eclipse Crown finale, nine bosses, eight guardians, route choices, rescues, a final choice with three endings, credits and one to four numbered local pilots.',
    howTo: [
      'ARROWS  FLY',
      'HOLD A  FIRE',
      'HOLD B  FOCUS',
      'FOCUS: NEEDLE · THREAD · LINK · ARC',
      'B AT 100%  SUPER',
      'X  PILOT SPECIAL',
      'Y  EVADE: ROLL · DASH · BLINK · BOOST',
      'START  PAUSE',
      '1 TO 4 LOCAL PILOTS',
      'CADET · PILOT · ACE DIFFICULTY',
      'EACH ACT START SAVES',
    ],
    width: 480,
    height: 270,
    maxPlausibleScore: 0,
    titleArt: '',
    accent: '#f9a8d4',
    controls: 'Fly, shoot, focus, super',
    maxPlayers: 4,
    startPauses: true,
    difficulty: RAINBOW_DIFFICULTY_NAMES,
    mastery: RAINBOW_MASTERY,
    calmMotion: true,
    fourButtons: true,
  },
]

/**
 * Scored games that are not hall cabinets: each lives on its own page and posts to the arcade
 * leaderboard under its slug, but stays out of the hall and the hall of fame until it is listed
 * (then it moves to LINKED_GAMES).
 */
export const UNLISTED_SCORED_GAMES: ArcadeGameMeta[] = [
  {
    slug: 'zuzu-lair',
    title: "Zuzu's Lair",
    riffsOn: "Dragon's Lair",
    blurb:
      'A quick-time animated adventure. Press the right direction in time and Zuzu lives on; miss and a life is lost.',
    howTo: ['ARROWS  DIRECTION', 'SPACE  SWORD', 'PRESS IN THE WINDOW'],
    width: 480,
    height: 270,
    maxPlausibleScore: 100_000,
    titleArt: '/zuzu-showdown-portraits/zuzu-vs-hd.webp',
    accent: '#fb923c',
    controls: 'Four directions and the sword',
  },
]

const LOADERS: Record<string, () => Promise<ArcadeGameModule>> = {
  'save-the-plumber': () => import('./games/savePlumberPreview'),
  'rainbow-bullet-hell-space-princess': () =>
    import('./games/rainbowPrincessPreview'),
  'butterfly-blaster': () => import('./games/butterflyBlaster'),
  'battery-maze': () => import('./games/batteryMaze'),
  'rescue-rally': () => import('./games/rescueRally'),
  'sink-suds': () => import('./games/sinkSuds'),
  'pipe-pals': () => import('./games/pipePals'),
  'butterfly-joust': () => import('./games/butterflyJoust'),
  'kind-pinball': () =>
    canRenderWebGL()
      ? import('./games/kindPinball3d').then(async (module) => {
          await module.prepare()
          return module
        })
      : import('./games/kindPinball'),
  'zuzu-pinball': () =>
    import('./games/zuzuPinball3d').then(async (module) => {
      await module.prepare()
      return module
    }),
  'gloom-invaders': () => import('./games/gloomInvaders'),
  'hedgehog-crossing': () => import('./games/hedgehogCrossing'),
  'ribbon-riders': () => import('./games/ribbonRiders'),
  'burrow-buddy': () => import('./games/burrowBuddy'),
  'repair-rampage': () => import('./games/repairRampage'),
  'kindness-gauntlet': () => import('./games/kindnessGauntlet'),
  'prize-show-panic': () => import('./games/prizeShowPanic'),
  'zuzu-ghost-trail': () => import('./games/zuzuGhostTrail'),
  'station-sweep': () => import('./games/stationSweep'),
  'rain-catcher': () => import('./games/rainCatcher'),
  'brick-bloom': () => import('./games/brickBloom'),
  'seed-lander': () => import('./games/seedLander'),
  'pixel-hop': () => import('./games/pixelHop'),
  'glitch-garden': () => import('./games/glitchGarden'),
  'quilt-quest': () => import('./games/quiltQuest'),
  'cocoa-counter': () => import('./games/cocoaCounter'),
  'seed-burst': () => import('./games/seedBurst'),
  'lantern-swarm': () => import('./games/lanternSwarm'),
  'rover-ramble': () => import('./games/roverRamble'),
  'cable-crawler': () => import('./games/cableCrawler'),
  'petal-post': () => import('./games/petalPost'),
  'bumper-bubbles': () => import('./games/bumperBubbles'),
  'crate-stack-shuffle': () => import('./games/crateStackShuffle'),
  'lamp-lighter-run': () => import('./games/lampLighterRun'),
  'dune-digger-dash': () => import('./games/duneDiggerDash'),
}

let webgl: boolean | null = null

/**
 * Whether this device can draw a WebGL cabinet, asked once. On the server
 * there is no device to ask, and the answer is yes.
 */
export function canRenderWebGL(): boolean {
  if (webgl !== null) return webgl
  if (typeof document === 'undefined') return true
  try {
    const canvas = document.createElement('canvas')
    webgl = !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    webgl = false
  }
  return webgl
}

/** Pin the answer (tests); null asks the device again. */
export function overrideWebGLSupport(value: boolean | null) {
  webgl = value
}

/**
 * Scored games with a page of their own that the hall lists beside its cabinets: the tile and the
 * hall-of-fame card link to `route`. Zuzu Showdown joined on 2026-10-11 (conductor zuzu-showdown
 * t-025: Silas, "If it's ready for prime time, it can move to the Play and out of admin").
 */
export const LINKED_GAMES: ArcadeGameMeta[] = [
  {
    slug: 'zuzu-showdown',
    title: 'Zuzu Showdown',
    riffsOn: 'Street Fighter II',
    blurb:
      'A 2D fighter of the Shifting Lands. Nine fighters; Story mode climbs past every one of them, your rival and the Swamp Witch, to The Thing Behind the Door.',
    howTo: [
      'ARROWS  MOVE',
      'U I  PUNCHES',
      'J K  KICKS',
      'BEAT EVERY FIGHTER',
      'THEN THE DOOR',
    ],
    width: 480,
    height: 270,
    maxPlausibleScore: 50_000_000,
    titleArt: '/zuzu-showdown-art/hall-card.webp',
    route: '/play/zuzu-showdown',
    accent: '#fb923c',
    controls: 'Move, two punches, two kicks, dodge',
  },
]

/** Everything the hall shows and the hall of fame ranks: the cabinets, then the linked games. */
export const HALL_GAMES: ArcadeGameMeta[] = [...ARCADE_GAMES, ...LINKED_GAMES]

/**
 * A cabinet by slug, as this device will play it: a WebGL cabinet's
 * fallback where WebGL is missing.
 */
export function findArcadeGame(slug: string): ArcadeGameMeta | undefined {
  const game =
    ARCADE_GAMES.find((g) => g.slug === slug) ??
    PREVIEW_GAMES.find((g) => g.slug === slug) ??
    LINKED_GAMES.find((g) => g.slug === slug) ??
    UNLISTED_SCORED_GAMES.find((g) => g.slug === slug)
  if (game?.renderMode === 'webgl' && game.fallback && !canRenderWebGL())
    return game.fallback
  return game
}

export function loadArcadeGame(slug: string): Promise<ArcadeGameModule> {
  const loader = LOADERS[slug]
  if (!loader) return Promise.reject(new Error(`Unknown arcade game: ${slug}`))
  return loader()
}

export function isPlausibleScore(slug: string, score: unknown): boolean {
  const game =
    ARCADE_GAMES.find((entry) => entry.slug === slug) ??
    LINKED_GAMES.find((entry) => entry.slug === slug) ??
    UNLISTED_SCORED_GAMES.find((entry) => entry.slug === slug)
  return (
    Boolean(game) &&
    typeof score === 'number' &&
    Number.isInteger(score) &&
    score > 0 &&
    score <= game!.maxPlausibleScore
  )
}
