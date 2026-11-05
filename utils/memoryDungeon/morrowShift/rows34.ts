import type { MorrowShiftSite } from './types'

export const MORROW_SHIFT_ROWS_3_4: readonly MorrowShiftSite[] = [
  {
    key: '1,3',
    place: 'Library Steps Subway Entrance',
    title: 'The Transit Lesson',
    speaker: 'A stranger in a raincoat',
    kind: 'memory',
    opening:
      'Under the library steps, the subway entrance breathes warm air and wet newspaper. The ticket machine offers Morrow fourteen buttons and no audience, which he takes personally. He addresses it as one sovereign to another, holding out Rowan’s card like a writ. Behind him a stranger in a raincoat waits, sighs, and lifts one finger toward a single button.',
    artSubject:
      'A subway entrance tucked beneath wide stone library steps at night in rain; an androgynous adult in their thirties with short dark hair and a grey cardigan stands squarely before a ticket machine, chin raised like a petty king, a card held out stiffly; beside them a stranger in a dripping raincoat patiently points at one button; warm tiled light and wet reflections on the floor.',
    choices: [],
  },
  {
    key: '2,3',
    place: 'Library Holds Shelf',
    title: 'Second Edition, Last Two Digits',
    speaker: 'Deepa',
    kind: 'puzzle',
    opening:
      'Holds are shelved by the last four digits of a library card, not by name, which Morrow finds either very modest or very sinister. Rowan’s card is worn down to its final two: 37. His note reads ‘reserved 2nd ed., the 1st has the misprinted table.’ Deepa at circulation sets out three bundles: 1137, first edition; 4037, second edition; 4073, second edition.',
    artSubject:
      'A public library holds shelf of rubber-banded books with paper slips; a circulation librarian in her forties with reading glasses on a chain lays out three identical-looking bundles on the counter; an androgynous adult in their thirties with short dark hair and a grey cardigan squints at a worn library card; lamplight, rain on the tall windows behind.',
    choices: [
      {
        id: 'care',
        label: 'Take 4073: right edition, and the digits are all there',
        outcome:
          'Deepa checks the slip and gently takes it back. 4073 ends in 73, and belongs to a man who has phoned twice this week. Morrow apologises, first to the shelf and then to Deepa, who says the shelf will cope.',
        effects: { trust: -1 },
        artSubject:
          'A circulation librarian gently drawing a bundle of books back across the counter while an androgynous adult in a grey cardigan bows slightly toward the shelf by mistake; warm desk lamp.',
      },
      {
        id: 'risk',
        label: 'Take 1137: the card ends right, edition be damned',
        outcome:
          'The slip is someone else’s, and so is the misprint. Before Deepa notices, Morrow copies three numbers from the bad table on page 212 into Rowan’s notebook, and will believe them for days.',
        effects: { evidence: -1 },
        artSubject:
          'An androgynous adult in a grey cardigan copying figures from an open textbook into a small notebook at a library table, an unnoticed wrong slip tucked under the cover; rainy window light.',
      },
      {
        id: 'second-edition',
        label: 'Take 4037: it ends in 37 and it’s the second edition',
        outcome:
          'The slip matches and the table on page 212 is the corrected one. Two pages on, the step Rowan’s notes skipped is set out in plain numbered lines. Morrow reads it four times, like an apology.',
        effects: { evidence: 2 },
        artSubject:
          'An androgynous adult in a grey cardigan at a library reading table, finger resting on a numbered list in an open technical book, a worn library card beside it; soft green lamp, rain outside.',
      },
    ],
  },
  {
    key: '3,3',
    place: 'Found-in-Books Drawer',
    title: 'Addressed to Jun',
    speaker: 'Deepa',
    kind: 'memory',
    opening:
      'Deepa keeps a drawer of things found inside returned books: pressed leaves, a milk tooth, a betting slip. She hands Morrow an envelope that fell out of one of Rowan’s returns last spring. It is stamped, sealed and addressed to Jun in Rowan’s handwriting. It was never posted. Morrow’s thumb finds the edge of the flap before he has decided anything.',
    artSubject:
      'A librarian holding out a stamped, sealed envelope across an open wooden drawer full of pressed leaves and odd keepsakes; an androgynous adult in their thirties with short dark hair and a grey cardigan reaches for it, thumb already at the flap; quiet library, lamplight, rain-streaked window.',
    choices: [
      {
        id: 'care',
        label: 'Keep it sealed for the one who wrote it',
        outcome:
          'Morrow puts the envelope in the inside pocket where Rowan kept his pens. It weighs almost nothing and he notices it all evening. Whatever it says is still his to say.',
        effects: { trust: 1 },
        artSubject:
          'An androgynous adult in a grey cardigan sliding a sealed envelope into an inside pocket beside two pens, standing between library shelves in low lamplight.',
      },
      {
        id: 'risk',
        label: 'Open it. You are Rowan now, aren’t you?',
        outcome:
          'One page. It begins ‘I know sorry is late’ and stops halfway down, mid-sentence, as if the writer got up to answer a door. Morrow now knows Jun was owed something, and that he has read a letter nobody sent him.',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'An androgynous adult in a grey cardigan reading a single handwritten page under a library lamp, a torn envelope on the table, the lower half of the page blank.',
      },
    ],
  },
  {
    key: '4,3',
    place: 'Public Computer 6',
    title: 'The Urgent Summons',
    speaker: 'Morrow',
    kind: 'challenge',
    opening:
      'Public Computer 6 grants thirty minutes and counts them down in the corner. Rowan’s inbox holds an email with a bank’s crest, red capitals and a midnight deadline: verify your password or the account will be closed. Morrow knows a summons when he sees one. In the Marches you answered a summons promptly, or someone came to collect.',
    artSubject:
      'A row of public library computers at night; an androgynous adult in their thirties with short dark hair and a grey cardigan sits rigid before a screen glowing alarm-red, hand hovering over the keyboard; other patrons blur past; fluorescent light and rain on black windows.',
    choices: [
      {
        id: 'care',
        label: 'Take the email to the help desk before answering anything',
        outcome:
          'The help-desk volunteer, a retired postman, reads it twice and laughs without unkindness. He shows Morrow the sender’s address, which no bank would own, and how to report it. It costs ten of Morrow’s thirty minutes.',
        effects: { evidence: 1, trust: 1, supplies: -1 },
        artSubject:
          'A retired postman volunteering at a library help desk, pointing at a monitor with a pen while an androgynous adult in a grey cardigan leans in, relieved; warm desk lamp.',
      },
      {
        id: 'risk',
        label: 'Reply, and demand the sender give their true name',
        outcome:
          'The answer arrives in under a minute, warmer now, with a link and a fresh deadline. Morrow has proved the inbox is alive and the sender has proved nothing. Three more ‘banks’ write before the session ends.',
        effects: { danger: 2, evidence: 1 },
        artSubject:
          'An androgynous adult in a grey cardigan typing furiously and formally at a library computer while new message alerts stack up on the glowing screen; late-night fluorescent light.',
      },
      {
        id: 'log-out',
        label: 'Log out and let the deadline pass',
        outcome:
          'Midnight comes and the account stays open, as accounts do. Morrow learns that an Earth summons can simply be ignored, which unsettles him more than anything else this week.',
        effects: { danger: -1 },
        artSubject:
          'An androgynous adult in a grey cardigan walking away from a dark library computer screen, glancing back over one shoulder as if expecting pursuit; empty aisle, rain on the glass.',
      },
    ],
  },
  {
    key: '5,3',
    place: 'Winter Coat Rail',
    title: 'Take One, Leave One',
    speaker: 'Morrow',
    kind: 'treasure',
    instant: true,
    opening:
      'By the radiator stands a rail of coats unclaimed for ninety days, under a sign Deepa has laminated twice. In the Marches a gift with no giver is the most dangerous kind. Morrow circles the rail three times before he accepts that nobody is watching to see which one he takes.',
    artSubject:
      'A clothes rail of mismatched secondhand winter coats beside an old library radiator; an androgynous adult in their thirties with short dark hair and a grey cardigan circles it warily, glancing around for a watcher who is not there; warm radiator glow, rain outside.',
    choices: [
      {
        id: 'notice',
        label: 'Take the brown wool coat',
        outcome:
          'Too long in the sleeves, and it smells of someone else’s cupboard. In the pocket: a folded night-bus timetable and a cough sweet still in its wrapper. Morrow is warm, and for one streetlight unafraid of the rain.',
        effects: { supplies: 2 },
        artSubject:
          'An androgynous adult in an oversized brown wool coat over a grey cardigan, sleeves past their knuckles, unfolding a timetable under a streetlight in the rain outside the library.',
      },
    ],
  },
  {
    key: '6,3',
    place: 'Periodicals Reading Table',
    title: 'Questions in Pencil',
    speaker: 'Dr Sen',
    kind: 'companion',
    opening:
      'Dr Sen reads at the long periodicals table on Thursday evenings, sharpening her pencil with a penknife older than the library’s computers. She slides over a printout: Rowan’s draft from last spring, its margins full of her small grey questions. None has been answered. ‘The machines downstairs will give you answers,’ she says. ‘Nobody here is short of those.’',
    artSubject:
      'A long library periodicals table under green reading lamps; a patient older scientist sharpens a pencil with a small penknife and slides a pencil-annotated printout across to an androgynous adult in their thirties with short dark hair and a grey cardigan; rain on tall windows.',
    echoes: [
      {
        flag: 'e03:5,2:care',
        text: 'The overnight log lies open beside her with Morrow’s name on the error line, and she taps it once, the way other people tap a good result.',
      },
      {
        flag: 'e03:5,2:risk',
        text: 'She mentions that the overnight run looks clean now, and watches him over her glasses for exactly as long as it takes him to look away.',
      },
    ],
    choices: [
      {
        id: 'care',
        label: 'Answer one margin question with ‘I don’t know yet’',
        outcome:
          'Dr Sen reads it, nods, and writes a smaller question beneath. They do four more like that until closing. It is slow and unglamorous, and the first work Morrow has done here that feels like his.',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Two heads bent over one annotated printout at a library table, an older scientist writing a small pencil note beneath an androgynous adult’s answer; closing-time lamps, empty chairs.',
      },
      {
        id: 'risk',
        label: 'Run every question through the library computer tonight',
        outcome:
          'By closing every margin has a confident answer. Dr Sen reads three, crosses out two, and asks which of them Morrow would bet his own name on. He has no answer that belongs to him.',
        effects: { evidence: 1, trust: -1 },
        artSubject:
          'An older scientist drawing a calm pencil line through a printed paragraph while an androgynous adult in a grey cardigan sits beside a stack of fresh printouts, looking caught; library lamplight.',
      },
    ],
  },
  {
    key: '7,3',
    place: 'Library Steps Coffee Cart',
    title: 'Nine Stamps',
    speaker: 'Teodor',
    kind: 'merchant',
    opening:
      'Teodor runs the coffee cart at the foot of the library steps and knows everyone by their order. He hands Morrow a loyalty card with the name Rowan on it and nine stamps, five in blue ink and four in green. Morrow studies it like a treaty. ‘Tenth one’s free,’ says Teodor. ‘Jun always did the green. You two still splitting it?’',
    artSubject:
      'A small coffee cart under a striped awning at the foot of rain-wet stone library steps; a cheerful barista in a knitted hat holds out a stamped loyalty card; an androgynous adult in their thirties with short dark hair and a grey cardigan examines it with treaty-level gravity; steam and streetlight.',
    choices: [
      {
        id: 'care',
        label: 'Pay full price and save the free cup for Jun',
        outcome:
          'Morrow pays, and Teodor pegs the card to the till: ‘For whoever comes first.’ It is a small debt kept open on purpose, and Morrow finds he likes it there.',
        effects: { supplies: -1, trust: 1 },
        artSubject:
          'A barista clipping a loyalty card to a small peg beside the till on a coffee cart, while an androgynous adult in a grey cardigan counts coins into his palm; rain dripping from the awning.',
      },
      {
        id: 'risk',
        label: 'Claim the free cup. The card has your name on it',
        outcome:
          'The coffee is hot and costs nothing. Teodor starts a fresh card without comment, but punches the old one in the corner, the way you cancel a ticket. Four of those stamps were Jun’s.',
        effects: { supplies: 2, trust: -1 },
        artSubject:
          'A barista quietly punching the corner of an old loyalty card while an androgynous adult in a grey cardigan holds a steaming paper cup, not quite meeting his eyes; wet steps behind.',
      },
      {
        id: 'usual-order',
        label: 'Ask Teodor what you usually order',
        outcome:
          '‘Oat flat white, extra hot, and you always say sorry about the extra hot.’ Morrow pays, apologises for the extra hot, and learns one true thing about a stranger’s mornings.',
        effects: { supplies: -1, evidence: 1 },
        artSubject:
          'A barista pouring steamed milk with a knowing grin while an androgynous adult in a grey cardigan leans on the cart, listening intently; morning-dark rain and warm cart lights.',
      },
    ],
  },
  {
    key: '8,3',
    place: 'Children’s Library Wall',
    title: 'Monsters of Our Street',
    speaker: 'Morrow',
    kind: 'memory',
    instant: true,
    opening:
      'The children’s library has pinned up a project called ‘Draw Your Street’. Buses have teeth. A bin lorry has twelve eyes. A traffic light glares in three colours like something that never sleeps. Morrow, who has been privately afraid of the bin lorry all week, stands among the crayons and feels, for the first time, that the city has other honest witnesses.',
    artSubject:
      'A children’s library wall covered in crayon drawings of buses with teeth and a many-eyed bin lorry; an androgynous adult in their thirties with short dark hair and a grey cardigan stands among small chairs, studying them with solemn respect; bright, cosy evening light.',
    choices: [
      {
        id: 'notice',
        label: 'Look for a map of the park',
        outcome:
          'Signed with a T and an 8, it shows the park fountain with a mouth full of gravel and a dotted path that gives it a wide berth. Morrow memorises the path, on the principle that the child may know something.',
        effects: { evidence: 1 },
        artSubject:
          'Close view of a crayon map pinned to a corkboard, a park fountain drawn with a gravelly mouth and a careful dotted path curving around it; an adult finger in a grey cardigan sleeve tracing the dots.',
      },
    ],
  },
  {
    key: '1,4',
    place: 'Night-School Lift',
    title: 'The Box Between Floors',
    speaker: 'Bea',
    kind: 'monster',
    opening:
      'The night-school lift is older than the building’s paint. Between the first and second floors it shudders, hums one low note and stops, and the light dims to the colour of weak tea. Morrow knows a swallowing when he feels one. Beside him Bea, a bus mechanic who comes to class straight from the depot, says ‘Oh, not again,’ and folds her coat to sit on.',
    artSubject:
      'Inside a cramped old lift stalled between floors, light dimmed to amber; a sturdy bus mechanic in overalls sits on her folded coat, unbothered; an androgynous adult in their thirties with short dark hair and a grey cardigan presses back against the wall, eyes on the closed doors as if they were jaws.',
    choices: [
      {
        id: 'care',
        label: 'Press the alarm, then keep Bea talking until help comes',
        outcome:
          'The caretaker’s voice crackles through the grille: twenty minutes. Bea talks about gearboxes; Morrow talks, carefully, about a forest he says he read about. They miss half of class and arrive with an in-joke.',
        effects: { trust: 1, danger: -1, supplies: -1 },
        artSubject:
          'Two people sitting on the floor of a stalled lift in amber light, a bus mechanic gesturing mid-story and an androgynous adult in a grey cardigan laughing despite himself, alarm button glowing.',
      },
      {
        id: 'risk',
        label: 'Prise the doors apart and climb out',
        outcome:
          'The doors give a hand’s width onto bare brick and a ledge at knee height. Bea grabs his belt and says, very calmly, ‘No.’ He steps back in shaking, with a torn sleeve and a mechanic’s lecture on counterweights.',
        effects: { danger: 2, evidence: 1 },
        artSubject:
          'An androgynous adult in a grey cardigan straining lift doors apart onto a dark brick shaft while a bus mechanic grips the back of their belt with both hands; harsh amber light.',
      },
      {
        id: 'parley',
        label: 'Address the lift formally and offer it a coin',
        outcome:
          'Morrow bows to the control panel, names the lift ‘patient one’ and drops a coin through the floor gap. The lift does nothing. Bea, too delighted to keep panicking, presses the alarm herself and asks if he does birthdays.',
        effects: { trust: 1, supplies: -1 },
        artSubject:
          'An androgynous adult in a grey cardigan bowing gravely to a lift control panel, a coin falling from their fingers, while a bus mechanic covers her mouth to stop laughing; dim amber lift light.',
      },
    ],
  },
  {
    key: '2,4',
    place: 'Enrolment Desk',
    title: 'Sign Where It Says',
    speaker: 'Mrs Baptiste',
    kind: 'memory',
    opening:
      'Mrs Baptiste runs enrolment from a folding table and a biscuit tin of pens. Rowan signed up for Probability (Evenings) in September, and the mid-term form wants the same signature again. She turns the September form round: a quick, confident scrawl Morrow could copy in two tries. ‘Same as before, love,’ she says, ‘or the office sends it back.’',
    artSubject:
      'A folding table in a school corridor with a biscuit tin full of pens; a warm older woman in a cardigan and lanyard turns a form around to show an old signature; an androgynous adult in their thirties with short dark hair and a grey cardigan holds a pen above the paper, hesitating; strip lights, rain on the corridor windows.',
    choices: [
      {
        id: 'care',
        label: 'Sign in your own hand and let the mismatch show',
        outcome:
          'Morrow writes slowly, in letters shaped by another alphabet. Mrs Baptiste frowns, staples a note to it and says the office will probably ring. He has made a small true record, and a small problem for both of them.',
        effects: { trust: 1, danger: 1 },
        artSubject:
          'An enrolment officer stapling a note to a form with a careful, unfamiliar signature while an androgynous adult in a grey cardigan watches, braced; corridor strip lights.',
      },
      {
        id: 'risk',
        label: 'Trace the old signature until it passes',
        outcome:
          'Second try, it is perfect. Mrs Baptiste files it without a glance. What frightens Morrow is how easily the hand does it, as if it had been waiting to be asked.',
        effects: { danger: -1, trust: -1 },
        artSubject:
          'Close view of a hand in a grey cardigan sleeve gliding a pen over a form with eerie ease, an older signature visible above for comparison; flat corridor light.',
      },
      {
        id: 'changed-signature',
        label: 'Ask whether people ever change their signature',
        outcome:
          '‘All the time,’ she says. ‘Weddings, wrists, new countries.’ She hands him a change-of-signature form, which needs a witness. Morrow now has an honest route and one more piece of paper than he wanted.',
        effects: { evidence: 1, supplies: -1 },
        artSubject:
          'An enrolment officer handing a second form across a folding table with a kind shrug while an androgynous adult in a grey cardigan accepts it, half relieved and half daunted; biscuit tin of pens between them.',
      },
    ],
  },
  {
    key: '3,4',
    place: 'Room 14 Prediction Box',
    title: 'p = 0.3',
    speaker: 'Mr Okafor',
    kind: 'memory',
    instant: true,
    opening:
      'At enrolment Mr Okafor has every student write one prediction about their own term, with a probability attached, and seals the cards in a shoebox until mid-term. Tonight he hands them back. Rowan’s card, in that quick scrawl, reads: ‘I call Jun before spring. p = 0.3.’ Mr Okafor says, to the room, ‘Honest numbers are the brave ones.’',
    artSubject:
      'A night-school classroom; a tall teacher in a tweed jacket hands index cards out of a battered shoebox down the rows; an androgynous adult in their thirties with short dark hair and a grey cardigan holds one card very still, staring at it; whiteboard of probability trees behind, rain on the dark windows.',
    echoes: [
      {
        flag: 'e03:3,3:care',
        text: 'The sealed envelope to Jun is still in Morrow’s inside pocket. Now he knows the odds its writer gave it.',
      },
      {
        flag: 'e03:3,3:risk',
        text: 'Morrow has read the letter that stops mid-sentence. Now he knows its writer had already guessed it would.',
      },
    ],
    choices: [
      {
        id: 'notice',
        label: 'Pocket the prediction card',
        outcome:
          'Morrow tucks it beside Rowan’s pens. Then, because the class is doing it, he writes his own on a fresh card and hands it to Mr Okafor sealed. He tells no one what number he chose.',
        effects: { evidence: 1 },
        artSubject:
          'An androgynous adult in a grey cardigan handing a sealed index card to a teacher in a tweed jacket, who receives it with grave courtesy; night classroom, lamplit desks.',
      },
    ],
  },
  {
    key: '4,4',
    place: 'Room 14',
    title: 'The Bus-Fare Bet',
    speaker: 'Mr Okafor',
    kind: 'puzzle',
    opening:
      'Mr Okafor rolls one ordinary six-sided die and keeps it covered under his palm. ‘Three bets,’ he tells the class. ‘It is a six. It is not a one. It is even. Stake your bus fare. Losers fund the biscuits.’ Morrow’s first instinct is to flatter the die. His second, newer and less comfortable, is to count.',
    artSubject:
      'A night-school classroom; a tall teacher in a tweed jacket keeps one hand flat over a die on his desk, eyebrows raised at the class; an androgynous adult in their thirties with short dark hair and a grey cardigan leans forward, lips moving as they count on their fingers; a broken stopwatch serves as a paperweight; strip lights and rain.',
    choices: [
      {
        id: 'care',
        label: 'Bet it isn’t a one',
        outcome:
          'He lifts his hand: a three. ‘Five ways to win, one to lose,’ says Mr Okafor, and writes Morrow’s reasoning on the board instead of his luck. Morrow feels the odd pleasure of being right for a reason anyone could check.',
        effects: { evidence: 2 },
        artSubject:
          'A teacher in a tweed jacket writing a short tally on a whiteboard while an androgynous adult in a grey cardigan sits up straighter, quietly proud; a die showing three on the desk.',
      },
      {
        id: 'risk',
        label: 'Bet on the six. Fortune favours the declared',
        outcome:
          'A three. ‘One way to win, five to lose,’ says Mr Okafor, not unkindly. ‘The die didn’t hear you. It never does.’ His bus fare goes in the biscuit jar, and he walks home in the rain, doing sums.',
        effects: { supplies: -1 },
        artSubject:
          'An androgynous adult in a grey cardigan walking home along a rainy street at night with hands in pockets, muttering numbers, the lit windows of a night school behind them.',
      },
      {
        id: 'even',
        label: 'Bet on even. Half the faces can’t all be wrong',
        outcome:
          'A three. ‘Three ways to win, three to lose. A coin toss in a nicer coat,’ says Mr Okafor. Morrow funds the biscuits and gains a grudging respect for the word ‘not’.',
        effects: { supplies: -1 },
        artSubject:
          'A teacher in a tweed jacket tossing an imaginary coin with a wry smile while an androgynous adult in a grey cardigan drops coins into a biscuit jar; classroom strip lights.',
      },
    ],
  },
  {
    key: '5,4',
    place: 'Room 9 Workshop',
    title: 'Hours on Paper',
    speaker: 'Mara',
    kind: 'companion',
    opening:
      'Mara runs a free one-night workshop in Room 9 called ‘Read Your Payslip’, with a flipchart and a tin of shortbread. Morrow takes a payslip for a tithe ledger and is not entirely wrong. Afterwards Mara reads Rowan’s and goes quiet: eleven overtime hours in August, worked, logged, never claimed. ‘I can file it tonight,’ she says. ‘You just sign that you did them.’',
    artSubject:
      'A small night-school classroom with a flipchart and an open tin of shortbread; a dry, exact woman in her thirties with a steward’s lanyard frowns at a payslip; an androgynous adult in their thirties with short dark hair and a grey cardigan sits across from her with a pen and a claim form; strip lights, rain on the window.',
    echoes: [
      {
        flag: 'e03:2,1:care',
        text: 'Mara has kept him a seat at the front, and a printed glossary of payslip terms, and mentions neither.',
      },
      {
        flag: 'e03:2,1:risk',
        text: 'When Morrow says he remembers August, Mara watches him a beat too long. The bluff from the platform is still between them.',
      },
    ],
    choices: [
      {
        id: 'care',
        label: 'Tell Mara you can’t swear to hours you didn’t see',
        outcome:
          'Mara crosses out ‘I worked’ and writes ‘the record shows’. It is weaker, slower and may never pay. ‘Most honest thing anyone’s said in this room,’ she says, ‘and I’ve had a vicar in.’',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'A shift steward striking through a line on a claim form with a decisive pen, half a smile, while an androgynous adult in a grey cardigan watches across a shortbread tin; empty classroom chairs.',
      },
      {
        id: 'risk',
        label: 'Sign it. The hours were worked, whoever worked them',
        outcome:
          'The claim goes in, and the money will come with the next pay run. Mara files it with a steward’s satisfaction. Morrow has signed his name, or theirs, to a week he never lived, and the paper cannot tell.',
        effects: { supplies: 2, danger: 1 },
        artSubject:
          'An androgynous adult in a grey cardigan signing a claim form with a firm stroke while a shift steward slides it into a folder, satisfied; flipchart and strip lights behind.',
      },
    ],
  },
  {
    key: '6,4',
    place: 'Borrowed Lab Desk',
    title: 'The Failed Gesture',
    speaker: 'Morrow',
    kind: 'memory',
    opening:
      'After class the science lab beside Room 14 stays unlocked for anyone who wants a quiet desk, and someone has left circuit diagrams spread under the lamp. Morrow checks the corridor twice. Then he lifts one open hand above the paper, the way he once lifted it over Briar water to call the light. The wall clock reads twenty to ten.',
    artSubject:
      'An empty night-school science lab; an androgynous adult in their thirties with short dark hair and a grey cardigan sits at a borrowed desk strewn with hand-drawn circuit diagrams, one open hand held flat above the paper; nothing glows; an ordinary wall clock shows twenty to ten; desk lamp, rain on dark windows.',
    choices: [],
  },
  {
    key: '7,4',
    place: 'Corridor Tea Shelf',
    title: 'A Paper Cup With a Name',
    speaker: 'Morrow',
    kind: 'treasure',
    instant: true,
    opening:
      'Beside the corridor tea urn is a shelf of paper cups, each with a name in marker, reused all term in defiance of what paper cups are for. One bears the name Rowan, soft at the rim. Morrow lifts it as he would a relic and finds something folded inside, which is not how relics usually work.',
    artSubject:
      'A school corridor shelf beside a steel tea urn, lined with worn paper cups marked with blank name patches; an androgynous adult in their thirties with short dark hair and a grey cardigan lifts one reverently with both hands, a folded paper peeking out; warm urn steam under strip lights.',
    choices: [
      {
        id: 'notice',
        label: 'Unfold the note in the cup',
        outcome:
          'A crib sheet in Rowan’s hand: the rules for ‘and’, ‘or’ and ‘not’, with ‘NOT is your friend’ underlined twice. Morrow keeps it. Then, after some thought, he makes tea in the cup.',
        effects: { evidence: 1, supplies: 1 },
        artSubject:
          'An androgynous adult in a grey cardigan reading a small folded crib sheet while tea steams from a worn paper cup in their other hand; corridor tea urn behind.',
      },
    ],
  },
  {
    key: '8,4',
    place: 'Fire-Exit Map',
    title: 'Annotations in Biro',
    speaker: 'Morrow',
    kind: 'memory',
    instant: true,
    opening:
      'By the fire exit hangs an evacuation plan of the corridor, and years of students have improved it in biro. Arrows mark ‘best radiator’, ‘vending machine eats 20p’ and ‘cry here (it’s fine)’. Morrow, who expected a map to be a treaty, is moved to find that this one is a conversation.',
    artSubject:
      'A framed corridor evacuation plan by a fire door, crowded with many small hand-drawn biro arrows and doodles; an androgynous adult in their thirties with short dark hair and a grey cardigan leans close, smiling despite themself; green exit glow and rain on the door glass.',
    choices: [
      {
        id: 'notice',
        label: 'Read the newest arrow',
        outcome:
          'In Rowan’s scrawl, an arrow to the back stairs: ‘shortcut to the night bus, slippery when wet, take it anyway’. Under it, in other ink, someone has added ‘or don’t’. Morrow takes the stairs slowly and catches the bus.',
        effects: { supplies: 1 },
        artSubject:
          'An androgynous adult in a grey cardigan descending rain-slick metal back stairs very carefully, one hand on the rail, a night bus pulling up under a streetlight below.',
      },
    ],
  },
]
