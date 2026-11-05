import type { ChokingRoomContent } from './types'

/**
 * The Choking Works, rows 4–6 (CW-19..CW-36): the Breathing Works’ deep
 * galleries warped under the Undertide Crown. The court feeds the tunnels
 * what it wants forgotten; Maud Weir (CW-32) is keeper of one breath, her
 * Landward Book writing itself in red. Char is with Scylla throughout and
 * decides for herself; Oren stays at his tally post (CW-15).
 */
const SCYLLA =
  'a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze'
const CHAR =
  'her identical twin with dark violet scales, black lace and a sardonic grin'
const MAUD =
  'a very old, broad merwoman sluice-keeper with a cropped white mane, barnacle-scarred forearms, a leather tool apron and a heavy ring of bronze keys at her hip'
const SULK = 'a glass globe lantern with a small glimmer eel coiled inside'

export const CHOKING_ROOMS_B: readonly ChokingRoomContent[] = [
  {
    id: 'CW-19',
    title: 'The Queens Turned Round',
    kind: 'lore',
    speaker: 'Scylla',
    opening:
      'The side-tunnel of queens has been put right. Every portrait now faces the room, and every one wears the same face, the one from the coins, in a different frame. The kettle and the box of washers are gone. Only the small frame is still turned to the wall, and someone has nailed it there: the girl in the pearl circlet, the worried one. Char reaches for the nail before Scylla can tell her not to.',
    artSubject: `A dim drowned-green stone side-tunnel lined with dozens of gilt-framed portraits all turned outward, every one showing the same stern crowned face; one small frame nailed face to the wall with a single silver nail; ${CHAR} grips the nail while ${SCYLLA} holds up ${SULK} and glances at the watching faces`,
    autoChoiceId: 'look',
    echoes: [
      {
        flag: 'GT-19:look',
        text: 'A grey sock still hangs from the corner of the small frame, stiff as slate. It is the only thing in the tunnel nobody has corrected.',
      },
      {
        flag: 'e06:4,2:care',
        text: 'Upstairs Councilor Salter ruled an empty line for Char to fill herself. The court has been busy since: down here every queen has been given the same mouth, closed.',
      },
      {
        flag: 'e06:4,2:risk',
        text: 'Upstairs Scylla testified for both of them, and one painted queen fell silent, satisfied. That queen is down here forty times over, smiling the same smile.',
      },
    ],
    choices: [
      {
        id: 'look',
        label: 'Turn the small frame round and look at the girl',
        outcome:
          'The nail comes out easily, as if it wanted to. The girl is still their mother at their age, but her worried look has been painted over with the official smile, and the paint is tacky. Where Char scratches with a thumbnail, one worried eye looks back. Char leaves it like that: half a smile, one true eye. ‘Let them fix that,’ she says.',
        gain: { evidence: 1 },
        artSubject: `A small gilt portrait of a young crowned mermaid girl whose painted smile has been scratched away over one worried eye, ${CHAR} lowering her thumbnail with grim satisfaction and ${SCYLLA} staring at the uncovered eye`,
      },
    ],
  },
  {
    id: 'CW-20',
    title: 'Skulls Pointing Up',
    kind: 'hazard',
    speaker: 'Char',
    opening:
      'The Gauge Shaft still drops through its pipe, rungs down one side, a gauge at every landing, but every needle points at the same number and the push comes when it likes. Char’s chalk skulls are on the rungs again, more than she ever drew, and every one has turned to grin up the pipe, the wrong way. Char looks at them a long time. ‘Those aren’t mine. Mine don’t grin. Mine are where I held on.’ She takes out her own chalk.',
    artSubject: `Looking down a narrow vertical bronze pipe underwater, a ladder of rungs marked with dozens of small chalk skulls all grinning upward, every pressure gauge needle stuck at the same mark; ${CHAR} three rungs down with a stub of chalk in her fist glaring at the skulls; ${SCYLLA} braced at the top`,
    echoes: [
      {
        flag: 'GT-20:skulls',
        text: 'Last time Scylla climbed skull to skull and arrived with her ears intact. The shaft remembers which rungs she trusted. Those are the ones whose skulls have turned.',
      },
      {
        flag: 'GT-20:race',
        text: 'The gauge they cracked racing is still cracked, and its needle has stopped at the moment they hit the bottom laughing.',
      },
      {
        flag: 'e06:2,1:care',
        text: 'Upstairs Char broke the looping stair by swimming down it the wrong way. She looks at this shaft the same way, and the shaft seems to know it.',
      },
      {
        flag: 'e06:2,1:risk',
        text: 'Upstairs Scylla won the looping stair for her, and Char hasn’t forgiven it. ‘My chalk,’ she says. ‘My shaft. Don’t win anything.’',
      },
      {
        flag: 'entry:listened',
        text: 'As they start down, the pipe says ‘Race you’ in Scylla’s voice, from somewhere below. Scylla has not said it. Char looks at her sharply.',
      },
    ],
    choices: [
      {
        id: 'fresh-chalk',
        label:
          'Climb behind Char as she chalks new skulls, and hold only the wet ones',
        outcome:
          'Char goes first, drawing as she climbs, and Scylla holds only the skulls still damp. Twice the push comes, and twice the wet rungs hold. Looking up from the bottom, Scylla watches the new skulls dry and slowly turn their grins to the ceiling. ‘Let them,’ Char says. ‘They were right while we needed them.’',
        gain: { danger: -1, trust: 1 },
        artSubject: `${CHAR} chalking a fresh small skull on a bronze rung as she climbs down a narrow pipe, ${SCYLLA} gripping the rung above it where the chalk still glistens wet, older skulls around them grinning upward`,
      },
      {
        id: 'old-skulls',
        label: 'Trust the skulls already there; they’re in Char’s shape',
        outcome:
          'They are in her shape and not her sense: the rungs they mark are the ones that give. The push catches Scylla on a loose one and slams her against the pipe, and the gauge beside her cracks. Char hauls her down by the wrist. ‘I said they weren’t mine,’ she says. ‘Listen to me, not to my handwriting.’',
        gain: { danger: 1, trust: -1 },
        artSubject: `${SCYLLA} slammed against the wall of a narrow bronze pipe as a loose rung marked with an upward-grinning chalk skull swings free, a gauge cracking beside her, ${CHAR} below hauling her down by the wrist`,
      },
      {
        id: 'race',
        label: 'Race her down, the way you did before',
        outcome:
          'They race, and the pipe races with them: two laughing voices a landing ahead, theirs, from before, arriving first. Char stops dead to let the echo win. ‘Go on, then,’ she tells it. The push passes over two princesses holding very still, and they climb the rest of the way slowly, on purpose, saying nothing the pipe can keep.',
        gain: { trust: 1, evidence: 1, danger: 1 },
        artSubject: `${SCYLLA} and ${CHAR} clinging motionless to the rungs of a narrow bronze pipe while two faint pale shapes of laughing mermaid girls race on down below them`,
      },
    ],
  },
  {
    id: 'CW-21',
    title: 'Bells in Still Water',
    kind: 'secret',
    speaker: 'Scylla',
    opening:
      'The Slack Pool is the one thing in the works that hasn’t been made to repeat itself. It lies flat as ever, a dented pail on its rim. The crew rule is still chalked on the wall, and under it, in a clerk’s neat hand, a second rule: WITNESSES WILL NOT LOOK AHEAD. This time Char doesn’t turn her back. She folds her arms at the rim. ‘You first,’ she says. ‘Then me. And I’ll tell you what I see, or I won’t.’',
    artSubject: `A dim round stone chamber underwater with an ancient sunken cistern whose surface is mirror-still, a dented pail on its rim, chalk on the wall above with a neat clerk’s line written under it; ${SCYLLA} kneels at the edge; ${CHAR} stands beside her with folded arms, holding ${SULK}`,
    echoes: [
      {
        flag: 'GT-21:watch',
        text: 'Last time the pool showed her a rain-grey city and a gate coming down, a future only she could recognise. She knows its tricks. She does not know this one.',
      },
      {
        flag: 'GT-21:leave',
        text: 'Last time she left the pool alone and took Char’s hand instead. Char remembers, and has decided she will not be steered away from a window twice.',
      },
      {
        flag: 'e04:char-lost-in-present',
        text: 'Somewhere in this pool is a sister who died at a sea gate years from now. The one at the rim is alive, here, in the past, and nobody’s reflection.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'Faint lit squares sit under the surface again, like train windows. Tonight they are not waiting. They are listening.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'The overflow still runs to a drain chalked STORES. Someone has added beneath it, neatly: EMPTY.',
      },
    ],
    choices: [
      {
        id: 'watch',
        label: 'Look into the still water',
        outcome:
          'For one breath the pool shows the landward gate hung with hundreds of bronze bells, every one tolling, though nobody stands before them to testify. The court’s history is being rung before anyone has given it. One small bell is cast with Char’s face, and it tolls in Scylla’s voice. Then ripples. Char looks in after her, a long time, and keeps what she saw.',
        gain: { evidence: 2 },
        artSubject: `${SCYLLA} bending over a still cistern whose surface shows a great sea gate hung with hundreds of swinging bronze bells and no one standing before it, one small bell cast with a girl’s face; ${CHAR} leaning in beside her`,
      },
      {
        id: 'leave',
        label: 'Step back, and leave it to Char whether to look',
        outcome:
          'Scylla steps back from the rim. Char kneels and looks for a long time, not moving. When she stands her face is very calm, which on Char is worse than shouting. ‘It’s mine,’ she says, ‘what I saw.’ Scylla, who has spent two lives deciding things for her, lets it be hers.',
        gain: { trust: 1 },
        artSubject: `${CHAR} kneeling alone at the rim of a mirror-still cistern, her face calm and set, ${SCYLLA} standing back by the wall with her hands folded, ${SULK} on the floor between them`,
      },
    ],
  },
  {
    id: 'CW-22',
    title: 'Ottery’s Riddle, Corrected',
    kind: 'puzzle',
    speaker: 'Char',
    opening:
      'The three drains are where they were, but the crew’s chalk has been washed off and rewritten overnight in a clerk’s round hand. LEFT: ‘The right drain lies.’ MIDDLE: ‘The Heart is through the left.’ RIGHT: ‘The Heart is not through the middle.’ Ottery’s otter has been scraped away; under the scrape, still legible, the old rule: ‘Only the drain to the Heart tells the truth.’ ‘They changed the lines,’ Char says, ‘and forgot the rule.’',
    artSubject: `A junction of three round brick drain mouths in a drowned-green tunnel, a neat clerk’s chalk line above each and a scraped grey smear where a chalk otter used to be, faint old letters showing through it; ${CHAR} points at the smear while ${SCYLLA} studies the drains by ${SULK}`,
    echoes: [
      {
        flag: 'GT-22:middle',
        text: 'Last time the middle drain was the true one, and Ottery was proud. The court seems to know it. Char heads for the middle out of habit, and stops herself.',
      },
      {
        flag: 'GT-22:left',
        text: 'Last time the left drain hid every spoon the palace ever lost. Something else is heaped behind its grating tonight, pale and flat, and Char won’t say what it looks like from here.',
      },
      {
        flag: 'GT-22:right',
        text: 'Last time the right drain opened on the dark cistern and something very large. Scylla would prefer not to be right about drains tonight.',
      },
    ],
    choices: [
      {
        id: 'right',
        label: 'Take the right drain',
        outcome:
          'If the Heart were left, the left would be honest, the right a liar, and the Heart in the middle after all. If it were the middle, the middle would be honest and point left. Only the right holds: honest itself, both others lying. Inside, the brick runs warm, and scratched small on the wall is an otter giving a thumbs-up that the clerk didn’t find.',
        gain: { evidence: 1, trust: 1 },
        artSubject: `${SCYLLA} and ${CHAR} swimming into a warm brick drain where a tiny freshly scratched otter gives a thumbs-up low on the wall`,
      },
      {
        id: 'middle',
        label: 'Take the middle drain, the way it worked last time',
        outcome:
          'The court has learned the last answer. The middle drain runs a long way round and comes out at the same three drains, under the same three lines, the chalk still wet as if just written. Char rubs the middle line out with her fist. It is back before they have turned round.',
        gain: { danger: 1 },
        artSubject: `${CHAR} scrubbing a chalk line off the brick with her fist at a junction of three drains, the same neat line already reappearing beside her hand, ${SCYLLA} looking back the way they came`,
      },
      {
        id: 'left',
        label: 'Take the left drain',
        outcome:
          'It ends at a grating heaped not with spoons but with letters, pressed flat by the draw, every one addressed and none delivered. Char pulls one out. It is in her own handwriting, a note she hasn’t written yet. She puts it back very carefully, and they leave without a word.',
        gain: { danger: 1, trust: -1 },
        artSubject: `${CHAR} holding a single pressed-flat letter in front of a drain grating heaped with hundreds of others, her face gone very still, ${SCYLLA} behind her with ${SULK}`,
      },
    ],
  },
  {
    id: 'CW-23',
    title: 'The Boot Comes Back',
    kind: 'hazard',
    speaker: 'Scylla',
    opening:
      'The silt trap is darker than it was, and the silt is not all sand: pressed into it lie ribbons, seals and flakes of letter, swallowed upstairs and settled here. The guide rope still sags along the wall. Halfway along it, standing upright as if someone were in it, is Fenn’s boot. The name burnt into its heel has been scraped off, and a court tag tied through the laces reads: LOST. NOT TO BE SOUGHT.',
    artSubject: `A long low pitch-dark underwater gallery floored with pale silt flecked with ribbons, wax seals and scraps of paper, a guide rope sagging along one wall, a single old crew boot standing upright on the silt with a paper tag tied to its laces; ${SCYLLA} and ${CHAR} hover above the floor in the faint glow of ${SULK}`,
    echoes: [
      {
        flag: 'GT-23:glow',
        text: 'Scylla carried this boot out of here once already, under her arm. The silt has given it back, in the same place, as if she never lifted it.',
      },
      {
        flag: 'GT-23:dark',
        text: 'Last time they crossed blind and came out grey as two ghosts. The fog remembers the shape of them, and rises before either has moved.',
      },
      {
        flag: 'e06:4,4:care',
        text: 'Oren still has Fenn under missing, counted twice, with two names signed beneath. The court’s tag says otherwise, and has no signature at all.',
      },
      {
        flag: 'e06:4,4:risk',
        text: 'Scylla gave the court Oren’s missing column. This, it seems, is where the missing are filed.',
      },
      {
        flag: 'CW-13:glow',
        text: 'The rope across the cistern ledge was cut and retied to loop back on itself. Somebody down here has one trick, and likes it.',
      },
    ],
    choices: [
      {
        id: 'glow',
        label: 'Turn Sulk up, follow the rope, and take the boot',
        outcome:
          'In Sulk’s glow the rope shows plain, and so does what was done to it: retied, halfway, into a loop that would have walked them round in the fog till morning. A fresh chalk skull of Char’s marks the true line. Scylla takes the boot and cuts the tag off its laces. Sulk dims to sulk about it, as if nothing down here has changed.',
        gain: { battery: -1, danger: -1, evidence: 1 },
        requires: { battery: 1 },
        lockedHint: 'Needs glow',
        artSubject: `${SCYLLA} lifting an old crew boot out of letter-flecked silt beside a guide rope knotted back on itself into a loop, ${SULK} glowing in ${CHAR}’s raised hand`,
      },
      {
        id: 'dark',
        label:
          'Cross in the dark, a hand on Char’s shoulder, and let her choose the way out',
        outcome:
          'In the dark the silt rises and the gallery fills with voices, theirs, from last time, coughing and laughing. Scylla holds Char’s shoulder and does not steer. Twice Char stops to listen past the echoes, then goes the way nobody is talking. They come out grey as ghosts. Behind them the boot stays standing, waiting for whoever it waits for.',
        gain: { danger: 1, trust: 1 },
        artSubject: `Two young mermaids, one pale aquamarine with a pearl circlet, one dark violet in black lace, dusted grey with silt, emerging from a thick cloud of sediment, the violet one leading, a lone boot standing upright in the murk behind them`,
      },
    ],
  },
  {
    id: 'CW-24',
    title: 'The Sluice by Order',
    kind: 'shortcut',
    speaker: 'Scylla',
    opening:
      'The great sluice gate still rises and falls in its slot, but it no longer breathes: it gulps, slams, and lifts again a little later than it should. Beyond it the straight culvert runs down to the deep works, and down it, on every gulp, go letters, ribbons and drift on their way to be swallowed. The whalebone wedge hangs on its hook. Over its old tag, FOR WHEN IT STICKS, a new one has been tied: NOT TO BE USED. BY ORDER.',
    artSubject: `A towering bronze sluice gate slamming down in a stone slot underwater, beyond it a long straight culvert where pressed letters and ribbons stream away into the dark; a carved whalebone wedge on a hook with two paper tags tied to it; ${SCYLLA} and ${CHAR} watch the gap`,
    echoes: [
      {
        flag: 'GT-24:wedge',
        text: 'She wedged this gate once. The wedge has been prised out since and hung back on its hook, and the gouge it left in the gate’s lip is still there, like a scar nobody has explained.',
      },
      {
        flag: 'GT-24:close',
        text: 'Last time she let it fall and barred it, the crew’s way. The bar has been taken away by order, and a padlock put through the slot where it went.',
      },
      {
        flag: 'CW-18:open-hatch',
        text: 'Above them the hatch they forced stands open, its bent bar at the foot of the stair. The court has certainly heard. Here it has left them a second door, to see what they do.',
      },
      {
        flag: 'CW-18:leave-shut',
        text: 'Above, Scylla let go of the barred hatch first. Here the court has left her a second thing to let go of.',
      },
    ],
    choices: [
      {
        id: 'wedge',
        label: 'Wedge the sluice open: a straight run to the deep works',
        outcome:
          'Scylla and Char drive the wedge in together, on a slam. The gate stops half open, groaning, and the culvert runs straight and fast downhill. Everything the court sent down rushes past them, and somewhere the works takes a breath it was not given. Far below, a long scrape travels along a copper pipe: someone has felt it, and is glad.',
        gain: { danger: 1, evidence: 1 },
        artSubject: `${SCYLLA} and ${CHAR} driving a whalebone wedge under the lip of a great bronze sluice gate with their tails braced, a torn paper tag floating free, letters and ribbons rushing past them down a long culvert`,
      },
      {
        id: 'close',
        label:
          'Let it slam and bar it, so the court’s drift goes the long way too',
        outcome:
          'She lets the gate slam and wedges a length of pipe through the brackets where the bar used to go. The drift piles up against the bronze, letters pressed flat to the gate like faces at a window. ‘It’ll go the long way now,’ Char says. ‘Same as us. Good. Let it be slow.’ They go round.',
        gain: { danger: -1, trust: 1 },
        artSubject: `${SCYLLA} jamming a length of old pipe through the brackets of a closed sluice gate, pressed letters piling against the bronze, ${CHAR} watching them with grim approval`,
      },
    ],
  },
  {
    id: 'CW-25',
    title: 'Jars Addressed to Nobody',
    kind: 'lore',
    speaker: 'Scylla',
    opening:
      'The jar rack is fuller than four years can account for. The court files here now: every letter the Throat swallows comes down sealed in a jar, its lid scratched in one neat hand: TO NOBODY. The crew’s old jars are still on the bottom shelves. Fenn’s have been moved up to a shelf of their own and re-addressed FROM FENN, as if he wrote home after all. Char’s little jar is still on the high shelf. Its lid now reads: To us, never.',
    artSubject: `Tall wooden racks at the mouth of a dark tunnel underwater, crammed with hundreds of small sealed glass jars, every lid scratched with the same neat words, one high shelf set apart; ${SCYLLA} lifts a jar to the light of ${SULK}; ${CHAR} glares up at a single small jar on the topmost shelf`,
    echoes: [
      {
        flag: 'GT-25:read-lids',
        text: 'Last time Char put her jar up high, out of Scylla’s reach. It is still up there. Somebody has reached it.',
      },
      {
        flag: 'GT-25:add-jar',
        text: 'Two jars with no address went on this rack last time, one in each princess’s hand. Both are still here. Both lids say TO NOBODY.',
      },
      {
        flag: 'entry:pulled',
        text: 'In Scylla’s satchel are the two letters she pulled off the Throat’s grate. They would have ended here, in a jar, re-addressed.',
      },
      {
        flag: 'CW-06:take-letters',
        text: 'The bundle from Fenn’s locker is in Scylla’s satchel already, and heavier than paper should be. The jars marked FROM FENN begin the same way: I am well and I do not wish to come home.',
      },
      {
        flag: 'CW-06:mend-latch',
        text: 'Char scratched FENN into his sanded locker door. She looks at the lids marked FROM FENN as if she would like to scratch something into them too.',
      },
      {
        flag: 'e05:7,7:care',
        text: 'Tansy’s oilcloth letter is still in Scylla’s satchel, undelivered. An empty jar on the Dunlin shelf is exactly its size, and already labelled.',
      },
    ],
    choices: [
      {
        id: 'read-lids',
        label: 'Open one of the jars marked FROM FENN',
        outcome:
          'The letter inside is in the court’s hand and signed Fenn: he is well, he is happy on land, he asks that nobody look for him or open anything on his account. Scylla has seen letters to Fenn from home, Tibby’s drawings crowding the margins. This one has no margins at all. She keeps it. It is the most careful lie she has ever held.',
        gain: { evidence: 1 },
        artSubject: `${SCYLLA} reading a neatly written letter unrolled from a glass jar, its page perfectly blank at the edges, ${CHAR} reading over her shoulder with narrowed eyes, racks of jars behind them`,
      },
      {
        id: 'add-jar',
        label: 'Write a jar of your own and set it on the rack',
        outcome:
          'Scylla writes and seals it, and before she can scratch an address the lid already has one: TO NOBODY, in a hand that isn’t hers. Char takes the jar, scores through the words with her chalk-knife and scratches TO TIBBY D., FROM A PRINCESS WHO READ IT, and sets it at eye height. ‘They can rewrite it,’ she says. ‘Tibby reads faster.’',
        gain: { trust: 1, danger: 1 },
        artSubject: `${CHAR} scratching new words onto the lid of a small sealed glass jar with a little knife, ${SCYLLA} beside her holding the pen she wrote with, a rack of identical jars behind them`,
      },
      {
        id: 'char-jar',
        label: 'Let Char take her own jar down',
        outcome:
          'Char climbs, takes down her jar and scrapes the court’s word off the lid with a fingernail until only her own remain: To us, later. C. She doesn’t put it back on the rack. She ties it to her lace. ‘Nobody files me,’ she says, and the rack, for once, has nothing to say about it.',
        gain: { trust: 2, danger: 1 },
        artSubject: `${CHAR} tying a small glass jar to her black lace with a scrap of cord, a gap on the highest shelf of a jar rack behind her, ${SCYLLA} watching from below`,
      },
    ],
  },
  {
    id: 'CW-26',
    title: 'The Refusals Breed',
    kind: 'choice',
    speaker: 'Scylla',
    opening:
      'The crown-painted box by the pump-house door can’t hold its answers any more. Refusals spill out of it, down the wall and across the floor, one word each, in one clerk’s hand. Forty-one became four hundred overnight, and there are more each time Scylla looks. Tibby’s slip is pinned on top, rewritten in the court’s hand: ‘Thank you for keeping the sluice shut. I don’t want my brother back. Tibby D.’ The real round letters press through from the back.',
    artSubject: `A battered wooden box with a faded painted crown beside a pump-house door underwater, a flood of identical folded oilcloth slips pouring out of it down the wall and across the floor, one slip pinned on top; ${SCYLLA} kneels in the drift of slips; ${CHAR} holds up ${SULK} to read the pinned one`,
    echoes: [
      {
        flag: 'GT-26:carry',
        text: 'Scylla carried every slip in this box up to Councilor Salter once, wrapped in oilcloth. The box is full again. It filled itself, and kept going.',
      },
      {
        flag: 'GT-26:answer',
        text: 'Last time she wrote under Tibby’s slip: I have read this. Her words are still there, corrected in a clerk’s hand: I have read this. I agree.',
      },
      {
        flag: 'GT-26:leave',
        text: 'Last time she left the box to the people who wrote in it. Nobody writes in it now. It writes itself.',
      },
      {
        flag: 'e04:char-lost-in-present',
        text: 'Char’s old slip from when she was nine is still at the bottom, uncorrected. The court has never thought her worth rewriting. Char finds that insulting.',
      },
    ],
    choices: [
      {
        id: 'carry',
        label: 'Take Tibby’s true slip and the first refusal, as proof',
        outcome:
          'Scylla works the pin out and turns the slip over. On the back, where the court didn’t look, Tibby’s round letters still say please. She wraps it with the first refusal, the only one with a date. ‘You’re choosing which one is real,’ Char says. ‘No. Tibby did.’ Char considers that, and carries the slip herself. Behind them the pile grows a little, like breathing.',
        gain: { trust: 1, evidence: 1, danger: 1 },
        artSubject: `${SCYLLA} holding an oilcloth slip turned over to show a child’s round letters on its back, ${CHAR} tucking it carefully into her lace, a heap of identical slips swelling behind them`,
      },
      {
        id: 'answer',
        label: 'Write your answer on Tibby’s slip again, and sign it',
        outcome:
          'She writes in her best court hand: ‘I have read this. Tibby wrote please. S.’ As she watches, her ink thins and the court’s words rise up through it. Char takes the pen and draws a skull beside the S, hard enough to tear the oilcloth. That stays. Whatever the court is, it doesn’t know what to do with a skull.',
        gain: { trust: 1 },
        artSubject: `${CHAR} pressing a squid-ink pen hard into an oilcloth slip to draw a small skull, ${SCYLLA} beside her watching her own handwriting fade on the same slip`,
      },
      {
        id: 'leave',
        label: 'Leave the box; you can’t out-count it',
        outcome:
          'She steps back. ‘Good,’ says Char, then: ‘No. Not good. Just true.’ The refusals go on arriving, one word at a time, with nobody to carry them down now. Behind the wall a pump breathes in, and a fresh slip slides out of the box and lands at their tails. Neither of them picks it up.',
        gain: { danger: -1 },
        artSubject: `${SCYLLA} and ${CHAR} backing away from an overflowing crown-painted box as one more folded slip drifts out of it toward them`,
      },
    ],
  },
  {
    id: 'CW-27',
    title: 'Warm, Warmer, Ink',
    kind: 'puzzle',
    speaker: 'Char',
    opening:
      'Three outflows split past the pump house: two warm, one cold. The crew’s chalk has been washed off and replaced in a clerk’s hand: FOLLOW THE COLD WATER. THE HEART IS RESTING. Every skull Char chalked at the split has redrawn itself to point down the left. Char tastes the left and spits: ink and burnt sea-onion. The walls tremble with something enormous trying to breathe. ‘Right,’ Char says. ‘Everything here’s pointing somewhere. Which of them is lying?’',
    artSubject: `Three round outflow pipes branching from an underwater tunnel, a faint shimmer rising from two of them, a neat clerk’s chalk sign at the fork and a row of small chalk skulls all pointing at the left pipe; ${CHAR} spits and wipes her mouth by the left outflow while ${SCYLLA} holds up ${SULK} to the sign`,
    echoes: [
      {
        flag: 'GT-27:salt',
        text: 'Last time the true water tasted of salt and nothing else. Scylla’s tongue remembers it, which is the one sense down here nobody has rewritten.',
      },
      {
        flag: 'GT-27:onion',
        text: 'Last time they followed burnt onion to the palace sinks and came back crying. The left outflow smells exactly the same.',
      },
      {
        flag: 'GT-27:cold',
        text: 'Last time the cold water led them to a sump nobody had lit in a hundred years. The new sign would like them to go back.',
      },
    ],
    choices: [
      {
        id: 'middle',
        label: 'Follow the warm water nothing is pointing at',
        outcome:
          'The Heart isn’t resting: the walls say so. The skulls redraw themselves wrong, and the left tastes of the kitchens. That leaves the one warm water no sign mentions. It tastes of salt and nothing else, like the inside of a bell, and the trembling grows. Char grins. ‘Nobody points at the right way,’ she says. ‘Write that down where they can’t reach it.’',
        gain: { evidence: 1, trust: 1 },
        artSubject: `${SCYLLA} and ${CHAR} swimming down a warm shimmering outflow toward a faint deep glow, the tunnel walls visibly trembling`,
      },
      {
        id: 'left',
        label: 'Follow the skulls down the left',
        outcome:
          'It runs, unerringly, to the underside of the palace sinks, where letters are being fed down the drains among the onion peel. Above, a cook is saying the same sentence about the soup, over and over. They back away with stinging eyes, and Char rubs out one of the turned skulls with real violence.',
        gain: { danger: 1 },
        artSubject: `${SCYLLA} and ${CHAR} with streaming eyes beneath a tangle of sink pipes where folded letters drift down among bits of burnt onion, Char scrubbing a chalk skull off the wall`,
      },
      {
        id: 'cold',
        label: 'Follow the cold water, as the sign says',
        outcome:
          'Down and down, until Sulk’s glow shrinks and the walls go still. At the bottom is a sump where the court has left a second sign, in the same hand: GOOD. Char reads it, says a word no princess should know, and they swim back up a long way.',
        gain: { danger: 1, trust: -1 },
        artSubject: `${SCYLLA} and ${CHAR} in a deep black sump before a small neat sign reading GOOD, ${SULK} nearly dark between them`,
      },
    ],
  },
  {
    id: 'CW-28',
    title: 'The Rota Rewritten',
    kind: 'rest',
    speaker: 'Scylla',
    opening:
      'The night-shift bunks are still strung with old net, the shell stove still ticking, but the rota on the wall has been rewritten overnight in a clerk’s hand, every night the same: ALL HANDS ACCOUNTED FOR. Beside tonight, again and again down the slate: GONE TO SEE ABOUT A NOISE. REQUEST 42 is still pinned underneath, but its signatures are being scraped away one by one. Char tests a hammock, and doesn’t lie down.',
    artSubject: `A snug underwater rock pocket strung with hammocks of old fishing net, a small shell stove, a slate rota on the wall covered in identical lines of neat chalk, an oilcloth slip pinned under it with half its signatures scraped off; ${CHAR} sits upright in a hammock; ${SCYLLA} stands beside it holding ${SULK}`,
    echoes: [
      {
        flag: 'GT-28:sleep',
        text: 'Last time they slept nose to nose in these hammocks. The same two are still slung side by side, and still rocking, though nobody is in them.',
      },
      {
        flag: 'GT-28:search',
        text: 'Last time REQUEST 42 had every crew name on it, waiting for someone to take it up. Fewer now. The court has found a way to make the crew unsign.',
      },
      {
        flag: 'CW-12:feed-eel',
        text: 'Sulk, still sleek from the galley, turns her nose up at the crock on the shelf, then, being Sulk, eats from it anyway.',
      },
      {
        flag: 'CW-12:note',
        text: 'The note the sisters left under the porridge pot has found its way here, pinned to the rota and corrected in red. Char’s name, written in full, every letter, has not been touched.',
      },
    ],
    choices: [
      {
        id: 'sleep',
        label: 'Sleep, and let Char keep the watch',
        outcome:
          'Scylla means to keep watch. Char says no: it’s her crew, so it’s her watch. Scylla sleeps, and the hammocks rock to voices from earlier today saying the same things in a different order. When she wakes Char is sitting up exactly as before, a pinch of shrimp gone into Sulk’s globe and Sulk shining fit to read by. ‘Nothing came,’ Char says. ‘I didn’t let it.’',
        gain: { battery: 2, danger: -1 },
        artSubject: `${SCYLLA} asleep in a net hammock while ${CHAR} sits bolt upright in the next one keeping watch, ${SULK} glowing warmly between them, faint pale shapes of words drifting along the dark wall`,
      },
      {
        id: 'search',
        label: 'Let Char rest, and look closely at REQUEST 42',
        outcome:
          'The names on REQUEST 42 are going. But behind each scraped name the crew have pressed a thumb into the slate, a small greasy oval the clerk didn’t think to count. Eleven thumbprints. Scylla counts them twice, like Oren. Char swings out of her hammock and adds a twelfth, her own, with a chalk skull beside it.',
        gain: { evidence: 1 },
        artSubject: `${SCYLLA} tracing a row of small thumbprints pressed into a slate behind an oilcloth slip with scraped-off signatures, ${CHAR} pressing her own thumb beside them`,
      },
    ],
  },
  {
    id: 'CW-29',
    title: 'Ottery Says It Twice',
    kind: 'companion',
    speaker: 'Ottery',
    opening:
      'Ottery comes round the bend with the oilcan and the careful back, looks at Char, then at Scylla, and says, ‘Two of you. The log said one.’ Then says it again, word for word, in exactly the same voice. Ottery’s jaw works. ‘Sorry,’ Ottery says, differently. ‘It makes you say things again. You push through or you don’t.’ Under the words Ottery is humming, low and helplessly, a tune that ends and stay, and stay. ‘Ask, then. Quick, while it’s me.’',
    artSubject: `A stooped, weathered mer-worker of the night crew with an oilcan, a lamp on a hook and a patched work apron, pausing in a bend of a drowned-green tunnel with jaw clenched as if fighting a word; ${CHAR} leans in close; ${SCYLLA} beside her, very still`,
    echoes: [
      {
        flag: 'GT-29:ask-warden',
        text: 'Last time Ottery told them the Warden took every request up herself, forty-one times. Ottery starts to tell it again, and catches the words halfway.',
      },
      {
        flag: 'GT-29:let-char',
        text: 'Last time Char and Ottery talked like two old crew. Ottery looks at her now as if checking she is the same girl. She is, and says so.',
      },
      {
        flag: 'GT-29:keep-quiet',
        text: 'Last time Scylla asked Ottery to keep a secret from the Warden. ‘Wouldn’t work now,’ Ottery says. ‘Nothing’s kept down here. Only filed.’',
      },
      {
        flag: 'e06:5,5:care',
        text: 'Upstairs Char sang the old words over this tune. She hums them now, under Ottery’s, until Ottery’s falters.',
      },
      {
        flag: 'e06:5,5:risk',
        text: 'Upstairs Scylla stopped this song with a hand on the drum. Down here there is no drum to stop, and Ottery keeps humming.',
      },
      {
        flag: 'CW-22:right',
        text: 'Ottery has seen the little otter scratched inside the right drain, and for a moment looks entirely unrepeated. ‘Found it. Good.’',
      },
    ],
    choices: [
      {
        id: 'ask-warden',
        label: 'Ask Ottery what the court has done to the Warden',
        outcome:
          '‘Made her keeper of one breath,’ Ottery says. ‘The Landward Book writes itself now, in red, only what upstairs says happened. She sits by it. Doesn’t knit any more.’ Ottery oils a hinge that doesn’t need it. ‘But the scrape still comes along the pipe, nights. That’s her, not the Book. A book can’t scrape.’',
        gain: { evidence: 1, trust: 1 },
        artSubject: `The stooped mer-worker oiling a valve hinge while talking low over one shoulder, a bright copper pipe running past, ${SCYLLA} listening closely, ${CHAR} perched on a pipe`,
      },
      {
        id: 'let-char',
        label: 'Say nothing, and let Char do the talking',
        outcome:
          'Char talks to Ottery the way you talk someone off a ledge: the cistern eel, Dace’s cake debt, whose back is better. Each time Ottery starts to say something a second time, Char cuts in with a question nobody has asked before. By the end Ottery laughs, really laughs, once. ‘You,’ Ottery says. ‘The log had better write you down.’',
        gain: { trust: 2 },
        artSubject: `${CHAR} talking fast and earnestly to a stooped old mer-worker who has just broken into a laugh, the two sharing a pipe for a bench, ${SCYLLA} a little apart, watching`,
      },
      {
        id: 'keep-quiet',
        label: 'Ask Ottery not to tell the Warden you’re here',
        outcome:
          '‘Nobody tells her,’ Ottery says. ‘The Book tells her. It’s already written you in.’ The oilcan creaks away round the bend. Along the copper pipe comes a single soft tap, then, much later, a scrape that sounds like someone dragging her own name back across a floor.',
        gain: { danger: -1, trust: -1 },
        artSubject: `A stooped mer-worker disappearing round a tunnel bend with an oilcan and lamp, ${SCYLLA} with her ear to a bright copper pipe, ${CHAR} beside her listening too`,
      },
    ],
  },
  {
    id: 'CW-30',
    title: 'Everything Here Is Counted',
    kind: 'treasure',
    speaker: 'Scylla',
    opening:
      'The hatchery at the dead end is still warm, but the rosy clouds over the trays have thinned to grey, and each tray carries a court label with a number. The crew’s sign has been rewritten: TAKE NOTHING. EVERYTHING HERE IS COUNTED. The little bowl is still by the door. It has filled with pearls, dozens of them, all identical, all the size of the ones in Scylla’s circlet. Sulk presses to the glass anyway. A glimmer eel is not interested in orders.',
    artSubject: `A small underwater chamber of shallow stone trays, each with a thin grey cloud of tiny brine shrimp and a numbered paper label, a rewritten sign by the door and a little bowl brimming with identical pearls; ${SCYLLA} and ${CHAR} peer in while ${SULK} presses close to the glass`,
    echoes: [
      {
        flag: 'GT-30:pouch',
        text: 'Last time Scylla filled a pouch here and left nothing. Char glances at the bowl, then at her, the same way as then, still keeping count.',
      },
      {
        flag: 'GT-30:pearl',
        text: 'Last time Scylla left one pearl in this bowl, and Char a jet bead. The bead is gone. The pearl has been copied, and copied, and copied.',
      },
      {
        flag: 'e06:3,3:care',
        text: 'Among the pearls lies one silver tack, pulled, with a log number scratched on it small in Tamsin Rook’s hand.',
      },
      {
        flag: 'e06:3,3:risk',
        text: 'Behind the trays is a shelf of empty shells, tacked shut and labelled, exactly as Scylla did upstairs. The count matches.',
      },
    ],
    choices: [
      {
        id: 'pouch',
        label: 'Fill a pouch anyway, and let them count it',
        outcome:
          'Sulk eats and blazes. As Scylla ties the pouch, the label on the nearest tray changes its number by exactly one scoop, neatly, by itself. Char watches it happen. ‘They counted you,’ she says, and Scylla can’t tell whether she means the shrimp.',
        gain: { battery: 2, trust: -1 },
        artSubject: `${SULK} blazing gold as shrimp drift into it, ${SCYLLA} tying a full pouch at her waist, a numbered paper label on a tray beside her quietly changing, ${CHAR} watching it`,
      },
      {
        id: 'pearl',
        label:
          'Put a real pearl from your circlet among the copies, and take a smaller scoop',
        outcome:
          'She prises one free and drops it in the bowl. Among the copies it is the only one that is warm. Char adds a jet bead from her lace, the only black thing there. Sulk sulks at the size of her supper. The labels on the trays don’t change at all, as if the court cannot count a gift.',
        gain: { battery: 1, trust: 1, danger: 1 },
        artSubject: `${SCYLLA} dropping a single pearl into a bowl of identical pearls, ${CHAR} adding one black bead beside it, grey shrimp trays with numbered labels behind them`,
      },
    ],
  },
  {
    id: 'CW-31',
    title: 'The Scrape Under the Door',
    kind: 'lore',
    speaker: 'Scylla',
    opening:
      'The last culvert slopes under the deep works, and here the Heart’s breath has turned to a slow, labouring gulp that pulls at their hair. Ahead, the lamp still burns in the window cut in the rock. The crew’s board on the door, WARDEN, has been painted over in court white: KEEPER. Then along the copper pipe beside the door comes one long scrape, the old sign, and Char goes very upright. ‘That’s her,’ she says. ‘That isn’t the Book. That’s her.’',
    artSubject: `A broad sloping underwater culvert leading to a small door cut into living rock, one lamplit window above it and a board on the door freshly painted over in white, a bright copper pipe running alongside, the water dragging slowly inward; ${SCYLLA} and ${CHAR} approach side by side`,
    autoChoiceId: 'knock',
    echoes: [
      {
        flag: 'GT-31:knock',
        text: 'Last time the voice behind this door said, ‘That’s what knock means,’ and Char laughed. She doesn’t laugh now. She is listening for it.',
      },
      {
        flag: 'CW-24:wedge',
        text: 'The draught from the wedged sluice has followed them down, and the gulp is a little easier for it, like a throat with a finger’s width cleared.',
      },
      {
        flag: 'CW-24:close',
        text: 'They came the long way round, and the drift came with them, slow, pressing at their backs like a crowd that can’t see where it’s going.',
      },
    ],
    choices: [
      {
        id: 'knock',
        label: 'Knock',
        outcome:
          'There is no other way on. Char tucks her hair behind her ears; Scylla straightens her circlet. From inside a voice says, ‘It’s open. It’s always open,’ and then a moment later, in exactly the same voice, ‘It’s open. It’s always open.’ Then, lower, tired, entirely its own: ‘Come in before it says it a third time.’',
        gain: { trust: 1 },
        artSubject: `${SCYLLA} raising a hand to knock on a small rock-cut door with a white-painted board while ${CHAR} beside her presses one ear to the copper pipe`,
      },
    ],
  },
  {
    id: 'CW-32',
    title: 'The Keeper of One Breath',
    kind: 'guardian',
    speaker: 'Maud Weir',
    opening:
      'The lock-keeper’s room is as it was, but the landward wheel on the wall is chained to its hook, and Maud Weir no longer knits. She sits with the Landward Book open on her knees while a red pen moves across it by itself. ‘The princess came down to be returned,’ she reads, in a voice not quite hers. Then her jaw sets, a scrape sounds on her pipe, and her own voice cuts through: ‘Fifty years. Don’t let it say you. Quick: which something?’',
    artSubject: `A lamplit lock-keeper’s room carved into underwater rock, a great bronze valve wheel chained to the wall, a knitting basket untouched on the table; ${MAUD} sits with a thick ledger open on her knees as a red pen writes across it on its own; ${SCYLLA} and ${CHAR} stand in the doorway`,
    echoes: [
      {
        flag: 'GT-32:truth',
        text: 'Last time Scylla told Maud she was leaving and did not say we. The Book has entered that in red: one princess, as if the other were never in the room.',
      },
      {
        flag: 'GT-32:show-evidence',
        text: 'Last time Scylla counted points out for her like Oren, and Maud put down her knitting. The knitting is still in the basket, the needle in the same stitch.',
      },
      {
        flag: 'GT-32:char-speaks',
        text: 'Last time Char spoke first, and Maud said good one. The Book has that page. It is the only page with no red on it.',
      },
      {
        flag: 'CW-21:watch',
        text: 'Maud’s eyes go to Scylla’s and stay. ‘You looked in the Slack Pool,’ she says. ‘Then you’ve heard the bells. They ring for this Book.’',
      },
      {
        flag: 'CW-21:leave',
        text: '‘Your sister looked in the pool,’ Maud says to Scylla, not to Char, ‘and you didn’t ask what she saw. Good. Don’t.’',
      },
      {
        flag: 'entry:pulled',
        text: 'The letters and the ribbon Scylla pulled from the grate are in her satchel, and the red pen keeps leaning toward them across the page, like a hand.',
      },
      {
        flag: 'entry:listened',
        text: '‘You listened at the Throat,’ Maud says. ‘The tunnels have your voice now. It’s been talking in my pipes all night. Most of it wasn’t yours.’',
      },
    ],
    choices: [
      {
        id: 'truth',
        label: 'Tell her the truth, aloud, before the Book can',
        outcome:
          '‘I’m leaving,’ Scylla says, ‘by the landward way, if it’ll have me.’ The red pen writes: The princess stayed. Maud reads it, looks at Scylla, and says aloud, slowly, ‘That is not what she said.’ The pen stops. She lifts the chain off the wheel with both scarred hands. ‘Said aloud is harder to hang,’ she says, ‘and harder to write over.’',
        gain: { trust: 1, danger: 1 },
        passesGuardian: true,
        artSubject: `${SCYLLA} standing very straight before ${MAUD} as she lifts a heavy chain off a bronze wheel on the wall while a red pen lies stopped on an open ledger, ${CHAR} beside her sister`,
      },
      {
        id: 'show-evidence',
        label: 'Lay out what you’ve gathered on the Book itself',
        outcome:
          'Scylla sets it out on the open page, where the pen must go round it: Fenn’s boot with its name scraped off, the court’s tag, refusals that breed, names unsigned, bells that toll before anyone testifies. The red pen cannot write over a boot. Maud lays her hand flat beside it. ‘Nobody upstairs ever counted us,’ she says. ‘They only counted what to leave out.’',
        gain: { evidence: 1, trust: 1 },
        requires: { evidence: 4 },
        lockedHint: 'Needs more evidence (4)',
        passesGuardian: true,
        artSubject: `An old crew boot, a paper tag and folded oilcloth slips laid across the open pages of a thick ledger, a red pen stalled at their edge, ${MAUD} laying a scarred hand flat beside them, ${SCYLLA} and ${CHAR} across the table`,
      },
      {
        id: 'char-speaks',
        label: 'Let Char answer for herself',
        outcome:
          'Char swims forward. ‘I’m leaving. I decide when, and how, and whether. Not my sister. Not your book.’ The red pen lifts to write her down, stops with its nib trembling over the page, and leaves the line empty. It cannot write over her. Maud looks at the blank a long while. ‘Fifty years,’ she says, ‘and that’s the first thing it couldn’t take.’',
        gain: { trust: 2, danger: -1 },
        requires: { trust: 3 },
        lockedHint: 'Only if Char trusts you enough to speak first (trust 3)',
        passesGuardian: true,
        artSubject: `${CHAR} swimming forward with her chin up to face ${MAUD} across a lamplit table, a red pen frozen trembling above an empty line in an open ledger, ${SCYLLA} a half-stroke behind her`,
      },
    ],
  },
  {
    id: 'CW-33',
    title: 'The Unpaired Socks',
    kind: 'treasure',
    speaker: 'Maud Weir',
    opening:
      'The key room behind the kitchen is lined with tagged keys still, though every tag has been retied in a clerk’s hand. A crate of brine shrimp sits by the door. The only chart of the tunnels lies on its shelf with the landward channel scraped off the paper. The basket of grey socks is fuller than ever, and not one is paired. ‘They make me count them every night, as stock,’ Maud says. ‘Take one thing. The Book’s writing it down, so I won’t.’',
    artSubject: `A small rock-cut room lined with pegs of bronze keys on neat new paper tags, a crate of brine shrimp, a chart on a shelf with one channel scraped away and a wicker basket overflowing with odd grey knitted socks; ${MAUD} in the doorway; ${SCYLLA} and ${CHAR} look round`,
    echoes: [
      {
        flag: 'GT-33:shrimp',
        text: 'Last time Maud wrote ‘shrimp, one scoop, Highness’ and underlined it. The page is still pinned by the crate. The red has crossed out Highness.',
      },
      {
        flag: 'GT-33:chart',
        text: 'Scylla carried this chart out once. It is back on its shelf as if it never left, with the landward channel scraped off.',
      },
      {
        flag: 'GT-33:socks',
        text: 'Last time Maud gave them two pairs, ‘for the road, if there is one.’ Four odd socks lie on top of the basket, unpaired, tagged RETURNED.',
      },
      {
        flag: 'CW-32:truth',
        text: 'Maud keeps saying under her breath, ‘That is not what she said,’ as if she were practising.',
      },
      {
        flag: 'CW-32:show-evidence',
        text: 'Fenn’s boot sits on the kitchen table where Maud put it, and she keeps glancing at it like a crew hand back from a long shift.',
      },
      {
        flag: 'CW-32:char-speaks',
        text: 'Maud talks only to Char now, and each time Char speaks she looks back at the empty line in the Book. It stays empty.',
      },
    ],
    choices: [
      {
        id: 'shrimp',
        label: 'Take a scoop of brine shrimp for Sulk',
        outcome:
          'Sulk eats like a duke at a wedding and glows like one, the only uncounted brightness in the room. In the next room the red pen writes ‘shrimp, one scoop’ without anyone asking it to. Maud takes a pencil stub and adds underneath, in her own hand: Highness. Underlined.',
        gain: { battery: 2 },
        artSubject: `${SULK} blazing bright as shrimp drift into it from ${SCYLLA}’s fingers, ${MAUD} writing in pencil on a pinned slip beside a crate`,
      },
      {
        id: 'chart',
        label: 'Ask for the chart, and for the channel they scraped off it',
        outcome:
          'Maud takes a pencil stub and, without looking, draws the landward channel back where it was, every bend, from fifty years of memory. ‘Only one ever drawn,’ she says. ‘Now only one ever redrawn.’ She hands it over. The whole works fits in Scylla’s satchel again, and so does the trouble, worse.',
        gain: { evidence: 2, trust: -1 },
        artSubject: `${MAUD} drawing a long pencil line across a scraped patch of an old tunnel chart without looking down, ${SCYLLA} waiting with open hands, keys glinting on their pegs behind them`,
      },
      {
        id: 'socks',
        label: 'Look for two socks that match, and ask for them',
        outcome:
          'There are none. Maud has knitted each one a little different, on purpose, so the count will never agree with itself. ‘Stock can’t be odd,’ she says. ‘People can.’ She gives them two odd socks each. Char puts on one grey and one greyer and declares them the most royal thing she owns.',
        gain: { trust: 1, danger: -1 },
        requires: { trust: 2 },
        lockedHint: 'Only if Maud trusts you (trust 2)',
        artSubject: `${CHAR} holding up two mismatched grey knitted socks with delight, ${SCYLLA} holding two more, a wicker basket of odd socks between them and ${MAUD} in the doorway`,
      },
    ],
  },
  {
    id: 'CW-34',
    title: 'The Book Gone Red',
    kind: 'secret',
    speaker: 'Scylla',
    opening:
      'The Landward Book lies open on the shelf above the socks, and the red is spreading. SHUT BY ORDER, written under Fenn, has crept backward up the page into the years before: through the cook, through the two brothers, line by line, a slow red tide. Each name it reaches becomes the same three words. Decades back, their mother’s line is still dark ink: ‘A princess, alone, a pack for one. Sat at the landward sluice till the tide turned.’ The red is two lines above it.',
    artSubject: `A worn ledger open on a rock shelf by lantern light, its columns of names being overrun line by line by spreading red ink, one older line near the bottom still dark with a small inked crown beside it; ${SCYLLA} rests one finger just below the red; ${CHAR} leans in beside her`,
    echoes: [
      {
        flag: 'GT-34:show-char',
        text: 'Last time Char read their mother’s line and didn’t say whether it was a warning or an instruction. The court has decided. In the margin, in red: instruction.',
      },
      {
        flag: 'GT-34:read-alone',
        text: 'Scylla read this whole book once by herself. She is the only one who knows how many names the red has eaten. She counts to thirty and stops.',
      },
      {
        flag: 'GT-34:close',
        text: 'Last time she closed this book and left its names to Maud. Maud wasn’t allowed to keep them. The court kept them for her.',
      },
      {
        flag: 'GT-35:open-road',
        text: 'On the last clean line under Fenn, in Maud’s pencil: ‘The road opened, by a princess.’ Through it, in red: NEVER HAPPENED.',
      },
      {
        flag: 'GT-35:keep-secret',
        text: 'Two names sit just under Fenn’s in Maud’s pencil, ‘by their hour’. The court found them anyway. They are the next two lines the red will reach.',
      },
      {
        flag: 'GT-35:give-key',
        text: 'Beside the last line, in Maud’s pencil: ‘Master key, held by Char. Undecided.’ The red has written over it: RETURNED. Char touches her lace where a key once hung.',
      },
      {
        flag: 'e06:6,6:care',
        text: 'Upstairs Scylla named every line on Wenna’s chart as hers, and none came off. This book is the other way round: lines coming off one by one, and nobody asked.',
      },
      {
        flag: 'e06:6,6:risk',
        text: 'Upstairs Scylla let Wenna plane away the line she couldn’t bear. This is what the planing looks like from the other side: red, slow and tidy.',
      },
    ],
    choices: [
      {
        id: 'show-char',
        label: 'Turn the Book so Char can read it before the red does',
        outcome:
          'Char reads it twice, fast, then takes Maud’s pencil and writes under their mother’s line, in her own spiky hand: ‘Another princess. Read this. Decided for herself.’ The red reaches their mother’s line, and stops at Char’s, and can’t get past. ‘That’s mine,’ Char says. ‘Let it try.’',
        gain: { trust: 1, evidence: 1 },
        artSubject: `${CHAR} writing fiercely in pencil beneath an old line in a worn ledger as spreading red ink halts just above her words, ${SCYLLA} holding the book steady for her`,
      },
      {
        id: 'read-alone',
        label: 'Read every name yourself, ahead of the red',
        outcome:
          'She reads fast: every name and year, the ones who came back to visit, the socks sent down unworn with letters in the toes. The red follows a line behind her, eating what she has just read. She has fifty years in her head that nobody else has now. Char waits, then stops waiting. Scylla knows more than her sister does, again, and this time hers is the only copy.',
        gain: { evidence: 2, trust: -1 },
        artSubject: `${SCYLLA} racing a finger down the columns of a thick ledger while red ink spreads close behind it, ${CHAR} in the background turned away toward a wall of keys`,
      },
      {
        id: 'close',
        label: 'Close it on the red, so it can’t read any further',
        outcome:
          'Scylla shuts the Book on the red pen. Inside, something scratches, then stops. ‘It only writes while it’s open,’ Maud says from the doorway, ‘and I’ve not been allowed to close it in four years.’ She ties the cover shut with grey wool, and thanks them, as if it is something nobody says down here, because nobody does.',
        gain: { danger: -1, trust: 1 },
        artSubject: `${SCYLLA} pressing a worn ledger shut with both hands while ${MAUD} ties grey knitting wool round its cover, ${CHAR} beside them`,
      },
    ],
  },
  {
    id: 'CW-35',
    title: 'The Choking Heart',
    kind: 'climax',
    speaker: 'Maud Weir',
    opening:
      'The Heart fills its cavern still, one great bronze pump ribbed like a whale, but it no longer breathes the sea. It swallows. Letters, ribbons, testimony, a doll in black lace: everything the court fed the Throat comes down the sluices into its chest, and it has held that breath four years. The seventh sluice, landward, is chained by order. Maud puts the master key in Scylla’s hand and the red Book under Char’s arm. ‘Forty-one times my crew asked. Tonight you two answer.’',
    artSubject: `A vast underwater cavern dominated by an enormous ribbed bronze pump, swollen and straining, letters, ribbons and a small doll in black lace drifting into its intakes, seven great sluice tunnels branching from it, the seventh chained shut; ${MAUD} presses a heavy bronze key into the hand of ${SCYLLA} while ${CHAR} holds a thick ledger under one arm`,
    echoes: [
      {
        flag: 'GT-35:open-road',
        text: 'Scylla opened this road once, and the Heart breathed landward with its whole chest. The chain on the seventh sluice is newer than the old one. Its tag reads SHUT AGAIN BY ORDER, and gives her name as the reason.',
      },
      {
        flag: 'GT-35:keep-secret',
        text: 'Last time she mapped this road for two and left it shut to everyone else. The court didn’t need to shut it again. It only needed to find the map.',
      },
      {
        flag: 'GT-35:give-key',
        text: 'Last time she gave Char this key, and Char said she would decide when she knew what she was deciding. Char looks at it in Scylla’s hand now as if it had been taken from her, because it was.',
      },
      {
        flag: 'e04:char-lost-in-present',
        text: 'Years from now an older Char died at a gate Scylla held. This Char is alive, here, in the past, with a Book under her arm. Nothing in this cavern gets to decide otherwise.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'The last gate Scylla held, she held shut, and people waited in the dark so Char could live. Everything this Heart has swallowed is waiting too.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'The last time she turned a sea aside, it went down a channel to a yard called empty. Whatever comes back up from this Heart will go somewhere, and someone lives there.',
      },
      {
        flag: 'entry:pulled',
        text: 'Two letters and a ribbon ride in Scylla’s satchel, the only things the Heart never got to swallow. They are proof. They are also all she has.',
      },
      {
        flag: 'entry:listened',
        text: 'Inside the Heart’s held breath Scylla can hear her own voice saying today over and over, out of order. The court has been rehearsing her. It is nearly word-perfect.',
      },
      {
        flag: 'e05:tell-char',
        text: 'Char knows how the first road ended, because Scylla told her. The court has spent days trying to swallow that too. It is still in her.',
      },
    ],
    choices: [
      {
        id: 'breathe-out',
        label:
          'Reverse the Heart, and send everything the court swallowed back up into the palace',
        outcome:
          'Scylla turns the key and Char throws her weight on the wheel, and for the first time in four years the Heart breathes out. Up it all goes: letters, refusals, testimony, Char’s doll in her black lace, rising through every drain into every corridor. By morning the palace will be knee-deep in things that contradict it. The one history will not survive, and the court will know exactly who did it.',
        gain: { evidence: 2, trust: 1, danger: 2 },
        artSubject: `${SCYLLA} turning a great bronze key as ${CHAR} hauls on a wheel beside her and the enormous pump heaves outward, a torrent of letters, ribbons and a small black-lace doll erupting up the sluices toward the palace, ${MAUD} braced against the rush`,
      },
      {
        id: 'seal-the-road',
        label:
          'Chain the landward sluice from inside, so nobody can ever hunt those who left',
        outcome:
          'Scylla winds the chain back on from the inside, twice, locks it with the master key and snaps the key’s bow off in the lock. Now no clerk, no guard, no court can come up that road after Fenn, or after anyone who ever went up it. Nobody else will go up it either. Maud watches the bronze bow drift to the floor and says nothing, which down here is a whole sentence.',
        gain: { danger: -2, trust: 1, evidence: -1 },
        artSubject: `${SCYLLA} snapping the bow off a heavy bronze key in a padlock on a doubled chain across the seventh sluice, ${CHAR} and ${MAUD} watching in silence, the swollen pump straining behind them`,
      },
      {
        id: 'char-holds-key',
        label:
          'Give Char the master key and the Book, and don’t watch what she does with them',
        outcome:
          'Scylla holds out the key, and then, harder, turns her back. Behind her she hears pages, a key in some lock, and a hiss like something burning that shouldn’t be able to. She doesn’t look. When Char swims past she smells of smoke and salt, the key on her black lace, the Book gone or not gone. ‘Don’t ask,’ Char says. Scylla doesn’t. It is the hardest thing she has done in two lives.',
        gain: { trust: 2, evidence: -1, danger: 1 },
        artSubject: `${SCYLLA} with her back turned and her eyes shut in a vast cavern, while behind her ${CHAR} kneels by the chained seventh sluice with a heavy bronze key and an open ledger, a thin curl of smoke rising, ${MAUD} looking away`,
      },
    ],
  },
  {
    id: 'CW-36',
    title: 'The Ladder Out of the Throat',
    kind: 'exit',
    speaker: 'Scylla',
    opening:
      'Behind the Heart the crew ladder still climbs three hundred rungs to the hatch under the palace pantry. Above, the palace is waking into the same morning, lamp-jellies brightening on the same beat, cooks setting out kelp cakes in the same order. Below, the works does whatever it does now. Every tenth rung Char has chalked a skull, and for once they stay the way she drew them. Maud doesn’t see them off. She has never once watched anyone go, she says, and the Book can do its own watching.',
    artSubject: `A long narrow bronze ladder climbing up through a rock shaft underwater toward a square hatch rimmed with warm kitchen light, small chalk skulls on every tenth rung; ${CHAR} climbs ahead; ${SCYLLA} follows holding ${SULK}; far below, a great ribbed pump glows faintly in the murk`,
    echoes: [
      {
        flag: 'CW-35:breathe-out',
        text: 'Up the shaft beside the ladder, everything the court swallowed is going home: letters, refusals, testimony, Char’s doll in her black lace, rising past them like bubbles. By the time they reach the pantry the corridors will be full of it, and the court will know whose hand was on the wheel.',
      },
      {
        flag: 'CW-35:seal-the-road',
        text: 'Behind them the seventh sluice is chained from the inside, its key snapped in the lock. Nobody will hunt Fenn up that road now. Nobody will follow him either.',
      },
      {
        flag: 'CW-35:char-holds-key',
        text: 'The master key swings at Char’s throat on the black lace, knocking each rung, and she smells faintly of smoke. Scylla climbs below her and does not ask what was opened, or what burned.',
      },
      {
        flag: 'GT-35:open-road',
        text: 'She opened the landward road once, and jars rose on the tide. She thinks of them now, and of everyone the court has made sorry for it since.',
      },
      {
        flag: 'GT-35:keep-secret',
        text: 'Once there were two folded maps in two satchels. Scylla checks hers. The paper is blank, as if the road had never been drawn.',
      },
      {
        flag: 'GT-35:give-key',
        text: 'Once Char held the master key and wouldn’t say what she would open. Whatever happens next, that choice was hers first.',
      },
      {
        flag: 'GT-36:climb',
        text: 'Last time a cook looked at two princesses rising out of her floor and decided she hadn’t seen them. Scylla wonders whether anyone is still allowed to decide that.',
      },
      {
        flag: 'entry:pulled',
        text: 'The letters and the ribbon she pulled off the Throat’s grate ride dry in her satchel: the first things, in two lives, she has carried out of somewhere instead of in.',
      },
      {
        flag: 'entry:listened',
        text: 'Halfway up, the shaft says ‘Race you’ in Scylla’s voice. Char answers it aloud, ‘No,’ and the shaft, for once, has nothing to say back.',
      },
      {
        flag: 'e05:run-again',
        text: 'They ran from the palace once, and the palace ran it back. This time, at least, they climb into the morning knowing what it costs.',
      },
      {
        flag: 'e05:stay',
        text: 'They stayed once, and safety closed like a lid. At the top Char tries the pantry hatch twice, to be sure it isn’t locked. It isn’t.',
      },
    ],
    choices: [
      {
        id: 'climb',
        label: 'Climb toward the pantry and the morning',
        outcome:
          'At the top Char shoulders the hatch into the pantry, and a cook who has been saying the same thing about kelp cakes since dawn stops mid-sentence, looks at two princesses rising out of her floor, and says something new: ‘Oh.’ Scylla thanks her. Whatever waits at the gate is nearer than it was, and the morning, for the first time today, is a different one.',
        artSubject: `${CHAR} pushing up a floor hatch into a warm lamplit palace pantry stacked with kelp cakes, a startled round-faced cook in an apron caught mid-word, ${SCYLLA} climbing up behind her sister`,
      },
    ],
  },
]
