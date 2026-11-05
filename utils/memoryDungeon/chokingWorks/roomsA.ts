import type { ChokingRoomContent } from './types'

/**
 * The Choking Works, rows 1–3 (CW-01..CW-18): the Breathing Works’ first
 * eighteen rooms, warped. The court has been feeding the Glass Throat what it
 * wants forgotten, and overnight it has been correcting the tunnels: slates
 * rewritten, names sanded off, refusals multiplying, chalk skulls turned
 * round. Char is with Scylla from CW-01 (her tunnels first); Oren is met at
 * CW-15 and stays at his post. CW-NN remembers GT-NN.
 */

const SCYLLA =
  'a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze'
const CHAR =
  'her identical twin with dark violet scales, black lace and a sardonic grin'
const OREN =
  'a fully hooded headsman with an eel-grey tail and an axe at his belt'
const SULK = 'a glass globe lantern with a small glimmer eel coiled inside'

export const CHOKING_ROOMS_A: readonly ChokingRoomContent[] = [
  {
    id: 'CW-01',
    title: 'Where the Throat Lets Go',
    kind: 'entry',
    speaker: 'Char',
    opening:
      'The Glass Throat lets Scylla go at the bottom, coughed out rather than swallowed, into the same vaulted tunnel of green brick. The pipes overhead are papered with wet letters. Somewhere ahead, something enormous is trying to breathe and catching on every breath. Char is on her pipe-bracket with Sulk in her lap, and she is not swinging her tail. ‘They put my doll down the drain,’ she says. ‘In front of me. Then they said I never had one.’',
    artSubject: `A vaulted underwater service tunnel of green-glazed brick beneath a round shaft, great pipes along the vault plastered with sodden pale letters, ${SCYLLA} tumbling out of the shaft in a cloud of bubbles and drifting paper, while ${CHAR} sits rigid on a pipe bracket above with ${SULK} in her lap and her jaw set`,
    echoes: [
      {
        flag: 'entry:pulled',
        text: 'Two letters, a ribbon and a nailed crab are tucked against Scylla’s ribs, pulled from the grate before the court could finish swallowing them. Char sees the ribbon and her mouth goes thin. She knows whose it is, and doesn’t say.',
      },
      {
        flag: 'entry:listened',
        text: 'Before Char can speak, the tunnel says it for her, in Scylla’s own voice: ‘You came down the drain.’ Char looks at the brick as if it had picked her pocket. ‘That’s my line,’ she says. ‘Get your own.’',
      },
      {
        flag: 'GT-01:follow-chalk',
        text: 'Char’s chalk skulls from last time are still on the wall, one every twenty strokes. Half of them have turned round in the dark and point back up the shaft.',
      },
      {
        flag: 'GT-01:carry-lantern',
        text: 'Last time Sulk sulked to an ember in Scylla’s hands. Tonight the eel presses to the far side of the glass, away from her, and stays there.',
      },
      {
        flag: 'e04:char-lost-in-present',
        text: 'The brick gives back Char’s voice three times, every one of them furious and alive. Scylla counts them twice before she lets go of the last rung.',
      },
    ],
    choices: [
      {
        id: 'follow-chalk',
        label: 'Follow Char’s chalk skulls, whichever way they point',
        outcome:
          'Char drops off the bracket and swims ahead, and wherever a skull has turned to point back the way they came, she licks her thumb, rubs it out and draws it again, facing on. ‘Mine face forward,’ she says. ‘I know my own.’ Scylla follows a length behind and keeps her mouth shut, which the tunnels seem to find interesting.',
        gain: { trust: 1, danger: 1 },
        artSubject: `${CHAR} rubbing out a small chalk skull on a green brick wall with her thumb and redrawing it facing the other way, ${SULK} swinging from her wrist, ${SCYLLA} following a length behind`,
      },
      {
        id: 'ask',
        label: 'Ask her how long the tunnels have been like this',
        outcome:
          '‘Since this morning. This morning’s been three times.’ Char ticks them off: the doll, the clerk, the doll again. ‘The third time I came down the kitchen stair before they could say it.’ She looks at Scylla’s hands. ‘Are you writing it down? Everybody up there is writing it down.’ Scylla learns a great deal, and that asking has cost her something.',
        gain: { evidence: 2, trust: -1 },
        artSubject: `${CHAR} on a pipe bracket counting on her fingers with a hard, flat look, ${SCYLLA} below looking up at her, a lantern glow between them in a dim brick tunnel papered with wet letters`,
      },
      {
        id: 'carry-lantern',
        label: 'Offer to carry the lantern for her',
        outcome:
          'Char holds Sulk out at arm’s length. ‘Go on. Everybody wants to carry my things today.’ Scylla takes the globe. The light steadies for being held carefully. Char swims off into the dark without it, and the dark repeats her strokes a moment after she makes them, which Scylla does not like at all.',
        gain: { danger: -1, trust: -1 },
        artSubject: `${SCYLLA} holding ${SULK} with the eel pressed to the far side of the glass, while ${CHAR} swims off ahead into a dark tunnel, a faint second outline of her following a moment behind`,
      },
    ],
  },
  {
    id: 'CW-02',
    title: 'The Slate, Rewritten',
    kind: 'lore',
    speaker: 'Scylla',
    opening:
      'The crew’s shift slate still hangs where the tunnel forks, but it has been rewritten overnight in a clerk’s tidy chalk. Dace. Ottery. Marl D., Tuesdays. Where Fenn D. was struck through, the stone has been scrubbed grey, as if no name was ever there. At the foot the old paint now reads LANDWARD SLUICE: NEVER OPENED. And down the margin, forty-one times, in Char’s crooked hand, the same small word: why?',
    artSubject: `A slab of black slate on a brick wall where an underwater tunnel forks, its chalk ruling redone in neat even lines, one row scrubbed to a pale grey smear, a long column of identical tiny chalk marks down its margin, ${SCYLLA} staring at it by lantern light while ${CHAR} hovers behind with her fists clenched`,
    echoes: [
      {
        flag: 'GT-02:copy-slate',
        text: 'Scylla copied this slate into her sleeve-book last time. She opens it now. Her copy has Fenn’s line struck through, not scrubbed out. One of them is lying, and it isn’t her pencil.',
      },
      {
        flag: 'GT-02:ask-why',
        text: 'Last time Char gave the why? a second question mark, for emphasis. Of everything on the slate, that is the one mark the court has bothered to wipe away.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'Under the crew’s names, where the sleepers between shifts were listed, the clerk has written STORES: EMPTY. Scylla has read a map like that before, in another life, and believed it.',
      },
    ],
    choices: [
      {
        id: 'copy-slate',
        label: 'Copy the slate as it stands now, beside your old copy',
        outcome:
          'She copies it line by line, and halfway down a chalk letter shivers and settles into a different one, as if the slate is still being corrected while she reads. She writes that down too, with the time. Char reads over her shoulder. ‘Good,’ she says. ‘Now there are two of it, and they can’t both be true.’',
        gain: { evidence: 1, danger: 1 },
        artSubject: `${SCYLLA} copying from a chalk-ruled slate into a tiny sleeve-book, one chalk mark on the slate visibly blurring as she watches, ${CHAR} leaning over her shoulder, lantern light on both their faces`,
      },
      {
        id: 'rub-out',
        label: 'Let Char decide which why? is hers',
        outcome:
          'Char takes the chalk-cloth and goes down the column, slow as a clerk, rubbing out forty of the forty-one. She leaves one, small and crooked, near the bottom. ‘That’s mine,’ she says. ‘The rest are them, doing my voice.’ Scylla couldn’t have told them apart. She doesn’t say so.',
        gain: { trust: 1 },
        artSubject: `${CHAR} wiping a long column of tiny chalk marks off a black slate with a cloth, leaving a single one near the bottom, ${SCYLLA} beside her with her arms folded, watching`,
      },
    ],
  },
  {
    id: 'CW-03',
    title: 'The Rationed Lamps',
    kind: 'treasure',
    speaker: 'Char',
    opening:
      'The lamp niches still honeycomb the wall, but every eel has been turned down to the same thin glow, and every globe faces the same way, toward the palace. A silver tack is driven through each brass lid. The crew’s shrimp tin wears a new label in clerk’s capitals: RATIONED BY ORDER. Sulk presses her nose to the glass and, for once, does not dim. At the end, the dark niche has a lamp in it now, cold and white, under a crown seal.',
    artSubject: `A curving tunnel wall honeycombed with small round niches, each holding a glass globe with a dim eel inside, every globe turned the same way and pinned with a small silver tack through its lid, a dented tin with a new paper band on a shelf beneath, one niche at the end holding a cold white lamp, ${CHAR} holding up ${SULK} as the eel presses to the glass`,
    echoes: [
      {
        flag: 'GT-03:shrimp',
        text: 'The pearl Scylla left in the shrimp tin last time sits on the shelf beside it, returned, a slip tied round it: NO PAYMENT ACCEPTED.',
      },
      {
        flag: 'GT-03:dark-niche',
        text: 'Last time the crew’s scratched map was behind a fold of rock in that niche. The fold is still there. The cold lamp has been set in front of it, exactly.',
      },
      {
        flag: 'e06:3,3:care',
        text: 'Scylla knows these tacks. She pulled their brothers out of nailed shells in the nursery all night, and logged every one in her own name.',
      },
      {
        flag: 'e06:3,3:risk',
        text: 'Two of the globes are empty and tacked shut anyway, so the count still tallies. Scylla did the same with shells in the nursery. She looks at them for a long time.',
      },
    ],
    choices: [
      {
        id: 'shrimp',
        label: 'Feed Sulk from the rationed tin anyway',
        outcome:
          'Sulk eats as if the shrimp might be counted back out of her, and blazes. All along the wall the dim eels stir toward the light. Up the tunnel a small bell, newly hung, rings once as the tin’s lid lifts. Char shrugs. ‘Let them count it. They counted my doll.’',
        gain: { battery: 2, danger: 1 },
        artSubject: `${SULK} blazing bright gold as the eel snaps up a pinch of tiny shrimp from a dented tin, the dim eels in the niches all around turning toward it, ${CHAR} holding the lid with a defiant look, ${SCYLLA} beside her`,
      },
      {
        id: 'pull-tacks',
        label: 'Help Char pull the tacks from the eel globes',
        outcome:
          'Char works the tacks out with her thumbnail while Scylla holds each globe still. Freed, the eels turn in their glass, every one a different way, and glow however they like. It takes a long time and the clink of each tack carries. ‘There,’ says Char. ‘Now nobody in here agrees.’',
        gain: { trust: 2, danger: 1 },
        artSubject: `${CHAR} prising a silver tack from the lid of a glass eel globe with her thumbnail, ${SCYLLA} steadying the globe in both hands, freed eels glowing in different colours and directions in the niches around them`,
      },
      {
        id: 'dark-niche',
        label: 'Reach past the cold lamp into the niche',
        outcome:
          'Behind the fold of rock the crew’s map slate is still there, but the route that was scratched out has been scratched back in, deep and clean, and every other way has been scored through. Every road leads to the Throat. Except one: a line of tiny skulls pricked along the edge with a pin, Char’s, which nobody thought to touch.',
        gain: { evidence: 1, danger: 1 },
        artSubject: `${SCYLLA} with one arm deep in a round niche behind a cold white lamp, drawing out a small scratched slate, ${CHAR} peering at it over her shoulder, dim eel globes all turned one way in the niches around them`,
      },
    ],
  },
  {
    id: 'CW-04',
    title: 'The Bench, One Name Short',
    kind: 'lore',
    speaker: 'Scylla',
    opening:
      'The crew bench is still at the bend, the kettle still steaming on its coil, but there are six mugs now on six nails, and one hangs upside down. Along the bench’s back rail a name has been scraped off with a blade: four letters, the last one an N. Someone has scratched a tiny mark beside the gouge, and someone else a second. The pump log hangs where it always has, thicker than it should be, its margin full.',
    artSubject:
      'A rough wooden bench beside warm pipes at a bend in an underwater brick tunnel, its back rail gouged where carved letters were scraped away, two small scratch marks beside the gouge, a battered kettle steaming on a coil, six mismatched mugs on six nails with one hanging upside down, a thick ledger on a cord, a crew lamp glowing',
    autoChoiceId: 'read-log',
    echoes: [
      {
        flag: 'GT-04:read-log',
        text: 'Last time Scylla counted nine notes in this margin: saw the black-lace princess on the kitchen stair; said nothing. She remembers all nine. She could recite them.',
      },
      {
        flag: 'CW-02:copy-slate',
        text: 'Dace, Ottery, Marl: Scylla has their names twice now, in two copies that disagree. Neither copy accounts for a sixth mug.',
      },
      {
        flag: 'CW-02:rub-out',
        text: 'Char’s one true why? is still on the slate behind them. She keeps glancing back down the tunnel to check it is.',
      },
    ],
    choices: [
      {
        id: 'read-log',
        label: 'Read back through the pump log',
        outcome:
          'The nine notes are all still there, rewritten in a clerk’s hand: saw nothing, saw nothing, saw nothing. But the old ink was pressed hard, by people who meant it, and under the new words the page still holds its dents. Said nothing. Said nothing. Scylla reads it with her fingertips, nine times. Char sits down beside her and reads it too.',
        gain: { evidence: 1 },
        artSubject: `${SCYLLA} on a crew bench with a heavy pump log open across her lap, her fingertips resting on the page as if reading by touch, ${CHAR} beside her doing the same, six mugs on nails above them`,
      },
    ],
  },
  {
    id: 'CW-05',
    title: 'The Kitchen Door, Sealed',
    kind: 'shortcut',
    speaker: 'Char',
    opening:
      'The spiral stair still climbs to Char’s round iron door, but her greased bolt has been prised off, and in its place sit a crown seal of red wax the size of a fist and a brass plate: KITCHEN ACCESS CLOSED. Through the grille the cooks are singing the same verse over the same onions, again, and again. ‘That’s my door,’ Char says. It is the first time Scylla has heard her sound frightened, and she is angry about that too.',
    artSubject: `A narrow spiral stair of worn stone rising inside a round shaft to an iron door with a grille, a great blob of red wax sealing its edge where a bolt has been torn away, faint kitchen light through the grille, ${CHAR} on the top step with her palm flat against the seal, ${SCYLLA} one step below`,
    echoes: [
      {
        flag: 'GT-05:bolt',
        text: 'Last time Scylla slid this bolt home herself, so nobody could follow them down. The court has finished the job for her, properly, and kept the bolt.',
      },
      {
        flag: 'GT-05:leave-open',
        text: 'Last time they left Char’s door unbolted on principle. The court has a principle too. It is pressed into the wax.',
      },
      {
        flag: 'e05:run-again',
        text: 'They ran, last time, from not far from this door. The cooks’ verse names the dawn they left on, and asks it, very sweetly, to come home.',
      },
      {
        flag: 'e05:stay',
        text: 'They stayed, last time, and nobody stopped them going up and down these stairs. Nobody needed to. That is what the seal is for now.',
      },
      {
        flag: 'e05:tell-char',
        text: 'Last time Scylla told Char everything, and Char wrote down what she heard. A corner of one of those pages is pinned under the wax, its writing scraped away.',
      },
    ],
    choices: [
      {
        id: 'break-seal',
        label: 'Let Char break the seal on her own door',
        outcome:
          'Char puts her thumb to the wax and pushes until it cracks across the crown. The door is only shut now, not sealed, and the cooks’ singing stumbles for half a line. ‘Now they’ll know someone did it,’ Scylla says. ‘Good,’ says Char. ‘I want it to be someone.’',
        gain: { trust: 1, danger: 1 },
        artSubject: `${CHAR} pressing her thumb into a red wax seal on an iron door until it cracks across its stamped crown, ${SCYLLA} watching from the step below, kitchen steam drifting through the grille`,
      },
      {
        id: 'leave-sealed',
        label: 'Leave the seal; nobody can come down after you',
        outcome:
          'Scylla says it gently, which is worse. Char takes her hand off the wax. ‘Fine. It’s their door now. You agree with them.’ She swims down past Scylla without touching her. Nobody from the palace will come down this way tonight. Nobody will come down to fetch them, either.',
        gain: { danger: -1, trust: -1 },
        artSubject: `${CHAR} swimming down a spiral stone stair past ${SCYLLA} without looking at her, a sealed iron door above them glowing faintly through its grille`,
      },
    ],
  },
  {
    id: 'CW-06',
    title: 'Letters From Fenn',
    kind: 'treasure',
    speaker: 'Scylla',
    opening:
      'The crew lockers are still cut into the rock, but the burnt name on the end door has been sanded down to pale wood, and a fresh brass tag says VACANT. The fish-hook latch has been bent straight. Inside hang the oilskin hood and the tin whistle, and on the shelf lies a bundle of letters in net-twine, more than before. They are addressed from Fenn now, in a clerk’s round hand. The top one begins: Dear Tibby, I am well and I do not wish to come home.',
    artSubject: `A row of driftwood locker doors in a rock wall, the last one standing open with its burnt name sanded away and a small new brass tag in its place, an oilskin hood and a tin whistle hanging inside, a thick bundle of identical letters tied with net twine on the shelf, ${SCYLLA} holding a straightened fish-hook latch, ${CHAR} behind her rigid with fury`,
    echoes: [
      {
        flag: 'GT-06:letters',
        text: 'Last time Scylla read the top letter here: Tibby lost a tooth. Come home or don’t, but write. Tonight the second letter in the bundle answers it, in the clerk’s hand: Glad about the tooth.',
      },
      {
        flag: 'GT-06:oilskin',
        text: 'Scylla wore Fenn’s hood through the filter halls last time. It hangs on its peg again, dry and folded, as if it never left.',
      },
      {
        flag: 'GT-06:close',
        text: 'Last time Char touched Fenn’s burnt name for luck, and they hooked the latch closed. The name is gone. Char’s fingers find the place anyway.',
      },
      {
        flag: 'entry:pulled',
        text: 'One of the two letters Scylla pulled from the grate is in this same round hand, addressed to the Dunlins. She doesn’t need to open it now.',
      },
    ],
    choices: [
      {
        id: 'take-letters',
        label: 'Take the court’s letters, so nobody reads them to Tibby',
        outcome:
          'Tibby is seven and can’t read well yet. Somebody would read these to her, kindly, at the table. Scylla ties the bundle into her satchel, and it is heavier than paper should be. ‘They’ll write more,’ Char says. ‘Then we take more.’ Somewhere up the tunnel, a pen starts scratching.',
        gain: { evidence: 2, danger: 1 },
        artSubject: `${SCYLLA} tying a thick bundle of letters into her satchel in front of an open driftwood locker, ${CHAR} holding the satchel open for her, both of them grim in the lantern light`,
      },
      {
        id: 'oilskin',
        label: 'Borrow the oilskin hood; the filter halls are next',
        outcome:
          'It smells of tar and somebody else’s home, and inside the collar, in thread too small for a clerk to bother with, someone has stitched a C and a D. The court missed that. Scylla pulls the hood up. The letters stay on the shelf where the court left them, for whoever opens this door next.',
        gain: { danger: -1 },
        artSubject: `${SCYLLA} pulling a too-large oilskin hood over her pearl circlet, turning back its collar to find tiny stitched thread, ${CHAR} watching beside an open driftwood locker`,
      },
      {
        id: 'mend-latch',
        label: 'Let Char bend the fish-hook back into a latch',
        outcome:
          'Char works the hook between her fingers until it curls, then threads it back through its ring: closed, not locked, the way you close something for someone who might be back. Then she scratches FENN into the sanded wood with its point, deep. ‘There,’ she says. ‘Sand that.’',
        gain: { trust: 1, danger: 1 },
        artSubject: `${CHAR} scratching letters deep into a sanded pale locker door with the point of a bent fish-hook, ${SCYLLA} beside her holding up ${SULK} to give her light`,
      },
    ],
  },
  {
    id: 'CW-07',
    title: 'Kelp Full of Letters',
    kind: 'hazard',
    speaker: 'Scylla',
    opening:
      'The kelp filters still hang the length of the hall, combing the sea before the palace breathes it, but tonight the sea is full of paper: letters, petitions, testimony, caught in every frond like fish in a net. The crew’s rule on the first frame has been repainted: KEEP TO THE KELP. The catwalk is missing every third slat now. Halfway along, one frame has slumped across it, and the kelp leans toward the princesses, rustling, in their voices.',
    artSubject: `A long hall hung with towering curtains of living kelp on wooden frames, their fronds clogged with hundreds of sodden pale sheets of paper, a gap-toothed slatted catwalk between them, one frame collapsed across the catwalk with a small gap beneath, ${SCYLLA} and ${CHAR} pausing at its edge as the kelp leans toward them`,
    echoes: [
      {
        flag: 'GT-07:lift-frame',
        text: 'Last time they heaved this very frame back on its hooks together. It is down again, torn from the same hooks, as if the hall was told to undo it.',
      },
      {
        flag: 'GT-07:squeeze',
        text: 'The scrape down Scylla’s fin from the last time she squeezed under here begins to ache, a moment before the kelp touches it.',
      },
      {
        flag: 'GT-07:glow-path',
        text: 'The crew’s polished brass rings still run along the wall, but every other one has been unscrewed, and the empty holes chalked over neatly.',
      },
      {
        flag: 'entry:listened',
        text: 'The kelp speaks in Scylla’s voice from the shaft, a little out of order: ‘Not yet. I have not gone down. Not yet.’',
      },
    ],
    choices: [
      {
        id: 'squeeze',
        label: 'Squeeze through the gap under the fallen frame',
        outcome:
          'Kelp closes on her like a crowd. She comes out the far side with paper plastered to her scales and one sheet stuck flat to her palm: a witness statement, signed, the name cut out with scissors. Char wriggles through after her, peels it off and reads it before Scylla can stop her. ‘Someone saw us,’ she says. ‘And meant it.’',
        gain: { danger: 1, evidence: 1 },
        artSubject: `${SCYLLA} wriggling out from under a collapsed curtain of paper-clogged kelp, wet sheets plastered to her scales and one stuck flat to her palm, ${CHAR} already through and peeling it away to read`,
      },
      {
        id: 'lift-frame',
        label: 'Lift the fallen frame back onto its hooks, together',
        outcome:
          'It takes both of them and every rude word Char knows, and a few she invents. The frame goes up. The filter combs again, and the paper sheets out of it in a slow white flurry, back toward the Throat. ‘It’ll fall again,’ Scylla says. ‘Then we’ll have lifted it twice,’ says Char. ‘That’s twice more than them.’',
        gain: { trust: 1, danger: 1 },
        artSubject: `${SCYLLA} and ${CHAR} heaving a tall wooden frame of kelp back onto its hooks together, a flurry of loosened pale paper swirling away from the fronds around them`,
      },
      {
        id: 'glow-path',
        label: 'Turn Sulk up and find the rings that are left',
        outcome:
          'In Sulk’s glow the chalked-over holes show plain, and so do the rings still in the wall, and so do Char’s tiny skulls scratched beside each one: a fair way through. They go round hand over hand, a long reach at every gap. The kelp never quite touches them. Sulk dims afterwards, to sulk about it.',
        gain: { battery: -1, danger: -1 },
        requires: { battery: 1 },
        lockedHint: 'Needs glow',
        artSubject: `${SCYLLA} holding ${SULK} up bright against the wall of a kelp hall, revealing a broken line of polished brass rings with small scratched skulls beside them, ${CHAR} swinging along them hand over hand`,
      },
    ],
  },
  {
    id: 'CW-08',
    title: 'Three Wheels, One Order',
    kind: 'puzzle',
    speaker: 'Char',
    opening:
      'The round chamber, the pressure door, the three valve wheels with their shell bosses: whelk, limpet, cockle. The crew’s chalk is scrubbed off. In a clerk’s capitals: TURN THE LIMPET. THE DOOR OPENS FOR THE OBEDIENT. Lower down, scratched with a nail by someone in a hurry: COCKLE IS THE FILTERS. LIMPET IS THE THROAT. Char follows the limpet wheel’s pipe with her eyes; it climbs into the ceiling, toward the palace. ‘So,’ she says. ‘Who do we believe?’',
    artSubject: `A round underwater chamber with three bronze valve wheels in a row, each with a different seashell boss, a heavy round door beyond, neat chalk above the wheels and faint nail scratches below, one pipe rising from the middle wheel into the ceiling, ${CHAR} following it with her eyes while ${SCYLLA} studies the scratches`,
    echoes: [
      {
        flag: 'GT-08:whelk',
        text: 'Scylla’s hand remembers the whelk wheel, stiff then easy. Tonight a clerk’s tag is tied to its spoke: NOT THIS ONE.',
      },
      {
        flag: 'GT-08:limpet',
        text: 'Last time the limpet wheel soaked them both and Sulk went dark. Tonight the clerk wants it turned. Char finds that very interesting.',
      },
      {
        flag: 'GT-08:cockle',
        text: 'Last time Scylla turned the cockle, the filters stopped and a bell rang. The bell hangs here now, its clapper taken out.',
      },
    ],
    choices: [
      {
        id: 'whelk',
        label: 'Turn the whelk wheel, on the left',
        outcome:
          'Stiff, then easy; the court’s tag flutters off its spoke. The door swings in on the cupboard where the crew keep the works’ oldest log. Its first page has been cut out. The stub still holds the bottom of a young, careful signature, fifty years old, and every page after it is written over in red. Char looks at the nail-scratches. ‘We believe whoever was in a hurry.’',
        gain: { evidence: 2 },
        artSubject: `${SCYLLA} turning a bronze valve wheel with a whelk shell boss as a round door swings open onto a cupboard holding an old leather log, its first page cut away to a stub, ${CHAR} beside her with a grim nod`,
      },
      {
        id: 'limpet',
        label: 'Turn the limpet wheel, as the court says',
        outcome:
          'The pipe above them gulps. Far up in the palace the Throat swallows harder, and down the pipe, a little late, comes Scylla’s own voice: ‘as the court says.’ The door stays shut. Char looks at her for a long moment. ‘The obedient,’ she says. ‘That was you.’',
        gain: { danger: 1, trust: -1 },
        artSubject: `${SCYLLA} with her hands on the middle valve wheel as the pipe above it bulges with a swallow, ${CHAR} staring at her sister, a heavy round door still shut beyond them`,
      },
      {
        id: 'cockle',
        label: 'Turn the cockle wheel, on the right',
        outcome:
          'Two halls back the filters stop combing, and the paper they were holding comes loose and rolls down the tunnels toward them in a slow white tide. Scylla wrenches the wheel back. The sheets keep coming for a while, and Sulk, buried under them, goes dark in protest.',
        gain: { battery: -1 },
        artSubject: `${SCYLLA} wrenching a valve wheel with a cockle shell boss back the other way as a slow tide of loose pale paper pours into the chamber, ${CHAR} digging a darkened lantern globe out of the sheets`,
      },
    ],
  },
  {
    id: 'CW-09',
    title: 'The Plan, Hammered Flat',
    kind: 'lore',
    speaker: 'Scylla',
    opening:
      'The brass plan of the works is still riveted to the wall, but someone has been at it with a hammer. Every room once labelled STORES has been beaten smooth and stamped again: EMPTY. Scylla knows the word STORES. It is what the palace calls rooms where people live. Now it has a better word. At the far edge, the landward channel has been hammered out altogether, and yet the spot where so many fingertips touched the sluice still shines, over nothing.',
    artSubject: `A large brass plan of tunnels and pumps riveted to a stone wall, gone green at the edges, one corner dented and battered flat by hammer blows, one far edge pounded smooth with a single small bright polished spot left shining, ${SCYLLA} with her fingertip on the dents, ${CHAR} holding a lantern up beside her`,
    echoes: [
      {
        flag: 'GT-09:mark-stores',
        text: 'Last time Scylla circled the seven STORES and Char gave each circle a face. The hammer has flattened the circles. The faces were scratched deeper, and still show: seven small dents, looking out.',
      },
      {
        flag: 'GT-09:trace-landward',
        text: 'Last time she traced the landward channel to its shining sluice with one fingertip. Her finger goes to the same place now, over flat brass.',
      },
      {
        flag: 'e04:char-lost-in-present',
        text: 'Where the landward gate was engraved, the brass is beaten blank, and for one shameful moment Scylla is grateful not to see a gate. Then Char holds the lantern closer, alive and impatient, and she makes herself look.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'EMPTY, in neat stamped capitals. Scylla once chose a gate over a train full of strangers. She knows exactly how a word like that gets stamped.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'Somewhere in the future she left, a map said a district was empty, and she believed it and sent a sea in. She counts the stamped rooms now. Seven. She counts again.',
      },
    ],
    choices: [
      {
        id: 'trace-landward',
        label: 'Feel for the landward channel under the hammer marks',
        outcome:
          'Under the dents the engraving is still there, shallow as a scar: from the Heart at the bottom to a sluice marked with a wave and a foot. You can beat a line flat, it turns out, but you cannot make brass forget which way it was cut. Scylla copies the route into her sleeve-book from the scar.',
        gain: { evidence: 1 },
        artSubject: `Close on the fingertip of ${SCYLLA} following a faint scarred groove beneath hammer dents across a green-edged brass plan to one small spot that still shines`,
      },
      {
        id: 'mark-stores',
        label: 'Scratch a face on every room stamped EMPTY',
        outcome:
          'Seven rooms. Scylla scratches the circles; Char takes the pin and gives each one a face, and this time she gives them mouths, open. ‘So they look like people,’ she says, ‘who are saying something.’ The scratching is loud in the quiet. Somebody will have to hammer them out again.',
        gain: { trust: 1, danger: 1 },
        artSubject: `${CHAR} scratching tiny open-mouthed faces into the battered corner of a brass wall plan with a hairpin, ${SCYLLA} beside her holding the lantern, both bent close`,
      },
    ],
  },
  {
    id: 'CW-10',
    title: 'Refusals on the Last Hook',
    kind: 'choice',
    speaker: 'Char',
    opening:
      'In the side vault the retired valve wheels still hang like plates, but every tag has been rewritten: Reef Gate, NEVER OPENED. Kelpwater, NEVER OPENED. The Little Landward, NEVER OPENED. The last hook, empty before, sags under oilcloth tags on a string: LANDWARD SLUICE, REFUSED, forty-one of them. Then forty-two. Char counts them twice, and on the second count there are more. ‘There were forty-one,’ she says. ‘There were forty-one this morning.’',
    artSubject: `A low stone vault with old bronze valve wheels hung on the wall like plates, each with a small tag, the last hook at the end sagging under a thick bunch of identical oilcloth tags on a string, ${CHAR} counting them with one finger, ${SCYLLA} standing back watching the bunch grow`,
    echoes: [
      {
        flag: 'GT-10:ask-her',
        text: 'Last time Char said what she’d do with the landward wheel: open it, then shut up about it, and see who goes. She says it again now, before anyone asks, so that it is on record.',
      },
      {
        flag: 'GT-10:steer',
        text: 'Last time Scylla told her the jetty road was enough. Char looks at the string of tags, then at her. ‘Enough for who,’ she says, and it is not a question any more.',
      },
      {
        flag: 'GT-10:roll-call',
        text: 'Last time they read every tag here aloud. The court heard. Every tag on the wall carries a new last line: READ ALOUD. NOTED.',
      },
      {
        flag: 'e06:4,2:care',
        text: 'In the gallery Councilor Salter ruled an empty line for Char, for when she wanted it. Every refusal on the string ends with a ruled empty line too. Char sees it first.',
      },
      {
        flag: 'e06:4,2:risk',
        text: 'In the gallery Scylla testified for both of them. Every tag on the string is countersigned in her own hand: on behalf of C.',
      },
    ],
    choices: [
      {
        id: 'roll-call',
        label: 'Read the refusals aloud with her, every one',
        outcome:
          'Scylla reads the dates and Char reads the word, refused, refused, refused, and the string keeps growing under their voices until the hook bends. They read until they are hoarse and the count is a number neither of them believes. Char writes it on her wrist in chalk. ‘Somebody has to know the real number.’',
        gain: { evidence: 2, danger: 1 },
        artSubject: `${SCYLLA} and ${CHAR} side by side beneath a bending hook heavy with oilcloth tags, each holding one tag to the light, Char with a chalk number on her wrist`,
      },
      {
        id: 'ask-her',
        label: 'Ask her what she’d do, if she got to choose',
        outcome:
          '‘Choose.’ Char laughs, short and ugly. Then she thinks about it properly, which she rarely lets anyone watch. ‘I’d want to be asked. Once. By someone who’d take the answer.’ So Scylla asks. Char tells her. It is not what Scylla would have chosen, and she lets it stand.',
        gain: { trust: 2, danger: 1 },
        artSubject: `${CHAR} leaning against a stone wall beneath a sagging string of tags, arms folded, speaking, ${SCYLLA} facing her with open hands, listening, a lantern glowing between them`,
      },
      {
        id: 'steer',
        label: 'Tell her you know how this ends, and it isn’t here',
        outcome:
          'It comes out with an adult’s certainty, and the vault swallows it. Char unhooks one tag and holds it up. Under REFUSED, in the clerk’s hand: per the elder princess. ‘You see?’ she says. ‘They don’t even need you to mean it.’ They move on fast after that.',
        gain: { danger: -1, trust: -1 },
        artSubject: `${CHAR} holding a single oilcloth tag up toward ${SCYLLA} as she half raises one hand, the wall of retired valve wheels and a sagging string of tags behind them`,
      },
    ],
  },
  {
    id: 'CW-11',
    title: 'The Pipe That Taps Back',
    kind: 'lore',
    speaker: 'Scylla',
    opening:
      'The copper pipe still runs this tunnel at head height, rubbed bright by palms, but the key scratched below it has been chiselled over. Two-three, all clear, is gone. Two marks are left. A scrape: the Warden. Three-three-three: someone in the works who shouldn’t be. Scylla lays her ear to the copper. Three-three-three. Three-three-three. Three-three-three, without a pause, the way a thing repeats when nobody is tapping it.',
    artSubject: `A narrow brick tunnel with a single gleaming copper pipe at head height, a key of scratched tally marks in the rock beneath it partly gouged away by a chisel, ${SCYLLA} with her ear pressed to the pipe and her eyes shut tight, ${CHAR} beside her with one hand flat on the copper, ${SULK} glowing low between them`,
    autoChoiceId: 'listen',
    echoes: [
      {
        flag: 'GT-11:listen',
        text: 'Last time, at the end, someone tapped two-three for them gently, on purpose. Scylla waits for it now with her whole body.',
      },
      {
        flag: 'entry:listened',
        text: 'Under the taps, very faint, the pipe carries Scylla’s own voice from the shaft. The works know whose voice it is now, and they are practising it.',
      },
      {
        flag: 'entry:pulled',
        text: 'Between the threes comes a different tap: four, slow. Two letters, a ribbon, a crab. Somebody upstairs has counted what she took.',
      },
    ],
    choices: [
      {
        id: 'listen',
        label: 'Keep your ear to the pipe',
        outcome:
          'Three-three-three, on and on, until Scylla’s teeth ache with it. Then, under it, once: a scrape. Long, slow, deliberate, the Warden’s signal, from a long way down. And after it, so softly that Char has to press her ear flat to be sure, two-three. All clear. A tap the court chiselled off the wall, tapped anyway.',
        gain: { trust: 1 },
        artSubject: `${CHAR} with her ear pressed flat to a bright copper pipe and her eyes suddenly wide, ${SCYLLA} beside her with a hand over her mouth, a single long ripple travelling along the pipe in the lantern light`,
      },
    ],
  },
  {
    id: 'CW-12',
    title: 'The Galley, Planed Clean',
    kind: 'rest',
    speaker: 'Char',
    opening:
      'The crew galley is the same rock room, the same stove from an old pump housing, the same pot of kelp porridge banked for the next shift; it is always for the next shift. But the long table has been planed. Forty years of initials are gone to pale new wood, and only the rude drawing of a councilor is left, because an insult with no names under it hurts nobody. Char’s little skull beside it is gone. Sulk is down to an ember.',
    artSubject: `A rock galley with a squat stove built from an old pump housing, a pot on top, a long wooden table planed pale and smooth except for one small crude carving at its centre, curls of wood shavings swept into a corner, ${CHAR} on the bench running her fingers over the bare wood with ${SULK} glowing faintly beside her, ${SCYLLA} at the stove`,
    echoes: [
      {
        flag: 'GT-12:note',
        text: 'The note Scylla left under the porridge pot last time is still there. Someone has corrected it in red: for saying nothing is struck out, and above it, neatly, for reporting.',
      },
      {
        flag: 'GT-12:feed-eel',
        text: 'The shrimp crock where Char fed Sulk last time has a padlock on it now. Char picks it with a fish-bone without looking.',
      },
      {
        flag: 'e06:5,5:care',
        text: 'The first line of the farewell song is chalked on the stove, and under it, fresh, in a crew hand: SUNG OVER THEM AT THE BANDSTAND. HEARD IT DOWN THE PIPES.',
      },
      {
        flag: 'e06:5,5:risk',
        text: 'The farewell song is chalked on the stove, every verse ending and stay. Under it, in a crew hand: A PRINCESS STOPPED THE BAND. NOBODY KNOWS WHICH WORDS SHE STOPPED.',
      },
    ],
    choices: [
      {
        id: 'feed-eel',
        label: 'Feed Sulk from the shrimp crock by the stove',
        outcome:
          'Sulk eats with her whole body and comes back gold, then pink, then a bright fierce white. Char holds the globe close and talks to her in the voice from when they were small, and this time she doesn’t pretend she didn’t. ‘They can plane the table,’ she tells the eel. ‘They can’t plane you.’',
        gain: { battery: 2 },
        artSubject: `${CHAR} holding ${SULK} up close to her face as the eel glows a bright fierce white, murmuring to it, ${SCYLLA} watching from the stove, the planed pale table between them`,
      },
      {
        id: 'note',
        label: 'Leave the crew a note, signed this time',
        outcome:
          'Scylla writes: thank you for the porridge, and for saying nothing, nine times; we know what you said. Then she signs it, S., and pushes the pen across. Char writes her own name in full, every letter, large. They tuck it under the pot. It will be corrected by morning. It will have been read first.',
        gain: { trust: 1 },
        artSubject: `${SCYLLA} sliding a folded note beneath a pot on a stove while ${CHAR} signs its corner in large letters, the bare planed galley table behind them`,
      },
    ],
  },
  {
    id: 'CW-13',
    title: 'The Cistern, Awake',
    kind: 'hazard',
    speaker: 'Char',
    opening:
      'The great cistern is as black as before, the lantern reaching neither wall nor bottom, but it is not still. Paper turns in the dark water like a slow shoal: letters, ribbons, the swallowed things, sinking. Below, something large lies with its eyes open. The crew’s rope across the broken ledge has been cut and tied again so that it loops back to where they started, and the chalk skulls along the ledge have been redrawn to point straight down.',
    artSubject: `A vast black cistern inside a cavern, pale sheets of paper and ribbons drifting slowly through the water like a shoal, a narrow stone ledge around its rim with a rope looped back on itself across a gap, small chalk skulls on the wall pointing downward, ${SCYLLA} and ${CHAR} small on the ledge in faint lantern light, two great pale eyes open in the depths`,
    echoes: [
      {
        flag: 'GT-13:glow',
        text: 'Last time the great eel slept in Sulk’s light, its whiskers hung with shells, a spoon and a little bell. The offerings are gone. It is watching the lantern.',
      },
      {
        flag: 'GT-13:feel',
        text: 'Last time they crossed by touch, Char’s tail brushing hers to say still here. Tonight Scylla brushes first, and Char lets her.',
      },
      {
        flag: 'e04:char-lost-in-present',
        text: 'Char goes ahead along the ledge, and for three strokes the dark gives back nothing at all. Then her voice, sharp and impatient: ‘Don’t do the face. I’m here.’ Scylla stops doing the face.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'Water held back in the dark, and in it things that were meant to go somewhere and never arrived. Scylla thinks of lit windows under a sealed gate.',
      },
    ],
    choices: [
      {
        id: 'glow',
        label: 'Turn Sulk up bright and find the true rope',
        outcome:
          'Sulk flares, and the cistern shows itself: the looped rope, and beyond it, half hidden, the old ring where the crew first tied it, one small chalk skull beside it facing forward. Char’s. They re-tie the rope across the gap, true, and cross. Below, the great eel follows the light all the way over, and does not rise.',
        gain: { battery: -1, evidence: 1 },
        requires: { battery: 1 },
        lockedHint: 'Needs glow',
        artSubject: `${SCYLLA} holding ${SULK} up blazing over a black cistern full of drifting paper, its light showing an old iron ring with a small chalk skull beside it, ${CHAR} knotting a rope to the ring, a colossal pale eel far below with its eyes turned up`,
      },
      {
        id: 'feel',
        label: 'Go along the ledge by touch, Sulk turned down to nothing',
        outcome:
          'Wall on the right, hand over hand. At the loop the rope pulls them back toward the start, and the second time it happens Char stops dead. ‘No,’ she says, to the cistern, and swims the gap without the rope at all, and calls back until Scylla follows her voice across. Something below breathes out, a long way down.',
        gain: { danger: 1, trust: 1 },
        artSubject: `Near darkness over a cistern, the faint outline of ${CHAR} swimming across a gap in a ledge with no rope, calling back, ${SCYLLA} edging after her with her palm on the wall, a single dim ember of lantern light`,
      },
    ],
  },
  {
    id: 'CW-14',
    title: 'The Lock That Holds Its Breath',
    kind: 'puzzle',
    speaker: 'Scylla',
    opening:
      'The pressure lock still ticks beside its round door. The crew’s brass plate reads as before: IN FOR FOUR, OUT FOR THREE. THE BELL RINGS ON THE FIRST COUNT OF EVERY IN-BREATH. PUSH ON THE OUT-BREATH. But the works are choking now, and a crew hand has chalked beneath it: SINCE THE COURT, IN FOR FOUR, HOLD FOR ONE, THEN OUT FOR THREE. The bell rings. Char, who hates counting, counts aloud anyway: one.',
    artSubject: `A heavy round pressure door in a tunnel wall, a tall glass case beside it holding a swinging brass pendulum and a small bell, a brass plate below with a fresh line of chalk beneath it, ${SCYLLA} with both palms on the door, ${CHAR} beside her counting on her fingers with grim concentration`,
    echoes: [
      {
        flag: 'GT-14:six',
        text: 'Last time six was the count. Scylla’s hands still want it. Char, counting, has noticed the new hitch, and keeps a hand near her sister’s wrist.',
      },
      {
        flag: 'GT-14:three',
        text: 'Last time Scylla pushed on three and went tail over circlet into Char. Char remembers. She counts louder.',
      },
      {
        flag: 'GT-14:eight',
        text: 'Last time she pushed on the bell and the lock slammed shut on them. Tonight Scylla does not trust any number she has not counted twice.',
      },
    ],
    choices: [
      {
        id: 'five',
        label: 'Push on the count of five',
        outcome:
          'Five is the held breath. The door does not push back; it simply does not move, the way a held breath does not, and the pressure in Scylla’s ears climbs until Sulk dims and Char hauls her off it. ‘Hold for one,’ Char says. ‘Five is the hold. I said it out loud.’',
        gain: { battery: -1 },
        artSubject: `${SCYLLA} pressing with all her weight on a round door that does not move, her face strained, ${CHAR} pulling her back by the arm, a lantern globe dimming between them`,
      },
      {
        id: 'seven',
        label: 'Push on the count of seven',
        outcome:
          'Six, seven, and the door gives. Tucked in its hinge is the crew’s oilskin tally of every request to reopen the landward sluice: forty-one, all refused. Under it, in a second hand, the same forty-one again. Then a third column, begun tonight, already refused, with tomorrow’s dates. Char stops counting. ‘They’re refusing in advance,’ she says.',
        gain: { evidence: 2 },
        artSubject: `A round pressure door swinging open onto a lamplit tunnel, ${SCYLLA} unfolding a long oilskin slip ruled in three columns, ${CHAR} reading it over her shoulder with her counting hand frozen`,
      },
      {
        id: 'nine',
        label: 'Push on the count of nine',
        outcome:
          'Nine is the bell, a fresh in-breath, and the lock sucks the door shut so hard the glass case rattles and the pendulum skips a beat it will never get back. Scylla is thrown against Char. ‘In for four,’ says Char, from underneath her. ‘The bell starts it. Nine is one.’',
        gain: { danger: 1 },
        artSubject: `${SCYLLA} and ${CHAR} in a tangle against a tunnel wall in a burst of bubbles, a round pressure door slammed shut beside them, a small bell still shivering in its glass case`,
      },
    ],
  },
  {
    id: 'CW-15',
    title: 'Oren Counts Twice',
    kind: 'companion',
    speaker: 'Oren Pike',
    opening:
      'Where three tunnels meet, under the crew lamp, Oren Pike sits as he always does: hood on, axe across his knees, ledger open on a valve housing, counting the works’ breaths against a sand-glass. The pages before tonight have been filled in a second hand while he slept. ‘Four thousand breaths a night,’ he says. ‘The court’s copy says three thousand, and nothing missing. I count again. I like to know what a building does when it is told what it did.’',
    artSubject: `A junction of three brick tunnels under a single warm crew lamp, ${OREN} seated on an upturned crate with a ledger open on a valve housing, its earlier pages filled in a second, neater handwriting, a small sand-glass beside it, ${SCYLLA} and ${CHAR} arriving from one tunnel with a lantern`,
    echoes: [
      {
        flag: 'GT-15:give-hour',
        text: 'Last time Scylla gave him the hour of a landward tide nobody had measured. It is in his ledger still, in his hand. Beside it, in the court’s: no such tide.',
      },
      {
        flag: 'GT-15:let-char-ask',
        text: 'Char asked him every question last time, and he answered each twice. He looks to her first now, and waits.',
      },
      {
        flag: 'GT-15:ask-him-along',
        text: 'The measured cord Oren gave Char last time is still knotted at her belt. He notes it, and his hood dips, once.',
      },
      {
        flag: 'e06:4,4:care',
        text: 'Scylla’s signature is under his manifest of the stranded, the rescued and the missing, in her largest hand. The second hand has tried to write over it twice, and given up.',
      },
      {
        flag: 'e06:4,4:risk',
        text: 'The missing column Scylla surrendered at the evening bell is gone from his manifest. In the margin of his ledger Oren has begun it again from memory, one name at a time.',
      },
    ],
    choices: [
      {
        id: 'let-char-ask',
        label: 'Let Char ask him what the court has changed',
        outcome:
          'Char asks: which pages, which numbers, whose names. Oren answers each twice, once from the court’s copy and once from memory, and they never match. ‘Which do you believe?’ Char says. ‘Mine,’ says Oren. ‘I was there.’ Char nods slowly, as if that settles something for her too.',
        gain: { trust: 2, danger: 1 },
        artSubject: `${CHAR} leaning over a ledger with her finger on a page of neat foreign handwriting, ${OREN} answering patiently with his own pen held up, ${SCYLLA} a little apart with her hands folded, listening`,
      },
      {
        id: 'give-hour',
        label: 'Give him the hour of the landward tide you remember',
        outcome:
          'He writes it to the minute, then holds the pen up and watches the ink dry. It stays. ‘Good,’ he says. ‘The court cannot correct a tide it doesn’t know about. Yet.’ Char watched Scylla’s face as she gave it. She doesn’t ask. The junction is a little colder.',
        gain: { evidence: 2, trust: -1 },
        artSubject: `${OREN} with his pen held over a fresh line in a ledger, the eyeholes of his hood turned toward ${SCYLLA} while ${CHAR} beside him also watches her sister, a crew lamp above them`,
      },
      {
        id: 'count-with-him',
        label: 'Sit and count the breaths aloud with him',
        outcome:
          'One, two, three: Oren’s voice, Scylla’s, Char’s, out of step and then in it. The pipes count back in their voices, a beat late. Oren keeps the true tally regardless. ‘Two more witnesses,’ he says, ‘is two more pages they must correct. I will be here. If you are late I will come and disapprove.’',
        gain: { evidence: 1, danger: -1 },
        artSubject: `${OREN} sitting close beside ${SCYLLA} and ${CHAR} at a tunnel junction under a crew lamp, all three counting on their fingers, a sand-glass running on the valve housing between them`,
      },
    ],
  },
  {
    id: 'CW-16',
    title: 'The Gate That Falls Early',
    kind: 'hazard',
    speaker: 'Char',
    opening:
      'The bronze portcullis still hangs half raised across the tunnel on its counterweight chain, the winch on the far side. The crew’s chalk is still there: ONE AT A TIME, AND THE ONE BEHIND HOLDS THE CHAIN. Under it, in tidy capitals: AND THE ONE BEHIND STAYS BEHIND. The gate drops a hand’s breadth on its own, and lifts, and drops again, a beat earlier each time. Char loops the chain round her wrist. ‘Go on. I’m faster.’ She is.',
    artSubject: `A green bronze portcullis hanging half raised across a brick tunnel on a heavy chain, two lines of chalk on the wall beside it in different hands, ${CHAR} with the chain looped around her wrist and her tail braced against the wall, ${SCYLLA} poised at the gap beneath the spikes`,
    echoes: [
      {
        flag: 'GT-16:let-her-hold',
        text: 'Last time Char held the chain and came through like a thrown knife, laughing. She isn’t laughing now. She is reading the new line.',
      },
      {
        flag: 'GT-16:take-chain',
        text: 'Last time the gate kept one of Scylla’s scales. It is still caught on the third spike, aquamarine, on display.',
      },
      {
        flag: 'e06:2,1:care',
        text: 'On the Pearl Stair Scylla asked Char how she wanted to break the loop, and followed her down. Char glances at her now, to see if she will ask again.',
      },
      {
        flag: 'e06:2,1:risk',
        text: 'On the Pearl Stair Scylla won the race for her. Char’s knuckles, still split from the rail, whiten on the chain. ‘Don’t,’ she says. ‘Don’t win this one for me too.’',
      },
      {
        flag: 'e04:char-lost-in-present',
        text: 'The last time Scylla watched a sister take the heavy end of something, the sea came down. Her hands go cold on the bars. The sister holding this chain is alive, and glaring at her for flinching.',
      },
    ],
    choices: [
      {
        id: 'let-her-hold',
        label: 'Go under first, and trust Char to beat the gate',
        outcome:
          'Scylla goes under. The chain groans; the gate drops early, as the wall said it would. Char lets go a beat earlier still, because she was counting, and comes through with the spikes combing her hair. On the far side she wipes the clerk’s line off the wall with her palm. ‘Stays behind,’ she says. ‘I don’t think so.’',
        gain: { trust: 2, danger: 1 },
        artSubject: `${CHAR} shooting under a falling bronze portcullis in a burst of bubbles, its spikes just brushing her hair, ${SCYLLA} on the far side reaching out to her with a pale face`,
      },
      {
        id: 'take-chain',
        label: 'Take the chain from her and make her go first',
        outcome:
          'Char goes under with a look that could etch glass. Scylla holds, lets go, dives; the gate drops early and catches the end of her fin, and keeps a scale for its spikes. She is through. Char says nothing for the length of a tunnel. Then: ‘It wanted one of us behind. You nearly gave it you.’',
        gain: { danger: -1, trust: -1 },
        artSubject: `${SCYLLA} diving under a falling bronze portcullis as it clips the tip of her fin, a single aquamarine scale left caught on a spike, ${CHAR} on the far side with arms folded and a cold glare`,
      },
    ],
  },
  {
    id: 'CW-17',
    title: 'The Wall Where Two Hands Were',
    kind: 'lore',
    speaker: 'Scylla',
    opening:
      'The tunnel wall is thin here, and through it Scylla feels the Heart below, drawing the sea in and pushing it out, with a catch in every breath now, like someone trying not to cough. The crew’s handprints in the mortar have been smoothed away, hundreds of them, their shells prised out and swept into a heap. Only one print is left, the newest: a girl’s hand, pressed very deep, as if two hands had been pushed into the same place.',
    artSubject: `A curving brick tunnel wall whose mortar has been smoothed flat and blank, a heap of small prised-out shells on the floor beneath, a single deep handprint left in the mortar, the bricks faintly swelling, ${SCYLLA} with her palm hovering over the print, ${CHAR} behind her flexing her own hand`,
    autoChoiceId: 'press',
    echoes: [
      {
        flag: 'GT-17:breathe',
        text: 'Last time Scylla fitted her hand into one of two prints here, and it was hers exactly, because it was Char’s, pressed twice: once for a sister not yet come down. Now there is one, and the court has decided whose.',
      },
      {
        flag: 'e06:6,6:care',
        text: 'At the Tomorrow Dials Scylla named every line as hers, even the worst. The wall’s breath catches on each of them here, one by one. She lets it.',
      },
      {
        flag: 'e06:6,6:risk',
        text: 'At the Tomorrow Dials Wenna planed away the line Scylla couldn’t bear. The smoothed mortar here has the same finish, exactly. Scylla knows the tool.',
      },
      {
        flag: 'CW-16:let-her-hold',
        text: 'Char’s hair is still combed straight from the portcullis spikes. She looks at the single print as if it were one more gate.',
      },
    ],
    choices: [
      {
        id: 'press',
        label: 'Lay your hand on the wall and feel it catch',
        outcome:
          'In, and the brick swells, and catches; out, and it sighs. Scylla fits her hand to the one print. Before she can decide what that means, Char reaches past her and pushes her own palm into the soft mortar beside it, hard, and holds it there until it sets. Two again. ‘Mine,’ she says. ‘Write that down.’',
        gain: { trust: 1 },
        artSubject: `Close on the hand of ${CHAR} pressing hard into soft blank mortar beside a single deep handprint where the hand of ${SCYLLA} already rests, the brick wall faintly swelling around them`,
      },
    ],
  },
  {
    id: 'CW-18',
    title: 'The Hatch, Barred From Above',
    kind: 'shortcut',
    speaker: 'Char',
    opening:
      'Past the wall the Heart’s outflow runs thin and lukewarm, the steam barely rising, the crew’s socks gone and their line cut. The round hatch to the pump-gallery stair is still in the ceiling, but its wheel won’t turn: through the gap at its rim Scylla can see an iron bar across it on the far side, stamped with a crown. The court’s side. Char hangs off the wheel by both hands. ‘Two of us and one bar,’ she says. ‘Your hands and mine, or neither.’',
    artSubject: `A dim tunnel lined with thin barely steaming pipes, a cut cord trailing from one wall, a round iron hatch with a wheel lock in the ceiling, the edge of an iron bar visible through a gap at its rim, ${CHAR} hanging two-handed from the wheel, ${SCYLLA} looking up beside her with ${SULK} in one hand`,
    echoes: [
      {
        flag: 'GT-18:open-hatch',
        text: 'Last time Scylla opened this hatch. Someone has been down it since, and barred it behind them on the way back up.',
      },
      {
        flag: 'GT-18:leave-shut',
        text: 'Last time they left this hatch shut. The court has made certain of it, from above, with iron.',
      },
      {
        flag: 'CW-05:break-seal',
        text: 'At the top of that stair is Char’s door, its wax seal cracked across the crown by her thumb. The court will have seen.',
      },
      {
        flag: 'CW-05:leave-sealed',
        text: 'At the top of that stair is Char’s door, still sealed. Char hasn’t mentioned it since, which is how Scylla knows it is still in her.',
      },
      {
        flag: 'entry:pulled',
        text: 'The court’s proof is against Scylla’s ribs: letters, a ribbon, a crab. A way up is a way to carry them. It is also a way down for whoever comes looking.',
      },
    ],
    choices: [
      {
        id: 'open-hatch',
        label: 'Force the hatch together, your hands and hers',
        outcome:
          'They hang on the wheel together and heave, and heave, until the bar on the far side bends in its brackets and drops with a clang that runs all the way up the stair. The hatch swings open on the pump-gallery spiral. The works are smaller now, and open both ways: quicker home, and quicker for the court, which has certainly heard.',
        gain: { danger: 1, trust: 1 },
        artSubject: `${SCYLLA} and ${CHAR} hanging together from a wheel lock as a round ceiling hatch bursts open onto a spiral stone stair, a bent iron bar tumbling down past them in a swirl of bubbles`,
      },
      {
        id: 'leave-shut',
        label: 'Leave the hatch barred',
        outcome:
          'Scylla lets go first. Char hangs on a moment longer, alone, then drops. ‘Long way, then,’ she says. ‘The way nobody up there knows.’ They follow the thin pipes on. Behind them the bar stays across the hatch, and the court, which thinks it has closed something, is left to think so.',
        gain: { danger: -1 },
        artSubject: `${SCYLLA} and ${CHAR} swimming on down a dim tunnel of thin pipes beneath a closed ceiling hatch, a cut cord trailing in the current above them`,
      },
    ],
  },
]
