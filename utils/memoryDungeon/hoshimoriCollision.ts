/**
 * e12, Hoshimori, the last unwritten road: all 64 authored sites
 * (2026-11-20 PT). Vesper leads; 8,8 approaches the Last Door.
 */
export const HOSHIMORI_COLLISION_SITES = {
  '1,1': {
    title: 'The Ledger at the Cedar Footbridge',
    speaker: 'Vesper, Ume the bridge keeper and Grisel of the Briar patrol',
    kind: 'challenge',
    opening:
      'Vesper lands on the cedar footbridge they crossed a thousand times as a child and finds it guarded. A grey Briar wolf named Grisel stands on the middle plank with a laminated office badge on a lanyard, checking travelers against a transfer list. Old Ume, the bridge keeper, still counts planks with her walking stick. She slides her toll ledger across the rail. On one page, in Vesper’s own childish hand, is the stepping-stone route to the hidden houses, its sale price struck through in red. Somebody refused the money. Nobody returned the map.',
    artSubject:
      'Vesper, a dusty-grey moth-folk cartographer with feathery antennae and veined wings, leans over an old toll ledger on a cedar footbridge while a grey wolf wearing an office lanyard watches from the middle plank.',
    choices: [
      {
        id: 'return-route',
        label:
          'Return the page to its owners through Ume’s nameless rice-drop box',
        outcome:
          'Vesper tears the page free and folds it into the box where families once left notes without names. Ume promises it will reach the right doors without her ever learning whose they are. Grisel logs the torn ledger as tampering with a record, and her badge now blinks red whenever Vesper crosses. The owners get their route back; Vesper gets neither thanks nor proof.',
        flag: 'cedar-route-returned',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Vesper slides a folded ledger page into a weathered wooden rice box at the bridge end while an old woman with a walking stick keeps her eyes turned politely away.',
      },
      {
        id: 'ask-consent',
        label:
          'Ask the families by the old knot signal whether a safe public copy may exist',
        outcome:
          'Vesper ties three knots on the rail, the childhood code for a question. By dusk two knots are untied and one is cut clean. Two households allow a public copy that shows the bridge and hides their thresholds; the third refuses. Vesper copies only what was permitted, and the blank where the third house should be sits on the page like a held breath.',
        flag: 'cedar-route-consented',
        effects: { evidence: 2, supplies: -1 },
        artSubject:
          'At dusk Vesper studies three cords on a cedar rail, two neatly untied and one cut through, a half-drawn map pressed against their veined wing.',
      },
    ],
  },
  '2,1': {
    title: 'Rice Cart on Platform Nine',
    speaker: 'Vesper and Burr, a young badged wolf',
    kind: 'merchant',
    opening:
      'The far end of the cedar bridge no longer touches the riverbank. It runs straight onto a commuter platform with a flickering departure board and a vending machine full of pickled plums. A young Briar wolf called Burr hauls a cart of steaming rice up the tactile paving, his office badge reading FACILITIES, BRIDGE ACCESS, PROVISIONAL. He offers bowls to the waiting crowd at a price of one signature each. Vesper notices the cart sits strangely high, as if something flat and heavy has been packed beneath the rice.',
    artSubject:
      'Vesper, the grey moth-winged cartographer, stands on a fluorescent-lit station platform fused to a cedar bridge as a lanky young wolf with an office badge pulls a steaming rice cart past the ticket gates.',
    choices: [
      {
        id: 'share-freely',
        label: 'Persuade Burr to hand out the rice with no signatures taken',
        outcome:
          'Vesper argues that a meal with a signature attached is a census with chopsticks. Burr, who has been hungry himself, gives in and ladles out bowls to anyone who asks. The crowd eats. An hour later Grisel arrives, finds the signature sheet empty and docks Burr’s badge to its last provisional day. He does not blame Vesper aloud, which is worse.',
        flag: 'wolf-rice-shared',
        effects: { supplies: 1, trust: 1, danger: 1 },
        artSubject:
          'A young wolf ladles rice into the bowls of tired commuters and villagers on a station platform while Vesper holds the blank signature clipboard face-down against their chest.',
      },
      {
        id: 'ask-guard',
        label: 'Ask Burr what he was told to guard under the rice',
        outcome:
          'Burr lifts the steaming top tray. Beneath it lie bundles of office transfer orders, each one reassigning a villager to a city floor they never asked to work on. He was told they were fertilizer. Vesper takes the bundle as proof of what the badges are doing, but the crowd goes without the second pot of rice, and Burr now knows exactly how much trouble he is in.',
        flag: 'wolf-rice-transfers',
        effects: { evidence: 2, supplies: -1 },
        artSubject:
          'Vesper and a young wolf peer under a lifted tray of steaming rice at a cart stacked with bundled office transfer forms tied in red string.',
      },
    ],
  },
  '3,1': {
    title: 'The Lantern of Unchosen Homes',
    speaker: 'Vesper, Ume and a queue of travelers',
    kind: 'puzzle',
    opening:
      'A paper lantern hangs from the platform canopy where the departure board should be. As each traveler passes beneath it, the lantern turns and paints a home onto the wall: a kelp-roofed palace room, a fourth-floor office cubicle, a burrow in a thorn bank. None of them is the home the traveler named. An elderly kappa stares at a sea-palace guest room and quietly says she would drown there. Ume taps the lantern’s frame and tells Vesper it was hung by the transfer office this morning. Its wick is still burning on a ledger strip.',
    artSubject:
      'Vesper reaches toward a glowing paper lantern under a station canopy as it throws a picture of an underwater palace room across the tiled wall above a startled elderly kappa.',
    choices: [
      {
        id: 'rewire-lantern',
        label:
          'Rewire the lantern so each traveler speaks their own destination',
        outcome:
          'Vesper unpicks the ledger-strip wick and threads in plain paper. Now the lantern paints whatever destination a traveler says aloud. The kappa sees her own pond and laughs. The catch arrives quickly: every spoken destination glows on the wall for the whole platform to read, and a badge-wearing wolf at the gate starts writing them down.',
        flag: 'lantern-destinations-spoken',
        effects: { trust: 1, danger: 2 },
        artSubject:
          'A paper lantern paints a small reed-ringed pond onto a station wall while an elderly kappa laughs and a badged wolf in the background lifts a pencil.',
      },
      {
        id: 'shelter-lantern',
        label:
          'Wrap the lantern in Vesper’s wings until anyone can consent to its light',
        outcome:
          'Vesper climbs the canopy and folds their wings around the lantern, dimming it to a dull amber that shows nothing. The platform falls into an uneasy hush. Nobody is shown a wrong home, but no train will leave without a lit signal, and the queue grows cold and cross. Ume brings Vesper tea and stays to argue with the stationmaster about whose permission a lamp needs.',
        flag: 'lantern-sheltered',
        effects: { trust: 2, supplies: -1, evidence: -1 },
        artSubject:
          'Vesper perches on a station canopy with dusty-grey wings wrapped around a paper lantern, its light reduced to a faint amber glow over a waiting crowd.',
      },
    ],
  },
  '4,1': {
    title: 'Ash Pages in the Orchard',
    speaker: 'Vesper and Rowan',
    kind: 'companion',
    opening:
      'Fine grey sheets drift down from the Red Oven’s chimney and settle in the persimmon orchard where Vesper once drew their first unfinished map. Each sheet is printed ash: charts, trial numbers, a column headed MEMORY YIELD. Rowan, in a grey cardigan dusted with soot, kneels between the trees catching pages before the wind breaks them. He reads data the way Ume reads planks. Several failed trials list subjects only by the houses they came from. Rowan looks up and asks, very carefully, whether Vesper recognizes the house numbers.',
    artSubject:
      'Rowan, an androgynous researcher in a soot-dusted grey cardigan, kneels among persimmon trees catching sheets of printed ash while Vesper, grey moth wings half-open, crouches beside him reading one.',
    choices: [
      {
        id: 'preserve-ash',
        label:
          'Help Rowan preserve the ash pages without naming a single subject',
        outcome:
          'Rowan seals the sheets between waxed rice paper and blacks out every house number with Vesper’s ink. The record survives; the people in it stay unidentified. Rowan joins Vesper, quietly pleased to be useful. The cost is that nobody can now be held accountable by name for the failed trials, and the cook at the Oven will read the redactions as mercy rather than proof.',
        flag: 'ash-preserved-unnamed',
        effects: { evidence: 1, trust: 1 },
        artSubject:
          'Rowan presses fragile grey ash pages between sheets of waxed rice paper while Vesper inks careful black bars over printed house numbers.',
      },
      {
        id: 'informed-trial',
        label:
          'Ask Rowan to design a new test that only informed volunteers enter',
        outcome:
          'Rowan lights up, then sobers. He drafts a plain-language consent sheet with a refusal box larger than the signature line. Vesper carries it to the orchard keepers. Three volunteers agree; one changes her mind at the gate and walks away without penalty. The results are slow and small, but they are true, and the Oven now knows someone is counting differently.',
        flag: 'ash-trial-informed',
        effects: { evidence: 2, supplies: -1, danger: 1 },
        artSubject:
          'Rowan writes a consent form on a clipboard beneath persimmon branches while a volunteer walks away down the orchard path and Vesper watches with folded wings.',
      },
    ],
  },
  '5,1': {
    title: 'The Perfect Name Stall',
    speaker: 'Vesper and a smiling name merchant',
    kind: 'memory',
    opening:
      'At the bridge’s station end a merchant has set up a stall of folded paper names, each one tucked in a little envelope like a fortune. He bows to Vesper and offers one free of charge: a name so clean that no wolf badge, sea toll or village ledger would ever connect it to the child who sold a map. Vesper opens the envelope. The name is lovely. It is also warm, as if someone has been carrying it all day, and the bench beside the stall still holds the dent of whoever sat there.',
    artSubject:
      'Vesper, the moth-winged cartographer, holds an opened paper envelope at a small station-side stall of folded names while a smiling merchant in a bowler hat bows behind a lantern.',
    choices: [
      {
        id: 'reject-name',
        label: 'Hand the name back and keep the one tied to the betrayal',
        outcome:
          'Vesper refolds the name and returns it. They remember the night they first signed the sale, and that the girl they rescued with the money still writes to them under her own name. A clean name would erase both. The merchant shrugs and sells it to the next customer, and Vesper has to stand there and watch that happen too.',
        flag: 'perfect-name-rejected',
        effects: { trust: 1, danger: -1 },
        artSubject:
          'Vesper slides a folded paper name back across a market stall as a bowler-hatted merchant shrugs and turns to a waiting customer.',
      },
      {
        id: 'find-claimant',
        label: 'Follow the warm dent in the bench to the name’s rightful owner',
        outcome:
          'The trail of warmth leads to a teenage tanuki asleep under the platform stairs, transfer papers in her fist. Her name was taken at the badge gate as a deposit. She tells Vesper the story slowly and makes them promise not to write down where she sleeps. Vesper returns the name. The merchant, robbed of his stock, reports a moth-folk thief to the patrol.',
        flag: 'perfect-name-returned',
        effects: { evidence: 1, trust: 2, danger: 1 },
        artSubject:
          'Vesper kneels under station stairs offering a paper envelope to a sleepy young tanuki clutching crumpled transfer papers.',
      },
    ],
  },
  '6,1': {
    title: 'The Coral Toll Bell',
    speaker: 'Vesper, Ume and two quarrelling ferry pilots',
    kind: 'challenge',
    opening:
      'Overnight a bell of pink coral has grown from the bridge’s toll post, dripping seawater that should be forty miles away. A sea-court rule has come with it: the bell will not let the bridge carry weight again until someone rings it in the order of promises remembered on this crossing. Its surface is scratched with tally marks, fishhook symbols and one tiny moth. Two ferry pilots argue about which promise came first. Ume admits her memory of the order is not the same as her ledger’s.',
    artSubject:
      'Vesper studies a dripping pink coral bell grown from a cedar toll post, tracing a scratched moth symbol with one finger while two ferry pilots argue nearby.',
    choices: [
      {
        id: 'read-scratches',
        label: 'Solve the order from the scratches visible on the coral',
        outcome:
          'Vesper reads the marks like a map: deepest groove oldest, freshest scratch last. The moth sits third, the promise they once made to guide travelers without recording them. The bell accepts the sequence and the bridge holds. Yet the order now stands as fact, and one pilot whose promise was never scratched into anything goes home insisting history has been rewritten without her.',
        flag: 'coral-bell-read',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'Vesper strikes a coral bell with a wooden mallet as seawater sprays off its surface and the cedar bridge behind them steadies.',
      },
      {
        id: 'invite-witnesses',
        label:
          'Invite the pilots and Ume to test the bell’s rule against each other’s memories',
        outcome:
          'Each witness rings the promise they remember, and the bell answers with a different note for each disagreement. It takes until moonrise. The final order belongs to no single account, and the bridge carries half weight only, so heavy carts must wait. But both pilots leave believing they were heard, and Ume corrects her own ledger in front of everyone.',
        flag: 'coral-bell-witnessed',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Under moonrise, an old bridge keeper and two ferry pilots take turns ringing a coral bell while Vesper records each note on a slate.',
      },
    ],
  },
  '7,1': {
    title: 'The Knife in the Lost-and-Found',
    speaker: 'Vesper and Ume',
    kind: 'treasure',
    opening:
      'Ume keeps a lost-and-found basket under the toll booth. Among the odd sandals and a single office lanyard lies Vesper’s childhood map-cutting knife, its handle wrapped in faded moth-wing silk. Vesper picks it up and feels the old pull. In this collided village the blade does more than trim paper: drawn across a map, it slices the real ground to match. A shortcut to the station could be cut straight through the miller’s back room. The miller is away. The room is full of someone’s drying futons.',
    artSubject:
      'Vesper lifts a small silver map-knife wrapped in faded moth-silk from a basket of odd sandals beneath a cedar toll booth, its blade catching lantern light.',
    choices: [
      {
        id: 'refuse-shortcut',
        label: 'Sheath the knife and refuse to cut through the miller’s home',
        outcome:
          'Vesper wraps the blade in silk and gives it to Ume to keep. The long road to the station stays long, and a family carrying an injured grandfather has to take it the slow way. Vesper walks beside them carrying the heaviest bag, knowing the shortcut would have been kinder to their backs and crueler to the room.',
        flag: 'knife-refused',
        effects: { trust: 2, supplies: -2 },
        artSubject:
          'Vesper hands a silk-wrapped knife to an old bridge keeper, then shoulders a heavy bundle beside a family carrying their grandfather along a winding road.',
      },
      {
        id: 'public-route',
        label:
          'Ask the neighbors to plan a public route together before anything is cut',
        outcome:
          'Vesper calls a meeting on the bridge. The miller’s household, reached by runner, agrees to give up a strip of vegetable garden but not the futon room. Vesper cuts only the agreed line. The new path is crooked, muddy and argued over, but it belongs to everyone who drew it, and the knife stays dangerous in Vesper’s belt.',
        flag: 'knife-public-route',
        effects: { trust: 1, supplies: 1, danger: 1 },
        artSubject:
          'Villagers crowd around a map spread on the cedar bridge as Vesper draws a careful knife-line along a vegetable garden edge they have all agreed on.',
      },
    ],
  },
  '8,1': {
    title: 'The White Door at the Wolf Road',
    speaker: 'Vesper and the Blank Gatekeeper',
    kind: 'monster',
    opening:
      'Where the cedar bridge meets the Briar wolf road, a white door stands in the mud with no wall around it. It breathes. Pencil shavings curl from its hinges like teeth. Pinned to its panel is a sketch of children holding hands, their faces left empty. The door speaks in a polite clerk’s voice and asks Vesper, the village’s best mapmaker, to finish the faces so it may finally know whose future it guards. When Vesper hesitates, the frame stretches and a shaving mouth opens toward their wings.',
    artSubject:
      'A tall white freestanding door with curling pencil-shaving teeth leans toward Vesper on a muddy forest road, a pinned sketch of faceless children fluttering on its panel.',
    choices: [
      {
        id: 'leave-open',
        label:
          'Refuse to draw the faces and let the door’s hunger break against an open future',
        outcome:
          'Vesper says the children are not theirs to name and that nobody here has that right. The door snaps and tears a strip from Vesper’s wing, but its hinges loosen each time the refusal is repeated, and at last it sags open onto plain fog. The sketch stays unfinished. Vesper sheds silver dust all the way back across the bridge.',
        flag: 'white-door-left-open',
        effects: { trust: 1, danger: 2, evidence: -1 },
        artSubject:
          'Vesper stands with one torn grey wing as a white door sags open onto fog on a muddy road, a sketch of faceless children still pinned and unfinished.',
      },
      {
        id: 'negotiate-door',
        label:
          'Negotiate what the door owes and is owed before anyone passes through',
        outcome:
          'Vesper bargains like a smuggler. The door may keep its sketch but must never fill it, must open outward as well as in, and must report to no badge. In exchange Vesper promises to return with every person who has a stake. The door accepts and closes its mouth. Now Vesper owes it a crowd, and doors remember debts.',
        flag: 'white-door-negotiated',
        effects: { evidence: 1, supplies: -1, danger: -1 },
        artSubject:
          'Vesper sits cross-legged before a white freestanding door on a forest road, writing terms on a scroll while the door’s pencil-shaving mouth stays shut.',
      },
    ],
  },
  '1,2': {
    title: 'Pip’s Collection Notice',
    speaker: 'Vesper and Pip',
    kind: 'companion',
    opening:
      'Rice grows right up to the rails on the terrace line, and the harvest song coming down the slope decides when the little carts depart. Pip sits on a sleeper with his courier satchel open and a face like a dropped plate. The transfer office has handed him a collection notice, in his old ledger-house shorthand, for one sold safe route. The debtor is listed as Vesper. The creditor is listed as everyone who walked it. Pip wants to know whether he is supposed to collect, forgive, or quit.',
    artSubject:
      'Pip, a small goblin courier with a battered satchel, sits on a railway sleeper among green rice stalks holding up a ledger notice while Vesper, grey moth wings folded, crouches to read it.',
    choices: [
      {
        id: 'repay-walkers',
        label:
          'Ask Pip to deliver the route back to the walkers instead of collecting',
        outcome:
          'Pip, who knows every unnamed doorstep on his delivery round, agrees to carry folded copies back without saying who receives them. He joins Vesper for the road. The transfer office marks his notice uncollected and docks his courier pay, and Pip spends the evening recalculating how long his Red Oven debt will now take to clear.',
        flag: 'pip-route-delivered',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Pip trots along a terrace railway with an armful of folded papers, Vesper walking beside him beneath a slope of singing rice workers.',
      },
      {
        id: 'consent-ledger',
        label:
          'Let Pip post a public copy only after walkers sign their own consent in his ledger',
        outcome:
          'Pip rules a new page: one column for yes, one for no, and no column for names. Four walkers mark yes, two mark no, and one draws a small angry frog. Pip posts a public copy showing only the yes paths and joins Vesper, satisfied that the ledger finally counts refusals. The office calls it incomplete and refuses to cancel the debt.',
        flag: 'pip-consent-ledger',
        effects: { evidence: 2, trust: 1, danger: 1 },
        artSubject:
          'Pip holds open a ledger page of tally marks, one corner doodled with an angry frog, while Vesper pins a partial map to a railway signal post.',
      },
    ],
  },
  '2,2': {
    title: 'The Wolf at the Stepping Stones',
    speaker: 'Vesper, Grisel, Pip and the harvest singers',
    kind: 'memory',
    opening:
      'Below Pip’s old ledger house, Vesper’s childhood stepping stones still cross the flooded paddy, now laid between two railway tracks. Grisel stands on the middle stone. Beside her office badge hangs a latch of black Briar wood carved like a wolf’s head: the wolf-door, the one gap her patrol must open. Under Briar law, any path she guards yields only to a traveler who states where it leads. Vesper remembers hopping these stones at six, counting houses under their breath so they would never have to say them aloud. The houses are still there, and still hiding people.',
    artSubject:
      'Grisel, a grey Briar wolf with an office badge and a carved black wolf-head latch on her lanyard, stands on a stepping stone in a flooded rice paddy between railway tracks as Vesper faces her from the bank.',
    choices: [
      {
        id: 'chase-the-stones',
        label:
          'Invoke Briar challenge law and race Grisel across the stones at the harvest song’s last note',
        outcome:
          'Briar law lets a challenger who outruns a guardian take the path without explaining it. When the song ends and the tracks flood, Vesper flies low and Grisel bounds stone to stone. Vesper wins by a wingbeat, soaked and bleeding from a slipped claw, and snatches the wolf-door latch from her lanyard. Grisel yields as the law demands, then files a pursuit report with every badge on the line.',
        flag: 'village-wolf-door-chase',
        effects: { evidence: 1, danger: 2, trust: -1 },
        artSubject:
          'Vesper skims low over flooding stepping stones with wet grey wings outstretched as a grey wolf leaps behind them, a carved wolf-head latch swinging from Vesper’s fist.',
      },
      {
        id: 'confess-the-sale',
        label:
          'Confess the old sale to Grisel and let Pip and the singers testify without naming any house',
        outcome:
          'Vesper tells Grisel the whole truth: these stones were the route they sold. Pip testifies that he carried meals along it for years; Old Rin, the lead singer, says only that people still live safely past the fourth stone. Briar wolves honor a confession given unasked. Grisel unhooks the wolf-door latch and hands it over, but she has now heard the betrayal from the betrayer’s own mouth, and she does not forget.',
        flag: 'village-wolf-door-confession',
        effects: { trust: 2, evidence: 1, danger: -1 },
        artSubject:
          'On a stepping stone in a flooded paddy, Grisel lowers her head to accept testimony from Vesper, a goblin courier and an old singer holding a straw hat.',
      },
      {
        id: 'count-not-name',
        label:
          'Offer Grisel a tally of crossings in place of destinations and share Burr’s rice to seal it',
        outcome:
          'Vesper proposes a compromise both rulebooks can stomach: Grisel may count every crossing with a knot on her lanyard but may never ask where it ends. A shared pot of rice from Burr’s cart makes it a feast, and feasts bind Briar wolves. Grisel trades the wolf-door latch for the deal. The patrol stays on the stones, the knots keep growing, and every refugee who crosses is still counted.',
        flag: 'village-wolf-door-tally',
        effects: { supplies: -1, trust: 1, evidence: 2 },
        artSubject:
          'Grisel ties a knot on her lanyard beside a steaming pot of rice on the bank as Vesper accepts a carved black wolf-head latch from her paw.',
      },
    ],
  },
  '3,2': {
    title: 'The Signal Lamp That Sends People Elsewhere',
    speaker: 'Vesper, Old Rin and the exhausted singers',
    kind: 'challenge',
    opening:
      'Halfway up the terraces a signal lamp swings on a bamboo pole, and every time the harvest song reaches its high note the lamp switches the points. The rice carts carrying families downhill are sent to homes nobody chose: a city dormitory, a palace stable, a thorn burrow. Old Rin and the singers have been singing for two days to slow it, voices shredded. If they stop, every cart departs at once. Vesper takes the pole in both hands and feels the lamp straining toward the next wrong destination.',
    artSubject:
      'Vesper wrestles a swinging signal lamp on a bamboo pole above rice terraces as a line of hoarse singers in straw hats keeps singing and loaded rice carts wait on the tracks.',
    choices: [
      {
        id: 'riders-choose',
        label:
          'Jam the points open so each cart’s riders can pull their own lever',
        outcome:
          'Vesper wedges the knife-handle into the points and Pip strings a pull-cord into every cart. The singers finally stop. Families choose their own branches downhill, some to relatives, some anywhere but here. Two carts collide at the fork where nobody agreed who had right of way, spilling rice and bruising a child, and the lamp now shows every choice in bright red to anyone watching from the station.',
        flag: 'signal-riders-choose',
        effects: { trust: 1, danger: 2, supplies: -1 },
        artSubject:
          'Rice carts peel off down separate terrace tracks as passengers pull their own cords, one cart tipped at a fork with spilled rice glowing in red signal light.',
      },
      {
        id: 'hood-signal',
        label:
          'Hood the signal lamp and hold the carts until every family can be asked',
        outcome:
          'Vesper drapes their satchel over the lamp and the points freeze. Nothing departs. Old Rin sinks onto a terrace wall and cries from plain relief. Then the long work begins: Vesper and Pip walk cart to cart asking, by whisper, where each family wants to go. It takes the whole night and most of the food, and a badged wolf arrives before the last cart is asked.',
        flag: 'signal-hooded',
        effects: { trust: 2, supplies: -2, danger: 1 },
        artSubject:
          'Vesper hangs a leather satchel over a signal lamp at night while an old singer slumps against a terrace wall and families wait in stilled rice carts.',
      },
    ],
  },
  '4,2': {
    title: 'Recipe in the Stubble',
    speaker: 'Vesper and Seri the baker',
    kind: 'treasure',
    opening:
      'Ash from the Red Oven has settled thick on one terrace, and the rice there grows black-tipped and oddly sweet. When Vesper brushes the stubble aside, they find the ash has fallen in readable rows: a recipe page, burnt and reprinted by the chimney, from before the Oven was joined to its reactor. Bread from flour, salt and water, no memory yield column at all. Seri the baker comes panting up the slope with a basket on her hip. She has been searching for this page for nine years and is frightened of what it will prove.',
    artSubject:
      'Vesper kneels on a terrace of black-tipped rice, brushing ash from rows of printed recipe text, as a round-faced baker with a basket on her hip hurries up the slope behind them.',
    choices: [
      {
        id: 'give-to-seri',
        label:
          'Lift the ash recipe intact and give it to Seri without demanding a confession',
        outcome:
          'Vesper slides a board beneath the page and carries it whole to Seri. She holds it the way someone holds a newborn and admits nothing yet. The recipe is safe and the baker is unthreatened, but without a public record of when the Oven changed, the families who lost memories to it have nothing to point at.',
        flag: 'ash-recipe-to-seri',
        effects: { supplies: 1, trust: 1 },
        artSubject:
          'Vesper hands a fragile board bearing a grey ash recipe page to a tearful baker on a rice terrace in soft evening light.',
      },
      {
        id: 'test-plot',
        label:
          'Plant a test plot with volunteers who know exactly what the ash may cost them',
        outcome:
          'Seri and three volunteers sow a small plot with the old recipe flour while Vesper reads out every risk recorded on the ash. One volunteer’s childhood song fades after the first harvest loaf; she says she knew and still chose it. The test proves the old bread is safe, almost. Seri now owes the village an explanation she cannot bake her way out of.',
        flag: 'ash-test-plot',
        effects: { evidence: 2, supplies: -1, danger: 1 },
        artSubject:
          'A baker and three volunteers sow grain on a small square terrace plot while Vesper reads aloud from an ash page and a wolf watches from the ridge.',
      },
    ],
  },
  '5,2': {
    title: 'The Roll-Call Centipede',
    speaker: 'Vesper, Pip and the singers',
    kind: 'monster',
    opening:
      'Something long and rustling comes down the terrace track at dusk: a centipede built from a thousand punched ticket stubs, each segment printed with a name bought at the mask market. It calls the names in a conductor’s singsong. Every singer who answers, even out of politeness, gets folded into a segment and carried toward the transfer office. Two have already gone. Old Rin clamps a hand over her own mouth. Vesper recognizes, on the third segment from the head, a name they once wrote on a safe-path map.',
    artSubject:
      'A long rustling centipede made of punched ticket stubs coils down a terrace railway at dusk as Vesper spreads grey moth wings between it and a line of frightened singers.',
    choices: [
      {
        id: 'answer-silence',
        label: 'Teach the singers to answer every bought name with a held rest',
        outcome:
          'Vesper hums the harvest song with a gap where the reply should be, and the singers copy it. The centipede calls and calls into the silence, segments loosening, until it collapses into confetti. The two taken singers tumble free, dazed. But the rest becomes a habit, and for days afterward the terrace villagers struggle to answer even when friends call their real names.',
        flag: 'centipede-answered-silence',
        effects: { trust: 1, danger: -1, supplies: -1 },
        artSubject:
          'Ticket stubs burst into drifting confetti over a terrace railway as singers hold their hands over open mouths and two rescued workers sit stunned on the tracks.',
      },
      {
        id: 'read-segments',
        label:
          'Read the centipede’s segments to find whose names were sold into it',
        outcome:
          'Vesper climbs along its back while Pip distracts the head with a fake ticket. Each stub lists the original owner and the buyer. The record is damning and Vesper copies it. The centipede notices before they finish, folds Pip halfway into a segment, and Vesper has to tear him loose, ripping a dozen names into pieces that can never be returned.',
        flag: 'centipede-segments-read',
        effects: { evidence: 2, danger: 2, trust: -1 },
        artSubject:
          'Vesper clings to the back of a ticket-stub centipede copying names into a notebook while a goblin courier is half folded into a paper segment beside them.',
      },
    ],
  },
  '6,2': {
    title: 'The Brine Tunnel of Bells',
    speaker: 'Vesper, Pip and Old Rin',
    kind: 'dungeon',
    opening:
      'At the top terrace the railway plunges into a hillside tunnel Vesper never saw as a child. Seawater laps over its sleepers, warm and salt, flowing uphill from the flooded palace gate. Deep inside a coral bell rings departure times, and with each ring a transfer cart rolls in loaded and comes back empty. Old Rin says the singers taken last week went this way. Pip says the tunnel smells like the Red Oven and the sea at once. If the bell’s order of promises can be learned, the carts can be stopped from the inside.',
    artSubject:
      'Vesper stands at the mouth of a hillside railway tunnel flooded with glowing seawater, coral growing over the sleepers, as an empty transfer cart rolls out toward a goblin and an old singer.',
    choices: [
      {
        id: 'copy-bell-marks',
        label:
          'Copy every scratch mark visible on the tunnel’s coral before going in',
        outcome:
          'Vesper and Pip trace the coral by lantern for an hour, building a rubbing of every promise the tunnel bell has recorded. They will enter knowing the visible sequence. The work costs lamp oil and time, and while they copy, another full cart rolls past them into the dark.',
        flag: 'brine-tunnel-rubbings',
        effects: { evidence: 2, supplies: -1 },
        artSubject:
          'Vesper presses rice paper against coral-encrusted tunnel walls, rubbing charcoal over scratched symbols, while Pip holds a dripping lantern.',
      },
      {
        id: 'bring-singers',
        label:
          'Bring Old Rin and two volunteers as witnesses to test the bell’s rule in person',
        outcome:
          'Old Rin and two hoarse singers agree to come, each remembering different promises from the harvest. Their disagreements will be the key to the tunnel bell. Vesper now carries responsibility for three more lives in the flooded dark, and the singers’ absence leaves the terraces with no voices to slow the timetable.',
        flag: 'brine-tunnel-witnesses',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Vesper leads an old singer and two volunteers in straw hats wading knee-deep into a seawater tunnel lit by a faraway coral glow.',
      },
    ],
  },
  '7,2': {
    title: 'Two Coats on the Shelter Hooks',
    speaker: 'Vesper and Pip',
    kind: 'memory',
    opening:
      'The singers’ rain shelter at the terrace station has a row of hooks, all empty but one, where a photograph has been pinned instead of a coat. It came through with the office transfers. It shows an Earth apartment door: a worn grey cardigan and a bright yellow raincoat on two hooks, wet autumn leaves pressed against frosted glass. Pip swears he has seen that cardigan on someone in their party. Vesper’s old knife hums at their belt. One clean cut could lift a single coat from the picture and turn it into a route straight to that door.',
    artSubject:
      'Vesper holds a small Earth photograph of a grey cardigan and yellow raincoat on apartment hooks beside a frosted door, standing in a bamboo rain shelter as Pip peers over their wing.',
    choices: [
      {
        id: 'challenge',
        label: 'Question what home means before cutting anyone a road to it',
        outcome:
          'Vesper sheathes the knife. Two coats are not proof of marriage, and not proof of captivity either; they are evidence of repeated returns, of someone coming back through that door more than once. A route cut from it would decide what it meant for the people inside. Pip grumbles that a faster road would have helped, and pins the photograph back on its hook.',
        flag: 'coats-home-questioned',
        effects: { trust: 1, evidence: 1, supplies: -1 },
        artSubject:
          'Pip pins a small photograph of two coats back onto an empty shelter hook as Vesper slides a silver knife into its sheath, rain falling over the rice beyond.',
      },
      {
        id: 'hold',
        label:
          'Recognize the coats as a shared decision someone else already made',
        outcome:
          'Vesper looks a long time at the hooks hung side by side. Whoever left that life behind would find it growing less like a thing to simply pick up again. Two people chose a door together. Vesper tucks the photograph into their map case for whoever it belongs to and feels the weight of carrying it without the right to read it twice.',
        flag: 'coats-shared-decision',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Vesper tucks a photograph of two coats on hooks into a leather map case, wet grey wings folded, under a bamboo shelter roof dripping with rain.',
      },
    ],
  },
  '8,2': {
    title: 'The Departure Nobody Sang',
    speaker: 'Vesper, Pip and Old Rin',
    kind: 'puzzle',
    opening:
      'The timetable board at the top of the line lists every departure against a verse of the harvest song. The last row reads UNWRITTEN, and its time falls between two notes no singer can reach. A white door has appeared at the end of the platform, humming, waiting for its slot. Pip notes that the timetable will lock forever at midnight with whatever entry is written there. Old Rin offers to compose a verse. Vesper studies the gap in the music and realizes that anything written into it becomes a schedule for people who are not here.',
    artSubject:
      'Vesper stands before a wooden timetable board at a mountaintop rice station, one row left blank, while a white door hums at the far end of the platform under stars.',
    choices: [
      {
        id: 'sing-a-rest',
        label:
          'Fill the gap with a marked rest so the departure stays genuinely unscheduled',
        outcome:
          'Vesper teaches Old Rin a rest with a fermata, a silence held as long as whoever is listening needs. The timetable accepts it at midnight and the white door goes quiet. Nothing will ever be sent through on a schedule. The cost is real: the singers lose their last scheduled run home before winter, and some must walk.',
        flag: 'timetable-rest-written',
        effects: { trust: 2, supplies: -2 },
        artSubject:
          'An old singer draws a fermata over a blank timetable row in chalk while Vesper watches a white door fall silent at the end of a moonlit platform.',
      },
      {
        id: 'write-obligations',
        label:
          'Have Pip write obligations into the slot instead of a destination',
        outcome:
          'Pip scrawls a list: whoever leaves may return; whoever returns may refuse; nobody may be sent. The board accepts it at midnight, glowing with ledger-house shorthand. It is useful and binding, but it is also now a rule written by a goblin and a moth on behalf of people who were never asked, and Old Rin says so to their faces.',
        flag: 'timetable-obligations-written',
        effects: { evidence: 2, trust: -1, danger: -1 },
        artSubject:
          'Pip stands on tiptoe chalking a list of rules into a blank timetable row as an old singer folds her arms and Vesper looks down at the platform.',
      },
    ],
  },
  '1,3': {
    title: 'The Receipt in Drawer Forty',
    speaker: 'Vesper and Hollin, transfer-office clerk',
    kind: 'treasure',
    opening:
      'Bell Square has flooded ankle-deep with seawater from the palace gate, and the village archive now shares its shelves with filing cabinets from an Earth office. Hollin, a stout Briar badger in sleeve garters and a transfer-office badge, helps Vesper wade to drawer forty. Inside, sealed in a plastic sleeve, is the receipt for the route Vesper sold as a child. It names the buyer, the price, and the families the buyer later found. Hollin says, apologetically, that it is technically office property and technically a confession.',
    artSubject:
      'Vesper pulls a plastic-sleeved paper receipt from a dented filing drawer in a flooded village archive while a stout badger clerk in sleeve garters holds a lantern above the water.',
    choices: [
      {
        id: 'receipt-to-families',
        label:
          'Carry the receipt to the harmed families and let them decide what to do with it',
        outcome:
          'Vesper brings it to the shrine where survivors meet, sets it down and steps back. One woman reads it and spits. Another asks Vesper to stay and hear what the buyer did with their address. Vesper stays and listens to all of it. The families keep the receipt, and with it the only proof that could clear part of Vesper’s name.',
        flag: 'receipt-given-to-families',
        effects: { trust: 2, evidence: -1 },
        artSubject:
          'Vesper sits on shrine steps with head bowed as a woman holds up a small paper receipt and other survivors gather in lamplight around her.',
      },
      {
        id: 'receipt-to-board',
        label:
          'Post a copy on Scylla’s witness board with the families’ addresses cut out',
        outcome:
          'Vesper uses the old knife to excise every address before Hollin makes a copy. The redacted receipt goes up on the public board in the square, proving the sale happened and who profited. The buyer’s name is now known. So is Vesper’s, and the crowd that gathers to read it does not all agree on which name to be angry at.',
        flag: 'receipt-posted-redacted',
        effects: { evidence: 2, danger: 1, trust: -1 },
        artSubject:
          'A crowd stands ankle-deep in a flooded square reading a redacted receipt pinned to a wooden board, small rectangles cut cleanly from the paper.',
      },
    ],
  },
  '2,3': {
    title: 'The Hound That Eats Unsigned Words',
    speaker: 'Vesper, Hollin and the Sealing Hound',
    kind: 'monster',
    opening:
      'A wolf the size of a rice cart pads through the flooded archive, its fur matted with staples and its collar hung with a dozen office badges. The transfer office calls it the Sealing Hound. It eats any testimony that lacks a signature, and in a village where half the witnesses cannot safely sign, that is most of them. It is dragging a cart of seized conch shells, each one holding a voice Scylla collected. Hollin hides behind a cabinet. The Hound lifts its nose toward the satchel where Vesper keeps their own unsigned confession.',
    artSubject:
      'A huge staple-matted wolf wearing a collar of office badges drags a cart of glowing conch shells through a flooded archive as Vesper backs away clutching a satchel.',
    choices: [
      {
        id: 'feed-the-hound',
        label:
          'Scatter the rice from Burr’s cart so the Hound eats food instead of voices',
        outcome:
          'Vesper empties two sacks of rice across the water. Briar wolves cannot refuse a laid feast, and the Hound gorges until it sleeps. Vesper frees the conch shells one by one. The village loses a week of rice, and when the Hound wakes it will be fed, rested and furious with a moth-shaped grudge.',
        flag: 'hound-fed-rice',
        effects: { supplies: -2, trust: 1 },
        artSubject:
          'A giant badge-collared wolf sleeps among scattered rice in a flooded archive while Vesper tiptoes past lifting glowing conch shells from its cart.',
      },
      {
        id: 'ask-hound-orders',
        label: 'Ask the Hound who ordered it to guard the conch shells and why',
        outcome:
          'The Hound answers like any badge-holder asked a direct question: it recites its work order. Seal all unsigned testimony regarding the Red Oven. Signed, the Oven itself. Vesper now knows the Oven is protecting its record. The Hound, having answered, considers its duty refreshed and swallows one conch shell whole before Vesper can stop it.',
        flag: 'hound-orders-heard',
        effects: { evidence: 2, danger: 1, trust: -1 },
        artSubject:
          'A huge wolf with a staple-matted coat recites a work order from a paper clipped to its collar as Vesper listens, one conch shell disappearing into its jaws.',
      },
    ],
  },
  '3,3': {
    title: 'The Official History Projected on the Bell',
    speaker: 'Vesper, Hollin and a gathered square',
    kind: 'challenge',
    opening:
      'At noon the archive lantern swings out on its iron arm and throws the official history of Hoshimori onto the great village bell, the way a slide projector throws a lecture. It is a tidy story: the village was always safe, the Oven always fair, and the stolen map a regrettable foreign theft. Three incompatible testimonies ring out beneath the image, each one muffled by the lantern’s light. Hollin cheerfully reports that whoever corrects the projection must sign the amendment. Vesper sees their own childhood face in the margin, labeled THIEF, LOCATION UNKNOWN.',
    artSubject:
      'A lantern on an iron arm throws a glowing official village history onto a great bronze bell in a flooded square as Vesper looks up at a small projected portrait of themselves in the margin.',
    choices: [
      {
        id: 'sign-amendment',
        label:
          'Sign the amendment as the map’s seller and add the rescue beside the betrayal',
        outcome:
          'Vesper writes: I sold the route to save someone I loved, and people were hunted because of it. Both sentences go up on the bell. The lantern dims to admit the correction, and the three muffled testimonies ring clearer. Vesper’s real name and present location now sit in the official record, available to anyone who reads it.',
        flag: 'history-amended-signed',
        effects: { evidence: 2, trust: 1, danger: 2 },
        artSubject:
          'Vesper signs a paper amendment on a clipboard held by a badger clerk while new lines of text glow across a bronze bell in the square.',
      },
      {
        id: 'shade-lantern-history',
        label:
          'Shade the lantern so the three testimonies can be heard without any official image',
        outcome:
          'Vesper climbs the iron arm and spreads their wings over the lens. The tidy story goes dark and the bell rings with all three accounts at once, harsh and contradictory and alive. People stay to listen. But the official history remains unchanged on file, still calling Vesper a foreign thief, and Hollin cannot amend what nobody signed.',
        flag: 'history-lantern-shaded',
        effects: { trust: 2, evidence: -1 },
        artSubject:
          'Vesper spreads dusty-grey wings over a lantern lens on an iron arm as a crowd below listens to a great bell ringing in the shadowed square.',
      },
    ],
  },
  '4,3': {
    title: 'Souvenirs on the Oven Steps',
    speaker: 'Vesper and Fennick the ash peddler',
    kind: 'merchant',
    opening:
      'On the front steps of the Red Oven, facing the flooded square, a weasel peddler called Fennick has laid out a blanket of ash pages under glass. He is selling the Oven’s failed experiments as souvenirs: a framed trial sheet for two coppers, a whole failed week for a silver. Tourists from the office transfers buy them as quaint village curios. Vesper reads one. It records a grandmother who forgot her son’s face after eating festival bread. The son is standing three steps down, haggling for it.',
    artSubject:
      'A grinning weasel peddler sells framed ash pages on the red-painted steps of a village oven as Vesper, grey moth wings drooping, reads one while a young man haggles below.',
    choices: [
      {
        id: 'buy-the-stock',
        label:
          'Buy Fennick’s whole stock and hand each page back without accusing anyone',
        outcome:
          'Vesper empties their purse. Fennick throws in the blanket. Vesper finds the haggling son and gives him his mother’s page for nothing, then sits with him while he reads it. The evidence is preserved and returned to the people it describes. Vesper is broke, and Fennick goes off whistling to find more ash to sell.',
        flag: 'ash-stock-bought',
        effects: { supplies: -2, trust: 2 },
        artSubject:
          'Vesper sits on red oven steps beside a young man reading a fragile ash page, an emptied coin purse and a rolled blanket at their feet.',
      },
      {
        id: 'trade-for-source',
        label:
          'Trade Vesper’s map case for the name of the clerk who supplies Fennick',
        outcome:
          'Fennick likes the case and gives up his source: a night clerk inside the Oven’s reactor wing who sells overflow ash for pocket money. Vesper now knows exactly who leaks the records. They also have nowhere safe to carry maps, and the clerk is a frightened teenager who will lose everything if Vesper uses the name.',
        flag: 'ash-source-traded',
        effects: { evidence: 2, supplies: -1, danger: 1 },
        artSubject:
          'Vesper hands a battered leather map case to a weasel peddler who whispers into their antenna on the steps of a red-painted oven.',
      },
    ],
  },
  '5,3': {
    title: 'Three Names for One Rescuer',
    speaker: 'Vesper and three witnesses at the bell',
    kind: 'puzzle',
    opening:
      'The village bell holds three testimonies that refuse to agree. A ferryman calls the rescuer of the drowned year the moth child. A widow calls the same person the seller. A girl, now grown, calls them the one who came back for me. The bell will only ring true when its rope is tied to the right name, and the mask market has sent a runner offering a fourth, official name for sale. Vesper does not need anyone to tell them who the rescuer was. They stand very still while all three names echo off the water.',
    artSubject:
      'Vesper stands beneath a great bronze bell holding three knotted ropes, each labeled with a paper tag, while three witnesses wait in the flooded square and a market runner holds up an envelope.',
    choices: [
      {
        id: 'tie-all-three',
        label:
          'Tie all three names to the rope and let the bell ring with the contradiction',
        outcome:
          'Vesper braids the three ropes into one. The bell rings with a cracked, honest note that every witness recognizes as theirs. None of them is satisfied, and the widow says plainly that sharing a rope with the word rescuer insults her dead. But the bell is true again, and the market runner leaves without a sale.',
        flag: 'rescuer-names-braided',
        effects: { trust: 1, evidence: 1, danger: -1 },
        artSubject:
          'Vesper braids three knotted ropes together under a bronze bell as a widow turns away and a grown woman in a fishing coat watches with crossed arms.',
      },
      {
        id: 'ask-each-witness',
        label:
          'Ask each witness which name they want the record to keep and abide by it',
        outcome:
          'Vesper asks them one by one, privately. The ferryman wants moth child. The grown girl surprises everyone and chooses the seller: she says she wants the truth to cost something. The widow refuses to choose. The bell takes two names and rings half-true, and the official runner sells his clean name to the archive instead.',
        flag: 'rescuer-name-chosen',
        effects: { trust: 2, evidence: -1, supplies: -1 },
        artSubject:
          'Vesper kneels in shallow water listening to a grown woman in a fishing coat whisper, while a ferryman and a widow wait apart beneath a great bell.',
      },
    ],
  },
  '6,3': {
    title: 'Scylla’s Conch Collection',
    speaker: 'Vesper and Scylla',
    kind: 'companion',
    opening:
      'Scylla has made the flooded end of Bell Square her court. Waist-deep in seawater, her sturdy shoulders squared and her hair pinned with immaculate propriety, she is collecting testimony in conch shells from anyone who volunteers, and refusing anyone who is pushed. A coral bell hangs from a borrowed lamppost beside her, rung in the order of promises given. She informs Vesper, with great courtesy, that the transfer office has offered to verify her witnesses by badge, and that she would rather eat the badge. She wants a cartographer who knows which questions not to ask.',
    artSubject:
      'Scylla, a sturdy mermaid princess with neatly pinned hair, sits waist-deep in a flooded village square holding a conch shell to a villager’s lips while Vesper wades toward her beside a coral bell on a lamppost.',
    choices: [
      {
        id: 'sort-by-scratches',
        label:
          'Help Scylla sort the shells by the visible promise-marks on her coral bell',
        outcome:
          'Vesper reads the scratch order and Scylla files each conch accordingly. Her collection becomes legible and court-ready, and she joins Vesper with a satchel of sorted witnesses. The neatness has a price: three shells whose promises left no mark fall outside the order, and Scylla, frowning, sets them aside as unverified.',
        flag: 'scylla-shells-sorted',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'Scylla lays conch shells in tidy rows along a stone wall above floodwater while Vesper points to scratched marks on a coral bell.',
      },
      {
        id: 'cross-examine',
        label:
          'Invite the witnesses to test each other’s promises before Scylla accepts any',
        outcome:
          'Scylla calls the volunteers into a ring and lets them challenge one another, courteously and then less courteously. Two testimonies collapse; one unexpected witness, a shy heron, proves the most reliable of all. Scylla joins Vesper with fewer shells and more faith in them, and a reputation among the badges as a troublemaker.',
        flag: 'scylla-shells-tested',
        effects: { trust: 2, evidence: 1, danger: 1 },
        artSubject:
          'A ring of villagers and a shy heron argue in a flooded square as Scylla presides from the water and Vesper listens with antennae raised.',
      },
    ],
  },
  '7,3': {
    title: 'The Attic Where the First Map Was Cut',
    speaker: 'Vesper and Hollin',
    kind: 'memory',
    opening:
      'The archive attic smells exactly as it did when Vesper was nine: cedar, paste and mouse. Here, by the round window, they cut the first safe-path map out of a larger village chart, sharpening the knife on a roof tile. The memory comes back whole. Hollin, puffing up the ladder, points out that the knife could now cut a direct route from this attic into the alcove below, where the conch witnesses are resting. It would save them the flooded stairs. The alcove has no door because the witnesses asked for none.',
    artSubject:
      'Vesper kneels by a round attic window in a cedar archive, a silver map-knife in hand, remembering their child self cutting paper at the same spot in dusty afternoon light.',
    choices: [
      {
        id: 'keep-alcove-sealed',
        label:
          'Refuse to cut into the alcove and carry the witnesses’ meals down the flooded stairs',
        outcome:
          'Vesper sets the knife aside. They make six trips down the flooded stairs with rice and tea, wings soaked heavy. The witnesses keep a room nobody can enter uninvited. Vesper catches a chill that will slow them for days, and Hollin, who means well, files a report calling the stairs a hazard.',
        flag: 'attic-alcove-sealed',
        effects: { trust: 2, supplies: -1, danger: 1 },
        artSubject:
          'Vesper, wings soaked and drooping, carries a tray of rice bowls down flooded wooden stairs inside a dim cedar archive.',
      },
      {
        id: 'ask-alcove',
        label:
          'Slip a question under the alcove curtain asking whether the witnesses want a route',
        outcome:
          'The answer comes back on the same paper: a small door, only openable from inside. Vesper cuts exactly that. The witnesses now have a faster way out and in, and Vesper has carved a real passage in the archive’s bones that any later knife-holder could find and widen.',
        flag: 'attic-door-requested',
        effects: { trust: 1, supplies: 1, evidence: -1 },
        artSubject:
          'Vesper carefully traces a small door shape in the cedar floor of an archive attic, a folded note with a drawn door lying beside the knife.',
      },
    ],
  },
  '8,3': {
    title: 'The Bell Tower Filing',
    speaker: 'Vesper, Hollin and the white door',
    kind: 'challenge',
    opening:
      'At the top of the bell tower, where Vesper used to watch the whole valley, the white door has appeared again, pressed into the wall like a stamp. Hollin has followed it here with a form. Under the office rules that have soaked into the archive, every door must be filed with a destination, a capacity and a list of authorized users. The door has none of these, and the form has turned it from humming white to an anxious grey. Hollin is not cruel. He simply cannot imagine an unfiled door being safe.',
    artSubject:
      'In a high bell tower, a badger clerk in sleeve garters holds a filing form toward a greying white door set into the wall as Vesper stands between them with wings half-raised.',
    choices: [
      {
        id: 'file-blank',
        label:
          'Persuade Hollin to file the door with every field marked left open by right',
        outcome:
          'Vesper talks Hollin through it: a field can be left open on purpose, if the reason is written. They write: future of persons not present. Hollin hesitates, then stamps it. The door brightens. Hollin will have to defend the strangest filing of his career to the transfer office, and he is genuinely scared to.',
        flag: 'tower-door-filed-open',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'A nervous badger clerk stamps a mostly blank form against a bell-tower wall as a white door beside him glows brighter.',
      },
      {
        id: 'challenge-filing',
        label:
          'Challenge the filing rule itself by ringing the bell until the square gathers to judge it',
        outcome:
          'Vesper hauls the bell rope and keeps hauling. The whole drenched square gathers below. When Hollin reads the rule aloud, people laugh, then argue, then vote that no door in Hoshimori needs a list of users. Hollin tears up the form in public. The transfer office takes the vote personally, and badges begin appearing at the tower stair.',
        flag: 'tower-rule-challenged',
        effects: { evidence: 1, trust: 1, danger: 2 },
        artSubject:
          'Vesper hangs on a thick bell rope in a tower as a crowd fills the flooded square below and a badger clerk tears a form in half.',
      },
    ],
  },
  '1,4': {
    title: 'Loaves Priced in Paths',
    speaker: 'Vesper and Seri the baker',
    kind: 'merchant',
    opening:
      'The Red Oven’s counter smells of sesame and hot iron. Seri’s price board, chalked in a hurried hand since the reactor was bolted under the hearth, has changed currency: one loaf costs one path its buyer knows. Customers whisper a route into a speaking tube, and the tube carries it down to the engine. A glass jar by the till holds the paid routes as curls of glowing smoke. Vesper recognizes the shape of three of them. They are paths to the hidden houses, paid by hungry people who did not know who walked them.',
    artSubject:
      'Vesper, grey moth wings folded tight, stares at a glass jar of curling glowing smoke beside a bakery till as a round-faced baker in a flour-dusted apron slices warm bread behind the counter.',
    choices: [
      {
        id: 'buy-back-paths',
        label:
          'Buy back the jar of routes with Vesper’s own supplies and release them to their walkers',
        outcome:
          'Seri accepts dried fish, lamp oil and Vesper’s spare blanket for the jar. Vesper uncorks it at the hidden-house paths, where the smoke slips home into the ground. The routes are safe again. Vesper will sleep cold tonight, and the reactor below, starved of three paths, makes the next batch of bread come out grey and small.',
        flag: 'oven-paths-bought-back',
        effects: { supplies: -2, trust: 2, danger: -1 },
        artSubject:
          'Vesper uncorks a glass jar on a dark village path as curls of glowing smoke sink back into the earth between hidden doorways.',
      },
      {
        id: 'consent-only-paths',
        label:
          'Convince Seri to accept only routes their walkers agree to make public',
        outcome:
          'Seri chalks a new rule: public roads only, and the buyer must say so aloud. Most customers pay with the market lane or the shrine steps. Bread keeps flowing, thinner. The jar still holds the three hidden routes already paid, and Seri cannot return them without shutting the engine down, which she is not ready to do.',
        flag: 'oven-paths-public-only',
        effects: { supplies: 1, evidence: 1, danger: 1 },
        artSubject:
          'A baker chalks a new rule onto a bakery price board while a customer speaks into a brass tube and Vesper eyes a corked jar of glowing smoke.',
      },
    ],
  },
  '2,4': {
    title: 'The Photograph in the Rice Sack',
    speaker: 'Vesper and Morrow',
    kind: 'memory',
    opening:
      'Burr delivers rice to the Oven’s back door, and when Vesper helps split the last sack a photograph slides out with the grain. It is an Earth picture taken from across a sunny park: two adults at a small café table, leaning in, hands apart, blurred passers-by in the foreground. One of them is Morrow. Morrow, short dark hair falling into their eyes and grey cardigan sleeves pushed to the elbow, is kneading dough at the next table and stops mid-fold. The camera stood too far away to catch words. Vesper holds the photograph out, careful not to say what they think it shows.',
    artSubject:
      'Vesper holds out a small Earth photograph of two adults at a café table as Morrow, an androgynous adult in their thirties with short dark hair and a grey cardigan, freezes with hands deep in bread dough.',
    choices: [
      {
        id: 'challenge',
        label: 'Leave room for refusal in whatever the photograph seems to say',
        outcome:
          'Vesper tells Morrow they will not guess. The conversation may have ended with goodbye; a photograph cannot tell anyone whether the people in it consented to what followed. Morrow takes the picture and says nothing for a long while. Then they go back to kneading, harder than needed, and Vesper learns that leaving a question open can also leave a friend alone with it.',
        flag: 'cafe-refusal-room',
        effects: { trust: 1, evidence: -1 },
        artSubject:
          'Morrow kneads dough with a photograph propped against a flour jar while Vesper sits quietly on a sack of rice near the oven’s back door.',
      },
      {
        id: 'hold',
        label:
          'Notice the courage it took for those two people to sit down and speak',
        outcome:
          'Vesper says only that it looks like a brave conversation. Morrow admits they fear what was decided at that table. They also know, from a life lived among humans, that difficult talks are not always disasters. They tuck the photograph into a cardigan pocket, and they ask Vesper to help them carry flour, which is the closest Morrow comes to thanks.',
        flag: 'cafe-courage-noticed',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Morrow, in a flour-dusted grey cardigan, slips a photograph into a pocket and hoists a flour sack with Vesper at the steaming back door of a red-painted bakery.',
      },
    ],
  },
  '3,4': {
    title: 'The Control-Room Lantern',
    speaker: 'Vesper and Morrow',
    kind: 'companion',
    opening:
      'Beneath the bakery, a ladder drops into a reactor control room with tatami on the floor and analogue dials on every wall. The night shift are villagers in borrowed lab coats. Above the main console hangs a paper lantern that shows each worker the home they did not choose, flickering whenever their attention drifts, which is how the engine keeps them at their dials. Morrow, following Vesper down, looks up into it and goes very quiet. They do not say what they see, and Vesper does not ask.',
    artSubject:
      'In an underground control room with tatami floors and analogue dials, Morrow, a dark-haired androgynous adult in a grey cardigan, gazes up at a glowing paper lantern while Vesper stands beside villagers in borrowed lab coats.',
    choices: [
      {
        id: 'workers-choose-light',
        label:
          'Retune the lantern so each worker sees a destination they chose themselves',
        outcome:
          'Morrow steadies the ladder while Vesper rewires the lantern by touch. The night shift sees ordinary hopes: a pond, a sister’s kitchen, a quiet room. Several stand up and simply leave for them. Morrow joins Vesper, moved. The dials drift without watchers, and an alarm begins its slow climb from amber toward red.',
        flag: 'control-lantern-chosen',
        effects: { trust: 2, danger: 2 },
        artSubject:
          'Night-shift villagers in lab coats climb a ladder out of a control room as a lantern glows warm above unwatched dials and Morrow smiles at Vesper.',
      },
      {
        id: 'cover-control-lantern',
        label:
          'Cover the lantern with Morrow’s cardigan until the workers can be asked what they want',
        outcome:
          'Morrow peels off their grey cardigan and drapes it over the lamp. The workers blink as though waking. Vesper asks each one, quietly, whether they want to stay on shift; most do, for the pay, and two leave. Morrow joins Vesper, shivering in shirtsleeves. The engine runs on, the Oven keeps feeding the village, and nobody yet knows what it is burning.',
        flag: 'control-lantern-covered',
        effects: { trust: 1, evidence: 1, supplies: 1 },
        artSubject:
          'Morrow, in shirtsleeves, drapes a grey cardigan over a paper lantern above a control console as blinking workers turn to Vesper in a dim underground room.',
      },
    ],
  },
  '4,4': {
    title: 'The Road Vesper Sold, Paved in Ash',
    speaker: 'Vesper and Seri',
    kind: 'memory',
    opening:
      'The road Vesper sold as a child still runs south of the Oven, but it no longer reaches the river. It dips into the reactor wing, and its surface is paved with printed ash: every experiment ever run on someone found by that road. Vesper walks it slowly. They remember the buyer’s coins, warm from his glove, and the friend whose fever those coins broke. Seri follows at a distance, wiping her hands on her apron again and again. She says she never knew where the Oven’s first volunteers came from. She is lying, and both of them know it.',
    artSubject:
      'Vesper walks alone down a narrow road paved with grey printed ash sheets that slopes into a glowing underground doorway, as a baker in an apron follows far behind wringing her hands.',
    choices: [
      {
        id: 'keep-ash-road',
        label:
          'Seal the ash road as a memorial that names nobody and punishes nobody',
        outcome:
          'Vesper lacquers the ash so it cannot blow away and posts a single sign: people were taken this way. Seri helps without a word. The road becomes a place villagers visit and leave rice. It protects every survivor’s privacy, and it lets Seri, and Vesper, off easier than some of those survivors think either deserves.',
        flag: 'ash-road-memorial',
        effects: { trust: 1, evidence: 1, danger: -1 },
        artSubject:
          'Vesper brushes clear lacquer over an ash-paved road while a baker sets a small bowl of rice beside a plain wooden memorial sign.',
      },
      {
        id: 'walk-with-survivors',
        label:
          'Invite any survivor who wishes to walk the road with Vesper and testify at its end',
        outcome:
          'Four survivors come. One walks with Vesper; three walk well apart from them. At the reactor door each testifies, and Seri finally admits she chose not to ask where the first volunteers came from. The testimony is powerful and on record. So is Seri’s shame, and so are four faces the transfer office can now look for.',
        flag: 'ash-road-walked',
        effects: { evidence: 2, trust: 1, danger: 2 },
        artSubject:
          'Four survivors and Vesper stand at a glowing reactor doorway at the end of an ash road while a baker in an apron covers her face.',
      },
    ],
  },
  '5,4': {
    title: 'The Firebox Wants a Name',
    speaker: 'Vesper, Seri and a hungry queue',
    kind: 'challenge',
    opening:
      'Tonight the Oven’s firebox will not light. Its iron mouth has stamped a demand into its own door in mask-market lettering: one legal name, any owner, to fuel the evening bake. A queue of forty hungry people stands in the drizzle outside. Seri holds up a name bought at the market this morning, tucked in its little envelope. It is warm. Somebody, somewhere, will forget what they are called the moment it burns. Vesper looks at the queue, at the envelope, and at the firebox glowing faintly with appetite.',
    artSubject:
      'Vesper stands before a cold iron firebox with a demand embossed on its door as a baker holds out a small paper envelope and a long hungry queue waits in drizzle.',
    choices: [
      {
        id: 'refuse-stolen-fuel',
        label:
          'Refuse the bought name and bake the night’s bread on plain wood instead',
        outcome:
          'Vesper and Seri haul cedar offcuts from the bridge and coax the old outer hearth alight. The bread comes out late, lopsided and barely enough for half the queue. Nobody forgets their name tonight. The other half go home hungry and some say loudly that a stranger’s name would have been a fair price for their children’s supper.',
        flag: 'firebox-name-refused',
        effects: { trust: 1, supplies: -2 },
        artSubject:
          'Vesper and a baker feed cedar offcuts into a smoky old outer hearth as lopsided loaves cool on a rack and half the queue turns away.',
      },
      {
        id: 'find-name-owner',
        label:
          'Trace the warm name back to its owner and ask what they would have the bakery do',
        outcome:
          'The envelope belongs to a ferryman’s daughter who sold it to pay a fine at the badge gate. She is furious, and frightened, and asks for it back. Vesper returns it. She then offers something nobody expected: a song her grandmother sang, freely given, to light the box once. It burns. She will never quite remember the tune again, and says that was hers to spend.',
        flag: 'firebox-name-returned',
        effects: { trust: 2, evidence: 1, supplies: 1 },
        artSubject:
          'A young woman in a ferry coat sings into an iron firebox as it flares alight, Vesper holding a returned paper envelope at her side.',
      },
    ],
  },
  '6,4': {
    title: 'The Bell Stuck in the Flue',
    speaker: 'Vesper and the Oven’s apprentices',
    kind: 'treasure',
    opening:
      'Something has been ringing inside the Red Oven’s chimney for three days. When Vesper climbs the flue with soot in their antennae, they find a coral bell wedged where the brick should narrow, hot as a kettle, seawater hissing from its lip. The chimney no longer ends in sky. Above the bell it bends sideways and downhill toward the sea gate, and the bell is the stopper keeping the palace tide out of the bread. It is ringing a promise sequence over and over, waiting for someone to answer it correctly.',
    artSubject:
      'Vesper braces inside a soot-black brick chimney, grey moth wings pressed flat, reaching for a hot coral bell wedged in the flue as seawater hisses and steams from its rim.',
    choices: [
      {
        id: 'answer-visible-sequence',
        label:
          'Answer the bell’s sequence from the promise-marks scorched on its coral',
        outcome:
          'Vesper raps the sequence with the knife handle and the bell loosens, cooling in their hands. It is a true sea-court tide-key, worth a fortune to anyone wanting to open the palace gate. The chimney, unstoppered, gulps a mouthful of seawater, and the night’s bread floods. The apprentices spend the night bailing.',
        flag: 'flue-bell-freed',
        effects: { evidence: 2, supplies: -1, danger: 1 },
        artSubject:
          'Vesper climbs out of a chimney top cradling a cooling coral bell while seawater gushes from the flue below over a bakery yard.',
      },
      {
        id: 'apprentice-witnesses',
        label:
          'Call the Oven’s apprentices to remember aloud which promises the bakery made',
        outcome:
          'The apprentices gather at the hearth and argue about every promise: free bread at festival, no questions at the door, nobody turned away. The bell accepts their version only partly, and slides loose a finger’s width at a time, letting the tide trickle rather than gush. Vesper gets the bell by dawn. The apprentices get a long night and a clearer idea of what the Oven owes.',
        flag: 'flue-bell-witnessed',
        effects: { trust: 2, evidence: 1 },
        artSubject:
          'Bakery apprentices in flour-white aprons sit around a hearth calling promises up a chimney while a trickle of seawater runs down the bricks.',
      },
    ],
  },
  '7,4': {
    title: 'The Moth Made of Every Map',
    speaker: 'Vesper, Morrow and the Shaving Moth',
    kind: 'monster',
    opening:
      'The reactor’s heat has woken the scrap bin behind the Oven, where decades of map offcuts were thrown. They have assembled into a moth as tall as the bakery, wings stitched from every paper route Vesper ever trimmed, eyes made of compass roses. It is burning at the edges and blundering toward light. The brightest light nearby is the lamp in the bakery’s sleeping loft, where the apprentices and two families without houses are asleep. The Shaving Moth is offering Vesper a choice the way moths do: follow it into the flame, or turn it.',
    artSubject:
      'A towering moth assembled from burning paper map offcuts with compass-rose eyes blunders toward a lit bakery loft window at night as Vesper and Morrow stand below in its glow.',
    choices: [
      {
        id: 'lure-away',
        label:
          'Lure the Shaving Moth away with Vesper’s own lantern and refuse its shortcut through the loft',
        outcome:
          'Vesper lights their lamp and flies a long, slow arc away from the loft, over the paddies, toward the river. The Moth follows, singeing Vesper’s wingtips the whole way. Morrow wakes the loft. Nobody is hurt but Vesper. At the river the Moth drowns and dissolves, and with it every original offcut of the routes Vesper ever drew, gone for good.',
        flag: 'shaving-moth-lured',
        effects: { trust: 2, danger: 1, evidence: -2 },
        artSubject:
          'Vesper flies low over moonlit rice paddies holding a lantern, wingtips smoking, as a vast burning paper moth follows toward a dark river.',
      },
      {
        id: 'build-chimney-together',
        label:
          'Rouse the loft and build a fire chimney together that the Moth can climb out of safely',
        outcome:
          'Morrow and the apprentices tear open the loft roof while the families carry ladders. The Moth goes up the new hole and out into the sky, burning to ash high above everything. The loft loses its roof two days before the rains. The offcuts fall back as ash maps across the village, readable by anyone, routes included.',
        flag: 'shaving-moth-released',
        effects: { evidence: 1, supplies: -1, danger: 2 },
        artSubject:
          'Apprentices and families tear open a bakery loft roof as a burning paper moth climbs out into the night sky, scattering ash maps over rooftops.',
      },
    ],
  },
  '8,4': {
    title: 'Tomorrow’s Donor Roster',
    speaker: 'Vesper, Morrow and Seri',
    kind: 'challenge',
    opening:
      'The inner door of the Red Oven has turned white. On it the reactor has printed a roster for tomorrow’s bake, with every donor slot empty and a demand beneath: assign them before dawn or the hearth goes cold for a week. Seri stands with chalk in her fist. Morrow points out, flatly, that this is a scheduling problem pretending to be a moral one, and that the office in Morrow’s other life ran on exactly this trick. Vesper looks at the blank roster and sees a map of people who have not been asked yet.',
    artSubject:
      'A baker clutching chalk stands before a white oven door printed with an empty roster grid as Morrow and Vesper flank her in the red glow of the hearth room.',
    choices: [
      {
        id: 'leave-roster-blank',
        label: 'Leave every slot blank and let the hearth go cold for the week',
        outcome:
          'Vesper takes the chalk from Seri gently and puts it in their own pocket. Dawn comes; the hearth goes dark. The village eats cold rice and pickles for seven days and grumbles enormously. Nobody burns a memory. Morrow, who has missed a few office meals, organizes a soup line in the square, and it is the first meal in years that costs nothing but time.',
        flag: 'roster-left-blank',
        effects: { trust: 2, supplies: -2, danger: -1 },
        artSubject:
          'Villagers queue in a square for soup ladled by Morrow, a dark-haired adult in a grey cardigan, beside a cold, dark red oven at dawn.',
      },
      {
        id: 'negotiate-roster',
        label:
          'Negotiate with the Oven for a roster written only by volunteers who can withdraw at any time',
        outcome:
          'Morrow drafts the clause, Vesper argues it through the speaking tube, and the Oven grudgingly accepts a voluntary roster with a withdrawal line. Three people sign. Two withdraw by midnight, and the reactor punishes the hearth with half heat. The bread is meager but honest, and the Oven has now admitted on paper that it can be refused.',
        flag: 'roster-voluntary',
        effects: { evidence: 2, supplies: -1, trust: 1 },
        artSubject:
          'Morrow writes on a long scroll pressed against a white oven door while Vesper speaks into a brass tube and a baker watches three names appear.',
      },
    ],
  },
  '1,5': {
    title: 'Tickets to Vesper’s Childhood',
    speaker: 'Vesper and Okko the mask vendor',
    kind: 'memory',
    opening:
      'The mask market court floats on canals the sea gate has filled, its stalls lashed to rafts. One booth sells tickets to a remembered childhood, and its bestseller is Vesper’s. For a silver a tourist puts on a moth-paper mask and walks, in memory, the stepping-stone route at age six, counting houses under their breath. Okko, the fox-faced mask vendor next door, says it has been popular all week. Vesper watches a giggling office worker lift the mask and describe the fourth house aloud, perfectly, down to the color of its door.',
    artSubject:
      'Vesper stands stricken on a canal raft beside a ticket booth as an office worker in a lanyard lifts a moth-paper mask from their face and laughs, while a fox-faced vendor watches from a neighboring stall.',
    choices: [
      {
        id: 'close-ticket-line',
        label:
          'Buy out the ticket booth and burn the moth-paper masks before anyone else walks the route',
        outcome:
          'Vesper trades their last silver and Okko’s help to haggle the booth-keeper down. The masks go into a canal brazier one by one, and the stepping-stone memory stops being for sale. Vesper loses the clearest copy of their own childhood they will ever see, and the booth-keeper simply reopens selling someone else’s by evening.',
        flag: 'childhood-tickets-burned',
        effects: { trust: 1, supplies: -2, danger: -1 },
        artSubject:
          'Vesper feeds moth-paper masks into a canal brazier on a floating market raft, sparks drifting over dark water as a fox-faced vendor looks on.',
      },
      {
        id: 'consent-ticket-edit',
        label:
          'Rewrite the ticket so it shows only what the stepping-stone families agree to share',
        outcome:
          'Vesper visits the hidden houses by night and asks. Two families allow the stones themselves to be remembered, nothing past them. Okko helps recut the masks. Tourists now get a short, strange memory of a child hopping across water toward fog. Business drops, and the booth-keeper blames Vesper loudly to anyone near the canal.',
        flag: 'childhood-tickets-edited',
        effects: { trust: 2, evidence: 1, danger: 1 },
        artSubject:
          'A fox-faced vendor recuts a moth-paper mask with tiny scissors while Vesper holds a sketch of stepping stones fading into fog.',
      },
    ],
  },
  '2,5': {
    title: 'The Unmasking Ration Line',
    speaker: 'Vesper, Grisel and a line of masked villagers',
    kind: 'challenge',
    opening:
      'Grisel has set up a ration table at the edge of the market court with Burr’s rice cart behind her. Every masked villager gets a bowl, provided they lift their mask for identity verification. It is office policy, the laminated sign says, and Briar law agrees that a wolf may know any face it feeds. Half the line wears masks because their faces were on the posters Vesper’s sold map helped print. They are hungry enough to unmask anyway. Vesper sets down their satchel at the front of the line and does not move.',
    artSubject:
      'Vesper stands blocking the front of a ration line at a canal-side table where a grey wolf with an office badge holds a bowl of rice, masked villagers waiting behind.',
    choices: [
      {
        id: 'unmask-self',
        label:
          'Unmask Vesper alone and demand rice for the whole line on that one face',
        outcome:
          'Vesper lifts their own face to Grisel and invokes Briar feast-law: one face may stand for a household. Grisel considers, then decides the masked line is Vesper’s household for the day. Everyone eats. Grisel now has Vesper registered as head of forty strangers, every one of their future debts and crimes legally Vesper’s to answer for.',
        flag: 'ration-line-one-face',
        effects: { supplies: 1, trust: 2, danger: 2 },
        artSubject:
          'Vesper stands unmasked before a badged wolf at a ration table as a long line of masked villagers receives bowls of rice behind them.',
      },
      {
        id: 'question-policy',
        label:
          'Ask Grisel what the verification is for and who reads the faces she collects',
        outcome:
          'Grisel genuinely does not know; she was told it was for safety. Vesper reads the fine print on her sign: faces go to the transfer office for reassignment. Grisel stares at the sign for a long time, then folds the table. The line disperses unfed, but unseen, and Grisel walks off to have a conversation with her supervisor that may not go well for her.',
        flag: 'ration-policy-questioned',
        effects: { evidence: 2, supplies: -1, trust: 1 },
        artSubject:
          'A grey wolf in an office badge squints at the fine print of a laminated sign as Vesper points to a line of text and masked villagers drift away.',
      },
    ],
  },
  '3,5': {
    title: 'The Lantern Mask',
    speaker: 'Vesper and Okko',
    kind: 'treasure',
    opening:
      'Okko keeps one mask under a silk cloth and shows it only to cartographers. It is a lantern folded into a face, and whoever wears it sees the home they did not choose, clearly enough to walk to it. Okko says the transfer office has offered a fortune for it: wear it on any villager and they will stride obediently to the reassignment they least wanted, believing it fated. Okko would rather give it to Vesper than sell it. The fox’s ears flatten as a wolf’s shadow crosses the canal.',
    artSubject:
      'A fox-faced mask vendor lifts a silk cloth to reveal a glowing mask shaped from a folded paper lantern as Vesper leans close on a floating market stall at dusk.',
    choices: [
      {
        id: 'wear-and-choose',
        label:
          'Have Vesper wear the mask once to prove it can be resisted, then let the wearer choose',
        outcome:
          'Vesper puts it on and sees a tidy office desk with their name plate, in a city they never wanted. Their feet start walking. Okko pulls them back by the antennae. Vesper says the path aloud and refuses it, and the mask flickers, learning it can be refused. It is a useful treasure now, and Vesper has a stiff neck and a desk they cannot unsee.',
        flag: 'lantern-mask-resisted',
        effects: { evidence: 1, danger: 1, supplies: 1 },
        artSubject:
          'Vesper in a glowing lantern mask strides toward a canal edge while a fox-faced vendor hauls them back by their feathery antennae.',
      },
      {
        id: 'hide-lantern-mask',
        label:
          'Hide the mask in Vesper’s map case, unlit, until its wearers can consent',
        outcome:
          'Vesper wraps the mask in their spare map cloth and seals it. Nobody will be marched anywhere by it. Okko is relieved and gives Vesper tea and a blank mask for free. But the transfer office now knows the mask has changed hands, and a cartographer carrying it is a target on every badge’s list.',
        flag: 'lantern-mask-hidden',
        effects: { trust: 2, danger: 2, evidence: -1 },
        artSubject:
          'Vesper ties a cloth bundle into a leather map case while a fox-faced vendor pours tea beside a floating market stall under a wolf’s distant silhouette.',
      },
    ],
  },
  '4,5': {
    title: 'The Ash Face',
    speaker: 'Vesper, Okko and the Ash Face',
    kind: 'monster',
    opening:
      'Something has crawled out of the ash drifts that blow down from the Oven: a mask made of failed experiment pages, gray and brittle, crawling over the market rafts on paper fingers. It wants a face. It has already tried Okko’s stock and rejected every one as fake. Now it clings to the cheek of a sleeping porter, peeling at his features. Vesper can read the records printed on its back. The Ash Face is made from the trial sheets of people who lost their own faces to the bread, and it is looking for them.',
    artSubject:
      'A crawling grey mask made of brittle printed ash pages clings to the cheek of a sleeping porter on a market raft as Vesper reaches toward it with a lantern.',
    choices: [
      {
        id: 'offer-ash-records',
        label:
          'Coax the Ash Face off the porter by reading its records aloud with no names attached',
        outcome:
          'Vesper reads each sheet as testimony, house numbers swallowed, the trial results spoken plainly. The Ash Face loosens its grip, as if being remembered is enough. It settles into Vesper’s hands, quiet. The porter wakes unharmed but furious that a stranger knelt over him reading horrors, and the Face is now Vesper’s to carry.',
        flag: 'ash-face-calmed',
        effects: { evidence: 1, trust: 1, supplies: -1 },
        artSubject:
          'Vesper kneels on a market raft reading aloud from a crumbling grey ash mask cradled in both hands while a porter sits up glaring.',
      },
      {
        id: 'burn-ash-face',
        label:
          'Tear the Ash Face away and burn it in Okko’s brazier before it takes the porter',
        outcome:
          'Vesper rips it free, ash flaking down their arms, and Okko thrusts it into the brazier. It screams in many voices. The porter keeps his face. The records of those failed trials are gone forever, and the families who were looking for them in the ash will never find them now.',
        flag: 'ash-face-burned',
        effects: { danger: -1, evidence: -2, trust: 1 },
        artSubject:
          'Vesper hurls a shrieking grey ash mask into a canal-side brazier as a fox-faced vendor shields a startled porter from flying sparks.',
      },
    ],
  },
  '5,5': {
    title: 'The Auction of a Legal Name',
    speaker: 'Vesper, Char and the court auctioneer',
    kind: 'challenge',
    opening:
      'In the center of the market court a crane auctioneer is selling a single legal name, guaranteed by the transfer office, valid in village, city and sea court alike. Bidding is brisk. Char floats in the canal below the dais, black lipstick, dark fin, chin on her folded arms, heckling the bidders. She tells Vesper the name belongs to a selkie washerwoman who signed it away for a ferry seat, and that the washerwoman is in the crowd, too ashamed to bid. Char thinks Vesper should just steal it. Vesper is not sure Char is wrong.',
    artSubject:
      'Char, a sturdy goth mermaid princess with black lipstick and a dark fin, lounges in a canal below an auction dais where a crane auctioneer holds up a sealed paper name as Vesper watches from a raft.',
    choices: [
      {
        id: 'stop-the-sale',
        label:
          'Climb the dais and declare the name unsellable under the sea court’s law of faces',
        outcome:
          'Char backs Vesper by citing, loudly and accurately, an obscure palace edict that no face or name may be auctioned in tidal waters. The crowd turns. The crane, outmaneuvered, voids the sale. The washerwoman gets her name back in public, which she did not want, and the transfer office notes that a moth and a mermaid can disrupt its markets.',
        flag: 'name-auction-voided',
        effects: { trust: 1, evidence: 1, danger: 2 },
        artSubject:
          'Vesper stands on an auction dais with wings spread as Char rises from the canal pointing at a startled crane auctioneer and the crowd turns.',
      },
      {
        id: 'hear-the-washerwoman',
        label:
          'Find the washerwoman in the crowd and ask her what she wants done before anyone acts',
        outcome:
          'She says, in a whisper, that she wants the ferry seat more than the name. Char is disgusted and says so. Vesper respects the choice and instead buys the washerwoman a second ferry seat with their remaining coin, so that the name can be bought back next market day. It costs everything Vesper carries, and Char swims off sulking.',
        flag: 'name-auction-heard',
        effects: { trust: 2, supplies: -2 },
        artSubject:
          'Vesper bends to listen to a shy selkie washerwoman at the edge of a crowded market court while Char splashes away down the canal in disgust.',
      },
    ],
  },
  '6,5': {
    title: 'Royal Portraits, Slightly Wrong',
    speaker: 'Vesper, Char and a portrait seller',
    kind: 'merchant',
    opening:
      'A portrait seller has a whole raft of paintings of the twin mermaid princesses, sold to tourists as authentic palace likenesses. Each comes with a coral bell that rings when its portrait is genuine. Char inspects them with professional contempt: in half of them Scylla is smiling, which is a forgery, and in the rest Char is wearing pink, which is a crime. But the seller insists the bells are proof, and one bell does ring, on a portrait of two girls Char goes very quiet looking at.',
    artSubject:
      'Char, a sturdy goth mermaid with black lipstick, rises from a canal to glare at a raft crowded with painted portraits of twin mermaid princesses as Vesper examines a small coral bell.',
    choices: [
      {
        id: 'expose-forgeries',
        label:
          'Prove the forgeries from the bell marks visible on each coral and post the result',
        outcome:
          'Vesper reads the scratched promise sequences and shows most bells were carved yesterday. Char announces each forgery like a verdict. The seller is ruined and tourists demand refunds. The one true portrait, of the twins as children, goes up on public display as authentic, and Char has to watch strangers stare at it.',
        flag: 'portraits-exposed',
        effects: { evidence: 2, trust: -1, supplies: 1 },
        artSubject:
          'Vesper holds up a coral bell beside a forged portrait as Char points dramatically and a crowd of tourists waves receipts at a dismayed seller.',
      },
      {
        id: 'ask-char-portrait',
        label:
          'Ask Char what she wants done with the one true portrait before anyone else decides',
        outcome:
          'Char says she wants it at the bottom of the canal where no tourist can buy her childhood. Vesper pays the seller for it and hands it over. Char sinks it herself, without explanation, and comes back up with her mascara run. She owes Vesper a favor now and resents that more than anything.',
        flag: 'portrait-given-to-char',
        effects: { trust: 2, supplies: -1, evidence: -1 },
        artSubject:
          'Char sinks beneath dark canal water holding a small framed portrait of two young mermaids as Vesper kneels at the raft’s edge.',
      },
    ],
  },
  '7,5': {
    title: 'A Mask That Fits Nobody Yet',
    speaker: 'Vesper and Okko',
    kind: 'puzzle',
    opening:
      'Okko has a commission she cannot finish: a protective mask for a family fleeing the transfer office, who asked that it fit any of them, and none of them identifiably. Every time Okko carves, the face that emerges is someone real, a neighbor or a cousin, recognizable to any badge. Vesper’s old knife could cut a perfect fit, but it cuts to match the ground, and the face it found would be the face of whoever lives closest. Okko lays out paper, wood, and a sea-court pearl glue. The family will come at dusk.',
    artSubject:
      'Vesper and a fox-faced mask maker bend over a worktable of blank wooden masks, carving tools and a jar of pearl glue on a floating stall as dusk falls over the canals.',
    choices: [
      {
        id: 'layer-features',
        label:
          'Build the mask in layers so each family member adds one feature themselves',
        outcome:
          'When the family arrives, each one carves a single line, a brow, a mouth, a cheek, and Okko glues them together. The mask resembles nobody and all of them. It works at the badge gate. It also took three hours they did not have, and the family leaves after curfew into canals with wolves on them.',
        flag: 'mask-layered-together',
        effects: { trust: 2, danger: 2 },
        artSubject:
          'A family takes turns carving lines into a single wooden mask at a canal stall as Vesper holds a lantern and a fox-faced vendor waits with glue.',
      },
      {
        id: 'blank-cut-mask',
        label:
          'Cut a deliberately unfinished mask that leaves the face to the wearer each time',
        outcome:
          'Vesper cuts a mask with eye holes and nothing else, smooth as river stone. Okko paints it the grey of fog. It passes the gate because it gives the badges nothing to match. It also gives the family nothing of themselves, and the youngest child cries when told she has to wear the empty face.',
        flag: 'mask-left-blank',
        effects: { evidence: 1, danger: -1, trust: -1 },
        artSubject:
          'A small child holds a smooth grey mask with only eye holes at a canal stall as Vesper sheathes a silver knife and a fox vendor kneels beside her.',
      },
    ],
  },
  '8,5': {
    title: 'Char Writes on the White Door',
    speaker: 'Vesper and Char',
    kind: 'companion',
    opening:
      'At the market court’s seaward edge the white door has drifted in on a raft of its own, faceless sketch of children still pinned to its panel. Char has found it first. She has uncapped a black lipstick and is about to write across the sketch in large letters. Char says the door is being precious and someone should tell it a future, any future, so it stops looming. Vesper lands on the raft. Char looks up, entirely unrepentant, and says that if Vesper wants her company on this road, they had better have a better idea.',
    artSubject:
      'Char, a sturdy goth mermaid with a dark fin, leans out of the water holding uncapped black lipstick toward a white door on a raft as Vesper lands beside her with wings flared.',
    choices: [
      {
        id: 'let-char-argue',
        label:
          'Argue it out with Char honestly and accept that she may still disagree',
        outcome:
          'Vesper says the children are not anyone’s to caption. Char says nobody asked the children whether they wanted a door either. They argue until the lanterns come on. Char caps the lipstick, unconvinced, and joins Vesper anyway, because the argument was the most fun she has had in a week. She reserves the right to write on the next door.',
        flag: 'char-argued-joined',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Char and Vesper argue nose to nose across a raft edge under glowing canal lanterns, a capped black lipstick in Char’s hand and a white door behind them.',
      },
      {
        id: 'give-char-margin',
        label:
          'Offer Char the door’s frame to write on instead, leaving the children’s sketch alone',
        outcome:
          'Char takes the compromise with theatrical reluctance and writes on the frame, in black lipstick: nobody owns this. The door seems to approve. Char joins Vesper, pleased with herself. The words are a declaration, though, and the transfer office reads them as a political claim belonging to a named princess.',
        flag: 'char-wrote-frame',
        effects: { trust: 1, evidence: 1, danger: 2 },
        artSubject:
          'Char writes across the frame of a white door in black lipstick as Vesper holds the raft steady, the sketch of faceless children untouched on the panel.',
      },
    ],
  },
  '1,6': {
    title: 'The Buyer’s Shadow',
    speaker: 'Vesper, Oren and the Buyer’s Shadow',
    kind: 'monster',
    opening:
      'The shrine of returning doors has nine doors and no walls between them, and something long-armed is slipping from one to the next. It is a shadow with no one standing in it, wearing a glove Vesper remembers: the buyer’s glove, warm with coins. The man who bought the safe route is long gone, but his hunger stayed. The Shadow feeds on every copy of the route that was never returned, and it is sniffing toward the evacuation line Oren is moving through the city door. Oren, masked and hooded, sets down a coil of rope and raises his axe.',
    artSubject:
      'A long-armed shadow wearing a single leather glove reaches between freestanding shrine doors as Oren, a fully hooded masked headsman, raises an axe and Vesper spreads grey wings in front of an evacuation line.',
    choices: [
      {
        id: 'starve-shadow',
        label:
          'Return the last copies of the route to their owners and starve the Shadow',
        outcome:
          'Vesper empties their map case: every surviving copy, given back through Ume’s box and Pip’s round. As each one leaves Vesper’s keeping the Shadow thins. It lunges once, hard, and its glove closes on Vesper’s throat before Oren’s axe pins it to the floor. The Shadow fades. Vesper is left bruised, with no record at all of the route they once drew.',
        flag: 'buyer-shadow-starved',
        effects: { trust: 2, danger: 1, evidence: -2 },
        artSubject:
          'Oren’s axe pins a fading gloved shadow to a shrine floor as Vesper, bruised and gasping, clutches an empty leather map case.',
      },
      {
        id: 'feed-public-copy',
        label:
          'Feed the Shadow a public copy the families have consented to and send it away sated',
        outcome:
          'Vesper unfolds the consented public map, the bridge and the market lane and nothing private, and lets the Shadow take it. It eats, sighs and slides out through the House door into the Briar. The evacuation line passes safely. But the Shadow is not gone, only full, and somewhere in the forest it now knows the public roads of Hoshimori by heart.',
        flag: 'buyer-shadow-fed',
        effects: { supplies: -1, danger: 2, trust: 1 },
        artSubject:
          'A gloved shadow swallows an unfolded paper map and slides away through a shrine door toward a thorny forest as evacuees hurry past behind Oren.',
      },
    ],
  },
  '2,6': {
    title: 'The Turnstile at the City Door',
    speaker: 'Vesper, Oren and Burr',
    kind: 'challenge',
    opening:
      'The shrine’s city door opens onto a subway concourse, and Oren is moving evacuees through it with ropes and chalked arrows and a stopwatch. A metal turnstile has grown into the door frame. Burr is wedged in it with his rice cart, badge flashing, insisting that nobody exits without a transfer slip and nobody returns without one either. He is crying a little. Oren points out, in his flat headsman’s voice, that the line behind them includes a woman in labor. Vesper steps up to the turnstile and looks Burr in the eye.',
    artSubject:
      'A young wolf with a flashing office badge is wedged in a metal turnstile set into a shrine doorway beside a rice cart, as Oren holds a stopwatch and Vesper approaches.',
    choices: [
      {
        id: 'break-turnstile',
        label:
          'Have Oren dismantle the turnstile so the door stays open both ways',
        outcome:
          'Oren unbolts it in four minutes with tools from under his cloak. The door swings free in both directions. The woman in labor goes through; three families come back the other way, having changed their minds. Burr is left holding a turnstile arm and a disciplinary future, and the transfer office now classifies the shrine as a security breach.',
        flag: 'turnstile-dismantled',
        effects: { trust: 1, danger: 2, supplies: 1 },
        artSubject:
          'Oren lifts a dismantled metal turnstile arm out of a shrine doorway as evacuees stream through in both directions past a stunned young wolf.',
      },
      {
        id: 'ask-burr-orders',
        label:
          'Ask Burr exactly what he was told to guard, and help him read his orders',
        outcome:
          'Burr’s orders, once Vesper reads them aloud, say to stop unregistered exits. They say nothing about returns, or about rice. Burr, relieved to have a loophole, lets everyone through as returning travelers and hands out rice to the line. It takes longer, and the woman in labor gives birth on the concourse tiles with Oren timing contractions.',
        flag: 'turnstile-orders-read',
        effects: { evidence: 1, trust: 2, danger: -1 },
        artSubject:
          'Vesper reads aloud from a crumpled order sheet as a young wolf listens with ears perked and Oren kneels beside a woman giving birth on subway tiles.',
      },
    ],
  },
  '3,6': {
    title: 'The Lantern Stair Under the Shrine',
    speaker: 'Vesper and Oren',
    kind: 'dungeon',
    opening:
      'Behind the shrine’s House door a stair descends where no stair should be, lit by paper lanterns that show each walker the home they did not choose. The stair leads down into the roots of the Briar House itself, grown under Hoshimori overnight. Oren has counted eleven evacuees who went down it looking for a safe way out and did not come back up. The lanterns are lying to them, step by step. Vesper peers down and sees, far below, one lantern burning steady and true. It is the shape of a moth.',
    artSubject:
      'A steep stair lined with glowing paper lanterns descends from a shrine doorway into tangled thorny roots as Vesper and the hooded headsman Oren look down into the dark.',
    choices: [
      {
        id: 'chalk-destinations',
        label:
          'Chalk a destination beside every lantern so evacuees can choose their own way below',
        outcome:
          'Oren hands Vesper his chalk and they label the top flight: river, orchard, bridge, back up. Anyone descending can now pick a direction against the lanterns’ lies. The labels will also guide whoever follows the evacuees down, including anyone wearing a badge.',
        flag: 'lantern-stair-chalked',
        effects: { evidence: 1, danger: 2, trust: 1 },
        artSubject:
          'Vesper chalks arrows and words onto stone steps beside glowing paper lanterns as Oren holds a coil of rope at the top of a root-lined stair.',
      },
      {
        id: 'carry-shades',
        label:
          'Carry cloth shades to cover each lantern until the lost evacuees can be asked',
        outcome:
          'Oren cuts shades from the shrine’s spare curtains and Vesper packs them. They will descend dimming every false light as they go, leaving the stair dark and honest. The shrine is left without its curtains, cold for the families sleeping there, and the dark below will be very dark indeed.',
        flag: 'lantern-stair-shades',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Oren slices shrine curtains into cloth hoods while Vesper stacks them into a pack at the top of a lantern-lit stair descending into roots.',
      },
    ],
  },
  '4,6': {
    title: 'Oren’s Ash Manifest',
    speaker: 'Vesper and Oren',
    kind: 'puzzle',
    opening:
      'Oren’s evacuation manifest has been printed, against his wishes, on Oven ash. Each sheet records which of the nine doors an evacuee left through. The doors rotate every hour, though, so the city door becomes the court door becomes the House door, and anyone wanting to return must come back through the same door at the right hour or arrive somewhere else entirely. Oren has worked out the rotation, mostly. He needs Vesper to check it. The ash is crumbling, and the manifest also records, unavoidably, where every evacuee went.',
    artSubject:
      'Oren, the hooded masked headsman, holds up fragile sheets of printed ash before a ring of nine freestanding shrine doors while Vesper traces their rotation on a slate.',
    choices: [
      {
        id: 'keep-manifest-sealed',
        label:
          'Solve the rotation and seal the manifest so it guides returns but cannot be used to punish',
        outcome:
          'Vesper finds Oren’s one error, a door that skips an hour at dusk, and corrects the timetable. They seal the ash manifest in a lacquered box only an evacuee can open with their own door’s hour. Returns become possible. The box is now the most dangerous object in the shrine, and someone has to guard it.',
        flag: 'ash-manifest-sealed',
        effects: { evidence: 1, trust: 1, danger: 1 },
        artSubject:
          'Vesper closes a lacquered box over sheets of grey ash while Oren checks a stopwatch against the ring of shrine doors at dusk.',
      },
      {
        id: 'volunteer-test-doors',
        label:
          'Test the rotation with two informed volunteers before anyone else relies on it',
        outcome:
          'Two volunteers who know the risk step through the city door at the third hour and try to return at the ninth. One returns perfectly. The other comes back through the court door soaked and shaken but alive. The rotation is proven, almost. Oren burns the ash manifest afterward and relies on the volunteers’ memory instead.',
        flag: 'doors-tested-volunteers',
        effects: { evidence: 2, danger: 1, supplies: -1 },
        artSubject:
          'A drenched volunteer stumbles out of a shrine door wrapped in seaweed as Oren steadies them and Vesper marks a slate.',
      },
    ],
  },
  '5,6': {
    title: 'A Name for the Headsman',
    speaker: 'Vesper and Oren',
    kind: 'companion',
    opening:
      'A mask-market runner has followed Oren to the shrine with a gift: a legal name, freshly printed, so that the headsman can sign the evacuation forms the transfer office now requires. Without a name Oren cannot authorize anyone’s exit. The runner says the name was surrendered by a fisherman who no longer needed it. Oren holds the envelope without opening it, hood shadowing his mask, and asks Vesper a rare direct question: whether a man who has carried an axe for a living has any business taking someone else’s name to save people.',
    artSubject:
      'Oren, the hooded masked headsman with an axe across his back, holds an unopened paper envelope in a gloved hand beside a shrine door as Vesper and a market runner stand nearby.',
    choices: [
      {
        id: 'oren-refuses-name',
        label:
          'Back Oren in refusing the name and sign the forms in Vesper’s own',
        outcome:
          'Oren returns the envelope unopened. Vesper signs every evacuation form, one by one, in their own name. Oren joins Vesper’s road, saying only that he owes them. The evacuation proceeds. Vesper’s name is now on every exit record in the shrine, and the transfer office has one moth-folk to blame for all of them.',
        flag: 'oren-name-refused',
        effects: { trust: 2, danger: 2 },
        artSubject:
          'Vesper signs a stack of forms on a shrine bench while Oren hands an unopened envelope back to a runner and evacuees file through a door behind them.',
      },
      {
        id: 'find-fisherman',
        label:
          'Find the fisherman and ask whether his name was surrendered freely',
        outcome:
          'Vesper and Oren track him to the court door, where he is mending nets. He says the name was taken for a debt and he wants it back. Oren returns it and joins Vesper, satisfied. The forms remain unsigned for half a day while Oren builds a rope bridge around the office process, and two families give up waiting and leave without records.',
        flag: 'oren-fisherman-found',
        effects: { evidence: 1, trust: 1, supplies: -1 },
        artSubject:
          'Oren hands a paper envelope to a weathered fisherman mending nets at a shrine door that opens onto a sunken coral court, Vesper watching.',
      },
    ],
  },
  '6,6': {
    title: 'The Night Vesper Rang the Shrine Bell',
    speaker: 'Vesper and Oren',
    kind: 'memory',
    opening:
      'The shrine’s small bell now hangs from the sea door and has grown a crust of coral. Vesper touches it and the memory returns: the night after the sale, when the buyer’s men came up the stepping stones, and a ten-year-old moth child rang this bell over and over to warn the hidden houses. Some families escaped because of it. Some did not hear in time. The coral bell will only ring again for someone who recites the promises of that night in order. Oren waits, rope in hand, for whatever Vesper remembers.',
    artSubject:
      'Vesper rests a hand on a small coral-crusted bell hanging in a shrine doorway open to the sea, remembering a child ringing it frantically by lantern light.',
    choices: [
      {
        id: 'recite-own-memory',
        label:
          'Recite the promises in the order Vesper remembers them, including the ones they broke',
        outcome:
          'Vesper says them aloud: I will not tell. I did. I will warn you. I tried. The bell rings, clear and unforgiving. Oren nods once. The bell is working again for the shrine’s evacuations, but Vesper’s version is now the one the sea court accepts, and it is a version that makes the child sound braver than they felt.',
        flag: 'shrine-bell-recited',
        effects: { evidence: 2, trust: 1, danger: 1 },
        artSubject:
          'Vesper rings a small coral bell in a shrine doorway with tears on their face as Oren stands silently with a coil of rope over his shoulder.',
      },
      {
        id: 'gather-survivors-bell',
        label:
          'Ask survivors of that night to come and ring the promises as they remember them',
        outcome:
          'Three come. Their orders contradict Vesper’s and each other’s. One insists the bell rang too late. The coral bell rings unevenly, accepting all of them. Nobody leaves comforted, but nobody’s memory is overwritten, and Vesper has to hear a survivor say that their warning saved her and failed her brother in the same breath.',
        flag: 'shrine-bell-survivors',
        effects: { trust: 2, supplies: -1, evidence: -1 },
        artSubject:
          'Three survivors take turns ringing a coral bell in a shrine doorway while Vesper kneels apart with wings folded and head bowed.',
      },
    ],
  },
  '7,6': {
    title: 'Where the Oven Empties into the Sea',
    speaker: 'Vesper, Oren, Seri and the Moray Bailiff',
    kind: 'challenge',
    opening:
      'The shrine’s sea door opens onto the palace gate where the Red Oven’s chimney now ends, pouring smoke and warm crumbs into the drowned court. Here sea law rules: every loaf the Oven bakes passes through the gate, and every passage is taxed one memory from whoever ate it. Nobody may refuse. The tidal hearth seal, a disc of red clay and pearl, holds that law shut on the gate, and the Moray Bailiff coils around it, collecting. Seri stands knee-deep, recognizing her own bread. Vesper’s knife hums toward the seal’s contract-string.',
    artSubject:
      'A shrine doorway opens onto a flooded coral palace gate where chimney smoke billows into green water and a huge moray eel bailiff coils around a red clay and pearl seal as Vesper, knife drawn, faces it.',
    choices: [
      {
        id: 'cut-the-contract',
        label:
          'Cut the tide contract with the moth-wing knife and seize the tidal hearth seal by force',
        outcome:
          'Vesper slashes the contract-string. Hoshimori’s knife-law and the sea court’s toll-law collide, and the gate bursts. Seawater floods the shrine to the rafters. Oren’s ropes haul out every evacuee while the Bailiff thrashes. Vesper surfaces with the tidal hearth seal in their fist and the right of refusal torn loose, half-drowned, the shrine wrecked.',
        flag: 'village-tidal-oven-cut',
        effects: { evidence: 1, danger: 2, supplies: -2 },
        artSubject:
          'Vesper bursts up through churning seawater clutching a red clay and pearl seal as Oren hauls evacuees along ropes and a moray eel thrashes in the flooded shrine.',
      },
      {
        id: 'testify-no-consent',
        label:
          'Ask Seri to testify that no donor ever consented, with Scylla’s conch witnesses beside her',
        outcome:
          'Under sea law a toll taken without consent voids if three witnesses swear to it. Seri swears first, voice cracking, that the Oven never asked. Two of Scylla’s conch witnesses follow. The Bailiff, bound by its own court, uncoils and surrenders the tidal hearth seal. Seri has confessed in public, and every family she fed now knows what she knew.',
        flag: 'village-tidal-oven-testimony',
        effects: { trust: 2, evidence: 2 },
        artSubject:
          'A baker stands knee-deep at a coral gate holding up her hand to swear as a moray eel uncoils and offers a red clay and pearl seal to Vesper.',
      },
      {
        id: 'pay-in-bread',
        label:
          'Bargain that eaters may refuse the memory toll if the Oven pays the gate in bread instead',
        outcome:
          'Vesper argues the compromise and the Bailiff accepts: anyone may now refuse the memory payment, but the Oven must send a tithe of real bread into the palace every dawn. The Bailiff hands over the tidal hearth seal. The drowned court’s hungry eat better. Hoshimori eats less, every day, for as long as the gate stands.',
        flag: 'village-tidal-oven-bread-tithe',
        effects: { supplies: -1, trust: 1, danger: -1 },
        artSubject:
          'Seri sets a basket of fresh loaves at a flooded coral gate as a moray eel accepts it and Vesper receives a red clay and pearl seal.',
      },
    ],
  },
  '8,6': {
    title: 'The Key That Only Turns Both Ways',
    speaker: 'Vesper and Oren',
    kind: 'treasure',
    opening:
      'In the shrine’s treasury, under a shelf of donated sandals, Oren finds a white iron key cast to fit no door in the shrine. Vesper recognizes the bit: the same notch pattern as the white door’s hinges. Oren tests it on a padlock and discovers that it only turns if the person holding it could also turn it back. It is a key for the Last Door, or for whatever stands in front of it. Oren, logistical to the bone, asks whether they should cut copies for everyone. Vesper knows what copies do.',
    artSubject:
      'Oren, hooded and masked, holds up a small white iron key beneath a shrine treasury shelf of donated sandals as Vesper studies its notches by lantern light.',
    choices: [
      {
        id: 'single-key',
        label:
          'Keep a single uncopied key and carry it openly so the future stays honestly open',
        outcome:
          'Vesper hangs the key on a cord around their neck where anyone can see it. It will not be copied, and no one can claim a secret right of entry. It also means one moth-folk cartographer now carries the only key to the Last Door through a village full of badges, and Oren quietly doubles Vesper’s escort.',
        flag: 'white-key-single',
        effects: { trust: 1, danger: 2 },
        artSubject:
          'Vesper ties a white iron key on a cord around their neck as Oren assigns two hooded evacuees to walk beside them out of the shrine.',
      },
      {
        id: 'key-terms',
        label:
          'Have Oren write the key’s obligations onto its tag before anyone uses it',
        outcome:
          'Oren engraves the tag in tiny block letters: opens only with return; holder answers to all who pass. The key accepts the tag and grows warm. It is safer now, and binding: whoever holds it will be answerable for every crossing made with it, and Oren puts it in Vesper’s hand.',
        flag: 'white-key-terms',
        effects: { evidence: 1, trust: 1, supplies: -1 },
        artSubject:
          'Oren engraves tiny letters onto a brass tag tied to a white iron key with a fine chisel as Vesper holds a lantern close.',
      },
    ],
  },
  '1,7': {
    title: 'The Seam Where Four Maps Meet',
    speaker: 'Vesper and Tallow',
    kind: 'puzzle',
    opening:
      'The rookery, Vesper’s old moth-wing nest of woven silk and cedar, clings to the cliff above the village. From its lip all four maps can be seen stitched together at the edges: forest, city, sea and Hoshimori, sewn with thread that glows where the worlds pull apart. Tallow, Vesper’s mother, has kept the stitching whole for months with a lamp-maker’s needle. She has not spoken to Vesper in eleven years. She points, without a greeting, to the seam where Vesper’s sold route crosses from village to wolf road. It is the thread everything else is hanging on.',
    artSubject:
      'Vesper and an older moth-folk woman with singed lamp-maker’s gloves stand at the lip of a woven silk nest above a valley where four painted maps of forest, city, sea and village are stitched together by glowing thread.',
    choices: [
      {
        id: 'unpick-route-thread',
        label:
          'Unpick the sold route from the seam thread by thread and return each strand to its household',
        outcome:
          'It takes all night. Tallow holds the lamp and corrects Vesper’s stitches without comment. As each strand comes free, Vesper sends it down to its house by moth-silk line. The seam sags but holds. By dawn the route is gone from the maps entirely, and the wolf road and village no longer quite meet; walkers will need a ferry where a path used to be.',
        flag: 'seam-route-unpicked',
        effects: { trust: 2, supplies: -1, danger: 1 },
        artSubject:
          'By lamplight, Vesper unpicks glowing threads from a stitched map seam while their mother holds a lantern close and silk lines drift down toward the village.',
      },
      {
        id: 'restitch-public',
        label:
          'Restitch the seam along a public path the households have approved',
        outcome:
          'Vesper carries the question down to the hidden houses and back up three times. The households approve a path along the public lane, away from their doors. Tallow resews the seam to it, faster and neater than Vesper could. The four maps hold firm. But Tallow says, as she ties off, that a good seam doesn’t undo a torn one, and goes inside.',
        flag: 'seam-restitched-public',
        effects: { evidence: 1, trust: 1, supplies: 1 },
        artSubject:
          'An older moth-folk woman ties off a bright new seam across stitched maps on a cliff nest while Vesper stands behind her with folded wings.',
      },
    ],
  },
  '2,7': {
    title: 'Burr Climbs the Cliff',
    speaker: 'Vesper and Burr',
    kind: 'companion',
    opening:
      'Burr comes up the cliff path dragging his rice cart and no longer wearing a badge. The transfer office fired him by memo, and the memo is pinned to his collar like a shame tag. He has brought the last of his rice to the rookery because he was once ordered to guard it and does not know where else to go. Vesper’s brother Wick watches from a nest-ledge, scowling: wolves have watched this family since the sale. Burr sits down on the cart, ears flat, and asks if anyone up here is hungry.',
    artSubject:
      'Burr, a lanky young wolf without a badge and a paper memo pinned to his collar, sits on a rice cart at the top of a cliff path beside a woven silk nest as Vesper approaches and a young moth-folk man scowls from a ledge.',
    choices: [
      {
        id: 'eat-with-burr',
        label:
          'Share Burr’s rice freely with the rookery and invite him to the road',
        outcome:
          'Vesper sits with Burr and eats, and after a while Tallow comes out with pickles. Wick refuses until his stomach overrules him. Burr joins Vesper, wagging despite himself. Wick does not forgive a wolf who once watched his door, and leaves the meal early, telling Vesper they have always chosen strangers over family.',
        flag: 'burr-joined-fed',
        effects: { trust: 1, supplies: 1, danger: 1 },
        artSubject:
          'Vesper, a young wolf and an older moth-folk woman share rice and pickles on a cliff ledge as a young moth-folk man walks away along the nest.',
      },
      {
        id: 'ask-burr-watch',
        label:
          'Ask Burr what exactly he was ordered to watch at the rookery and why',
        outcome:
          'Burr recites it: observe the moth family for contact with the sold-route households. The family has been surveilled for eleven years because of what Vesper did. Wick hears it and goes white. Burr joins Vesper, ashamed and loyal. Tallow says nothing at all, which is how Vesper knows she always suspected.',
        flag: 'burr-joined-confessed',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'A young wolf recites from a crumpled memo on a cliff ledge as a young moth-folk man stares in shock and Vesper bows their antennae.',
      },
    ],
  },
  '3,7': {
    title: 'The Lamp Tallow Made the Night Vesper Left',
    speaker: 'Vesper and Tallow',
    kind: 'memory',
    opening:
      'Tallow’s workshop is just as Vesper left it: lamp frames hanging like ribcages, oil jars, a cot under the window. On the bench sits a lantern Tallow finished the night Vesper fled the village with the money. When Vesper lifts it, the lantern shows them the home they did not choose: themself at nineteen, staying, apprenticed to lamps, a family that still talks. It is vivid and warm and it hurts. Tallow stands in the doorway. She says she made it to light their way home and never got the chance to give it.',
    artSubject:
      'Vesper holds a glowing lantern in a cluttered lamp-maker’s workshop as its light paints a scene of a young moth-folk apprentice at the same bench, while their mother watches from the doorway.',
    choices: [
      {
        id: 'accept-lamp-as-is',
        label:
          'Accept the lamp and say plainly that Vesper chose to leave and would choose it again',
        outcome:
          'Vesper tells Tallow the truth: the money saved someone, and they would do it again, and they are sorry for everyone it hurt. Tallow takes that in. She does not forgive them. She lets Vesper keep the lamp, and its picture of the unchosen home fades to a plain warm light that will guide Vesper down the cliff and nowhere else.',
        flag: 'tallow-lamp-accepted',
        effects: { trust: 1, evidence: 1, danger: -1 },
        artSubject:
          'Vesper carries a softly glowing plain lantern out of a lamp workshop doorway as their mother stands inside with arms crossed and eyes wet.',
      },
      {
        id: 'cover-lamp-ask',
        label:
          'Cover the lamp’s picture and ask Tallow what home she would choose now',
        outcome:
          'Vesper drapes a rag over the lantern and asks. Tallow is quiet a long time, then says she would choose a village where her children were not watched. It is not an absolution, it is a demand. Vesper writes it down. Tallow keeps the lamp, and Vesper leaves carrying a debt the size of a village.',
        flag: 'tallow-home-asked',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'A rag-covered lantern sits on a workbench between Vesper and their mother, who speaks while Vesper writes in a small notebook.',
      },
    ],
  },
  '4,7': {
    title: 'Wick’s Ash Notebooks',
    speaker: 'Vesper and Wick',
    kind: 'challenge',
    opening:
      'Wick has been working in the Oven’s reactor wing, it turns out. His shelf in the rookery is crammed with notebooks made of printed ash, failed trials he copied out at night because he could not stand to throw them away. He did not report them because reporting would have meant telling the transfer office who the subjects were. When Vesper finds the shelf, Wick does not apologize. He says Vesper is the last person in Hoshimori entitled to lecture anyone about what to do with dangerous records. Then he folds his arms and waits.',
    artSubject:
      'Wick, a young moth-folk man with scorched lab-coat sleeves, stands with folded arms in front of a shelf crammed with grey ash notebooks as Vesper reaches toward one in a silk-walled nest.',
    choices: [
      {
        id: 'protect-wick-records',
        label:
          'Help Wick preserve the notebooks and promise not to use them against anyone who worked there',
        outcome:
          'Vesper agrees: no punishment, only preservation. Together they seal the ash in Tallow’s lamp-glass jars. Wick is visibly relieved, and some of the cold between siblings thaws. But the trials’ designers are now protected too, along with the frightened clerks, and Seri’s quiet complicity stays out of any accounting.',
        flag: 'wick-records-protected',
        effects: { trust: 2, evidence: 1, danger: 1 },
        artSubject:
          'Vesper and their younger brother seal fragile ash pages into glass lamp jars on a workbench inside a woven silk nest.',
      },
      {
        id: 'challenge-wick-trials',
        label:
          'Challenge Wick to stop copying and help restart the trials only with informed volunteers',
        outcome:
          'Vesper argues; Wick argues back louder. Finally he agrees to take Rowan’s consent sheet into the reactor wing. It costs him his job by nightfall. The new trials will be slower and fewer. Wick tells Vesper they owe him a career, and they do.',
        flag: 'wick-trials-reformed',
        effects: { evidence: 2, trust: -1, supplies: -1 },
        artSubject:
          'Wick snatches a consent clipboard from Vesper’s hand on a cliff ledge, scowling, his scorched lab coat flapping in the wind.',
      },
    ],
  },
  '5,7': {
    title: 'Vesper’s Nest-Name in a Box',
    speaker: 'Vesper, Tallow and a name merchant',
    kind: 'treasure',
    opening:
      'Moth-folk children receive a nest-name that only family may use. Tallow kept Vesper’s in a lacquered box after they left, unspoken for eleven years. A name merchant from the market court has climbed the cliff and offers Tallow a fortune for it: a never-used family name is the purest stock there is, and a buyer in the transfer office wants it. Tallow has rent due and a son who just lost his job. She sets the box between herself and Vesper on the floor of the nest and does not say what she wants.',
    artSubject:
      'A small lacquered box sits on a woven silk floor between Vesper and their mother while a bowing name merchant in a bowler hat waits at the nest entrance with a purse of coins.',
    choices: [
      {
        id: 'refuse-nest-name-sale',
        label:
          'Ask Tallow not to sell the name, and offer to pay her rent from Vesper’s own work',
        outcome:
          'Tallow considers, then sends the merchant away. Vesper commits to three months of map work to cover her rent, none of it routes, only roof repairs and orchard plots. The name stays in its box, unspoken. Tallow still does not use it, but she leaves the box out where Vesper can see it.',
        flag: 'nest-name-kept',
        effects: { trust: 2, supplies: -2 },
        artSubject:
          'A bowler-hatted merchant descends a cliff path empty-handed while a lacquered box sits open in a silk nest between Vesper and their mother.',
      },
      {
        id: 'nest-name-tallow-choice',
        label:
          'Tell Tallow the name is hers to keep or sell, and accept whatever she chooses',
        outcome:
          'Tallow sells it. The rent is paid and Wick eats. Vesper feels the name leave like a draft through a cracked shell. Somewhere in the transfer office a clerk now has the purest identity in Hoshimori. Tallow gives Vesper half the purse; Vesper refuses it, and she puts it in their map case anyway.',
        flag: 'nest-name-sold',
        effects: { supplies: 2, trust: 1, danger: 1 },
        artSubject:
          'An older moth-folk woman hands a small lacquered box to a bowing merchant at a nest entrance while Vesper looks away at the valley below.',
      },
    ],
  },
  '6,7': {
    title: 'The Bell-Shell Crab',
    speaker: 'Vesper, Tallow and Wick',
    kind: 'monster',
    opening:
      'At high tide the sea gate pushes so far into the valley that something climbs out of it and up the rookery cliff: a crab as large as a cart, wearing a coral bell for a shell. Each step rings a broken promise, and the promises are the family’s. I will write. I will come back. I will not let them watch us. It is drawn to unkept vows and it is clawing toward the nest where Tallow and Wick sleep. Wick grabs a lamp-pole. Tallow grabs Vesper’s wrist and says, for the first time in eleven years, their nest-name.',
    artSubject:
      'A cart-sized crab wearing a pink coral bell as its shell scales a cliff toward a woven silk nest at night, as Vesper, their brother with a lamp-pole and their mother stand at the nest’s edge.',
    choices: [
      {
        id: 'ring-promises-right',
        label:
          'Ring the crab’s bell in the true order of the family’s broken promises scratched on it',
        outcome:
          'Vesper climbs onto the crab’s back and reads the scratches. The order is unbearable, mostly theirs. They ring it correctly, and the crab, satisfied that its promises are remembered, slides back to sea. Vesper is cut across both palms by coral. The family hears every promise named aloud by the one who broke most of them.',
        flag: 'bell-crab-rung',
        effects: { evidence: 2, danger: 1, trust: -1 },
        artSubject:
          'Vesper clings to the coral bell shell of a giant crab, striking it with bleeding hands, as the creature retreats down a moonlit cliff toward the sea.',
      },
      {
        id: 'family-rings-bell',
        label:
          'Ask Tallow and Wick to ring the promises they remember, even where they contradict Vesper’s',
        outcome:
          'All three ring, and the bell clangs a discordant family argument down the cliff. The crab hesitates, confused, then settles at the nest’s foot instead of leaving. It stays, a coral bell ringing whenever anyone here makes a promise. The family is safe from it and stuck with it, and nobody in the rookery will promise anything lightly again.',
        flag: 'bell-crab-family',
        effects: { trust: 2, danger: -1, supplies: -1 },
        artSubject:
          'Vesper, their mother and their brother each strike a coral bell shell on a giant crab that has settled at the foot of a silk nest under the stars.',
      },
    ],
  },
  '7,7': {
    title: 'The Shortcut Through the Elder Nest',
    speaker: 'Vesper and Tallow',
    kind: 'challenge',
    opening:
      'The cliff is giving way where the sea map’s edge pulls at the stitching. The rookery elders, too frail to fly, must be moved down before the next tide. The cliff path is long and the evacuation slow. Tallow, practical as ever, points at Vesper’s knife and the neighboring nest of the Ishara family, who left the valley years ago and asked that no one enter. One cut through their nest would make a straight, safe ramp to the valley floor. Tallow says the Isharas would understand. Vesper is not sure anyone can say that for them.',
    artSubject:
      'Vesper stands with a silver map-knife drawn before a sealed empty silk nest on a crumbling cliff as their mother points at it and frail moth-folk elders wait on a ledge behind.',
    choices: [
      {
        id: 'refuse-ishara-cut',
        label:
          'Refuse to cut the Ishara nest and carry the elders down the long path one by one',
        outcome:
          'Vesper and Wick carry elders on their backs for six hours, down and up, down and up. The Ishara nest stays sealed. Two elders catch chills, and the last trip is made with the cliff edge crumbling under Vesper’s feet. Tallow says nothing about it afterward, which from her is a kind of respect.',
        flag: 'ishara-nest-spared',
        effects: { trust: 2, supplies: -1, danger: 2 },
        artSubject:
          'Vesper carries a frail elder on their back down a crumbling cliff path at dusk, wings strained, while their brother follows with another.',
      },
      {
        id: 'ask-isharas-route',
        label:
          'Send a message to the Isharas by moth-post asking for a route built with their consent',
        outcome:
          'The answer comes within the hour, from a valley far away: cut through the storeroom, not the sleeping room, and seal it after. Vesper cuts exactly that. The ramp is narrow and steep but quick. The Isharas now know their old home has been entered, and their reply ends with a plain line about whether anyone ever asks before taking.',
        flag: 'ishara-route-consented',
        effects: { evidence: 1, supplies: 1, trust: -1 },
        artSubject:
          'Frail moth-folk elders descend a narrow ramp cut through a silk storeroom as Vesper reads a small folded letter at the top.',
      },
    ],
  },
  '8,7': {
    title: 'The Settlement Broker',
    speaker: 'Vesper and a crow from the transfer office',
    kind: 'merchant',
    opening:
      'A crow in a pinstriped waistcoat lands on the rookery lip with a briefcase. He represents the transfer office’s reconciliation desk, and he is selling settlements. For a fee, he will draft a reparations package that guarantees closure: payment to every harmed household, a signed release from each, and a white door filed as finished. He opens a sample. The release forms are already printed with blank signatures, and the white door in his brochure has the children’s faces drawn in. He calls this an honest future, priced to move.',
    artSubject:
      'A crow in a pinstriped waistcoat opens a briefcase of printed forms on the lip of a woven cliff nest as Vesper looks down at a glossy brochure picturing a white door.',
    choices: [
      {
        id: 'refuse-settlement',
        label:
          'Refuse the package and pay reparations directly, with no release asked in return',
        outcome:
          'Vesper sends the crow off and begins the slow, unglamorous version: rice, roof repairs, map work for anyone who asks, no signatures. Some households accept. One returns the rice uneaten. There will be no closure, no release and no finished door. Vesper’s pockets will be empty for a long time.',
        flag: 'settlement-refused',
        effects: { trust: 2, supplies: -2, evidence: -1 },
        artSubject:
          'Vesper hauls a sack of rice down a cliff path at dawn as a pinstriped crow flaps away clutching a briefcase into the morning haze.',
      },
      {
        id: 'renegotiate-settlement',
        label:
          'Make the crow strike every release clause and write in each household’s right to refuse',
        outcome:
          'The crow is horrified but a professional. Clause by clause, Vesper rewrites the package: payment without release, refusal without penalty, door left unfiled. The crow charges triple for the amendments. The result is a fair, binding document that some families will use and some will burn, and it is still a product of the office.',
        flag: 'settlement-rewritten',
        effects: { evidence: 2, supplies: -1, danger: 1 },
        artSubject:
          'Vesper strikes through printed clauses with a fountain pen as a pinstriped crow winces and scribbles invoices beside an open briefcase.',
      },
    ],
  },
  '1,8': {
    title: 'Surveyors at the Edge of the Unowned Square',
    speaker: 'Vesper, Hollin, Rowan and Pip',
    kind: 'challenge',
    opening:
      'At the bottom of the valley, where every road in Hoshimori ends, lies one square that appears on none of the four maps. People live here in lean-tos and an old bathhouse, exactly because nobody can find it. This morning Hollin has arrived with a tripod and two transfer surveyors. He says the office only wants an accurate atlas, for safety. Rowan, holding his notebook, admits the data would be genuinely useful for the evacuations. Pip says the square has the worst bread in the valley and the best secrets. Vesper’s sold route, they realize, ended here once.',
    artSubject:
      'A badger clerk sets up a surveyor’s tripod at the edge of a crowded hidden square of lean-tos and an old bathhouse as Vesper, Rowan in a grey cardigan and the goblin Pip stand between him and the shutters.',
    choices: [
      {
        id: 'survey-to-residents',
        label:
          'Persuade Hollin to hand the finished survey to the square’s residents and no one else',
        outcome:
          'Vesper argues that an atlas belongs first to the people on it. Hollin, who has been changing all week, agrees to survey only if the residents keep the sole copy. Rowan helps make it accurate. The residents accept it warily and lock it in the bathhouse. The transfer office learns that a survey happened and that its clerk refused to file it.',
        flag: 'square-survey-residents',
        effects: { trust: 2, danger: 1, evidence: -1 },
        artSubject:
          'Hollin the badger hands a rolled survey map to a wary resident at a bathhouse door while Rowan and Vesper look on and Pip holds the tripod.',
      },
      {
        id: 'challenge-survey',
        label:
          'Ask the residents whether any copy may exist at all before Hollin takes a single measurement',
        outcome:
          'Vesper knocks on shutters. The residents meet in the bathhouse and vote: no survey, not even one they hold themselves. Hollin folds his tripod. Rowan closes his notebook, disappointed and accepting. The evacuations will have to work around a blank space on every map, and the office now knows exactly where that blank is.',
        flag: 'square-survey-refused',
        effects: { trust: 1, evidence: 1, danger: 2 },
        artSubject:
          'Residents crowd a steamy old bathhouse to vote by raised hands as Vesper stands at the door and a badger clerk folds his tripod outside.',
      },
    ],
  },
  '2,8': {
    title: 'A Cart Full of Surrendered Badges',
    speaker: 'Vesper and Grisel',
    kind: 'treasure',
    opening:
      'Grisel’s rice cart stands abandoned at the edge of the unowned square, and it holds no rice. It is heaped with office badges, dozens of them, laminated and lanyarded. Underneath are the Briar oath-stones the wolves gave up when the transfer office issued those badges: smooth river stones, each carved with a pack vow. Grisel comes out of an alley with her own badge in her paw. She says the wolves have quit. She does not know whether quitting makes them free or makes them strays, and she is guarding the cart because guarding is the only thing she knows how to do.',
    artSubject:
      'Grisel, a grey Briar wolf, holds her own laminated badge beside an abandoned cart heaped with office lanyards and carved river stones at the edge of a hidden square as Vesper approaches.',
    choices: [
      {
        id: 'return-oath-stones',
        label:
          'Return the oath-stones to the wolves freely and leave the badges in the cart',
        outcome:
          'Vesper helps Grisel sort the stones by carved vow and they carry them to each wolf. The pack reclaims its oaths and loses its wages. Some wolves go back to the Briar; some stay in Hoshimori unemployed and hungry, guarding nothing. Grisel keeps her stone in her jaw like a pup with a toy and says she has no idea what happens next.',
        flag: 'oath-stones-returned',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'Grisel holds a carved river stone gently in her jaws as Vesper hands another to a lean grey wolf in a narrow alley at dusk.',
      },
      {
        id: 'ask-grisel-orders',
        label:
          'Ask Grisel what the office told the wolves to guard in the square before they quit',
        outcome:
          'Grisel tells it plainly: the badges were issued to guard the approach to the white door and record anyone who reaches it. The order still stands on file even though the wolves are gone. Vesper now knows the office means to own whoever comes to the Last Door. Grisel, having said it aloud, feels worse rather than better, and keeps the badges as evidence.',
        flag: 'badge-orders-heard',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'Grisel sits beside a cart of badges in a lantern-lit square, speaking low as Vesper listens with antennae lowered and a white door glows far off.',
      },
    ],
  },
  '3,8': {
    title: 'The Shadow Theatre’s Last Performance',
    speaker: 'Vesper and the Paper Shadow Players',
    kind: 'monster',
    opening:
      'The paper shadow theatre that once performed Vesper’s betrayal in the village square has been dragged here, to the unowned square, and its puppets have come off their sticks. They are tall now, cut-paper silhouettes walking without hands to move them, and they are performing a new play on the bathhouse wall: each audience member’s unchosen home, cast in shadow, with the audience member drawn into it. Three residents are already flat on the wall, paper-thin, living a life they never picked. The lead puppet is a moth. It bows to Vesper with Vesper’s own gestures.',
    artSubject:
      'Towering cut-paper shadow puppets perform across a bathhouse wall lit by a single lantern, three flattened residents trapped among the silhouettes, as a moth-shaped puppet bows to Vesper.',
    choices: [
      {
        id: 'destinations-in-play',
        label:
          'Rewrite the play so each trapped resident speaks the ending they want',
        outcome:
          'Vesper steps into the lantern beam and calls out to the flattened residents to name their own endings. One by one they do, and the puppets, bound to the script, act each ending out until the residents peel free. It works. But every ending was performed in shadow on a public wall, and anyone watching now knows where three hidden people would most like to go.',
        flag: 'shadow-endings-spoken',
        effects: { trust: 1, danger: 2, evidence: 1 },
        artSubject:
          'Three residents peel themselves free of a shadow-play wall as Vesper stands in a lantern beam and paper silhouettes act out small private homes.',
      },
      {
        id: 'douse-theatre-lantern',
        label:
          'Douse the theatre lantern and fight the moth puppet in the dark until consent is possible',
        outcome:
          'Vesper smothers the lantern with their wings and the shadows lose their stage. In the dark the moth puppet attacks, cutting with paper edges, and Vesper wrestles it to the ground until it tears. The three residents slide off the wall, unharmed and unseen. Vesper is covered in paper cuts, and the old theatre that told the truth about their betrayal is gone.',
        flag: 'shadow-theatre-doused',
        effects: { trust: 2, danger: 1, evidence: -2 },
        artSubject:
          'In near darkness Vesper wrestles a torn moth-shaped paper puppet to the stones of a square as three residents slip quietly off a bathhouse wall.',
      },
    ],
  },
  '4,8': {
    title: 'Rowan’s Report on the Reactor',
    speaker: 'Vesper, Rowan and Seri',
    kind: 'challenge',
    opening:
      'An ash cloud from the Red Oven hangs low over the unowned square. Rowan has finished his analysis and presents it on the bathhouse steps with chalk diagrams: the reactor under the hearth runs on memory, has always run on memory, and could be weaned off it within a year if volunteers help test alternatives. Seri stands beside him, having asked to be there. The residents listen through their shutters. Some want the Oven shut tonight. Some were fed by it through two famines. Rowan turns to Vesper for help with the hardest slide.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, chalks diagrams of an oven and reactor on bathhouse steps under a low grey ash cloud as Vesper and a round-faced baker stand beside him.',
    choices: [
      {
        id: 'publish-without-blame',
        label:
          'Present the evidence with every name removed and no punishment proposed',
        outcome:
          'Vesper presents the hardest slide: the record of who was burned, every name blacked out. The square absorbs it in silence. Rowan’s report becomes the shared record. Seri keeps her place at the Oven. Some residents walk away angry that the truth came without consequences, and two of them spit on the steps where Seri stands.',
        flag: 'reactor-report-unnamed',
        effects: { evidence: 2, trust: -1, danger: -1 },
        artSubject:
          'Vesper holds up a sheet of redacted figures on bathhouse steps as a baker stands still and residents turn away under a grey ash cloud.',
      },
      {
        id: 'call-volunteers',
        label:
          'Call for informed volunteers to test a memory-free hearth with Rowan, starting tonight',
        outcome:
          'Seven volunteers step forward, each told every risk. Seri is the first. The test begins at once, and that night the Oven bakes on wood and willing songs. The bread is thin and late and some go hungry, but the ash cloud starts to thin by morning, and Rowan cannot stop smiling, which worries everyone slightly.',
        flag: 'reactor-volunteers',
        effects: { trust: 2, supplies: -2, evidence: 1 },
        artSubject:
          'Seven volunteers and a baker line up beside Rowan on bathhouse steps as the grey ash cloud above the square begins to break into dawn light.',
      },
    ],
  },
  '5,8': {
    title: 'The Office Bids for the Square’s Name',
    speaker: 'Vesper, Okko and the pinstriped crow',
    kind: 'merchant',
    opening:
      'Okko has set up a stall at the edge of the unowned square giving away blank masks, free, to anyone who asks. Opposite her, the pinstriped crow from the reconciliation desk has set up a rival table with a sign: the transfer office will purchase the official name of this square for a generous sum, payable to whoever signs. Nobody here has ever named the square aloud, which is the whole point of it. A teenager from the bathhouse is reading the offer with hungry eyes. Okko catches Vesper’s sleeve and asks what they plan to do.',
    artSubject:
      'A fox-faced vendor hands out blank masks at a stall while across the square a pinstriped crow beckons from a table with a contract, as Vesper watches a hungry teenager read the offer.',
    choices: [
      {
        id: 'reject-square-name',
        label:
          'Expose the bid as a stolen identity and help Okko outbid the office with free masks and rice',
        outcome:
          'Vesper climbs on Okko’s stall and explains loudly what a named square means: an address. Okko doubles her giveaway and adds rice. The teenager takes a mask instead of the money. The crow leaves without a signature. Okko’s stall is empty by nightfall and she has nothing left to sell for a month.',
        flag: 'square-name-rejected',
        effects: { trust: 2, supplies: -2 },
        artSubject:
          'Vesper stands on a market stall speaking to a crowd while a fox vendor hands blank masks to a teenager and a crow packs up his table.',
      },
      {
        id: 'hear-square-name',
        label:
          'Ask the residents privately what they call the square, and why it stays unspoken',
        outcome:
          'An old bathhouse keeper tells Vesper, in a whisper, that they do have a name for it, and that saying it outside the square would be the same as drawing a map. Vesper promises never to repeat it. The teenager, hearing the account, tears up the office contract herself. The crow raises his bid twice before leaving, and the offer stays pinned to the wall.',
        flag: 'square-name-heard',
        effects: { trust: 1, evidence: 1, danger: 1 },
        artSubject:
          'An old bathhouse keeper whispers into Vesper’s feathery antenna while a teenager tears up a paper contract and a crow pins a notice to the wall.',
      },
    ],
  },
  '6,8': {
    title: 'The Twins at the Square’s Well',
    speaker: 'Vesper, Scylla and Char',
    kind: 'puzzle',
    opening:
      'The square’s well has filled with seawater and grown a coral bell at its rim, and Scylla and Char are both in it, arguing. The bell holds every testimony gathered across Hoshimori, and it will only ring the approach to the Last Door open if the promises are rung in order. Scylla has a tidy order from her sorted conch shells. Char says Scylla’s order leaves out everyone who refused to sign, and refuses to let her ring it. The sisters, identical except for black lipstick and a dark fin, turn on Vesper together.',
    artSubject:
      'Scylla with neatly pinned hair and Char with black lipstick and a dark fin argue in a seawater-filled well beneath a coral bell as Vesper kneels at the stone rim between them.',
    choices: [
      {
        id: 'ring-visible-order',
        label:
          'Solve the bell from the promise-marks visible on its coral and ring Scylla’s order',
        outcome:
          'The scratches confirm Scylla’s sequence, mostly. Vesper rings it and the bell opens the approach. Scylla is gracious in victory. Char swims to the bottom of the well and stays there, declaring that the bell has erased half the village, and that she will be remembering every single refusal personally since nobody else will.',
        flag: 'well-bell-scylla',
        effects: { evidence: 2, trust: -1, danger: -1 },
        artSubject:
          'Vesper strikes a coral bell on a well rim as Scylla smiles and Char sinks sulking to the bottom of the glowing seawater.',
      },
      {
        id: 'sisters-test-order',
        label:
          'Invite Char and Scylla to test each other’s orders until the bell rings for both',
        outcome:
          'The sisters ring, interrupt, ring again and insult each other with real affection. Char adds the unsigned refusals one by one; Scylla adds the dates Char forgot. It takes until midnight. The bell rings open in a chord, not a note, and both twins claim the win. The approach is open, late, and the square has been kept awake by royal bickering.',
        flag: 'well-bell-sisters',
        effects: { trust: 2, evidence: 1, supplies: -1 },
        artSubject:
          'Scylla and Char take turns striking a coral bell on a well rim at midnight, laughing and shouting, as Vesper sits on the edge with a lantern.',
      },
    ],
  },
  '7,8': {
    title: 'Wick Brings the Knife Down',
    speaker: 'Vesper and Wick',
    kind: 'companion',
    opening:
      'Wick comes down from the rookery to the unowned square with a silver map-cutting knife wrapped in moth-silk, the twin of Vesper’s, which Tallow made for him and he never used. He has decided to come to the Last Door. He also has a plan: cut a straight lane through the squatters’ lean-tos to the white door so the gathered party can reach it before the transfer office does. Two cuts and it is done. He holds out the knife to show Vesper, and for the first time in years asks for their opinion.',
    artSubject:
      'Wick, a young moth-folk man in a scorched lab coat, unwraps a silver map-knife from moth-silk in a crowded square of lean-tos as Vesper, wings folded, looks toward a distant glowing white door.',
    choices: [
      {
        id: 'wick-refuses-cut',
        label:
          'Persuade Wick to sheath the knife and take the long way around the lean-tos',
        outcome:
          'Vesper tells him what a straight lane through someone’s home costs, and that they learned it the worst way. Wick sheathes the knife, sour but listening, and joins Vesper. The long way takes the whole evening and brings them in sight of the door only as badges begin to gather at the far edge of the square.',
        flag: 'wick-joined-long-way',
        effects: { trust: 2, danger: 2 },
        artSubject:
          'Vesper and their younger brother walk a winding alley between lean-tos at dusk, a sheathed knife at Wick’s belt and the white door glowing ahead.',
      },
      {
        id: 'wick-asks-residents',
        label:
          'Help Wick ask the residents whether any lane may be cut, and where',
        outcome:
          'The residents talk among themselves and offer one path: through the drying yard behind the bathhouse, nowhere else. Wick cuts it neatly, proud of himself. He joins Vesper. The yard’s laundry lines are gone and the residents will have to rebuild them, and the new lane is visible from every roof in the square.',
        flag: 'wick-joined-yard-lane',
        effects: { trust: 1, supplies: 1, evidence: 1 },
        artSubject:
          'Wick traces a careful knife-line through an empty drying yard behind a bathhouse as residents watch from doorways and Vesper stands at his side.',
      },
    ],
  },
  '8,8': {
    title: 'South Watch Above the Last Door',
    speaker:
      'Vesper, Rowan, Morrow, Pip, Oren, Scylla, Char and the people of the square',
    kind: 'memory',
    opening:
      'From the South Watch tower, the last lantern post of Vesper’s childhood, the whole valley spreads below: the cedar bridge, the Red Oven chimney bending toward the sea gate, the rookery on its cliff, and at the center of the unowned square, the white Last Door, standing alone and humming. Everyone has come. Rowan holds his notebook; Morrow, dark-haired in a grey cardigan, stands beside him without speaking; Pip clutches his ledger; Oren has brought rope. Scylla and Char wait in the flooded well. The square’s people watch from behind shutters. Some want the worlds repaired together. Some want them separated cleanly. Vesper remembers standing here at seven, drawing their first safe road. It led to people, not to an answer.',
    artSubject:
      'Vesper stands at the rail of a lantern watchtower above a moonlit valley of stitched forest, city, sea and village maps, with Rowan, Morrow, Pip and hooded Oren gathered beside them and a white door glowing in the square below.',
    choices: [
      {
        id: 'hear-every-claim',
        label:
          'Call everyone with a stake to speak their claim before anyone approaches the door',
        outcome:
          'Vesper lights the South Watch lantern as a summons. Through the night they come: Rowan and Morrow with lives tangled across two worlds, Pip with his ledger, wolves with their oath-stones, survivors with their receipts. Vesper speaks last and owns both the rescue and the sale. Nothing is decided. But every voice that will live with the Last Door has been heard once, and the door is still waiting.',
        flag: 'last-door-claims-heard',
        effects: { trust: 2, evidence: 1, supplies: -1 },
        artSubject:
          'A crowd of villagers, wolves, a goblin courier, two mermaids in a well and a hooded headsman gather by lantern light around a white door in a hidden square as Vesper speaks.',
      },
      {
        id: 'burn-square-atlas',
        label:
          'Burn Vesper’s atlas of the square and approach the door with no map at all',
        outcome:
          'Vesper takes the last map of Hoshimori they carry, the one that shows the unowned square, and burns it in the South Watch brazier. Pip winces. Oren nods. The approach will be harder without it, and the badges gathering below have their own maps. But no one who reaches the door will owe their way there to a cartographer’s copy, and the door is still waiting.',
        flag: 'last-door-unmapped',
        effects: { trust: 1, danger: 2, evidence: -1 },
        artSubject:
          'Vesper drops a hand-drawn map into a watchtower brazier, flames lighting their grey moth wings, as the white door glows far below in the dark square.',
      },
      {
        id: 'rig-two-way-crossing',
        label:
          'Have Oren rig a rope crossing to the door that works in both directions',
        outcome:
          'Oren spends the night building it: ropes and pulleys from the tower to the square, a landing that can carry people toward the door or carry them away from it. Rowan checks his load figures. Whatever is chosen at the threshold, repair or separation, no one will be trapped on the wrong side of it. The work uses every rope in Hoshimori, and the door is still waiting.',
        flag: 'last-door-two-way',
        effects: { supplies: -2, evidence: 1, danger: -1 },
        artSubject:
          'Oren, the hooded masked headsman, hauls taut ropes on pulleys from a watchtower down toward a white door in the square while Rowan checks figures and Vesper holds a lantern.',
      },
    ],
  },
} as const
