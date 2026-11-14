/**
 * Authored connective encounters along Rowan's first route through the e09
 * collision. These are playable sites, not additional memory fragments.
 * Existing two fragment sites keep their original choice and save IDs.
 */
export const BRIAR_COLLISION_ROUTE_SITES = {
  '1,1': {
    title: 'The Reception Desk in the Briars',
    speaker: 'Rowan, Pip and Mara',
    kind: 'companion',
    opening:
      'A reception bell rings from a desk rooted in the old wolf road. Mara has counted nine people trapped on the office floors, but the brass visitor book insists there are ten. Rowan spots a muddy pawprint beside an empty signature line; Pip recognizes the mark as a wolf courier mark, but leaves the decision about confronting its owner to Rowan. The missing person may have escaped, or the building may be counting a wolf as staff.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, examines the ten signatures at a fluorescent reception desk grown from thorny Briar roots; Pip the goblin courier points out a muddy wolf pawprint while Mara holds the staff count and a brass bell sits untouched',
    choices: [
      {
        id: 'count-with-consent',
        label: 'Ask the trapped workers to confirm the head count privately',
        outcome:
          'Rowan asks Mara to take a voluntary count without copying names into the enchanted ledger. Nine workers answer. The tenth signature belongs to the wolf assigned to guard them, and the workers can plan around its patrol.',
        flag: 'reception-private-count',
        effects: { evidence: 1, trust: 1 },
        artSubject:
          'Rowan and Mara quietly count willing workers while Pip identifies a wolf courier pawprint on the reception ledger',
      },
      {
        id: 'ring-for-the-tenth',
        label: 'Ring the bell and confront whoever answers as number ten',
        outcome:
          'The wolf clerk arrives wearing a stolen staff badge. Rowan challenges the forged identity using Pip’s knowledge of wolf badges, but the alarm draws a second patrol. Mara gets a clear description at the price of a dangerous head start.',
        flag: 'reception-wolf-exposed',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'Rowan rings a brass reception bell while Pip identifies the wolf in a borrowed office badge emerging from the thorny corridor',
      },
    ],
  },
  '2,1': {
    title: 'The Turnstile Pack',
    speaker: 'Rowan, Pip and the wolf captain',
    kind: 'monster',
    opening:
      'Three wolves patrol a revolving security gate that only turns for people carrying their own names. The smallest wolf is wearing six visitor badges and looks deeply embarrassed. Pip translates the oath pattern for Rowan: the badges are temporary permissions, not proof of ownership. Rowan must decide whether to teach the pack or force a crossing.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, faces three uneasy Briar wolves at a steel office turnstile; the youngest wolf carries six mismatched visitor badges and Pip the goblin courier explains the mechanism at Rowan's side',
    choices: [
      {
        id: 'teach-the-oath',
        label: 'Translate the old permission oath for the youngest wolf',
        outcome:
          'The young guard returns the borrowed badges and demonstrates a safe one-person passage. Rowan negotiates a supervised crossing; the captain demands that Pip return to explain the rule to the next shift.',
        flag: 'turnstile-oath-taught',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Rowan negotiates passage with a wolf captain as Pip the goblin courier teaches a shy wolf guard to release a steel turnstile; returned visitor badges hang on a rail',
      },
      {
        id: 'jam-the-gate',
        label: 'Wedge the turnstile open before the pack can regroup',
        outcome:
          'Everyone waiting nearby slips through the gate, but the broken mechanism traps the wolves on the office side. Rowan leaves a warning for later travelers rather than calling the obstruction a permanent rescue.',
        flag: 'turnstile-jammed',
        effects: { danger: 1, evidence: 1 },
        artSubject:
          'Rowan bracing a bent office turnstile with a fallen branch as refugees hurry through while Pip warns of wolves gathering beyond',
      },
    ],
  },
  '1,2': {
    title: 'The Fire Drill That Never Ends',
    speaker: 'Mara and the stairwell choir',
    kind: 'puzzle',
    opening:
      'The evacuation stair repeats its third landing every time the alarm sounds. A chorus of frightened office workers has memorized the wrong sequence of doors. Mara notices that the exit signs change only after the bell falls silent; three knocks from the landing below are the real direction clue.',
    artSubject:
      'An impossible office fire stair with three repeating landings, worried workers, shifting exit signs and Mara listening to knocks through a metal handrail',
    choices: [
      {
        id: 'follow-three-knocks',
        label: 'Silence the alarm and follow the three-knock pattern',
        outcome:
          'The stair unfolds into a genuine lower landing. Mara guides the workers out in pairs, recording the route with chalk marks that can be erased after everyone is safe.',
        flag: 'fire-drill-pattern-solved',
        effects: { evidence: 1, trust: 1 },
        artSubject:
          'Mara chalking three discreet marks on a real stair landing while Pip guides relieved workers past a quiet alarm bell',
      },
      {
        id: 'hold-a-safe-landing',
        label: 'Keep the workers together while Pip tests the false doors',
        outcome:
          'Pip finds a dry landing where the group can wait without being split apart. The escape takes longer and costs supplies, but nobody is sent alone through a door that has not been checked.',
        flag: 'fire-drill-shelter-held',
        effects: { supplies: -1, trust: 2 },
        artSubject:
          'Pip testing a strange stairwell door while Mara distributes water to workers sheltered together on a lit landing',
      },
    ],
  },
  '3,1': {
    title: 'The Glass-Lift Orchard',
    speaker: 'Vesper and the lift attendant',
    kind: 'treasure',
    opening:
      'An elevator full of apples rises through the House canopy. Every floor button has become a season, and the attendant offers a basket of fruit to anyone who can remember which harvest belongs to the living trees. Vesper warns that the winter apples are preserved memories, not food.',
    artSubject:
      'A glass office elevator suspended among immense Briar branches, baskets of seasonal apples and Vesper examining a glowing winter fruit',
    choices: [
      {
        id: 'harvest-living-apples',
        label: 'Take only the ripe fruit and leave the winter memories sealed',
        outcome:
          'The attendant opens the summer floor. Pip shares real food with the waiting evacuees, while Vesper marks the memory baskets as private property awaiting their owners.',
        flag: 'orchard-living-harvest',
        effects: { supplies: 2, trust: 1 },
        artSubject:
          'Pip passing fresh summer apples to evacuees inside a glass lift as Vesper seals a basket of glowing memory fruit',
      },
      {
        id: 'catalog-winter-fruit',
        label: 'Record the winter labels without opening their memories',
        outcome:
          'Vesper copies the shelf positions rather than the names. The map reveals which elevator floors are false, but the party leaves the edible harvest behind for the people already sheltering there.',
        flag: 'orchard-winter-index',
        effects: { evidence: 2 },
        artSubject:
          'Vesper sketching a numbered elevator shelf of luminous winter apples while Pip watches the shifting floor indicators',
      },
    ],
  },
  '3,3': {
    title: 'The Union of Lost Hours',
    speaker: 'Mara and the night-shift stewards',
    kind: 'challenge',
    opening:
      'A picket line of workers and rootbound forest spirits blocks the corridor. Both groups have been promised the same hour of rest, and the office clock has stolen it from both. Mara has the payroll slips; a spirit carries the tree-ring calendar. Neither record alone proves whose hour was taken.',
    artSubject:
      'Mara mediating between exhausted office workers and forest spirits at a picket line of vines and fluorescent safety tape, two incompatible clocks',
    choices: [
      {
        id: 'reconcile-the-hours',
        label: 'Compare the payroll slips with the tree-ring calendar',
        outcome:
          'The records reveal a missing hour that the building charged to both groups. Workers and spirits agree on a shared rest watch and preserve the evidence for a later wage claim.',
        flag: 'lost-hours-reconciled',
        effects: { evidence: 2, trust: 1 },
        artSubject:
          'Workers and forest spirits comparing payroll slips to a tree-ring calendar while Mara circles a missing hour',
      },
      {
        id: 'fund-the-rest-watch',
        label: 'Supply a rest station now and postpone the disputed accounting',
        outcome:
          'Pip helps both groups establish a staffed rest station. They can move again without declaring the debt settled; Mara keeps the conflicting records for an honest hearing later.',
        flag: 'lost-hours-rest-funded',
        effects: { supplies: -2, trust: 2 },
        artSubject:
          'Pip helping workers and forest spirits build a shared rest station from office chairs and moss beneath a stopped clock',
      },
    ],
  },
  '4,2': {
    title: 'The Rook with a Return Address',
    speaker: 'Vesper and the paper rook',
    kind: 'merchant',
    opening:
      'A rook folded from interoffice mail offers to deliver messages between the worlds. It demands a return address, which would expose a refuge hidden behind the old House. Vesper knows the bird can follow a reply token instead, but that route costs paper, time and an escort.',
    artSubject:
      'Vesper confronting a giant origami rook on a Briar office mail cart, sealed refuge letters and a dangerous return-address form',
    choices: [
      {
        id: 'use-reply-tokens',
        label: 'Pay for anonymous reply tokens and an escorted delivery',
        outcome:
          'The rook accepts tokens that expire after one reply. Families receive their letters without placing the refuge on a public map, and Vesper agrees to accompany the first flight.',
        flag: 'rook-anonymous-delivery',
        effects: { supplies: -1, trust: 2 },
        artSubject:
          'Vesper tying anonymous reply tokens to a paper rook as Pip guards sealed letters on a forest-grown mail cart',
      },
      {
        id: 'hold-the-letters',
        label: 'Keep the letters sealed until a safe courier can be found',
        outcome:
          'The rook refuses the job, but Pip preserves the letters and a record of who consented to delivery. The delayed news hurts; no one is exposed to buy a faster ending.',
        flag: 'rook-letters-held',
        effects: { evidence: 1, danger: 1 },
        artSubject:
          'Pip carrying sealed letters away from an impatient paper rook while Vesper covers a refuge address on a mail form',
      },
    ],
  },
  '5,2': {
    title: 'The Saltwater Mailroom',
    speaker: 'Scylla and Oren',
    kind: 'memory',
    opening:
      'The mailroom is knee-deep in seawater. A tide brings envelopes addressed to people who have not yet arrived. Scylla recognizes her sister’s handwriting on one, but the seal is dated tomorrow. Oren can keep the letters dry; he cannot promise they describe a future anyone has chosen.',
    artSubject:
      'Scylla and permanently hooded Oren in a flooded office mailroom, future-dated envelopes floating beside a brass tide marker',
    choices: [
      {
        id: 'keep-future-letter-sealed',
        label: 'Preserve the letter unopened until Char can choose to read it',
        outcome:
          'Oren seals the envelope in a dry case with Char named as its only recipient. Scylla records the date without treating an unread future as a command to her sister.',
        flag: 'mailroom-char-consent',
        effects: { trust: 2, evidence: 1 },
        artSubject:
          'Scylla handing a sealed future-dated letter to hooded Oren for safekeeping above a flooded mailroom floor',
      },
      {
        id: 'trace-the-tide-postmark',
        label: 'Study the postmark without breaking the private seal',
        outcome:
          'The tide mark identifies a current that reaches the submerged roots. Scylla gains a useful route clue while accepting that the contents of Char’s letter remain unknown.',
        flag: 'mailroom-tide-postmark',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'Scylla comparing a sealed letter postmark with a brass tide gauge while Oren steadies a flooded mail shelf',
      },
    ],
  },
  '6,2': {
    title: 'The Rootbound Server Room',
    speaker: 'Rowan, Pip and the House caretaker',
    kind: 'dungeon',
    opening:
      'A basement server room has grown around the House’s oldest root. Its cooling fans whisper the names of everyone who has ever asked for shelter. The caretaker offers to turn the machines off, but the same circuit powers the dry stair used by refugees. Three cables bear matching root marks; only one leads to the name archive.',
    artSubject:
      'Rowan examining three marked cables with Pip and an elderly House caretaker in a flooded rootbound server room, glowing name archive and emergency stair lights',
    choices: [
      {
        id: 'isolate-the-name-archive',
        label: 'Trace the marked cables and isolate the name archive',
        outcome:
          'Pip identifies the old courier root mark, and Rowan traces the live circuit before disconnecting the name archive without killing the stair lights. The caretaker can no longer summon refugees by name, but the building loses its automatic head count and needs volunteers on watch.',
        flag: 'server-archive-isolated',
        effects: { evidence: 2, supplies: -1 },
        artSubject:
          'Rowan disconnecting the root-marked archive cable while Pip checks the refugee stair lights in a flooded server room',
      },
      {
        id: 'guard-the-live-circuit',
        label: 'Keep the emergency stair powered and appoint human watchers',
        outcome:
          "Rowan refuses to trade the refugees' escape route for a quick victory and asks Mara to organize a human watch. The caretaker agrees to stop consulting the names. The archive remains a risk to be resolved later; the refugees keep a working escape route tonight.",
        flag: 'server-stair-guarded',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Rowan and Mara organizing volunteer stair watchers while Pip checks the glowing rootbound server rack beside a lit emergency exit',
      },
    ],
  },
  '4,1': {
    title: 'The Last Bus to the Wolf Road',
    speaker: 'Pip and conductor Iona',
    kind: 'challenge',
    opening:
      'A city bus idles in a clearing where the old wolf road crosses an office car park. Its route display alternates between HOME and RETURN TO SENDER. Conductor Iona has space for six passengers, but the fare machine demands the address of every shelter. Pip notices that the paper transfer slips carry a route number without any home address.',
    artSubject:
      'Pip beside a moss-covered city bus in the Briar woods, conductor Iona holding numbered paper transfers and a fare machine demanding shelter addresses',
    choices: [
      {
        id: 'issue-anonymous-transfers',
        label:
          'Use numbered transfers and escort six passengers to the next stop',
        outcome:
          'Iona accepts the transfer numbers as temporary proof of passage. Six workers leave without surrendering their addresses, but Pip must walk beside the bus to keep the wolf-road tollkeeper from changing the fare.',
        flag: 'bus-anonymous-transfers',
        effects: { supplies: -1, trust: 2 },
        artSubject:
          'Iona handing anonymous numbered transfers to six passengers as Pip walks beside a forest bus under the gaze of a wolf tollkeeper',
      },
      {
        id: 'mark-a-safe-return-stop',
        label: 'Survey a neutral return stop before sending the bus onward',
        outcome:
          'Pip and Iona mark a public stop that belongs to neither the wolves nor the office. The passengers wait longer in a guarded bus, but the new route can be verified without naming a single refuge.',
        flag: 'bus-neutral-return-stop',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'Pip measuring a neutral bus stop with a brass compass while passengers wait behind lit windows and Briar wolves watch from the trees',
      },
    ],
  },
  '5,1': {
    title: 'The Overtime Bell Tower',
    speaker: 'Mara and the clockmaker',
    kind: 'puzzle',
    opening:
      'A stone bell tower rises through the roof of an accounting annex. Every toll adds an unpaid hour to the workers below, while the clockmaker insists that the bell is only repeating an ancient forest curfew. Three gears are stamped WORK, REST and DEBT. Mara can prove the missing hours, but stopping the bell may strand the night patrol outside.',
    artSubject:
      'Mara and an elderly clockmaker inside a stone bell tower piercing a fluorescent office roof, three exposed gears marked WORK REST and DEBT',
    choices: [
      {
        id: 'uncouple-the-debt-gear',
        label: 'Uncouple the DEBT gear while preserving the curfew signal',
        outcome:
          'The bell continues to warn the forest patrol without stealing another wage hour. Mara records the separated gear as evidence, and the clockmaker agrees to testify rather than hide behind the old mechanism.',
        flag: 'bell-debt-gear-isolated',
        effects: { evidence: 2, trust: 1 },
        artSubject:
          'Mara lifting a bronze DEBT gear free while the clockmaker steadies the still-turning curfew mechanism above an office roof',
      },
      {
        id: 'silence-and-post-watchers',
        label: 'Stop the bell and staff the dangerous crossing by hand',
        outcome:
          'The stolen hours stop immediately. Pip recruits volunteers to warn travelers until the tower can be repaired, trading a quiet night for a watch schedule that costs precious supplies.',
        flag: 'bell-volunteer-watch',
        effects: { supplies: -2, trust: 2 },
        artSubject:
          'Pip organizing lantern-bearing volunteers at the foot of a silent bell tower while Mara comforts workers holding stopped timecards',
      },
    ],
  },
  '6,1': {
    title: 'The Copier That Ate a Name',
    speaker: 'Pip and the paper changeling',
    kind: 'monster',
    opening:
      'An enormous office copier has grown jaws of white paper and a nest of thorn roots. It prints an exact likeness of anyone who approaches, then demands that the original surrender their name. A trembling paper changeling inside the machine begs Pip not to destroy its only home. The STOP key is jammed beneath a brass forest oath token.',
    artSubject:
      'A monstrous rootbound office copier with paper jaws, Pip holding a brass oath token, and a frightened paper changeling visible behind the glass',
    choices: [
      {
        id: 'release-the-stop-key',
        label:
          'Lift the oath token and free the changeling without copying anyone',
        outcome:
          'Pip frees the STOP key and the machine spits out its stolen name slips. The paper changeling keeps its shelter, agrees never to make another person into a document, and helps return the slips privately.',
        flag: 'copier-changeling-freed',
        effects: { trust: 2, evidence: 1 },
        artSubject:
          'Pip freeing a brass STOP key while a relieved paper changeling gathers stolen name slips beside a silent rootbound copier',
      },
      {
        id: 'isolate-the-paper-feed',
        label:
          'Block the paper feed and preserve the stolen slips for witnesses',
        outcome:
          'The copier cannot take another name, but its frightened resident remains trapped until a safe housing plan exists. Mara seals the stolen slips with a witness list instead of publishing identities to prove a victory.',
        flag: 'copier-feed-isolated',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'Mara sealing private name slips while Pip wedges shut the paper jaws of a monstrous copier and its resident peers out',
      },
    ],
  },
  '7,1': {
    title: 'The Pawnshop of Unused Tomorrows',
    speaker: 'Vesper and shopkeeper Fen',
    kind: 'merchant',
    opening:
      'A pawnshop occupies the shell of a vending machine, with whole futures folded into matchboxes behind the glass. Shopkeeper Fen offers food in exchange for the tomorrow a refugee was promised. Vesper recognizes the trap: a promised future is not property that a desperate stranger can sell on behalf of their family.',
    artSubject:
      'Vesper at a tiny vending-machine pawnshop in a Briar clearing, shopkeeper Fen behind glass shelves of glowing matchbox futures',
    choices: [
      {
        id: 'buy-back-the-rations',
        label: 'Trade ordinary supplies for food without pledging a future',
        outcome:
          'Fen reluctantly sells the food at an honest price. Vesper insists that the receipt list goods rather than names, and the refugees retain the right to make their own tomorrow when the road finally opens.',
        flag: 'pawnshop-honest-rations',
        effects: { supplies: -2, trust: 2 },
        artSubject:
          "Vesper exchanging a small supply bundle for food at Fen's vending-machine shop while untouched matchbox futures glow behind glass",
      },
      {
        id: 'audit-the-pawn-ledger',
        label:
          "Inspect the futures already taken and record the owners' claims",
        outcome:
          "Fen allows Vesper to copy the contract numbers, not the intimate wishes inside the boxes. The evidence gives displaced families a path to challenge the bargains, but the party leaves hungry and attracts the shop's collectors.",
        flag: 'pawnshop-contract-audit',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          "Vesper copying contract numbers from Fen's pawn ledger while shadowy collectors gather outside a glowing forest vending machine",
      },
    ],
  },
  '8,1': {
    title: 'The Nursery at the End of the Hall',
    speaker: 'Pip and caretaker Sable',
    kind: 'companion',
    opening:
      'An office corridor ends in a Briar nursery where sleeping children dream the walls into different shapes. Caretaker Sable has kept the children safe by telling them no one will ever have to leave. Pip sees that the promise is beginning to turn the doorway into a solid tree. The children can choose a story, but no adult can promise an unchanging world.',
    artSubject:
      'Pip and caretaker Sable beside sleeping children in a warmly lit Briar nursery grown into the end of a fluorescent office hall',
    choices: [
      {
        id: 'offer-a-choice-of-stories',
        label: 'Let the children choose a moving story and a safe escort',
        outcome:
          'Sable tells a story in which a home can travel with its people. The tree doorway opens enough for a voluntary escorted departure, and the children carry their own drawings rather than a false guarantee of permanence.',
        flag: 'nursery-moving-story',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Sable reading a travel story while Pip opens a tree doorway and children carry drawings into a safe forest corridor',
      },
      {
        id: 'build-a-temporary-hearth',
        label:
          'Keep the nursery open with a temporary hearth and a clear exit plan',
        outcome:
          "Pip helps Sable establish a night watch and a visible route marker. The children can rest without being trapped by the caretaker's promise, though the party must spend supplies and return before the next wall-shift.",
        flag: 'nursery-temporary-hearth',
        effects: { supplies: -2, trust: 1, evidence: 1 },
        artSubject:
          'Pip placing a temporary hearth lantern near a nursery exit as Sable posts a simple route marker beside sleeping children',
      },
    ],
  },
  '4,3': {
    title: 'The Crosswalk That Changes Sides',
    speaker: 'Mara and Oren',
    kind: 'puzzle',
    opening:
      'A painted pedestrian crossing runs through a forest stream and an office atrium at once. Each time the signal changes, the stream switches banks, leaving travelers on the wrong side of their own footprints. Oren finds three tide marks on a handrail; Mara finds matching stripes in the floor paint. The clues agree on one safe crossing interval.',
    artSubject:
      'Hooded Oren and Mara studying three tide marks on a crosswalk handrail above a stream flowing through a glass office atrium',
    choices: [
      {
        id: 'cross-on-third-tide',
        label:
          'Wait for the third tide mark and escort everyone across together',
        outcome:
          'The third signal aligns the stream and the painted stripes. Oren leads the crossing in small groups while Mara counts arrivals, leaving a repeatable public timing clue for the next travelers.',
        flag: 'crosswalk-third-tide',
        effects: { evidence: 1, trust: 2 },
        artSubject:
          'Oren guiding travelers across a stream-filled office crosswalk as Mara points to the third illuminated tide mark',
      },
      {
        id: 'secure-both-banks',
        label:
          'Anchor ropes to both banks and establish a slower assisted route',
        outcome:
          'The crossing no longer depends on a single moment of perfect timing. The ropes cost equipment and a watch shift, but people who cannot run at the signal gain a reliable route of their own.',
        flag: 'crosswalk-assisted-route',
        effects: { supplies: -2, trust: 2 },
        artSubject:
          'Oren securing a rope crossing over a forest stream inside an office atrium while Mara helps slower travelers onto the bank',
      },
    ],
  },
  '5,3': {
    title: 'The Cabinet of Returned Faces',
    speaker: 'Scylla and the mirror clerk',
    kind: 'treasure',
    opening:
      "A filing cabinet opens into a mirror gallery of portraits taken from people who crossed between worlds. A clerk offers to return each face to the person listed on the drawer, but the labels were written by the same office that stole the portraits. Scylla recognizes one of Char's expressions and refuses to assume the cabinet owns the right to assign it.",
    artSubject:
      "Scylla facing a mirror-lined filing cabinet full of stolen portraits, a nervous clerk holding drawer labels and a glimpse of Char's familiar expression",
    choices: [
      {
        id: 'return-faces-by-consent',
        label:
          'Ask each claimant to identify their own portrait before returning it',
        outcome:
          "The clerk accepts personal testimony instead of the unreliable labels. Several people recover their portraits, and Scylla keeps Char's unclaimed image sealed until her sister can decide what it means.",
        flag: 'faces-consent-return',
        effects: { trust: 2, evidence: 1 },
        artSubject:
          "Scylla helping a traveler reclaim a portrait by consent while Char's unclaimed image remains sealed in a mirrored drawer",
      },
      {
        id: 'preserve-the-drawer-errors',
        label:
          'Document the false labels and protect the cabinet from further claims',
        outcome:
          'Scylla copies the mismatched drawer numbers while the clerk locks the gallery. The evidence may expose a wider theft, but people waiting for their portraits must return later with independent witnesses.',
        flag: 'faces-drawer-evidence',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'Scylla recording mismatched filing drawer numbers in a mirror gallery while the clerk seals a cabinet of stolen portraits',
      },
    ],
  },
  '6,3': {
    title: 'The Night-Shift Hearth Committee',
    speaker: 'Mara, Pip and the hearth spirit',
    kind: 'companion',
    opening:
      "A hearth spirit has taken over the office break room and refuses to let anyone return to work, even the workers who want to help evacuate their friends. Mara finds the spirit's original invitation pinned beside the coffee machine: KEEP US WARM, not KEEP US HERE. Pip must persuade both sides to agree on an end to the shelter watch.",
    artSubject:
      'Mara and Pip in a mossy office break room with a warm hearth spirit, a coffee machine and a pinned invitation reading KEEP US WARM',
    choices: [
      {
        id: 'write-a-revocable-welcome',
        label: 'Write a welcome that each worker can revoke at any time',
        outcome:
          'The spirit accepts that warmth is an offer, not captivity. Workers choose their own shifts and can leave to help others; Mara posts the new agreement beside the coffee machine for future arrivals.',
        flag: 'hearth-revocable-welcome',
        effects: { trust: 2, evidence: 1 },
        artSubject:
          'Mara posting a voluntary hearth agreement as workers leave a warm office break room and Pip thanks the glowing spirit',
      },
      {
        id: 'staff-the-rest-rotation',
        label:
          'Set up a staffed rest rotation while the spirit learns to release guests',
        outcome:
          'Pip arranges a rotation with a named relief worker for every guest. The spirit practices opening the door without demanding gratitude, and the party spends supplies to keep the first shift comfortable.',
        flag: 'hearth-rest-rotation',
        effects: { supplies: -2, trust: 2 },
        artSubject:
          'Pip organizing a voluntary rest rotation around a hearth spirit in a mossy office break room as Mara holds an open exit door',
      },
    ],
  },
  '7,5': {
    title: 'The Umbrella Migration',
    speaker: 'Vesper, Pip and the umbrella keeper',
    kind: 'challenge',
    opening:
      'A hundred office umbrellas have grown feathered wings and are migrating through a saltwater rainstorm. Each carries the name of a stranded traveler stitched inside its lining. The keeper wants to net the entire flock before the next flood, but Vesper notices that the red umbrellas circle above the only dry footbridge. A child waits beneath the bridge for the umbrella that remembers her father.',
    artSubject:
      'Vesper and Pip beneath a storm-dark Briar footbridge as winged office umbrellas circle overhead, one red umbrella carrying a stitched name and a child watching from the dry bank',
    choices: [
      {
        id: 'guide-umbrella-flock',
        label: 'Follow the red umbrellas and guide the flock to the dry bank',
        outcome:
          'Vesper reads the birds’ shadow pattern without taking their owners’ names. The keeper lets the umbrellas settle beside the people who recognize them; the child finds her father’s old coat, but the rescue party must spend a dangerous extra watch in the rain.',
        flag: 'umbrella-flock-guided',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Vesper tracing umbrella shadows while Pip shelters a child and the red-winged flock descends onto a safe Briar riverbank',
      },
      {
        id: 'borrow-wolf-whistle',
        label:
          'Borrow the wolf patrol’s whistle to call every umbrella down at once',
        outcome:
          'The flock lands before the flood reaches the bridge. Pip returns the whistle and records the patrol’s demand for a later escort, while the keeper distributes dry canopies without publishing a list of who sought shelter.',
        flag: 'umbrella-whistle-debt',
        effects: { supplies: 2, evidence: 1, danger: 1 },
        artSubject:
          'Pip sounding a carved wolf whistle as a swirling flock of feathered umbrellas settles around refugees on a rain-soaked footbridge',
      },
    ],
  },
  '8,3': {
    title: 'The Wolf Court of Small Claims',
    speaker: 'Mara, Pip and the wolf magistrate',
    kind: 'puzzle',
    opening:
      'A courthouse has sprouted from a copy room. Its wolf magistrate is trying to decide who owns the emergency exit: the office that built it, the forest that swallowed it, or the people trapped behind it. Each copied deed changes its date when the tide reaches the printer tray. Mara finds an original stamp on the dry underside of the desk, while Pip knows the ancient rule that paths cannot be owned.',
    artSubject:
      'Mara and Pip before a bewildered wolf magistrate in a courthouse grown from a flooded office copy room, drifting deeds and an old seal hidden under a dry desk',
    choices: [
      {
        id: 'prove-forged-exit-deeds',
        label: 'Compare the tide-stained copies with the original dry seal',
        outcome:
          'Mara demonstrates that every claim to own the exit was copied after the flood. The magistrate voids the deeds and opens the stair, but the humiliated clerk sends a patrol to challenge the ruling before the next tide.',
        flag: 'wolf-court-deeds-voided',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'Mara presenting a dry original seal beside warped photocopies while a wolf magistrate orders an office stair unlocked',
      },
      {
        id: 'charter-shared-exit',
        label:
          'Offer a temporary shared-path charter with an independent witness',
        outcome:
          'Pip translates the old right-of-way oath into a one-watch charter. Workers and wolves can both use the exit, and Mara volunteers to audit its first shift; the party gives up a supply crate to keep the passage staffed.',
        flag: 'wolf-court-shared-charter',
        effects: { supplies: -1, trust: 2 },
        artSubject:
          'Pip and a wolf magistrate signing a temporary passage charter while Mara escorts workers through an open courthouse stair',
      },
    ],
  },
  '7,4': {
    title: 'The Stairwell Aquarium',
    speaker: 'Scylla and Oren Pike',
    kind: 'challenge',
    opening:
      'The office stairwell is now a vertical aquarium. Fish drift past numbered landings while a trapped lift attendant knocks from a pocket of air above the rising tide. Scylla recognizes the fish swimming against the current as a warning of a second surge. Oren has enough rope for one direct ascent or enough broken doors to build a slower floating landing for everyone below.',
    artSubject:
      'Scylla and permanently hooded Oren inside a flooded glass stairwell, fish crossing numbered office landings, a lift attendant knocking from an air pocket and floating doors below',
    choices: [
      {
        id: 'rope-the-air-pocket',
        label: 'Use Oren’s rope to reach the attendant before the next surge',
        outcome:
          'Oren anchors the rope through the fish-filled shaft and brings the attendant down alive. The rescue uses the last dry line, so Scylla leaves a tide warning for the workers still waiting below rather than promising an instant second trip.',
        flag: 'aquarium-attendant-rescued',
        effects: { supplies: -2, trust: 2 },
        artSubject:
          'Hooded Oren hauling a rescued lift attendant down a rope through a luminous flooded office stairwell as Scylla signals the next tide',
      },
      {
        id: 'build-floating-landing',
        label:
          'Build a floating landing that can carry the whole waiting group',
        outcome:
          'Scylla directs the current while Oren bolts office doors into a raft. The attendant survives until the landing reaches him, and slower evacuees gain a reusable route; the longer work exposes the crew to another dangerous surge.',
        flag: 'aquarium-floating-landing',
        effects: { evidence: 1, trust: 1, danger: 2 },
        artSubject:
          'Scylla guiding a raft of office doors through an aquarium stairwell while hooded Oren helps frightened workers onto a floating landing',
      },
    ],
  },
  '8,4': {
    title: 'The Last Payroll Tide',
    speaker: 'Mara and the exhausted payroll spirit',
    kind: 'companion',
    opening:
      'A payroll printer spits out pay slips measured in years rather than hours. The exhausted spirit inside it has been paying workers with borrowed seasons, and a janitor has suddenly aged three winters during one night shift. Mara finds a real paper timesheet that survived the flood; the spirit insists it cannot stop printing until every worker has been paid something.',
    artSubject:
      'Mara beside a weary glowing payroll-printer spirit in a mossy office, a prematurely aged janitor holding a paper timesheet and pay slips drifting into saltwater',
    choices: [
      {
        id: 'audit-the-borrowed-years',
        label:
          'Stop the printer and audit each stolen season against the timesheet',
        outcome:
          'Mara proves which hours were actually worked and the spirit returns the stolen winters. The janitor recovers his strength, but wages must be rebuilt from testimony while the party funds a temporary meal station for those still unpaid.',
        flag: 'payroll-years-restored',
        effects: { supplies: -1, evidence: 2, trust: 1 },
        artSubject:
          'Mara holding a surviving paper timesheet as a glowing payroll spirit returns stolen seasons to a relieved janitor',
      },
      {
        id: 'advance-real-supplies',
        label:
          'Offer food and shelter now, then let workers negotiate their own back pay',
        outcome:
          'The printer finally sleeps. Workers receive a genuine emergency advance rather than another enchanted promise, and they elect their own pay committee; Oren gives up the party’s remaining spare provisions to make the first night possible.',
        flag: 'payroll-worker-advance',
        effects: { supplies: -2, trust: 2 },
        artSubject:
          'A sleeping payroll-printer spirit beside a workers’ pay committee as Mara and hooded Oren distribute real provisions in a flooded office',
      },
    ],
  },
} as const

export type BriarCollisionRouteSite = keyof typeof BRIAR_COLLISION_ROUTE_SITES
