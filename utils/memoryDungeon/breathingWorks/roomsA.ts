import type { WorksRoomContent } from './types'

/**
 * The Breathing Works, rows 1–3 (GT-01..GT-18): the foot of the Glass
 * Throat, the night crew’s galleries, filters and locks, down to the warm
 * run beside the Breathing Heart. Char is with Scylla from GT-01 (these are
 * her tunnels first); Oren is met at GT-15 and stays at his post.
 */

const SCYLLA =
  'a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze'
const CHAR =
  'her identical twin with dark violet scales, black lace and a sardonic grin'
const OREN =
  'a fully hooded headsman with an eel-grey tail and an axe at his belt'
const SULK = 'a glass globe lantern with a small glimmer eel coiled inside'

export const WORKS_ROOMS_A: readonly WorksRoomContent[] = [
  {
    id: 'GT-01',
    title: 'Foot of the Glass Throat',
    kind: 'entry',
    speaker: 'Char',
    opening:
      'The Glass Throat lets Scylla go at the bottom like a swallowed pip, into a vaulted tunnel of green brick that smells of rust and kelp. Pipes as thick as whales run along the ceiling. Somewhere ahead, something enormous is breathing. On a pipe-bracket above her sits Char, tail swinging, a glimmer-eel lantern in her lap. ‘You came down the drain,’ she says. ‘I came down the stairs, like a person. Welcome to my tunnels.’ Scylla remembers years that haven’t happened yet. None of them has this place in it.',
    artSubject: `A vaulted underwater service tunnel of green-glazed brick beneath a round shaft in the ceiling, great pipes running along the vault, ${SCYLLA} landing at the foot of the shaft in a swirl of bubbles, while ${CHAR} sits on a pipe bracket above with ${SULK} in her lap`,
    echoes: [
      {
        flag: 'entry:current',
        text: 'Behind her the intake is still running. Water pours down the shaft in a long glass rope, and every pipe in the tunnel sings a different note. Char has to shout. She seems to enjoy that.',
      },
      {
        flag: 'entry:still',
        text: 'Behind her the intake is dead quiet; she shut it herself. Every pipe has stopped mid-note, and far up the shaft, very small, the observatory apprentices are asking each other who did it.',
      },
      {
        flag: 'e04:char-lost-in-present',
        text: 'Char’s voice comes back off the brick in three echoes, every one of them alive. Scylla keeps hold of the shaft’s last rung until she is sure she can let go of it.',
      },
    ],
    choices: [
      {
        id: 'follow-chalk',
        label: 'Follow Char’s chalk skulls into her tunnels',
        outcome:
          'Char drops off the bracket and is gone round the first bend, lantern swinging, leaving a small chalk skull at shoulder height every twenty strokes. She swims these tunnels like a girl in her own house. Scylla follows, fast and loud and a little behind, which is apparently how it is going to be.',
        gain: { trust: 1, danger: 1 },
        artSubject: `${CHAR} swimming away down a green brick tunnel holding ${SULK} high, small chalk skull marks on the wall beside her, ${SCYLLA} following a length behind`,
      },
      {
        id: 'ask',
        label: 'Ask how long she’s been coming down here',
        outcome:
          '‘Since spring. Through the kitchens. The crew don’t mind me.’ Char ticks it off on her fingers like a report to a clerk, then stops. ‘Why, are you writing it down?’ Scylla learns that her sister has been mapping an escape for months without her, and that being asked about it is not the same as being trusted with it.',
        gain: { evidence: 2, trust: -1 },
        artSubject: `${CHAR} on a pipe bracket counting on her fingers with a raised eyebrow, ${SCYLLA} below looking up at her, a lantern glow between them in a dim brick tunnel`,
      },
      {
        id: 'carry-lantern',
        label: 'Ask to carry the lantern yourself',
        outcome:
          'Char hands it down with a bow so low it is an insult. ‘Her name’s Sulk. She hates you already.’ The eel dims to a resentful ember in Scylla’s hands. The light is steadier for being held by someone careful. Char swims ahead into the dark without it, perfectly happy, which is worse.',
        gain: { danger: -1, trust: -1 },
        artSubject: `${SCYLLA} holding ${SULK} that glows only a faint ember red, while ${CHAR} swims off ahead into a dark tunnel with her hands behind her back`,
      },
    ],
  },
  {
    id: 'GT-02',
    title: 'The Shift Slate',
    kind: 'lore',
    speaker: 'Scylla',
    opening:
      'Where the tunnel forks, the night crew keep their shift slate: a board of black stone ruled in chalk, keepers’ names down the side and hours across. Dace. Ottery. Marl D., Tuesdays. One name was struck through four years ago: Cal D. At the foot, in old paint nobody has dared chalk over: LANDWARD SLUICE SHUT BY ORDER. Beside it, small and fresh, in a hand Scylla has known all her life: why?',
    artSubject: `A slab of black slate fixed to a brick wall where an underwater tunnel forks, ruled in faded chalk lines with one row struck through, a band of old painted lettering at its foot, ${SCYLLA} reading it by lantern light while ${CHAR} hovers behind, studying her own fingernails`,
    echoes: [
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'The slate lists a crew who sleep down here between shifts. On the palace rolls, Scylla would bet her circlet, these tunnels are marked empty.',
      },
    ],
    choices: [
      {
        id: 'copy-slate',
        label: 'Copy the slate into your sleeve-book',
        outcome:
          'Names, hours, the struck line, the old paint and its date: four years ago, the month after Cal’s name was crossed out. Char reads over her shoulder. ‘You’re making a record of the people who keep the palace breathing,’ she says. ‘Do they know?’ They don’t. Scylla writes that down too.',
        gain: { evidence: 1 },
        artSubject: `${SCYLLA} copying from a chalk-ruled slate into a tiny sleeve-book with a stub of pencil, ${CHAR} leaning over her shoulder, lantern light on both their faces`,
      },
      {
        id: 'ask-why',
        label: 'Ask Char whether the “why?” is hers',
        outcome:
          '‘Someone had to ask it.’ Char takes the chalk from its string and adds a second question mark, for emphasis. They float side by side in front of a question nobody has answered in four years, and for once Scylla doesn’t know the answer either. It is almost restful.',
        gain: { trust: 1 },
        artSubject: `${CHAR} adding a chalk mark to a black slate with great ceremony, ${SCYLLA} beside her with her arms folded and a reluctant smile, a green brick tunnel forking behind them`,
      },
    ],
  },
  {
    id: 'GT-03',
    title: 'Eel-Lamp Niches',
    kind: 'treasure',
    speaker: 'Char',
    opening:
      'The tunnel wall is honeycombed with lamp niches, and in each a glimmer eel sleeps in its globe, turned low for the night. Under them is a crew shelf: a lamp-wick hook, jars of brine shrimp, a tin marked in crayon FOR THE EELS NOT FOR DACE. In Char’s lantern Sulk presses her nose to the glass at the shrimp and dims, pointedly. ‘She does this,’ Char says. One niche at the end has no lamp, only a dark hollow going further back than a niche should.',
    artSubject: `A curving tunnel wall honeycombed with small round niches, each holding a softly glowing glass globe with a sleeping eel inside, a wooden shelf of jars and a dented tin beneath, ${CHAR} holding up ${SULK} while the eel presses its nose to the glass toward the jars`,
    choices: [
      {
        id: 'shrimp',
        label: 'Feed Sulk a pinch from the crew’s jar',
        outcome:
          'Sulk eats like a queen kept waiting for her feast, and blazes. The tunnel goes gold for twenty strokes, then settles to a warm, steady glow. Scylla leaves a pearl in the shrimp tin, because it is the crew’s jar, and because Char is watching to see whether she will.',
        gain: { battery: 2 },
        artSubject: `${SULK} blazing bright gold as the eel snaps up a pinch of tiny shrimp, ${SCYLLA} dropping a pearl into a dented tin, ${CHAR} watching sidelong, the lamp niches glowing all around`,
      },
      {
        id: 'dark-niche',
        label: 'Reach into the empty niche',
        outcome:
          'Arm-deep, behind a fold of rock, a slate the size of a hand: the crew’s own map of their back ways, scratched with a nail. Galley, filters, locks, the Heart. One route has been scratched out so hard the slate is grooved, and it ends at a wave and a foot. Scylla puts the slate back. She keeps the route.',
        gain: { evidence: 1 },
        artSubject: `${SCYLLA} with one arm deep in a dark round niche in a tunnel wall, her face turned aside in concentration, a small scratched slate just emerging in her fingers, glowing eel lamps in the niches around her`,
      },
    ],
  },
  {
    id: 'GT-04',
    title: 'The Crew Bench',
    kind: 'lore',
    speaker: 'Scylla',
    opening:
      'At a bend where the pipes run warm, the night crew keep a bench, a kelp-tea kettle still steaming on a heating coil, and five mugs on five nails. The pump log hangs from the sixth. Every hour of every night, a line: breaths counted, filters cleared. Down the margin, in a dozen hands, the small news of a household. Ottery’s back is better. Dace owes Marl a cake. Saw the black-lace princess on the kitchen stair again; said nothing.',
    artSubject:
      'A rough wooden bench beside warm pipes at a bend in an underwater brick tunnel, a battered kettle trailing a thread of steam on a coil, five mismatched chipped mugs hanging from nails, a thick ledger hanging on a cord from a sixth nail, a crew lamp glowing',
    autoChoiceId: 'read-log',
    echoes: [
      {
        flag: 'GT-02:copy-slate',
        text: 'Dace, Ottery, Marl: Scylla has their names in her sleeve-book now, and here are their mugs, chipped and particular, like faces.',
      },
      {
        flag: 'GT-02:ask-why',
        text: 'Under one line someone has written, in a hand that isn’t Char’s: ‘Saw the why? on the slate. Good question. Don’t let the Warden see.’',
      },
    ],
    choices: [
      {
        id: 'read-log',
        label: 'Read back through the pump log',
        outcome:
          'Char has been seen on the kitchen stair nine times since spring, and not one of the crew told the palace. Each time, in the margin: said nothing. It is a kind of vote. Scylla counts all nine and finds she has to sit down on the crew’s bench. Char, pretending not to read over her shoulder, sits down too.',
        gain: { evidence: 1 },
        artSubject: `${SCYLLA} sitting on a crew bench with a heavy pump log open across her lap, one finger resting on the margin, ${CHAR} beside her pretending to look at the ceiling`,
      },
    ],
  },
  {
    id: 'GT-05',
    title: 'Pump-Gallery Stair',
    kind: 'shortcut',
    speaker: 'Char',
    opening:
      'A spiral stair climbs out of the pump gallery to a round iron door, and through its grille comes the smell of the palace kitchens: bread-kelp, warm oil, somebody burning the sea-onions. This is Char’s way in. The bolt has been greased to slide without a sound, and a crew notice on the inside says KEEP SHUT: COOKS. ‘The cooks know,’ Char says. ‘The cooks know everything. It’s why their soup’s good.’ The bolt is within Scylla’s reach.',
    artSubject: `A narrow spiral stair of worn stone rising inside a round shaft to an iron door with a grille, warm kitchen light falling through the grille, ${CHAR} lounging on the top step, ${SCYLLA} one step below with a hand near a heavy greased bolt`,
    echoes: [
      {
        flag: 'entry:current',
        text: 'The intake’s roar comes up the stair like weather, and above, a cook bangs a ladle on the grille: whoever’s down there, keep it down, some people are trying to burn onions.',
      },
      {
        flag: 'entry:still',
        text: 'Through the grille, faintly, the observatory apprentices are asking the cooks whether anyone has come through the kitchens. The cooks, so far, are saying nothing, very loudly.',
      },
    ],
    choices: [
      {
        id: 'bolt',
        label: 'Shoot the bolt so nobody can follow you down',
        outcome:
          'It slides home without a whisper; Char greased it herself. ‘That’s my door,’ she says, not angry yet, only noting it. Nobody from the palace is coming down this way tonight. Nor, if something goes wrong in the works, is anybody coming down to fetch them.',
        gain: { danger: -1, trust: -1 },
        artSubject: `${SCYLLA} sliding a heavy bolt across a round iron door at the top of a spiral stair, ${CHAR} behind her watching with folded arms and a level look`,
      },
      {
        id: 'leave-open',
        label: 'Leave Char’s door the way she keeps it',
        outcome:
          'A way home, one stair and one greased bolt away. Above, a cook is singing to the onions. Anyone could come down. Anyone could also go up, and Char, who keeps her doors open on principle, swims past Scylla down the stair as if that were obviously the point.',
        gain: { trust: 1, danger: 1 },
        artSubject: `${CHAR} swimming down a spiral stone stair past ${SCYLLA}, an unbolted iron door above them with warm kitchen light and steam drifting through its grille`,
      },
    ],
  },
  {
    id: 'GT-06',
    title: 'Cal’s Locker',
    kind: 'treasure',
    speaker: 'Scylla',
    opening:
      'A row of crew lockers is cut into the rock, doors of driftwood, a name burnt into each. The one on the end says FENN. Its latch is a fish-hook bent through a ring: not locked, only closed, the way you close something for someone who might be back. Inside hang an oilskin hood and a tin whistle, and on the shelf lies a bundle of letters tied in net-twine. Char goes quiet. ‘The Dunlin boy,’ she says. ‘He went up the landward sluice. Then they shut it.’',
    artSubject: `A row of driftwood locker doors set into a rock wall, the last one open to show a hanging oilskin hood, a tin whistle on a hook and a bundle of letters tied with net twine on a shelf, ${SCYLLA} with a hand on the bent fish-hook latch, ${CHAR} behind her very still`,
    echoes: [
      {
        flag: 'e05:7,7:care',
        text: 'Tansy’s oilcloth letter to Cal is in Scylla’s satchel. His locker is the first place down here that feels as if it has been waiting for it.',
      },
      {
        flag: 'e05:7,7:risk',
        text: 'Marl wiped the route off his slate in front of her. His son’s name is burnt into this door where nobody can wipe it.',
      },
    ],
    choices: [
      {
        id: 'oilskin',
        label: 'Borrow the oilskin hood; the filter halls are next',
        outcome:
          'It smells of tar and somebody else’s home. It fits her badly and would fit Char worse. Scylla tells herself she will bring it back, and then hears how that sounds from a girl a few nights from the road. She pulls the hood up anyway. The filters are cold, and Cal, she suspects, would not mind.',
        gain: { danger: -1 },
        artSubject: `${SCYLLA} pulling a too-large oilskin hood over her pearl circlet in front of an open driftwood locker, ${CHAR} watching with her head tilted`,
      },
      {
        id: 'letters',
        label: 'Untie the bundle and read the top letter',
        outcome:
          'They aren’t from Cal. They are to him, from home, never sent, because since the sluice shut nobody has found a way to send anything up. Tibby lost a tooth. Come home or don’t, but write. Scylla ties the twine back exactly. Char has watched her read it, and doesn’t say what she thinks of that.',
        gain: { evidence: 2, trust: -1 },
        artSubject: `${SCYLLA} holding an unfolded oilcloth letter by lantern light beside an open locker, loose net twine across her wrist, ${CHAR} at the edge of the light, face turned half away`,
      },
      {
        id: 'close',
        label: 'Hook the latch closed, as it was left',
        outcome:
          'Scylla bends the fish-hook back through its ring. Char touches the burnt letters of the name once, lightly, the way you touch a doorframe for luck. Neither of them says the thing they are both thinking: that a locker kept like this is a kind of letter too.',
        gain: { trust: 1 },
        artSubject: `${CHAR} touching a burnt name on a closed driftwood locker door with two fingertips, ${SCYLLA} beside her fastening a bent fish-hook latch, the row of lockers fading into the dark`,
      },
    ],
  },
  {
    id: 'GT-07',
    title: 'Kelp-Filter Hall',
    kind: 'hazard',
    speaker: 'Scylla',
    opening:
      'The kelp filters hang the length of a hall: great curtains of living kelp on wooden frames, combing the sea before the palace breathes it. A slatted catwalk runs between them, missing every fourth slat. The crew’s rule is painted on the first frame, KEEP OFF THE KELP. Char reads it aloud and steps onto the kelp. Halfway along, one frame has torn from its hooks and slumped across the catwalk: a green wall with a crab-sized gap at the bottom.',
    artSubject: `A long hall hung with towering curtains of living kelp on wooden frames, a gap-toothed slatted catwalk between them, one frame collapsed across the catwalk in a green heap with a small gap beneath, ${CHAR} perched on top of the kelp grinning back at ${SCYLLA} on the catwalk`,
    echoes: [
      {
        flag: 'entry:current',
        text: 'With the intake running, every curtain leans toward the far end, and the draw tugs at Scylla’s fins like a hand on a sleeve. The fallen frame is being pulled flatter by the minute.',
      },
      {
        flag: 'entry:still',
        text: 'With the intake shut, the kelp hangs slack, which is worse: it drifts toward anything warm, and the two warmest things in the hall are princesses.',
      },
    ],
    choices: [
      {
        id: 'squeeze',
        label: 'Squeeze through the gap under the fallen frame',
        outcome:
          'It is a gap for crabs, and Scylla is not a crab. She comes out the far side with kelp in her circlet, a long scrape down one fin and, caught in the fronds at her cheek, a worker’s bead bracelet lost in here who knows when. Char wriggles through after her in one smooth movement and picks the kelp out of her hair.',
        gain: { danger: 1, evidence: 1 },
        artSubject: `${SCYLLA} wriggling out from under a collapsed curtain of kelp on a slatted catwalk, fronds tangled in her circlet and a bead bracelet caught at her cheek, ${CHAR} already through and reaching to pull kelp from her hair`,
      },
      {
        id: 'lift-frame',
        label: 'Lift the fallen frame back onto its hooks, together',
        outcome:
          'It takes both of them and every rude word Char knows, several of which would surprise the court. The frame goes up. The filter combs clean again. In the morning someone on the crew will find the hall mended in the night, and not know by whom, and the hall will breathe a little easier for it in the meantime.',
        gain: { trust: 1, danger: 1 },
        artSubject: `${SCYLLA} and ${CHAR} heaving a tall wooden frame of living kelp back up onto its hooks together, both straining, kelp fronds swirling around them in a long filter hall`,
      },
      {
        id: 'glow-path',
        label: 'Turn Sulk up and look for the crew’s way round',
        outcome:
          'In the low light the kelp hides it; in Sulk’s glow it shows: a row of brass rings along the wall, polished by years of hands. The crew’s way. They go round hand over hand, and the torn frame never touches them. Sulk, having been useful, dims to sulk about it.',
        gain: { battery: -1, danger: -1 },
        requires: { battery: 1 },
        lockedHint: 'Needs glow',
        artSubject: `${SCYLLA} holding ${SULK} up bright against the wall of a kelp hall, revealing a line of polished brass rings, ${CHAR} already swinging along them hand over hand`,
      },
    ],
  },
  {
    id: 'GT-08',
    title: 'Three Wheels',
    kind: 'puzzle',
    speaker: 'Char',
    opening:
      'A round chamber, its far door held shut by water pressure, and three valve wheels in a row on the wall, each with a shell for a boss: whelk on the left, limpet in the middle, cockle on the right. One of them opens the door. Beside them the crew have chalked two lines: THE DOOR WHEEL NEVER SITS NEXT TO THE COCKLE. THE COCKLE FEEDS THE FILTERS, AND THE FILTERS NEVER STOP. Char cracks her knuckles. ‘I say we turn all three and see what happens.’',
    artSubject: `A round underwater chamber with three bronze valve wheels set in a row in the wall, each with a different seashell boss at its centre, a heavy round door beyond, chalk scrawl beside the wheels, ${CHAR} cracking her knuckles while ${SCYLLA} studies the wall`,
    choices: [
      {
        id: 'whelk',
        label: 'Turn the whelk wheel, on the left',
        outcome:
          'Stiff, then easy. A pipe sighs, the pressure lets go, and the door swings in on a cupboard where the crew keep the works’ oldest log. On its first page, fifty years ago, in a young and careful hand, a new keeper signs on. Char looks at the rule, the wheel, Scylla. ‘Fine,’ she says. ‘That was quite good.’',
        gain: { evidence: 2 },
        artSubject: `${SCYLLA} turning a bronze valve wheel with a whelk shell boss as a round door swings open behind her onto a small cupboard holding an old leather-bound log, ${CHAR} watching with grudging approval`,
      },
      {
        id: 'limpet',
        label: 'Turn the limpet wheel, in the middle',
        outcome:
          'The limpet wheel spins free and a pipe overhead coughs a fist of cold water straight onto the lantern. Sulk goes dark in outrage. Char, also soaked, turns slowly to look at Scylla. ‘Next to the cockle,’ she says, dripping. ‘It said next to the cockle.’ The door stays shut.',
        gain: { battery: -1 },
        artSubject: `${CHAR} drenched by a burst of water from an overhead pipe, holding up a darkened glass lantern globe, glaring at ${SCYLLA}, whose hands are still on the middle valve wheel`,
      },
      {
        id: 'cockle',
        label: 'Turn the cockle wheel, on the right',
        outcome:
          'Two halls back, every kelp filter in the works stops combing, and far off a bell starts ringing, patient and outraged. Scylla wrenches the wheel back at once. The filters never stop, the rule said. Now the whole crew knows that tonight, for a moment, they did.',
        gain: { danger: 1 },
        artSubject: `${SCYLLA} wrenching a valve wheel with a cockle shell boss back the other way, a ripple of alarm running through the water, ${CHAR} with both hands over her ears`,
      },
    ],
  },
  {
    id: 'GT-09',
    title: 'The Brass Plan',
    kind: 'lore',
    speaker: 'Scylla',
    opening:
      'Riveted to the wall is a plan of the whole sea-works in hammered brass, green at the edges: every pump, sluice and filter, with the palace drawn above as a small, smug outline the works hold up like a tray. Most tunnels are labelled for what they do. A cluster of rooms in one corner is labelled only STORES. Scylla has seen STORES before. It is what the palace calls the places where people live. At the far edge, one channel runs off the brass altogether, landward.',
    artSubject: `A large plan of tunnels, pumps and channels hammered into a sheet of brass riveted to a stone wall, gone green at the edges, a small palace outline at the top, ${SCYLLA} with her fingertip on one corner of it, ${CHAR} holding a lantern up beside her`,
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'At the end of the landward channel is a small engraved gate. Scylla looks away from it before she can think of another gate, and of the sister she could not hold there. The sister beside her is holding the lantern steady.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'STORES, in neat brass capitals. Scylla once looked at a sealed gate and a train full of strangers and chose the gate. She reads the word twice now, slowly, like a list of names.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'Somewhere in the future she left, a map said a maintenance district was empty, and she sent a sea into it. This time, before anything else, Scylla counts the rooms.',
      },
    ],
    choices: [
      {
        id: 'trace-landward',
        label: 'Trace the channel that runs off the edge, landward',
        outcome:
          'It runs from the Breathing Heart, the great pump at the bottom of the plan, to a sluice marked with a wave and a foot: a road the works built for the sea to go up and come down. Someone has touched that sluice so often with a fingertip that the brass there shines like a coin.',
        gain: { evidence: 1 },
        artSubject: `Close on the fingertip of ${SCYLLA} following an engraved channel across a green-edged brass plan to a small polished spot that shines brighter than the rest`,
      },
      {
        id: 'mark-stores',
        label: 'Scratch a tiny mark on every room labelled STORES',
        outcome:
          'Seven rooms. She marks each with a small circle, like counting heads. Char watches, then takes the pin and gives every circle a little face. ‘So they look like people,’ she says. ‘Since you’re making a point.’',
        gain: { trust: 1 },
        artSubject: `${CHAR} scratching tiny faces into small circles on a corner of a brass wall plan with a hairpin, ${SCYLLA} beside her holding the lantern, both bent close`,
      },
    ],
  },
  {
    id: 'GT-10',
    title: 'The Retired Valves',
    kind: 'choice',
    speaker: 'Char',
    opening:
      'In a side vault the works keep retired valve wheels, hung on the wall like plates, each tagged with the channel it once opened and the year the crown closed it: Reef Gate, Kelpwater, the Little Landward. The last hook is empty, its tag newer: LANDWARD SLUICE, four years ago. Under it in chalk: WHEEL KEPT BY THE WARDEN. Char hangs her lantern on the hook to see how it looks. ‘They didn’t throw it away. You don’t keep a wheel for a door you’re never opening.’',
    artSubject: `A low stone vault with old bronze valve wheels hung on the wall like plates, each with a small tag, one empty hook at the end where ${CHAR} has hung ${SULK}, ${SCYLLA} standing back looking at the empty space`,
    echoes: [
      {
        flag: 'e05:4,2:care',
        text: 'Scylla signed Councilor Salter’s petition in her own name: travel where they please, it said. It said nothing about which doors.',
      },
      {
        flag: 'e05:4,2:risk',
        text: 'Char’s name is on Councilor Salter’s petition in Scylla’s copy of her hand. Under a wall of closed doors, the forgery sits in Scylla like a splinter.',
      },
    ],
    choices: [
      {
        id: 'roll-call',
        label: 'Read every tag aloud with her, a roll call of closed doors',
        outcome:
          'Reef Gate, ninety years. Kelpwater, sixty. The Little Landward, the year their grandmother was crowned. Char reads the years and Scylla reads the names, and by the end their voices have gone quiet in the same way. It takes a long time, and in a vault every word carries.',
        gain: { evidence: 2, danger: 1 },
        artSubject: `${SCYLLA} and ${CHAR} side by side under a wall of hanging bronze valve wheels, each reaching up to turn a small tag to the light, their faces solemn`,
      },
      {
        id: 'ask-her',
        label: 'Ask her what she’d do with that wheel if she had it',
        outcome:
          'Char thinks properly, which she rarely lets anyone watch her do. ‘Open it. Then shut up about it, and see who goes.’ She looks sidelong. ‘You?’ Scylla, with an adult’s memories and a girl’s honest mouth, finds she has no answer yet, and says so. Char seems to like that better than an answer.',
        gain: { trust: 2, danger: 1 },
        artSubject: `${CHAR} leaning against a stone wall beneath an empty hook, arms folded, thinking, ${SCYLLA} facing her with open hands, a lantern glowing on the hook above them`,
      },
      {
        id: 'steer',
        label: 'Tell her you won’t need the sluice; the jetty road is enough',
        outcome:
          'It comes out with the certainty of someone who has already walked the jetty road, which Scylla has. Char takes her lantern off the hook. ‘Enough for who?’ She doesn’t wait for an answer. They move on faster after that, and the empty hook stays empty behind them.',
        gain: { danger: -1, trust: -1 },
        artSubject: `${CHAR} lifting a glowing glass lantern off an empty hook with her back to ${SCYLLA}, who stands with one hand half raised, the wall of retired valve wheels behind them`,
      },
    ],
  },
  {
    id: 'GT-11',
    title: 'The Talking Pipe',
    kind: 'lore',
    speaker: 'Scylla',
    opening:
      'A single copper pipe runs this tunnel at head height, rubbed bright along its whole length by palms. The crew talk on it. Scylla lays her ear to the copper and hears taps travelling from far off: two, a pause, three; a scrape. Scratched into the rock below, by many hands over many years, is the key. Two-three: all clear. A scrape: the Warden. Three-three-three: someone in the works who shouldn’t be.',
    artSubject: `A narrow brick tunnel with a single gleaming copper pipe at head height, a key of scratched tally marks in the rock beneath it, ${SCYLLA} and ${CHAR} each with an ear pressed to the pipe, eyes wide, a lantern glowing between them`,
    autoChoiceId: 'listen',
    echoes: [
      {
        flag: 'entry:current',
        text: 'With the intake running the pipe hums under every tap like a held note, and the crew’s talk rides on it the way gulls ride wind.',
      },
      {
        flag: 'entry:still',
        text: 'With the intake shut the pipe is so quiet that Scylla can hear the apprentices in it, tapping clumsily, someone who doesn’t know the key: who? who? who?',
      },
    ],
    choices: [
      {
        id: 'listen',
        label: 'Keep your ear to the pipe',
        outcome:
          'All clear, all clear, a scrape; then, very distinctly, three-three-three. A long pause. Then two-three, tapped gently, on purpose, as if someone has decided that the someone who shouldn’t be here is all right after all. Char, her ear to the pipe beside Scylla’s, grins like a lantern.',
        gain: { trust: 1 },
        artSubject: `${CHAR} grinning with her ear to a bright copper pipe, ${SCYLLA} beside her listening with her eyes closed, tiny ripples spreading along the pipe in the lantern light`,
      },
    ],
  },
  {
    id: 'GT-12',
    title: 'Crew Galley',
    kind: 'rest',
    speaker: 'Char',
    opening:
      'The crew galley is a rock room with a stove made from an old pump housing, a shelf of patched mugs and a long table carved with forty years of initials, noughts and crosses, and one very rude drawing of a councilor. A pot of kelp porridge sits banked on the stove for the next shift. Char drops onto the bench as if she owns it, which, judging by the tiny skull carved beside the rude drawing, she partly does. Sulk, in her globe, has gone the colour of a dying ember.',
    artSubject: `A snug rock galley with a squat stove built from an old pump housing, a pot on top, a long scarred wooden table and a shelf of patched mugs, ${CHAR} sprawled on the bench with ${SULK} glowing faintly on the table, ${SCYLLA} warming her hands at the stove`,
    echoes: [
      {
        flag: 'e05:5,5:care',
        text: 'Someone has chalked the first line of the farewell song on the stove, and under it, fresh: SUNG IN THE FESTIVAL COURT. HEARD IT DOWN THE PIPES.',
      },
      {
        flag: 'e05:5,5:risk',
        text: 'The first line of the farewell song is chalked on the stove. Under it, newer: STOPPED HALF WAY. Nobody has written who stopped it.',
      },
    ],
    choices: [
      {
        id: 'feed-eel',
        label: 'Feed Sulk from the shrimp crock by the stove',
        outcome:
          'Sulk eats with her whole body and comes back gold, then pink, then a bright contented white. Char holds the globe up to her face and talks to the eel in a voice Scylla hasn’t heard her use since they were small, and afterward pretends she didn’t.',
        gain: { battery: 2 },
        artSubject: `${CHAR} holding ${SULK} up close to her face as the eel glows a bright warm white, murmuring to it, ${SCYLLA} watching from the stove with a soft expression`,
      },
      {
        id: 'note',
        label: 'Leave the crew a note under the porridge pot',
        outcome:
          'Scylla writes: thank you for the porridge we didn’t eat, and for saying nothing, nine times. She doesn’t sign it. Char reads it, adds a little skull, then after a moment a little crown beside the skull. Both of them. The crew will know exactly who.',
        gain: { trust: 1 },
        artSubject: `${SCYLLA} tucking a folded note beneath a pot on a stove while ${CHAR} leans over her shoulder adding a tiny doodle to its corner, the scarred galley table behind them`,
      },
    ],
  },
  {
    id: 'GT-13',
    title: 'The Dark Cistern',
    kind: 'hazard',
    speaker: 'Char',
    opening:
      'The tunnel opens on a cistern so big the lantern reaches neither the far wall nor the bottom: a black room of water held back for the dry months when the sea runs thin. A ledge runs round the edge. Down in the dark something large turns over, slowly, and settles. ‘Old eel,’ Char says. ‘Probably. The crew leave it shrimp.’ She doesn’t sound sure. Somewhere ahead the ledge is broken, and the crew’s brass rings stop at the gap.',
    artSubject: `A vast black cistern of still water inside a cavern, a narrow stone ledge running around its rim, ${SCYLLA} and ${CHAR} small on the ledge in a pool of faint lantern light, the shape of something enormous and pale curled in the depths below`,
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'Char goes ahead along the ledge and for three strokes Scylla can’t hear her at all. When her voice comes back, bored, saying ‘mind the gap’, Scylla has to rest her forehead on the cold wall for a moment.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'Water standing in the dark, held back, waiting for when it is wanted. Scylla thinks of lit windows under a sealed gate and cannot make herself stop.',
      },
    ],
    choices: [
      {
        id: 'glow',
        label: 'Turn Sulk up bright and find the way across',
        outcome:
          'Sulk flares and the cistern answers: the gap, a rope strung across it, and below, coiled round a pillar, a glimmer eel the size of a barge, fast asleep and glowing faintly back. Its whiskers are hung with crew offerings: shells, a spoon, a little bell. They cross the rope without a word. Nobody wants to wake a god.',
        gain: { battery: -1, evidence: 1 },
        requires: { battery: 1 },
        lockedHint: 'Needs glow',
        artSubject: `${SCYLLA} holding ${SULK} up blazing over a black cistern, its light revealing a rope across a gap in the ledge and, far below, a colossal sleeping glimmer eel coiled round a pillar, its whiskers hung with shells and a tiny bell, ${CHAR} on the rope`,
      },
      {
        id: 'feel',
        label: 'Go along the ledge by touch, Sulk turned down to nothing',
        outcome:
          'Hand over hand, wall on the right, Char’s tail brushing hers now and then to say still here. At the gap Scylla finds the rope by falling against it. Something below breathes out, warm, a long way down. They are across before either of them admits she was holding her breath.',
        gain: { danger: 1 },
        artSubject: `Near darkness over a cistern, the faint outlines of ${SCYLLA} and ${CHAR} edging along a narrow ledge with their palms flat to the wall, their tails just touching, a single dim ember of lantern light`,
      },
    ],
  },
  {
    id: 'GT-14',
    title: 'The Pressure Lock',
    kind: 'puzzle',
    speaker: 'Scylla',
    opening:
      'A pressure lock: a round door between two tunnels at different depths, and beside it a counterweight pendulum in a glass case, ticking the lock’s own breath. The crew’s brass plate reads: THE LOCK BREATHES IN FOR FOUR, OUT FOR THREE. THE BELL RINGS ON THE FIRST COUNT OF EVERY IN-BREATH. PUSH ON THE OUT-BREATH, OR THE DOOR PUSHES BACK. The bell rings. Char, who hates counting, starts counting aloud anyway: one.',
    artSubject: `A heavy round pressure door set in a tunnel wall, a tall glass case beside it holding a swinging brass pendulum and a small bell, a brass plate below, ${SCYLLA} with both palms on the door waiting, ${CHAR} beside her counting on her fingers`,
    choices: [
      {
        id: 'three',
        label: 'Push on the count of three',
        outcome:
          'The door pushes back, a wall of water to the chest, and Scylla goes tail over circlet into Char. They untangle on the floor. ‘In for four,’ says Char, upside down. ‘Three is in. I counted it. Out loud.’',
        gain: { danger: 1 },
        artSubject: `${SCYLLA} and ${CHAR} in a tangle on a tunnel floor in a burst of bubbles, a round pressure door shut firmly behind them, Char upside down and unimpressed`,
      },
      {
        id: 'six',
        label: 'Push on the count of six',
        outcome:
          'Five, six, and the door gives as if it had only wanted asking nicely. Tucked in the hinge is a folded oilskin slip: the crew’s tally of every request they have sent up to reopen the landward sluice. Forty-one in four years, all refused. Char is still counting, out of spite.',
        gain: { evidence: 2 },
        artSubject: `A round pressure door swinging open onto a warmer, lamplit tunnel, ${SCYLLA} drawing a folded oilskin slip from its hinge, ${CHAR} still counting on her fingers with exaggerated care`,
      },
      {
        id: 'eight',
        label: 'Push on the count of eight',
        outcome:
          'Eight is the bell again: a fresh in-breath, and the lock sucks the door shut so hard the globe rattles and Sulk goes dark in protest. Seven was the last of the out-breath. Scylla can hear that perfectly clearly now, of course. Now.',
        gain: { battery: -1 },
        artSubject: `${SCYLLA} with both hands flat on a round door that has slammed shut, a small bell still shivering in a glass case, ${CHAR} holding up a darkened lantern globe with a pointed look`,
      },
    ],
  },
  {
    id: 'GT-15',
    title: 'Oren’s Tally Post',
    kind: 'companion',
    speaker: 'Oren Pike',
    opening:
      'Where three tunnels meet, under a crew lamp, sits Oren Pike: hood on, axe across his knees, ledger open on a valve housing, counting the works’ breaths against a sand-glass. He is not surprised to see them, which is the most Oren thing Scylla has ever seen. ‘The palace breathes four thousand times a night,’ he says. ‘I am checking. I like to know what a building does when it thinks nobody is counting.’ He turns a page. ‘Also princesses.’',
    artSubject: `A junction of three brick tunnels under a single warm crew lamp, ${OREN} seated on an upturned crate with a ledger open on a valve housing and a small sand-glass beside it, ${SCYLLA} and ${CHAR} arriving from one tunnel with a lantern`,
    echoes: [
      {
        flag: 'e05:4,4:care',
        text: 'A third coil of rope lies at Oren’s side, tagged in his printed hand. He moves it slightly out of sight when he sees Scylla see it.',
      },
      {
        flag: 'e05:4,4:risk',
        text: 'Oren’s ledger is open at Char’s pack, its weight corrected in a second hand. He closes it, gently, before Char can lean over.',
      },
    ],
    choices: [
      {
        id: 'let-char-ask',
        label: 'Ask what he’s found, and let Char ask the questions',
        outcome:
          'Char asks: depth, draw, how long the sluice takes to open, who holds the wheel. Oren answers each twice. ‘The Warden holds the wheel,’ he says last, ‘and has for four years.’ Char looks at Scylla, waiting for her to add something. Scylla, for once, has nothing to add, and lets it stay that way.',
        gain: { trust: 2, danger: 1 },
        artSubject: `${CHAR} leaning over a ledger asking questions with her finger on a page, ${OREN} answering patiently, ${SCYLLA} a little apart with her hands folded, listening`,
      },
      {
        id: 'give-hour',
        label: 'Give him the hour of the landward tide you remember',
        outcome:
          'He writes it to the minute and sits with the pen lifted. ‘That is very exact, Highness, for a tide nobody has measured yet.’ Char is looking at Scylla too. Neither of them asks. Both of them file it, and the ledger is the better for it, and the junction is a little colder.',
        gain: { evidence: 2, trust: -1 },
        artSubject: `${OREN} with his pen paused over a ledger, the eyeholes of his hood turned toward ${SCYLLA}, ${CHAR} beside him also staring at her sister, a crew lamp above them`,
      },
      {
        id: 'ask-him-along',
        label: 'Ask him to come with you through the works',
        outcome:
          '‘Someone should know the way back,’ Oren says, ‘to the stroke. I will be here, counting. If you are late I will come and fetch you, and disapprove.’ He hands Char a measured coil of cord. She ties it to her belt without being asked twice, which is how Scylla knows she is pleased.',
        gain: { danger: -1 },
        artSubject: `${OREN} holding out a neat coil of cord to ${CHAR}, who is already knotting it to her belt, ${SCYLLA} smiling at them both under a warm crew lamp`,
      },
    ],
  },
  {
    id: 'GT-16',
    title: 'The Counterweight Gate',
    kind: 'hazard',
    speaker: 'Char',
    opening:
      'A sluice gate hangs half raised across the tunnel, a portcullis of green bronze on a counterweight chain, and the only winch is on the far side. The crew’s chalk: ONE AT A TIME, AND THE ONE BEHIND HOLDS THE CHAIN. Whoever goes last must let go and dive before the gate comes down. Char has already looped the chain round her wrist. ‘Go on,’ she says. ‘I’m faster.’ She is. Scylla remembers exactly how much faster.',
    artSubject: `A green bronze portcullis gate hanging half raised across a brick tunnel on a heavy chain, ${CHAR} with the chain looped around her wrist and her tail braced against the wall, ${SCYLLA} poised at the gap beneath the spikes`,
    echoes: [
      {
        flag: 'e05:2,1:care',
        text: 'Char won the race on the Pearl Stair by a fin, fair and square. She wants to win this one too.',
      },
      {
        flag: 'e05:2,1:risk',
        text: 'Since the Pearl Stair, Char has been watching for Scylla to flinch. She watches her now, chain round her wrist, to see if she will.',
      },
      {
        flag: 'e04:char-lost-in-present',
        text: 'The last time Scylla watched her sister take the heavy end of something, the sea came down. Her hands have gone cold on the bars before she knows why.',
      },
    ],
    choices: [
      {
        id: 'let-her-hold',
        label: 'Go under first, and let Char hold the chain',
        outcome:
          'Scylla goes under. The chain groans; the gate shudders down a hand’s breadth. Then Char lets go and comes through like a thrown knife, and the gate slams behind her tail. She is laughing. Scylla is not, quite, and doesn’t hide it, and Char stops laughing and bumps her shoulder, once, which is an apology for nothing in particular.',
        gain: { trust: 2, danger: 1 },
        artSubject: `${CHAR} shooting under a slamming bronze portcullis in a burst of bubbles, laughing, ${SCYLLA} on the far side reaching out to her with a pale, unsmiling face`,
      },
      {
        id: 'take-chain',
        label: 'Take the chain from her and make her go first',
        outcome:
          'Char goes under with a look that could etch glass. Scylla holds, lets go, dives; the gate catches the end of her fin and keeps a scale. She is through. She is fine. Char says nothing about it for the length of a tunnel, which is how Scylla knows she is furious, and that she understood.',
        gain: { danger: -1, trust: -1 },
        artSubject: `${SCYLLA} diving under a falling bronze portcullis as it clips the tip of her fin, a single aquamarine scale drifting free, ${CHAR} on the far side with arms folded and a cold glare`,
      },
    ],
  },
  {
    id: 'GT-17',
    title: 'The Breathing Wall',
    kind: 'lore',
    speaker: 'Scylla',
    opening:
      'Here the tunnel wall is thin, and through it Scylla can feel the Breathing Heart, the great tide pump somewhere below, drawing the sea in and pushing it out. With each breath the brick swells a finger’s width and settles. Over the years the crew have pressed their palms into the soft mortar between bricks, hundreds of hands, big and small, and set a shell in each print. Two of the prints are very new and exactly the same size.',
    artSubject: `A curving brick tunnel wall with hundreds of handprints pressed into the mortar, a small shell set into each, two fresh prints side by side, ${SCYLLA} with her palm hovering over one of them, ${CHAR} behind her studying the ceiling`,
    autoChoiceId: 'breathe',
    echoes: [
      {
        flag: 'entry:still',
        text: 'With the observatory’s intake shut, the Heart breathes slower and deeper, like someone pretending to sleep.',
      },
      {
        flag: 'e05:6,6:care',
        text: 'Somewhere above, Wenna Brack is writing three pages about the tide gate. Down here, under Scylla’s palm, the sea goes on breathing as if it had never heard of it.',
      },
      {
        flag: 'e05:6,6:risk',
        text: 'Somewhere above, Wenna is rechecking a dial Scylla nudged smooth. Down here nothing has been nudged; the wall breathes exactly as hard as the sea tells it to.',
      },
    ],
    choices: [
      {
        id: 'breathe',
        label: 'Lay your hand on the wall and breathe with it',
        outcome:
          'In, and the brick swells; out, and it sighs. Scylla fits her hand to the newer print and it is hers exactly, because it is Char’s: she pressed it twice, once for herself and once, with the same hand, for a sister who hadn’t come down yet. Behind her, Char studies the ceiling with great interest.',
        gain: { trust: 1 },
        artSubject: `Close on the hand of ${SCYLLA} fitted exactly into a fresh handprint in soft mortar beside its twin, a tiny shell set in each, the brick wall faintly swelling, ${CHAR} out of focus behind her looking pointedly upward`,
      },
    ],
  },
  {
    id: 'GT-18',
    title: 'The Warm Run',
    kind: 'shortcut',
    speaker: 'Char',
    opening:
      'Past the breathing wall the tunnel runs warm along the Heart’s outflow, steam ghosting off the pipes, crew socks drying on a line. In the ceiling is a round maintenance hatch with a wheel lock: the crew’s back way up to the pump-gallery stair, near where Char’s door lets onto the kitchens. Char hangs off the wheel by one hand. ‘Open, and anyone can get from the kitchens to the deep works in a minute. Shut, it’s the long way, for everyone. Your hand this time.’',
    artSubject: `A warm tunnel lined with steaming pipes, a line of mismatched woollen socks strung across it, a round iron hatch with a wheel lock in the ceiling, ${CHAR} hanging one-handed from the wheel with a lantern in her other hand, ${SCYLLA} looking up at it`,
    echoes: [
      {
        flag: 'GT-05:bolt',
        text: 'Up that hatch is the pump-gallery stair, and at its top Char’s door to the kitchens, bolted now from below. A quick way back, Scylla thinks, to a door she shut.',
      },
      {
        flag: 'GT-05:leave-open',
        text: 'Up that hatch is the pump-gallery stair, and at its top Char’s greased door to the kitchens, still unbolted. Open this, and the palace is one stair and one minute from the deep works.',
      },
      {
        flag: 'entry:still',
        text: 'The apprentices are somewhere in the works now; Scylla heard them on the pipe. An open hatch would bring them here faster, or take her home past them.',
      },
    ],
    choices: [
      {
        id: 'open-hatch',
        label: 'Open the hatch to the pump-gallery stair',
        outcome:
          'The wheel turns with a groan and the hatch drops open on the familiar spiral of the pump-gallery stair, the smell of the kitchens drifting down. The works are a little smaller now, and a little more open: quicker home for two princesses, and quicker for anyone who comes down after them.',
        gain: { danger: 1 },
        artSubject: `${SCYLLA} hauling a wheel lock round as a round ceiling hatch swings open onto a spiral stone stair above, warm light and steam pouring down, ${CHAR} applauding slowly`,
      },
      {
        id: 'leave-shut',
        label: 'Leave the hatch shut',
        outcome:
          'Scylla leaves it. Char shrugs and drops from the wheel, which rings faintly. The long way is the long way; it is also the way nobody from the palace knows. They follow the warm pipes on, and the crew’s socks wave them past like a line of small, damp flags.',
        gain: { danger: -1 },
        artSubject: `${SCYLLA} and ${CHAR} swimming on down a warm steaming tunnel beneath a closed ceiling hatch, a line of woollen socks stirring in the current above them like flags`,
      },
    ],
  },
]
