/**
 * Authored e09 sites that replace the remaining recipe sites in the Briar
 * collision (2026-11-20 PT). Rowan leads; Pip is a courier companion.
 */
export const BRIAR_COLLISION_FOREST_SITES = {
  '3,2': {
    title: 'The Staff Photo in the Rain Tent',
    speaker: 'Rowan, Odile Brask and Vesper',
    kind: 'memory',
    opening:
      'Rain from the Briar canopy drips into labelled vials along a camp bench, and every label is written in a hand Rowan almost knows. Odile Brask, a field chemist swept here from his old Earth lab, taps one. “That’s Rowan’s writing,” she says, meaning the colleague who comes in every morning wearing his name. Pinned above the bench is a staff photograph: six researchers in a lab doorway, and Morrow at the end of the row, relaxed and smiling, not in the middle and not minding. A desk lamp clamped to the tent pole throws a road across the mud that only Vesper’s moth-wings can read. Odile will let Rowan study her vials, but nobody is carrying them off.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands in a dripping tent laboratory studying a pinned staff photograph of six colleagues in a lab doorway, Morrow at the end of the row as an androgynous adult in their thirties with short dark hair and a grey cardigan, while chemist Odile Brask holds up a labelled vial of forest rain and an office desk lamp casts a pale moth-road across the mud',
    choices: [
      {
        id: 'challenge',
        label: 'Read the faces in the photograph for what they actually prove',
        outcome:
          'Rowan reads the photograph the way he reads a dataset, and it refuses to give a verdict. The smiles do not prove everything is right. They do suggest six people expect Morrow back at the bench tomorrow. Odile lets him copy the vial labels into his notebook but keeps every sample, and she watches him for the rest of the visit as if he might be a thief.',
        flag: 'lab-photo-faces-read',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'Rowan in his grey cardigan leans close to a pinned staff photograph with a jeweller’s loupe, copying vial labels into a notebook while Odile Brask cradles the rain samples against her chest',
      },
      {
        id: 'hold',
        label: 'Admit that Morrow earned a place among these people',
        outcome:
          'Rowan says it aloud: Morrow found work that was never Morrow’s and did it well enough to be wanted. That makes his anger more complicated, not less justified. Odile softens and reads him the rain measurements herself, freely given, and Vesper offers to walk the lamp-road ahead of the party. The admission costs Rowan a sleepless night and the last of his tea.',
        flag: 'lab-photo-belonging-acknowledged',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Rowan sits on an upturned crate beneath the staff photograph, listening as Odile Brask reads rain measurements aloud while Vesper waits beside the desk lamp’s pale moth-road',
      },
    ],
  },
  '7,2': {
    title: 'The Switching Tent Barter',
    speaker: 'Rowan, Pip and Odile Brask',
    kind: 'merchant',
    opening:
      'Three narrow-gauge rails run straight through the camp’s supply tent, and every time someone at the barter table denies a thing they remember, the rails slide and swap places with a shriek of iron. Odile Brask keeps the tent. She trades vials of forest rain that remember whatever they fell on, and one vial fell on the road to the House. Pip haggles in a whisper, because the last courier who lied about a debt here was carried three miles east on the wrong track. Rowan watches a carter swear he never owed Odile a penny; the rails jump, and the carter’s cart goes with them.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands at a barter table of glowing rain vials inside a canvas tent while three iron rails slide past each other underfoot, Pip the goblin courier haggling with chemist Odile Brask',
    choices: [
      {
        id: 'gather-track-testimony',
        label:
          'Ask three rail workers what they truly remember and set the tracks by it',
        outcome:
          'Each rail worker gives one honest memory, and the iron settles. Odile records their words in her own book and refuses to let Rowan copy them; testimony given in her tent stays in her tent. The House vial is traded fairly for Pip’s spare compass. The carter who lied, however, now waits two days for a safe track home.',
        flag: 'switching-tent-testimony',
        effects: { evidence: 1, trust: 1, supplies: -1 },
        artSubject:
          'Three weathered rail workers speak one by one at the barter table as Rowan listens and the iron tracks lock still, Odile Brask writing in a private ledger',
      },
      {
        id: 'buy-the-long-track',
        label:
          'Pay full price for the slow honest track and ride it the long way round',
        outcome:
          'Rowan pays Odile’s price in dried food for passage on the honest track, which never moves because nobody on it denies anything. It loops past the whole camp and arrives after dark. Pip grumbles the entire ride but admits nobody was carried off. The House vial cracks on a jolt and keeps only half its road.',
        flag: 'switching-tent-long-track',
        effects: { supplies: -2, trust: 1 },
        artSubject:
          'Rowan and Pip ride a slow handcar along an outermost rail looping through lantern-lit camp tents at dusk, a cracked vial of rain glinting in Rowan’s hand',
      },
    ],
  },
  '8,2': {
    title: 'The Photocopier Over the Stair',
    speaker: 'Rowan, Odile Brask and technician Jonah Peake',
    kind: 'puzzle',
    opening:
      'In the last tent of the laboratory, a beige office photocopier squats on bare roots, warm as an animal. Under it, where the floor should be, a stone stair winds down into the Briar. Every few minutes the copier prints a page nobody fed it: a lab technician’s memory of his mother singing, one faint verse per sheet. The technician, Jonah Peake, stands with his arms full of warm paper. Odile Brask believes the original memory waits at the bottom of the stair and that every copy fades it. Rowan notices the pages come out numbered backwards, counting down toward something.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, kneels beside a humming beige photocopier rooted in a tent floor above a spiralling stone stair, counting backwards-numbered pages while technician Jonah Peake clutches warm sheets of paper',
    choices: [
      {
        id: 'descend-for-jonahs-song',
        label:
          'Descend now and bring back Jonah’s original memory before it fades',
        outcome:
          'Rowan follows the countdown down the stair, and at sheet one finds the original curled inside a root like a seed. Jonah gets his mother’s whole song back and weeps over it. The climb out is harder: the stair has turned once more than it did on the way down, and Pip has to bluff a stair-wolf out of the dark with nothing but a courier’s whistle.',
        flag: 'copier-stair-song-retrieved',
        effects: { trust: 2, danger: 2 },
        artSubject:
          'Rowan climbs a dim root-choked stair holding a glowing curl of memory like a seed, Pip whistling at a pair of wolf eyes in the dark below',
      },
      {
        id: 'mark-the-copier-exit',
        label: 'Chalk the exit and number every step before anyone goes down',
        outcome:
          'Rowan numbers the steps against the copier’s countdown while Odile tapes a toner trail to the first landing. By the time the route is safe, three more verses have faded. Jonah goes down himself with a rope around his waist and returns with most of the song, missing one line he will have to ask his sister to remember.',
        flag: 'copier-stair-exit-marked',
        effects: { evidence: 2, supplies: -1 },
        artSubject:
          'Rowan chalks numbers onto stone steps beneath the photocopier as Odile Brask lays a dark toner trail and Jonah Peake ties a rope around his waist',
      },
    ],
  },
  '1,3': {
    title: 'The Strongbox Ninepence Will Not Leave',
    speaker: 'Rowan, Scylla and the clockwork wolf Ninepence',
    kind: 'treasure',
    opening:
      'The princesses’ old royal carriage has run aground in the Briar and grown a reef: coral on the wheels, anemones in the lamps, a timetable barnacled to the door. Scylla is arguing with conductor Abelard Fisk about who has the right to ride it home. Between them sits Ninepence, a clockwork wolf with a brass nose and a ticking chest, pointing at the luggage rack. Its maker built it to smell apologies that were never delivered, and it has found one in a coral-crusted strongbox. Its patrol orders, punched into a card on its collar, also name a sleeping traveller in seat nine as a thief. Rowan checks: a seal-skinned postman named Lark, pockets empty.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands in a coral-grown royal carriage beside a brass clockwork wolf pointing at a barnacled strongbox, while Scylla argues with a stooped conductor and a seal-skinned postman sleeps in a corner seat',
    choices: [
      {
        id: 'follow-ninepence-nose',
        label:
          'Follow the wolf’s nose to the strongbox and open it with the conductor present',
        outcome:
          'Inside the strongbox is a letter of apology from Fisk to a passenger he once put off the carriage in a storm, and behind it a sheaf of old ferry tokens, enough to send several stranded passengers home. Fisk reads his own words, ashen. Lark sleeps on. Ninepence’s patrol card still names him a thief, and nobody has corrected it yet.',
        flag: 'reef-strongbox-apology-found',
        effects: { supplies: 2, danger: 1 },
        artSubject:
          'Conductor Abelard Fisk reads an old water-stained letter beside an open coral strongbox of ferry tokens while Rowan and the clockwork wolf look on',
      },
      {
        id: 'shield-lark-from-patrol',
        label:
          'Sit in the aisle by the sleeping postman until the patrol card is corrected',
        outcome:
          'Rowan sits down in the aisle by seat nine and does not move. Ninepence ticks at him for an hour before Scylla finds the punch-card error: Lark was listed as a thief because his satchel smelled of someone else’s guilt. The card is corrected and Lark wakes safe, but the strongbox sinks deeper into the coral while everyone is busy.',
        flag: 'reef-lark-shielded',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Rowan sits cross-legged in a coral carriage aisle facing a ticking clockwork wolf as Scylla squints at a punched patrol card and the postman Lark stirs awake',
      },
    ],
  },
  '2,3': {
    title: 'The Passenger for Fathom Halt',
    speaker: 'Rowan, Scylla and the eel commuter',
    kind: 'monster',
    opening:
      'Something long and grey has coiled itself three times around the reef carriage, and it is wearing a commuter’s raincoat. The eel holds a damp train ticket in its teeth: one adult single to Fathom Halt, an underwater stop printed on no map and reached by no train. Until the carriage takes him there, he will let no one off. Conductor Fisk swears the stop is imaginary. Scylla goes quiet in the way Rowan has learned to notice. The eel squeezes, and the coral on the windows cracks.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, looks up at a vast grey eel in a sodden commuter raincoat coiled around a coral-grown carriage, a damp ticket clenched in its teeth while Scylla watches from the cracked window',
    choices: [
      {
        id: 'ask-eel-for-route',
        label: 'Ask the eel how he has been trying to reach Fathom Halt',
        outcome:
          'The eel uncoils enough to talk. He has ridden every line in three worlds looking for the stop where his family boarded before a sea-court eviction scattered them. He describes the route in exact, homesick detail, and Scylla recognizes the currents. He lets the passengers go. He stays wrapped around the carriage, though, and his weight has already split the axle.',
        flag: 'eel-route-heard',
        effects: { evidence: 2, supplies: -1 },
        artSubject:
          'The great eel rests its head on the carriage roof, speaking softly to Rowan while Scylla traces currents on a fogged window and freed passengers climb down',
      },
      {
        id: 'punch-ticket-to-issue-day',
        label:
          'Punch the ticket with the conductor’s clippers and send it back to its issue day',
        outcome:
          'Fisk’s clippers bite the ticket and it dries, crisp and new, back on the morning it was printed. The eel slackens, bewildered, and slides away into the Briar mud. The passengers climb free. Nobody learns where Fathom Halt was, and Scylla walks off alone for a while without explaining why.',
        flag: 'eel-ticket-returned',
        effects: { danger: -1, trust: -1 },
        artSubject:
          'Conductor Fisk snaps brass clippers through a damp ticket as the giant eel slides away into dark mud, Rowan helping passengers down from the coral carriage',
      },
    ],
  },
  '7,3': {
    title: 'The Requests Board in the Dining Car',
    speaker: 'Rowan, Scylla and conductor Abelard Fisk',
    kind: 'memory',
    opening:
      'The reef carriage’s dining car has become a waiting room, and its cork board is crowded with handwritten requests from stranded passengers: lifts, dry socks, a translator for gull. Pinned among them is an Earth photograph of a corridor noticeboard in evening fluorescent light, a hand adding one small practical offer to its margin. Rowan knows the handwriting. Morrow volunteered for something. Outside, three rail lines slide past each other every time a passenger denies remembering an old promise, and Scylla is still telling Fisk that the right to go home belongs to whoever is stranded, not whoever owns the carriage.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, studies a coral-crusted cork board crowded with pinned paper requests inside a reef dining car, one Earth photograph of a fluorescent-lit noticeboard among them, Scylla and the conductor arguing behind',
    choices: [
      {
        id: 'challenge',
        label: 'Find out who Morrow’s small offer actually helped',
        outcome:
          'Rowan asks along the dining car and back across the shifting tracks. Nobody photographed the result. Two passengers think the offer was a lift to a hospital; one thinks it never happened. Without asking the people involved, Rowan cannot claim credit or blame for Morrow, and the asking takes long enough that the tracks swap twice and strand Pip on the wrong side.',
        flag: 'requests-board-beneficiary-sought',
        effects: { evidence: 1, danger: 1 },
        artSubject:
          'Rowan questions a row of stranded passengers along a coral dining car while, through the window, Pip waves helplessly from a platform beyond three swapping rails',
      },
      {
        id: 'hold',
        label: 'Pin an offer of his own beside Morrow’s and let it stand',
        outcome:
          'Rowan writes a note offering to help anyone rebuild a lost timetable and pins it beside the photograph. His name is becoming known for things he did not choose, and some of them might be good. Within the hour a grandmother has taken him up on it, and Fisk grudgingly lets her ride home. It costs Rowan the evening and his last good pencil.',
        flag: 'requests-board-offer-pinned',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Rowan pins a small handwritten note beside an Earth photograph on a coral cork board as an elderly passenger in a shawl reaches to take it down',
      },
    ],
  },
  '1,4': {
    title: 'The Parcel That Smells of Sorry',
    speaker: 'Rowan, Oren and the clockwork wolf Ninepence',
    kind: 'merchant',
    opening:
      'Oren’s supply depot has become a parcel office overnight, and he is keeping both systems at once: his own crate ledger in square capitals and a post office daybook that keeps rewriting itself. Ninepence has followed the party here and planted itself at the counter, brass nose pressed to a brown-paper parcel that smells, to it, of a forgotten apology. Its patrol card says the addressee, an old tinker called Mags Tallow, is a fence for stolen goods. Mags is standing right there, holding her receipt and shaking. Oren slides Rowan a note: the parcel is legally hers, and the wolf is legally escorting it.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, reads a folded note at a crowded parcel counter while hooded, masked Oren keeps two ledgers, a brass clockwork wolf presses its nose to a brown-paper parcel and an old tinker woman clutches her receipt',
    choices: [
      {
        id: 'open-with-mags-consent',
        label:
          'Ask Mags whether she will open the parcel with the wolf watching',
        outcome:
          'Mags agrees, on condition that Oren writes down that she agreed. Inside are a tin whistle and a letter from her estranged son, apologising for twenty years of silence. Ninepence goes still, satisfied, and its card clears her. Oren charges the postage both ledgers say is owed, and Mags weeps at the counter in front of strangers, which she never wanted.',
        flag: 'depot-parcel-opened-consent',
        effects: { trust: 1, evidence: 1, supplies: -1 },
        artSubject:
          'Old Mags Tallow unfolds a letter beside an opened parcel and a tin whistle as the clockwork wolf sits quietly and Rowan stands respectfully aside',
      },
      {
        id: 'sell-the-patrol-a-decoy',
        label:
          'Have Oren sell the wolf a decoy crate so Mags leaves with her parcel unopened',
        outcome:
          'Oren builds a decoy in four minutes from an empty crate and a stack of blank apology forms. Ninepence follows it out of the depot, ticking happily. Mags leaves with her parcel sealed and her privacy whole. The decoy will not fool the wolf for long, and both of Oren’s ledgers now record a sale that never quite happened.',
        flag: 'depot-decoy-crate-sold',
        effects: { trust: 2, danger: 1, evidence: -1 },
        artSubject:
          'Hooded Oren hands a neatly nailed decoy crate to the clockwork wolf while Rowan holds the depot door for Mags Tallow and her sealed parcel',
      },
    ],
  },
  '2,4': {
    title: 'The Crate That Counts Twice',
    speaker: 'Rowan, Oren and a soaked schoolboy',
    kind: 'puzzle',
    opening:
      'Oren’s two inventories disagree by exactly one crate. His headsman’s ledger, kept in tidy columns, lists a crate of rope; the post daybook lists a passenger. Rowan pries the lid and finds a damp train ticket lying on the coiled rope: a child single to Fathom Halt, stamped thirty years ago and still wet with seawater. Then a soaked schoolboy in an outsized blazer climbs out from behind the shelving and says the ticket is his. He has been in transit for a very long time. Oren sets down his pencil, which for Oren is alarm.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, lifts a dripping train ticket from a crate of coiled rope as a soaked schoolboy in an oversized blazer peers from behind depot shelves and hooded Oren lays down his pencil between two ledgers',
    choices: [
      {
        id: 'ask-boy-his-route',
        label:
          'Ask the boy to retrace his route aloud while Oren maps it in both ledgers',
        outcome:
          'The boy, Tomasz, remembers every change of train and every flooded platform. Oren draws the route twice, once in each ledger, and for the first time both inventories agree. The route proves Fathom Halt is real and reachable. Tomasz’s memories are now written down in two places he never meant them to be, and he asks shyly who else will read them.',
        flag: 'crate-route-recorded',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'Tomasz in his dripping blazer counts train changes on his fingers while hooded Oren draws matching routes in two open ledgers and Rowan listens',
      },
      {
        id: 'stamp-ticket-to-issue-date',
        label:
          'Stamp the ticket with its original date so the boy arrives where he began',
        outcome:
          'Oren’s date stamp thumps down, and the ticket and the boy both dry. Tomasz blinks and is gone, back on a sunny platform at the start of his line, where his mother is still waiting with his scarf. The crate is only rope again, and the ledgers balance. Nobody will learn the way to Fathom Halt from him now.',
        flag: 'crate-ticket-reissued',
        effects: { trust: 2, evidence: -1 },
        artSubject:
          'Oren brings a heavy brass date stamp down on a damp ticket as the schoolboy fades into warm sunlight, Rowan reaching out to wave goodbye',
      },
    ],
  },
  '3,4': {
    title: 'Vesper Sorts the Night Post',
    speaker: 'Rowan, Vesper and Oren',
    kind: 'companion',
    opening:
      'After closing, Oren’s depot is lit only by an office desk lamp, and beneath it Vesper sorts parcels by a road nobody else can see. The lamp throws a moth-road across the floor, and Vesper’s wings read it: which parcels are safe to send, which addresses are hiding someone. Rowan watches them work quickly, with shaking hands. Oren keeps the receipts from every hidden map that has passed through his depot, and one of them, he writes on a card for Rowan alone, has Vesper’s childhood route sketched on the back. Someone paid for it. Vesper has not asked to see it.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, holds a lantern-lit stack of parcels while Vesper, moth-winged and intent, sorts post along a faint glowing road cast by an office desk lamp and hooded Oren writes a private card in the shadows',
    choices: [
      {
        id: 'follow-vesper-lead',
        label:
          'Let Vesper choose the parcels and the roads, and follow without questions',
        outcome:
          'Vesper sends eleven parcels by moth-road and holds back two whose addresses would expose a family. Rowan carries what he is handed and asks nothing. By dawn Vesper is laughing at Oren’s handwriting, the first easy moment between them in a long time. The receipt stays in Oren’s drawer, unread, and whoever bought that old map is still out there.',
        flag: 'night-post-vesper-led',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Vesper laughs over a parcel label in the grey light of dawn while Rowan stacks sorted post and Oren’s masked head tilts in mock offence',
      },
      {
        id: 'trace-the-map-receipt',
        label:
          'Ask Vesper’s permission to read the receipt and trace who paid for the map',
        outcome:
          'Vesper says yes after a long silence, and reads it alongside Rowan. The buyer was the Blackcap Land Office, a Briar agency that resold the route to patrols. It is real evidence, and it hurts. Vesper sorts the rest of the post in silence and leaves before breakfast, telling Oren to put the receipt somewhere neither of them will see it again.',
        flag: 'night-post-receipt-traced',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'Rowan and Vesper read a yellowed receipt stamped with a small black-capped bird under the desk lamp, Vesper’s wings folded tight',
      },
    ],
  },
  '4,4': {
    title: 'Two Proclamations and a Staple',
    speaker: 'Rowan, Oren and night porter Teodor Maas',
    kind: 'memory',
    opening:
      'A brass office stapler sits on Oren’s counter, fat as a toad, sealing every document it binds with a blob of green mermaid wax. Someone has stapled a sea-court shipping order over a Briar eviction notice, and caught between the two sheets is a name: Teodor Maas, the depot’s night porter, who stands nearby feeling oddly thin. Every hour the staple holds, Teodor remembers a little less of where he lives. Oren needs both documents intact to keep his two inventories honest. Rowan turns the papers over in the lamplight, and the wax creaks, too brittle to survive much handling.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, examines two documents pinned together by a fat brass stapler’s staple and a blob of green mermaid wax, while a pale, faintly translucent night porter waits and masked Oren watches over his ledgers',
    choices: [
      {
        id: 'compare-the-originals',
        label:
          'Lift the wax carefully and compare the original sea and Briar agreements',
        outcome:
          'Rowan works the wax loose with Oren’s smallest blade and reads both sheets side by side. The eviction was forged from the shipping order’s language, a sea clause pasted onto a forest house. It is proof Teodor can take to the wolf court. But the staple stays in for the whole careful hour, and Teodor forgets his own street and has to be walked home.',
        flag: 'staple-originals-compared',
        effects: { evidence: 2, supplies: -1 },
        artSubject:
          'Rowan lays two waxed documents side by side under a lamp, tracing matching clauses with a fingertip as Teodor Maas stares blankly at the door',
      },
      {
        id: 'pry-teodor-free',
        label:
          'Pry the staple out at once and free Teodor’s name, whatever happens to the papers',
        outcome:
          'The staple comes out with a crack and Teodor’s name springs back into him; he remembers his street, his cat and his mother’s birthday all at once. The wax shatters across both documents. Oren silently files two ruined papers, and Teodor now has nothing written to show the eviction was ever false.',
        flag: 'staple-teodor-freed',
        effects: { trust: 2, evidence: -1 },
        artSubject:
          'Teodor Maas gasps back into full colour as Rowan pulls a bent staple free and green wax fragments scatter across the depot counter',
      },
    ],
  },
  '5,4': {
    title: 'Bea’s Lunchbox in Lost Property',
    speaker: 'Rowan, Pip and a refugee girl named Bea',
    kind: 'challenge',
    opening:
      'In the lost property cage at the back of Oren’s depot, a girl of seven named Bea has wedged herself in beside a dented tin lunchbox and refuses to come out. The lunchbox is hers, painted with a fox, and the family she travels with packed her lunch in it every day of the walk. Now it is full of someone else’s grown-up memories: a wedding dance, a mortgage, a funeral in the House’s chapel. Pip opens the lid an inch and a waltz leaks out. Bea slams it shut. “It’s mine,” she says, which is true, and so are the memories.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, crouches outside a wire lost-property cage where a small girl clutches a dented fox-painted lunchbox, Pip the goblin courier wincing as faint golden music curls from its lid',
    choices: [
      {
        id: 'keep-bea-story-whole',
        label:
          'Promise Bea the lunchbox stays hers and help her carry the memories safely',
        outcome:
          'Rowan and Bea tie the lid with ribbon so nothing leaks, and Bea decides she will hold the memories until their owner asks for them nicely. She keeps her lunchbox and her walk. It is a heavy box for a small girl, and the waltz plays faintly whenever she is frightened, which is often, so Pip ends up carrying her lunch instead.',
        flag: 'lunchbox-bea-keeps-story',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Bea ties a red ribbon around her fox lunchbox with solemn care while Rowan holds the knot and Pip balances her sandwiches on his satchel',
      },
      {
        id: 'post-a-quiet-notice',
        label:
          'Have Oren post a notice naming one private detail only the owner would know',
        outcome:
          'Oren writes a card that says only: found, a waltz played at a wedding in the rain. Bea agrees, if she can stand guard. By evening a stooped woman named Win Applegarth, who once lived in the House, reads the notice and goes pale. The owner is found without being exposed, but the whole depot has watched her face crumple, and Bea will not look at Rowan.',
        flag: 'lunchbox-quiet-notice',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'An elderly woman in a worn coat reads a small card pinned to a depot noticeboard, one hand at her mouth, as Bea guards her lunchbox nearby',
      },
    ],
  },
  '6,4': {
    title: 'The Crate of Borrowed Mornings',
    speaker: 'Rowan, Oren and platform merchant Quillon',
    kind: 'treasure',
    opening:
      'A trader in a station-master’s coat wheels a handcart of directions into Oren’s depot: rolled paper routes to every place the collision has hidden. Quillon prices them in minutes of childhood. Not his own; he keeps a jar of them, bright and wriggling, harvested from a stranger who sleeps somewhere down the line. He offers a whole crate of routes for one jar of mornings. Oren’s two inventories cannot agree whether stolen minutes count as stock. Rowan holds the jar up to the light and sees, inside, a small child learning to whistle.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, holds a glass jar of tiny glowing memories up to the depot lamp while a smiling trader in a station-master’s coat gestures at a handcart heaped with rolled paper routes and hooded Oren frowns over two ledgers',
    choices: [
      {
        id: 'refuse-stolen-minutes',
        label:
          'Refuse the stolen time and seal the jar so it can be returned to its sleeper',
        outcome:
          'Rowan refuses on the depot’s behalf, and Oren seals the jar with tape and his own mark so Quillon cannot spend it elsewhere. Quillon leaves offended, taking every route with him. The party has no shortcut through the Briar now, but somewhere down the line a stranger may wake up knowing how to whistle.',
        flag: 'borrowed-mornings-refused',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Hooded Oren wraps a glowing jar in tape and presses his seal onto it as Quillon wheels his handcart huffily out of the depot',
      },
      {
        id: 'barter-an-audit',
        label:
          'Offer Quillon an honest audit of his books in exchange, and keep a record',
        outcome:
          'Rowan offers the only thing a numbers person has: a full audit of Quillon’s accounts. Quillon, curious, agrees. It takes all night and reveals which of his routes were bought with stolen time. Oren records every trade. The party leaves with three clean routes, and Quillon leaves knowing exactly which customers he has cheated, which does not make him any kinder.',
        flag: 'borrowed-mornings-audited',
        effects: { supplies: 1, evidence: 1, danger: 1 },
        artSubject:
          'Rowan works through a tall stack of merchant ledgers by candlelight while Quillon peers over his shoulder and Oren copies figures into his own book',
      },
    ],
  },
  '1,5': {
    title: 'Old Hackle Takes the Stand',
    speaker: 'Rowan, Old Hackle and clerk Dorrit Pell',
    kind: 'memory',
    opening:
      'A courtroom has grown out of the brambles, its benches thorned, its witness box a hollow stump. The Briar wolf Old Hackle has been subpoenaed, and he sits in the box with his ears flat while clerk Dorrit Pell reads the charge: thirty winters ago he carried a child off in his jaws. Hackle says it is true. Ninepence, the clockwork wolf, has slipped in by the back door and points its brass nose at Hackle, ticking fast; it smells an apology. In the public gallery a grown woman named Hanna Brisk is trembling. She was the child.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands at a bramble-grown courtroom bar facing a grizzled grey wolf in a hollow-stump witness box, a bespectacled clerk reading from a scroll, a brass clockwork wolf by the door and a trembling woman in the gallery',
    choices: [
      {
        id: 'hear-hackle-out',
        label:
          'Ask the court to let Hackle finish his testimony before anyone moves',
        outcome:
          'Hackle tells the rest. There was a fire in the woodcutter’s cottage, and there was no time to ask permission; he carried the child out by her collar and left her at the road, and he has never apologised for the scar his teeth made. Hanna listens without forgiving him. The truth goes into Dorrit’s record, and the room stays tense and raw.',
        flag: 'hackle-testimony-heard',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'Old Hackle speaks with lowered head in the stump witness box as Dorrit Pell writes swiftly and Hanna Brisk grips the gallery rail, Rowan listening at the bar',
      },
      {
        id: 'shield-hanna-from-gallery',
        label:
          'Sit with Hanna and keep the crowd and the clockwork wolf away from her',
        outcome:
          'Rowan moves to Hanna’s side while Pip turns Ninepence gently toward the door. Hanna says she remembers teeth and smoke and nothing else, and she does not want to remember more today. Hackle’s testimony is adjourned unfinished. The court thinks less of him for it, and Hanna leaves before she can hear why he did it.',
        flag: 'hackle-hanna-shielded',
        effects: { trust: 2, evidence: -1 },
        artSubject:
          'Rowan sits beside Hanna Brisk on a thorned gallery bench, shielding her from staring onlookers while Pip steers the clockwork wolf out through the courtroom door',
      },
    ],
  },
  '2,5': {
    title: 'The Subpoena Delivered by Tide',
    speaker: 'Rowan, clerk Dorrit Pell and a witness on the line',
    kind: 'challenge',
    opening:
      'Dorrit Pell’s subpoenas are supposed to travel by bramble, but the collision has turned her post tray into a tide pool, and every summons now arrives as a damp train ticket. The one she most needs has come back unserved. The only other witness to Old Hackle’s fire is a passenger named Elsie Vane, ticketed thirty years ago to Fathom Halt, and the ticket says she is still on board. Rowan holds it to the courtroom lamp; the ink runs, faintly, into a timetable. Without Elsie, the court will judge Hackle on his own monstrous words.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, holds a dripping train ticket up to a brass courtroom lamp as its ink bleeds into a faint timetable, clerk Dorrit Pell leaning over a tide pool brimming with soggy summonses',
    choices: [
      {
        id: 'ask-elsie-route',
        label: 'Call Elsie through the ticket and ask her how to reach her',
        outcome:
          'Rowan speaks into the damp ticket like a telephone, and an old woman’s voice answers from very far underwater. Elsie gives her route stop by stop and agrees to testify if someone fetches her. The route goes into Dorrit’s file. The fetching becomes the party’s problem, and Elsie warns that the wolves on her line do not like passengers leaving.',
        flag: 'tide-subpoena-route-asked',
        effects: { evidence: 1, danger: 2 },
        artSubject:
          'Rowan presses the wet ticket to his ear like a telephone receiver while Dorrit Pell scribbles a list of stations and seawater drips onto the court floor',
      },
      {
        id: 'reissue-the-summons',
        label:
          'Send the ticket back to the morning it was issued, before Elsie ever boarded',
        outcome:
          'Dorrit stamps the ticket with its issue date, and it dries into an ordinary summons served on a young Elsie, decades ago, who answered it then. Her old deposition appears in the court file, dusty and complete. Hackle has his witness. But Elsie’s whole journey has been erased, and with it whatever she found along the way.',
        flag: 'tide-subpoena-reissued',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'Dorrit Pell brings down a court stamp on a drying ticket as a dusty yellowed deposition materialises in an open file beside Rowan’s hand',
      },
    ],
  },
  '3,5': {
    title: 'The Evidence Locker Only Moths Can Read',
    speaker: 'Rowan, Vesper and clerk Dorrit Pell',
    kind: 'treasure',
    opening:
      'Behind the bramble court stands an evidence locker, and Dorrit Pell has lost its key. An office desk lamp on the shelf above throws a road of pale light across the lock that only Vesper’s wings can see. Vesper, reluctant, reads it: the locker opens to anyone who walks the light honestly. Inside, Rowan glimpses folded maps on onionskin, the kind refugees once trusted to children, and one bears a buyer’s mark in red wax. Dorrit says the court needs to know who paid for these. Vesper says the families drawn on them need to stay unfound.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands before a thorn-wrapped evidence locker lit by an office desk lamp, Vesper tracing a pale moth-road across the lock while clerk Dorrit Pell holds a ledger and onionskin maps glimmer inside',
    choices: [
      {
        id: 'walk-vesper-path',
        label:
          'Walk the lamp-road where Vesper leads and take only what the families allowed',
        outcome:
          'Vesper guides Rowan step by step, choosing what to lift: a stock of supplies the families left in trust for travellers, and nothing with an address on it. Dorrit is unhappy but signs the release. The maps stay locked. Whoever paid for them remains unnamed, and the court’s case against the buyer stalls.',
        flag: 'evidence-locker-vesper-path',
        effects: { supplies: 2, evidence: -1 },
        artSubject:
          'Vesper hands Rowan a bundle of travel rations from the locker’s top shelf while the folded maps stay untouched in shadow below',
      },
      {
        id: 'trace-red-wax-buyer',
        label: 'Lift only the red wax seal and trace who paid for the map',
        outcome:
          'Rowan lifts the wax seal and the receipt beneath it, leaving the map folded. Dorrit traces the mark to the Blackcap Land Office, which bought refugee routes and sold them to wolf patrols. It is the strongest evidence the court has seen. Vesper turns away from the locker and will not speak to Rowan for the rest of the hearing.',
        flag: 'evidence-locker-buyer-traced',
        effects: { evidence: 2, trust: -2 },
        artSubject:
          'Rowan holds a red wax seal stamped with a black-capped bird beneath the desk lamp as Dorrit Pell copies it and Vesper turns away into the dark',
      },
    ],
  },
  '4,5': {
    title: 'The Stapler That Bit the Bailiff',
    speaker: 'Rowan, Pip and bailiff Fergus Oake',
    kind: 'monster',
    opening:
      'The court’s brass stapler has grown to the size of a mastiff and gone feral, clacking along the bramble aisles and sealing anyone it catches into a proclamation with a gob of mermaid wax. It has already caught the bailiff, Fergus Oake, who is pinned between two decrees and slowly flattening into a line of ink. One decree is a sea-court order of passage; the other is a Briar curfew. Pip has a chair raised like a lion tamer. Rowan notices the stapler only bites papers that disagree with each other.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, edges along a bramble courtroom aisle toward a mastiff-sized brass stapler snapping green wax, a bailiff half-flattened between two decrees and Pip the goblin courier brandishing a chair',
    choices: [
      {
        id: 'read-both-decrees',
        label:
          'Read both decrees aloud to find which agreement the stapler is enforcing',
        outcome:
          'Rowan reads fast while Pip fends off the stapler with the chair. The curfew was signed after the order of passage expired, so the beast is enforcing a treaty nobody alive agreed to. Once Rowan says so aloud, it settles like a dog told it is off duty. Fergus is freed slowly, and Pip’s hand is bitten and sealed in wax.',
        flag: 'stapler-decrees-read',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'Rowan reads two decrees aloud as the giant stapler sinks down quietly, Pip nursing a wax-sealed hand and Fergus Oake peeling free of the paper',
      },
      {
        id: 'wrench-fergus-out',
        label: 'Wrench Fergus out of the decrees before he flattens completely',
        outcome:
          'Rowan and Pip haul Fergus free by the boots, and the stapler snaps shut on empty air. Fergus is whole, shaking and grateful. The two decrees tear apart, wax splattering everywhere, and the stapler is still loose in the court, angrier now and hunting for paper to bite.',
        flag: 'stapler-fergus-wrenched',
        effects: { trust: 2, danger: 2 },
        artSubject:
          'Rowan and Pip tumble backwards hauling a gasping bailiff out by his boots as the brass stapler snaps shut on torn decrees',
      },
    ],
  },
  '5,5': {
    title: 'Exhibit Nine Is a Lunchbox',
    speaker: 'Rowan, clerk Dorrit Pell and a boy named Ossie',
    kind: 'challenge',
    opening:
      'The court has seized a tartan lunchbox as Exhibit Nine. It belongs to Ossie, a boy of eight from the refugee path, but it is full of a grown woman’s memories, and one of them is the fire Old Hackle is on trial for. Dorrit Pell wants to open it in open court. Ossie stands at the bar with his fists clenched: his mother packed that lunchbox the last morning she was well, and he will not have strangers pawing through it. Rowan can hear, faintly through the tin, a woman remembering smoke.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, kneels beside a fierce small boy with clenched fists at a bramble courtroom bar, a tartan lunchbox tagged Exhibit Nine on the clerk’s table and wisps of grey smoke seeping from its lid',
    choices: [
      {
        id: 'protect-ossies-box',
        label:
          'Argue the lunchbox is Ossie’s story first and get it returned to him sealed',
        outcome:
          'Rowan argues it like a privacy case, and Dorrit grudgingly agrees that the tin is the boy’s, whatever is inside it. Ossie walks out clutching it. The memory of the fire leaves the courtroom with him, and Hackle’s case loses a witness who might have cleared him.',
        flag: 'exhibit-nine-returned',
        effects: { trust: 2, evidence: -1 },
        artSubject:
          'Ossie walks out of the bramble courtroom hugging his tartan lunchbox as Rowan holds the thorned door open and Dorrit Pell closes an empty file',
      },
      {
        id: 'find-the-memory-owner',
        label:
          'Ask the court to find the memory’s owner quietly instead of opening the tin',
        outcome:
          'Dorrit sends one discreet question through the courthouse: who here remembers carrying water to a burning cottage? An old woman who once lived in the House raises her hand, lowers it, then raises it again. She will testify, privately. Ossie keeps his lunchbox closed, but the search delays everything a day, and Hackle spends that day in a cage.',
        flag: 'exhibit-nine-owner-sought',
        effects: { evidence: 1, trust: 1, danger: 1 },
        artSubject:
          'An elderly woman slowly raises a trembling hand in a crowded courthouse corridor as Rowan and Dorrit Pell watch and Ossie holds his lunchbox shut',
      },
    ],
  },
  '6,5': {
    title: 'Quillon’s Stall on the Courthouse Steps',
    speaker: 'Rowan, Old Hackle and platform merchant Quillon',
    kind: 'merchant',
    opening:
      'Quillon has set up his handcart of directions on the courthouse steps, selling the way out of the bramble court to anyone in a hurry, priced in minutes of a stranger’s childhood. Old Hackle, out on a short recess, wants one badly: a road home to his den before the verdict. Wolves do not keep minutes, so he cannot pay. Quillon offers to take the minutes from the stranger in his jar instead and put them on Hackle’s account. Clerk Dorrit Pell watches from the doorway, notebook ready. Rowan sees the old wolf’s tail tremble.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands on thorny courthouse steps between a grizzled grey wolf and a trader in a station-master’s coat offering a glowing jar from a handcart of rolled routes, a clerk watching from the doorway',
    choices: [
      {
        id: 'refuse-and-walk-hackle-home',
        label: 'Refuse the stolen minutes and walk Hackle home the long way',
        outcome:
          'Rowan refuses the trade, and Quillon shrugs and sells to the next customer. The long way to Hackle’s den takes the whole recess, through brambles that snag Rowan’s cardigan to threads. Hackle says almost nothing, but at the den mouth he shows Rowan the old scorch marks still in his fur. They are late back to court, and Dorrit notes it.',
        flag: 'quillon-steps-refused',
        effects: { trust: 1, evidence: 1, supplies: -1 },
        artSubject:
          'Old Hackle shows Rowan the faded scorch marks in his grey fur at the mouth of a bramble den, Rowan’s cardigan snagged and fraying',
      },
      {
        id: 'barter-a-courier-run',
        label:
          'Offer Quillon a real service in trade and have Dorrit record the bargain',
        outcome:
          'Pip offers a courier run to the far end of the line; Quillon accepts, and Dorrit writes the bargain into the court’s record in full. Hackle gets his route home. Pip now owes Quillon a delivery on top of the Red Oven debt he never mentions, and because it is on record, everyone in the court knows it.',
        flag: 'quillon-steps-courier-bartered',
        effects: { evidence: 1, supplies: 1, danger: 1 },
        artSubject:
          'Pip shakes hands with the station-coated merchant on the courthouse steps while Dorrit Pell writes the terms and Old Hackle clutches a rolled paper route',
      },
    ],
  },
  '8,5': {
    title: 'The Copier in the Clerk’s Office',
    speaker: 'Rowan, Pip and clerk Dorrit Pell',
    kind: 'companion',
    opening:
      'Dorrit Pell’s back office has a photocopier, and beneath the photocopier, where the brambles part, an old dungeon stair goes down into the dark. Dorrit has been copying court records on it for weeks without knowing. Every copy sent a little of the original down the stair. Now the deed to a refugee family’s plot has faded to nothing on her desk, and the original lies somewhere below. Pip, who has been courting Dorrit’s good opinion all day, volunteers to go down at once. Rowan notices the stair has no handrail, no light and no visible bottom.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, peers into a lightless stone stair opening beneath a beige office photocopier in a bramble-walled clerk’s office, Pip the goblin courier eagerly tightening his satchel straps while Dorrit Pell holds a blank faded deed',
    choices: [
      {
        id: 'descend-with-pip-for-deed',
        label: 'Go down the stair with Pip to retrieve the family’s deed',
        outcome:
          'Rowan and Pip climb down together, Pip counting steps in his courier’s rhythm. At the bottom the deed waits in a nest of faded copies, whole and legible, and the family’s claim is saved. The climb back is long and the stair shifts twice; Pip twists an ankle, and Dorrit has to haul them both out by the photocopier’s power cord.',
        flag: 'clerk-copier-deed-retrieved',
        effects: { trust: 2, danger: 1, supplies: -1 },
        artSubject:
          'Dorrit Pell braces against the photocopier hauling on its power cord as Rowan and a limping Pip climb out of the stair clutching a crisp deed',
      },
      {
        id: 'mark-the-clerk-exit',
        label:
          'Tie a line to the copier and mark the exit before Pip takes a single step',
        outcome:
          'Rowan ties the court’s red tape to the copier leg and chalks every third step, and only then lets Pip descend. Pip returns with the deed, slightly torn, cross at the delay but safe. While they worked, the wolf patrol heard about the stair, and Dorrit now has to explain why her office has a hole in it.',
        flag: 'clerk-copier-exit-marked',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'Rowan knots a length of red tape around a photocopier leg and chalks the stone steps as Pip waits impatiently on the top stair with a lantern',
      },
    ],
  },
  '1,6': {
    title: 'The Patrol in the Oldest Carriage',
    speaker: 'Rowan, Win Applegarth and the clockwork wolf Ninepence',
    kind: 'monster',
    opening:
      'Every door in the House That Remembers now opens onto the same railway carriage, in a different decade each time. Win Applegarth, who grew up in the House and left it sixty years ago, leads Rowan through the gaslit version, the linoleum version, the version with ashtrays. In the oldest one, a little girl in a pinafore is crying in a corner seat, and a pack of brass patrol wolves is closing in with Ninepence at its head. The patrol card names the girl a runaway. Win grips Rowan’s sleeve. The girl is Win, aged nine, on the night she fled the House.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands in the aisle of a gaslit antique railway carriage as a pack of brass clockwork wolves advances on a crying girl in a pinafore, an elderly woman gripping his sleeve',
    choices: [
      {
        id: 'let-ninepence-testify',
        label:
          'Hold the patrol back by asking Ninepence what it smells on the girl',
        outcome:
          'Ninepence points, ticking. It smells an apology owed to the girl, not by her. Win remembers it as Rowan says it aloud: the housekeeper who locked her in the coal cellar and never said sorry. The confused patrol sits down. Young Win slips back into her own decade unharmed, and old Win now carries the whole memory of the cellar she spent sixty years forgetting.',
        flag: 'carriage-patrol-testimony',
        effects: { evidence: 1, trust: 1, danger: -1 },
        artSubject:
          'Brass patrol wolves sit obediently in a gaslit carriage aisle as the pinafored girl slips through a door and old Win Applegarth covers her face beside Rowan',
      },
      {
        id: 'guard-young-win',
        label:
          'Stand between the brass pack and the crying girl and hold the carriage door',
        outcome:
          'Rowan braces the door with a carriage seat while Pip jams a brass jaw with a hatpin. The girl escapes into her own decade, as she always did. The pack is furious and will know Rowan’s scent in every carriage from now on. Win thanks him, then admits she never learned why the wolves were after her that night.',
        flag: 'carriage-young-win-guarded',
        effects: { trust: 2, danger: 2 },
        artSubject:
          'Rowan braces a carriage door shut with an upholstered seat as Pip wedges a hatpin into a snapping brass jaw and a small girl runs into gaslight',
      },
    ],
  },
  '2,6': {
    title: 'The Carriage That Floods in Every Other Decade',
    speaker: 'Rowan, Win Applegarth and her brother Alfie',
    kind: 'challenge',
    opening:
      'In every other decade, the House’s railway carriage lies at the bottom of the sea, and in this one the water is seeping up through the floorboards around Rowan’s shoes. A wet ticket floats up with it: one return to Fathom Halt, issued to Alfred Applegarth, Win’s younger brother. Alfie is eighty now and lives in a dry decade two doors down, and he has never told anyone what he saw the night the carriage sank. A drowned railway guard bobs up behind the ticket and says, politely, that the water will stop rising when its passenger explains the route, or when the ticket goes back to the day it was issued.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands ankle-deep in seawater rising through the floorboards of a vintage railway carriage, holding a floating wet ticket as a pale drowned railway guard in a peaked cap bobs up politely beside him',
    choices: [
      {
        id: 'ask-alfie-for-route',
        label:
          'Fetch Alfie and ask him, gently, for the route he has never told',
        outcome:
          'Alfie comes, leaning on Win, and tells it: the carriage did not sink, it went somewhere, and he walked home along the seabed holding his breath for an impossible mile. The water stops at Rowan’s ankles. Win learns her brother kept this from her for seventy years, and the two old people stand in the wet carriage not speaking.',
        flag: 'flooding-carriage-alfie-route',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'An elderly man leaning on his sister speaks quietly in a half-flooded carriage while Rowan listens and the drowned guard removes his cap',
      },
      {
        id: 'reissue-alfies-ticket',
        label:
          'Send the ticket back to the day it was issued and drain the carriage',
        outcome:
          'The guard clips the ticket back to its issue day, and the carriage drains with a long sigh. Alfie’s secret stays his. Win is relieved and does not know why. The supplies Pip had stacked on the floor are soaked through, and the route to Fathom Halt sinks back out of reach in every decade.',
        flag: 'flooding-carriage-ticket-reissued',
        effects: { trust: 1, supplies: -2 },
        artSubject:
          'Seawater drains in a swirling spiral through carriage floorboards as the drowned guard clips a ticket and Pip lifts a sodden sack of supplies',
      },
    ],
  },
  '3,6': {
    title: 'The Moth-Lit Stair Beneath the House',
    speaker: 'Rowan, Vesper and Win Applegarth',
    kind: 'dungeon',
    opening:
      'Win Applegarth leads Rowan into the House’s old butler’s corridor, where an office desk lamp has been screwed into the wall like a gas bracket. Its light shows Rowan nothing, but Vesper stops dead: a moth-road runs down through the floorboards into a stair nobody else can see. Below, Win says, lies the Remembering Vault, where the House keeps whatever its residents could not carry when they left. Since the collision it has been taking memories from anyone who sleeps under its roof, refugees included. Pinned beside the lamp is a receipt for the hidden route, sealed in red wax. Somebody paid to go down there first.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands in a dim panelled mansion corridor beside an office desk lamp bolted to the wall, while Vesper kneels at a faint glowing moth-road sinking through the floorboards into a hidden stair and elderly Win Applegarth points at a red-waxed receipt',
    choices: [
      {
        id: 'descend-by-vesper-road',
        label:
          'Let Vesper guide the descent along the moth-road, on Vesper’s terms',
        outcome:
          'Vesper agrees to lead but sets the rules: no maps drawn, no names read aloud, and a turn back the moment Vesper says so. Rowan accepts every condition. The way in is quiet and quick, the moth-road skirting the House’s waking rooms, but the party enters knowing only what Vesper chose to share about the vault ahead.',
        flag: 'remembering-vault-vesper-road',
        effects: { trust: 2, evidence: -1 },
        artSubject:
          'Vesper leads Rowan and Win down a narrow hidden stair lit only by a pale moth-road, Vesper’s raised hand signalling the party to keep silent',
      },
      {
        id: 'read-the-red-wax-receipt',
        label:
          'Study the red-wax receipt first to learn who paid to open this route',
        outcome:
          'Rowan unpins the receipt and reads it with Win under the lamp. It was paid by the Blackcap Land Office, which means someone went down before them with an agenda, and the vault may be guarded or already emptied. The knowledge is worth having. The delay lets the House notice them, and doors begin quietly locking along the corridor.',
        flag: 'remembering-vault-receipt-read',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'Rowan and Win Applegarth study a red-waxed receipt beneath the wall lamp as corridor doors behind them swing shut one after another',
      },
    ],
  },
  '4,6': {
    title: 'The Lease Stapled Through Six Decades',
    speaker: 'Rowan, Win Applegarth and Oren',
    kind: 'puzzle',
    opening:
      'The lease of the House That Remembers has been stapled to itself six times, once in each decade the carriage passes through, and every copy is sealed with mermaid wax from the brass stapler on the mantel. In five copies, the Applegarth family are tenants. In the sixth, a sea-court clause names them trespassers and their rooms forfeit. Caught under the deepest staple is a name the wax has half swallowed: Win’s mother, Dora. Win can no longer picture her mother’s face. Oren has laid all six sheets on the carriage table in date order and waits for Rowan to see the pattern.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, bends over six stapled lease documents laid in a row on a railway carriage table, each sealed with green mermaid wax, while hooded masked Oren stands beside them and Win Applegarth touches the deepest staple',
    choices: [
      {
        id: 'compare-six-leases',
        label: 'Compare all six leases to find which clause was slipped in',
        outcome:
          'Rowan counts staple holes and finds that the sixth lease has one more than the others: it was opened and restapled after it was signed. The sea clause is forged, and Oren files the proof neatly. But reading the forged lease aloud holds the staple another hour, and Win loses her mother’s voice as well as her face, at least for now.',
        flag: 'six-leases-compared',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'Rowan holds the sixth lease up to the carriage window light, counting tiny staple holes as Oren files papers and Win stares blankly ahead',
      },
      {
        id: 'free-dora-name',
        label: 'Pull the deepest staple and free Dora Applegarth’s name first',
        outcome:
          'Oren draws the staple with axe-steady fingers, and Dora’s name lifts out of the wax. Win gasps, remembering her mother’s face, her laugh and her terrible soup all at once. The six leases scatter into their decades without a seal, and now nobody can prove whether the Applegarths were tenants or trespassers.',
        flag: 'six-leases-dora-freed',
        effects: { trust: 2, evidence: -1, danger: 1 },
        artSubject:
          'Oren pulls a staple with gloved precision as Win Applegarth laughs through tears and six loose leases flutter apart across the carriage table',
      },
    ],
  },
  '5,6': {
    title: 'Win Applegarth Asks for Her Lunches Back',
    speaker: 'Rowan, Pip and Win Applegarth',
    kind: 'companion',
    opening:
      'Win Applegarth has worked out what the House did with her. When it began taking memories, it packed hers like school lunches and handed them out to the refugee children sheltering on its stair: a wedding in one tin, a mortgage in another, a funeral in a third. In the old nursery she has found the children’s lunchbox rack, and one box, painted with a hare, is humming with her honeymoon. It belongs to a solemn little boy named Kit, who sleeps with it under his pillow because the memories inside are happy. Win wants to come with the party and collect her life.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands in a dusty mansion nursery beside a rack of children’s painted lunchboxes, elderly Win Applegarth reaching toward a humming hare-painted tin held tight by a solemn small boy while Pip watches',
    choices: [
      {
        id: 'kit-keeps-the-hare-box',
        label: 'Ask Kit what the box means to him before Win asks for anything',
        outcome:
          'Kit says the honeymoon is the only happy thing he has heard since the walk began. Win listens and decides she can wait. She joins the party anyway, telling Kit the story properly so he can keep it as a story rather than a stolen memory. It slows everyone down: Win is tired and stiff, and the party has one more person to feed.',
        flag: 'win-joins-kit-keeps',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Win Applegarth sits on a nursery bed telling a story to Kit, who hugs his hare lunchbox, while Rowan and Pip pack for the road',
      },
      {
        id: 'swap-tins-quietly',
        label:
          'Help Win claim her memories quietly, tin by tin, without naming the children',
        outcome:
          'Pip invents a lunch-swap game so each child can trade a tin for a fresh one without being singled out. Win recovers four memories, including the honeymoon, and comes along with the party, lighter and sharper. Kit plays the game as well as anyone, but that night he cries for the happy thing he lost and cannot say why.',
        flag: 'win-joins-tins-swapped',
        effects: { evidence: 1, supplies: 1, trust: -1 },
        artSubject:
          'Pip runs a merry lunch-swap game on the nursery floor as children trade painted tins and Win Applegarth quietly gathers four humming boxes',
      },
    ],
  },
  '6,6': {
    title: 'Quillon in the Dining Car of Every Decade',
    speaker: 'Rowan, Win Applegarth and platform merchant Quillon',
    kind: 'memory',
    opening:
      'In the dining car of the House’s railway carriage, Quillon has laid out his directions on a white tablecloth, and the price card reads: one route home, thirty minutes of a stranger’s childhood. The stranger, Rowan realises, is Win. Her jar sits on the counter, labelled with the House’s address and full of a girl learning to swim in the river below the orchard. Quillon bought it from the House itself, fair and square, he says. Win would like her afternoon back. Two refugee families at the next table would like the route home, and they have nothing else to pay with.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands in a vintage dining car where a trader in a station-master’s coat displays rolled routes on a white tablecloth beside a glowing jar of a girl swimming, Win Applegarth reaching for it and two weary families watching',
    choices: [
      {
        id: 'refuse-wins-stolen-afternoon',
        label: 'Refuse the stolen time and hand Win’s jar back to her',
        outcome:
          'Rowan lifts the jar off the counter and gives it to Win, and Quillon, outraged, packs his tablecloth and every route on it. Win uncorks the jar and remembers cold river water on her ankles. The two families watch the merchant leave with their way home. Rowan promises to find them another route and has no idea yet how.',
        flag: 'dining-car-afternoon-returned',
        effects: { trust: 1, danger: 1, supplies: -1 },
        artSubject:
          'Win Applegarth uncorks a glowing jar as river light spills over her face, Quillon stalking out of the dining car with his tablecloth bundled',
      },
      {
        id: 'barter-family-routes',
        label:
          'Trade Quillon a real service for the families’ route and record every term',
        outcome:
          'Rowan offers to recount Quillon’s entire stock in exchange for the route, and Win, sharp-eyed, writes the bargain down. The families get their way home and a written copy of the terms. Quillon keeps Win’s jar, since that was not the trade, and promises in writing to sell it to nobody else. Win is not satisfied by a promise.',
        flag: 'dining-car-routes-bartered',
        effects: { evidence: 1, trust: 1, supplies: -1, danger: 1 },
        artSubject:
          'Rowan counts rolled routes along a dining-car table as Win writes terms on a napkin and two families clutch a single paper route home',
      },
    ],
  },
  '8,6': {
    title: 'The Pantry Copier and the Silver Spoons',
    speaker: 'Rowan, Pip and Win Applegarth',
    kind: 'treasure',
    opening:
      'In the House’s butler’s pantry, between the silver cupboard and the dumbwaiter, sits a humming office photocopier, and beneath it the floor has fallen away into an old dungeon stair. Win says the silver used to be counted every night, and the House is still counting: a copy of the inventory spits out every minute, each listing fewer spoons. At the bottom of the stair the House has stored something it owes back, a set of spoons engraved with a refugee family’s name, taken as a deposit when they sheltered here. The family’s father waits by the dumbwaiter. Pip has already tied a lantern to a rope.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, kneels at the edge of a stair opening beneath a humming photocopier in a cluttered butler’s pantry, inventory pages spilling from the machine while Pip lowers a lantern on a rope and Win Applegarth watches',
    choices: [
      {
        id: 'descend-for-the-spoons',
        label:
          'Descend now for the family’s silver before the inventory counts it away',
        outcome:
          'Rowan goes down fast, following the paper trail of inventories, and finds the engraved spoons in a drawer that opens onto the sea. The family gets back the only thing they carried out of their old home. On the way up the stair grows a new landing, and Pip loses the lantern and half the rope finding the way back.',
        flag: 'pantry-spoons-retrieved',
        effects: { trust: 2, supplies: -2 },
        artSubject:
          'A father cradles a set of engraved silver spoons in the pantry as Rowan climbs out of the dark stair and Pip coils a frayed half-rope',
      },
      {
        id: 'mark-the-pantry-exit',
        label: 'Mark the exit with inventory pages before anyone goes down',
        outcome:
          'Rowan lays the spare inventories down the stair like stepping stones, each one numbered, so the way back cannot be miscounted. By the time the route is safe, the House has counted away all but one spoon. Pip brings it up. It is the smallest, a baby’s spoon, and the family takes it and says nothing for a long while.',
        flag: 'pantry-exit-marked',
        effects: { evidence: 1, danger: -1 },
        artSubject:
          'Numbered inventory pages lie like stepping stones down a dim stair as Pip emerges holding up a single tiny engraved spoon',
      },
    ],
  },
  '1,7': {
    title: 'Ninepence Under the Moonroot',
    speaker: 'Rowan, signalwoman Moll Drury and the clockwork wolf Ninepence',
    kind: 'puzzle',
    opening:
      'The Moonroot Underpass runs beneath a tree whose roots go all the way down into an underwater palace, and its tiles drip seawater that smells faintly of court perfume. On the tunnel wall, attached to no one, stands a shadow in the shape of Char: the hair, the attitude, the defiant tilt of the chin. Ninepence has followed Rowan here and points at the shadow, ticking furiously. Its patrol card also lists a tunnel sweeper named Wim as a vandal for scrubbing at it. Signalwoman Moll Drury says the shadow has been switching the signal lamps on and off for days, as if spelling something.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands in a dripping tiled railway tunnel beneath vast tree roots, a brass clockwork wolf pointing at a free-standing girl’s shadow on the wall while a row of signal lamps flickers and a sweeper clutches his bucket',
    choices: [
      {
        id: 'read-the-lamp-signals',
        label:
          'Follow Ninepence’s nose and read the shadow’s signal lamps in order',
        outcome:
          'Rowan cracks the code: the shadow lights lamps in the order of the stations on the old sea line. It spells, very rudely, that it is owed an apology by whoever keeps deciding what happened to it. Ninepence agrees. The shadow seems pleased to be understood. Wim, ignored, is still listed as a vandal, and the patrol is coming for him.',
        flag: 'moonroot-lamps-read',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'Rowan jots letters in a notebook as signal lamps blink in sequence along the tunnel and Char’s shadow strikes a smug pose on the tiles',
      },
      {
        id: 'defend-wim-the-sweeper',
        label:
          'Shield Wim from the patrol and argue that scrubbing a wall is not vandalism',
        outcome:
          'Rowan stands beside Wim and his bucket while Moll rewrites the patrol card in signal chalk, and the patrol accepts it. Wim explains he was only scrubbing because the shadow kept crying on his tiles. The shadow, offended, puts out every lamp in the tunnel, and the trains run blind for an hour.',
        flag: 'moonroot-wim-defended',
        effects: { trust: 2, danger: 1, evidence: -1 },
        artSubject:
          'Rowan stands protectively beside a sweeper and his bucket as Moll Drury chalks a patrol card and every signal lamp in the tunnel goes dark',
      },
    ],
  },
  '2,7': {
    title: 'A Ticket Held in Shadow Fingers',
    speaker: 'Rowan, Pip and Char’s shadow',
    kind: 'companion',
    opening:
      'Char’s shadow has a ticket. It is pinched between dark fingers on the underpass wall, a damp single to Fathom Halt, and the shadow wants company for the trip. It has been waiting at the Moonroot platform for a train that never comes, and Pip, who has a soft spot for anyone stuck waiting on a delivery, sits down beside it. The shadow keeps sketching two different Chars in the tile grout: one in a crown, one in ripped black lace. It will not say which one it belongs to. Moll warns Rowan that shadows who leave the tunnel sometimes come back as somebody else.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands on a damp tunnel platform where Pip the goblin courier sits on a bench beside a girl’s shadow on the tiles, the shadow holding a real dripping ticket and doodling a crowned girl and a lace-clad girl in the grout',
    choices: [
      {
        id: 'ask-shadow-its-route',
        label: 'Ask the shadow which route it remembers to Fathom Halt',
        outcome:
          'The shadow sketches a route along the palace roots, with a sardonic little skull marking every dangerous current, and agrees to travel with the party as far as the next platform, mostly to criticise Rowan’s cardigan. The route is genuinely useful. Pip worries aloud that the shadow is remembering a history that may not match the real Char’s.',
        flag: 'shadow-companion-route',
        effects: { evidence: 1, trust: 1, danger: 1 },
        artSubject:
          'Char’s shadow glides along the tunnel wall beside Rowan and Pip, pointing a dark finger at a grout map dotted with tiny skulls',
      },
      {
        id: 'return-shadow-ticket',
        label:
          'Clip the ticket back to its issue day so the shadow can rejoin its owner then',
        outcome:
          'Moll clips the ticket with her signal punch, and the shadow flickers, thins and slides off the tiles toward wherever it first came loose. It waves, rudely and fondly. Pip sits alone on the bench for a while. Nobody now knows which Char the shadow would have chosen, and that may be exactly what it wanted.',
        flag: 'shadow-ticket-returned',
        effects: { trust: -1, danger: -1 },
        artSubject:
          'A girl’s shadow fades from the tunnel tiles mid-wave as Moll Drury lowers her ticket punch and Pip sits alone on the platform bench',
      },
    ],
  },
  '3,7': {
    title: 'The Lantern That Gives Shadows Wings',
    speaker: 'Rowan, Vesper and Char’s shadow',
    kind: 'memory',
    opening:
      'Halfway along the Moonroot Underpass, an office desk lamp hangs from a root on its own cable. Vesper switches it on, and the light does something strange to Char’s shadow: in the lamp-glow it grows moth wings and starts walking a road only Vesper can see. Vesper follows, uneasy, because the shadow is walking a route Vesper drew as a child, a safe-path map they once believed was private. Someone sold that map; someone paid for it. Rowan keeps close behind and watches Vesper’s face as the shadow walks a road that should exist nowhere outside Vesper’s memory.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, follows Vesper through a root-hung railway tunnel as an office desk lamp dangling from its cable gives a girl’s shadow on the tiles delicate moth wings, the shadow walking a pale glowing path',
    choices: [
      {
        id: 'follow-vesper-memory',
        label:
          'Follow where Vesper chooses to lead and let the rest of the route stay unseen',
        outcome:
          'Vesper walks the shadow’s road for three turnings, then stops and switches off the lamp. That is all Vesper is willing to share, and Rowan does not push. The short stretch reveals a dry passage around the flooded section. The rest of Vesper’s childhood map stays dark, and so does the name of whoever sold it.',
        flag: 'shadow-lamp-vesper-chose',
        effects: { trust: 2, evidence: -1 },
        artSubject:
          'Vesper switches off the hanging desk lamp with a steady hand as Rowan waits beside a dry side passage glimmering in the dark',
      },
      {
        id: 'trace-the-shadow-buyer',
        label:
          'Ask the shadow who paid for the copy of Vesper’s map it is walking',
        outcome:
          'The shadow, with gothic relish, mimes a fat purse and a seal stamped with a little capped bird: the Blackcap Land Office again, and beside it a sea-court buyer. Rowan now knows the map went to two purchasers. Vesper says nothing, then says they need to walk alone for a while, and takes the lamp with them.',
        flag: 'shadow-lamp-buyer-traced',
        effects: { evidence: 2, trust: -1, supplies: -1 },
        artSubject:
          'Char’s winged shadow mimes a heavy purse on the tunnel tiles while Rowan watches and Vesper walks away carrying the desk lamp into darkness',
      },
    ],
  },
  '4,7': {
    title: 'The Proclamation Stapled to a Shadow',
    speaker: 'Rowan, Scylla and Char’s shadow',
    kind: 'challenge',
    opening:
      'A sea-court herald has come down through the Moonroot’s palace roots carrying the brass stapler, and has stapled a proclamation straight through Char’s shadow, pinning it to the tunnel wall with green mermaid wax. The proclamation declares, under royal seal, the one official history of Princess Charybdis. The shadow is writhing. Scylla has arrived, white-faced, and insists the proclamation is wrong, though she will not say which part. A second, older paper is stapled underneath, its corner showing Char’s own signature. The herald is already loading another staple.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, confronts a sea-court herald in a tunnel beneath giant roots, a girl’s shadow pinned writhing to the tiles by a brass staple through a waxed proclamation while sturdy, white-faced Scylla clutches its corner',
    choices: [
      {
        id: 'compare-the-royal-papers',
        label:
          'Compare the royal proclamation with the older paper Char signed herself',
        outcome:
          'Rowan reads both. The older paper is a promise between the twin princesses that neither would let the court write the other’s story, and the proclamation breaks it. Scylla goes very quiet, and the herald withdraws, beaten by a younger Char’s handwriting. The shadow stays pinned while they read, and its edges are torn when it finally pulls free.',
        flag: 'shadow-proclamation-compared',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'Rowan holds a childishly signed paper beside a royal proclamation as the herald backs away and Scylla stares at the signature',
      },
      {
        id: 'free-the-pinned-shadow',
        label:
          'Pull the staple out and free Char’s shadow from the proclamation',
        outcome:
          'Rowan tears the staple loose, and the shadow slides free, flexes its fingers and makes a gesture at the herald that Scylla pretends not to see. The proclamation flutters to the floor, unread and still sealed. It will be copied in the palace and posted somewhere else. For the moment, the shadow is nobody’s official history but its own.',
        flag: 'shadow-proclamation-torn-free',
        effects: { trust: 2, evidence: -1 },
        artSubject:
          'A freed girl’s shadow makes a rude gesture at a retreating herald as Rowan holds a bent staple and a sealed proclamation drifts to the floor',
      },
    ],
  },
  '5,7': {
    title: 'The Lunchbox Drifting Through the Underpass',
    speaker: 'Rowan, signalwoman Moll Drury and a girl named Juno',
    kind: 'treasure',
    opening:
      'Seawater runs ankle-deep along the Moonroot’s tracks, and down it floats a dented green lunchbox, spinning slowly. A girl of ten named Juno splashes after it from the refugee platform, shouting that it is hers. Rowan fishes it out. It is warm, and inside, faintly, a grown woman named Win remembers burying her husband under the House’s yew. Signalwoman Moll Drury says the House has been sending memories down the tunnel for weeks. She keeps a crate of the tins she has caught, all unopened, waiting for owners who never come.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands ankle-deep in seawater along tunnel tracks holding up a dented green lunchbox, a girl in a raincoat splashing toward him and a signalwoman beside a crate of tins',
    choices: [
      {
        id: 'juno-keeps-her-box',
        label:
          'Give Juno back her lunchbox and let her decide what happens to the memory inside',
        outcome:
          'Juno takes it, hugs it and decides the sad memory should stay sealed until its owner asks. She seals the lid with signal tape herself. Moll is so moved she opens her crate to the party: some of the tins hold food, real food packed by parents on the refugee path. The rest of the stray memories stay lost.',
        flag: 'underpass-juno-keeps-box',
        effects: { supplies: 2, evidence: -1 },
        artSubject:
          'Juno wraps signal tape around her green lunchbox as Moll Drury opens a crate of tins full of bread and apples for Rowan',
      },
      {
        id: 'catalogue-moll-crate',
        label:
          'Help Moll catalogue her crate so each owner can claim a tin privately',
        outcome:
          'Rowan builds Moll a register keyed to a single private detail from each memory, never a name, so owners can claim them without proving anything aloud. It is slow, careful work that takes the whole afternoon, and Juno helps, holding her own box tight. The register may reunite dozens of people. The tunnel floods higher while they work.',
        flag: 'underpass-tin-register',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'Rowan writes a careful register on a signal-box shelf as Juno and Moll line up dented lunchboxes and seawater creeps up the tracks',
      },
    ],
  },
  '6,7': {
    title: 'The Toll-Gnawer of the Moonroot',
    speaker: 'Rowan, Pip and the Toll-Gnawer',
    kind: 'monster',
    opening:
      'Below the Moonroot platform lives a thing made of turnstile tokens: a rat-king of brass and gristle, a dozen heads tangled by their tails, every mouth chattering a price. The Toll-Gnawer sells directions through the flooded underpass and charges in minutes of a stranger’s childhood, which it chews out of anyone it can corner. Tonight it has cornered a sleeping refugee boy and is gnawing, very gently, at the afternoon he learned to ride a bicycle. It offers Pip the boy’s route out of the tunnel at a discount. Pip, appalled, looks to Rowan.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, raises a signal lantern beneath a dripping platform where a writhing rat-king of brass tokens with a dozen chattering heads hunches over a sleeping boy, Pip the goblin courier recoiling',
    choices: [
      {
        id: 'drive-the-gnawer-off',
        label:
          'Refuse every stolen minute and drive the Toll-Gnawer away from the boy',
        outcome:
          'Rowan swings the signal lantern while Pip throws a fistful of genuine tokens to distract the heads. The Toll-Gnawer scatters into the drains, screaming prices. The boy wakes with his bicycle afternoon frayed but whole. The party has no route through the flooded section now, and the creature will remember who chased it.',
        flag: 'toll-gnawer-driven-off',
        effects: { trust: 1, danger: 2 },
        artSubject:
          'The brass rat-king scatters into a storm drain as Rowan swings a lantern and Pip flings tokens, the boy blinking awake on the platform',
      },
      {
        id: 'barter-a-sewer-delivery',
        label:
          'Barter a genuine courier service for the route, and write the deal down',
        outcome:
          'Pip offers the creature a delivery it cannot make itself, a message to its sewer kin, and Rowan chalks the terms on the platform where anyone can read them. The Toll-Gnawer releases the boy unharmed and spits out a true route. It also now knows Pip’s name, and every one of its heads repeats it, delighted.',
        flag: 'toll-gnawer-courier-deal',
        effects: { evidence: 1, supplies: 1, danger: 1 },
        artSubject:
          'Rowan chalks a contract onto platform tiles as Pip shakes one small brass paw of the many-headed Toll-Gnawer and the boy sleeps safely nearby',
      },
    ],
  },
  '7,7': {
    title: 'The Three Tracks Beneath the Palace Roots',
    speaker: 'Rowan, Scylla and signalwoman Moll Drury',
    kind: 'challenge',
    opening:
      'Where the Moonroot Underpass widens, three rail lines run side by side under the dripping palace roots, and they swap places whenever anyone nearby denies a memory. Scylla has been standing at the junction for an hour insisting she does not remember a particular argument with her sister, and every time she says it, the tracks shuffle and a waiting train ends up facing the wrong way. Moll Drury needs the refugees aboard that train out before the tide turns. Char’s shadow, on the wall, folds its arms and looks pointedly at Scylla. Rowan checks his watch against the tide table.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands at a tunnel junction where three iron rails visibly slide past one another beneath dripping palace roots, sturdy Scylla arguing with a signalwoman beside a crowded train while a girl’s shadow folds its arms on the wall',
    choices: [
      {
        id: 'gather-junction-testimony',
        label:
          'Ask each person at the junction for one honest memory to lock the tracks',
        outcome:
          'Moll gives one, Pip another, and at last Scylla says, very quietly, that she does remember the argument and has been ashamed of it for a long time. The tracks lock and the train leaves on time. Scylla does not thank Rowan for making her say it in public, and Char’s shadow applauds slowly, which helps nobody.',
        flag: 'junction-honest-memory',
        effects: { evidence: 1, trust: -1, danger: -1 },
        artSubject:
          'Scylla speaks with downcast eyes at the rail junction as the three tracks lock still and a refugee train pulls away, Char’s shadow clapping on the wall',
      },
      {
        id: 'take-the-long-honest-line',
        label:
          'Route the refugee train along the honest line, the long way round the palace roots',
        outcome:
          'Rowan and Moll switch the train onto the outermost line, the one that never moves because it runs past no one. It loops beneath the whole palace, adding hours and draining the signal box’s lamp oil. The refugees arrive late, but nobody had to confess anything they were not ready to say. Scylla stays at the junction, still not remembering.',
        flag: 'junction-long-line',
        effects: { trust: 1, supplies: -2 },
        artSubject:
          'Rowan and Moll Drury haul a heavy switching lever together as a refugee train curves away along a far outer track under the palace roots',
      },
    ],
  },
  '8,7': {
    title: 'Moll Drury Sells Chalk and String',
    speaker: 'Rowan, Pip and signalwoman Moll Drury',
    kind: 'merchant',
    opening:
      'At the far end of the Moonroot Underpass, Moll Drury keeps a signal box that has become a shop. Its stock is chalk, string, lamp oil and exit markers, because behind the counter, under a jammed office photocopier, an old dungeon stair winds down toward the palace roots. A family’s memory of their drowned village is down there, sent by the House; the family owns it and wants it back. Moll will sell the party everything they need for the descent. What she asks in return is a promise that nobody goes down until the way out is marked. She has lost two sweepers to that stair.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, leans on the counter of a cramped signal-box shop stocked with chalk, string and lamp oil, a jammed beige photocopier behind it over a dark descending stair, Pip the goblin courier examining a coil of rope and Moll Drury holding out her hand',
    choices: [
      {
        id: 'buy-and-descend-at-once',
        label:
          'Buy Moll’s rope and go straight down for the family’s village memory',
        outcome:
          'Rowan pays in rations and goes down with Pip before the promise is spoken. They find the village memory curled in a root, bright as a lamp, and bring it back up. The family weeps to have their streets again. Moll takes the rations, counts them twice and refuses to sell to the party a second time.',
        flag: 'signal-box-hurried-descent',
        effects: { trust: 1, supplies: -2, danger: 1 },
        artSubject:
          'Rowan emerges from the stair cradling a glowing orb of tiny streets and rooftops as a family reaches for it and Moll Drury frowns at the counter',
      },
      {
        id: 'mark-the-exit-on-moll-terms',
        label:
          'Accept Moll’s terms and mark every step of the exit before anyone descends',
        outcome:
          'Rowan and Moll chalk the stair together, tying string at every turning, and it costs a whole lamp of oil and most of the evening. When Pip finally descends, the climb back is safe and quick, and the family has their village. Moll gives the party a discount and a list of the lost sweepers’ names, in case anyone ever finds them.',
        flag: 'signal-box-exit-marked',
        effects: { evidence: 1, trust: 1, supplies: -1 },
        artSubject:
          'Rowan and Moll Drury tie string to a newel post and chalk arrows down a dark stair while Pip waits with a lantern at the top',
      },
    ],
  },
  '1,8': {
    title: 'Ninepence Finds the Oldest Apology',
    speaker: 'Rowan, Vesper and the clockwork wolf Ninepence',
    kind: 'challenge',
    opening:
      'The old Briar gate stands at the edge of the reconstruction, and from its iron bars hang eight missing pieces of map, dripping like tickets left out in the rain. Hung back in place, they will knit the forest together, and the camp of gap-dwellers who settled in the missing places will be pushed out. Ninepence has followed Rowan all the way here and is pointing at Vesper, ticking so fast it smokes. It smells the oldest apology of all. Its patrol card, worn soft, also names a gap-dweller child as a trespasser on land that does not yet exist.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands at a towering wrought-iron Briar gate hung with eight dripping map fragments like wet tickets, a smoking brass clockwork wolf pointing at moth-winged Vesper while a small child from a patched tent camp watches',
    choices: [
      {
        id: 'let-ninepence-point',
        label:
          'Let Ninepence’s testimony stand and give Vesper room to answer it',
        outcome:
          'Vesper understands what the wolf smells before anyone says it. They turn to the gap-dwellers and apologise, plainly, for the childhood maps that were sold and used against people like them. Nobody is required to forgive, and several people do not. Ninepence’s ticking stops, and the old clockwork wolf lies down, finished. The child is still named on the patrol card.',
        flag: 'gate-ninepence-apology',
        effects: { evidence: 1, trust: 1, danger: 1 },
        artSubject:
          'Vesper stands before a crowd of wary gap-dwellers with head bowed as the clockwork wolf lies down at the gate, its smoke thinning, Rowan a step behind',
      },
      {
        id: 'shield-the-gap-child',
        label:
          'Stand between Ninepence and the gap-dweller child and rewrite the patrol card',
        outcome:
          'Rowan takes the card from the wolf’s collar and crosses out the trespass charge, writing in its place that the land is disputed and the child lives here. Ninepence accepts the correction and stops ticking at the child. It never stops pointing at Vesper, though, and Vesper walks away from the gate without asking what it smells.',
        flag: 'gate-gap-child-shielded',
        effects: { trust: 2, evidence: -1 },
        artSubject:
          'Rowan kneels to rewrite a punched patrol card on the brass wolf’s collar as the gap-dweller child hides behind his cardigan and Vesper walks off',
      },
    ],
  },
  '2,8': {
    title: 'The Wettest Ticket on the Gate',
    speaker: 'Rowan, Vesper and gap-dweller Tansy Mull',
    kind: 'treasure',
    opening:
      'Of the eight map fragments hanging from the Briar gate, one is wetter than the rest, and it is not a map at all. It is a train ticket to Fathom Halt, sodden and heavy, with a whole underwater district folded inside it. Restore it, and the sea-road under the wolf road reconnects. Tansy Mull, who leads the gap-dwellers camped in the empty space where that district belongs, says her people bought the ticket legally from a passenger who never came back for it. Vesper studies the folds and says the ticket still remembers its passenger’s route.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, cups a heavy sodden train ticket unfolding into tiny underwater streets beneath the iron Briar gate, while Vesper studies its folds and a weathered woman in a patched coat stands guard before a tent camp',
    choices: [
      {
        id: 'read-the-passenger-route',
        label:
          'Read the passenger’s route from the ticket and ask Tansy whose it really was',
        outcome:
          'Tansy admits the passenger was her grandmother, who drowned on the journey. The route Vesper reads leads to a dry district where the gap-dwellers could resettle under a claim of their own. It is real, valuable and not quite theirs. Tansy agrees to share it, and the whole camp now knows Vesper can read their family’s private journey from a scrap of paper.',
        flag: 'wet-ticket-route-read',
        effects: { evidence: 1, supplies: 1, trust: -1 },
        artSubject:
          'Vesper traces a glowing route across the unfolded ticket as Tansy Mull speaks of her grandmother and Rowan takes careful notes',
      },
      {
        id: 'restore-the-ticket-district',
        label:
          'Return the ticket to the hour it was issued and hang the district back',
        outcome:
          'Vesper presses the ticket dry against the gate, and the district unfolds back into the morning it was printed, all streets and seaweed. The sea-road reconnects. Tansy’s camp has to move by nightfall, because the space they lived in no longer exists. Rowan helps carry their tents and does not pretend it is fair.',
        flag: 'wet-ticket-district-restored',
        effects: { danger: -2, trust: -1 },
        artSubject:
          'A drowned district of streets and seaweed knits into place beyond the gate as Rowan carries a rolled tent alongside Tansy Mull’s departing camp',
      },
    ],
  },
  '3,8': {
    title: 'The Atlas Hound at the Gate',
    speaker: 'Rowan, Vesper and the Atlas Hound',
    kind: 'monster',
    opening:
      'Something has come to the Reconstruction Gate to collect. It is made of folded paper and red sealing wax in the shape of a hound, and it noses at the hanging map fragments as if choosing a meal. Its collar tag reads Blackcap Land Office. Rowan understands at once: whoever paid for the hidden maps has sent this to claim the restored geography before anyone can live in it. An office desk lamp lies tipped in the mud by the gate, still lit, and in its beam a moth-road runs from the hound straight to where the gap-dwellers are hiding. Vesper can see the road. So can the hound.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, faces a great hound folded from paper and red sealing wax sniffing at dripping map fragments on the iron gate, a tipped office desk lamp glowing in the mud and Vesper crouched over its faint moth-road',
    choices: [
      {
        id: 'follow-vesper-false-road',
        label:
          'Switch off the lamp and follow Vesper’s lead to draw the hound away from the camp',
        outcome:
          'Vesper leads the hound down a false moth-road into the briars, choosing every turn, while Rowan follows with the dark lamp under his arm. The hound shreds itself on the thorns chasing a road that goes nowhere, and the camp is safe. Vesper comes back scratched and silent, having led a hunter by the nose with exactly the skill that once betrayed people.',
        flag: 'atlas-hound-misled',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'The paper hound tears itself apart on black thorns chasing a pale false trail as Vesper and Rowan watch from the brambles, the lamp dark',
      },
      {
        id: 'read-the-hound-seals',
        label:
          'Pin the hound down and read its wax seals to trace who paid for it',
        outcome:
          'Rowan and Pip pin the hound under the gate bar, and Rowan reads its seals one by one: purchase orders for every hidden map the Blackcap Land Office ever bought, with dates and prices. It is a full ledger of the trade. The struggle tears two of the hanging fragments, and the gap-dwellers watch their own hiding road burn bright in the lamplight.',
        flag: 'atlas-hound-seals-read',
        effects: { evidence: 2, trust: -1, danger: 1 },
        artSubject:
          'Rowan reads red wax seals along the flank of a pinned paper hound while Pip holds it down and a moth-road blazes toward hidden tents',
      },
    ],
  },
  '4,8': {
    title: 'The Proclamation of Restored Borders',
    speaker: 'Rowan, Tansy Mull and a sea-court herald',
    kind: 'challenge',
    opening:
      'A sea-court herald has arrived at the Reconstruction Gate with the brass stapler and a proclamation of restored borders, which she means to fix to the gate under mermaid wax. Once sealed, it will decide which of the eight fragments belong to which reality and who lives where. Her draft is stapled over an older agreement, the original Briar compact signed by wolves, House residents and gap-dwellers alike. Caught between the two sheets is a name, and Rowan reads it with a jolt: Tansy Mull’s whole camp, listed as a single word. The herald raises the stapler.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, catches the arm of a sea-court herald raising a brass stapler against the iron Briar gate, a waxed proclamation layered over an older signed compact and Tansy Mull staring at a single crushed word between them',
    choices: [
      {
        id: 'compare-compact-and-proclamation',
        label:
          'Stop the herald long enough to compare her proclamation with the old Briar compact',
        outcome:
          'Rowan reads them side by side, aloud. The compact gave gap-dwellers a right to stay in unclaimed places; the proclamation simply leaves that out. The herald, embarrassed, agrees to reopen her draft. That means a week of hearings the party does not have, and the gate stays unsealed and unrestored the whole time.',
        flag: 'borders-compact-compared',
        effects: { evidence: 2, supplies: -1 },
        artSubject:
          'Rowan reads two documents aloud before a gathered crowd at the gate as the herald lowers her stapler and Tansy Mull nods slowly',
      },
      {
        id: 'free-the-camp-name',
        label:
          'Pull the camp’s name out from between the papers before the wax sets',
        outcome:
          'Rowan tugs, and the name comes loose and unfolds into thirty-one separate names, which Tansy reads out one by one so each is heard. The camp exists again as people rather than a word. The herald staples her proclamation anyway, without the compact beneath it, and now the borders are official and the gap-dwellers are named nowhere in them.',
        flag: 'borders-camp-name-freed',
        effects: { trust: 2, evidence: -1, danger: 1 },
        artSubject:
          'Tansy Mull reads a long unfurling ribbon of names aloud to her camp as the herald seals a proclamation onto the iron gate behind them',
      },
    ],
  },
  '5,8': {
    title: 'The Lunchbox Exchange at the Gate',
    speaker: 'Rowan, Win Applegarth and trader Mother Juniper',
    kind: 'merchant',
    opening:
      'A trader called Mother Juniper has set up at the Reconstruction Gate with a barrow of children’s lunchboxes, buying and selling the memories the House packed inside them. Her pitch is practical: a map fragment only knits back in if someone remembers living there, and a tin full of the right adult memories will do. Win Applegarth is at the barrow. So is a refugee girl named Ada, trying to sell her own swan-painted lunchbox because it holds a memory of the orchard district and Mother Juniper is paying in bread. The memory is Win’s. The lunchbox is Ada’s. The bread is real.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands at a barrow piled with painted children’s lunchboxes beneath the iron Briar gate, a shrewd trader in a shawl holding out a loaf to a thin girl clutching a swan-painted tin while elderly Win Applegarth watches',
    choices: [
      {
        id: 'buy-ada-the-bread',
        label:
          'Buy Ada the bread outright so she can keep her lunchbox and her story',
        outcome:
          'Rowan pays Mother Juniper from the party’s stores and hands Ada the loaf. Ada keeps her swan box with Win’s orchard still inside, and Win, watching, says she would rather the memory travel with a child who loves the box than be sold back to her. Without it the orchard fragment cannot be restored, so it stays hanging from the gate.',
        flag: 'lunchbox-exchange-ada-keeps',
        effects: { trust: 2, supplies: -2 },
        artSubject:
          'Ada bites into a fresh loaf while hugging her swan lunchbox as Win Applegarth smiles and an orchard fragment still drips on the gate',
      },
      {
        id: 'broker-a-quiet-trade',
        label:
          'Arrange a quiet trade so Win can claim the memory without naming Ada as its carrier',
        outcome:
          'Rowan brokers it through Mother Juniper’s barrow: Ada sells the memory for bread, Win buys it back from the trader anonymously, and neither has to tell the other. The orchard fragment knits into the gate. Mother Juniper takes a cut both ways and records nothing, and Rowan suspects she does this all day.',
        flag: 'lunchbox-exchange-quiet-trade',
        effects: { evidence: 1, supplies: -1 },
        artSubject:
          'Mother Juniper passes a tin behind her barrow to Win while Ada walks off with bread, and an orchard of blossom knits into the iron gate',
      },
    ],
  },
  '6,8': {
    title: 'Quillon’s Last Price',
    speaker: 'Rowan, Vesper and platform merchant Quillon',
    kind: 'puzzle',
    opening:
      'Quillon has arrived at the Reconstruction Gate with his handcart and his jars, and he holds the directions for hanging the last map fragments in the right order. Hang them wrong and the forest knits crooked, swallowing whoever stands in the seams. His price, as always, is minutes of a stranger’s childhood; today’s jar holds a boy learning to read under a kitchen table. The directions are a puzzle of their own: eight fragments, eight hooks, and a rule that no fragment may hang beside a place it once displaced. Vesper has started sketching in the mud, and Rowan crouches beside them with a pencil.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, crouches with Vesper over a grid of eight hooks sketched in mud beneath the iron gate and its dripping fragments, while a trader in a station-master’s coat holds up a glowing jar beside his handcart',
    choices: [
      {
        id: 'refuse-and-solve-alone',
        label:
          'Refuse the stolen time and solve the hanging order with Vesper from the fragments alone',
        outcome:
          'Rowan and Vesper work it out from the fragments’ edges and the rule, a long cold evening of trial hangings. They get seven right. The eighth goes on crooked, and a seam swallows Quillon’s handcart, which Rowan does not entirely regret. The boy’s afternoon stays in the jar, unspent but unreturned, and Quillon wheels it away.',
        flag: 'last-price-solved-alone',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'A crooked seam in the forest swallows a merchant’s handcart as Rowan and Vesper hang the last map fragments on the iron gate by lamplight',
      },
      {
        id: 'trade-an-honest-account',
        label:
          'Trade Quillon a genuine service for the directions and record it on the gate',
        outcome:
          'Rowan offers Quillon an honest account of his whole trade, written up and signed, which he could show any court that tried him. Quillon accepts, with an odd look. The fragments hang true. The bargain is chalked on the gate for everyone to read, including the line noting that Quillon has never returned a single minute he bought.',
        flag: 'last-price-service-bartered',
        effects: { supplies: 1, evidence: 1, trust: -1 },
        artSubject:
          'Rowan chalks a bargain onto the iron gate’s stone pillar as Quillon reads a signed account and eight fragments hang neatly in order',
      },
    ],
  },
  '7,8': {
    title: 'Vesper on the Honest Track',
    speaker: 'Rowan, Vesper and Tansy Mull',
    kind: 'companion',
    opening:
      'Behind the Reconstruction Gate, three rail lines run out toward the restored forest, and like every set in this collision they change places whenever someone denies a memory. Vesper wants to ride them out to check the far fragments, and Rowan wants to go too. The trouble is Vesper. Every time a gap-dweller on the platform asks whether Vesper is the moth-child who drew the old safe-path maps, Vesper says no, the tracks shuffle, and the handcar ends up facing the camp. Rowan has watched it happen four times. A fifth denial will send the handcar straight through Tansy Mull’s tents.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, steadies a wooden handcar at the start of three shifting rails behind the iron Briar gate, moth-winged Vesper gripping its pump handle while gap-dwellers on the platform stare and patched tents stand in the handcar’s path',
    choices: [
      {
        id: 'let-the-camp-remember',
        label:
          'Ask the gap-dwellers what they remember of the mapmaker, and let Vesper hear it',
        outcome:
          'Tansy speaks first: the maps saved her family once, before they were sold and used to hunt others. Two more people remember the same. Vesper listens to all of it and finally says yes, it was me, and the tracks lock straight. The handcar rolls out. Vesper shakes the whole ride, and Rowan does not try to make it better with words.',
        flag: 'honest-track-testimony',
        effects: { evidence: 1, trust: 2, danger: 1 },
        artSubject:
          'Vesper stands trembling on the handcar as Tansy Mull speaks from the platform and the three rails snap into one straight line toward the forest',
      },
      {
        id: 'ride-the-outer-line',
        label:
          'Take the outermost line, the long way, where nobody can ask Vesper anything',
        outcome:
          'Rowan steers the handcar onto the far line, which never moves because it runs past no one. It is hours longer, and the pump wears blisters into both their palms. Vesper is grateful and says so, haltingly, somewhere around the third hour. Back at the platform, the gap-dwellers are still waiting for an answer.',
        flag: 'honest-track-long-line',
        effects: { trust: 1, supplies: -1, evidence: -1 },
        artSubject:
          'Rowan and Vesper pump a handcar side by side along a lonely outer rail through moonlit restored forest, both their palms wrapped in cloth',
      },
    ],
  },
  '8,8': {
    title: 'The Copier at the Foot of the Gate',
    speaker: 'Rowan, Vesper and Pip',
    kind: 'memory',
    opening:
      'At the foot of the Briar gate, half buried in leaf mould, stands the last office photocopier, and under it the last dungeon stair. Rowan recognises the model: it is the one from his old research floor on Earth, coffee ring and all. Each copy it prints shows a page from his own lab notebook in his own handwriting, then a page in Morrow’s, the two hands alternating as if the work were shared. The original notebook lies somewhere down the stair, and by any fair reckoning it is Rowan’s. Vesper watches him go very still. Pip is already looking for something to mark the way out.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands frozen beside a coffee-stained office photocopier half buried in leaf mould at the foot of the iron gate, holding a warm printed notebook page above a dark stair while Vesper watches and Pip unspools courier twine',
    choices: [
      {
        id: 'descend-for-the-notebook',
        label:
          'Go down now and bring back the notebook before more pages copy away',
        outcome:
          'Rowan climbs down fast and finds the notebook in a root hollow, both handwritings bound together, his and Morrow’s, neither one erasable now. He brings it up whole. On the way back the stair turns once too often, and he spends a frightening hour lost in the dark before Pip’s whistle finds him.',
        flag: 'gate-copier-notebook-retrieved',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'Rowan sits on the top stair hugging a worn lab notebook, its pages filled in two different handwritings, while Pip lowers his whistle in relief',
      },
      {
        id: 'mark-the-gate-exit',
        label:
          'Mark the exit with Pip before anyone goes down, even if pages are lost',
        outcome:
          'Pip strings courier twine from the copier to the first landing while Rowan chalks numbers on every step. As they work, the copier prints six more pages and the originals fade. Rowan returns safely with a notebook missing one week of entries: the week, as it happens, when Morrow’s handwriting first appears.',
        flag: 'gate-copier-exit-marked',
        effects: { evidence: 1, supplies: -1 },
        artSubject:
          'Rowan leafs through a notebook with a run of blank faded pages at the top of a twine-strung stair as Pip coils the remaining line',
      },
    ],
  },
} as const
