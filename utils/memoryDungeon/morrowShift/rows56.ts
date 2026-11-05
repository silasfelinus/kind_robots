import type { MorrowShiftSite } from './types'

export const MORROW_SHIFT_ROWS_5_6: readonly MorrowShiftSite[] = [
  {
    key: '1,5',
    place: 'Kitchen Lost-and-Found Jar',
    title: 'The Pass in the Pickle Jar',
    speaker: 'Morrow',
    kind: 'treasure',
    instant: true,
    opening:
      'By the kitchen’s side door sits a pickle jar of orphaned things: hair ties, one earring, a bus pass gone soft at the corners. The photo on the pass is Morrow’s current face, grinning at someone off-camera with a confidence he has never once felt in it. In the Marches, a token that carries your face also carries your debts.',
    artSubject:
      'A glass pickle jar crowded with lost hair ties, a single earring and a worn transit card with a small portrait photo, on a fogged community-kitchen windowsill, rain streaking the glass, warm fluorescent light.',
    choices: [
      {
        id: 'notice',
        label: 'Take the pass back',
        outcome:
          'Eleven rides remain on it, by the faded print on the back. Morrow pockets it over his heart, where a fey keeps a borrowed name, and decides that the only debt it carries is bus fare.',
        effects: { supplies: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan slipping a worn transit card into a cardigan pocket beside a steamed-up kitchen side door, rain outside.',
      },
    ],
  },
  {
    key: '2,5',
    place: 'Kitchen Roster Board',
    title: 'Rosa’s Roster',
    speaker: 'Rosa',
    kind: 'companion',
    opening:
      'Rosa, still in the canteen tabard from her day job, taps the roster with a wooden spoon. Tonight’s dish pit, six till close, carries the researcher’s name in blue biro, and nobody on the rota remembers agreeing to it. ‘You on, or am I scrubbing forty trays myself after a ten-hour shift?’ To Morrow, a name on a board looks like an oath someone swore with his mouth.',
    artSubject:
      'A tired middle-aged cook in a canteen tabard tapping a cork roster board with a wooden spoon in a cramped community kitchen, steam from a soup pot, an androgynous adult in their thirties with short dark hair and a grey cardigan reading the board warily, evening fluorescent light.',
    choices: [
      {
        id: 'care',
        label: 'Cover the dish shift tonight',
        outcome:
          'Morrow scrubs until his borrowed hands prune. Rosa says nothing for two hours, then slides him the good end of the bread, which he gathers is the kitchen’s highest honor. He misses the last bus and pays for a taxi he can’t afford.',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan, sleeves rolled, scrubbing a stack of steel trays at a deep sink while a cook in a tabard sets a heel of bread beside them, steam and late-night light.',
      },
      {
        id: 'risk',
        label: 'Find out who wrote your name there',
        outcome:
          'Morrow holds the roster against the volunteer forms in the folder until the loops match: the researcher signed up months ago, in their own hand, and forgot. Rosa reads over his shoulder. ‘So it was you,’ she says, and rolls up her own sleeves.',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan holding two sheets of handwriting side by side under a kitchen strip light while a cook in a tabard reads over their shoulder, arms folded.',
      },
    ],
    echoes: [
      {
        flag: 'e03:2,1:care',
        text: 'Mara has told Rosa that Morrow’s been foggy lately. Rosa reads the roster out to him, slowly, without making a thing of it.',
      },
      {
        flag: 'e03:2,1:risk',
        text: 'Mara has told Rosa that Morrow remembers everything these days. ‘Then you’ll remember signing this,’ Rosa says.',
      },
    ],
  },
  {
    key: '3,5',
    place: 'Kitchen Serving Hatch',
    title: 'Three Pots, One Boy',
    speaker: 'Rosa',
    kind: 'puzzle',
    opening:
      'A boy of about six waits at the hatch with his bowl, and his mum says it twice: no nuts, no meat. Rosa shouts from the sink without turning: ‘Satay’s in the red pot. Chicken’s in whichever has Darnell’s ladle in it, he never takes it out. Last one’s lentil.’ The ladle stands in the tall stockpot. The red enamel pot steams by the window. A dented steel pot ticks on the back ring.',
    artSubject:
      'A serving hatch in a community kitchen with three steaming pots behind it, a tall stockpot with a ladle standing in it, a red enamel pot by a rainy window and a dented steel pot on a back burner, a small boy holding up an empty bowl beside his mother, warm evening light.',
    choices: [
      {
        id: 'care',
        label: 'Serve from the dented steel pot on the back ring',
        outcome:
          'Lentil, thick and plain. The boy eats it like it owes him money. His mum nods once at Morrow, the nod of someone who has had to say ‘no nuts’ to a great many careless people.',
        effects: { evidence: 1, trust: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan ladling thick lentil soup from a dented steel pot into a child’s bowl at a serving hatch, the mother watching closely, steam rising.',
      },
      {
        id: 'risk',
        label: 'Serve from the red pot, the one fit for a prince',
        outcome:
          'The smell of peanut reaches the mum before the spoon reaches the bowl, and she pulls it back, sharp and practised. Rosa turns from the sink and looks at Morrow the way a falconer looks at a hawk that went for the chickens.',
        effects: { trust: -1, danger: 1 },
        artSubject:
          'A mother pulling her son’s bowl back from a ladle of orange peanut stew at a serving hatch, an androgynous adult in their thirties with short dark hair and a grey cardigan frozen mid-pour, a cook glaring from the sink.',
      },
      {
        id: 'stockpot',
        label: 'Lift the ladle out of the stockpot and serve from that',
        outcome:
          'A chicken thigh surfaces in the first scoop. Morrow tips it back before the boy sees; the boy’s mum, who did see, waits again with a patience that is clearly costing her something.',
        effects: { trust: -1, supplies: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan tipping a ladle of chicken soup back into a tall stockpot, a mother at the hatch with her arms crossed, a boy oblivious beside her.',
      },
    ],
  },
  {
    key: '4,5',
    place: 'Dish Pit',
    title: 'The Beast with One Red Eye',
    speaker: 'Morrow',
    kind: 'monster',
    opening:
      'The dish machine the volunteers call Bernard has jammed on a sheet tray and is screaming steam through the gap in its door. Its cycle timer broke in March; the regulars time it by the clunk. One red light glares above the door like the eye of a thing that eats hands, and behind Morrow the dirty trays keep coming.',
    artSubject:
      'A battered industrial dish machine in a cramped kitchen dish pit, steam jetting from a door jammed on a sheet tray, a single red indicator light glowing, stacks of dirty trays rising, an androgynous adult in their thirties with short dark hair and a grey cardigan facing it like a duelist.',
    choices: [
      {
        id: 'care',
        label: 'Kill it at the wall isolator and wait for it to cool',
        outcome:
          'The red eye goes dark. Ten minutes of cooling feels like a siege, and the tray stack reaches the shelf, but the sheet tray comes out with Morrow’s fingers still attached. Rosa, passing, taps the isolator. ‘Good. Most people learn that one the hard way.’',
        effects: { supplies: -1, trust: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan with one hand on a red wall isolator switch, the dish machine dark and dripping beside them, dirty trays piled to a shelf.',
      },
      {
        id: 'risk',
        label: 'Wrench the tray free while it’s still running',
        outcome:
          'The tray comes loose on the third pull, along with a blast of steam that takes the skin off two knuckles. The backlog clears in record time. Morrow holds his hand under the cold tap and concludes that in this realm a beast need not be clever to bite.',
        effects: { supplies: 1, danger: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan yanking a sheet tray from a steaming dish machine door, face turned from a burst of steam, red light glaring.',
      },
    ],
  },
  {
    key: '5,5',
    place: 'Donated Coat Rail',
    title: 'Bev’s Honesty Tin',
    speaker: 'Bev',
    kind: 'merchant',
    opening:
      'Bev runs the donated-coat rail in the corridor like a market stall that refuses to make money: take a coat, leave a coin in the biscuit tin or a coat on the hook. Morrow’s cardigan has been wet since the station. There’s a plain navy anorak at tin price, and a heavy waxed coat Bev says she’d swap for ‘that lovely scarf of yours.’',
    artSubject:
      'A narrow community-centre corridor with a rail of donated coats, an older woman in a fleece guarding a battered biscuit tin, a plain navy anorak and a heavy waxed coat held up side by side, an androgynous adult in their thirties with short dark hair, a damp grey cardigan and a hand-knitted scarf.',
    choices: [
      {
        id: 'care',
        label: 'Pay into the tin for the plain anorak',
        outcome:
          'Two coins clink into a tin that once held shortbread. The anorak is a size too big and smells faintly of someone’s dog, and for the first time in days the rain stops reaching Morrow’s skin.',
        effects: { supplies: -1, danger: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair zipping up an oversized navy anorak over a grey cardigan while an older woman taps coins into a biscuit tin, rain on a corridor window behind.',
      },
      {
        id: 'risk',
        label: 'Swap the researcher’s scarf for the waxed coat',
        outcome:
          'Bev fingers the uneven stitches and pauses. ‘That’s the one Jun made you. You sure?’ Morrow says yes, because the scarf was never his to love. The coat is magnificent. The pause stays with him longer than the warmth does.',
        effects: { supplies: 1, danger: -1, trust: -1 },
        artSubject:
          'An older woman holding a lumpy hand-knitted scarf with a hesitant expression, an androgynous adult in their thirties with short dark hair shrugging into a heavy waxed coat over a grey cardigan, corridor coat rail behind.',
      },
    ],
  },
  {
    key: '6,5',
    place: 'Kitchen Back Step',
    title: 'Mara on the Back Step',
    speaker: 'Mara',
    kind: 'memory',
    opening:
      'Mara is on the kitchen’s back step with a mug of tea, having dropped off the Annex’s leftover sandwiches before anyone could bin them. ‘You used to come here on Thursdays after bad days,’ Mara says. ‘You said it was the only room where nobody needed you to be clever.’ Then, without looking at him: ‘Are you all right? Actually all right?’',
    artSubject:
      'A rainy back step behind a community kitchen at night, a precise-looking coworker in a work lanyard holding a mug of tea under the door light, a tray of wrapped sandwiches beside them, an androgynous adult in their thirties with short dark hair and a grey cardigan hovering in the doorway.',
    choices: [
      {
        id: 'care',
        label: 'Tell Mara you’re not, without saying why',
        outcome:
          'Mara takes this in, nods, and quietly swaps Morrow off Saturday’s Annex handover to cover it personally. It is a kindness and a cost: Mara now carries a weight Morrow hasn’t named, and Mara is not someone who puts weights down.',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Two figures sitting close on a wet back step under a door light, a coworker in a lanyard offering a mug of tea to an androgynous adult in their thirties with short dark hair and a grey cardigan, who holds it with both hands.',
      },
      {
        id: 'risk',
        label: 'Ask what the researcher used to talk about out here',
        outcome:
          'Mara tells him: the job, the damp in Flat 14, a cello bought and never learned. It’s all useful. Then Mara stands. ‘You’re asking like you’re revising for a test,’ Mara says, not unkindly, and goes back inside.',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'A coworker in a lanyard standing up from a wet back step with an empty mug, half turned to the kitchen door, an androgynous adult in their thirties with short dark hair and a grey cardigan left sitting alone under the door light.',
      },
    ],
    echoes: [
      {
        flag: 'e03:2,1:care',
        text: 'Since the platform, Mara has stopped testing Morrow with names, and simply shifts over to make room on the step.',
      },
      {
        flag: 'e03:2,1:risk',
        text: 'Mara hasn’t forgotten the bluff on the platform, and sits a careful arm’s length away, letting Morrow speak first.',
      },
    ],
  },
  {
    key: '7,5',
    place: 'Tea Urn Table',
    title: 'The Cup Kept for Someone',
    speaker: 'Morrow',
    kind: 'memory',
    instant: true,
    opening:
      'On the shelf above the tea urn, between the volunteers’ chipped mugs, one paper cup has been kept long past its use. Someone has written the researcher’s name on it in marker and drawn a crooked sun underneath. It has been rinsed, which paper cups are not built to survive, and put back.',
    artSubject:
      'A shelf above a dented steel tea urn in a community kitchen, a row of chipped mugs and one softened paper cup with a small hand-drawn sun on it, steam and warm light, no other figures.',
    choices: [
      {
        id: 'notice',
        label: 'Fill it from the urn',
        outcome:
          'The tea tastes of urn and a little of wax. Nobody stops him, and nobody says whose idea it was to keep the cup. In the Marches, a vessel kept for an absent lord is a vow to their return; Morrow drinks slowly, a guest at his own place.',
        effects: { supplies: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan holding a softened paper cup under the tap of a steel tea urn, watching the stream with a solemn, ceremonial expression.',
      },
    ],
  },
  {
    key: '8,5',
    place: 'Kitchen Noticeboard',
    title: 'The Walk-Home Map',
    speaker: 'Morrow',
    kind: 'memory',
    instant: true,
    opening:
      'Between a missing-cat flyer and the hygiene certificate, someone has drawn the volunteers’ routes home in coloured pen so nobody leaves alone after close. One green line runs from the kitchen to the river and ends at the researcher’s initials, with a smaller box beside it: ‘Sal’s.’ It skirts the underpass by two whole streets.',
    artSubject:
      'A crowded cork noticeboard in a community-kitchen corridor, a hand-drawn street map in coloured felt-tip with looping route lines, pinned flyers around it, a raincoat hanging nearby, evening fluorescent light.',
    choices: [
      {
        id: 'notice',
        label: 'Trace the green line home',
        outcome:
          'Left at the laundrette, along the river wall, never the underpass. Morrow has walked home through the underpass all week. Tonight he goes the long way, and the street feels, for once, as if it has already been walked for him.',
        effects: { danger: -1, evidence: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan tracing a green felt-tip line on a hand-drawn noticeboard map with one finger, rain-dark window beside them.',
      },
    ],
  },
  {
    key: '1,6',
    place: 'Flats Lobby Mailboxes',
    title: 'Box 14',
    speaker: 'Morrow',
    kind: 'memory',
    instant: true,
    opening:
      'Box 14 in the lobby of Riverside Flats is so full its flap no longer shuts. Morrow has walked past it for a week the way one walks past a sleeping dog. Takeaway menus are poking out of the slot like tongues.',
    artSubject:
      'A tired apartment-block lobby with a bank of dented metal mailboxes, one box crammed so full that takeaway menus spill from its slot, wet footprints on lino, a flickering ceiling light.',
    choices: [
      {
        id: 'notice',
        label: 'Empty the mailbox',
        outcome:
          'Menus, a final-reminder water bill, and a postcard of a lighthouse with three words in a looping hand: ‘Still waiting. J.’ Morrow pays the bill the next morning. The postcard goes on the fridge, picture side out, because he can’t think what else would be honest.',
        effects: { evidence: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan in an apartment lobby holding an armful of menus and envelopes, looking down at a lighthouse postcard on top.',
      },
    ],
  },
  {
    key: '2,6',
    place: 'Lobby Meter Cupboard',
    title: 'Three Meters, No Labels',
    speaker: 'Sal',
    kind: 'puzzle',
    opening:
      'The landlord’s form wants Flat 14’s meter reading by Friday, and the lobby damp has peeled the labels off all three meters. Sal, passing with shopping, says hers is the one with her late husband’s gold star sticker. Flat 13 has been empty since July; its last reading is pencilled on the cupboard door as 40211. The dials read 18832 (gold star), 40211 and 27560.',
    artSubject:
      'An open utility cupboard in a damp apartment lobby with three grey electricity meters, one with a small gold star sticker, faint pencil marks on the inside of the door, an older woman with shopping bags pausing to point, an androgynous adult in their thirties with short dark hair and a grey cardigan holding a clipboard.',
    choices: [
      {
        id: 'care',
        label: 'Copy 18832 from the meter with the gold star',
        outcome:
          'The form goes in with Sal’s number on it. Next month Sal is billed for nothing and Morrow for everything, and Sal laughs about it for longer than he would like.',
        effects: { trust: -1, supplies: -1 },
        artSubject:
          'An older woman on an apartment landing laughing as she waves a utility bill, an androgynous adult in their thirties with short dark hair and a grey cardigan wincing beside her.',
      },
      {
        id: 'risk',
        label: 'Copy 40211, the number already on the door',
        outcome:
          'It looks official, which in the Marches is the same as true. The power company writes back asking why Flat 14 has used no electricity since July, in a tone Morrow recognises from tithe collectors.',
        effects: { danger: 1, supplies: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan frowning at an official letter at a small kitchen table, rain on the window, a mug going cold.',
      },
      {
        id: 'last-meter',
        label:
          'Copy 27560, the meter that’s neither Sal’s nor the empty flat’s',
        outcome:
          'By elimination, the last meter is his. Morrow writes 27560 in the box, then, because nobody else will, sticks a strip of masking tape on the meter and marks it 14 for whoever comes after him.',
        effects: { evidence: 1, trust: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan pressing a strip of masking tape onto a grey electricity meter in a damp lobby cupboard, a pen between their teeth.',
      },
    ],
  },
  {
    key: '3,6',
    place: 'Flats Basement Cages',
    title: 'Below the Waterline',
    speaker: 'Morrow',
    kind: 'dungeon',
    opening:
      'The basement stairs end in black water at the second step. Beyond it the storage cages of Riverside Flats stand in the flood like a drowned market, each padlocked and numbered. On the top shelf of cage 14 sits something wrapped in bin bags, above the waterline, as if someone expected this. The caretaker’s sign says keep out until the pump is fixed. It has said that since August.',
    artSubject:
      'A flooded apartment-block basement seen from the bottom of a concrete stair, rows of chain-link storage cages standing in still black water, a single caged bulb, a bundle wrapped in black bin bags on a high shelf in one cage, an androgynous adult in their thirties with short dark hair and a grey cardigan holding a torch on the last dry step.',
    choices: [
      {
        id: 'care',
        label: 'Report the flood and ask the caretaker to walk you in',
        outcome:
          'Mr Adeyemi writes it in his book, swears the pump man is coming Thursday, and lends Morrow a pair of waders ‘for when it’s safe, not before.’ The cage stays shut. Whatever the researcher wrapped so carefully waits above the water.',
        effects: { trust: 1, supplies: 1 },
        artSubject:
          'A weary caretaker in a fleece writing in a battered notebook at the top of the basement stairs and handing a pair of rubber waders to an androgynous adult in their thirties with short dark hair and a grey cardigan, floodwater glinting below.',
      },
      {
        id: 'risk',
        label: 'Wade in tonight with the torch',
        outcome:
          'The water is colder than any river in the Marches, and the thing that brushes his shin is only a floating crate. He reaches cage 14, finds the researcher’s key won’t turn in the rusted padlock, and backs out soaked to the thigh, certain only that the bundle is meant to be found.',
        effects: { evidence: 1, danger: 2 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan waist-deep in black floodwater between storage cages, torch beam on a rusted padlock, a bin-bag bundle on the shelf above, breath fogging.',
      },
    ],
    echoes: [
      {
        flag: 'e03:6,2:care',
        text: 'Since he signed the Annex key log, Morrow has started reading signs as rules rather than suggestions, and this one is very clear.',
      },
      {
        flag: 'e03:6,2:risk',
        text: 'The badge Morrow borrowed at the Annex is still on its lanyard in his pocket. It opens nothing down here, which is almost a relief.',
      },
    ],
  },
  {
    key: '4,6',
    place: 'Flat 15 Doorstep',
    title: 'Sal’s Spare Keys',
    speaker: 'Sal',
    kind: 'companion',
    opening:
      'Sal opens her door in slippers with the spare keys already in her hand, because he always forgets on bin day. She calls him by the researcher’s name, says he looks peaky, asks if he’s eating, and mentions Tilly drew him a picture. The keys hang on a ring with a plastic strawberry. In the Marches, whoever holds your keys holds your house’s true name.',
    artSubject:
      'An older woman in slippers and a cardigan in the doorway of a warm, cluttered flat, holding out a key ring with a plastic strawberry charm, a child’s drawing taped to the door behind her, an androgynous adult in their thirties with short dark hair and a grey cardigan on the dim landing.',
    choices: [
      {
        id: 'care',
        label: 'Tell Sal the truth: you aren’t who she thinks',
        outcome:
          'Sal hears it all without interrupting, which is worse than shouting. ‘Well, whoever you are, you still forget your keys,’ she says, and lets him in herself, standing in the doorway while he finds a jumper. Tea tomorrow, she says. Explain it slower.',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'An older woman standing guard in the doorway of a small flat with her arms folded around a strawberry key ring, watching an androgynous adult in their thirties with short dark hair and a grey cardigan pull a jumper from a drawer.',
      },
      {
        id: 'risk',
        label: 'Keep answering to the researcher’s name',
        outcome:
          'Sal pats his cheek, presses the strawberry ring into his palm and tells him to eat something green. He promises. The keys are warm from her hand, and every one of them now opens a door he stands behind under a name that isn’t his.',
        effects: { supplies: 1, trust: -1 },
        artSubject:
          'An older woman patting the cheek of an androgynous adult in their thirties with short dark hair and a grey cardigan on a dim landing, pressing a strawberry key ring into their palm.',
      },
    ],
    echoes: [
      {
        flag: 'e03:2,6:care',
        text: 'Sal is holding her electricity bill too, with Morrow’s usage on it, and waves it at him by way of hello.',
      },
      {
        flag: 'e03:2,6:last-meter',
        text: 'Sal has seen the masking tape on the meter. ‘Look at you, labelling things,’ she says. ‘Never used to.’',
      },
    ],
  },
  {
    key: '5,6',
    place: 'Riverside Flats Stairwell',
    title: 'The Stair With No Light',
    speaker: 'Kofi',
    kind: 'challenge',
    opening:
      'The storm trips the building’s power and the stairwell goes black between the third and fourth floors. Water from a broken gutter has made every step a slick tongue. Kofi, a delivery rider with his phone on six percent, has two heavy grocery bags for Mrs Okoro on the sixth floor and four more drops after that. To Morrow it is a throat with a handrail.',
    artSubject:
      'A dark apartment stairwell in a power cut, rain glistening on concrete steps, a delivery rider in a rain jacket holding two heavy grocery bags and a dim phone, an androgynous adult in their thirties with short dark hair and a grey cardigan gripping a wet handrail, a small fuse cupboard on the landing.',
    choices: [
      {
        id: 'care',
        label: 'Take one bag and light every step for Kofi with your phone',
        outcome:
          'They climb slowly, calling out each wet step. Kofi’s next drop is late and his rating dips. Mrs Okoro gets her groceries and asks who on earth this polite person is. Morrow learns Kofi’s kids’ names, and that patience is something you do with your hands while frightened.',
        effects: { trust: 1, supplies: -1 },
        artSubject:
          'Two figures climbing a dark wet stairwell, an androgynous adult in a grey cardigan holding a phone torch low over the steps while carrying a grocery bag, a delivery rider following close behind with the other bag.',
      },
      {
        id: 'risk',
        label: 'Open the fuse cupboard and reset the power yourself',
        outcome:
          'Every switch is labelled in someone’s careful pencil. Morrow flips the one that says STAIRS and the light comes back. So does a fizz and a smell of hot dust from the wet panel. Kofi makes his drops and tosses him the garlic bread. Mr Adeyemi, arriving, explains exactly how people get hurt doing that.',
        effects: { supplies: 1, danger: 2 },
        artSubject:
          'An androgynous adult in a grey cardigan reaching into an open fuse cupboard on a wet stair landing, a faint spark at the panel, a delivery rider shielding his eyes as the stair lights flicker back on.',
      },
    ],
  },
  {
    key: '6,6',
    place: 'Flat 14 Kitchenette',
    title: 'The Captive Hearth',
    speaker: 'Morrow',
    kind: 'memory',
    opening:
      'In Flat 14 the microwave hums over a tub of soup, a small hearth kept captive in a box, and Morrow thanks it whenever it chimes. On the counter the old answering machine has blinked 3 since he moved in. Two messages are the dentist. The third begins, ‘It’s me. Don’t hang up,’ in a voice he knows only from letters, and each time he has stopped it there.',
    artSubject:
      'A small rented kitchenette at night, a microwave glowing over a turning tub of soup, an old answering machine on the counter with a blinking red light, a lighthouse postcard on the fridge, an androgynous adult in their thirties with short dark hair and a grey cardigan hovering a finger over the play button.',
    choices: [
      {
        id: 'care',
        label: 'Leave the message unheard for the person it’s meant for',
        outcome:
          'Morrow sticks a note beside the machine: message 3, kept. It is the first thing in this flat he has saved instead of spent. The light blinks all night, and he lets it.',
        effects: { trust: 1 },
        artSubject:
          'A dark kitchenette lit only by a blinking answering-machine light and a microwave glow, a small paper note stuck beside the machine, an androgynous adult in their thirties with short dark hair and a grey cardigan eating soup at the counter with their back to it.',
      },
      {
        id: 'risk',
        label: 'Play the rest of the message',
        outcome:
          'Jun talks for ninety seconds about nothing: a bad week, a neighbour’s cat, a film the two of them promised to see. Then: ‘Ring me when you’re yourself again.’ Morrow plays it twice, learns three things he can use, and one sentence he can’t stop hearing.',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan bent close to an old answering machine on a kitchen counter, listening intently, one hand pressed flat on the counter, microwave light behind.',
      },
    ],
    echoes: [
      {
        flag: 'e03:3,3:care',
        text: 'The letter to Jun is still sealed in the library. This is the second thing of Jun’s that Morrow is deciding whether to leave closed.',
      },
      {
        flag: 'e03:3,3:risk',
        text: 'Morrow has read what the researcher meant to tell Jun. It makes the blinking light harder to look at, and harder to ignore.',
      },
    ],
  },
  {
    key: '7,6',
    place: 'Ground-Floor Laundrette',
    title: 'Nine Stamps of Ten',
    speaker: 'Morrow',
    kind: 'treasure',
    instant: true,
    opening:
      'In the drawer under the kettle Morrow finds a laundrette loyalty card with nine of ten stamps, clipped to a till receipt for the ninth wash. To a fey, a receipt is a contract signed in thermal ink, and this one plainly binds the laundrette downstairs to one free service wash for the bearer.',
    artSubject:
      'A kitchen drawer pulled open to show string, batteries, takeaway chopsticks and a stamped loyalty card clipped to a curling till receipt, lit by a cool window on a rainy afternoon.',
    choices: [
      {
        id: 'notice',
        label: 'Claim the free wash',
        outcome:
          'Mrs Ferreira honours the card without ceremony and folds his shirts better than he could. Morrow, who came downstairs braced to argue terms, leaves feeling outmanoeuvred by kindness.',
        effects: { supplies: 1 },
        artSubject:
          'A small, steamy ground-floor laundrette with a row of round-door machines, an older woman folding shirts with brisk precision on a counter, an androgynous adult in their thirties with short dark hair and a grey cardigan holding out a loyalty card like a writ.',
      },
    ],
  },
  {
    key: '8,6',
    place: 'Flats Front Steps',
    title: 'Tilly’s Map',
    speaker: 'Tilly',
    kind: 'memory',
    opening:
      'Tilly, eight, sits on the front steps with a felt-tip map of the whole city, where buses are dragons and the roundabout is a snake eating its tail. She has drawn the park fountain as a monster with too many mouths. ‘You’re walking me to the shop,’ she informs Morrow. ‘Gran said. Use my map.’ The safe crossing on it is three streets out of the way.',
    artSubject:
      'A child of eight in a yellow raincoat sitting on wet apartment-block front steps holding up a hand-drawn felt-tip map covered in monsters and dragons, an androgynous adult in their thirties with short dark hair and a grey cardigan crouching to study it, grey afternoon drizzle.',
    choices: [
      {
        id: 'care',
        label: 'Follow Tilly’s safe crossing the long way round',
        outcome:
          'It adds eleven minutes and a lollipop lady. Tilly narrates every hazard like a field guide: the bin lorry that growls, the bollard that’s ‘fine, actually.’ The shop’s bread is gone when they arrive, so she buys him a chew, which he gathers is compensation.',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'A child in a yellow raincoat leading an androgynous adult in their thirties with short dark hair and a grey cardigan by the hand across a zebra crossing beside a crossing guard, holding a hand-drawn map out in front like a compass.',
      },
      {
        id: 'risk',
        label: 'Ask which frightening landmark she wants renamed',
        outcome:
          'Tilly considers this with enormous seriousness and picks the fountain. ‘It’s got mouths.’ Morrow offers to rename it the way one renames a sworn enemy, and she makes him promise. He has no magic here to keep it with, and the fountain waits at the far end of the park.',
        effects: { evidence: 1, trust: 1, danger: 1 },
        artSubject:
          'A child in a yellow raincoat solemnly pointing at a monster drawn on a felt-tip map while an androgynous adult in their thirties with short dark hair and a grey cardigan holds up a hand as if swearing an oath, on wet front steps.',
      },
    ],
    echoes: [
      {
        flag: 'e03:4,6:care',
        text: 'Sal has told Tilly something. Tilly studies Morrow’s face like a map she suspects is wrong. ‘Gran says you’re new,’ she says. ‘You don’t look new.’',
      },
      {
        flag: 'e03:4,6:risk',
        text: 'Tilly calls him by the researcher’s name, loudly, exactly the way Sal does, and Morrow answers to it.',
      },
    ],
  },
]
