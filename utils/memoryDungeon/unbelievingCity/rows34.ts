import type { MorrowShiftSite } from '../morrowShift/types'

export const UNBELIEVING_CITY_ROWS_3_4: readonly MorrowShiftSite[] = [
  {
    key: '1,3',
    place: 'Library Steps Subway Entrance',
    title: 'The Escalator That Only Goes Down',
    speaker: 'A stranger in a raincoat',
    kind: 'monster',
    opening:
      'Under the library steps the subway entrance breathes out warm air that smells, faintly, of the sea. The escalator is running down, and on it a man in a raincoat is climbing, steadily, as he has for an hour, without gaining a step. Morrow knows him: the stranger who once pointed him to one button. He looks up and says, very politely, ‘I think I’m late for something.’',
    artSubject:
      'A subway entrance beneath wide stone library steps at night, impossible golden rain falling past the mouth of the stairs; a man in a dripping raincoat climbs a down escalator and stays in place; an androgynous adult in their thirties with short dark hair and a grey cardigan stands at the top, gripping the rubber handrail; flickering emergency lights below, warm tiled glow.',
    echoes: [
      {
        flag: 'e04:2,1:care',
        text: 'Mara’s roll call is still in Morrow’s ears: count only who’s actually here. This man is here, mostly.',
      },
      {
        flag: 'e04:2,1:risk',
        text: 'Morrow’s cardigan still smells of the coat-train. The man’s raincoat smells exactly the same.',
      },
    ],
    choices: [
      {
        id: 'care',
        label: 'Walk down and climb beside him, counting the steps aloud',
        outcome:
          'Morrow counts in English, then in the Marches’ tongue when English runs out. At three hundred and twelve the man’s foot finds the top plate as if it had always been there. His hands are as cold as platform rails. He thanks Morrow, asks what day it is, and laughs as if that were a joke.',
        effects: { trust: 2, supplies: -1, danger: 1 },
        artSubject:
          'Two figures climbing side by side up a down escalator in emergency light, an androgynous adult in a grey cardigan counting on their fingers, a man in a raincoat beside them, golden rain glittering at the entrance above.',
      },
      {
        id: 'risk',
        label: 'Buy him a ticket out. Every gate here obeys a paid fare',
        outcome:
          'The machine takes Rowan’s card and prints a single, dated yesterday. The escalator lurches into reverse and delivers the man to the top in seconds. He stares at the ticket, which already has his name printed on it, and asks who paid for him. Neither of them wants to know what it is a receipt for.',
        effects: { evidence: 1, danger: 2 },
        artSubject:
          'A man in a raincoat stumbling off the top of a suddenly reversed escalator, holding a small paper ticket and staring at it; an androgynous adult in a grey cardigan beside a glowing ticket machine; golden rain beyond.',
      },
      {
        id: 'emergency-stop',
        label: 'Press the red stop button, the way he once showed you',
        outcome:
          'The escalator halts with a clang and becomes, simply, stairs. The man walks up them in a minute, shaking. Behind him every escalator in the station has stopped too, and the station staff will spend the night walking the old and the tired up by hand.',
        effects: { danger: -1, supplies: -1 },
        artSubject:
          'A palm pressing a red emergency stop button on an escalator panel; a man in a raincoat climbing stilled metal steps toward the light; long dark escalators behind him, still, with tired commuters looking up.',
      },
    ],
  },
  {
    key: '2,3',
    place: 'Library Holds Shelf',
    title: 'Who Is Still Inside',
    speaker: 'Deepa',
    kind: 'puzzle',
    opening:
      'Since the rain, the stacks reshelve themselves after dark, aisles closing like books, and Deepa won’t switch off their lights while anyone is inside. The returns log by the holds shelf shows three drops: card 11 through the street slot at 8:20; card 52 at the inside desk at 7:40; card 06 at the inside desk at 8:35. The doors locked at eight, and Deepa has watched the only exit since. ‘Who do we know is in there?’',
    artSubject:
      'A public library holds shelf beside a returns sorter, a circulation librarian in her forties with reading glasses on a chain studying a printed log; behind her, dim tall shelves lean slightly closer together than shelves should; an androgynous adult in their thirties with short dark hair and a grey cardigan reads the log over her shoulder; golden rain on tall black windows.',
    choices: [
      {
        id: 'care',
        label: 'Search for card 11. It was the latest drop before 06',
        outcome:
          'The street slot opens onto the pavement. Card 11 belongs to a woman who posted her book from outside, in the gold rain, and went home. Morrow loses ten minutes in the 300s, and the stacks close another aisle while he works it out.',
        effects: { supplies: -1, danger: 1 },
        artSubject:
          'An androgynous adult in a grey cardigan peering down a library aisle that has visibly narrowed, a book return slot glowing on the wall behind them, golden rain through the window.',
      },
      {
        id: 'risk',
        label: 'Search for card 52. The inside desk was its last sighting',
        outcome:
          'Card 52 dropped its book before the doors locked, and went home at quarter to eight; Deepa remembers when he is already halfway down the aisle. The shelves lean in on an empty floor. He backs out with a bruised shoulder and the shelf closes where he stood.',
        effects: { danger: 2 },
        artSubject:
          'An androgynous adult in a grey cardigan squeezing sideways out of a library aisle as two tall bookcases slide shut behind them, dust in the lamplight, a librarian calling from the end of the row.',
      },
      {
        id: 'card-six',
        label: 'Search for card 06. It dropped a book after the doors locked',
        outcome:
          'In a narrowing aisle of the 500s a fifteen-year-old sits on a kick-stool with his hood up, reading hard so as not to watch the shelves move. Morrow walks him out between two closing cases. Deepa turns off the lights, and the stacks settle like a breath let go.',
        effects: { evidence: 2, trust: 1 },
        artSubject:
          'An androgynous adult in a grey cardigan guiding a hooded teenage boy by the shoulder down a closing library aisle, the boy clutching a science book, a librarian holding the light switch at the far end.',
      },
    ],
  },
  {
    key: '3,3',
    place: 'Found-in-Books Drawer',
    title: 'Every Letter Wants to Go',
    speaker: 'Deepa',
    kind: 'memory',
    opening:
      'Deepa’s drawer of things found in returned books is knocking. Every unposted letter in the library is straining at its flap: a love letter, a resignation, a note to someone’s late father, all creeping toward the door and the rain. Rowan’s letter to Jun pushes against Morrow’s pocket, warm as a hand. Deepa leans on the drawer with both arms. ‘They’ll go,’ she says, ‘whether anyone’s ready or not.’',
    artSubject:
      'A librarian leaning with both arms on a rattling wooden drawer, envelopes squeezing out from under its lip and inching across the floor toward a door streaked with golden rain; an androgynous adult in their thirties with short dark hair and a grey cardigan presses one hand flat over a cardigan pocket; low lamplight.',
    echoes: [
      {
        flag: 'e03:3,3:care',
        text: 'Morrow has carried it sealed all this while, and it has been getting heavier. Tonight he understands why: it has been trying to leave.',
      },
      {
        flag: 'e03:3,3:risk',
        text: 'The envelope Morrow tore open has sealed itself again in the night, the flap smooth, as if to say it was never his to read.',
      },
    ],
    choices: [
      {
        id: 'care',
        label: 'Hold Jun’s letter back. It is Rowan’s to send',
        outcome:
          'Morrow helps Deepa weight the drawer with two dictionaries and an atlas, and keeps a hand over his pocket until it stops pushing, near dawn. A few letters get away under the door. Jun’s does not. It is still Rowan’s to send, if he ever can.',
        effects: { trust: 1, supplies: -1 },
        artSubject:
          'A wooden drawer weighed down with a heavy atlas and two dictionaries, a librarian asleep in a chair beside it; an androgynous adult in a grey cardigan sits on the floor with one hand over their pocket, grey dawn in the windows.',
      },
      {
        id: 'risk',
        label: 'Let it go, and follow it to Jun',
        outcome:
          'The envelope slips his pocket and skates under the door into the gold rain, Morrow running after it. At the corner postbox it posts itself, and the rain on the iron says, in Rowan’s voice, ‘I’ll call before spring.’ Morrow does not know what Jun will open now, or what it will say.',
        effects: { evidence: 2, trust: -1, danger: 1 },
        artSubject:
          'An envelope sliding into a red street postbox by itself under impossible golden rain, an androgynous adult in a grey cardigan skidding to a stop on the wet pavement behind it, streetlights and emergency glow.',
      },
    ],
  },
  {
    key: '4,3',
    place: 'Public Computer 6',
    title: 'The Summons Comes Back',
    speaker: 'Morrow',
    kind: 'challenge',
    opening:
      'The bank email is back on Computer 6, and this time it is right. It knows Rowan’s mother’s maiden name, the flat number, the hour Morrow arrived on Earth. At Computer 5 an old man has been typing his password into the same red summons since closing, eyes wet, unable to stop. The deadline in the corner reads midnight, on a clock nobody set.',
    artSubject:
      'A row of public library computers at night, every screen glowing the same alarm red; an old man sits rigid, typing, tears on his cheeks; an androgynous adult in their thirties with short dark hair and a grey cardigan stands behind him, staring at the screens; golden rain on black windows, flickering strip lights.',
    echoes: [
      {
        flag: 'e03:4,3:care',
        text: 'The retired postman at the help desk catches Morrow’s eye and nods. He remembers the last one, and he is already standing up.',
      },
      {
        flag: 'e03:4,3:risk',
        text: 'Last time Morrow demanded its true name. Tonight the email opens: ‘As you asked, our true name is’, followed by a blank that is still loading.',
      },
      {
        flag: 'e03:4,3:log-out',
        text: 'Morrow let the last deadline pass. This one has a new line beneath it: ‘We noticed.’',
      },
    ],
    choices: [
      {
        id: 'care',
        label: 'Pull the plug on the whole row at the wall',
        outcome:
          'The row goes dark mid-sentence: three essays, a visa form, Deepa’s catalogue update. The old man blinks, finds his hands, and starts to cry with relief. Nobody thanks Morrow for the essays, and they are right not to.',
        effects: { danger: -2, supplies: -1 },
        artSubject:
          'An androgynous adult in a grey cardigan kneeling under a desk yanking a power strip from the wall; above, a row of library monitors gone black; an old man slumping back in his chair, freed; startled patrons.',
      },
      {
        id: 'risk',
        label: 'Answer it yourself so it lets go of him. Give it a name',
        outcome:
          'Morrow types ‘Rowan’, because that is the name on the card. The old man’s screen goes white and he slumps free. Morrow’s screen says ‘Thank you, Rowan. We will be in touch,’ and somewhere in the building a printer begins, patiently, to print.',
        effects: { trust: 1, evidence: 1, danger: 2 },
        artSubject:
          'An androgynous adult in a grey cardigan typing one word at a red-lit library computer while beside them an old man collapses back, released; a distant printer in the dark spilling paper; golden rain outside.',
      },
      {
        id: 'help-desk',
        label: 'Fetch the retired postman from the help desk',
        outcome:
          'The postman comes at a jog, takes one look and puts a hand gently over the old man’s eyes, the way you would with a frightened horse. It breaks the stare. It does not close the email, which is still waiting on both screens when they leave.',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'A retired postman in a cardigan cupping a gentle hand over an old man’s eyes at a red-glowing library computer, an androgynous adult in a grey cardigan steadying the old man’s shoulder; fluorescent light.',
      },
    ],
  },
  {
    key: '5,3',
    place: 'Winter Coat Rail',
    title: 'Coats Off the 6:10',
    speaker: 'Deepa',
    kind: 'treasure',
    instant: true,
    opening:
      'The coat rail by the radiator is full again, and none of these coats was here at lunchtime. They came up from the subway in a transit-police bin: coats off the trains that came back without their passengers, each still warm through, tickets in the pockets. Deepa has hung them carefully, the way you hang coats for guests who will be back for them.',
    artSubject:
      'A clothes rail crowded with commuters’ coats beside an old library radiator, sleeves hanging as if still filled, a faint steam rising from the wool; a librarian smoothing a collar; an androgynous adult in their thirties with short dark hair and a grey cardigan reaching into a pocket; golden rain on the window.',
    echoes: [
      {
        flag: 'e04:2,1:care',
        text: 'Mara’s roll call counted only who was really on the platform. Morrow sees now that these coats are the other half of her list.',
      },
      {
        flag: 'e04:2,1:risk',
        text: 'Morrow rode a carriage full of these. He knows exactly how their sleeves sway when nobody is in them.',
      },
    ],
    choices: [
      {
        id: 'notice',
        label: 'Check one pocket for a name',
        outcome:
          'A navy anorak with a hospital name badge, ‘P. Mensah, Ward 3’, and a half-eaten roll of mints. Morrow copies the name down for Mara’s roll call and takes nothing. Deepa hands him a dry scarf from the old lost-property pile anyway.',
        effects: { evidence: 1, supplies: 1 },
        artSubject:
          'Close view of a hand in a grey cardigan sleeve holding a hospital name badge drawn from a navy anorak pocket, a small notebook open beside it; radiator glow.',
      },
    ],
  },
  {
    key: '6,3',
    place: 'Periodicals Reading Table',
    title: 'Pencil Against the Impossible',
    speaker: 'Dr Sen',
    kind: 'companion',
    opening:
      'Dr Sen is at the periodicals table with a fresh notebook, logging the gold rain as she would any instrument: time, duration, what it said. ‘It repeats people,’ she tells Morrow. ‘Their broken promises. Mine was a letter to my sister.’ She does not ask him to explain it. She asks whether he will help her measure it, or help her ring round the flats to check who’s home.',
    artSubject:
      'A long library periodicals table under green reading lamps; a patient older scientist writes in a notebook with a pencil, a wristwatch propped open beside it, golden rain streaming down the tall windows; an androgynous adult in their thirties with short dark hair and a grey cardigan sits across from her, a phone list between them.',
    echoes: [
      {
        flag: 'SB-35:finish',
        text: 'Under her elbow is Rowan’s sleep study, finished, under his name. In the margin of the last chapter she has written ‘who?’ in pencil, and shown no one.',
      },
      {
        flag: 'SB-35:confess',
        text: 'Morrow’s account of the night of the trade is folded inside her notebook. She hasn’t mentioned it. She has, tonight, stopped saying ‘impossible’.',
      },
      {
        flag: 'SB-35:return',
        text: 'Rowan’s sealed boxes are still in Sublevel B, untouched. The first thing she asks is whether they are above the waterline.',
      },
    ],
    choices: [
      {
        id: 'care',
        label: 'Ring round the flats with her and check who’s home',
        outcome:
          'They take the library’s two phones and the residents’ list. Forty calls; thirty-one answer. Of the other nine, Dr Sen marks four for a knock on the door tonight. The notebook gets no further than its first page, and she doesn’t seem to mind.',
        effects: { trust: 2, danger: -1, evidence: -1 },
        artSubject:
          'An older scientist and an androgynous adult in a grey cardigan each on a library desk phone, a printed residents’ list between them with pencil ticks; green lamps, golden rain on the glass.',
      },
      {
        id: 'risk',
        label: 'Tell her what you half-understand of it, Briar words and all',
        outcome:
          'She writes down every word without comment: ‘the promise is the price, the rain is the receipt.’ Then she checks it against her log and finds it half right, which is worse than wrong. They have a theory by midnight, and nine people nobody has called.',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'An older scientist writing rapidly in a notebook while an androgynous adult in a grey cardigan speaks with their hands shaping something invisible above the table; untouched desk phone at the edge; golden rain outside.',
      },
    ],
  },
  {
    key: '7,3',
    place: 'Library Steps Coffee Cart',
    title: 'Cash Only, No Promises',
    speaker: 'Teodor',
    kind: 'merchant',
    opening:
      'Teodor keeps the cart open because, he says, people coming up out of the subway need something hot in their hands. Gold rain drums on the striped awning, and under it his own voice says ‘I’ll close early Thursdays, love, I promise,’ over and over. He doesn’t look up. ‘Cash only. The card machine keeps charging yesterday.’',
    artSubject:
      'A small coffee cart under a striped awning at the foot of wet stone library steps, impossible golden rain sheeting off the canvas; a barista in a knitted hat pours with his head down; tired commuters huddle on the steps; an androgynous adult in their thirties with short dark hair and a grey cardigan counts coins; emergency lights from the subway mouth.',
    echoes: [
      {
        flag: 'e03:7,3:care',
        text: 'The old loyalty card still hangs on its peg by the till: ‘For whoever comes first.’ Teodor taps it. ‘Nobody’s come.’',
      },
      {
        flag: 'e03:7,3:risk',
        text: 'The punched card is still in the till drawer. Tonight its four green stamps have turned the colour of the rain.',
      },
      {
        flag: 'e03:7,3:usual-order',
        text: 'He has the oat flat white poured before Morrow reaches the cart, and says nothing about the extra hot.',
      },
    ],
    choices: [
      {
        id: 'care',
        label: 'Spend Rowan’s cash on cups for everyone on the steps',
        outcome:
          'It buys eleven cups, and Teodor knocks off the last three without saying so. They go to a bus driver, a mother with twins, a man in a hospital gown. Nobody on the steps asks what the rain is saying, which is its own kindness.',
        effects: { supplies: -2, trust: 2 },
        artSubject:
          'An androgynous adult in a grey cardigan handing paper cups along a row of commuters sheltering on library steps, a mother with twins, a man in a hospital gown, a bus driver; golden rain beyond the awning.',
      },
      {
        id: 'risk',
        label: 'Pay in the old way: promise him the money tomorrow',
        outcome:
          'Teodor shrugs and fills a flask. Overhead, the rain on the awning tries the new words in Morrow’s voice, testing their weight, then lets them go. For now. Morrow walks off warm, provisioned, and owed for.',
        effects: { supplies: 2, danger: 2 },
        artSubject:
          'An androgynous adult in a grey cardigan accepting a steel flask from a barista, both glancing up at a striped awning where golden rain beads and gleams; wet steps, emergency glow.',
      },
    ],
  },
  {
    key: '8,3',
    place: 'Children’s Library Wall',
    title: 'The Drawings Kept Watch',
    speaker: 'Morrow',
    kind: 'memory',
    instant: true,
    opening:
      'The ‘Draw Your Street’ wall has changed while nobody was looking. The bus with teeth now has its mouth shut and its headlights on, like something waiting. The bin lorry’s twelve eyes are all coloured in. And the crayon map signed T and 8 has a new dotted path pressed hard into the paper, around a fountain whose gravel mouth is dark and wet.',
    artSubject:
      'A children’s library wall of crayon drawings at night, a toothy bus with glowing headlights, a many-eyed bin lorry, and a crayon park map with a damp dark stain spreading from its drawn fountain; an androgynous adult in their thirties with short dark hair and a grey cardigan stands among tiny chairs, uneasy; golden rain on the window.',
    choices: [
      {
        id: 'notice',
        label: 'Touch the wet fountain',
        outcome:
          'It is wet. Morrow touches his fingertip to his tongue, as one does in the Marches, and tastes salt: sea water, miles inland, soaking up through a child’s drawing. He copies the new path into Rowan’s notebook, line for line.',
        effects: { evidence: 1, danger: -1 },
        artSubject:
          'Close view of a fingertip in a grey cardigan sleeve touching a damp crayon fountain on a child’s drawing, the paper rippled with water; a small notebook open below with the dotted path copied.',
      },
    ],
  },
  {
    key: '1,4',
    place: 'Night-School Lift',
    title: 'The Floor Between Floors',
    speaker: 'Bea',
    kind: 'memory',
    opening:
      'The night-school lift has started stopping at a floor the building doesn’t have. Between first and second the doors open onto a dark corridor of old wooden desks, a coat on a hook, and the smell of a classroom from forty years ago. Bea, the bus mechanic, holds the door with her boot. ‘There’s someone down there,’ she says. ‘I heard them ask the time.’',
    artSubject:
      'An old lift with its doors open onto an impossible dim corridor of old wooden school desks fading into darkness, a single coat on a hook; a sturdy bus mechanic in overalls jams the door with her boot; an androgynous adult in their thirties with short dark hair and a grey cardigan peers out; amber lift light against cold blue dark.',
    echoes: [
      {
        flag: 'e03:1,4:care',
        text: 'Bea still has the in-joke from the night they were stuck, and uses it now, quietly, to keep them both breathing.',
      },
      {
        flag: 'e03:1,4:risk',
        text: 'Bea has a hand on Morrow’s belt before he has moved. ‘Not this time either,’ she says, and doesn’t let go until he nods.',
      },
      {
        flag: 'e03:1,4:parley',
        text: 'Bea glances at him. ‘Don’t bow to it,’ she says. ‘I think it’s listening now.’',
      },
    ],
    choices: [
      {
        id: 'care',
        label: 'Hold the doors with Bea and call out, but don’t step off',
        outcome:
          'They call for ten minutes. A voice answers once, an old woman asking whether the 9:40 has gone, and then is quiet. The doors close on their own. Bea writes the time on her hand to report it. Nobody on the second floor has heard of a floor between.',
        effects: { trust: 1, danger: -1 },
        artSubject:
          'A bus mechanic and an androgynous adult in a grey cardigan leaning out of an open lift into darkness, hands cupped to call, amber light spilling a short way onto old floorboards.',
      },
      {
        id: 'risk',
        label: 'Step off and find whoever asked',
        outcome:
          'Morrow walks into the dark between old desks. He finds a woman in a cleaner’s tabard asleep at one, a 1984 bus pass in her hand, and walks her back while the corridor stretches. Bea hauls them in by the sleeves. The woman asks why everyone looks so old.',
        effects: { trust: 1, evidence: 1, danger: 2 },
        artSubject:
          'An androgynous adult in a grey cardigan leading a sleepy older woman in a cleaner’s tabard down a long dark corridor of old desks toward a distant rectangle of amber lift light, where a mechanic reaches out.',
      },
    ],
  },
  {
    key: '2,4',
    place: 'Enrolment Desk',
    title: 'Two Ticks for Rowan',
    speaker: 'Mrs Baptiste',
    kind: 'memory',
    opening:
      'Mrs Baptiste’s register has two ticks against Rowan’s name tonight. One she made when Morrow walked in. The other was signed at seven, before he arrived, in Rowan’s quick, confident scrawl. ‘You signed in twice, love,’ she says, holding out a pen from the biscuit tin, ‘and the office hates that. Which one do I cross out?’',
    artSubject:
      'A folding table in a night-school corridor with a biscuit tin of pens and an open register; a warm older woman in a cardigan and lanyard holds out a pen; an androgynous adult in their thirties with short dark hair and a grey cardigan stares down at two marks beside one name; emergency lights and golden rain on the corridor windows.',
    echoes: [
      {
        flag: 'e03:2,4:care',
        text: 'Her stapled note about his signature is still clipped to the register. It no longer matches either of them.',
      },
      {
        flag: 'e03:2,4:risk',
        text: 'The seven o’clock signature is identical to the one Morrow traced last month. He is no longer sure which of them is the copy.',
      },
      {
        flag: 'e03:2,4:changed-signature',
        text: 'His change-of-signature form is still in her tin, waiting for a witness. Tonight she signs it herself, without being asked.',
      },
    ],
    choices: [
      {
        id: 'care',
        label: 'Cross out yours. The other one was here first',
        outcome:
          'Mrs Baptiste strikes Morrow’s tick, puzzled, and writes ‘visitor’ in the margin. For the rest of the evening he is officially nobody, and finds he breathes easier as nobody. The seven o’clock tick stays. No one comes to claim it.',
        effects: { trust: 1, supplies: -1 },
        artSubject:
          'An enrolment officer writing a small note in a register margin while an androgynous adult in a grey cardigan watches with odd relief; biscuit tin of pens, strip lights.',
      },
      {
        id: 'risk',
        label: 'Cross out the seven o’clock one. You are here, aren’t you?',
        outcome:
          'Her pen goes through it cleanly. Down the corridor a classroom door shuts, quietly, as if someone has been asked to leave. Morrow is the only Rowan on the register now, and cannot stop wondering whose place that was.',
        effects: { supplies: 1, danger: 1, trust: -1 },
        artSubject:
          'A pen striking a line through a signature in a register; in the background, far down a dim corridor, a classroom door swinging shut on its own; an androgynous adult in a grey cardigan turning to look.',
      },
      {
        id: 'find-the-other',
        label: 'Ask her to leave both, and go looking for the other Rowan',
        outcome:
          'He checks every room on the corridor. In Room 11 a chair by the window is still warm and a coat hook swings on its own. Nobody is there. Mrs Baptiste leaves both ticks and rings it through to the office as ‘query’.',
        effects: { evidence: 2, supplies: -1 },
        artSubject:
          'An androgynous adult in a grey cardigan standing in an empty night classroom, one hand on the back of a chair by a rain-gold window, an empty coat hook still swaying on the wall.',
      },
    ],
  },
  {
    key: '3,4',
    place: 'Room 14 Prediction Box',
    title: 'Salt in the Shoebox',
    speaker: 'Mr Okafor',
    kind: 'memory',
    instant: true,
    opening:
      'Mr Okafor tips out his shoebox of sealed predictions to check them against the evening, and sea water runs out over the desk, though the box has sat on a dry shelf all term. The cards are soaked. Every probability has washed off; only the words are left. Rowan’s still reads ‘I call Jun before spring’, with no number after it at all.',
    artSubject:
      'A night-school classroom; a tall teacher in a tweed jacket holds a dripping shoebox as salt water spills across his desk, soaked index cards fanned out; an androgynous adult in their thirties with short dark hair and a grey cardigan picks up one card; whiteboard of probability trees, golden rain on dark windows.',
    echoes: [
      {
        flag: 'e04:3,3:care',
        text: 'Rowan’s letter is still in Morrow’s pocket, and pushes once against him as the card goes by.',
      },
      {
        flag: 'e04:3,3:risk',
        text: 'Somewhere a postbox has taken Jun’s letter. The missing number feels, suddenly, like a window left open.',
      },
    ],
    choices: [
      {
        id: 'notice',
        label: 'Dry the cards on the radiator',
        outcome:
          'Morrow lays them out in rows like a small army of wet promises. Mr Okafor thanks him and says, quietly, that he will have to ask everyone for their numbers again, and that for the first time in thirty years he doesn’t know what to tell them.',
        effects: { evidence: 1, trust: 1 },
        artSubject:
          'Rows of damp index cards laid along a classroom radiator, steam rising; a teacher in a tweed jacket and an androgynous adult in a grey cardigan stand side by side looking down at them.',
      },
    ],
  },
  {
    key: '4,4',
    place: 'Room 14',
    title: 'The Gold Rain Timetable',
    speaker: 'Mr Okafor',
    kind: 'puzzle',
    opening:
      'Mr Okafor has turned the whiteboard into a log. Every train that left while gold was falling came back with only coats; every train that left in a dry gap came back full. Since nine the rain has kept its own timetable: twenty minutes of gold, ten minutes dry, over and over. It is 9:12. Bea and four students need a train home: the 9:25, the 9:35 express, or the 9:45.',
    artSubject:
      'A night-school classroom whiteboard covered in a hand-drawn timeline and train tallies; a tall teacher in a tweed jacket taps it with a marker; a bus mechanic and four tired students in coats wait by the door; an androgynous adult in their thirties with short dark hair and a grey cardigan counts minutes on their fingers; golden rain, then darkness, in the window.',
    echoes: [
      {
        flag: 'e03:4,4:care',
        text: 'Mr Okafor hands Morrow the marker. ‘You like the word not,’ he says. ‘We need it tonight.’',
      },
      {
        flag: 'e03:4,4:risk',
        text: '‘Don’t flatter the sky,’ Mr Okafor says, catching his eye. ‘The die didn’t hear you last time either.’',
      },
      {
        flag: 'e03:4,4:even',
        text: '‘A coin toss in a nicer coat,’ Mr Okafor reminds him. ‘Not tonight.’',
      },
    ],
    choices: [
      {
        id: 'care',
        label: 'Send them for the 9:25',
        outcome:
          'The 9:25 leaves under a sky the colour of an ordinary night. Bea texts from her stop: all five, and a woman who got on with them. Mr Okafor writes the method on the board and, beneath it, in small letters, ‘it held tonight’.',
        effects: { evidence: 2, trust: 1 },
        artSubject:
          'A train pulling out of a dark, dry platform with lit windows full of faces, a bus mechanic waving through the glass; on the platform an androgynous adult in a grey cardigan lets out a breath.',
      },
      {
        id: 'risk',
        label: 'The 9:35 express. Less time out on the line',
        outcome:
          'At the platform the gold starts again on the glass, and Morrow pulls the students back as the doors close. The express leaves full of nobody and returns an hour later with one coat on every seat. They walk home through the next dry gap, two miles, soaked.',
        effects: { danger: 2, supplies: -1 },
        artSubject:
          'An androgynous adult in a grey cardigan holding back four students and a mechanic on a platform as golden rain begins on the canopy glass and the doors of an empty express slide shut.',
      },
      {
        id: 'last-train',
        label: 'The 9:45. Wait as long as you can, then decide',
        outcome:
          'They wait on the platform benches while the gold starts again at half past. The 9:45 leaves in it, empty, and Morrow keeps them off. The next dry gap gets them on a slow train at ten, cold and late and all there.',
        effects: { supplies: -1, danger: 1 },
        artSubject:
          'A bus mechanic, four students and an androgynous adult in a grey cardigan huddled on a platform bench watching an empty train leave through golden rain; emergency lights along the platform edge.',
      },
    ],
  },
  {
    key: '5,4',
    place: 'Room 9 Workshop',
    title: 'Here, and Not Yet',
    speaker: 'Mara',
    kind: 'companion',
    opening:
      'Mara has turned Room 9 into an information desk: the shortbread tin, the platform roll call on a flipchart, two columns headed Here and Not Yet. A man in a bus driver’s jacket asks whether his wife was on the 6:10. Her coat came back; she didn’t. Mara looks at Morrow, because she has been honest all night and has run out of ways to say it.',
    artSubject:
      'A small night-school classroom turned information desk, a flipchart of names in two columns, an open tin of shortbread; a dry, exact woman in her thirties with a steward’s lanyard sits behind a table; a bus driver in his jacket holds a woman’s scarf; an androgynous adult in their thirties with short dark hair and a grey cardigan stands between them; golden rain on the window.',
    echoes: [
      {
        flag: 'e03:5,4:care',
        text: 'Every card on Mara’s table begins ‘the record shows’, his line from the payslip workshop. Tonight it is exactly the right phrase.',
      },
      {
        flag: 'e03:5,4:risk',
        text: 'The overtime Morrow signed for paid out this week. All evening the rain on the window has been saying ‘I worked them’ in his voice.',
      },
    ],
    choices: [
      {
        id: 'care',
        label: 'Tell him plainly what’s known and what isn’t, and stay',
        outcome:
          'Morrow tells him the coat came back and nobody yet knows more, and then sits with him on the plastic chairs for an hour, which is the only other thing he has. Mara writes the wife’s name under Not Yet, and underlines Yet.',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'An androgynous adult in a grey cardigan sitting beside a bus driver on plastic classroom chairs, both silent, a scarf in the driver’s hands; behind them a woman underlines a word on a flipchart.',
      },
      {
        id: 'risk',
        label: 'Promise him you’ll bring her back',
        outcome:
          'The man’s shoulders drop and he grips Morrow’s hand. Mara goes very still. At the window the gold rain tries the new promise in Morrow’s voice, softly, to see if it fits. It is a debt now, written where the whole city can hear.',
        effects: { trust: 1, evidence: 1, danger: 2 },
        artSubject:
          'A bus driver clasping the hand of an androgynous adult in a grey cardigan with desperate hope, a steward behind them frozen mid-note; golden rain streaming down the window glass.',
      },
    ],
  },
  {
    key: '6,4',
    place: 'Borrowed Lab Desk',
    title: 'The Gesture Answers',
    speaker: 'Morrow',
    kind: 'memory',
    opening:
      'The circuit diagrams are still spread under the lamp in the lab beside Room 14, and tonight their pencilled bulbs are faintly lit, one by one, in an order no circuit would allow. The wall clock reads twenty to ten, again. Morrow’s open hand remembers the shape it made over this desk last month. He wants, badly, to know whether the city answers him now.',
    artSubject:
      'An empty night-school science lab; hand-drawn circuit diagrams on a desk under a lamp, a few pencilled bulbs on the paper glowing faintly gold; an androgynous adult in their thirties with short dark hair and a grey cardigan stands over it, one hand half-raised; an ordinary wall clock at twenty to ten; golden rain on dark windows.',
    echoes: [
      {
        flag: 'e03:8,8:risk',
        text: 'He spoke the working at the fountain, once, into the rain. Ever since, he has been waiting for the bill.',
      },
      {
        flag: 'e03:8,8:care',
        text: 'He never spoke the working at the fountain. So if the city is answering someone, it isn’t him, and he would very much like to know who.',
      },
    ],
    choices: [
      {
        id: 'care',
        label: 'Keep your hands in your pockets and go help clear the corridor',
        outcome:
          'Morrow turns off the lamp. The bulbs go on glowing without it, which he decides not to have seen. Out in the corridor Bea needs a hand carrying the urn down to the front door, and that, he finds, is a question with an answer.',
        effects: { trust: 1, danger: -1 },
        artSubject:
          'An androgynous adult in a grey cardigan and a bus mechanic carrying a steel tea urn between them down a school corridor; behind them, through a lab doorway, faint gold dots glow on paper in the dark.',
      },
      {
        id: 'risk',
        label: 'Lift your hand again and find out',
        outcome:
          'Every drawn bulb flares at once, and down the corridor every strip light goes out with a sigh. Someone in Room 14 screams, then laughs at themselves. In the emergency glow Morrow has his proof, no idea what it proves, and a building of people feeling for the stairs.',
        effects: { evidence: 2, danger: 2, trust: -1 },
        artSubject:
          'An androgynous adult in a grey cardigan with one open hand above a desk of diagrams blazing with drawn golden light, the lab and corridor beyond plunged into red emergency lighting, silhouettes groping along the walls.',
      },
    ],
  },
  {
    key: '7,4',
    place: 'Corridor Tea Shelf',
    title: 'Cups for the Absent',
    speaker: 'Morrow',
    kind: 'treasure',
    instant: true,
    opening:
      'Every named paper cup on the corridor shelf is full and steaming, though the urn has been off since eight. The cups of students who didn’t make it in tonight are fullest, brimming and not spilling. Rowan’s cup, soft at the rim, holds tea exactly as he took it, which Morrow had to learn from a barista.',
    artSubject:
      'A school corridor shelf beside a cold steel tea urn, a row of worn paper cups with blank name patches all full and steaming, some brimming impossibly high; an androgynous adult in their thirties with short dark hair and a grey cardigan stares at them; strip lights, golden rain on the corridor window.',
    choices: [
      {
        id: 'notice',
        label: 'Carry the ordinary cups to the queue for the phone',
        outcome:
          'The tea is real and hot and tastes like tea. Morrow carries a tray of it to the queue for the one working payphone, and nobody asks where it came from. He leaves the absent students’ cups where they are, still full, in case.',
        effects: { supplies: 2 },
        artSubject:
          'An androgynous adult in a grey cardigan handing steaming paper cups along a queue of tired night-school students waiting by a wall payphone; emergency lights, wet coats.',
      },
    ],
  },
  {
    key: '8,4',
    place: 'Fire-Exit Map',
    title: 'Annotations Nobody Claims',
    speaker: 'Morrow',
    kind: 'memory',
    instant: true,
    opening:
      'Overnight the evacuation plan by the fire door has gained new biro, in a hand nobody in the class owns. ‘Back stairs: water to the third step.’ ‘Lift: don’t.’ ‘Room 9: dry.’ Beneath Rowan’s old arrow, ‘shortcut to the night bus, take it anyway’, someone has added two more words: ‘not tonight’.',
    artSubject:
      'A framed corridor evacuation plan by a fire door, crowded with old biro doodles and a few fresh, darker annotations; an androgynous adult in their thirties with short dark hair and a grey cardigan leans close, no longer smiling; green exit glow, golden rain on the door glass.',
    choices: [
      {
        id: 'notice',
        label: 'Check the back stairs',
        outcome:
          'Morrow opens the fire door. Water stands on the third step down exactly, black and still, smelling of the sea. He wedges the door shut with a chair, tells Mr Okafor, and the class goes home the long way, by the front.',
        effects: { evidence: 1, danger: -1 },
        artSubject:
          'An androgynous adult in a grey cardigan holding open a fire door onto metal back stairs, dark still water lying exactly at the third step down, a faint gleam of gold rain above the stairwell.',
      },
    ],
  },
]
