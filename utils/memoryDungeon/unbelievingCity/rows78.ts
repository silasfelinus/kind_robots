import type { MorrowShiftSite } from '../morrowShift/types'

/**
 * e04 rows 7–8: the Clinic Waiting Room and the Floodlit Night Park, the
 * same places as e03 after magic arrived. Row 7 is the clinic losing count
 * of its own patients; row 8 builds toward the tide gate at 8,8, whose three
 * choices come from the campaign (see overworldEventCatalog.ts).
 */
export const UNBELIEVING_CITY_ROWS_7_8: readonly MorrowShiftSite[] = [
  {
    key: '1,7',
    place: 'Clinic Entrance',
    title: 'The Machine That Won’t Stop',
    speaker: 'Morrow',
    kind: 'memory',
    instant: true,
    opening:
      'The clinic doors sigh open on a drift of paper. The red ticket machine is printing by itself, a number every few seconds, and the tongues of paper curl across the floor like wet leaves. Nobody is standing at it. The receptionist has put a chair over the pile so no one slips. To Morrow, a summons nobody answers is a debt. He would rather it meant nothing at all.',
    artSubject:
      'A bright clinic entrance at night, gold rain glittering on the glass doors, a red ticket dispenser on a pole spilling a long curling drift of paper tickets across the lino, a plastic chair set over the pile; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, hesitates just inside the doors.',
    choices: [
      {
        id: 'notice',
        label: 'Tear off a number',
        outcome:
          'Forty-seven, the number he held the last time he sat here. The paper is warm and faintly damp, as if it has been in someone’s coat pocket. Morrow keeps it. Somewhere in the waiting room a phone rings once and stops.',
        effects: { evidence: 1 },
        artSubject:
          'Close view of Morrow’s fingers holding a damp paper queue ticket, more tickets curling out of the machine behind it, gold rain on the dark doors.',
      },
    ],
  },
  {
    key: '2,7',
    place: 'Reception Counter',
    title: 'Twenty-Seven Names, Twenty-Four Chairs',
    speaker: 'Gwen',
    kind: 'puzzle',
    opening:
      'Gwen’s register lists twenty-seven names; Morrow counts twenty-four people. ‘Machine started printing by itself at nine, when the rain went gold,’ she says. ‘Anything after that is nobody.’ Three names haven’t answered: Ana Petrov, ticketed 9:12, her coat folded on chair nine; Baby Okoro, 9:03; Mr Ferris, 8:41. ‘Find me whoever’s real. They’re not well.’',
    artSubject:
      'A clinic reception counter under flickering fluorescent light, a printed register with three names circled in pen, a damp folded coat on an empty plastic chair nearby; a receptionist in reading glasses holds the register out while Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, leans in to read it.',
    choices: [
      {
        id: 'care',
        label: 'Look for Mr Ferris, ticketed before nine',
        outcome:
          'Morrow finds him on the floor of the disabled toilet, grey and apologetic, ticket forty-one in his fist. Gwen has a nurse there in a minute. Afterwards she crosses two names off the register in ink, says ‘Right. Nobodies,’ and her pen shakes only once.',
        effects: { evidence: 2, trust: 1 },
        artSubject:
          'Morrow crouching in a narrow clinic toilet beside an elderly man sitting on the floor, a nurse in navy scrubs hurrying through the door behind them.',
      },
      {
        id: 'risk',
        label: 'Look for Ana Petrov; her coat is right there on chair nine',
        outcome:
          'The coat is wet through and smells of the sea, though the rain outside isn’t salt. Its pockets hold a train ticket and nothing else. Nobody will sit near chair nine after that, and Gwen loses ten minutes moving chairs.',
        effects: { danger: 1, supplies: -1 },
        artSubject:
          'Morrow holding up a dripping woman’s coat by the shoulders in a waiting room, patients in nearby chairs leaning away from it.',
      },
      {
        id: 'baby-okoro',
        label: 'Page Baby Okoro’s parents; a baby can’t wait',
        outcome:
          'The name goes out over the tannoy. Nobody comes. Then, from the empty corridor, a small voice answers ‘Here,’ just once. Gwen switches the tannoy off and does not switch it back on.',
        effects: { danger: 1, trust: -1 },
        artSubject:
          'A receptionist with her finger frozen on a tannoy switch, staring down an empty, brightly lit clinic corridor; Morrow beside her, very still.',
      },
    ],
    echoes: [
      {
        flag: 'e03:2,7:dr-pereira',
        text: 'Gwen remembers him: the sleep follow-up he still hasn’t booked. She hands him the register anyway. Tonight she needs eyes more than she needs him rested.',
      },
      {
        flag: 'e03:2,7:care',
        text: 'Last time he wrote a retired doctor’s name on the form. Gwen hands him the register anyway; tonight anyone who can count will do.',
      },
    ],
  },
  {
    key: '3,7',
    place: 'Corner Seats',
    title: 'The Sleepers in the Corner',
    speaker: 'Morrow',
    kind: 'memory',
    opening:
      'Four people are asleep in the corner seats and nobody can wake them. They came in out of the gold rain, and in their sleep each repeats one sentence, quietly, like a radio in another room. ‘I’ll be home by six.’ ‘I won’t tell her.’ ‘Next year, I promise.’ A woman sits holding her teenage son’s hand. He keeps saying, ‘I’ll call you when I land.’',
    artSubject:
      'A corner of a clinic waiting room at night: four people slumped asleep in plastic chairs, faint gold droplets still in their hair, a mother holding her sleeping teenage son’s hand; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, kneels nearby, a vending machine glowing beside them.',
    choices: [
      {
        id: 'care',
        label: 'Help his mother keep talking to him, about anything true',
        outcome:
          'They talk about his football, his terrible playlist, the dog. Nothing changes until near midnight, when the boy says ‘I didn’t call,’ in his own voice, and opens his eyes. The other three sleep on. Morrow’s phone has died playing the boy’s playlist.',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'A mother laughing through tears as her teenage son blinks awake in a plastic chair, Morrow sitting back on his heels beside them.',
      },
      {
        id: 'risk',
        label: 'Write down every sentence; the rain is saying something',
        outcome:
          'Four broken promises, and under each chair a small puddle of gold that never spreads. His notes read like a list of debts. In the Marches a court would come to collect them. He doesn’t know who collects here. The mother watches him write her son’s words down and says nothing kind.',
        effects: { evidence: 2, danger: 1, trust: -1 },
        artSubject:
          'Morrow writing in a small notebook beside four sleepers, a coin-sized puddle of gold liquid shining under each plastic chair.',
      },
    ],
    echoes: [
      {
        flag: 'e03:3,7:care',
        text: 'His own sleep appointment is in his phone, three weeks out. Looking at the sleepers, he hopes the clinic is still here to keep it.',
      },
      {
        flag: 'e03:3,7:risk',
        text: 'He read Rowan’s covering note in this corner: working nights on a project he couldn’t put down. The sleepers have the same grey under their eyes.',
      },
    ],
  },
  {
    key: '4,7',
    place: 'Waiting Room Clock',
    title: 'The Clock Runs Home',
    speaker: 'Dennis',
    kind: 'challenge',
    opening:
      'The waiting-room clock is moving again, backwards, the second hand sweeping fast enough to hear. Dennis stands under it in his delivery fleece. ‘It’s four o’clock,’ he says. ‘She hasn’t gone to netball yet. I can stop her.’ Keisha dozes in the chair behind him, her arm in a sling. Half the room is watching the clock now, and people are drifting toward the doors and the gold rain.',
    artSubject:
      'A clinic waiting room under flickering lights: a wall clock with its hands spinning backwards, a broad man in a work fleece staring up at it, a teenage girl dozing behind him with her arm in a sling, patients rising and drifting toward glass doors streaked with gold rain; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, half-rises from a chair.',
    choices: [
      {
        id: 'care',
        label: 'Sit him down beside Keisha and ask about her',
        outcome:
          'He talks about her until he is looking at her instead of the clock. ‘She’s here,’ he says, as if waking. ‘She’s here.’ The people nearest follow his gaze back into the room. Morrow’s hands don’t stop shaking for an hour.',
        effects: { trust: 1, danger: -1, supplies: -1 },
        artSubject:
          'Morrow and the big man side by side on plastic chairs, the man gently touching his sleeping daughter’s good shoulder, the spinning clock above them ignored.',
      },
      {
        id: 'risk',
        label: 'Take the clock down off the wall',
        outcome:
          'It is hot to the touch and heavier than any clock. Morrow lays it face down under a chair, still ticking into the lino. Half the room sits down, blinking. Two people have already walked out into the rain, and the security guard goes after them.',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'Morrow on his knees sliding a large wall clock face down under a plastic chair, a security guard running past toward the rain-gold doors.',
      },
      {
        id: 'doors',
        label: 'Put your back to the doors and hold them shut',
        outcome:
          'Dennis shoves once, then sees whose face he’s shoving and stops. Outside, the rain murmurs against the glass in Rowan’s voice, a promise Morrow never made. He holds the doors until it stops, and nobody leaves.',
        effects: { danger: 1, trust: 1 },
        artSubject:
          'Morrow with his back pressed flat against glass clinic doors, gold rain streaming down the other side, a big man in a fleece stepping back from him.',
      },
    ],
    echoes: [
      {
        flag: 'e03:4,7:care',
        text: 'Dennis knows him: the one who bought him tea. He looks at Morrow as if asking permission to be afraid.',
      },
      {
        flag: 'e03:4,7:risk',
        text: 'Last time Morrow stepped between Dennis and the desk. Dennis gives him a wary nod. Different trouble tonight.',
      },
      {
        flag: 'e03:4,7:clock',
        text: 'Last time Morrow told him the clock had stopped. Dennis turns to him now with something close to accusation: it’s moving.',
      },
    ],
  },
  {
    key: '5,7',
    place: 'Triage Window',
    title: 'Numbers for Nobody',
    speaker: 'Nurse Imani',
    kind: 'memory',
    opening:
      '‘Sixty-three,’ the screen calls in Imani’s recorded voice, and nobody stands. It has called forty numbers tonight; twelve belonged to people in this room. The rest belong to nobody, or to the damp coats left on chairs. Imani calls each one three times, as the rule says, while a boy by the radiator wheezes and waits. ‘I don’t skip people,’ she tells Morrow. ‘I don’t know yet what these are.’',
    artSubject:
      'A clinic triage window under fluorescent light that flickers gold: a triage nurse in navy scrubs with braided hair stands at a doorway with a clipboard while a queue screen glows above empty chairs draped with damp coats; a boy wheezes by a radiator; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, grips a paper ticket.',
    choices: [
      {
        id: 'care',
        label: 'Help her triage by hand: only the people actually here',
        outcome:
          'Imani pulls the screen’s plug and they go seat by seat: airway, breathing, circulation. The boy is through the door in four minutes. She writes every unanswered number on her forearm in biro. ‘So they’re not nobody,’ she says, and gets on.',
        effects: { trust: 2, supplies: -1, danger: -1 },
        artSubject:
          'The triage nurse kneeling by a wheezing boy with a stethoscope, a column of biro numbers written up her forearm, Morrow holding the clipboard beside her.',
      },
      {
        id: 'risk',
        label: 'Answer the next number and walk through the door it opens',
        outcome:
          'Beyond it is the clinic corridor, but the floor is gritty with sand and coats drip on every hook. Far down, water is talking. Imani hauls him back by the cardigan before the door shuts. ‘Not tonight, forty-seven.’ The boy waited three minutes longer.',
        effects: { evidence: 2, danger: 2, trust: -1 },
        artSubject:
          'A clinic corridor stretching into dimness, sand on the lino and wet coats hanging from every hook; the nurse’s hand gripping the back of Morrow’s cardigan in the doorway.',
      },
    ],
    echoes: [
      {
        flag: 'e03:5,7:care',
        text: 'Imani saw him give his ticket away once. She waves him behind the window as if he works here.',
      },
      {
        flag: 'e03:5,7:risk',
        text: 'Imani remembers him asking her to bend a rule. Tonight she watches what he does with this one.',
      },
      {
        flag: 'e04:2,1:care',
        text: 'On the platform this morning he helped Mara count only who was there. He knows this work, and how little it feels like enough.',
      },
      {
        flag: 'e04:2,1:risk',
        text: 'He has ridden a train full of coats today. The coats on these chairs hang with the same patient weight.',
      },
    ],
  },
  {
    key: '6,7',
    place: 'Ambulance Bay',
    title: 'The Ambulance That Came Back Empty',
    speaker: 'Nurse Imani',
    kind: 'companion',
    opening:
      'The ambulance bay’s hard light is flickering gold. An ambulance stands with its doors open and its crew on the kerb, white-faced: they loaded a man on the bridge, and at the clinic the stretcher held only his coat, belted, still warm. Imani stands over it with cold noodles she has forgotten to eat. She has eight minutes of break left.',
    artSubject:
      'Night at a clinic ambulance bay under harsh light flickering gold: an ambulance with its back doors open, a stretcher inside holding only a belted raincoat, two paramedics sitting on the kerb; a triage nurse in navy scrubs and a rain jacket holds a forgotten tub of noodles; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, at the staff door.',
    choices: [
      {
        id: 'care',
        label: 'Stand with her and say nothing until she’s ready',
        outcome:
          'Morrow hands his biscuits to the crew. After five minutes Imani says the man’s name aloud, twice, and writes him on the incident sheet as missing, not deceased. ‘Words matter on paper,’ she says. She eats three noodles and goes back in.',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Morrow and the nurse standing side by side in the wet ambulance bay, the nurse writing on a clipboard, two paramedics sharing a packet of biscuits on the kerb.',
      },
      {
        id: 'risk',
        label: 'Search the coat’s pockets with her for where he went',
        outcome:
          'A season ticket, a child’s hair bobble, and a sodden tide timetable with tonight’s high water ringed in biro: 23:47, Floodlit Fountain. Imani looks at it a long time. ‘That’s not a bus stop,’ she says, and her break is gone.',
        effects: { evidence: 2, trust: -1, danger: 1 },
        artSubject:
          'The nurse holding a soaked paper timetable under the ambulance bay light, Morrow beside her with an empty coat over his arm, rain gleaming gold behind them.',
      },
    ],
    echoes: [
      {
        flag: 'e03:6,7:care',
        text: 'She remembers his biscuits. She is holding her hand out for one before he has found the packet.',
      },
      {
        flag: 'e03:6,7:risk',
        text: 'He once asked her how she decides who goes first. Tonight she looks like she is asking herself.',
      },
    ],
  },
  {
    key: '7,7',
    place: 'Corridor Drinks Machine',
    title: 'The Hearth Wants Another Coin',
    speaker: 'Morrow',
    kind: 'merchant',
    opening:
      'The corridor drinks machine still hums like a captive hearth, but its screen no longer says PLEASE INSERT COINS. It says PLEASE INSERT. Coins drop straight through and roll out of the return slot, warm. A porter tells Morrow it gave his mate a hot chocolate for saying sorry to it. ‘Didn’t say what for,’ he adds. ‘Wouldn’t.’',
    artSubject:
      'A long clinic corridor at night, a glowing hot-drinks vending machine with a blank, slightly too-bright screen, coins lying in its return tray; a porter in green walks past looking back at it; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, stands close to it with an open palm.',
    choices: [
      {
        id: 'care',
        label:
          'Say sorry for something you really did, and carry the teas to the desk',
        outcome:
          'Morrow apologises for the missed handoff with Mara. The machine pours four perfectly ordinary teas, then plays his apology back to the empty corridor in a flat recorded voice. Imani drinks hers without asking what it cost.',
        effects: { supplies: 1, trust: 1, danger: 1 },
        artSubject:
          'Morrow carrying a cardboard tray of four steaming paper cups down a clinic corridor, the vending machine’s screen glowing behind him.',
      },
      {
        id: 'risk',
        label: 'Thump it where the porter used to',
        outcome:
          'It coughs up one cup of warm seawater and a heavy coin stamped with two crowned faces, back to back, from no country Morrow knows. He pockets the coin and tips the cup into a pot plant, which he regrets at once.',
        effects: { evidence: 1, supplies: -1 },
        artSubject:
          'Close view of Morrow’s palm holding a heavy old coin stamped with two identical crowned faces back to back, a paper cup of cloudy water in his other hand.',
      },
      {
        id: 'borrowed-sorry',
        label: 'Apologise for something Rowan did, in Rowan’s voice',
        outcome:
          'He says sorry for the letter to Jun that never got posted. The machine gives him two hot chocolates and its screen reads THANK YOU ROWAN until he walks away. The drinks are sweet. He can’t finish his.',
        effects: { supplies: 2, trust: -1 },
        artSubject:
          'Morrow walking away down a corridor holding two paper cups, the vending machine screen behind him glowing a too-warm amber, his face turned away from it.',
      },
    ],
    echoes: [
      {
        flag: 'e03:7,7:risk',
        text: 'He killed this machine once with a thump. It has recovered, and it seems to have new ideas about payment.',
      },
      {
        flag: 'e03:7,7:care',
        text: 'Mrs Ferreira is back in the same row of chairs, waiting on her husband again. She lifts a hand to him like an old friend.',
      },
    ],
  },
  {
    key: '8,7',
    place: 'Children’s Corner',
    title: 'The Page Has Changed',
    speaker: 'Morrow',
    kind: 'treasure',
    instant: true,
    opening:
      'Tilly’s waiting-room page is still on the low table, but the drawing has changed. The fountain’s mouth is open now, and blue crayon water runs out of it across the park, over the grey snake-road, right up to the clinic box at the edge of the paper. The blue is damp under Morrow’s thumb. When he dares to taste it, it is salt.',
    artSubject:
      'A child’s crayon map on a low plastic table in a clinic play corner: a fountain drawn as a wide open mouth pouring blue crayon water across a green park and a grey snake-road toward a box with a red cross; the blue crayon glistens wet; Morrow’s hand, in a grey cardigan sleeve, touches it.',
    choices: [
      {
        id: 'notice',
        label: 'Fold the page into your pocket',
        outcome:
          'He folds it blue side in, as if that might hold the water. In the fountain, very small, Tilly has drawn two figures sharing one face. Morrow doesn’t know who they are. Tilly, apparently, does.',
        effects: { evidence: 1, supplies: 1 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, folding a crayon drawing into his pocket in a clinic play corner, small chairs and a toy box at his feet.',
      },
    ],
    echoes: [
      {
        flag: 'e04:8,6:care',
        text: 'Tilly is somewhere safe with her map, because he walked her there by it. This page is the only part of it he has.',
      },
      {
        flag: 'e04:8,6:risk',
        text: 'Tilly’s real map is in his other pocket, borrowed; she is home with Sal. Side by side, the two drawings agree, which is worse.',
      },
    ],
  },
  {
    key: '1,8',
    place: 'Park Gatehouse',
    title: 'Coats Under the Eaves',
    speaker: 'Morrow',
    kind: 'treasure',
    instant: true,
    opening:
      'The gatehouse lost-property box has filled since the rain came. A dozen coats are folded on it and under it by someone who gave up waiting for owners, all wet through and stiff with salt. One still has a commuter’s lanyard round the collar. In every pocket Morrow checks there is the same leaflet, a timetable he has never seen printed before.',
    artSubject:
      'A small brick park gatehouse at night, gold rain dripping off its eaves onto a wooden lost-property box heaped with neatly folded wet coats, a lanyard hanging from one collar; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, holds a small blue leaflet up to the light, park floodlights glowing beyond the railings.',
    choices: [
      {
        id: 'notice',
        label: 'Take a timetable and the torch from the box',
        outcome:
          'City Transit, Night Tides, it says, in the right font and the right blue. One line is ringed in biro: High water, Floodlit Fountain, 23:47. It is half past ten. Timetables, at least, Morrow understands. They are oaths with numbers.',
        effects: { evidence: 1, supplies: 1 },
        artSubject:
          'Close view of a transit-blue tide timetable in Morrow’s hand, one line ringed in biro, a small torch lit in his other hand, wet coats blurred behind.',
      },
    ],
    echoes: [
      {
        flag: 'e04:2,1:risk',
        text: 'He has seen coats folded like this before, today, on the seats of the train that came back.',
      },
      {
        flag: 'e04:2,1:care',
        text: 'Mara counted only who was there. Morrow counts the coats anyway, twelve, and makes himself stop.',
      },
    ],
  },
  {
    key: '2,8',
    place: 'Park Notice Board',
    title: 'One Sign Still Honest',
    speaker: 'Morrow',
    kind: 'puzzle',
    opening:
      'Gold rain has been at the notice board. The north gate’s sign reads: THE SOUTH GATE IS OPEN. The south gate’s: THIS GATE IS LOCKED. The east gate’s: THE NORTH GATE IS LOCKED. Under them Walt has chalked: ONE GATE OPEN TONIGHT. ONE SIGN STILL HONEST. Past the railings the floodlights hum over an empty pitch, and somewhere a gate bangs in no wind.',
    artSubject:
      'A rain-streaked park notice board under a street lamp, three pinned sheets glittering with gold droplets and a line of chalk on the frame below them, railings running into the dark, floodlights over an empty football pitch in the distance; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, reads with a torch.',
    choices: [
      {
        id: 'care',
        label: 'Go to the east gate; its sign only talks about the north',
        outcome:
          'Locked. Beyond it, on the floodlit pitch, two lines of orange and blue bibs lie on the grass where two teams should be standing. Morrow doesn’t wait to see if they get up. He walks round to the north gate, fast.',
        effects: { supplies: -1 },
        artSubject:
          'A locked iron gate beside a floodlit football pitch where two neat rows of empty orange and blue bibs lie on the grass; Morrow backing away from the bars.',
      },
      {
        id: 'risk',
        label: 'Go to the south gate, as the north gate’s sign says',
        outcome:
          'Chained, as its own sign said. At its foot, water a hand deep stands on the path and leans uphill toward the fountain, as if the ground had been turned over. Morrow backs off and walks the railings north, cold to the knees.',
        effects: { danger: 1, supplies: -1 },
        artSubject:
          'A chained park gate at the bottom of a slope, a sheet of dark water on the path somehow sloping uphill away from it; Morrow standing in it to his ankles, torch beam shaking.',
      },
      {
        id: 'north-gate',
        label: 'Go to the north gate',
        outcome:
          'It swings at a touch, the padlock hanging open like a mouth that has said its piece. From the hilltop Morrow can see the whole park, and a darker shape on the grass below the pond, moving uphill against the slope. He is glad he didn’t come in from underneath.',
        effects: { evidence: 2, danger: -1 },
        artSubject:
          'An open iron gate at the top of a hill, the whole floodlit park spread below, a long dark shadow of water creeping uphill across the grass from a pond; Morrow stepping through.',
      },
    ],
    echoes: [
      {
        flag: 'e03:2,8:east-gate',
        text: 'Last time the floodlights kept their promise to football and the east gate stood open. Tonight the lights are on and nobody is playing.',
      },
      {
        flag: 'e03:2,8:risk',
        text: 'Last time he climbed the chained south gate and landed in a flowerbed. From here he can see that the flowerbed is under water.',
      },
    ],
  },
  {
    key: '3,8',
    place: 'Plane Tree Bench',
    title: 'Yesterday’s Caller',
    speaker: 'Morrow',
    kind: 'memory',
    opening:
      'Morrow’s phone rings on the plane tree bench. The screen says Jun, and the call log says the call came in yesterday at 22:31. ‘Hey,’ says Jun’s warm, impatient voice. ‘I’m not ringing to fight. I’m on the late train home tomorrow, so if you want to talk, talk tonight.’ Every train that came back today came back full of coats.',
    artSubject:
      'A wooden park bench under a plane tree at the edge of floodlight, gold drops falling from the wet leaves; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, sits rigid with a ringing phone held to his ear, its screen glowing, a stalled train’s lights visible on a distant embankment.',
    choices: [
      {
        id: 'care',
        label:
          'Tell him not to take tomorrow’s late train, whatever it sounds like',
        outcome:
          '‘That’s mad,’ Jun says, then, quieter: ‘You sound like you did in March.’ He says he’ll get a cab. The line ends at the exact second yesterday did. Morrow sits with the dead phone, unable to know whether a warning can travel backwards.',
        effects: { trust: 1, danger: 1 },
        artSubject:
          'Morrow on the bench bent forward over the phone with both hands, eyes shut, gold drops on his shoulders, the screen just gone dark.',
      },
      {
        id: 'risk',
        label: 'Ask him what you promised him, and listen',
        outcome:
          '‘You said you’d tell me what you were working on. Thursday, you said. In person.’ Jun waits. A gold drop lands on Morrow’s wrist and says Thursday in Rowan’s voice. The line goes dead before he can answer.',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'Close view of Morrow’s wrist with a single glowing gold raindrop on it, the phone held loosely below, plane leaves dripping above.',
      },
      {
        id: 'hang-up',
        label: 'Hang up and text today’s Jun instead',
        outcome:
          'The text sits on Delivered. No reply. Morrow tells himself it’s late, people sleep, delivery is a kind of answer. The phone stays warm in his hand like something still deciding.',
        effects: { danger: -1, trust: -1 },
        artSubject:
          'Morrow on the bench staring at a phone screen showing a single sent message, his thumb resting over it, the floodlit park empty behind him.',
      },
    ],
    echoes: [
      {
        flag: 'e03:3,8:care',
        text: 'He left Jun one true voicemail on this bench. Tonight the phone seems to be answering it.',
      },
      {
        flag: 'e03:3,8:risk',
        text: 'He played Jun’s old voicemails here, three times over. Hearing that voice live is worse.',
      },
      {
        flag: 'e03:3,8:pocket',
        text: 'Last time he put the phone away and watched the football. Tonight the phone didn’t ask.',
      },
    ],
  },
  {
    key: '4,8',
    place: 'Unlit Pond Path',
    title: 'The Shadow That Walks Uphill',
    speaker: 'Priya',
    kind: 'monster',
    opening:
      'The pond has left its bed. A sheet of black water, ankle-deep and a lane wide, is moving up the unlit path toward the fountain, against the slope, carrying leaves and a park bin on its back. Biscuit stands in the middle of it, barking at nothing, too heavy and too frightened to move. Priya is at the edge with the lead. ‘He won’t come,’ she says. ‘It pulls.’',
    artSubject:
      'A dark park path at night with a broad sheet of black water flowing uphill across it, leaves and a tipped bin riding the current, a huge shaggy dog braced and barking in the middle; a woman in a head torch holds out a lead at the edge; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, stops at the waterline.',
    choices: [
      {
        id: 'care',
        label: 'Stand at the edge, hands low, and call him out to you',
        outcome:
          'It takes Morrow’s voice and Priya’s together, and half a sausage roll. Biscuit lunges out, the water sucking at his paws, then letting him go. Morrow’s shoes are full of seawater. Priya hugs the dog, then Morrow, then the dog.',
        effects: { trust: 1, supplies: -1, danger: -1 },
        artSubject:
          'A muddy giant dog bounding out of a sheet of dark water toward Morrow, who crouches with a sausage roll held out, the woman in the head torch reaching for the collar.',
      },
      {
        id: 'risk',
        label: 'Wade in and haul him out by the collar',
        outcome:
          'The water is colder than the night and pulls uphill, hard. Far down in it two voices are singing the same tune a beat apart, in a language Morrow nearly knows. He drags Biscuit clear and lies on the grass shaking while Priya swears at him gratefully.',
        effects: { trust: 1, danger: 2, evidence: 1 },
        artSubject:
          'Morrow knee-deep in black water flowing uphill, both hands in a huge dog’s collar, hauling it toward a woman in a head torch on the bank.',
      },
      {
        id: 'follow',
        label: 'Leave Biscuit to Priya and follow the water uphill',
        outcome:
          'Priya gets him out herself with a long branch and his name said very calmly. Morrow follows the shadow and watches it pour, without a sound, into the drain of the dry fountain. When he looks back, Priya doesn’t wave.',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'Morrow walking uphill beside a creeping sheet of dark water across a floodlit lawn toward a stone fountain; far behind, a woman leads a dripping dog away.',
      },
    ],
    echoes: [
      {
        flag: 'e03:4,8:care',
        text: 'Biscuit knows him: the man who sat in the puddle. Even now, the dog’s tail moves once.',
      },
      {
        flag: 'e03:4,8:risk',
        text: 'Biscuit knows him: the man who ran. The dog looks at him as if this is the game again, and the water is winning.',
      },
    ],
  },
  {
    key: '5,8',
    place: 'Pavilion Steps',
    title: 'Walt Keeps the Count',
    speaker: 'Walt',
    kind: 'companion',
    opening:
      'Walt is on the pavilion steps in his hi-vis with a clipboard, ticking off everyone he has walked out of the park tonight. Thirty-one names. ‘Someone has to,’ he says. ‘There’s a lad asleep by the bandstand, and a couple won’t leave the rose garden. And the maintenance yard behind the depot’s marked empty on every map, but I clean there Thursdays. Someone hangs washing out.’',
    artSubject:
      'The steps of an old park pavilion under a floodlight with gold rain falling through it, an older cleaner in a hi-vis jacket and woolly hat ticking a clipboard with a stub of pencil, a cart of brooms beside him; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, stands at the foot of the steps.',
    choices: [
      {
        id: 'care',
        label: 'Take a torch and help him walk the last of them out',
        outcome:
          'They find the lad, the couple and a man looking for his coat. Walt walks each of them to the north gate himself. On the way back he says, ‘You’re more use than you look,’ and ticks Morrow off last, as if he’d been lost too.',
        effects: { trust: 2, supplies: -1, danger: -1 },
        artSubject:
          'Morrow and the cleaner walking a sleepy young man and an elderly couple toward an open park gate, torch beams crossing on the wet path.',
      },
      {
        id: 'risk',
        label: 'Ask him what runs underneath the fountain',
        outcome:
          '‘Old flood sluice. Gate under the bowl lets storm water down to the old line, and a second channel runs off to the depot yard.’ Walt looks at the dark middle of the park. ‘Gate’s been shut since before my time. Tonight I can hear it working.’',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'The cleaner pointing with his pencil toward the dark centre of the park, Morrow following his gaze, a faint green glow rising where the fountain should be.',
      },
    ],
    echoes: [
      {
        flag: 'e03:5,8:care',
        text: 'Walt holds out the spare torch without looking up. They did this round together once.',
      },
      {
        flag: 'e03:5,8:risk',
        text: 'Walt once told him Rowan always sat facing the fountain. He doesn’t say it again. He doesn’t have to.',
      },
      {
        flag: 'SB-35:return',
        text: 'Walt has heard Rowan’s archive was sealed for Rowan to come back to. He seems to approve of someone leaving something alone.',
      },
      {
        flag: 'SB-35:finish',
        text: 'Walt has heard the study is going ahead under Rowan’s name. He calls Morrow Rowan, and watches him answer to it.',
      },
      {
        flag: 'SB-35:confess',
        text: 'Walt has heard about the account Morrow filed. He hasn’t read it. He doesn’t call him Rowan tonight, carefully.',
      },
    ],
  },
  {
    key: '6,8',
    place: 'Bandstand',
    title: 'The Leaves Turn First',
    speaker: 'Morrow',
    kind: 'memory',
    instant: true,
    opening:
      'The bandstand boards are scattered with wet plane leaves, as before. Morrow crouches and holds his palm over one, the old way, the wind’s name held behind his teeth and not spoken. Before his hand is even still, every leaf on the floor turns, with a small dry sound like a crowd shifting, until all of them point the same way: toward the fountain.',
    artSubject:
      'An empty Victorian bandstand at night, gold rain slanting through floodlight, dozens of wet plane leaves on its boards all turned to point the same direction; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, crouches with one palm held over them, frozen.',
    choices: [
      {
        id: 'notice',
        label: 'Look where they point',
        outcome:
          'Past the railings, the dark middle of the park has a faint gold rim, like a coin at the bottom of a puddle. Morrow takes his hand back. He didn’t say a word. He is no longer sure that matters, or that it ever did.',
        effects: { evidence: 1, danger: 1 },
        artSubject:
          'View from the bandstand rail across a dark park toward a faint gold-rimmed glow where a fountain sits, Morrow’s silhouette gripping the railing.',
      },
    ],
    echoes: [
      {
        flag: 'e03:8,8:risk',
        text: 'He spoke the working at that fountain once, into the rain. He has been waiting all day for the city to send him the bill.',
      },
      {
        flag: 'e03:8,8:care',
        text: 'He never spoke the working; he folded it away and caught the early train. So he can’t say whose wish the leaves are answering.',
      },
    ],
  },
  {
    key: '7,8',
    place: 'Fountain Lawn',
    title: 'Where the Floodlights Stop',
    speaker: 'Morrow',
    kind: 'memory',
    instant: true,
    opening:
      'The lawn is soaked to the floodlight’s edge, and it is seawater: Morrow can smell kelp and diesel. The black shadow from the pond slides past his feet into the dark where the fountain is. From that dark comes a sound like a train braking underground, then voices, many, far down, and over them two women singing the same tune a beat apart.',
    artSubject:
      'A wide wet lawn at night under gold rain, the white edge of floodlight stopping short of a stone fountain glowing faint green from inside, a dark sheet of water sliding across the grass toward it; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, stands at the lit edge, listening.',
    choices: [
      {
        id: 'notice',
        label: 'Step past the edge of the light',
        outcome:
          'The floodlight stops at his heels, as it always has. Ahead the fountain bowl is full and lit from below, a cold green. His phone says 23:31. Whatever is coming keeps a timetable, and Morrow can feel it the way he could feel a court about to rise.',
        effects: { danger: 1 },
        artSubject:
          'Morrow stepping off the floodlit lawn into darkness, his shadow long in front of him, a brimming fountain glowing green ahead.',
      },
    ],
    echoes: [
      {
        flag: 'e04:5,7:care',
        text: 'He thinks of Imani’s forearm, written over with numbers nobody answered. Some of those voices must be on it.',
      },
      {
        flag: 'e04:5,7:risk',
        text: 'He has already walked one corridor of dripping coats tonight. The voices below sound like its far end.',
      },
    ],
  },
  {
    key: '8,8',
    place: 'Floodlit Fountain',
    title: 'The Tide Gate',
    speaker: 'Scylla and Char',
    kind: 'memory',
    opening:
      'The fountain is full of sea. Under its grate a stalled train’s lit windows show coatless commuters, palms to the glass. In the bowl two women with one face, Scylla crowned, Char in black lace, both mermaid-tailed, hold a cracking anchor chain against the surge. ‘Open the gate and they climb out, but the whole sea lands on me,’ says Char. ‘Seal it, she lives, they stay below,’ says Scylla. ‘Or turn the surge down the depot channel. That yard is meant to be empty.’',
    artSubject:
      'A drained stone fountain in a night park now brimming with seawater lit cold green from below, gold rain falling through floodlight; Scylla, a stout broad-shouldered woman with light brown skin, a chestnut braid and a small silver crown, and Char, her identical twin with deep brown skin, a high black braid, black lace, silver chains and black lipstick, both with blue-green mermaid tails, brace a rusted cracking anchor chain against the surge; through the grate glow the lit windows of a stalled train with coatless commuters; Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, kneels at the rim.',
    choices: [],
    echoes: [
      {
        flag: 'e03:8,8:risk',
        text: 'He spoke the working here once, into the rain. Neither twin asks whether this door is his. He couldn’t answer if they did.',
      },
      {
        flag: 'e03:8,8:care',
        text: 'He never spoke the working here. Someone else’s wish opened this door, and Scylla looks at him as if he might know whose.',
      },
      {
        flag: 'e04:8,6:risk',
        text: 'Tilly’s map is in his pocket. On it, beside the depot yard, is a tiny house drawn in pencil and half rubbed out, as if she wasn’t sure.',
      },
      {
        flag: 'e04:8,6:care',
        text: 'Tilly is safe, with her map. He has only the council’s, which has been wrong about everything tonight, and it says the yard is empty.',
      },
      {
        flag: 'e04:2,1:care',
        text: 'None of the faces at the train window are on Mara’s roll call of who came back. They are the rest of it.',
      },
      {
        flag: 'e04:2,1:risk',
        text: 'He rode the train of coats this morning. The people at the window are the ones the coats belonged to.',
      },
      {
        flag: 'SB-35:confess',
        text: 'Under the Annex, his plain account of the trade sits filed and unbelieved. Here, at last, are two people who would believe every word.',
      },
      {
        flag: 'SB-35:finish',
        text: 'He finished Rowan’s study under Rowan’s name: night after night of data. None of it says what to do on a night like this.',
      },
      {
        flag: 'SB-35:return',
        text: 'Rowan’s work lies sealed under the Annex, waiting for him to come back. The sea is not waiting for anyone.',
      },
    ],
  },
]
