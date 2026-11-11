/**
 * Hoshimori's authored night-procession sites. e08 mirrors e07's immutable
 * coordinates but records a Vesper-led expedition and testimony.
 */
export interface NightChoice {
  id: string
  label: string
  outcome: string
  flag: string
}

export interface NightSite {
  key: string
  title: string
  opening: string
  choices: readonly [NightChoice, NightChoice]
}

function c(
  id: string,
  label: string,
  outcome: string,
  flag: string,
): NightChoice {
  return { id, label, outcome, flag }
}
function s(
  key: string,
  title: string,
  opening: string,
  a: NightChoice,
  b: NightChoice,
): NightSite {
  return { key, title, opening, choices: [a, b] }
}

export const HOSHIMORI_NIGHT_SITES: readonly NightSite[] = [
  s(
    '1,1',
    'Cedar Footbridge / The Wall That Listens',
    'The bridge is where it always was. Tonight a wall breathes through the cedar rail; the voices inside it belong to travelers who asked to leave.',
    c(
      'name-the-trapped',
      'Ask the wall to repeat the travelers’ own names',
      'Vesper writes down only names the voices consent to share. The wall yields the first processional sign.',
      'wall-consent',
    ),
    c(
      'hear-the-silence',
      'Listen for those who refuse to be named',
      'Char hears a refusal beneath the plaster. Vesper leaves their identities unwritten and remembers the first sign.',
      'wall-privacy',
    ),
  ),
  s(
    '2,1',
    'Singing Terraces / The Breathless Choir',
    'Rice stands upright in black water. The workers have sung one note for seven nights because stopping is classified as a fall.',
    c(
      'end-the-song',
      'Offer the singers a silence they can choose',
      'The singers rest. Oren marks the second sign on a route that does not require a human voice as a toll.',
      'choir-rest',
    ),
    c(
      'change-the-meter',
      'Let Char rewrite the rhythm',
      'The choir learns a rest between notes. Char refuses the village’s claim that constant singing is care.',
      'choir-meter',
    ),
  ),
  s(
    '3,1',
    'Persimmon Steps / The Coat With No Body',
    'A child’s mended coat walks the stairs alone. The procession calls this proof that the child is perfectly protected.',
    c(
      'follow-the-coat',
      'Follow without pretending the child is safe',
      'The coat leads to a locked room. Vesper keeps the third sign and a promise to ask who is inside.',
      'coat-witness',
    ),
    c(
      'cut-the-thread',
      'Release the coat from its invisible leash',
      'The coat collapses. Someone inside the house knocks three times, and Oren records the third sign.',
      'coat-release',
    ),
  ),
  s(
    '4,1',
    'Orchard of Floating Lanterns / The Hanging Eyes',
    'Every lantern faces a different window. Vesper once drew safe roads through this orchard; the lights now follow whoever tries to use them.',
    c(
      'shade-the-lanterns',
      'Cover the lights facing occupied homes',
      'Vesper’s old marks still guide rescue without publishing household addresses.',
      'orchard-shaded',
    ),
    c(
      'trace-the-wires',
      'Trace who watches the lanterns',
      'A frightened keeper confesses the surveillance began as a missing-person search, then forgot how to stop.',
      'orchard-witness',
    ),
  ),
  s(
    '1,2',
    'Lantern Stall / The Mask Exchange',
    'The stall sells masks that smile after their wearers stop. A vendor asks Vesper to choose the expression the village will permit.',
    c(
      'remove-the-mask',
      'Ask the vendor to show their own face',
      'The vendor removes a mask of obedience. Under it is a tired person, not a monster.',
      'mask-unworn',
    ),
    c(
      'buy-a-blank',
      'Carry a blank mask for anyone who needs anonymity',
      'A traveler accepts the disguise and escapes the compulsory parade without becoming your dependent.',
      'mask-blank',
    ),
  ),
  s(
    '2,2',
    'Pip’s Ledger House / The Census of Rescued Names',
    'Pip’s childhood ledger has become a census of residents declared rescued whether or not they consented. Vesper recognizes a map hidden in its margins.',
    c(
      'seal-the-children',
      'Seal children’s addresses from public testimony',
      'Pip signs a protected witness statement. Vesper learns that secrecy can preserve agency.',
      'ledger-private',
    ),
    c(
      'audit-the-ledger',
      'Ask an independent witness to audit the claimed rescues',
      'The count shrinks. Pip admits a remembered meal was never a lifetime contract.',
      'ledger-audited',
    ),
  ),
  s(
    '3,2',
    'Shrine of the Third Light / The Door That Prays',
    'A house spirit kneels before a door that locks from the outside. It insists the family is safe because nobody has departed.',
    c(
      'ask-the-family',
      'Ask the family what safety means to them',
      'The family asks for a latch on their side. The spirit listens for the first time.',
      'shrine-latch',
    ),
    c(
      'offer-a-refuge',
      'Offer an open refuge without ownership',
      'A resident walks out and returns voluntarily. The spirit sees the difference.',
      'shrine-refuge',
    ),
  ),
  s(
    '4,2',
    'Bakery Back Door / The Nurikabe Toll',
    'The route to the Oven is sealed by a living wall. Its inscription demands either a remembered three-sign promise or a public guarantee of obedience.',
    c(
      'accept-the-mark',
      'Accept a visible escort mark to cross now',
      'The wall opens, but the mark tells every patrol where you went. Vesper keeps the risk on record.',
      'door-bargain',
    ),
    c(
      'refuse-the-mark',
      'Refuse surveillance and seek the side path',
      'Oren finds a narrow legal crossing by the shrine. No one has to surrender their location to continue.',
      'door-refusal',
    ),
  ),
  s(
    '1,3',
    'Returning Slippers / The March of Empty Feet',
    'The slippers still return to the river, but now they march in perfect pairs. A missing shoe is called a missing citizen.',
    c(
      'break-the-rank',
      'Let the shoes find their own pace',
      'The procession loses its perfect count. One traveler slips away without being numbered.',
      'slippers-freed',
    ),
    c(
      'ask-the-umbrella',
      'Ask the living umbrella whom it shelters',
      'The umbrella admits it has been ordered to shelter shoes while people wait in rain.',
      'umbrella-testimony',
    ),
  ),
  s(
    '2,3',
    'Night-Crew Lane / The Names Beneath Ash',
    'The old Earth photograph is absent here. A scorched window shows people working past midnight while a voice insists that nobody is ever tired.',
    c(
      'keep-the-question',
      'Preserve the contradiction for a living witness',
      'Vesper refuses to call exhaustion safety. The night workers are allowed to speak for themselves.',
      'nightcrew-witness',
    ),
    c(
      'find-the-shift',
      'Search for the shift register, not a verdict',
      'The register lists breaks that never occurred. Char demands the workers be asked what they need.',
      'nightcrew-record',
    ),
  ),
  s(
    '3,3',
    'Guest Registry / The Redacted Parade',
    'The kitsune clerk holds a list of guests who were ordered to stay forever. Vesper’s childhood rescue map appears as evidence against them.',
    c(
      'protect-the-map',
      'Redact routes that would expose refugee families',
      'The clerk accepts testimony without publishing escape routes. Vesper can answer for harm without betraying survivors again.',
      'registry-redacted',
    ),
    c(
      'share-custody',
      'Put the map under recallable community custody',
      'The clerk refuses a single owner. Vesper makes the witnesses define how access can be withdrawn.',
      'registry-custody',
    ),
  ),
  s(
    '4,3',
    'The Red Oven / The Furnace of Names',
    'The bakery occupies its familiar corner. The Oven now burns the names of those it feeds, declaring anonymous hunger impossible.',
    c(
      'name-the-cost',
      'Demand an account of whose names became fuel',
      'The baker shows a ledger of compelled donors. Pip recognizes his own childhood signature.',
      'oven-names',
    ),
    c(
      'feed-without-claim',
      'Serve the queue without taking names',
      'For one night the bakery feeds strangers without acquiring them. The guardian calls this dangerous.',
      'oven-open',
    ),
  ),
  s(
    '1,4',
    'Hillside Shelter / The Photograph Behind Glass',
    'An Earth photograph waits behind a sealed pane: a colleague holds open Morrow’s apartment door while friends carry a secondhand table upstairs. It belongs to the Chronicle, not the procession.',
    c(
      'ask-the-colleague',
      'Ask who invited the helpers inside',
      'Vesper keeps the invitation distinct from any claim that the stolen life was justified.',
      'e08-photo-invitation',
    ),
    c(
      'honor-the-help',
      'Honor their freely chosen help without inventing a debt',
      'The moving-day photograph records people beginning again, not a contract to remain forever.',
      'e08-photo-help',
    ),
  ),
  s(
    '2,4',
    'The Paper Theatre / Actors Who Cannot Exit',
    'A painted actor bows until their spine folds. The audience has been told the play must never end because departure would be cruel.',
    c(
      'open-the-curtain',
      'Open the exit before asking anyone to perform',
      'The actors choose who stays for an encore. The empty seats are not counted as deaths.',
      'theatre-exit',
    ),
    c(
      'ask-for-a-pause',
      'Ask the actors to name the last scene',
      'The final scene is a door. Vesper remembers drawing it when they were young.',
      'theatre-pause',
    ),
  ),
  s(
    '3,4',
    'Oathboat / The Ferry That Returns Itself',
    'A boat keeps rowing rescued passengers back to shore, insisting it cannot risk leaving them anywhere unfamiliar.',
    c(
      'release-the-oar',
      'Let the passengers steer after a safety briefing',
      'Oren provides a tide chart and the ferry finally carries people where they choose.',
      'boat-agency',
    ),
    c(
      'build-a-beacon',
      'Make a return beacon rather than a leash',
      'Char lights a beacon that can be ignored. The boat stops counting refusals as disappearances.',
      'boat-beacon',
    ),
  ),
  s(
    '4,4',
    'Southern Council / The Last Shut Door',
    'The night procession arrives at a council of bolted doors. Its masked witnesses insist that every rescue creates a permanent obligation.',
    c(
      'allow-departure',
      'Write an enforceable right to leave',
      'The council accepts voluntary shelter and a revocable map. Vesper demands follow-up for those still trapped.',
      'council-departure',
    ),
    c(
      'require-consent',
      'Require renewed consent for every protection',
      'The council sets a sunset on compulsory safeguards. Vesper must answer to the families their map exposed.',
      'council-consent',
    ),
  ),
  s(
    '5,1',
    'Windward Post / The Letters That Know Your Skin',
    'The old postmistress sorts envelopes by the scars on their recipients. Every undelivered letter has grown a little hand that points toward a household that asked to be forgotten.',
    c(
      'night-post-return',
      'Return the letters to the people who sent them',
      'The hands turn toward their senders. The postmistress loses her perfect delivery record, but the absent households keep their addresses.',
      'night-post-refused',
    ),
    c(
      'night-post-witness',
      'Let the postmistress read one letter aloud as testimony',
      'She reads only the accusation against the registry. The evidence survives, though the sender must now decide whether to testify in person.',
      'night-post-evidence',
    ),
  ),
  s(
    '6,1',
    'Kite-Mender’s Loft / The Unwilling Sky',
    'Paper kites hang from bamboo ribs like folded wings. Their shadows fly in circles above the roofs, each towing a child-sized outline that refuses to land.',
    c(
      'night-kites-cut',
      'Cut the strings without choosing where the kites must land',
      'Three kites flee into the dark. A fourth stays to carry a warning; Vesper cannot promise that every runaway will return.',
      'night-kites-free',
    ),
    c(
      'night-kites-roof',
      'Ask the oldest kite to shelter the children below',
      'The kite agrees to spread itself across the roof. Its flight ends for tonight, but the children can leave by the stairwell it reveals.',
      'night-kites-shelter',
    ),
  ),
  s(
    '7,1',
    'Tengu’s Weather Desk / Forecast of Missing People',
    'The tengu courier is pinned beneath a glass weather chart. The ink predicts the exact hour each traveler will vanish, and the chart is always one hour ahead.',
    c(
      'night-forecast-break',
      'Break the chart and let the courier choose the storm',
      'The tengu escapes with a warning but no reliable forecast. Oren marks a longer ground route for those unwilling to risk the pass.',
      'night-forecast-freed',
    ),
    c(
      'night-forecast-copy',
      'Copy only the storm warnings before breaking the glass',
      'The courier carries a redacted forecast. Rescue teams gain time, but the village must stop using weather reports to predict who belongs at home.',
      'night-forecast-redacted',
    ),
  ),
  s(
    '8,1',
    'Observatory / The Constellation of Locked Doors',
    'The astronomer points upward. The stars have rearranged into a perfect floor plan of Hoshimori; every lit window is a person who cannot step outside.',
    c(
      'night-stars-darken',
      'Darken the stars that expose occupied rooms',
      'The astronomer loses her most precise chart. The night sky becomes navigable again by landmarks rather than people.',
      'night-stars-private',
    ),
    c(
      'night-stars-ask',
      'Ask the trapped voices which windows may remain visible',
      'Some windows stay lit as voluntary beacons. Others vanish, and the astronomer must learn to leave a gap in her measurements.',
      'night-stars-consented',
    ),
  ),
  s(
    '5,2',
    'Bamboo Speaking Tubes / The House That Repeats You',
    'The speaking tubes have grown into the walls. They repeat a resident’s private confession in every room, then insist the echo is a safety announcement.',
    c(
      'night-tubes-silence',
      'Silence the private tubes and leave one public alarm',
      'The house falls quiet for the first time in years. A public bell still warns of danger, but no one can summon a neighbor by whispering their secrets.',
      'night-tubes-private',
    ),
    c(
      'night-tubes-witness',
      'Let the resident record what the house did without naming them',
      'Pip preserves the testimony in a sealed account. The walls keep speaking until the household can choose its own repair.',
      'night-tubes-recorded',
    ),
  ),
  s(
    '6,2',
    'Tea House of Two Tickets / The Return That Eats Tomorrow',
    'Every cup contains a folded train ticket. The seller offers a warm seat to anyone who promises to return, while a second door opens only for those who refuse the bargain.',
    c(
      'night-ticket-oneway',
      'Take the one-way door and leave the fare for the next traveler',
      'Vesper leaves without naming a destination. The seller loses a guaranteed return, but someone else can afford to choose.',
      'night-ticket-free',
    ),
    c(
      'night-ticket-reserve',
      'Reserve a return fare without assigning it to a person',
      'The seller holds the ticket in trust. The door remains open, though the village cannot count the unclaimed fare as a rescued resident.',
      'night-ticket-held',
    ),
  ),
  s(
    '7,2',
    'Threaded Gate / The Invitation That Tightens',
    'Red invitation cords pass through the gate and disappear beneath the skin of people who once lived here. Pip recognizes his apprenticeship knot and refuses to call it a promise.',
    c(
      'night-cords-untie',
      'Untie the cords whose recipients asked for no contact',
      'The gate shrieks as its guest count falls. Pip keeps the unclaimed knots as evidence that an invitation is not a summons.',
      'night-cords-released',
    ),
    c(
      'night-cords-ask',
      'Offer each traveler a knife and let them decide',
      'Some cut their cords, some keep them. The procession cannot label either choice a disappearance without a living witness.',
      'night-cords-chosen',
    ),
  ),
  s(
    '8,2',
    'Windward Council / The Registry of Returns',
    'A council of empty coats sits around a table of addressed envelopes. The registry offers to guarantee every missing person a home, provided nobody can ever leave it.',
    c(
      'night-windward-open',
      'Fund an exit route with witnesses who can be dismissed',
      'The council releases the coats from their chairs. Some families lose a promised reunion, but the exit route survives its first refusal.',
      'night-windward-exit',
    ),
    c(
      'night-windward-limited',
      'Keep an emergency shelter with a public expiry date',
      'The coats stand up and walk out one by one. Protection continues only while the people inside can renew or refuse it.',
      'night-windward-sunset',
    ),
  ),
  s(
    '5,3',
    'Mooncake Queue / The Banquet of Borrowed Mouths',
    'A queue of open mouths stretches around an empty stall. The clay-bowl spirit has fed each mouth the same remembered supper for years, while the people attached to them are still hungry.',
    c(
      'night-mooncake-portion',
      'Feed the living guests before counting the bowls',
      'Vesper breaks the repeating meal into real portions. The spirit admits its perfect service record never counted a stomach.',
      'night-mooncake-fed',
    ),
    c(
      'night-mooncake-audit',
      'Ask the spirit to name everyone who refused the meal',
      'The spirit cannot. Pip keeps the false tally as evidence, while Char brings food to those still waiting.',
      'night-mooncake-witness',
    ),
  ),
  s(
    '6,3',
    'Foxfire Registry / The Flame That Recites Your Bones',
    'Blue foxfire writes birth names along the inside of visitors’ ribs. The kitsune courier says it began as a way to find lost children, but the letters now burn whenever anyone tries to leave.',
    c(
      'night-foxfire-choice',
      'Let each traveler choose which name the flame may keep',
      'The courier carries only consented names. A few flames go out, and their owners remain no less real.',
      'night-foxfire-consent',
    ),
    c(
      'night-foxfire-unwrite',
      'Unwrite the compulsory registry and keep a voluntary signal',
      'Oren makes a public rescue lantern. The courier loses an effortless census but gains a way to help without marking bodies.',
      'night-foxfire-release',
    ),
  ),
  s(
    '7,3',
    'Umbrella Funeral / The Rain That Borrows Fingers',
    'An umbrella walks beneath the rain on ribs made from the fingers of people it once sheltered. Its maker calls the arrangement gratitude; the umbrella calls it a debt that never ends.',
    c(
      'night-umbrella-rest',
      'Return the borrowed bones and let the umbrella retire',
      'The maker holds a funeral without claiming the shelterers. The rain is cold, but nobody owes a body for yesterday’s kindness.',
      'night-umbrella-retired',
    ),
    c(
      'night-umbrella-terms',
      'Offer a one-night shelter pact that anyone can end',
      'The umbrella agrees to one more storm with wooden ribs. The former shelterers keep their hands and their right to walk away.',
      'night-umbrella-repaired',
    ),
  ),
  s(
    '8,3',
    'Boundary Bell / The Sound Inside Your Chest',
    'The bell no longer hangs at the ridge. It rings inside the ribs of anyone who considers departing, and the watchkeeper insists the pain is proof that someone cares.',
    c(
      'night-boundary-farewell',
      'Ring once for departure and let the traveler go',
      'The bell returns to its tower. The watchkeeper hears a farewell without mistaking it for an emergency.',
      'night-boundary-freedom',
    ),
    c(
      'night-boundary-signal',
      'Give travelers an optional signal for help',
      'Char carries the first signal beyond the ridge and does not use it. The watchkeeper learns that silence can mean safety.',
      'night-boundary-signal-kept',
    ),
  ),
  s(
    '5,4',
    'Soup-Stone Waystation / The Pot That Remembers Starvation',
    'A stone boils with the memories of famine. Its soup never runs out, but every diner must relive the worst hunger of their life before they are permitted to stand.',
    c(
      'night-stone-feed',
      'Serve the soup without demanding a memory',
      'The cook discovers the pot still feeds people when nobody suffers for it. The stone loses its ledger and keeps its warmth.',
      'night-stone-open',
    ),
    c(
      'night-stone-rest',
      'Bank the stone’s heat and let the diners leave',
      'Oren arranges ordinary meals for tomorrow. The stone goes quiet, and the cook finally gets a night off.',
      'night-stone-rested',
    ),
  ),
  s(
    '6,4',
    'Kappa Ferry Ledger / The Crossing Without Reflections',
    'The kappa has collected reflections as ferry fare. Travelers reach the opposite shore, but their images remain in the water, endlessly boarding boats they never chose.',
    c(
      'night-kappa-return',
      'Return the reflections privately to their owners',
      'The kappa releases each image without announcing a name. The ferry still runs, now paid for by the village rather than stolen selves.',
      'night-kappa-restored',
    ),
    c(
      'night-kappa-witness',
      'Fund a free crossing and ask for independent witnesses',
      'A passenger watches the kappa empty its ledger. Nobody is required to testify in order to cross the river.',
      'night-kappa-free',
    ),
  ),
  s(
    '7,4',
    'Bellkeeper’s Rest / The Tongues Beneath the Floor',
    'The bellkeeper has sewn the voices of missing travelers into the floorboards. Each voice must answer a nightly roll call, even when the speaker is long gone or wants to be forgotten.',
    c(
      'night-bellkeeper-release',
      'Let the voices rest and organize a living search',
      'The floorboards stop answering. The bellkeeper joins Oren’s search parties instead of calling imprisonment remembrance.',
      'night-bellkeeper-search',
    ),
    c(
      'night-bellkeeper-invite',
      'Invite voluntary messages and retire the roll call',
      'Two voices ask to send a farewell; the rest fall silent. The bellkeeper keeps the messages without claiming their speakers.',
      'night-bellkeeper-consent',
    ),
  ),
  s(
    '8,4',
    'Shrine of Returning Names / The Tags With Teeth',
    'Wooden name tags bite into the skin of anyone who has ever fled Hoshimori. The shrine keeper says a name returned is a home restored, even when its owner has built a different life.',
    c(
      'night-shrine-offer',
      'Offer each name back without demanding a return',
      'Some travelers reclaim their names; others leave the tags untouched. Vesper recognizes a road that belongs to its walkers.',
      'night-shrine-choice',
    ),
    c(
      'night-shrine-release',
      'Release the biting tags before asking for testimony',
      'Vesper and Char cut the tags loose. The keeper must now invite people home rather than drag them by the name.',
      'night-shrine-unbound',
    ),
  ),
  s(
    '1,5',
    'Floodmark Steps / The Waterline Under the Skin',
    'The two old neighbors still hold their house keys. Tonight each floodmark is cut into their wrists, and the water rises whenever a census clerk calls their homes abandoned.',
    c(
      'night-flood-keys',
      'Carry the neighbors’ keys to higher ground without signing away their homes',
      'Vesper leads them uphill. The houses remain theirs, but the lower street loses its last two night watchkeepers.',
      'night-flood-homes-kept',
    ),
    c(
      'night-flood-evac',
      'Open the evacuation steps before disputing the false abandonment records',
      'Oren clears the stairs and saves the neighbors from the rising water. Their property claims remain contested until living witnesses return.',
      'night-flood-people-first',
    ),
  ),
  s(
    '2,5',
    'Paper-Barge Library / The Books That Breathe Water',
    'The paper barge floats on a river of wet pages. Books have grown gills; each warning read aloud steals a breath from the reader, while the librarian clutches a cookbook with her mother’s handwriting.',
    c(
      'night-barge-warnings',
      'Copy the flood warnings onto the boat’s sail and spare the readers',
      'The warning reaches downstream without another stolen breath. The librarian loses the last dry copy of her mother’s recipes.',
      'night-barge-warned',
    ),
    c(
      'night-barge-recipes',
      'Save the recipes and send a living messenger with the river heights',
      'Vesper guides the messenger by an unrecorded bank. The recipes survive, but the warning arrives later and the lowland must move quickly.',
      'night-barge-memory',
    ),
  ),
  s(
    '3,5',
    'Borrowed-Rain Weir / The Dam of Sleeping Neighbors',
    'The bakery’s floodwall is built from sleepers wrapped in sandbags. They breathe whenever the sluice opens; the keeper calls them volunteers, though their signatures are all in the same hand.',
    c(
      'night-weir-share',
      'Open both sluices and move the sleepers before the bakery floods',
      'The lower cottages are spared the worst surge. The bakery loses its flour stores, and its keeper must ask the village for help.',
      'night-weir-shared-cost',
    ),
    c(
      'night-weir-witness',
      'Wake the sleepers and expose the forged floodwall contracts',
      'The sleepers leave the dam. The lower bank must evacuate at once, but no person remains an unwilling barrier for someone else’s bread.',
      'night-weir-testified',
    ),
  ),
  s(
    '4,5',
    'Siltglass Shrine / The Bells in Their Throats',
    'Glass bells have rooted in the throats of displaced villagers. Each chime broadcasts a family’s whereabouts to the procession; the shrine spirit insists it is only delivering messages.',
    c(
      'night-siltglass-ask',
      'Ask each family which message may be carried',
      'Some bells sound a chosen reunion. Others are wrapped in cloth, and the spirit learns to deliver silence without calling it a loss.',
      'night-siltglass-consent',
    ),
    c(
      'night-siltglass-break',
      'Break the compulsory bells and preserve the sealed letters',
      'The families can speak freely again. The spirit keeps the letters until their recipients seek them, even if some messages never arrive.',
      'night-siltglass-quiet',
    ),
  ),
  s(
    '1,6',
    'Boatmaker’s Yard / The Skiff of Borrowed Hands',
    'An apprentice has sewn six sleeping hands into a rescue skiff. They row without stopping, while their owners wait on shore unable to carry their own children.',
    c(
      'night-skiff-release',
      'Return the hands and build a slower boat with the apprentice',
      'The families can hold one another again. The first crossing is delayed, so Oren organizes a dry-bank shelter before nightfall.',
      'night-skiff-restored',
    ),
    c(
      'night-skiff-one-trip',
      'Ask the owners for one last rescue trip, then unpick every stitch',
      'Two stranded travelers cross. The hands return exhausted but whole; the apprentice promises never again to call borrowed bodies equipment.',
      'night-skiff-consented',
    ),
  ),
  s(
    '2,6',
    'Lantern Refuge / The Hearth That Counts Scars',
    'The refugee cook’s stove lights only when it can count every guest’s scars. A paper official watches from the chimney and threatens to withhold firewood from anyone who refuses inspection.',
    c(
      'night-refuge-wood',
      'Carry the wood inside and refuse the chimney census',
      'The cook serves supper while the official burns its own forms for warmth. The refuge stays hidden, though tomorrow’s fuel must be found elsewhere.',
      'night-refuge-unlisted',
    ),
    c(
      'night-refuge-stove',
      'Move the stove outdoors where anyone may eat without entering a register',
      'The meal becomes a public gathering rather than a trap. The cook gives up the refuge’s secrecy but keeps every guest free to depart.',
      'night-refuge-open',
    ),
  ),
  s(
    '3,6',
    'Rainkeeper’s Accounts / The Invoice of Borrowed Breaths',
    'The rainkeeper has billed the lowlands for air trapped inside undelivered sandbags. The unpaid invoices fold into paper lungs and follow the debtors through their dreams.',
    c(
      'night-rain-audit',
      'Audit the deliveries and cancel charges for sandbags never received',
      'Pip proves the fraud. The paper lungs dissolve, but the village still needs a real flood fund before the next storm.',
      'night-rain-corrected',
    ),
    c(
      'night-rain-fund',
      'Fund the next storm collectively and release the named debtors',
      'The rainkeeper accepts a public budget instead of private punishment. Oren warns that the new fund will require ordinary, difficult arguments.',
      'night-rain-shared',
    ),
  ),
  s(
    '4,6',
    'Lowland Council / The Door with Eight Hinges',
    'The rescue road is a door whose hinges are made from the collarbones of people denied passage. Each councilor can open it only by naming someone else who must stay behind.',
    c(
      'night-lowland-road',
      'Open the road to all and accept a shared, slower repair rota',
      'The hinges become ordinary iron. Families leave at their own pace; the bakery must surrender its exclusive supply route.',
      'night-lowland-open',
    ),
    c(
      'night-lowland-veto',
      'Give the displaced households power to refuse any future closure',
      'The council loses its emergency shortcut. The households choose a temporary route and can revoke it without sacrificing another traveler.',
      'night-lowland-recall',
    ),
  ),
  s(
    '1,7',
    'Reed Ferry / The Boat of Unsent Apologies',
    'At the old ferry landing, a boatman rows across dry ground. Every passenger is an apology somebody wrote but never delivered; the boat sinks when a stranger reads one aloud.',
    c(
      'night-ferry-seal',
      'Seal the letters and let their authors choose whether to send them',
      'Vesper pays the ferryman in blank paper. The boat rises, but families must now speak for themselves without the comfort of a forced confession.',
      'night-ferry-consent',
    ),
    c(
      'night-ferry-witness',
      'Offer a confidential witness to anyone who wants to be heard',
      'Oren stays at the landing until dawn. Three apologies reach their intended people; the rest remain safely unread.',
      'night-ferry-private-witness',
    ),
  ),
  s(
    '2,7',
    'Willow Mill / The Flour That Remembers',
    'The mill grinds lost afternoons into white flour. Its hungry workers have been promised their hours back once everyone in the village is fed.',
    c(
      'night-mill-stop',
      'Stop the wheel and distribute the flour already made',
      'The village loses a day of bread. The mill workers keep the rest of their lives, and Pip organizes an honest ration queue.',
      'night-mill-rest',
    ),
    c(
      'night-mill-ledger',
      'Make the mill publish the hours it owes before it turns again',
      'The miller signs a debt no spell can erase. Char takes the first shift so the exhausted workers can leave.',
      'night-mill-restitution',
    ),
  ),
  s(
    '3,7',
    'Foxglove Field / The Scarecrow Census',
    'Scarecrows wear the faces of people who fled the flood. Each time a crow lands, the council counts one more resident safely returned.',
    c(
      'night-field-count',
      'Count only people who actually choose to come home',
      'The census shrinks overnight. Relief funds must be renegotiated, but nobody is declared safe by a straw imitation.',
      'night-field-truth',
    ),
    c(
      'night-field-shelter',
      'Turn the scarecrows into shelters without claiming their names',
      'The field fills with dry places to sleep. The council loses its flattering numbers and gains a place for real survivors.',
      'night-field-refuge',
    ),
  ),
  s(
    '4,7',
    'Ashen Orchard / The Harvest of Tomorrow',
    'Fruit ripens into small glass futures. The orchard keeper offers Vesper a vision of Char alive, but demands the names of every child who might one day be born here.',
    c(
      'night-orchard-refuse',
      'Refuse the bargain and ask Char what future she wants',
      'Char breaks the glass fruit herself. Vesper records her choice without treating it as a promise of survival.',
      'night-orchard-agency',
    ),
    c(
      'night-orchard-share',
      'Let each family decide whether to see its own possible tomorrow',
      'The keeper loses the right to trade anyone else’s future. Vesper refuses to sell Char’s fate as collateral; families decide whether to look.',
      'night-orchard-choice',
    ),
  ),

  s(
    '5,7',
    'The Borrowed Table / A Place Without a Name',
    'At the edge of the orchard a dining table has grown roots. Three chairs face the road; a fourth keeps turning toward anyone who tries to count the people who belong here.',
    c(
      'night-table-ask',
      'Ask the neighbors who is invited, without naming anyone for them',
      'The neighbors offer a path to the next house, but refuse to turn an invitation into a census.',
      'night-table-invitation',
    ),
    c(
      'night-table-leave',
      'Leave the fourth chair free for whoever chooses to arrive',
      'Char pulls the chair away from the roots. No one has to promise to stay to use the road.',
      'night-table-choice',
    ),
  ),
  s(
    '6,7',
    'The Unclaimed Supper / The Empty Place Setting',
    'A photograph rests beneath an untouched plate. An Earth supper table is set for three, with a fourth plate squeezed into the corner. The procession demands that Vesper identify the absent guest as proof of a family.',
    c(
      'night-supper-ask',
      'Ask who came to dinner, without guessing who stayed',
      'Vesper records the question beside the photograph. A place setting is evidence of hospitality, not proof of a permanent household.',
      'night-supper-question',
    ),
    c(
      'night-supper-hold',
      'Keep the uncertainty and protect the unknown guest',
      'Char turns the photograph over. The fourth plate remains visible in memory, but no stranger is assigned a name.',
      'night-supper-privacy',
    ),
  ),
  s(
    '5,5',
    'Inkfall Causeway / The Map That Charges Admission',
    'A bridge of folded paper hangs above the canal. Each traveler must surrender a memory to cross. Vesper recognizes their own childhood ink beneath the tollkeeper’s stamp.',
    c(
      'night-causeway-refuse',
      'Help the travelers mark a free crossing',
      'Vesper draws a route that the tollkeeper cannot own. Vesper holds the bridge while the first family crosses without surrendering a name.',
      'night-causeway-free',
    ),
    c(
      'night-causeway-receipt',
      'Demand the return of every stolen memory',
      'The tollkeeper opens a drawer of paper voices. Char returns the receipts to their owners; Vesper refuses to keep a copy of the route.',
      'night-causeway-returned',
    ),
  ),
  s(
    '6,5',
    'The Unwritten Platform / Last Train to Nowhere',
    'The night train stops at a platform missing from every official map. Its doors open only for passengers willing to be listed as never having arrived.',
    c(
      'night-platform-witness',
      'Record the arrivals without publishing their destinations',
      'Vesper makes a private witness roll. The conductor cannot erase the passengers, but no hunter receives an address.',
      'night-platform-witnessed',
    ),
    c(
      'night-platform-shelter',
      'Turn the empty waiting room into a shelter',
      'Vesper marks the room as occupied, not owned. Oren blocks the platform clock until the last passenger chooses where to go.',
      'night-platform-sheltered',
    ),
  ),
]

export const HOSHIMORI_NIGHT_CLUE_SITES = ['1,1', '2,1', '3,1'] as const
export const HOSHIMORI_NIGHT_MAX_EVENTS = 768
export const HOSHIMORI_NIGHT_WINDWARD_KEYS = [
  '5,1',
  '6,1',
  '7,1',
  '8,1',
  '5,2',
  '6,2',
  '7,2',
  '8,2',
] as const
export const HOSHIMORI_NIGHT_BELLROAD_KEYS = [
  '5,3',
  '6,3',
  '7,3',
  '8,3',
  '5,4',
  '6,4',
  '7,4',
  '8,4',
] as const
export const HOSHIMORI_NIGHT_SOUTHERN_KEYS = [
  '1,7',
  '2,7',
  '3,7',
  '4,7',
  '5,7',
  '6,7',
] as const
export const HOSHIMORI_NIGHT_LOWBANK_KEYS = [
  '1,5',
  '2,5',
  '3,5',
  '4,5',
  '1,6',
  '2,6',
  '3,6',
  '4,6',
] as const
const SITES = new Map(HOSHIMORI_NIGHT_SITES.map((site) => [site.key, site]))
const WINDWARD_SITES = new Set<string>(HOSHIMORI_NIGHT_WINDWARD_KEYS)
const BELLROAD_SITES = new Set<string>(HOSHIMORI_NIGHT_BELLROAD_KEYS)
const LOWBANK_SITES = new Set<string>(HOSHIMORI_NIGHT_LOWBANK_KEYS)
const SOUTHERN_SITES = new Set<string>(HOSHIMORI_NIGHT_SOUTHERN_KEYS)
const SIGNS = ['cedar', 'bell', 'coat', 'ash'] as const

export type NightEvent =
  | { type: 'move'; to: string }
  | { type: 'choose'; id: string }
  | { type: 'unbind'; signs: string[] }

export interface NightProgress {
  version: 1
  seed: number
  current: string
  visited: string[]
  choices: Record<string, string>
  flags: string[]
  doorOpen: boolean
  events: NightEvent[]
}

export function newHoshimoriNightProgress(seed: number): NightProgress {
  return {
    version: 1,
    seed,
    current: '1,1',
    visited: ['1,1'],
    choices: {},
    flags: [],
    doorOpen: false,
    events: [],
  }
}

export function hoshimoriNightOrder(seed: number): readonly string[] {
  const shift = seed % SIGNS.length
  return [SIGNS[shift]!, SIGNS[(shift + 2) % 4]!, SIGNS[(shift + 3) % 4]!]
}

export function hoshimoriNightClues(
  progress: NightProgress,
): readonly string[] {
  const order = hoshimoriNightOrder(progress.seed)
  return HOSHIMORI_NIGHT_CLUE_SITES.flatMap((key, index) =>
    progress.choices[key] ? [order[index]!] : [],
  )
}

function adjacent(a: string, b: string): boolean {
  const [ax, ay] = a.split(',').map(Number)
  const [bx, by] = b.split(',').map(Number)
  return Math.abs(ax! - bx!) + Math.abs(ay! - by!) === 1
}

export function canMoveHoshimoriNight(
  progress: NightProgress,
  to: string,
): boolean {
  if (!SITES.has(to) || !adjacent(progress.current, to)) return false
  if (WINDWARD_SITES.has(to) && !hoshimoriNightCouncil(progress)) return false
  if (BELLROAD_SITES.has(to) && !hoshimoriNightWindwardAccount(progress))
    return false
  if (LOWBANK_SITES.has(to) && !hoshimoriNightBellroadAccount(progress))
    return false
  if (SOUTHERN_SITES.has(to) && !hoshimoriNightLowbankAccount(progress))
    return false
  if (
    !progress.doorOpen &&
    ((progress.current === '4,2' && to === '4,3') ||
      (progress.current === '4,3' && to === '4,2'))
  )
    return false
  return true
}

function validEvent(event: NightEvent): boolean {
  if (!event || typeof event !== 'object') return false
  const keys = Object.keys(event).sort().join(',')
  if (event.type === 'move')
    return keys === 'to,type' && typeof event.to === 'string'
  if (event.type === 'choose')
    return keys === 'id,type' && typeof event.id === 'string'
  return (
    event.type === 'unbind' &&
    keys === 'signs,type' &&
    Array.isArray(event.signs) &&
    event.signs.length === 3 &&
    event.signs.every((sign) => typeof sign === 'string')
  )
}

export function advanceHoshimoriNight(
  progress: NightProgress,
  event: NightEvent,
): NightProgress {
  if (
    progress.events.length >= HOSHIMORI_NIGHT_MAX_EVENTS ||
    !validEvent(event)
  )
    return progress
  if (event.type === 'move') {
    if (!canMoveHoshimoriNight(progress, event.to)) return progress
    return {
      ...progress,
      current: event.to,
      visited: progress.visited.includes(event.to)
        ? progress.visited
        : [...progress.visited, event.to],
      events: [...progress.events, event],
    }
  }
  if (event.type === 'choose') {
    if (progress.choices[progress.current]) return progress
    const choice = SITES.get(progress.current)?.choices.find(
      (item) => item.id === event.id,
    )
    if (!choice) return progress
    const doorOpen =
      progress.doorOpen ||
      (progress.current === '4,2' && choice.id === 'accept-the-mark')
    return {
      ...progress,
      choices: { ...progress.choices, [progress.current]: choice.id },
      flags: [...progress.flags, choice.flag],
      doorOpen,
      events: [...progress.events, event],
    }
  }
  if (
    progress.current !== '4,2' ||
    progress.doorOpen ||
    hoshimoriNightClues(progress).length !== 3 ||
    event.signs.join(':') !== hoshimoriNightOrder(progress.seed).join(':')
  )
    return progress
  return {
    ...progress,
    doorOpen: true,
    flags: [...progress.flags, 'wall-unbound'],
    events: [...progress.events, event],
  }
}

export function hoshimoriNightCouncil(progress: NightProgress): string | null {
  if (
    !progress.choices['2,2'] ||
    !progress.choices['3,3'] ||
    !progress.choices['4,4']
  )
    return null
  return [
    progress.choices['2,2'] === 'seal-the-children'
      ? 'Pip sealed the children’s addresses from the public ledger.'
      : 'Independent witnesses corrected the false rescue census.',
    progress.choices['3,3'] === 'protect-the-map'
      ? 'Vesper kept escape routes confidential while accepting accountability.'
      : 'Refugees gained recallable custody of their own routes.',
    progress.choices['4,4'] === 'allow-departure'
      ? 'The council guaranteed a right to leave without forfeiting care.'
      : 'Every protection must be renewed by the people affected.',
  ].join(' ')
}

export function hoshimoriNightWindwardAccount(
  progress: NightProgress,
): string | null {
  if (
    !hoshimoriNightCouncil(progress) ||
    !progress.choices['5,1'] ||
    !progress.choices['7,1'] ||
    !progress.choices['8,2']
  )
    return null
  return [
    progress.choices['5,1'] === 'night-post-return'
      ? 'Undelivered letters returned to their senders without exposing absent families.'
      : 'A public accusation survived, but its sender still controls whether to testify.',
    progress.choices['7,1'] === 'night-forecast-break'
      ? 'The courier chose an uncertain storm while Oren kept a safe ground route open.'
      : 'Redacted storm warnings remained useful without becoming a census of people.',
    progress.choices['8,2'] === 'night-windward-open'
      ? 'The Windward Council funded a revocable exit, accepting that some reunions will not happen.'
      : 'The council kept time-limited shelter with an enforceable right to refuse.',
  ].join(' ')
}

export function hoshimoriNightBellroadAccount(
  progress: NightProgress,
): string | null {
  if (
    !hoshimoriNightWindwardAccount(progress) ||
    !progress.choices['5,3'] ||
    !progress.choices['6,4'] ||
    !progress.choices['8,4']
  )
    return null
  return [
    progress.choices['5,3'] === 'night-mooncake-portion'
      ? 'The queue received actual food instead of a perfect imaginary supper.'
      : 'Pip preserved proof of the false meal tally while Char fed those still waiting.',
    progress.choices['6,4'] === 'night-kappa-return'
      ? 'The kappa returned stolen reflections without publishing the travelers.'
      : 'The river gained a publicly funded free crossing with voluntary witnesses.',
    progress.choices['8,4'] === 'night-shrine-offer'
      ? 'Names could be reclaimed without forcing their owners back to Hoshimori.'
      : 'The shrine released its biting tags before requesting anyone’s testimony.',
  ].join(' ')
}

export function hoshimoriNightLowbankAccount(
  progress: NightProgress,
): string | null {
  if (
    !hoshimoriNightBellroadAccount(progress) ||
    !progress.choices['1,5'] ||
    !progress.choices['3,5'] ||
    !progress.choices['4,6']
  )
    return null
  return [
    progress.choices['1,5'] === 'night-flood-keys'
      ? 'The neighbors kept their homes but the flood watch lost two volunteers.'
      : 'The neighbors reached safety while their disputed homes await witnesses.',
    progress.choices['3,5'] === 'night-weir-share'
      ? 'The bakery sacrificed its flour to spare the cottages a worse flood.'
      : 'The forged dam contracts were exposed and the lowlands had to evacuate.',
    progress.choices['4,6'] === 'night-lowland-road'
      ? 'The rescue road opened to all with a shared repair burden.'
      : 'Displaced households gained a recallable veto over future closures.',
  ].join(' ')
}

/** Replay every legal event rather than trusting client-supplied flags or routes. */
export function restoreHoshimoriNight(value: unknown): NightProgress | null {
  if (!value || typeof value !== 'object') return null
  const saved = value as Partial<NightProgress>
  if (
    saved.version !== 1 ||
    !Number.isSafeInteger(saved.seed) ||
    saved.seed! < 0 ||
    saved.seed! > 2147483647 ||
    !Array.isArray(saved.events) ||
    saved.events.length > HOSHIMORI_NIGHT_MAX_EVENTS
  )
    return null
  let replay = newHoshimoriNightProgress(saved.seed!)
  for (const event of saved.events) {
    const next = advanceHoshimoriNight(replay, event)
    if (next === replay) return null
    replay = next
  }
  const keys: (keyof NightProgress)[] = [
    'version',
    'seed',
    'current',
    'visited',
    'choices',
    'flags',
    'doorOpen',
    'events',
  ]
  return keys.every(
    (key) => JSON.stringify(saved[key]) === JSON.stringify(replay[key]),
  )
    ? replay
    : null
}

export function validateHoshimoriNight(): string[] {
  const errors: string[] = []
  if (SITES.size !== 48) errors.push('Expected forty-eight unique night sites')
  const choiceIds = HOSHIMORI_NIGHT_SITES.flatMap((site) =>
    site.choices.map((choice) => choice.id),
  )
  if (new Set(choiceIds).size !== choiceIds.length)
    errors.push('Duplicate choice IDs')
  for (const site of HOSHIMORI_NIGHT_SITES) {
    const [x, y] = site.key.split(',').map(Number)
    if (
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      x! < 1 ||
      x! > 8 ||
      y! < 1 ||
      y! > 8 ||
      !site.title ||
      !site.opening ||
      site.choices.length !== 2 ||
      site.choices.some(
        (choice) => !choice.label || !choice.outcome || !choice.flag,
      )
    )
      errors.push('Incomplete site ' + site.key)
  }
  const reached = new Set(['1,1'])
  const queue = ['1,1']
  while (queue.length) {
    const from = queue.shift()!
    for (const site of HOSHIMORI_NIGHT_SITES) {
      if (
        !reached.has(site.key) &&
        adjacent(from, site.key) &&
        !(from === '4,2' && site.key === '4,3') &&
        !(from === '4,3' && site.key === '4,2')
      ) {
        reached.add(site.key)
        queue.push(site.key)
      }
    }
  }
  if (reached.size !== 48)
    errors.push('A night site requires a blind or sealed crossing')
  if (!SITES.has('1,4') || !SITES.has('6,7'))
    errors.push('e08 photo reservations drifted')
  return errors
}
