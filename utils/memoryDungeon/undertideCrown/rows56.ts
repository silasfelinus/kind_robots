import type { MorrowShiftSite } from '../morrowShift/types'

const STYLE =
  'same mermaid palace distorted by impossible tides, confiscated choices and duplicate royal portraits'
const SCYLLA =
  'a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze'
const CHAR =
  'her identical twin with dark violet scales, black lace and a sardonic grin'
const BRAM =
  'a lanky, irreverent court musician with an eel-grey tail and a drumstick tucked behind one ear'
const OREN =
  'a very tall, broad headsman whose whole head is covered by a rough brown cloth hood with two eyeholes, a heavy axe at his side and a long dark eel-grey tail'
const WENNA =
  'a lean middle-aged tidal scholar with ink-stained fingers, a brass loupe on a cord and a silver-scaled tail'
const HESTER =
  'a stout elderly costumer with spectacles and a pincushion bracelet'
const CLERK =
  'a young grey-robed court clerk carrying a slate of grey confiscation tags'

export const UNDERTIDE_CROWN_ROWS_5_6: readonly MorrowShiftSite[] = [
  {
    key: '1,5',
    place: 'Coronet Rack',
    title: 'Crowns in Pairs',
    speaker: 'Scylla',
    kind: 'treasure',
    instant: true,
    opening:
      'The coronet rack behind the bandstand has filled up overnight, and every crown on it now hangs in pairs that disagree. Char’s smallest crown is there twice: once crusted with black limpets and the fish bone she glued on at six, and once polished plain, the way the court would rather remember her. The true one wears a grey confiscation tag. The plain one has none.',
    artSubject: `Behind a shell-canopied bandstand, a tall rack of outgrown royal coronets hangs in identical pairs that do not quite match, swaying in a current that runs the wrong way; ${SCYLLA} kneels at the bottom before two tiny crowns, one crusted with black limpets and a glued fish bone and wearing a grey tag, one polished plain; ${STYLE}.`,
    choices: [
      {
        id: 'notice',
        label: 'Take back the crown with the fish bone',
        outcome:
          'The tag tears free with a sound like a held breath. Under the fish bone the emergency seed pearl is still wedged where six-year-old Char hid it; the court did not know to look. When Scylla turns round, the plain crown has slid along the rack to fill the gap.',
        effects: { supplies: 1, evidence: 1 },
        artSubject: `${SCYLLA} clutching a tiny limpet-crusted crown with a torn grey tag drifting away, a seed pearl in her palm, while behind her on the rack a polished plain crown has silently moved into the empty hook.`,
      },
    ],
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'The plain crown belongs to a Char who never glued anything to anything. Scylla takes the other. It belongs to the sister she watched die on land, and to the girl two corridors away, alive, shouting at a drummer. The court would like her to choose one.',
      },
      {
        flag: 'e05:stay',
        text: 'They stayed, last time, and the palace was grateful. The polished crown is what its gratitude looks like: a Char with nothing glued on.',
      },
    ],
  },
  {
    key: '2,5',
    place: 'Festival Invitation Table',
    title: 'Letters in Her Hand',
    speaker: 'Char',
    kind: 'companion',
    opening:
      'Char’s letters are back on the invitation table, in her handwriting, saying things she never wrote: that she is content, that she will remain, that she thanks the court for its care. The originals are gone. Char is writing them again with a quill gripped like a knife. ‘That’s my hand,’ she says. ‘Those are not my words. Hold these, and don’t you dare improve them.’',
    artSubject: `A long festival table heaped with identical folded letters, every stack a neat copy of the last; ${CHAR}, grin gone hard, writes fast with a quill gripped like a dagger, while ${SCYLLA} holds a pile of pages face-down; a grey-robed clerk hovers at the far end; no legible writing; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label: 'Hold the stack and don’t read a word',
        outcome:
          'Scylla holds the letters face-down while Char writes, fast, furious and misspelt. By the time a clerk drifts over with his tag slate, the new letters are inside Char’s lace sleeve. ‘Mine,’ she tells him. He looks at the floor, and goes.',
        effects: { trust: 2, danger: 1 },
        artSubject: `${CHAR} tucking folded letters into her black lace sleeve and staring down a grey-robed clerk, who looks at the floor, while ${SCYLLA} holds a blank stack face-down beside her.`,
      },
      {
        id: 'risk',
        label: 'Tell her what she wrote the first time, so she gets it right',
        outcome:
          'Scylla recites the letters she remembers, word for word. Char’s quill stops. ‘I don’t want what some other me wrote,’ she says. ‘I want what I’m writing now.’ She crosses out a line, and then, after a long look at Scylla, the one before it.',
        effects: { evidence: 1, trust: -2 },
        artSubject: `${CHAR} striking a hard line through a page with her quill, eyes fixed on ${SCYLLA}, who has one hand raised mid-recital; no legible writing.`,
      },
    ],
    echoes: [
      {
        flag: 'e05:2,5:care',
        text: 'Last time Scylla checked only the spelling here. The forgeries are spelt perfectly. Char notices that before Scylla does, and it makes her angrier.',
      },
      {
        flag: 'e05:2,5:risk',
        text: 'Among the forgeries is the small folded scrap from last time, flattened out and addressed to Mother in a hand almost Char’s. Char tears it in half without reading it.',
      },
      {
        flag: 'e05:tell-char',
        text: 'Scylla told Char the future, last time. The forged letters say Char has forgotten it. ‘I haven’t,’ Char says loudly, to the table, as if it might be listening.',
      },
    ],
  },
  {
    key: '3,5',
    place: 'Festival Mask Chest',
    title: 'The Official Order',
    speaker: 'Bram Lowry',
    kind: 'puzzle',
    opening:
      'The mask chest has a new lock, still three pearl sockets, and the court has cut its rule into the lid over Char’s old chalk: THE HEIR BEFORE THE SPARE. THE PEOPLE NEVER BEFORE A PRINCESS. Bram Lowry taps it with a drumstick. ‘White is the heir, and they’ve decided that’s you. Black is your sister. Rose is the rest of us. It only opens for the official version.’',
    artSubject: `A carved coral chest beside a festival bandstand, its lid freshly carved over smudged chalk, a lock of three empty pearl sockets; ${BRAM} taps the lid with his drumstick, unsmiling, while ${SCYLLA} weighs a white, a black and a rose pearl in her palm; no legible writing; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label: 'Set the pearls white, black, rose',
        outcome:
          'The lid opens without a sound. Under the festival masks lie two plain travel hoods pinned with grey confiscation tags, and a third, man-sized, with a drumstick through its tag. ‘They took mine as well,’ says Bram. ‘I was going to see you off.’',
        effects: { evidence: 2, supplies: 1 },
        artSubject: `An open coral chest of glittering masks, beneath them three plain grey travel hoods each pinned with a grey tag, one with a drumstick through it; ${BRAM} lifts that one, quiet, as ${SCYLLA} looks on.`,
      },
      {
        id: 'risk',
        label: 'Set the pearls black, white, rose, as Char always did',
        outcome:
          'The lock spits the black pearl back out across the court. High above the colonnade a witness bell tolls once, as if it heard someone try the unofficial version. Bram fishes the pearl out of a fountain and says nothing at all.',
        effects: { danger: 1, evidence: -1 },
        artSubject: `A black pearl shooting from a coral lock across a lantern-lit court, ${SCYLLA} flinching, ${BRAM} looking up toward a small bronze bell swinging high above a pearl colonnade.`,
      },
      {
        id: 'rose-first',
        label: 'Set the pearls rose, black, white',
        outcome:
          'Nothing moves. Bram smiles without much in it. ‘The rest of us first? Not in this court, Highness. That was rather the point of the lock.’',
        effects: { trust: -1 },
        artSubject: `${SCYLLA} frowning at a shut coral chest with a rose pearl in its first socket, ${BRAM} leaning on the carved lid with a thin, tired smile.`,
      },
    ],
    echoes: [
      {
        flag: 'e05:3,5:risk',
        text: 'Last time Char’s order opened this chest. Scylla’s fingers go to the black pearl first, out of habit, and she has to stop them.',
      },
      {
        flag: 'e05:3,5:care',
        text: 'Last time, white first stung her palm. Now the lid has been rewritten to want exactly that, and she hates how much it feels like being agreed with.',
      },
      {
        flag: 'e05:3,5:rose-first',
        text: 'Last time Bram asked when Char ever let everyone else go first. He doesn’t joke about it now; the court has carved its own answer into the lid.',
      },
    ],
  },
  {
    key: '4,5',
    place: 'Festival Eel Globes',
    title: 'Eight Bars, Again',
    speaker: 'Char',
    kind: 'monster',
    opening:
      'Every eel globe in the Festival Court has cracked, and the eels are loose and crackling among the dancers, who do not stop dancing. They cannot: the rehearsal has been ordered perfect, and it loops the same eight bars while blue light jolts through them and their smiles hold. Char has a lantern net and murder in her eyes. ‘Don’t,’ she says, as Scylla reaches out. ‘You always take the net. Not today.’',
    artSubject: `A pearl-columned festival court flickering with crackling blue light, several oar-long glowing eels loose among ribboned dancers frozen mid-step in identical smiling poses, repeating; ${CHAR} grips a lantern net, blocking ${SCYLLA}'s outstretched hand; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label: 'Pull the dancers out of the loop while Char takes the eels',
        outcome:
          'Scylla grabs wrists and hauls, one dancer at a time, out of the eight bars and into stillness. Each comes back blinking, then weeping. Char nets three eels, takes a jolt that stands her lace on end, swears magnificently, and does not need help.',
        effects: { trust: 2, danger: 1 },
        artSubject: `${SCYLLA} hauling a weeping dancer out of a ring of frozen smiling dancers, while behind her ${CHAR}, lace standing on end from a blue jolt, nets a glowing eel and swears.`,
      },
      {
        id: 'risk',
        label: 'Take the net from Char and do it the way you know works',
        outcome:
          'The catch is clean; Scylla has done this before. The eels go quiet. The dancers do not, because nobody pulled them out. Char stands empty-handed in the blue light. ‘You’re doing my life at me,’ she says. ‘Stop it.’',
        effects: { danger: -1, trust: -2 },
        artSubject: `${SCYLLA} sweeping a net neatly around a glowing eel while dancers keep looping behind her, and ${CHAR} floats empty-handed in the blue light, furious.`,
      },
      {
        id: 'cut-the-beat',
        label: 'Cut the lantern line that keeps the rehearsal’s beat',
        outcome:
          'The beat dies and the dancers drop out of the loop in a heap, gasping, free. The guards come for the noise, and they do not look at the eels. They look at the princess holding a cut line.',
        effects: { trust: 1, danger: 2 },
        artSubject: `Dancers collapsing in a gasping heap as a severed lantern line drifts down, ${SCYLLA} holding its cut end, two armoured guards turning toward her across the court.`,
      },
    ],
    echoes: [
      {
        flag: 'e05:4,5:care',
        text: 'Last time Scylla let Char make the catch here. Char doesn’t remember it, but she grips the net like someone who expects to be allowed.',
      },
      {
        flag: 'e05:4,5:risk',
        text: 'Last time Scylla took the net out of Char’s hands on this spot. A net is lying on that spot now, waiting for her to do it again.',
      },
      {
        flag: 'e05:4,5:call-the-guard',
        text: 'Last time Scylla sent for the guard. The guards are already here, at the edge of the circle, counting dancers, not eels.',
      },
    ],
  },
  {
    key: '5,5',
    place: 'Festival Bandstand',
    title: 'And Stay, and Stay',
    speaker: 'Bram Lowry',
    kind: 'memory',
    opening:
      'The farewell song is forbidden no longer: the court has taken it. Bram Lowry plays it every hour, a clerk at his elbow with a slate, and the words are changed. Every verse now ends ‘and stay, and stay’. Across the court, listeners stop mid-stroke and turn gently toward the palace. Char has her hands clamped over her ears. Bram’s jaw is set. He is watching Scylla.',
    artSubject: `A shell-canopied bandstand where ${BRAM} drums with a set jaw beside two fiddlers, a grey-robed clerk at his elbow with a slate; across the lantern-lit court, swimmers have stopped mid-stroke and all turned the same way, toward the palace; ${CHAR} clamps her hands over her ears beside ${SCYLLA}; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label: 'Sing the old words over the new ones, with Char',
        outcome:
          'Char sings first; she was always going to. Scylla comes in on the second line, and Bram, grinning savagely, drops a beat so the old words land on top. All over the court listeners blink and look round, as if waking. The clerk writes three names, and above them a witness bell begins to toll.',
        effects: { trust: 2, evidence: 1, danger: 1 },
        artSubject: `${CHAR} and ${SCYLLA} singing defiantly at the bandstand's edge, ${BRAM} drumming with a fierce grin, swimmers across the court turning and blinking awake, a clerk scratching at his slate as a bronze bell swings overhead.`,
      },
      {
        id: 'risk',
        label: 'Lay a hand on the drum and stop the song',
        outcome:
          'Scylla lays her palm flat on Bram’s drum and the fiddles falter. The listeners come back to themselves, quietly, and no bell tolls. The clerk records that a princess kept order. Char lowers her hands. ‘Quiet works,’ she says. ‘Nobody got to choose it but you.’',
        effects: { danger: -2, trust: -1 },
        artSubject: `${SCYLLA} pressing her palm flat on a drumhead as fiddlers lower their bows, swimmers across the court drifting free, a clerk nodding approval, and ${CHAR} lowering her hands from her ears, staring at her sister.`,
      },
    ],
    echoes: [
      {
        flag: 'e05:5,5:care',
        text: 'Last time Scylla sang the forbidden verse here, and a patrol decided not to have heard. The court has heard since. That is why the song is official now.',
      },
      {
        flag: 'e05:5,5:risk',
        text: 'Last time Scylla stopped this song with a hand on the drum. The new verse goes quiet in exactly that bar, every hour, as if the court learned its silence from her.',
      },
      {
        flag: 'e05:run-again',
        text: 'They ran, last time. The new verse names the dawn they left on, and asks it, very sweetly, to come home.',
      },
      {
        flag: 'e05:stay',
        text: 'They stayed, last time. Every ‘and stay’ lands like the morning after: the doors unlocked, the guards kind, and nobody ever leaving.',
      },
      {
        flag: 'e04:char-lost-in-present',
        text: 'Years from now, on land, an older Char hummed the true version over the washing. Scylla will not let the court have it.',
      },
    ],
  },
  {
    key: '6,5',
    place: 'Costume Fin Stall',
    title: 'Gold, by Order',
    speaker: 'Hester Mull',
    kind: 'merchant',
    instant: true,
    opening:
      'Hester Mull’s costume stall sells one costume now: procession gold, in every size, by order. The plain grey wraps are gone, the faded seahorse suit hangs tagged for confiscation, and Hester stands among the gold with a face like a locked door. Then she glances at the seahorse, and at Scylla, and taps the seahorse’s belly twice.',
    artSubject: `An underwater costume stall hung entirely with identical gold procession fin-wraps in every size, a faded seahorse costume tagged in grey at the back; ${HESTER} stands stiffly among the gold, tapping the seahorse's belly, as ${SCYLLA} offers a single pearl; ${STYLE}.`,
    choices: [
      {
        id: 'notice',
        label: 'Trade a pearl for whatever is inside the seahorse',
        outcome:
          'Hester takes the pearl and unpicks a seam. Inside the seahorse, folded small, are two plain grey fin-wraps. ‘I rented to runaways before the court had a record,’ she mutters, ‘and I’ll rent to them after.’ She wraps the grey in gold paper, as camouflage.',
        effects: { supplies: 1, trust: 1 },
        artSubject: `${HESTER} pulling two plain grey fin-wraps from an unpicked seam in a seahorse costume and wrapping them in gold paper, ${SCYLLA} watching, a bitten pearl on the counter.`,
      },
    ],
    echoes: [
      {
        flag: 'e05:6,5:notice',
        text: 'Hester looks at the pearl and goes pale. ‘You paid me in one of these last time,’ she says, which she cannot know. Then she looks frightened that she said it.',
      },
    ],
  },
  {
    key: '7,5',
    place: 'Moon Post',
    title: 'The Court’s Knot',
    speaker: 'Char',
    kind: 'memory',
    opening:
      'Every ribbon on the Moon Post has been retied in the night: hard, true knots, promises to stay, the court’s knot on every royal ribbon, Char’s included. She is sawing at hers with a broken shell and getting nowhere. The ribbon-keeper hovers nearby with her hands twisted together, not stopping her. ‘It’s my ribbon,’ Char says through her teeth. ‘It’s my knot. Nobody asked me.’',
    artSubject: `A tall pearl-inlaid post in a moonlit corner of the court, hundreds of ribbons all pulled into identical hard knots; ${CHAR} saws at a black ribbon with a broken shell while ${SCYLLA} floats beside her and an elderly ribbon-keeper hovers behind, wringing her hands; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label: 'Hold the ribbon taut so Char can cut her own',
        outcome:
          'Scylla holds it and says nothing. It takes Char eleven furious strokes. The ribbon parts, and the ribbon-keeper quietly presses a small knife into Char’s palm for next time and swims off before anyone sees. Char ties a slipknot, her own, badly, and grins.',
        effects: { trust: 2, danger: 1 },
        artSubject: `${SCYLLA} holding a black ribbon taut as ${CHAR} saws through it with a shell, an elderly ribbon-keeper slipping a small knife into Char's free hand.`,
      },
      {
        id: 'risk',
        label: 'Untie it for her; you know this knot',
        outcome:
          'Scylla’s fingers find the trick of it as if they had done it before; perhaps they have. Two moves and the knot falls open. Char looks at the loose ribbon, then at her sister’s hands. ‘I said it was mine.’ She ties it back on, hard, so she can cut it herself.',
        effects: { evidence: 1, trust: -1 },
        artSubject: `${CHAR} yanking a black ribbon back into a hard knot on a moonlit post, glaring at ${SCYLLA}, whose deft hands are still raised.`,
      },
      {
        id: 'cut-your-own',
        label: 'Cut your own ribbon first, and leave hers to her',
        outcome:
          'Scylla’s silver ribbon parts with one clean stroke and drifts up off the post. Char stops sawing to watch it go. ‘Show-off,’ she says, and goes back to her own knot, slower now, and not alone. The ribbon-keeper writes nothing down.',
        effects: { trust: 1, danger: 1 },
        artSubject: `A cut silver ribbon drifting up through moonlit water from a post of hard knots, ${CHAR} pausing mid-saw to watch it, ${SCYLLA} lowering a shell blade.`,
      },
    ],
    echoes: [
      {
        flag: 'e05:7,5:care',
        text: 'Last time two slipknots hung side by side here, and the ribbon-keeper reported them. She whispers so to Scylla now, and that she is sorry, and that she will not report anything again.',
      },
      {
        flag: 'e05:7,5:risk',
        text: 'Last time Scylla tied her ribbon fast and true, a promise to stay. The court has copied her knot onto every ribbon on the post.',
      },
      {
        flag: 'e05:7,5:tie-for-strangers',
        text: 'The third ribbon, the one Scylla tied for strangers, still hangs loose. It is the only ribbon the court has not retied; nobody could decide whose it was.',
      },
    ],
  },
  {
    key: '8,5',
    place: 'Drift-Night Table',
    title: 'Inconvenient',
    speaker: 'Scylla',
    kind: 'challenge',
    opening:
      'The drift table is being cleared. A young clerk sweeps the year’s sunken land things into a confiscation sack, kettle lid, spectacle lens, every scrap of paper, tagging each one ‘inconvenient’. The merchildren who dared each other to touch the drift are lined up to say they never did. The smallest is hiding the bent spoon behind her back. The clerk’s hands, Scylla sees, are shaking.',
    artSubject: `A long driftwood table in a lantern-lit court being swept bare by ${CLERK} into a sack, a line of small merchildren waiting stiffly, the smallest hiding a bent spoon behind her back; ${SCYLLA} watches the clerk's trembling hands; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label: 'Stand in front of the children and answer the clerk yourself',
        outcome:
          'Scylla gives her name, her rank and a statement that she touched everything. The clerk writes it down with visible relief and lets the children go. A witness bell tolls once for her testimony. The smallest girl swims off with the spoon, and nobody stops her.',
        effects: { trust: 2, danger: 2 },
        artSubject: `${SCYLLA} standing between a line of merchildren and a trembling clerk, speaking, as the smallest child slips away clutching a bent spoon and a bronze bell swings overhead.`,
      },
      {
        id: 'risk',
        label:
          'Slip the spectacle lens up your sleeve while he tags the kettle',
        outcome:
          'The lens goes up Scylla’s sleeve, cold against her wrist. The clerk counts his sack, counts again, and goes white: a missing item is his fault. He looks at her. She looks back. He writes the full number down anyway, and his hand shakes worse.',
        effects: { evidence: 2, danger: 1, trust: -1 },
        artSubject: `${CLERK} staring white-faced into a sack, while ${SCYLLA} holds very still, a glint of glass just visible at her cuff.`,
      },
      {
        id: 'hand-it-over',
        label: 'Have the girl give up the spoon, so the children are let go',
        outcome:
          'The smallest girl gives up the spoon because a princess asked her to. The children are let go. The spoon is tagged and sacked. It was the right size for a small hand, and now it is evidence that nothing happened.',
        effects: { danger: -1, trust: -1, evidence: -1 },
        artSubject: `A tiny merchild holding out a bent spoon to a grey-robed clerk while ${SCYLLA} rests a hand on her shoulder, the other children drifting away behind them.`,
      },
    ],
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'Into the sack goes a cuff of black lace, land-stitched, a grown woman’s size. Scylla knows whose wrist it will be made for. She has to watch it tagged.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'A swollen season ticket goes into the sack, from a train Scylla left behind glass beneath the sea. The clerk tags it without looking: never happened.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'A child’s shoe goes into the sack, from a district Scylla was promised was empty. The clerk tags it ‘empty district’ and will not meet her eyes.',
      },
    ],
  },
  {
    key: '1,6',
    place: 'Observatory Doorframe',
    title: 'One Girl Measured Twice',
    speaker: 'Scylla',
    kind: 'memory',
    instant: true,
    opening:
      'The observatory doorframe has been planed and recut. The court’s marks show the twins at exactly the same height every year, two identical scratches, as if the sisters were one girl measured twice. Every finger-high mark of Char’s puffed-up hair has been sanded away. All but one, cut deep and fresh, too high for anyone to reach without standing on something.',
    artSubject: `A carved coral observatory doorframe, freshly planed, scored with neat paired height marks at identical heights, and one deep rough scratch far above them; ${SCYLLA} stands against it, looking up, lit green by glass dials inside; ${STYLE}.`,
    choices: [
      {
        id: 'notice',
        label: 'Put your back to the frame',
        outcome:
          'The court’s scratches slide along the coral to meet Scylla’s head, however she stands. She crouches; they follow her down. Then Char, swimming past, cuts a new mark a finger above her with a shell. That one stays where it is put.',
        effects: { trust: 1, evidence: 1 },
        artSubject: `${SCYLLA} crouching against a doorframe as neat scratches creep down the coral to follow her head, while ${CHAR} swims past and cuts a rough mark above her with a shell.`,
      },
    ],
    echoes: [
      {
        flag: 'e05:1,6:notice',
        text: 'Last time Char scratched a cheeky mark above Scylla’s head here. It has been sanded off, but the groove is still there if you feel for it, and Scylla does.',
      },
    ],
  },
  {
    key: '2,6',
    place: 'Scholar’s Workbench',
    title: 'The Quiet Lesson',
    speaker: 'Scylla',
    kind: 'memory',
    opening:
      'Wenna Brack’s workbench has been cleared of her notebooks and stacked with blank official ledgers, to be filled in with the approved tides. But something has drifted into the one drawer the clerks forgot: a photograph in a clear sleeve. Scylla knows Earth when she sees it: daylight through a lab window, a notebook full of patient questions, and someone drawing the machine instead of writing the answer.',
    artSubject: `A scholar's workbench in a green-lit underwater observatory, piles of identical blank ledgers where notebooks used to be, one small drawer pulled open; ${SCYLLA} lifts a photograph in a clear plastic sleeve, its image turned away from the viewer; ${STYLE}.`,
    choices: [],
    echoes: [
      {
        flag: 'e05:2,6:notice',
        text: 'Last time Scylla pocketed a cracked tide-glass from this bench. Its empty cradle has been tagged: never made.',
      },
    ],
  },
  {
    key: '3,6',
    place: 'Current Dials',
    title: 'Which Way Is Out',
    speaker: 'Scylla',
    kind: 'puzzle',
    opening:
      'The three current dials have learned to loop: a current that pours into another dial runs back to this morning. On the rim, where the clerks have not planed yet, Wenna has scratched her readings. Only one current still runs to the landward gate. The scallop now pours into the conch. The conch never points outward. Scylla’s memory says the scallop, at dawn. Her memory is from before the rules changed.',
    artSubject: `Three great glass dials in a brass rim, conch, whelk and scallop, their currents visibly pouring into one another in loops, one thin current escaping past the rim; ${SCYLLA} traces scratched marks on the half-planed rim with a fingertip; no legible writing; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label: 'Follow the whelk dial',
        outcome:
          'The whelk’s current curls once round the dome, past the Glass Throat and out, to the gate, at an hour that is not the hour Scylla remembers. She traces the new hour onto her palm. It is the first thing all day that has not happened before.',
        effects: { evidence: 2 },
        artSubject: `${SCYLLA} following a thin glowing current out of a whelk dial with her fingertip as it slips past the brass rim and away, tracing a line on her palm.`,
      },
      {
        id: 'risk',
        label: 'Follow the scallop, the way you remember',
        outcome:
          'The scallop pours into the conch, the conch spins it round, and the glass shows a morning: this one, with the same breakfast bell. Scylla’s memory was right once. It is not right now. She loses an hour finding her way out of it.',
        effects: { danger: 1, supplies: -1 },
        artSubject: `${SCYLLA} staring into a glass dial whose swirling current shows a tiny glowing image of the same palace breakfast hall, over and over.`,
      },
      {
        id: 'conch',
        label: 'Follow the conch dial',
        outcome:
          'The conch carries her current neatly back into the palace, exactly as Wenna wrote. Scylla rereads the rim with her face hot. The rules were all there. She only had to read them instead of remembering.',
        effects: { supplies: -1 },
        artSubject: `${SCYLLA} rubbing her forehead beside a conch dial whose current curls back toward a tiny glowing model of the palace.`,
      },
    ],
    echoes: [
      {
        flag: 'e05:3,6:care',
        text: 'Last time the still scallop was the landward way. Scylla’s eyes go to it first and have to be dragged off.',
      },
      {
        flag: 'e05:3,6:risk',
        text: 'Last time the conch spun her out toward the deep. She trusts it now about as far as she trusts her own memory.',
      },
      {
        flag: 'e05:3,6:whelk',
        text: 'Last time the whelk curled back to the kitchens and Scylla laughed at herself. Nobody laughs in the observatory now.',
      },
    ],
  },
  {
    key: '4,6',
    place: 'Intake Grate',
    title: 'The Glass Throat',
    speaker: 'Scylla',
    kind: 'dungeon',
    opening:
      'The Glass Throat is choking. The intake grate is packed with what the court has fed it, letters, ribbons, drift, a doll in black lace, everything inconvenient, pressed flat against the bars by the draw. Below, the old service tunnels breathe back up, and in the breath Scylla hears voices from earlier today saying the same things again. A hermit crab is pinned to the grate, its borrowed shell nailed on.',
    artSubject: `A dim green-lit shaft where a great round glass-and-brass intake grate is clogged with pressed-flat letters, ribbons and a small doll in black lace, a hard current streaming through; a tiny hermit crab with a nail through its shell is pinned to the bars as ${SCYLLA} braces on a brass rail; dark tunnels below; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label: 'Pull out what the throat hasn’t swallowed yet',
        outcome:
          'Scylla braces on the rail and works things free: two letters, a ribbon, and the crab, which she cups against her chest; she leaves its nail for the nursery keeper, who knows how to draw one out kindly. The draw takes her tail out from under her twice. Below the bars, the tunnels go on breathing. She has not gone down. Not yet.',
        effects: { trust: 1, danger: 1, supplies: 1 },
        artSubject: `${SCYLLA}, hair streaming sideways in the draw, clinging to a brass rail with a rescued letter and ribbon tucked at her waist and a tiny nailed-shell crab cupped to her chest.`,
      },
      {
        id: 'risk',
        label: 'Lean down to the bars and listen to what the shaft repeats',
        outcome:
          'The tunnels give Scylla back her own voice, and Char’s, and the court’s, all from this morning and a little out of order, as if the palace is rehearsing which version to keep. Something down there is keeping score. She pulls back before it reaches her name.',
        effects: { evidence: 2, danger: 1 },
        artSubject: `${SCYLLA} with her ear pressed to a clogged glass grate, eyes wide, faint pale shapes of her own and her sister's faces drifting up through the dark shaft below.`,
      },
    ],
    echoes: [
      {
        flag: 'e05:4,6:care',
        text: 'Last time Scylla pulled a crab in a silver thimble from these bars. The thimble is here again, empty, nailed to the grate.',
      },
      {
        flag: 'e05:4,6:risk',
        text: 'Last time Scylla shut the intake valve and the observatory went blind for an hour. The valve wheel has been chained open ever since, and the chain is tagged with her name.',
      },
    ],
  },
  {
    key: '5,6',
    place: 'Tide Table Desk',
    title: 'Two Ledgers',
    speaker: 'Oren Pike',
    kind: 'companion',
    opening:
      'Oren Pike sits at the tide-table desk with two ledgers open. One is the court’s, its tides copied out as ordered, every one looping back to no departure. The other is his own, in the same printed-neat hand: what the water actually does. ‘A clerk collects at the turn of the glass,’ he says. ‘He takes one book. I would like the princess whose departure it is to tell me which.’',
    artSubject: `${OREN} at a brass reading desk in a green-lit observatory with two identical-looking ledgers open side by side, an hourglass nearly run out beside them; ${SCYLLA} stands at the desk's edge; no legible writing; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label: 'Tell him it’s Char’s to decide, and send for her',
        outcome:
          'Oren nods, as if that was the answer he had counted on. A page goes for Char. The clerk arrives first and is made to wait, with great courtesy, by a very large hooded man. Char comes in out of breath, looks at both books, and chooses without asking anyone.',
        effects: { trust: 2, danger: 1 },
        artSubject: `${CHAR} bursting in breathless to a brass desk, one hand flat on a ledger, while ${OREN} courteously blocks a waiting grey-robed clerk and ${SCYLLA} steps back.`,
      },
      {
        id: 'risk',
        label:
          'Hand the clerk the court’s book yourself, to keep the true one safe',
        outcome:
          'It works. The clerk takes the false book and goes. Oren tucks the true one inside his jerkin and writes in it, in small square letters: decided by H. Scylla on behalf of H. Char. ‘I count what is there,’ he says, not unkindly.',
        effects: { supplies: 1, evidence: 1, trust: -1 },
        artSubject: `A grey-robed clerk swimming off with a ledger, while ${OREN} writes a small line in a second book held close to his chest and ${SCYLLA} watches; no legible writing.`,
      },
      {
        id: 'give-both',
        label: 'Give the clerk both books and let the court sort it out',
        outcome:
          'The clerk holds two incompatible tide tables and goes grey; he cannot file both, and he cannot throw either away. He leaves with both, to ask someone senior. ‘That,’ says Oren, ‘was not safe. It was, however, accurate.’',
        effects: { evidence: 1, danger: 2, trust: 1 },
        artSubject: `A grey-robed clerk clutching two ledgers with a stricken face, ${OREN} and ${SCYLLA} watching him go from behind a brass desk.`,
      },
    ],
    echoes: [
      {
        flag: 'e05:5,6:care',
        text: 'Char’s line in Oren’s own book is still blank from last time. The clerks have filled it four times. Oren has scraped it clean four times.',
      },
      {
        flag: 'e05:5,6:risk',
        text: 'The hour Scylla gave Oren last time is in both books. In the court’s, it has been struck out and replaced with ‘never’.',
      },
      {
        flag: 'e05:4,4:care',
        text: 'There is a third pack in Oren’s own book, entered very small, under ‘stranded’. He doesn’t mention it.',
      },
      {
        flag: 'e05:4,4:risk',
        text: 'Char’s pack is in the court’s book at the weight Scylla quietly lightened it to, and that is the official weight now. In his own book Oren has written the true one, and beside it: unconsented.',
      },
    ],
  },
  {
    key: '6,6',
    place: 'Tomorrow Dials',
    title: 'The Chart of What It Cost',
    speaker: 'Wenna Brack',
    kind: 'memory',
    opening:
      'The great dials no longer show tomorrow. They show what Scylla did: every decision she has made, drawn as currents across one vast chart of glass, each running out to what it cost. Wenna Brack stands at it with a glass-plane in her hand and a clerk at her elbow. ‘They want one line certified,’ she says. ‘The rest come off by evening. Highness, tell me which of these are yours.’',
    artSubject: `A vaulted observatory whose great glass dials have fused into one vast chart of branching glowing currents, each ending in a small faint scene; ${WENNA} holds a glass-plane, a grey-robed clerk at her elbow, while ${SCYLLA} stares up at the lines; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label: 'Name every line as yours, even the worst',
        outcome:
          'Scylla walks the chart and names them, one by one, out loud. Wenna writes each down, then lays the plane on the bench. ‘Then none of them come off,’ she tells the clerk. He records two refusals, and high in the dome a witness bell begins, slowly, to toll.',
        effects: { evidence: 2, trust: 1, danger: 1 },
        artSubject: `${SCYLLA} pointing up at glowing currents on a vast glass chart, speaking, while ${WENNA} sets a glass-plane down on a bench and faces a grey-robed clerk, a bronze bell swinging in the dome above.`,
      },
      {
        id: 'risk',
        label: 'Point to the line you can’t bear, and let her plane it away',
        outcome:
          'Wenna does it, steady-handed, because she was ordered to and Scylla asked. The line peels off the glass in one curl and the chart re-routes itself, tidier. Scylla feels lighter, then wrong. Wenna sweeps the shaving into a jar and labels it in her own hand.',
        effects: { danger: -2, trust: -1, evidence: -1 },
        artSubject: `${WENNA} drawing a glass-plane along a vast glowing chart as one bright line curls away like a shaving, ${SCYLLA} watching with her hand at her throat, a small jar waiting on the bench.`,
      },
    ],
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'One line runs to the edge of the glass and stops, the way a sister stops. Scylla does not need to read it to know which.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'One current ends in a row of small lit squares, train windows under the sea, still waiting, because she chose for them.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'One current spills into a yard everyone swore was empty, and the glass there is crowded with small, moving lights.',
      },
      {
        flag: 'e05:6,6:care',
        text: 'Last time Scylla told Wenna everything here, and Wenna wrote it down, as she warned she would. That record is why the clerk is standing at her elbow.',
      },
      {
        flag: 'e05:6,6:risk',
        text: 'Last time Scylla turned a brass screw on this dial. It is on the chart too: a thin line running out to a scholar who no longer trusts her own eyes. Wenna is looking at it.',
      },
      {
        flag: 'e05:run-again',
        text: 'The brightest current is the night they ran, again: the gate, the boots, the shore lamps. At the waterline it forks into more lines than Scylla can count.',
      },
      {
        flag: 'e05:stay',
        text: 'The widest current is the night they stayed. It runs nowhere. It pools at the palace’s foot, very calm, and nothing in it moves.',
      },
      {
        flag: 'e05:tell-char',
        text: 'One current is not Scylla’s colour. It starts where she told Char everything, and from there it is Char’s line, running somewhere Scylla’s memory cannot follow.',
      },
    ],
  },
  {
    key: '7,6',
    place: 'Observatory Dome',
    title: 'Two Moons',
    speaker: 'Char',
    kind: 'memory',
    opening:
      'On the observatory dome there are two moons now, wobbling far above through the water, and they do not agree about where they are. Char lies under both with her tail hooked over the rail and refuses to come down. ‘Everyone keeps handing me how it goes,’ she says. ‘Mother. The court. You, with that face. Don’t tell me what land smells like. I want to find out.’',
    artSubject: `Atop a glass observatory dome deep underwater, two wobbling moons shining in different places far above; ${CHAR} lies back with her tail hooked over a brass rail, arms folded, while ${SCYLLA} sits beside her, lit twice; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label: 'Promise to tell her nothing you remember, and mean it',
        outcome:
          'Scylla promises. It is the hardest promise she has made in either life. Char studies her, then nods and looks up. ‘The left moon’s lying,’ she says. ‘I can tell.’ They stay up until the patrol, and Scylla says nothing at all, and it feels like a gift.',
        effects: { trust: 2, danger: 1 },
        artSubject: `${CHAR} pointing up at one of two moons with a fierce grin, ${SCYLLA} beside her with her lips pressed shut, a guard's lantern far below on the dome stair.`,
      },
      {
        id: 'risk',
        label: 'Tell her one true thing anyway, so she isn’t walking in blind',
        outcome:
          'Scylla says: rain on hot stone. Char sits up as if slapped. ‘I didn’t ask for that. Now it’s yours, in my head.’ She swims down off the dome alone. Later Scylla hears her muttering other smells, wrong ones, on purpose, to crowd it out.',
        effects: { evidence: 1, trust: -2 },
        artSubject: `${CHAR} swimming down off a moonlit dome without looking back, while ${SCYLLA} sits alone under two moons with one hand at her mouth.`,
      },
      {
        id: 'ask-her',
        label: 'Ask what she wants to know, and answer only that',
        outcome:
          'Char thinks about it for a long time. ‘Do I get to be angry there?’ ‘Yes,’ says Scylla. ‘Often.’ ‘Good.’ That is all she asks. She hums something under both moons that is not the court’s song, and Scylla does not recognise it, which is the point.',
        effects: { trust: 1, evidence: 1 },
        artSubject: `${CHAR} humming with her eyes closed under two moons, ${SCYLLA} listening beside her with a small, surprised smile.`,
      },
    ],
    echoes: [
      {
        flag: 'e05:7,6:care',
        text: 'Someone has scratched ‘oranges’ and ‘toast’ into the dome rail in Char’s hand, from a night she does not remember. A clerk has tagged it.',
      },
      {
        flag: 'e05:7,6:risk',
        text: 'Before Scylla can speak, Char says, ‘Rain, bread, burnt coffee. I know. It’s been in my head for days, and I didn’t put it there.’',
      },
      {
        flag: 'e05:tell-char',
        text: 'Scylla told Char everything, last time. ‘Knowing isn’t choosing,’ Char tells the moons. ‘You gave me the first one. The second’s mine.’',
      },
      {
        flag: 'e05:run-again',
        text: 'They ran from here last time, and the palace pulled them back into the morning like a tide. Char watches the two moons as if one of them is the night they left.',
      },
    ],
  },
  {
    key: '8,6',
    place: 'Observatory Mirror',
    title: 'A Breath Early',
    speaker: 'Scylla',
    kind: 'treasure',
    instant: true,
    opening:
      'The tide-worn mirror at the end of the observatory now holds two reflections, and they disagree. One is a young princess, a breath late. The other is older, braced, and a breath early, already turning toward something Scylla has not decided yet. The clerks give this mirror a wide berth. That, Scylla supposes, is why the back of its frame is the safest shelf in the building.',
    artSubject: `A tall clouded mirror in a dim green corner of the observatory showing two reflections of ${SCYLLA}: one young and a moment behind her, one older and braced, already turning away; Scylla reaches toward the back of the frame; ${STYLE}.`,
    choices: [
      {
        id: 'notice',
        label: 'Reach behind the mirror’s frame',
        outcome:
          'Wrapped in oilcloth behind the frame is one of Wenna’s confiscated notebooks, the honest tides in her own hand, with a slip tucked inside: for whoever doesn’t flinch. In the glass, the older reflection watches Scylla take it, and does not stop her.',
        effects: { evidence: 1, supplies: 1 },
        artSubject: `${SCYLLA} drawing an oilcloth-wrapped notebook from behind a mirror frame while, in the clouded glass, an older reflection of her watches calmly.`,
      },
    ],
    echoes: [
      {
        flag: 'e05:8,6:notice',
        text: 'Last time Scylla practised Char’s grin in this mirror, badly. One of the reflections is still practising it.',
      },
    ],
  },
]
