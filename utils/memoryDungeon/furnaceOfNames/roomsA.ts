import type { FurnaceRoomContent } from './types'

/**
 * The Furnace of Names, rows 1–3 (FN-01..FN-18): the Red Oven’s first
 * eighteen rooms after the night procession. The Oven no longer bakes for
 * whoever is hungry; it burns the names of those it feeds and files the rest.
 * Jars hold names, the table kneads addresses, the window shows only the
 * registered, and the bells call a roll. Vesper leads; Pip is with them from
 * FN-01. Kogane, the procession’s registrar, is only heard here. FN-NN
 * remembers OV-NN.
 */

const VESPER =
  'a dusty-grey moth-folk cartographer with feathery antennae, veined folded wings and a satchel of folded maps'
const PIP =
  'a small goblin ledger apprentice with a pencil behind one ear and an oversized coat'

export const FURNACE_ROOMS_A: readonly FurnaceRoomContent[] = [
  {
    id: 'FN-01',
    title: 'The Pantry of Names',
    kind: 'entry',
    speaker: 'Pip',
    opening:
      'The pantry is where it always was, just inside the back door, its shelves running floor to ceiling. They do not stop at the ceiling. They climb on into the dark, row after row of jars, and in each jar a name lies curled at the bottom like a sleeping grub, its letters faintly moving. A paper slip is tied to every lid with the same three words: ADDRESS ON FILE. Pip reads one and sets it back very carefully. ‘That’s my aunt,’ he says. ‘She moved away so nobody could find her.’',
    artSubject: `A narrow stone pantry inside a bakery back door, wooden shelves of glass jars rising past the ceiling into darkness, each jar holding a small pale curled shape at the bottom with a blank paper slip tied to its lid, ${VESPER} holding up a clay pot with a glowing ember inside, ${PIP} setting a jar back on a low shelf with both hands`,
    echoes: [
      {
        flag: 'entry:named',
        text: 'The baker’s ledger of compelled donors is buttoned inside Vesper’s satchel. The jars lean towards it on their shelves, all together, the way seedlings lean to a window. Pip’s childhood signature is in that book. He keeps one hand on the satchel strap.',
      },
      {
        flag: 'entry:unnamed',
        text: 'High above the others, one jar stands empty, its lid already lettered in a registrar’s neat hand: THE ONE WHO FED THEM UNSIGNED. The Oven has not found Vesper yet. It has made a place to put them.',
      },
      {
        flag: 'OV-01:audit',
        text: 'Last time Vesper counted these jars, and the baker could not show consent for half of them. Every lid wears a consent slip now. Every slip is signed in the same tidy hand.',
      },
      {
        flag: 'OV-01:feed',
        text: 'Last time Vesper fed a waiting family here from their own pack. That family’s jar is on the bottom shelf, the newest. Someone has scratched the name half off the glass, from the inside.',
      },
      {
        flag: 'e08:4,2:accept-the-mark',
        text: 'The escort mark from the back door still shows on Vesper’s wrist. As they pass, every jar on the nearest shelf turns its slip to face it.',
      },
      {
        flag: 'e08:4,2:refuse-the-mark',
        text: 'They came the side way, by the shrine, unmarked. Nobody has told the pantry they are here, and the jars by the door are still turning, slowly, to find out.',
      },
    ],
    choices: [
      {
        id: 'read-slips',
        label: 'Read the lid slips and count whose consent was forged',
        outcome:
          'Vesper works along the lowest shelf while Pip holds up the ember. Every slip is signed, and every signature is the same: a registrar’s hand that has never once pressed hard. Pip copies three of them into his own ledger beside the real names he knows. The three jars go quiet, as if offended.',
        gain: { evidence: 1, danger: 1 },
        artSubject: `${VESPER} crouching at the lowest pantry shelf turning a small paper slip on a jar lid toward the light, ${PIP} beside them holding up a clay ember pot and copying into a small ledger`,
      },
      {
        id: 'turn-jars',
        label:
          'Turn the jars to face the wall, so the names can’t watch who passes',
        outcome:
          'Vesper turns them one by one, slip to the brick, and Pip takes the other shelf. The names stop moving once they cannot see the door. It frees nobody. But the pantry is darker now in a way that feels like a kindness, and somewhere far above them a jar knocks twice against its glass.',
        gain: { trust: 1 },
        artSubject: `${VESPER} and ${PIP} turning glass jars to face a brick wall on tall pantry shelves, the backs of the jars bare and dark, an ember pot glowing on the floor between them`,
      },
      {
        id: 'match-ledger',
        label:
          'Hold the baker’s ledger up to the shelves and match donors to jars',
        outcome:
          'The ledger and the shelves agree, name for name, down to Pip’s. His jar is small and old, with a child’s thumbprint on the lid. He does not open it. ‘That’s evidence,’ he says. ‘It isn’t mine to take back yet.’ The jars around it lean in to listen.',
        gain: { evidence: 2, danger: 1 },
        requires: { entry: 'named' },
        lockedHint: 'Only if Vesper demanded the baker’s ledger',
        artSubject: `${VESPER} holding an open ledger up beside a pantry shelf, ${PIP} staring at one small old jar with a child’s thumbprint pressed into its lid, the surrounding jars tilted toward it`,
      },
    ],
  },
  {
    id: 'FN-02',
    title: 'The Ember Register',
    kind: 'lore',
    speaker: 'Pip',
    opening:
      'The ledger still lies open by the furnace door, and the furnace still speaks in borrowed voices, but each voice now says only an address. ‘Third house past the cedar bridge.’ ‘The room above the lantern stall.’ The pages turn themselves. Where a name has burnt away it leaves a brown, house-shaped scorch, door and all. Pip finds the entry he knew from his apprenticeship, the one whose owner he would not force to testify. Someone has completed it, in another hand, with a street.',
    artSubject: `A heavy ledger open on a lectern beside a glowing furnace door, its pages scorched with small brown marks shaped like houses with doors, pages lifting by themselves in the heat, ${PIP} with one finger on a line, ${VESPER} behind him with antennae drawn back`,
    echoes: [
      {
        flag: 'OV-02:consent',
        text: 'Last time Vesper separated volunteered memories from seized ones here, and the furnace burned colder. The register has kept both columns. It has only relabelled them: GIVEN, and FOUND.',
      },
      {
        flag: 'OV-02:pause',
        text: 'Last time Vesper banked these coals so the village could decide. The page for that night is the only blank one in the book. Along its edge, very small, the register has written: OUTSTANDING.',
      },
      {
        flag: 'e07:2,2:trace',
        text: 'Pip once admitted he erased the benefactor who fed him on his first night. The register has found the erasure, and written over it, gently, in a hand very like his own.',
      },
      {
        flag: 'e07:2,2:protect',
        text: 'Pip once promised to keep his first night’s giver anonymous. Beside his entry the register has drawn a small empty box, and a pencil hangs over it on a string, waiting for him.',
      },
      {
        flag: 'e07:4,3:question',
        text: 'Vesper once asked the baker which memories paid for the bread. The register answers now without being asked. Names. It has always been names.',
      },
      {
        flag: 'e07:4,3:serve',
        text: 'Vesper once fed the waiting family at the Oven door before arguing. The register has that meal, with the family’s door number, and beside it, for the first time: UNPAID.',
      },
    ],
    choices: [
      {
        id: 'read-entry',
        label: 'Read the completed entry, to know what the Oven knows',
        outcome:
          'Vesper reads it under their breath. It is a real street and a real door, and it is wrong by one house: whoever Pip protected moved once more than the Oven knows. Pip lets out a breath he has held since he was small. ‘Don’t write that down,’ he says. Vesper doesn’t.',
        gain: { evidence: 1 },
        artSubject: `${VESPER} bent over a scorched ledger reading silently, one finger under a line, ${PIP} beside them with his eyes shut and his shoulders loosening`,
      },
      {
        id: 'shut-book',
        label: 'Let Pip shut the register without reading his entry',
        outcome:
          'Pip closes the book with both hands, and the furnace voices stop in the middle of an address. ‘I’ll read it when the person in it says I can.’ Vesper, who has read other people’s routes for money, says nothing at all, and helps him hold the cover down until it stops pushing.',
        gain: { trust: 1 },
        artSubject: `${PIP} and ${VESPER} leaning together on the closed cover of a heavy ledger on a lectern, the cover bulging slightly from within, a furnace door glowing behind them`,
      },
    ],
  },
  {
    id: 'FN-03',
    title: 'The Hearing Still in Session',
    kind: 'treasure',
    speaker: 'The grandmother',
    opening:
      'Three benches, three households, exactly as before, still waiting for an answer. They have waited all night. Their shadows stayed where they sat at dusk and are being filed: each one tagged at the ankle with a paper slip and a house number. A clerk’s brazier glows at the front, banked for a long session. The eldest grandmother catches Vesper’s eye and turns her palm up, very slightly, to show a live coal she has been hiding in a dock leaf.',
    artSubject: `A plain hearing room with three wooden benches of waiting villagers, their shadows on the floor each tied at the ankle with a small paper tag, a banked brazier glowing at the front, an old woman on the front bench showing a live coal in a leaf cupped in her palm, ${VESPER} meeting her eye with an ember pot at their hip, ${PIP} behind`,
    echoes: [
      {
        flag: 'OV-03:pact',
        text: 'Last time Vesper proposed a witnessed, revocable food pact here. It is pinned to the front bench. Someone has added a clause in tiny red script: REVOCATION REQUIRES A FORWARDING ADDRESS.',
      },
      {
        flag: 'OV-03:relief',
        text: 'Last time Vesper set up a ration rota for these households. It hangs by the door, still running, but every slot now asks for a house number before a bowl.',
      },
      {
        flag: 'e07:1,1:seat',
        text: 'At the cedar footbridge Vesper once set a place for a guest whose name could not safely be spoken. There is a fourth bench here, empty, and no shadow on it. The Oven has not worked out who it is for.',
      },
      {
        flag: 'e07:1,1:listen',
        text: 'At the cedar footbridge Vesper once followed their old stepping stones to a house now chained shut. One of the tags on these shadows gives that house as home.',
      },
    ],
    choices: [
      {
        id: 'take-coal',
        label: 'Take the grandmother’s hidden coal for the ember pot',
        outcome:
          'She tips it into Vesper’s clay pot without looking down, and the ember drinks it and steadies. ‘We keep the hearing going so it never ends,’ she murmurs. ‘While it’s in session, nobody’s been sentenced to an address.’ Her filed shadow does not turn its head.',
        gain: { battery: 2 },
        artSubject: `An old woman on a hearing bench tipping a live coal from a leaf into ${VESPER}’s clay pot as the ember inside flares, her tagged shadow on the floor staying perfectly still`,
      },
      {
        id: 'read-tags',
        label: 'Read the shadows’ tags, without saying a single address aloud',
        outcome:
          'Two of the addresses are true. The third is a house that burned down years ago, and the family on that bench have been living as if they had moved into it: the Oven put them somewhere it could find. Vesper copies that one tag, and no other, and the family watch them do it.',
        gain: { evidence: 1, trust: 1 },
        artSubject: `${VESPER} kneeling on a hearing-room floor to read a paper tag tied to the ankle of a seated villager’s shadow, the family on the bench above watching in silence, ${PIP} keeping lookout by the brazier`,
      },
    ],
  },
  {
    id: 'FN-04',
    title: 'The Ash Sorted Back Into Letters',
    kind: 'lore',
    speaker: 'The archivist',
    opening:
      'The soot-stained archivist is still at her desk, still arranging, but she no longer sorts jars. She sorts ash. Each heap on her long table is what is left of a burnt name, and she is sifting it patiently back into letters with a dry brush, because the registrar has asked her for a complete set. She has been at it a long time. Her own name is gone from her desk plate. Only her address is left.',
    artSubject: `A long archive table covered in small neat heaps of grey ash, a soot-stained woman archivist bent over one with a dry brush shaping it into a faint curved form, a brass desk plate in front of her, shelves of empty jars behind, ${VESPER} watching from the doorway with an ember pot`,
    autoChoiceId: 'listen',
    echoes: [
      {
        flag: 'OV-04:seal-jars',
        text: 'Last time Vesper helped the archivist seal the disputed jars and post a count without names. That count is still on the wall. The Oven has written the names underneath, in ash, and she has smudged every one with her thumb.',
      },
      {
        flag: 'OV-04:return-names',
        text: 'Last time owners came behind a screen to reclaim their jars. The screen is folded against the wall now. Behind it, chalk footprints cross the floor, one pair per guest, each pair labelled with the house it walked home to.',
      },
      {
        flag: 'FN-01:turn-jars',
        text: 'The archivist has heard about the pantry. ‘You turned them round,’ she says, approving, and turns her own desk plate face down.',
      },
      {
        flag: 'FN-01:read-slips',
        text: 'Vesper shows her the forged consent slips Pip copied. She knows the hand. ‘It signs for everyone,’ she says. ‘It thinks that’s what a signature is for.’',
      },
    ],
    choices: [
      {
        id: 'listen',
        label: 'Let the archivist explain her system',
        outcome:
          '‘The ash keeps its shape if you don’t breathe on it,’ she says, and doesn’t. ‘I can rebuild a name in an evening. Most nights I get it slightly wrong, on purpose. An L for an I. A door number off by one. The registrar hasn’t noticed yet.’ She brushes a heap flat and begins again. She would like Vesper to tell nobody.',
        gain: { evidence: 1, trust: 1 },
        artSubject: `A soot-stained archivist holding her breath as she brushes a heap of ash into a slightly crooked shape, ${VESPER} leaning close with folded wings, ${PIP} with a finger to his lips`,
      },
    ],
  },
  {
    id: 'FN-05',
    title: 'The Shift That Never Clocks Off',
    kind: 'shortcut',
    speaker: 'The night worker',
    opening:
      'The two night workers are still at the ovens, still exhausted, but they no longer stop. A brass time-clock is nailed beside each of them, and whenever one sets down a tray her clock prints a card with her address on it, so the Oven knows where to send if she leaves. In the floor between them an iron hatch covers the old flue that drops to the lower kitchens. Its ring is warm. One worker taps it with her foot and looks at Vesper: the only way out that punches nothing.',
    artSubject: `A hot bakery workroom with two exhausted women at brick ovens, a brass time-clock nailed to the wall beside each, small cards curling out of the clocks, a round iron hatch with a ring set in the floor between them, ${VESPER} looking down at the hatch, ${PIP} by the door`,
    echoes: [
      {
        flag: 'OV-05:ask-workers',
        text: 'Last time these two wrote a shift agreement with a door that opened from inside. The door is still here. It opens, from inside, onto a second bakery exactly like this one, where the same two women are working.',
      },
      {
        flag: 'OV-05:pay-workers',
        text: 'Last time Vesper shared a ration with these two as pay. Their clocks print that too: one supper received, wages outstanding, current address.',
      },
      {
        flag: 'entry:unnamed',
        text: 'The clocks stop printing when Vesper walks past. They tick louder instead, the way a dog stops barking to listen.',
      },
    ],
    choices: [
      {
        id: 'jam-clocks',
        label:
          'Jam the time-clocks with flour so the workers can leave unrecorded',
        outcome:
          'Pip packs flour into both card slots until the clocks choke on it. The workers look at each other, then lift the hatch and climb down into the flue’s dark, the way that punches nothing. The second one stops on the top rung. ‘There’s a ladder,’ she says. ‘It comes back up, if anyone ever opens it from below.’',
        gain: { trust: 1, danger: 1 },
        artSubject: `${PIP} stuffing flour into the card slot of a brass time-clock while two bakery workers climb down through an open iron hatch in the floor, one looking back up at ${VESPER}`,
      },
      {
        id: 'punch-in',
        label:
          'Punch a card yourself, so the clocks have someone else to watch',
        outcome:
          'Vesper feeds a clock a blank card and it prints their address: the old house by the cedar bridge, right to the door. While both clocks chew on it, the workers sit down for the first time all night. Vesper keeps the card. It is warm and slightly damp, like something that has been held in a mouth.',
        gain: { evidence: 1, danger: 1 },
        artSubject: `${VESPER} feeding a card into a brass time-clock on a bakery wall, the card emerging warm and curled, two exhausted workers sitting down on upturned flour crates behind them`,
      },
    ],
  },
  {
    id: 'FN-06',
    title: 'The Table That Kneads the Village',
    kind: 'treasure',
    speaker: 'Pip',
    opening:
      'The century-old table is still folding dough by itself, but its legs have bowed outward like a crouching animal’s, and what it folds is not bread. It is the village. It presses out streets with its edge, pinches up houses, pokes a door into each with a wooden knuckle. The finished houses rise on the trays, warm and rounded, every door numbered. One swells with a slow cracking sound. ‘That’s the refuge on the ferry road,’ Pip says. ‘It’s meant to be off the maps.’',
    artSubject: `A massive old wooden kneading table with bowed crouching legs, its floured top pressed into a miniature village of dough streets and rounded dough houses with doors, trays of risen dough houses beside it, ${PIP} pointing at one swelling house, ${VESPER} with an ember pot held close`,
    echoes: [
      {
        flag: 'OV-06:tend-tools',
        text: 'Last time Vesper mended this table’s joints and it chose the supper shift. The mended leg still holds. It is the only one not bowing, and it is trying, very hard, to walk the table away from the trays.',
      },
      {
        flag: 'OV-06:free-tools',
        text: 'Last time this table walked out into the courtyard with flour on its legs. It came back. White footprints lead from the door to where it stands, and each footprint has an address pressed into it.',
      },
      {
        flag: 'e07:4,1:mark',
        text: 'Vesper once copied the unlit orchard route into their atlas, leaving the refuge unnamed. The table has the orchard too, in dough. It has named the refuge, in raised letters, and is waiting for it to rise.',
      },
      {
        flag: 'e07:4,1:repair',
        text: 'Vesper once mended a lantern in the orchard and remembered why some addresses stay unspoken. The table has pressed the orchard flat, every tree but one. Where the one refuge it could not find should be, there is a small blank hollow in the dough.',
      },
    ],
    choices: [
      {
        id: 'lift-house',
        label: 'Lift the refuge loaf off the tray before it finishes rising',
        outcome:
          'It comes away hot and far heavier than bread, and something inside it shifts when Vesper tilts it, the way a sleeper turns over. They wrap it in a map and stow it. The table stops kneading. For a long moment it feels along the empty tray with one corner, searching, before it begins the street again.',
        gain: { evidence: 2, danger: 1 },
        artSubject: `${VESPER} lifting a warm rounded dough house off a baking tray and wrapping it in a folded paper map, the old kneading table beside them pressing one corner along the empty tray, ${PIP} watching the table`,
      },
      {
        id: 'ask-table',
        label: 'Ask the table, as someone once did, what work it wants',
        outcome:
          'The table goes still. Then, slowly, it presses one plain loaf out of the dough, no door at all, and pushes it to the edge toward Vesper. Pip breaks it open: warm white ordinary bread, the first in this house. They eat half and keep half for whoever is next. The table goes back to its streets, but slower.',
        gain: { trust: 1, danger: -1 },
        artSubject: `${PIP} breaking open a plain round loaf beside a bowed old kneading table covered in dough streets, ${VESPER} with a hand resting on the table’s edge, steam rising from the bread`,
      },
    ],
  },
  {
    id: 'FN-07',
    title: 'The Flue That Draws the Map',
    kind: 'hazard',
    speaker: 'Vesper',
    opening:
      'The hidden flue that warmed the flood refuge next door still runs behind this wall, and it is drawing. Not smoke: everything. Flour drifts toward the grate, then Pip’s hair, then Vesper’s antennae. Their folded wings ache open in the draught, and on the soot-black bricks the pattern of their veins appears, line by line, as if the chimney were tracing them. A route. Through the grate comes the sound of the refuge, breathing in time with the flue.',
    artSubject: `A narrow brick passage beside a chimney grate, flour and dust streaming toward the grate in a draught, ${VESPER} braced against the pull with wings forced half open, a branching pattern like wing veins spreading across the soot-black bricks beside them, ${PIP} gripping their satchel strap`,
    echoes: [
      {
        flag: 'OV-07:share-heat',
        text: 'Last time Vesper kept this flue open so the refuge could sleep warm. Pip’s chalked shortage notice is still on the wall. Beneath it, in soot, the chimney has written how many people sleep next door, and where.',
      },
      {
        flag: 'OV-07:bank-heat',
        text: 'Last time Vesper banked this flue and the neighbours carried blankets through the rain. The damper is still shut. The draught is coming through it anyway, through the iron, the way a voice comes through a door.',
      },
    ],
    choices: [
      {
        id: 'raise-ember',
        label:
          'Raise the ember to the grate and push the draught back with heat',
        outcome:
          'The ember flares in its pot and the flue coughs once, like a throat clearing. The draught falters. The soot drawing of Vesper’s veins stops halfway across the bricks: an unfinished map with no destination. Next door, the refuge goes on breathing, but in its own time again.',
        gain: { battery: -1, danger: -1 },
        requires: { battery: 1 },
        lockedHint: 'Needs warmth in the clay pot',
        artSubject: `${VESPER} holding a flaring clay ember pot up to a chimney grate, a half-finished branching soot pattern stopping short on the bricks beside them, ${PIP} shielding his eyes from the glow`,
      },
      {
        id: 'fold-tight',
        label: 'Wrap your wings tight and crawl beneath the draught',
        outcome:
          'Vesper wraps their wings around themself like a cloak and goes on hands and knees, Pip tucked under one edge. The chimney loses the lines halfway and finishes the rest from memory. It gets them wrong. Somewhere on that wall is a route now that leads nowhere, in Vesper’s exact shape, and they cannot stop wondering who will follow it.',
        gain: { danger: 1 },
        artSubject: `${VESPER} crawling low along a brick passage with wings wrapped tight like a cloak and ${PIP} sheltered under one edge, a wrong-turning branching soot pattern on the wall above them`,
      },
      {
        id: 'let-it-read',
        label: 'Open your wings and let the flue finish the tracing',
        outcome:
          'Vesper spreads their wings and holds still while the soot runs over the bricks. It finishes. It is a plan of the refuge next door: every bed, every sleeper, drawn from the veins of Vesper’s own wings. They had not known it was in them. They memorise it and smear it out with their sleeve, and the sleeve stays black.',
        gain: { evidence: 2, danger: 1, trust: -1 },
        artSubject: `${VESPER} standing with wings spread wide against a chimney draught while a detailed branching soot plan of small rooms and sleeping shapes completes itself on the bricks beside them, ${PIP} staring from the wing to the wall`,
      },
    ],
  },
  {
    id: 'FN-08',
    title: 'Three Panes, One Square',
    kind: 'puzzle',
    speaker: 'Pip',
    opening:
      'The witness window still looks over the village square, but its pane has divided into three, each showing the square at the same moment, each a little different. In the left, every face in the bakery queue is crisp and labelled. In the middle, the queue has a gap with a shadow standing in it, and nobody to cast it. In the right, the square is empty and every house window is lit. Scratched into the sill: IT CAN’T DRAW WHAT IT CAN’T NAME. ‘One of these is the real square,’ Pip says.',
    artSubject: `A tall bakery window divided into three panes, each showing the same lantern-lit village square differently: one crowded with sharply drawn faces, one with a gap in a queue where a lone shadow stands with no one casting it, one empty with every house window lit, ${VESPER} and ${PIP} in silhouette before it`,
    echoes: [
      {
        flag: 'OV-08:witness-claims',
        text: 'Last time Vesper published verified totals here with consenting witnesses. The totals are still pasted on the frame. The Oven has gone through them and drawn a face beside every number.',
      },
      {
        flag: 'OV-08:redact-claims',
        text: 'Last time Vesper kept the names private and set up rotating auditors. Their rota is still pinned to the frame. Every auditor on it is in the left pane, labelled, looking back.',
      },
      {
        flag: 'e08:4,1:trace-the-wires',
        text: 'In the orchard a keeper confessed that the watching lanterns began as a search for the missing. A brass plate under this sill says the same of the window: FOR FINDING THE LOST.',
      },
      {
        flag: 'e08:4,1:shade-the-lanterns',
        text: 'Vesper shaded the orchard lanterns that faced occupied homes. The window has heard. In its left pane there is a small dark patch where one house should be, and the glass keeps rubbing at it.',
      },
    ],
    choices: [
      {
        id: 'left-pane',
        label: 'Open the left pane, where every face is clear',
        outcome:
          'The sash lifts on a square full of tidy faces, and every one of them turns, together, to look at Vesper. Their labels flutter. A paper tag swings down on a string from the frame and comes to rest against Vesper’s chest, blank, waiting. Pip yanks the sash shut. The tag stays.',
        gain: { danger: 1 },
        artSubject: `${VESPER} lifting the left pane of a tall window onto a crowd of identical labelled faces all turned toward them, a blank paper tag on a string swinging down against their chest, ${PIP} reaching for the sash`,
      },
      {
        id: 'middle-pane',
        label: 'Open the middle pane, where a shadow stands with nobody in it',
        outcome:
          'Cold real air, the smell of persimmons, the noise of a queue that is not in order. Up close Vesper can see the shadow’s breath: someone the window could not file. Through the real pane the whole hidden queue shows at last, dozens of people the Oven has never managed to draw, there all along. Vesper counts them and writes none of them down.',
        gain: { evidence: 2 },
        artSubject: `${VESPER} leaning out of an opened middle window pane into a cold lantern-lit square where a long untidy queue of villagers stands, one figure’s breath misting in the air, ${PIP} counting on his fingers behind them`,
      },
      {
        id: 'right-pane',
        label: 'Open the right pane, where every window in the village is lit',
        outcome:
          'Every house is lit because every house is being searched. In each window a figure stands very straight beside a door, waiting to be counted. Vesper’s ember shrinks from the light into the bottom of its pot and takes a long while to come back up.',
        gain: { battery: -1 },
        artSubject: `${VESPER} at an opened window pane facing a square of houses with every window lit, a rigid upright figure beside a door in each, the clay ember pot at their hip gone almost dark`,
      },
    ],
  },
  {
    id: 'FN-09',
    title: 'The Kiln That Never Finishes Dawn',
    kind: 'lore',
    speaker: 'Kogane',
    opening:
      'The dawn kiln glows the colour of first light, and has for hours. It will not finish the dawn. In its warm mouth, on racks where morning loaves once cooled, rows of folded paper moths are pinned with their wings spread, and each wing is a map. Vesper knows the hand. Their own, from every year of their childhood: each route they drew to hide someone, pinned flat and labelled with the address it led to. From the kiln’s heart a low voice says, kindly, ‘Look how safe you kept them.’',
    artSubject: `The glowing open mouth of a brick kiln lit like sunrise, its cooling racks covered in rows of folded paper moths pinned with wings spread, each wing drawn with fine route lines, a small paper label under each, ${VESPER} standing before it very still with their own wings drawn in, ${PIP} at their elbow`,
    echoes: [
      {
        flag: 'OV-09:open-kiln',
        text: 'Last time Vesper opened a small public bake here under a witnessed consent rule. The rule is still chalked on the kiln door. Beneath it, in careful baker’s print: CONSENT ON FILE FOR ALL.',
      },
      {
        flag: 'OV-09:hold-kiln',
        text: 'Last time Vesper kept this kiln closed until relief came. It is closed still. It has simply grown its dawn on the inside, where nobody asked it not to.',
      },
      {
        flag: 'e07:4,4:witness',
        text: 'Vesper once testified in public about both uses of the road they sold. The duplicate is pinned here, beside the rescue route it was copied from, and the kiln has labelled them both SAFE.',
      },
      {
        flag: 'e07:4,4:depart',
        text: 'Vesper once paid compensation for the road they sold without naming the refugee. The duplicate is pinned here. Its label is blank where the refugee’s new name would go, and the pin has been pushed through it twice, impatiently.',
      },
      {
        flag: 'e08:3,3:protect-the-map',
        text: 'At the guest registry Vesper redacted the routes that would have exposed refugee families. Here, on every pinned wing, the redactions have been neatly filled back in.',
      },
      {
        flag: 'e08:3,3:share-custody',
        text: 'At the guest registry the map went into recallable community custody. The kiln has made itself a member of the community. It is keeping these.',
      },
    ],
    choices: [
      {
        id: 'unpin',
        label: 'Unpin your childhood maps and fold them away',
        outcome:
          'The pins come out stiffly, and each freed map folds itself back along its old creases, the way it was made to. Vesper puts them in the satchel. The duplicate road they sold stays pinned; they leave it there, so it can be seen. ‘You’re taking them out of safekeeping,’ the kiln says, hurt. ‘Yes,’ says Vesper.',
        gain: { trust: 1, danger: 1 },
        artSubject: `${VESPER} drawing a pin from a paper moth on a glowing kiln rack as the freed map folds itself shut in their hand, one pinned moth left deliberately in place, ${PIP} holding the satchel open`,
      },
      {
        id: 'read-labels',
        label:
          'Read the labels, to learn what the Oven thinks your maps were for',
        outcome:
          'Every label is an address, and every address is right. Vesper drew these so people could travel without anyone recording where they hid. The kiln has read them the other way round, and it is not wrong: the hiding places are all there, in Vesper’s own lines, for anyone who reads a map backwards. They copy one label as proof. Their hand shakes.',
        gain: { evidence: 2 },
        artSubject: `${VESPER} bending close to a pinned paper moth on a glowing kiln rack to read its small label, copying it into a notebook with an unsteady hand, ${PIP} looking away`,
      },
    ],
  },
  {
    id: 'FN-10',
    title: 'The Scale That Weighs Households',
    kind: 'choice',
    speaker: 'The fox spirit',
    opening:
      'The miller still stands at the great scale and can still name every sack, but now every sack is a household. A family name is stencilled on each, with a door number, and the scale weighs how findable they are: the heavier, the nearer the procession. One sack, from a house that asked never to be found, has tipped the beam all the way down. The fox spirit sits on the counterweight shelf with her tail round her feet. ‘Accurate,’ she says, ‘is not the same as fair. Something has to go on the other pan.’',
    artSubject: `A dusty mill weighhouse with a great iron balance scale, one pan sunk to the floor under a single stencilled flour sack, rows of other stencilled sacks against the walls, a fox spirit sitting on a shelf of brass counterweights, a tired miller at the beam, ${VESPER} and ${PIP} before the empty raised pan`,
    echoes: [
      {
        flag: 'OV-10:weigh-flour',
        text: 'Last time Vesper had this flour measured and the missing meals published. The miller’s independent count is pinned above the scale. Someone has extended it down the wall, in pencil, as a column of house numbers.',
      },
      {
        flag: 'OV-10:trace-sacks',
        text: 'Last time Vesper traced these sacks to their households in private. The mill marks they followed are on every sack now, renewed in fresh red, as if the Oven had taken notes on how it was done.',
      },
      {
        flag: 'e07:4,2:offer',
        text: 'Vesper once gave a ration at the bakery back door. Its weight is chalked on the scale’s base, with Vesper’s name beside it, as a credit.',
      },
      {
        flag: 'e07:4,2:pledge',
        text: 'Vesper once promised the baker to account for the missing memories. The promise is here, on a tag tied to the beam. Pip warned them it would follow.',
      },
    ],
    choices: [
      {
        id: 'weigh-maps',
        label: 'Put Vesper’s satchel of maps on the other pan',
        outcome:
          'The beam swings level. The hidden household’s sack is light again, unfindable, and the satchel is suddenly very heavy: the scale has weighed Vesper instead. When they lift it off it is just as it was. Something in it is not. ‘You’re on the books now,’ the fox says, not unkindly. ‘Heavier than you were.’',
        gain: { trust: 1, danger: 2 },
        artSubject: `${VESPER} setting a bulging satchel of folded maps on the raised pan of a great balance scale as the beam swings level, the fox spirit watching from the counterweight shelf, ${PIP} steadying the stencilled sack on the other pan`,
      },
      {
        id: 'false-weight',
        label: 'Let the fox spirit slip a false weight onto the pan',
        outcome:
          'She drops a pebble that is not a pebble, and the beam rises with a groan. The sack is light. The miller notes the reading, sees the pebble, and says nothing, which is his own small mutiny. ‘It won’t hold past morning,’ says the fox. ‘But they’ll be gone by morning.’',
        gain: { trust: 1 },
        artSubject: `A fox spirit dropping a small glinting pebble onto the pan of a great balance scale as the beam lifts, a miller at the beam pretending not to see, ${VESPER} and ${PIP} exchanging a look`,
      },
      {
        id: 'spill-sack',
        label: 'Slit the sack and let the stencilled name blow away as flour',
        outcome:
          'The flour goes up in a pale cloud and settles on everything, the scale, Pip, the miller’s sleeves: a household’s name spread too thin to read. The beam rises. Nobody can find them now. Not the procession, and not the cousin who came last week asking. The miller sweeps it into a corner and does not throw it away.',
        gain: { danger: -1, evidence: -1 },
        artSubject: `A slit flour sack spilling a great pale cloud across a weighhouse, the scale beam rising, ${VESPER} with a small blade in hand turning away from the dust, ${PIP} and a miller white with flour`,
      },
    ],
  },
  {
    id: 'FN-11',
    title: 'The Hall of Tagged Shoes',
    kind: 'lore',
    speaker: 'The house spirit',
    opening:
      'The nursery door stands wide open now. The house spirit has no need to bar it. The children are gone, and their small shoes are lined along the hall outside in perfect pairs, toes to the skirting, each with a paper tag threaded through the laces giving the house it went home to. Every hour a little bell rings and the spirit calls the roll, name by name, and each pair shuffles once on the boards in answer. It is calling now.',
    artSubject: `A long wooden nursery hallway with an open door at its end, rows of small children’s shoes lined up in perfect pairs along the skirting, a tiny paper tag threaded through each pair’s laces, a small hunched house spirit at the far end with a little bell, ${VESPER} and ${PIP} standing just inside`,
    autoChoiceId: 'hear-roll',
    echoes: [
      {
        flag: 'OV-11:unlatch-door',
        text: 'Last time Vesper unlatched this door, and the children took the spirit’s hand anyway and promised to come back. They did. Then the procession came, and the spirit learned it could keep their shoes even when it could not keep them.',
      },
      {
        flag: 'OV-11:ask-children',
        text: 'Last time the children asked for a bell and an unlocked latch. They got both. The bell is the one ringing the roll. The latch is still unlocked, and the spirit checks it after every name.',
      },
      {
        flag: 'e08:2,2:seal-the-children',
        text: 'At the ledger house Pip sealed children’s addresses out of public testimony. He goes very still at the tags in these laces. He knows what he sealed, and here it all is, threaded through.',
      },
      {
        flag: 'e08:2,2:audit-the-ledger',
        text: 'At the ledger house an independent audit shrank the census of rescued names. Nobody has ever audited this roll. Pip counts the shoes against it under his breath.',
      },
    ],
    choices: [
      {
        id: 'hear-roll',
        label: 'Listen to the roll call to the end',
        outcome:
          'Twenty-two names, twenty-two shuffles. Then a twenty-third name, and at the end of the row a pair of shoes that does not move. The spirit calls it again, louder, and again. Pip whispers that he knew her: she ran the night the procession came, and nobody knows where. The spirit is not cruel. It is terrified. It keeps calling so that someone will answer.',
        gain: { evidence: 1 },
        artSubject: `A small house spirit ringing a little bell at the end of a hallway toward one pair of children’s shoes that stands apart from the rest, ${PIP} whispering to ${VESPER} in the foreground`,
      },
    ],
  },
  {
    id: 'FN-12',
    title: 'The Hollow in the Coals',
    kind: 'rest',
    speaker: 'Vesper',
    opening:
      'This is where Kogane used to rest: a long bed of coals in an alcove off the bake hall, still warm, still holding the hollow of a stooped body pressed into it. Kogane is not here. On a hook above the hollow hangs a paper collar, a spare, the kind a registrar wears, folded crisp. The coals are good. Far off in the Oven a bell begins a roll call, and the hollow in the coals stirs, as if to answer it.',
    artSubject: `A low brick alcove holding a long bed of softly glowing coals with the hollow of a large stooped body pressed into them, a crisp folded paper collar hanging on an iron hook above, ${VESPER} kneeling at the edge with a clay ember pot, ${PIP} sitting against the wall`,
    echoes: [
      {
        flag: 'OV-12:release-ember',
        text: 'Last time Vesper released Kogane from the baking oath, and it stepped out of these coals a witness who could say no. It found it had nothing to do with its freedom. The procession gave it something.',
      },
      {
        flag: 'OV-12:offer-ember',
        text: 'Last time Kogane wrote its own contract here: a shorter season and a cooling bell. The bell calling the roll is that bell. Kogane chose it. It may still believe it is ringing everyone home.',
      },
      {
        flag: 'FN-11:hear-roll',
        text: 'It is the nursery’s roll, carried on through the house. Vesper listens for the twenty-third name, and hears it called, and called.',
      },
    ],
    choices: [
      {
        id: 'bank-coals',
        label: 'Bank the coals around your ember and rest while it drinks',
        outcome:
          'Vesper settles the clay pot into the hollow and heaps the old coals round it. The ember drinks, slow and steady, and Pip falls asleep against the wall. The roll call goes on a long time. It does not reach their names. When the pot is full, the hollow in the coals is a little smaller, as if Kogane had shifted over to make room.',
        gain: { battery: 2 },
        artSubject: `${VESPER} resting with folded wings beside a clay pot nestled deep in a bed of glowing coals, ${PIP} asleep against the brick wall, a paper collar on a hook above them`,
      },
      {
        id: 'note',
        label: 'Leave an unsigned note for the next guest, under the collar',
        outcome:
          'Vesper writes it in a hand nobody would know: The coals are warm. The roll can’t hear you here. Don’t sign anything. Rest. No name, no direction. They tuck it under the hook where the collar hangs. Pip, reading over their shoulder, adds nothing, and nods, which from Pip is a signature.',
        gain: { trust: 1 },
        artSubject: `${VESPER} tucking a small folded note behind an iron hook where a paper collar hangs above a bed of coals, ${PIP} reading over their shoulder and nodding`,
      },
    ],
  },
  {
    id: 'FN-13',
    title: 'The Floor That Keeps Accounts',
    kind: 'hazard',
    speaker: 'Pip',
    opening:
      'The counting room has no lamp, and the dark in it is ruled. Vesper feels the lines under their feet before they see them: the floor has become a ledger page, columns scored into the boards, and each step they take writes itself down with a small dry scratch. Meals given on the left. Names taken on the right. Pip, who has kept books since he was small, whispers that a good ledger always has a margin, and nothing in the margin counts.',
    artSubject: `A pitch-dark wooden room whose floorboards are scored into long ruled ledger columns, faint scratch marks trailing behind two figures, ${VESPER} feeling forward with antennae spread, ${PIP} holding their sleeve, the only light a dim glow from a clay pot`,
    echoes: [
      {
        flag: 'OV-13:publish-totals',
        text: 'Last time Pip published this discrepancy without exposing the donors. The floor remembers. The two columns still do not agree, and someone is being charged twice again. Tonight it is Vesper.',
      },
      {
        flag: 'OV-13:invite-auditors',
        text: 'Last time the workers and recipients audited these ledgers in private and demanded an appeal. Their initials are cut into the doorframe, one set per auditor, and each set has been ruled through, neatly, once.',
      },
      {
        flag: 'entry:named',
        text: 'The baker’s ledger in Vesper’s satchel scratches faintly in answer to the floor, adding lines of its own.',
      },
    ],
    choices: [
      {
        id: 'light-margin',
        label: 'Lift the ember and find the margin',
        outcome:
          'In the ember light the floor is plain: two columns of footprint entries, hundreds deep, and down the far edge a narrow strip of bare, unruled boards. They walk it single file. Nothing scratches. Halfway along, Pip points to a line of small footprints in the margin ahead of them, a child’s, going the same way, years old.',
        gain: { battery: -1, danger: -1, evidence: 1 },
        requires: { battery: 1 },
        lockedHint: 'Needs warmth in the clay pot',
        artSubject: `${VESPER} holding up a glowing clay ember pot over a floor scored into ruled columns of footprints, walking a bare strip along the wall, ${PIP} pointing at a trail of small child’s footprints in the dust ahead`,
      },
      {
        id: 'walk-dark',
        label: 'Cross in the dark and let the floor count you',
        outcome:
          'Every step scratches. By the far wall Vesper has been written down thirty times, on the right-hand side, under names taken. The floor does not know their name yet, only their weight and stride, but it is learning. Behind them in the dark the scratching goes on for a few steps more, as if the room were walking it back to check.',
        gain: { danger: 2 },
        artSubject: `${VESPER} and ${PIP} crossing a pitch-dark room hand in hand, pale scratch marks following their footsteps across the ruled floorboards and continuing a few steps behind them where no one walks`,
      },
      {
        id: 'balance-book',
        label: 'Let Pip walk you across the way you balance a book',
        outcome:
          'Pip takes Vesper’s hand and walks them on the diagonal: left column, right, left, so that every meal entered is cancelled by a taking. The floor scratches, and at each pair rubs itself out. At the far side the page is balanced and blank. Pip is shaking. ‘That’s how the baker balanced my books,’ he says. ‘I never thought I’d use it.’',
        gain: { trust: 1, danger: 1 },
        artSubject: `${PIP} leading ${VESPER} by the hand on a zigzag path across a dark ruled floor, scratch marks appearing and smudging away behind each pair of steps`,
      },
    ],
  },
  {
    id: 'FN-14',
    title: 'The Commons, Three Times Over',
    kind: 'puzzle',
    speaker: 'Pip',
    opening:
      'Past the counting room the hearth commons opens off the corridor three times: three doors, three small kitchens, one table set in each, the same bowls, the same steam. The Oven has filed the commons under one address and offers all three. Only one is the kitchen the village built. Pip remembers two things about it: the miller laid its hearth crooked, under the window, and would not fix it; and its back door latched on the inside, so any household could leave.',
    artSubject: `A corridor with three identical open doorways side by side, each showing a small steamy kitchen with a set table and bowls, differences only in where the hearth sits and how each back door is fastened, ${VESPER} and ${PIP} standing in the corridor comparing them`,
    echoes: [
      {
        flag: 'OV-14:build-commons',
        text: 'Last time Vesper helped organise these independent kitchens and a shared rota. The rota hangs on all three doors. Two of the copies list every household as present, always.',
      },
      {
        flag: 'OV-14:share-flue',
        text: 'Last time Vesper repaired the refuge flue and rationed the Oven’s heat. All three kitchens are warm now. Vesper did that rationing themself, and knows only one kitchen was ever meant to get it.',
      },
      {
        flag: 'FN-07:let-it-read',
        text: 'The plan the chimney drew from Vesper’s wings showed a kitchen beside the refuge, its hearth off-centre, its back door bolted from within. Vesper wishes they did not remember it so well.',
      },
    ],
    choices: [
      {
        id: 'square-hearth',
        label:
          'The left kitchen: hearth square in the middle, back door latched inside',
        outcome:
          'A tidy kitchen, its hearth exactly central, as on a registrar’s drawing. The back door opens onto the same kitchen, the same table, the same bowls, and a little further off the same again. They back out before the doors can start agreeing with each other.',
        gain: { danger: 1 },
        artSubject: `${VESPER} and ${PIP} backing out of a neat kitchen with a perfectly central hearth, its open back door revealing the same kitchen repeated again and again into the distance`,
      },
      {
        id: 'handleless-door',
        label:
          'The middle kitchen: hearth crooked by the window, no handle on the back door',
        outcome:
          'The hearth is right and the bread smells true, but the back door has no handle on this side. The hearth pulls at Vesper’s ember, hungry, and Pip has to snatch the pot back. When they leave, there is a tag beside one bowl at the table, with Pip’s address on it, and they leave that there too.',
        gain: { battery: -1 },
        artSubject: `${PIP} snatching a clay ember pot back from a hearth that leans toward it in a small kitchen with a crooked fireplace under the window and a back door with no handle, ${VESPER} beside him`,
      },
      {
        id: 'crooked-hearth',
        label:
          'The right kitchen: hearth crooked by the window, back door latched inside',
        outcome:
          'The real commons: hot, crowded, badly organised. Two cooks look up in alarm and then, seeing who it is, go back to work. They have kept it running all night by refusing the Oven an address: three households cook here, and each tells the procession it lives somewhere else. One gives Vesper a count of the missing, without names. Just how many, and the night each was last seen.',
        gain: { evidence: 2 },
        artSubject: `A cramped busy kitchen with a lopsided hearth under a small window and a back door with a simple inside latch, two cooks at work, one handing ${VESPER} a folded slip of paper while ${PIP} warms his hands`,
      },
    ],
  },
  {
    id: 'FN-15',
    title: 'The Empty Seat of the Guardian',
    kind: 'companion',
    speaker: 'Pip',
    opening:
      'The guardian’s crown of bricks still stands in the middle of the hall, a ring of cold bricks around nobody, and its new charge is nailed to the top course: EVERY GUEST KNOWN. Curled asleep inside the ring is a woman in a flour-sack coat, hiding where the Oven never thinks to look: its own empty seat. Pip has found her name on the charge, the one the Furnace burnt out of her. She does not remember it. He wants to write it down for her. Vesper does not.',
    artSubject: `A ring of cold soot-darkened bricks shaped like a low crown in the middle of a bake hall, a sheet of paper nailed to its top course, a woman in a patched flour-sack coat curled asleep inside the ring, ${PIP} holding his open ledger and a pencil, ${VESPER} with a hand raised as if to stop him`,
    echoes: [
      {
        flag: 'OV-15:rewrite-guardian',
        text: 'Last time Vesper rewrote this guardian’s charge with witnesses and a right to withdraw. The old charge is still under the new one. The right to withdraw is there, amended in a neat hand: WITHDRAWN TO A KNOWN ADDRESS.',
      },
      {
        flag: 'OV-15:quench-guardian',
        text: 'Last time Vesper quenched the compulsory flame here, and the guardian went quiet. It has stayed quiet. The bricks are cold, which is why she can sleep in them: the one place in the Oven that no longer burns.',
      },
      {
        flag: 'e07:2,2:trace',
        text: 'Pip once erased his own benefactor so the village could not demand repayment, then agreed to testify. He knows exactly what an erased name costs, both ways round.',
      },
      {
        flag: 'e07:2,2:protect',
        text: 'Pip once let his first night’s giver stay anonymous. ‘That was my choice about my own debt,’ he says. ‘This is her name. It isn’t ours, either way.’',
      },
      {
        flag: 'e07:4,4:witness',
        text: 'Vesper once stood up in public and named the road they sold. Pip reminds them of it, not cruelly. ‘You wanted that written down.’',
      },
    ],
    choices: [
      {
        id: 'pip-writes',
        label: 'Let Pip write her name in his own ledger, for her keeping',
        outcome:
          'Pip writes it small, on a page of its own, and folds the corner down. ‘It’s hers. When she wants it, it’s here. Nobody reads my book but me.’ Vesper thinks of the atlas they sold a road out of, which nobody read either, until somebody did. They say so. Pip keeps writing.',
        gain: { trust: 2, danger: 1 },
        artSubject: `${PIP} writing carefully on a fresh page of his ledger and folding its corner down beside a sleeping woman in a ring of cold bricks, ${VESPER} standing over him with arms folded and wings drawn tight`,
      },
      {
        id: 'leave-unwritten',
        label: 'Back Vesper: leave her name unwritten, the way she escaped',
        outcome:
          'Pip closes his ledger, not gently. ‘You decide what gets drawn,’ he says. ‘You always did.’ The woman sleeps on in the ring, safe and nameless, and somewhere in the village her son goes on asking after her. Vesper does not pretend that costs nothing. Neither does Pip.',
        gain: { danger: -1, trust: -1 },
        artSubject: `${PIP} snapping his ledger shut and turning away from ${VESPER}, a woman asleep in a ring of cold bricks between them, untroubled`,
      },
      {
        id: 'tell-her',
        label:
          'Wake her and tell her a name exists, for her to hear when she chooses',
        outcome:
          'She listens with her eyes closed. ‘Not yet,’ she says. ‘Tell me who’s looking first.’ Pip writes that down instead: not her name, only not yet, and the date. It satisfies neither of them. It is hers.',
        gain: { trust: 1, danger: 1 },
        artSubject: `A woman in a flour-sack coat sitting up inside a ring of cold bricks with her eyes closed, listening, ${VESPER} crouched beside her speaking softly, ${PIP} writing two small words in his ledger`,
      },
    ],
  },
  {
    id: 'FN-16',
    title: 'The Court That Calls the Roll',
    kind: 'hazard',
    speaker: 'Kogane',
    opening:
      'The families still wait beneath the cooling flue, but the soot court has stopped hearing appeals. It calls the roll. A voice from the flue reads names, slowly, one for each falling flake of soot, and when a name goes unanswered the soot keeps falling on the spot where its owner stands, until there is a black outline there that anyone could find. A few families have answered. Most have not. They stand very still under their darkening shapes, holding hands, saying nothing, on purpose.',
    artSubject: `A high-ceilinged hall beneath a wide brick flue with soot drifting down like black snow, rows of villagers standing hand in hand, each slowly outlined in settled soot on the floor around their feet, ${VESPER} and ${PIP} at the edge looking up into the flue`,
    echoes: [
      {
        flag: 'OV-16:invite-appeals',
        text: 'Last time Vesper opened an appeal desk here, with private testimony behind a screen. The screen still leans against the flue. The first petition heard behind it is nailed to the front, and the petitioner’s address has been added in soot.',
      },
      {
        flag: 'OV-16:hold-private-hearings',
        text: 'Last time the families chose their own mediators. The mediators are here, in the line. They are the ones holding the hands.',
      },
      {
        flag: 'entry:unnamed',
        text: 'Twice the flue calls for THE ONE WHO FED THEM UNSIGNED, and twice the court waits, and twice nobody moves. The soot does not know where to fall. It drifts.',
      },
      {
        flag: 'entry:named',
        text: 'The baker’s ledger in Vesper’s satchel grows warm whenever the flue reads a name that is also in it. It is warm most of the time.',
      },
    ],
    choices: [
      {
        id: 'stand-silent',
        label: 'Stand with the families who won’t answer',
        outcome:
          'Vesper takes a place in the line, and a grandmother takes their hand without looking at them. The soot falls. It finds Vesper’s antennae and wing edges first, then the rest. When the roll ends, a whole row of black silhouettes stands on the floor of the court, and none of them has a name. Everyone steps out of them together and leaves them there.',
        gain: { trust: 2, danger: 1 },
        artSubject: `${VESPER} standing hand in hand with a line of silent villagers under falling soot, a crisp black outline of moth wings and antennae forming on the floor around their feet, ${PIP} beside them doing the same`,
      },
      {
        id: 'drag-screen',
        label: 'Drag the old appeal screen over the families to catch the soot',
        outcome:
          'The screen is heavy and Pip has to help. It catches the soot like snow on a roof, and beneath it the families’ outlines stop darkening. The flue notices. It begins to call the screen’s name, which it has, because everything in this house has one now, and the screen begins, slowly, to go black.',
        gain: { danger: -1 },
        artSubject: `${VESPER} and ${PIP} hauling a tall folding paper screen over a huddle of villagers as soot piles on its top edge like snow, the screen’s panels slowly darkening`,
      },
      {
        id: 'answer',
        label:
          'Answer when the flue calls your name, so the roll stops for you',
        outcome:
          'The flue reaches Vesper. It knows their name, and says it right. Vesper answers. For the long breath it takes the court to write them down, the soot stops falling everywhere at once, and every family under the flue is just a family, unmarked. Then the roll moves on. Vesper is on it now, properly, and the soot over their place has begun to settle into a shape.',
        gain: { danger: 2, trust: 1, evidence: 1 },
        artSubject: `${VESPER} stepping forward alone under a great brick flue with head raised, the falling soot frozen in the air around the hall, villagers behind them looking up in surprise, ${PIP} reaching after them`,
      },
    ],
  },
  {
    id: 'FN-17',
    title: 'The Spoon That Taps Out Doors',
    kind: 'lore',
    speaker: 'Pip',
    opening:
      'The long-handled spoon is still here, still stirring. The pot is empty and scraped silver, but the spoon has not stopped. Every few strokes it lifts itself and taps the rim, counting. Pip, who learned its language when he was small, listens and goes pale. It is not yes and no any more. It is house numbers. Someone has taught it to tap out where everyone who ever ate its soup now lives.',
    artSubject: `A long-handled wooden spoon with a cracked bowl stirring by itself in an empty scraped-silver cooking pot on a cold stove, lifting to tap the rim, ${PIP} listening with a stricken face, ${VESPER} behind him in the dim kitchen`,
    autoChoiceId: 'ask-spoon',
    echoes: [
      {
        flag: 'OV-17:offer-shelf',
        text: 'Last time the spoon chose a high shelf to rest on. The shelf is still there. Someone has carved a house number into its edge, so the spoon will always be filed where it chose to rest.',
      },
      {
        flag: 'OV-17:restore-handle',
        text: 'Last time Vesper repaired its handle, and it volunteered for festival broth. Its chalkboard of hours is still on the wall. Every hour has been filled in, all night, every night since.',
      },
      {
        flag: 'FN-12:note',
        text: 'Propped against the pot is a copy of Vesper’s unsigned note: The roll can’t hear you here. It is in a different hand. Someone read it, and passed it on.',
      },
    ],
    choices: [
      {
        id: 'ask-spoon',
        label: 'Ask the spoon whether it wants to be counting',
        outcome:
          'The spoon stops. It hangs over the pot a long moment, as if it has never been asked anything but where. Then it taps the rim twice: no. Then twice again, and again, a long run of no that sounds like someone knocking to be let out, until Pip lifts it from the pot and holds it like a hand. It goes on tapping against his palm, softer.',
        gain: { trust: 1 },
        artSubject: `${PIP} holding a long cracked wooden spoon in both hands like a small hand, the spoon tapping against his palm, an empty silver pot on the stove beside him, ${VESPER} watching gently`,
      },
    ],
  },
  {
    id: 'FN-18',
    title: 'The Ferry That Wants a Destination',
    kind: 'shortcut',
    speaker: 'The ferry captain',
    opening:
      'The ferry kitchen sits at the bottom of the Oven where the river runs beneath it, and the ferry is moored at the kitchen door as it always was. It will not leave. Its captain sits at the tiller with a stack of blank destination cards. The procession will let her carry anyone anywhere, she says, so long as each fills one in. Nobody has. Behind the stove an iron ladder climbs the old flue toward the night shift above, rung after soot-black rung.',
    artSubject: `A low stone kitchen opening onto a dark underground river, a wooden ferry moored at its door with a woman captain at the tiller holding a stack of blank cards, families waiting on the bank with bundles, an iron ladder rising into a soot-black flue behind the stove, ${VESPER} and ${PIP} at the foot of the ladder`,
    echoes: [
      {
        flag: 'OV-18:float-supper',
        text: 'Last time Vesper sent hot meals downstream and the captain recorded who still waited. Her list is pinned to the tiller. The Oven has filled in an address beside every name. She has drowned the list twice in the river to wash them off. They come back.',
      },
      {
        flag: 'OV-18:build-dry-pantry',
        text: 'Last time the families came ashore and built a dry pantry in the refuge. They are still ashore. The ferry has come to them instead, and waits at the kitchen door with its gangplank down, very patient.',
      },
      {
        flag: 'FN-05:jam-clocks',
        text: 'One of the night workers who climbed down the flue is here, flour still in her hair. She points up the ladder. ‘Back to the clocks,’ she says. ‘If you’re mad.’',
      },
      {
        flag: 'FN-05:punch-in',
        text: 'Vesper’s punched card is still in their satchel, still warm. At the top of that ladder is the clock that printed it.',
      },
    ],
    choices: [
      {
        id: 'climb-flue',
        label: 'Climb the flue ladder and open the hatch to the night shift',
        outcome:
          'It is a long climb in the hot dark, the ember lighting only the next rung. At the top, Vesper shoulders the iron hatch up into the night-shift bakery, where the time-clocks tick. The ladder runs both ways now: a quick road back, and a quick road down for anyone the clocks send after them.',
        gain: { danger: 1 },
        artSubject: `${VESPER} at the top of a soot-black iron ladder shouldering open a round floor hatch into a lit bakery workroom, a clay ember pot hooked to their belt, ${PIP} climbing below`,
      },
      {
        id: 'stay-below',
        label:
          'Stay below and help the captain fill her cards with routes, not addresses',
        outcome:
          'Vesper takes the blank cards and the captain’s pencil and draws on each a route instead of an address: a river that bends, a place to step off, no door. The ferry reads them, groaning, and cannot decide whether a map is a destination. While it decides, the captain casts off with six families aboard. The flue ladder stays dark above.',
        gain: { trust: 1, danger: -1 },
        artSubject: `${VESPER} sketching small winding river routes onto blank cards at a ferry’s tiller beside a woman captain, families climbing aboard behind them, ${PIP} untying the mooring rope, a dark ladder rising unused in the background`,
      },
    ],
  },
]
