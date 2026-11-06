import type { FurnaceRoomContent } from './types'

/**
 * The Furnace of Names, rows 4–6 (FN-19..FN-36): the Red Oven’s Cinder,
 * Saffron, Glass and last-bell wings after the night procession. Every room
 * remembers its warm twin (OV-NN). Vesper (they/them) leads; Pip keeps his
 * own ledger; Kogane, who baked for the village, now keeps its roll at the
 * registrar’s counter (FN-32) because a named village is a safe village.
 */
const VESPER =
  'a dusty-grey moth-folk cartographer with feathery antennae, veined folded wings and a satchel of folded maps'
const PIP =
  'a small goblin ledger apprentice with a pencil behind one ear and an oversized coat'
const KOGANE =
  'an old ember spirit shaped like a stooped baker of glowing coals, wearing a registrar’s paper collar'

export const FURNACE_ROOMS_B: readonly FurnaceRoomContent[] = [
  {
    id: 'FN-19',
    title: 'Pip’s Page, Filled In',
    kind: 'lore',
    speaker: 'Pip',
    opening:
      'The ledger lectern from the warm Oven stands here in oven brick, and Pip’s childhood ledger lies open on it. The empty line where his benefactor should be is empty no longer. Someone has filled it in, in Pip’s own six-year-old handwriting, rounder than his hand is now: a name, an address, a debt counted in loaves. Pip does not know the name. He knows the handwriting. ‘I never wrote that,’ he says. ‘I couldn’t spell half those letters then.’',
    artSubject: `A narrow brick alcove lit by a low red glow, a lectern built of oven bricks holding an open child’s ledger with one line freshly inked in large round handwriting; ${PIP} stares at the line with his pencil frozen halfway to it while ${VESPER} holds a small clay ember pot behind him`,
    autoChoiceId: 'read-line',
    echoes: [
      {
        flag: 'OV-19:return-ledger',
        text: 'In the warm Oven Vesper gave Pip this ledger and the choice to share it. It is still his; the Furnace never took it back. It only learned to write in it.',
      },
      {
        flag: 'OV-19:keep-blank',
        text: 'In the warm Oven they kept this line blank on purpose, a gap anyone could verify instead of a convenient story. The Furnace cannot bear a gap. It has filled this one with the most convenient story it could find.',
      },
      {
        flag: 'e07:2,2:trace',
        text: 'Pip once admitted he erased this benefactor himself, to spare them a debt. Someone has un-erased them, and the debt came back with the name.',
      },
      {
        flag: 'e07:2,2:protect',
        text: 'Pip once promised to challenge anyone who called this meal a debt. The line says debt, in loaves, in his own hand. He is going to have to challenge himself.',
      },
      {
        flag: 'entry:named',
        text: 'The baker’s ledger in Vesper’s satchel agrees with it: the same name on a donor line, the same child’s signature beside it. Pip says the agreement is what frightens him.',
      },
      {
        flag: 'e08:2,2:audit-the-ledger',
        text: 'Upstairs an independent audit shrank the census of rescued names. Down here every name the audit struck off has been copied back into the margin, very small.',
      },
    ],
    choices: [
      {
        id: 'read-line',
        label: 'Read the line Pip didn’t write',
        outcome:
          'The ink is still warm. While Pip reads, the address under the name shifts by one house, as if someone had turned over in their sleep and the book had followed. Below it a new line begins to write itself: Pip, apprentice, fed once, owing. He tears nothing out. He shuts the book on his own name with both hands and holds it until it stops scratching.',
        gain: { evidence: 1 },
        artSubject: `${PIP} pressing a child’s ledger shut with both hands on a brick lectern, a thin curl of warm ink-smoke escaping from between its pages, ${VESPER} watching with antennae drawn back`,
      },
    ],
  },
  {
    id: 'FN-20',
    title: 'The Roll-Call Bell',
    kind: 'hazard',
    speaker: 'Vesper',
    opening:
      'The emergency bell still hangs beside the flame, its rope wound with the night shift’s paper tags, but it no longer stops anything. Every forty breaths it tolls, the room calls a name, and something in the walls answers ‘present’ in that person’s own voice. Names nobody answers to are struck off a slate by the door. The bell has begun to sway toward the next name it means to call, and Vesper’s wings have gone very still.',
    artSubject: `A cramped bake hall of soot-black brick where a heavy iron bell swings above a roaring flame, its rope wound thick with paper tags, faint mouth-shaped hollows pressed into every wall, a slate by the door covered in struck-through tally lines; ${VESPER} pressed flat against the wall with wings folded tight and ${PIP} crouched beside them`,
    echoes: [
      {
        flag: 'OV-20:ring-bell',
        text: 'In the warm Oven Kogane rang this bell and the flame went out, and the kitchens fed people anyway. The flame does not go out now. The bell only counts.',
      },
      {
        flag: 'OV-20:call-witnesses',
        text: 'In the warm Oven workers and neighbours signed as witnesses to one reversible pause. Their signatures are on the slate by the door, every one ticked present.',
      },
      {
        flag: 'e08:4,2:accept-the-mark',
        text: 'The escort mark Vesper accepted at the back door glows faintly on their wrist. The bell turns toward it like a face toward a lamp.',
      },
      {
        flag: 'e08:4,2:refuse-the-mark',
        text: 'Vesper refused the escort mark at the back door, and the bell has nothing on their wrist to find. It swings slowly from side to side, listening.',
      },
      {
        flag: 'entry:unnamed',
        text: 'The slate already has a line waiting with no name on it, only a small drawing of a moth. The bell has been practising.',
      },
    ],
    choices: [
      {
        id: 'hold-clapper',
        label:
          'Bind the clapper in a folded map and hold it silent while the night shift slips out',
        outcome:
          'Vesper wraps the clapper in the nearest map and hangs on with Pip. The bell strains, swinging hard and silent, and the bakers it was about to call walk out beneath it without answering. When Vesper lets go, the map has been creased into the shape of a clapper and will not unfold. The walls have heard the silence, and they know whose map it was.',
        gain: { trust: 1, danger: 1 },
        artSubject: `${VESPER} and ${PIP} hanging from a great bell’s clapper bound in a folded paper map, the bell straining silently overhead while soot-streaked bakers file out beneath them toward a doorway`,
      },
      {
        id: 'answer-false',
        label: 'Answer the roll with a name that isn’t yours, and walk through',
        outcome:
          'When the bell swings their way Vesper answers to a name they have heard in the walls, and the room accepts it. The way across is easy. But the slate marks that person present, here, in the Furnace, and somewhere upstairs someone real has just gone missing on paper. Vesper knows exactly how that kind of copy gets used.',
        gain: { danger: -1, evidence: 1, trust: -1 },
        artSubject: `${VESPER} walking calmly beneath a swinging iron bell with one hand raised as if answering a teacher, a chalk tick appearing on a slate by the door, ${PIP} behind them looking back uneasily`,
      },
      {
        id: 'stay-silent',
        label: 'Say nothing and cross between tolls',
        outcome:
          'Vesper crosses mute. On the next toll the bell cannot find a name and calls a description instead: grey, moth, cartographer, unregistered. The slate writes that down. They reach the far door with the description following them in chalk, line after line, the way a child’s map follows the child who drew it.',
        gain: { danger: 1, evidence: 1 },
        artSubject: `${VESPER} slipping across a bake hall between swings of a great iron bell, a slate by the door filling with a chalk sketch of moth wings and antennae, ${PIP} hurrying after with his coat clutched shut`,
      },
    ],
  },
  {
    id: 'FN-21',
    title: 'The Table of Cooling Claims',
    kind: 'secret',
    speaker: 'Vesper',
    opening:
      'The restitution table of salvaged oven bricks is still here, but nobody gathers round it now. It is laid end to end with cooling loaves, each crust stamped with a household’s address, each crust darkening as it cools. Restitution has become a filing system: a claim, a loaf, an address. One loaf at the far end is unstamped. As Vesper passes, its crust begins to rise in thin lines, the way old ink does when you breathe on it.',
    artSubject: `A long table built of salvaged oven bricks laid end to end with dozens of cooling round loaves, each crust branded with a small square stamp, one unstamped loaf at the far end whose crust is lifting into fine raised lines; ${VESPER} pausing beside it with antennae lowered and ${PIP} a step behind`,
    echoes: [
      {
        flag: 'OV-21:open-appeals',
        text: 'In the warm Oven claimants could come back and revise their remedies. Here every claim is baked hard and stamped final. Nothing on this table can be appealed. It can only be eaten.',
      },
      {
        flag: 'OV-21:keep-rotating-council',
        text: 'In the warm Oven the affected households took rotating control of relief. Their council’s names are pressed into the table’s edge in a row, like a rota of shifts nobody may now leave.',
      },
      {
        flag: 'e07:4,1:repair',
        text: 'In the orchard Vesper repaired their childhood lantern, and one refuge stayed safe because its address stayed unspoken. The unstamped loaf is the only thing on this table that has not spoken yet.',
      },
      {
        flag: 'e07:4,1:mark',
        text: 'In the orchard Vesper copied the unlit route into their atlas, leaving the refuge unnamed. A second copy, they knew, becomes a weapon easily. The unstamped loaf smells of orchard ink.',
      },
    ],
    choices: [
      {
        id: 'watch',
        label: 'Watch what the loaf is drawing',
        outcome:
          'The lines are Vesper’s: their childhood map, every lane and stepping stone exactly as a child drew it, with the refuge doors left off on purpose. But every house has been relabelled in the procession’s neat hand, a name and a headcount on each roof, and where the refuge doors were left blank the crust has baked them in. The loaf is warm as a sleeping animal. Vesper does not break it.',
        gain: { evidence: 2 },
        artSubject: `Close view of a round loaf whose crust has risen into a child’s hand-drawn village map of lanes, stepping stones and tiny roofs, each roof branded with a small square stamp, ${VESPER} bending over it in the red half-dark`,
      },
      {
        id: 'leave',
        label: 'Walk past without looking down',
        outcome:
          'Vesper walks on, and when they are out of reach the loaf stops rising, like a thing that only performs for its owner. Pip glances back once. ‘It was drawing,’ he says. ‘I know what it was drawing,’ Vesper says, and does not slow down.',
        gain: { danger: -1 },
        artSubject: `${VESPER} walking briskly past a long brick table of cooling loaves without looking down, ${PIP} glancing back over his shoulder at one loaf whose crust has gone still`,
      },
    ],
  },
  {
    id: 'FN-22',
    title: 'Three Roads Labelled Safe',
    kind: 'puzzle',
    speaker: 'Vesper',
    opening:
      'The map Vesper sold is still burnt into the Oven wall, but it has grown. Three ash roads now run out of it into the brick, each labelled SAFE in the procession’s neat hand. Vesper knows the rules a child was taught for refuge roads: draw them broken, never end one at a door, and cross water once so nothing can follow the scent. The left road is broken and ends at a red door. The middle is solid and crosses the stream. The right is broken, crosses the stream and ends in open orchard.',
    artSubject: `A curved oven wall of scorched brick with a large ash-drawn map burnt into it, three roads branching out from it across the bricks: a dashed one ending at a small painted red door, a solid one crossing a trickle of real water, a dashed one crossing the water and fading into drawn trees; ${VESPER} traces the branches with one finger while ${PIP} holds up the ember pot`,
    echoes: [
      {
        flag: 'OV-22:saffron-redact-map',
        text: 'In the warm Oven Vesper redrew the public roads in ash and left the refuge doors blank. Someone has gone over the blanks since, door by door.',
      },
      {
        flag: 'OV-22:saffron-return-map',
        text: 'In the warm Oven Vesper gave the dangerous original back to the households it had endangered. This wall is the copy they could not give back: the one the Oven kept.',
      },
      {
        flag: 'e07:4,4:witness',
        text: 'On the road above, Vesper named this sale in public. The procession has taken them at their word. Under the map, small, it has written SOLD BY, and left a line for a signature.',
      },
      {
        flag: 'e07:4,4:depart',
        text: 'Vesper once paid restitution without asking forgiveness, and some families refused it. Their houses are on this wall too, relabelled, as if refusing had been a kind of address.',
      },
    ],
    choices: [
      {
        id: 'left',
        label: 'Take the left road: broken, the way a child drew it',
        outcome:
          'The broken line is honest all the way to the red door, and the door has a name plate, and the name is someone Vesper once sheltered. It opens inward on a room exactly like this one, with three roads drawn on its wall. They back out before it can file them. A broken line is not enough, Vesper remembers, if it ends where someone sleeps.',
        gain: { danger: 1 },
        artSubject: `${VESPER} backing away from a small red door that has opened onto an identical brick room with an identical ash map on its far wall, ${PIP} tugging at their wing`,
      },
      {
        id: 'middle',
        label: 'Take the middle road: solid, and over the water',
        outcome:
          'The solid road is straight and dry and quick, and it crosses the stream on a bridge that was never on the child’s map. Halfway over, the bridge folds back on itself and sets them down where they started. A solid line, Vesper remembers too late, is a road somebody else can walk.',
        gain: { danger: 1 },
        artSubject: `A narrow ash-grey bridge folding back on itself like a creased paper strip over a trickling stream, ${VESPER} and ${PIP} set down again at its starting end`,
      },
      {
        id: 'right',
        label: 'Take the right road: broken, over the water, into the trees',
        outcome:
          'It is narrow, and the stream is real and cold to the ankles. On the far bank the ash thins to plain brick and the labels stop. Only the child’s rules held. Low on the brick, older than the procession’s ink, someone has scratched a tiny broken line that ends nowhere: another mapmaker, once, who knew.',
        gain: { evidence: 1, trust: 1 },
        artSubject: `${VESPER} and ${PIP} wading a cold ankle-deep stream under a brick arch where ash lines thin away to bare brick, a tiny scratched dashed line visible low on the wall`,
      },
    ],
  },
  {
    id: 'FN-23',
    title: 'The Escort Who Walks Them Home',
    kind: 'hazard',
    speaker: 'Vesper',
    opening:
      'The corridor is unlit, and something large is walking it. In the ember pot’s glow Vesper sees the wolf escort from the warm Oven, her coat now stitched all over with names, every one she was ever paid. Behind her, hand on shoulder, shuffles a line of sleeping residents. She leads them as she always did, carefully, kindly, back toward the addresses on her coat. The last one in line is awake, and staring at Vesper.',
    artSubject: `A pitch-dark brick corridor lit only by a small clay ember pot, a tall weary wolf in a long coat embroidered all over with tiny stitched names leading a single file of sleepwalking villagers, each with a hand on the shoulder ahead, the last villager wide-eyed and looking back; ${VESPER} holds up the pot and ${PIP} shelters behind them`,
    echoes: [
      {
        flag: 'OV-23:saffron-pay-escort',
        text: 'In the warm Oven Vesper paid this escort in real food, and she returned the list of names unread. The list is on her coat now, read aloud by the stitches, one name for every step.',
      },
      {
        flag: 'OV-23:saffron-escort-union',
        text: 'In the warm Oven the escorts organised a rota of their own and a neutral keeper for sealed routes. The rota is pinned to her collar, and every shift on it bears her name.',
      },
      {
        flag: 'entry:unnamed',
        text: 'As Vesper draws level the wolf sniffs and says in her sleep, ‘One more. The grey one. Not on my coat.’ Her line turns its sleeping heads.',
      },
      {
        flag: 'FN-20:stay-silent',
        text: 'Chalk dust from the roll-call slate still clings to Vesper’s wings. The wolf’s nose finds it at once.',
      },
    ],
    choices: [
      {
        id: 'wake-escort',
        label: 'Hold the ember close so the escort can see where she is going',
        outcome:
          'In the warmth her eyes clear. She looks down at her coat, at the line behind her, at the door she was walking them to, and stops. ‘I was taking them home,’ she says. ‘That isn’t home. That is where they’re filed.’ She turns the line round herself, gently, one sleeper at a time. The ember sinks low in its pot.',
        gain: { battery: -1, danger: -1, trust: 1 },
        requires: { battery: 1 },
        lockedHint: 'Needs warmth in the ember pot',
        artSubject: `${VESPER} lifting a glowing clay ember pot close to the face of a tall wolf in a name-stitched coat whose eyes have just cleared, the wolf turning a line of sleepwalking villagers back the way they came`,
      },
      {
        id: 'take-the-hand',
        label:
          'In the dark, take the hand of the one who is awake and lead them the other way',
        outcome:
          'The awake one is a grown man who hid behind Vesper’s old map as a boy. Vesper cannot see the line in the dark, so they feel their way along the wall with him. Behind them the escort walks on with the rest, carefully, kindly. One is out. Without breaking step the line closes the gap he left.',
        gain: { danger: 1, trust: 1 },
        artSubject: `${VESPER} feeling along a black brick wall while leading a frightened grown man by the hand, the dim shapes of a wolf and her sleepwalking line receding the other way into darkness`,
      },
    ],
  },
  {
    id: 'FN-24',
    title: 'The Feeding Line Through the Gears',
    kind: 'shortcut',
    speaker: 'Pip',
    opening:
      'The flour mill still turns backward, but it grinds no flour now. The feeding line runs through it: a queue of hungry residents shuffling between the gears, each pausing at a slot to post a name before the wheel lets them on. Past the mill the line runs straight and fast down to the deep hearth. The mill’s hatch could be propped with a baker’s peel, so the queue goes through without posting anything. Or it can be left to close, as it does every forty breaths.',
    artSubject: `A dim mill chamber of great wooden gears turning backward, a shuffling queue of hungry villagers with bowls passing between the teeth, each stopping at a narrow brass slot in the wall, a heavy hatch on chains beyond and a long straight brick passage sloping down to a red glow; ${PIP} holds a long wooden baker’s peel while ${VESPER} watches the hatch`,
    echoes: [
      {
        flag: 'OV-24:saffron-stop-mill',
        text: 'In the warm Oven Oren stopped this mill and chalked a safe restart time on its frame. The chalk is still there. Someone has restarted it from the other side, running backward faster.',
      },
      {
        flag: 'OV-24:saffron-audit-hours',
        text: 'In the warm Oven one supervised batch ran and every borrowed minute was recorded. The record is nailed to the hatch, still counting. The borrowed hours have become borrowed names.',
      },
      {
        flag: 'e07:4,3:question',
        text: 'Long ago Vesper stood at the Red Oven’s door and asked which memories paid for the bread. Here the answer is posted through a slot, one name at a time.',
      },
      {
        flag: 'e07:4,3:serve',
        text: 'Long ago Vesper fed a waiting family at the Red Oven’s door before arguing about consent. That family is in this queue, holding the same bowls.',
      },
      {
        flag: 'FN-18:climb-flue',
        text: 'The flue ladder opened above has let a draught down here. The mill stutters in it, like a clock that has heard a door open.',
      },
      {
        flag: 'FN-18:stay-below',
        text: 'Down at the ferry Vesper drew routes on the captain’s cards instead of addresses. One card has come up the line and jammed in a posting slot, and the mill keeps stopping to try to read it.',
      },
    ],
    choices: [
      {
        id: 'prop-line',
        label:
          'Prop the hatch with the peel: the queue goes through unposted, straight to the deep hearth',
        outcome:
          'Pip wedges the peel in the hatch. The gears grind on the wood and cannot close, and the queue goes through without posting a thing, blinking, amazed. The straight run down to the deep hearth stands open for them, for Vesper and for anyone. Somewhere below, a slate loses count and starts again. The Furnace will know whose peel it is.',
        gain: { danger: 1, trust: 1 },
        artSubject: `${PIP} bracing a long wooden baker’s peel in the jaws of a heavy mill hatch while hungry villagers stream past him down a straight brick passage, ${VESPER} guiding them by with an outstretched wing`,
      },
      {
        id: 'let-it-close',
        label: 'Let the hatch close and take the long way round',
        outcome:
          'The hatch shuts; the queue goes on posting names; the long way round is long. A straight road into the deep hearth would be a road the procession could use too, and Vesper has learned not to draw those. Pip says nothing, which is his way of disagreeing, and posts nothing either.',
        gain: { danger: -1 },
        artSubject: `A heavy mill hatch swinging shut on its chains as the queue of villagers resumes posting slips into a brass slot, ${VESPER} turning away down a side passage and ${PIP} trailing after with the peel over his shoulder`,
      },
    ],
  },
  {
    id: 'FN-25',
    title: 'The Loaves That Call the Roll',
    kind: 'lore',
    speaker: 'Vesper',
    opening:
      'Shelf on shelf of bread, and every loaf is calling. Not for its owner any more, but for whoever passes: a name each, softly, as if checking. The names are real. Vesper knows a few: a ferryman, two children from the paper theatre, a baker who quit. When nobody answers, the loaf goes quiet and a little heavier, and a paper label grows on its crust: UNACCOUNTED. One loaf is calling in a voice Vesper has not heard since childhood, and the name it calls is theirs.',
    artSubject: `A tall narrow bread store lined floor to ceiling with wooden shelves of round loaves, each crust split open into a small soft mouth, some loaves bearing blank paper labels grown into the crust; ${VESPER} stops dead before one loaf on a low shelf while ${PIP} covers his ears`,
    echoes: [
      {
        flag: 'OV-25:saffron-feed-without-name',
        text: 'In the warm Oven a child ate from Vesper’s pack and left this voice unclaimed. That loaf is on the top shelf, still sealed. It has stopped calling and started listening.',
      },
      {
        flag: 'OV-25:saffron-witness-loaf',
        text: 'In the warm Oven Pip wrapped one speaking loaf in soundproof cloth for its owner. The cloth is on this shelf, neatly folded. The loaf it held is gone. A tag says: identified, collected.',
      },
      {
        flag: 'e07:1,1:seat',
        text: 'At the cedar footbridge Vesper once set a place for a guest whose name could not safely be spoken. Every loaf in this room is that empty place, made to speak.',
      },
    ],
    choices: [
      {
        id: 'listen',
        label: 'Stand still and let the loaf finish calling your name',
        outcome:
          'It is a parent’s voice: the one who left spare rice by the footbridge for people whose names could not be spoken. It calls Vesper’s childhood name three times, then says the address of the house they grew up in. That parent never once said the address aloud. The Furnace has given them a line they would never have spoken. Vesper sets the loaf down, very gently, face down.',
        gain: { evidence: 1 },
        artSubject: `${VESPER} holding a single round loaf in both hands with antennae drooping, its split crust shaped like a softly speaking mouth, ${PIP} watching from the end of the shelves`,
      },
      {
        id: 'wrap-loaves',
        label:
          'Wrap the calling loaves in flour sacks so nobody hears a name that isn’t theirs',
        outcome:
          'Pip helps. They work along the shelves with flour sacks until the room is a murmur, and then nothing. A paper label grows on every sack: UNACCOUNTED. Vesper decides that is better than accounted for, and leaves the loaf with their own name in it wrapped like the rest, unanswered.',
        gain: { trust: 1 },
        artSubject: `${VESPER} and ${PIP} tying rough flour sacks over loaves along tall bread shelves, a long row of muffled sack-shapes behind them`,
      },
    ],
  },
  {
    id: 'FN-26',
    title: 'The Address Book, Completed',
    kind: 'choice',
    speaker: 'Vesper',
    opening:
      'The paper yōkai from the chimney has finished its address book. It lies open across a baker’s bench, every page complete, every door in Hoshimori on it, hidden ones included, and the doors keep moving to match. The yōkai folds and unfolds beside it like a breathing lung. Under the new ink, in places, Vesper can still see their childhood handwriting. ‘Correct it,’ the yōkai says kindly, holding out a pen. ‘You always drew the best roads.’',
    artSubject: `A baker’s bench under a soot-black chimney mouth with an enormous open address book spread across it, its pages crowded with tiny drawn doorways, beside it a tall creased paper spirit folding and unfolding like a breathing lung and offering a pen; ${VESPER} hesitates with one hand on the page and ${PIP} grips their sleeve`,
    echoes: [
      {
        flag: 'OV-26:saffron-refuse-addresses',
        text: 'In the warm Oven Vesper refused this book and gave travellers portable markers instead. The markers are pressed between its pages now like flowers, each labelled with where it was found.',
      },
      {
        flag: 'OV-26:saffron-challenge-book',
        text: 'In the warm Oven Vesper and the households annotated this book without revealing hidden doors, and the yōkai promised to return when the streets fold. The streets have folded.',
      },
      {
        flag: 'e08:4,4:allow-departure',
        text: 'The southern council wrote an enforceable right to leave. The book has a column for that: DEPARTED, with a forwarding address in every box.',
      },
      {
        flag: 'e08:4,4:require-consent',
        text: 'The southern council required renewed consent for every protection. The book has a consent column too. Every box is ticked, in the same hand.',
      },
    ],
    choices: [
      {
        id: 'misfile',
        label: 'Correct the book with false addresses, in the hand it trusts',
        outcome:
          'Vesper writes in the childhood hand the book already believes. A refuge moves to an empty mill; a hidden family to a burnt-out house. The yōkai purrs. It will knock on those doors tonight, and Vesper will not know for certain that they are empty. It is the old talent, used the old way: a map that works because someone else pays for it.',
        gain: { evidence: 1, danger: 1, trust: -1 },
        artSubject: `${VESPER} writing quickly in a great open address book in a round childlike hand while a tall paper spirit leans over their shoulder, purring, ${PIP} looking away`,
      },
      {
        id: 'tear-own-page',
        label: 'Tear out the page in your own childhood hand and keep it',
        outcome:
          'The page comes out like a tooth. On its back is Vesper’s whole childhood map, every refuge door marked. The book grows a new page at once, blank and waiting. Vesper folds the old one into their satchel. They hold the only copy now. That was true the last time, too.',
        gain: { evidence: 2, trust: -1 },
        artSubject: `${VESPER} tearing a single page from an enormous address book, the torn edge curling like skin, a fresh blank page already unfurling in its place, the paper spirit watching without alarm`,
      },
      {
        id: 'blank-the-doors',
        label:
          'Rub out the hidden doors with your thumb and leave the public roads standing',
        outcome:
          'The ink comes off on Vesper’s thumb and will not wash away. The book does not resist. It notes each blank in its margin: HIDDEN, HERE. A blank is an address too, it seems, if you write down where it is. Vesper keeps rubbing until there are no margins left to write in, and the yōkai, for the first time, frowns.',
        gain: { trust: 1, danger: 1 },
        artSubject: `${VESPER} rubbing tiny drawn doorways off a page with an ink-blackened thumb, the margins of the address book crowded with scribbled notes, ${PIP} holding the book flat and the paper spirit frowning`,
      },
    ],
  },
  {
    id: 'FN-27',
    title: 'Three Bells Calling Turns',
    kind: 'puzzle',
    speaker: 'Pip',
    opening:
      'Three bells hang in the bell loft now, calling the roll in turns. Pip knows the village rule: every bell it cast was mended by a neighbour, and the mends were left to show. The procession’s bell has never been mended, because no one is allowed to touch it, and it never tolls first. It waits, then calls the same names louder. The bronze bell has a riveted crack and tolls first. The iron bell is smooth and tolls after it. The clay bell, mended with rice paste, tolls alone.',
    artSubject: `A cramped bell loft of charred beams with three bells hanging side by side: a bronze bell with a riveted crack, a perfectly smooth dark iron bell and a pale clay bell with a visible seam of mended paste; ${PIP} points from one to the next while ${VESPER} hangs from a beam by their hands with wings half spread`,
    echoes: [
      {
        flag: 'OV-27:saffron-recallable-charter',
        text: 'In the warm Oven Vesper gave the routes to a recallable council. The recall notice is nailed under one of these bells, and that bell calls the council’s members first.',
      },
      {
        flag: 'OV-27:saffron-private-escorts',
        text: 'In the warm Oven Vesper kept private routes with consenting escorts and no master map. The bells here do not know those routes. They call the escorts’ names instead, over and over, as if asking.',
      },
      {
        flag: 'FN-20:hold-clapper',
        text: 'Vesper’s map, still creased into the shape of a clapper, hangs from their satchel. One bell in this loft has no clapper at all. It never needed one.',
      },
    ],
    choices: [
      {
        id: 'bronze',
        label: 'Silence the bronze bell, the one that tolls first',
        outcome:
          'The bronze bell stops under Vesper’s wings. The iron bell keeps tolling, and now it calls names no other bell has called first. It never needed to wait, Vesper realises; it only waited because there was something to copy. They have taught it to stop copying.',
        gain: { danger: 1 },
        artSubject: `${VESPER} clinging to a cracked bronze bell with wings wrapped round it while a smooth iron bell beside them swings harder, ${PIP} below with his hands over his ears`,
      },
      {
        id: 'iron',
        label: 'Silence the smooth iron bell, the one that tolls second',
        outcome:
          'The iron bell is hot and has never been held. It shudders under Vesper’s hands like a living thing and falls quiet. The bronze bell tolls on alone and calls the same names, but nothing calls them again, louder. In the gap Pip hears a few voices answer from the walls, not ‘present’ this time but ‘no’.',
        gain: { evidence: 1, trust: 1 },
        artSubject: `${VESPER} holding a smooth dark iron bell still with both hands as it shudders, its surface without a single mark, the cracked bronze bell beside it swinging alone, ${PIP} listening with his head tilted toward the walls`,
      },
      {
        id: 'clay',
        label: 'Silence the clay bell, the one that tolls alone',
        outcome:
          'Vesper muffles the clay bell with a fold of wing. It was the supper bell. Floors above, a kitchen misses its hour and nobody comes to eat. The roll goes on without it, as loud as ever, and the mended seam on the clay cracks open in the heat.',
        gain: { danger: 1, trust: -1 },
        artSubject: `${VESPER} folding one veined wing round a pale mended clay bell as its seam splits, the bronze and iron bells swinging on unchecked, ${PIP} staring up the stairwell toward an empty kitchen`,
      },
    ],
  },
  {
    id: 'FN-28',
    title: 'The Window That Files Faces',
    kind: 'rest',
    speaker: 'Pip',
    opening:
      'A sleeping nook under a tall window of six panes, warm from the hearth behind the wall. The panes no longer show the children of the sold map. They show the room and whoever is in it, but only if the house has them on file. Pip is in the glass, pencil behind his ear. Vesper is not: where their reflection should be is a blank grey shape. A blanket lies folded on the bench, and the ember pot fits the hearth nook exactly.',
    artSubject: `A small warm sleeping nook of whitewashed brick under a tall six-paned window, a folded blanket on a bench and a clay ember pot glowing in a little hearth niche; in the window glass the reflection of ${PIP} is sharp while beside him, where ${VESPER} stands in the room, the glass shows only a blank grey silhouette`,
    echoes: [
      {
        flag: 'OV-28:glass-let-families-name',
        text: 'In the warm Oven the families named themselves and the unnamed pane stayed unnamed. That pane is here. It is the only one with frost on it, and it shows nothing at all, steadily, like a held breath.',
      },
      {
        flag: 'OV-28:glass-break-index',
        text: 'In the warm Oven the indexing frame was broken and every portrait went home. The frame has been mended with paper tape, numbered one to six, and the panes are back in it.',
      },
      {
        flag: 'entry:named',
        text: 'The baker’s ledger in Vesper’s satchel shows up in the glass, very clearly, every donor’s name legible. The one carrying it is still a blank.',
      },
      {
        flag: 'entry:unnamed',
        text: 'Someone has pasted a paper slip across the blank where Vesper should be. It reads: THE ONE WHO FED THEM UNSIGNED.',
      },
      {
        flag: 'FN-12:note',
        text: 'Tucked into the folded blanket is a copy of the unsigned note from the coal bed: The roll can’t hear you here. Under this window, Vesper is not sure that is true.',
      },
    ],
    choices: [
      {
        id: 'sleep',
        label: 'Sleep with your back to the glass, wings folded over the ember',
        outcome:
          'Vesper sleeps with their wings folded over the ember pot, so its warmth comes back up through the feathers. Once in the night Pip wakes and sees the window trying to draw Vesper from memory, getting the antennae wrong. By morning it has given up. They both wake rested, which is the strangest thing that has happened to them here.',
        gain: { battery: 2, danger: -1 },
        artSubject: `${VESPER} asleep curled on a narrow bench with veined wings folded over a glowing clay pot, ${PIP} half awake under a blanket watching the window glass try to sketch a faint pair of antennae`,
      },
      {
        id: 'search',
        label: 'Search behind the bench',
        outcome:
          'Behind the bench is a drawer of glass offcuts, each one a face the window was never given to file: a grandmother, a boy in a too-big hat, a wolf in a coat. Each has a note pencilled on it in Kogane’s tidy registrar’s hand: not yet. Someone in this house has been keeping faces back from the window.',
        gain: { evidence: 1 },
        artSubject: `${VESPER} kneeling to pull out a shallow wooden drawer filled with small glass offcuts, each showing a painted face, a few with pencilled paper slips tucked beside them, ${PIP} peering over their shoulder`,
      },
    ],
  },
  {
    id: 'FN-29',
    title: 'The Door That Grew a House',
    kind: 'companion',
    speaker: 'Pip',
    opening:
      'The front door bolted to the Oven wall has grown a house. Brick swells round the frame into a porch, a window, a number plate that breathes. Inside, a family is knocking to get out, and the house will open only for someone who writes down where they are going. Pip already has his pencil out. ‘If we write it,’ he says, ‘their people can find them. If we don’t, nobody ever will.’ Vesper says that is exactly the problem.',
    artSubject: `A wooden front door bolted to a curved oven wall, the brick around it swollen outward into a porch, a small lit window and a house-number plate that bulges like a breathing chest, small fists knocking from inside; ${PIP} holds his ledger and pencil ready while ${VESPER} stands between him and the door`,
    echoes: [
      {
        flag: 'OV-29:glass-return-hinges',
        text: 'In the warm Oven this family carried the door home in pieces, to fit a house whose address they chose. The hinges are back, every one, screwed in tight. The Furnace found the house they chose.',
      },
      {
        flag: 'OV-29:glass-seal-door',
        text: 'In the warm Oven this door was sealed and the lost house recorded as a debt, not a location. The Furnace read the debt and worked out the location from it.',
      },
      {
        flag: 'e07:2,2:trace',
        text: 'Pip once traced his own anonymous meal and swore he would testify only with the giver’s leave. His pencil is out anyway. He knows the difference, he says. He isn’t sure the house does.',
      },
      {
        flag: 'e07:2,2:protect',
        text: 'Pip once protected his benefactor’s name from the whole village. Now he is the one holding the pencil, and he hates that it is him.',
      },
    ],
    choices: [
      {
        id: 'pip-writes',
        label: 'Let Pip write the family’s new address, in his own ledger only',
        outcome:
          'Pip writes it small, in his ledger, not the house’s. The door opens and the family steps out blinking and thanks him. Then the number plate on the porch changes to match what he wrote. Pip stares at his pencil. ‘It read my book,’ he says. The family is out. Somewhere, now, they are on file, and Pip trusts Vesper a little more for letting him decide.',
        gain: { trust: 2, danger: 1 },
        artSubject: `${PIP} writing in his small ledger as a front door swings open on a blinking family, the house-number plate above the porch reshaping itself, ${VESPER} watching the plate with dread`,
      },
      {
        id: 'vesper-draws',
        label: 'Have Vesper draw a road on the door with no destination on it',
        outcome:
          'Vesper draws on the door itself: a broken line that ends nowhere. The house reads it, cannot find an address in it, and loosens. The family climbs out through the window into the dark with nothing but a road. Pip writes nothing. He does not speak to Vesper for the length of two corridors.',
        gain: { danger: -1, trust: -1 },
        artSubject: `${VESPER} drawing a long dashed line across a front door in charcoal while a family clambers out through the swollen brick window beside it, ${PIP} standing apart with his ledger shut`,
      },
      {
        id: 'ask-family',
        label: 'Ask the family through the letterbox what they want recorded',
        outcome:
          'Through the letterbox a woman’s voice says, ‘Write that we left. Not where.’ Pip writes LEFT and nothing more. The house argues with the ink a long time, then opens, grudgingly, a crack wide. They squeeze out one at a time. Pip and Vesper both look as if they have won something, and neither quite has.',
        gain: { trust: 1, evidence: 1, danger: 1 },
        artSubject: `${VESPER} crouched at a brass letterbox in a swollen brick porch, listening, while ${PIP} writes a single short word in his ledger and a family squeezes out sideways through a door barely ajar`,
      },
    ],
  },
  {
    id: 'FN-30',
    title: 'Kogane’s Back Office',
    kind: 'treasure',
    speaker: 'Vesper',
    opening:
      'A dead-end back office off the bake hall, low and very warm. This is where Kogane works between roll calls, and it has been kept by someone who wants to be useful: a stool, a small work hearth banked for the night, a desk of blank registry forms and a stamp worn smooth. Pinned above the desk are the three winters of birthdays Kogane forgot for the Oven, each now filled in on a form, name and date and address, in a tidy registrar’s hand, as if to keep them safe that way.',
    artSubject: `A low warm dead-end back office of soot-dark brick with a wooden stool, a small work hearth of banked glowing coals, a desk stacked with blank forms and a smooth wooden stamp, the wall above the desk pinned edge to edge with filled-in paper forms; ${VESPER} stands in the doorway with the clay ember pot and ${PIP} reaches toward the pinned forms`,
    echoes: [
      {
        flag: 'OV-30:glass-refuse-forgetting',
        text: 'In the warm Oven Kogane refused to sell six more hours for bread, and the shelter line grew longer. Those six hours are on a form here too, filled in by the hour. Nothing in them is a crime.',
      },
      {
        flag: 'OV-30:glass-open-shift-ledger',
        text: 'In the warm Oven Kogane posted a voluntary rota and the exact loaves missing. The rota is pinned above the stool. Every shift on it is Kogane’s own.',
      },
      {
        flag: 'OV-12:release-ember',
        text: 'Long ago, in the warm Oven, Kogane was released from the inherited oath and stepped out of the coals. This room is what Kogane did with that freedom. Vesper finds that the hardest thing in it.',
      },
      {
        flag: 'OV-12:offer-ember',
        text: 'Long ago, in the warm Oven, Kogane wrote a revocable contract with a cooling bell. It is framed above the desk. The cooling-bell clause has been underlined so many times the paper has torn.',
      },
    ],
    choices: [
      {
        id: 'take-coals',
        label: 'Feed the ember pot from Kogane’s banked work hearth',
        outcome:
          'Old bakery coal, slow and steady. Vesper takes only what the pot can hold. On the desk a form fills itself in: coal, one pot, borrowed by. Then it stops, because it has no name to write for Vesper, and the pen lies down on the blotter as if embarrassed.',
        gain: { battery: 2 },
        artSubject: `${VESPER} tipping glowing coals from a small banked work hearth into a small clay pot with a baker’s scoop, a pen lying fallen across a half-filled form on the desk behind them`,
      },
      {
        id: 'read-forms',
        label: 'Read the birthday forms Kogane filled in',
        outcome:
          'Every form is correct, careful and kind: the right cake for each child, a note of who cannot eat nuts. This is not a list of targets. It is a whole village kept the only way the procession allows. The last form is blank except for its heading, KOGANE, and its address: the Oven. Kogane registered first.',
        gain: { evidence: 2, danger: 1 },
        artSubject: `${PIP} lifting one pinned form from a wall crowded with them while ${VESPER} reads over his shoulder, a single nearly blank form pinned apart from the others by the hearth`,
      },
      {
        id: 'leave-card',
        label: 'Leave Kogane an unsigned birthday card with no form attached',
        outcome:
          'Vesper writes on the back of a map scrap: for the baker, for every birthday you gave away. No name, no date. They prop it on the stool. The stamp on the desk lifts by itself, hovers over the card, and does not come down.',
        gain: { trust: 1, danger: -1 },
        artSubject: `A small folded scrap of map propped on a wooden stool like a card, a smooth wooden stamp hovering in the air above it, ${VESPER} backing quietly out of the doorway with ${PIP}`,
      },
    ],
  },
  {
    id: 'FN-31',
    title: 'The Stair That Files Its Climbers',
    kind: 'lore',
    speaker: 'Vesper',
    opening:
      'A staircase climbs out of the bake hall toward a lit doorway and a counter with a bell on it. Its reflections are gone. Every step is a filing drawer now, and as Vesper climbs, each drawer slides out an inch to show the name of whoever trod there last. The step beneath Vesper’s feet slides open and finds nothing to show. It waits, then closes, unsatisfied. At the top a voice they knew in the warm Oven says, ‘Next.’',
    artSubject: `A steep narrow staircase in which every step is a wooden filing drawer slid half open, rising through dark brick toward a lamplit doorway and the edge of a counter with a small bell on it; ${VESPER} climbs with wings folded tight while ${PIP} follows two steps behind`,
    autoChoiceId: 'climb-stair',
    echoes: [
      {
        flag: 'OV-31:glass-mark-real-exit',
        text: 'In the warm Oven Oren marked the real exit off this stair. The mark is still on the bottom step, filed: EXITS, CLOSED.',
      },
      {
        flag: 'OV-31:glass-keep-witness',
        text: 'In the warm Oven a witness sketch was kept of two futures that never happened. The sketch is in the bottom drawer, labelled, its two sisters given a single address.',
      },
      {
        flag: 'e04:char-lost-in-present',
        text: 'One drawer near the top holds a name from the sea, Char, with a date years from now and one word: LOST. The stair cannot file the dead as present, however hard it tries. That drawer keeps sliding shut on its own.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'One drawer near the top holds a name from the sea, Char, alive, filed together with the people who waited in the dark at a stranded station so she could be, as if one were the price of the other.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'One drawer near the top holds a name from the sea, Char, alive, and the district a sea was turned toward so she could be. The stair has added AT RISK beside it. It means it kindly.',
      },
      {
        flag: 'FN-24:prop-line',
        text: 'The propped feeding line runs straight down beside the stair, and the queue walks it unposted. For them every drawer stays shut.',
      },
      {
        flag: 'FN-24:let-it-close',
        text: 'Vesper came the long way round, and the stair has had time to notice. Every drawer is already open an inch.',
      },
    ],
    choices: [
      {
        id: 'climb-stair',
        label: 'Climb toward the counter',
        outcome:
          'Vesper climbs the rest without hurrying, and each drawer looks at them as they pass. Behind them every step shows Pip’s name in his childhood hand, PIP, APPRENTICE, as if he had trodden every one. At the top the counter has two chairs facing it and a pen on a chain. ‘Sit,’ says Kogane. ‘Everyone sits. Then everyone is safe.’',
        gain: { evidence: 1 },
        artSubject: `The top of a staircase of half-open filing drawers opening onto a warm lamplit registry counter with two empty chairs facing it and a pen on a chain, ${VESPER} stepping up onto the landing with ${PIP} just behind`,
      },
    ],
  },
  {
    id: 'FN-32',
    title: 'The Registrar’s Counter',
    kind: 'guardian',
    speaker: 'Kogane',
    opening:
      'Kogane sits behind a registry counter of oven brick, glowing low, a paper collar stiff at the throat. On the wall behind, the paper procession rehearses in silhouette, knocking on every door in Hoshimori in turn. ‘I fed this village longer than anyone remembers,’ Kogane says, ‘and I lost them, one winter at a time, because nobody knew where they were. A named village is a safe village. Give me your real name, cartographer. And what you sold.’',
    artSubject: `A lamplit registry office where ${KOGANE} sits behind a long counter built of oven bricks with an open ledger and a pen on a chain, the wall behind covered by a moving silhouette procession of paper figures knocking on rows of tiny doors; ${VESPER} stands before the counter and ${PIP} waits at their shoulder`,
    echoes: [
      {
        flag: 'OV-32:glass-scatter-directions',
        text: 'In the warm Oven the households got separate, changeable routes instead of a list, and the procession could not rehearse a door it did not own. On this wall the silhouettes knock on doors that move, and follow them.',
      },
      {
        flag: 'OV-32:glass-teach-refusal',
        text: 'In the warm Oven the escorts learned a common signal for refusing the herald. Kogane taps it on the counter now, absently, three knocks and a pause, and no longer seems to know what it means.',
      },
      {
        flag: 'OV-12:release-ember',
        text: 'In the warm Oven Kogane was freed from the inherited oath and given the right to say no. ‘This,’ Kogane says, touching the collar, ‘I chose. Nobody made me. You taught me that was what freedom was for.’',
      },
      {
        flag: 'OV-12:offer-ember',
        text: 'In the warm Oven Kogane wrote a contract with a cooling bell and a right to leave. That bell calls the roll now, and its rope comes down through the ceiling to a hook by the counter. Kogane keeps one hand near the rope, the way you keep a hand near a door.',
      },
      {
        flag: 'OV-15:rewrite-guardian',
        text: 'The Oven’s old guardian accepted a right to withdraw, and when the procession came, it withdrew. Someone had to keep the roll. ‘I stayed,’ Kogane says, plainly.',
      },
      {
        flag: 'OV-15:quench-guardian',
        text: 'The Oven’s compulsory guardian was quenched, and when the procession came there was no guardian left to refuse it, only a baker. ‘You put the old flame out,’ Kogane says. ‘They needed a new one. I was warm.’',
      },
      {
        flag: 'FN-21:watch',
        text: '‘You saw your map in the bread,’ Kogane says. ‘I baked that loaf. I wanted you to see how much better it looks with everyone on it.’',
      },
      {
        flag: 'e07:4,4:witness',
        text: '‘You told it in public once, on the ember road,’ Kogane says. ‘Then say it here. A thing said twice is a record.’',
      },
      {
        flag: 'e07:4,4:depart',
        text: '‘You paid them quietly once, on the ember road,’ Kogane says. ‘Quiet is how people get lost. Not here.’',
      },
      {
        flag: 'entry:named',
        text: 'Kogane sees the baker’s ledger in Vesper’s satchel and holds out a hand for it, warmly, as for a loaf. ‘You took the account. Good. Then you understand.’',
      },
      {
        flag: 'entry:unnamed',
        text: '‘You fed my queue without taking a single name,’ Kogane says. ‘Do you know how many of them I have lost since? Neither do I. That is the point.’',
      },
    ],
    choices: [
      {
        id: 'truth',
        label: 'Give Kogane your real name, and the road you sold, aloud',
        outcome:
          'Vesper says their name, the one a parent used at the footbridge, and then the rest: the duplicate route, who it saved, whose doors it opened to the wrong people. Kogane writes it all down slowly, and the procession on the wall stops knocking to listen. ‘The first true entry I have had tonight,’ Kogane says, and lifts the counter flap. ‘It will follow you. Names do.’',
        gain: { trust: 1, danger: 1 },
        passesGuardian: true,
        artSubject: `${VESPER} standing very straight before a brick registry counter, speaking, while ${KOGANE} writes slowly in a ledger and lifts the counter flap with the other hand, the silhouette procession on the wall frozen mid-knock, ${PIP} watching`,
      },
      {
        id: 'show-evidence',
        label: 'Lay out everything the Furnace has filed tonight',
        outcome:
          'Vesper sets it along the counter: the line written in Pip’s childhood hand, the roads relabelled in ash, the loaves stamped with addresses, the residents walked home asleep by their own escort. Kogane reads it as a baker reads a tray, for what has burnt. ‘That is not safety,’ Kogane says at last. ‘That is only filing.’ The flap lifts. The stamp stays where it is.',
        gain: { evidence: 1, trust: 1 },
        requires: { evidence: 4 },
        lockedHint: 'Needs more evidence (4)',
        passesGuardian: true,
        artSubject: `Scraps of map, a stamped loaf, a child’s ledger and torn name tags laid along a brick registry counter, ${KOGANE} leaning over them with a hand hovering above an unused stamp, ${VESPER} and ${PIP} across the counter`,
      },
      {
        id: 'pip-vouches',
        label: 'Let Pip speak for Vesper, from his own ledger',
        outcome:
          'Pip opens his ledger at his own line. ‘Someone fed me once and I never knew who,’ he says. ‘I don’t know where they live. I don’t need to. This one fed people the same way.’ He signs for Vesper, only Vesper, and names nobody else. Kogane stares at the signature, the same round hand as the child’s, and lifts the flap without writing anything down.',
        gain: { trust: 2, danger: -1 },
        requires: { trust: 3 },
        lockedHint: 'Only if Pip trusts Vesper enough to vouch (trust 3)',
        passesGuardian: true,
        artSubject: `${PIP} standing on tiptoe to sign his small ledger flat on a brick registry counter while ${KOGANE} looks down at the signature, coals dimming, and ${VESPER} stands beside him with folded wings`,
      },
    ],
  },
  {
    id: 'FN-33',
    title: 'The Cage of Paid Routes',
    kind: 'treasure',
    speaker: 'Kogane',
    opening:
      'Behind the counter, through a cage of oven-door grilles, is the registry itself: drawer upon drawer up into the dark, and the sixth bell cast in brick above them. One drawer stands open because it is new. Inside is the escort route a council member sold for medicine, filed under PAID, and beside it, in a file of its own, the medicine’s receipt. ‘I keep the bargains here,’ Kogane says, ‘because nobody else will keep them honestly.’',
    artSubject: `A tall vault caged behind black iron oven-door grilles, walls of small wooden drawers climbing into darkness, a brick bell hanging high above, one drawer pulled open showing a folded route map and a small paper receipt, a pilot flame burning in a brass cup on a ledge; ${KOGANE} holds the cage door while ${VESPER} and ${PIP} step inside`,
    echoes: [
      {
        flag: 'OV-33:glass-recall-council',
        text: 'In the warm Oven the member was recalled and Vesper submitted their own old sale to the same appeal. That appeal is filed here too, under VESPER, in a drawer that is already very full.',
      },
      {
        flag: 'OV-33:glass-protect-appeal',
        text: 'In the warm Oven the witnesses were protected and given a private appeal. The private appeal is here, unsealed, read, and annotated in a tidy registrar’s hand: for their safety.',
      },
      {
        flag: 'FN-32:truth',
        text: 'On top of the newest drawer lies a fresh card, ink still warm: Vesper’s name and the road they sold. It is the only card in the cage filed by its owner.',
      },
      {
        flag: 'FN-32:show-evidence',
        text: 'Vesper’s evidence lies along the counter where Kogane left it. Kogane keeps going back to look at it, the way a baker checks a loaf that may not have risen.',
      },
      {
        flag: 'FN-32:pip-vouches',
        text: 'Pip’s signature sits on Kogane’s blotter, vouching for one person and naming no one else. Kogane has not filed it. Kogane does not know where it would go.',
      },
      {
        flag: 'FN-11:hear-roll',
        text: 'One drawer near the floor is set aside for the twenty-third child on the nursery roll, the girl Pip knew. It is empty. It has been opened so often that its runners are worn bright.',
      },
    ],
    choices: [
      {
        id: 'pilot-flame',
        label: 'Fill the ember pot from the registry’s pilot flame',
        outcome:
          'The pilot flame burns very steadily, the way only a flame that is never allowed out can. It fills the ember pot to the brim. Kogane watches and does not stop them. ‘That fire has kept every record in this cage,’ Kogane says. ‘See whether it keeps you warm.’',
        gain: { battery: 2 },
        artSubject: `${VESPER} holding a small clay pot to a steady pilot flame in a brass cup on a vault ledge, the pot glowing bright, ${KOGANE} watching from the cage door`,
      },
      {
        id: 'sold-route',
        label: 'Take the sold escort route out of its drawer and keep it',
        outcome:
          'Vesper folds the route into their satchel, beside their own maps. It is evidence of a sale, and it is also a working road to a household that trusted the council. Vesper holds another secret route alone now. They know exactly what that has meant before.',
        gain: { evidence: 2, trust: -1 },
        artSubject: `${VESPER} sliding a folded route map from an open drawer into a satchel already thick with maps, ${PIP} watching their hands with a worried frown, endless drawers rising behind`,
      },
      {
        id: 'route-home',
        label:
          'Ask Kogane to release the route back to the household it betrayed',
        outcome:
          'Kogane hesitates a long time, hand on the drawer. Then the route comes out, unfiled, and Kogane gives it to Pip, not Vesper, to carry to the household it belongs to. The drawer stays open and empty. Kogane does not close it. An empty drawer, it turns out, is a thing the registrar has never seen.',
        gain: { trust: 1, danger: -1 },
        requires: { trust: 2 },
        lockedHint: 'Only if Kogane has reason to trust you (trust 2)',
        artSubject: `${KOGANE} handing a folded route map to ${PIP} beside one open, empty wooden drawer in a towering wall of drawers, ${VESPER} looking on`,
      },
    ],
  },
  {
    id: 'FN-34',
    title: 'The Ledger in a Child’s Hand',
    kind: 'secret',
    speaker: 'Vesper',
    opening:
      'Deeper in the cage, the borrowed doorframes of the warm Oven’s refuge have been stacked into shelving, and on them lies the permanent ledger, open, enormous, its pages warm as skin. A mother who survived the sold map sits on the floor beside it, wide awake, and does not look up. ‘It has my new address,’ she says. ‘I never gave it. I walked here to see who did.’ The page she is staring at is in Vesper’s childhood handwriting.',
    artSubject: `A deep vault where old wooden doorframes are stacked sideways into rough shelves holding one enormous open ledger whose pages ripple faintly like breathing skin; a tired woman in a rain-dark shawl sits on the floor beside it staring at one page; ${VESPER} stops a few steps away with the ember pot and ${PIP} stays at the cage door`,
    echoes: [
      {
        flag: 'OV-34:last-bell-open-without-register',
        text: 'In the warm Oven this mother opened the refuge’s first door herself, and there was no master list. The doorframes are shelves now. The list is lying on them.',
      },
      {
        flag: 'OV-34:last-bell-seal-witness-route',
        text: 'In the warm Oven a witnessed rescue route was sealed to expire at dawn, and she could revoke it. Dawn came. The ledger kept the route anyway, and wrote under it: RENEWED, AUTOMATICALLY.',
      },
      {
        flag: 'e07:3,8:ask',
        text: 'The paper theatre once performed both halves of Vesper’s bargain, the rescue and the people harmed. She was in the second act. She says the actor who played her had the wrong hands.',
      },
      {
        flag: 'e07:3,8:perform',
        text: 'The paper theatre once played her household as an unnamed shadow, a blank paper house. The ledger has filled the blank in.',
      },
    ],
    choices: [
      {
        id: 'read-page',
        label: 'Read the page in your own childhood hand, to the end',
        outcome:
          'It is her new address, correct to the step, and under it the road there, drawn the way a child drew safe roads: broken, crossing water once. Except this one ends at her door. The Furnace learned to draw from the map Vesper sold. Vesper did not write this page. They taught it how. They read it to the end, because she is watching them read.',
        gain: { evidence: 2, trust: -1 },
        artSubject: `${VESPER} kneeling over an enormous open ledger, one finger following a dashed road drawn in a child’s round hand across the page, a tired woman in a shawl watching their face`,
      },
      {
        id: 'give-page',
        label: 'Tear the page out and give it to her, unread',
        outcome:
          'The page tears like a scab. The ledger seeps ink for a moment, then begins a new page, slower, in a hand less sure of itself. She folds the page into her shawl without reading it. ‘It will learn my address again,’ she says. ‘But not from you. Not tonight.’',
        gain: { trust: 1, danger: 1 },
        artSubject: `${VESPER} holding out a single torn page to a woman in a rain-dark shawl, the great ledger behind them seeping dark ink from a ragged edge while a fresh page slowly curls open`,
      },
      {
        id: 'tell-her',
        label: 'Tell her plainly whose handwriting it is, and why',
        outcome:
          'Vesper tells her: the duplicate route, the sale, who it saved. None of it is new to her except that Vesper is the one saying it. She listens all the way through. She does not forgive them, and says so. She lets them sit beside her while the ledger writes.',
        gain: { trust: 1, evidence: 1 },
        artSubject: `${VESPER} sitting on a vault floor beside a tired woman in a shawl, both facing an enormous open ledger, wings folded and hands open in their lap, ${PIP} keeping watch at the cage door`,
      },
    ],
  },
  {
    id: 'FN-35',
    title: 'The Mouth of the Furnace',
    kind: 'climax',
    speaker: 'Kogane',
    opening:
      'The registry ends at the Furnace itself: a mouth of brick as tall as a house, and in it the names burn, not to ash but to light, each still legible as it goes. The hungry queue waits behind Vesper with its bowls. Kogane holds out a rake, the ledger and a pen. ‘Give the names back, or end the filing, or stand surety for the whole queue yourself,’ Kogane says. ‘Whichever you choose, someone you cannot see will pay for it.’',
    artSubject: `A vast brick furnace mouth as tall as a house, its fire made of countless glowing threads of handwriting curling upward; ${KOGANE} offers a long iron rake, a thick ledger and a pen; ${VESPER} stands before the heat with wings half lifted and ${PIP} at their side, a long queue of hungry villagers with empty bowls stretching back into the dark behind them`,
    echoes: [
      {
        flag: 'OV-35:last-bell-community-kitchens',
        text: 'In the warm Oven ordinary kitchens fed the queue and the shortfall was published honestly. The kitchens are still upstairs, working under the procession’s rules. Their cooks are in this queue.',
      },
      {
        flag: 'OV-35:last-bell-voluntary-bake',
        text: 'In the warm Oven the workers allowed one witnessed bake, and Kogane kept the cooling bell. Its stop-cord hangs here by the Furnace mouth, frayed from a night of roll calls. Pulled the old way, it could still stop the fire. Kogane has not touched it.',
      },
      {
        flag: 'e07:8,8:consent',
        text: 'At South Watch Vesper delivered a redacted atlas under community oversight. Every omission in it is in this fire, burning brightest.',
      },
      {
        flag: 'e07:8,8:open',
        text: 'At South Watch Vesper kept the private map under shared custody. That is why the Furnace wants Vesper’s signature: a shared map has no single name to burn.',
      },
      {
        flag: 'entry:named',
        text: 'The baker’s ledger of compelled donors is still in Vesper’s satchel, and every name in it is in this fire too. If the names come back, so does Pip’s.',
      },
      {
        flag: 'entry:unnamed',
        text: 'The queue behind Vesper is the queue they fed without names. They are still unnamed. The Furnace has spent all night trying to correct that, and it is very close.',
      },
      {
        flag: 'FN-34:give-page',
        text: 'The mother from the cage is in the queue, her torn page folded in her shawl. She is watching Vesper’s hands, not the fire.',
      },
      {
        flag: 'FN-15:pip-writes',
        text: 'The woman from the guardian’s cold crown of bricks is in the queue. Her name is in Pip’s ledger, its corner folded down, and in this fire. Whatever Vesper does here decides whether Pip’s is the only copy.',
      },
      {
        flag: 'FN-15:leave-unwritten',
        text: 'The woman from the guardian’s cold crown of bricks is in the queue, still nameless. Upstairs her son is still asking for her. Her name is in this fire, and nowhere else.',
      },
      {
        flag: 'FN-15:tell-her',
        text: 'The woman from the guardian’s cold crown of bricks is in the queue. ‘Not yet,’ she told them. The Furnace is offering her now.',
      },
    ],
    choices: [
      {
        id: 'return-names',
        label:
          'Rake the burnt names back out of the fire, every one legible again',
        outcome:
          'Vesper rakes until their wings singe. The names come out whole and fly home: every lost child findable by family again, every grandmother back where she can be visited. And every household that hid is findable too, by the same road, by anyone holding the ledger. On the wall the procession turns, all together, toward the open doors. Vesper has made a map of the whole village again.',
        gain: { evidence: 2, trust: 1, danger: 2 },
        artSubject: `${VESPER} hauling a long iron rake out of a towering furnace mouth with singed wing edges, a cloud of glowing handwritten names streaming out over the heads of the queue, ${KOGANE} and ${PIP} watching the lights scatter`,
      },
      {
        id: 'burn-ledger',
        label:
          'Feed the registry itself to the Furnace, so no one can be filed again',
        outcome:
          'The ledger goes in, then the drawers, then the cards, Vesper’s own on top. The Furnace roars once and goes quiet. No one in Hoshimori can be filed again. No one can be found again either: not the hidden by the procession, not the lost by the families still looking, not a child whose mother walked here to learn who knew. Kogane watches the paper collar char away and says nothing.',
        gain: { danger: -2, evidence: -2, trust: 1 },
        artSubject: `${VESPER} heaving an enormous ledger into a furnace mouth as wooden drawers and paper cards tumble in after it, ${KOGANE} standing still while a paper collar curls into flame, ${PIP} holding his own small ledger tight against his chest`,
      },
      {
        id: 'vesper-signs',
        label:
          'Sign your own name and maps into the ledger as surety, so the queue may eat unnamed',
        outcome:
          'Vesper writes their real name, then every map they ever drew, the sold one first. The Furnace accepts at once: one cartographer wholly known, so the queue may eat as strangers. The bowls fill. Nobody behind Vesper gives a name. From now on the procession will always know exactly where Vesper is, and everything Vesper knows.',
        gain: { trust: 2, danger: 2, evidence: -1 },
        artSubject: `${VESPER} signing a long column in an enormous ledger held open by ${KOGANE} while unfolded maps from their satchel drift into the furnace mouth, behind them a queue of villagers lifting full steaming bowls, ${PIP} looking up at Vesper`,
      },
    ],
  },
  {
    id: 'FN-36',
    title: 'The Sweep’s Flue to the Street',
    kind: 'exit',
    speaker: 'Vesper',
    opening:
      'Behind the Furnace a sweep’s flue climbs toward the street, its rungs worn by generations of chimney sweeps. Above, the bakery back door opens and closes on its own, as it has all night, and the procession’s lanterns pass the gap. The seventh bell hangs in the flue with no rope. As Vesper climbs past, it does not ring. Pip climbs below with his ledger buttoned inside his coat, and for the first time tonight nothing is writing in it.',
    artSubject: `Looking up a narrow soot-black brick flue with worn iron rungs toward a square of night sky and the edge of an open back door with lantern light passing it, a ropeless brick bell hanging silent halfway up; ${VESPER} climbs with wings pressed close and ${PIP} follows below with his coat buttoned tight`,
    echoes: [
      {
        flag: 'FN-35:return-names',
        text: 'Up the flue beside them the names are still going home, small lights rising past the rungs. Some of those doors will open to family tonight. Some will open to the procession. Vesper drew both roads, and climbs between them.',
      },
      {
        flag: 'FN-35:burn-ledger',
        text: 'The flue smells of burnt paper and nothing else. Nobody in Hoshimori is on file now, and nobody can be found. Somewhere above, a family is still searching for someone the fire has made unfindable for good.',
      },
      {
        flag: 'FN-35:vesper-signs',
        text: 'Every lantern passing the back door turns toward the flue as Vesper climbs. They will turn toward Vesper for the rest of their life. Below, a queue is eating, and nobody in it has had to say who they are.',
      },
      {
        flag: 'OV-36:last-bell-household-custody',
        text: 'Under the seventh bell in the warm Oven Vesper set down the pen and gave each household custody of its route. The bell remembers. It is the only one down here that will not ring for a name.',
      },
      {
        flag: 'OV-36:last-bell-destroy-compulsory-index',
        text: 'Under the seventh bell in the warm Oven the compulsory index was burned and the restitution claims kept. The procession rebuilt the index anyway. The claims, Pip says, are still his to keep.',
      },
      {
        flag: 'entry:named',
        text: 'The baker’s ledger of compelled donors rides in Vesper’s satchel still, heavier than any map. Pip’s childhood signature is in it. He has asked to carry it the rest of the way himself.',
      },
      {
        flag: 'entry:unnamed',
        text: 'The Oven spent the night looking for the cartographer who fed its queue without names. It found them. It did not get to keep them.',
      },
      {
        flag: 'FN-32:pip-vouches',
        text: 'Pip’s signature is somewhere behind them, vouching for one person only. He climbs as though that was the easy part.',
      },
      {
        flag: 'FN-09:unpin',
        text: 'The childhood maps Vesper unpinned from the dawn kiln ride in their satchel, folded along their old creases. The road they sold is still pinned down there, where anyone can see it. Vesper meant it to be.',
      },
    ],
    choices: [
      {
        id: 'climb',
        label: 'Climb out into the bakery and the folding street',
        outcome:
          'At the top Vesper shoulders the flue cap aside and comes up among the cooling racks of the bakery’s back room. The queue is outside, the procession is outside, Hoshimori is outside, still folding. Vesper unfolds a map, looks at it a long moment, and for once does not mark where they are standing. Pip notices, and says nothing, which tonight is agreement.',
        artSubject: `${VESPER} climbing out of an iron flue cap into a dim bakery back room of empty cooling racks, holding an open hand-drawn map with no marks on it, ${PIP} hauling himself up behind them, lantern light from a night procession sliding past the back-door crack`,
      },
    ],
  },
]
