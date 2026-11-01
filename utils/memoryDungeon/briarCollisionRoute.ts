/**
 * Authored connective encounters along Pip's first route through the e09
 * collision. These are playable sites, not additional memory fragments.
 * Existing two fragment sites keep their original choice and save IDs.
 */
export const BRIAR_COLLISION_ROUTE_SITES = {
  '1,1': {
    title: 'The Reception Desk in the Briars',
    speaker: 'Pip and Mara',
    kind: 'companion',
    opening:
      'A reception bell rings from a desk rooted in the old wolf road. Mara has counted nine people trapped on the office floors, but the brass visitor book insists there are ten. Pip spots a muddy pawprint beside an empty signature line. The missing person may have escaped, or the building may be counting a wolf as staff.',
    artSubject:
      'Pip and Mara at a fluorescent reception desk grown from thorny Briar roots, a brass bell, muddy wolf pawprint and ten spaces in an open visitor ledger',
    choices: [
      {
        id: 'count-with-consent',
        label: 'Ask the trapped workers to confirm the head count privately',
        outcome:
          'Mara takes a voluntary count without copying names into the enchanted ledger. Nine workers answer. The tenth signature belongs to the wolf assigned to guard them, and the workers can plan around its patrol.',
        flag: 'reception-private-count',
        effects: { evidence: 1, trust: 1 },
        artSubject:
          'Mara quietly counts willing workers while Pip studies a wolf pawprint on the reception ledger',
      },
      {
        id: 'ring-for-the-tenth',
        label: 'Ring the bell and confront whoever answers as number ten',
        outcome:
          'The wolf clerk arrives wearing a stolen staff badge. Pip exposes the disguise before the others, but the alarm draws a second patrol. Mara gets a clear description at the price of a dangerous head start.',
        flag: 'reception-wolf-exposed',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'Pip rings a brass reception bell as a wolf in a borrowed office badge emerges from the thorny corridor',
      },
    ],
  },
  '2,1': {
    title: 'The Turnstile Pack',
    speaker: 'Pip and the wolf captain',
    kind: 'monster',
    opening:
      'Three wolves patrol a revolving security gate that only turns for people carrying their own names. The smallest wolf is wearing six visitor badges and looks deeply embarrassed. Pip recognizes the oath pattern: the badges are temporary permissions, not proof of ownership. The pack has been enforcing the wrong rule.',
    artSubject:
      'Three uneasy Briar wolves around a steel office turnstile, the youngest wolf burdened with six mismatched visitor badges while Pip studies the mechanism',
    choices: [
      {
        id: 'teach-the-oath',
        label: 'Translate the old permission oath for the youngest wolf',
        outcome:
          'The young guard returns the borrowed badges and demonstrates a safe one-person passage. The captain agrees to a supervised crossing but demands that Pip return to explain the rule to the next shift.',
        flag: 'turnstile-oath-taught',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Pip teaching a shy wolf guard to release a steel turnstile while returned visitor badges hang on a rail',
      },
      {
        id: 'jam-the-gate',
        label: 'Wedge the turnstile open before the pack can regroup',
        outcome:
          'Everyone waiting nearby slips through the gate, but the broken mechanism traps the wolves on the office side. Pip leaves a warning for later travelers rather than calling the obstruction a permanent rescue.',
        flag: 'turnstile-jammed',
        effects: { danger: 1, evidence: 1 },
        artSubject:
          'Pip bracing a bent office turnstile with a fallen branch as refugees hurry through and wolves gather beyond',
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
  '3,2': {
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
    speaker: 'Pip and the House caretaker',
    kind: 'dungeon',
    opening:
      'A basement server room has grown around the House’s oldest root. Its cooling fans whisper the names of everyone who has ever asked for shelter. The caretaker offers to turn the machines off, but the same circuit powers the dry stair used by refugees. Three cables bear matching root marks; only one leads to the name archive.',
    artSubject:
      'Pip and an elderly House caretaker inside a flooded rootbound server room, three marked cables, glowing name archive and emergency stair lights',
    choices: [
      {
        id: 'isolate-the-name-archive',
        label: 'Trace the marked cables and isolate the name archive',
        outcome:
          'Pip disconnects the archive without killing the stair lights. The caretaker can no longer summon refugees by name, but the building loses its automatic head count and needs volunteers on watch.',
        flag: 'server-archive-isolated',
        effects: { evidence: 2, supplies: -1 },
        artSubject:
          'Pip disconnecting a root-marked archive cable while the refugee stair lights remain lit in a flooded server room',
      },
      {
        id: 'guard-the-live-circuit',
        label: 'Keep the emergency stair powered and appoint human watchers',
        outcome:
          'The caretaker agrees to stop consulting the names while Mara posts volunteers at the stair. The archive remains a risk to be resolved later; the refugees keep a working escape route tonight.',
        flag: 'server-stair-guarded',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Mara and Pip organizing volunteer stair watchers beside a glowing rootbound server rack and a lit emergency exit',
      },
    ],
  },
} as const

export type BriarCollisionRouteSite = keyof typeof BRIAR_COLLISION_ROUTE_SITES
