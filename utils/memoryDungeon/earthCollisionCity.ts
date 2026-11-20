/**
 * Authored e10 sites that replace the remaining recipe sites in Morrow’s
 * broken city (2026-11-20 PT).
 */
export const EARTH_COLLISION_CITY_SITES = {
  '2,1': {
    title: 'The Kiosk That Sells Courage by the Cup',
    speaker: 'Morrow, Ash and the platform kiosk vendor',
    kind: 'merchant',
    opening:
      'The coffee kiosk on platform 4 has a queue three trains long, because every cup tastes of cold royal ocean and makes the drinker brave. Brave enough to walk past the wolves, brave enough to board a train whose timetable the canopy keeps rewriting. Ash, a grey she-wolf in a reflective school-crossing tabard, stands between the kiosk and six schoolchildren. Each sip replays the same stranger’s voice: "I will come back for the ones on the steps." The vendor, Benny, is delighted and terrified in equal parts. ASH: "Children should not need a promise from the sea to catch the 8:12." MORROW: "Nor should anyone sell them one."',
    artSubject:
      'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, at a steaming platform coffee kiosk whose urn drips seawater, a grey she-wolf in a reflective tabard shielding six schoolchildren',
    choices: [
      {
        id: 'follow-the-salt-pipe',
        label:
          'Trace the urn’s feed pipe to whoever is pouring the sea into it',
        outcome:
          'Morrow and Benny follow the pipe behind the vending machines to a flooded service duct, where a stranded palace page has been pouring a promise into the water supply so somebody will remember it. The page agrees to stop, but Morrow now carries the promise and an obligation to find its owner. The 8:12 leaves without the school group, and Ash walks the children to the slower bus herself.',
        flag: 'kiosk-salt-pipe-traced',
        effects: { evidence: 2, supplies: -1, danger: 1 },
        artSubject:
          'Morrow crouching in a flooded service duct behind station vending machines, a soaked palace page holding a dripping pipe and a glowing pearl of spoken promise',
      },
      {
        id: 'buy-the-whole-urn',
        label:
          'Buy the whole urn and seal it for the promise’s rightful keeper',
        outcome:
          'Morrow empties the transit purse to buy every remaining cup, then has Benny lid the urn and tape a label to it: held for the one who was promised. The queue grumbles and drinks ordinary tea instead. Ash leads the children aboard on her own nerve and theirs. Nobody on platform 4 is brave by purchase today, and a few commuters miss their train out of plain fear.',
        flag: 'kiosk-urn-held-for-keeper',
        effects: { supplies: -2, trust: 2 },
        artSubject:
          'A sealed steel coffee urn labelled in marker on a platform counter while a grey she-wolf in a tabard leads schoolchildren onto a waiting train',
      },
    ],
  },
  '4,1': {
    title: 'The Gate That Opens for the Wolf',
    speaker: 'Morrow, Ash and a substitute teacher',
    kind: 'companion',
    opening:
      'A staff badge lies on the platform 4 ticket barrier, and the barrier has decided it opens only for whoever it least expects. It refuses every child, every commuter and Morrow, then swings wide for Ash. The crowd recoils from a wolf walking through the staff gate. On the far side, a substitute teacher named Ms Halloran waves a crumpled register; her own badge vanished at the escalator. The canopy has moved the next departure to "whenever the leaves agree." ASH: "I will not walk the children through a gate that thinks I am the strangest thing here." MORROW: "Then it can learn who belongs on each side."',
    artSubject:
      'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, beside a ticket barrier that has swung open for a grey she-wolf in a reflective tabard, schoolchildren and a flustered teacher with a register beyond',
    choices: [
      {
        id: 'return-the-teachers-badge',
        label:
          'Confirm the badge is Ms Halloran’s and return it to her by hand',
        outcome:
          'Ms Halloran names the photo on the badge before seeing it, and the children vouch for her with great enthusiasm and several false details. The barrier grudgingly opens for the right person. Ash, pleased to be ordinary again, offers to walk beside Morrow for the rest of the line. The barrier logs a wolf in a staff gate, and someone will want that explained.',
        flag: 'gate-teacher-badge-returned',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'A relieved teacher clipping a recovered staff badge to her lanyard while Morrow and a grey she-wolf shepherd children through an ordinary ticket gate',
      },
      {
        id: 'refuse-the-staff-name',
        label:
          'Turn down the barrier’s offer to admit Morrow as Dr Rowan, staff',
        outcome:
          'The barrier offers Morrow the badge and a convenient identity printed on it. Morrow sets it on the ticket office counter instead and walks the school group up the long stairs with Ash, one landing at a time. It costs the morning, two children’s patience and a packet of biscuits, but nobody passes through a gate wearing someone else’s face. Ash notes the refusal and decides to stay close.',
        flag: 'gate-staff-name-refused',
        effects: { supplies: -1, trust: 1, evidence: 1 },
        artSubject:
          'Morrow and a grey she-wolf leading a line of schoolchildren up a long station stair, a lost staff badge left on a ticket office counter below',
      },
    ],
  },
  '6,1': {
    title: 'The Lost Property Ledger of Friends',
    speaker: 'Morrow, Ash and Shiori the paper spirit',
    kind: 'challenge',
    opening:
      'The lost property window has been taken over by Shiori, a library yōkai made of overdue slips, who files every commuter’s friendships as contractual debts. "Kofi owes Ama: one umbrella, eleven lifts home." The wolves on the platform read the ledger as law, and Ash’s cousins are now refusing to let anyone board until their debts are settled. A man is trying to repay a decade of school runs with a sandwich. SHIORI: "A kindness not returned is a theft that nobody reported." ASH: "My pack hunts thieves. It does not hunt neighbours." MORROW: "Then we show the paper what a gift is."',
    artSubject:
      'Morrow at a station lost property window where a fluttering paper yōkai of overdue slips files friendships into drawers, wolves blocking a train door and a man offering a sandwich as repayment',
    choices: [
      {
        id: 'testify-gifts-not-loans',
        label:
          'Ask commuters to testify, in their own words, that their kindnesses were gifts',
        outcome:
          'Ama steps forward and says the lifts were never a loan. Others follow, choosing what to share and keeping the rest. Shiori, scandalised, opens a new drawer labelled freely given. The wolves stand aside. Several commuters now know more about each other than they wished, and one marriage gets a frank discussion on the 8:40. Shiori follows Morrow down the line to keep learning.',
        flag: 'lost-property-gifts-witnessed',
        effects: { trust: 2, evidence: 1, danger: 1 },
        artSubject:
          'A commuter speaking earnestly at a lost property window as a paper yōkai folds a new drawer labelled for gifts and wolves step back from a train door',
      },
      {
        id: 'hand-back-every-page',
        label:
          'Hand each commuter their own page and let them decide what it says',
        outcome:
          'Morrow and Ash pass the pages down the platform one by one. People read, fold and pocket their own friendships, and the ledger empties. Shiori sulks in an empty pigeonhole, and the wolves have no list to enforce, which leaves them anxious and loud. Two trains leave while the pages are handed out, so the platform crush grows dangerous before it clears.',
        flag: 'lost-property-pages-returned',
        effects: { trust: 1, danger: 2 },
        artSubject:
          'Morrow and a grey she-wolf handing folded paper pages to commuters along a crowded platform while a sulking paper yōkai curls in an empty pigeonhole',
      },
    ],
  },
  '7,1': {
    title: 'The Platform Lift to Nowhere Coral',
    speaker: 'Morrow, Char and Mr Osei',
    kind: 'treasure',
    opening:
      'The step-free lift to platform 6 now travels sideways. Its doors open onto a coral corridor of a palace that Mr Osei, eighty-one and holding a walking frame, has never visited and does not want to. Seawater pools around his slippers. Char is wedged in the lift corner, dripping and furious, because the brass floor dial keeps choosing destinations for her: throne room, sisters’ chamber, escape stair. The dial itself is solid palace work, worth a great deal to anyone who needs a way through. CHAR: "It keeps sending me somewhere I already left." MR OSEI: "I only wanted platform 6."',
    artSubject:
      'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, holding a lift door open on a coral palace corridor, a dripping mermaid princess in black lace in the corner and an elderly man with a walking frame, a brass floor dial glowing',
    choices: [
      {
        id: 'chalk-the-way-back',
        label: 'Unscrew the brass dial and mark the return route to platform 6',
        outcome:
          'Morrow pries the dial loose and turns it until it points at platform 6, then chalks the setting on the lift wall. The lift grinds back to the station, and Mr Osei steps out dry from the knees up. The dial becomes a hard-won key to sideways lifts across the city. Char, robbed of any choice, climbs out wordlessly and leaves before Morrow can thank her.',
        flag: 'platform-lift-dial-taken',
        effects: { supplies: 2, trust: -1 },
        artSubject:
          'Morrow holding a heavy brass lift dial while an elderly man steps out onto a station platform and a mermaid princess slips away down the stairs',
      },
      {
        id: 'ask-char-the-floor',
        label:
          'Ask Char where she wants the lift to go before anyone touches the dial',
        outcome:
          'Char thinks, then says she wants to go nowhere royal: she wants a bench where she can watch the trains. Morrow sets the dial to her answer. Mr Osei, charmed, decides to sit with her. Morrow then takes the long stairs to fetch the station clerk. The lift ends up stuck at the bench, so the dial stays in the wall, but Char tells Morrow which palace doors it will open later.',
        flag: 'platform-lift-char-chose',
        effects: { trust: 2, evidence: 1, supplies: -1 },
        artSubject:
          'A goth mermaid princess and an elderly man with a walking frame sharing a station bench, watching trains, while Morrow climbs the stairs behind them',
      },
    ],
  },
  '1,2': {
    title: 'The Atrium Wolf and the Hazard Hypothesis',
    speaker: 'Morrow, Dr Sen and the young wolf Burr',
    kind: 'companion',
    opening:
      'In the research building atrium, pines have broken out of the specimen cabinets and file their needles by hypothesis. One branch holds a laminated card: "Wolves are a hazard to research." Ash’s son Burr, gangly and half-grown, stands on the backward escalator and will not step off, so the escalator keeps carrying the morning interns away from the lab doors. Dr Sen has three sensors trained on the wolf and a pencilled rule: in date and within range, or it is not data. DR SEN: "If the pines publish that card, security will act on it." BURR: "Then let them try to move me."',
    artSubject:
      'Morrow and a precise scientist with a clipboard in a glass research atrium where pine trees burst from steel cabinets, a lanky young wolf planted on a backward-running escalator',
    choices: [
      {
        id: 'walk-burr-past-interns',
        label:
          'Walk Burr past the frightened interns with Dr Sen measuring every step',
        outcome:
          'Morrow walks beside Burr while Dr Sen calls out his heart rate to the interns, which proves he is more frightened than they are. The crowd parts, uneasy. The hazard card stays on its branch, because nobody asked the pines to revise it. Dr Sen, interested, closes her notebook and joins Morrow, convinced the forest’s data needs a proper referee.',
        flag: 'atrium-burr-walked-past',
        effects: { trust: 1, danger: 1, supplies: 1 },
        artSubject:
          'Morrow and a scientist reading a sensor walk beside a nervous young wolf through a crowd of wary interns in a pine-filled research atrium',
      },
      {
        id: 'ask-what-burr-guards',
        label:
          'Ask Burr why he is guarding the lab doors before anyone moves him',
        outcome:
          'Burr admits that behind the doors a sapling grows from his pack’s old den soil, and the pines have filed it under invasive. Dr Sen checks the sapling, finds the hypothesis untested, and strikes the hazard card in red pencil. The interns are late for a full hour and complain loudly. Burr steps off the escalator. Dr Sen joins Morrow to audit the rest of the forest.',
        flag: 'atrium-den-sapling-heard',
        effects: { trust: 2, evidence: 2, danger: -1 },
        artSubject:
          'A scientist striking through a laminated card on a pine branch with red pencil while a young wolf noses a sapling in a cold laboratory',
      },
    ],
  },
  '3,2': {
    title: 'The Hypothesis Filed Under Refuge',
    speaker: 'Morrow, Dr Sen and Vesper',
    kind: 'challenge',
    opening:
      'A pine needle in the lab corridor has filed a memo as evidence, and the memo glitters with Vesper’s unmistakable moth-scale dust. It names a Hoshimori refuge and proposes a test: send a survey team to confirm that people are hiding there. The forest wants to verify its existence the way it verifies everything. Vesper arrives from the underpass, wings tight, and does not touch the paper. Dr Sen’s rule is clear: data needs a reference. VESPER: "That was my map. I sold it once." DR SEN: "Then this is not a hypothesis. It is a lead for whoever wants to hunt."',
    artSubject:
      'Vesper, a moth-folk cartographer with dusty folded wings, facing a glittering memo pinned to a pine branch in a laboratory corridor while Morrow and a scientist stand between them and the survey trolley',
    choices: [
      {
        id: 'ask-vesper-why-sold',
        label: 'Ask Vesper, privately, why the map was sold and who bought it',
        outcome:
          'Vesper tells the truth without excuses: they were young and hungry, and a buyer promised the map was for rescue. Morrow records the buyer’s seal, not the refuge. Dr Sen withdraws the survey and files the memo as tainted evidence. The answer helps track the buyer, but Vesper leaves the lab shaking, and nobody pretends the confession repaired what the sale broke.',
        flag: 'corridor-vesper-sale-named',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'Vesper speaking quietly to Morrow on a laboratory bench, scale dust on their hands, while a scientist stamps a memo as withdrawn',
      },
      {
        id: 'turn-memo-into-crossing',
        label:
          'Use the memo’s safe-path lines to repair the corridor and blot the destination',
        outcome:
          'Vesper traces the memo’s safe-path lines and shows Morrow how they also solve the pine-choked corridor. Dr Sen blots the destination with lab ink before anyone copies it. The interns get a clear route to the cold room, and the forest loses its test. Vesper keeps the inked memo as a warning, though the buyer’s trail goes cold with the destination.',
        flag: 'corridor-memo-path-repaired',
        effects: { supplies: 1, trust: 1, danger: 1 },
        artSubject:
          'Vesper tracing glittering lines across a memo while Morrow clears pine branches along a laboratory corridor and a scientist blots ink over a corner',
      },
    ],
  },
  '4,2': {
    title: 'The Seed Cabinet That Trusts the Cleaner',
    speaker: 'Morrow, Dr Sen and Walt',
    kind: 'treasure',
    opening:
      'The locked seed cabinet in Room 9 holds Briar acorns, each one tagged with a hypothesis about whether a forest may grow here. A lost staff badge hangs from its handle, and the cabinet opens only for the person it least expects. It ignores Dr Sen, ignores Morrow, and clicks open when Walt, the night cleaner, leans on his mop to watch. Walt has wiped that glass every night for nine years and never been asked about it. DR SEN: "The acorns could reseed the canopy away from the train lines." WALT: "Or someone could sell them. I know who comes in here after midnight."',
    artSubject:
      'A night cleaner leaning on his mop as a glass seed cabinet swings open for him, Briar acorns with paper tags inside, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, and a scientist watching in surprise',
    choices: [
      {
        id: 'name-walt-the-keeper',
        label:
          'Name Walt as the cabinet’s real visitor and let him choose what leaves it',
        outcome:
          'Morrow tells the cabinet the truth: Walt is the person who actually knows it. Walt hands out six acorns and keeps the rest locked, naming the late visitor who tried to pry it open last month. Dr Sen writes Walt into the access log as custodian, which will cause a dispute upstairs. The acorns can pull the canopy off two train lines.',
        flag: 'seed-cabinet-walt-keeper',
        effects: { supplies: 2, evidence: 1 },
        artSubject:
          'A night cleaner placing six tagged acorns into Morrow’s palm beside an open seed cabinet while a scientist writes his name in an access log',
      },
      {
        id: 'refuse-the-pi-badge',
        label:
          'Decline the badge’s offer to log Morrow in as principal investigator',
        outcome:
          'The badge flickers and offers Morrow principal-investigator access under Rowan’s name. Morrow turns it face down. The cabinet stays shut for everyone except Walt, who opens it only to water the acorns and closes it again. Morrow leaves with fewer seeds, while Walt and Dr Sen trust the refusal more than any key. The forest keeps its grip on the train lines for now.',
        flag: 'seed-cabinet-badge-declined',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Morrow turning a glowing staff badge face down on a lab bench while a night cleaner waters acorns inside a glass cabinet',
      },
    ],
  },
  '5,2': {
    title: 'The Stag of Future Shifts',
    speaker: 'Morrow, Dr Sen and postdoc Priya',
    kind: 'monster',
    opening:
      'The lab rota has grown antlers. A stag of bark and clipboards stalks the bench aisles, and every tine carries one future version of Priya, the postdoc, slumped over a bench at three in the morning. Each time someone adds a task to the shared calendar, a new tine sprouts and the stag gets heavier. It has cornered Priya by the incubators, which hold six months of samples. The wall clock flickers between seasons. PRIYA: "I said yes to everything because saying no felt like getting fired." DR SEN: "Nobody here ever asked you how many hours were left."',
    artSubject:
      'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, facing a towering stag made of bark and clipboards in a laboratory aisle, its antlers hung with exhausted figures, a young postdoc backed against humming incubators',
    choices: [
      {
        id: 'share-the-rota-tines',
        label: 'Ask each researcher to take a tine they consent to carry',
        outcome:
          'Dr Sen calls the lab together and asks for volunteers, not assignments. Five people each break off a tine and take a task they can actually manage. The stag shrinks to a small, embarrassed deer and trots back into the rota. Priya cries with relief. The lab now runs slower, two grants will be late, and everyone has a little less sleep than before.',
        flag: 'stag-rota-shared',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Researchers each snapping a clipboard tine from a shrinking bark stag while a postdoc wipes her eyes beside the incubators',
      },
      {
        id: 'unplug-the-time-clock',
        label:
          'Pull the lab’s time clock from the wall until everyone can leave',
        outcome:
          'Morrow yanks the time clock’s plug. The stag freezes mid-charge and splinters into loose paper, and the whole lab walks out into the evening at once. But the incubators shared that circuit. By the time Dr Sen restores power, two sample trays have died, and Priya will need to redo the work she was running away from. Nobody was forced to stay.',
        flag: 'stag-clock-unplugged',
        effects: { danger: -1, evidence: -1, trust: 1 },
        artSubject:
          'Morrow holding a yanked time clock plug as a bark stag bursts into loose paper and researchers file out past dark incubators',
      },
    ],
  },
  '6,2': {
    title: 'The Stacks Beneath the Specimen Pines',
    speaker: 'Morrow, Dr Sen and Shiori the paper spirit',
    kind: 'dungeon',
    opening:
      'Behind the specimen archive, the floor has opened into a stair of filing drawers that spirals down between pine roots. Shiori has moved its whole ledger there. Every friendship in the research building is filed below as a debt with interest, and the roots are reading the ledger aloud to the canopy, which uses it to decide who may ride which train. Dr Sen’s collaborators have started arriving at work on different days so nobody will owe anybody. The drawer-stair breathes out the smell of wet paper and resin. DR SEN: "If those originals stay down there, the whole city learns to count kindness." MORROW: "Then we go and bring the counting back up."',
    artSubject:
      'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, at the top of a spiralling stair built from open filing drawers descending between pine roots beneath a laboratory archive, a scientist with a torch and a fluttering paper yōkai at the threshold',
    choices: [
      {
        id: 'carry-signed-testimony',
        label:
          'Gather signed statements that collaboration is not a debt, then descend',
        outcome:
          'Dr Sen walks the corridors asking colleagues to write one sentence each about why they help one another, and only those who wish to sign do. The bundle is thin but honest, and Shiori reads it at the threshold with wary interest. Morrow descends carrying testimony the stacks will have to answer. Collecting it takes long enough that the canopy reroutes another two trains.',
        flag: 'stacks-testimony-carried',
        effects: { evidence: 2, trust: 1, danger: 1 },
        artSubject:
          'Morrow descending a drawer stair between pine roots holding a thin bundle of handwritten statements while a paper yōkai reads one over a shoulder',
      },
      {
        id: 'return-pages-before-descent',
        label:
          'Return the loose friendship pages upstairs first, then go down lighter',
        outcome:
          'Morrow and Dr Sen hand every loose page on the archive floor back to the person it describes before anyone goes down. Colleagues start speaking to one another again, a little awkwardly. The descent begins late and with fewer allies waiting at the top, because most people take their page and go home. But nothing below can be used to claim a debt from those who were described.',
        flag: 'stacks-pages-returned-first',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Researchers in a laboratory archive accepting folded pages from Morrow and a scientist beside a dark drawer stair leading down between roots',
      },
    ],
  },
  '7,2': {
    title: 'The Freight Lift Quartermaster',
    speaker: 'Morrow, Char and Quartermaster Brine',
    kind: 'merchant',
    opening:
      'The research freight lift now runs sideways into a palace scullery, where Quartermaster Brine, a barnacled merman with an abacus of shells, is doing a brisk trade. He sells air bells to drowning lab techs and buys helium cylinders by the dozen. Char sits on a crate of cylinders she has evidently commandeered, arms folded. The lift will carry one more load before the tide shifts. Brine names prices for a return route and prices for the throne room, and the second is cheaper. BRINE: "The princess goes home at a discount." CHAR: "The princess is not inventory, and neither is that technician."',
    artSubject:
      'Morrow at an open freight lift that opens sideways into a flooded palace scullery, a barnacled merman quartermaster with a shell abacus, a goth mermaid princess sitting on gas cylinders',
    choices: [
      {
        id: 'buy-the-return-route',
        label:
          'Trade lab helium for a guaranteed return route to the research floor',
        outcome:
          'Morrow trades four helium cylinders for a stamped return route, and the lift carries the stranded technician back up safely. Brine throws in a single air bell for the cleverness of the bargain. The lab will need the helium next month and has no budget to replace it. Char watches the deal and says nothing, which Morrow notices.',
        flag: 'freight-return-bought',
        effects: { supplies: -2, danger: -1 },
        artSubject:
          'Morrow handing helium cylinders to a barnacled quartermaster as a soaked lab technician steps back into a dry freight lift',
      },
      {
        id: 'ask-char-the-freight-floor',
        label: 'Ask Char where she wants the last freight trip to go',
        outcome:
          'Char considers, then sends the lift to the hospital loading bay, where her sister has been asking after her and where Imani needs the cylinders more. Brine is furious at losing the sale and refuses to trade with Morrow again. The technician arrives at the wrong building with wet shoes but alive. Char gives Morrow one air bell from her pocket and a dry look.',
        flag: 'freight-char-chose-bay',
        effects: { trust: 2, supplies: 1, danger: 1 },
        artSubject:
          'A goth mermaid princess pressing a lift button marked with a hospital cross while a furious merman quartermaster shakes his shell abacus',
      },
    ],
  },
  '8,2': {
    title: 'The Sequencer Paid For With Grandmother’s Hands',
    speaker: 'Morrow, Dr Sen and lab technician Ines',
    kind: 'puzzle',
    opening:
      'The DNA sequencer in the core lab is running again, and its repair receipt is pinned to the casing. Under parts it lists one capacitor, two hoses and "one memory: the feel of a grandmother’s hands plaiting hair, from a donor in this building." The repair kept forty patients’ test results on schedule. Ines, the technician who signed the work order, did not know what the Briar tinker would charge. Three staff have lost something lately: Ines cannot remember her gran’s face, a porter forgot his wedding song, and Dr Sen has misplaced the smell of rain. The receipt names only one.',
    artSubject:
      'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, holding a long repair receipt beside a humming laboratory sequencer, a worried technician and a scientist comparing notes at a bench',
    choices: [
      {
        id: 'return-ines-memory',
        label:
          'Match the receipt to Ines and reverse the repair to return her memory',
        outcome:
          'The braiding detail matches Ines, not the others. Morrow unbolts the borrowed part and the memory flows back. Ines sits down hard and laughs and cries at once. The sequencer stops, and forty patients will wait another week for results. Dr Sen begins phoning the clinic to explain. The porter and the rain are still missing, and somebody else paid for those.',
        flag: 'sequencer-memory-returned',
        effects: { trust: 2, danger: 1, supplies: -1 },
        artSubject:
          'A technician with her hands pressed to her face in relief beside a silent sequencer as Morrow holds an unbolted glowing part',
      },
      {
        id: 'disclose-the-repair-cost',
        label:
          'Keep the sequencer running and tell the forty patients what the repair cost',
        outcome:
          'With Ines’s consent, Dr Sen adds a note to every result letter explaining that a colleague’s memory paid for the speed. Most patients write back with thanks. Two refuse to accept results bought that way. Ines keeps working without her gran’s face and is allowed to decide when to ask for it back. The receipt goes into evidence of the tinker’s prices.',
        flag: 'sequencer-cost-disclosed',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'A scientist sealing result letters with a handwritten note while a technician runs the sequencer and Morrow files a repair receipt as evidence',
      },
    ],
  },
  '2,3': {
    title: 'The Carp That Drank a Promise',
    speaker: 'Morrow, Vesper and the terrace carp',
    kind: 'monster',
    opening:
      'Rice terraces have swallowed the underground ticket hall, and the vending machine at their edge still pours coffee that tastes of the royal ocean. Someone tipped a cup into the paddy. Now a carp spirit the size of a bus thrashes through the terraces, and every time anyone nearby breaks a promise, it floods another step of rice. A commuter who swore he would be home by six is waist-deep. Vesper holds a waterproof tube containing an unsold map above the water. VESPER: "It is not angry. It is holding someone else’s oath and cannot put it down." MORROW: "Then we find where it belongs, or give it somewhere to wait."',
    artSubject:
      'Morrow and Vesper with folded moth wings on the edge of flooded rice terraces inside an underground ticket hall, a vast golden carp spirit thrashing below a vending machine, a commuter waist-deep in paddy water',
    choices: [
      {
        id: 'trace-the-tipped-cup',
        label:
          'Trace who poured the cup into the paddy and ask them to take the promise back',
        outcome:
          'Vesper follows coffee stains up the terrace steps to a startled office cleaner who poured it out because the taste made her weep. She agrees to hold the promise in a jar until its owner is found. The carp calms and the water recedes. The cleaner now carries a stranger’s oath she never wanted, and the commuter is badly chilled.',
        flag: 'carp-cup-traced',
        effects: { evidence: 1, trust: 1, danger: 1 },
        artSubject:
          'An office cleaner holding a sealed glass jar of glowing seawater on a rice terrace step while a giant carp sinks calmly below',
      },
      {
        id: 'build-the-carp-a-pond',
        label:
          'Dig the carp a still pool where the promise can wait for its keeper',
        outcome:
          'Morrow and Vesper spend an hour shoring a corner of the terrace into a quiet pool with ticket barriers and sandbags. The carp settles there, holding the oath gently. Commuters must now walk the long way around the pool. Vesper notes its location on nothing at all, saying some places should be kept in memory only.',
        flag: 'carp-pond-dug',
        effects: { supplies: -2, trust: 2, danger: -1 },
        artSubject:
          'A golden carp spirit resting in a small pool walled with ticket barriers and sandbags as Morrow and Vesper rest on the muddy rim',
      },
    ],
  },
  '3,3': {
    title: 'The Steward Who Was on the Map',
    speaker: 'Vesper, Morrow and Steward Hanae',
    kind: 'challenge',
    opening:
      'Steward Hanae guards the only bund across the middle terraces, a raised path one person wide. She holds a memo dusted with Vesper’s scales: an old safe-path map, and her family’s door is marked on it. She was found because of it, years ago, in Hoshimori. Now the same map is the fastest way across the flooded hall, and forty commuters are waiting. HANAE: "I will let you pass once you have told me why you sold my door." VESPER: "Then I will tell you, and you can still refuse me." Morrow stays a step behind, because this is not a fight to win.',
    artSubject:
      'Vesper with dusty moth wings facing a stern older woman on a narrow raised path between flooded rice terraces in an underground hall, a scale-dusted memo in her hand, Morrow and waiting commuters behind',
    choices: [
      {
        id: 'vesper-answers-hanae',
        label:
          'Let Vesper answer Hanae fully, with no defence offered on their behalf',
        outcome:
          'Vesper explains the hunger, the buyer and the excuse they told themselves, and does not ask for forgiveness. Hanae listens to the end, then lets the commuters cross but not Vesper. Morrow walks Vesper the long way through cold water. Hanae keeps the memo. What Vesper said is now known, and it will travel further than they can control.',
        flag: 'bund-vesper-answered',
        effects: { trust: 1, evidence: 1, danger: 2 },
        artSubject:
          'Commuters crossing a narrow terrace path past a stern steward while Vesper and Morrow wade through cold water below in single file',
      },
      {
        id: 'repair-a-second-bund',
        label:
          'Use the memo’s path lines to build a second crossing that avoids Hanae’s old door',
        outcome:
          'Vesper asks Hanae’s permission to read the memo once, then rebuilds a second bund from the safe lines while scraping her family’s mark from the plan. Hanae watches the whole time. The new crossing holds and the commuters get through. It costs every sandbag in the hall, and Hanae still has not heard Vesper’s reasons, though she has seen what Vesper chose to erase.',
        flag: 'bund-second-path-built',
        effects: { supplies: -2, trust: 2 },
        artSubject:
          'Vesper scraping a mark off a dusty memo while Morrow packs sandbags into a new raised path across flooded terraces under a steward’s gaze',
      },
    ],
  },
  '4,3': {
    title: 'Tsuru’s Day Passes',
    speaker: 'Vesper, Morrow and Tsuru the crane clerk',
    kind: 'merchant',
    opening:
      'At the old ticket window, Tsuru, a crane yōkai in a station clerk’s waistcoat, sells day passes through the terrace gates. One staff badge remains on her counter, and it opens the upper gate only for whoever the refuge least expects. She tested it on twelve people. It opened for Vesper. Tsuru also offers a cheaper option: a pass printed under any name from her register, including the names of refugees who passed through last spring. TSURU: "A name is a name. Mine are very reasonably priced." VESPER: "Not those names. Never those." Morrow counts what is left in the transit purse.',
    artSubject:
      'A tall crane yōkai in a station waistcoat behind an old ticket window overgrown with rice stalks, holding a staff badge, Vesper recoiling from a ledger of names and Morrow counting coins',
    choices: [
      {
        id: 'buy-vesper-the-badge',
        label:
          'Pay for the badge that opens for Vesper and let them pass as themself',
        outcome:
          'Morrow pays full price for the badge. The upper gate opens for Vesper, who stands there for a long breath before walking through under their own name. Several refuge stewards see it and do not cheer. Tsuru pockets a fortune and offers a loyalty card. The upper terraces are open now, and everyone knows who opened them.',
        flag: 'tsuru-badge-for-vesper',
        effects: { supplies: -2, trust: 1, evidence: 1 },
        artSubject:
          'Vesper stepping alone through an opened wooden terrace gate as refuge stewards watch in silence and a crane clerk counts coins',
      },
      {
        id: 'refuse-the-borrowed-names',
        label:
          'Refuse every pass printed under a refugee’s name and ask for the register',
        outcome:
          'Morrow will not buy a borrowed name and asks Tsuru to hand over the register so it cannot be sold. Tsuru haggles, sulks and finally trades it for the transit purse’s last bus fare. Vesper burns the ledger page by page in a rice-straw brazier. Nobody gets through the upper gate today, but nobody else gets sold through it either.',
        flag: 'tsuru-register-burned',
        effects: { trust: 2, supplies: -1, danger: 1 },
        artSubject:
          'Vesper feeding ledger pages into a small rice-straw brazier beside an old ticket window while a crane clerk sulks and Morrow holds an empty purse',
      },
    ],
  },
  '5,3': {
    title: 'The Transplant Roster',
    speaker: 'Morrow, Vesper and terrace farmer Aiko',
    kind: 'puzzle',
    opening:
      'The terraces must be replanted before the next tide or they will slide onto the platforms. The roster pinned to the ticket barrier assigns all eight rows to Aiko, a refugee farmer who escaped Hoshimori and now works nights at a bakery. Beneath her name the roster shows every future Aiko: kneeling, kneeling, kneeling, until the last one does not stand up. Seven other volunteers are listed with no rows. Some are strong, some have bad backs, and two have children waiting at home. AIKO: "I am grateful to be here. I will plant." VESPER: "Gratitude is not a shift pattern."',
    artSubject:
      'Morrow and Vesper reading a roster pinned to a ticket barrier where ghostly future versions of a tired farmer kneel along flooded rice rows inside an underground hall, seven volunteers waiting',
    choices: [
      {
        id: 'reassign-rows-by-consent',
        label:
          'Ask each volunteer which rows they can honestly carry and redraw the roster',
        outcome:
          'Morrow asks one person at a time and writes down only what each agrees to: two rows, one, half a row and a flask of tea. Aiko keeps one row because she wants to, not because she owes it. The work finishes just as the tide turns, muddy and incomplete at the lowest step. The ghost-Aikos fade to one, who stands up and stretches.',
        flag: 'transplant-roster-redrawn',
        effects: { trust: 2, supplies: -1, danger: 1 },
        artSubject:
          'Volunteers of all ages kneeling along separate rice rows while a farmer stretches beside a redrawn roster and the last ghostly figure fades',
      },
      {
        id: 'halt-the-tide-clock',
        label:
          'Stop the station clock that drives the tide until everyone can rest and leave',
        outcome:
          'Morrow climbs the barrier and stops the hall clock. The tide holds and nobody plants anything. Aiko goes home to sleep, and so does everyone else. The terraces remain unplanted, and when the clock restarts tomorrow it will be with one day less to work. The canopy notes the stopped hour and shifts three train times in revenge.',
        flag: 'transplant-tide-halted',
        effects: { trust: 1, danger: 2, supplies: 1 },
        artSubject:
          'Morrow perched on a ticket barrier holding still the hands of a large station clock as farmers walk home through a silent flooded hall',
      },
    ],
  },
  '6,3': {
    title: 'Shiori Files the Refuge',
    speaker: 'Vesper, Morrow and Shiori the paper spirit',
    kind: 'companion',
    opening:
      'Shiori has followed Morrow into the underpass and found something to file. It has drawn up Vesper’s friendships as an account in arrears: owes the refuge one map, owes Hanae one door, owes a goblin courier three warnings. It wants to pin the page to the terrace gate, where everyone heading for the refuge will read it. Vesper does not argue with the numbers. The paper spirit is not cruel; it simply believes debt is the only proof that people matter to one another. SHIORI: "If you owe them, they are yours. That is what belonging means." VESPER: "That is what being sold means."',
    artSubject:
      'Shiori, a fluttering paper yōkai of overdue slips, holding a ledger page up to Vesper beside a terrace gate in an underground rice hall, Morrow stepping between them',
    choices: [
      {
        id: 'friends-testify-for-vesper',
        label:
          'Ask Vesper’s friends to testify about what they gave freely and what is still owed',
        outcome:
          'Two refuge stewards and Aiko testify: some of what Vesper owes is real, and some was never a debt at all. Shiori rewrites the page with two columns and pins nothing to the gate. Then it asks to travel with Vesper to learn the difference properly. Vesper accepts, warily. The real debts remain in writing, where Vesper cannot forget them.',
        flag: 'shiori-joins-vesper',
        effects: { trust: 2, evidence: 1 },
        artSubject:
          'A paper yōkai perched on Vesper’s shoulder rewriting a page in two columns while refuge stewards and a farmer speak in a rice-lit hall',
      },
      {
        id: 'give-vesper-the-page',
        label:
          'Take the page from Shiori and hand it to Vesper to keep or destroy',
        outcome:
          'Morrow takes the page and gives it to Vesper, the person it describes. Vesper reads it twice and keeps it folded in their map tube. Shiori is offended at losing its only copy and flutters off up the line alone. Nobody at the gate learns anything, including the stewards who have a right to know some of it.',
        flag: 'shiori-page-to-vesper',
        effects: { trust: 1, danger: 1, evidence: -1 },
        artSubject:
          'Vesper folding a single ledger page into a waterproof map tube as an offended paper yōkai flutters away down an underground passage',
      },
    ],
  },
  '7,3': {
    title: 'The Lift Into a Palace Vesper Never Drew',
    speaker: 'Vesper, Morrow and Char',
    kind: 'memory',
    opening:
      'The ticket-hall lift opens sideways into a palace of green glass, and Vesper freezes on the threshold. Every map they ever drew had edges, and none of them had a sea. Char floats in the corridor beyond, holding the lift door with her tail, and the corridor smells of salt and old perfume. Vesper starts to remember a childhood rumour about a drowned court beyond the south ridge, and how they once drew it as a blank. The lift chimes; it will close in a minute and choose its own next floor. CHAR: "You look like someone reading a place for the first time." VESPER: "I am. It is terrifying."',
    artSubject:
      'Vesper with folded moth wings standing frozen at a lift door that opens sideways onto a green-glass underwater palace corridor, a goth mermaid princess holding the door with her tail, Morrow behind in the rice-lit hall',
    choices: [
      {
        id: 'fix-a-return-floor',
        label:
          'Wedge the door and mark a return floor so Vesper can step out and come back',
        outcome:
          'Morrow jams the door with a terrace stake and chalks the ticket hall as the only return floor. Vesper steps into the palace corridor, touches the wall, and begins a sketch they promise never to sell. Char shows them two rooms and then returns to her own errands. The stake snaps on the way back, and the lift will not open for anyone in this hall again.',
        flag: 'palace-lift-vesper-sketched',
        effects: { evidence: 2, supplies: -1 },
        artSubject:
          'Vesper sketching in a small notebook in a green-glass palace corridor while Morrow braces a lift door with a wooden terrace stake',
      },
      {
        id: 'ask-char-the-palace-floor',
        label:
          'Ask Char whether she wants visitors in her palace at all, and where',
        outcome:
          'Char takes the question seriously. She says strangers in her home make her itch, but she will show one window if Vesper promises not to draw it. Vesper agrees and stands at the window for a long time. The lift closes and moves sideways to some other floor, so the party walks back through the flooded terraces on foot.',
        flag: 'palace-lift-char-window',
        effects: { trust: 2, danger: 1, supplies: 1 },
        artSubject:
          'Vesper and a goth mermaid princess standing side by side at a tall palace window looking out over a dark sea filled with drowned city lights',
      },
    ],
  },
  '8,3': {
    title: 'The Pump That Remembers a Song',
    speaker: 'Morrow, Vesper and Elder Masa',
    kind: 'challenge',
    opening:
      'The irrigation pump that keeps the underpass terraces from flooding the platforms was fixed last week. The receipt, clipped to Vesper’s ledger, records the price: one memory of a lullaby, borrowed from Elder Masa, a refugee who has lived in the city for twenty years. Masa no longer remembers the song he sang to his children in Hoshimori. He did not know the tinker had taken it. The pump now hums the song faintly as it works, to nobody. MASA: "I keep almost catching it in the machine." VESPER: "If we take it out, the terraces fail. If we leave it in, he loses it."',
    artSubject:
      'Morrow and Vesper standing beside an old iron irrigation pump in a flooded underground terrace hall, an elderly man leaning close to listen to its hum, a repair receipt clipped to a ledger',
    choices: [
      {
        id: 'give-masa-his-song',
        label: 'Open the pump and return the lullaby to Masa now',
        outcome:
          'Morrow and Vesper strip the pump and lift the borrowed song out like a warm coal. Masa sings it before they finish. The pump dies, and the lowest terrace slides onto platform 3 within the hour. Commuters wade and complain, and station staff close the platform for days. Masa thanks them and offers to carry sandbags himself.',
        flag: 'pump-lullaby-returned',
        effects: { trust: 2, danger: 2 },
        artSubject:
          'An elderly man singing with his eyes closed beside a stripped iron pump as muddy water spills over a terrace edge onto a station platform',
      },
      {
        id: 'post-the-pump-price',
        label:
          'Keep the pump running and post its true price where every commuter can read it',
        outcome:
          'With Masa’s agreement, Vesper letters a notice above the pump: this machine runs on a lullaby borrowed from a neighbour. Commuters stop to read it, and some leave flowers. Masa visits every evening to listen. The platforms stay dry, the debt stays public, and Masa decides to wait until the tinker can be made to return it properly.',
        flag: 'pump-price-posted',
        effects: { evidence: 2, trust: 1, supplies: 1 },
        artSubject:
          'Commuters reading a hand-lettered notice above a humming iron pump while an elderly man sits nearby listening with flowers at his feet',
      },
    ],
  },
  '1,4': {
    title: 'Sorrel’s Bargain on the Outpatients Escalator',
    speaker: 'Morrow, Nurse Imani and the wolf Sorrel',
    kind: 'merchant',
    opening:
      'The escalator to outpatients runs backward, and on its top step stands Sorrel, a lame old Briar wolf with a cloudy eye, who will not move. Patients with crutches and pushchairs wait at the bottom, frightened. Nurse Imani knows Sorrel is a mother because she keeps asking for bandages. Wolves bargain, and Sorrel names her terms like a merchant: a roll of bandage for each patient she lets past, or an answer to why nobody else has noticed the doors behind her smell of the sea. IMANI: "I can spare six rolls, not sixty." SORREL: "Then spare me the truth instead. Something below is drowning."',
    artSubject:
      'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, at the foot of a backward-running hospital escalator, an old grey wolf with a clouded eye guarding the top, a nurse holding bandage rolls and patients with crutches waiting',
    choices: [
      {
        id: 'pay-sorrel-in-bandages',
        label:
          'Pay Sorrel in bandages and guide each patient past her one by one',
        outcome:
          'Imani counts out six rolls and Morrow pays the rest from the party’s own kit. Sorrel lets every patient by, nodding to each one. Two children wave at her. The bandages go to her pups somewhere in the hospital’s walls, and the party walks on with emptier packs. Nobody asks what is below the doors, and the smell of the sea grows stronger.',
        flag: 'sorrel-paid-bandages',
        effects: { supplies: -2, trust: 1, danger: 1 },
        artSubject:
          'An old grey wolf carrying bandage rolls in her jaws as patients on crutches pass her on a hospital escalator under Morrow’s watch',
      },
      {
        id: 'ask-sorrel-about-the-doors',
        label: 'Ask Sorrel what she is protecting behind the doors',
        outcome:
          'Sorrel leads Morrow to the service doors, where the patient lift shaft is filling with seawater from below. She has kept people away so nobody walked in. Imani radios the facilities team and the shaft is closed. The patients wait an extra half hour, angry, but the warning saves a porter from stepping into a drowned car. Sorrel accepts two bandages and a thank-you.',
        flag: 'sorrel-flooded-shaft-found',
        effects: { evidence: 2, danger: -1, trust: 1 },
        artSubject:
          'Morrow and an old grey wolf peering through hospital service doors into a lift shaft brimming with dark seawater as a nurse radios behind them',
      },
    ],
  },
  '2,4': {
    title: 'Four Cups in the Night Staff Room',
    speaker: 'Morrow, Nurse Imani and Char',
    kind: 'puzzle',
    opening:
      'Four mugs sit on the night staff room table, still warm, and one of them tastes of the royal ocean. Whoever drinks it hears a promise in Char’s voice: "I will not let them choose who matters." Char does not remember saying it anywhere near this ward. Imani’s rota shows four people on break in the last hour: herself, a porter, a junior doctor and a patient’s daughter who wandered in. The mugs have names in marker, half rubbed off. Char wants to know who poured her words into hospital coffee. IMANI: "This is a staff room, not a crime scene." CHAR: "Somebody stole my promise and served it lukewarm."',
    artSubject:
      'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, examining four warm mugs on a hospital staff room table, a tired nurse with a rota and a goth mermaid princess with damp hair leaning close to sniff a cup',
    choices: [
      {
        id: 'trace-the-promise-pourer',
        label:
          'Match the mug names to the break log to find who poured the salt cup',
        outcome:
          'The rubbed letters and the break times point to the patient’s daughter, who had come up from the flooded lower ward carrying seawater in a flask. She heard Char say it there, to a frightened patient, in the first hour of the flood, and Char half remembers it now. Char thanks her stiffly and keeps her distance. The daughter is now known to have been somewhere staff should have stopped her, and Imani has to report it.',
        flag: 'staffroom-pourer-found',
        effects: { evidence: 2, trust: -1, danger: 1 },
        artSubject:
          'A young woman holding a dented flask at a hospital staff room doorway as a mermaid princess studies her and a nurse writes on a rota',
      },
      {
        id: 'leave-cup-for-char',
        label: 'Leave the salt cup untouched for Char to drink or pour away',
        outcome:
          'Morrow slides the mug to Char and steps back. Char holds it, does not drink, and tips it into the sink with a face nobody can read. The promise is hers to keep or release. No one learns how it reached the staff room, and Imani is left uneasy about a ward she cannot account for.',
        flag: 'staffroom-cup-left-for-char',
        effects: { trust: 2, evidence: -1 },
        artSubject:
          'A mermaid princess pouring glowing seawater from a staff room mug into a steel sink while Morrow and a tired nurse watch quietly',
      },
    ],
  },
  '3,4': {
    title: 'The Transfer Route in Moth Dust',
    speaker: 'Morrow, Vesper and Nurse Imani',
    kind: 'companion',
    opening:
      'A transfer memo taped inside the patient lift glitters with Vesper’s scale dust. It describes a route from the hospital through the flooded lower ward into the mermaid court, with every safe pocket of air marked. It also marks a side room where Briar refugees have been sleeping since the collision. Imani needs the route to move three patients before the next tide. Vesper recognises the hand: their own, from a map they sold long ago and never saw again. IMANI: "I do not care who drew it. I care whether it is safe." VESPER: "It is safe for the people moving along it. It was never safe for the people marked on it."',
    artSubject:
      'Vesper with dusty moth wings reading a glittering memo taped inside a hospital patient lift, a nurse preparing a stretcher and Morrow holding the doors, water glinting below the floor grille',
    choices: [
      {
        id: 'vesper-tells-imani',
        label:
          'Ask Vesper why the map was sold, and let Imani decide whether to use it',
        outcome:
          'Vesper tells Imani the short, ugly version and offers to walk the route with her. Imani decides to trust the route but not the memo, and makes Vesper redraw it without the refugee room. The patients cross safely. Vesper stays with the ward team for the night, which Imani says is the first useful thing a cartographer has done for her.',
        flag: 'transfer-vesper-joins-ward',
        effects: { trust: 2, evidence: 1, supplies: -1 },
        artSubject:
          'Vesper redrawing a route on a clean sheet against a hospital wall while a nurse checks it beside a waiting stretcher',
      },
      {
        id: 'copy-the-route-only',
        label:
          'Copy the air pockets onto a fresh card and burn the original memo',
        outcome:
          'Morrow copies the safe pockets and nothing else, and Vesper burns the memo in a sharps bin lid. The transfer goes ahead quickly. Vesper keeps quiet and does not join the ward team. The refugee room stays hidden, but nobody records who made the original, so the buyer escapes another trail.',
        flag: 'transfer-route-copied',
        effects: { supplies: 1, danger: 1, evidence: -1 },
        artSubject:
          'Morrow copying air pockets onto a small card while Vesper burns a glittering memo in a steel lid in a dim hospital corridor',
      },
    ],
  },
  '5,4': {
    title: 'Imani’s Eleventh Night',
    speaker: 'Nurse Imani, Char and Morrow',
    kind: 'challenge',
    opening:
      'The ward rota hangs above the nurses’ station, and under Imani’s name it now shows her every future night shift, stacked like plates. The eleventh one has her asleep on the floor of the lift. Char reads it aloud with horror. Since the collision, every patient coming up from the mermaid court has been routed to Imani because she is the only one who will triage a princess the same as a porter. Six other staff are on the floor. Two are agency nurses who do not know the ward. IMANI: "If I go home, someone gets missed." CHAR: "If you stay, someone gets missed later, and it is you."',
    artSubject:
      'A tired nurse at a hospital ward station beneath a glowing rota that stacks ghostly future night shifts, a mermaid princess in black reading it with alarm and Morrow beside a queue of patients from the sea',
    choices: [
      {
        id: 'ward-shares-the-sea-patients',
        label:
          'Ask each nurse which sea-court patients they will consent to take',
        outcome:
          'Morrow and Char go to each nurse in turn. Some say yes and some say no, and Char offers to translate court etiquette for the agency staff. Imani hands over eight patients and keeps four. The rota thins to one night at a time. Two patients wait longer than they should for a nurse who knows them, and one of them complains to the board.',
        flag: 'ward-sea-patients-shared',
        effects: { trust: 2, danger: 1, supplies: -1 },
        artSubject:
          'A mermaid princess explaining court customs to two agency nurses at a bedside while a tired nurse passes over patient notes',
      },
      {
        id: 'close-the-ward-door',
        label:
          'Halt new transfers from below until every exhausted nurse can go home',
        outcome:
          'Morrow and Char close the lift to the sea court and post a notice on it. Imani goes home and sleeps eleven hours. The ward recovers. But below, the court’s injured wait in a flooded corridor overnight, and by morning Char has a list of who suffered for the pause. She does not blame Imani. She does not let Morrow forget it either.',
        flag: 'ward-transfers-halted',
        effects: { trust: 1, danger: 2, evidence: 1 },
        artSubject:
          'A closed hospital lift door with a handwritten notice, water seeping under it, while a mermaid princess sits beside it writing a list of names',
      },
    ],
  },
  '6,4': {
    title: 'The Next of Kin Drawer',
    speaker: 'Morrow, Nurse Imani and Shiori the paper spirit',
    kind: 'treasure',
    opening:
      'Shiori has reached medical records and filed every next-of-kin form in the hospital as a debt. A daughter owes her father four years of visiting. A partner owes a ward night for every night she was cared for. The drawer is a treasure of a kind: the only complete list of who visits whom since the collision, and Imani could use it to find missing patients. It is also the most private paper in the building. SHIORI: "It is all correct. Who owes, and to whom." IMANI: "Some of these people visit because they love someone. Some visit because nobody else will." MORROW: "Neither is a debt."',
    artSubject:
      'A fluttering paper yōkai perched on an open medical records drawer of next-of-kin forms, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, and a nurse reading over its folded shoulder under hospital fluorescent light',
    choices: [
      {
        id: 'correct-shiori-with-kin',
        label:
          'Ask three visiting families to testify to Shiori that care is not repayment',
        outcome:
          'Three families who choose to speak tell Shiori what visiting means to them. Shiori is quiet for a long time, then unfiles the drawer into ordinary forms. It lets Imani copy only the names of patients still missing, which is the real treasure here. Shiori is exhausted from rethinking an entire filing system and drifts asleep on the radiator.',
        flag: 'kin-drawer-corrected',
        effects: { evidence: 2, trust: 1 },
        artSubject:
          'A paper yōkai dozing on a hospital radiator while a nurse copies a short list of missing names from a record drawer and families talk nearby',
      },
      {
        id: 'return-kin-forms-to-families',
        label: 'Return each family’s form to them and leave the drawer empty',
        outcome:
          'Morrow and Imani hand back form after form across three wards. Families keep their own paper and their own reasons. The hospital loses its only complete visiting list, and Imani has nothing to search with when the next patient goes missing. Shiori, emptied, follows them glumly and asks what else it was wrong about.',
        flag: 'kin-forms-returned',
        effects: { trust: 2, evidence: -1, danger: 1 },
        artSubject:
          'Morrow handing a folded form to an elderly visitor at a hospital bedside while a deflated paper yōkai trails behind a nurse',
      },
    ],
  },
  '7,4': {
    title: 'The Orderly of the Deep Lift',
    speaker: 'Char, Morrow and the anglerfish orderly',
    kind: 'monster',
    opening:
      'The patient lift has stopped going down and started going sideways, toward the palace audience hall. An anglerfish orderly in a ragged court tabard has taken charge of it, its lure glowing above its head like a call light. It wheels every patient toward the throne on the grounds that the court must review all injuries first. A man with a broken leg is already halfway down the corridor. Char recognises the orderly from a hall she escaped as a girl. CHAR: "It only knows one destination. It was built to bring every hurt subject to the throne." MORROW: "Then it can learn a second one."',
    artSubject:
      'A towering anglerfish orderly in a ragged court tabard steering a hospital wheelchair along a flooded sideways lift corridor toward a coral throne, Char and Morrow blocking its path with a stretcher',
    choices: [
      {
        id: 'rope-the-return-shaft',
        label:
          'Rope the lift car to the hospital shaft so it can only return upward',
        outcome:
          'Morrow lashes the car to the shaft rails with oxygen tubing and a fire hose while Char pulls the patient back. The lift now travels only up and down, and the orderly is stuck at its throne end, roaring. The car is safe for patients again, but the orderly will be waiting below whenever someone has to go to the court.',
        flag: 'deep-lift-roped-upward',
        effects: { danger: -1, supplies: -2 },
        artSubject:
          'Morrow lashing a hospital lift car to rails with tubing and hose while Char drags a wheelchair back and an anglerfish orderly roars below',
      },
      {
        id: 'ask-char-to-reroute',
        label: 'Ask Char where she wants the lift and its patients to go',
        outcome:
          'Char tells the orderly, in the old court voice she hates, that the princess wishes to visit the hospital, and every patient is her retinue. The orderly bows and wheels them all up to Imani. Char looks ill afterward. She used a title she wanted to bury, and the orderly now treats her as its mistress, which the court will hear about.',
        flag: 'deep-lift-char-commanded',
        effects: { trust: 2, danger: 1, evidence: 1 },
        artSubject:
          'An anglerfish orderly bowing low before a pale goth mermaid princess as it wheels patients toward a bright hospital ward door',
      },
    ],
  },
  '8,4': {
    title: 'The Ventilator Bought With Laughter',
    speaker: 'Nurse Imani, Morrow and porter Dev',
    kind: 'challenge',
    opening:
      'Bay 4’s ventilator has a receipt taped to its casing. The Briar tinker who repaired it during the flood charged one memory: Dev the porter’s memory of how his late brother laughed. Dev signed without reading because a patient was turning blue. The ventilator is keeping a sea-court courier alive tonight, and there is no spare. Dev only knows something is missing because he no longer smiles at his brother’s photograph. DEV: "I would do it again. I just did not know it would be that." IMANI: "Nobody should have to pay with that and not know it."',
    artSubject:
      'A hospital porter staring at a framed photograph in his hand beside a working ventilator in a dim bay, a nurse and Morrow reading a repair receipt taped to the machine',
    choices: [
      {
        id: 'give-dev-the-laugh',
        label:
          'Swap the borrowed part out and return Dev’s memory, then fight for the courier',
        outcome:
          'Morrow and Imani find a donor ventilator two wards away and fight through an hour of paperwork to borrow it. In the gap, the courier is hand-ventilated by a rota of volunteers. Dev’s memory returns and he laughs, then cries, in the corridor. The courier survives but is weakened, and the other ward has nothing to spare tonight.',
        flag: 'ventilator-laugh-returned',
        effects: { trust: 2, supplies: -2, danger: 1 },
        artSubject:
          'Volunteers taking turns squeezing a hand ventilation bag at a bedside while a porter laughs through tears in a hospital corridor',
      },
      {
        id: 'tell-the-courier-the-cost',
        label:
          'Keep the ventilator running and tell the courier and family what it cost',
        outcome:
          'Imani tells the courier’s sister exactly whose memory is keeping her brother breathing, with Dev standing beside her. The sister swears to see that the tinker repays it. Dev decides to wait. The machine runs all night, and the debt becomes a witnessed obligation instead of a secret. Dev still cannot hear his brother laugh.',
        flag: 'ventilator-cost-told',
        effects: { evidence: 2, trust: 1, danger: -1 },
        artSubject:
          'A nurse and a porter speaking quietly with a mermaid courier’s sister beside a ventilator in a dim hospital bay',
      },
    ],
  },
  '1,5': {
    title: 'The First Real Celebration',
    speaker: 'Morrow, Sal and a wolf on the backward stair',
    kind: 'memory',
    opening:
      'The Riverside Flats stairwell has become a moving stair that carries tenants backward, and a young wolf sits on it outside Flat 9, refusing to let anyone pass the door. Sal, who holds the spare key, says it was empty for years until one winter party. Pinned to the door is a photograph: a small apartment party, paper streamers, lamplight, Rowan’s face, the face everyone here believes is Morrow’s, holding a lopsided homemade cake with candles. A friend in a green sweater stands a step away at the edge of the group, half smiling. SAL: "They had fallen out badly before that night. I was surprised they came." The wolf watches the photograph as though it were a den.',
    artSubject:
      'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, on a backward-moving apartment stairwell, a young wolf guarding a door with a pinned party photograph, an older neighbour holding a spare key',
    choices: [
      {
        id: 'challenge',
        label: 'Ask Sal whether the two of them ever made it up',
        outcome:
          'Sal says only that they kept turning up to the same parties. Morrow studies the half smile and understands that a person can stand near someone without forgiving them. The candles do not erase what came before. The wolf lets Morrow pass but growls at the photograph, and Sal is a little sorry she said anything at all.',
        flag: 'celebration-reconciliation-asked',
        effects: { evidence: 1, trust: -1 },
        artSubject:
          'An older neighbour shrugging on a stair landing while Morrow holds a photograph of a party, a wolf growling softly at the door',
      },
      {
        id: 'hold',
        label: 'Keep the old hurt in view alongside the cake and the candles',
        outcome:
          'Morrow leaves the photograph where it is and sits with the wolf a while. Whatever happened before that first gathering mattered, and so may whatever comes next between those two people, whoever they are now. The wolf steps off the stair and lets the tenants go up. Sal locks Flat 9 again and pockets the key, thoughtful.',
        flag: 'celebration-hurt-held',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Morrow seated beside a young wolf on an apartment stair beneath a pinned party photograph as tenants climb past in lamplight',
      },
    ],
  },
  '2,5': {
    title: 'The Kettle That Boils the Sea',
    speaker: 'Morrow, Sal and the roof-tank laundress',
    kind: 'challenge',
    opening:
      'Every tap in the Riverside Flats runs salt, and the roof tank is overflowing down the stairwell. In Sal’s kitchenette the kettle boils seawater, and her instant coffee tastes of a royal ocean and replays a promise in Rowan’s voice: "Every Sunday, I will come and check on you." Sal is not sure how many Sundays that happened, only that the knocks were real. The water is coming from the roof, where something is singing. SAL: "That was said to me. It is not yours to keep or throw away." MORROW: "No. But I can still knock on Sundays, if you will let me."',
    artSubject:
      'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, beside an older woman in a small kitchenette as a kettle boils over with seawater and salt water streams down a stairwell window',
    choices: [
      {
        id: 'climb-to-the-roof-tank',
        label:
          'Climb to the roof tank and find who is pouring the sea into the building',
        outcome:
          'In the roof tank, Morrow finds a palace laundress who was swept through a drain and has been wringing out other people’s promises to stay afloat. She agrees to leave if Morrow carries her down in a mop bucket. The building runs fresh again by evening. The laundress has to be hidden in Sal’s bath overnight, and the landlord is asking questions.',
        flag: 'roof-tank-laundress-found',
        effects: { evidence: 1, danger: 1, supplies: -1 },
        artSubject:
          'Morrow lifting a startled mermaid laundress from a rooftop water tank into a mop bucket under a grey city sky',
      },
      {
        id: 'set-the-promise-aside',
        label:
          'Pour the promise into a jar for Rowan and offer Sal a new one in Morrow’s name',
        outcome:
          'Morrow pours the salt coffee into a clean jar and labels it for Rowan. Then Morrow asks Sal, plainly, whether a new knock on Sundays would be welcome from the person standing here now. Sal says she will think about it, and that is answer enough. The roof tank still overflows, and the stairwell grows slick and dangerous.',
        flag: 'sunday-promise-set-aside',
        effects: { trust: 2, danger: 2 },
        artSubject:
          'An older woman holding a labelled jar of seawater at her kitchen table while Morrow sits across from her, water dripping from the ceiling',
      },
    ],
  },
  '3,5': {
    title: 'The Fire Plan Under Flat 12',
    speaker: 'Morrow, Sal and Vesper',
    kind: 'treasure',
    opening:
      'A new door has appeared in the stairwell for every household Morrow has joined, and under the newest one someone has slid a memo dusted with moth scales. It is a complete fire plan of the Riverside Flats, better than the landlord’s: every hidden ladder, every roof hatch, and the three flats where displaced Briar families have quietly settled since the collision. The building’s fire escape snapped in the flood. The plan is the best treasure in the building and the most dangerous. Vesper arrives on the landing, having smelled their own dust. SAL: "If the landlord sees this, those families are out by Friday."',
    artSubject:
      'Morrow holding a glittering fire plan beside a new door in an apartment stairwell, an older neighbour reading over a shoulder and Vesper with dusty moth wings on the landing below',
    choices: [
      {
        id: 'ask-vesper-who-bought',
        label: 'Ask Vesper why their map was sold and who is still copying it',
        outcome:
          'Vesper admits the hand is theirs, but the plan is new; someone has been tracing their old style over current buildings. They name the market where such copies are sold. Morrow keeps the original as evidence. The fire escape stays broken tonight, and Sal sleeps with her door unlocked so the Briar families can reach her window.',
        flag: 'fire-plan-copyist-named',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'Vesper pointing to a forged line on a fire plan in a dim stairwell while Morrow tucks the original into a cardigan pocket and a neighbour listens',
      },
      {
        id: 'mend-escape-strike-flats',
        label:
          'Use the plan to mend the fire escape, then strike out the three refuge flats',
        outcome:
          'With Vesper reading the plan, Morrow and Sal rig the roof ladders into a working escape. Vesper scrapes out the three flat numbers until the paper thins. The building is safer for everyone. The plan, stripped of its secret, becomes a gift to the tenants’ association, though it can no longer prove who drew the original.',
        flag: 'fire-plan-escape-mended',
        effects: { supplies: 1, trust: 2, evidence: -1 },
        artSubject:
          'Morrow and an older neighbour bolting a roof ladder into a working fire escape while Vesper scrapes numbers from a glittering plan',
      },
    ],
  },
  '4,5': {
    title: 'The Doorwarden of the Fob Lock',
    speaker: 'Morrow, Sal and the Doorwarden',
    kind: 'monster',
    opening:
      'The lobby fob reader has grown arms. The Doorwarden is a tangle of key rings and buzzer wiring that admits only whoever it least expects, and today it has let in a smiling man who claims to be Sal’s nephew and is carrying a bailiff’s clipboard. It has also locked out four tenants coming home from night shifts. When Morrow approaches, the Doorwarden offers a fob engraved "Family, Flat 15" and holds it out with a dozen hands. SAL: "I do not have a nephew. I have a sister in Leeds who does not speak to me." MORROW: "Then we find out who he really is."',
    artSubject:
      'A many-armed creature of key rings and buzzer wire looming over an apartment lobby door, offering a glowing fob to Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, an older neighbour and a man with a clipboard beyond the glass',
    choices: [
      {
        id: 'unmask-the-visitor',
        label: 'Have Sal question the false nephew in front of the Doorwarden',
        outcome:
          'Sal asks the man three questions about her family, and he gets all three wrong. The Doorwarden, offended at being fooled, flings him onto the pavement and opens for the night-shift tenants. He is a bailiff’s runner who knows exactly which flats are behind on rent. He leaves angry and will be back with paperwork.',
        flag: 'doorwarden-false-nephew-exposed',
        effects: { evidence: 2, danger: 1, trust: 1 },
        artSubject:
          'An older woman with folded arms questioning a nervous man with a clipboard as a creature of key rings hurls him through a lobby door',
      },
      {
        id: 'refuse-the-family-fob',
        label:
          'Refuse the family fob and wrestle the reader’s wiring loose instead',
        outcome:
          'Morrow will not be let in as family to a household that never asked. Morrow grabs the wiring and pulls. The Doorwarden thrashes, cuts a cheek, then collapses into an ordinary dead lock. The door now opens for nobody, and the night-shift tenants climb in through the laundrette window. The false nephew slips away before anyone can question him.',
        flag: 'doorwarden-fob-refused',
        effects: { trust: 2, danger: 2, supplies: -1 },
        artSubject:
          'Morrow tearing tangled buzzer wiring from a lobby wall as a creature of key rings collapses into a dead lock and tenants climb through a window',
      },
    ],
  },
  '5,5': {
    title: 'Mrs Baptiste’s Flood Rota',
    speaker: 'Morrow, Sal and Mrs Baptiste',
    kind: 'challenge',
    opening:
      'The laundrette noticeboard holds the tenants’ flood rota: bailing, sandbags, checking on the elderly, carrying shopping up nine flights. Every slot says Baptiste. Mrs Baptiste cares for her husband through the night and has volunteered for everything because she cannot stand to watch others struggle. Beneath her name the rota now shows her future selves, each greyer than the last, and the final one is sitting on the laundrette floor and not getting up. The machines are spinning on a timer that will not stop. MRS BAPTISTE: "If I do not do it, who will?" SAL: "We would. You never let us."',
    artSubject:
      'An exhausted older woman in a basement laundrette beside a noticeboard rota with ghostly future versions of herself, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, and a neighbour reading it, washing machines spinning',
    choices: [
      {
        id: 'tenants-sign-the-rota',
        label:
          'Knock on every door and ask tenants which flood shifts they will truly take',
        outcome:
          'Morrow and Sal knock on twenty doors. Some tenants say no, some say yes, and one teenager offers to carry shopping if nobody watches. The rota fills unevenly and leaves the Saturday night bailing short. Mrs Baptiste keeps two slots and goes home to sleep. The ghost on the floor fades, but the Saturday gap stays open.',
        flag: 'flood-rota-tenants-signed',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Tenants writing their names on a laundrette rota while an older woman watches, relieved, and the last ghostly figure fades',
      },
      {
        id: 'kill-the-laundrette-timer',
        label:
          'Stop the laundrette timer that drives the rota until everyone can rest',
        outcome:
          'Morrow pulls the master timer and the whole building goes quiet: machines, lifts and rota stop together. Everyone sleeps, Mrs Baptiste included. The floodwater in the basement rises overnight and ruins three tenants’ storage cages. In the morning the rota restarts, still full of one name, and the argument about who should help begins again.',
        flag: 'flood-rota-timer-stopped',
        effects: { trust: 1, supplies: -2, danger: -1 },
        artSubject:
          'Morrow holding a pulled timer switch in a silent dark laundrette as floodwater creeps across the floor toward storage cages',
      },
    ],
  },
  '7,5': {
    title: 'The Lift That Goes Along Instead of Up',
    speaker: 'Morrow, Char and the tenants of the Riverside Flats',
    kind: 'puzzle',
    opening:
      'The Riverside Flats lift now travels sideways through a flooded palace, and its buttons have been renamed: Ballroom, Treasury, Sisters, Drowning Stair, Ground. Pressing Ground takes people to the Treasury. Four tenants are trapped inside with shopping, a cat carrier and a baby monitor, and Char is clinging to the outside of the car where it passes through the palace wall. She knows these corridors. The lift has three trips left before the palace current shifts. CHAR: "The buttons lie in a pattern. Every name is one room to the left of the truth." A TENANT: "Then which one is home?"',
    artSubject:
      'Morrow inside an apartment lift whose doors open sideways onto a flooded palace ballroom, renamed brass buttons glowing, worried tenants with shopping and a cat carrier, a goth mermaid princess pressed to the glass outside',
    choices: [
      {
        id: 'chart-the-button-offset',
        label:
          'Work out the offset from Char’s clue and chalk a true map inside the lift',
        outcome:
          'Morrow tests Char’s rule once, finds that Sisters lies one room left of Ground, and chalks the true destinations above every button. The tenants get home dry. Char swims away before Morrow can ask whether she wanted to go anywhere. The chalk map works for everyone in the building now, and anyone who reads it can also find the palace.',
        flag: 'flats-lift-offset-charted',
        effects: { supplies: 1, evidence: 1, danger: 1 },
        artSubject:
          'Morrow chalking true destinations above glowing brass lift buttons while tenants step out onto a dry apartment landing',
      },
      {
        id: 'ask-char-her-stop',
        label:
          'Ask Char which room she wants the lift to stop at, then take the tenants home after',
        outcome:
          'Char asks for the Sisters room, alone, for five minutes. Morrow holds the doors while she goes in and comes out with a waterproof bundle she does not explain. Then she points out the true Ground button. The tenants are late, cold and angry about the cat, but they get home, and Char owes Morrow a favour she seems to resent.',
        flag: 'flats-lift-char-stopped',
        effects: { trust: 2, danger: 1, supplies: -1 },
        artSubject:
          'A goth mermaid princess swimming out of a dim palace bedroom with a wrapped bundle as Morrow holds an apartment lift door against the current',
      },
    ],
  },
  '8,5': {
    title: 'The Boiler and the Gold Star',
    speaker: 'Sal, Morrow and the Briar tinker’s receipt',
    kind: 'companion',
    opening:
      'The Riverside Flats boiler is warm for the first time since the collision, and the repair receipt is taped to the meter cupboard. It lists one valve, one seal and "one memory: a husband’s voice saying gold star, from Flat 14." Sal reads it twice. She still remembers the sticker on her meter, but not why it made her laugh, and now she knows why. Forty flats have heat. The tinker who did the work is long gone. SAL: "I would have paid it. I wish I had been asked." MORROW: "Then we ask now, before anyone else decides for you."',
    artSubject:
      'An older woman holding a repair receipt beside a gold-star sticker on an apartment meter cupboard, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, beside a warm humming boiler',
    choices: [
      {
        id: 'free-the-gold-star',
        label: 'Open the boiler and give Sal back her husband’s voice',
        outcome:
          'Sal decides she wants it back. Morrow opens the boiler and the voice comes out warm. Sal laughs aloud in the basement. The boiler dies, and forty flats go cold in a week of rain; two elderly tenants move to relatives. Sal, grateful and guilty, offers to walk with Morrow and make the tinker answer for the bargain.',
        flag: 'boiler-voice-returned',
        effects: { trust: 2, supplies: -2 },
        artSubject:
          'An older woman laughing in a dim basement beside a cold open boiler as Morrow holds a faintly glowing valve',
      },
      {
        id: 'tell-the-tenants-the-price',
        label:
          'Keep the heat on and tell the forty flats what their warmth cost',
        outcome:
          'With Sal’s consent, Morrow posts the receipt in the lobby. Tenants bring Sal soup and flowers and stories of their own. One family offers to swap a memory of their own, and Sal refuses gently. The building stays warm. Sal joins Morrow anyway, saying a neighbour who knows the price should help collect it.',
        flag: 'boiler-price-posted',
        effects: { evidence: 2, trust: 1, danger: -1 },
        artSubject:
          'Tenants gathering with soup and flowers around a receipt posted in an apartment lobby while an older woman and Morrow stand together',
      },
    ],
  },
  '1,6': {
    title: 'The Wolf Who Badged In as Kemal',
    speaker: 'Morrow, Bram the night guard and a badged wolf',
    kind: 'monster',
    opening:
      'At the research office, the badge reader admitted a wolf under the name Kemal Aydın, temp, accounts. The wolf now stands on the lobby escalator, which runs backward, carrying early staff toward the street as fast as they climb. Bram, the night guard, has been awake for twenty-two hours and is reaching for the phone to call animal control. The real Kemal stands outside in the rain, badge dead in his hand. The wolf growls whenever anyone approaches the inner doors. BRAM: "The system says that is Kemal. I cannot argue with the system." MORROW: "The system also says I am Rowan."',
    artSubject:
      'A grey wolf wearing a staff lanyard on a backward-running office lobby escalator, early staff stumbling back down, an exhausted security guard reaching for a phone and Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, beside the turnstiles',
    choices: [
      {
        id: 'escort-wolf-past-staff',
        label:
          'Lead the wolf down past the frightened staff and out to the loading dock',
        outcome:
          'Morrow walks up the backward escalator and talks the wolf down, step by step, through a crowd pressed against the walls. It snaps once, tearing Morrow’s cardigan sleeve. At the loading dock it lets go of Kemal’s name, and the badge reader recovers. Bram cancels the call. Nobody learns why the wolf wanted the inner doors.',
        flag: 'lobby-wolf-escorted-out',
        effects: { danger: 1, trust: 1, supplies: -1 },
        artSubject:
          'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, guiding a grey wolf in a staff lanyard down an office escalator past staff pressed to the walls, one cardigan sleeve torn',
      },
      {
        id: 'ask-wolf-about-doors',
        label: 'Ask the wolf what it is protecting behind the inner doors',
        outcome:
          'The wolf says three night workers are sheltering in the break room with a hearth spirit, and the badge system has scheduled their eviction. It used Kemal’s name because the reader would not accept a wolf’s. Bram puts down the phone and checks the logs. The real Kemal waits outside another hour, furious, and his manager docks his pay.',
        flag: 'lobby-wolf-break-room-warning',
        effects: { evidence: 2, trust: 1, danger: -1 },
        artSubject:
          'An exhausted security guard studying a badge log at a lobby desk while a grey wolf in a lanyard sits calmly beside Morrow',
      },
    ],
  },
  '2,6': {
    title: 'Twenty Minutes by Hearth Law',
    speaker: 'Morrow, Bram and the hearth spirit',
    kind: 'challenge',
    opening:
      'The break room coffee machine is plumbed into the flooded basement now, and every cup tastes of the royal ocean. It also replays a promise in Mara’s voice: "Whatever happens, I will cover for you." The hearth spirit that has claimed this room enforces a rest law nobody wrote. Anyone who takes a cup must sit for twenty minutes, and the door will not open until they do. Bram poured the last pot for the night staff and is now trapped on the sofa. Morrow drank before tasting. HEARTH SPIRIT: "Rest, or I will hold you until you do." MORROW: "That promise was not made to me."',
    artSubject:
      'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, holding a steaming mug in a cedar-roofed office break room, an exhausted security guard on a sofa and a glowing hearth spirit barring the door',
    choices: [
      {
        id: 'trace-the-basement-pot',
        label:
          'Ask Bram where he filled the pot and follow the pipe to its source',
        outcome:
          'Bram points to the tap in the copy room. Morrow sits out the twenty minutes, then follows the pipe to the basement, where a crate of Mara’s old notes floats in seawater, every promise she ever wrote leaking out of the ink. Morrow lifts the crate onto a dry shelf. Bram has already fallen asleep on the sofa, and the spirit tucks a coat over him.',
        flag: 'break-room-pipe-traced',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'Morrow hauling a dripping crate of handwritten notes onto a dry shelf in a flooded office basement under a humming pipe',
      },
      {
        id: 'set-aside-maras-promise',
        label:
          'Pour the cup into a jar labelled for Rowan and rest without claiming the promise',
        outcome:
          'Morrow pours the rest of the cup into a jar and writes Rowan on the lid in block capitals, the way Mara writes. Then Morrow sits the full twenty minutes with Bram while the spirit hums. The door opens. Mara will never know how close her loyalty came to being spent by the wrong person, and the night shift is twenty minutes behind.',
        flag: 'break-room-promise-jarred',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Morrow and a tired security guard sitting side by side on a break room sofa beside a labelled jar of seawater as a hearth spirit hums',
      },
    ],
  },
  '3,6': {
    title: 'The Stair Behind the Borrowed Faces',
    speaker: 'Morrow, Vesper, Oren and Bram',
    kind: 'dungeon',
    opening:
      'Behind the main badge reader, past a door marked plant room, a service stair drops into darkness. A memo taped to the rail glitters with Vesper’s scale dust and shows the way down to where the readers keep every face they have borrowed and admitted under a wrong name. The stair’s middle landing has collapsed into floodwater. Bram says three staff went down last night to retrieve their own faces and have not come up. Oren has already measured the gap with a tape and a length of cable. VESPER: "That memo was copied from a map I sold. It shows the way and it shows who hides below." OREN: "Then we take the way and leave the rest."',
    artSubject:
      'A masked, hooded headsman with an axe measuring a collapsed office service stair over dark floodwater, Vesper with moth wings reading a glittering memo, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, and a weary security guard holding a torch',
    choices: [
      {
        id: 'hear-vesper-before-descent',
        label:
          'Ask Vesper why the original map was sold before trusting the memo below',
        outcome:
          'Vesper tells Morrow and Bram the whole sale, including the price. Bram decides he trusts someone who says the ugly part aloud and gives the party his master key. Vesper marks only the safe treads on the memo and folds the rest away. The descent starts with an ally at the top and an hour lost. Oren spends the wait reinforcing the rail.',
        flag: 'borrowed-stair-vesper-heard',
        effects: { trust: 2, evidence: 1, danger: 1 },
        artSubject:
          'A security guard handing a master key to Vesper at the head of a dark service stair as a masked headsman lashes cable to the rail',
      },
      {
        id: 'bridge-the-landing',
        label:
          'Use the memo’s measurements and two office desks to bridge the broken landing',
        outcome:
          'Oren takes the memo’s measurements, carries two desks from the open-plan floor, and bolts them across the collapsed landing as a bridge. Vesper scrapes the hiding-places off the memo before anyone else can read them. The crossing is solid and quick. Facilities will notice the missing desks by morning, and Bram will have to explain them.',
        flag: 'borrowed-stair-desk-bridge',
        effects: { supplies: -1, danger: -1, evidence: 1 },
        artSubject:
          'A masked headsman bolting two office desks across a collapsed stair landing above floodwater while Morrow steadies the far end',
      },
    ],
  },
  '4,6': {
    title: 'Three Badges Marked R. Rowan',
    speaker: 'Morrow, Bram and Rina Rowan',
    kind: 'puzzle',
    opening:
      'Three people stand at the office turnstile, each holding a badge that reads R. Rowan. One is Morrow. One is a Briar fox in a borrowed raincoat, holding a badge it found in the canal. The third is Rina Rowan, an agency cleaner who has worked nights here for six years and whom the system keeps mistaking for Dr Rowan, then locking out. The reader opens only for the person it least expects. Bram has to log one entrant before the morning crowd arrives. BRAM: "Every one of these photos is a little wrong." RINA: "Mine is right. The system just never believed it."',
    artSubject:
      'Three figures at an office turnstile holding identical staff badges, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, a fox in a raincoat and a tired cleaner in a tabard, a weary security guard comparing photos',
    choices: [
      {
        id: 'vouch-for-rina',
        label:
          'Compare the photos and shift logs to prove Rina is the badge’s real holder',
        outcome:
          'Morrow and Bram check six years of night logs, and Rina’s name appears on every one. The turnstile opens for her, and she walks through and bursts into tears. Bram fixes her record properly. The fox is arrested for the canal badge, which upsets a small Briar family waiting for it under the bridge, and Morrow will have to answer to them.',
        flag: 'turnstile-rina-recognised',
        effects: { evidence: 2, trust: 1, danger: 1 },
        artSubject:
          'A cleaner in a tabard passing through an open turnstile in tears while a security guard updates a screen and a fox is led away',
      },
      {
        id: 'hand-back-dr-rowans-badge',
        label:
          'Give up Morrow’s own R. Rowan badge so the others can be checked fairly',
        outcome:
          'Morrow hands Bram the badge that has been carrying another person’s life. The turnstile opens for Rina, and the fox gives its found badge to Bram without a fight. Morrow now has to sign in as a visitor every day, under a name Morrow chooses. The office gossips about it by lunchtime.',
        flag: 'turnstile-morrow-badge-surrendered',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Morrow placing a staff badge on a security desk while a fox hands over its own badge and a cleaner steps through the turnstile',
      },
    ],
  },
  '5,6': {
    title: 'Bram’s Twenty-Second Hour',
    speaker: 'Bram, Morrow and the hearth spirit',
    kind: 'companion',
    opening:
      'Bram’s shift roster hangs inside the security booth, and since the collision it has shown every future version of his exhaustion: a Bram asleep at the desk, a Bram who misses a flood alarm, a Bram who lets the wrong face through because he can no longer tell faces apart. His relief has not come in three nights; the canopy keeps rewriting the train times. He will not leave the building unguarded while borrowed faces are walking through it. The hearth spirit has tried to drag him to the break room twice. BRAM: "Someone has to watch the doors." MORROW: "Someone. Not only you."',
    artSubject:
      'An exhausted security guard in a glass booth beside a roster of ghostly future versions of himself, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, leaning in, a glowing hearth spirit tugging at his sleeve',
    choices: [
      {
        id: 'share-the-door-watch',
        label: 'Ask staff and the wolves who will consent to take a door shift',
        outcome:
          'Two cleaners, a manager and the badged wolf from the lobby agree to cover hours they choose. Bram writes them a careful handover and sleeps on the break room sofa for four hours under the spirit’s watch. He wakes able to see faces again and asks to walk with Morrow. The building runs on volunteers who never signed a contract, which legal will dislike.',
        flag: 'bram-door-watch-shared',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'A security guard asleep under a coat on a break room sofa while a wolf and two cleaners stand watch at glass doors',
      },
      {
        id: 'lock-the-building-down',
        label:
          'Lock every door at shift end so Bram and everyone else can leave together',
        outcome:
          'Morrow persuades Bram to lock the building and walk out with every remaining worker at once. The street is cold, and everyone heads home. The break room shelter is locked out with the rest, and the hearth spirit is furious until Oren carries its coals outside in a kettle. Bram comes back the next day rested and joins Morrow.',
        flag: 'bram-building-locked',
        effects: { trust: 1, supplies: -1, danger: -1 },
        artSubject:
          'A security guard turning a key in glass office doors at night as a crowd of workers walks into the street and a spirit glows in a kettle',
      },
    ],
  },
  '6,6': {
    title: 'Two Hundred and Twelve Covered Shifts',
    speaker: 'Morrow, Mara and Shiori the paper spirit',
    kind: 'memory',
    opening:
      'Shiori has pinned an account to Rowan’s old desk: "Rowan owes Mara 212 covered shifts, 40 coffees, one apology for March." The figures are probably accurate. Morrow remembers the first morning on platform 4, when Mara wrote her name on a coffee receipt in block capitals and walked a stranger onto a train by the sleeve. None of that was a loan. Mara stands at the desk with her lanyard twisted in one hand, reading her own friendship as an invoice. SHIORI: "A balanced book is a happy one." MARA: "It is not a book. It is a person I worried about for three years."',
    artSubject:
      'A paper yōkai pinning a ledger page to a cluttered office desk, Mara with a lanyard and ring binder reading it with a hurt expression and Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, beside her',
    choices: [
      {
        id: 'mara-tells-shiori',
        label:
          'Ask Mara, only if she wishes, to tell Shiori what those shifts actually were',
        outcome:
          'Mara thinks, then tells Shiori about the shifts she covered because she wanted to and the ones she covered resentfully, and the apology she is still owed. Shiori splits the page into gifts and grievances. Morrow cannot apologise for March on Rowan’s behalf, and says so. Mara appreciates the honesty more than she expected and less than she hoped.',
        flag: 'covered-shifts-mara-testified',
        effects: { trust: 1, evidence: 2 },
        artSubject:
          'Mara speaking firmly to a paper yōkai at an office desk as it splits a ledger page in two while Morrow listens',
      },
      {
        id: 'give-mara-the-account',
        label:
          'Hand the page to Mara as the person it describes, and let her keep or tear it',
        outcome:
          'Morrow unpins the page and gives it to Mara. She reads it once more and tears off the line about March, keeping it for whenever Rowan returns. She tears the rest into confetti over the bin. Shiori protests and is ignored. Morrow learns nothing about March, and Mara is quieter than usual for the rest of the day.',
        flag: 'covered-shifts-page-to-mara',
        effects: { trust: 2, evidence: -1 },
        artSubject:
          'Mara tearing a ledger page into confetti over an office bin and pocketing one torn strip while Morrow and a protesting paper yōkai look on',
      },
    ],
  },
  '8,6': {
    title: 'The Badge Server That Forgot Faces',
    speaker: 'Morrow, Bram and the server room tinker’s receipt',
    kind: 'treasure',
    opening:
      'The badge server in the basement was repaired during the flood, and the receipt is still taped to the rack. Under the parts it lists "one memory: how faces fit names, from the night guard." That is why the readers admit wrong people under correct names, and why Bram has been squinting at everyone for a week. Inside the rack sits a sealed drive holding every original badge photo, the only proof of who each worker really is. It would be a treasure to anyone trying to sort borrowed faces from true ones. BRAM: "I thought I was just tired." MORROW: "You were also robbed."',
    artSubject:
      'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, in a cold basement server room holding a repair receipt beside an open rack, a sealed drive glowing inside and a weary security guard rubbing his eyes',
    choices: [
      {
        id: 'give-bram-the-faces',
        label: 'Pull the borrowed part and return Bram’s memory of faces',
        outcome:
          'Morrow lifts the part from the rack and Bram gasps as faces snap back into place. The server fails outright, and every door in the building locks to every badge. Staff will have to be let in by hand until it is replaced. The drive of original photos comes free, a precious record, and Bram guards it himself.',
        flag: 'badge-server-faces-returned',
        effects: { trust: 2, evidence: 1, danger: 1 },
        artSubject:
          'A security guard clutching a glowing drive to his chest in a dark server room as every status light on the racks turns red',
      },
      {
        id: 'tell-staff-why-readers-fail',
        label:
          'Keep the server running and tell every worker why the readers are wrong',
        outcome:
          'With Bram’s permission, Morrow emails the whole office the receipt and its price. Staff start vouching for each other at the doors instead of trusting the readers, which works better than anyone expected. Bram stays face-blind for now. The original photo drive stays locked in the rack, unused, and the readers keep making mistakes.',
        flag: 'badge-server-price-disclosed',
        effects: { evidence: 2, supplies: 1, trust: -1 },
        artSubject:
          'Office workers at a glass entrance vouching for one another by name as a security guard watches and a badge reader blinks uncertainly',
      },
    ],
  },
  '1,7': {
    title: 'Ash on the Footbridge Escalator',
    speaker: 'Morrow, Oren, June Pell and Ash',
    kind: 'puzzle',
    opening:
      'The canal footbridge has an escalator, and it now runs backward toward the drain mouth. Ash has planted herself on the top step and will not move, so commuters are being carried down toward the sea-smelling culvert every time they try to cross. June Pell, a canal maintenance worker in a hi-vis jacket and waders, says the escalator obeys a timer in the control box, and the timer has been rewritten by the canopy into seasons. Oren has already opened the box and is reading the gears. ASH: "I will not step off while those doors stand open." JUNE: "Then we time the crossing around you."',
    artSubject:
      'A grey she-wolf in a reflective tabard planted on a backward canal footbridge escalator, a masked hooded headsman reading the gears of an open control box, a canal worker in hi-vis and waders and Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan',
    choices: [
      {
        id: 'time-the-crowd-past-ash',
        label:
          'Use Oren’s gear count to time the crowd past Ash in safe batches',
        outcome:
          'Oren counts the gears and finds a forward pulse every ninety seconds. June calls the beats, and Morrow walks commuters past Ash in small groups. It takes an hour and Oren’s full concentration, and one man still panics and has to be carried. Everyone crosses. Ash stays at her post, unexplained, and June marks her as a hazard on the canal log.',
        flag: 'footbridge-crowd-timed',
        effects: { trust: 1, supplies: -1, danger: 1 },
        artSubject:
          'A masked headsman counting off beats as small groups of commuters cross a canal footbridge past a watchful grey wolf, a canal worker waving them on',
      },
      {
        id: 'ask-ash-about-drain-doors',
        label: 'Ask Ash what the drain doors are hiding before anyone crosses',
        outcome:
          'Ash says the drain doors hold a dry ledge where people from the old tide-gate crossing have been sleeping, and the escalator would carry strangers to them. June knew nothing about it. Oren rigs the escalator to stop dead instead of running backward, and the commuters walk across on still steps. Ash keeps watching; the sleepers below are now known to three more people.',
        flag: 'footbridge-drain-sleepers-heard',
        effects: { evidence: 2, trust: 2, danger: -1 },
        artSubject:
          'A grey wolf looking down at a canal drain mouth from a stopped footbridge escalator while a canal worker and Morrow listen and commuters walk past',
      },
    ],
  },
  '2,7': {
    title: 'June’s Thermos',
    speaker: 'June Pell, Morrow and Oren',
    kind: 'companion',
    opening:
      'June Pell pours tea from her thermos on the canal wall, and it tastes of the royal ocean. Then it says, in a voice none of them knows: "We will come back for the ones on the steps." Morrow has heard those words before, on platform 4. June filled the thermos from the drain tap, the same water that runs from the sea gate below the clock tower. She has worked this canal eighteen years and says somebody always promises to come back and somebody always does not. OREN: "That promise has been spilled across the whole city." JUNE: "Then it is a long way from whoever was meant to keep it."',
    artSubject:
      'A canal maintenance worker in hi-vis pouring tea from a thermos on a wet canal wall, steam carrying a faint glowing voice, Morrow and a masked hooded headsman sitting with her under a grey sky',
    choices: [
      {
        id: 'follow-the-drain-tap',
        label:
          'Follow the drain tap back toward the sea gate to find who first made the promise',
        outcome:
          'June leads Morrow and Oren through the culvert to the old sea gate, where the promise is scratched into the stone in several hands, tally marks beneath it. Nobody signed it. June decides to come along, because she wants to know who kept count. The culvert floods behind them as they climb out, and Oren loses a coil of rope.',
        flag: 'thermos-drain-tap-followed',
        effects: { evidence: 2, supplies: -1, danger: 1 },
        artSubject:
          'A canal worker shining a torch on scratched words and tally marks on an old stone sea gate as Morrow and a masked headsman wade behind her',
      },
      {
        id: 'cap-the-thermos-for-keeper',
        label:
          'Cap the thermos and leave the promise for whoever it belongs to',
        outcome:
          'June screws the lid on tight and writes on the side in marker: for the one who said it. She says she will carry it until the owner turns up, since she is on this canal every day anyway. Then she asks Morrow whether there is room for one more on whatever this is. The trail goes no further today.',
        flag: 'thermos-capped-for-keeper',
        effects: { trust: 2, supplies: 1 },
        artSubject:
          'A canal worker writing on a capped steel thermos with a marker pen while Morrow and a masked headsman wait beside her on the canal wall',
      },
    ],
  },
  '3,7': {
    title: 'The Memo That Remembers Its Sale',
    speaker: 'Morrow, Oren and June Pell',
    kind: 'memory',
    opening:
      'June fishes a memo out of the canal grille with a litter picker. It is a route chart for the drain crossing, glittering with Vesper’s scale dust, and when Morrow holds it the paper remembers aloud. A young voice, Vesper’s, younger than Morrow has ever heard it, is bargaining in a market stall: "It is only for rescue. You promised." A second voice laughs. The same chart shows a ledge in the culvert where people from the old crossing are sheltering. Oren says the culvert stair has rotted through and the chart is the only accurate survey. JUNE: "Somebody bought that. Somebody is still using it." OREN: "Then it can at least carry people out."',
    artSubject:
      'A canal worker in hi-vis holding up a dripping glittering memo on a litter picker beside a drain grille, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, reaching for it and a masked hooded headsman studying a rotted culvert stair',
    choices: [
      {
        id: 'listen-to-the-sale',
        label:
          'Hold the memo and listen to the whole memory of why it was sold',
        outcome:
          'Morrow listens to the end: the hunger, the buyer’s promise, the coins counted into a child’s hand. The buyer’s name is spoken once. Morrow writes it down and folds the memo shut, so the ledge stays unread. Learning why does not make it lighter. June says she will not repeat a word of it unless Vesper asks her to.',
        flag: 'canal-memo-sale-heard',
        effects: { evidence: 2, trust: 1, danger: 1 },
        artSubject:
          'Morrow standing very still by a canal with a glowing memo pressed to one ear while a canal worker and a masked headsman wait in silence',
      },
      {
        id: 'survey-the-culvert-stair',
        label:
          'Use the chart’s survey to rebuild the culvert stair and black out the ledge',
        outcome:
          'Oren uses the chart’s measurements to set scaffold boards across the rotten treads, and June bolts them. Morrow blacks out the ledge with canal mud. Six sheltering people climb out by choice and two stay below by choice. The memo’s voice goes quiet in the mud. Whoever bought the map is no closer to being found.',
        flag: 'canal-memo-stair-rebuilt',
        effects: { supplies: -2, trust: 2 },
        artSubject:
          'A masked headsman laying scaffold boards across a rotted culvert stair as people climb out toward daylight and a canal worker bolts the treads',
      },
    ],
  },
  '4,7': {
    title: 'The Lock Gate That Wants Oren’s Face',
    speaker: 'Oren, June Pell and Morrow',
    kind: 'challenge',
    opening:
      'The canal lock has a new badge reader, courtesy of the office collision, and it opens the gate only for the person it least expects. It has refused June, refused Morrow, and lit up green for Oren. Then it asks for a face scan to confirm the entry. Oren has never removed the mask and does not intend to begin. Behind the gate, a narrowboat full of evacuees is waiting for the water to drop. The reader offers a solution of its own: log Oren as Arthur Pike, lock-keeper, deceased. JUNE: "Arthur trained me. He would hate this." OREN: "A gate needs a crank and a strong back. Not a face."',
    artSubject:
      'A masked, hooded headsman with an axe on his back standing before a canal lock badge reader glowing green, a canal worker in hi-vis and Morrow beside a narrowboat of evacuees',
    choices: [
      {
        id: 'june-vouches-for-oren',
        label:
          'Have June sign the lock log as witness to who Oren is and what Oren did',
        outcome:
          'June writes in the lock-keeper’s paper log: Oren, masked, operated this gate under my supervision. The reader accepts a human witness and lowers the water. The evacuees pass. June has put her job on the line by signing for a stranger in a hood, and the canal authority will ask her about it.',
        flag: 'lock-june-signed-witness',
        effects: { trust: 2, evidence: 1, danger: 1 },
        artSubject:
          'A canal worker signing a weathered paper logbook at a lock while the gate opens and a narrowboat of evacuees glides through',
      },
      {
        id: 'crank-the-gate-by-hand',
        label:
          'Refuse the dead keeper’s name and have Oren crank the lock by hand',
        outcome:
          'Oren tears the reader off its post and finds the old manual crank beneath. It takes an hour, every rope in the kit and Morrow’s shoulder to open the paddles. The narrowboat passes late, its passengers shivering. Arthur Pike’s name stays where it belongs, on the memorial plaque, and June quietly thanks Oren.',
        flag: 'lock-cranked-by-hand',
        effects: { supplies: -2, trust: 1, danger: 2 },
        artSubject:
          'A masked headsman and Morrow heaving on an old iron lock crank beside a torn-off badge reader as a narrowboat waits in rising mist',
      },
    ],
  },
  '5,7': {
    title: 'A Seat Beside the Window',
    speaker: 'Morrow, June Pell and the evening train roster',
    kind: 'memory',
    opening:
      'In the canal lost-property tray, among wet gloves and a dog lead, June finds a photograph. Two adults sit side by side on a quiet evening commuter train, their hands resting on the seat between them and almost touching, city lights at dusk through the window. Clipped to it is a page of an old shift roster showing two names on the same late finish, night after night, for a year. The overtime is unpaid on every line. One figure might be Rowan; the focus is too soft to say. JUNE: "That is the 9:50 over this bridge. I have watched it for years." Morrow looks at the hands for a long time.',
    artSubject:
      'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, holding a soft-focus photograph of two adults on an evening train beside a canal lost-property tray, a canal worker in hi-vis looking over a shoulder, a late train crossing the bridge above',
    choices: [
      {
        id: 'challenge',
        label:
          'Refuse to name what these two were to each other from one photograph',
        outcome:
          'There may have been trust here, or merely company during a long unpaid commute. Morrow says aloud that a vow cannot be deduced from two hands on a seat, and June agrees. Morrow puts the photograph and roster back in the tray for whoever lost it. It feels wise and lonely at once.',
        flag: 'window-seat-unnamed',
        effects: { evidence: 1, trust: 1 },
        artSubject:
          'Morrow returning a photograph and roster page to a canal lost-property tray as a late train crosses the bridge overhead',
      },
      {
        id: 'hold',
        label: 'Let the unforced closeness stand, without explaining it away',
        outcome:
          'Morrow keeps looking. The image unsettles because it shows a tenderness nobody authorised and Morrow cannot entirely despise. Whatever it was belonged to the two people on that seat. Morrow asks June to keep it safe, and June tucks it inside her jacket with the thermos. The 9:50 passes again, almost empty.',
        flag: 'window-seat-held',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'A canal worker tucking a photograph into her hi-vis jacket as Morrow watches an almost empty evening train cross the bridge',
      },
    ],
  },
  '6,7': {
    title: 'The Clog of Unpaid Debts',
    speaker: 'Oren, June Pell and the Ledger Clog',
    kind: 'monster',
    opening:
      'Something is blocking the main storm drain, and the canal is backing up into the streets. June’s torch finds it: a sodden mass of paper the size of a van, every page a debt Shiori once filed and shed. It has reorganised itself into a creature that alphabetises the people trapped at the old crossing as debts owed to the sea. "Adebayo, twelve breaths. Brannock, one family." Every time the water rises, it adds interest. Three people are clinging to a ledge behind it. LEDGER CLOG: "They were promised a return. Promises are debts. I am collecting." JUNE: "That is not how rescue works." OREN: "Then we unmake the ledger."',
    artSubject:
      'A van-sized sodden creature of ledger pages blocking a storm drain under torchlight, a canal worker in waders and a masked hooded headsman bracing against rising water, three people clinging to a ledge beyond',
    choices: [
      {
        id: 'testify-against-the-clog',
        label:
          'Ask the stranded people and June to testify that a promise is not a price',
        outcome:
          'The people on the ledge call out, one by one, what they were promised and what they actually owe, which is nothing. June adds eighteen years of canal rescues, none of them billed. The Clog sags as its pages lose their sums, and Oren pulls it apart with a boathook. The stranded climb free, soaked. The testimony costs them; one woman weeps for an hour.',
        flag: 'ledger-clog-testified-down',
        effects: { trust: 2, evidence: 1, danger: 1 },
        artSubject:
          'People on a drain ledge calling out as a paper creature sags apart and a masked headsman tears it open with a boathook',
      },
      {
        id: 'peel-pages-to-their-owners',
        label:
          'Peel the pages off one by one and return each to the person it names',
        outcome:
          'Oren holds the drain open while Morrow and June peel the creature apart page by page, reading each name and passing the page to its owner where possible. It takes hours. The water rises twice, and Morrow is nearly swept under. The stranded people leave with their own pages in their pockets. Half the names belong to people nobody can find.',
        flag: 'ledger-clog-pages-peeled',
        effects: { danger: 2, trust: 1, supplies: -1 },
        artSubject:
          'Morrow and a canal worker peeling soaked pages from a paper creature in a flooding drain as a masked headsman holds the grate open with his whole body',
      },
    ],
  },
  '7,7': {
    title: 'The Boat Lift Into the Palace Moat',
    speaker: 'Char, Oren and June Pell',
    kind: 'challenge',
    opening:
      'The canal’s old boat lift, a tank that raises narrowboats between levels, now travels sideways and lowers boats into a palace moat. A family narrowboat is already in the tank, the father shouting, the mother bailing. June swears at the lift’s operating panel. Char surfaces in the moat beside the boat and grips the hull to stop it drifting toward the palace gate. The current is strong, and she will not be able to hold it long. CHAR: "Your lift wants to deliver them to the gate guards. I do not." OREN: "Then the lift needs a counterweight it does not expect. June, how much does your van weigh?"',
    artSubject:
      'A goth mermaid princess gripping the hull of a family narrowboat in a palace moat where a canal boat lift tank has swung sideways, a masked headsman at a counterweight chain and a canal worker swearing at a control panel',
    choices: [
      {
        id: 'counterweight-return',
        label:
          'Rig June’s van as a counterweight so the lift can only return to the canal',
        outcome:
          'Oren chains June’s maintenance van to the counterweight. The lift lurches back toward the canal with Char still holding the boat. The family is home in ten minutes. The van is dragged into the tank and ruined, which will cost June her vehicle allowance for a year, and the lift is jammed half-open for good.',
        flag: 'boat-lift-van-counterweight',
        effects: { supplies: -2, danger: -1, trust: 1 },
        artSubject:
          'A maintenance van chained to a groaning counterweight as a boat lift swings back toward a city canal with a mermaid princess holding the narrowboat',
      },
      {
        id: 'ask-char-the-moat-way',
        label:
          'Ask Char which way she wants the boat to go and follow her lead',
        outcome:
          'Char says there is a side canal under the palace that comes up in a city reservoir, and she would rather swim it than see this family meet her old guards. She tows the boat herself, slowly, and the family reaches the reservoir by nightfall, frightened but free. Char arrives exhausted and refuses help out of the water.',
        flag: 'boat-lift-char-towed',
        effects: { trust: 2, danger: 1, evidence: 1 },
        artSubject:
          'A goth mermaid princess towing a narrowboat along a dim tunnel beneath a palace as a family huddles aboard with torches',
      },
    ],
  },
  '1,8': {
    title: 'Grey at the Second Midnight',
    speaker: 'Morrow, Mara and Captain Grey',
    kind: 'challenge',
    opening:
      'At the Broken Clock Tower, midnight has arrived twice, and the research office on its lower floors has not closed once. The tower escalator runs backward, carrying late staff up toward the clock face instead of out to the street. Captain Grey stands on its bottom step, blocking the doors, and will not move. Mara has stayed late again and is furious, because her last train was rewritten out of the timetable an hour ago, and she has a shift in the morning. MARA: "I have done my hours. I want to go home." GREY: "Not through these doors. Not until the third midnight has passed."',
    artSubject:
      'A huge armored grey wolf blocking the doors at the foot of a backward-running escalator inside a clock tower lobby, Mara with a lanyard and ring binder confronting him and Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, between them under a glowing clock face',
    choices: [
      {
        id: 'walk-staff-past-grey',
        label: 'Guide the frightened late staff past Grey and out of the tower',
        outcome:
          'Morrow walks the late staff past Grey in a tight group, with Mara at the front. Grey lets them go with a low growl. They reach the street and find it is midnight again there too; the doors only led to a different stretch of the same night. Mara is out of the building but no closer to home.',
        flag: 'second-midnight-staff-walked',
        effects: { trust: 1, danger: 2 },
        artSubject:
          'Mara and late office staff stepping out of a clock tower onto a street where every clock reads midnight, an armored wolf watching from the doors',
      },
      {
        id: 'ask-grey-about-midnight',
        label:
          'Ask Grey why he is guarding the tower doors against the third midnight',
        outcome:
          'Grey says that people who leave between midnights lose the hour to the tower and wake with one less memory. He has watched three cleaners go. Mara listens, sits down on the bottom step, and phones her neighbour to feed the cat. The staff stay inside, safe and very tired, and the night goes on.',
        flag: 'second-midnight-grey-heard',
        effects: { evidence: 2, trust: 1, supplies: -1 },
        artSubject:
          'Mara sitting on the bottom step of a clock tower escalator making a phone call while an armored wolf and Morrow guard the doors',
      },
    ],
  },
  '2,8': {
    title: 'The Midnight Machine Coffee',
    speaker: 'Morrow, Walt and the clock inspector',
    kind: 'treasure',
    opening:
      'The tower lobby vending machine pours coffee that tastes of the royal ocean, and Walt has drunk three cups waiting for his shift to end. Each one replays his own promise to his daughter: "Home by midnight, love." He has now broken it twice, because midnight keeps returning. Inside the machine’s coin box, the clock inspector has hidden her master key to the clock face, wrapped in a receipt that says it was paid for with a promise. Whoever opens the box gets the key. WALT: "I just want to keep my word once tonight." CLOCK INSPECTOR: "That key is the only thing that winds the third midnight."',
    artSubject:
      'A night cleaner holding a steaming paper cup beside a clock tower lobby vending machine with its coin box open, a heavy brass master key wrapped in a receipt, Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, and a clock inspector in a peaked cap',
    choices: [
      {
        id: 'trace-the-inspectors-pour',
        label:
          'Trace who has been filling the machine and why it carries Walt’s promise',
        outcome:
          'The inspector admits she filled it from the canal, hoping someone would taste the broken promises and fix the clock. Morrow takes the key from the coin box as evidence. Walt is no closer to home. The inspector, caught, agrees to show Morrow the clock face, but she will expect a decision there that she cannot make herself.',
        flag: 'midnight-machine-key-taken',
        effects: { evidence: 2, supplies: 1, danger: 1 },
        artSubject:
          'Morrow holding up a brass master key from an open vending machine coin box as a clock inspector lowers her eyes and a cleaner watches',
      },
      {
        id: 'give-walt-his-promise',
        label:
          'Leave the key and help Walt carry his promise home to its rightful keeper',
        outcome:
          'Morrow leaves the key in the coin box and walks Walt out through the side door to the night bus, which has rewritten its route but still runs. He reaches home at the third midnight, the real one, and his daughter is asleep on the sofa waiting. The key stays with the inspector.',
        flag: 'midnight-machine-walt-home',
        effects: { trust: 2, danger: -1 },
        artSubject:
          'A night cleaner stepping off a late bus toward a lit window where a figure dozes on a sofa, Morrow waving from the bus door',
      },
    ],
  },
  '3,8': {
    title: 'The Night Moth of Unsold Memos',
    speaker: 'Morrow, Vesper and the Night Moth',
    kind: 'monster',
    opening:
      'A moth made of every copied memo bearing Vesper’s scale dust has filled the tower stairwell, its wings a patchwork of refuge routes, fire plans and transfer charts. It is climbing toward the clock face to spread itself across the third midnight, when the whole city will be looking up. Its dust stings like nettles. Vesper stands on the landing with an unsold map clutched to their chest, staring at their own handwriting turned into a monster. The stair below the moth has collapsed. VESPER: "Everything I ever drew is in there, the good routes and the sold ones." MORROW: "Then it is half rescue."',
    artSubject:
      'A vast moth whose wings are patchworks of glittering maps filling a clock tower stairwell, Vesper with dusty folded wings on a landing clutching a map tube and Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, shielding their face from stinging dust',
    choices: [
      {
        id: 'vesper-confronts-the-moth',
        label:
          'Ask Vesper to tell the moth why the maps were sold, so it knows which are poison',
        outcome:
          'Vesper speaks to the moth as if to a younger self: which maps were sold, which routes were betrayed, which were truly for rescue. The sold wings wither and fall, and the moth shrinks to something that can be folded into a tube. Vesper is shaking, and the stair dust has burned their hands. The rescue routes survive.',
        flag: 'night-moth-sold-wings-fell',
        effects: { evidence: 2, trust: 1, danger: 1 },
        artSubject:
          'Withered map-wings falling from a shrinking moth in a clock tower stairwell as Vesper speaks to it with burned, outstretched hands',
      },
      {
        id: 'stitch-the-stair-with-wings',
        label:
          'Use the moth’s rescue wings to patch the collapsed stair and climb past it',
        outcome:
          'Morrow and Vesper tear rescue routes from the moth’s wings and lay them over the broken treads, where the paper stiffens into a walkable bridge. The moth flutters on upward with only its betraying wings left. The party is past it, and the third midnight will carry Vesper’s worst maps across the sky.',
        flag: 'night-moth-stair-patched',
        effects: { supplies: 1, danger: 2, trust: -1 },
        artSubject:
          'Vesper and Morrow laying glowing map pages over a collapsed tower stair as a smaller moth of dark wings flutters up toward a clock face',
      },
    ],
  },
  '4,8': {
    title: 'The Door That Offers One Owner',
    speaker: 'Morrow, Dr Sen and the hearth spirit',
    kind: 'challenge',
    opening:
      'The clock tower’s inner door has a badge reader that opens only for the person it least expects, and it has just opened for the hearth spirit, which followed Morrow up from the break room with its coals in a kettle. Dr Sen, who stayed late to log the triple midnight, wants to know why. The reader flashes a second offer at Morrow: full access, as sole owner of the city’s hours. One name on every timetable, one keeper of every door. HEARTH SPIRIT: "I only came because nobody here has rested." DR SEN: "An owner of all the hours would be a single point of failure." MORROW: "And a tyrant."',
    artSubject:
      'A small glowing hearth spirit carrying coals in a kettle through an open clock tower door, a badge reader flashing an offer at Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, and a scientist with a notebook watching',
    choices: [
      {
        id: 'let-the-hearth-spirit-in',
        label:
          'Confirm the hearth spirit as the real visitor and follow it inside',
        outcome:
          'Dr Sen logs the spirit as the authorised entrant, citing its record of protecting workers. The spirit leads Morrow into the tower, warming the cold stairwell with its kettle. It insists everyone rest on each landing, which slows the climb and eases every aching knee. Morrow enters as a guest of the hearth, not its owner.',
        flag: 'tower-door-hearth-entrant',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'A hearth spirit with a glowing kettle leading Morrow and a scientist up a tower stair, the group resting on a landing in warm light',
      },
      {
        id: 'refuse-sole-ownership',
        label:
          'Decline the offer of sole ownership and wedge the door for everyone instead',
        outcome:
          'Morrow presses the reject panel three times until the reader gives up and fails open. Anyone can walk in now, including people who should not. Dr Sen records the refusal as a precedent: no single owner. The hearth spirit nods approvingly. The open door lets cold wind and something with claws into the lower stair.',
        flag: 'tower-door-ownership-refused',
        effects: { trust: 1, evidence: 2, danger: 2 },
        artSubject:
          'Morrow jabbing a reject panel on a badge reader as a clock tower door swings wide to a cold night wind and a scientist writes in a notebook',
      },
    ],
  },
  '5,8': {
    title: 'The Hour Broker’s Stall',
    speaker: 'Morrow, Mara and the hour broker',
    kind: 'merchant',
    opening:
      'On the tower’s fourth landing, a Briar pedlar with a coat lined in watch faces has set up a stall. The hour broker sells the extra hours of the three midnights, harvested from the office’s exhausted workers, each hour sealed in a glass bead. Mara could buy six hours to finish her report and still sleep. The broker’s shift roster lists the people the hours came from, and every one of them is still upstairs at a desk. HOUR BROKER: "Time is the only thing this city ever really trades." MARA: "Those are my colleagues’ evenings in a jar."',
    artSubject:
      'A Briar pedlar in a coat lined with ticking watch faces at a lantern-lit stall of glass beads on a clock tower landing, Mara with a lanyard hesitating over a bead and Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, reading a roster',
    choices: [
      {
        id: 'buy-only-consented-hours',
        label:
          'Buy only hours their original workers consent to sell, at a fair price',
        outcome:
          'Morrow takes the roster upstairs and asks each worker whether they will sell, and for how much. Four say yes, and the money goes to them instead of the broker, who complains bitterly about margins. Mara gets two hours, not six. The rest of the beads go back to their owners, who sleep at their desks.',
        flag: 'hour-broker-consented-hours',
        effects: { supplies: -1, trust: 2, evidence: 1 },
        artSubject:
          'Office workers counting coins at their desks as Mara holds two glass beads of light and an hour broker sulks behind his stall',
      },
      {
        id: 'smash-the-brokers-clock',
        label:
          'Stop the broker’s great watch so no more hours can be harvested tonight',
        outcome:
          'Morrow grabs the broker’s master watch and stops it. Every harvested bead cracks, and the hours flood back to the workers upstairs, who wake suddenly and go home. The broker flees down the stair swearing revenge. Mara’s report goes unfinished, and she is in trouble at nine, but she goes home with her colleagues.',
        flag: 'hour-broker-watch-stopped',
        effects: { trust: 1, danger: 1, supplies: 1 },
        artSubject:
          'Glass beads cracking and releasing light across a tower landing as Morrow holds a stopped watch and a pedlar flees down the stairs',
      },
    ],
  },
  '6,8': {
    title: 'The After-Hours Ledger',
    speaker: 'Morrow, Dr Sen and Shiori the paper spirit',
    kind: 'puzzle',
    opening:
      'The tower archive is lined with Shiori’s after-hours ledger, which files every friendship formed working late as a debt: who stayed to help whom, who owes a lift, who owes a favour for a missed child’s recital. Dr Sen has found her own page and is checking its arithmetic, because she cannot help it. The page claims she owes her students nineteen evenings. Her students’ pages claim they owe her nineteen. Shiori cannot reconcile the totals, and the tower clock stalls whenever the books do not balance. SHIORI: "Everyone owes everyone. It cannot balance." DR SEN: "It balances perfectly. Nobody owes anybody."',
    artSubject:
      'A scientist checking a column of figures in a clock tower archive lined with fluttering ledger pages, a puzzled paper yōkai perched on a shelf and Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, beside a stalled clock mechanism',
    choices: [
      {
        id: 'balance-it-by-testimony',
        label:
          'Have Dr Sen and her students testify that the late evenings were shared, not lent',
        outcome:
          'Dr Sen phones two students who are still awake. Both say the evenings were shared, not lent. Shiori cancels the matching columns and finds the books balanced at zero. The tower clock lurches forward one minute. Shiori is so moved it starts weeping ink, which ruins a shelf of real archive records.',
        flag: 'after-hours-ledger-balanced',
        effects: { evidence: 2, trust: 1, supplies: -1 },
        artSubject:
          'A paper yōkai weeping ink onto a shelf as a scientist on the phone points to a column of zeroes and a stalled clock gear turns',
      },
      {
        id: 'return-late-pages',
        label:
          'Gather every page from the archive and hand them back to the people described',
        outcome:
          'Morrow and Dr Sen bundle the pages by name and carry them to the late workers still in the building. People read and pocket their own friendships, some smiling, some embarrassed. The tower clock stays stalled because the ledger never balanced, but nobody’s kindness is on file any longer.',
        flag: 'after-hours-pages-returned',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Morrow and a scientist handing bundles of pages to tired office workers at their desks under a stalled tower clock',
      },
    ],
  },
  '7,8': {
    title: 'The Tower Lift That Swims',
    speaker: 'Char, Morrow and Mara',
    kind: 'companion',
    opening:
      'The clock tower’s service lift moves sideways now, through a column of seawater that has risen into the tower from the palace below. It goes to two places: the clock face, or a palace corridor Mara has never seen and does not want to. Mara is inside with her ring binder above her head. Char rides on the lift roof, having swum up the shaft. She is the only one who can read the palace’s current. The lift will make one more trip before the shaft floods completely. MARA: "I am not visiting a palace in my work shoes." CHAR: "Then decide where you want to go, and I will tell you if it is a lie."',
    artSubject:
      'A clock tower service lift moving sideways through a column of seawater, Mara holding a ring binder over her head inside and a goth mermaid princess crouched on the lift roof, Morrow bracing the doors',
    choices: [
      {
        id: 'rope-the-clock-floor',
        label:
          'Tie the lift to the clock-face floor so it can only return there',
        outcome:
          'Morrow loops a fire hose through the lift’s cage and lashes it to the clock-floor rail. The lift drags itself up out of the water and stops, dripping, at the clock face. Mara steps out shaking. Char swims off down the shaft without a word, because nobody asked her. The lift will never go sideways again, or anywhere else.',
        flag: 'tower-lift-roped-clock',
        effects: { danger: -1, supplies: -1, trust: -1 },
        artSubject:
          'Mara stepping out of a dripping lift onto a clock tower floor lashed with a fire hose as a mermaid princess dives away down the flooded shaft',
      },
      {
        id: 'ask-char-the-tower-floor',
        label:
          'Ask Char where she wants to go, and whether she will come up with them',
        outcome:
          'Char looks at the clock face, then the palace corridor, and says she has spent enough of her life being carried somewhere else. She chooses the clock face and climbs out beside Mara. She stays with Morrow for the rest of the tower, and Mara, to her own surprise, lends her a dry cardigan.',
        flag: 'tower-lift-char-joins',
        effects: { trust: 2, danger: 1, evidence: 1 },
        artSubject:
          'A goth mermaid princess climbing out of a flooded lift beside Mara, who offers her a dry cardigan, at the base of a giant glowing clock face',
      },
    ],
  },
  '8,8': {
    title: 'The Receipt Under the Clock Face',
    speaker: 'Morrow, Mara and the clock inspector',
    kind: 'memory',
    opening:
      'Behind the great clock face, the inspector shows Morrow the last repair receipt. The tower’s minute hand was fixed after the collision with a borrowed memory: the evening Mara first stayed late and found Rowan asleep at a desk, and covered the work, and walked out together at dawn. Mara does not remember that evening any more. She has worked the triple midnight because the tower has been running on it. The rest of the tower’s fate waits further on; this receipt is smaller and closer. CLOCK INSPECTOR: "Take it out and the hand drops. Leave it and she never gets that night back." MARA: "I want to know what I gave."',
    artSubject:
      'Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, behind a vast translucent clock face holding a long repair receipt, Mara with her lanyard beside a halted minute hand and a clock inspector in a peaked cap',
    choices: [
      {
        id: 'return-maras-evening',
        label: 'Remove the borrowed memory and return Mara’s evening to her',
        outcome:
          'Morrow lifts the memory from the minute hand. Mara remembers, all at once, and has to sit down. The minute hand drops to the half hour and the tower groans; the city’s clocks will stutter for a day. Mara does not say what she remembered about Rowan. Morrow does not ask.',
        flag: 'clock-face-evening-returned',
        effects: { trust: 2, danger: 2 },
        artSubject:
          'Mara sitting on the floor behind a giant clock face with her hand over her mouth as a minute hand drops and Morrow holds a glowing memory',
      },
      {
        id: 'tell-mara-what-it-cost',
        label:
          'Leave the hand running and tell Mara exactly what memory is turning it',
        outcome:
          'Morrow reads Mara the receipt line by line. She listens, then asks the inspector to keep the receipt safe so she can decide later, once the city is no longer depending on it. The minute hand ticks on. Mara now knows the shape of something she gave without knowing its contents, and so does Morrow.',
        flag: 'clock-face-cost-told',
        effects: { evidence: 2, trust: 1, supplies: -1 },
        artSubject:
          'Mara listening intently as Morrow reads a long receipt aloud behind a ticking giant clock face, a clock inspector holding out a small strongbox',
      },
    ],
  },
} as const
