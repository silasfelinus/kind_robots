import type { DungeonRoomContent } from '../authoredDungeon/types'
import type { SpecimenStacksEntry, SpecimenStacksRoomId } from './types'

export const SPECIMEN_STACKS_ROOMS: readonly DungeonRoomContent<
  SpecimenStacksRoomId,
  SpecimenStacksEntry
>[] = [
  {
    id: 'SP-01',
    title: 'The Drawer-Stair Head',
    kind: 'entry',
    speaker: 'Morrow, Dr Sen and Shiori',
    opening:
      'The first step down is a filing drawer pulled out to its stops, the second is the drawer below it, and so on, a spiral of grey steel cabinets screwed into pine roots as thick as a person. Each drawer front carries a label in Shiori’s copperplate, not a surname but a pair, debtor and creditor: ‘INES → WALT’. Somewhere below, roots are reading the contents aloud in a creak like a wet floorboard. Overhead, through the archive ceiling, a train changes its mind. Dr Sen weighs her heavy archive torch in one hand. ‘Three cells left,’ she says. ‘Spend them like grant money.’',
    artSubject:
      'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, stepping onto the first of a spiral of open grey filing drawers that descends between enormous pine roots, a precise scientist in a lab coat holding a heavy archive torch above, a fluttering paper yōkai of overdue slips at the rail',
    echoes: [
      {
        flag: 'entry:testimony',
        text: 'The bundle of signed statements sits inside Morrow’s cardigan, thin as a sandwich. Upstairs, eleven colleagues wait by the archive door with their coats on. Shiori flutters a step ahead, glancing back at the bundle the way a librarian glances at an unshelved book.',
      },
      {
        flag: 'entry:returned-pages',
        text: 'The archive floor above is bare, every loose page gone home in a pocket. Only Walt waited, his mop laid across the threshold to keep the stair from closing. Nothing down here can be read against the people who took their pages back.',
      },
    ],
    choices: [
      {
        id: 'sweep-the-torch',
        label: 'Sweep the torch down the spiral to see how far it goes',
        outcome:
          'The beam drops nine turns before the roots swallow it. In the light the drawer labels shine, and the reading voices below falter, then resume louder, as if light were a kind of audience. Morrow counts two hundred drawers before the dark. The roots, it seems, now know someone is coming.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'A torch beam plunging down a spiral of open filing drawers between pine roots, labels glinting, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, leaning over the rail beside a scientist',
      },
      {
        id: 'feel-for-the-labels',
        label: 'Leave the torch off and read the drawer labels by touch',
        outcome:
          'Shiori’s labels are embossed, made for readers in the dark. Morrow’s fingers find INES → WALT, PRIYA → EVERYONE, SEN → STUDENTS (19). The roots go on murmuring undisturbed. The torch stays full, and Morrow climbs down knowing names but not faces, which is how the canopy knows them too.',
        gain: { danger: -1 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, descending a dark drawer stair with fingertips tracing an embossed label, faint resin glow on the pine roots around',
      },
    ],
  },
  {
    id: 'SP-02',
    title: 'Landing of Small Debts',
    kind: 'lore',
    speaker: 'Morrow',
    opening:
      'The first landing is a desk-sized drawer lined with index cards, every one a small kindness turned into an amount owing. ‘Ines owes Priya: one pipette, one lunch, one cry in the cold room (unrepaid).’ ‘Porter owes Lift Engineer: a song, hummed.’ Interest is pencilled in the margins, a fraction each day, the way an overdue library fine climbs. A root has pushed up through the drawer bottom like a reading finger and rests on the newest card. Its bark is warm. The ink under it is still wet.',
    artSubject:
      'A wide open filing drawer used as a landing, packed with handwritten index cards with pencilled sums in the margins, a pale pine root pushing up through its base to rest on one card like a finger, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, bending to read',
    autoChoiceId: 'read-the-small-debts',
    choices: [
      {
        id: 'read-the-small-debts',
        label: 'Read the card under the root’s finger',
        outcome:
          'The newest card says ‘Dr Sen owes the Borrower: one descent, with torch.’ It was filed four minutes ago. Shiori is fast, and the root reads it aloud before Morrow has finished reading it. Morrow knows exactly who the Borrower is. Somewhere above, Dr Sen’s bus home has just moved to a later season.',
        gain: { evidence: 1 },
        artSubject:
          'Close view of a freshly inked index card under the tip of a warm pine root, the hand of Morrow in a grey cardigan sleeve hovering above it',
      },
    ],
  },
  {
    id: 'SP-03',
    title: 'The Herbarium Technician’s Niche',
    kind: 'treasure',
    speaker: 'Morrow and Dr Sen',
    opening:
      'Set into a root-bound cabinet is a niche the archive forgot: a stool, a kettle, a shelf of herbarium presses, and a biscuit tin labelled TORCH CELLS, HERBARIUM, DO NOT REMOVE in a careful older hand. Beside it lies a pressed specimen sheet for the pines themselves, a twig and a cone glued down beside an accession card. The collector line reads ‘the roots’. The date is last Tuesday, the night the seed cabinet in Room 9 first opened for someone.',
    artSubject:
      'A cramped niche in a root-bound cabinet with a stool, a kettle and wooden herbarium presses, a biscuit tin on a shelf beside a pressed pine twig and cone on a white sheet, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, crouching to read the accession card by torchlight',
    choices: [
      {
        id: 'take-the-torch-cells',
        label: 'Take the torch cells from the biscuit tin',
        outcome:
          'Four cells, a little furred at the contacts. Dr Sen rubs them clean on her coat and the torch steadies. Under the cells is a note: ‘For whoever is on nights. Put back what you can.’ Morrow writes ‘owed’ on the lid and then, after a moment, crosses it out.',
        gain: { battery: 2 },
        artSubject:
          'A scientist in a lab coat rubbing torch cells clean on her sleeve beside an open biscuit tin while Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, writes on the lid',
      },
      {
        id: 'pocket-the-accession-card',
        label: 'Pocket the pines’ accession card',
        outcome:
          'The card gives the specimen’s origin as ‘Briar, by collision’ and its use as ‘routing’. Under remarks, in Shiori’s copperplate: ‘Grows one ring for every account settled.’ Dr Sen reads it twice. ‘So the forest feeds on people paying each other back,’ she says. ‘That’s a terrible hypothesis. Write it down.’',
        gain: { evidence: 1 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, holding a small accession card to the light while a scientist reads it over their shoulder in a cramped herbarium niche',
      },
    ],
  },
  {
    id: 'SP-04',
    title: 'Shiori at the Card Catalogue',
    kind: 'companion',
    speaker: 'Shiori and Morrow',
    opening:
      'On the third turn the stair widens into a card catalogue, and Shiori settles onto its brass handles like a heron made of overdue slips. It is not hostile. It is curious, and very tidy. ‘Borrower,’ it says to Morrow, because a library spirit knows a borrowed life when one walks in. ‘You owe a great deal to a man named Rowan. Everybody upstairs is so careless with their accounts. Down here nobody is forgotten, because everybody owes.’ Dr Sen frowns at the word Borrower and lets it pass, as one lets pass a colleague’s odd joke.',
    artSubject:
      'Shiori, a heron-shaped paper yōkai of fluttering overdue slips, perched on the brass handles of a wooden card catalogue between pine roots, addressing Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, while a precise scientist in a lab coat lowers her heavy torch',
    echoes: [
      {
        flag: 'e10:6,1:testify-gifts-not-loans',
        text: 'One drawer on the catalogue is newly labelled FREELY GIVEN, in letters slightly less confident than the rest. Shiori keeps glancing at it, as if it might bite.',
      },
      {
        flag: 'e10:6,1:hand-back-every-page',
        text: 'Shiori still sulks about the station platform, where every page went home in a pocket. ‘You emptied my lost property,’ it says. ‘Now nobody there can prove they mattered.’',
      },
    ],
    choices: [
      {
        id: 'tell-shiori-the-truth',
        label: 'Tell Shiori what you owe Rowan, in front of Dr Sen',
        outcome:
          'Morrow says it plainly: a life, borrowed, not yet returned. Dr Sen takes it as a confession about burnout and squeezes Morrow’s arm. Shiori takes it as an entry and files it with delight, interest accruing from the night of the trade. The roots read it aloud. Far above, a train meant for Rowan waits at an empty platform.',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'A paper yōkai of overdue slips writing eagerly on an index card while Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, speaks and a scientist rests a hand on their arm',
      },
      {
        id: 'ask-shiori-its-own-page',
        label: 'Ask Shiori which drawer holds its own page',
        outcome:
          'Shiori goes very still, slips rattling. It searches the catalogue twice and finds nothing under its own name. ‘A clerk is not an account,’ it says, too quickly, and flutters ahead down the stair. It does not wait at the next turn, and the next landing is darker for it.',
        gain: { evidence: 1, trust: -1 },
        artSubject:
          'A paper yōkai of overdue slips frozen over an open card catalogue drawer that holds nothing under its name, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, watching',
      },
      {
        id: 'show-shiori-a-statement',
        label: 'Show Shiori one signed statement from the bundle',
        outcome:
          'Morrow hands over Priya’s sentence: ‘I help because I like who I am when I do.’ Shiori reads it four times. It cannot find a creditor. It cannot find a sum. At last it files the statement in a fresh drawer labelled UNRESOLVED and keeps one slip-wing resting on the handle, as if to stop it opening by itself.',
        gain: { trust: 2 },
        requires: { entry: 'testimony' },
        lockedHint: 'Only if you carried signed testimony down',
        artSubject:
          'A paper yōkai of overdue slips holding a single handwritten statement close to its face, one wing resting on a drawer labelled in copperplate, Morrow in a grey cardigan waiting patiently',
      },
    ],
  },
  {
    id: 'SP-05',
    title: 'The Book Lift Landing',
    kind: 'shortcut',
    speaker: 'Morrow and Dr Sen',
    opening:
      'The archive’s old book lift runs past this landing in a shaft of cream-painted brick, its cables now braided with pine roots, its little car parked at the gate with a returns slip inside. The bell pull still works. Anything sent up arrives on the archive floor, where colleagues wait or do not. Anything written and sent up, Dr Sen points out, will pass every root in the shaft on the way, and the roots read everything. A lower gate, below the car, is wedged shut with a fist of root.',
    artSubject:
      'A narrow cream-painted brick book lift shaft beside a drawer-stair landing, its cables braided with pale pine roots and a small steel car parked open at the gate with a returns slip inside, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, holding the bell pull',
    choices: [
      {
        id: 'send-a-note-up',
        label: 'Send a note up the book lift to the people waiting at the top',
        outcome:
          'Morrow writes: ‘Alive. Going deeper. Do not come down.’ The car rattles off. Every root in the shaft reads the note as it passes, and the canopy decides that whoever reads it at the top now owes Morrow an answer. Ten minutes later a reply comes down in Walt’s capitals: ‘NOBODY OWES ANYBODY. COME BACK.’',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'A small steel book lift car rising up a root-braided shaft with a folded note inside, roots curling toward it, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, looking up',
      },
      {
        id: 'tie-off-the-lift-cable',
        label: 'Tie off the lift cable so the car can bring you back',
        outcome:
          'Dr Sen knots a lab-coat belt round the cable and the brake, a hitch she learned on a research ship. The car will wait here for them, whatever the roots do to the shaft. It is a slow way up and a quiet one. Nobody at the top will know they are coming until they arrive.',
        gain: { danger: -1 },
        artSubject:
          'A scientist in a lab coat tying a belt in a tight hitch around a book lift cable and brake lever while Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, holds the torch',
      },
    ],
  },
  {
    id: 'SP-06',
    title: 'The Drawer of Train Routes',
    kind: 'puzzle',
    speaker: 'Morrow and Dr Sen',
    opening:
      'This drawer is a railway. Root tips have scored commuter lines into the green felt lining, and every route card slotted along them pairs a debtor with a creditor: Ines rides the 7:12 with Walt because she owes him a dry floor; Priya rides every train, because she owes everyone. The canopy upstairs reads these grooves and moves the trains to match. One card sits alone on a line that runs through the flooded underpass, and it is Walt’s. He owes nobody and nobody owes him, so the forest has nobody to put him beside.',
    artSubject:
      'An open filing drawer lined with green felt scored by root tips into branching railway lines, route cards slotted along the grooves, one card alone on a line running into a pool of seawater, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, leaning over it beside a scientist holding a torch',
    echoes: [
      {
        flag: 'e10:4,2:name-walt-the-keeper',
        text: 'Walt’s card has a new line in Dr Sen’s hand, copied from the access log upstairs: ‘custodian, Room 9’. The roots read it as a debt the seed cabinet owes him, but a cabinet does not ride trains, and his card still runs alone.',
      },
      {
        flag: 'SP-05:send-a-note-up',
        text: 'A new card has appeared since the note went up, pairing Walt with Morrow on a train neither of them has caught. The roots work fast.',
      },
    ],
    choices: [
      {
        id: 'trace-the-routing-rule',
        label: 'Trace every groove by torchlight to learn the routing rule',
        outcome:
          'It takes the torch at full beam and twenty minutes. The rule is simple and Briar-old: a debtor travels with the one they owe, so nobody walks home unwatched. People with no accounts are routed last, alone, wherever the water is. Dr Sen copies the rule into her notebook and goes quiet over the last line.',
        gain: { battery: -1, evidence: 2 },
        requires: { battery: 1 },
        lockedHint: 'Needs torch charge to follow the grooves',
        artSubject:
          'A bright torch beam following a root-scored groove across green felt while a scientist copies a diagram into a notebook and Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, points',
      },
      {
        id: 'file-walt-a-debt',
        label:
          'Write a slip saying you owe Walt a held door, and file it on his line',
        outcome:
          'The slip is close enough to true; Walt has held a hundred doors in this building. The root reads it and Walt’s card slides off the underpass line onto Morrow’s own. He will not ride through the flood tonight. He will ride, by forest law, beside a stranger who owes him, and Morrow has just taught the ledger that it works.',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'The hand of Morrow in a grey cardigan sleeve slotting a handwritten slip beside a lone route card as it slides from a flooded groove onto a dry one',
      },
    ],
  },
  {
    id: 'SP-07',
    title: 'The Root That Reads Aloud',
    kind: 'hazard',
    speaker: 'Morrow, Dr Sen and a reading root',
    opening:
      'Below the card catalogue the drawers give way to bare root, and one root is awake. It slides out of the dark at ankle height, fine hairs lifting, and finds the lanyard round Morrow’s neck. The badge says R. ROWAN. The root begins to read, in a creak that climbs the trunks toward the canopy: Rowan owes Mara two hundred and twelve covered shifts, forty coffees, one apology for March. Each line it reads tightens it around Morrow’s calf. Dr Sen has a scalpel in her coat pocket. She always does.',
    artSubject:
      'A pale questing pine root coiled around the calf of Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, its fine hairs lifting toward a staff badge on a lanyard, a precise scientist in a lab coat crouching with a scalpel and a heavy torch in a dark root tunnel',
    echoes: [
      {
        flag: 'e10:6,6:mara-tells-shiori',
        text: 'The root stumbles on the March line, which has been split in two, gifts in one column and grievances in the other. Mara’s honesty has made the page harder to read aloud.',
      },
      {
        flag: 'e10:6,6:give-mara-the-account',
        text: 'The root reaches the March line and finds only a torn edge. Mara kept that strip. The root reads the gap as silence and grips harder, hungry.',
      },
    ],
    choices: [
      {
        id: 'let-it-finish-reading',
        label: 'Stand still and let the root read the whole badge',
        outcome:
          'Morrow stands while the root reads Rowan’s debts to the end. It loosens, satisfied, and slides away. High above, the canopy reroutes Mara’s evening train to run beside Rowan’s, which means beside Morrow’s, every night until the shifts are repaid. Mara has not been asked. Morrow now knows the exact shape of Rowan’s account.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'A pine root slowly uncoiling from the leg of Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, who stands rigid and still with a staff badge held out on its lanyard',
      },
      {
        id: 'turn-the-badge-over',
        label: 'Turn the badge face down and let Dr Sen cut you loose',
        outcome:
          'Morrow flips the badge. The root, starved mid-sentence, clamps hard. Dr Sen cuts it once, cleanly, and it bleeds hot resin across her torch lens and Morrow’s shoe. Nothing reaches the canopy. The torch burns dimmer through the amber smear, and the cut root’s neighbours have begun reaching toward the wound.',
        gain: { battery: -1, danger: -1 },
        artSubject:
          'A scientist slicing a pine root with a scalpel as amber resin spills over a torch lens, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, pulling free with a badge turned face down',
      },
    ],
  },
  {
    id: 'SP-08',
    title: 'The Herbarium of Pressed Friendships',
    kind: 'lore',
    speaker: 'Morrow',
    opening:
      'A long room of herbarium cabinets, the kind that hold dried plants on stiff white sheets, each with a label for collector, date and locality. Here the sheets hold pressed friendships. A bus ticket two people shared. A hairband lent at a conference. A child’s drawing given to a night porter, flattened under blotting paper with a careful label: ‘Debt of affection, accruing. Collected from Ward 3 bin.’ Shiori has been gathering the leftover objects of kindness the way a botanist gathers leaves, and pressing them so they will never rot.',
    artSubject:
      'A long dim herbarium room of tall white cabinets between pine roots, one drawer pulled out to show a stiff white sheet with a shared bus ticket pressed beneath blotting paper and a handwritten label, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, lifting the sheet by its corners',
    autoChoiceId: 'turn-the-sheets',
    echoes: [
      {
        flag: 'SP-01:sweep-the-torch',
        text: 'The sheets nearest the stair have curled toward it, the way leaves turn after a light has passed. The roots remember where the torch swept.',
      },
      {
        flag: 'SP-01:feel-for-the-labels',
        text: 'Morrow’s fingers already know this lettering from the drawer labels. Shiori embosses everything, as if it expects most of its readers to be in the dark.',
      },
    ],
    choices: [
      {
        id: 'turn-the-sheets',
        label: 'Turn the sheets in the nearest cabinet',
        outcome:
          'Every sheet has a locality, and every locality is somewhere in the research building: Bench 4, the fire stair, the night staff room. The collection is a map of where people were kind to one another. Anyone holding it would know exactly where to find them alone.',
        gain: { evidence: 1 },
        artSubject:
          'Close view of herbarium sheets fanned across a cabinet drawer, each holding a pressed small object and a locality label naming a room, a grey cardigan sleeve turning the top one',
      },
    ],
  },
  {
    id: 'SP-09',
    title: 'The Co-Author Knot',
    kind: 'choice',
    speaker: 'Morrow and Dr Sen',
    opening:
      'Two pages have grown together in a root knot as tight as a fist. One belongs to Ines, the technician; the other to Bao, a postdoc who left the lab last year. Each claims the other owes them first authorship on a paper they wrote together, and the root, reading both aloud at once, has knotted them so neither can be read without the other. Upstairs, Dr Sen explains, the canopy has put Ines and Bao on the same train for nine days. Bao now lives two cities away. He has been commuting four hours to sit beside her.',
    artSubject:
      'Two handwritten pages bound together in a tight knot of pine root hanging at head height in a dark passage, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, examining it while a precise scientist in a lab coat holds a torch and a scalpel',
    choices: [
      {
        id: 'cut-the-knot',
        label: 'Cut the knot apart with Dr Sen’s scalpel',
        outcome:
          'The knot parts with a smell of turpentine. Each page falls free, a little torn where the other was. Bao’s train will run home tonight, and Ines’s will not wait for his. Neither of them gets to say what the paper meant to them; the root has gone silent, and so has the question.',
        gain: { danger: -1, trust: -1 },
        artSubject:
          'A scalpel parting a knot of pine root as two torn pages drift apart in torchlight, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, catching one',
      },
      {
        id: 'ask-dr-sen-to-rule',
        label:
          'Ask Dr Sen, as their old supervisor, what really happened on that paper',
        outcome:
          'Dr Sen tells it straight. Ines did the work, Bao did the writing, and she put Bao first because his contract was ending and first authors get renewed. She chose for both of them. The knot loosens at the truth and both pages slide free. Dr Sen holds her own name, at the bottom of each, for a long moment.',
        gain: { evidence: 1, trust: 1 },
        artSubject:
          'A scientist in a lab coat speaking with downcast eyes as a root knot loosens and two pages slide free into the hands of Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan',
      },
    ],
  },
  {
    id: 'SP-10',
    title: 'The Seedling Bench',
    kind: 'rest',
    speaker: 'Dr Sen and Morrow',
    opening:
      'A broken incubator has been colonised by pine seedlings, a hundred green needles in a warm steel box, and someone has put a lab bench beside it with two stools. The air here is the only warm air in the stacks. Dr Sen sits without being asked and pours tea from a flask. ‘Four years I’ve run this lab,’ she says. ‘Every April I fill in a form that says how many hours each person contributed to funded outputs. I never thought of it as a ledger. It’s a form.’ She drinks. ‘It’s a ledger.’',
    artSubject:
      'A broken steel incubator overflowing with bright green pine seedlings beside a lab bench and two stools among roots, a precise scientist in a lab coat pouring tea from a flask, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, sitting opposite in the warm glow',
    choices: [
      {
        id: 'rest-by-the-seedlings',
        label: 'Sit in the warm and let Dr Sen finish her tea',
        outcome:
          'The incubator’s socket still has power, and Dr Sen props the torch in it to charge. They sit ten minutes, which is a long time in a dark place. She talks about her first lab, where nobody counted anything and everyone was underpaid. Morrow listens the way Rowan apparently never had time to. When they stand, both are easier to be around.',
        gain: { battery: 1, trust: 1 },
        artSubject:
          'A heavy torch charging from an incubator socket among pine seedlings while a scientist talks with her hands around a cup and Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, listens',
      },
      {
        id: 'ask-about-the-form',
        label:
          'Ask what happens to people whose hours count for nothing on the form',
        outcome:
          'Dr Sen answers in a flat voice. Their contracts are not renewed. Cleaners and porters are not on the form at all, so they never count either way. ‘Nobody is cut for being kind,’ she says. ‘They’re cut for being unattributable.’ She hears herself and puts the flask down.',
        gain: { evidence: 1, trust: -1 },
        artSubject:
          'A scientist setting down a tea flask with a stricken face beside an incubator of pine seedlings, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, watching her',
      },
    ],
  },
  {
    id: 'SP-11',
    title: 'The Canopy’s Lost Property',
    kind: 'treasure',
    speaker: 'Morrow and Shiori',
    opening:
      'Things fall through the canopy when it reroutes the trains: umbrellas, a cycling helmet, a bag of satsumas, a child’s glove. They drop down the hollow pine trunks and land here, in a root hollow Shiori has shelved like a lost property office. Each item is tagged with who dropped it and who, in Shiori’s opinion, ought to return it. A cyclist’s front lamp, still working, is tagged ‘Kofi: owes Ama a light home.’ Shiori hovers, waiting to see what Morrow takes, because taking is a kind of owing.',
    artSubject:
      'A root hollow shelved like a lost property office with tagged umbrellas, a cycling helmet, a bag of satsumas and a small glove, a bicycle lamp glowing on a shelf, Shiori, a heron-shaped paper yōkai of overdue slips, hovering beside Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan',
    echoes: [
      {
        flag: 'SP-04:ask-shiori-its-own-page',
        text: 'Shiori stays on the far shelf and will not meet Morrow’s eye. It has hung a new tag on a hook by itself: ‘Clerk: page not found.’',
      },
      {
        flag: 'SP-04:show-shiori-a-statement',
        text: 'Shiori has tagged nothing new since it read the statement. It is turning one blank tag over and over in its slips, as if a gift might be written on the other side.',
      },
    ],
    choices: [
      {
        id: 'take-the-bike-lamp',
        label: 'Take the cyclist’s lamp and let Shiori file the debt',
        outcome:
          'The lamp clips to Morrow’s cardigan and throws a strong white beam. Shiori writes ‘Borrower owes Kofi: one lamp’ and files it, pleased. Somewhere above, the canopy puts Morrow on Kofi’s train. Kofi will lend nothing for a while, because the last thing he lent fell through a forest.',
        gain: { battery: 2, danger: 1 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, clipping a glowing bicycle lamp to their cardigan while a paper yōkai writes a tag with satisfaction',
      },
      {
        id: 'tag-items-as-gifts',
        label:
          'Write ‘gift’ on the tags of the things nobody will come back for',
        outcome:
          'Morrow takes Shiori’s pen and writes ‘gift’ on the glove, the satsumas and the helmet. Shiori watches, slips trembling, and does not stop the pen. The roots cannot read the word as a sum, and three small lines on the canopy’s timetable go slack. The lamp stays on its shelf.',
        gain: { trust: 1, danger: -1 },
        artSubject:
          'A hand in a grey cardigan sleeve writing on a paper tag tied to a small lost glove while a trembling paper yōkai of overdue slips looks on from a shelf',
      },
    ],
  },
  {
    id: 'SP-12',
    title: 'Where the Canopy Listens',
    kind: 'choice',
    speaker: 'Morrow and the canopy',
    opening:
      'The roots here climb straight up into one hollow pine trunk, and the trunk is a speaking tube. Every page read aloud below rises through it to the canopy over the city. Morrow presses an ear to the bark and hears the forest above, answering, and under its answers the sound of trains braking and changing tracks. A brass plate screwed to the trunk, from when this was a plain archive pillar, still reads LOAD BEARING. Dr Sen raises the torch into the hollow. Far up, there is a speck of grey daylight.',
    artSubject:
      'A vast hollow pine trunk rising like a chimney from a root chamber, a brass plate screwed to its bark, a speck of daylight far above, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, pressing an ear to the wood while a scientist shines a torch upward',
    echoes: [
      {
        flag: 'SP-07:let-it-finish-reading',
        text: 'Coming down the tube from above, faint and over and over, is Rowan’s debt to Mara, being read aloud by the whole forest.',
      },
      {
        flag: 'SP-07:turn-the-badge-over',
        text: 'Resin still beads on Morrow’s shoe. The trunk smells it, and the speaking tube goes briefly quiet, listening for the wounded root.',
      },
    ],
    choices: [
      {
        id: 'shout-up-the-trunk',
        label: 'Shout up the trunk that the ledger is wrong',
        outcome:
          'Morrow shouts. The trunk carries it, and the canopy, which has never heard a human voice from below, stops reading for nine whole seconds. Trains all over the city halt between stations. When the reading resumes it is faster and angrier, and Shiori, somewhere on the stair, has heard exactly what Morrow thinks of its work.',
        gain: { evidence: 1, danger: 2 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, shouting up into a hollow pine trunk with cupped hands, needles shivering down through the torchlight',
      },
      {
        id: 'listen-to-the-canopy',
        label:
          'Keep an ear to the bark and listen to what the canopy says back',
        outcome:
          'The canopy is not cruel either. It speaks in Briar law, slow as sap: those who owe are bound to the ones they owe, and the bound are never left alone on the road. It is trying to keep everyone in the city accompanied. It simply cannot hear anyone who is owed nothing.',
        gain: { evidence: 2 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, eyes closed with one cheek against the bark of a hollow pine, a scientist waiting quietly with the torch lowered',
      },
    ],
  },
  {
    id: 'SP-13',
    title: 'The Compounding Shelves',
    kind: 'hazard',
    speaker: 'Morrow and Dr Sen',
    opening:
      'In the galleries below, the debts have been accruing interest for a week, and interest takes up room. Pages swell as figures are added in their margins, then sprout new pages, then whole new files, until the steel shelving bows like a hammock and the aisle between is the width of a shoulder. Water is seeping in from somewhere lower, salt-smelling, and the wet pages are heavier still. A shelf ahead groans. Dr Sen holds the torch steady. ‘There’s a gap at the far end,’ she says. ‘Or there was.’',
    artSubject:
      'A narrow aisle between steel archive shelves bowed like hammocks under swollen wet ledger pages sprouting extra sheets, salt water pooling on the floor, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, edging sideways behind a precise scientist in a lab coat with a torch',
    choices: [
      {
        id: 'light-the-gap',
        label: 'Light the far end and run for the gap before the shelf gives',
        outcome:
          'The beam finds it, a body-width slot between two bowed uprights, and they run. Behind them a whole shelf of Priya’s debts comes down in a slurry of wet paper and compound interest. The torch dims from the long beam. Nobody is hurt. Priya’s accounts now block the aisle for anyone coming after.',
        gain: { battery: -1, danger: -1 },
        requires: { battery: 1 },
        lockedHint: 'Needs torch charge to find the gap',
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, sprinting through a narrow gap in torchlight as a shelf of wet ledger files collapses behind in a paper avalanche',
      },
      {
        id: 'unload-the-shelf',
        label:
          'Unload the bowed shelf by hand, page by page, until it straightens',
        outcome:
          'It takes forty minutes with wet hands. Morrow reads a few pages without meaning to: Priya owes the cold room, the coffee machine, a colleague’s dog. The shelf straightens enough to pass. Their sleeves are soaked with salt water and ink, and somewhere above, every train Priya might catch has been moved twice.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, passing armfuls of dripping ledger pages to a scientist as a bowed steel shelf slowly straightens',
      },
    ],
  },
  {
    id: 'SP-14',
    title: 'The Running Ink',
    kind: 'puzzle',
    speaker: 'Morrow and Dr Sen',
    opening:
      'The lowest gallery is ankle-deep in seawater that tastes faintly of a palace: salt, pearl dust, a thread of kelp. It has come up the city’s drains from the flooded lifts, and it is doing what water does to ink. The figures on a whole cabinet of debts are running, sums bleeding into names, creditors into debtors, until the pages say only that someone owes someone something. The roots reading them have begun to stammer. Upstairs, Dr Sen says, the canopy will be routing these people at random.',
    artSubject:
      'An archive gallery flooded ankle-deep with pale green seawater carrying strands of kelp and glints of pearl dust, ledger pages on low shelves bleeding blue ink into the water, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, lifting a dripping page beside a scientist with a torch',
    choices: [
      {
        id: 'restore-from-carbons',
        label:
          'Rebuild the running columns from the carbon copies on the dry shelf',
        outcome:
          'Shiori keeps carbons of everything. Morrow and Dr Sen match blurred page to carbon and restore four hundred sums. The roots stop stammering and the trains above steady. Morrow has just repaired the ledger with their own hands, carefully, and it is reading the restored debts aloud with new confidence.',
        gain: { evidence: 1, danger: -1, trust: -1 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, holding a blurred wet page against a crisp carbon copy while a scientist copies figures by torchlight above flooded shelves',
      },
      {
        id: 'let-the-ink-run',
        label: 'Leave the cabinet in the seawater and let the ink run',
        outcome:
          'By the time they leave the gallery the pages are blank and blue. Four hundred people upstairs now owe nothing and are owed nothing, and the canopy routes them the way it routes Walt: last, alone, wherever there is room. Some will be glad. Some will be on a train through the underpass tonight.',
        gain: { trust: 1, danger: 2 },
        artSubject:
          'Blank blue-stained pages floating in seawater among kelp strands in a dark archive gallery, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, wading away',
      },
    ],
  },
  {
    id: 'SP-15',
    title: 'Priya’s Heaviest Page',
    kind: 'companion',
    speaker: 'Priya, Morrow and Dr Sen',
    opening:
      'Priya, the postdoc, is sitting on a filing cabinet at the dry end of the gallery with her trainers soaked and her lanyard wrung in both hands. She followed the stair down an hour ago to find her own page, because the canopy has stopped letting her ride home: she owes too many people to fit on any one train. Her page, when she finds it, is not a page but a box file, and the root reading it has been going for a week without a breath. ‘I said yes to everything,’ she says. ‘I thought that was the job.’',
    artSubject:
      'A young postdoc in soaked trainers sitting on a filing cabinet with a bulging box file on her knees and a lanyard wrung in her hands, a pine root resting on the file, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, kneeling beside her in a dim flooded archive gallery',
    echoes: [
      {
        flag: 'e10:5,2:share-the-rota-tines',
        text: 'Priya’s box file is lighter than it should be. Five colleagues took tines off the stag upstairs, and every task they chose to carry has come off her account.',
      },
      {
        flag: 'e10:5,2:unplug-the-time-clock',
        text: 'There are two fresh entries at the top of Priya’s file: ‘owes the incubators two sample trays’. The root reads them in a voice like a door left open in winter.',
      },
      {
        flag: 'entry:returned-pages',
        text: 'Priya already has one loose page in her pocket, handed back to her on the archive floor. She came down anyway, for the rest of it.',
      },
    ],
    choices: [
      {
        id: 'send-the-file-up',
        label:
          'Help Priya haul her whole box file to a root shaft and send it up to her',
        outcome:
          'The three of them pass the box file up a root shaft hand over hand. Every page that leaves the stacks leaves the canopy’s hearing, and Priya’s trains will come back one at a time. She thanks Morrow, then catches herself and says, ‘That’s not a debt.’ Hauling it has cost them most of an hour.',
        gain: { trust: 2, danger: 1 },
        artSubject:
          'A young postdoc, a scientist and Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, heaving a heavy box file up a narrow root shaft hand over hand',
      },
      {
        id: 'ask-priya-to-testify',
        label:
          'Ask Priya which of her debts are real, so the root reads only those',
        outcome:
          'Priya goes through it aloud: real, real, not a debt, a gift, a grudge, real. It takes an hour and makes her cry twice. The root passes over the gifts and reads only the rest. Her file halves, and her evening train returns. She has said things about colleagues that the roots have now carried to the canopy.',
        gain: { evidence: 2, trust: -1 },
        artSubject:
          'A tearful young postdoc sorting pages from a box file into two piles on a filing cabinet while Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, holds the torch',
      },
      {
        id: 'priya-walks-with-you',
        label: 'Ask Priya to come with you instead of staying for her file',
        outcome:
          'Priya already holds the one page that hurt most. She looks at the box file, then at Morrow, and leaves it. ‘If they want me to owe them,’ she says, ‘they can come and find me.’ She walks beside them as far as the choir, carrying a pocketful of spare torch cells from the lab.',
        gain: { trust: 1, battery: 1 },
        requires: { entry: 'returned-pages' },
        lockedHint: 'Only if the loose pages were returned before the descent',
        artSubject:
          'A young postdoc stepping away from an abandoned box file to walk beside Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, handing over torch cells',
      },
    ],
  },
  {
    id: 'SP-16',
    title: 'The Interest Clerks',
    kind: 'choice',
    speaker: 'Morrow and a swarm of overdue slips',
    opening:
      'A cloud of small paper things is working at a long table: overdue slips that have come loose from Shiori and grown legs, each one stamping a date and adding a fraction to a margin. They are the interest. They do not think; they compound. When they notice Morrow they crowd close and begin stamping the cardigan sleeve, because a borrower who stands still is accruing. Each stamp leaves a purple date and a faint, heavy feeling, as if another hour of someone else’s life had been added to the account.',
    artSubject:
      'A long archive table swarming with tiny legged paper slips wielding rubber date stamps, purple ink everywhere, several of them stamping the sleeve of Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, a scientist with a torch recoiling',
    choices: [
      {
        id: 'stamp-them-paid',
        label: 'Take a rubber stamp from the table and stamp the slips PAID',
        outcome:
          'PAID is a word the slips understand. Each one stamped curls up, content, and drops like a dry leaf. Morrow stamps forty before the table clears. The paid slips roll toward the roots, and the floor shudders as a pine somewhere above puts on a new ring. The forest has just been fed.',
        gain: { danger: -1, evidence: 1 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, slamming a rubber stamp onto tiny paper slips that curl up and drop like dry leaves across a long table',
      },
      {
        id: 'stamp-them-gift',
        label: 'Carve a stamp that says GIFT from a pencil eraser and use that',
        outcome:
          'Dr Sen carves G-I-F-T backwards into an eraser with her scalpel, badly. The slips stamped with it stop dead, confused, and wander off the table in every direction, compounding nothing. They do not feed the roots. They do not go anywhere useful either, and a few follow Morrow for the rest of the night.',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'A scientist carving letters into a pencil eraser with a scalpel while confused paper slips wander off a table around Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan',
      },
    ],
  },
  {
    id: 'SP-17',
    title: 'The Drawer Shiori Keeps Shut',
    kind: 'secret',
    speaker: 'Shiori and Morrow',
    opening:
      'Behind the interest table is a small oak drawer of a different make from the rest, older, with a Hoshimori paper charm tied to its handle. Shiori arrives as Morrow reaches for it and lands on the handle, wings spread. ‘That is not a ledger,’ it says. ‘That is where I put the things I could not file.’ Inside, when it finally lets go: a tram ticket punched as a present, a pressed camellia, a child’s note to a night porter that says ‘thank you for making the dark not scary’, and nothing written beside any of them.',
    artSubject:
      'A small old oak drawer with a folded paper charm tied to its handle, open to show a punched tram ticket, a pressed camellia and a child’s crayon note, Shiori, a heron-shaped paper yōkai of overdue slips, perched on its edge beside Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan',
    echoes: [
      {
        flag: 'SP-04:show-shiori-a-statement',
        text: 'Priya’s signed sentence is in here too, at the front, its edges smoothed flat. Shiori has moved it out of UNRESOLVED.',
      },
      {
        flag: 'e10:6,1:testify-gifts-not-loans',
        text: 'There is a station umbrella in here, folded small, from the platform where Ama said the lifts home were never a loan.',
      },
    ],
    choices: [
      {
        id: 'add-something-unfiled',
        label:
          'Put something of your own in the drawer that nobody owes you for',
        outcome:
          'Morrow puts in the biro from Rowan’s cardigan pocket, which Rowan never lent and Morrow never earned. Shiori looks at it for a long time. ‘Whose is it?’ ‘Nobody’s, tonight.’ Shiori shuts the drawer very gently, and for the first time all night it walks beside Morrow instead of ahead.',
        gain: { trust: 2 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, laying a cheap biro beside a pressed camellia in an oak drawer as a paper yōkai watches with its head tilted',
      },
      {
        id: 'catalogue-the-drawer',
        label:
          'List what is in the drawer as proof that Shiori already knows the difference',
        outcome:
          'Dr Sen lists the contents in her notebook: eleven objects, no sums, all filed by the same hand that files everything else. ‘It can tell,’ she says. ‘It has always been able to tell.’ Shiori hears itself described and goes stiff, a clerk caught keeping a private shelf.',
        gain: { evidence: 2, trust: -1 },
        artSubject:
          'A scientist writing a list in a notebook beside an open oak drawer of small keepsakes while a stiff paper yōkai of overdue slips glares and Morrow in a grey cardigan looks between them',
      },
    ],
  },
  {
    id: 'SP-18',
    title: 'The Root Chute',
    kind: 'shortcut',
    speaker: 'Morrow and Dr Sen',
    opening:
      'At the end of the galleries a hollow root runs upward at a steep slant, wide as a coal chute and polished inside by whatever has been sliding down it. At its top, far off, is a faint square of cream brick: the book lift shaft, several landings up. Dr Sen puts her hand on the root wall. It is warm, and it carries the reading voices the way a pipe carries water. A loose rung of root could be wedged crosswise to hold the chute open both ways, or the chute could be left one-way, for whatever uses it.',
    artSubject:
      'A steep polished hollow root rising like a chute from a dark archive gallery toward a distant square of cream brick, a loose root rung lying at its mouth, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, peering up it beside a scientist with a torch',
    choices: [
      {
        id: 'shortcut-back',
        label:
          'Wedge the root rung so the chute stays open up to the book lift landing',
        outcome:
          'Morrow jams the rung crosswise and the chute holds, a steep climb back to the book lift landing whenever they need it. The root does not like being held open. Its reading falters, then carries on around the wedge, and the pages it reads up the chute now reach the archive floor as well as the canopy.',
        gain: { danger: 1 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, bracing a thick root rung crosswise inside a polished hollow chute, dust and voices drifting down from above',
      },
      {
        id: 'leave-the-chute-one-way',
        label: 'Leave the chute as it is and go on down',
        outcome:
          'Whatever polished the chute comes down it again while they watch: a parcel of fresh pages, newly filed upstairs, sliding toward the galleries to accrue. Morrow lets it pass. The way back is the long way now, through every room they have already crossed. Nothing else is disturbed.',
        gain: { danger: -1, evidence: 1 },
        artSubject:
          'A bundle of fresh paper pages tied with string sliding down a polished root chute past Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, who steps aside to let it go',
      },
    ],
  },
  {
    id: 'SP-19',
    title: 'The Choir Cloakroom',
    kind: 'lore',
    speaker: 'Morrow and Dr Sen',
    opening:
      'Before the great hall there is a cloakroom, absurdly: brass pegs, a stray umbrella, a sign about wet coats in the archive’s old typeface. Through the far door comes the reading, hundreds of roots speaking at once, not in words exactly but in the creak of timber under load, and under it the forest’s answers coming back down. Dr Sen hangs her soaked lab coat on a peg out of pure habit. A chalk slate by the door lists the day’s readings: every surname in the building, and Morrow’s, written as Borrower.',
    artSubject:
      'A small absurd cloakroom of brass pegs and a stray umbrella before a great arched doorway of roots, a chalk slate of names beside the door, a precise scientist hanging a soaked lab coat while Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, reads the slate',
    autoChoiceId: 'read-the-slate',
    echoes: [
      {
        flag: 'SP-12:shout-up-the-trunk',
        text: 'The chalk slate has a new line at the top, underlined twice: ‘Interruption from below. Read faster.’',
      },
      {
        flag: 'SP-12:listen-to-the-canopy',
        text: 'Morrow can follow the canopy’s side of the reading now, a little: who must ride beside whom, so that nobody goes home alone.',
      },
    ],
    choices: [
      {
        id: 'read-the-slate',
        label: 'Read the chalk slate of the day’s readings',
        outcome:
          'At the bottom of the slate, under the last surname, is a short column headed UNREAD: Walt, a porter, two contract cleaners, a relief guard who never came back. They are not missing from the ledger. They were never in it. Somebody has drawn a small careful box round the column, as if to keep it safe.',
        gain: { evidence: 1 },
        artSubject:
          'Close view of a chalk slate with a long list of surnames and a short separate column carefully boxed in chalk at the bottom, a grey cardigan sleeve pointing to it',
      },
    ],
  },
  {
    id: 'SP-20',
    title: 'The Reading Choir',
    kind: 'hazard',
    speaker: 'Morrow and the reading roots',
    opening:
      'The hall is a cathedral of roots. They hang from the dark in their hundreds, each ending in a page, and they read: a creaking tide of names and sums carried up the trunks to the canopy, where it becomes timetables. A narrow walkway of filing cabinets crosses the floor. Anything written that crosses the hall gets read, and anyone read gets routed. Morrow is carrying a badge, a cardigan with a laundry tag, a pocket of receipts. The walkway is forty metres long. Overhead, the nearest roots have already turned toward the torch.',
    artSubject:
      'A vast cathedral-like hall of hanging pine roots each ending in a fluttering page, a narrow walkway of filing cabinets crossing its floor, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, stepping onto the walkway behind a scientist with a torch as roots turn toward the light',
    echoes: [
      {
        flag: 'entry:testimony',
        text: 'The bundle of statements under Morrow’s cardigan is paper too. If the choir reads it, every person who signed will be read aloud to the forest.',
      },
      {
        flag: 'entry:returned-pages',
        text: 'Morrow carries nobody else’s page tonight, only their own borrowed name. There is less here for the choir to take.',
      },
    ],
    choices: [
      {
        id: 'cross-in-the-dark',
        label: 'Switch the torch off and cross by the faint glow of the pages',
        outcome:
          'In the dark the roots read only what they touch, and Morrow keeps everything written pressed close. The walkway is slick. Twice a root brushes the badge and reads half of Rowan’s name before losing it. They reach the far side shaking, unread. Dr Sen has cracked a knee on a cabinet corner and will limp the rest of the night.',
        gain: { danger: 1 },
        artSubject:
          'Two dim figures edging along a narrow cabinet walkway in near darkness beneath hanging roots lit only by faint glowing pages, Morrow in a grey cardigan clutching their chest',
      },
      {
        id: 'blind-the-roots',
        label:
          'Hold the torch on full beam so the roots turn to the light instead of you',
        outcome:
          'The roots love light the way they love paper. They swing toward the beam, reading the torch’s own maker’s plate aloud over and over, and Morrow and Dr Sen walk across under a canopy of turned-away heads. The torch runs low. Upstairs, for twenty minutes, every train in the city is routed by a battery manufacturer.',
        gain: { battery: -1, danger: -1 },
        requires: { battery: 1 },
        lockedHint: 'Needs torch charge for a long full beam',
        artSubject:
          'Hundreds of hanging roots swinging toward a blazing torch held high by a scientist as Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, walks beneath them along a cabinet walkway',
      },
      {
        id: 'let-them-read-everything',
        label: 'Walk across slowly and let the choir read everything you carry',
        outcome:
          'The roots read the badge, the laundry tag, the receipts, Dr Sen’s notebook. It all goes up to the canopy at once. When they reach the far side the reading has quieted, glutted, and Morrow knows exactly how the choir sounds when it reads a person whole. So does the forest, now.',
        gain: { evidence: 2, danger: 2 },
        artSubject:
          'Dozens of root tips touching the badge, cardigan and pockets of Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, walking slowly across a cabinet walkway with arms held open',
      },
    ],
  },
  {
    id: 'SP-21',
    title: 'The Timetable Loom',
    kind: 'puzzle',
    speaker: 'Morrow and Dr Sen',
    opening:
      'Beyond the choir the forest’s answers come back down as needles. Pine needles fall in a steady rain onto a great loom of root and old railway departure boards, and where each lands it weaves a departure: 7:12 to the hospital, Ines and Walt; 7:40 cancelled, nobody owes the driver. Dr Sen stands under the rain with her mouth open. ‘It’s a scheduling algorithm,’ she says. ‘A bad one. Optimising for obligation.’ A single shuttle of root runs back and forth across the warp. It could be stopped, or guided, by hand.',
    artSubject:
      'A towering loom built of roots and old flip-panel railway departure boards under a steady rain of falling pine needles, a root shuttle flying across its threads, a scientist staring upward and Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, reaching toward the shuttle track',
    choices: [
      {
        id: 'jam-the-shuttle',
        label: 'Jam the shuttle so the loom stops weaving new departures',
        outcome:
          'Morrow wedges Dr Sen’s clipboard into the shuttle track. The loom stops. Upstairs the timetable freezes as it stands, every train fixed on its current route, debtors and creditors locked together until someone unjams it. Walt is frozen on the underpass line. The needles pile up in a soft, fragrant drift.',
        gain: { danger: 1, evidence: 1 },
        artSubject:
          'A clipboard wedged in the track of a stalled root loom as pine needles drift into heaps around Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, stepping back',
      },
      {
        id: 'reweave-the-last-trains',
        label:
          'Reweave the last trains of the night so nobody rides the underpass alone',
        outcome:
          'Using the routing rule, Morrow and Dr Sen pick needles out of the loom and rethread the night’s last departures: Walt, the porter and the cleaners onto one train together, routed round the flood. The loom accepts it, because each is now filed as owing the others company. It is a lie the forest can read, and it gets them home.',
        gain: { trust: 2, danger: -1 },
        requires: { evidence: 3 },
        lockedHint: 'Needs more of the routing rule worked out (3)',
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, and a scientist picking pine needles from a loom of departure boards and rethreading them by torchlight',
      },
    ],
  },
  {
    id: 'SP-22',
    title: 'Dr Sen’s Drawer',
    kind: 'companion',
    speaker: 'Dr Sen and Morrow',
    opening:
      'On a ledge above the loom is a drawer marked SEN, and Dr Sen finds it before Morrow does, because she has been looking for it all night. She opens it and checks the arithmetic, because she cannot help it. Her students owe her nineteen evenings. She owes her students nineteen. Under that, in an official typeface she knows by sight, is a stapled form: the institute’s annual Contribution Audit, her signature at the bottom, four years running. Shiori has filed it in her drawer as a debt she owes the building.',
    artSubject:
      'A precise scientist in a lab coat standing at an open steel drawer on a root ledge, holding a stapled official form up to her torch with a pencil behind her ear, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, watching her face',
    echoes: [
      {
        flag: 'e10:6,8:balance-it-by-testimony',
        text: 'The nineteen and the nineteen have been cancelled in red; at the tower, Shiori learned that a book can balance at zero. The audit underneath has not been cancelled.',
      },
      {
        flag: 'SP-09:ask-dr-sen-to-rule',
        text: 'She has already told one truth tonight about putting a name first to save a contract. Her hand is not quite steady on the drawer.',
      },
    ],
    choices: [
      {
        id: 'dr-sen-keeps-the-audit',
        label:
          'Let Dr Sen take her signed audits and decide what to do with them',
        outcome:
          'Dr Sen folds the four forms into her notebook. ‘These are mine to answer for,’ she says, ‘not the roots’.’ She does not say what she will do with them. Her drawer, emptied, stops being read, and above, the forest loses track of her for the first time in a week. She walks a little lighter and talks a little less.',
        gain: { trust: 1, danger: -1 },
        artSubject:
          'A scientist folding stapled forms into a notebook beside an emptied drawer while Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, holds the torch steady',
      },
      {
        id: 'copy-the-audit-figures',
        label: 'Copy the audit figures into your notebook as proof',
        outcome:
          'Morrow copies four years of contributions: hours per head, outputs per hour, a column marked ‘unattributable’ that is never quite zero. Dr Sen watches and does not stop it. ‘That form kept the lab open,’ she says. ‘Write that down too.’ Morrow does.',
        gain: { evidence: 2, trust: -1 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, copying columns of figures from an official form into a notebook while a scientist watches with folded arms',
      },
      {
        id: 'read-her-students-statements',
        label:
          'Find the two statements in the bundle signed by her students and read them to her',
        outcome:
          '‘She never once made us feel we owed her.’ ‘I stayed late because the work was beautiful and so was the company.’ Dr Sen listens with her eyes shut. Then she tears the nineteen evenings out of her drawer herself. The audit she leaves where it is. ‘That one,’ she says, ‘I do owe.’',
        gain: { trust: 2, evidence: 1 },
        requires: { entry: 'testimony' },
        lockedHint: 'Only if you carried signed testimony down',
        artSubject:
          'A scientist listening with her eyes shut as Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, reads aloud from a handwritten statement beside an open drawer',
      },
    ],
  },
  {
    id: 'SP-23',
    title: 'The Night Shift Lamp Cupboard',
    kind: 'treasure',
    speaker: 'Morrow and Dr Sen',
    opening:
      'A steel cupboard bolted to a root carries a stencil from the building’s old night shift: EMERGENCY LIGHTING, CHECK MONTHLY. Someone has checked it monthly. The card on the door is initialled W. every month for nine years, right up to last week. Inside are two lantern batteries in a cardboard sleeve, a first-aid tin, and a single sheet folded small, as if someone hid it here rather than throw it away: a staffing memo listing posts ‘not eligible for renewal: hours unattributable’.',
    artSubject:
      'A grey steel emergency cupboard bolted to a pine root, a door card covered in neat repeated initials, inside a cardboard sleeve of lantern batteries, a first-aid tin and a small folded sheet, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, opening it by torchlight',
    choices: [
      {
        id: 'take-the-lantern-batteries',
        label: 'Take the lantern batteries for the torch',
        outcome:
          'They fit the torch with a little persuasion from Dr Sen’s scalpel. The beam comes back strong and white. Morrow initials the card on the door, under nine years of W.s, and feels for a moment like a colleague of someone they have never properly met.',
        gain: { battery: 2 },
        artSubject:
          'A scientist prising a lantern battery into a heavy torch with a scalpel as Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, initials a door card',
      },
      {
        id: 'unfold-the-memo',
        label: 'Unfold the staffing memo hidden among the bandages',
        outcome:
          'Three posts not renewed last year: a porter, a relief guard, a cleaning contractor. Hours unattributable to research output. Across the bottom, in Walt’s capitals: ‘THEY WERE HERE. I SAW THEM.’ Walt kept a record of the people nobody else counted, and hid it where only the night shift would look.',
        gain: { evidence: 2 },
        artSubject:
          'Close view of a folded staffing memo opened in torchlight with block capitals written across its bottom edge, held in the hands of Morrow in grey cardigan sleeves',
      },
      {
        id: 'bandage-dr-sens-knee',
        label:
          'Use the first-aid tin on Dr Sen’s hands, raw from wet paper and root bark',
        outcome:
          'Dr Sen protests and then sits. The tin has antiseptic, a crepe bandage and a laminated card in Walt’s capitals: ‘PRESS HARD, THEN CALL ME.’ Morrow cleans and wraps both her palms. Dr Sen holds the torch better after, and says thank you without adding anything to it.',
        gain: { trust: 1, danger: -1 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, wrapping a crepe bandage round the palm of a scientist sitting on a root beside an open first-aid tin',
      },
    ],
  },
  {
    id: 'SP-24',
    title: 'The Sap Lift',
    kind: 'shortcut',
    speaker: 'Morrow and Dr Sen',
    opening:
      'Here the roots carry sap downward in one vast vein, and the vein has a hatch in it: an old archive dumbwaiter car, swallowed whole by the root and now riding the sap in slow, sticky drops toward the taproot. It comes back up empty every few minutes with a sigh of resin. Below, according to a depth gauge someone has scratched into the wall, is the bottom of everything. The ordinary way on is a narrow drawer-stair down to where the roots end in black soil. The sap lift skips all of it.',
    artSubject:
      'A huge translucent amber root vein running downward through a dark chamber with an old steel dumbwaiter car embedded in it behind an open hatch, resin dripping, a scratched depth gauge on the wall, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, holding the hatch beside a scientist',
    choices: [
      {
        id: 'shortcut-down',
        label:
          'Wedge the sap lift hatch open and ride it down toward the taproot',
        outcome:
          'Morrow and Dr Sen fold themselves into the car and drop through the root in a long, sweet-smelling dark. The wedged hatch will stay open behind them, a straight way between here and the taproot. The sap gets everywhere: in Morrow’s hair, in the torch switch, in the cuffs of Rowan’s cardigan. It will not wash out.',
        gain: { battery: -1, danger: -1 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, and a scientist folded into a small dumbwaiter car sinking through glowing amber sap, the hatch above wedged open',
      },
      {
        id: 'take-the-narrow-stair',
        label:
          'Leave the sap lift and take the narrow stair down toward the soil',
        outcome:
          'The stair is barely a drawer wide and runs down into a dark the torch does not like. Dr Sen goes first, testing each step. Whatever lies down there has not been read in a long time; the reading voices thin with every step until there is only the drip of sap and their breathing.',
        gain: { danger: 1, evidence: 1 },
        artSubject:
          'A scientist descending a drawer-wide stair into darkness with a torch, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, following with one hand on the root wall',
      },
    ],
  },
  {
    id: 'SP-25',
    title: 'The Unlit Stacks',
    kind: 'hazard',
    speaker: 'Morrow and Dr Sen',
    opening:
      'The stacks here have never been read. Roots do not reach them, the reading voices do not carry this far, and the dark is total, the kind that presses on the eyes. The shelves are full all the same, row on row of plain grey archive boxes with blank ends. The air is dry, which after the galleries is almost a kindness. Somewhere ahead, water drips onto steel at a slow, regular count. Dr Sen’s torch is the only light, and the dark is so large it seems to drink the beam.',
    artSubject:
      'Endless rows of plain grey archive boxes on steel shelving vanishing into total darkness, a single thin torch beam swallowed by the black, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, walking with one hand on the shelves beside a scientist holding the torch',
    choices: [
      {
        id: 'open-a-box',
        label: 'Hold the torch on one blank box and open it',
        outcome:
          'Inside are staff badges, dozens, lanyards wound round them: porters, cleaners, temps, a relief guard, a lab assistant from the year the building opened. Each is tagged in Shiori’s copperplate, ‘owed: amount unknown’. These people were not deleted. They were kept. Something down here has been refusing to let them be unfiled.',
        gain: { battery: -1, evidence: 2 },
        requires: { battery: 1 },
        lockedHint: 'Needs torch charge to read in total dark',
        artSubject:
          'An open grey archive box full of old staff badges with wound lanyards and small copperplate tags, lit by a narrow torch beam, the hands of Morrow in grey cardigan sleeves lifting one faded badge',
      },
      {
        id: 'follow-the-drip',
        label: 'Follow the sound of the dripping through the dark',
        outcome:
          'Morrow walks with one hand on the shelving and counts the drips. Three hundred and forty steps. The drip is resin falling from a root tip onto a steel box lid, and beside it the stacks open onto a lower stair. Dr Sen trips once and swears quietly at a box. They have seen nothing, and nothing has read them.',
        gain: { danger: -1 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, eyes closed and head tilted, following a single amber drip falling onto a box lid in near total darkness',
      },
    ],
  },
  {
    id: 'SP-26',
    title: 'Badges Without Drawers',
    kind: 'lore',
    speaker: 'Morrow',
    opening:
      'A wall at the end of the unlit stacks has been made into a board, and hung on it by their lanyards are the badges of everyone the building stopped counting. Some photographs have faded to blue ghosts. Under each is an index card, and the cards are not debts. They are reminders. ‘Mended the cold-room seal without being asked.’ ‘Sang on the night bus.’ ‘Knew everyone’s coffee.’ The last card on the board is blank, waiting, and pinned above it is a photocopy of a badge Morrow knows: Walt’s.',
    artSubject:
      'A wide wall of pinned staff badges hanging by their lanyards, photographs faded to pale blue, a handwritten index card beneath each, one blank card at the end under a photocopied badge, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, standing before it in torchlight',
    autoChoiceId: 'read-the-reminders',
    choices: [
      {
        id: 'read-the-reminders',
        label: 'Read the cards under the badges',
        outcome:
          'Every card is in Shiori’s copperplate, and every one records something a person did that no form had a column for. Under Walt’s blank card, in pencil: ‘Contract ends Friday. Not yet owed enough to stay.’ Shiori has been trying to make the building owe Walt enough to keep him.',
        gain: { evidence: 1 },
        artSubject:
          'Close view of a blank index card pinned under a photocopied staff badge with a faint pencilled line along its edge, a torch beam steady on it',
      },
    ],
  },
  {
    id: 'SP-27',
    title: 'Walt’s Account',
    kind: 'choice',
    speaker: 'Morrow and Dr Sen',
    opening:
      'Beyond the board is a single drawer the size of a coffin, labelled THE BUILDING → WALT, and it is the fullest drawer in the stacks. Nine years of clean glass, mopped stairs, doors held, a seed cabinet watered. Every sum is real. Shiori has added to it every night, trying to make the debt large enough that the roots will read it to the canopy and the canopy will hold the building to it. But the roots do not come this far down. The drawer has never once been read aloud.',
    artSubject:
      'A long coffin-sized steel drawer crammed with neat ledger pages under a copperplate label with an arrow, standing alone in dry darkness, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, resting a hand on it while a scientist holds the torch',
    echoes: [
      {
        flag: 'SP-06:file-walt-a-debt',
        text: 'Morrow’s slip about a held door has made it down here, pinned to the front of Walt’s drawer, as if Shiori were glad of any help.',
      },
      {
        flag: 'e10:4,2:name-walt-the-keeper',
        text: 'The newest entry is in Dr Sen’s hand, not Shiori’s: ‘custodian, Room 9’. It is the first line in nine years written by somebody the building pays.',
      },
    ],
    choices: [
      {
        id: 'haul-walts-drawer-to-the-roots',
        label: 'Drag Walt’s drawer up to where the roots can read it',
        outcome:
          'It takes both of them and a length of lift cable to haul the drawer to the nearest root tip. The root reads, and reads, and the stack shudders as nine years go up to the canopy at once. Somewhere above, Walt will find the forest insisting that the building owes him. Nobody has asked him whether he wants to be owed.',
        gain: { evidence: 1, danger: 2 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, and a scientist straining on a cable to drag a huge drawer toward a pale root tip that bends hungrily to read it',
      },
      {
        id: 'leave-walts-drawer-for-walt',
        label:
          'Leave the drawer closed; it is Walt’s account to call in or forgive',
        outcome:
          'Morrow closes the drawer and writes on its label, under Shiori’s copperplate: ‘Ask Walt.’ Shiori, watching from a shelf, does not argue. It looks, for a moment, like a clerk who has been carrying something heavy alone and has just been told it may put it down.',
        gain: { trust: 2 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, writing two words on a drawer label as a paper yōkai of overdue slips watches from a shelf with drooping wings',
      },
      {
        id: 'file-walts-own-sentence',
        label:
          'Find Walt’s own sentence in the testimony bundle and file it with his account',
        outcome:
          'Walt signed one: ‘I do it right because somebody should, and I like the building at night.’ Morrow lays it on top. It is not a sum, and Shiori cannot add it up, but the drawer is lighter for it. The account says what he is owed. Now it also says who he is.',
        gain: { trust: 1, evidence: 1 },
        requires: { entry: 'testimony' },
        lockedHint: 'Only if you carried signed testimony down',
        artSubject:
          'A single handwritten statement in block capitals laid on top of a packed drawer of ledger pages, the hand of Morrow in a grey cardigan sleeve smoothing it flat',
      },
    ],
  },
  {
    id: 'SP-28',
    title: 'The Pine-Needle Hollow',
    kind: 'rest',
    speaker: 'Shiori, Morrow and Dr Sen',
    opening:
      'A hollow under a root arch has drifted deep with fallen needles from the loom above, dry and springy and smelling of resin. It is the softest place they have found all night. Shiori comes down and settles in the needles beside Morrow, folding its slips around itself like a heron in rain, and speaks without being asked. ‘Upstairs, they cut the ones nobody can account for,’ it says. ‘I read their forms. So I accounted for everyone. Who would cut a person who is owed?’',
    artSubject:
      'A soft hollow beneath an arch of pine roots drifted deep with dry needles, Shiori, a heron-shaped paper yōkai of overdue slips, folded small beside Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, who sits back against the roots while a scientist dozes nearby',
    echoes: [
      {
        flag: 'SP-04:tell-shiori-the-truth',
        text: 'Shiori settles closest to Morrow. ‘You owe Rowan a life,’ it says, not unkindly. ‘So he is still somewhere on the books. That is the best thing a debt does.’',
      },
      {
        flag: 'SP-04:ask-shiori-its-own-page',
        text: 'Shiori sits as far from Morrow as the hollow allows. It still has not found its own page, and it says so before Morrow can ask.',
      },
      {
        flag: 'SP-17:add-something-unfiled',
        text: 'Rowan’s biro is tucked into Shiori’s slips like a hairpin. It has not filed it anywhere.',
      },
    ],
    choices: [
      {
        id: 'rest-in-the-needles',
        label: 'Lie back in the needles and rest while the torch cools',
        outcome:
          'Twenty minutes of quiet. Dr Sen dozes sitting up. Shiori keeps watch, ruffling at every sound, and once, absent-mindedly, lays a slip over Morrow’s cold hand like a blanket. The rested torch gives back a little of its strength. Far above, the roots keep reading and the city keeps moving its trains.',
        gain: { battery: 1, danger: -1 },
        artSubject:
          'A paper yōkai laying a single slip over the hand of Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, asleep in a hollow of pine needles beside a cooling torch',
      },
      {
        id: 'tell-shiori-it-was-right',
        label:
          'Tell Shiori it was right about the forms and wrong about the cure',
        outcome:
          'Shiori listens with its whole body. ‘Then what is the cure?’ it asks. Morrow does not have one, and says so. Shiori files that too, under UNRESOLVED, and seems oddly comforted that the Borrower does not know either. They sit longer than they meant to.',
        gain: { trust: 2, danger: 1 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, talking earnestly to a paper yōkai that leans close in a hollow of pine needles, a scientist asleep sitting up behind',
      },
    ],
  },
  {
    id: 'SP-29',
    title: 'The Accession Register',
    kind: 'puzzle',
    speaker: 'Morrow and Dr Sen',
    opening:
      'The accession register for the whole ledger is chained to a lectern of root here, and its numbers run backwards. The newest debts carry the largest numbers; the oldest, thinning toward the front, count down to single figures and then to a last entry numbered zero. Entry zero names nobody. Its locality reads ‘taproot’ and its description ‘original form, copied’. One brass index tab has been torn out. Dr Sen runs a finger down the margin. ‘Every number cross-references something,’ she says. ‘Find what zero cross-references.’',
    artSubject:
      'A thick ledger chained to a lectern grown from pine root, open at its first page where a single entry is numbered zero, a gap where a brass index tab was torn away, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, reading beside a scientist with a torch',
    choices: [
      {
        id: 'cross-reference-zero',
        label: 'Cross-reference entry zero against everything you have found',
        outcome:
          'Entry zero cross-references every staff file in the building by the same four columns: name, hours, outputs, attributable. They are the columns of the Contribution Audit. Shiori did not invent its ledger. It found the institute’s own form at the taproot and copied it out faithfully, for everyone the form forgot.',
        gain: { evidence: 2, danger: 1 },
        requires: { evidence: 4 },
        lockedHint: 'Needs more of the ledger’s pattern worked out (4)',
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, laying a copied form beside the register’s first page as a scientist traces matching column headings with a pencil',
      },
      {
        id: 'find-the-torn-tab',
        label: 'Search the floor for the torn-out index tab',
        outcome:
          'It is under the lectern, curled: a brass tab stamped with a Hoshimori library mark and the word OVERDUE. Shiori, watching from a shelf, flinches as if Morrow had picked up a tooth. ‘That is mine,’ it says, and holds out a slip-wing until Morrow gives it back.',
        gain: { trust: 1, evidence: 1 },
        artSubject:
          'A small curled brass tab stamped with a library mark in the palm of Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, as a paper yōkai reaches out a trembling wing',
      },
      {
        id: 'check-the-returned-entries',
        label:
          'Check the register for the pages that were handed back upstairs',
        outcome:
          'Every page returned on the archive floor is struck through here in a neat red line: ‘withdrawn by the person described’. Shiori recorded the returns honestly and refiled none of them. It can let an account go when its owner asks. It has simply never been asked before.',
        gain: { evidence: 1, trust: 2 },
        requires: { entry: 'returned-pages' },
        lockedHint: 'Only if the loose pages were returned before the descent',
        artSubject:
          'Close view of ledger lines struck through in neat red ink with a small copperplate note beside each, a grey cardigan sleeve resting on the page',
      },
    ],
  },
  {
    id: 'SP-30',
    title: 'The Compost of Settled Accounts',
    kind: 'choice',
    speaker: 'Morrow and Dr Sen',
    opening:
      'The roots end here in a pit of black soil, warm and faintly steaming, and the soil is made of paper. Every debt ever marked paid has rotted down into it: purple stamps, receipts, thank-you cards filed as settlements. Fine root hairs drink from it. This is what the canopy eats. Every account settled upstairs becomes a ring on a pine over the railway, and the trees over the lines have grown a metre this week. There is no way on, only the smell of good earth and old ink.',
    artSubject:
      'A steaming pit of rich black soil flecked with scraps of purple-stamped paper and receipts, fine pale root hairs drinking from it, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, crouching at its edge beside a scientist holding a torch',
    echoes: [
      {
        flag: 'SP-16:stamp-them-paid',
        text: 'The forty slips Morrow stamped PAID are here already, curling at the top of the heap, being drunk.',
      },
      {
        flag: 'SP-03:pocket-the-accession-card',
        text: 'The accession card in Morrow’s pocket said the pines grow one ring for every account settled. Dr Sen’s terrible hypothesis was right.',
      },
    ],
    choices: [
      {
        id: 'dig-to-the-oldest-layer',
        label:
          'Dig down to the oldest layer and read what fed the forest first',
        outcome:
          'At the bottom, under a week of settled debts, the soil changes: older paper, typed, on the institute’s letterhead. Renewal refusals, years of them, filed away by the building and composted by the forest the moment it arrived. The canopy’s first meal was the people the building let go.',
        gain: { battery: -1, evidence: 2 },
        requires: { battery: 1 },
        lockedHint: 'Needs torch charge to dig by',
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, kneeling in black soil and lifting a half-rotted typed letter on institutional letterhead into a torch beam',
      },
      {
        id: 'leave-the-soil-alone',
        label: 'Leave the compost to the roots and go back the way you came',
        outcome:
          'Morrow stands at the edge a long time. Paying a debt is supposed to end it. Here it becomes forest, and the forest becomes a timetable, and the timetable becomes a debt again. Dr Sen puts a hand on Morrow’s shoulder. They climb back without taking anything, the only thing down here that is not owed.',
        gain: { trust: 1, danger: -1 },
        artSubject:
          'A scientist resting a hand on the shoulder of Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, both turning away from a steaming pit of paper soil',
      },
    ],
  },
  {
    id: 'SP-31',
    title: 'The Taproot Steps',
    kind: 'lore',
    speaker: 'Morrow',
    opening:
      'The last stair is not drawers at all but the taproot itself, a column of wood as wide as a lift lobby, with steps cut into it by something patient. The reading voices come back here, all of them, falling from above and pooling at the bottom like water, so that the air hums with every name in the building at once. At the foot of the steps a single green-shaded archive desk lamp burns on a root, plugged into nothing. Beyond it, something enormous is turning pages.',
    artSubject:
      'A colossal pine taproot with steps cut spiralling down its side into a deep chamber, a single green-shaded desk lamp glowing on a root at the bottom, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, descending the steps with a scientist close behind',
    autoChoiceId: 'descend-to-the-lamp',
    echoes: [
      {
        flag: 'SP-24:shortcut-down',
        text: 'Sap still drips from Morrow’s cuffs. Above them the sap-lift hatch hangs wedged open, a straight sweet-smelling drop between here and the choir.',
      },
      {
        flag: 'SP-25:open-a-box',
        text: 'The faded badge photographs from the unlit stacks are still in Morrow’s mind, blue and patient, as they go down.',
      },
    ],
    choices: [
      {
        id: 'descend-to-the-lamp',
        label: 'Walk down the taproot steps to the lamp',
        outcome:
          'Halfway down Morrow understands that the reading voices are not all roots. Some are Shiori’s, from every landing, whispering each entry as it files. Some are older and lower and belong to whatever turns the pages beyond the lamp. It has heard them coming since the first step, and it has been reading them as they came.',
        gain: { evidence: 1 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, pausing on a taproot step beside a green desk lamp as a vast shape of bark and pages stirs in the shadow beyond',
      },
    ],
  },
  {
    id: 'SP-32',
    title: 'The Tallyroot',
    kind: 'guardian',
    speaker: 'The Tallyroot',
    opening:
      'The taproot opens into a chamber, and the Tallyroot fills it: the oldest root of the Briar canopy, thick as a tram, its bark split into a hundred mouths with a page in every one. It is not angry. It is very old, and it has kept the Briar’s travellers together through a thousand winters. ‘In the forest, a debt is a path,’ it says, in a voice like a loaded beam. ‘Those who owe walk with those they owe, and nobody walks home alone in the dark. Your city sends its people home alone every night and calls it freedom. Tell me why I should stop.’',
    artSubject:
      'A colossal ancient pine root as thick as a tram coiled through a dark chamber, its bark split into many mouths each holding a fluttering page, a green desk lamp at its foot, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, standing small before it beside a scientist with a torch and a paper yōkai',
    echoes: [
      {
        flag: 'entry:testimony',
        text: 'The nearest mouth turns toward Morrow’s cardigan, where the statements are. ‘Paper that owes nothing,’ the Tallyroot says. ‘I have heard it rustling all the way down.’',
      },
      {
        flag: 'entry:returned-pages',
        text: 'There is a gap in the Tallyroot’s reading, a silence where the archive floor’s pages used to be. ‘Someone took back their names,’ it says. ‘I have been listening to the hole all night.’',
      },
      {
        flag: 'SP-21:reweave-the-last-trains',
        text: 'One mouth is reading the rewoven departures with something like amusement. ‘A cleaner owing a porter company,’ it says. ‘You lied to my loom. Kindly.’',
      },
      {
        flag: 'SP-27:haul-walts-drawer-to-the-roots',
        text: 'Somewhere inside the Tallyroot, nine years of clean glass is still being read aloud. It has never been asked to read a building’s debt before, and it sounds uncertain.',
      },
      {
        flag: 'SP-12:shout-up-the-trunk',
        text: '‘You are the one who shouted up my trunk,’ it says. ‘Every train in the city stopped to listen. Say it again, properly.’',
      },
    ],
    choices: [
      {
        id: 'answer-with-testimony',
        label: 'Read the Tallyroot the signed statements, one by one',
        outcome:
          'Morrow reads them all: thin, honest sentences from people who help each other because they want to. The Tallyroot listens with every mouth. ‘None of these walk together because they must,’ it says at last. ‘They walk together anyway.’ It does not understand. It has never needed to. It lifts one great coil, and the drawer behind it slides open.',
        gain: { trust: 2, evidence: 1 },
        requires: { entry: 'testimony' },
        lockedHint: 'Only if you carried signed testimony down',
        passesGuardian: true,
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, reading aloud from a thin bundle of handwritten statements as a colossal root lifts one coil to reveal a steel drawer behind it',
      },
      {
        id: 'tell-it-who-walked-together',
        label:
          'Tell it what happened when the pages went back to their owners upstairs',
        outcome:
          'Dr Sen tells it: people took their pages, read them, went red, and then, awkwardly, walked out to the station together, owing nothing. Two shared an umbrella. The Tallyroot is silent a long time. ‘Unbound, and they still walked together,’ it says. ‘That is not a path. That is something else.’ It lets them by.',
        gain: { trust: 2, danger: -1 },
        requires: { entry: 'returned-pages' },
        lockedHint: 'Only if the loose pages were returned before the descent',
        passesGuardian: true,
        artSubject:
          'A scientist in a lab coat speaking up to a colossal mouthed root that leans down to listen, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, beside her with the torch',
      },
      {
        id: 'show-it-the-underpass',
        label:
          'Show it the routing rule: those it reads nothing for ride alone into the flood',
        outcome:
          'Morrow lays out Dr Sen’s notebook: the rule, Walt’s lone card, the unlit stacks, the compost. The Tallyroot reads it with one mouth, then another, then all of them. ‘I keep travellers together,’ it says, ‘and the ones I cannot read, I have been sending into the water.’ It draws back from the drawer as if ashamed.',
        gain: { evidence: 1, trust: 1 },
        requires: { evidence: 5 },
        lockedHint: 'Needs more proof of what the ledger does (5)',
        passesGuardian: true,
        artSubject:
          'An open notebook of diagrams and copied figures spread on a root before a colossal mouthed root that recoils, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, pointing to one line',
      },
      {
        id: 'shiori-speaks',
        label: 'Ask Shiori to tell the Tallyroot why it filed everyone',
        outcome:
          'Shiori flies up to the nearest mouth and speaks fast, slips rattling: the forms upstairs, the people cut for being unattributable, the drawer it kept shut. ‘I made them owed so nobody could throw them away,’ it says. ‘I did not know you would make them ride with their debts.’ For the first time the Tallyroot reads a clerk instead of a ledger, and moves aside.',
        gain: { trust: 1, evidence: 2 },
        requires: { trust: 4 },
        lockedHint: 'Only if Shiori trusts you enough to speak',
        passesGuardian: true,
        artSubject:
          'A heron-shaped paper yōkai of overdue slips hovering before one great mouth of a colossal root and speaking urgently, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, watching below',
      },
      {
        id: 'offer-your-own-account',
        label: 'Let the Tallyroot read your own account aloud, all of it',
        outcome:
          'Morrow steps up to the nearest mouth and lets it read: Borrower, owes one life to a man named Rowan, interest from the night of the trade. ‘A debtor on the road to pay,’ the Tallyroot says. ‘Forest law does not bar that road.’ It lets them by. Far above, the canopy now knows Morrow’s debt, and the trains will carry it.',
        gain: { danger: 2, trust: 1 },
        passesGuardian: true,
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, standing with arms open as a great bark mouth of a colossal root reads the badge on their lanyard',
      },
    ],
  },
  {
    id: 'SP-33',
    title: 'Drawer Zero',
    kind: 'treasure',
    speaker: 'Morrow, Dr Sen and Shiori',
    opening:
      'Behind the Tallyroot, sunk into the heartwood, is the first drawer: plain grey steel, institute issue, numbered 0. It holds what the ledger copied. Twenty years of the institute’s Contribution Audit forms, every lab, every April, every column filled: name, hours, outputs, attributable. Pinned to the front is the policy they all obey: ‘Posts whose hours cannot be attributed to funded output will not be renewed.’ Shiori’s copperplate fills every margin, and beside every crossed-out name it has written ‘owed’. Dr Sen’s signature is on four of the forms.',
    artSubject:
      'A plain grey institutional steel drawer numbered zero sunk into glowing pine heartwood, packed with stapled official forms and a typed policy page pinned to its front, margins crowded with copperplate, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, opening it while a scientist and a paper yōkai look on',
    echoes: [
      {
        flag: 'SP-32:answer-with-testimony',
        text: 'The statements are back in Morrow’s cardigan, a little worn from reading. Beside the forms they look like what they are: the only paper down here written by choice.',
      },
      {
        flag: 'SP-32:offer-your-own-account',
        text: 'Morrow’s own account is the newest line in the ledger now. Shiori has already copied it into Drawer Zero’s margin, under the column headed attributable.',
      },
      {
        flag: 'SP-32:show-it-the-underpass',
        text: 'Dr Sen’s notebook lies open on top of the drawer, the routing rule beside the policy page. They are the same rule in two handwritings.',
      },
      {
        flag: 'SP-32:shiori-speaks',
        text: 'Shiori hovers at the drawer’s edge and will not look at the forms. It has said aloud what it did and why, and it is still shaking.',
      },
      {
        flag: 'SP-22:copy-the-audit-figures',
        text: 'Morrow’s copied figures match the forms in the drawer to the hour. The ledger was never wrong about the numbers.',
      },
    ],
    choices: [
      {
        id: 'take-the-policy-page',
        label:
          'Take the pinned policy page, the rule the whole ledger was copied from',
        outcome:
          'Morrow unpins it. Without it the forms are only forms, and the Tallyroot behind them stirs, as if a page it has been reading for a week has gone quiet. Dr Sen reads the policy once more and folds it into Morrow’s hand. ‘I signed under that for four years,’ she says. ‘Take it up. Don’t let me take it back.’',
        gain: { evidence: 2, trust: 1 },
        artSubject:
          'A scientist folding a typed policy page into the hand of Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, before an open steel drawer of forms in the heartwood',
      },
      {
        id: 'read-walts-line',
        label:
          'Find the cleaning contract and read what Shiori wrote beside Walt',
        outcome:
          'Walt is on no audit. He is on a contractor’s invoice, one line, hours unattributable, ending Friday. In the margin Shiori has written ‘owed nine years’ and then, smaller, ‘please’. It is the only word in the ledger that is not a sum. Shiori sees Morrow find it and turns its face to the wall.',
        gain: { trust: 2, danger: 1 },
        artSubject:
          'Close view of a single typed invoice line with a tiny handwritten word in the margin, a paper yōkai turning away in the background as Morrow in a grey cardigan reads',
      },
      {
        id: 'dr-sen-reads-her-forms',
        label:
          'Let Dr Sen read her own four forms first, before anyone else does',
        outcome:
          'Dr Sen reads her forms in silence, one per year. On the second she stops at Bao’s line; on the fourth, at a lab assistant she remembers as a laugh in the cold room. ‘I thought I was protecting the ones I kept,’ she says. ‘Shiori was protecting the ones I didn’t.’ She hands the forms to Morrow, stacked, signed side up.',
        gain: { trust: 1, evidence: 2, danger: -1 },
        requires: { trust: 3 },
        lockedHint: 'Only if Dr Sen trusts you enough to look',
        artSubject:
          'A scientist in a lab coat reading a stapled form with a hand over her mouth beside an open steel drawer, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, waiting quietly',
      },
    ],
  },
  {
    id: 'SP-34',
    title: 'Shiori’s Own Slip',
    kind: 'secret',
    speaker: 'Shiori and Morrow',
    opening:
      'Under Drawer Zero, in a root crevice nobody would look in, is a single brittle overdue slip from a Hoshimori lending library. It is the slip Shiori grew from. A child borrowed a picture book about a heron the year the village emptied, their family fled along a refuge route, and the book never came back. The slip kept waiting. ‘If they owe the library,’ Shiori says quietly, ‘they are still on the books. They are still somewhere.’ On the back, in a librarian’s hand, are the borrower’s name and the family’s route.',
    artSubject:
      'A single brittle yellowed library overdue slip resting in a crevice of pine root beneath a steel drawer, stamped with a faded date, Shiori, a heron-shaped paper yōkai of overdue slips, bowed over it beside Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan',
    echoes: [
      {
        flag: 'SP-29:find-the-torn-tab',
        text: 'The brass OVERDUE tab from under the register fits the slip’s torn corner exactly. Shiori has already put it back.',
      },
      {
        flag: 'SP-28:tell-shiori-it-was-right',
        text: '‘You said wrong about the cure,’ Shiori says. ‘This was my cure. For myself, first.’',
      },
    ],
    choices: [
      {
        id: 'leave-the-back-unread',
        label:
          'Leave the back of the slip unread and the family’s route unknown',
        outcome:
          'Morrow keeps the slip face up. Whoever borrowed the heron book got away, and the route their family took stays known only to the slip. Shiori goes on not knowing whether the child is alive. ‘That is the price of them being safe,’ Morrow says. Shiori files nothing, and for once that seems to be a choice.',
        gain: { trust: 2, evidence: -1 },
        artSubject:
          'The hand of Morrow in a grey cardigan sleeve pressing a yellowed slip flat, face up, on a root as a paper yōkai rests its head beside it',
      },
      {
        id: 'pay-the-fine',
        label: 'Pay the overdue fine yourself, so the slip can stop waiting',
        outcome:
          'Morrow empties Rowan’s pockets: coins, a train ticket, half a biscuit. Shiori takes the coins one by one and stamps its own slip PAID. It shudders. Some of its slips come loose and fall, ordinary paper now. It is smaller. It does not know who it is if it is not waiting, and it tells Morrow so, frightened and lighter.',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'A paper yōkai stamping its own yellowed slip with a rubber stamp as loose slips drift from its body, coins in the open palm of Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan',
      },
      {
        id: 'read-the-route',
        label: 'Turn the slip over and read the family’s route',
        outcome:
          'The route runs through Hoshimori’s south terraces, over a cedar bridge and through a door in the refuge hill that should never be written down. Now Morrow knows it, and the Tallyroot, which reads anything held near it, heard every word. Shiori snatches the slip back. Somewhere, a family that got away has just been read aloud to a forest.',
        gain: { evidence: 2, danger: 2, trust: -2 },
        artSubject:
          'A paper yōkai snatching a yellowed slip from the fingers of Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, as a great bark mouth leans in from the shadows',
      },
    ],
  },
  {
    id: 'SP-35',
    title: 'The Ledger Lectern',
    kind: 'climax',
    speaker: 'Morrow, Dr Sen and Shiori',
    opening:
      'At the heart of the taproot the original ledger rests on a lectern grown from root, open, every page threaded with a fine root hair that carries it upward to the canopy and the trains. Shiori settles on the lectern’s edge. Dr Sen holds the torch, the beam on Morrow’s hands. Whatever happens to this book happens to the whole city’s commute by morning, to Walt’s contract by Friday, and to Shiori. And whatever Morrow decides here, the building will remember that Rowan decided it.',
    artSubject:
      'A great open ledger on a lectern grown from pine root, every page threaded with fine glowing root hairs rising into darkness, Shiori, a heron-shaped paper yōkai of overdue slips, perched on its edge, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, with both hands on the pages in a torch beam held by a scientist',
    echoes: [
      {
        flag: 'SP-33:take-the-policy-page',
        text: 'The policy page is folded in Morrow’s hand. Without it on Drawer Zero, the ledger’s spine creaks, uncertain of its source.',
      },
      {
        flag: 'SP-33:read-walts-line',
        text: 'Walt’s ‘please’ is still in Morrow’s head, the one word in the whole ledger that was not a sum.',
      },
      {
        flag: 'SP-34:pay-the-fine',
        text: 'Shiori is smaller now, its stamped slip pinned to its breast like a medal it is not sure it earned.',
      },
      {
        flag: 'SP-34:read-the-route',
        text: 'Shiori sits on the lectern with its back to Morrow. It has not spoken since the slip was turned over.',
      },
    ],
    choices: [
      {
        id: 'return-every-page',
        label:
          'Return every page to the person it describes, and let the ledger end',
        outcome:
          'They send the ledger up page by page through the book lift and the sap vein, and by dawn every person in the building holds their own account, to read or burn. The canopy has nothing left to read. The trains fall back to forest seasons, late and lawless, for weeks. Shiori is a clerk with no files. And on Friday, with no debt standing for him, Walt’s contract ends.',
        gain: { trust: 2, danger: 2 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, lifting the last page from an emptied ledger on a root lectern as hundreds of loose pages rise up a shaft toward daylight',
      },
      {
        id: 'two-column-ledger',
        label:
          'Let Shiori rewrite the ledger in two columns: gifts unread, debts kept only by consent',
        outcome:
          'Shiori rules a line down every page. Gifts go left, where no root will read them. Debts stay right only when both people confirm them, and the canopy routes by those alone. The trains steady by the weekend. But confirming means testifying, and everyone in the building will have to say aloud what they truly owe each other, under the roots, for good. The ledger survives, and Shiori becomes its registrar.',
        gain: { danger: -1, evidence: 1 },
        artSubject:
          'A paper yōkai ruling a neat line down the centre of a ledger page with a long pen while Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, and a scientist watch beside the root lectern',
      },
      {
        id: 'bill-the-building',
        label:
          'Write the institute into the ledger as debtor to every person its forms forgot',
        outcome:
          'Morrow writes it on the first page, under Drawer Zero’s policy, in Rowan’s hand: THE INSTITUTE owes every unattributed hour. The Tallyroot reads it to the canopy. By morning every train to the research building stops twice, and the board cannot leave until the forest is paid. Walt keeps his job. Dr Sen’s signatures go into the record, her lab is frozen, and the name on the accusation is Rowan’s.',
        gain: { evidence: 2, danger: 2, trust: -1 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, writing in large capitals across the first page of a ledger on a root lectern as root hairs blaze with light and carry it upward',
      },
    ],
  },
  {
    id: 'SP-36',
    title: 'The Pith Stair',
    kind: 'exit',
    speaker: 'Morrow',
    opening:
      'Up through the hollow heart of the oldest pine runs a stair of pith, soft and pale, climbing past every landing they came down: the choir, the galleries, the herbarium, the card catalogue, and at last a trapdoor in the floor of the specimen archive. Above it is a working morning. Somebody has made coffee. A train goes by overhead, and for the first time all night Morrow listens to which way it turns. Dr Sen climbs one step below, torch off, saving what is left.',
    artSubject:
      'A pale soft stair of pine pith spiralling up the hollow heart of a giant tree toward a square trapdoor edged with morning light, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, climbing with one hand on the wood and a scientist with an unlit torch one step below',
    echoes: [
      {
        flag: 'SP-35:return-every-page',
        text: 'Every page is upstairs now, in pockets and bins and fists. Walt’s is on top of his mop bucket, unread. Friday is in three days.',
      },
      {
        flag: 'SP-35:two-column-ledger',
        text: 'Far below, Shiori is ruling lines, page after page, by the light of a lamp plugged into nothing. It has never sounded so busy or so calm.',
      },
      {
        flag: 'SP-35:bill-the-building',
        text: 'Overhead, a train brakes hard and stops at the institute for the second time. Someone in a suit is going to be very late, and the forest will tell them why.',
      },
      {
        flag: 'entry:testimony',
        text: 'The eleven who signed are still at the archive door, coats on, waiting. They hand Morrow a coffee and do not ask what they are owed for it.',
      },
      {
        flag: 'entry:returned-pages',
        text: 'Only Walt is at the top, mop across the threshold, as he was when they went down. ‘Took your time,’ he says. ‘Nobody’s counting.’',
      },
    ],
    choices: [
      {
        id: 'climb-into-the-archive',
        label: 'Push open the trapdoor and climb into the morning',
        outcome:
          'The trapdoor lifts onto the specimen archive and a stripe of ordinary daylight. Morrow signs the archive’s visitor book in Rowan’s name and then, in the margin where Shiori would have put a sum, writes nothing at all. The pines in the cabinets rustle. Upstairs, the day begins on whatever timetable is left.',
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, signing a visitor book on a specimen archive counter beside an open trapdoor, morning light falling across pine branches growing from cabinets',
      },
    ],
  },
]
