import type { MorrowShiftSite } from './types'

export const MORROW_SHIFT_ROWS_7_8: readonly MorrowShiftSite[] = [
  {
    key: '1,7',
    place: 'Clinic Entrance',
    title: 'Take a Number',
    speaker: 'Morrow',
    kind: 'memory',
    instant: true,
    opening:
      'The clinic doors sigh open on plastic chairs and one muted television. Morrow gives the receptionist all three of his names and the house he is heir to. She doesn’t look up. She points at a red machine on a pole, which sticks out a paper tongue.',
    artSubject:
      'A bright clinic entrance at night with rain on the glass doors, rows of plastic chairs and a red ticket dispenser on a pole; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, stands far too straight at the reception counter while the receptionist keeps typing.',
    choices: [
      {
        id: 'notice',
        label: 'Take a number',
        outcome:
          'Forty-seven. Morrow checks the ticket for a seal, finds none, and sits between a man with a bandaged thumb and a woman doing the crossword in pen. Here rank is a number, and everybody gets one.',
        effects: {},
        artSubject:
          'Close view of Morrow’s fingers holding a small paper queue ticket as carefully as a royal seal, plastic waiting chairs and a muted television blurred behind.',
      },
    ],
  },
  {
    key: '2,7',
    place: 'Reception Counter',
    title: 'The Usual Doctor',
    speaker: 'Gwen',
    kind: 'puzzle',
    opening:
      'The intake form wants Rowan’s usual doctor. The wallet holds three appointment cards: Dr Abara, Dr Lindqvist, Dr Pereira. A card on the noticeboard wishes Dr Abara a happy retirement after thirty years; the door says the clinic is closed on Sundays, and the Lindqvist card is for a Sunday. Gwen taps her pen. “Only one of those works here, love.”',
    artSubject:
      'A clinic reception counter under fluorescent light, three small appointment cards fanned beside a clipboard, a corkboard with a paper bouquet pinned to it; a receptionist in reading glasses waits with a pen while Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, frowns at the cards.',
    choices: [
      {
        id: 'care',
        label: 'Write Dr Abara, the oldest card',
        outcome:
          'Gwen slides the form back. “Retired in May. Growing tomatoes now.” Morrow starts again while the queue behind him sighs as one creature.',
        effects: { trust: -1 },
        artSubject:
          'A receptionist gently pushing a clipboard back across the counter as Morrow winces, a line of tired patients visible over his shoulder.',
      },
      {
        id: 'risk',
        label: 'Write Dr Lindqvist, the newest card',
        outcome:
          'That card is from the weekend out-of-hours service across town. Gwen sends Morrow to the back of the registration line while someone fetches the right file.',
        effects: { supplies: -1 },
        artSubject:
          'Morrow walking back to the end of a short queue of patients in damp coats, clipboard under his arm, rain streaking the window beside him.',
      },
      {
        id: 'dr-pereira',
        label: 'Write Dr Pereira, the plainest card',
        outcome:
          'Gwen finds the file at once and frowns at her screen. “You were meant to come back in March. Sleep follow-up.” Morrow hadn’t known Rowan stopped sleeping.',
        effects: { evidence: 2 },
        artSubject:
          'A receptionist turning her monitor slightly away for privacy, her face thoughtful, while Morrow leans in at the counter, suddenly still.',
      },
    ],
  },
  {
    key: '3,7',
    place: 'Corner Seats',
    title: 'The Unopened Referral',
    speaker: 'Morrow',
    kind: 'memory',
    opening:
      'In the cardigan’s inside pocket Morrow finds a clinic envelope, never opened, postmarked March: a referral to a sleep service. He has woken at three every night in this body and blamed the city. The city, it turns out, had help. The envelope is addressed to a name he answers to and doesn’t own.',
    artSubject:
      'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, sits in a corner of a clinic waiting room turning a sealed white envelope over in his hands, a vending machine glowing beside him and rain on the black window.',
    choices: [
      {
        id: 'care',
        label: 'Book the appointment Rowan kept avoiding',
        outcome:
          'Gwen finds a slot in three weeks, on a morning Mara will have to cover. Morrow writes it on his hand, then in his phone, then on a receipt, in case one of them lies.',
        effects: { supplies: -1, trust: 1, danger: -1 },
        artSubject:
          'Morrow at the reception counter writing a date on the back of his own hand with a borrowed biro, the sealed envelope tucked under his arm.',
      },
      {
        id: 'risk',
        label: 'Open it and read the doctor’s covering note',
        outcome:
          'The note quotes Rowan: “working nights on a project I can’t put down.” Morrow thinks of the locked archive under the Annex and feels the waiting-room floor tilt, very slightly.',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'Morrow hunched in a plastic chair reading a folded letter by fluorescent light, a torn envelope on his knee, his reflection faint in the dark window.',
      },
    ],
    echoes: [
      {
        flag: 'e03:5,2:care',
        text: 'At the Annex he put the skipped step under his own name. Now he wonders how many steps Rowan skipped, and how tired he was when he did.',
      },
      {
        flag: 'e03:5,2:risk',
        text: 'At the Annex he re-ran the numbers so the log looked tidy. Sitting here, he suspects Rowan liked tidy logs too.',
      },
    ],
  },
  {
    key: '4,7',
    place: 'Waiting Room Clock',
    title: 'Six Hours',
    speaker: 'Dennis',
    kind: 'challenge',
    opening:
      'A big man in a delivery-firm fleece is on his feet at the desk. “Six hours,” he says, louder each time, jabbing at the wall clock. “Six hours she’s been back there.” Gwen’s hand has drifted to the phone. Morrow knows a lord demanding precedence when he sees one. He also knows the clock’s second hand hasn’t moved since he came in.',
    artSubject:
      'A tense clinic waiting room: a broad man in a work fleece stands at the reception desk pointing at a wall clock, a receptionist with her hand on the phone, patients pretending not to look; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, half-rises from a chair.',
    choices: [
      {
        id: 'care',
        label: 'Sit beside him and ask who he’s waiting for',
        outcome:
          'His daughter, Keisha, fourteen, a bad landing at netball. He lets Morrow buy him a tea and talks about her until his hands stop shaking. The shouting stops. The waiting doesn’t.',
        effects: { supplies: -1, trust: 1, danger: -1 },
        artSubject:
          'Morrow and the big man side by side on plastic chairs, the man holding a paper cup in both hands and showing Morrow a photo on his phone.',
      },
      {
        id: 'risk',
        label: 'Step between him and the desk',
        outcome:
          'Dennis stops, mostly from surprise. Gwen mouths thank you, the security guard writes something down about both of them, and Dennis spends the next hour glaring at the back of Morrow’s head.',
        effects: { trust: 1, danger: 1 },
        artSubject:
          'Morrow standing between a large angry man and a reception counter, palms out, a security guard approaching down the corridor behind them.',
      },
      {
        id: 'clock',
        label: 'Tell him the clock stopped hours ago',
        outcome:
          'Dennis stares at it, then at his phone. Ninety minutes, not six hours. He laughs, mortified, sits down hard and won’t look at Morrow again. It’s still ninety minutes of not knowing.',
        effects: { evidence: 1, danger: -1, trust: -1 },
        artSubject:
          'The big man looking from a stopped wall clock to his phone screen, his anger collapsing into embarrassment, Morrow pointing up at the clock.',
      },
    ],
  },
  {
    key: '5,7',
    place: 'Triage Window',
    title: 'Imani’s Triage',
    speaker: 'Nurse Imani',
    kind: 'memory',
    opening:
      '“Forty-seven,” calls Nurse Imani, and Morrow is forty-seven. Two seats down, a man in a paint-flecked jacket is breathing in short, whistling pulls, holding sixty-three and trying not to be a bother. Across the room Sal sits with a wrapped wrist and Tilly drawing at her elbow. Sal was here before any of them.',
    artSubject:
      'A clinic waiting room under fluorescent light: a triage nurse in navy scrubs with braided hair stands in a doorway holding a clipboard; a man in a paint-flecked jacket leans forward fighting for breath; an older woman with a wrapped wrist sits beside a child drawing with crayons; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, grips a paper ticket.',
    choices: [
      {
        id: 'care',
        label: 'Give your number to the man who can’t catch his breath',
        outcome:
          'Imani looks at the painter, then at Morrow, and takes the ticket without a word. Morrow goes back to waiting. An hour later a paper cup of water appears by his chair, and Imani is already walking away.',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Morrow pressing his paper ticket into the hand of the breathless painter while the triage nurse steps forward to take the man’s elbow.',
      },
      {
        id: 'risk',
        label: 'Ask Imani to take Sal next; she’s family, near enough',
        outcome:
          '“Everyone in this room is somebody’s family,” Imani says, and calls the painter in herself; she clocked his breathing from the window. Sal heard every word, and pats Morrow’s knee as if he were the one who got hurt.',
        effects: { trust: -2, evidence: 1 },
        artSubject:
          'The triage nurse shaking her head at Morrow at the window while guiding the breathless painter through the door; across the room the older woman with the wrapped wrist looks kindly embarrassed.',
      },
    ],
    echoes: [
      {
        flag: 'e03:4,6:care',
        text: 'Sal knows now that he isn’t who she thought. She has saved him the seat beside her anyway.',
      },
      {
        flag: 'e03:4,6:risk',
        text: 'Sal waves and calls him by the name Rowan, loud enough for the whole room, and Morrow answers to it again.',
      },
    ],
  },
  {
    key: '6,7',
    place: 'Ambulance Bay',
    title: 'Imani’s Ten Minutes',
    speaker: 'Nurse Imani',
    kind: 'companion',
    opening:
      'Morrow steps out for air and finds Nurse Imani under the ambulance bay’s hard light, eating cold noodles from a tub, standing up. The rota on the staff door says she started at seven this morning; it’s past nine at night. She has eight minutes of break left and the look of someone who will spend them exactly as she likes.',
    artSubject:
      'Night behind a clinic: a triage nurse in navy scrubs and a rain jacket eats noodles from a plastic tub under the harsh white light of an ambulance bay, an empty ambulance parked behind her; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, hovers at the staff door.',
    choices: [
      {
        id: 'care',
        label: 'Offer her your biscuits and keep quiet',
        outcome:
          'She takes two, then a third. With a minute left she says she nearly quit in her first year, and the only cure was the next patient. Then she goes back in, and Morrow understands he was told a secret, not a rule.',
        effects: { supplies: -1, trust: 2 },
        artSubject:
          'Morrow holding out an open packet of biscuits while the nurse takes one without looking away from the rain, both of them leaning on the wet wall.',
      },
      {
        id: 'risk',
        label: 'Ask how she decides who goes first',
        outcome:
          'She tells him plainly: airway, breathing, circulation, then everything else, and never who shouts or who’s sweet. It’s the clearest law he has heard on Earth. It also cost her the last of her break.',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'The nurse counting points off on her fingers with chopsticks still in one hand, Morrow listening intently under the ambulance bay light.',
      },
    ],
    echoes: [
      {
        flag: 'e03:5,7:care',
        text: 'Imani nods at the kerb beside her. She remembers ticket forty-seven.',
      },
      {
        flag: 'e03:5,7:risk',
        text: 'Imani sees him and finishes her noodles a little faster.',
      },
    ],
  },
  {
    key: '7,7',
    place: 'Corridor Drinks Machine',
    title: 'The Captive Hearth',
    speaker: 'Morrow',
    kind: 'merchant',
    opening:
      'In the corridor a drinks machine hums like a captive hearth, promising tea, coffee and a hot chocolate the picture swears is real. It takes coins and gives paper cups. Morrow has exactly enough for two, and a porter passing by gives it a practised thump on the side without breaking stride.',
    artSubject:
      'A long clinic corridor at night, a glowing hot-drinks vending machine against a scuffed wall, a hospital porter in green thumping its side as he walks past; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, counts coins in his palm.',
    choices: [
      {
        id: 'care',
        label: 'Buy two teas, one for the woman who’s waited since lunch',
        outcome:
          'She’s Mrs Ferreira, waiting on her husband’s X-ray, and she takes the tea as if Morrow had brought it on a silver tray. His pockets are empty now. His evening isn’t.',
        effects: { supplies: -1, trust: 1 },
        artSubject:
          'Morrow handing a steaming paper cup to an elderly woman in a headscarf and raincoat, a handbag on her knees, in a row of plastic chairs.',
      },
      {
        id: 'risk',
        label: 'Thump it where the porter did',
        outcome:
          'The machine surrenders a hot chocolate and then dies with a sound like a sigh. The next three people in the corridor press its buttons in turn, puzzled. Morrow drinks his prize, which is mostly warm brown water.',
        effects: { supplies: 1, trust: -1 },
        artSubject:
          'Morrow sipping from a paper cup with studied innocence while a frowning man jabs the buttons of a darkened vending machine behind him.',
      },
    ],
    echoes: [
      {
        flag: 'e03:2,5:care',
        text: 'His hands still smell of Rosa’s dish-pit soap from the shift he covered, and he finds he doesn’t mind.',
      },
      {
        flag: 'e03:2,5:risk',
        text: 'He knows now Rowan volunteered for Rosa’s dish pit and forgot. He wonders what else this name has promised without him.',
      },
    ],
  },
  {
    key: '8,7',
    place: 'Children’s Corner',
    title: 'Tilly’s Waiting-Room Page',
    speaker: 'Morrow',
    kind: 'treasure',
    instant: true,
    opening:
      'At the low children’s table, among broken crayons, Morrow finds a page from a bigger map: the clinic as a box with a red cross, the road outside as a grey snake with headlights for eyes, and past it the park, where something round with a wide mouth waits in the middle. It’s Tilly’s hand. She pressed hardest on the mouth.',
    artSubject:
      'A child’s crayon drawing on a low plastic table in a clinic play corner: a box with a red cross, a grey snake-road with headlight eyes, a dark green park with a round fountain drawn as a wide toothy mouth; Morrow’s hand, in a grey cardigan sleeve, reaching for it.',
    choices: [
      {
        id: 'notice',
        label: 'Keep the page',
        outcome:
          'Morrow folds it into his pocket beside the ticket. The round thing, he realises, is the park fountain. He doesn’t know why that makes his chest go tight.',
        effects: { evidence: 1 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, folding a crayon drawing carefully into his cardigan pocket, small chairs and a toy box around his feet.',
      },
    ],
    echoes: [
      {
        flag: 'e03:8,6:care',
        text: 'He knows that grey snake. He crossed it Tilly’s way, at the lights, and the page still shows her safe route in careful green dots.',
      },
      {
        flag: 'e03:8,6:risk',
        text: 'He asked her which monster she wanted renamed. On this page she has scribbled a new name over the fountain, then scribbled that out too.',
      },
    ],
  },
  {
    key: '1,8',
    place: 'Park Gatehouse',
    title: 'The Lost-Property Box',
    speaker: 'Morrow',
    kind: 'treasure',
    instant: true,
    opening:
      'The park gatehouse is shut, but its lost-property box sits under the eaves for night walkers: one glove, a dog lead, a library book four years overdue, and a transit pass in a cracked plastic sleeve. The photo on it is the face Morrow wears. In the picture it’s laughing at someone just out of frame.',
    artSubject:
      'A small brick gatehouse at a park entrance at night, rain dripping off the eaves onto a wooden lost-property box holding a single glove, a dog lead and a swollen library book; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, holds up a transit pass with a tiny photo, floodlights glowing beyond the railings.',
    choices: [
      {
        id: 'notice',
        label: 'Take the pass',
        outcome:
          'It’s good until June. Morrow pockets it and tries the laugh in the gatehouse window. It doesn’t fit his mouth yet.',
        effects: { supplies: 1 },
        artSubject:
          'Morrow’s reflection in a dark gatehouse window, attempting an awkward smile, the transit pass held up beside his face for comparison.',
      },
    ],
  },
  {
    key: '2,8',
    place: 'Park Notice Board',
    title: 'Three Gates, One Open',
    speaker: 'Morrow',
    kind: 'puzzle',
    opening:
      'The notice board is three notices that disagree. North gate: locked at ten. South gate: chained for repairs. East gate: locked when the floodlights go out, and the pitch board says the floodlights stay on until the last five-a-side booking ends at half past ten. Morrow’s phone says nine minutes past ten. Something in him wants to be inside the park tonight. He’d rather not ask it why.',
    artSubject:
      'A rain-streaked park notice board under a street lamp with three pinned sheets, railings stretching away into the dark, the glow of floodlights over a football pitch in the distance; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, checks his phone.',
    choices: [
      {
        id: 'care',
        label: 'Hurry to the north gate',
        outcome:
          'The north gate has been locked for nine minutes and isn’t sorry. Morrow walks the long way round the railings in the rain.',
        effects: { supplies: -1 },
        artSubject:
          'Morrow rattling a padlocked iron park gate in the rain, dark trees beyond it, his cardigan soaked at the shoulders.',
      },
      {
        id: 'risk',
        label: 'Climb the chained south gate',
        outcome:
          'He gets over, tears the cardigan at the elbow and lands in a flowerbed in front of a man walking a terrier, who says nothing in a very loud way.',
        effects: { danger: 1 },
        artSubject:
          'Morrow sprawled in a muddy flowerbed beside a chained gate while a man in a flat cap and his small terrier stare at him.',
      },
      {
        id: 'east-gate',
        label: 'Walk to the east gate',
        outcome:
          'The floodlights are blazing and the east gate stands open, a referee’s whistle shrilling over the pitch. Morrow walks in with twenty minutes to spare and a new rule: on Earth, lights keep their promises to football.',
        effects: { evidence: 1, danger: -1 },
        artSubject:
          'An open park gate washed in white floodlight, a five-a-side match in orange and blue bibs beyond the fence, Morrow stepping through with rain glittering in the light.',
      },
    ],
  },
  {
    key: '3,8',
    place: 'Plane Tree Bench',
    title: 'The Call He Almost Makes',
    speaker: 'Morrow',
    kind: 'memory',
    opening:
      'Under a plane tree, just past the floodlight’s reach, there’s a bench with a small brass plaque Morrow doesn’t read. Jun’s number is open on the phone. His thumb has hovered long enough for the screen to dim twice. Over on the pitch a ball thuds against the fence, again and again, like someone knocking who won’t give up.',
    artSubject:
      'A wooden park bench under a plane tree at the edge of floodlight, wet leaves on the path; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, sits alone with a phone glowing in his hand, his thumb hovering, a blurred football pitch bright behind him.',
    choices: [
      {
        id: 'care',
        label: 'Call, and say only things that are true',
        outcome:
          'It goes to voicemail. Jun’s recorded voice is warm and a little impatient. Morrow says, “I owe you a real conversation, not this one,” and hangs up before he can turn it into a lie.',
        effects: { trust: 1, danger: 1 },
        artSubject:
          'Morrow on the bench with the phone pressed to his ear and his eyes shut, his free hand gripping the edge of the seat.',
      },
      {
        id: 'risk',
        label: 'Play the old voicemails Jun left instead',
        outcome:
          'There are nine. The last says, “Fine. Don’t call back. I’m still here.” Morrow plays it three times, and each time it sounds more like it was meant for him, which is the worst part.',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'Morrow hunched forward on the bench with the phone on speaker held close to his face, its light the only warm thing in the dark under the tree.',
      },
      {
        id: 'pocket',
        label: 'Put the phone away and watch the football',
        outcome:
          'Nothing is said, so nothing goes wrong. The orange bibs win four–three. The phone stays warm in his pocket for a long time, like something still deciding.',
        effects: { danger: -1, trust: -1 },
        artSubject:
          'Morrow leaning back on the bench with his hands in his cardigan pockets, watching a floodlit five-a-side match through a wire fence.',
      },
    ],
    echoes: [
      {
        flag: 'e03:3,3:care',
        text: 'Jun’s sealed envelope is still in his inside pocket, pressed flat against the phone.',
      },
      {
        flag: 'e03:3,3:risk',
        text: 'He has read what Rowan meant to tell Jun. It hasn’t made the words his to say.',
      },
    ],
  },
  {
    key: '4,8',
    place: 'Unlit Pond Path',
    title: 'The Hound Before the Riders',
    speaker: 'Morrow',
    kind: 'monster',
    opening:
      'Halfway down the unlit path by the pond, something large comes out of the dark at a gallop: a dog the size of a small pony, no lead, tongue out, eyes silver in the floodlight spill. Far off a head torch bobs and a woman shouts “Biscuit! BISCUIT!” with no hope in it. In the Briar Marches, hounds like this ran ahead of the riders.',
    artSubject:
      'A dark path beside a pond at night, a huge shaggy dog bounding out of the shadows with its eyes catching stray floodlight, a distant head torch bobbing among the trees; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, frozen mid-step.',
    choices: [
      {
        id: 'care',
        label: 'Stand still, hands low, and let it decide',
        outcome:
          'Biscuit circles twice, sniffs his knees, and leans his whole muddy weight against Morrow’s legs, which give. Morrow sits in a puddle. The owner, Priya, arrives apologising, and his heart takes until the next lamp post to slow.',
        effects: { trust: 1, supplies: -1 },
        artSubject:
          'Morrow sitting in a puddle on the path with an enormous happy dog leaning against him, a woman in a head torch running up with a lead.',
      },
      {
        id: 'risk',
        label: 'Run for the floodlights',
        outcome:
          'Biscuit loves this game and wins it in four strides. Morrow goes down on the wet grass with a dog on his chest and a wrenched shoulder. Priya, mortified, gives him her number in case he needs a witness, or a lift.',
        effects: { danger: 2, trust: 1 },
        artSubject:
          'Morrow flat on his back on wet floodlit grass with a giant dog standing on his chest, a woman hauling at its collar.',
      },
    ],
  },
  {
    key: '5,8',
    place: 'Pavilion Steps',
    title: 'Walt’s Night Round',
    speaker: 'Walt',
    kind: 'companion',
    opening:
      'Walt the cleaner is working the pavilion steps with a litter picker and a bin bag, whistling a song with too many verses. He knows the face. “You’re back,” he says. “Thought you’d stopped coming. Used to sit out here gone midnight with a notebook, writing like it was a race.”',
    artSubject:
      'The steps of an old park pavilion under a floodlight, an older cleaner in a hi-vis jacket and woolly hat holding a litter picker and a bin bag, a cart of brooms beside him; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, stops at the foot of the steps.',
    choices: [
      {
        id: 'care',
        label: 'Take the spare picker and help him finish the round',
        outcome:
          'They do the bandstand, the bins and the stretch by the pond nobody does. Walt talks about his late wife’s allotment, not Rowan. At the end he says, “Whatever you were doing out here, it wasn’t resting,” and goes to clock off.',
        effects: { supplies: -1, trust: 2 },
        artSubject:
          'Morrow and the cleaner walking side by side along a wet path with litter pickers, bin bags half full, floodlight behind them.',
      },
      {
        id: 'risk',
        label: 'Ask him what you used to write out here',
        outcome:
          '“Never looked. Numbers, I’d guess, then not numbers. You’d tear the page out and keep it.” Walt nods toward the dark middle of the park. “Always sat facing that fountain. Like you were waiting on it.”',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'The cleaner leaning on his litter picker and pointing toward the dark centre of the park, Morrow following his gaze, rain falling through the floodlight.',
      },
    ],
    echoes: [
      {
        flag: 'e03:6,2:care',
        text: 'Walt gives him a short nod. Morrow signed the key log at the Sublevel B door and asked him for an escort, and Walt remembers people who use the log.',
      },
      {
        flag: 'e03:6,2:risk',
        text: 'Walt’s glance drops to Morrow’s lanyard. A badge went missing from the Annex rack, and Walt hasn’t decided yet whether to ask.',
      },
    ],
  },
  {
    key: '6,8',
    place: 'Bandstand',
    title: 'The Small Working',
    speaker: 'Morrow',
    kind: 'memory',
    instant: true,
    opening:
      'The bandstand is empty, its floor scattered with wet plane leaves. Nobody is watching. Morrow holds one hand over a leaf the way he was taught as a child in the Marches: palm down, the name of the wind held behind his teeth. In the Briar this was nothing, a trick for bored cousins.',
    artSubject:
      'An empty Victorian bandstand at night with wet leaves on its boards, floodlight slanting through the railings; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, crouches with one open hand held palm-down over a single leaf.',
    choices: [
      {
        id: 'notice',
        label: 'Try the small working anyway',
        outcome:
          'The leaf stays a leaf. A drip from the roof lands on his wrist, and that is the only thing that happens. Morrow stays crouched longer than he means to, looking past the railings at the dark middle of the park.',
        effects: { danger: 1 },
        artSubject:
          'Close view of Morrow’s still hand above a motionless wet leaf on bandstand boards, a single raindrop on his wrist, darkness beyond the railings.',
      },
    ],
    echoes: [
      {
        flag: 'e03:2,1:care',
        text: 'His phone buzzes: Mara. “Handoff’s 7am. I’ll walk you through it again. Bring the good pens.”',
      },
      {
        flag: 'e03:2,1:risk',
        text: 'His phone buzzes: Mara. “Handoff’s 7am. You remember where, obviously.” The whole bluff is sitting in that last word.',
      },
    ],
  },
  {
    key: '7,8',
    place: 'Fountain Lawn',
    title: 'The Mouth in the Middle',
    speaker: 'Morrow',
    kind: 'memory',
    opening:
      'From the edge of the lawn Morrow can see it: the drained fountain, a wide stone bowl with a dark spout in the centre, exactly where Tilly drew the mouth. The floodlights stop just short of it. He holds a paper cup of tea gone cold and feels the old pull of a place that might, if asked properly, answer. Nothing answers here. His feet haven’t been told.',
    artSubject:
      'A wide wet lawn at night, the white edge of floodlight stopping a few metres short of a drained stone fountain in deep shadow; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, stands at the lit edge holding a paper cup, facing the dark bowl.',
    choices: [
      {
        id: 'care',
        label: 'Turn back and text Mara that you’ll make the handoff',
        outcome:
          'He gets as far as the bins before he looks back. The fountain is still there, of course. But the message is sent, and Mara replies with a thumbs-up, which on Earth is apparently a binding oath.',
        effects: { trust: 1, danger: -1 },
        artSubject:
          'Morrow walking away across the floodlit lawn, head bent over his glowing phone, the dark fountain behind him over his shoulder.',
      },
      {
        id: 'risk',
        label: 'Walk to the rim and look into the bowl',
        outcome:
          'Leaves, coins, a child’s shoe, a drain grate. The stone is cold and remembers nothing. Morrow stays until the floodlights click off behind him, and the dark comes up over the lawn like water.',
        effects: { evidence: 1, danger: 2 },
        artSubject:
          'Morrow leaning over the rim of a dry stone fountain at night, wet leaves and a scatter of coins in the basin, the floodlights behind him just going out.',
      },
      {
        id: 'offer',
        label: 'Pour your cold tea into the basin, as you’d feed a well',
        outcome:
          'The tea runs down the stone and into the drain with a small, ordinary gurgle. Nothing drinks it. Morrow is embarrassed, and under that relieved, and under that something he won’t name yet.',
        effects: { supplies: -1, danger: 1 },
        artSubject:
          'Morrow tipping a paper cup of tea into a dry stone fountain basin, a thin brown stream running toward a drain, his face caught between hope and shame.',
      },
    ],
    echoes: [
      {
        flag: 'e03:5,7:care',
        text: 'Tonight he gave his ticket away and waited like everyone else. Out here nobody keeps a queue, and that frightens him more than the dark.',
      },
      {
        flag: 'e03:5,7:risk',
        text: 'Tonight he asked for a rule to be bent. The fountain looks like something that bends rules, which is exactly the trouble.',
      },
    ],
  },
]
