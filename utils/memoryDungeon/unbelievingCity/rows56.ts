import type { MorrowShiftSite } from '../morrowShift/types'

export const UNBELIEVING_CITY_ROWS_5_6: readonly MorrowShiftSite[] = [
  {
    key: '1,5',
    place: 'Kitchen Lost-and-Found Jar',
    title: 'Everything Comes Back Wet',
    speaker: 'Morrow',
    kind: 'treasure',
    instant: true,
    opening:
      'The pickle jar by the side door was half empty this morning. Now it is full to the lid, and everything in it is wet: a child’s glove, three wedding rings, a season ticket for a line that closed in 1998. The water beading on the glass tastes of salt, and the river is fresh. Underneath it all, dry as toast, sits a wind-up torch.',
    artSubject:
      'A glass pickle jar crammed to the lid with dripping lost things, a small glove, wedding rings and an old transit card, a dry wind-up torch at the bottom, on a community-kitchen windowsill while impossible golden rain streaks the glass, emergency light glowing amber outside.',
    choices: [
      {
        id: 'notice',
        label: 'Take the dry torch',
        outcome:
          'It cranks to a steady, ordinary white. Morrow leaves the wet things where they are. In the Marches, what the sea returns it may come back to collect, and he would rather it found them waiting than missing.',
        effects: { supplies: 1, evidence: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan cranking a wind-up torch beside a dripping pickle jar at a kitchen side door, gold rain falling in the yard beyond.',
      },
    ],
    echoes: [
      {
        flag: 'e03:1,5:notice',
        text: 'The bus pass Morrow took from this jar is still in his pocket. It has gone damp too, though nothing else in that pocket has.',
      },
    ],
  },
  {
    key: '2,5',
    place: 'Kitchen Roster Board',
    title: 'The Rota That Writes Itself',
    speaker: 'Rosa',
    kind: 'companion',
    opening:
      'The roster has filled itself in overnight, in blue biro nobody owns: shifts at 25:00, at ‘after’, at ‘until it’s done’. Rosa’s name is down for every one. She has tied her apron three times and her hands are tying it a fourth. ‘I’m fine,’ she says, swaying. ‘Somebody’s got to feed them.’ To Morrow it reads exactly like a geas: the ink binds whoever it names.',
    artSubject:
      'A cork roster board in a community kitchen crowded with blue handwriting in impossible time slots, a tired middle-aged cook in a canteen tabard swaying as her hands tie and retie her apron strings, an androgynous adult in their thirties with short dark hair and a grey cardigan reaching for the board, gold rain at the window, emergency strip light.',
    choices: [
      {
        id: 'care',
        label: 'Write your own name over Rosa’s',
        outcome:
          'Rosa’s hands stop. Morrow’s start. He scrubs and ladles and cannot sit down until the hour that doesn’t exist has passed. Rosa sleeps on two chairs under her coat, and when she wakes she makes him eat first, which no ink told her to do.',
        effects: { trust: 2, supplies: -1, danger: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan ladling soup with grim, compelled focus while a cook in a tabard sleeps across two plastic chairs under her coat, late-night kitchen light.',
      },
      {
        id: 'risk',
        label: 'Wipe the whole roster clean with a wet cloth',
        outcome:
          'The biro lifts as if it had never dried. Rosa sits down hard and cries for a minute, then laughs. But every volunteer the board named drifts home too, dazed, and the soup line has nobody behind it until Morrow and Rosa take the ladles themselves.',
        effects: { evidence: 2, supplies: -2 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan wiping a roster board blank with a wet cloth while a cook in a tabard sits on an upturned crate behind them, half laughing, half crying, an empty serving hatch beyond.',
      },
    ],
    echoes: [
      {
        flag: 'e03:2,5:care',
        text: 'The last time this board named him, Morrow scrubbed until close. Rosa remembers. ‘Not you again,’ she says, meaning it kindly.',
      },
      {
        flag: 'e03:2,5:risk',
        text: 'Morrow once matched Rowan’s loops on this board to a volunteer form. Tonight’s handwriting matches nobody’s, and he checks twice.',
      },
    ],
  },
  {
    key: '3,5',
    place: 'Kitchen Serving Hatch',
    title: 'The Soups Pass Along',
    speaker: 'Rosa',
    kind: 'puzzle',
    opening:
      'The boy is back at the hatch with his bowl up, and his mum says it once, tight: no nuts, no meat. Since the rain, the soups won’t stay in their pots. ‘Every time the bell goes they pass one along,’ Rosa says. ‘Window to stockpot, stockpot to back ring, back ring to window. I filled satay in the red window pot, chicken in the stockpot, lentil on the back ring.’ The bell has rung once since.',
    artSubject:
      'A community-kitchen serving hatch with three steaming pots, a red enamel pot by a window streaked with golden rain, a tall stockpot with a ladle standing in it and a dented steel pot on a back burner, a brass hatch bell, a small boy holding up an empty bowl beside his watchful mother, uneasy amber light.',
    choices: [
      {
        id: 'care',
        label: 'Serve from the red enamel pot by the window',
        outcome:
          'Lentil, plain and thick, in the pot that held peanut an hour ago. The boy eats. His mum watches the red pot the whole time as if it might change its mind, and Morrow, who has started to think like the soup, watches the bell.',
        effects: { evidence: 1, trust: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan ladling lentil soup from a red enamel pot into a child’s bowl, the mother’s eyes fixed on the pot, a brass bell on the hatch in the foreground.',
      },
      {
        id: 'risk',
        label:
          'Serve from the dented pot on the back ring, where lentil went in',
        outcome:
          'A chicken thigh rolls up in the ladle where the lentil was poured. Morrow tips it back before the boy sees. His mum has seen, and moves her son half a step behind her.',
        effects: { trust: -1, supplies: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan tipping a ladle of chicken soup back into a dented steel pot, a mother at the hatch drawing her son behind her.',
      },
      {
        id: 'stockpot',
        label: 'Serve from the tall stockpot with the ladle standing in it',
        outcome:
          'Peanut, orange and fragrant, sloshes up out of a pot that has never held it. The mum smells it before the spoon lands and pulls the bowl back, practised and furious. Behind Morrow, Rosa goes white.',
        effects: { trust: -1, danger: 1 },
        artSubject:
          'A mother snatching her son’s bowl away from a ladle of orange peanut stew rising out of a tall stockpot, an androgynous adult in their thirties with short dark hair and a grey cardigan frozen mid-pour, a cook pale at the sink.',
      },
    ],
    echoes: [
      {
        flag: 'e03:3,5:care',
        text: 'The mum remembers the lentil night, and that Morrow listened. She holds out the bowl to him and nobody else.',
      },
      {
        flag: 'e03:3,5:risk',
        text: 'The mum remembers Morrow reaching for the red pot once before. She hands over the bowl only after Rosa nods.',
      },
    ],
  },
  {
    key: '4,5',
    place: 'Dish Pit',
    title: 'Bernard Keeps a Promise',
    speaker: 'Morrow',
    kind: 'monster',
    opening:
      'Bernard the dish machine is running with nobody feeding it, door shut, red eye lit, cycle after cycle. Gold rainwater pours in through the gutter feed. Each time the steam vents, a voice comes out of it, Rosa’s: ‘I’ll be home by nine, love, promise.’ Rosa stands frozen with a tray. It is twenty past eleven. The steam is getting hotter, and the door has started to bulge.',
    artSubject:
      'A battered industrial dish machine in a cramped dish pit, door bulging, golden water pouring in from a gutter pipe, steam jetting in a shape almost like a mouth, a single red indicator light, a cook frozen holding a tray, an androgynous adult in their thirties with short dark hair and a grey cardigan stepping between them.',
    choices: [
      {
        id: 'care',
        label: 'Kill it at the isolator and bail the gold water out by bucket',
        outcome:
          'The red eye goes dark, but the voice goes on, smaller, through the drain. Morrow and Rosa bail gold water into the yard for half an hour. When it’s done Rosa rings home, and Morrow does the trays so she can talk.',
        effects: { supplies: -1, trust: 1, danger: -1 },
        artSubject:
          'A cook and an androgynous adult in their thirties with short dark hair and a grey cardigan carrying buckets of glowing gold water out of a dark dish pit into a rainy back yard, the dish machine silent behind them.',
      },
      {
        id: 'risk',
        label: 'Open the door to see what’s speaking inside',
        outcome:
          'Steam takes the skin off his wrist. Inside are only trays, scrubbed brighter than new, and a puddle of gold that says Rosa’s promise once more, then, very quietly, one of Morrow’s own.',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan flinching from a burst of steam as a dish machine door swings open on gleaming trays and a small glowing gold puddle.',
      },
    ],
    echoes: [
      {
        flag: 'e03:4,5:care',
        text: 'Morrow’s hand finds the wall isolator before his head does. Rosa saw him learn that, and steps back to give him room.',
      },
      {
        flag: 'e03:4,5:risk',
        text: 'Morrow’s knuckles remember Bernard’s steam. They ache before he is even close.',
      },
    ],
  },
  {
    key: '5,5',
    place: 'Donated Coat Rail',
    title: 'Coats Off the 6:40',
    speaker: 'Bev',
    kind: 'merchant',
    opening:
      'The coats off the empty trains have come here, because Bev’s rail is where coats go. They hang dripping and warm, as if just shrugged off, a ticket for the 6:40 in every pocket. Bev won’t take money for them. ‘They’re someone’s,’ she says, guarding the biscuit tin. Her own stock is down to one thin anorak at tin price, and Morrow is soaked through.',
    artSubject:
      'A narrow community-centre corridor with a rail crowded with dripping commuter coats, puddles beneath each, an older woman in a fleece guarding a battered biscuit tin and holding up one thin anorak, an androgynous adult in their thirties with short dark hair and a soaked grey cardigan, gold rain on the corridor window.',
    choices: [
      {
        id: 'care',
        label: 'Pay into the tin for Bev’s last thin anorak',
        outcome:
          'Two coins, one thin anorak, damp at the seams by the end of the street. It is the only coat on the rail nobody is coming back for, and Morrow finds he minds that less than he expected.',
        effects: { supplies: -1, danger: -1, trust: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair zipping a thin anorak over a grey cardigan while an older woman taps coins into a biscuit tin, a rail of dripping strangers’ coats behind them.',
      },
      {
        id: 'risk',
        label: 'Take a train coat and leave its ticket on the rail',
        outcome:
          'The coat is heavy, dry inside, and fits him exactly, which coats should not do. In the pocket his hand finds a stranger’s house key and half a mint. Bev writes the ticket number in her book under ‘lent’, without looking up.',
        effects: { supplies: 2, trust: -1, danger: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair shrugging into a heavy dark commuter coat over a grey cardigan, a paper train ticket left on the rail, an older woman writing in a notebook without looking up.',
      },
    ],
    echoes: [
      {
        flag: 'e03:5,5:risk',
        text: 'Jun’s scarf still hangs on Bev’s hook where Morrow swapped it. It is dripping gold.',
      },
      {
        flag: 'e03:5,5:care',
        text: 'The navy anorak Morrow bought here last time is the only coat in the corridor that isn’t weeping water.',
      },
    ],
  },
  {
    key: '6,5',
    place: 'Kitchen Back Step',
    title: 'What the Rain Says to Mara',
    speaker: 'Mara',
    kind: 'memory',
    opening:
      'Mara is on the back step again, without tea. She won’t move past the edge of the door light, where gold rain hammers the yard. ‘It says things,’ she says. ‘Out there it says the last promise you broke. Mine’s that I’d get everyone home from the platform.’ A printed roll call is crushed in her fist. ‘I need to get back to the station, and I can’t make my feet go.’',
    artSubject:
      'A rainy back step behind a community kitchen at night, impossible golden rain hammering the yard beyond the edge of a door light, a precise coworker in a work lanyard clutching a crumpled printed list, an androgynous adult in their thirties with short dark hair and a grey cardigan in the doorway beside her.',
    choices: [
      {
        id: 'care',
        label:
          'Walk her to the station under your coat, reading the roll call aloud',
        outcome:
          'The rain says Mara’s promise all the way, and Morrow reads the roll call back louder, name by name. Halfway there she joins in. At the station she squeezes his arm once and goes in to keep counting. He walks home with her promise still in his ears.',
        effects: { trust: 2, supplies: -1, danger: 1 },
        artSubject:
          'Two figures hurrying through golden rain under one held-up coat, a coworker in a lanyard and an androgynous adult in their thirties with short dark hair and a grey cardigan reading aloud from a crumpled list, a stalled station glowing with emergency lights ahead.',
      },
      {
        id: 'risk',
        label: 'Step into the rain alone to hear what it says to you',
        outcome:
          'Gold hammers his shoulders and he hears it, in his new voice, perfectly clear: a promise he made with this mouth. Mara watches him go very still. ‘What did it say?’ He tells her it was nothing, which is the next promise.',
        effects: { evidence: 2, danger: 1, trust: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan standing alone in a yard of falling golden rain, head bowed as if listening, a coworker watching from a lit doorway.',
      },
    ],
    echoes: [
      {
        flag: 'e04:2,1:care',
        text: 'Every name on Mara’s list belongs to someone who was actually on the platform. Morrow helped her count only the living, and it is the one list in the city that adds up.',
      },
      {
        flag: 'e04:2,1:risk',
        text: 'Mara knows Morrow rode the coat train. She keeps glancing at his sleeves, as if checking he came back with his arms in them.',
      },
      {
        flag: 'e03:8,8:risk',
        text: 'Morrow remembers a puddle at the fountain holding a light the floodlights never cast. This rain is the same colour.',
      },
      {
        flag: 'e03:8,8:care',
        text: 'Morrow left the working unspoken at the fountain. He tells himself this is not his rain, and very nearly believes it.',
      },
    ],
  },
  {
    key: '7,5',
    place: 'Tea Urn Table',
    title: 'Cups for the Coats',
    speaker: 'Morrow',
    kind: 'memory',
    instant: true,
    opening:
      'The shelf above the urn is lined with paper cups that weren’t there at lunch, forty at least, each with a name in marker in a different hand. The urn is filling them itself, tap open, though nobody has touched it. Rowan’s old cup is at the end of the row with its crooked sun. Beside it stands a fresh one, and the name on it is Morrow.',
    artSubject:
      'A long shelf above a dented steel tea urn crowded with steaming paper cups, each marked in a different hand, the urn tap open on its own, one old softened cup with a small hand-drawn sun at the end of the row and a crisp new cup beside it, amber emergency light, no figures.',
    choices: [
      {
        id: 'notice',
        label: 'Turn the urn tap off',
        outcome:
          'The tap won’t close until he thanks it, the way he thanks the microwave. Then it stops. Morrow leaves the cup with his true name on the shelf, because picking it up would be agreeing that someone here knows it.',
        effects: { evidence: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan with one hand on the tap of a steel tea urn, head bowed in thanks, staring at a single crisp paper cup on the shelf above.',
      },
    ],
  },
  {
    key: '8,5',
    place: 'Kitchen Noticeboard',
    title: 'The Routes Rearrange',
    speaker: 'Morrow',
    kind: 'memory',
    instant: true,
    opening:
      'The walk-home map has redrawn itself. The coloured routes have crept off the streets and now bend around new blank patches, as if the felt-tip were afraid of them. The green line to Sal’s still runs, but it goes through the underpass now. Pinned over one corner is a photocopy of a child’s crayon map, and a note in capitals: THIS ONE’S RIGHT. SAL.',
    artSubject:
      'A crowded cork noticeboard with a felt-tip street map whose coloured route lines bend around strange empty patches, a photocopied child’s crayon map full of drawn monsters pinned over one corner, gold rain on the window beside it, flickering emergency light.',
    choices: [
      {
        id: 'notice',
        label: 'Compare the two maps',
        outcome:
          'Where the felt-tip map shows a blank, the child’s map shows a monster with a name. Where the felt-tip goes through the underpass, the child’s map draws teeth. Morrow folds the photocopy into his pocket and takes the long way.',
        effects: { danger: -1, evidence: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan holding a crayon map beside a felt-tip noticeboard map, one finger on a toothy monster drawn over an underpass.',
      },
    ],
    echoes: [
      {
        flag: 'e03:8,5:notice',
        text: 'Last time, this green line kept Morrow out of the underpass. Tonight the same green line leads him straight into it.',
      },
    ],
  },
  {
    key: '1,6',
    place: 'Flats Lobby Mailboxes',
    title: 'Box 14 Will Not Stay Empty',
    speaker: 'Morrow',
    kind: 'memory',
    instant: true,
    opening:
      'Box 14 is full again, and this time it is all letters in Rowan’s handwriting, addressed to Jun, never stamped. They push out of the slot one at a time with a soft, patient sound, like something breathing out. The envelopes are damp at the corners. One is still warm, as if it had only just been written.',
    artSubject:
      'A tired apartment-block lobby with a bank of dented metal mailboxes, unstamped handwritten envelopes easing out of one slot one by one onto wet lino, golden rain glittering through the glass front door, a flickering ceiling light.',
    choices: [
      {
        id: 'notice',
        label: 'Gather the letters before they post themselves',
        outcome:
          'Twenty-two letters, all to Jun, none to anyone else. Morrow bands them together and carries them up against his chest, where they shift slightly, the way a sleeping animal does. He does not open them.',
        effects: { evidence: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan climbing apartment stairs with a rubber-banded bundle of envelopes held close to their chest, lobby mailboxes behind.',
      },
    ],
    echoes: [
      {
        flag: 'e03:1,6:notice',
        text: 'Jun’s lighthouse postcard from this box is still on the fridge upstairs. ‘Still waiting,’ it says. These letters look like they mean to answer it.',
      },
    ],
  },
  {
    key: '2,6',
    place: 'Lobby Meter Cupboard',
    title: 'Three Breakers, Rising Water',
    speaker: 'Mr Adeyemi',
    kind: 'puzzle',
    opening:
      'Sea-smelling water is climbing the basement stairs a step a minute, and the cage lights down there are still live. Mr Adeyemi shouts from the lobby, Mrs Okoro on his arm: three breakers in the meter cupboard, labels peeled. His pencil note on the door says, ‘Stairs is just left of the lift. Basement is never the far right.’ People are on the stairs. The lift is coming down.',
    artSubject:
      'An open utility cupboard in a damp apartment lobby, three grey electricity meters spinning backwards above a row of three unlabelled breakers, faint pencil writing on the door, a caretaker in a fleece steadying an elderly woman, dark water glinting at the top of the basement stairs, an androgynous adult in their thirties with short dark hair and a grey cardigan reaching for the breakers.',
    choices: [
      {
        id: 'care',
        label: 'Throw the left breaker',
        outcome:
          'The basement lights die with a fizz under the water. Stairs and lift stay lit. Mr Adeyemi writes BASEMENT on the left breaker in marker and underlines it twice, and the water, robbed of its spark, climbs on in the dark.',
        effects: { evidence: 1, danger: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan pulling down the leftmost breaker in a lobby cupboard, the basement stairwell going dark below while the lobby lights stay on.',
      },
      {
        id: 'risk',
        label: 'Throw the middle breaker',
        outcome:
          'The stairwell goes black with people on it. Someone shouts; someone misses a step and catches the rail. Morrow flips it back and throws the left one, sweating, and Mr Adeyemi looks at him like a man reconsidering a spare key.',
        effects: { danger: 1, trust: -1 },
        artSubject:
          'A pitch-dark apartment stairwell with phone torches swinging and residents clutching the rail, seen past an androgynous adult in a grey cardigan at an open breaker cupboard.',
      },
      {
        id: 'far-right',
        label: 'Throw the far-right breaker',
        outcome:
          'The lift stops between floors with a jolt and a muffled shout. Morrow throws it back and the lift sighs on downward. Then he does the sums from the note again, slower, and throws the left.',
        effects: { danger: 1, supplies: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan wincing at an open breaker cupboard as the lift indicator above a steel lift door freezes, a muffled bang from the shaft.',
      },
    ],
    echoes: [
      {
        flag: 'e03:2,6:last-meter',
        text: 'The strip of masking tape Morrow stuck on his meter is the only label in the cupboard that stayed on. Mr Adeyemi trusts his hands on the breakers because of it.',
      },
      {
        flag: 'e03:2,6:risk',
        text: 'The power company’s letter about Flat 14’s silent July meter is still on Morrow’s fridge. Tonight all three dials are spinning backwards.',
      },
    ],
  },
  {
    key: '3,6',
    place: 'Flats Basement Cages',
    title: 'The Tide Comes Upstairs',
    speaker: 'Morrow',
    kind: 'challenge',
    opening:
      'The basement flood has stopped obeying the stairs. It stands up out of the cages like a wall of black glass and comes up the steps one at a time, smelling of salt, with a shadow inside it shaped like someone walking. On the top shelf of cage 14, Rowan’s bin-bag bundle floats at eye level inside the water, perfectly dry. Two ground-floor flats still have their lights on.',
    artSubject:
      'The top of a concrete basement stair in an apartment block, a standing wall of black seawater rising step by step with a vague walking human shadow inside it, a bin-bag bundle suspended dry within the water, a glimpse of chain-link cages behind, an androgynous adult in their thirties with short dark hair and a grey cardigan backing away with a torch, amber emergency light.',
    choices: [
      {
        id: 'care',
        label: 'Knock on the ground-floor doors and get everyone upstairs',
        outcome:
          'Mrs Ferreira, a man with a baby, an old fellow who won’t leave his budgie: Morrow gets them all to the first-floor landing before the water reaches the lobby and stops there, breathing. The bundle stays below. Whatever Rowan wrapped is the sea’s to hold, for now.',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan herding neighbours up a stairwell, a man carrying a baby, an elderly man with a birdcage, an older woman in a housecoat, dark water glossing the lobby floor below.',
      },
      {
        id: 'risk',
        label: 'Reach into the standing water for cage 14’s bundle',
        outcome:
          'The water is so cold it closes like a hand. His fingers touch dry bin bag; then the walking shadow turns its head, and Morrow lets go and runs. He reaches the lobby with his arm numb to the shoulder and nothing in it but salt.',
        effects: { evidence: 1, danger: 2 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan plunging one arm into a vertical wall of black water toward a floating bin-bag bundle, a human-shaped shadow inside the water turning toward them.',
      },
    ],
    echoes: [
      {
        flag: 'e03:3,6:care',
        text: 'Mr Adeyemi’s waders are still by Morrow’s door. ‘When it’s safe, not before,’ he said. This is very much before.',
      },
      {
        flag: 'e03:3,6:risk',
        text: 'Morrow has waded this basement once and knows the padlock on cage 14 won’t turn. Tonight the cage door hangs open, as if the water turned it.',
      },
    ],
  },
  {
    key: '4,6',
    place: 'Flat 15 Doorstep',
    title: 'Keys That Open Their Names',
    speaker: 'Sal',
    kind: 'companion',
    opening:
      'Sal is on the landing with Flat 15 shut behind her and her keys in a fist. ‘They don’t fit locks any more,’ she says. ‘They open what’s on the tag.’ The one tagged HOME opened onto her mum’s kitchen in 1962, and she shut it before her mum could turn round. Her heart pills are inside. On the strawberry ring is one more key, tagged in her own hand: ROWAN.',
    artSubject:
      'An older woman in slippers and a cardigan on a dim landing with her back to a closed flat door, clutching a key ring with a plastic strawberry charm and paper key tags, a child’s drawing taped to the door, an androgynous adult in their thirties with short dark hair and a grey cardigan facing her, amber emergency light.',
    choices: [
      {
        id: 'care',
        label: 'Tell Sal why that key won’t open your flat for you',
        outcome:
          '‘Because you’re not him,’ Sal says, once he’s done, very quietly. She drops the ROWAN key into her cardigan pocket and keeps her hand over it. They go round by the fire escape in the gold rain, slowly, for her pills. She holds his arm the whole way.',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'An older woman holding the arm of an androgynous adult in their thirties with short dark hair and a grey cardigan as they edge along a wet iron fire escape in golden rain, her free hand pressed over her cardigan pocket.',
      },
      {
        id: 'risk',
        label: 'Turn the ROWAN key in Sal’s door',
        outcome:
          'The door opens on a dark lane of wet hawthorn under a lamp Morrow knows from the Marches, and a figure far down it who stops, as if they heard their name. Sal sees only dark and smells hedges. He shuts it. ‘That wasn’t your flat,’ she says. ‘Where was that?’',
        effects: { evidence: 2, danger: 1, trust: -1 },
        artSubject:
          'A flat door swung open on a dark lane of wet hawthorn hedges under an old lamp, a distant figure standing still far down it, an androgynous adult in their thirties with short dark hair and a grey cardigan holding the door, an older woman peering past their shoulder.',
      },
    ],
    echoes: [
      {
        flag: 'e03:4,6:care',
        text: 'Sal already knows he isn’t Rowan. She hasn’t crossed the name off the tag. Underneath it, small, she has added ‘(the new one)’.',
      },
      {
        flag: 'e03:4,6:risk',
        text: 'Sal still calls him Rowan, and holds the ROWAN key out to him without a flicker of doubt, which is the worst part.',
      },
    ],
  },
  {
    key: '5,6',
    place: 'Riverside Flats Stairwell',
    title: 'The Stair That Starts Again',
    speaker: 'Kofi',
    kind: 'treasure',
    opening:
      'Kofi the delivery rider has climbed from the third floor to the sixth four times, and every time the landing sign says 3. His app still shows the same drop, Mrs Okoro, floor 6, with a growing red LATE. In his bag are inhalers, insulin and blood-pressure tablets for half the building. ‘The stairs have got me on a loop,’ he says, too calmly. ‘Take it. You live here.’',
    artSubject:
      'A concrete apartment stairwell lit by amber emergency lights, every landing looking identical, a delivery rider in a rain jacket holding out a pharmacy bag and a phone with a red glow, an androgynous adult in their thirties with short dark hair and a grey cardigan on the step below, golden rain at a stair window.',
    choices: [
      {
        id: 'care',
        label: 'Take the bag door to door with Kofi, to each name on it',
        outcome:
          'It takes an hour. The stairs loop twice more, then give up once Kofi starts knocking on third-floor doors and reading names aloud. Every person gets their own box from someone who looked them in the eye. Kofi’s rating is ruined; he says his kids will be proud anyway.',
        effects: { trust: 2, supplies: 1, danger: 1 },
        artSubject:
          'A delivery rider and an androgynous adult in their thirties with short dark hair and a grey cardigan handing a small pharmacy box to an elderly woman at her flat door on an amber-lit landing.',
      },
      {
        id: 'risk',
        label: 'Sign for the whole bag and carry it to the laundrette shelter',
        outcome:
          'Morrow signs Kofi’s screen and the loop lets Kofi go at once, as if the receipt were the spell. The bag goes on Mrs Ferreira’s counter: every dose in one counted place, but now everyone has to come down the stair for theirs.',
        effects: { supplies: 2, evidence: 1, trust: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan setting a full pharmacy bag on a laundrette folding counter, a delivery rider jogging away down the street outside under golden rain.',
      },
    ],
    echoes: [
      {
        flag: 'e03:5,6:care',
        text: 'Kofi remembers Morrow lighting his steps in the power cut, and holds his own phone low over the stairs for him without being asked.',
      },
      {
        flag: 'e03:5,6:risk',
        text: 'The fuse cupboard Morrow forced last time hangs open on the landing. Every careful pencil label inside now reads 3.',
      },
    ],
  },
  {
    key: '6,6',
    place: 'Flat 14 Kitchenette',
    title: 'Yesterday on the Line',
    speaker: 'Morrow',
    kind: 'memory',
    opening:
      'The landline in Flat 14 rings, and the little screen shows Jun’s number and yesterday’s date. The answering machine, still blinking 3, picks up by itself, and Jun’s voice comes out of it, live, from yesterday afternoon: ‘Pick up. I know you’re there. Something’s wrong with the weather.’ Outside it is raining gold. Yesterday, it hadn’t started yet.',
    artSubject:
      'A small rented kitchenette at night, an old landline answering machine on the counter with a blinking red light and a glowing caller screen, a lighthouse postcard on the fridge, golden rain on the dark window, an androgynous adult in their thirties with short dark hair and a grey cardigan standing very still with a hand hovering over the receiver.',
    choices: [
      {
        id: 'care',
        label: 'Let yesterday’s call ring out unanswered',
        outcome:
          'The machine records it all: Jun worried, Jun joking, Jun saying ‘call me back’ to a day already gone. Morrow saves it beside message 3. Whatever he might have said to yesterday stays unsaid, the only part of Jun’s day he can still leave alone.',
        effects: { trust: 1, danger: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan sitting at a kitchen counter with both hands flat on it, listening to a speaking answering machine without touching it, gold rain beyond the window.',
      },
      {
        id: 'risk',
        label: 'Pick up and warn yesterday about the rain',
        outcome:
          'Jun goes quiet. ‘You sound like someone doing your voice,’ Jun says, and the line fills with a hiss like surf. When it clears, the screen shows today, and Morrow cannot tell whether yesterday’s Jun got his warning, or only his voice.',
        effects: { evidence: 2, trust: -1, danger: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan pressing an old landline receiver to their ear in a dark kitchenette, eyes shut, a faint shimmer of sea spray on the window glass.',
      },
    ],
    echoes: [
      {
        flag: 'e03:6,6:care',
        text: 'Message 3 is still saved under Morrow’s paper note. Now the machine holds two calls from Jun that he has chosen not to hear.',
      },
      {
        flag: 'e03:6,6:risk',
        text: 'Morrow has already heard Jun say ‘Ring me when you’re yourself again.’ Yesterday’s Jun is asking the same thing, sooner.',
      },
    ],
  },
  {
    key: '7,6',
    place: 'Ground-Floor Laundrette',
    title: 'The Research Shelter',
    speaker: 'Mrs Ferreira',
    kind: 'memory',
    opening:
      'The laundrette’s round doors hang open, machines dark, the folding counter cleared for blankets. Mrs Ferreira has made it the building’s shelter, because hers is the one ground floor the water walks around. On the whiteboard where the wash prices were, Morrow writes no theories. He writes names, doses and times: Mrs Okoro, insulin, eight; the baby in Flat 2, Calpol, ten. Someone wedges the door open with a chair.',
    artSubject:
      'A small ground-floor laundrette turned makeshift shelter at night, round-door machines dark, neighbours on blankets along the folding counter, a whiteboard listing medication times, the street door propped open with a chair onto golden rain and amber emergency lights, an androgynous adult in their thirties with short dark hair and a grey cardigan writing on the whiteboard.',
    choices: [],
    echoes: [
      {
        flag: 'e03:7,6:notice',
        text: 'Mrs Ferreira still has Morrow’s finished loyalty card pinned behind the counter. She hands him the marker like a favour returned.',
      },
    ],
  },
  {
    key: '8,6',
    place: 'Flats Front Steps',
    title: 'The Only True Map',
    speaker: 'Tilly',
    kind: 'memory',
    opening:
      'Tilly sits on the front steps in her yellow raincoat with her map on her knees, and the monsters on it are real now: the roundabout snake, the bus dragons with their doors breathing, the fountain with too many mouths. Every printed map in the city is wrong tonight. Hers is the only one that shows where they are. ‘Gran says the clinic’s higher up,’ Tilly says. ‘I know the way. You don’t.’',
    artSubject:
      'A child of eight in a yellow raincoat on wet apartment-block front steps holding up a hand-drawn felt-tip map covered in monsters, golden rain falling over the street, a stalled bus with headlights glowing like eyes at the corner, an androgynous adult in their thirties with short dark hair and a grey cardigan crouching to study the map.',
    choices: [
      {
        id: 'care',
        label: 'Follow Tilly’s map and walk her to the clinic',
        outcome:
          'She leads him the long way: round the snake, under the bridge the map calls safe, never near the fountain. Twice she stops him at a corner a printed map would have walked him into. At the clinic she hands him to Imani like a parcel. ‘He’s new,’ she explains.',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'A child in a yellow raincoat leading an androgynous adult in their thirties with short dark hair and a grey cardigan by the hand through golden rain past a stalled bus, holding her monster map out in front like a compass.',
      },
      {
        id: 'risk',
        label: 'Borrow the map and leave Tilly safe with Sal',
        outcome:
          'Tilly hands it over with both hands, like a sword. With it Morrow crosses the city twice as fast and gets three strangers off a bus-dragon route before it closes. When he looks back from the corner, Tilly is in the first-floor window with Sal, watching the water in the lobby.',
        effects: { evidence: 2, supplies: 1, trust: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan running through golden rain with a child’s monster map held open, looking back at a small figure in a yellow raincoat beside an older woman in a lit first-floor window.',
      },
    ],
    echoes: [
      {
        flag: 'e03:8,6:care',
        text: 'Tilly remembers Morrow took her safe crossing without arguing. She lets him hold one corner of the map, which is a promotion.',
      },
      {
        flag: 'e03:8,6:risk',
        text: 'Morrow promised to rename the fountain. On her map it still has all its mouths, and Tilly looks at him as if he owes her.',
      },
      {
        flag: 'e04:4,6:care',
        text: '‘Gran says you’re the new one,’ Tilly says. ‘New ones need maps.’',
      },
      {
        flag: 'e04:4,6:risk',
        text: 'Tilly saw the hawthorn lane through Gran’s door. She has already drawn it on her map in dark green, with a small figure at the far end.',
      },
    ],
  },
]
