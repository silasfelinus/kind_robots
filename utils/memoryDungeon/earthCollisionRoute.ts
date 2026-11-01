/**
 * Authored connective choices in Morrow's collision city.
 * These sites are not fragments, photographs, or the clock-tower verdict.
 * Their stable coordinates and choice IDs belong to the e10 travel journal.
 */
export const EARTH_COLLISION_ROUTE_SITES = {
  '1,1': {
    title: 'The Escalator Wolf',
    speaker: 'Morrow and Captain Grey',
    kind: 'monster',
    opening:
      'The morning escalator carries a frightened wolf backward toward the station crowd. Captain Grey is guarding a child who has dropped her ticket, but the commuters see only his teeth. The machine repeats the same seven steps while the departure board counts down to an evacuation that nobody authorized. Morrow recognizes the wolf from Briar, where a guard was obliged to protect a crossing rather than own it. The child knows which stair is still moving forward. GREY: "I can hold this line, but I cannot tell them I am not hunting." MORROW: "Then let the child tell us what she saw, without making her responsible for your reputation."',
    artSubject:
      'Morrow kneeling beside a worried child at a looping underground escalator, a huge armored grey wolf guarding the landing while anxious commuters watch',
    choices: [
      {
        id: 'witness-the-guard',
        label:
          'Ask the child and commuters to witness Grey opening the crossing',
        outcome:
          'The child points to the still-moving service stair; Grey steps aside and lets families pass first. Morrow records the crossing as a voluntary escort, not a wolf checkpoint. A few commuters apologize, but Grey must remain to guide the late train and cannot join the party. The crowd keeps its own account of what happened, which will matter when the station claims nobody was stranded.',
        flag: 'escalator-public-escort',
        effects: { trust: 2, evidence: 1 },
        artSubject:
          'The grey wolf opening an underground service stair for commuters while Morrow and a child mark the safe path with chalk',
      },
      {
        id: 'hold-the-landing',
        label: 'Spend supplies to hold a quiet landing while the crowd clears',
        outcome:
          'Morrow and Grey build a temporary refuge from transit barriers and spare blankets. Nobody is forced to walk past a frightened animal, and the child chooses to wait with her parent. The last train leaves before the wolf can report to his pack, so Morrow accepts responsibility for delivering the crossing log later. The shelter is safe tonight, not a solution to the citywide evacuation.',
        flag: 'escalator-quiet-shelter',
        effects: { supplies: -2, trust: 2, danger: 1 },
        artSubject:
          'An underground station landing turned into a small warm shelter, Morrow sharing blankets while an armored wolf guards an open exit',
      },
    ],
  },
  '3,1': {
    title: 'The Memo That Knows the Refuge',
    speaker: 'Vesper and the paper moth',
    kind: 'puzzle',
    opening:
      'A memo flutters from the station ceiling on moth wings, naming a Hoshimori refuge that Vesper once mapped and later regretted exposing. The paper creature has memorized every address on the sheet but cannot understand why a destination can be dangerous to print. Its wings bear two different seals: the old employer stamp and a newer handwritten consent mark. Vesper recognizes the second as a forgery because the ink is dated before the refuge opened. VESPER: "A route is useful only while the people at its end can refuse it." MORROW: "We can prove this is false without telling the machine the true address."',
    artSubject:
      'Vesper and Morrow beneath a fluorescent station ceiling, an enormous folded-paper moth carrying a forged refuge memo with two conflicting wax seals',
    choices: [
      {
        id: 'publish-the-forgery',
        label:
          'Expose the forged seal while keeping the refuge address covered',
        outcome:
          'Vesper compares the two dated seals in public, then folds the address under a witness strip before anyone can photograph it. The paper moth agrees to carry a correction, not a list of residents. The station clerk gains evidence of deliberate manipulation, but Vesper must face questions about the original map they sold. No survivor is drafted into testimony without consent.',
        flag: 'memo-forgery-exposed',
        effects: { evidence: 2, trust: 1 },
        artSubject:
          'Vesper pinning a redacted forged memo to a station noticeboard while a paper moth folds its wings around the hidden address',
      },
      {
        id: 'escort-the-moth',
        label:
          'Escort the moth to a private hearing instead of publishing its cargo',
        outcome:
          'Morrow buys the paper moth time to testify before Mara and two elected refuge stewards. The stewards destroy the address-bearing original and keep only a signed description of the forged seal. The public loses immediate proof, but the people whose door was exposed retain control of its location. Vesper agrees to help rebuild the route from voluntary meeting points.',
        flag: 'memo-private-hearing',
        effects: { supplies: -1, trust: 2, evidence: 1 },
        artSubject:
          'A folded-paper moth giving testimony at a small private table with Vesper, Mara and two refuge stewards under a shaded lantern',
      },
    ],
  },
  '5,1': {
    title: 'The Shift That Never Ends',
    speaker: 'Mara and the clock inspector',
    kind: 'challenge',
    opening:
      'The station clock has printed tomorrow\'s overtime requests before the workers have finished today. Each request bears a real signature copied from an earlier shift, and a brass inspector insists that refusing the predicted hours counts as quitting. Mara lays three rosters on the floor: actual hours, proposed hours, and the machine\'s impossible future. Only the first is signed today. MARA: "I will not let a forecast become an employment contract." MORROW: "Then we should find the people, not just the numbers, who can say which shift they chose." The inspector can be reasoned with, but the deadline for an appeal is approaching.',
    artSubject:
      'Mara confronting a brass clock inspector on a station platform littered with three differently dated shift rosters and a glowing overtime machine',
    choices: [
      {
        id: 'collect-real-consent',
        label: 'Gather present-day consent before the predicted shift starts',
        outcome:
          'Mara organizes a quick roll call, recording only the hours each worker actually accepted. The inspector withdraws the unsigned future requests, though the employer threatens a hearing over the disrupted timetable. Morrow preserves the three rosters as distinct evidence rather than fusing them into a magical perfect record. The workers get their evening back and inherit a real legal dispute.',
        flag: 'shift-consent-protected',
        effects: { evidence: 2, trust: 1, danger: 1 },
        artSubject:
          'Night workers signing a current-day shift sheet with Mara while a brass inspector retracts luminous future overtime forms',
      },
      {
        id: 'fund-the-walkout',
        label:
          'Use the party supplies to support an immediate collective walkout',
        outcome:
          'The workers leave together with paid meal vouchers and a written list of people needing safe rides. The inspector loses its leverage when nobody remains alone to be singled out. The employer still holds the disputed wage records, so Mara schedules a hearing rather than declaring victory. Morrow stays behind to keep the platform open until the final worker reaches home.',
        flag: 'shift-collective-exit',
        effects: { supplies: -2, trust: 2 },
        artSubject:
          'Mara leading a collective night-shift walkout through an open station gate while Morrow distributes meal vouchers and safe-ride cards',
      },
    ],
  },
  '8,1': {
    title: 'The Receipt for a Borrowed Memory',
    speaker: 'Morrow and the research technician',
    kind: 'treasure',
    opening:
      'A repair receipt drops from the station clock and unfolds into the name of a research technician who fixed its failing battery with a memory she no longer possesses. She remembers performing the repair, but not the face of the person who taught her how. The receipt promises to restore the memory if Morrow signs over somebody else\'s childhood afternoon. MORROW: "A debt can be real without giving the creditor ownership of a stranger." TECHNICIAN: "I want to remember my teacher. I do not want to become the reason someone forgets theirs." The machine offers a second, slower repair using ordinary tools.',
    artSubject:
      'Morrow and a research technician examining a glowing repair receipt beside an impossible station clock, with an ordinary toolbox and a ghostly childhood memory in the glass',
    choices: [
      {
        id: 'repair-without-exchange',
        label: 'Repair the clock mechanically and preserve the memory debt',
        outcome:
          'The technician and Morrow replace the battery by hand, recording the missing lesson as an unresolved claim rather than manufacturing a substitute memory. The clock becomes useful for the next train, and the technician keeps the right to search for her teacher later. The repair consumes precious tools and time; the receipt remains as evidence against the machine that demanded a stolen childhood.',
        flag: 'receipt-manual-repair',
        effects: { supplies: -2, evidence: 2 },
        artSubject:
          'Morrow and the technician repairing a station clock with ordinary tools while the glowing memory receipt lies safely sealed in a glass box',
      },
      {
        id: 'trace-the-original-gift',
        label:
          'Trace the teacher through the receipt without transferring another memory',
        outcome:
          'Morrow finds an old workshop roster naming the teacher and arranges a meeting the technician can accept or refuse. The clock remains unreliable until a mechanic arrives, and commuters must use the paper timetable for now. Nobody is made to surrender an afternoon. The receipt becomes proof that the original lesson was a gift, not collateral for the machine.',
        flag: 'receipt-teacher-traced',
        effects: { evidence: 2, trust: 1, danger: 1 },
        artSubject:
          'The technician holding a workshop roster and a sealed memory receipt while Morrow points commuters toward a paper timetable',
      },
    ],
  },
  '1,3': {
    title: 'The Underpass of Perfect Directions',
    speaker: 'Vesper and the lost courier',
    kind: 'dungeon',
    opening:
      'The Hoshimori underpass has turned into a corridor that folds back whenever a courier speaks a full address. A lost messenger is holding medicine for three households, but the map insists there can be only one correct door. Vesper notices that the walls respond to spoken street numbers, not to footsteps. A childhood trick offers a route by landmarks instead of private homes. COURIER: "If I do not name the house, how will I find the patient?" VESPER: "Ask the people waiting at the public lantern. They know who wants help." The medicine is cooling; experimenting forever is not an option.',
    artSubject:
      'Vesper and a medicine courier in a folding Japanese underpass where paper street numbers peel from impossible doors and a public lantern marks the safe meeting point',
    choices: [
      {
        id: 'landmark-medicine-route',
        label: 'Guide the courier by public landmarks and voluntary handoffs',
        outcome:
          'Vesper redraws the route with the lantern, bridge and clinic as anchors, leaving private doors blank. Patients send chosen helpers to the meeting points and the medicine arrives without exposing the households. The courier must make three trips instead of one, and Vesper promises to teach the method rather than keeping the knowledge as a personal favor.',
        flag: 'underpass-consensual-route',
        effects: { supplies: -1, trust: 2, evidence: 1 },
        artSubject:
          'A courier handing medicine to voluntary helpers beneath a public lantern while Vesper sketches a landmark-only map of the folding underpass',
      },
      {
        id: 'stabilize-public-exit',
        label:
          'Hold the public exit open and call patients to a staffed clinic',
        outcome:
          'Morrow braces the folding corridor with a station barrier while the courier establishes a temporary clinic at the public stair. Patients who can travel receive care immediately; the team arranges escorts for those who cannot. The underpass remains dangerous and the private routes are not solved, but no address is surrendered to the hungry walls.',
        flag: 'underpass-public-clinic',
        effects: { supplies: -2, trust: 2, danger: 1 },
        artSubject:
          'Morrow bracing a warped underpass exit with a steel barrier as a courier tends patients at a lantern-lit temporary clinic',
      },
    ],
  },
  '4,4': {
    title: 'The Tidepool Triage Lift',
    speaker: 'Char and Nurse Imani',
    kind: 'puzzle',
    opening:
      'The hospital lift opens underwater onto a mermaid court, where a clerk has sorted patients by how spectacular their injuries look. Nurse Imani points to three stable facts: one person cannot breathe without oxygen, one has a broken arm, and one is frightened but walking. The lift can safely carry only two people at a time, and the court wants its princess treated first. CHAR: "My title does not make my lungs more urgent than theirs." IMANI: "We have two seats and a clear airway. We can do this without guessing who matters." The next tide is already rising.',
    artSubject:
      'Char and Nurse Imani at a hospital elevator opening into an underwater mermaid court, three patients waiting beside a two-seat rescue lift and a rising tide',
    choices: [
      {
        id: 'triage-by-medical-need',
        label: 'Use the documented medical triage order, with Char assisting',
        outcome:
          'Imani sends the oxygen-dependent patient first with a trained escort. Char stabilizes the broken arm and stays with the walking patient until the lift returns. The court objects to a princess waiting, but Char refuses special treatment and records the medical reasons in the patient log. Everyone receives a plan, though the second trip risks the next tide.',
        flag: 'tidepool-need-first',
        effects: { trust: 2, evidence: 1, danger: 1 },
        artSubject:
          'Nurse Imani guiding an oxygen-dependent patient into the hospital lift while Char supports another patient at the rising underwater threshold',
      },
      {
        id: 'build-a-dry-waiting-room',
        label: 'Spend supplies to keep the lift queue safe for two trips',
        outcome:
          'Morrow and Char assemble a dry pressure vestibule from emergency screens, allowing Imani to monitor all three patients while the lift cycles. The court lends its air bells but demands their return, so the rescue incurs a tangible supply debt. Char writes down the return obligation herself; nobody is forced to trade a private memory for breathing room.',
        flag: 'tidepool-safe-staging',
        effects: { supplies: -2, trust: 2 },
        artSubject:
          'Char assembling a dry hospital vestibule with emergency screens and borrowed mermaid air bells while Nurse Imani monitors waiting patients',
      },
    ],
  },
  '6,5': {
    title: 'The Apartment Registry Yokai',
    speaker: 'Morrow and neighbor Sal',
    kind: 'merchant',
    opening:
      'A paper yōkai sits in the apartment stairwell selling duplicate keys to households it claims to have invented. It has filed Morrow\'s neighbors as borrowed characters and offers to erase their friendships in exchange for an easy passage home. Sal, who has held a spare key through years of ordinary emergencies, asks the spirit to explain why its ledger has no space for people choosing each other. SAL: "I know who waters my plants. I do not need a deed to prove we are friends." MORROW: "And I cannot buy my old life by making yours imaginary." The spirit accepts testimony or a negotiated lease, but not silence.',
    artSubject:
      'Morrow and neighbor Sal facing a paper registry yōkai in an apartment stairwell lined with impossible doors, spare keys and a ledger of borrowed friendships',
    choices: [
      {
        id: 'witness-chosen-households',
        label: "Record neighbors' voluntary testimony about their shared lives",
        outcome:
          'Sal invites neighbors to describe only the relationships they choose to make public. The paper spirit discovers that care can be real without a legal owner and returns the duplicate keys to their holders. Morrow gains evidence that his Earth life has changed in ways he cannot simply reverse, while the people involved keep their own privacy and the right to disagree.',
        flag: 'registry-households-witnessed',
        effects: { trust: 2, evidence: 2 },
        artSubject:
          'Neighbors sharing voluntary testimony in an apartment stairwell as a paper yōkai returns spare keys to their rightful holders',
      },
      {
        id: 'lease-the-common-stair',
        label:
          'Negotiate a temporary common-stair lease without selling friendships',
        outcome:
          "Morrow pays the yōkai in unused stationery and secures an open stair until the evacuation ends. Sal keeps the real keys, and the neighbors retain their relationships without signing the spirit's ownership ledger. The temporary lease solves the immediate access problem but leaves the building's legal confusion for a later tenant meeting. The paper spirit agrees to attend and listen.",
        flag: 'registry-common-stair',
        effects: { supplies: -2, trust: 1, danger: -1 },
        artSubject:
          'Morrow exchanging stationery for an open apartment stair while Sal keeps the real spare keys and a paper yōkai folds a temporary lease',
      },
    ],
  },
  '8,7': {
    title: 'The Canal of Unreturned Names',
    speaker: 'Oren and Scylla',
    kind: 'challenge',
    opening:
      'The canal below the broken clock tower carries name tags from the tide-gate catastrophe. Some belong to people rescued in the earlier city; others belong to passengers whose whereabouts remain uncertain. A maintenance worker offers to sweep them all into the sea so the evacuation board will display zero missing persons. Oren recognizes the shortcut as a falsified manifest. Scylla sees Char\'s name among the tags and refuses to decide another person\'s fate from a piece of metal. OREN: "Zero is not a rescue count." SCYLLA: "Then we do not turn the unknown into the dead, or the saved." The canal is rising toward the final tower.',
    artSubject:
      'Oren and Scylla standing at a flooded canal beneath a broken city clock tower, floating name tags and a maintenance worker beside a false zero-missing display',
    choices: [
      {
        id: 'keep-uncertain-names',
        label: 'Preserve an honest missing-person ledger with disputed entries',
        outcome:
          "Oren separates confirmed survivors from unverified names and records the source of each claim. Scylla refuses to treat Char's tag as proof of either death or safety; she asks for a real witness. The evacuation board now shows unresolved people instead of a reassuring lie. The search becomes harder to ignore, and the party enters the tower with evidence that the forecast cannot erase.",
        flag: 'canal-honest-manifest',
        effects: { evidence: 2, trust: 1, danger: 1 },
        artSubject:
          'Oren carefully sorting recovered name tags into verified and unresolved trays while Scylla watches the clock tower display change from zero to unknown',
      },
      {
        id: 'rescue-before-records',
        label:
          'Deploy a search crew now and preserve the uncertain ledger for later',
        outcome:
          'Scylla and the maintenance worker rig a safe rope line along the canal while Oren organizes volunteers to search the flooded culvert. They recover two stranded commuters, but the remaining name tags stay unresolved and the clock tower gains another hour to prepare its cruel forecast. The party spends equipment and carries a written obligation to continue searching after the final decision.',
        flag: 'canal-search-launched',
        effects: { supplies: -2, trust: 2, danger: 1 },
        artSubject:
          'Scylla guiding stranded commuters along a canal rope line while Oren directs volunteers and the clock tower glows above the flood',
      },
    ],
  },
} as const

export type EarthCollisionRouteSite = keyof typeof EARTH_COLLISION_ROUTE_SITES
