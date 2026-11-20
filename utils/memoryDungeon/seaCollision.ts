/**
 * e11, Char’s Sea of Strangers: all 64 authored sites (2026-11-20 PT).
 * Written to hold on every World Four branch; Char’s own memories are
 * childhood only.
 */
export const SEA_COLLISION_SITES = {
  '1,1': {
    title: 'The Board That Says Both',
    speaker: 'Char and Dulse, a stranded merchild',
    kind: 'challenge',
    opening:
      'The Pearl Stair ends three steps early, on a commuter platform tiled in mother-of-pearl, and the arrival board above it flicks between two lines: CHARYBDIS, ARRIVED and CHARYBDIS, NOT ARRIVING. A tall mirror bolted to the pillar shows Char twice, one face lit by tide-gate floodlights, one face very young and wearing a crooked homemade crown. Char swims past both and stops in front of Dulse, a merchild with a paper ticket on a string, who is not allowed to board without an adult named on the board. ‘Which one of you is real?’ Dulse asks. Char considers the mirror, and then the child, and decides the child asked a better question.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales, black lace sleeves and a kohl-dark sardonic gaze, crouches on a pearl-tiled underwater subway platform beside a small merchild clutching a paper ticket, while a pillar mirror behind them shows two different reflections of Char and a flickering arrival board glows overhead',
    choices: [
      {
        id: 'tell-dulse-yourself',
        label: 'Tell Dulse who you are in your own words, mirror or no mirror',
        outcome:
          '‘I’m the one standing here, annoyed, with a bad haircut I chose,’ Char says. ‘The mirror knows things about me I haven’t agreed to.’ Dulse decides that is enough of an adult and takes her hand. The board stops flickering on one line for her alone. The mirror keeps both faces and fogs at the edges, and a crowd that heard every word starts telling each other what Char meant.',
        flag: 'pearl-board-own-words',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Char with dark violet scales and black lace holds the hand of a small merchild with a paper ticket on a string as they float toward an open subway door, commuters whispering behind them and a fogged mirror on the pillar',
      },
      {
        id: 'archive-both-faces',
        label:
          'Ask the station to file both reflections as true records, side by side',
        outcome:
          'Conductor Ottoline Fitch, an elderly hermit crab whose shell is a brass ticket booth, stamps two receipts and pins them under the mirror: WITNESS ONE, WITNESS TWO, NEITHER DISMISSED. It takes most of the morning and every spare stamp. Dulse boards beside Char without asking again. Char hates being looked at that long, and says so, which Fitch also files.',
        flag: 'pearl-board-both-archived',
        effects: { evidence: 2, supplies: -1 },
        artSubject:
          'An elderly hermit crab with a brass ticket-booth shell pins two stamped receipts beneath a two-faced pillar mirror on a pearl subway platform while Char in black lace waits with folded arms beside a small merchild',
      },
    ],
  },
  '2,1': {
    title: 'Tails Are Not Luggage',
    speaker: 'Char and Conductor Ottoline Fitch',
    kind: 'merchant',
    opening:
      'The coral turnstile at the end of Pearl Station has learned Earth fare rules from a flood of dropped tickets, and it counts every tail as unpaid baggage. Forty merfolk wait behind it, coiled and sullen. Conductor Ottoline Fitch sells luggage tokens from her shell at a pearl apiece, not because she likes it but because the tariff card is nailed to her booth and she was never told she could pull nails. Dulse has one token and a very long tail. Char reads the tariff card twice, finds the line that calls her body freight, and asks Fitch how much a hammer costs.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace sleeves, reads a nailed tariff card on a brass ticket-booth shell worn by an elderly hermit crab, beside a living coral turnstile holding back a queue of merfolk with coiled tails',
    choices: [
      {
        id: 'buy-everyone-tokens',
        label:
          'Spend your pearls on tokens so the whole queue gets through now',
        outcome:
          'Char empties her pouch onto the counter. Fitch counts honestly and slowly, and forty tails pass under the coral one by one. Dulse waves from the far side. The tariff card stays nailed exactly where it was, and the next queue is already forming behind the turnstile, counting their own pearls.',
        flag: 'turnstile-tokens-bought',
        effects: { supplies: -2, trust: 1 },
        artSubject:
          'A long queue of merfolk passes one by one through a living coral turnstile while Char with dark violet scales pours pearls onto a brass ticket counter beside an elderly hermit crab',
      },
      {
        id: 'amend-the-tariff',
        label:
          'Help Fitch pull the nail and rewrite the fare rule in her own hand',
        outcome:
          'Fitch pulls the nail with her largest claw and writes, A TAIL IS A PERSON, under the old line rather than over it, so the mistake stays readable. The turnstile sulks and jams for an hour while it digests the change, and the queue boos everyone equally. When it opens, it opens for good.',
        flag: 'turnstile-tariff-amended',
        effects: { evidence: 1, danger: 1, trust: 1 },
        artSubject:
          'An elderly hermit crab with a brass booth shell writes on a tariff card with an ink-dipped claw while Char in black lace holds the pulled nail and a jammed coral turnstile bristles behind them',
      },
    ],
  },
  '3,1': {
    title: 'For Whoever the Sea Kept',
    speaker: 'Char and Gorse, a wolf in a whelk shell',
    kind: 'puzzle',
    opening:
      'A Briar wolf has crawled into a whelk shell to survive the water, and he guards a sealed letter in its spiral the way wolves guard a road. His name is Gorse. The envelope is addressed in bark-script, To whoever the sea kept, and the station board keeps translating it as three different passenger names, none of them present. Gorse will not give it to the board and will not leave his shell to argue. ‘Briar law,’ he says. ‘A letter goes to the one who answers, not the one who is told they are the answer.’ Char sits on the bench beside him and starts reading the board backwards.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace sleeves, sits on a pearl platform bench beside a grey Briar wolf curled inside a huge spiral whelk shell, a bark-sealed letter visible in the shell mouth, a station arrival board glowing overhead',
    choices: [
      {
        id: 'call-for-the-answer',
        label:
          'Read the address aloud to the whole platform and wait for someone to answer',
        outcome:
          'Char reads it in her flattest voice, twice. A grandmother from a stranded ferry finally lifts her hand: her family was kept here when the tide shifted, and the letter is from a Briar cousin who never stopped looking. Gorse gives it to her himself. It takes the rest of the hour, and three people who wanted it to be them leave disappointed.',
        flag: 'courier-addressee-answered',
        effects: { trust: 1, evidence: 1 },
        artSubject:
          'An old merwoman lifts her hand on a crowded pearl subway platform as a wolf in a whelk shell holds out a bark-sealed letter and Char in black lace stands reading the address aloud',
      },
      {
        id: 'escort-the-shell',
        label:
          'Travel with Gorse so the letter never leaves his shell or his keeping',
        outcome:
          '‘Fine. You carry it, I carry you,’ Char says, and rigs a sling for the shell from platform rope. Gorse stays a courier and stays a wolf. The letter stays unread, and the delay means its addressee waits another day without knowing someone wrote. Char’s shoulders ache all the way down the line.',
        flag: 'courier-shell-escorted',
        effects: { trust: 2, supplies: -1, danger: 1 },
        artSubject:
          'Char with dark violet scales hauls a large whelk shell in a rope sling across her shoulders, a wolf’s grey muzzle peering out of the spiral, as they swim down a flooded subway tunnel',
      },
    ],
  },
  '4,1': {
    title: 'Oren and the Swallowed Manifest',
    speaker: 'Char and Oren',
    kind: 'companion',
    opening:
      'Oren stands on the platform edge with water pouring off his hood and a manifest that has eleven blank lines in the middle. A ledger eel, fat and gleaming with ink, coils under the rails, and when it yawns names show faintly through its belly: passengers who boarded and were never written down again. Oren has already drawn up a plan with two nets, a ladle and a strict schedule. He pauses at the last line. ‘I can make it give them back,’ he says. ‘I cannot make it ask them first.’ Char looks at the passengers waiting on the bench, some of whom may not want their names read aloud in a station.',
    artSubject:
      'Oren, a towering headsman hooded in rough brown cloth with two eyeholes, an axe on his back and a leather apron of pouches, holds a dripping manifest beside Char, a sturdy goth mermaid with dark violet scales and black lace, while an ink-dark eel with names glowing through its belly coils under subway rails',
    choices: [
      {
        id: 'ask-each-name',
        label:
          'Ask every waiting passenger before Oren coaxes their name back out',
        outcome:
          'Char goes bench to bench. Seven say yes, two say not here, and two say never. Oren coaxes out only the seven with a ladle of sweetened ink and writes each one where the owner can watch. The eel keeps four names curled in its gut, safe and unofficial. Oren joins the walk down the line, manifest incomplete and, he admits, correct.',
        flag: 'eel-names-by-permission',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'A hooded headsman with a leather apron ladles ink toward a coiled glowing eel while Char in black lace kneels beside a bench of passengers, one nodding permission and one shaking their head',
      },
      {
        id: 'take-testimony-instead',
        label:
          'Let passengers speak their own names to Oren and leave the eel alone',
        outcome:
          'The eel keeps the old record. Oren writes a new one from voices, each name spelled the way its owner spells it, dated today. Two passengers give different names than the eel holds, and Oren writes both without choosing. The registry office will hate it. Oren falls in beside Char, carrying two manifests and no complaints.',
        flag: 'eel-testimony-registry',
        effects: { evidence: 1, danger: 1, trust: 1 },
        artSubject:
          'A hooded headsman writes in a fresh ledger as a line of merfolk speak to him one at a time, Char with dark violet scales watching from the platform edge while an eel sleeps under the rails',
      },
    ],
  },
  '5,1': {
    title: 'A Light Nobody Asked For',
    speaker: 'Char and Teodor, a track diver',
    kind: 'memory',
    opening:
      'Teodor dives the flooded tracks for a living, clearing kelp from the points, and for three days a red Hoshimori lantern has followed him at shoulder height. It was meant as a ward. It glows brighter whenever he nears a hiding place, which means anyone holding a refuge map can see exactly where he is and who he visits. He never agreed to it. Char watches the lantern bob after him into a maintenance alcove and remembers, sharply, being a girl with a court guard two strokes behind her at every turn of the palace. She remembers how long it took to stop swimming as if watched.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, watches from a pearl pillar as a weary track diver in a patched harness swims into a flooded maintenance alcove, followed at his shoulder by a glowing red paper lantern',
    choices: [
      {
        id: 'snuff-the-lantern',
        label: 'Catch the lantern and smother its flame in your lace sleeve',
        outcome:
          'The lantern burns a hole through the lace and goes dark with a hiss. Teodor laughs for the first time in days. Then he stops: without it, the flood wardens cannot find him if the tunnel collapses, and his shift starts in an hour. He thanks Char anyway, and means it, and goes down unlit.',
        flag: 'diver-lantern-snuffed',
        effects: { danger: 1, trust: 1 },
        artSubject:
          'Char with dark violet scales clutches a smoking dark lantern against her scorched lace sleeve while a track diver laughs in surprise in a dim flooded tunnel',
      },
      {
        id: 'ask-for-his-signal',
        label:
          'Ask Teodor what kind of signal he would actually choose to carry',
        outcome:
          'He thinks about it longer than she expected. A small light that only his sister on the night shift can see, he says, and only below the tracks. Char trades two pearls with a lantern-tinker to rework the wick. The new light is dim and clumsy, and his, and the old ward goes into the tinker’s box unbroken.',
        flag: 'diver-chosen-signal',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'A track diver cups a tiny dim blue light in his palms as Char in black lace hands two pearls to a lantern-tinker, a dark red lantern resting in an open box between them',
      },
    ],
  },
  '6,1': {
    title: 'The Oracle of Owners',
    speaker: 'Char and the Tide Oracle',
    kind: 'challenge',
    opening:
      'Commuters queue at a cracked conch on a plinth, because the station posts its prophecies like timetables. When Char passes, it clears its throat in a voice like a drain. ‘Every Charybdis ahead belongs to someone. To her sister’s memory. To the court’s record. To the hand that rewrote the tides.’ The queue turns to look at her. Dulse, two places back, asks if that means Char is borrowed. Char has been called many things on many stairs, but borrowed lands somewhere under the ribs. The conch waits, smug, for her to choose an owner before it chooses one for her.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, faces a cracked glowing conch on a stone plinth on a subway platform while a queue of commuters and a small merchild with a paper ticket turn to stare at her',
    choices: [
      {
        id: 'argue-the-premise',
        label:
          'Argue in front of the queue that a prediction is not a deed of ownership',
        outcome:
          '‘You can forecast rain. You cannot sell it,’ Char tells the conch, loudly enough for the queue. Dulse repeats it to the commuter behind her. The oracle sputters and recites its list again, quieter. Two court clerks in the crowd take note of the princess heckling public infrastructure, and the note will travel faster than she can.',
        flag: 'oracle-premise-argued',
        effects: { evidence: 1, danger: 1 },
        artSubject:
          'Char in black lace points accusingly at a cracked conch on a plinth while a merchild beside her echoes her words to a listening queue and two grey-robed clerks write on slates',
      },
      {
        id: 'refuse-to-pick',
        label:
          'Decline to choose any owner and walk on before fear makes the choice',
        outcome:
          'Char simply leaves the queue. The conch shouts its list at her back, and nobody hears an answer, because there is none. Dulse runs after her and asks if that was allowed. ‘Probably not,’ says Char. The prophecy stays on the board, unrefuted, and some commuters will believe it for weeks.',
        flag: 'oracle-unanswered',
        effects: { trust: 1, danger: -1, evidence: -1 },
        artSubject:
          'Char with dark violet scales swims away down a pearl platform with a small merchild hurrying after her, a cracked conch on a plinth shouting bubbles at their backs',
      },
    ],
  },
  '7,1': {
    title: 'Velvet and Crown Adrift',
    speaker: 'Char and Scylla',
    kind: 'treasure',
    opening:
      'A black velvet coat and a formal pearl crown drift down the tunnel together, tangled at the collar as if they had been folded in one drawer for years. The coat is Char’s cut, frayed at the cuffs where she chews them. The crown is the heavy court one that nobody ever let either sister keep. Scylla reaches the platform edge first, then stops with her hand out and pulls it back. ‘You choose,’ she says, very carefully, as though she has rehearsed it. ‘Whatever I remember about these, it’s mine. What they are to you is yours.’ Char untangles the collar slowly.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, untangles a drifting black velvet coat from a heavy pearl crown at a subway platform edge while Scylla, her identical twin with pale aquamarine scales and a pearl circlet, holds back with one hand half raised',
    choices: [
      {
        id: 'keep-the-coat',
        label:
          'Keep the velvet coat for yourself and hand the crown to Fitch’s lost property',
        outcome:
          'The coat fits as if it never left. Char shrugs into it and feels warmer than the water allows. Fitch tags the crown UNCLAIMED, SAFE, and Scylla watches it go into the booth without a word. Later Char catches her looking at the tag, and neither of them mentions it.',
        flag: 'coat-kept-crown-left',
        effects: { supplies: 1, trust: -1 },
        artSubject:
          'Char shrugs into a black velvet coat with frayed cuffs while an elderly hermit crab tags a heavy pearl crown inside a brass booth and her aquamarine twin watches quietly',
      },
      {
        id: 'tie-them-together',
        label:
          'Tie the coat and crown together and carry them as something you both own',
        outcome:
          'Char knots the coat sleeves around the crown and slings the bundle between them. It is awkward to carry and impossible to wear. Scylla laughs, surprised, and takes the other end. They argue about whose turn it is every hundred strokes, which is the first ordinary argument they have had all day.',
        flag: 'coat-crown-shared',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Two identical sturdy mermaid sisters, one dark violet in black lace and one aquamarine with a pearl circlet, carry a bundle of black velvet coat knotted around a pearl crown between them down a flooded tunnel',
      },
    ],
  },
  '8,1': {
    title: 'The Key With Teeth',
    speaker: 'Char and the Anchor Key',
    kind: 'monster',
    opening:
      'At the end of the line, where the tunnel narrows to a barnacled service gate stencilled TIDE-GATE CROSSING, an anchor the size of a carriage has grown a lamprey mouth and lodged itself in the lock. It is a key, and it knows it. When Char swims close it unhooks one fluke and purrs that it will open the old crossing for her alone, and that the cost will be paid by someone else this time, kindly, quietly, out of sight. Behind her Scylla goes very still. Char has heard her sister talk about that gate in her sleep. She has never heard Scylla agree with herself about what happened there.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, faces a carriage-sized barnacled anchor with a ringed lamprey mouth lodged in a rusted service gate at the end of a flooded subway tunnel, her aquamarine twin frozen behind her',
    choices: [
      {
        id: 'make-it-name-the-cost',
        label:
          'Pin the key’s fluke and make it say the cost aloud before anyone touches it',
        outcome:
          'Char wedges her shoulder under the fluke while the anchor thrashes and the lamprey mouth sprays rust. Pinned, it recites: a district’s pumps, a stranger’s train, a sister’s memory, any one of them, its choice. Everyone on the platform hears. Char comes away bruised and the gate stays shut, but now nobody can pretend the price is invisible.',
        flag: 'anchor-cost-spoken',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'Char in black lace braces her shoulder under the fluke of a thrashing lamprey-mouthed anchor as rust sprays through the water and commuters watch from a distance',
      },
      {
        id: 'find-the-omitted',
        label: 'Search the tunnel for whoever the bargain quietly left out',
        outcome:
          'Behind a flooded cupboard Char finds a maintenance crew of four, asleep in their harnesses, rostered as the ones who would pay. Nobody told them. She wakes them and Scylla explains, badly and then well. The key sulks and stays lodged, and the crossing waits another day while the crew decide for themselves.',
        flag: 'anchor-omitted-found',
        effects: { trust: 2, supplies: -1, danger: -1 },
        artSubject:
          'Char with dark violet scales opens a flooded cupboard to reveal four sleeping maintenance workers in harnesses, her aquamarine twin beside her lifting a lantern, a barnacled anchor sulking in a gate behind',
      },
    ],
  },
  '1,2': {
    title: 'Scylla Among the Records',
    speaker: 'Char and Scylla',
    kind: 'companion',
    opening:
      'The throne room of the Court of Two Sisters has become an evidence locker. Portraits, tide-clock logs, court minutes and a two-faced mirror behind the throne all show the same two sisters, and none of them agree. Scylla is in the middle of it, circlet askew, sorting records into piles as if the right pile could settle who Char is. Char watches her sister pick up a portrait, put it in the pile marked TRUE, then move it to UNSURE. The mirror shows Char a face with her own mouth and a stranger’s certainty. ‘Come with me,’ Char says. ‘But not as my archivist.’',
    artSubject:
      'Scylla, a sturdy mermaid princess with pale aquamarine scales and a pearl circlet, kneels among stacked portraits and court ledgers in a coral throne room while Char, her identical twin with dark violet scales, black lace and a kohl-dark gaze, floats beside a two-faced mirror behind the throne',
    choices: [
      {
        id: 'scylla-speaks-as-herself',
        label:
          'Ask Scylla to tell her memory aloud, and to say plainly that it is hers',
        outcome:
          'Scylla tells it in pieces: water, a gate, a voice, and none of it tidied. She ends every part with ‘that is what I saw’. Char does not argue and does not agree. The courtiers lining the walls hear all of it, and by evening the palace has three versions of Scylla’s story, none of them hers. She joins Char anyway, red-eyed and lighter.',
        flag: 'court-scylla-own-memory',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Scylla with aquamarine scales and a pearl circlet speaks with her hands open in a coral throne room while Char in black lace listens with folded arms and courtiers lean in from the walls',
      },
      {
        id: 'char-speaks-first',
        label: 'Speak first, and ask Scylla to listen until you have finished',
        outcome:
          'Char talks about this morning, the station, the child, the coat, and what she wants next. She says nothing about anything she cannot vouch for. Scylla listens with her jaw tight and does not interrupt, which costs her visibly. When Char finishes, Scylla nods, sweeps the TRUE pile into a satchel unsorted, and follows.',
        flag: 'court-char-speaks-first',
        effects: { evidence: 1, trust: -1 },
        artSubject:
          'Char with dark violet scales speaks before an empty coral throne while Scylla, her aquamarine twin, listens with clenched jaw and sweeps a pile of portraits into a satchel',
      },
    ],
  },
  '2,2': {
    title: 'The Spare Key Exhibit',
    speaker: 'Char, Scylla and the court registrar',
    kind: 'memory',
    opening:
      'On the evidence table lies an Earth photograph the flood carried into court: a spare house key on a red ribbon, hanging from a hook beside an ordinary front door, a paper tag tied to its ring. The registrar has labelled it EXHIBIT NINE: WHOEVER HOLDS THE SPARE HOLDS THE HOUSEHOLD. Under that rule the coral turnstile at the throne-room door now admits only courtiers carrying someone else’s key. Scylla goes quiet over the picture, as if it reminds her of something she will not name. Char studies the tag, which is blank on the side facing the camera.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, leans over a coral evidence table holding a small photograph of a spare key on a red ribbon hanging beside a front door, while Scylla with aquamarine scales and a pearl circlet looks away and a coral turnstile bristles at a doorway',
    choices: [
      {
        id: 'challenge',
        label:
          'Ask the registrar what the two people in the photograph actually agreed',
        outcome:
          '‘A spare key is a promise with rules,’ Char says, ‘and nobody in this room has heard either person explain theirs.’ The registrar has no answer and strikes EXHIBIT NINE from the docket. The turnstile reverts to admitting everyone, which lets in a crowd of angry petitioners along with the honest ones.',
        flag: 'spare-key-terms-asked',
        effects: { evidence: 1, danger: 1 },
        artSubject:
          'Char in black lace taps a small photograph of a spare key on a red ribbon in front of a flustered grey-robed registrar as petitioners crowd through an open coral turnstile',
      },
      {
        id: 'hold',
        label:
          'Remember what it felt like to give someone the key to something of yours',
        outcome:
          'Char remembers the pearl-lock chest she and Scylla shared as girls, and the morning she handed over her half of the key without being asked. It was real trust and a real risk. She says so, gently, and Scylla laughs damply. Char keeps the photograph, unlabelled, as somebody else’s real risk.',
        flag: 'spare-key-mutual-trust',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Two identical mermaid sisters, one dark violet in black lace and one aquamarine with a pearl circlet, sit close at a coral table sharing a quiet laugh over a small photograph of a spare key',
      },
    ],
  },
  '3,2': {
    title: 'A Writ for the Princess of Record',
    speaker: 'Char, Gorse and the Chamberlain',
    kind: 'challenge',
    opening:
      'Gorse hauls his whelk shell up the throne-room steps with a Briar refuge writ in his teeth: by forest law, any court that owns a road must shelter whoever is stranded on it, and the station flooded into this court’s road at dawn. The Chamberlain, all gold buttons and gills, says a writ can only be accepted by the Princess Charybdis of record, and the records disagree about whether one exists. He also says the shell is coral-palace property and must be surrendered at the door. Gorse bares his teeth from inside it. Char reads the writ upside down and counts forty families in it.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, stands between a gold-buttoned court chamberlain with gills and a grey wolf inside a whelk shell holding a bark scroll in its teeth, on pearl throne-room steps',
    choices: [
      {
        id: 'accept-in-own-name',
        label:
          'Accept the writ in your own name, on your own word rather than the record',
        outcome:
          '‘I’m the princess who is here,’ Char says, and signs. The Chamberlain declares the signature contestable before the ink is dry, and the court will spend weeks arguing it. But the doors open now, and forty families come up the steps dripping. Gorse keeps his shell and his post, and growls approval.',
        flag: 'writ-accepted-own-word',
        effects: { trust: 1, danger: 2 },
        artSubject:
          'Char in black lace signs a bark scroll on the throne-room steps as soaked families stream through opening doors and a wolf in a whelk shell growls at a fuming chamberlain',
      },
      {
        id: 'read-it-aloud',
        label:
          'Ask Gorse to read the writ aloud so the whole court hears it without anyone taking it',
        outcome:
          'Gorse reads it in his road voice, every clause, and nobody can pretend afterwards they did not hear. Under Briar law, though, a writ read but not received is unanswered, and the families wait another tide in the station while clerks find a precedent. The record of the reading, at least, cannot be eaten.',
        flag: 'writ-read-aloud',
        effects: { evidence: 2, supplies: -1 },
        artSubject:
          'A grey wolf inside a whelk shell reads a bark scroll aloud in a coral throne room as courtiers and clerks scribble, Char with dark violet scales leaning on a pillar listening',
      },
    ],
  },
  '4,2': {
    title: 'Half a Genealogy',
    speaker: 'Char and the treasury eel',
    kind: 'treasure',
    opening:
      'In the treasury behind the throne, a ledger eel has eaten its way through the royal genealogy. On half the rolls Char’s name is gone, leaving a neat bite-shaped hole beside Scylla’s; on the other half it is still there, written in three different hands. The eel lies coiled around a chest of silver naming seals, too full to move, Char’s name glowing faintly through its belly. Scylla wants the name pulled out by the tail and stitched back onto every roll so nobody can question her sister again. Char looks at the holes, then at the eel, then at her own name inside something else.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, kneels in a treasury of scroll racks beside a gorged ink-dark eel coiled around a chest of silver seals, her own name glowing faintly through its belly, while torn genealogy rolls float overhead',
    choices: [
      {
        id: 'reclaim-chosen-rolls',
        label: 'Ask the eel for your name back, only for the rolls you choose',
        outcome:
          'Char picks four rolls: the nursery roll, the sea-road roll, and two that only matter to her. The eel gives the name back in a slow inky ribbon and slides off the chest. Char takes one silver seal for her trouble. The registrar calls her half-documented, which she decides to have embroidered on something.',
        flag: 'genealogy-chosen-rolls',
        effects: { supplies: 1, evidence: 1 },
        artSubject:
          'A ribbon of glowing ink letters unspools from an eel’s mouth onto a single scroll held by Char in black lace, a silver naming seal in her other hand and a chest open beside her',
      },
      {
        id: 'pin-testimony-card',
        label:
          'Leave the gaps and pin a card beside each roll in your own hand',
        outcome:
          'Each card says the same thing: Char was here and wrote this herself. It is not a name on a roll, and the court cannot file it. Scylla reads every one, and stops arguing on the ninth. The eel keeps the old name. Someone with access to the treasury will try to feed it the cards by morning.',
        flag: 'genealogy-testimony-cards',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Char with dark violet scales pins handwritten cards beside bite-holed scrolls on a treasury rack while her aquamarine twin reads them one by one and a sated eel dozes on a silver chest',
      },
    ],
  },
  '5,2': {
    title: 'The Searchlight Sergeant',
    speaker: 'Char and Sergeant Lute',
    kind: 'monster',
    opening:
      'Sergeant Lute has guarded the throne-room gallery for twenty years, and the court fastened a Hoshimori lantern to his collar when the flood brought them in, so he could be a living searchlight for runaways. The lantern has swollen into a red jellyfish of paper and flame, trailing stinging threads, and it pulls him wherever anyone is hiding. Tonight it drags him toward Char, because one standing order still says find the princesses who leave. Lute is apologising through his teeth. The jelly is not. Its threads lash the gallery tapestries alight, and the courtiers scatter.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, braces in a coral gallery as a huge red jellyfish made of paper lantern and flame drags an apologetic armoured mer-guard toward her on stinging threads, tapestries smouldering behind them',
    choices: [
      {
        id: 'cut-the-tether',
        label:
          'Wrestle the lantern-jelly off his collar before it reaches anyone hiding',
        outcome:
          'Char grabs the threads bare-handed, gets stung down both arms, and saws the tether against a gallery sconce until it parts. The jelly flees glowing into the palace dark, lighting up three hiding places on its way. Lute sinks to the floor, free, and immediately goes after it to warn whoever it finds.',
        flag: 'searchlight-tether-cut',
        effects: { danger: 2, trust: 1 },
        artSubject:
          'Char in black lace saws a glowing stinging thread against a coral sconce, welts rising on her arms, as a red lantern-jellyfish tears free from an armoured guard’s collar',
      },
      {
        id: 'ask-the-sergeant',
        label:
          'Ask Lute what he wants the light to do, then rework it together',
        outcome:
          'Lute wants it to shine only when he calls for help himself. It takes Char’s last spool of lace thread and an hour of being stung at the wrists to retie the wick. The jelly shrinks to a dim red bead on his collar. The court will notice its searchlight has gone dark, and blame the princess.',
        flag: 'searchlight-reworked',
        effects: { trust: 1, evidence: 1, supplies: -1 },
        artSubject:
          'An armoured mer-guard holds still while Char with dark violet scales ties lace thread around a shrinking red lantern bead on his collar in a dim coral gallery',
      },
    ],
  },
  '6,2': {
    title: 'The Well Beneath the Throne',
    speaker: 'Char, Scylla and the Tide Oracle',
    kind: 'dungeon',
    opening:
      'Behind the throne a slab has slid aside, and a spiral well drops into the dark: the Court’s sealed Well of Records, where every version of the sisters’ first escape night has been shelved and locked. A Tide Oracle conch sits at its lip like a doorkeeper. ‘Whoever descends,’ it intones, ‘will come out belonging to someone.’ The court cannot rule on Char without what is down there, and Scylla says the splinters of rewritten history are pooling in the lowest shelves like silt. Char looks down. Cold water breathes up at her, smelling of old paper and lamp oil.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, peers down a dark spiral well opening behind a coral throne, a glowing conch perched on its lip and Scylla with aquamarine scales and a pearl circlet holding a lamp beside her',
    choices: [
      {
        id: 'descend-by-choice',
        label:
          'Tell the oracle you go down by your own choice, with Scylla as witness, not guardian',
        outcome:
          'Char says it to the conch word for word, and Scylla repeats only the part about being a witness. The oracle has nothing filed for that and falls silent. They tie a single line to the throne and start down together, Scylla careful to swim a stroke behind, not ahead. The silence follows them down like a debt.',
        flag: 'well-descent-own-choice',
        effects: { trust: 1, danger: 1 },
        artSubject:
          'Two mermaid sisters, one dark violet in black lace leading and one aquamarine with a lamp following a stroke behind, descend a dark spiral well on a single rope past a silent conch',
      },
      {
        id: 'test-the-oracle',
        label:
          'Check the oracle’s past predictions against the court logs before going down',
        outcome:
          'Char spends an hour with the court logs and finds the conch has been wrong nine times in ten about who would belong to whom. She chalks the tally on the well’s lip where every courtier will see it. They descend late and short of lamp oil, but the doorkeeper’s voice has lost its weight.',
        flag: 'well-oracle-tallied',
        effects: { evidence: 2, supplies: -1 },
        artSubject:
          'Char in black lace chalks a long tally of crossed-out marks on the stone lip of a spiral well beside a sulking conch, a stack of court logs open at her elbow',
      },
    ],
  },
  '7,2': {
    title: 'Sold Only as a Set',
    speaker: 'Char and Madam Coralline Thrupp',
    kind: 'merchant',
    opening:
      'The throne-room cloakroom has become a shop. Madam Coralline Thrupp, court dress-merchant, has hung a black velvet coat and a formal pearl crown on one stand under a sign that reads ROYAL SET, ONE HISTORY, NOT SOLD SEPARATELY. The coat smells like Char’s favourite kelp smoke. The crown is the one the court made both sisters wear for portraits. Thrupp insists they came in together and must go out together, because a set that has been split is worth nothing to collectors. Scylla is already opening her purse. Char puts a hand over it before she can.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, stops her aquamarine twin from opening a purse in a coral cloakroom shop where a black velvet coat and a pearl crown hang together on one stand before a fussy merchant with pins in her mouth',
    choices: [
      {
        id: 'split-the-price',
        label: 'Split the price with Scylla and carry the set out together',
        outcome:
          'They pay half each, counting pearls into Thrupp’s palm in turns. It nearly empties both purses. Thrupp wraps the set in one cloth and tells them, sniffing, that history is cheaper when shared. Scylla carries the crown. Char carries the coat. Neither offers to swap.',
        flag: 'royal-set-split-price',
        effects: { supplies: -2, trust: 1 },
        artSubject:
          'Two mermaid sisters, dark violet and aquamarine, count pearls in turns into a merchant’s palm as she wraps a velvet coat and a pearl crown together in one cloth',
      },
      {
        id: 'haggle-coat-alone',
        label:
          'Haggle for the coat alone and let the crown go to another buyer',
        outcome:
          'Char argues for twenty minutes and wins the coat at half price by pointing out the cuffs are chewed. Thrupp sells the crown on the spot to a relic collector who promises to display it under a portrait of the twins. Scylla watches it go and says nothing. Char wonders, later, which of them that cost more.',
        flag: 'royal-set-coat-only',
        effects: { supplies: -1, evidence: 1, trust: -1 },
        artSubject:
          'Char in black lace holds up a velvet coat with chewed cuffs as a gleeful relic collector carries away a pearl crown and her aquamarine twin looks after it',
      },
    ],
  },
  '8,2': {
    title: 'The Throne Has a Keyhole',
    speaker: 'Char and the Chamberlain',
    kind: 'puzzle',
    opening:
      'Under the cushion of the throne there is a keyhole, and the Anchor Key has followed Char up from the station to sit in it, purring. The Chamberlain explains it brightly: turn the key and the court’s case about which princess exists will close forever, and the cost will be moved somewhere it will not trouble anyone important. The key’s shaft is engraved with a ledger of who pays, but the lowest lines are worn smooth by a century of thumbs. Char runs her own thumb along them. She can feel letters there, faint as gill-scars, and the Chamberlain is reaching for the bow of the key.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, runs her thumb along the worn engraved shaft of a barnacled anchor key set in a keyhole beneath a coral throne cushion as a gold-buttoned chamberlain reaches eagerly toward it',
    choices: [
      {
        id: 'take-a-rubbing',
        label:
          'Take an ink rubbing of the worn lines before anyone turns the key',
        outcome:
          'Char presses kelp paper to the shaft and rubs it with squid ink. The worn lines surface: the names of eight palace kitchen staff, already chosen, never told. The Chamberlain confiscates the throne cushion in a fury but not the rubbing, which is tucked in Char’s satchel. The key stays unturned, and the court case stays open.',
        flag: 'throne-key-rubbing',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'Char in black lace peels a sheet of kelp paper from an anchor key’s shaft revealing a column of dark names in squid ink while a chamberlain snatches away a throne cushion',
      },
      {
        id: 'announce-the-price',
        label:
          'Announce to the whole court what turning the key would cost before anyone touches it',
        outcome:
          'Char climbs onto the throne’s arm and tells the court that a closed case is being bought with someone else’s tide. Half the courtiers are appalled; the other half want to know whose. The Chamberlain withdraws his hand. Nobody turns the key, but the kitchens empty by nightfall as the staff work out it might be them.',
        flag: 'throne-key-price-announced',
        effects: { trust: 1, danger: 1, supplies: -1 },
        artSubject:
          'Char with dark violet scales stands on the arm of a coral throne addressing a crowd of courtiers as a chamberlain draws back his hand from an anchor key',
      },
    ],
  },
  '1,3': {
    title: 'Crate Nineteen, One Mirror',
    speaker: 'Char and Oren',
    kind: 'treasure',
    opening:
      'Oren’s Flooded Archive is a cavern of crates stacked to the ceiling and slowly tilting in the current. Oren has his original inventory nailed to a post, every line in his blocky hand, and crate nineteen reads: one mirror, two-faced, contents correct. Inside, the mirror shows Char twice, and each face has a folded witness statement tucked into its frame. One is dated three years before Char hatched. The other is dated tomorrow. Oren holds the lid and does not look at the glass. ‘I do not change dates,’ he says. ‘But I will not file you without you.’ The frame is studded with pearls.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, lifts two folded statements from the frame of a pearl-studded two-faced mirror packed in an open crate, while Oren, a towering hooded headsman with an axe and a leather apron of pouches, holds the lid and keeps his eyeholes turned away',
    choices: [
      {
        id: 'label-with-dates',
        label:
          'Help Oren archive both statements with their impossible dates left intact',
        outcome:
          'They label each statement exactly as written, impossible dates and all, and shelve them side by side under REAL, UNRECONCILED. Oren pays Char in two loose pearls from the frame, by his rules a fair rate for an hour’s sorting. The mirror goes back into its crate still showing both faces, and the archive keeps a little more of the contradiction than it can carry.',
        flag: 'mirror-crate-dates-kept',
        effects: { evidence: 1, supplies: 1 },
        artSubject:
          'A hooded headsman and Char in black lace slide two labelled statements onto a high archive shelf among tilting crates, a pearl-studded mirror glinting in an open box below',
      },
      {
        id: 'write-own-label',
        label:
          'Write your own label for the crate, saying only what you can vouch for',
        outcome:
          'Char writes: The person reading this is Char, and she would like her mirror back eventually. Oren nails it to the crate under his inventory line without comment. The two statements stay unread. Later, in the dark of the stacks, Char wonders what tomorrow’s one says, and does not go back to look.',
        flag: 'mirror-crate-own-label',
        effects: { trust: 2, evidence: -1 },
        artSubject:
          'Oren the hooded headsman nails a handwritten card to a crate lid with one blow of a mallet while Char with dark violet scales watches with her arms crossed in a dim flooded archive',
      },
    ],
  },
  '2,3': {
    title: 'The Unwritten Corridor',
    speaker: 'Char, Oren and Grandmother Suiren',
    kind: 'monster',
    opening:
      'A crate in the archive’s far aisle has burst open, and Vesper’s paper refuge map has drifted out, moth-dust seal still bright: a corridor through living coral to a hiding place nobody was ever allowed to print. Vesper’s note on the back reads, Only walk it if they let you. The paper shows the path only a few strokes at a time. Between Char and the corridor squats the Tally Gate, a coral turnstile swollen into a crab the size of a cart, which has learned that every Earth journey must be logged and every tail counted as cargo. It clacks its claws and demands the full route, written down, before anyone passes. Somewhere beyond it, under the coral, people are breathing very quietly.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, holds a moth-dust-sealed paper map in a flooded archive aisle facing a cart-sized crab grown from a coral turnstile, its claws clacking around a counting dial, while Oren, a towering hooded headsman with an axe and apron of pouches, braces behind a stack of crates',
    choices: [
      {
        id: 'jam-the-tally-gate',
        label:
          'Jam the Tally Gate’s counting claws and carry the map through unlogged',
        outcome:
          'Oren hands Char a crate bar and she rams it between the claws while he lashes them shut. The crab thrashes, and three stacks of witness crates topple into the current and are lost. The counting dial cracks open, spilling half-logs of other travellers that Oren burns on the spot. Char swims the corridor with the map unrecorded and the archive in ruins behind her.',
        flag: 'sea-unwritten-map-by-confrontation',
        effects: { danger: 2, evidence: 1 },
        artSubject:
          'Char in black lace rams an iron crate bar between the snapping claws of a giant coral-turnstile crab while a hooded headsman lashes them with rope and crates tumble into the dark current',
      },
      {
        id: 'ask-the-residents',
        label:
          'Call softly past the gate and ask the people at the end whether you may walk their path',
        outcome:
          'Grandmother Suiren, an old river-spirit with a lily on her head, comes to the gate herself and tells it the corridor is her household and needs no counting. The crab has no rule against a householder. She lets Char in for one walk only, guiding her by the wrist. The map shows exactly what Suiren consents to and nothing more. Char pays the gift back in her last bundle of dried kelp.',
        flag: 'sea-unwritten-map-by-consent',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'An old river-spirit woman with a lily on her head leads Char by the wrist through a narrow living-coral corridor lit faintly by a paper map that reveals only a few strokes of path',
      },
      {
        id: 'give-a-sealed-count',
        label:
          'Let Oren hand the gate a sealed tally of how many passed, never where they went',
        outcome:
          'Oren builds a tally crate on the spot: numbers in, no directions, sealed with his own wax. The crab chews the count, satisfied, and lets Char by. The map comes with her. But a count is still a fact, and anyone who reads that seventeen people passed into a blank corridor will know someone is hiding there.',
        flag: 'sea-unwritten-map-sealed-tally',
        effects: { evidence: 1, trust: 1, danger: 1 },
        artSubject:
          'A hooded headsman presses his wax seal onto a small tally crate held out to a giant coral crab while Char with dark violet scales slips past its claws clutching a paper map',
      },
    ],
  },
  '3,3': {
    title: 'A Witness Not Yet Born',
    speaker: 'Char, Gorse and Oren',
    kind: 'challenge',
    opening:
      'Gorse has carried a Briar statement all the way to the archive, and now he will not hand it over. It is a witness account of the flood, dated last month, signed by a Briar woodcutter who, by the dates on the seal, will not be born for three more years. In the forest that makes it a forgery and the courier who delivers one loses his road. Oren’s inventory lists it as genuine, received, crate twelve. Wolf and headsman stand nose to eyehole across a crate lid, both entirely right by their own rules. Char looks at the signature and recognises the woodcutter’s hand from a letter at the station.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, stands between a grey wolf inside a whelk shell and a towering hooded headsman with an axe, facing off across a crate lid holding a single sealed bark statement in a flooded archive',
    choices: [
      {
        id: 'vouch-for-the-hand',
        label:
          'Vouch for the handwriting yourself and take the statement into your own keeping',
        outcome:
          'Char says she has seen this hand on a letter today, and that is her testimony, not proof. Gorse accepts a princess’s word as a receipt under Briar custom, barely, and gives the statement up. Oren files it with its date untouched. If it turns out to be false, it is Char’s name on the receipt.',
        flag: 'unborn-witness-vouched',
        effects: { evidence: 1, danger: 1, trust: 1 },
        artSubject:
          'A grey wolf in a whelk shell slides a bark statement across a crate lid to Char in black lace as a hooded headsman writes a receipt with her name on it',
      },
      {
        id: 'hold-until-confirmed',
        label:
          'Ask Gorse to keep it until the woodcutter can confirm it in her own voice',
        outcome:
          'Gorse agrees, relieved, and tucks it back into his shell. Oren marks crate twelve PENDING and does not like it. The flood account stays out of every record, so the archive’s story of the drowned station has a hole precisely where a stranger’s honest witness should be. Someone may need it before the woodcutter is born.',
        flag: 'unborn-witness-held',
        effects: { trust: 2, evidence: -1 },
        artSubject:
          'A grey wolf tucks a bark statement deep into the spiral of his whelk shell while a hooded headsman chalks PENDING on an empty crate and Char watches',
      },
    ],
  },
  '4,3': {
    title: 'The Eel Who Eats Dates',
    speaker: 'Char, Oren and the archive eel',
    kind: 'merchant',
    opening:
      'The archive’s ledger eel has opened a shop on top of crate row nine and it trades in one thing. It will give back the names it swallowed from Oren’s manifest, but only in exchange for dates: it wants to eat the impossible dates off the witness statements, which would make the archive look reconciled and be quietly false. Oren has his inventory in one hand and his scales in the other, weighing it. ‘Eleven names for forty dates,’ he says. ‘Good trade. Bad record.’ The eel smiles with a mouth full of ink. Char counts what is left in her pouch.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, counts pearls from a pouch beside a towering hooded headsman holding brass scales, while a fat ink-dark eel lounges on a crate row like a shopkeeper, names glowing through its belly',
    choices: [
      {
        id: 'pay-in-sweet-ink',
        label: 'Pay the eel in sweetened ink and pearls instead of any dates',
        outcome:
          'Char empties her pouch and Oren adds three pots of sugared ink from his apron. The eel grumbles and coughs up the eleven names, sticky but whole. Every statement keeps its impossible date. Oren writes the names back into the manifest and looks at his empty apron pockets a long, mournful time.',
        flag: 'date-eel-paid-in-ink',
        effects: { supplies: -2, evidence: 1 },
        artSubject:
          'An eel coughs a ribbon of glowing names onto an open ledger as Char in black lace pours pearls onto a crate and a hooded headsman sets down empty ink pots',
      },
      {
        id: 'trade-copied-dates',
        label:
          'Feed the eel the dates from Oren’s spare copies and keep the originals untouched',
        outcome:
          'Oren has copies of everything. The eel eats the copies’ dates, cheerful, and returns the names. The originals stay true. But the archive now has two sets of every statement, one dated and one blank, and the blank set will be the one clerks find first because it looks tidier.',
        flag: 'date-eel-copies-fed',
        effects: { supplies: 1, evidence: -1, danger: 1 },
        artSubject:
          'A grinning eel nibbles the date lines off a stack of copied statements held out by a hooded headsman while Char hugs the original documents to her chest',
      },
    ],
  },
  '5,3': {
    title: 'The Diver in Crate Forty',
    speaker: 'Char and Ines, a night-shift diver',
    kind: 'puzzle',
    opening:
      'Crate forty is being followed. A red Hoshimori lantern hovers over it, tugging at its rope, and inside is a diver’s statement about the station flood written in a cramped hand and dated before its writer was born. Whoever she is, the lantern was fastened to her words without her say, and it will lead anyone to wherever she sleeps. The statement is signed with a drawing of a fish instead of a name. Char turns it over and finds a tide-chart margin: the night-shift times, the points by number, and a note about a brother who works days. She thinks of Teodor and his sister.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, kneels by an open crate reading a statement signed with a small fish drawing, a red paper lantern hovering over the crate on a taut rope in a dark flooded archive',
    choices: [
      {
        id: 'cut-the-crate-lantern',
        label: 'Cut the lantern off the crate before it can lead anyone to her',
        outcome:
          'Char saws the rope and lets the lantern drift up into the archive roof, where it bumps among the rafters, lost. The statement is safe and untraceable. It is also unconfirmed: without the light or a name, Oren cannot file it as testimony, and the account of the night shift sits in a crate marked UNKNOWN.',
        flag: 'crate-forty-lantern-cut',
        effects: { danger: -1, evidence: -1, trust: 1 },
        artSubject:
          'A red paper lantern drifts loose into the rafters of a dark archive as Char with dark violet scales holds a severed rope over an open crate',
      },
      {
        id: 'find-ines',
        label:
          'Work out her shift from the margin and ask Ines herself what she wants',
        outcome:
          'Char finds Ines at the end of her shift on point seven, exactly where the margin said. Ines wants the statement kept and the lantern gone, but only after she signs her name for herself. It costs Char a long swim and the lantern-tinker’s last good wick to make the light lead only back to the crate.',
        flag: 'crate-forty-ines-asked',
        effects: { trust: 2, evidence: 1, supplies: -1 },
        artSubject:
          'A tired night-shift diver with a harness signs a statement with a real name on Char’s held-out board beside a flooded set of track points under a dim lantern',
      },
    ],
  },
  '6,3': {
    title: 'Line Forty-Four: One Princess',
    speaker: 'Char, Oren and the Tide Oracle',
    kind: 'companion',
    opening:
      'A small Tide Oracle has wedged itself in Oren’s inventory post and is reading his list aloud like scripture. It stops at line forty-four, written the day Oren first came to the sea: one princess, sea, in custody of the headsman. ‘Thus every future Charybdis belongs to the man with the axe,’ the conch says, delighted. Oren goes completely still, the way he does when a crossing has gone wrong. He wrote it when the court gave orders. He has not reread it since. He holds the pen out to Char handle first. ‘Your line,’ he says. ‘Not mine.’',
    artSubject:
      'Oren, a towering hooded headsman with an axe and a leather apron of pouches, holds out a pen handle-first to Char, a sturdy goth mermaid with dark violet scales and black lace, beside an inventory post where a small glowing conch is wedged among nailed lists',
    choices: [
      {
        id: 'rewrite-line-44',
        label:
          'Strike the line and write in your own words what travelling with Oren means',
        outcome:
          'Char crosses it out, leaving it readable, and writes beneath: travelling with, by her choice, until she says otherwise. Oren reads it twice and nods once. The conch reads the new line aloud and finds it has no prophecy left. Oren checks the rope on her belt for the next crossing, as a companion, and they both pretend that is all it is.',
        flag: 'line-44-rewritten',
        effects: { trust: 2, danger: -1 },
        artSubject:
          'Char in black lace writes a new line beneath a crossed-out entry on a nailed inventory list while a hooded headsman watches and a small conch sits silent',
      },
      {
        id: 'annotate-line-44',
        label:
          'Leave the old line as history and add your dated objection beneath it',
        outcome:
          'Char adds: objected to, today, by the princess in question. Both entries stay. Oren says that is the better record and the worse thing to look at every morning. The conch keeps quoting the original to passers-by, who mostly stop reading before the note. Oren joins Char anyway, carrying the post on his back.',
        flag: 'line-44-annotated',
        effects: { evidence: 2, trust: 1, danger: 1 },
        artSubject:
          'A hooded headsman hefts a wooden inventory post onto his shoulder as Char with dark violet scales swims beside him past a conch still chattering at a row of crates',
      },
    ],
  },
  '7,3': {
    title: 'What the Lining Knows',
    speaker: 'Char and Scylla',
    kind: 'memory',
    opening:
      'In a crate labelled personal effects, royal, contested, the velvet coat and the pearl crown lie folded again, and pinned to the coat is a witness statement in handwriting very like Char’s, dated before she was born. The ink has run. Only three words are legible: I wore this. Scylla reaches for it and stops. Char turns the coat inside out instead. The lining is purple silk, badly stitched with skulls, and Char remembers doing every crooked stitch by eel-light in the nursery, at fourteen, furious about a portrait sitting. That memory is hers. The statement may not be.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, holds a black velvet coat inside out to show a purple silk lining crookedly embroidered with small skulls, beside an open crate holding a pearl crown and a run-ink statement, Scylla with aquamarine scales watching',
    choices: [
      {
        id: 'add-the-lining',
        label:
          'Tell Oren what you remember of the lining and add it to the record yourself',
        outcome:
          'Char dictates: lining stitched by Char, age fourteen, angry, skulls deliberate. Oren files it beside the run statement without deciding which explains the other. Scylla laughs at the word deliberate and then cries, briefly, and does not say why. Char lets her keep that reason.',
        flag: 'lining-memory-recorded',
        effects: { trust: 1, evidence: 1 },
        artSubject:
          'A hooded headsman writes a card beside a velvet coat with skull-stitched lining while Char in black lace gestures at the stitches and her aquamarine twin laughs with wet eyes',
      },
      {
        id: 'leave-it-sealed',
        label:
          'Put the statement back in the crate unread for whoever wrote it',
        outcome:
          'Char re-pins the statement and closes the lid. She takes the coat and leaves the crown. Whatever I wore this once meant, it belongs to its writer, and Char does not want to be told who that was by a crate. The archive’s record of the coat stays incomplete, and Scylla’s hand stays on the lid a moment too long.',
        flag: 'lining-statement-sealed',
        effects: { danger: -1, evidence: -1, supplies: 1 },
        artSubject:
          'Char with dark violet scales closes a crate lid on a folded statement and pearl crown, a velvet coat over her arm, while her aquamarine twin rests a hand on the lid',
      },
    ],
  },
  '8,3': {
    title: 'An Ordinary Tuesday, Crated',
    speaker: 'Char, Oren and the Anchor Key',
    kind: 'memory',
    opening:
      'The last crate in Oren’s archive holds an Earth photograph and the Anchor Key, which has wrapped its chain around the frame like a possessive cat. The photograph shows a kitchen sink full of dishes, two mugs drying on a rack beside it, and a small paper drawing held to a refrigerator by a magnet, half out of view. Oren’s inventory calls it witness statement, artist unknown. The key purrs that if Char turns it, it will tell her exactly who drew the picture, and charge someone for the answer. The light in the photograph is warm afternoon. Char finds she wants very badly to know.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, holds a framed photograph of a sink full of dishes, two drying mugs and a half-hidden fridge drawing, while a barnacled anchor key wraps its chain possessively around the frame in a crate',
    choices: [
      {
        id: 'challenge',
        label:
          'Refuse the key and leave the artist unnamed, because nothing here says who it was',
        outcome:
          'There is no evidence who made the drawing, Char tells Oren, and her own mind keeps trying to fill the blank anyway. She unhooks the chain finger by finger. The key sulks. Oren writes artist unknown, by choice in the inventory, and the photograph keeps its secret without anyone being charged for it.',
        flag: 'tuesday-artist-unnamed',
        effects: { evidence: 1, danger: -1 },
        artSubject:
          'Char in black lace unhooks a barnacled anchor chain link by link from a small framed kitchen photograph while a hooded headsman writes in an inventory ledger',
      },
      {
        id: 'hold',
        label:
          'Look at the dishes and mugs, and value the ordinary work someone did',
        outcome:
          'Two mugs. A full sink. Someone stayed long enough to make a mess together, and someone else meant to wash it. Char finds this steadier than any crown. She tucks the photograph away and leaves the key in the crate. It stays there, purring, waiting for someone less satisfied.',
        flag: 'tuesday-ordinary-valued',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Char with dark violet scales gazes softly at a small photograph of drying mugs and dirty dishes in warm light while a barnacled anchor key lies coiled in an open crate',
      },
    ],
  },
  '1,4': {
    title: 'Nettlefin’s Rescued Reflections',
    speaker: 'Char, Jory Kettle and Nettlefin',
    kind: 'merchant',
    opening:
      'The Briar wolf road has grown into the sea as a reef, and its thorns catch hulls the way bramble catches wool. Jory Kettle, a ferry deckhand from Earth who cannot swim, clings to an upturned rowboat in the thorns and shakes. Beside him a thorny pufferfish called Nettlefin has set up a stall of mirror shards, each one showing the version of the buyer who was rescued. A pearl a shard. Jory wants one so badly his teeth chatter. Char picks one up and sees herself in it twice, saved and not, and Nettlefin hurriedly says that one is defective.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, holds up a mirror shard showing two reflections at a reef stall run by a spiny pufferfish, while a terrified Earth deckhand in a life vest clings to an upturned rowboat caught in thorny coral above',
    choices: [
      {
        id: 'buy-jory-a-shard',
        label:
          'Buy Jory a shard so he can see himself safe long enough to let go of the boat',
        outcome:
          'Jory stares at the rescued face in the shard and stops shaking enough to let Char lift him free. It works. It also works too well: he trusts the shard more than his own fear afterward, and asks it, not Char, which way to swim. Nettlefin pockets the pearl and offers a loyalty discount.',
        flag: 'nettlefin-shard-bought',
        effects: { supplies: -1, trust: 1 },
        artSubject:
          'An Earth deckhand clutches a glowing mirror shard to his chest as Char in black lace lifts him free of a thorny reef and a pufferfish merchant counts a pearl',
      },
      {
        id: 'both-faces-or-none',
        label:
          'Demand Nettlefin sell every reflection honestly, both outcomes or none',
        outcome:
          'Char sweeps the shards together and turns them face out: saved and not, side by side. Nettlefin puffs up in outrage and closes the stall. Two other wrecked sailors, seeing both faces, decide the reef is no place to wait and swim for it, badly. Char pulls Jory loose herself, slowly, and he holds her hand rather than a mirror.',
        flag: 'nettlefin-both-faces',
        effects: { evidence: 1, danger: 1 },
        artSubject:
          'A spiny pufferfish puffs up furiously behind a stall of mirror shards turned to show paired reflections while Char with dark violet scales guides a frightened deckhand off a reef',
      },
    ],
  },
  '2,4': {
    title: 'The Thorn Gap Toll',
    speaker: 'Char and Jory Kettle',
    kind: 'puzzle',
    opening:
      'Where the reef road narrows, the wolves’ old forest stile has become a coral turnstile, and it has inherited the station’s fare rule. It reads every keel as a tail, every tail as unpaid baggage, and every boat that passes without paying gets caught on the thorns. Three dinghies hang in it already. Jory’s rowboat is next in the queue, though he is no longer in it. The turnstile’s arms are carved with the toll rule in Briar notches, and one notch is plainly newer than the others, cut with something like a ticket punch. Char swims a slow circle around the gate, counting arms.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, swims a slow circle around a coral turnstile overgrown with thorns where three small dinghies hang snagged, studying carved notches on its arms while an empty rowboat drifts toward it',
    choices: [
      {
        id: 'recarve-the-notch',
        label:
          'Find the newer notch and carve the toll rule back to what the wolves wrote',
        outcome:
          'The new notch turns out to be a ticket-punch hole meaning freight. Char fills it with reef putty and recarves the old Briar mark: way open to the lost. It takes hours and every tool she has, and the gate bites her twice. Then it lets the dinghies go, one after another, empty and whole.',
        flag: 'thorn-toll-recarved',
        effects: { evidence: 1, supplies: -2 },
        artSubject:
          'Char in black lace presses reef putty into a carved notch on a coral turnstile arm with a small knife as snagged dinghies begin to drift free of the thorns',
      },
      {
        id: 'lift-the-boats-over',
        label: 'Lift the boats over the gate by hand before more get caught',
        outcome:
          'Char hauls the rowboat up and over the thorns, then the dinghies, one by one, scraped raw along both arms. They are free tonight. The rule is untouched, and the next ferry through the gap will hang there exactly the same, with nobody to lift it.',
        flag: 'thorn-toll-boats-lifted',
        effects: { trust: 1, danger: 1, supplies: -1 },
        artSubject:
          'Char with dark violet scales heaves a rowboat over a thorny coral turnstile, her arms scraped, while dinghies she has already freed drift above in the green water',
      },
    ],
  },
  '3,4': {
    title: 'Gorse and the Warden',
    speaker: 'Char, Gorse and Old Thessaly',
    kind: 'companion',
    opening:
      'Old Thessaly, warden of the reef road, is a she-wolf with barnacles in her ruff and a voice like a gate dragging. She has kept her pack alive underwater by learning to breathe through thorn-roots, and she wants Gorse back in the pack, but as a proper wolf: shell off, letter delivered to the pack’s keeping, courier oath dissolved. Gorse curls deeper into his whelk. He has been a courier longer than he has been a pack wolf, and the shell is the only thing that has kept him dry inside. Thessaly looks at Char as if princesses are something that washes up after storms.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, floats beside a grey wolf curled in a whelk shell as a huge barnacled she-wolf with thorny roots trailing from her ruff looms over them on a coral road',
    choices: [
      {
        id: 'speak-for-the-shell',
        label:
          'Tell Thessaly that Gorse is a courier by his own oath and keeps his shell',
        outcome:
          'Thessaly snarls that a princess has no say on a wolf road. Char agrees, and says Gorse does. Gorse says it himself then, voice shaking. Thessaly lets him go with his shell and without her blessing. He joins Char, and the pack watches them leave in a long, unfriendly silence.',
        flag: 'gorse-joins-by-oath',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'A grey wolf in a whelk shell swims beside Char in black lace away from a coral road where a barnacled she-wolf and her pack stand watching in silence',
      },
      {
        id: 'let-them-settle-it',
        label:
          'Leave the two wolves to settle it between them, and wait at the edge',
        outcome:
          'Char swims off and waits, rude to nobody. It takes an hour. Gorse returns with his shell and a fresh pack-mark scored on it, and a promise to bring Thessaly news of every crossing. He joins Char, carrying more than one oath now, and complains about it constantly.',
        flag: 'gorse-joins-with-pack-mark',
        effects: { trust: 1, evidence: 1, supplies: -1 },
        artSubject:
          'A grey wolf with a fresh claw-mark scored on his whelk shell swims toward Char waiting at the edge of a thorny reef, a she-wolf visible far behind',
      },
    ],
  },
  '4,4': {
    title: 'Names in the Thorns',
    speaker: 'Char, Jory Kettle and the reef eel',
    kind: 'memory',
    opening:
      'The thorns have eaten Jory’s ferry, and a ledger eel has eaten the crew list. Thessaly counts the four missing deckhands as rescued, because in Briar a person carried off the road into the den is safe. Under the sea, the den is a thorn-cave with no air. The eel holds their names coiled in its belly, glowing, and Jory wants them back so he can shout them into the cave. Char remembers Scylla teaching her the palace rescue drill when they were small, shouting names at a hatchling pretending to drown in the fountain, and how much louder a name is than a whistle.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, hovers before a dark thorny cave mouth beside a frantic Earth deckhand while an ink-dark eel with four names glowing through its belly coils on the coral',
    choices: [
      {
        id: 'ask-jory-for-the-names',
        label:
          'Ask Jory which names he has the right to call, and recover only those',
        outcome:
          'Jory knows two of them well, one by a nickname, and one not at all. Char coaxes out only the three he can vouch for. They shout them into the thorn-cave together, and three voices answer, faint. The fourth name stays in the eel. Thessaly’s wolves dig toward the voices and glare at Char for doubting their den.',
        flag: 'thorn-names-vouched',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Char in black lace and an Earth deckhand shout into a thorny reef cave mouth as faint lights flicker inside and a coiled eel glows with one remaining name',
      },
      {
        id: 'shout-without-names',
        label:
          'Leave the eel alone and shout into the cave for anyone who can hear',
        outcome:
          'They shout, and keep shouting, until anyone who can hear is a long list. Four voices answer. The crew list stays in the eel and the ferry company will have no record of who was saved or by whom. The deckhands come out of the den counting each other instead, which is its own sort of registry.',
        flag: 'thorn-names-shouted',
        effects: { evidence: -1, trust: 1, supplies: -1 },
        artSubject:
          'Four soaked deckhands crawl out of a thorny reef cave into the arms of a weeping colleague as Char with dark violet scales holds the thorns apart',
      },
    ],
  },
  '5,4': {
    title: 'Thessaly’s Lantern on Jory',
    speaker: 'Char, Jory Kettle and Old Thessaly',
    kind: 'challenge',
    opening:
      'Thessaly has fastened a red Hoshimori lantern to Jory’s life vest with a strip of thorn, so her pack can find him if he drifts. It is kindly meant and it is a disaster: every reef predator for a mile now knows where the warm soft Earth person is. Two barracuda are already circling at the edge of the light. Jory cannot take the lantern off without tearing the vest, and without the vest he sinks. Thessaly will not hear of removing it. ‘A wolf marks what she protects,’ she says. Char measures the circle of barracuda and the length of the thorn.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, hovers protectively beside an Earth deckhand in a life vest with a glowing red paper lantern tied to it by a thorn strip, two barracuda circling at the edge of the lantern light over a reef',
    choices: [
      {
        id: 'tear-it-free',
        label:
          'Tear the lantern free and hold Jory up yourself through the dark',
        outcome:
          'Char rips the thorn loose, vest and all, and sends the lantern spinning into the barracuda like a lure. They follow it. Jory sinks into her arms, and she carries his whole weight for an hour of dark swimming while Thessaly howls that the princess has stolen her ward.',
        flag: 'jory-lantern-torn',
        effects: { danger: 2, trust: -1 },
        artSubject:
          'Char in black lace hurls a red lantern away into the dark as barracuda veer after it and she holds a sinking deckhand under one arm',
      },
      {
        id: 'ask-jory-what-signal',
        label:
          'Ask Jory what kind of signal he would want, then put it to Thessaly',
        outcome:
          'Jory wants a whistle, a thing he knows from ferry drills, not a light. Thessaly is insulted until Char points out a whistle is just a howl that fits in a pocket. Gorse finds one in his shell. The lantern comes off slowly, vest intact, and the barracuda lose interest. Thessaly keeps the lantern, sulking, as a trophy.',
        flag: 'jory-whistle-chosen',
        effects: { trust: 2, supplies: -1, danger: -1 },
        artSubject:
          'An Earth deckhand blows a small brass whistle while a barnacled she-wolf holds a dimmed red lantern in her jaws and Char with dark violet scales unpicks a thorn strip',
      },
    ],
  },
  '6,4': {
    title: 'What the Rescued Owe',
    speaker: 'Char and the reef oracle',
    kind: 'treasure',
    opening:
      'A Tide Oracle has grown into the thorns, its conch lip ringed with pearls the size of eyes, and it rules on rescues. Whoever is rescued, it says, belongs to the rescuer for as long as the tide runs. Thessaly’s pack loves this oracle. Jory, overhearing, goes pale and starts calculating what he owes a wolf. Then the conch turns its lip toward Char. ‘And every Charybdis is owed to whichever sister pulled her from the water.’ Scylla is not here to hear it. Char is glad, and then ashamed of being glad. The pearls around the lip are loose enough to pry.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, faces a large conch grown into thorny coral with eye-sized pearls ringing its lip, an anxious Earth deckhand clinging to a branch behind her and wolves watching from the reef',
    choices: [
      {
        id: 'unpick-the-ruling',
        label:
          'Challenge the oracle that rescue is a gift, not a purchase, and pry one pearl as proof',
        outcome:
          'Char tells the conch that being pulled from water is not a bill of sale, and pries one pearl loose while it is still sputtering. The pack watches the oracle fail to strike her. Jory laughs, shaky, and stops calculating. The wolves will be colder to Char now. The pearl is very fine.',
        flag: 'oracle-rescue-not-purchase',
        effects: { supplies: 2, danger: 1 },
        artSubject:
          'Char in black lace holds up a large pried pearl in front of a sputtering conch in thorny coral as an Earth deckhand laughs nervously and wolves glower',
      },
      {
        id: 'leave-the-pearls',
        label:
          'Leave the pearls and the ruling alone, and refuse to act from fear of it',
        outcome:
          'Char swims on without arguing and without taking anything. Jory follows, still worried about his debt, and Char tells him plainly she has decided for herself what she owes to whom, and he can do the same. He does not quite believe her. The oracle’s ruling stands on the reef, unrefuted.',
        flag: 'oracle-pearls-left',
        effects: { trust: 1, evidence: -1 },
        artSubject:
          'Char with dark violet scales swims away from a pearl-ringed conch on a thorny reef, an Earth deckhand following close and glancing back anxiously',
      },
    ],
  },
  '7,4': {
    title: 'The Coat That Holds Too Tight',
    speaker: 'Char and the Thorn-Coat',
    kind: 'monster',
    opening:
      'The black velvet coat has snagged on the reef and drunk Briar sap through its seams, and now it moves. It wraps itself around wrecked sailors to keep them warm, as a forest bramble wraps a lost child, and does not understand that underwater a hug that tight stops breathing. It has two deckhands in its sleeves already, and the pearl crown is caught in its collar like a buckle. The Thorn-Coat sways toward Char with a sound like velvet being stroked the wrong way. It seems to know her. The skull-stitched lining shows at the hem, turned outward.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, faces a looming animated black velvet coat bristling with coral thorns, its sleeves wrapped around two struggling deckhands and a pearl crown caught in its collar, its skull-embroidered purple lining showing at the hem',
    choices: [
      {
        id: 'cut-the-sleeves',
        label: 'Cut the sleeves open and drag the sailors out, coat or no coat',
        outcome:
          'Char slashes both sleeves with a reef knife. The coat shrieks like tearing silk and lets go, and the deckhands kick for the surface gasping. What is left of the coat drifts to the seabed in rags. The crown sinks with it. Char saved two strangers and ruined something of her own, and both are true.',
        flag: 'thorn-coat-cut',
        effects: { danger: 2, trust: 1, supplies: -1 },
        artSubject:
          'Char in black lace slashes the sleeve of a thorned velvet coat with a reef knife as two deckhands burst free toward the light and torn velvet drifts down',
      },
      {
        id: 'unpick-the-lining',
        label:
          'Unpick the lining stitches you remember, loosening the coat from inside',
        outcome:
          'Char knows every crooked stitch, and she pulls them in the order she sewed them. The coat goes slack around the sailors like a cat being reasoned with. It takes too long; one deckhand passes out and Char breathes for him. The coat survives, loose and lined with nothing, and the crown falls into her hands.',
        flag: 'thorn-coat-unpicked',
        effects: { evidence: 1, trust: 2, danger: 1 },
        artSubject:
          'Char with dark violet scales pulls a thread of skull-embroidered purple silk from the hem of a slackening thorned coat as a limp deckhand slides free of its sleeve',
      },
    ],
  },
  '8,4': {
    title: 'The Ferry on the Anchor',
    speaker: 'Char, Jory Kettle and Old Thessaly',
    kind: 'challenge',
    opening:
      'Jory’s whole ferry, the one he crewed before the flood, hangs from the end of the reef road, pinned to the coral by the Anchor Key. The key has wedged its fluke through the hull and offers, sweetly, to let the ferry go. Turn it, and the boat floats free. The key does not mention that the reef road is held together by the same lock, and that Thessaly’s pack breathes through thorn-roots that run through its shaft. Jory is already reaching. Thessaly has not noticed. Char reads the cost engraving on the shaft and sees thorn-marks where names should be.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, catches the wrist of an Earth deckhand reaching for a barnacled anchor key whose fluke pins a small ferry to a thorny reef, root-threads running from the anchor shaft to a distant wolf pack',
    choices: [
      {
        id: 'tell-both-sides',
        label:
          'Tell Jory and Thessaly together what turning the key would cost each of them',
        outcome:
          'Char explains it twice, once in wolf terms and once in ferry terms. Jory takes his hand back. Thessaly growls that the boat can rot. Nobody gets what they wanted, and the ferry stays pinned, but nobody pays a price they did not see. Jory weeps for the boat as if it were a person, and Thessaly lets him.',
        flag: 'ferry-cost-told-both',
        effects: { trust: 1, evidence: 1, danger: 1 },
        artSubject:
          'An Earth deckhand and a barnacled she-wolf face each other across a pinned ferry hull as Char in black lace stands between them pointing to an anchor shaft',
      },
      {
        id: 'search-the-roots',
        label:
          'Follow the root-threads to see who else is wired into the bargain',
        outcome:
          'The roots run past the pack to a hidden thorn hollow where six stranded merchildren have been sleeping on the breathing roots, rescued by Thessaly and never counted. Turning the key would have smothered them. Char tells Thessaly, who had forgotten. The ferry stays pinned, and Jory, seeing the children, never asks again.',
        flag: 'ferry-roots-searched',
        effects: { evidence: 2, supplies: -1, trust: 1 },
        artSubject:
          'Char with dark violet scales parts thorny roots to reveal a hollow of sleeping merchildren curled on glowing root-threads, a she-wolf behind her lowering her head',
      },
    ],
  },
  '1,5': {
    title: 'The Mirror of Last Mornings',
    speaker: 'Char, Vesper and Auntie Kagari',
    kind: 'memory',
    opening:
      'Red Hoshimori lanterns bob over the Lantern Tide Market, and under them merchants sell departures in bottles: the exact moment someone left a place, corked and labelled, still warm. Auntie Kagari, a one-eyed paper-lantern spirit with a merchant’s smile, keeps a mirror at the back of her stall that shows customers the last morning before they left home. It shows Char two mornings that do not match. Vesper, dusty-winged and silent, stands beside her and flinches when Kagari offers to bottle both. Char remembers one morning truly: hiding land-boots under the nursery bed with Scylla, giggling, planning a road. That one, at least, belongs to her.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, stands before a lantern-lit mirror at a market stall showing two different mornings, beside Vesper, a moth-folk cartographer with dusty grey wings and map cases, while a one-eyed paper-lantern spirit merchant holds up an empty glass bottle',
    choices: [
      {
        id: 'tell-vesper-the-boots',
        label:
          'Tell Vesper the morning you remember yourself, and refuse to have either bottled',
        outcome:
          'Char tells it plainly: the boots, the giggling, Scylla’s terrible plan for laces. She says nothing about the other morning because she cannot. Vesper listens like someone being handed something fragile. Kagari sighs and puts away the bottle. The mirror keeps both mornings showing, for anyone passing to wonder about.',
        flag: 'last-morning-told',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Char in black lace gestures as she talks while a moth-folk cartographer listens closely under red lanterns and a one-eyed lantern spirit sets an empty bottle back on a shelf',
      },
      {
        id: 'record-both-mornings',
        label:
          'Ask Vesper to sketch both mornings as unverified, side by side, for your own keeping',
        outcome:
          'Vesper sketches quickly and honestly, labelling neither. Kagari charges for the mirror time. Char folds the sketch into her satchel. It is a record of two possibilities she has not agreed to, kept by her rather than sold by someone else, and the only copy. Vesper looks as if drawing it cost them something old.',
        flag: 'last-morning-sketched',
        effects: { evidence: 2, supplies: -1 },
        artSubject:
          'A moth-folk cartographer with dusty wings sketches two small scenes side by side on one sheet as Char with dark violet scales watches over their shoulder under red lanterns',
      },
    ],
  },
  '2,5': {
    title: 'The Fast Lane for Tails',
    speaker: 'Char and Vesper',
    kind: 'challenge',
    opening:
      'The market gate is a coral turnstile that charges every tail as baggage, and the merchants have found a way to profit: they sell fast lanes, which are just other people’s routes around the gate, bottled and resold. A family from Pearl Station is stuck at the turnstile with no pearls and a newborn with a tail. Vesper’s wings are shaking, and not from cold. ‘Somebody mapped those side routes for the people who needed them,’ they say. ‘Now they’re a product.’ Vesper has a crowbar and a look Char recognises from mirrors. The turnstile arms are only coral. The rule behind them is older.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, puts a hand on the arm of Vesper, a moth-folk cartographer with trembling dusty wings holding a crowbar, at a coral market turnstile where a stranded family with a newborn waits and merchants sell bottles from a side stall',
    choices: [
      {
        id: 'repair-the-gate-rule',
        label:
          'Talk Vesper down and take the fare rule to the market elders to be changed',
        outcome:
          'The elders take two hours and a great deal of tea to agree that a newborn’s tail is not cargo. The family waits through all of it. When the turnstile finally rewinds, the fast-lane sellers lose their trade and swear at Char by name. Vesper puts the crowbar away and keeps their hand on it.',
        flag: 'fast-lane-rule-repaired',
        effects: { evidence: 1, trust: 1, supplies: -1 },
        artSubject:
          'Market elders in lantern-lit robes tap a tariff scroll as a coral turnstile rewinds and a family with a newborn passes through, Char and a moth-folk cartographer watching',
      },
      {
        id: 'smash-the-fast-lanes',
        label:
          'Let Vesper break the bottled routes so nobody can sell them again',
        outcome:
          'Vesper smashes the bottles one by one, and the stolen side routes spill out like smoke and vanish. The family slips through a gap in the chaos. The routes are gone for good, for the sellers and also for the next people who would have needed them. The merchants call the wardens.',
        flag: 'fast-lane-bottles-smashed',
        effects: { danger: 2, trust: 1 },
        artSubject:
          'A moth-folk cartographer swings a crowbar through a shelf of glass bottles spilling silver smoke while Char ushers a family with a newborn through a gap under red lanterns',
      },
    ],
  },
  '3,5': {
    title: 'A Route Is Not a Letter',
    speaker: 'Char, Gorse and Auntie Kagari',
    kind: 'treasure',
    opening:
      'Gorse finally reveals what is in the second Briar letter: not words but a pressed thorn-route, a living path the forest grew to bring its strays home. Auntie Kagari has smelled it from three stalls away. She offers a fortune for it, an entire shelf of bottled departures and a purse of red pearls, enough to feed the party for a month. It would sell beautifully, she says. Everyone wants a way home. Gorse looks at Char, then at the purse, and his ears go flat. The letter is addressed to a Briar family hiding somewhere in this market.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, stands beside a grey wolf in a whelk shell holding a pressed living thorn-route, while a one-eyed paper-lantern spirit merchant offers a shelf of glowing bottles and a heavy purse of red pearls',
    choices: [
      {
        id: 'find-the-family',
        label:
          'Turn down Kagari’s fortune and search the market for the family it was meant for',
        outcome:
          'It takes a full lantern-cycle of searching. The family is hiding under a noodle stall, three children and a grandmother, and they cry when they smell the thorns. Char gets nothing for it but a bowl of noodles. Kagari, insulted, raises her prices for the party for the rest of the market.',
        flag: 'thorn-route-delivered',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'A Briar family huddled beneath a noodle stall reaches for a pressed thorn-route held out by a wolf in a whelk shell while Char in black lace keeps watch',
      },
      {
        id: 'take-a-token-fee',
        label:
          'Accept a small fee from Kagari for escorting Gorse safely through her market',
        outcome:
          'Kagari pays for safe passage instead of the route, a handful of pearls and her silence. Gorse delivers the letter himself. It is not a sale, but it is close enough that Vesper will not look at Char for an hour, and Kagari now knows exactly which family Gorse went looking for.',
        flag: 'thorn-route-escort-fee',
        effects: { supplies: 2, danger: 1 },
        artSubject:
          'A one-eyed lantern spirit counts red pearls into Char’s palm as a wolf in a whelk shell pads away into the crowded lantern market',
      },
    ],
  },
  '4,5': {
    title: 'The Moray Who Knows Who Left',
    speaker: 'Char, Vesper and the market moray',
    kind: 'monster',
    opening:
      'The market’s ledger eel has eaten so many receipts that it has become a moray the length of a street, and it knows the name of everyone who ever bought a bottled departure. It hunts them now, through the stalls, sniffing for anyone whose name it holds, to collect the balance. A refugee boy named Ren is pressed flat behind Vesper’s map case. The moray’s belly glows with a hundred names, his among them. Vesper is reaching for the map case, ready to give up their own maps as bait. Char sees what that would cost and puts herself between the moray and the case.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, blocks a street-long moray eel whose belly glows with a hundred names, as a refugee boy hides behind the map case of Vesper, a moth-folk cartographer with dusty grey wings, under red lanterns',
    choices: [
      {
        id: 'fight-the-moray',
        label:
          'Fight the moray off in the open market so nobody has to feed it anything',
        outcome:
          'Char goes for its gills with a lantern pole and the market erupts. Stalls collapse, bottles burst, three departures leak away for good. The moray retreats into the deep under the market, wounded and furious, still carrying every name. Ren escapes, and so does the problem, and it knows Char’s face now.',
        flag: 'moray-driven-off',
        effects: { danger: 2, evidence: -1 },
        artSubject:
          'Char in black lace drives a lantern pole at the gills of a giant moray as market stalls collapse and glass bottles burst into silver smoke',
      },
      {
        id: 'ask-ren-first',
        label:
          'Ask Ren whether he wants his name coaxed out of the moray or left to vanish',
        outcome:
          'Ren wants it gone entirely, not returned, not written anywhere. Vesper helps Char brew a bitter tide-salt that makes the moray sick up only the name it is given. Ren’s name dissolves in the water like sugar. Ninety-nine names remain, and the moray, lighter now, goes back to hunting.',
        flag: 'moray-ren-released',
        effects: { trust: 2, supplies: -1, danger: 1 },
        artSubject:
          'A small refugee boy watches a single glowing name dissolve into the water as a moth-folk cartographer and Char hold out a steaming shell of brew to a sick-looking moray',
      },
    ],
  },
  '5,5': {
    title: 'The Courier Vesper Once Mapped',
    speaker: 'Char, Vesper and Haru',
    kind: 'challenge',
    opening:
      'A refuge courier named Haru dives through the market with a red lantern glued to her shoulder that she never agreed to carry, and Vesper goes grey under the wing-dust. They know the lantern’s pattern. It is the one their old childhood maps used to mark safe houses, and someone has been selling that pattern as a tracking charm. Every stall Haru passes lights up. ‘I made that,’ Vesper says, very quietly. ‘I was nine.’ Haru has not seen them yet. Vesper is reaching to tear the lantern off before she can ask questions.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, catches the wrist of Vesper, a moth-folk cartographer with dusty grey wings gone pale, as a determined refuge courier swims past through a lantern market with a red lantern stuck to her shoulder lighting stalls as she goes',
    choices: [
      {
        id: 'vesper-removes-it',
        label:
          'Help Vesper remove the lantern quickly, before Haru is tracked any further',
        outcome:
          'Vesper peels it off with a practised twist only its maker would know, and Haru spins round, startled and angry at being touched. The tracking stops. Haru demands to know how Vesper knew the catch, and Vesper tells her. Haru swims off without thanks, and with Vesper’s name, which she will repeat.',
        flag: 'haru-lantern-removed',
        effects: { danger: -1, trust: -1, evidence: 1 },
        artSubject:
          'A moth-folk cartographer twists a red lantern free from a courier’s shoulder as she whirls on them in anger and Char watches in a crowded lantern market',
      },
      {
        id: 'ask-haru-what-signal',
        label:
          'Stop Haru, let Vesper explain, and ask her what signal she would want instead',
        outcome:
          'It is the hardest conversation Vesper has had in years and it happens in public. Haru listens with her arms folded. She wants a signal only her own household can read, and Vesper builds it, unpaid, while she watches every fold. She does not forgive them. She lets them finish the work.',
        flag: 'haru-signal-chosen',
        effects: { trust: 2, evidence: 1, danger: 1 },
        artSubject:
          'A moth-folk cartographer folds a small new paper signal under the watchful glare of a refuge courier while Char sits between them at a lantern-lit market table',
      },
    ],
  },
  '6,5': {
    title: 'Bottled Futures, Two Pearls',
    speaker: 'Char and Auntie Kagari',
    kind: 'merchant',
    opening:
      'Kagari has a second trade under the counter: a Tide Oracle in a fish-tank that she taps for customers, bottling each prophecy for two pearls. Its best seller is a bottle labelled Who Owns You Next. Char has heard that one already, at the station and on the reef. Kagari slides a bottle across with Char’s name on the cork and a wink. ‘Everyone buys their own,’ she says. ‘It’s the most reassuring purchase in the market. Then you know.’ Vesper, beside Char, says nothing, but they have gone very still near anything that turns a person into a destination.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, regards a corked glass bottle with her name on the label pushed across a counter by a winking one-eyed paper-lantern spirit merchant, a glowing conch in a fish-tank behind the stall',
    choices: [
      {
        id: 'buy-and-pour-out',
        label: 'Buy the bottle and pour it out unread in front of the queue',
        outcome:
          'Char pays two pearls and uncorks it over the drain. The prophecy hisses out in bubbles, unheard. The queue stares. Several customers buy their own bottles and pour them out too, which Kagari finds both maddening and excellent for business. Char is down two pearls and up a reputation.',
        flag: 'future-bottle-poured',
        effects: { supplies: -1, trust: 1, danger: 1 },
        artSubject:
          'Char in black lace upends an uncorked bottle so a stream of silver bubbles spills down a market drain as a queue of customers watches in astonishment',
      },
      {
        id: 'challenge-the-tank',
        label:
          'Ask the oracle in the tank, in front of Kagari, how often its owners were right',
        outcome:
          'The conch admits, sulkily, that most of its futures never arrived. Kagari’s smile tightens. She stops selling that label for the day and charges Char for the question. The oracle, freed from the script, starts muttering weather reports, which turn out to be accurate.',
        flag: 'future-tank-questioned',
        effects: { evidence: 2, supplies: -1 },
        artSubject:
          'A sulking glowing conch in a fish-tank mutters bubbles as Char with dark violet scales leans on the counter and a one-eyed lantern merchant scowls',
      },
    ],
  },
  '7,5': {
    title: 'The Lock Sewn Into the Coat',
    speaker: 'Char, Scylla and Vesper',
    kind: 'puzzle',
    opening:
      'At the back of Kagari’s stall sits one bottle she will not sell, because she cannot open it. Inside is a bottled departure belonging to a family of six, and it is locked by a cipher split between two objects: a black velvet coat and a pearl crown, hung on a hook beside it. The seller who brought it said only the princesses would know. The crown’s pearls are set in a pattern Scylla goes pink to recognise, a court dance step. The coat’s lining is stitched with skulls Char put there herself, in an order that was always a code to her twin.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, turns a velvet coat inside out to read its skull-stitched lining while Scylla, her aquamarine twin with a pearl circlet, traces pearls on a crown, both beside a locked glowing glass bottle on a merchant’s hook, Vesper watching',
    choices: [
      {
        id: 'solve-it-together',
        label:
          'Read the cipher together with Scylla, skull for pearl, out loud',
        outcome:
          'Skull, step, skull, turn: it is the twins’ childhood code, the one for meet me at the stair. Scylla starts laughing halfway through and Char hates how good it feels. The bottle opens, the family’s departure flows home, and Kagari loses her best unsellable stock. The code is no longer private, because Vesper heard it.',
        flag: 'coat-cipher-together',
        effects: { trust: 2, evidence: 1, danger: 1 },
        artSubject:
          'Two identical mermaid sisters, dark violet and aquamarine, laugh as they call out a code over a velvet coat and pearl crown and a silver departure streams from an opening bottle',
      },
      {
        id: 'solve-it-alone',
        label:
          'Work the cipher out alone from the lining, keeping the code to yourself',
        outcome:
          'Char takes the coat into a quiet corner and works it out from her own stitches, slowly, getting it wrong twice. Scylla waits without helping, which is a kind of help. The bottle opens. The code stays Char’s. It costs most of the evening, and the family’s departure goes home late but goes home.',
        flag: 'coat-cipher-alone',
        effects: { evidence: 2, supplies: -1 },
        artSubject:
          'Char in black lace sits alone in a dim corner of a lantern market studying skull stitches on a velvet coat lining as a glass bottle glows open beside her',
      },
    ],
  },
  '8,5': {
    title: 'Vesper Offers the Wrong Price',
    speaker: 'Char and Vesper',
    kind: 'companion',
    opening:
      'At the far edge of the market a sea-gate stands locked, and the Anchor Key has followed the party to sit in it. Beyond the gate lies the way toward the drowned office and everything past it. The key names its price politely: one complete map of a private route, freely given. Vesper is already unbuckling their map case. ‘I have old ones,’ they say. ‘I owe the sea at least that much.’ Their hands are not steady. The maps in that case lead to people who never agreed to be paid as a toll. Char has never once been told her own price before it was charged.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, puts her hand over the clasp of a map case held by Vesper, a moth-folk cartographer with trembling dusty grey wings, before a locked sea-gate where a barnacled anchor key sits purring in the lock',
    choices: [
      {
        id: 'refuse-the-maps',
        label:
          'Refuse to let Vesper pay with anyone’s route, and look for another way through',
        outcome:
          'The key will not take anything else. They go the long way, through a collapsing kelp tunnel that costs a day and most of their lamp oil. Vesper is silent for hours and then says, ‘Thank you for not letting me.’ They join Char properly then, and fold the case shut with a cord.',
        flag: 'vesper-joins-maps-kept',
        effects: { trust: 2, supplies: -2 },
        artSubject:
          'A moth-folk cartographer ties a cord around a closed map case as they and Char in black lace swim into a dark collapsing kelp tunnel away from a locked sea-gate',
      },
      {
        id: 'ask-what-vesper-owes',
        label:
          'Ask Vesper what they actually owe, and to whom, before anything is paid',
        outcome:
          'Vesper answers honestly and at length. The debt is real, they say, and not owed to a key. They decide to carry one map to its refuge and ask its people what amends look like. The gate stays locked. Vesper joins Char with the case still heavy, the weight now something they chose.',
        flag: 'vesper-joins-debt-named',
        effects: { trust: 1, evidence: 1, danger: 1 },
        artSubject:
          'A moth-folk cartographer sits on a barnacled step beside Char with dark violet scales, talking quietly with one map held in their lap, a locked sea-gate behind them',
      },
    ],
  },
  '1,6': {
    title: 'The Monitor Squid',
    speaker: 'Char and Mara',
    kind: 'monster',
    opening:
      'The Drowned Office sits on the seabed exactly as it sat in its Earth city, cubicles and all, its computers sealed under bell-jars of glass and still running. Every screen shows research charts rewritten in shell-script and wave-glyphs. One bank of monitors has fused into a glass-bodied squid whose screens all show Char, two plotted lines diverging from one point: one line ends, one carries on. It drifts toward divers and holds them in front of the graph until they forget to breathe. Mara, Morrow’s colleague, is pinned under a desk with a water-cooler bottle over her head as a helmet. ‘That chart is right,’ she gasps. ‘So is the other one.’',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, confronts a glass-bodied squid made of fused office monitors showing two diverging plotted lines, in a flooded open-plan office of cubicles and bell-jarred computers, while a tired office researcher in a lanyard and a water-cooler bottle helmet hides under a desk',
    choices: [
      {
        id: 'smash-the-screens',
        label:
          'Break the squid’s screens so it can stop holding divers in front of the graph',
        outcome:
          'Char drives a stapler through the nearest screen and the squid recoils in a spray of glass and sparks. Mara scrambles free. The squid flees into the ventilation shafts half-blind, and its data goes with it: both lines, both histories, scrambled beyond recovery for anyone who needed the evidence later.',
        flag: 'monitor-squid-smashed',
        effects: { danger: 1, evidence: -2 },
        artSubject:
          'Char in black lace hurls a stapler into a cracking monitor screen as a glass squid recoils in a burst of sparks and a researcher scrambles out from under a desk',
      },
      {
        id: 'export-both-lines',
        label:
          'Help Mara copy both plotted lines to a drive while you keep the squid busy',
        outcome:
          'Char swims slow loops to hold the squid’s attention, letting it show her the graph over and over, which she hates. Mara plugs a drive into its side and copies both lines, labelled as two observed outcomes. The squid releases them both, satisfied it was finally read. Char is exhausted and dizzy, and Mara owes her a coffee in a world without coffee.',
        flag: 'monitor-squid-exported',
        effects: { evidence: 2, danger: 1, trust: 1 },
        artSubject:
          'A researcher with a water-bottle helmet plugs a small drive into the glowing side of a glass monitor squid while Char circles in front of its screens to hold its gaze',
      },
    ],
  },
  '2,6': {
    title: 'Badge Required, Tail Rejected',
    speaker: 'Char, Mara and Scylla',
    kind: 'challenge',
    opening:
      'The office lobby’s security turnstiles have become coral and kept their logic: badge in, one body, no baggage. They read every tail as unbadged freight and slam shut on it. Twenty merfolk sheltering from a current are trapped on the wrong side while the lobby floods faster. Mara can rewrite the access rules on the security terminal, but it will take an hour and she says honestly that the system might reject the change. Scylla can lay a court seal on the gate that will open it now, but she says honestly that a seal only lasts as long as she holds it. Both are right.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, floats between an office researcher typing at a flooded security terminal and Scylla, her aquamarine twin with a pearl circlet, raising a glowing seal, before coral security turnstiles holding back a crowd of merfolk in a rising-water office lobby',
    choices: [
      {
        id: 'back-maras-patch',
        label:
          'Back Mara’s rule change and hold the crowd calm while the terminal works',
        outcome:
          'Char talks the crowd through the hour with jokes, threats and one terrible song. The patch takes on the third attempt. The turnstiles now read tails as people, permanently, everywhere in the building. Two elders are hurt in the press before it works, and Scylla does not say she could have prevented that.',
        flag: 'turnstile-patch-backed',
        effects: { evidence: 1, trust: 1, danger: 1 },
        artSubject:
          'An office researcher punches a key in triumph as coral turnstiles swing open and Char in black lace waves a crowd of merfolk through a flooded lobby',
      },
      {
        id: 'back-scyllas-seal',
        label:
          'Ask Scylla to lay the seal now and hold the gate open while everyone passes',
        outcome:
          'Scylla lays the seal and holds it, shaking, while twenty merfolk pass. When she lets go the turnstiles slam back to rejecting tails, the rule untouched. Mara finishes her patch anyway, later, and notes in the log that both methods worked and neither was enough alone.',
        flag: 'turnstile-seal-held',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Scylla with aquamarine scales holds a glowing pearl seal against coral turnstiles with trembling arms as merfolk stream past and Char steadies her shoulders',
      },
    ],
  },
  '3,6': {
    title: 'Records Room B3',
    speaker: 'Char, Gorse and Mara',
    kind: 'dungeon',
    opening:
      'Gorse’s last letter is addressed, in bark-script, to Records Room B3, Drowned Office, and the stairwell door to the basement levels has been barred from inside with filing cabinets. Below are the flooded server rooms and paper stacks where the office kept its research, and Mara says the original datasets that predicted the collision are down there, along with whatever has nested in them. Water breathes cold through the gap under the door. Gorse’s hackles are up inside his shell. The letter’s seal is warm, as though someone below is waiting for it. Char puts her shoulder to the cabinets and feels something on the other side push back, gently.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, braces her shoulder against a stairwell door barricaded with filing cabinets marked B3 in a flooded office, beside a wolf in a whelk shell with raised hackles and a researcher holding rolled floor plans',
    choices: [
      {
        id: 'follow-maras-plans',
        label: 'Plan the descent from Mara’s floor plans and fire-exit routes',
        outcome:
          'Mara spreads soaked floor plans on a desk and marks every fire exit, sump and server rack in grease pencil. They go down through a service shaft instead of the barred door. It is slow and claustrophobic, and the plans are drawn for air, not water, but every exit is where Mara said.',
        flag: 'b3-floor-plans',
        effects: { evidence: 1, supplies: -1 },
        artSubject:
          'A researcher marks soaked floor plans with a grease pencil on a flooded desk as Char in black lace and a wolf in a whelk shell peer down a narrow service shaft',
      },
      {
        id: 'follow-gorses-nose',
        label:
          'Let Gorse follow the letter’s scent through the barred door, Briar fashion',
        outcome:
          'Gorse scents the seal, says the addressee is alive and frightened, and leads them straight through the barricade. Char shifts the cabinets aside. Whatever pushed back retreats ahead of them into the dark stacks. They go in fast and with no map, trusting a wolf’s nose in a building made for badges.',
        flag: 'b3-wolf-scent',
        effects: { trust: 1, danger: 2 },
        artSubject:
          'A wolf in a whelk shell sniffs at the gap of a half-open barricaded door as Char drags a filing cabinet aside and darkness spills out of the stairwell beyond',
      },
    ],
  },
  '4,6': {
    title: 'Participant Names in the Cables',
    speaker: 'Char and Mara',
    kind: 'puzzle',
    opening:
      'A ledger eel has nested in the office cable trays and eaten the participant list from Mara’s research study, the one with real names and the consent forms clipped to them. Mara is horrified twice over: the data is useless without consent records, and the names should never have been readable outside the study anyway. The eel’s belly glows with them. On the screen beside it sits the anonymised dataset, every participant a code number, and on the eel’s skin the names are arranged in the same order. Char sees the puzzle before Mara says it: the codes and the names can be matched by anyone patient enough.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, peers between a glowing eel coiled in office cable trays with names shining through its skin and a bell-jarred screen showing columns of code numbers, while an office researcher in a lanyard covers her mouth in dismay',
    choices: [
      {
        id: 'contact-participants',
        label:
          'Help Mara recover only the consent forms of participants she can reach and ask',
        outcome:
          'Mara and Char write to every participant the flood has not displaced. Nine reply and agree. The eel gives up only those nine consent forms, nothing else, and Char scrambles the order of the rest on its skin so the match cannot be made. The study loses most of its data. Mara says that is what the data deserves.',
        flag: 'study-consent-reasked',
        effects: { trust: 2, evidence: -1 },
        artSubject:
          'An office researcher reads a reply on a flooded screen as Char gently shuffles glowing names along the skin of a sleepy eel in a cable tray',
      },
      {
        id: 'close-the-study',
        label:
          'Record a statement with Mara closing the study, leaving the names with the eel',
        outcome:
          'Mara dictates a signed closure: data compromised by flood, consent unverifiable, results withdrawn. Char witnesses it. The eel keeps the names, and someone else could still read them off it, so Char rigs a lid on the cable tray. Years of Mara’s work end in a paragraph, and the record of why is complete.',
        flag: 'study-closed-on-record',
        effects: { evidence: 2, supplies: -1, danger: 1 },
        artSubject:
          'An office researcher signs a printed statement on a soggy desk while Char wedges a metal lid over a cable tray holding a glowing eel',
      },
    ],
  },
  '5,6': {
    title: 'Mara and the Unasked Lantern',
    speaker: 'Char and Mara',
    kind: 'companion',
    opening:
      'Mara has been living in the Drowned Office for days, breathing through a water-cooler bottle that a kindly yōkai enchanted, and a red Hoshimori lantern has been hovering at her shoulder the whole time. The same yōkai fastened it to her as a ward without asking. It glows every time she opens a door, which means everyone in the building knows when she is moving and where. Mara is practical about it. She has also started not opening doors. She wants to come with Char, because the people she studied are scattered across this sea and she owes them answers, and the lantern would follow.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, floats beside an office researcher in a lanyard and rolled sleeves breathing through an enchanted water-cooler bottle helmet, a glowing red paper lantern hovering at the researcher’s shoulder by a closed office door',
    choices: [
      {
        id: 'cut-maras-lantern',
        label: 'Cut the lantern loose so Mara can travel unseen',
        outcome:
          'Char snips the tether with Mara’s office scissors. The lantern drifts off sadly to find its yōkai. Mara opens a door for the first time in days and laughs. She joins Char, but without the ward the yōkai’s air charm on her bottle starts to fade by evening, and she will need it renewed soon.',
        flag: 'mara-joins-unlit',
        effects: { danger: 1, trust: 1, supplies: -1 },
        artSubject:
          'An office researcher with a water-bottle helmet pushes open an office door with delight as a red lantern drifts away and Char pockets a pair of scissors',
      },
      {
        id: 'ask-maras-signal',
        label:
          'Ask Mara what kind of signal she would choose, and find the yōkai to change it',
        outcome:
          'Mara wants a light that only shows if she presses a button, like the panic alarm in the office toilets. The house yōkai is offended, then intrigued, then delighted by buttons. It reworks the ward into a little red switch. Mara joins Char with her air charm renewed and the ward under her thumb.',
        flag: 'mara-joins-switched-ward',
        effects: { trust: 2, evidence: 1 },
        artSubject:
          'A small round house yōkai fits a tiny red switch to a researcher’s lanyard while Char with dark violet scales watches with amused folded arms',
      },
    ],
  },
  '6,6': {
    title: 'Forecast and Prophecy',
    speaker: 'Char, Mara and the Tide Oracle',
    kind: 'memory',
    opening:
      'In the office’s forecasting room, a Tide Oracle conch sits on a desk beside Mara’s probability model, and they are arguing about Char. The conch declares that every future Charybdis is possessed by someone. The model, on its bell-jarred screen, shows a wide fan of possible futures with no owner anywhere in the variables. Mara says the model is honest about what it does not know. Scylla, who has wandered in behind Char, says the conch is honest about what the sea believes. Char remembers being seven, standing in front of court astrologers while they read her future to the queen, and nobody once asking her a question.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, stands between a glowing conch on an office desk and a bell-jarred screen showing a wide fan of probability lines, with an office researcher and Scylla, her aquamarine twin with a pearl circlet, behind her',
    choices: [
      {
        id: 'ask-a-question-back',
        label:
          'Ask both the conch and the model a question about you, and answer it yourself',
        outcome:
          'Char asks, what does Char want next? The model returns an empty variable. The conch returns an owner. Char answers aloud: to finish this crossing and choose the next one. Mara adds the answer to the model as a new input, and Scylla watches her sister refuse to be forecast. The conch sulks.',
        flag: 'forecast-own-answer',
        effects: { trust: 1, evidence: 1, danger: 1 },
        artSubject:
          'Char in black lace speaks to a glowing conch and a probability screen as an office researcher types her words into the model and her aquamarine twin watches',
      },
      {
        id: 'turn-off-both',
        label:
          'Switch off the screen and cover the conch, and refuse to be read by either',
        outcome:
          'Char drapes an office jacket over the conch and turns off the monitor. The room goes dark and quiet. Mara protests that the model was useful for other things, and it was. It stays off. Scylla finds Char in the corridor afterwards and does not say anything, just sits beside her.',
        flag: 'forecast-both-off',
        effects: { danger: -1, evidence: -1, trust: 1 },
        artSubject:
          'An office jacket drapes over a conch on a desk beside a dark monitor while Char sits in a dim corridor and her aquamarine twin sits down beside her',
      },
    ],
  },
  '7,6': {
    title: 'Passenger Charybdis, Twice',
    speaker: 'Char, Scylla, Mara and the help-point inspector',
    kind: 'challenge',
    opening:
      'Under the office runs a subway interchange, and its station bell hangs in the drowned lobby, ringing on the half hour. Each time it calls two announcements in the same voice. Passenger Charybdis, please come to platform two. Passenger Charybdis, your train is held, please come to platform two. Earth transit rule says a passenger paged twice must answer at the help point, and until both answer, a flooded train of commuters is held in the tunnel. The help-point inspector, a brass automaton in a peaked cap, holds the velvet coat and the pearl crown as identification. Scylla stares at the second call and says it is for the Char she remembers. Char listens to her own name in a stranger’s mouth and decides what she will answer.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, looks up at a great brass station bell hanging in a flooded office lobby while a brass automaton inspector in a peaked cap holds a velvet coat and a pearl crown at a help point, Scylla with aquamarine scales beside her and an office researcher in a lanyard',
    choices: [
      {
        id: 'seize-the-bell',
        label:
          'Climb into the bell housing and hold the clapper against the inspector’s rule',
        outcome:
          'Char swims up and wraps both arms around the clapper. The inspector declares a security incident and rings every alarm the building has. The bell bucks against her for long minutes until its mechanism shears, and it comes down into her arms, silent, recovered by force. The held train is released by the failure, not by any answer, and the inspector logs Char as an obstructing passenger.',
        flag: 'sea-sister-bell-by-confrontation',
        effects: { danger: 2, evidence: 1 },
        artSubject:
          'Char in black lace clings to the clapper inside a great brass station bell as alarm lights flash red through a flooded lobby and a brass inspector automaton raises a whistle',
      },
      {
        id: 'answer-for-yourself',
        label:
          'Answer the first call in your own words, and let Scylla answer the second as her memory',
        outcome:
          'Char presses the help-point button. ‘This is Char. I’m here. I answer for what I know.’ Then she steps aside. Scylla presses it with a shaking hand and speaks about the sister she remembers, in her own words, as her own testimony. The inspector accepts two different witnesses. The bell rings once, clean, and lowers itself to Char. The train moves.',
        flag: 'sea-sister-bell-by-testimony',
        effects: { trust: 2, evidence: 1 },
        artSubject:
          'Scylla with aquamarine scales speaks into a help-point grille as Char in black lace stands aside listening, and a brass station bell lowers gently toward them',
      },
      {
        id: 'file-an-incident',
        label:
          'Have Mara file a transit incident: one passenger present, one call unresolved',
        outcome:
          'Mara knows transit forms. She files the incident on the help point: one passenger present and identified, one page unresolved, both kept on record. The inspector releases the train and lends the bell to Char pending review. It is recovered, but the second name stays open, and other stations will keep calling it.',
        flag: 'sea-sister-bell-incident-report',
        effects: { evidence: 2, supplies: -1, danger: 1 },
        artSubject:
          'An office researcher types on a flooded help-point screen as a brass inspector hands a station bell to Char and a held train’s lights begin to move in the tunnel beyond',
      },
    ],
  },
  '8,6': {
    title: 'The Key in the Server Rack',
    speaker: 'Char and Mara',
    kind: 'treasure',
    opening:
      'The Anchor Key has plugged its fluke into the office’s main server rack like a drive, and every screen in the building now shows a spreadsheet titled Crossing Cost Allocation. It lists who pays when the key is turned, ranked by how little anyone will notice. Mara scrolls it and goes white: the bottom rows are hidden, collapsed, and the visible rows are night cleaners, contract divers, two people from her own study. A backup drive glows in the rack beside the key, holding the unfiltered sheet. The key hums contentedly. It would like to be turned before anyone finishes reading.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, pulls a glowing backup drive from a flooded server rack where a barnacled anchor key is plugged in by its fluke, while an office researcher stares at a spreadsheet on a bell-jarred monitor',
    choices: [
      {
        id: 'print-the-full-sheet',
        label:
          'Take the backup drive and print the full sheet, hidden rows and all, for everyone',
        outcome:
          'Mara unhides every row and the printer, miraculously, works underwater. The full sheet goes up on every noticeboard: cleaners, divers, study participants, and at the very bottom, a row marked sisters, either. Nobody turns the key today. Several people on the list come looking for Char, frightened and furious, wanting to know why they were there.',
        flag: 'cost-sheet-printed',
        effects: { evidence: 2, danger: 1, supplies: 1 },
        artSubject:
          'Soggy printed spreadsheets pinned to an office noticeboard as frightened cleaners and divers gather to read them and Char in black lace holds a glowing drive',
      },
      {
        id: 'find-the-hidden-rows',
        label:
          'Search the building for the people in the hidden rows before showing anyone',
        outcome:
          'Char and Mara find them one by one: a night guard, two interns, a family sheltering in the mail room. Each is told privately and asked what they want done with their row. Two want it deleted, which the key refuses. The hidden rows stay hidden from the public. The drive goes into Char’s satchel, heavy.',
        flag: 'cost-sheet-rows-found',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Char with dark violet scales speaks quietly to a family huddled among mail sacks in a flooded office mail room while a researcher holds a drive and a list',
      },
    ],
  },
  '1,7': {
    title: 'The Mirror at the Two Moorings',
    speaker: 'Char and the boatmen',
    kind: 'puzzle',
    opening:
      'At the Sisters’ Escape Gate, where the palace wall meets open sea, two boats are moored. One is the little rowboat from the night the twins first planned to run, oars wrapped in kelp to keep them quiet. The other is a ferry with an Earth timetable stencilled on the bow, and its engine is idling. Between them stands a tall mirror broken cleanly in half, each half bolted to one boat’s mooring post, and each half shows Char at a different age stepping aboard. Two boatmen argue about which half to throw into the sea. The cracks still fit together perfectly.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, stands on a stone quay between a small kelp-wrapped rowboat and an idling Earth ferry, each mooring post bearing one half of a broken mirror showing a different Char stepping aboard, two boatmen arguing nearby',
    choices: [
      {
        id: 'rejoin-the-halves',
        label:
          'Unbolt both halves and fit the mirror back together with both reflections showing',
        outcome:
          'It takes Char, both boatmen and a great deal of swearing to lift the halves into one frame. When they meet, both reflections stay, side by side, neither dimmer. The boatmen stop arguing. The mirror is too heavy to move again, so it stands on the quay between the moorings, where everyone who boards will have to look at it.',
        flag: 'moorings-mirror-rejoined',
        effects: { evidence: 2, supplies: -1 },
        artSubject:
          'Char in black lace and two boatmen heave two mirror halves together into one frame on a stone quay, both reflections of Char showing side by side',
      },
      {
        id: 'tell-the-boatmen',
        label:
          'Leave the halves where they are and tell the boatmen in your own words who is boarding',
        outcome:
          '‘Neither of those,’ Char says. ‘Me, when I decide, and not yet.’ The boatmen accept that, being boatmen, and stop trying to throw anything away. The halves stay split on their posts. Each boat keeps its own reflection of her, and the quay keeps the argument, quieter now.',
        flag: 'moorings-own-words',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Char with dark violet scales stands with her hands on her hips addressing two boatmen on a quay between a rowboat and a ferry, two split mirror halves on the posts behind her',
      },
    ],
  },
  '2,7': {
    title: 'Fitch Punches Two Tickets',
    speaker: 'Char and Conductor Ottoline Fitch',
    kind: 'companion',
    opening:
      'Conductor Ottoline Fitch has come all the way from Pearl Station to the Escape Gate, shell-booth and all, because the gate’s coral turnstile has begun counting tails as baggage too and nobody here knows how to fix a tariff. Dulse is with her, holding her claw. Fitch has two tickets ready for punching, one for each boat. She will not punch either without the passenger’s say. ‘I punched tickets for forty years for people who were told where they were going,’ she says. ‘I would like to finish my career on someone who chose.’ The turnstile clacks behind her.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, faces an elderly hermit crab with a brass ticket-booth shell holding up two paper tickets and a punch, a small merchild holding her claw, beside a clacking coral turnstile at a sea gate with two boats beyond',
    choices: [
      {
        id: 'invite-fitch-along',
        label:
          'Invite Fitch to travel with you and fix the tariff at every gate you pass',
        outcome:
          'Fitch accepts before Char finishes the sentence and starts amending the gate’s tariff on the spot, legibly, with the old rule left showing. She leaves Dulse with the boatmen’s family, which Dulse protests loudly. Fitch joins Char with both tickets unpunched in her shell, waiting.',
        flag: 'fitch-joins-tariff-pen',
        effects: { trust: 1, evidence: 1, supplies: -1 },
        artSubject:
          'An elderly hermit crab writes on a tariff card fixed to a coral turnstile while Char in black lace waits and a small merchild protests from a boatman’s arms',
      },
      {
        id: 'fitch-takes-dulse-home',
        label:
          'Ask Fitch to take Dulse safely home and teach this gate the new rule on the way',
        outcome:
          'Fitch agrees, a little sadly. She punches neither ticket and gives both to Char to keep. She spends the evening teaching the turnstile, then takes Dulse back up the line. Char has no conductor for the gates ahead, and Dulse waves until she is out of sight.',
        flag: 'fitch-takes-dulse',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'An elderly hermit crab with a booth shell leads a waving merchild away along a coral tunnel as Char holds two unpunched tickets at a sea gate',
      },
    ],
  },
  '3,7': {
    title: 'Signed by Those Who Waited',
    speaker: 'Char and Gorse',
    kind: 'memory',
    opening:
      'Gorse’s final letter is addressed to Charybdis, at the Escape Gate. He delivers it at the mooring post with a wolf’s formality and backs away to let her read. It is signed by a long column of names Char does not recognise, people who say they waited at the tide gate in the drowned city. It does not say what they saw. It says only: it happened, someone paid, do not let anyone call it a mistake to be tidied away. Char reads it twice. Whatever her own story is, she remembers clearly promising Scylla in the nursery never to leave anyone behind on a stair. She holds the letter carefully.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, reads a long letter signed by a column of unfamiliar names at a stone mooring post by a sea gate, while a grey wolf in a whelk shell sits back formally, two boats moored beyond',
    choices: [
      {
        id: 'keep-as-their-testimony',
        label:
          'Keep the letter as their testimony, carried by you, without claiming it as your memory',
        outcome:
          'Char folds it into her satchel beside the photographs and tells Gorse she will carry it as theirs. She does not say whether she remembers the gate, because the letter did not ask her to. Gorse nods, his delivery complete, and his shell seems lighter. The names weigh about what names weigh.',
        flag: 'waited-letter-carried',
        effects: { trust: 1, evidence: 1 },
        artSubject:
          'Char in black lace folds a long letter into a worn satchel as a wolf in a whelk shell nods solemnly at a mooring post',
      },
      {
        id: 'read-it-to-the-quay',
        label:
          'Read the letter aloud on the quay so both boatmen and every passenger hear it',
        outcome:
          'Char reads every name. It takes a long time. The ferry’s captain takes off his cap. A passenger on the rowboat side asks what it means, and Char says she does not know all of it and will not pretend to. Some of the listeners are angry at being made to hear it, and the departures are delayed until dark.',
        flag: 'waited-letter-read-aloud',
        effects: { evidence: 2, danger: 1, supplies: -1 },
        artSubject:
          'Char with dark violet scales reads a long letter aloud on a crowded quay as a ferry captain removes his cap and passengers on both boats listen',
      },
    ],
  },
  '4,7': {
    title: 'The Ferryman’s Clean Manifest',
    speaker: 'Char and the ferry captain',
    kind: 'challenge',
    opening:
      'The ferry captain wants a clean departure. His manifest has a smear in the middle where someone’s ledger eel has been at it, and he has found the eel and bribed it: for a sack of sweet ink, it will eat every name associated with the tide gate from every record aboard. ‘So the present can sail without the past dragging the anchor,’ he says, reasonably. The eel is already gulping. Char sees lines of names vanishing off the posted passenger lists, names from the letter she carries among them. The captain is not cruel. He has simply decided that grief is a navigation hazard.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, grabs a sack of ink away from a ledger eel gulping names off a posted passenger list on a ferry’s gangway, while a weary ferry captain in a peaked cap holds up a smeared manifest',
    choices: [
      {
        id: 'make-it-a-memorial',
        label:
          'Make the eel give the names back onto a stone at the gate, not into any registry',
        outcome:
          'Char tips the sweet ink into the sea and offers the eel something better: a long smooth stone to rest on, if it leaves the names there. It does, sullenly. The names stay at the gate, outside every official record, readable by anyone who passes. The captain’s manifest stays smeared, and he sails late and unhappy.',
        flag: 'gate-names-memorial',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'An ink-dark eel curls on a long smooth stone at a sea gate as glowing names settle into its surface and Char watches with an empty ink sack',
      },
      {
        id: 'have-scylla-testify',
        label:
          'Stop the eel and ask Scylla to testify into the captain’s log what she witnessed',
        outcome:
          'Scylla gives her account in her own words, only her own, and the captain writes it into his log verbatim with a shaking pen. The eel is driven off half full. Some names are gone for good. What remains is one witness’s testimony, marked as hers, and the captain’s signature under it.',
        flag: 'gate-scylla-testimony',
        effects: { evidence: 2, supplies: -1 },
        artSubject:
          'Scylla with aquamarine scales and a pearl circlet speaks while a ferry captain writes in a logbook and Char shoos a half-full ink eel away from the gangway',
      },
    ],
  },
  '5,7': {
    title: 'A Beacon for Runaways',
    speaker: 'Char and Teodor',
    kind: 'treasure',
    opening:
      'Teodor the track diver has followed the party down the line, and he brings a gift: the red Hoshimori lantern that once dogged his shoulder, rebuilt by a tinker into a beacon that can light a single boat’s way through open water. Its light can be seen for miles. The rowboatman at the Escape Gate wants it at once, because it would let him guide runaways out at night. The ferry captain wants it too, to keep track of every boat leaving the palace. Teodor offers it to Char. He knows better than anyone that a light which guides can also follow.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, receives a glowing red reworked lantern beacon from a weary track diver in a patched harness on a stone quay, a rowboatman and a ferry captain both reaching toward it from either side',
    choices: [
      {
        id: 'give-it-to-the-rowboat',
        label:
          'Give the beacon to the rowboatman with a rule that only runaways may light it',
        outcome:
          'The rowboatman swears on his oars. He will guide the leaving, never report them. The ferry captain is furious and calls it smuggling. Char cannot enforce the oath once she has gone, and a beacon is a beacon to anyone watching the sea. Teodor nods, uneasy and proud.',
        flag: 'beacon-to-rowboat',
        effects: { trust: 1, danger: 1, supplies: -1 },
        artSubject:
          'A rowboatman lifts a red glowing lantern to the bow of a small kelp-wrapped boat as Char watches and an angry ferry captain shouts from the gangway',
      },
      {
        id: 'keep-it-dark',
        label:
          'Keep the beacon yourself, unlit, until someone leaving asks for it',
        outcome:
          'Char hangs it from her belt, dark. Neither boat gets it, so neither can track or guide with it tonight. It is heavy and catches on everything. Teodor says that is probably the right weight for a thing like that, and swims home.',
        flag: 'beacon-kept-dark',
        effects: { supplies: 1, evidence: 1 },
        artSubject:
          'Char with dark violet scales hangs an unlit red lantern from her belt on a stone quay as a track diver swims away and two boats wait in the dark',
      },
    ],
  },
  '6,7': {
    title: 'The Conch That Swallows Departures',
    speaker: 'Char and the Possessor’s Shell',
    kind: 'monster',
    opening:
      'Out past the moorings the Tide Oracle has grown monstrous, a conch the size of a chapel lying across the gate’s mouth, and it eats boats. It tells each one, as it swallows, who owns its passengers now: the captain, the court, the tide, the sister who remembers. Three dinghies are already inside it, their lanterns glowing through its walls. When Char approaches, its mouth turns toward her with a sound of stone grinding and it begins the list of her owners, very slowly, so that she can be afraid of every name in order. Scylla is behind her. Oren has a rope.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, faces a chapel-sized conch lying across a sea gate with the glowing lanterns of swallowed dinghies showing through its walls, while Scylla with aquamarine scales and a hooded headsman with a coiled rope wait behind her',
    choices: [
      {
        id: 'break-the-lip',
        label:
          'Have Oren rope the conch’s lip and pry it open while you swim in for the dinghies',
        outcome:
          'Oren anchors the rope to the gate and hauls. The lip cracks open by a body’s width and Char goes in, through the dark coils, dragging dinghies out one by one while the shell grinds on her ribs. All three come out. Char comes out last, bruised along one whole side, and the cracked conch keeps reciting her owners, unheard.',
        flag: 'possessor-shell-pried',
        effects: { danger: 2, trust: 1 },
        artSubject:
          'A hooded headsman hauls on a rope cracking open a giant conch’s lip as Char in black lace tows a small glowing dinghy out of the dark spiral',
      },
      {
        id: 'out-wait-the-list',
        label:
          'Sit in front of the conch and let it finish every name without flinching',
        outcome:
          'Char sits on the gate stones and listens to the whole list, an hour of owners. She does not answer one. At the end the conch has nothing left to say and, confused, spits out the dinghies to make room for more words. Char cannot stop shaking afterward. Scylla holds her hands, and asks first.',
        flag: 'possessor-list-outlasted',
        effects: { trust: 2, supplies: -1, evidence: 1 },
        artSubject:
          'Char with dark violet scales sits cross-tailed on gate stones before a giant conch as small dinghies tumble from its mouth and her aquamarine twin reaches for her hands',
      },
    ],
  },
  '7,7': {
    title: 'Coat for One Boat, Crown for the Other',
    speaker: 'Char and Scylla',
    kind: 'challenge',
    opening:
      'At the head of the quay the gatekeeper has hung the black velvet coat on the ferry’s post and the pearl crown on the rowboat’s. Whichever the passenger takes is her boarding pass: the crown for the remembered past, the coat for the possible present. Scylla has carried both of them this far. She stands between the posts and does not move toward either. ‘I know what I lost, or nearly lost, there,’ she says. ‘I won’t ask you to pretend it didn’t happen so I can feel better. And I won’t choose for you.’ Char looks from coat to crown to her sister, and takes her time.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, stands on a stone quay between two mooring posts, a black velvet coat hanging on the ferry post and a pearl crown on the rowboat post, while Scylla, her aquamarine twin with a pearl circlet, waits between them with empty hands',
    choices: [
      {
        id: 'take-the-coat',
        label:
          'Take the coat for yourself and leave the crown hanging as what was real',
        outcome:
          'Char puts on the coat. She leaves the crown on its post and tells the gatekeeper it is not to be thrown away or polished; it marks something that happened. Scylla touches it once as they pass. Char is not boarding yet, but she has chosen what she carries, and Scylla has to watch the crown stay behind.',
        flag: 'gate-coat-taken',
        effects: { trust: 1, supplies: 1, danger: 1 },
        artSubject:
          'Char in a black velvet coat walks down a quay as Scylla lays her fingertips on a pearl crown left hanging on a mooring post',
      },
      {
        id: 'leave-both-hanging',
        label:
          'Leave both on their posts as a shared memorial, and board neither yet',
        outcome:
          'Char tells the gatekeeper that neither is a ticket. They are both real things that belonged to two real sisters. The gatekeeper, flustered, has no rule for that and lets them stand. Char walks away cold without the coat. Scylla follows, and for the first time all day she cries openly in front of her sister.',
        flag: 'gate-both-memorial',
        effects: { trust: 2, supplies: -1, evidence: 1 },
        artSubject:
          'A black velvet coat and a pearl crown hang on two mooring posts at a sea gate as Char and her weeping aquamarine twin walk away together along the quay',
      },
    ],
  },
  '8,7': {
    title: 'Passage at a Shifting Price',
    speaker: 'Char and the ferry purser',
    kind: 'merchant',
    opening:
      'The ferry’s purser runs a ticket window at the end of the quay and the Anchor Key hangs from the window grille on a chain, serving as the till. Every fare is paid by turning it a notch, and each notch shifts a little of the crossing’s cost from the passenger to someone ashore. The purser has stopped asking who. ‘It’s the cheapest passage in the sea,’ he says. ‘Nobody here pays a pearl.’ The queue is long and grateful. Char watches a grandmother turn the key a notch and somewhere back up the coast a pump-house light goes out.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, watches a grateful grandmother turn a barnacled anchor key hanging from a ticket-window grille on a quay, while a pump-house light flickers out on the distant coast and a purser smiles behind the glass',
    choices: [
      {
        id: 'post-the-price',
        label:
          'Make the purser post the real cost of each notch on the window before selling another',
        outcome:
          'The purser grumbles and chalks it up: one notch, one pump-house; three notches, one flooded street. Half the queue leaves. The other half pays in pearls instead, painfully. Char pays for the grandmother herself and walks away with an empty purse and a very long line of people glaring at her.',
        flag: 'shifting-price-posted',
        effects: { supplies: -2, evidence: 1, trust: 1 },
        artSubject:
          'A purser chalks costs on a ticket window as Char in black lace counts pearls into a grandmother’s hand and half a queue drifts away along a quay',
      },
      {
        id: 'trace-the-pump-house',
        label: 'Swim up the coast to the pump-house and find out who is paying',
        outcome:
          'The pump-house keeper is alone, bailing by hand, and has been for days without knowing why her pumps keep failing. Char tells her. The keeper takes the news grimly and asks to be the one who decides when the key turns again. The ferry sells a few more fares in the meantime.',
        flag: 'shifting-price-traced',
        effects: { trust: 2, danger: 1, evidence: 1 },
        artSubject:
          'Char with dark violet scales helps a soaked pump-house keeper bail water from a dark flooded pump room by lantern light on a rocky coast',
      },
    ],
  },
  '1,8': {
    title: 'The Jewel That Keeps Two Faces',
    speaker: 'Char, Scylla and Oren',
    kind: 'challenge',
    opening:
      'The Memory-Reef Crown rises from the seabed like a coral city wearing a circlet, and every point of it is set with things stolen from other worlds: forest roots, office badges, paper lanterns, shells from a younger palace. Its first great jewel is a mirror, and its setting is made of two faces of Char, claws of silver gripping a Hoshimori refuge seal that someone pried from a village door. The seal must go home. To lift it out, the jewel says, one face must let go, and it wants Char to choose which of herself to release. Oren is already measuring the setting with a knotted cord.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, hovers before a huge mirror jewel set into a towering coral crown on the seabed, its silver setting shaped like two faces of Char gripping a small lantern-red refuge seal, while Oren, a hooded headsman, measures it with a knotted cord and Scylla watches',
    choices: [
      {
        id: 'pry-with-both-faces',
        label:
          'Have Oren loosen the setting so the seal comes free without either face letting go',
        outcome:
          'Oren finds the pin that holds the setting, the way he finds the weak plank in every bridge. He loosens it a hair. Char eases the seal out between the two silver faces, who both keep their grip on nothing. It takes hours and Oren’s finest tools, two of which snap. Both faces remain in the jewel, unharmed, unreconciled.',
        flag: 'crown-jewel-both-faces',
        effects: { evidence: 1, supplies: -2 },
        artSubject:
          'A hooded headsman eases a pin from a silver mirror setting with fine tools as Char in black lace slides a small red seal out between two silver faces',
      },
      {
        id: 'speak-to-the-jewel',
        label:
          'Tell the jewel in your own words that neither face is yours to release',
        outcome:
          '‘I don’t own either of them,’ Char says. ‘I’m the one talking.’ The jewel considers that a refusal and opens its claws in irritation, and the seal drops into her palm. But the mirror clouds over in anger, and from now on it shows nothing at all to anyone, not even the people who came to it for honest reflections.',
        flag: 'crown-jewel-refused',
        effects: { trust: 2, danger: 1, evidence: -1 },
        artSubject:
          'A small red seal drops into Char’s outstretched palm as a great mirror jewel in a coral crown clouds over grey and her aquamarine twin looks on',
      },
    ],
  },
  '2,8': {
    title: 'Carried Goods at the Crown Gate',
    speaker: 'Char and Oren',
    kind: 'treasure',
    opening:
      'A coral turnstile is grown into the crown’s band, and every fragment that leaves the crown must pass through it. It has learned the station’s rule and counts each fragment as baggage belonging to whoever carries it. Oren is carrying an Earth office lanyard, its badge water-spotted, taken from someone’s desk and wound into the crown. If it passes as his baggage, it is his by the gate’s logic, and the person it belongs to loses it a second time. A pile of other unclaimed fragments sits by the gate, glittering, mostly worthless and a few priceless. Oren holds the lanyard at arm’s length.',
    artSubject:
      'Oren, a towering hooded headsman with an axe and leather apron of pouches, holds a water-spotted office lanyard at arm’s length before a coral turnstile grown into a crown’s band, while Char, a sturdy goth mermaid with dark violet scales and black lace, sorts through a glittering pile of unclaimed fragments',
    choices: [
      {
        id: 'tag-it-in-transit',
        label:
          'Tag the lanyard in transit to its owner, so it passes as nobody’s baggage',
        outcome:
          'Char writes a tag in Fitch’s style: carried for, not owned by. The gate does not know the phrase and stalls, then accepts it on the third try. The lanyard passes as nobody’s. Rummaging through the pile while they wait, Char finds a pearl of real worth that nobody claims. Oren writes it in his inventory as found, owner sought.',
        flag: 'crown-gate-in-transit',
        effects: { supplies: 1, evidence: 1 },
        artSubject:
          'Char in black lace ties a handwritten tag to an office lanyard as a coral turnstile slowly turns and a hooded headsman writes in an inventory book',
      },
      {
        id: 'carry-it-past-the-gate',
        label:
          'Swim the lanyard around the gate the long way, outside the crown’s counting',
        outcome:
          'There is a way around, along the crown’s outer rim, where the current is strong and the coral is sharp. Oren and Char take it, scraped and slow, and the lanyard is never counted. Neither is the pile of fragments by the gate, which stays there, unclaimed, being counted as somebody’s.',
        flag: 'crown-gate-bypassed',
        effects: { danger: 1, trust: 1 },
        artSubject:
          'Char and a hooded headsman cling to the sharp outer rim of a towering coral crown in a strong current, an office lanyard wound around Oren’s wrist',
      },
    ],
  },
  '3,8': {
    title: 'The Crownwolf',
    speaker: 'Char, Gorse and the Crownwolf',
    kind: 'monster',
    opening:
      'A wolf made of Briar thorns and coral has grown out of the crown’s eastern point, and it guards a fragment from the forest: a house-root bead, the kind a Briar family hangs over the door to say this is home. The Crownwolf believes the bead is a lost cub, and nothing that touches it survives the thorns. Gorse knows the family it belongs to, displaced and waiting. He also knows the Crownwolf is not lying; in Briar law a guard keeps what was entrusted to it, and somebody did entrust this bead to the crown, under duress. The thorns rattle. Scylla draws a knife she is no good with.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, faces a huge wolf grown from thorns and coral on the eastern point of a towering crown, curled protectively around a small carved root bead, while a smaller grey wolf in a whelk shell bristles beside her and Scylla clutches a knife',
    choices: [
      {
        id: 'fight-the-crownwolf',
        label:
          'Draw the Crownwolf off with Scylla while Gorse snatches the bead',
        outcome:
          'Char and Scylla make themselves as loud and edible as possible. The Crownwolf lunges, and Char takes a thorn through the tail fin. Gorse darts in, takes the bead in his teeth, and is out before the thorns close. The bead goes home. The Crownwolf breaks apart into coral and sorrow, a guard destroyed for doing its job.',
        flag: 'crownwolf-broken',
        effects: { danger: 2, trust: 1, supplies: -1 },
        artSubject:
          'A wolf in a whelk shell dashes away with a carved bead in its teeth as a thorn-and-coral wolf lunges at two mermaid sisters shouting and waving',
      },
      {
        id: 'gorse-tells-the-guard',
        label:
          'Let Gorse tell the Crownwolf, wolf to wolf, that the bead was taken under duress',
        outcome:
          'Gorse goes forward alone, shell first, and speaks in road language for a long time. The Crownwolf listens. It releases the bead, but only to Gorse, and only on the condition that he stays to keep its post for one tide in its stead. Gorse agrees. Char leaves without her courier, the bead on its way home.',
        flag: 'crownwolf-relieved-by-gorse',
        effects: { trust: 2, evidence: 1, danger: -1 },
        artSubject:
          'A small grey wolf in a whelk shell sits nose to nose with a towering thorn-and-coral wolf on a crown’s point as it lowers a carved bead to him',
      },
    ],
  },
  '4,8': {
    title: 'The Eel Around the Band',
    speaker: 'Char, Oren and the crown eel',
    kind: 'challenge',
    opening:
      'A ledger eel, the oldest Char has seen, is coiled three times around the crown’s band, and it has eaten the names of everyone each fragment was taken from. Without the names, returning a fragment is guesswork, and returning one to the wrong person would be a new theft dressed as kindness. Oren’s original inventory has line numbers but no owners. The eel is old enough to be bargained with, and old enough to remember that a name given back is a name exposed. It will give Oren every name at once, it says, if he will write them into the crown’s official registry where anyone can read them.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, kneels on a towering coral crown’s band before an ancient ledger eel coiled three times around it, names glowing faintly along its whole length, while Oren, a hooded headsman, holds open an inventory with numbered lines and blank owners',
    choices: [
      {
        id: 'names-one-by-one',
        label:
          'Refuse the registry and ask for names only as each owner can be found and asked',
        outcome:
          'The eel finds this tiresome and agrees to it. Each name comes out one at a time, whispered, and only when Char or Oren can say where that person is and that they want the thing back. In a day they return four fragments. Forty wait in the crown, ownerless for now.',
        flag: 'band-names-one-by-one',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'An ancient eel whispers a single glowing name into the ear of a kneeling hooded headsman as Char in black lace holds a small fragment ready to return',
      },
      {
        id: 'take-witness-accounts',
        label:
          'Leave the eel and gather witness accounts of who owned what from people who come to the crown',
        outcome:
          'Word goes out and people come: Fitch, Jory, Ines, Haru, the grandmother from the station. Each says what they saw taken and from whom, and Oren records it as testimony beside his line numbers. It is slower and patchier than the eel, and two witnesses disagree about one fragment. Oren writes both.',
        flag: 'band-witness-accounts',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'A queue of familiar travellers, a hermit crab conductor, a deckhand and a diver among them, give accounts to a hooded headsman writing on a coral crown’s band',
      },
    ],
  },
  '5,8': {
    title: 'Kagari’s Return Tickets',
    speaker: 'Char, Vesper and Auntie Kagari',
    kind: 'merchant',
    opening:
      'Auntie Kagari has followed the trade all the way up to the crown and set her stall on its southern point. She sells return tickets: pay her, and she ties a small red lantern to a fragment, and the lantern will drift until it finds the fragment’s owner and glow above their door. It is clever and it works. Vesper stares at the lanterns as if they were teeth. Every one of them is a light above a door, and some of those doors are refuges. Kagari is perfectly polite about it. Her prices are fair. The queue is long and full of people who want their things back.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, stands at a lantern stall on a towering coral crown point where a one-eyed paper-lantern spirit ties small red lanterns to fragments, while Vesper, a moth-folk cartographer with dusty grey wings, stares at the floating lanterns in alarm',
    choices: [
      {
        id: 'lanterns-that-go-dark',
        label: 'Pay Kagari to make the lanterns go dark the moment they arrive',
        outcome:
          'Kagari is offended and then interested, and charges triple. Vesper helps rework the wicks so each light dies on the doorstep without leaving a mark. The fragments go home. Char’s purse is empty, and Kagari, having learned the trick, will be able to sell it to anyone, including the people who wanted the doors marked.',
        flag: 'return-lanterns-darkened',
        effects: { supplies: -2, trust: 1 },
        artSubject:
          'A moth-folk cartographer reworks the wick of a tiny red lantern as Char pours her last pearls into a one-eyed lantern merchant’s palm',
      },
      {
        id: 'carry-them-by-hand',
        label:
          'Decline the lanterns and offer to carry fragments by hand to anyone who comes and asks',
        outcome:
          'Char sets up a rival table beside Kagari’s with a sign: Ask, and we bring it. No light, no trail. It is slow, and only people who can find the crown can use it. Kagari loses half her queue and puts Char’s face on a lantern of her own, glowing, unflattering.',
        flag: 'return-by-hand',
        effects: { trust: 2, danger: 1, evidence: -1 },
        artSubject:
          'Char in black lace sits at a plain driftwood table with a hand-lettered sign beside a lantern stall where a one-eyed merchant glares and hangs up a lantern painted with Char’s face',
      },
    ],
  },
  '6,8': {
    title: 'The Oracle at the Peak',
    speaker: 'Char, Scylla and Oren',
    kind: 'puzzle',
    opening:
      'At the crown’s highest point sits the original Tide Oracle, the one all the station conchs and market shells were split from, and it rules the crown. It says no fragment can be returned without becoming someone else’s possession on the way, so none may leave. Oren’s inventory says otherwise: twelve fragments were brought here on a dated night, and three were entered by their owners voluntarily, for safekeeping, before the theft began. The dates are impossible, as all the dates here are. Char has Oren’s inventory, a night-shift tide chart and the conch’s own past predictions. Somewhere in them is a fragment that can leave without anyone being robbed.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, spreads an inventory, a tide chart and a list of predictions across the peak of a towering coral crown before a vast ancient glowing conch, while Oren and Scylla lean over her shoulders',
    choices: [
      {
        id: 'match-the-voluntary-entry',
        label:
          'Match the dates to find a fragment left here by its owner’s own choice',
        outcome:
          'The tide chart and the inventory agree on one line: a Hoshimori child’s paper charm, entered by the child herself, signed in crayon, impossible date and all. It was never stolen. Char returns it to the child’s family at the foot of the crown. The oracle has no ruling against a gift returned. It is one fragment among hundreds.',
        flag: 'peak-voluntary-match',
        effects: { evidence: 2, trust: 1 },
        artSubject:
          'Char in black lace points to a crayon signature on an inventory page as a hooded headsman lifts a small folded paper charm from a coral niche at the crown’s peak',
      },
      {
        id: 'refute-the-oracle',
        label:
          'Read out every one of the oracle’s failed predictions until it loses its authority',
        outcome:
          'Char reads them in order, flatly. Nine wrong out of ten, again. The oracle’s ruling weakens and several fragments loosen in their settings, and opportunists swim in to grab them before anyone can return them properly. Oren and Scylla catch two. The rest are stolen a second time.',
        flag: 'peak-oracle-refuted',
        effects: { danger: 2, evidence: 1, supplies: -1 },
        artSubject:
          'Char reads aloud from a list before a dimming ancient conch as loosened fragments drift from a coral crown and shadowy figures dart in to grab them',
      },
    ],
  },
  '7,8': {
    title: 'Two Small Things in the Rim',
    speaker: 'Char and Scylla',
    kind: 'companion',
    opening:
      'Woven into the crown’s rim are two small things that make both sisters stop: a girl’s black velvet coat with chewed cuffs and a child’s tin court crown, the kind given to princesses too young for pearls. They are tangled together, sleeves through the circlet. Neither was stolen from another world; they come from this sea, from the nursery, before anything happened. Scylla does not reach for them. She asks instead, formally, whether she may come with Char to the final crossing, as a sister, not a keeper, and whether Char will let her say no to things too. The coral around the rim is beginning to loosen.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, and Scylla, her identical twin with pale aquamarine scales and a pearl circlet, float face to face beside the rim of a towering coral crown in which a small girl’s velvet coat and a child’s tin crown are woven together',
    choices: [
      {
        id: 'each-takes-her-own',
        label:
          'Untangle them, take the little coat, and hand Scylla the tin crown',
        outcome:
          'Char works the sleeves free with care. She tucks the little coat into her satchel and hands Scylla the crown, and Scylla puts it on her wrist like a bracelet, too small for anything else. ‘Come,’ Char says. ‘Say no to me whenever you want.’ Scylla laughs and says no to the route immediately, and they argue it out, together.',
        flag: 'rim-each-her-own',
        effects: { trust: 2, supplies: 1 },
        artSubject:
          'Scylla slips a small tin crown onto her wrist as Char in black lace tucks a tiny velvet coat into a satchel, both smiling, beside a loosening coral rim',
      },
      {
        id: 'leave-them-woven',
        label:
          'Leave them woven together in the rim and ask Scylla to come as your witness',
        outcome:
          'Char touches them once and leaves them tangled, a shared thing in a shared place. ‘Come as a witness,’ she says. ‘You tell what you saw, I tell what I know, and nobody tidies either.’ Scylla agrees. The rim’s coral loosens further while they talk, and the little coat and crown may not survive the crown’s collapse.',
        flag: 'rim-left-woven',
        effects: { evidence: 1, danger: 1, trust: 1 },
        artSubject:
          'Two mermaid sisters, dark violet and aquamarine, swim away together from a crumbling coral rim where a tiny velvet coat and a tin crown remain tangled',
      },
    ],
  },
  '8,8': {
    title: 'The Anchor at the Heart of the Crown',
    speaker: 'Char, Scylla and Oren',
    kind: 'memory',
    opening:
      'At the centre of the Memory-Reef Crown, where all its points lean inward, the Anchor Key has grown to the size of a tower and sunk itself into the seabed. This is its true lock. Beyond it, through a ring of churning water, lies the final sea crossing, the way out of this broken kingdom toward wherever the histories meet. Everyone Char has helped has followed her here: Dulse and Fitch, Jory, Ines and Teodor, Mara in her water-bottle helmet, Vesper with their map case. The key speaks with every voice it has stolen. Turn me, it says, and the crossing opens, and someone pays. Char remembers, clearly and only for herself, the morning she hid land-boots under the nursery bed. She wanted then what she wants now: a road she chose.',
    artSubject:
      'Char, a sturdy goth mermaid with dark violet scales and black lace, stands before a tower-sized barnacled anchor key sunk into the seabed at the centre of a vast coral crown, a churning ring of water beyond it, with Scylla with aquamarine scales, a hooded headsman with an axe, and a gathered crowd of merfolk, a hermit crab conductor and a moth-folk cartographer behind her',
    choices: [
      {
        id: 'key-recites-the-cost',
        label:
          'Make the key recite the full cost to everyone gathered before anyone touches it',
        outcome:
          'Oren rigs ropes around the key’s fluke and the whole crowd hauls until it cannot squirm. Then it recites, in all its stolen voices: pumps, trains, a district, a memory, names. Everyone hears it at once. Some of the crowd leave in fear. Those who stay know exactly what is at stake at the crossing, and the key has lost its favourite tool, secrecy.',
        flag: 'heart-key-full-cost',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'A great crowd of merfolk and travellers haul on ropes binding the fluke of a tower-sized anchor key as Char in black lace stands before it listening, a hooded headsman directing the lines',
      },
      {
        id: 'search-before-turning',
        label:
          'Have Oren organise a search for everyone the bargain left out before deciding',
        outcome:
          'Oren divides the crowd into teams by his inventory lines and sends them through the crown’s chambers. They find a camp of stranded commuters, a Briar family and three court servants, all on the key’s hidden list. Each is told. The search costs most of the party’s supplies and a full tide. The crossing waits, and the people who would have paid now have a voice at it.',
        flag: 'heart-key-omitted-searched',
        effects: { supplies: -2, trust: 1, evidence: 1 },
        artSubject:
          'A hooded headsman hands out inventory lists to teams of merfolk heading into the coral chambers of a vast crown while Char leads a stranded group of commuters back toward a giant anchor key',
      },
      {
        id: 'name-yourself-first',
        label:
          'Put your own name first on the list of those who pay, and ask the rest for consent',
        outcome:
          'Char writes her name on the key’s shaft with a reef knife, at the top, where the hidden rows used to be. Then she asks everyone else on the list whether they consent, and several say no. Scylla tries to stop her, and Char lets her finish saying it before she refuses. The key does not turn yet. It has never been offered a price by the one it was meant to spare.',
        flag: 'heart-key-own-name-first',
        effects: { trust: 2, danger: 2 },
        artSubject:
          'Char in black lace carves her name with a reef knife at the top of a tower-sized anchor key’s shaft while Scylla reaches toward her and a crowd watches in silence',
      },
    ],
  },
} as const
