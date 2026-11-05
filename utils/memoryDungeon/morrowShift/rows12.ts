import type { MorrowShiftSite } from './types'

export const MORROW_SHIFT_ROWS_1_2: readonly MorrowShiftSite[] = [
  {
    key: '1,1',
    place: 'Concourse Departures Board',
    title: 'Another Person’s Pockets',
    speaker: 'Morrow',
    kind: 'treasure',
    instant: true,
    opening:
      'Station Concourse, 7:40, rain drumming on the glass roof. Morrow stands under the departures board in another person’s cardigan, holding another person’s umbrella, with another person’s pockets full of small, unexplained weight.',
    artSubject:
      'A busy rain-streaked railway concourse at early morning under a glowing departures board, an androgynous adult in their thirties with short dark hair and a grey cardigan standing still in the hurrying crowd with one hand in a cardigan pocket, grey daylight through a glass roof',
    choices: [
      {
        id: 'notice',
        label: 'Turn out the cardigan pockets',
        outcome:
          'A transit pass with his new face on it, valid until yesterday. A receipt for two coffees. A pencil stub chewed at one end. A cough sweet, which he eats, as a precaution against whatever this place has instead of curses.',
        effects: { supplies: 1 },
        artSubject:
          'Close view of open hands holding a transit card, a crumpled coffee receipt, a chewed pencil stub and a wrapped sweet, cardigan sleeves, wet concourse floor blurred below',
      },
    ],
  },
  {
    key: '2,1',
    place: 'Platform 4 Bench',
    title: 'Mara on the Platform',
    speaker: 'Mara',
    kind: 'companion',
    opening:
      'Rain drips through a gap in the platform 4 canopy. A woman with a lanyard and a ring binder cuts through the crowd and says the name Rowan like an invoice. ‘You missed handoff. I stood in the cold room till nine waiting for your numbers.’ This is Mara. Morrow has never seen her in his life; she has known this face for years.',
    artSubject:
      'A narrow rainy railway platform under a dripping canopy, a sharp-eyed woman in her thirties with a lanyard and ring binder confronting an androgynous adult in their thirties with short dark hair and a grey cardigan, commuters glancing past, cold morning light',
    choices: [
      {
        id: 'care',
        label: 'Admit you don’t remember her',
        outcome:
          'Mara’s annoyance stalls into something worse: worry. ‘Not even me?’ She writes her name on the back of his coffee receipt in exact block capitals and walks him onto the Annex train by the sleeve. She will mention this to Dr Sen. Kindly. Immediately.',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'On a rainy platform a woman holds a coffee receipt flat against her ring binder and writes on it while an androgynous adult in their thirties with short dark hair and a grey cardigan watches with an unguarded, lost expression, train doors open behind them',
      },
      {
        id: 'risk',
        label: 'Bluff that you remember everything',
        outcome:
          '‘Of course. Handoff. The cold room.’ He hands her own words back with a courtier’s conviction, and she relaxes, which is worse. She rattles off everything the handoff needed, then expects the report by noon from someone who doesn’t know where the cold room is.',
        effects: { evidence: 1, danger: 1, trust: -1 },
        artSubject:
          'an androgynous adult in their thirties with short dark hair and a grey cardigan nodding with a confident, practiced smile on a wet platform while a woman with a lanyard counts points on her fingers, relieved, the departures board glowing overhead',
      },
    ],
  },
  {
    key: '3,1',
    place: 'Concourse Platform Stairs',
    title: 'Three Oaths on the Board',
    speaker: 'Morrow',
    kind: 'puzzle',
    opening:
      'The departures board offers three trains toward Annex Road: the 8:16 from platform 3, the 8:18 express from platform 4, the 8:24 stopping service from platform 6. Taped over the platform 3 sign is a paper notice: closed for repairs. The announcer, bored and clear, adds that the express does not call at Annex Road. The board swore three oaths. The station has quietly broken two.',
    artSubject:
      'an androgynous adult in their thirties with short dark hair and a grey cardigan at the foot of a wide station staircase staring up at a departures board, one platform entrance criss-crossed with hazard tape, a station announcer’s booth glowing in the background, rain on the windows',
    choices: [
      {
        id: 'care',
        label: 'Wait for the 8:16 on platform 3, as the board swears',
        outcome:
          'Platform 3 is hazard tape, a dust sheet and a man with a drill, who points, not unkindly, toward platform 6. Morrow catches the 8:24 anyway and arrives late with plaster dust on his cardigan.',
        effects: { trust: -1 },
        artSubject:
          'A closed platform with hazard tape and a dust sheet, a workman in a hard hat pointing the way past an androgynous adult in their thirties with short dark hair and a grey cardigan, whose cardigan shoulder is dusted white',
      },
      {
        id: 'risk',
        label: 'Sprint for the 8:18 express',
        outcome:
          'The express is magnificent and does not stop. Morrow watches Annex Road blur past, gets off at the harbour, and pays for a return. Speed, he notes, is a different promise from arrival.',
        effects: { supplies: -1 },
        artSubject:
          'an androgynous adult in their thirties with short dark hair and a grey cardigan pressed to the window of a fast train as a small rainy station streaks by outside, other passengers reading phones, motion-blurred lights',
      },
      {
        id: 'platform-six',
        label: 'Take the 8:24 stopping service from platform 6',
        outcome:
          'The slow train stops everywhere, including a tiny halt where an old man boards with a tray of seedlings, and including Annex Road at 8:41. Morrow arrives on time and files away the word ‘stopping’ as a kind of mercy.',
        effects: { evidence: 1 },
        artSubject:
          'Inside a slow commuter train, an old man settling a tray of seedlings on his knees beside an androgynous adult in their thirties with short dark hair and a grey cardigan, rain-beaded windows, soft grey morning light',
      },
    ],
  },
  {
    key: '4,1',
    place: 'Platform 5 Clock',
    title: 'The 8:02 Breaks Its Word',
    speaker: 'Bernadette',
    kind: 'memory',
    opening:
      'The 8:02 does not come at 8:02. Morrow, raised where a broken oath can end a bloodline, waits for someone to be punished. Nobody is. Beside him a man in a wet suit clicks a scratched stopwatch, sighs, and opens a delay-refund form as if collecting a small, dull tithe. Further down, the platform attendant, Bernadette, is fielding the same question for the fortieth time.',
    artSubject:
      'A rainy platform under a large station clock, a commuter in a soaked suit holding an old stopwatch and a phone, an androgynous adult in their thirties with short dark hair and a grey cardigan staring at the clock in betrayed disbelief, a weary platform attendant in high-vis in the background',
    choices: [
      {
        id: 'care',
        label: 'Ask the man how to claim your minutes back',
        outcome:
          'He shows Morrow the form: three fields and a checkbox. ‘They owe you,’ he says. ‘Not much. It’s the principle.’ Morrow, who understands principles, files for four minutes and feels unexpectedly civic.',
        effects: { supplies: 1, trust: 1 },
        artSubject:
          'A commuter in a wet suit leaning in to show an androgynous adult in their thirties with short dark hair and a grey cardigan a form on a phone screen, both sheltering under the same dripping canopy edge, the stopwatch dangling from the man’s wrist',
      },
      {
        id: 'risk',
        label: 'Demand that the attendant name the oath-breaker',
        outcome:
          'Bernadette, two hours into a ten-hour shift, names it: a frozen relay at Mill Lane and a man up a ladder in the rain fixing it. No villain, only weather and wire. The queue behind Morrow has opinions, but he leaves knowing how this city actually fails.',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'an androgynous adult in their thirties with short dark hair and a grey cardigan standing very upright before a tired platform attendant in high-vis who explains with an open hand toward the tracks, a line of impatient commuters with umbrellas behind them',
      },
    ],
  },
  {
    key: '5,1',
    place: 'Lost Property Window',
    title: 'The Coat with Your Name In It',
    speaker: 'Mr Osei',
    kind: 'treasure',
    opening:
      'Behind the lost-property glass, between forty umbrellas and a single ice skate, hangs a green wool coat with the name Rowan inked on the label. Mr Osei has kept it six weeks. ‘Bit of ID,’ he says, ‘and tell me what’s in the pockets. That’s the rule.’ Morrow has the ID. He has no idea what’s in the pockets.',
    artSubject:
      'A small lost-property counter behind glass crowded with umbrellas and one ice skate, an older clerk with reading glasses holding up a green wool coat, an androgynous adult in their thirties with short dark hair and a grey cardigan at the window with an identity card, rain-light from the concourse',
    choices: [
      {
        id: 'care',
        label: 'Admit you don’t know what’s in the pockets',
        outcome:
          'Mr Osei studies him for a long moment, then reads the inventory aloud like a kindness: gloves, a library card, a folded note in pencil, ‘ask Mara re: B key log’. He hands over the coat and keeps his questions to himself.',
        effects: { supplies: 1, evidence: 1 },
        artSubject:
          'An older clerk reading from a paper inventory slip while an androgynous adult in their thirties with short dark hair and a grey cardigan listens closely, a folded pencil note and a pair of gloves laid on the counter between them',
      },
      {
        id: 'risk',
        label: 'Let the face on the ID do the talking',
        outcome:
          'The face on the card is the face at the window, and Mr Osei waives the pocket rule with a shrug. Morrow walks out warm, with gloves and a folded twenty in the lining, and never learns there was a note.',
        effects: { supplies: 2 },
        artSubject:
          'an androgynous adult in their thirties with short dark hair and a grey cardigan shrugging on a green wool coat outside the lost-property window, finding a folded banknote in the lining, the clerk already turning back to his umbrellas',
      },
    ],
  },
  {
    key: '6,1',
    place: 'Annex Exit Barriers',
    title: 'The Warden of Gate Six',
    speaker: 'Gloria Mensah',
    kind: 'monster',
    opening:
      'At the Annex exit barriers, Morrow sees a bridge-warden. Everyone else sees Gloria Mensah, ticket inspector, navy cap, who has heard every excuse this line has produced. She taps his pass on her handheld: it lapsed at midnight. ‘Penalty fare, or I take your details.’ In the Marches, tolls were paid in names. Here she wants a card number, which feels almost worse.',
    artSubject:
      'A ticket inspector in a navy cap and uniform standing squarely at a row of exit gates with a handheld reader, an androgynous adult in their thirties with short dark hair and a grey cardigan facing her with a transit card held out like a surrendered token, commuters streaming through the other gates, rain at the station mouth',
    choices: [
      {
        id: 'care',
        label: 'Pay the penalty and ask how to renew',
        outcome:
          'Gloria takes the fare, then, because he asked, walks him to the machine and taps the monthly option twice so he’ll remember. An expensive lesson. She makes sure it is a lesson and not only a fine.',
        effects: { supplies: -2, trust: 1 },
        artSubject:
          'A ticket inspector pointing at a ticket machine screen with one gloved finger while an androgynous adult in their thirties with short dark hair and a grey cardigan watches attentively, wet coats passing behind them',
      },
      {
        id: 'risk',
        label: 'Give her the name Rowan and address',
        outcome:
          'She writes it down: name, flat number, Riverside. A penalty letter will come addressed to Rowan, and Morrow will be the one who opens it. He keeps his money and spends a little more of the name.',
        effects: { danger: 1, trust: -1 },
        artSubject:
          'A ticket inspector writing on a penalty notice pad as an androgynous adult in their thirties with short dark hair and a grey cardigan spells something out with a careful, guarded face, the exit gates and rain beyond',
      },
    ],
    echoes: [
      {
        flag: 'e03:1,1:notice',
        text: 'Morrow already knows the pass ran out yesterday. He has had the whole concourse to rehearse this.',
      },
    ],
  },
  {
    key: '7,1',
    place: 'Concourse Coffee Cart',
    title: 'The Standing Order',
    speaker: 'Ana',
    kind: 'merchant',
    opening:
      'Ana’s coffee cart steams under the departures board. She starts pouring before Morrow reaches the counter: two flat whites, one oat, one not. ‘Usual,’ she says, and holds out the card reader. It seems Rowan bought this exact pair every weekday for a year, and Morrow has no idea who drinks the second.',
    artSubject:
      'A small steaming coffee cart under a station departures board, a cheerful barista in a knitted hat setting two paper cups side by side, an androgynous adult in their thirties with short dark hair and a grey cardigan hesitating with a card in hand, rain beyond the concourse doors',
    choices: [
      {
        id: 'care',
        label: 'Pay for both and carry the second to work',
        outcome:
          'He carries the second cup through the rain like a hostage he means to return unharmed. At the Annex, Mara takes it without looking up, which, he gathers, is the point.',
        effects: { supplies: -1, trust: 1 },
        artSubject:
          'an androgynous adult in their thirties with short dark hair and a grey cardigan walking through rain with an umbrella tucked under one arm, carefully shielding a paper coffee cup in each hand',
      },
      {
        id: 'risk',
        label: 'Ask Ana who the second cup was for',
        outcome:
          'Ana’s hands pause. ‘Your friend with the yellow umbrella, used to be. Then you just kept ordering it.’ She won’t take money for the second. He leaves with one coffee and a debt no cart can settle.',
        effects: { supplies: 1, evidence: 1, trust: -1 },
        artSubject:
          'A barista pausing mid-pour with a softened, worried look at an androgynous adult in their thirties with short dark hair and a grey cardigan, a single paper cup on the counter, a yellow umbrella glimpsed in the passing crowd',
      },
      {
        id: 'cancel-order',
        label: 'Cancel the second cup',
        outcome:
          'Ana pours it away with professional neutrality. A year-long ritual ends on Morrow’s say-so, and he only realizes afterward that it was never his to end.',
        effects: { supplies: 1, trust: -1 },
        artSubject:
          'A barista tipping a full paper cup into the cart’s small sink while an androgynous adult in their thirties with short dark hair and a grey cardigan holds the remaining cup, both looking at the drain',
      },
    ],
  },
  {
    key: '8,1',
    place: 'Concourse Noticeboard',
    title: 'The Map by the Dead Screen',
    speaker: 'Morrow',
    kind: 'memory',
    instant: true,
    opening:
      'Taped beside the concourse’s dead information screen is a hand-drawn biro map of the walk to the Annex: a wiggly river, a tick by the bakery, the underpass crossed out with ‘NOT IN RAIN, ramp floods’. Under it, in the same neat capitals: ‘Night staff stuck? Call W., ext 214.’ It is raining.',
    artSubject:
      'A corkboard beside a switched-off information screen with a hand-drawn ink map pinned to it, an androgynous adult in their thirties with short dark hair and a grey cardigan leaning close and tracing a route with one finger, wet footprints on the tiled floor',
    choices: [
      {
        id: 'notice',
        label: 'Take the long dry way past the bakery',
        outcome:
          'Morrow arrives with dry shoes, which this city seems to count as a minor miracle. He keeps the extension in his head without knowing why.',
        effects: { danger: -1 },
        artSubject:
          'an androgynous adult in their thirties with short dark hair and a grey cardigan walking under a bakery awning on a rainy street, warm window light and loaves behind glass, a flooded underpass ramp visible across the road',
      },
    ],
  },
  {
    key: '1,2',
    place: 'Annex Lobby',
    title: 'The Team Photograph',
    speaker: 'Morrow',
    kind: 'memory',
    instant: true,
    opening:
      'The Research Annex lobby smells of carpet glue and wet umbrellas. By the lifts hangs last year’s team photograph: Dr Sen with a pencil behind her ear, Mara squinting at the camera as if auditing it, and Rowan between them, laughing at someone just outside the frame.',
    artSubject:
      'A modest research building lobby with rain-streaked glass doors and a dripping umbrella stand, an androgynous adult in their thirties with short dark hair and a grey cardigan standing before a framed group photograph on the wall beside the lifts, fluorescent and grey daylight mixing',
    choices: [
      {
        id: 'notice',
        label: 'Learn the faces',
        outcome:
          'Morrow reads the photograph like a court portrait before a coronation: who stands nearest whom, whose hand rests on whose shoulder. The person outside the frame left only the edge of a yellow umbrella in one corner.',
        effects: { evidence: 1 },
        artSubject:
          'Close view of a framed team photograph of smiling lab staff, a sliver of yellow umbrella at the edge, the faint reflection of an anxious face in the glass',
      },
    ],
  },
  {
    key: '2,2',
    place: 'Annex HR Office',
    title: 'The Signature That Doesn’t Match',
    speaker: 'Farah Qureshi',
    kind: 'memory',
    opening:
      'HR wants a return-to-work form after the missed shift. Farah Qureshi slides it across beside the file copy of Rowan’s old signature, a quick looped scrawl like a startled bird. Morrow’s hand, trained on charters, writes like a seal being pressed into wax. ‘Just sign where it’s highlighted,’ Farah says. ‘It should match.’',
    artSubject:
      'A small cluttered HR office with a rain-dark window, an HR officer in a headscarf sliding two papers across the desk, an androgynous adult in their thirties with short dark hair and a grey cardigan holding a pen above the page, a potted plant and a stack of folders',
    choices: [
      {
        id: 'care',
        label: 'Sign in your own hand and say it’s changed',
        outcome:
          'Farah looks from one signature to the other, then at him. ‘Handwriting changes after a bad patch,’ she says carefully, and books him an occupational-health check for Tuesday. The form is honest. It is also now a file.',
        effects: { trust: 1, danger: 1 },
        artSubject:
          'An HR officer comparing two signatures side by side with a thoughtful frown while an androgynous adult in their thirties with short dark hair and a grey cardigan sits very straight, hands folded, waiting',
      },
      {
        id: 'risk',
        label: 'Trace the old signature from the file copy',
        outcome:
          'He copies the startled bird well enough that Farah never looks twice. The form clears, the pay run clears, and Morrow has now forged the name he lives in, which is a different thing from wearing it.',
        effects: { supplies: 1, trust: -1 },
        artSubject:
          'an androgynous adult in their thirties with short dark hair and a grey cardigan bent close over a form, pen moving slowly, one sheet half-overlapping another against the window light, the HR officer turned away answering a phone',
      },
    ],
    echoes: [
      {
        flag: 'e03:2,1:care',
        text: 'Mara has stapled a note to the form: ‘Rough week. Go easy. —M.’ Farah goes easy, a little, and the note makes the pen heavier.',
      },
      {
        flag: 'e03:2,1:risk',
        text: 'Mara’s initials are already on the witness line. She signed without reading, the way you sign for someone who remembers everything.',
      },
    ],
  },
  {
    key: '3,2',
    place: 'Annex Post Room',
    title: 'The Jammed Pigeonhole',
    speaker: 'Morrow',
    kind: 'memory',
    instant: true,
    opening:
      'Rowan’s pigeonhole is jammed tight: an unopened conference letter, two flyers for a staff choir, a canteen card, and on top of it all a yellow sticky note in block capitals. Morrow, who once received petitions on vellum, has never been so thoroughly addressed.',
    artSubject:
      'A narrow staff post room with rows of wooden pigeonholes, one overstuffed with envelopes and flyers, an androgynous adult in their thirties with short dark hair and a grey cardigan working them loose with care, a damp umbrella hooked on his arm',
    choices: [
      {
        id: 'notice',
        label: 'Empty the pigeonhole',
        outcome:
          'The canteen card still has credit. The conference letter stays sealed; it isn’t his news to read. The sticky note is Mara’s: ‘HANDOFF 6PM. NOT 6:15. —M.’ He resolves to honour it like a writ.',
        effects: { supplies: 1 },
        artSubject:
          'Hands sorting a small pile on a post-room counter: a sealed envelope, a plastic canteen card, choir flyers, and a yellow sticky note held up to the light',
      },
    ],
  },
  {
    key: '4,2',
    place: 'Humidity Lab Bench',
    title: 'Three Sensors, One Honest',
    speaker: 'Dr Sen',
    kind: 'puzzle',
    opening:
      'Dr Sen sets three humidity sensors beside the reference, which reads 62. Sensor A reads 61; its calibration sticker is in date. Sensor B reads 66, calibrated only last week. Sensor C reads exactly 62, but its sticker expired a month ago. Her pencilled rule on the bench: ‘In date AND within two of the reference. Both, or it isn’t data.’ Morrow has already tried asking the sensors nicely.',
    artSubject:
      'A tidy lab bench with three small humidity sensors and a reference instrument in a row, a patient woman in her fifties with a pencil and an open paper notebook, an androgynous adult in their thirties with short dark hair and a grey cardigan leaning over the sensors with a hopeful hand half-raised, rain on a high window',
    choices: [
      {
        id: 'care',
        label: 'Log the run with sensor A',
        outcome:
          'Dr Sen nods once and writes ‘A’ in her notebook. ‘Close and current beats perfect and stale,’ she says, which Morrow suspects is also advice about people.',
        effects: { evidence: 1, trust: 1 },
        artSubject:
          'Dr Sen writing a single letter in her notebook with a small approving nod while an androgynous adult in their thirties with short dark hair and a grey cardigan plugs one sensor into a logger cable',
      },
      {
        id: 'risk',
        label: 'Log the run with sensor C, the perfect match',
        outcome:
          'Dr Sen taps the expired sticker twice with her pencil, without comment. The run waits while C goes back in the drawer, and Morrow learns that a perfect answer can still be out of date.',
        effects: { supplies: -1 },
        artSubject:
          'A pencil tip tapping a small sensor on the bench while an androgynous adult in their thirties with short dark hair and a grey cardigan winces, the other two sensors waiting in a row',
      },
      {
        id: 'newest-sensor',
        label: 'Log the run with sensor B, freshly calibrated',
        outcome:
          'B runs four points high. Dr Sen lets him discover this from the first hour of readings, then lets him start again. Fresh paperwork, it turns out, does not make a sensor honest.',
        effects: { supplies: -1 },
        artSubject:
          'an androgynous adult in their thirties with short dark hair and a grey cardigan frowning at a laptop graph line that sits clearly above the others, Dr Sen beside him quietly sharpening a pencil',
      },
    ],
  },
  {
    key: '5,2',
    place: 'Annex Data Room',
    title: 'Dr Sen’s Experiment Error',
    speaker: 'Dr Sen',
    kind: 'companion',
    opening:
      'Dr Sen’s pencil stops at row 340. The overnight humidity run drifts exactly where a drying step should have been, and that step is missing from Rowan’s notes, which are Morrow’s notes now. ‘Somebody skipped the desiccant,’ she says mildly, not looking up. Team meeting at ten. The log goes to the funder on Friday.',
    artSubject:
      'A quiet data room with printouts spread across a table, Dr Sen in her fifties running a pencil down a column of numbers, an androgynous adult in their thirties with short dark hair and a grey cardigan standing behind her holding a battered lab notebook open to a gap, grey rain-light from a window',
    choices: [
      {
        id: 'care',
        label: 'Put the error on the team record under your name',
        outcome:
          'Morrow writes it in the shared log: ‘Drying step omitted. My notes, my run.’ Dr Sen adds a pencil line beneath it, ‘Procedure revised, see p. 12’, and the week loses two days to a clean re-run that nobody has to whisper about.',
        effects: { trust: 2, evidence: 1, supplies: -1 },
        artSubject:
          'an androgynous adult in their thirties with short dark hair and a grey cardigan writing in a shared lab logbook at a meeting table while Dr Sen adds a small note beneath in pencil, colleagues with mugs looking on without judgment',
      },
      {
        id: 'risk',
        label: 'Quietly re-run it so the log looks tidy',
        outcome:
          'He books the chamber for 3 a.m. on his own badge, adds the drying step, and the numbers come out beautiful. Dr Sen never asks. The step is still missing from the notes, waiting for the next person who trusts them.',
        effects: { evidence: 1, danger: 1, trust: -1 },
        artSubject:
          'an androgynous adult in their thirties with short dark hair and a grey cardigan alone in a dim lab at night, face lit by an environmental chamber’s control panel, a clock showing an early small hour, rain on dark windows',
      },
    ],
    echoes: [
      {
        flag: 'e03:4,2:care',
        text: 'This morning Dr Sen wrote ‘good eye’ beside his sensor choice. It makes this harder, not easier.',
      },
    ],
  },
  {
    key: '6,2',
    place: 'Sublevel B Door',
    title: 'The Door Beneath the Annex',
    speaker: 'Walt',
    kind: 'dungeon',
    opening:
      'The back stairwell ends at a steel door: Sublevel B, after hours by escort only. A key log hangs chained beside it. Rowan’s name appears four times this spring, signed out and never signed back in. Whatever he left unfinished is down there, behind a card reader that wants archive access. Walt, mopping the landing, watches Morrow read the log and says nothing yet.',
    artSubject:
      'A concrete basement stairwell ending at a heavy steel door with a card reader and a clipboard on a chain, an older cleaner in a work tabard leaning on a mop, an androgynous adult in their thirties with short dark hair and a grey cardigan reading the clipboard under a single buzzing strip light',
    choices: [
      {
        id: 'care',
        label: 'Sign the key log properly and ask Walt for escort',
        outcome:
          'Morrow signs the name Rowan, the time, and a reason he invents on the spot: ‘retrieve own project’. Walt reads it twice and says Thursday, after the floors are done. The door stays shut tonight, but the question behind it now has a date.',
        effects: { trust: 1, evidence: 1, danger: -1 },
        artSubject:
          'an androgynous adult in their thirties with short dark hair and a grey cardigan writing on the chained clipboard while the older cleaner looks over his shoulder, mop bucket at their feet, the steel door closed beside them',
      },
      {
        id: 'risk',
        label: 'Borrow the archive badge left in the break room',
        outcome:
          'The reader blinks green for Lena Kowalczyk, Archives. The door gives a hand’s width: cold air, old cardboard, shelving going back into dark. Footsteps on the stairs make him let it close. He knows the archive is real. Soon, so will the access log.',
        effects: { evidence: 1, danger: 2, trust: -1 },
        artSubject:
          'an androgynous adult in their thirties with short dark hair and a grey cardigan holding a steel door open a few inches with one hand, a borrowed lanyard badge in the other, cold darkness and the edge of tall shelving visible through the gap, glancing back up the stairwell',
      },
    ],
    echoes: [
      {
        flag: 'e03:5,2:care',
        text: 'Walt has heard about the error on the team record. ‘Honest mistakes I can escort,’ he says, before Morrow asks anything.',
      },
      {
        flag: 'e03:5,2:risk',
        text: 'Walt was mopping this floor at 3 a.m. when the chamber booking went through on Rowan’s badge. He doesn’t mention it. He doesn’t need to.',
      },
      {
        flag: 'e03:5,1:care',
        text: 'The pencil note from the coat pocket is folded in Morrow’s hand: ‘ask Mara re: B key log’. So this is what it meant.',
      },
    ],
  },
  {
    key: '7,2',
    place: 'Annex Service Lift',
    title: 'Between Floors',
    speaker: 'Kemal',
    kind: 'challenge',
    opening:
      'The service lift groans and stops between floors two and three, doors a hand’s width open on bare concrete. Kemal, a courier with a cool box of cell samples for Dr Sen, watches its thermometer: 7.1 and climbing; at 8.0 the samples are waste. The intercom promises an engineer within the hour. A cleaner’s sticker on the panel reads ‘stuck? ext 214, W.’ Morrow has been in iron cages before.',
    artSubject:
      'Inside a cramped stalled service lift, a courier in a rain jacket crouched over a cool box reading its thermometer, an androgynous adult in their thirties with short dark hair and a grey cardigan with both palms on the half-open doors showing a strip of concrete, harsh overhead light',
    choices: [
      {
        id: 'care',
        label: 'Press the alarm and wait it out with Kemal',
        outcome:
          'Fifty minutes. Morrow learns about Kemal’s daughter’s driving test and the city’s worst roundabouts. The engineer arrives at 8.3. Kemal signs for the loss without blaming anyone, which is harder to watch than anger.',
        effects: { trust: 1, evidence: -1 },
        artSubject:
          'Two people sitting on the floor of a stalled lift, the courier talking with his hands, an androgynous adult in their thirties with short dark hair and a grey cardigan listening, the cool box between them, a lift engineer’s torch beam appearing through the door gap',
      },
      {
        id: 'risk',
        label: 'Force the doors and climb out to the landing',
        outcome:
          'He hauls himself onto the third-floor landing and lifts the cool box after him while Kemal swears in two languages. The samples arrive at 7.6. Facilities write an incident report full of words like ‘unsafe’ and ‘never’, and they are right.',
        effects: { evidence: 2, danger: 2 },
        artSubject:
          'an androgynous adult in their thirties with short dark hair and a grey cardigan scrambling up from a lift car onto a corridor floor through forced-open doors, reaching back down for a cool box held up by a courier, dust and harsh light',
      },
      {
        id: 'call-walt',
        label: 'Phone extension 214',
        outcome:
          'Walt arrives in nine minutes with a key he isn’t strictly meant to have and winches the car down to two. The samples make it at 7.9. Walt writes the override up under his own name, and that costs him a conversation with his manager.',
        effects: { evidence: 1, trust: 1, danger: 1 },
        artSubject:
          'An older cleaner in a work tabard turning a lift override key at an open landing door, the lift car sitting low, an androgynous adult in their thirties with short dark hair and a grey cardigan and a courier stepping out with a cool box',
      },
    ],
    echoes: [
      {
        flag: 'e03:8,1:notice',
        text: 'Morrow knows that extension. It was on the hand-drawn map at the station, in the same neat capitals.',
      },
    ],
  },
  {
    key: '8,2',
    place: 'Annex Roster Board',
    title: 'Three Unpaid Hours',
    speaker: 'Mara',
    kind: 'memory',
    opening:
      'On the roster board, yesterday’s handoff has the name Rowan crossed out and ‘MARA 6–9 (cover)’ pencilled beside it. Mara is at the board with an eraser: the steward who keeps everyone’s hours honest, about to leave her own off. ‘Three hours,’ she says. ‘Not worth a form.’',
    artSubject:
      'A corridor roster board covered in pencilled names and time blocks, Mara with a lanyard holding an eraser near one entry, an androgynous adult in their thirties with short dark hair and a grey cardigan beside her watching her hand, late-afternoon rain-light down the corridor',
    choices: [
      {
        id: 'care',
        label: 'Log her cover hours against your missed shift',
        outcome:
          'Morrow writes it properly: his absence, her three hours, both signed. It puts his failure in ink where the manager will see it. Mara reads it and says nothing, but she puts the eraser back in her pocket.',
        effects: { trust: 1, evidence: 1, danger: 1 },
        artSubject:
          'an androgynous adult in their thirties with short dark hair and a grey cardigan writing a timesheet entry on a clipboard against the roster board while Mara watches, eraser lowered at her side',
      },
      {
        id: 'risk',
        label: 'Swear her a debt of honour instead',
        outcome:
          '‘I owe you three hours, Mara. A debt of honour.’ She stares, then laughs, properly, for the first time, and lets him buy her lunch. The roster still lies by three hours, and the person who keeps it honest let it.',
        effects: { trust: 1, supplies: -1, evidence: -1 },
        artSubject:
          'Mara laughing with a hand over her mouth in a corridor while an androgynous adult in their thirties with short dark hair and a grey cardigan stands with a hand on his chest in an old-fashioned formal pledge, the roster board behind them',
      },
    ],
    echoes: [
      {
        flag: 'e03:2,1:care',
        text: 'Since the platform, Mara explains things once, slowly, and checks he’s following. She is explaining this one very slowly.',
      },
      {
        flag: 'e03:2,1:risk',
        text: '‘You’ll remember this,’ Mara says, tapping yesterday’s date, ‘since you remember everything.’ It is not quite a joke.',
      },
      {
        flag: 'e03:7,1:care',
        text: 'The second coffee sits on the shelf under the board, half drunk. Mara doesn’t mention it, which is how Morrow knows it landed.',
      },
    ],
  },
]
