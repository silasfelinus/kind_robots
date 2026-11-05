import type { WorksRoomContent } from './types'

/**
 * The Breathing Works, rows 4–6 (GT-19..GT-36): the deep galleries, the
 * crew’s back ways, the Warden (Maud Weir, who gives her own name at GT-32)
 * and the Breathing Heart. Char is with Scylla throughout; Oren stays at his
 * tally post (GT-15). The landward sluice has been shut by crown order for
 * four years, since Fenn Dunlin went up it; the crew’s 41 requests to reopen
 * it were all refused.
 */
const SCYLLA =
  'a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze'
const CHAR =
  'her identical twin with dark violet scales, black lace and a sardonic grin'
const MAUD =
  'a very old, broad merwoman sluice-keeper with a cropped white mane, barnacle-scarred forearms, a leather tool apron and a heavy ring of bronze keys at her hip'
const SULK = 'a glass globe lantern with a small glimmer eel coiled inside'

export const WORKS_ROOMS_B: readonly WorksRoomContent[] = [
  {
    id: 'GT-19',
    title: 'The Queens Facing the Wall',
    kind: 'lore',
    speaker: 'Scylla',
    opening:
      'In a dry side-tunnel the palace keeps what it has stopped looking at: portraits of queens too stern, too faded or too honest, stacked face to the wall. The crew use them as shelving. A great-grandmother holds up a kettle; a regent supports a box of washers. One small frame, turned outward by somebody, shows a girl in a pearl circlet on the day she was crowned, wearing a worried look Scylla has met in mirrors all week.',
    artSubject: `A dry stone side-tunnel underwater lined with large gilt-framed portraits stacked with their backs outward, a kettle, mugs and a box of washers resting on top of them; one small portrait faces out, showing a young crowned mermaid girl with a worried expression; ${SCYLLA} looks at it while ${CHAR} holds up ${SULK}`,
    autoChoiceId: 'look',
    echoes: [
      {
        flag: 'e05:4,2:care',
        text: 'Upstairs, Councilor Salter said the portraits hear who signs. These ones haven’t heard a word in years, and look relieved about it.',
      },
      {
        flag: 'e05:4,2:risk',
        text: 'Upstairs the portraits heard Scylla sign her sister’s name. Down here the queens face the wall, as if they would rather not know what else she’s done.',
      },
    ],
    choices: [
      {
        id: 'look',
        label: 'Look properly at the girl in the small frame',
        outcome:
          'It is their mother, at about their age. Someone on the crew has hung a sock on the corner of the frame to dry, which is the least royal thing that has ever happened to her, and Char laughs so hard Sulk flickers. Scylla laughs too. She keeps looking at the eyes.',
        gain: { evidence: 1 },
        artSubject: `A small gilt portrait of a young crowned mermaid girl with worried eyes, a grey wool sock hung on one corner of its frame to dry, ${CHAR} doubled up laughing beside it with ${SULK} flickering`,
      },
    ],
  },
  {
    id: 'GT-20',
    title: 'The Gauge Shaft',
    kind: 'hazard',
    speaker: 'Char',
    opening:
      'The Gauge Shaft drops through a pipe barely wider than two princesses, bronze rungs down one side and a gauge at every landing with a needle like a raised eyebrow. Every so often the whole pipe pushes: ears pop, scales tighten, the circlet bites into Scylla’s brow. On some rungs, and not others, Char has chalked a tiny skull. Char herself is already three rungs down, looking up. ‘Race you,’ she says, because of course she does.',
    artSubject: `Looking down a narrow vertical bronze pipe underwater with a ladder of rungs down one side and round pressure gauges at each landing, tiny chalk skulls on some of the rungs; ${CHAR} grins up from three rungs below; ${SCYLLA} hesitates at the top`,
    echoes: [
      {
        flag: 'entry:current',
        text: 'With the observatory’s intake running, the push comes hard and often, and the needle on each gauge jumps as if it has been personally insulted.',
      },
      {
        flag: 'entry:still',
        text: 'With the intake shut the push comes slow and deep, the Heart breathing like a sleeper, and in the long quiet between, every rung rings. Far above, the apprentices are calling down a pipe: ‘Who touches a valve?’',
      },
      {
        flag: 'e05:2,1:care',
        text: 'Char won the Pearl Stair this morning by a fin, honestly, and would like it on record that she is undefeated on stairs of every kind.',
      },
      {
        flag: 'e05:2,1:risk',
        text: '‘And no stopping halfway this time,’ Char adds, ‘or I’ll know you’re keeping something.’',
      },
    ],
    choices: [
      {
        id: 'skulls',
        label: 'Hold only the rungs Char chalked, and let the push go by',
        outcome:
          'The skulls are where she held on when the pipe pushed, every one: these are her tunnels, and she has done this a dozen times. Scylla climbs skull to skull and arrives with her ears intact. Char, who came down without looking at a single one, arrives first and pretends not to be pleased that Scylla used them.',
        gain: { danger: -1, trust: 1 },
        artSubject: `${SCYLLA} gripping a bronze rung marked with a small chalk skull as a pulse of pressure ripples down the pipe, ${CHAR} waiting at the bottom with folded arms and a hidden smile`,
      },
      {
        id: 'race',
        label: 'Race her down, like the Pearl Stair',
        outcome:
          'They go down the pipe in a clatter of elbows. The push catches them two landings from the bottom and squeezes both flat as pressed flowers. They arrive laughing, ears popping in different keys, and the last gauge has a crack in its glass it did not have before.',
        gain: { trust: 1, danger: 1 },
        artSubject: `${SCYLLA} and ${CHAR} tumbling laughing out of the bottom of a narrow bronze pipe in a swirl of bubbles, a cracked pressure gauge on the wall beside them`,
      },
    ],
  },
  {
    id: 'GT-21',
    title: 'The Slack Pool',
    kind: 'secret',
    speaker: 'Scylla',
    opening:
      'Off the shaft foot, in a chamber nobody bothers to light, lies a cistern so old and deep the current forgot it. Everything else in the works moves. This water does not. The crew call it the Slack Pool and don’t look in: it shows, they say, what the water hasn’t done yet. Char won’t either. ‘Crew rule,’ she says, and goes to admire a rack of very large spanners, loudly, with her back to it.',
    artSubject: `A dim round stone chamber underwater with an ancient sunken cistern whose surface is perfectly flat and mirror-still, a dented pail and ladle on its rim; ${SCYLLA} kneels at its edge; in the background ${CHAR} inspects a rack of huge bronze spanners with her back turned, holding ${SULK}`,
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'Scylla knows, before she looks, that whatever the pool shows will have her sister in it, and that her sister is six strokes away, alive, weighing a spanner.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'The pool’s depths are faintly lit from somewhere under the stone, in squares, like windows. Scylla has seen windows like that under water, with hands against them.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'The pool’s overflow runs into a drain chalked STORES. Scylla knows now what the palace means by that word, and who sleeps at the other end.',
      },
      {
        flag: 'e05:6,6:care',
        text: 'There is fresh chalk on the rim, a scholar’s question mark. Wenna has been down here since Scylla told her about the gate.',
      },
      {
        flag: 'e05:6,6:risk',
        text: 'Upstairs she smoothed a dial so tomorrow would look calm. Nobody has ever smoothed this.',
      },
    ],
    choices: [
      {
        id: 'watch',
        label: 'Look into the still water',
        outcome:
          'For one breath the pool is a window: a stone basin in a rain-grey city, a chain she knows the weight of, a gate coming down. Then ripples. Char, who has come back after all, sees only two reflections and pulls a face at hers. Scylla does not mention that one of the faces in the pool was older.',
        gain: { evidence: 2 },
        artSubject: `${SCYLLA} bending over a still cistern whose surface faintly shows a rain-grey city fountain, a heavy chain and a closing gate; beside her ${CHAR} pulls a face at her own reflection`,
      },
      {
        id: 'leave',
        label: 'Leave the pool to its stillness',
        outcome:
          'Some windows you only need to look through once, and she has been on the other side of this one. Scylla goes and takes Char’s hand instead, which Char permits for almost four strokes before she remembers who she is.',
        gain: { trust: 1 },
        artSubject: `${SCYLLA} turning away from a mirror-still cistern to take the hand of ${CHAR}, who allows it with a long-suffering look beside a rack of spanners`,
      },
    ],
  },
  {
    id: 'GT-22',
    title: 'Ottery’s Riddle',
    kind: 'puzzle',
    speaker: 'Char',
    opening:
      'Three drains open off a junction, and over each the crew have chalked a line. LEFT: ‘The Heart is through the right.’ MIDDLE: ‘The left one is lying.’ RIGHT: ‘I go to the kitchens.’ Under them, signed with an otter: ‘Only the drain to the Heart tells the truth. Welcome to the crew.’ Char groans. ‘Ottery does this to every new hand. I always just follow the warm water, and it isn’t warm here.’',
    artSubject: `A junction of three round brick drain mouths in an underwater tunnel, a faded chalk line scrawled above each and a little chalk otter beneath them; ${CHAR} rubs her forehead while ${SCYLLA} studies the drains with ${SULK}`,
    choices: [
      {
        id: 'middle',
        label: 'Take the middle drain',
        outcome:
          'If the left told the truth, the Heart would be both left and right, so the left is lying. Then the middle is right to say so, and only the truthful drain goes to the Heart. Five minutes on, the brick turns warm. Chalked inside, an otter giving a thumbs-up. Char says ‘Obviously,’ in the voice she uses when she hadn’t got there yet.',
        gain: { evidence: 1, trust: 1 },
        artSubject: `${SCYLLA} and ${CHAR} swimming into a warm brick drain where a chalk otter gives a cheerful thumbs-up on the wall`,
      },
      {
        id: 'left',
        label: 'Take the left drain',
        outcome:
          'It ends at a grating heaped with every spoon the palace has ever lost down a sink, which is a great many spoons. Char picks one out, examines it and says it’s Mother’s. They go back, a little sheepish, and slightly better at lying drains.',
        gain: { danger: 1 },
        artSubject: `${CHAR} holding up a single silver spoon from a heap of lost cutlery against a drain grating, ${SCYLLA} sighing beside her`,
      },
      {
        id: 'right',
        label: 'Take the right drain',
        outcome:
          'It does not go to the kitchens, which is the one true thing about it, since the right drain is a liar. It goes to the edge of the dark cistern, where something very large turns over in its sleep. They back out, slowly, saying nothing at all.',
        gain: { danger: 1, trust: -1 },
        artSubject: `${SCYLLA} and ${CHAR} backing slowly out of a drain mouth onto black water where a huge faint glow turns over far below`,
      },
    ],
  },
  {
    id: 'GT-23',
    title: 'The Silt Trap',
    kind: 'hazard',
    speaker: 'Scylla',
    opening:
      'Before the sea reaches the Heart it drops its sand here, in a long, low settling gallery floored a fin-deep in silt as fine as flour. One careless flick and the water turns to fog, and in fog the gallery has three ways out and two of them are wrong. The crew have strung a guide rope at shoulder height. It is very dark, and nobody can say where the rope is until they find it.',
    artSubject: `A long low pitch-dark underwater gallery floored with soft pale silt, a faint guide rope sagging along one wall, a drifting cloud of fine sediment beginning to rise; ${SCYLLA} and ${CHAR} hover just above the floor in the dim glow of ${SULK}`,
    echoes: [
      {
        flag: 'entry:current',
        text: 'With the intake drawing, the silt never quite settles: a low haze already hangs over the floor, and the haze is moving.',
      },
      {
        flag: 'entry:still',
        text: 'With the intake shut the silt lies thick and still as snow, and every stroke leaves a cloud in it like a footprint. Anyone coming after them will know exactly where they went.',
      },
    ],
    choices: [
      {
        id: 'glow',
        label: 'Turn Sulk up, find the rope, and go slow',
        outcome:
          'In Sulk’s glow the rope shows at once, and beside it, half buried, a crew boot with FENN burnt into the heel, lost on his way up four years ago. Scylla tucks it under her arm. Sulk, having been useful, dims to sulk about it.',
        gain: { battery: -1, danger: -1, evidence: 1 },
        requires: { battery: 1 },
        lockedHint: 'Needs glow',
        artSubject: `${SCYLLA} lifting a single old crew boot out of pale silt beside a guide rope, ${SULK} glowing in ${CHAR}’s raised hand`,
      },
      {
        id: 'dark',
        label: 'Go over the top in the dark, one hand on Char’s shoulder',
        outcome:
          'They go by feel and stubbornness. Halfway, Scylla’s tail brushes the floor and the gallery fills with flour. Neither lets go. Char finds the right way out by smell, she claims, and Scylla lets her have it, and they come out coughing and grey as two ghosts of themselves.',
        gain: { danger: 1, trust: 1 },
        artSubject: `Two young mermaids, one pale aquamarine with a pearl circlet, one dark violet in black lace, both dusted grey with silt, emerging from a thick cloud of sediment holding on to each other`,
      },
    ],
  },
  {
    id: 'GT-24',
    title: 'The Sluice Run',
    kind: 'shortcut',
    speaker: 'Scylla',
    opening:
      'A sluice gate the height of a ballroom rises and falls in its slot on the Heart’s breath. When it lifts there is a long straight culvert beyond, running downhill toward the deep works and a single lamp far off. A whalebone wedge hangs on a hook beside it, carved by some worker: FOR WHEN IT STICKS. It does not, at present, stick. It could be made to.',
    artSubject: `A towering bronze sluice gate lifting in a stone slot underwater, beyond it a long straight culvert sloping down toward one tiny lamp in the far dark; a carved whalebone wedge on a hook beside it; ${SCYLLA} and ${CHAR} look through the gap`,
    echoes: [
      {
        flag: 'GT-18:open-hatch',
        text: 'Up behind them the maintenance hatch to the pump-gallery stair stands open. Between that and this, the works is acquiring doors it didn’t have yesterday.',
      },
      {
        flag: 'GT-18:leave-shut',
        text: 'She left the hatch above shut. Here the works asks her the same question in a louder voice.',
      },
    ],
    choices: [
      {
        id: 'wedge',
        label: 'Wedge the sluice open: a straight run to the deep works',
        outcome:
          'Scylla and Char drive the wedge under the gate’s lip with both their tails. It stops mid-breath, a little open, and the culvert exhales, a straight road downhill to the far lamp. Somewhere a pump labours to make up the difference. Whoever keeps this place will feel it in her teeth.',
        gain: { danger: 1, evidence: 1 },
        artSubject: `${SCYLLA} and ${CHAR} shoving a whalebone wedge under the lip of a great bronze sluice gate together with their tails braced, water rushing through the gap down a long culvert`,
      },
      {
        id: 'close',
        label: 'Let it fall and bar it, the way the crew would',
        outcome:
          'She lets the gate drop the way it wants to and slides the locking bar after it. The works’ breath evens out and the culvert is gone behind bronze. ‘You know we have to go round now,’ Char says. Scylla knows. Some doors are somebody’s job.',
        gain: { danger: -1, trust: 1 },
        artSubject: `${SCYLLA} sliding a heavy bronze bar across a closed sluice gate, a whalebone wedge back on its hook, ${CHAR} rolling her eyes beside her`,
      },
    ],
  },
  {
    id: 'GT-25',
    title: 'The Jar Rack',
    kind: 'lore',
    speaker: 'Scylla',
    opening:
      'At the foot of the landward channel the crew keep a rack of sealed jars, each with a letter inside and an address scratched on the lid: To Fenn. To my sister, cove town. To whoever finds this, please tell my mother. Once, the landward tide carried a jar up every morning. Since the sluice was shut, four years of them have waited here, row on row, for a road that isn’t open.',
    artSubject: `Tall wooden racks at the mouth of a dark tunnel underwater, packed with hundreds of small sealed glass jars, each holding a rolled letter, lids scratched with marks; ${SCYLLA} lifts one jar to the light of ${SULK}; ${CHAR} reads the lids along a shelf`,
    echoes: [
      {
        flag: 'e05:7,7:care',
        text: 'Tansy’s oilcloth letter to Fenn is in Scylla’s satchel. On the rack there is a whole shelf for him already, and room on the end.',
      },
      {
        flag: 'e05:7,7:risk',
        text: 'Marl told her the route was the jetty’s living. Here is what the other living looks like: a shelf of letters that never left.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'Row after row of people waiting to be carried somewhere. Scylla has seen people wait like this behind glass, and chosen not to open the door.',
      },
    ],
    choices: [
      {
        id: 'read-lids',
        label: 'Read the lids, shelf by shelf',
        outcome:
          'Fenn has eleven jars, mostly in his mother’s writing, with Tibby’s drawings crowding the margins. There are jars for weddings, jars for funerals, one jar just labelled SORRY. The newest is from this week, in a hand Scylla knows: To us, later. C. Char takes it off the shelf and puts it on a higher one, out of Scylla’s reach, without a word.',
        gain: { evidence: 1 },
        artSubject: `${CHAR} reaching up to place one small sealed jar on a high rack shelf, ${SCYLLA} below her holding another jar and reading its scratched lid`,
      },
      {
        id: 'add-jar',
        label: 'Write a jar of your own and add it to the rack',
        outcome:
          'Scylla writes to someone she will meet on land years from now, who will be kind to her at a counter and never know why she cries. She seals it and scratches no address. Char watches, then writes one too, and won’t say who it’s for. Two princesses’ hands are in the crew’s rack now, for anyone who ever opens it.',
        gain: { trust: 1, danger: 1 },
        artSubject: `${SCYLLA} and ${CHAR} side by side, each sealing a small glass jar with a rolled letter inside, a rack of hundreds of jars behind them`,
      },
    ],
  },
  {
    id: 'GT-26',
    title: 'The Answer Box',
    kind: 'choice',
    speaker: 'Scylla',
    opening:
      'By the pump-house door hangs a box painted long ago with a crown, so it would look official. In it the crew keep every answer that came down from upstairs about the landward sluice: forty-one oilcloth slips, four years of them, all in one clerk’s hand, all one word. Under them, never sent, a slip in a child’s round letters: ‘Please can the sluice open so my brother can come home or write. Tibby D.’',
    artSubject: `A battered wooden box with a faded painted crown hanging beside a pump-house door in an underwater tunnel, a thick stack of identical folded oilcloth slips spilling from it; ${SCYLLA} holds one child’s slip open in both hands; ${CHAR} reads over her shoulder`,
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'At the very bottom is an older slip in a hand Scylla knows: Char’s, aged about nine, asking for a door to the land. ‘Don’t read that one,’ says Char, alive, mortified.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'Forty-one times a door stayed shut with people behind it who wanted through. Scylla knows exactly how a number like that is made.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'One refusal has a reason added, just once, in the clerk’s neat hand: ‘No residents affected.’ Scylla has read that sentence before, in another life, about a yard.',
      },
      {
        flag: 'e05:4,2:care',
        text: 'Councilor Salter’s petition is upstairs with Scylla’s name on it, and not one word of this in it.',
      },
      {
        flag: 'e05:4,2:risk',
        text: 'Both princesses are on Salter’s petition, one in the wrong hand. Every request in this box, at least, was signed by whoever wrote it.',
      },
    ],
    choices: [
      {
        id: 'carry',
        label: 'Take the refusals and Tibby’s slip up to Councilor Salter',
        outcome:
          'Scylla wraps forty-two slips in oilcloth. ‘You’re deciding for them,’ Char says, ‘that they want to be read upstairs again.’ ‘They asked forty-one times.’ Char considers that, and takes Tibby’s slip to carry herself. If Scylla leaves, this is the last thing she did as a princess. If she stays, it is the first.',
        gain: { trust: 1, evidence: 1, danger: 1 },
        artSubject: `${SCYLLA} tying an oilcloth bundle of folded slips with cord beside an emptied crown-painted box, ${CHAR} tucking one small slip carefully into her lace`,
      },
      {
        id: 'answer',
        label: 'Answer Tibby’s slip yourself and put it back',
        outcome:
          'Under the round letters Scylla writes, in her best court hand: ‘I have read this. I am sorry nobody upstairs did. S.’ and puts it back on top. It opens nothing. One day Tibby will find out a princess read it, and that she put it back.',
        gain: { trust: 1 },
        artSubject: `${SCYLLA} writing beneath a child’s note on an oilcloth slip with a squid-ink pen, a crown-painted box beside her, ${CHAR} watching with her head on one side`,
      },
      {
        id: 'leave',
        label: 'Leave the box alone; it belongs to the people who wrote in it',
        outcome:
          'She folds Tibby’s slip back along its creases. ‘Good,’ says Char, unexpectedly. ‘Upstairs had forty-one goes. It doesn’t get a forty-second just because it’s you.’ The box stays full, and the sluice stays shut.',
        gain: { danger: -1 },
        artSubject: `${SCYLLA} closing the lid of a stuffed crown-painted box with both hands, ${CHAR} leaning on the pump-house door beside it`,
      },
    ],
  },
  {
    id: 'GT-27',
    title: 'Warm, Warmer, Soup',
    kind: 'puzzle',
    speaker: 'Char',
    opening:
      'Past the pump house the tunnel splits into three outflows, and Char’s rule for finding the Heart is to follow the warm water. Two run warm. One runs cold. Chalked at the split, in the crew’s square hand: ‘Two waters run warm down here: the Heart’s, and the kitchens’ washing-up. The Heart’s tastes of salt and nothing else. The kitchens’ tastes of whatever the cooks burnt.’ Tonight the cooks burnt sea-onions.',
    artSubject: `Three round outflow pipes branching from an underwater tunnel, faint shimmer of warm water rising from two of them, chalk scrawl on the wall at the fork; ${CHAR} holds her hand in one outflow while ${SCYLLA} cautiously tastes the water at another`,
    choices: [
      {
        id: 'salt',
        label: 'Follow the warm water that tastes only of salt',
        outcome:
          'Clean, warm, faintly metallic, like the inside of a bell. They follow it downhill and the walls begin to tremble with something enormous breathing. Char tastes it again, to be sure, and declares that she knew, she just wanted to see Scylla lick a pipe.',
        gain: { evidence: 1, trust: 1 },
        artSubject: `${SCYLLA} and ${CHAR} swimming downhill along a warm shimmering outflow toward a faint deep glow, the tunnel walls trembling`,
      },
      {
        id: 'onion',
        label: 'Follow the warm water that tastes of burnt onion',
        outcome:
          'It leads, unerringly, to the underside of the palace sinks, where a great deal of onion is going on. Somewhere above, a cook drops a pot and swears. They go back down with their eyes watering and Char humming a song about onions she has just made up.',
        gain: { danger: 1 },
        artSubject: `${SCYLLA} and ${CHAR} with streaming eyes beneath a dripping tangle of sink pipes, bits of burnt onion drifting in the water around them`,
      },
      {
        id: 'cold',
        label: 'Follow the cold water; warm is too obvious',
        outcome:
          'Cold water goes down, and down, and the walls stop trembling, and Sulk stops glowing out of disapproval. They turn round in a sump that has not seen a lamp in a hundred years, and swim back up a long way, saying nothing helpful.',
        gain: { danger: 1, trust: -1 },
        artSubject: `${SCYLLA} and ${CHAR} turning round in a deep black sump, ${SULK} nearly dark between them`,
      },
    ],
  },
  {
    id: 'GT-28',
    title: 'The Night-Shift Bunks',
    kind: 'rest',
    speaker: 'Scylla',
    opening:
      'Off the deep galleries is a dry-ish pocket where the night crew sleep in turns: hammocks of old net, a shell stove ticking as it cools, a crock of brine shrimp, and a rota on the wall with tonight’s sleeper crossed out and GONE TO SEE ABOUT A NOISE written beside it. Char tests a hammock, finds it acceptable, and yawns enormously in a way that is meant to look accidental.',
    artSubject: `A snug underwater rock pocket strung with hammocks of old fishing net, a small shell stove, a crock on a shelf, a slate rota on the wall; ${CHAR} sprawled yawning in a hammock; ${SCYLLA} stands beside it holding ${SULK}`,
    echoes: [
      {
        flag: 'entry:current',
        text: 'Dace snores in the far hammock through the roar next door. Without opening an eye, Dace says, ‘Mind the stove, Highnesses,’ and goes on snoring.',
      },
      {
        flag: 'entry:still',
        text: 'The bunks are empty: the crew have gone to find out why the observatory’s intake stopped and the Heart slowed. Their hammocks are still swinging.',
      },
      {
        flag: 'GT-12:feed-eel',
        text: 'Sulk, still sleek from the galley shrimp, eyes the crock on the shelf with the air of a duchess offered a second dinner.',
      },
    ],
    choices: [
      {
        id: 'sleep',
        label: 'Take the hammock beside Char’s and sleep',
        outcome:
          'They lie nose to nose, the way they did when they were small, which they are. Char drops a pinch of shrimp into Sulk’s globe on her way to sleep. Scylla means to keep watch. She wakes with Char’s black lace tangled in her circlet, no idea how long it’s been, and Sulk shining fit to read by.',
        gain: { battery: 2, danger: -1 },
        artSubject: `${SCYLLA} and ${CHAR} asleep nose to nose in two net hammocks, black lace caught in a pearl circlet, ${SULK} glowing warmly between them`,
      },
      {
        id: 'search',
        label: 'Let Char sleep, and read the rota board',
        outcome:
          'Fifty years of shift names, and beside every single night the same small mark: a scrape of chalk, the crew’s sign for the Warden. Pinned under the rota is a fresh slip, signed by every hand on the crew: REQUEST 42, LANDWARD SLUICE. Nobody has taken it up yet. It looks as if nobody wants to be the one.',
        gain: { evidence: 1 },
        artSubject: `${SCYLLA} reading a slate rota pinned with an oilcloth slip covered in many signatures, a short chalk scrape mark beside every row, ${CHAR} asleep in a hammock behind her`,
      },
    ],
  },
  {
    id: 'GT-29',
    title: 'Ottery’s Round',
    kind: 'companion',
    speaker: 'Ottery',
    opening:
      'Ottery comes round the bend with an oilcan, a lamp-hook and a back held very carefully, the way people hold backs that have recently been better. Ottery looks at Char, nods as at furniture, then at Scylla, and stops. ‘Two of you,’ Ottery says. ‘The log said one. I’ll have to tell the Warden the log was wrong, and she’ll enjoy that.’ The oilcan creaks. ‘Well. Ask, then. Everyone asks something.’',
    artSubject: `A stooped, weathered mer-worker of the night crew with an oilcan, a lamp on a hook and a patched work apron, pausing in a bend of an underwater tunnel; ${CHAR} waves cheerfully; ${SCYLLA} beside her, straightens her circlet`,
    echoes: [
      {
        flag: 'GT-22:middle',
        text: 'Ottery has seen the chalk otter’s thumbs-up behind them and looks almost proud. ‘First go? Your sister took four.’',
      },
      {
        flag: 'GT-12:note',
        text: '‘Somebody left a note under the porridge,’ Ottery says. ‘Skull and a crown. The whole crew’s read it. Dace cried, but Dace cries at soup.’',
      },
    ],
    choices: [
      {
        id: 'ask-warden',
        label: 'Ask Ottery about the Warden',
        outcome:
          '‘Signed on fifty years ago, younger than you. Kept the landward wheel since the order came down. Takes our requests up herself, every one, and brings the answers down herself, so none of us has to hear the word from a clerk.’ Ottery oils a hinge. ‘Forty-one times. She’s not said what she thinks. She’s never thrown the wheel away, either.’',
        gain: { evidence: 1, trust: 1 },
        artSubject: `The stooped mer-worker oiling a valve hinge while talking over one shoulder, ${SCYLLA} listening closely, ${CHAR} perched on a pipe`,
      },
      {
        id: 'let-char',
        label: 'Say nothing, and let Char do the talking',
        outcome:
          'Char and Ottery talk like two old crew: the cistern eel’s moods, Dace’s cake debt, whose back is better. Scylla listens to her sister have a whole life down here she never once heard about, the first time round or this one. It is like finding a room in your own house. Then Char asks, quite casually, how long the landward sluice takes to open.',
        gain: { trust: 2 },
        artSubject: `${CHAR} laughing with a stooped old mer-worker as they share a pipe for a bench, ${SCYLLA} a little apart, watching her sister with wonder`,
      },
      {
        id: 'keep-quiet',
        label: 'Ask Ottery not to tell the Warden you’re here',
        outcome:
          '‘Nobody keeps anything from the Warden,’ Ottery says, kindly. ‘We just don’t tell her first.’ The oilcan creaks away round the bend. A moment later, along the copper pipe, comes a single soft tap, then nothing. Char gives Scylla a look that says she has just made it worse, beautifully.',
        gain: { danger: -1, trust: -1 },
        artSubject: `A stooped mer-worker disappearing round a tunnel bend with an oilcan and lamp, ${CHAR} giving ${SCYLLA} a sidelong look beside a bright copper pipe`,
      },
    ],
  },
  {
    id: 'GT-30',
    title: 'The Shrimp Hatchery',
    kind: 'treasure',
    speaker: 'Scylla',
    opening:
      'The tunnel ends, warm and pink, in the crew’s shrimp hatchery: shallow stone trays where brine shrimp are raised for every glimmer eel in the palace, a soft rosy cloud over each. It is a dead end and the friendliest room in the works. Sulk presses her whole face to the glass. A crew sign says TAKE WHAT YOU NEED, PUT BACK WHAT YOU CAN, and a small bowl beside it holds buttons, a bead, a fish-hook.',
    artSubject: `A small warm underwater chamber of shallow stone trays, each with a soft rosy cloud of tiny brine shrimp drifting above it, a wooden sign and a little bowl of odd trinkets by the door; ${SCYLLA} and ${CHAR} peer in while ${SULK} presses close to the glass`,
    choices: [
      {
        id: 'pouch',
        label: 'Fill a pouch and go',
        outcome:
          'Sulk eats like a queen kept waiting for her feast and blazes. The pouch is full for later. Char glances at the bowl by the sign, then at Scylla, and says nothing, the way Char says nothing when she is keeping count.',
        gain: { battery: 2, trust: -1 },
        artSubject: `${SULK} blazing gold as a pinch of shrimp drifts into it, ${SCYLLA} tying a full pouch at her waist, ${CHAR} glancing at a little bowl of trinkets`,
      },
      {
        id: 'pearl',
        label:
          'Prise a pearl from your circlet for the bowl, and take a smaller scoop',
        outcome:
          'The pearl clinks in among the buttons. Sulk gets a modest supper and makes her feelings known. Scylla’s circlet has a gap like a missing tooth now, and someone at court will ask about it before the week is out. Char, without a word, adds a jet bead from her lace beside the pearl.',
        gain: { battery: 1, trust: 1, danger: 1 },
        artSubject: `${SCYLLA} dropping a single pearl into a little bowl of buttons by a wooden sign, ${CHAR} adding a black bead beside it, a rosy shrimp tray glowing behind them`,
      },
    ],
  },
  {
    id: 'GT-31',
    title: 'Under the Heart',
    kind: 'lore',
    speaker: 'Scylla',
    opening:
      'The last culvert slopes down under the deep works, and here the Heart’s breath is no longer a sound but weather: the water thickens and thins around them, in and out. Ahead is a lamp in a window cut in the rock, and on the door beneath it a board in the crew’s square hand: WARDEN. Along the copper pipe beside the door comes one long scrape. Char goes very upright. ‘She knows,’ she says. ‘She always knows.’',
    artSubject: `A broad sloping underwater culvert leading to a small door cut into living rock with one warm lamplit window above it and a wooden board on the door, a bright copper pipe running alongside, the water rippling visibly in slow waves; ${SCYLLA} and ${CHAR} approach side by side`,
    autoChoiceId: 'knock',
    echoes: [
      {
        flag: 'GT-24:wedge',
        text: 'The draught from the wedged sluice has followed them down the culvert and pushes at their backs like a hand at a party.',
      },
      {
        flag: 'GT-24:close',
        text: 'They came the long way round, and the door ahead looks as if it has been expecting the long way.',
      },
    ],
    choices: [
      {
        id: 'knock',
        label: 'Knock',
        outcome:
          'There is no other way on. Char tucks her hair behind her ears, which she only does before trouble. Scylla straightens her circlet, which she does before everything. From inside, a voice like a pipe clearing: ‘It’s open. It’s always open. That’s what knock means.’',
        gain: { trust: 1 },
        artSubject: `${SCYLLA} raising a hand to knock on a small rock-cut door under a lamplit window while ${CHAR} beside her, tucks her hair behind her ears`,
      },
    ],
  },
  {
    id: 'GT-32',
    title: 'The Warden',
    kind: 'guardian',
    speaker: 'Maud Weir',
    opening:
      'The Warden’s room is a lock-keeper’s cottage cut into the rock, a round window onto the dark, and on the wall a great bronze wheel with no spindle: the landward sluice’s, off its post four years. Its keeper is very old and very broad, her white mane cropped like a worker’s. She keeps knitting. ‘Maud Weir. Fifty years down here. One princess on my kitchen stair since spring, which the crew think I don’t know. Tonight, two. The night before something. Which something?’',
    artSubject: `A snug lamplit lock-keeper’s room carved into underwater rock, a round window onto dark water, a great bronze valve wheel hung on the wall, a teapot and knitting basket on a table; ${MAUD} sits knitting grey wool; ${SCYLLA} and ${CHAR} stand in the doorway`,
    echoes: [
      {
        flag: 'entry:current',
        text: '‘You came down the observatory’s Throat with the draw running,’ she adds. ‘Brave, or daft. It’s usually the same face.’',
      },
      {
        flag: 'entry:still',
        text: '‘And somebody shut the observatory’s intake,’ she adds, mild as milk, ‘so my Heart’s breathing like an old dog and I’ve apprentices tapping who? on my pipes. Don’t answer. It was you.’',
      },
      {
        flag: 'GT-12:note',
        text: 'The note from the galley lies flattened under her teapot, skull and crown and all. ‘Nobody leaves my crew notes,’ she says. ‘I’ve read it four times.’',
      },
      {
        flag: 'GT-02:ask-why',
        text: '‘Somebody wrote why? on my slate,’ she says, ‘and tonight somebody gave it a second question mark. It’s a fair question. I’ve carried it upstairs forty-one times.’',
      },
      {
        flag: 'GT-21:watch',
        text: 'Her eyes go to Scylla’s and stay. ‘You looked in the Slack Pool. Crew don’t. It’s left that look on you, like weather nobody’s had yet.’',
      },
      {
        flag: 'GT-21:leave',
        text: '‘You didn’t look in the Slack Pool,’ she says, as if she can smell it. ‘Sensible. It only shows you what you already know.’ Scylla says nothing at all.',
      },
    ],
    choices: [
      {
        id: 'truth',
        label: 'Tell her the truth: you are leaving',
        outcome:
          '‘I’m leaving,’ Scylla says. ‘By the landward way, if it’ll have me.’ She does not say we. Char notices that she doesn’t. Maud’s needles stop. ‘You’ve said it aloud to the one person down here who’ll have to answer for it,’ she says. ‘Good. People who say things aloud are easier to help and harder to hang.’ She lifts the wheel off its hook.',
        gain: { trust: 1, danger: 1 },
        passesGuardian: true,
        artSubject: `${SCYLLA} standing very straight before ${MAUD}, whose knitting needles have stopped, ${CHAR} beside her glancing sideways at her sister`,
      },
      {
        id: 'show-evidence',
        label: 'Lay out what you’ve learned about the shut sluice',
        outcome:
          'Scylla sets it out the way Oren would, counted twice: Fenn’s struck name, forty-one refusals in one clerk’s hand, rooms called STORES with people in them, four years of jars that never went up, and a wheel kept on a wall instead of thrown away. ‘You didn’t keep it for nothing,’ she says. Maud puts the knitting down. ‘Fifty years,’ she says, ‘and nobody upstairs ever counted us before.’',
        gain: { evidence: 1, trust: 1 },
        requires: { evidence: 4 },
        lockedHint: 'Needs more evidence (4)',
        passesGuardian: true,
        artSubject: `${SCYLLA} counting points on her fingers across a lamplit table from ${MAUD}, who has set down her knitting and is looking at her properly for the first time, ${CHAR} leaning on the window frame`,
      },
      {
        id: 'char-speaks',
        label: 'Let Char answer for herself',
        outcome:
          'Char swims forward before Scylla can open her mouth. ‘I’m leaving. I’ve got boots, I’ve got a plan, mostly. My sister’s deciding whether to come, and she isn’t allowed to decide for me.’ Maud looks from one identical face to the other a long while. ‘Skulls on my walls since spring,’ she says to Char, ‘and that’s the first thing you’ve said with your mouth. Good one.’',
        gain: { trust: 2, danger: -1 },
        requires: { trust: 3 },
        lockedHint: 'Only if Char trusts you enough to speak first (trust 3)',
        passesGuardian: true,
        artSubject: `${CHAR} swimming forward with her chin up to face ${MAUD} across a lamplit table, ${SCYLLA} a half-stroke behind her with her mouth still open`,
      },
    ],
  },
  {
    id: 'GT-33',
    title: 'The Key Room',
    kind: 'treasure',
    speaker: 'Maud Weir',
    opening:
      'Behind the Warden’s kitchen is the key room: every key in the works on a peg, each tagged in the crew’s square hand, a crate of brine shrimp, the only chart of the tunnels ever drawn, and a basket of grey wool socks, folded in pairs. ‘One pair for everyone who went up my landward way,’ Maud says. ‘Fenn had the last. I’ve gone on knitting. Take one thing. I’m writing it down.’',
    artSubject: `A small rock-cut room lined with pegs of tagged bronze keys of every size, a crate of brine shrimp, a rolled chart on a shelf and a wicker basket full of folded grey knitted socks; ${MAUD} stands in the doorway with a pencil; ${SCYLLA} and ${CHAR} look around in wonder`,
    echoes: [
      {
        flag: 'GT-32:truth',
        text: 'Maud hasn’t said whether she believes the landward part. She has let them into the key room anyway, which is a different and rarer thing.',
      },
      {
        flag: 'GT-32:show-evidence',
        text: 'Maud keeps glancing at Scylla the way you’d glance at a pipe that has started, unexpectedly, to whistle in tune.',
      },
      {
        flag: 'GT-32:char-speaks',
        text: 'Maud talks mostly to Char now. Scylla finds she doesn’t mind at all, and then that she minds a little.',
      },
    ],
    choices: [
      {
        id: 'shrimp',
        label: 'Take a scoop of brine shrimp for Sulk',
        outcome:
          'Sulk eats like a duke at a wedding and glows like one. Maud writes ‘shrimp, one scoop, Highness’ and underlines Highness, because she can.',
        gain: { battery: 2 },
        artSubject: `${SULK} blazing bright as shrimp drift into it from ${SCYLLA}’s fingers, an old sluice-keeper writing in a notebook beside her`,
      },
      {
        id: 'chart',
        label: 'Ask for the chart of the tunnels',
        outcome:
          'Maud’s hand stays on it a moment. ‘Only one ever drawn,’ she says. ‘The palace would very much like to know it exists.’ She lets go. Now the whole works fits in Scylla’s satchel, and so does the trouble.',
        gain: { evidence: 2, trust: -1 },
        artSubject: `An old sluice-keeper’s scarred hand reluctantly releasing a rolled chart into ${SCYLLA}’s hands, the key pegs glinting behind them`,
      },
      {
        id: 'socks',
        label: 'Take two pairs of socks from the basket',
        outcome:
          'Grey, thick, a little uneven at the heel. The first time, they forgot socks; Scylla remembers every blister of the first mile. ‘Two pairs,’ Maud writes, and then, after a moment, ‘for the road, if there is one.’ Char holds hers to her face and says they smell of old woman, approvingly.',
        gain: { trust: 1, danger: -1 },
        requires: { trust: 2 },
        lockedHint: 'Only if Maud trusts you (trust 2)',
        artSubject: `${SCYLLA} and ${CHAR} each holding a pair of folded grey knitted socks from a wicker basket, Char sniffing hers, an old sluice-keeper writing in a notebook in the doorway`,
      },
    ],
  },
  {
    id: 'GT-34',
    title: 'The Landward Book',
    kind: 'secret',
    speaker: 'Scylla',
    opening:
      'On the shelf above the socks lies the Warden’s other book: everyone who went up the landward way in fifty years. A cook. Two brothers. FENN DUNLIN, ‘with my socks’, and under him, in red, SHUT BY ORDER. Decades back, in a younger version of Maud’s hand: ‘A princess, alone, a pack for one. Sat at the landward sluice till the tide turned. Went back up. I didn’t ask.’ The initials beside it are their mother’s.',
    artSubject: `A worn ledger open on a rock shelf by lantern light, columns of names, one line ruled off in red, and one much older entry with a small inked crown beside it; ${SCYLLA} rests one finger on that line; ${CHAR} is half-turned toward her, about to ask`,
    echoes: [
      {
        flag: 'GT-06:letters',
        text: 'The unsent letters in Fenn’s locker were written after that red line. Every one of them is a line this book never got.',
      },
      {
        flag: 'e05:8,4:care',
        text: '‘Your mother chose,’ Oren told her in the vault. Here is the other half of that page, kept by a woman who didn’t ask.',
      },
      {
        flag: 'e05:8,4:risk',
        text: 'The page Scylla tore from Oren’s Weighing Book is folded in her satchel. It matches this line date for date.',
      },
      {
        flag: 'e04:char-lost-in-present',
        text: 'There is no book anywhere with a line for the day Char will not come back. Scylla knows exactly where on the page it would go.',
      },
    ],
    choices: [
      {
        id: 'show-char',
        label: 'Turn the book so Char can read it, and say nothing',
        outcome:
          'Char reads it twice. ‘She sat there till the tide turned,’ she says. ‘Then she went back up and became Mother.’ She doesn’t say whether that is a warning or an instruction. Scylla doesn’t ask. It is the first thing tonight they have both known at once.',
        gain: { trust: 1, evidence: 1 },
        artSubject: `${CHAR} reading a worn ledger with her lips pressed tight, ${SCYLLA} beside her saying nothing, both lit by one lantern on a rock shelf`,
      },
      {
        id: 'read-alone',
        label: 'Read the whole book yourself first',
        outcome:
          'Every name, every year. Some came back to visit. Some sent socks back down, unworn, with letters in the toes. Nobody, in fifty years, was ever caught. Char waits, then stops waiting, and goes to look at keys. Scylla knows more now than her sister does, again.',
        gain: { evidence: 2, trust: -1 },
        artSubject: `${SCYLLA} absorbed in turning the pages of a thick worn ledger while in the background ${CHAR} has turned away to look at a wall of keys`,
      },
      {
        id: 'close',
        label: 'Close it: these names are Maud’s to keep',
        outcome:
          'Scylla closes the book on her mother’s line without reading it twice. Whatever their mother nearly did is their mother’s, as Char’s road is Char’s. Maud, in the doorway, says ‘Thank you,’ as if it is something people never say down here, because it is.',
        gain: { danger: -1, trust: 1 },
        artSubject: `${SCYLLA} closing a worn ledger with both hands on a rock shelf, ${MAUD} nodding once in the doorway behind her`,
      },
    ],
  },
  {
    id: 'GT-35',
    title: 'The Breathing Heart',
    kind: 'climax',
    speaker: 'Maud Weir',
    opening:
      'The Heart fills a cavern the size of the throne room: one great bronze pump, ribbed like a whale, breathing the whole palace. Seven sluices open off it like fingers. The seventh, landward, has stood chained four years with a bare spindle. Maud fits the wheel she kept, and puts the master sluice key in Scylla’s hand, heavy as a crown and less decorative. ‘Forty-one times my crew asked, and forty-one times upstairs said no. Tonight, you’re upstairs.’',
    artSubject: `A vast underwater cavern dominated by an enormous ribbed bronze-and-sharkskin pump breathing slowly, seven great sluice tunnels branching from it, the seventh chained shut with a bronze wheel newly fitted to its spindle; ${MAUD} presses a heavy bronze key into the hand of ${SCYLLA}; ${CHAR} watches the chained sluice`,
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'The last gate Scylla saw opened let a carriage of strangers live and took her sister. Her hand on the key remembers it, though this hand has never held it.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'The last gate she held, she held shut, and a train of people stayed in the dark so Char could live. The seventh sluice is chained exactly the same way.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'The last time she turned a sea aside, it went down a channel to a yard that was meant to be empty. She looks at all seven sluices and asks who lives at the end of each.',
      },
      {
        flag: 'entry:current',
        text: 'The observatory’s Throat is drawing hard, the way she left it for a crab’s sake, and the Heart with it. Whatever she turns here moves at once, and the palace will feel it before she is up the ladder.',
      },
      {
        flag: 'entry:still',
        text: 'With the observatory’s intake shut the Heart breathes slow and deep. Whatever she turns here will move on its next long breath, and the apprentices upstairs will be the first to feel it.',
      },
      {
        flag: 'e05:7,7:care',
        text: 'Tansy’s letter to Fenn is in her satchel. Four years of jars are racked at the foot of that channel. They could go up on the next tide.',
      },
      {
        flag: 'e05:7,7:risk',
        text: 'Marl’s words are in her head: a princess goes missing by a road, they close it, and nobody’s letters go anywhere. This road is closed already. Nobody’s are.',
      },
    ],
    choices: [
      {
        id: 'open-road',
        label:
          'Open the landward sluice and leave it open, for anyone who wants the road',
        outcome:
          'She turns the key, then the wheel, until the chain drops and the Heart breathes out landward with its whole chest for the first time in four years. The road is open: for the Dunlins, the crew, the jars, Fenn coming home, two sisters or none. Every dial upstairs will swing toward it by breakfast. The crown must decide what kind of crown shuts it twice, and Maud will be the one asked.',
        gain: { trust: 2, danger: 2 },
        artSubject: `${SCYLLA} hauling a great bronze wheel round as a chain falls from the seventh sluice and a vast current pours away down it, ${CHAR} and ${MAUD} braced against the rush beside her`,
      },
      {
        id: 'keep-secret',
        label:
          'Map the road for you and Char alone, and leave it shut to everyone else',
        outcome:
          'Scylla turns nothing. She maps it with Maud’s chalk: culvert, Heart, wheel, how long the sluice takes to open and close behind two swimmers. Two copies, one per sister. Maud agrees to open it once, at their hour, and shut it after, in the voice of someone adding a line she’d rather not. To everyone else it stays what the crown made it. Request forty-two will be refused like the rest.',
        gain: { evidence: 2, danger: -1, trust: -1 },
        artSubject: `${SCYLLA} drawing a careful route map on paper by lantern light beneath the chained seventh sluice, a second folded copy held out to ${CHAR} the great pump breathing behind them`,
      },
      {
        id: 'give-key',
        label: 'Hand Char the master key and let her decide what it opens',
        outcome:
          'Not the map, not the reasons: the key. Char weighs it, the way Oren would. ‘What does it open?’ ‘Everything down here.’ Char threads it onto her black lace and lets it hang. ‘Then I’ll decide when I know what I’m deciding,’ she says, and doesn’t say when. Maud laughs once, like a pipe clearing. Scylla has never felt less in charge, or more like a sister.',
        gain: { trust: 2, evidence: -1, danger: 1 },
        artSubject: `${CHAR} threading a heavy bronze key onto a black lace ribbon round her neck, ${SCYLLA} standing back with empty open hands, ${MAUD} laughing beside the chained sluice`,
      },
    ],
  },
  {
    id: 'GT-36',
    title: 'The Pantry Ladder',
    kind: 'exit',
    speaker: 'Scylla',
    opening:
      'Behind the Heart a crew ladder climbs three hundred rungs through the rock to a hatch under the palace pantry. Above, the palace is waking: lamp-jellies brightening, cooks setting out kelp cakes, every tide clock ticking toward the gate. Below, the works breathes on, as it has the whole of both her lives. Maud doesn’t see them off. She says she has never once watched anyone go, and isn’t starting with royals.',
    artSubject: `A long narrow bronze ladder climbing up through a rock shaft underwater toward a square hatch rimmed with warm kitchen light; ${CHAR} climbs ahead; ${SCYLLA} follows holding ${SULK}; far below, a great ribbed pump glows faintly`,
    echoes: [
      {
        flag: 'GT-35:open-road',
        text: 'Behind them the seventh sluice stands open and the first jars are already rising on the landward tide. By noon the palace will know there is a road, and so will everyone who ever wanted one.',
      },
      {
        flag: 'GT-35:keep-secret',
        text: 'Two folded maps ride in two satchels. The palace above has no idea it sits on a road, and nobody else who needs one will hear of it from Scylla.',
      },
      {
        flag: 'GT-35:give-key',
        text: 'The master key swings at Char’s throat on the black lace, knocking each rung. She hasn’t said what she will open. Scylla climbs below her and doesn’t ask.',
      },
      {
        flag: 'entry:current',
        text: 'The observatory’s Throat is still drawing hard far behind them, the current Scylla fought for a crab; she can feel it in the rungs most of the way up.',
      },
      {
        flag: 'entry:still',
        text: 'Halfway up they pass the observatory apprentices coming down with lamps, arguing about valves, and flatten into a side-niche to let science go by.',
      },
    ],
    choices: [
      {
        id: 'climb',
        label: 'Climb toward the pantry and the morning',
        outcome:
          'At the top Char shoulders the hatch into a pantry full of kelp cakes and a very surprised cook, who looks at two princesses rising out of her floor and decides, like so many people this week, that she hasn’t seen them. Scylla thanks her anyway. The gate is nearer than it was, and whatever happens there, the sea underneath will go on breathing.',
        artSubject: `${CHAR} pushing up a floor hatch into a warm lamplit palace pantry stacked with kelp cakes, a startled round-faced cook in an apron frozen mid-step, ${SCYLLA} climbing up behind her sister`,
      },
    ],
  },
]
