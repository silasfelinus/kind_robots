/**
 * Hoshimori's connected sixty-four-site warm village and optional second Oven wing.
 * Its e07 campaign entry remains gated behind the preceding experiences.
 */
export interface HoshimoriChoice {
  id: string
  label: string
  outcome: string
  rations?: number
  trust?: number
  flag: string
}

export interface HoshimoriSite {
  key: string
  title: string
  opening: string
  choices: readonly [HoshimoriChoice, HoshimoriChoice]
}

function site(
  key: string,
  title: string,
  opening: string,
  first: HoshimoriChoice,
  second: HoshimoriChoice,
): HoshimoriSite {
  return { key, title, opening, choices: [first, second] }
}

export const HOSHIMORI_WARM_SITES: readonly HoshimoriSite[] = [
  site(
    '1,1',
    'The Cedar Footbridge',
    'The river carries empty sandals toward a lantern supper. Pip insists the shoes count as guests, though nobody knows who took them off.',
    {
      id: 'seat',
      label: 'Spend a ration to set a place for the missing guest',
      outcome:
        'A seat remains empty but nobody is turned away. Pip writes a question mark where a name should be.',
      rations: -1,
      trust: 1,
      flag: 'guest-seated',
    },
    {
      id: 'listen',
      label: 'Follow the sandals to learn who is absent',
      outcome:
        'The current leads toward a locked household. You learn where to ask, but the hungry guests still need supper.',
      flag: 'guest-traced',
    },
  ),
  site(
    '2,1',
    'The Singing Rice Terraces',
    'A harvest song travels uphill without singers. Every time its final note returns, a lantern brightens above the paddy.',
    {
      id: 'sing',
      label: 'Return the final note without claiming the harvest',
      outcome:
        'The terraces answer with a lantern sign. The farmers remember your restraint.',
      trust: 1,
      flag: 'rice-song',
    },
    {
      id: 'gather',
      label: 'Gather fallen rice for the hungry travelers',
      outcome:
        'You recover a meal from the path, but the watchkeeper asks who will replant what you take.',
      rations: 1,
      trust: -1,
      flag: 'rice-gathered',
    },
  ),
  site(
    '3,1',
    'The Persimmon Steps',
    'Rain beads on orange fruit. A child-sized coat hangs from a branch, carefully mended and never collected.',
    {
      id: 'share',
      label: 'Leave food for whoever owns the coat',
      outcome:
        'The coat disappears at dusk. You cannot know whether its owner ate, but someone has tied a grateful knot in the sleeve.',
      rations: -1,
      trust: 2,
      flag: 'coat-fed',
    },
    {
      id: 'watch',
      label: 'Guard the coat from the weather',
      outcome:
        'You save the little garment and learn that kindness is not always something you can count in meals.',
      trust: 1,
      flag: 'coat-guarded',
    },
  ),
  site(
    '4,1',
    'Orchard of Floating Lanterns',
    'An old lantern floats upside down beneath a branch. The orchard keeper says it belonged to someone who stopped coming home.',
    {
      id: 'repair',
      label: 'Repair the wick before asking for the story',
      outcome:
        'The keeper tells you which road the absent neighbor used, because you helped without bargaining for it.',
      trust: 1,
      flag: 'orchard-repaired',
    },
    {
      id: 'mark',
      label: 'Mark the unlit route on Pip’s map',
      outcome:
        'You preserve a possible path without claiming that its traveler survived.',
      flag: 'orchard-marked',
    },
  ),
  site(
    '1,2',
    'The Lantern Stall',
    'Three painted lanterns hang over the stall. The vendor points to the first position in the festival sequence and invites you to remember its symbol.',
    {
      id: 'tend',
      label: 'Help trim the wicks',
      outcome:
        'The stall stays open for late arrivals. The vendor repeats the first lantern clue without demanding a fee.',
      trust: 1,
      flag: 'wicks-tended',
    },
    {
      id: 'borrow',
      label: 'Borrow a meal against tomorrow’s delivery',
      outcome:
        'You receive food, but the debt is entered under your name rather than the vendor’s.',
      rations: 1,
      trust: -1,
      flag: 'stall-debt',
    },
  ),
  site(
    '2,2',
    'Pip’s Ledger House',
    'Pip remembers apprenticing here, counting every borrowed bowl. He cannot recall who fed him on his first night, and the missing name is in his own handwriting.',
    {
      id: 'trace',
      label: 'Help Pip trace the anonymous meal',
      outcome:
        'Pip admits he erased a benefactor to keep the village from demanding repayment. He will testify if the Oven asks who was protected.',
      trust: 1,
      flag: 'pip-testimony',
    },
    {
      id: 'protect',
      label: 'Let Pip protect the giver’s identity',
      outcome:
        'Pip keeps the name private and promises to challenge any claim that the meal was a debt. The witness will remain anonymous.',
      trust: 1,
      flag: 'pip-privacy',
    },
  ),
  site(
    '3,2',
    'Shrine of the Third Light',
    'A household spirit sweeps the steps with a broom older than the shrine. It shows you the third lantern symbol and asks whether safety can be offered without ownership.',
    {
      id: 'welcome',
      label: 'Leave a meal where any traveler may take it',
      outcome:
        'The spirit opens the shrine to strangers. No guest must pledge to stay in exchange for food.',
      rations: -1,
      trust: 2,
      flag: 'shrine-open',
    },
    {
      id: 'ask',
      label: 'Ask the spirit what a safe household promises',
      outcome:
        'It says a home must also have a door that opens outward. You keep the warning for the Oven.',
      flag: 'shrine-warning',
    },
  ),
  site(
    '4,2',
    'The Bakery Back Door',
    'The baker offers passage to the Red Oven: either a meal for the waiting queue or a promise to help settle the village’s accounts.',
    {
      id: 'offer',
      label: 'Donate a ration for the waiting queue',
      outcome:
        'The baker opens the Oven door. A family eats now, though you have less to carry beyond the village.',
      rations: -1,
      trust: 1,
      flag: 'oven-passage-offer',
    },
    {
      id: 'pledge',
      label: 'Promise to account for the missing memories',
      outcome:
        'The baker grants passage, but Pip warns that the promise will follow you even if you leave.',
      trust: -1,
      flag: 'oven-passage-pledge',
    },
  ),
  site(
    '1,3',
    'The Returning Slippers',
    'A procession of empty slippers marches out of the stream. A living umbrella tries to shelter each one from rain it cannot feel.',
    {
      id: 'return',
      label: 'Carry the slippers back to the bridge',
      outcome:
        'The umbrella bows and gives the travelers a dry crossing, but it refuses to guess who owns the shoes.',
      trust: 1,
      flag: 'slippers-returned',
    },
    {
      id: 'record',
      label: 'Record their sizes without inventing owners',
      outcome:
        'Pip gains a useful list and an uncomfortable reminder that an inventory is not a census.',
      flag: 'slippers-recorded',
    },
  ),
  site(
    '2,3',
    'The Night-Crew Photograph',
    'An Earth photograph shows Morrow bringing warm rolls to exhausted workers. It is evidence of a kindness, not proof that the stolen life has been forgiven.',
    {
      id: 'question',
      label: 'Ask who invited Morrow into the room',
      outcome:
        'You leave the question open until a living witness can answer it. The workers are more than a verdict on Morrow.',
      flag: 'e07-photo-question',
    },
    {
      id: 'hold',
      label: 'Keep the kindness beside the original harm',
      outcome:
        'The photograph joins your private account without cancelling the loss that brought you here.',
      flag: 'e07-photo-held',
    },
  ),
  site(
    '3,3',
    'The Guest Registry',
    'A kitsune clerk insists that every guest be named accurately. A family waiting outside has good reasons not to put its children on a public list.',
    {
      id: 'witness',
      label: 'Record a voluntary adult witness',
      outcome:
        'The clerk accepts an account that can be checked without conscripting the children as evidence.',
      trust: 1,
      flag: 'registry-witness',
    },
    {
      id: 'anonymous',
      label: 'Reserve places without exposing the family',
      outcome:
        'The clerk leaves four names blank. The record is less complete and the guests are safer.',
      flag: 'registry-private',
    },
  ),
  site(
    '4,3',
    'The Red Oven',
    'Bread rises without flour. Behind the furnace door, the village’s missing memories glow like coals. The lantern sequence or a costly bakery bargain can open the threshold.',
    {
      id: 'question',
      label: 'Ask which memories pay for the bread',
      outcome:
        'The baker admits the village never asked every donor. The ovens are feeding people and hiding a serious wrong.',
      flag: 'oven-questioned',
    },
    {
      id: 'serve',
      label: 'Feed the waiting family before arguing',
      outcome:
        'The family eats. The baker agrees that immediate hunger cannot settle the question of consent.',
      rations: -1,
      trust: 1,
      flag: 'oven-family-fed',
    },
  ),
  site(
    '1,4',
    'The Hillside Shelter',
    'A house spirit has kept one room warm for travelers, but its owner fears that an open door will bring more mouths than the village can feed.',
    {
      id: 'open',
      label: 'Contribute food so the room can stay open',
      outcome:
        'A tired traveler sleeps indoors. The house spirit learns that hospitality can be shared work.',
      rations: -1,
      trust: 2,
      flag: 'shelter-fed',
    },
    {
      id: 'repair',
      label: 'Mend the roof before inviting anyone',
      outcome:
        'The room stays dry, though tonight’s travelers must still find food elsewhere.',
      trust: 1,
      flag: 'shelter-mended',
    },
  ),
  site(
    '2,4',
    'The Tanuki’s Honest Market',
    'A trader in an oversized ceremonial hat advertises perfect fairness. His scales are accurate; the labels on the weights are not.',
    {
      id: 'audit',
      label: 'Correct the labels in front of everyone',
      outcome:
        'The trader loses face and keeps his shop. Customers can finally judge the bargain for themselves.',
      trust: 1,
      flag: 'market-audited',
    },
    {
      id: 'trade',
      label: 'Take the discounted meal and note the trick',
      outcome:
        'You gain food while the mislabeled weights remain for the next buyer. Pip notices.',
      rations: 1,
      trust: -1,
      flag: 'market-traded',
    },
  ),
  site(
    '3,4',
    'The Umbrella Workshop',
    'Living umbrellas refuse to be thrown away when their cloth tears. The repairer calls them stubborn; they call it survival.',
    {
      id: 'mend',
      label: 'Repair an umbrella and ask its permission',
      outcome:
        'It offers to shelter one traveler, but chooses the road itself.',
      trust: 1,
      flag: 'umbrella-mended',
    },
    {
      id: 'release',
      label: 'Help the umbrellas leave their owner’s hooks',
      outcome:
        'The workshop loses free labor. The umbrellas gain the right to return if they wish.',
      trust: 1,
      flag: 'umbrella-freed',
    },
  ),
  site(
    '4,4',
    'The Ember Path',
    'Beyond the bakery a safe road leads out of the village. A child has placed a lantern beside the gate, pointing in both directions.',
    {
      id: 'witness',
      label: 'Promise to return with an honest account',
      outcome:
        'Pip offers to carry your account to the next village, provided you do not claim it is the only truth.',
      trust: 1,
      flag: 'path-witnessed',
    },
    {
      id: 'depart',
      label: 'Leave without promising what you cannot deliver',
      outcome:
        'The gate stays open. You have not repaired the village, but neither have you trapped yourself in a false vow.',
      flag: 'path-departed',
    },
  ),
  site(
    '5,4',
    'The Soup-Stone Waystation',
    'Beyond the Oven, a traveling cook has left a stone simmering in an empty pot. The hungry arrive with small offerings, but nobody is obliged to surrender a memory for supper.',
    {
      id: 'share',
      label: 'Add a ration so the late travelers can eat',
      outcome:
        'The cook serves the last arrivals first. Your pack grows lighter, and the stone remains just a stone: no one has to pay with a childhood.',
      rations: -1,
      trust: 2,
      flag: 'waystation-shared',
    },
    {
      id: 'account',
      label: 'Record only the ingredients people offered freely',
      outcome:
        'Pip writes a recipe with blank spaces for anonymous donors. The soup may be thinner, but nobody is entered as a debtor for accepting it.',
      trust: 1,
      flag: 'waystation-accounted',
    },
  ),
  site(
    '6,4',
    'The Kappa’s Ferry Ledger',
    'A river spirit ferries guests across a narrow channel. It has kept every borrowed bowl but cannot remember which passengers wanted their names written down.',
    {
      id: 'return',
      label: 'Help return the bowls without publishing their owners',
      outcome:
        'The kappa sets a clean bowl at each landing. Its ferry is still owed repairs, but travelers no longer have to surrender a name to cross.',
      trust: 1,
      flag: 'ferry-bowls-returned',
    },
    {
      id: 'labor',
      label: 'Offer a day of repairs instead of another memory',
      outcome:
        'The kappa accepts a practical debt it can explain and release. Pip marks the labor as voluntary, with a date when the bargain ends.',
      flag: 'ferry-repaired',
    },
  ),
  site(
    '7,4',
    'The Bellkeeper’s Rest',
    'A brass bell rings whenever someone fails to return from the mountain road. The keeper wants to engrave their names; the families disagree about what the silence means.',
    {
      id: 'ask',
      label: 'Invite families to choose how the missing are remembered',
      outcome:
        'Some request a name, others a blank line. The bellkeeper accepts both and leaves room for anyone who comes home.',
      trust: 1,
      flag: 'bell-families-asked',
    },
    {
      id: 'wait',
      label: 'Keep the bell unmarked until witnesses can be found',
      outcome:
        'The silence protects uncertain stories from becoming verdicts. One family is angry to wait, and you promise them no false certainty.',
      flag: 'bell-testimony-pending',
    },
  ),
  site(
    '7,5',
    'The Difficult Call',
    'A second Earth photograph has surfaced among the lantern records: Morrow’s phone lies face down beside crossed-out introductions. The image cannot tell you whether he called, or whom he meant to reach.',
    {
      id: 'inquire',
      label: 'Preserve the question of who Morrow hoped to call',
      outcome:
        'Pip files the image as an unanswered question, not an accusation. A draft is not a confession, and someone may still be waiting for the truth.',
      flag: 'e07-call-question',
    },
    {
      id: 'respect',
      label: 'Respect the effort without pretending the call was made',
      outcome:
        'You remember rehearsing painful words yourself. The preparation matters, but it cannot speak for the person on the other end.',
      flag: 'e07-call-respected',
    },
  ),
  site(
    '5,5',
    'The Borrowed Hearth',
    'A zashiki-warashi keeps a mountain cottage warm for people whose names are missing from the village ledger. Its landlord wants a guest list before permitting another fire.',
    {
      id: 'host',
      label: 'Spend a ration to welcome the unregistered guests',
      outcome:
        'The spirit sets out bowls without asking for names. The landlord loses a night of rent, and the travelers finally sleep indoors.',
      rations: -1,
      trust: 2,
      flag: 'ridge-hosted',
    },
    {
      id: 'measure',
      label: 'Count empty beds without naming their occupants',
      outcome:
        'Pip records the beds, not the bodies. The landlord can plan for winter, but tonight the cottage has no extra food.',
      trust: 1,
      flag: 'ridge-measured',
    },
  ),
  site(
    '5,6',
    'The Crane-Post',
    'Paper cranes carry notes between households cut off by the mountain mist. One returns with a reply written in a hand its sender no longer recognizes.',
    {
      id: 'deliver',
      label: 'Deliver the reply and let its recipient decide what it means',
      outcome:
        'The recipient keeps the strange handwriting. She recognizes the kindness even if she cannot prove who wrote it.',
      trust: 1,
      flag: 'crane-delivered',
    },
    {
      id: 'copy',
      label: 'Make a faithful copy before the ink dissolves',
      outcome:
        'The original flies on. Pip keeps a record of the words, carefully marked as evidence rather than a recovered memory.',
      flag: 'crane-copied',
    },
  ),
  site(
    '6,5',
    'The Orchard Tithe',
    'A mountain steward claims a share of every persimmon carried downriver. The trees belong to nobody, but the bridge he maintains needs repairs.',
    {
      id: 'challenge',
      label: 'Ask the steward to publish the actual bridge costs',
      outcome:
        'He opens his accounts. The bridge really is failing, but the fruit tax has been paying for his family supper too.',
      trust: 1,
      flag: 'tithe-audited',
    },
    {
      id: 'compensate',
      label: 'Pay for one repair without endorsing the tax',
      outcome:
        'A rotten plank is replaced before nightfall. The steward agrees to hold a public meeting about the rest of the toll.',
      rations: -1,
      trust: 2,
      flag: 'tithe-repaired',
    },
  ),
  site(
    '6,6',
    'The Moss-Stair Census',
    'A procession of household spirits waits on stone steps. They are asked to sign a census that would count them as property of whichever home they protect.',
    {
      id: 'invite',
      label: 'Invite the spirits to write their own terms',
      outcome:
        'Several sign as guests, not possessions. One refuses any ledger at all, and the registrar leaves a blank space.',
      trust: 1,
      flag: 'census-consented',
    },
    {
      id: 'refuse',
      label: 'Reject the census until it offers a right to leave',
      outcome:
        'The registrar shuts the book. The spirits remain uncounted, which protects their freedom but delays winter shelter allocations.',
      flag: 'census-delayed',
    },
  ),
  site(
    '7,6',
    'The Snowbell Relay',
    'The last bell before the mountain pass can warn the village about stranded travelers. Ringing it also summons a patrol that has been turning unregistered guests away.',
    {
      id: 'signal',
      label: 'Ring the bell and demand witnesses for the patrol',
      outcome:
        'The patrol arrives before the snow. With the bellkeeper watching, its captain agrees to escort travelers without checking their names.',
      trust: 1,
      flag: 'relay-witnessed',
    },
    {
      id: 'wait',
      label: 'Guide the travelers quietly before calling the patrol',
      outcome:
        'The travelers reach the ridge unharmed, but the patrol learns nothing about the people it has been excluding.',
      flag: 'relay-quiet',
    },
  ),
  site(
    '8,6',
    'The Ridge Assembly',
    'Three households gather under a snow lantern to decide whether their high road can shelter strangers. Their written account depends on whose testimony you brought.',
    {
      id: 'open',
      label: 'Propose an open road with a revocable shelter pledge',
      outcome:
        'The assembly agrees to a trial opening. Hosts may withdraw with notice, and the travelers may leave without surrendering their names.',
      trust: 1,
      flag: 'ridge-open',
    },
    {
      id: 'trial',
      label: 'Ask for a limited winter trial before promising passage',
      outcome:
        'The assembly marks a single safe route. Some travelers will still wait, but the trial has a public review date and an exit clause.',
      flag: 'ridge-trial',
    },
  ),
  site(
    '8,5',
    'The Pilgrim Hearth',
    'A traveler has kept a cooking fire alive for people walking toward the snowbell. The kettle is nearly empty, and the village has not decided whether these strangers count.',
    {
      id: 'invite',
      label: 'Share food before anyone asks for a surname',
      outcome:
        'The traveler divides your meal among four guests. Nobody is enrolled in a debt for accepting the warmth.',
      rations: -1,
      trust: 2,
      flag: 'pilgrims-fed',
    },
    {
      id: 'mend',
      label: 'Repair the chimney so the fire survives the night',
      outcome:
        'The smoke clears and the fire holds. The kettle is still thin, but the shelter will not poison its guests.',
      trust: 1,
      flag: 'pilgrims-sheltered',
    },
  ),
  site(
    '8,4',
    'The Shrine of Returning Names',
    'At the ridge shrine, travelers hang wooden tags for names they have lost. The keeper says a returned name is a gift only if its owner wants it back.',
    {
      id: 'speak',
      label: 'Read the tags aloud only to those who ask',
      outcome:
        'Two travelers reclaim names. A third chooses silence, and the keeper honors that as a complete answer.',
      trust: 1,
      flag: 'names-offered',
    },
    {
      id: 'silence',
      label: 'Leave the tags where their owners can find them privately',
      outcome:
        'The tags remain unclaimed through dusk. No one is forced to explain why a familiar name might now hurt.',
      flag: 'names-sheltered',
    },
  ),
  site(
    '1,5',
    'The Floodmark Steps',
    'River water has reached the marks carved for last winter. Two elderly neighbors will leave only if their flooded homes are recorded as homes, not abandoned property.',
    {
      id: 'evacuate',
      label: 'Spend a ration escorting the neighbors uphill',
      outcome:
        'The neighbors reach dry ground and take their house keys. Their homes remain theirs, although the road crew has one fewer meal.',
      rations: -1,
      trust: 2,
      flag: 'lowland-evacuated',
    },
    {
      id: 'record',
      label: 'Mark their homes as occupied before calling the boats',
      outcome:
        'Pip adds a temporary flood marker instead of a vacancy notice. The neighbors keep their claim, but must wait for a boat.',
      trust: 1,
      flag: 'lowland-marked',
    },
  ),
  site(
    '2,5',
    'The Paper-Barge Library',
    'A boat of swollen books bumps against the bank. The librarian is saving recipes first; a child argues that the flood warnings are more urgent.',
    {
      id: 'dry',
      label: 'Dry the warning pages and deliver them downstream',
      outcome:
        'The next hamlet receives the river heights before the water does. Several recipes blur beyond repair, and the librarian mourns them honestly.',
      trust: 1,
      flag: 'warnings-dried',
    },
    {
      id: 'catalogue',
      label: 'Preserve the recipes and copy the warnings by hand',
      outcome:
        'The food records survive, but the warning boat leaves late. Pip adds the delay to the account rather than calling the rescue flawless.',
      flag: 'recipes-saved',
    },
  ),
  site(
    '3,5',
    'The Weir of Borrowed Rain',
    'A wooden weir protects the bakery by turning floodwater toward the lower cottages. The keeper says he is only following last year’s instructions.',
    {
      id: 'unbar',
      label: 'Open the sluice and share the flood between both banks',
      outcome:
        'The cottages take less water and the bakery cellar floods. The keeper helps move the flour instead of pretending there was no cost.',
      trust: 1,
      flag: 'weir-opened',
    },
    {
      id: 'reinforce',
      label: 'Hold the bakery wall until the families can move',
      outcome:
        'The loaves survive the night, but the low cottages need boats immediately. The keeper signs his name beside the diversion.',
      flag: 'weir-held',
    },
  ),
  site(
    '4,5',
    'The Siltglass Shrine',
    'Tiny glass bells chime beneath the flood line. A spirit has been keeping messages for people who cannot return to collect them.',
    {
      id: 'ask',
      label: 'Ask each displaced household before delivering its message',
      outcome:
        'Some families accept their letters; others ask for another day. The spirit learns that a message can wait without being forgotten.',
      trust: 1,
      flag: 'siltglass-consent',
    },
    {
      id: 'keep',
      label: 'Protect the sealed letters until the water falls',
      outcome:
        'The shrine stays dry. A traveler leaves disappointed, but no private grief is announced to the whole village.',
      flag: 'siltglass-sealed',
    },
  ),
  site(
    '1,6',
    'The Boatmaker’s Yard',
    'An apprentice can finish one shallow rescue skiff before dusk. The village council wants it reserved for registered households; the river has other plans.',
    {
      id: 'build',
      label: 'Help launch the skiff for whoever needs it first',
      outcome:
        'The apprentice paints no crest on the hull. A stranger crosses safely, while the council must find another boat for its supplies.',
      trust: 1,
      flag: 'skiff-shared',
    },
    {
      id: 'salvage',
      label: 'Repair the older boats so more people can cross tomorrow',
      outcome:
        'Three leaky hulls become serviceable. Tonight’s crossing is slower, but the apprentice has learned how to keep the fleet afloat.',
      flag: 'skiffs-repaired',
    },
  ),
  site(
    '2,6',
    'The Lantern Refuge',
    'A refugee cook has built a stove above the waterline. A village official demands a list of everyone eating there before releasing firewood.',
    {
      id: 'shelter',
      label: 'Share a ration and keep the refuge open without a list',
      outcome:
        'The stove burns through the night. The official withholds the wood, and the neighbors bring their own fallen branches.',
      rations: -1,
      trust: 2,
      flag: 'refuge-opened',
    },
    {
      id: 'witness',
      label: 'Offer a voluntary witness count instead of names',
      outcome:
        'The official accepts the number of meals without a roster of vulnerable people. The cook insists the agreement expires at dawn.',
      trust: 1,
      flag: 'refuge-counted',
    },
  ),
  site(
    '3,6',
    'The Rainkeeper’s Accounts',
    'The rainkeeper has billed the lowlands for every sandbag, including bags delivered to the bakery instead. Pip asks whether a debt can be true when the delivery is false.',
    {
      id: 'audit',
      label: 'Publish the mismatched deliveries before collecting payment',
      outcome:
        'The keeper corrects the ledger and loses the right to demand repayment for undelivered bags. The next storm still needs funding.',
      trust: 1,
      flag: 'rain-audited',
    },
    {
      id: 'pledge',
      label: 'Guarantee emergency sandbags, then demand a public audit',
      outcome:
        'The lowland doors are protected tonight. Pip records your pledge as temporary, and the keeper must account for the missing bags later.',
      flag: 'rain-pledged',
    },
  ),
  site(
    '4,6',
    'The Lowland Council',
    'Flooded households, the bakery and the boatmakers each demand first claim on the next dry road. Their vote must reckon with the choices you made before arriving.',
    {
      id: 'open',
      label: 'Open the rescue road to all, with a shared repair rota',
      outcome:
        'The road opens without a residency test. Repairs are slower and the bakery objects, but strangers may leave before the next surge.',
      trust: 1,
      flag: 'lowland-road-open',
    },
    {
      id: 'restrict',
      label: 'Reserve one supervised crossing while supplies recover',
      outcome:
        'The council promises a second public vote at dawn. Some families reach shelter, while others wait where the flood can still rise.',
      flag: 'lowland-road-restricted',
    },
  ),
  site(
    '5,1',
    'The Windward Post',
    'A postmistress keeps letters for villagers who chose not to return. The mountain sends envelopes back without stamps, as if the wind were voting.',
    {
      id: 'deliver',
      label: 'Deliver only letters to people who agreed to be contacted',
      outcome:
        'The postmistress sorts permission from longing. Fewer letters travel, but no address becomes a leash for someone who left.',
      trust: 1,
      flag: 'wind-post-consented',
    },
    {
      id: 'archive',
      label: 'Keep undeliverable letters in a name-free archive',
      outcome:
        'The shelf preserves what the village wishes it could say without demanding an answer. Some families resent the silence.',
      flag: 'wind-post-archived',
    },
  ),
  site(
    '6,1',
    'The Kite-Mender’s Loft',
    'A flock of century-old paper kites waits for repairs. Their bamboo ribs creak objections when the mender calls them equipment.',
    {
      id: 'mend',
      label: 'Repair the kites and let them choose which messages to carry',
      outcome:
        'The oldest kite volunteers for the storm route and the youngest refuses it. The mender writes both decisions into the flight log.',
      trust: 1,
      flag: 'wind-kites-consented',
    },
    {
      id: 'retire',
      label: 'Help the worn kites become a shelter canopy',
      outcome:
        'The kites settle over the waiting benches. Mail travels more slowly, but the retired fliers finally have a place to rest.',
      flag: 'wind-kites-sheltered',
    },
  ),
  site(
    '7,1',
    'The Tengu’s Weather Desk',
    'A tengu courier has been blamed for every lost letter, even those dispatched into a closed pass. He offers you his storm chart, not his apology.',
    {
      id: 'pay',
      label: 'Share a meal so the courier can wait for safer winds',
      outcome:
        'He postpones the crossing and posts the forecast in plain language. The village loses a delivery day but not another messenger.',
      rations: -1,
      trust: 2,
      flag: 'wind-courier-rested',
    },
    {
      id: 'signal',
      label: 'Build a visible signal route that needs no dangerous flight',
      outcome:
        'Lantern mirrors carry urgent warnings across the pass. Ordinary letters still wait, and the courier insists that distinction be written down.',
      trust: 1,
      flag: 'wind-courier-signaled',
    },
  ),
  site(
    '8,1',
    'The Observatory of Unsent Names',
    'An astronomer has drawn constellations for people who moved away. She worries that naming a star after someone might claim their return.',
    {
      id: 'ask',
      label: 'Ask families which stories they want kept, without naming stars',
      outcome:
        'The charts gain memories offered freely. The astronomer leaves blank space for stories nobody has permission to tell.',
      trust: 1,
      flag: 'wind-stars-witnessed',
    },
    {
      id: 'erase',
      label: 'Keep the routes and remove the absent people’s names',
      outcome:
        'Travelers can still navigate by the stars. The village must learn to remember a departure without treating it as a debt.',
      flag: 'wind-stars-redacted',
    },
  ),
  site(
    '5,2',
    'The Bamboo Speaking Tubes',
    'Hollow bamboo carries whispers between houses. A child demonstrates that a private message can be heard by anyone leaning against the wall.',
    {
      id: 'screen',
      label: 'Fit listening screens and teach everyone how to use them',
      outcome:
        'The children test the new screens until the eavesdropping stops. Emergencies require a separate public call, and the neighbors agree to maintain it.',
      trust: 1,
      flag: 'wind-tubes-screened',
    },
    {
      id: 'public',
      label: 'Reserve the tubes for public warnings only',
      outcome:
        'Nobody can secretly broadcast a neighbor’s confession. Private letters take longer, and the elders must stop treating convenience as consent.',
      flag: 'wind-tubes-public',
    },
  ),
  site(
    '6,2',
    'The Tea House of Two Tickets',
    'A tea seller lays out two tickets for every traveler: one for coming home and one for leaving again. Nobody has ever been required to use both.',
    {
      id: 'reserve',
      label: 'Buy a return ticket for a stranger who might need it',
      outcome:
        'The seller sets aside the fare without writing a name. The traveler can claim the ticket or walk on, and you will not know which.',
      rations: -1,
      trust: 1,
      flag: 'wind-ticket-offered',
    },
    {
      id: 'release',
      label: 'Ask the seller to honor one-way journeys equally',
      outcome:
        'She changes the sign. A few families complain, but travelers stop having to explain why their destination is not this village.',
      trust: 1,
      flag: 'wind-ticket-free',
    },
  ),
  site(
    '7,2',
    'The Threaded Gate',
    'Red cords mark invitations sent to those who left Hoshimori. Pip recognizes a knot from his apprenticeship and refuses to say whose hand tied it.',
    {
      id: 'invite',
      label: 'Send one invitation with a clear right to refuse',
      outcome:
        'The gatekeeper adds an empty return envelope. The village may ask once, but cannot treat silence as an unfinished promise.',
      trust: 1,
      flag: 'wind-gate-invited',
    },
    {
      id: 'release',
      label: 'Untie the cords whose recipients asked for no contact',
      outcome:
        'The gate looks bare, and several households grieve. Pip keeps one knot as a record of a boundary honored, not a person forgotten.',
      flag: 'wind-gate-released',
    },
  ),
  site(
    '8,2',
    'The Windward Council',
    'Couriers, families and absent villagers’ advocates debate whether the mountain post should become a public road. Your earlier choices determine whose consent is on the record.',
    {
      id: 'open',
      label: 'Open a voluntary mail route with published withdrawal rules',
      outcome:
        'The route opens to people who opt in. It costs the village extra couriers and leaves some letters undelivered, but the exit remains real.',
      trust: 1,
      flag: 'wind-council-open',
    },
    {
      id: 'sealed',
      label: 'Keep a protected dispatch for urgent messages only',
      outcome:
        'The council funds a smaller service and appoints rotating witnesses. Families must wait to reconnect, and nobody can buy a secret address.',
      flag: 'wind-council-sealed',
    },
  ),

  site(
    '5,3',
    'The Mooncake Queue',
    'A bakehouse queue winds around an empty stall. A badger-like spirit holds three clay bowls and refuses to sell a fourth meal while the village still owes one to a stranger.',
    {
      id: 'portion',
      label: 'Divide one ration into three honest portions',
      outcome:
        'The queue moves again. The portions are modest, but the spirit records what was actually served rather than calling every visitor satisfied.',
      rations: -1,
      trust: 1,
      flag: 'moonqueue-portioned',
    },
    {
      id: 'count',
      label: 'Audit the missing fourth bowl before serving',
      outcome:
        'The fourth bowl belonged to an absent night worker. The spirit reserves it, and the queue agrees that empty chairs can represent real people.',
      flag: 'moonqueue-audited',
    },
  ),
  site(
    '6,3',
    'The Foxfire Registry',
    'A kitsune courier carries foxfire in a blue bottle. The register demands a birth name before granting shelter, but the courier only knows the names people have chosen.',
    {
      id: 'aliases',
      label: 'Accept chosen names and record only delivery consent',
      outcome:
        'The courier brings news without exposing a family in hiding. The clerk complains that accurate records have become harder, which may be true.',
      trust: 1,
      flag: 'foxfire-aliases',
    },
    {
      id: 'witness',
      label: 'Ask a neutral witness to hold sealed identities',
      outcome:
        'A sealed registry protects the travelers and permits a later fraud hearing. Nobody gets the key merely because they hold an official title.',
      flag: 'foxfire-witnessed',
    },
  ),
  site(
    '7,3',
    'The Umbrella Funeral',
    'An old paper umbrella has arranged a funeral for its broken ribs. The maker insists it can still be patched; the umbrella insists it is tired of sheltering strangers.',
    {
      id: 'mend',
      label: 'Offer repairs only if the umbrella chooses them',
      outcome:
        'The umbrella agrees to a new handle and refuses the rain patrol. The maker learns that restoration is not ownership.',
      trust: 1,
      flag: 'umbrella-consenting-repair',
    },
    {
      id: 'farewell',
      label: 'Carry the umbrella to its chosen resting place',
      outcome:
        'At the cedar grove the umbrella unfurls one last dry circle for its mourners. The village will need to train another shelter volunteer.',
      flag: 'umbrella-farewell',
    },
  ),
  site(
    '8,3',
    'The Boundary Bell',
    'The last bell before the high ridge rings for arrivals and departures alike. A watchkeeper wants to toll only for those who promise to return.',
    {
      id: 'both',
      label: 'Ring the bell for every traveler, including those leaving',
      outcome:
        'The ridge echoes with arrivals and farewells in equal measure. A departing family stops hiding its packs under blankets.',
      trust: 1,
      flag: 'bell-all-travelers',
    },
    {
      id: 'quiet',
      label: 'Keep departures private and let families choose a signal',
      outcome:
        'Some leave without ceremony. The watchkeeper loses an easy count but gains a way to warn search parties without naming people.',
      flag: 'bell-private-exits',
    },
  ),
  site(
    '1,7',
    'The Reedboat Crossing',
    'A kappa ferryman has balanced his boat with stones etched with the names of past passengers. A flood has washed away the bank where those passengers used to board.',
    {
      id: 'ferry',
      label: 'Spend a ration to ferry stranded neighbors first',
      outcome:
        'The ferryman gives his own seat to the last traveler. Your supper is delayed, but no passenger must promise to stay as payment.',
      rations: -1,
      trust: 2,
      flag: 'reedboat-rescue',
    },
    {
      id: 'dock',
      label: 'Build a temporary landing from fallen reeds',
      outcome:
        'The boat can return for everyone at dawn. The people who needed help tonight are grateful for the plan but still cold.',
      flag: 'reedboat-landing',
    },
  ),
  site(
    '2,7',
    'Scarecrow Parliament',
    'Six straw guardians have elected a seventh to speak for the field. The new speaker insists the farmers owe the scarecrows a holiday, not another harvest season.',
    {
      id: 'rest',
      label: 'Support a rotating rest day for the guardians',
      outcome:
        'Crows take some grain, but the fields no longer depend on exhausted sentries. A farmer volunteers to patrol the gaps.',
      trust: 1,
      flag: 'straw-rest-rotation',
    },
    {
      id: 'bargain',
      label: 'Negotiate an emergency harvest before the holiday',
      outcome:
        'The guardians accept one last watch for a written end date. The harvest is saved but the farmers now owe a public accounting.',
      rations: 1,
      flag: 'straw-harvest-pact',
    },
  ),
  site(
    '3,7',
    'The Mirror Pond',
    'At noon the pond shows each visitor wearing a neighbor’s face. Pip sees his younger self holding a bowl that he has never been able to place.',
    {
      id: 'question',
      label: 'Ask Pip what he remembers without supplying an answer',
      outcome:
        'He recalls the weight of the bowl and the smell of cedar smoke. He cannot name its giver, and thanks you for not inventing one.',
      trust: 1,
      flag: 'pond-pip-question',
    },
    {
      id: 'protect',
      label: 'Cover the reflection until Pip chooses to look again',
      outcome:
        'Pip sits beside the covered pond and speaks about his apprenticeship in his own time. The image remains evidence, not a verdict.',
      flag: 'pond-pip-sheltered',
    },
  ),
  site(
    '4,7',
    'The River Archive',
    'Rain has blurred the village’s first visitor book. A tiny zashiki-warashi protects the pages because the name of the person who sheltered Pip may still be written there.',
    {
      id: 'copy',
      label: 'Copy the legible names, leaving the missing entry blank',
      outcome:
        'Pip recognizes his old handwriting beside an empty space. The child spirit promises to keep the book safe until its owner can speak.',
      trust: 1,
      flag: 'river-archive-copied',
    },
    {
      id: 'seal',
      label: 'Seal the book until the named villagers consent to disclosure',
      outcome:
        'Some neighbors accuse you of hiding history. The child spirit insists a person can be remembered without being exposed.',
      flag: 'river-archive-sealed',
    },
  ),
  site(
    '5,7',
    'The First-Grain Treasury',
    'A tanuki treasurer guards the emergency rice in a kettle too small to hold it. Every ledger says the stock doubled overnight; the sacks on the floor have not.',
    {
      id: 'audit',
      label: 'Count the sacks with the farmers before approving a feast',
      outcome:
        'The festival budget shrinks to fit the real harvest. The treasurer keeps his dignity only by admitting the kettle never created food.',
      trust: 1,
      flag: 'grain-treasury-audited',
    },
    {
      id: 'feed',
      label: 'Give one ration to the waiting children immediately',
      outcome:
        'The children eat while the accountants argue. Your own bag is lighter, and someone must still repair the false harvest record.',
      rations: -1,
      trust: 1,
      flag: 'grain-treasury-fed',
    },
  ),
  site(
    '6,7',
    'Stone Steps of the Oni',
    'An enormous oni stonemason sits beside the collapsed stair. Villagers call him a monster, but he has spent the night rebuilding their path without being offered water.',
    {
      id: 'water',
      label: 'Share a ration and ask what labor he agreed to',
      outcome:
        'He asks for a rest bell and a fair wage. The repaired stair opens, and the village has one less excuse to fear its rescuer.',
      rations: -1,
      trust: 2,
      flag: 'oni-stonemason-respected',
    },
    {
      id: 'plan',
      label: 'Offer to organize a work crew rather than demand a miracle',
      outcome:
        'Oren’s borrowed measuring cord finds a safer angle. The oni accepts the help, although the stair will take another day.',
      trust: 1,
      flag: 'oni-stair-crew',
    },
  ),
  site(
    '7,7',
    'The Kindness Tax',
    'A magistrate taxes every household that has received an unrecorded gift. The poorest homes owe the most, while the richest keep flawless ledgers.',
    {
      id: 'challenge',
      label: 'Challenge the tax with witnessed examples of mutual care',
      outcome:
        'The magistrate suspends collections and schedules a hearing. No one is instantly forgiven, but the bailiff leaves the kitchens alone.',
      trust: 1,
      flag: 'kindness-tax-challenged',
    },
    {
      id: 'relief',
      label: 'Pay a household’s immediate fee and record the unfairness',
      outcome:
        'One family keeps its stove. Pip writes the payment as emergency relief, refusing to describe the tax itself as lawful.',
      rations: -1,
      flag: 'kindness-tax-relief',
    },
  ),
  site(
    '8,7',
    'The Last Warm Lantern',
    'A lantern on the south path lights only for travelers who have no known home. Its keeper says the flame is fading because fewer strangers dare ask for shelter.',
    {
      id: 'invite',
      label: 'Keep the flame open to anyone who asks for one night',
      outcome:
        'The lantern burns brighter. The keeper posts a clear morning check-in, and nobody is asked to surrender a name at the door.',
      trust: 1,
      flag: 'last-lantern-open',
    },
    {
      id: 'guide',
      label: 'Teach travelers to light their own portable lamps',
      outcome:
        'The path becomes less dependent on a single keeper. Some newcomers remain in the dark until the first lesson reaches them.',
      flag: 'last-lantern-taught',
    },
  ),
  site(
    '1,8',
    'The Moon-Rice Gate',
    'Silver grains fall upward from an old field gate. A kodama asks whether the harvest belongs to the earth, the tenant, or the mouths waiting beyond the bridge.',
    {
      id: 'commons',
      label: 'Reserve a shared portion after the growers are paid',
      outcome:
        'The farmers accept a smaller private yield. The forest spirit agrees to guide the storehouse carts, not own their destination.',
      trust: 1,
      flag: 'moonrice-commons',
    },
    {
      id: 'seed',
      label: 'Save the first grain as seed for next season',
      outcome:
        'The village endures another lean supper but avoids eating its future harvest. The kodama plants the seed beside the road.',
      flag: 'moonrice-seed',
    },
  ),
  site(
    '2,8',
    'The Kettle That Refused',
    'A battered tea kettle, now walking on tiny feet, declines to boil for a festival official who has never washed a cup. Its owner fears losing the supper contract.',
    {
      id: 'negotiate',
      label: 'Ask the kettle for fair hours and shared cleaning',
      outcome:
        'The kettle agrees to one short service. The official washes the first cup with an expression of immense personal tragedy.',
      trust: 1,
      flag: 'kettle-negotiated',
    },
    {
      id: 'rest',
      label: 'Serve cool barley tea and let the kettle rest',
      outcome:
        'The tea is plain and the queue remains long, but the workshop’s living tools hear that refusal does not mean abandonment.',
      flag: 'kettle-rested',
    },
  ),
  site(
    '3,8',
    'The Paper Shadow Theatre',
    'Performers cast a village history on a screen of rice paper. In the oldest scene, a small goblin receives a meal from someone whose silhouette has been cut away.',
    {
      id: 'ask',
      label: 'Ask the actors why the figure was removed',
      outcome:
        'They explain that the donor requested privacy. Pip sees how a kindness can remain true even when its giver is not public.',
      trust: 1,
      flag: 'shadow-theatre-asked',
    },
    {
      id: 'perform',
      label: 'Help perform the story with the missing figure left open',
      outcome:
        'Children take turns holding the empty place on the screen. Each tells a different possible kindness without claiming it as fact.',
      flag: 'shadow-theatre-open',
    },
  ),
  site(
    '4,8',
    'The Storm-Writing Shrine',
    'A tengu archivist records storms as poems tied to a wooden rail. One forecast would save the village if it were shared, but names an endangered family’s hidden refuge.',
    {
      id: 'redact',
      label: 'Send the warning with the refuge location removed',
      outcome:
        'The warning reaches every district a little later. The family stays hidden, and local guides escort residents without knowing their names.',
      trust: 1,
      flag: 'storm-warning-redacted',
    },
    {
      id: 'escort',
      label: 'Organize a confidential evacuation with the archivist',
      outcome:
        'The endangered family leaves before the wind turns. The warning cannot be made public yet, and other households face more uncertainty.',
      flag: 'storm-warning-escorted',
    },
  ),
  site(
    '5,8',
    'The Lanterns for the Unnamed',
    'A memorial grove carries lanterns without inscriptions. Pip used to come here after the ledger keeper told him that remembering a meal is different from owning its giver.',
    {
      id: 'offer',
      label: 'Hang a lantern for the kindness, not an invented name',
      outcome:
        'Pip places the lantern beneath a cedar. He admits that gratitude is not a debt someone can demand back from him.',
      trust: 2,
      flag: 'unnamed-lantern-offered',
    },
    {
      id: 'wait',
      label: 'Stay with Pip until he decides whether to hang one',
      outcome:
        'He keeps the lantern for now. The keeper agrees that a private memory can still be honored without a public ceremony.',
      trust: 1,
      flag: 'unnamed-lantern-waited',
    },
  ),
  site(
    '6,8',
    'The Guestbook at the Edge',
    'Families displaced by the flood want a place in the visitor book without being declared permanent residents. The book’s spirit dislikes blank departure dates.',
    {
      id: 'temporary',
      label: 'Record a voluntary stay with a blank departure date',
      outcome:
        'The spirit learns to leave room for change. The families accept shelter without agreeing to be counted forever.',
      trust: 1,
      flag: 'guestbook-temporary',
    },
    {
      id: 'portable',
      label: 'Give families a portable copy of their own entries',
      outcome:
        'The households can take the record when they move. The village keeps less data, but no one needs permission to carry their history.',
      flag: 'guestbook-portable',
    },
  ),
  site(
    '7,8',
    'The Oathboat Landing',
    'A boat with no oars waits to carry one promise across the river. Its pilot warns that promises cannot be traded as payment for someone else’s freedom.',
    {
      id: 'witness',
      label: 'Carry a promise to testify, with the witness’s permission',
      outcome:
        'The boat moves at once. The witness keeps the right to change their testimony, even when the audience prefers certainty.',
      trust: 1,
      flag: 'oathboat-witness',
    },
    {
      id: 'decline',
      label: 'Refuse to promise for anyone absent',
      outcome:
        'The pilot ferries your empty hands across anyway. For once, the village cannot turn a silence into a debt.',
      flag: 'oathboat-declined',
    },
  ),
  site(
    '8,8',
    'The South Watch Assembly',
    'From the last lantern tower, village delegates can see the floodplain, the ridge, and the road out. Pip is asked whether the person who once fed him should be named in the final ledger.',
    {
      id: 'consent',
      label: 'Let Pip decide what to remember and whom to name',
      outcome:
        'The assembly records a kindness without claiming its giver. Pip keeps the page, not because he owes the village, but because it is his.',
      trust: 2,
      flag: 'south-assembly-consent',
    },
    {
      id: 'open',
      label: 'Publish only the village’s obligations to future guests',
      outcome:
        'A public charter promises food and a safe exit to travelers. Pip leaves his private memory out of the charter and signs as a witness.',
      trust: 1,
      flag: 'south-assembly-charter',
    },
  ),
]

export const HOSHIMORI_MAX_EVENTS = 2048

export const HOSHIMORI_LANTERN_CLUE_SITES = ['1,2', '2,1', '3,2'] as const
const LANTERN_ORDERS = [
  ['bell', 'leaf', 'flame'],
  ['bell', 'flame', 'leaf'],
  ['leaf', 'bell', 'flame'],
  ['leaf', 'flame', 'bell'],
  ['flame', 'bell', 'leaf'],
  ['flame', 'leaf', 'bell'],
] as const

export interface HoshimoriOvenRoom {
  id: string
  title: string
  opening: string
  choices: readonly [HoshimoriChoice, HoshimoriChoice]
}

export const HOSHIMORI_OVEN_ROOMS: readonly HoshimoriOvenRoom[] = [
  {
    id: 'OV-01',
    title: 'The Pantry Threshold',
    opening:
      'The pantry stores loaves beside jars of other people’s memories. Pip asks whether a full shelf can justify an empty childhood.',
    choices: [
      {
        id: 'audit',
        label: 'Count the jars and ask who consented',
        outcome:
          'The baker cannot produce consent for half the jars. The missing records matter more than the impressive stock.',
        flag: 'pantry-audited',
      },
      {
        id: 'feed',
        label: 'Feed a waiting family from your own supplies',
        outcome:
          'The family eats without surrendering a memory. Your dwindling pack makes the gesture costly.',
        rations: -1,
        trust: 1,
        flag: 'pantry-fed',
      },
    ],
  },
  {
    id: 'OV-02',
    title: 'The Ember Ledger',
    opening:
      'The furnace speaks in borrowed voices. Pip recognizes one entry from his apprenticeship, but will not let you force its owner to testify.',
    choices: [
      {
        id: 'consent',
        label: 'Separate volunteered memories from seized ones',
        outcome:
          'The furnace burns colder. It can still bake, but not by quietly taking what was never offered.',
        trust: 1,
        flag: 'ember-consent',
      },
      {
        id: 'pause',
        label: 'Bank the coals until the villagers can decide',
        outcome:
          'No new memories are taken tonight. The queue outside grows, and the emergency must be faced openly.',
        flag: 'ember-paused',
      },
    ],
  },
  {
    id: 'OV-03',
    title: 'The First Oven Hearing',
    opening:
      'Three households wait for an answer. This is a first hearing, not a final judgment on the Red Oven or the village.',
    choices: [
      {
        id: 'pact',
        label: 'Propose a witnessed, revocable food pact',
        outcome:
          'The households agree to discuss terms. Nobody is compelled to sign; tomorrow’s meals remain uncertain.',
        trust: 1,
        flag: 'hearing-pact',
      },
      {
        id: 'relief',
        label: 'Organize emergency meals without a new bargain',
        outcome:
          'The villagers begin a ration rota. It may not last, but it does not demand a single stolen memory.',
        flag: 'hearing-relief',
      },
    ],
  },
  {
    id: 'OV-04',
    title: 'The Ash Archive',
    opening:
      'A soot-stained archivist has arranged jars by the names of people who never agreed to be remembered. She asks whether evidence should be sealed or returned.',
    choices: [
      {
        id: 'seal-jars',
        label: 'Seal disputed jars until their owners can decide',
        outcome:
          'The archivist locks the shelves and posts a public count without names. Families must wait for their own memories, but the baker cannot spend them.',
        trust: 1,
        flag: 'ash-jars-sealed',
      },
      {
        id: 'return-names',
        label: 'Invite each owner to reclaim their jar privately',
        outcome:
          'A line forms behind a screen, not a spectacle. Some jars go home; others remain unclaimed because nobody can safely identify the owner.',
        flag: 'ash-jars-returned',
      },
    ],
  },
  {
    id: 'OV-05',
    title: 'The Night Shift',
    opening:
      'Two exhausted oven workers have been paid in borrowed dreams. One wants wages; the other wants the right to stop working without losing a bed.',
    choices: [
      {
        id: 'ask-workers',
        label: 'Let the workers set terms and a stopping time',
        outcome:
          'They write a short shift agreement with a door that opens from inside. The bakery loses a night of labor and gains two people willing to return.',
        trust: 1,
        flag: 'night-shift-consented',
      },
      {
        id: 'pay-workers',
        label: 'Share a ration as immediate pay while wages are audited',
        outcome:
          'The workers eat and keep the right to refuse tomorrow. Your supper does not settle their missing wages.',
        rations: -1,
        trust: 1,
        flag: 'night-shift-fed',
      },
    ],
  },
  {
    id: 'OV-06',
    title: 'The Living Kneading Table',
    opening:
      'A century-old table folds dough by itself. Its joints ache, but the baker calls the creaking a charming tradition.',
    choices: [
      {
        id: 'tend-tools',
        label: 'Repair the table and ask which work it wants',
        outcome:
          'The table chooses to knead for the supper crowd and refuses the overnight shift. The baker must find a willing helper.',
        trust: 1,
        flag: 'table-repaired',
      },
      {
        id: 'free-tools',
        label: 'Unfasten the table so it can leave the bakery',
        outcome:
          'It walks into the courtyard with flour on its legs. The kitchen loses its fastest worker, and the baker must ask rather than command.',
        flag: 'table-released',
      },
    ],
  },
  {
    id: 'OV-07',
    title: 'The Shared Chimney',
    opening:
      'The Oven heats a neighboring refuge through a hidden flue. Closing it would conserve bread fuel but leave flood survivors cold.',
    choices: [
      {
        id: 'share-heat',
        label: 'Keep the refuge warm and accept a smaller bake',
        outcome:
          'The refuge sleeps safely while the morning trays come out half full. Pip writes the shortage where everyone can see it.',
        trust: 1,
        flag: 'chimney-shared',
      },
      {
        id: 'bank-heat',
        label: 'Bank the flue and organize blankets for the refuge',
        outcome:
          'More loaves survive, but the neighbors must carry blankets through the rain. The refuge may disagree with your arithmetic.',
        flag: 'chimney-banked',
      },
    ],
  },
  {
    id: 'OV-08',
    title: 'The Witness Window',
    opening:
      'A window looks into the village square. The baker wants to publish every donor’s name; the refugees want evidence without a new list of people to punish.',
    choices: [
      {
        id: 'witness-claims',
        label: 'Publish verifiable totals with consenting witnesses',
        outcome:
          'The ledger can be audited without displaying every face in the queue. Some villagers demand more detail, but nobody is drafted as proof.',
        trust: 1,
        flag: 'window-witnessed',
      },
      {
        id: 'redact-claims',
        label: 'Keep names private and appoint rotating auditors',
        outcome:
          'The village trusts a smaller circle with the records. That circle can be challenged and replaced, rather than treated as infallible.',
        flag: 'window-redacted',
      },
    ],
  },
  {
    id: 'OV-09',
    title: 'The Dawn Kiln',
    opening:
      'The first hearing has ended, but the furnace still needs a morning plan. The workers, spirits and flood survivors ask for a decision they can revise.',
    choices: [
      {
        id: 'open-kiln',
        label: 'Open a limited public bake with revocable agreements',
        outcome:
          'A smaller bakery opens at dawn under a witnessed consent rule. It cannot feed everyone yet, and the council must review its promises.',
        trust: 1,
        flag: 'dawn-kiln-opened',
      },
      {
        id: 'hold-kiln',
        label: 'Keep the kiln closed until relief supplies arrive',
        outcome:
          'The jars stay untouched. The village organizes meals elsewhere, knowing that a closed furnace does not erase hunger.',
        flag: 'dawn-kiln-held',
      },
    ],
  },
  {
    id: 'OV-10',
    title: 'The Flour Weighhouse',
    opening:
      'The miller can name every sack, but not the people whose forgotten birthdays sweetened the flour. A fox spirit insists that accurate weights are not the same as fair prices.',
    choices: [
      {
        id: 'weigh-flour',
        label: 'Measure the flour and publish the missing meals',
        outcome:
          'The village can see the shortage without learning which family lost a birthday. The miller agrees to an independent count.',
        trust: 1,
        flag: 'flour-weighed',
      },
      {
        id: 'trace-sacks',
        label: 'Trace the sacks to their households in private',
        outcome:
          'Several families recognize the mill marks. They may reclaim their flour or decline the investigation; no names go on the public board.',
        flag: 'flour-traced',
      },
    ],
  },
  {
    id: 'OV-11',
    title: 'The Door of Small Shoes',
    opening:
      'A house spirit has barred the nursery door against winter. The children inside are warm, but they cannot leave even to visit the grandmother who asked for them.',
    choices: [
      {
        id: 'unlatch-door',
        label: 'Unlatch the door and let the children choose their escort',
        outcome:
          'The spirit is frightened by the cold air. The children take its hand anyway and promise to return if they wish.',
        trust: 1,
        flag: 'nursery-unlatched',
      },
      {
        id: 'ask-children',
        label: 'Ask the children what safety would mean to them',
        outcome:
          'They request a bell and an unlocked latch. The spirit learns that protection can be offered without becoming a prison.',
        flag: 'nursery-consulted',
      },
    ],
  },
  {
    id: 'OV-12',
    title: 'The Ember Witness',
    opening:
      'Kogane, the old ember spirit, has baked for the village longer than anyone remembers. It wants a name of its own, and the right to refuse a dangerous fire.',
    choices: [
      {
        id: 'release-ember',
        label: 'Release Kogane from the inherited baking oath',
        outcome:
          'Kogane steps out of the coals. The bakery loses a guaranteed flame but gains a witness who can finally say no.',
        trust: 1,
        flag: 'ember-released',
      },
      {
        id: 'offer-ember',
        label: 'Offer a revocable contract written by Kogane',
        outcome:
          'Kogane chooses a shorter season and a cooling bell. It may leave without forfeiting its name, even if the bakery must close.',
        flag: 'ember-contracted',
      },
    ],
  },
  {
    id: 'OV-13',
    title: 'The Unbaked Accounts',
    opening:
      'Pip finds two ledgers: one records the meals the Oven gave, the other records the memories it took. The totals do not agree, and the baker cannot explain why.',
    choices: [
      {
        id: 'publish-totals',
        label: 'Publish the discrepancy without exposing donors',
        outcome:
          'The council sees that someone was charged twice. Pip keeps the names private until the people involved decide whether to testify.',
        trust: 1,
        flag: 'oven-totals-published',
      },
      {
        id: 'invite-auditors',
        label: 'Invite the workers and recipients to audit privately',
        outcome:
          'The people who carried the cost compare the ledgers. They demand an independent appeal before any new bargain can bind them.',
        flag: 'oven-audit-invited',
      },
    ],
  },
  {
    id: 'OV-14',
    title: 'The Hearth Commons',
    opening:
      'Outside the furnace, the refugees, miller and night workers argue over tomorrow’s bread. A plan must survive even if Kogane chooses not to burn.',
    choices: [
      {
        id: 'build-commons',
        label: 'Organize independent kitchens and a shared ration rota',
        outcome:
          'Three small kitchens agree to share grain, with each household free to leave. The plan costs labor but does not need borrowed memories.',
        trust: 1,
        flag: 'commons-built',
      },
      {
        id: 'share-flue',
        label: 'Repair the refuge flue and ration the Oven’s heat',
        outcome:
          'The refuge keeps its warmth while the bakery reduces its bake. The workers insist that no one be compelled to stoke the fire.',
        flag: 'commons-flue-shared',
      },
    ],
  },
  {
    id: 'OV-15',
    title: 'The Hearthkeeper’s Judgment',
    opening:
      'The guardian of the Red Oven rises from a crown of cooling bricks. It offers one last bargain: the village may keep its bread, but it must decide who can refuse the cost.',
    choices: [
      {
        id: 'rewrite-guardian',
        label:
          'Rewrite the guardian’s charge with witnesses and a right to withdraw',
        outcome:
          'The guardian accepts that no oath can be inherited without consent. Its future depends on Kogane’s choice and the village’s willingness to audit itself.',
        trust: 1,
        flag: 'guardian-rewritten',
      },
      {
        id: 'quench-guardian',
        label: 'Quench the compulsory flame and fund relief outside the Oven',
        outcome:
          'The guardian goes quiet. The village must feed its people without the old bargain; the new kitchens and refuge face their first difficult morning.',
        flag: 'guardian-quenched',
      },
    ],
  },
]

export type HoshimoriEvent =
  | { type: 'move'; to: string }
  | { type: 'choose'; id: string }
  | { type: 'light'; symbols: string[] }
  | { type: 'enter' }
  | { type: 'enter-wing' }
  | { type: 'enter-ember-wing' }
  | { type: 'oven-choice'; id: string }
  | { type: 'leave' }

export interface HoshimoriWarmProgress {
  version: 1
  seed: number
  current: string
  visited: string[]
  choices: Record<string, string>
  rations: number
  trust: number
  flags: string[]
  lanternLit: boolean
  ovenRoom: string | null
  ovenChoices: Record<string, string>
  ovenComplete: boolean
  events: HoshimoriEvent[]
}

const SITES = new Map(HOSHIMORI_WARM_SITES.map((entry) => [entry.key, entry]))
const OVEN = new Map(HOSHIMORI_OVEN_ROOMS.map((entry) => [entry.id, entry]))

export function newHoshimoriWarmProgress(seed: number): HoshimoriWarmProgress {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 2147483647)
    throw new Error('Invalid Hoshimori seed')
  return {
    version: 1,
    seed,
    current: '1,1',
    visited: ['1,1'],
    choices: {},
    rations: 2,
    trust: 0,
    flags: [],
    lanternLit: false,
    ovenRoom: null,
    ovenChoices: {},
    ovenComplete: false,
    events: [],
  }
}

export function hoshimoriLanternOrder(seed: number): readonly string[] {
  return LANTERN_ORDERS[seed % LANTERN_ORDERS.length]!
}

export function hoshimoriLanternClues(
  progress: HoshimoriWarmProgress,
): { position: number; symbol: string }[] {
  return HOSHIMORI_LANTERN_CLUE_SITES.flatMap((key, index) =>
    progress.visited.includes(key)
      ? [
          {
            position: index + 1,
            symbol: hoshimoriLanternOrder(progress.seed)[index]!,
          },
        ]
      : [],
  )
}

export function hoshimoriOvenTestimony(
  progress: HoshimoriWarmProgress,
): string {
  if (progress.choices['2,2'] === 'trace')
    return 'Pip offers to testify about the erased benefactor, but insists the giver must be asked before their name is published.'
  if (progress.choices['2,2'] === 'protect')
    return 'Pip defends the anonymous giver and challenges the village to prove a debt without exposing the person who fed him.'
  return 'Pip will not guess who fed him. The hearing must proceed without a witness the player never earned.'
}

const HOSHIMORI_HEARING_OUTCOMES: Readonly<Record<string, string>> = {
  'audit:consent:pact':
    'The ledger identifies jars whose owners were never asked. A witnessed pact may use only volunteered memories, with a right to withdraw; the baker cannot promise tomorrow’s loaves until families choose. This first hearing is a proposal, not a verdict.',
  'audit:consent:relief':
    'The unconsented jars are sealed as evidence while the furnace burns only what was offered. A ration rota feeds tonight’s queue without enrolling its guests as donors; tomorrow’s shortfall is visible to everyone. The first hearing ends with an audit, not absolution.',
  'audit:pause:pact':
    'The audit exposes missing consent and the banked coals leave empty trays. The households refuse to sign a pact while the records are incomplete; the baker must ask before resuming. This first hearing adjourns without a verdict.',
  'audit:pause:relief':
    'The ledger makes the missing consent undeniable, and the coals stay banked. Neighbors open their own pantries for emergency meals, but the rota cannot feed the mountain indefinitely. The first hearing names the shortage instead of hiding it.',
  'feed:consent:pact':
    'A family eats from your pack while the furnace separates offered memories from taken ones. The proposed pact can invite future donors, not retroactively claim the jars. This first hearing protects a doorway out and leaves the baker with fewer loaves.',
  'feed:consent:relief':
    'You paid for one supper and kept the furnace from using stolen memories. The neighbors build a ration rota, but your depleted bag cannot become the village’s permanent solution. The first hearing ends with a plan for tomorrow, not a pardon.',
  'feed:pause:pact':
    'Your own supplies bridge one meal while the coals are banked. The baker asks for a witnessed pact, but the households insist on a withdrawal clause before anyone volunteers. This first hearing buys time rather than consent.',
  'feed:pause:relief':
    'Your shared supper and the banked furnace make the cost of refusing stolen memories visible. Neighbors organize a rota that might fail by dawn; nobody is forced to pay with their childhood. The first hearing ends with an open door, not a solution.',
}

export function hoshimoriRidgeAccount(
  progress: HoshimoriWarmProgress,
): string | null {
  const hearth = progress.choices['5,5']
  const relay = progress.choices['7,6']
  const assembly = progress.choices['8,6']
  if (!hearth || !relay || !assembly) return null
  const shelter =
    hearth === 'host'
      ? 'The cottage sheltered unregistered guests at the cost of a shared meal.'
      : 'The cottage counted its beds without exposing its guests, but could not promise supper.'
  const passage =
    relay === 'signal'
      ? 'A witnessed patrol agreed to escort travelers without demanding names.'
      : "The travelers reached the ridge quietly, leaving the patrol's exclusion policy unresolved."
  const decision =
    assembly === 'open'
      ? 'The assembly opened a revocable shelter route, with an exit for hosts and guests.'
      : 'The assembly authorized one winter trial, leaving some people waiting for its public review.'
  return [shelter, passage, decision].join(' ')
}

export function hoshimoriLowlandAccount(
  progress: HoshimoriWarmProgress,
): string | null {
  const flood = progress.choices['1,5']
  const rain = progress.choices['3,6']
  const council = progress.choices['4,6']
  if (!flood || !rain || !council) return null
  const evacuation =
    flood === 'evacuate'
      ? 'Two neighbors escaped the rising river, but their escort consumed a scarce meal.'
      : 'The flooded homes remained on the rolls, while their owners waited for rescue.'
  const accounting =
    rain === 'audit'
      ? 'The rainkeeper withdrew false sandbag debts after a public audit.'
      : 'Emergency sandbags arrived under a temporary pledge; the disputed debts remain under review.'
  const route =
    council === 'open'
      ? 'The council opened a shared rescue road without checking residency, accepting a slower repair.'
      : 'The council restricted the first crossing and promised a dawn review, leaving people exposed overnight.'
  return [evacuation, accounting, route].join(' ')
}

export function hoshimoriWindwardAccount(
  progress: HoshimoriWarmProgress,
): string | null {
  const post = progress.choices['5,1']
  const gate = progress.choices['7,2']
  const council = progress.choices['8,2']
  if (!post || !gate || !council) return null
  const delivery =
    post === 'deliver'
      ? 'The postmistress sent only letters to people who agreed to receive them.'
      : 'The postmistress archived unanswerable letters without exposing addresses.'
  const invitation =
    gate === 'invite'
      ? 'The threaded gate carried one invitation with a right to refuse.'
      : 'The gate released those who asked not to be contacted, despite the village’s grief.'
  const route =
    council === 'open'
      ? 'The council opened a voluntary route with published withdrawal rules and higher costs.'
      : 'The council kept a smaller protected dispatch, leaving ordinary letters waiting.'
  return [delivery, invitation, route].join(' ')
}

export function hoshimoriSouthernAccount(
  progress: HoshimoriWarmProgress,
): string | null {
  const archive = progress.choices['4,7']
  const guestbook = progress.choices['6,8']
  const assembly = progress.choices['8,8']
  if (!archive || !guestbook || !assembly) return null
  const record =
    archive === 'copy'
      ? 'The river archive preserved the legible witnesses without inventing Pip’s missing benefactor.'
      : 'The river archive protected private names until their owners can choose to speak.'
  const shelter =
    guestbook === 'temporary'
      ? 'Displaced families gained voluntary lodging with no forced departure date.'
      : 'Displaced families took portable histories that the village could not withhold.'
  const oath =
    assembly === 'consent'
      ? 'Pip kept his own memories and decided whose names, if any, belong in the ledger.'
      : 'The village published a promise of food and safe departure without claiming Pip’s private past.'
  return [record, shelter, oath].join(' ')
}

export function hoshimoriOvenSecondAccount(
  progress: HoshimoriWarmProgress,
): string | null {
  if (!progress.ovenChoices['OV-09']) return null
  const outcomes = [
    progress.ovenChoices['OV-04'] === 'seal-jars'
      ? 'Disputed memory jars remain sealed for their owners.'
      : 'Owners were invited to reclaim their jars privately.',
    progress.ovenChoices['OV-05'] === 'ask-workers'
      ? 'The night workers negotiated a stopping time.'
      : 'The workers received emergency food, not a false wage settlement.',
    progress.ovenChoices['OV-06'] === 'tend-tools'
      ? 'The living table chose a shorter shift.'
      : 'The living table left the bakery of its own accord.',
    progress.ovenChoices['OV-07'] === 'share-heat'
      ? 'The refuge stayed warm at the cost of fewer loaves.'
      : 'The bakery kept more fuel while neighbors carried blankets.',
    progress.ovenChoices['OV-08'] === 'witness-claims'
      ? 'Consenting witnesses published auditable totals.'
      : 'Rotating auditors protected the private names.',
    progress.ovenChoices['OV-09'] === 'open-kiln'
      ? 'A limited voluntary dawn bake began, with review promised.'
      : 'The kiln remained closed while alternative relief was organized.',
  ]
  return outcomes.join(' ')
}

/** The Ember Wing has three earned guardian dispositions, never a default victory. */
export function hoshimoriOvenGuardianResolution(
  progress: HoshimoriWarmProgress,
): string | null {
  const required = ['OV-10', 'OV-11', 'OV-12', 'OV-13', 'OV-14', 'OV-15']
  if (required.some((id) => !progress.ovenChoices[id])) return null
  const decision = progress.ovenChoices['OV-15']
  const support =
    progress.ovenChoices['OV-14'] === 'build-commons'
      ? 'Independent kitchens can feed people if the magic fails.'
      : 'The refuge flue keeps some people warm while a smaller bake is negotiated.'
  if (decision === 'quench-guardian')
    return (
      'The compulsory guardian is extinguished. No memories may be collected by the Oven; the village must build its relief without magical coercion. ' +
      support
    )
  if (progress.ovenChoices['OV-12'] === 'release-ember')
    return (
      'Kogane is free of the inherited oath. The guardian becomes a witness rather than a master; any future baking requires a fresh invitation from Kogane and the workers. ' +
      support
    )
  return (
    'Kogane chooses a revocable, time-limited guardianship with independent audits and a cooling bell. The guardian can be dismissed without punishing the village’s hungry families. ' +
    support
  )
}

export function hoshimoriOvenThirdAccount(
  progress: HoshimoriWarmProgress,
): string | null {
  const required = ['OV-10', 'OV-11', 'OV-12', 'OV-13', 'OV-14', 'OV-15']
  if (required.some((id) => !progress.ovenChoices[id])) return null
  const accounts = [
    progress.ovenChoices['OV-10'] === 'weigh-flour'
      ? 'The mill published the missing meal totals without naming families.'
      : 'The mill traced its sacks privately to households.',
    progress.ovenChoices['OV-11'] === 'unlatch-door'
      ? 'The nursery door opened with escorts chosen by the children.'
      : 'The children negotiated a bell and a latch that opens from inside.',
    progress.ovenChoices['OV-12'] === 'release-ember'
      ? 'Kogane left its inherited oath.'
      : 'Kogane wrote a revocable working agreement.',
    progress.ovenChoices['OV-13'] === 'publish-totals'
      ? 'Pip published the double charge without naming donors.'
      : 'Workers and recipients conducted a private audit.',
    progress.ovenChoices['OV-14'] === 'build-commons'
      ? 'Independent kitchens prepared a ration rota.'
      : 'The refuge flue was repaired under a reduced bake.',
    progress.ovenChoices['OV-15'] === 'rewrite-guardian'
      ? 'The guardian accepted an enforceable right to withdraw.'
      : 'The compulsory guardian was quenched.',
  ]
  return accounts.join(' ')
}

export function hoshimoriOvenResolution(
  progress: HoshimoriWarmProgress,
): string | null {
  if (!progress.ovenComplete) return null
  const key = [
    progress.ovenChoices['OV-01'],
    progress.ovenChoices['OV-02'],
    progress.ovenChoices['OV-03'],
  ].join(':')
  const outcome = HOSHIMORI_HEARING_OUTCOMES[key]
  return outcome ? outcome + ' ' + hoshimoriOvenTestimony(progress) : null
}

function adjacent(from: string, to: string): boolean {
  const a = from.split(',').map(Number)
  const b = to.split(',').map(Number)
  return Math.abs(a[0]! - b[0]!) + Math.abs(a[1]! - b[1]!) === 1
}

function applyChoice(
  progress: HoshimoriWarmProgress,
  choice: HoshimoriChoice,
): Pick<HoshimoriWarmProgress, 'rations' | 'trust' | 'flags'> | null {
  const rations = progress.rations + (choice.rations ?? 0)
  if (rations < 0) return null
  return {
    rations,
    trust: progress.trust + (choice.trust ?? 0),
    flags: progress.flags.includes(choice.flag)
      ? progress.flags
      : [...progress.flags, choice.flag],
  }
}

function eventShape(event: HoshimoriEvent): boolean {
  if (!event || typeof event !== 'object') return false
  const keys = Object.keys(event).sort().join(',')
  if (event.type === 'move')
    return keys === 'to,type' && typeof event.to === 'string'
  if (event.type === 'choose' || event.type === 'oven-choice')
    return keys === 'id,type' && typeof event.id === 'string'
  if (event.type === 'light')
    return (
      keys === 'symbols,type' &&
      Array.isArray(event.symbols) &&
      event.symbols.length === 3 &&
      event.symbols.every((symbol) => typeof symbol === 'string')
    )
  return (
    (event.type === 'enter' ||
      event.type === 'enter-wing' ||
      event.type === 'enter-ember-wing' ||
      event.type === 'leave') &&
    keys === 'type'
  )
}

/** A successful action is journaled exactly once; invalid moves do not mutate the run. */
export function advanceHoshimoriWarm(
  progress: HoshimoriWarmProgress,
  event: HoshimoriEvent,
): HoshimoriWarmProgress {
  if (progress.events.length >= HOSHIMORI_MAX_EVENTS || !eventShape(event))
    return progress
  let changed: Partial<HoshimoriWarmProgress> | null = null
  switch (event.type) {
    case 'move':
      if (
        !progress.ovenRoom &&
        SITES.has(event.to) &&
        adjacent(progress.current, event.to)
      )
        changed = {
          current: event.to,
          visited: progress.visited.includes(event.to)
            ? progress.visited
            : [...progress.visited, event.to],
        }
      break
    case 'choose': {
      if (progress.ovenRoom || progress.choices[progress.current]) break
      const choice = SITES.get(progress.current)?.choices.find(
        (item) => item.id === event.id,
      )
      if (!choice) break
      const effects = applyChoice(progress, choice)
      if (!effects) break
      changed = {
        ...effects,
        choices: { ...progress.choices, [progress.current]: event.id },
      }
      break
    }
    case 'light':
      if (
        !progress.ovenRoom &&
        !progress.lanternLit &&
        hoshimoriLanternClues(progress).length === 3 &&
        event.symbols.join(':') ===
          hoshimoriLanternOrder(progress.seed).join(':')
      )
        changed = { lanternLit: true, trust: progress.trust + 1 }
      break
    case 'enter':
      if (
        !progress.ovenRoom &&
        !progress.ovenComplete &&
        progress.current === '4,3' &&
        (progress.lanternLit ||
          progress.flags.includes('oven-passage-offer') ||
          progress.flags.includes('oven-passage-pledge'))
      )
        changed = { ovenRoom: 'OV-01' }
      break
    case 'enter-wing': {
      if (
        !progress.ovenRoom &&
        progress.ovenComplete &&
        progress.current === '4,3' &&
        !progress.ovenChoices['OV-09']
      ) {
        const next = HOSHIMORI_OVEN_ROOMS.slice(3, 9).find(
          (room) => !progress.ovenChoices[room.id],
        )
        if (next) changed = { ovenRoom: next.id }
      }
      break
    }
    case 'enter-ember-wing': {
      if (
        !progress.ovenRoom &&
        progress.ovenChoices['OV-09'] &&
        !progress.ovenChoices['OV-15'] &&
        progress.current === '4,3'
      ) {
        const next = HOSHIMORI_OVEN_ROOMS.slice(9).find(
          (room) => !progress.ovenChoices[room.id],
        )
        if (next) changed = { ovenRoom: next.id }
      }
      break
    }
    case 'oven-choice': {
      if (!progress.ovenRoom) break
      const room = OVEN.get(progress.ovenRoom)
      const choice = room?.choices.find((item) => item.id === event.id)
      if (
        !choice ||
        (progress.ovenChoices[progress.ovenRoom] &&
          progress.ovenChoices[progress.ovenRoom] !== event.id)
      )
        break
      const first = !progress.ovenChoices[progress.ovenRoom]
      const effects = first
        ? applyChoice(progress, choice)
        : {
            rations: progress.rations,
            trust: progress.trust,
            flags: progress.flags,
          }
      if (!effects) break
      const index = HOSHIMORI_OVEN_ROOMS.findIndex(
        (item) => item.id === room!.id,
      )
      const next =
        room!.id === 'OV-03' || room!.id === 'OV-09'
          ? null
          : (HOSHIMORI_OVEN_ROOMS[index + 1]?.id ?? null)
      changed = {
        ...effects,
        ovenChoices: first
          ? { ...progress.ovenChoices, [room!.id]: event.id }
          : progress.ovenChoices,
        ovenRoom: next,
        ovenComplete: progress.ovenComplete || next === null,
      }
      break
    }
    case 'leave':
      if (progress.ovenRoom) changed = { ovenRoom: null }
      break
  }
  if (!changed) return progress
  return { ...progress, ...changed, events: [...progress.events, event] }
}

/** Replay rather than trusting a saved resource balance, route or puzzle solution. */
export function restoreHoshimoriWarm(
  value: unknown,
): HoshimoriWarmProgress | null {
  if (!value || typeof value !== 'object') return null
  const saved = value as Partial<HoshimoriWarmProgress>
  if (
    saved.version !== 1 ||
    !Number.isSafeInteger(saved.seed) ||
    saved.seed! < 0 ||
    saved.seed! > 2147483647 ||
    !Array.isArray(saved.events) ||
    saved.events.length > HOSHIMORI_MAX_EVENTS
  )
    return null
  let replay = newHoshimoriWarmProgress(saved.seed!)
  for (const event of saved.events) {
    const next = advanceHoshimoriWarm(replay, event)
    if (next === replay) return null
    replay = next
  }
  const keys: (keyof HoshimoriWarmProgress)[] = [
    'version',
    'seed',
    'current',
    'visited',
    'choices',
    'rations',
    'trust',
    'flags',
    'lanternLit',
    'ovenRoom',
    'ovenChoices',
    'ovenComplete',
    'events',
  ]
  return keys.every(
    (key) => JSON.stringify(saved[key]) === JSON.stringify(replay[key]),
  )
    ? replay
    : null
}

export function validateHoshimoriWarm(): string[] {
  const errors: string[] = []
  if (SITES.size !== 64) errors.push('Expected sixty-four unique warm sites')
  if (OVEN.size !== 15) errors.push('Expected fifteen authored Oven rooms')
  const ovenChoiceIds = HOSHIMORI_OVEN_ROOMS.flatMap((room) =>
    room.choices.map((choice) => choice.id),
  )
  if (new Set(ovenChoiceIds).size !== ovenChoiceIds.length)
    errors.push('Duplicate Oven choice id')
  for (const room of HOSHIMORI_OVEN_ROOMS) {
    if (
      !room.title ||
      !room.opening ||
      room.choices.length !== 2 ||
      room.choices[0].id === room.choices[1].id ||
      room.choices.some(
        (choice) => !choice.label || !choice.outcome || !choice.flag,
      )
    )
      errors.push('Incomplete Oven room: ' + room.id)
  }
  for (const entry of HOSHIMORI_WARM_SITES) {
    const coords = entry.key.split(',').map(Number)
    if (
      coords.length !== 2 ||
      coords.some((n) => !Number.isInteger(n) || n < 1 || n > 8)
    )
      errors.push('Invalid site coordinate: ' + entry.key)
    if (
      entry.choices.length !== 2 ||
      entry.choices[0].id === entry.choices[1].id ||
      entry.choices.some(
        (choice) => !choice.label || !choice.outcome || !choice.flag,
      )
    )
      errors.push('Incomplete choices: ' + entry.key)
    if (!entry.title || !entry.opening)
      errors.push('Missing story: ' + entry.key)
  }
  const reached = new Set(['1,1'])
  const queue = ['1,1']
  while (queue.length) {
    const current = queue.shift()!
    for (const key of SITES.keys()) {
      if (!reached.has(key) && adjacent(current, key)) {
        reached.add(key)
        queue.push(key)
      }
    }
  }
  if (reached.size !== 64) errors.push('Warm map is disconnected')
  if (!SITES.has('2,3') || !SITES.has('7,5'))
    errors.push('Earth-photo reservation drift')
  if (HOSHIMORI_LANTERN_CLUE_SITES.some((key) => !SITES.has(key)))
    errors.push('Missing lantern clue')
  return errors
}
