import type { MorrowShiftSite } from '../morrowShift/types'

/**
 * e04 "The Unbelieving City", rows 1–2: Station Concourse and Research
 * Annex. Same places as e03's rows 1–2, after magic has arrived uninvited.
 * Anchors here: 2,1 (Mara's roll call) and 6,2 (Sublevel B threshold).
 * 2,2 is a fixed Chronicle photograph site, "The First Impossible Rain".
 */
export const UNBELIEVING_CITY_ROWS_1_2: readonly MorrowShiftSite[] = [
  {
    key: '1,1',
    place: 'Concourse Departures Board',
    title: 'Every Train Arrived',
    speaker: 'Morrow',
    kind: 'treasure',
    instant: true,
    opening:
      'Station Concourse, 7:40, and the departures board lists nothing departing. Every line reads ARRIVED. On the glass roof the rain has turned gold and slow, and each drop that touches someone says a sentence in their own voice: ‘I’ll ring you back.’ ‘Last time, I swear.’ Station staff have dragged the emergency crate under the board and are handing out whatever is in it.',
    artSubject:
      'A crowded railway concourse at early morning under a departures board where every line glows the same, slow golden raindrops sliding down the glass roof above, station staff in high-vis lifting things out of a red emergency crate, an androgynous adult in their thirties with short dark hair and a grey cardigan standing still among commuters who have stopped to listen to nothing, emergency strip lights and gold-tinted daylight',
    choices: [
      {
        id: 'notice',
        label: 'Take what the crate offers',
        outcome:
          'A wind-up torch, a foil blanket, a whistle on a string. The laminated card in the lid says one of each per person. Someone has added in biro: ‘and one for whoever you’re looking for.’ Morrow takes two torches, and does not yet know for whom.',
        effects: { supplies: 1 },
        artSubject:
          'Close view of hands holding two wind-up torches and a folded foil blanket above an open emergency crate, a laminated card with biro scrawl taped inside the lid, gold light dappling the concourse floor',
      },
    ],
    echoes: [
      {
        flag: 'e03:1,1:notice',
        text: 'The transit pass from his cardigan pocket, the one valid until yesterday, is warm to the touch. Its expiry date now reads today.',
      },
    ],
  },
  {
    key: '2,1',
    place: 'Platform 4 Bench',
    title: 'Mara Counts the Platform',
    speaker: 'Mara',
    kind: 'companion',
    opening:
      'The 8:02 came back at 8:02 exactly, every seat filled with a coat and nobody inside one. Platform 4 is full of people saying a name and pointing at a window. Mara stands on the bench with her ring binder, calling a roll of whoever is actually here, her voice cracking only on the numbers. ‘Rowan. Good. You can count.’ The train waits with its doors open, breathing out warm air.',
    artSubject:
      'A rainy railway platform under a dripping canopy beside a stalled commuter train whose lit windows show coats sitting upright in every seat with no one in them, a sharp-eyed woman in her thirties with a lanyard standing on a bench holding up a ring binder, frightened commuters crowded below, an androgynous adult in their thirties with short dark hair and a grey cardigan at the bench’s foot, golden rain beyond the canopy edge, emergency lights on the train doors',
    choices: [
      {
        id: 'care',
        label: 'Help her count only who is actually here',
        outcome:
          'They count sixty-three, twice, and Mara writes every name in block capitals. The people waiting for coats get a number and a hand to hold, which is less than they need and more than nothing. ‘The missing go on a separate page,’ Mara says. ‘We don’t lose anyone else while we look.’',
        effects: { trust: 2, danger: -1, evidence: -1 },
        artSubject:
          'On a crowded platform a woman with a ring binder writes names while an androgynous adult in their thirties with short dark hair and a grey cardigan holds the binder steady and points along a line of commuters, an older woman gripping a stranger’s hand, the coat-filled train blurred behind',
      },
      {
        id: 'risk',
        label: 'Ride the coat-filled train to find the missing',
        outcome:
          'The doors shut behind him. The train runs into fog for exactly as long as the timetable says; every coat is warm, and one pocket holds a ringing phone. It brings him back with a nurse’s name badge and the name of a stop nobody has heard of. Mara’s count is sixty-one. Two people ran for the doors after him, and nobody saw them get off.',
        effects: { evidence: 2, danger: 2, trust: -1 },
        artSubject:
          'Inside a dim commuter carriage moving through thick fog, coats sitting upright in every seat, an androgynous adult in their thirties with short dark hair and a grey cardigan walking the aisle holding up a lit phone pulled from a coat pocket, gold light smearing past the windows',
      },
    ],
    echoes: [
      {
        flag: 'e03:2,1:care',
        text: 'She knows he forgets things now. She hands him the binder’s second pen without asking whether he remembers how a roll call works.',
      },
      {
        flag: 'e03:2,1:risk',
        text: '‘You remember everything,’ Mara says, and it is not a joke any more. ‘So remember these faces.’',
      },
      {
        flag: 'e03:8,8:risk',
        text: 'The gold in the platform puddles is the gold he saw at the fountain, once, for one breath. Morrow keeps very still and lets her count.',
      },
      {
        flag: 'e03:8,8:care',
        text: 'He left the working unspoken. He is almost sure he did. Somebody else, then, has opened something.',
      },
    ],
  },
  {
    key: '3,1',
    place: 'Concourse Platform Stairs',
    title: 'Late Trains Come Home',
    speaker: 'Bernadette',
    kind: 'puzzle',
    opening:
      'Three trains to Annex Road: the 8:16 from platform 3, on time; the 8:18 express from platform 4, delayed; the 8:24 stopping service from platform 6, delayed. The announcer repeats that the express does not call at Annex Road. Chalked on the stair wall in Bernadette’s hand: ‘Every train that left on the minute came back with only coats. Late ones come home full.’',
    artSubject:
      'A wide station staircase under a glowing departures board in emergency lighting, a platform attendant in high-vis chalking capitals on the tiled wall, an androgynous adult in their thirties with short dark hair and a grey cardigan at the foot of the stairs looking from the board to the chalk, golden rain sliding down tall windows',
    choices: [
      {
        id: 'care',
        label: 'Take the punctual 8:16, the train that keeps its word',
        outcome:
          'Platform 3 is open again, freshly painted, and the 8:16 leaves on the stroke. Morrow is on the step when Bernadette hauls him back by the cardigan. At 8:31 it returns with forty coats folded on its seats. He takes the 8:24 with shaking hands and arrives late.',
        effects: { danger: 1 },
        artSubject:
          'A platform attendant in high-vis gripping the back of a grey cardigan and pulling an androgynous adult in their thirties with short dark hair off the step of a train as its doors close, the platform clock showing the exact minute',
      },
      {
        id: 'risk',
        label: 'Sprint for the delayed 8:18 express',
        outcome:
          'It is late, so it comes home full, but it does not stop at Annex Road. Morrow gets off at the harbour, where the platform is wet to the ankle and the tide board shows a high water nobody scheduled. He pays for a return and keeps his feet off the floor all the way back.',
        effects: { supplies: -1 },
        artSubject:
          'An empty harbour station platform with seawater lapping across the tiles, an androgynous adult in their thirties with short dark hair and a grey cardigan standing on a bench to stay dry and staring at a lit tide board, grey sea and gold drizzle beyond the railings',
      },
      {
        id: 'platform-six',
        label: 'Take the delayed 8:24 stopping service from platform 6',
        outcome:
          'Six minutes late, stopping everywhere, carrying everyone. The old man with the seedlings is aboard again, and every leaf on his tray has turned toward the gold. At Annex Road the doors open on people. Morrow files away a new rule: in this city now, lateness is a kind of mercy.',
        effects: { evidence: 1, danger: -1 },
        artSubject:
          'Inside a crowded slow commuter train, an old man with a tray of seedlings whose leaves all lean toward a gold-lit window, an androgynous adult in their thirties with short dark hair and a grey cardigan standing beside him holding a pole, ordinary tired passengers all around',
      },
    ],
  },
  {
    key: '4,1',
    place: 'Platform 5 Clock',
    title: 'Minutes Refunded',
    speaker: 'Bernadette',
    kind: 'memory',
    opening:
      'The platform 5 clock keeps perfect time now, and so does the delay-refund form. The man with the scratched stopwatch claimed his four minutes and got them: he stands four minutes behind the world, lips moving long before his voice arrives. A queue has formed to claim more. Bernadette is still handing out forms, because nobody has told her what else to do.',
    artSubject:
      'A rainy platform under a large station clock, a commuter in a soaked suit holding a stopwatch whose outline is faintly doubled as if he stands a moment out of step, a queue of people clutching paper forms, a weary platform attendant in high-vis holding out another form, an androgynous adult in their thirties with short dark hair and a grey cardigan staring at the man, gold rain beyond the canopy',
    choices: [
      {
        id: 'care',
        label: 'Help Bernadette close the refund queue',
        outcome:
          'Bernadette believes him before the queue does, then makes the queue believe her, and tapes the slot shut. A woman who wanted her hour back to say goodbye to her father does not get it, and Morrow has to watch. Bernadette sits with the stopwatch man and waits four minutes for every answer.',
        effects: { trust: 1, danger: -1, evidence: -1 },
        artSubject:
          'A platform attendant in high-vis sitting patiently on a bench beside a man in a wet suit holding a stopwatch, a form slot taped shut behind them, an androgynous adult in their thirties with short dark hair and a grey cardigan standing with a grieving woman who holds an unused form',
      },
      {
        id: 'risk',
        label: 'File for one minute and find out whose it is',
        outcome:
          'The minute arrives cold and wet. For sixty seconds Morrow hears surf under the platform and a girl counting waves in a language he almost knows. Then it ends, and the platform 5 clock is running one minute slow. Whoever lent that minute is still waiting to be paid.',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan standing with eyes closed and head tilted on a rainy platform, a faint glimmer of seawater on the tiles at their feet, the large station clock above showing a minute hand slightly behind',
      },
    ],
    echoes: [
      {
        flag: 'e03:4,1:care',
        text: 'Morrow claimed four minutes on this platform last month. He checks his watch. It is exactly four minutes behind the clock.',
      },
      {
        flag: 'e03:4,1:risk',
        text: '‘You wanted someone to blame for a late train,’ Bernadette says, not unkindly. ‘Now they’re all on time. Pick someone.’',
      },
    ],
  },
  {
    key: '5,1',
    place: 'Lost Property Window',
    title: 'Two Hundred Warm Coats',
    speaker: 'Mr Osei',
    kind: 'treasure',
    opening:
      'Mr Osei has run out of hooks. Coats from the returned trains hang three deep behind the lost-property glass, still warm, each tagged by carriage and seat. Families queue with photographs. His rule hasn’t changed: name what’s in the pockets. And every coat he has checked holds one extra thing, a wet paper tide timetable that no shop in this city sells.',
    artSubject:
      'A small lost-property counter behind glass crammed with rows of coats hanging three deep, each with a paper tag, an older clerk with reading glasses holding a damp folded leaflet up to the light, a queue of anxious families holding phone photographs, an androgynous adult in their thirties with short dark hair and a grey cardigan at the window, gold rain-light from the concourse',
    choices: [
      {
        id: 'care',
        label: 'Help Mr Osei run the pocket rule for the families',
        outcome:
          'Morrow reads inventories aloud while Osei checks. A man claims his wife’s coat by naming her inhaler and a bus ticket, then holds it as if she might still be in it. At closing Osei pushes a box across: unclaimed torches, gloves, a first-aid kit. ‘For whoever you’re sheltering.’',
        effects: { supplies: 2, trust: 1 },
        artSubject:
          'An older clerk passing a coat across the counter to a man who hugs it to his chest, an androgynous adult in their thirties with short dark hair and a grey cardigan reading from a clipboard beside them, a cardboard box of torches and gloves waiting on the counter',
      },
      {
        id: 'risk',
        label: 'Pocket a tide timetable and read it',
        outcome:
          'It lists high water for streets, not harbours: Annex Road 11:40, Riverside Flats after dark, and at the bottom, underlined twice, the park fountain. Osei sees him take it and writes ‘item removed’ on the coat’s tag in his slow, fair hand.',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'Close view of hands unfolding a damp paper tide table printed with street names instead of harbours, one line underlined twice, a coat tag in the background being written on by an older clerk',
      },
    ],
    echoes: [
      {
        flag: 'e03:5,1:care',
        text: 'Osei remembers who admitted not knowing his own pockets. ‘You’re honest about pockets,’ he says, and hands Morrow the clipboard.',
      },
      {
        flag: 'e03:5,1:risk',
        text: 'Morrow is wearing the green coat he claimed on his face alone. Every family in this queue has to name everything. The folded twenty in the lining feels like a stone.',
      },
    ],
  },
  {
    key: '6,1',
    place: 'Annex Exit Barriers',
    title: 'The Gate That Takes Names',
    speaker: 'Gloria Mensah',
    kind: 'monster',
    opening:
      'The Annex exit barriers have stopped asking for cards. Their readers glow gold and wait for a name, and the man ahead of Morrow gave his and walked through looking politely lost, unable to say where he lives. Gloria Mensah has wedged the wide emergency gate open with her own shoulder and is waving people through one at a time while it pushes back like a tide.',
    artSubject:
      'A row of station exit barriers whose card readers glow an eerie gold, a ticket inspector in a navy cap bracing a wide emergency gate open with her shoulder as it strains shut, commuters slipping through one by one, a dazed man wandering away beyond the gates, an androgynous adult in their thirties with short dark hair and a grey cardigan in the queue, rain and emergency lights at the station mouth',
    choices: [
      {
        id: 'care',
        label: 'Take Gloria’s place holding the emergency gate',
        outcome:
          'The gate leans on him like the sea on a wall. Gloria walks the lost man to the station office, finds his address in his wallet and rings his daughter. By the time she’s back, Morrow’s shoulder is purple. ‘You held,’ she says, which from Gloria is a medal.',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan bracing a straining emergency gate with shoulder and both hands, jaw set, while a ticket inspector in a navy cap leads a confused older man toward a lit station office',
      },
      {
        id: 'risk',
        label: 'Give the barrier the name Rowan',
        outcome:
          'The reader drinks the name and opens. Morrow walks through still knowing who he is; the name was never his to lose. On the far side his phone shows one missed call, timed yesterday, from a contact saved as ‘Me’. Gloria is watching him. ‘Whose name was that?’',
        effects: { evidence: 2, danger: 1, trust: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan just past an open exit barrier looking down at a phone screen glowing with a missed-call notice, a gold card reader dimming behind, a ticket inspector in a navy cap watching with narrowed eyes',
      },
    ],
    echoes: [
      {
        flag: 'e03:6,1:care',
        text: 'Gloria recognises the one who asked how to renew. ‘You. You listen,’ she says. ‘Get over here.’',
      },
      {
        flag: 'e03:6,1:risk',
        text: 'The penalty letter addressed to Rowan is still folded in his pocket. As he nears the barrier, the reader glows a little brighter, as if it has already read it.',
      },
    ],
  },
  {
    key: '7,1',
    place: 'Concourse Coffee Cart',
    title: 'Cash or Nothing',
    speaker: 'Ana',
    kind: 'merchant',
    opening:
      'Ana’s cart is open because the commuters are cold, not because anyone is paying. She has taped over the card reader: since the rain turned, its receipts print strange totals, and a nurse who tapped for tea walked off owing ‘one Tuesday’. ‘Cash or nothing,’ Ana says, already pouring two flat whites, one oat, one not. Her hands don’t know how to stop pouring the second.',
    artSubject:
      'A small steaming coffee cart under a stalled departures board, a barista in a knitted hat pouring two paper cups side by side, a card reader on the counter taped over with a handwritten sign, stranded commuters in damp coats clustered close for warmth, an androgynous adult in their thirties with short dark hair and a grey cardigan holding out a few coins, gold rain beyond the concourse doors',
    choices: [
      {
        id: 'care',
        label: 'Pay cash for a tray of coffees for the platform',
        outcome:
          'He carries twelve cups down to Platform 4, and people hold them more than drink them. Ana writes the order on the back of her hand and refuses the tip. As he goes, she pours the second flat white anyway and sets it on the counter for nobody.',
        effects: { supplies: -1, trust: 1, danger: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan handing paper cups from a cardboard tray to shivering commuters on a platform, a woman wrapping both hands around hers without drinking, a coat-filled train in the background',
      },
      {
        id: 'risk',
        label: 'Tap the card reader once, to see what it charges',
        outcome:
          'The receipt curls out warm: ‘2 flat white. Paid: one Tuesday, account of Rowan.’ Somewhere, a day of somebody else’s life has been spent on coffee. Ana tears it off and puts it in his hand without a word, like evidence.',
        effects: { supplies: 1, evidence: 2, trust: -1 },
        artSubject:
          'Close view of a card reader printing a curling paper receipt, a barista’s hand tearing it off, an androgynous adult in their thirties with short dark hair and a grey cardigan reaching for it, two paper cups steaming on the counter',
      },
    ],
    echoes: [
      {
        flag: 'e03:7,1:care',
        text: 'Mara’s second cup is already poured. Ana looks at him over it: ‘Is she in? Did she get in all right?’',
      },
      {
        flag: 'e03:7,1:risk',
        text: 'Ana glances past him for a yellow umbrella, the way she has every morning since he asked.',
      },
      {
        flag: 'e03:7,1:cancel-order',
        text: 'Ana hasn’t poured a second cup since he cancelled it. This morning she poured one anyway, and she can’t say why.',
      },
    ],
  },
  {
    key: '8,1',
    place: 'Concourse Noticeboard',
    title: 'The Ramp Floods Upward',
    speaker: 'Morrow',
    kind: 'memory',
    instant: true,
    opening:
      'The hand-drawn map beside the dead screen has new biro in the same neat capitals. The underpass is crossed out twice: ‘WATER COMING UP THE RAMP, NOT DOWN. SALT.’ Around it, missing notices overlap like scales, and someone has pinned a tide timetable to one corner. At the bottom Walt has added: ‘Phones ringing wrong? If it’s yesterday’s voice, hang up gently.’',
    artSubject:
      'A corkboard beside a dark information screen crowded with overlapping missing-person notices, a hand-drawn ink map in the middle with a route crossed out twice, a small damp tide timetable pinned in a corner, an androgynous adult in their thirties with short dark hair and a grey cardigan reading closely by torchlight, gold-tinged wet footprints on the tiles',
    choices: [
      {
        id: 'notice',
        label: 'Learn the new way round and leave a torch',
        outcome:
          'Long way, bakery side, nothing below street level. Morrow learns it like a geas. Then he pencils one line under Walt’s: ‘Spare torch, Platform 4 bench.’ Then he walks back and leaves the second torch there.',
        effects: { danger: -1 },
        artSubject:
          'A wind-up torch set carefully on a wet platform bench under a canopy, golden rain falling beyond, the blurred back of a grey cardigan walking away',
      },
    ],
    echoes: [
      {
        flag: 'e03:8,1:notice',
        text: 'Last month he took the long dry way past the bakery. Today the bakery is sandbagged, and the water at the underpass is climbing toward it.',
      },
    ],
  },
  {
    key: '1,2',
    place: 'Annex Lobby',
    title: 'Ticks on the Glass',
    speaker: 'Morrow',
    kind: 'memory',
    instant: true,
    opening:
      'The Annex lobby is a shelter now: wet coats on the radiators, a kettle on reception. Someone has marked last year’s team photograph in whiteboard pen, a tick by every face that has come in today. Dr Sen, ticked. Mara, ticked. Rowan, ticked the moment Morrow walked through the door. At the edge of the frame, the yellow umbrella has no name and no tick.',
    artSubject:
      'A modest research building lobby turned shelter, coats steaming on radiators and a kettle on the reception desk, a framed team photograph by the lifts with marker ticks drawn on the glass beside faces, an androgynous adult in their thirties with short dark hair and a grey cardigan standing before it, a sliver of yellow umbrella at the photo’s edge, emergency lighting and gold-tinted rain on the glass doors',
    choices: [
      {
        id: 'notice',
        label: 'Find who isn’t ticked',
        outcome:
          'Four faces. Morrow writes their names on the reception pad for Dr Sen’s phone list. At his feet the water from the revolving door has pooled, and it is not spreading. It is creeping, a finger’s width at a time, toward the stairs down to Sublevel B.',
        effects: { evidence: 1 },
        artSubject:
          'A puddle on a lobby floor stretching in one thin deliberate line across the tiles toward a stairwell door marked with a down arrow, the hem of a grey cardigan and a pen and notepad at the edge of the frame',
      },
    ],
  },
  {
    key: '2,2',
    place: 'Annex HR Office',
    title: 'The First Impossible Rain',
    speaker: 'Farah Qureshi',
    kind: 'memory',
    opening:
      'HR is the only Annex office that looks down on the Annex Road crossing, and by four the sky is night-dark. Farah Qureshi has abandoned her forms and stands at the glass, counting. Below, the rain falls gold and slow, and wherever it lands people stop to listen to something only they can hear. Under the green pharmacy awning, neighbours steer each other out of it by the elbow. An ambulance is trying to get through.',
    artSubject:
      'View from a small cluttered office window at night down onto a city intersection where rain falls glowing pale gold under the streetlights, neighbours in coats guiding each other under a green pharmacy awning, one holding an elderly man by the arm, the blurred lights of an approaching ambulance, an HR officer in a headscarf silhouetted at the glass with a phone, an androgynous adult in their thirties with short dark hair and a grey cardigan beside her',
    choices: [],
    echoes: [
      {
        flag: 'e03:2,2:care',
        text: 'The occupational-health card for Tuesday is still pinned to her board. It is Tuesday.',
      },
      {
        flag: 'e03:2,2:risk',
        text: 'The return-to-work form with his traced signature sits on top of her pile. In the window light, the ink has gone faintly gold.',
      },
    ],
  },
  {
    key: '3,2',
    place: 'Annex Post Room',
    title: 'Letters Nobody Posted',
    speaker: 'Morrow',
    kind: 'memory',
    instant: true,
    opening:
      'Every pigeonhole in the post room is jammed with letters nobody posted: envelopes in each person’s own handwriting, unstamped, damp at the corners, addressed to people they meant to write to and didn’t. Priya from facilities sorts them out of pure habit, hands not quite steady. Rowan’s pigeonhole is the only one with nothing new in it.',
    artSubject:
      'A narrow staff post room where every wooden pigeonhole overflows with handwritten damp envelopes, a young facilities worker sorting them on the counter, one pigeonhole conspicuously empty, an androgynous adult in their thirties with short dark hair and a grey cardigan reaching toward it, flickering fluorescent light',
    choices: [
      {
        id: 'notice',
        label: 'Check Rowan’s pigeonhole anyway',
        outcome:
          'Only the canteen card, still in credit, and Mara’s old sticky note. But Mara’s own pigeonhole holds a fat envelope in her block capitals, addressed to Rowan and never sent. Morrow leaves it where it is. It isn’t his to open, and it isn’t addressed to him either.',
        effects: { supplies: 1 },
        artSubject:
          'Close view of a thick envelope addressed in block capitals wedged in a pigeonhole, a hand in a grey cardigan sleeve drawing back from it, a plastic canteen card held in the other hand',
      },
    ],
  },
  {
    key: '4,2',
    place: 'Humidity Lab Bench',
    title: 'One Stair to Seal',
    speaker: 'Dr Sen',
    kind: 'puzzle',
    opening:
      'Dr Sen left three loggers out overnight, and every trace says its stair is filling: A in the east stair, B on the back stair to Sublevel B, C in the lift shaft. On the bench the reference reads 58. A reads 63, in date. B reads 59, in date. C reads 58 exactly, sticker expired. Her pencilled rule: ‘In date AND within two. Both, or it isn’t data.’ Facilities can seal one stair, and she acts only on data.',
    artSubject:
      'A tidy lab bench under emergency lighting with three small humidity loggers in a row beside a reference instrument, a patient woman in her fifties with a pencil and an open notebook, an androgynous adult in their thirties with short dark hair and a grey cardigan bent over the loggers, a laptop showing three rising graphs, golden rain on a high window',
    choices: [
      {
        id: 'care',
        label: 'Trust logger B and seal the back stair',
        outcome:
          'Dr Sen nods once and phones facilities. Within the hour the back-stair landing is ankle-deep and smells of the sea, and the east stair and the lift stay dry enough for the night shift to come up. ‘Current and close,’ she says. ‘Still the rule.’',
        effects: { evidence: 1, danger: -1 },
        artSubject:
          'A stairwell door being sealed with wide hazard tape by a facilities worker, dark water glinting on the landing beyond, Dr Sen on the phone in the corridor and an androgynous adult in their thirties with short dark hair and a grey cardigan holding the tape roll',
      },
      {
        id: 'risk',
        label: 'Trust C, the perfect match, and seal the lift shaft',
        outcome:
          'Dr Sen taps the expired sticker twice with her pencil and lets facilities do it anyway. An hour later the back stair floods, and Walt wades the night shift out with a mop bucket held up like a lantern.',
        effects: { danger: 1 },
        artSubject:
          'An older cleaner in a work tabard wading through dark water on a stair landing with a mop bucket held high, tired night staff following, a taped-off lift door behind them',
      },
      {
        id: 'east-stair',
        label: 'Trust A, freshly in date, and seal the east stair',
        outcome:
          'A runs five points wet; it would call a desert damp. With the east stair shut, the night shift is sent down the back stair, and Mara turns them round on the landing ankle-deep in salt water, saying nothing at all to Morrow.',
        effects: { danger: 1, trust: -1 },
        artSubject:
          'A woman with a lanyard holding her arms wide on a flooded stair landing to stop a line of night staff, dark water around their shoes, an androgynous adult in their thirties with short dark hair and a grey cardigan hurrying down behind them',
      },
    ],
    echoes: [
      {
        flag: 'e03:4,2:care',
        text: 'Last month A was his good eye. Dr Sen watches to see whether he checks again or simply remembers.',
      },
      {
        flag: 'e03:4,2:risk',
        text: 'C is back out of the drawer, still expired, still perfect. Dr Sen has left it in the row on purpose.',
      },
    ],
  },
  {
    key: '5,2',
    place: 'Annex Data Room',
    title: 'Proof or the Phone List',
    speaker: 'Dr Sen',
    kind: 'companion',
    opening:
      'Dr Sen has turned the data room into a switchboard: the staff phone list taped to the wall, two landlines, a pencil behind each ear. On her screen the overnight humidity run has a shape no building should make, two climbs a day, each higher than the last, on a hill two miles from the sea. ‘I can prove this,’ she says, ‘or I can phone forty-one people. Not both before noon.’',
    artSubject:
      'A quiet data room under emergency lighting, a woman in her fifties with a pencil behind each ear holding a landline receiver beside a wall-taped phone list, a monitor showing a rising wave-shaped graph, an androgynous adult in their thirties with short dark hair and a grey cardigan standing between the screen and the phone, gold rain on the window',
    choices: [
      {
        id: 'care',
        label: 'Take half the phone list',
        outcome:
          'They ring forty-one numbers. Thirty-eight answer, scared and fine. Three ring through to voices from yesterday, chatting about dinner, and Dr Sen writes those three names on a separate page in careful pencil, then goes out into the corridor for exactly one minute.',
        effects: { trust: 2, evidence: -1 },
        artSubject:
          'Two people at a table each holding a landline phone to one ear, ticking names on a long printed list, the older woman pausing with her pencil over a separate short page, a graph left glowing unattended on the monitor behind',
      },
      {
        id: 'risk',
        label: 'Help her write it up so someone has to believe it',
        outcome:
          'By eleven they have one clean figure: a tide inside a building on a hill. The city emergency line logs it as ‘concern, academic’. It is proof, it is on file, and it will matter later. The phone list waits on the wall until after lunch.',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan and a woman in her fifties leaning together over a monitor showing a clean tidal graph, a printer pushing out a page, an untouched phone list on the wall behind them',
      },
    ],
    echoes: [
      {
        flag: 'e03:5,2:care',
        text: '‘You put your own mistake on the record once,’ she says. ‘So I trust you to tell me which of these matters more.’',
      },
      {
        flag: 'e03:5,2:risk',
        text: 'His 3 a.m. re-run sits in the same folder as this data, beautiful and unexplained. Dr Sen has started, very slightly, to check his numbers twice.',
      },
      {
        flag: 'e03:8,8:risk',
        text: 'The first climb on the graph starts the night he spoke the working at the fountain. Morrow reads the date on the axis and cannot make himself say so.',
      },
      {
        flag: 'e03:8,8:care',
        text: 'The first climb starts on a night he spent walking home with the working unspoken. Whoever opened this, the graph does not know their name.',
      },
    ],
  },
  {
    key: '6,2',
    place: 'Sublevel B Door',
    title: 'The Sea Under the Annex',
    speaker: 'Walt',
    kind: 'dungeon',
    opening:
      'Salt water is coming under the Sublevel B door in a thin, steady sheet, and it is climbing the first stair instead of pooling at the bottom. The chained key log is soaked; every name on it has run except Rowan’s. Walt is building a wall of mop buckets and sandbags from the loading bay. Behind the steel, something heavy moves down the aisles, slow and regular, like a tide that has learned to walk.',
    artSubject:
      'A concrete basement stairwell ending at a heavy steel door with a thin sheet of dark water sliding out beneath it and up the lowest step, a soaked clipboard on a chain, an older cleaner in a work tabard stacking sandbags and mop buckets, an androgynous adult in their thirties with short dark hair and a grey cardigan on the stair above, a single red emergency light',
    choices: [
      {
        id: 'care',
        label: 'Seal the door with Walt and sign it shut',
        outcome:
          'They tape the reader and stack the bags, and Morrow writes on the wet log: ‘SEALED 9:40, sea water. R.’ The door holds. From below comes a knock, twice, patient as an appointment. Whatever is down there stays down there, and so does whatever of Rowan’s is on the shelves.',
        effects: { trust: 1, danger: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan writing on a dripping chained clipboard beside a steel door taped and banked with sandbags, an older cleaner resting a hand flat on the door as if listening, red emergency light',
      },
      {
        id: 'risk',
        label: 'Push the bar and see where the sea is getting in',
        outcome:
          'The door gives a hand’s width and the sea comes with it, cold to the knee, smelling of weed and diesel. The shelving goes back further than the building does, and down the aisles the water runs uphill, away from him, toward a dark that moves. Walt hauls the door shut on Morrow’s arm. Neither of them speaks.',
        effects: { evidence: 2, danger: 2 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan knee-deep in seawater holding a steel door open a few inches, long dark archive shelving visible through the gap with water flowing away from the door, an older cleaner gripping the door edge to pull it shut',
      },
    ],
    echoes: [
      {
        flag: 'e03:6,2:care',
        text: 'Walt holds out the pen before Morrow can reach for it. ‘You signed it proper last time,’ he says. ‘Sign this proper too.’',
      },
      {
        flag: 'e03:6,2:risk',
        text: 'The reader by the door still blinks green when Morrow comes close, the way it did for Lena’s badge. It has not forgotten that he once let himself in.',
      },
      {
        flag: 'SB-35:return',
        text: 'Hollis’s sealed box, ‘Hold for owner’, sits on a bottom shelf down there. Rowan’s nights are under the sea’s first inch.',
      },
      {
        flag: 'SB-35:finish',
        text: 'The finished study is saved in four places. One of them is a drive on the bottom shelf below, and the water is over the shelf.',
      },
      {
        flag: 'SB-35:confess',
        text: 'Two copies of the truth went into two pigeonholes upstairs. The draft is still on the desk below, and the desk is under water.',
      },
    ],
  },
  {
    key: '7,2',
    place: 'Annex Service Lift',
    title: 'Floors It Doesn’t Have',
    speaker: 'Kemal',
    kind: 'challenge',
    opening:
      'The service lift stops between two and three. Then, doors still shut, the indicator keeps counting down: 1, G, B, B2, floors this building doesn’t have. Water beads up through the floor seam, cold and salt. Kemal the courier hugs a cool box of insulin bound for the laundrette shelter. Walt’s sticker still says ‘stuck? ext 214, W.’ Morrow has been in iron cages, never one that sank.',
    artSubject:
      'Inside a cramped stalled service lift lit by a flickering panel whose floor indicator glows below zero, seawater beading up through the floor seam, a courier in a rain jacket hugging a cool box, an androgynous adult in their thirties with short dark hair and a grey cardigan with one hand on the intercom and the other on the shut doors',
    choices: [
      {
        id: 'care',
        label: 'Press the alarm and keep Kemal talking',
        outcome:
          'The indicator stops at B4. The water stops at their ankles, as if it is listening too. Forty minutes of Kemal’s daughter and the city’s worst roundabouts, then an engineer winches them up to two. The insulin holds, but the shelter has waited forty minutes for it.',
        effects: { trust: 1, evidence: -1 },
        artSubject:
          'Two people sitting close on the floor of a stalled lift with water around their shoes, the courier talking with his hands, an androgynous adult in their thirties with short dark hair and a grey cardigan listening intently, a cool box between them, a torch beam appearing at the door gap',
      },
      {
        id: 'risk',
        label: 'Force the doors while there is still a floor behind them',
        outcome:
          'He hauls them apart on a strip of the second-floor landing at chest height. Below it is not shaft but black water, and an empty coat turning slowly on the surface. He climbs out, lifts Kemal and the cool box after him, and does not look down again.',
        effects: { evidence: 1, danger: 2 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan hauling himself from a lift car through forced-open doors onto a corridor floor, reaching back for a cool box held up by a courier, dark water glimpsed below the car edge',
      },
      {
        id: 'call-walt',
        label: 'Phone extension 214',
        outcome:
          'Walt answers, cheerful, and asks whether this is about the Tuesday lift. It is Wednesday. Morrow, who knows a voice out of its proper hour, hangs up gently and rings again. This time the line rings in the right day, and Walt comes with the override key, wet to the knees.',
        effects: { evidence: 1, trust: 1, danger: 1 },
        artSubject:
          'An older cleaner in a work tabard, trousers soaked to the knee, turning an override key at an open landing door, a lift car sitting low, an androgynous adult in their thirties with short dark hair and a grey cardigan and a courier stepping out with a cool box',
      },
    ],
    echoes: [
      {
        flag: 'e03:7,2:care',
        text: 'Kemal knows him: the one who sat through fifty minutes last time. ‘Driving test went fine,’ he says, watching the floors count down.',
      },
      {
        flag: 'e03:7,2:risk',
        text: 'Facilities bolted a plate to the doors after last time: DO NOT FORCE. Morrow reads it as the water rises.',
      },
      {
        flag: 'e03:7,2:call-walt',
        text: 'Walt got him out of this lift once already and paid for it with his manager. He may not be allowed the key any more.',
      },
    ],
  },
  {
    key: '8,2',
    place: 'Annex Roster Board',
    title: 'Every Shift She Offered',
    speaker: 'Mara',
    kind: 'memory',
    opening:
      'Mara has not gone home. Since the rain turned, every shift she ever offered to cover has come back onto the roster board in her own pencil, and each time she reaches the lobby doors she finds herself at the board again, eraser in hand. ‘It’s a clerical problem,’ she says, white at the mouth. Morrow knows it isn’t. In the Marches, a pledged hour is collected.',
    artSubject:
      'A corridor roster board crowded with fresh pencilled time blocks all bearing the same name, a woman with a lanyard holding an eraser against it with a pale, exhausted face, an androgynous adult in their thirties with short dark hair and a grey cardigan beside her looking from the board to the far lobby doors, emergency lighting and gold rain on a corridor window',
    choices: [
      {
        id: 'care',
        label: 'Take her extra shifts in your own name, the true one',
        outcome:
          'Morrow writes MORROW over three of her blocks in his sealing-wax capitals, and the board accepts him. Mara walks out through the lobby doors and does not come back round. At the door she turns. ‘Who’s Morrow?’ ‘Me,’ he says. She is too tired to argue, and it sits between them.',
        effects: { trust: 1, danger: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan writing a name in large careful capitals over pencilled entries on a roster board, a woman with a lanyard at the lobby doors in the background looking back over her shoulder',
      },
      {
        id: 'risk',
        label: 'Rub her name out and see what the board does',
        outcome:
          'The eraser works. Mara gets out. Then fresh pencil blooms in the empty blocks in a different hand: WALT, WALT, WALT. Down the corridor, Walt stops mopping, puts the mop away, and comes to stand at the board without knowing why.',
        effects: { evidence: 1, danger: 1, trust: -1 },
        artSubject:
          'A roster board where a name has been rubbed out and new pencil entries are appearing in an unfamiliar hand, an older cleaner in a work tabard standing before it with a puzzled face, an androgynous adult in their thirties with short dark hair and a grey cardigan holding an eraser',
      },
    ],
    echoes: [
      {
        flag: 'e03:8,2:care',
        text: 'His timesheet entry from last month is still pinned there, her three cover hours paid in ink. Those are the only three hours on the board that haven’t come back.',
      },
      {
        flag: 'e03:8,2:risk',
        text: 'Across the top of the board, in Mara’s pencil, the board has added: ‘ROWAN OWES 3 HRS. DEBT OF HONOUR.’',
      },
      {
        flag: 'e04:2,1:care',
        text: 'She counted sixty-three on the platform with him this morning and got every one right. She is not used to being the one who is stuck.',
      },
      {
        flag: 'e04:2,1:risk',
        text: 'She ran the platform count alone while he rode the coat train. She hasn’t said so. The board has: ‘MARA 8–9 (COUNT, ALONE)’.',
      },
    ],
  },
]
