import type { ChanceEventChoice } from './dailyEvents'

/**
 * Act I's 26 daily surprises have individual decisions and outcomes.
 * Low-stakes is not consequence-free: an official record, family trust,
 * medicine, a patrol or a small purse can matter later.
 *
 * Every choice keeps the original collect/care stable IDs for saved campaigns,
 * but the court no longer repeats generic "sell it or give it away" answers.
 */
export const ACT_ONE_CHOICES: Readonly<Record<string, readonly [ChanceEventChoice, ChanceEventChoice]>> = {
  "dust-weather": [
    { id: 'collect', label: "Close the well until the dust settles; pay to bring water from the Ford.", response: "The cooks complain about the price of clean water. By supper, a runner brings news that the orange dust formed a ring around the well but never touched its bottom.", effects: {brass:-7,local:{yard:2},flags:["eod-dust-well-closed"]} },
    { id: 'care', label: "Keep the well open for washing, with a sentry recording anyone who falls ill.", response: "No one becomes ill. Yet every name on the sentry's list is a person who now knows the Watch watched them drink.", effects: {brass:4,local:{"gate-watch":1,yard:-1},flags:["eod-dust-well-watched"]} },
  ],
  "river-weather": [
    { id: 'collect', label: "Give the captured rainwater to Kiyo for the infirmary.", response: "Kiyo saves it for cleaning wounds. The kitchens must boil their drinking water again, but the bandages smell of rain instead of ash.", effects: {brass:-4,local:{yard:2},flags:["eod-rain-infirmary"]} },
    { id: 'care', label: "Buy grain with the water before the traders leave.", response: "The trader takes all seven minutes of rain in three sealed barrels. The kitchen has bread for a week and less water for a hot day.", effects: {brass:9,local:{ledger:1,yard:-1},flags:["eod-rain-traded"]} },
  ],
  "salt-caravan": [
    { id: 'collect', label: "Buy the two wheels for the Gate Watch's failing wagon.", response: "The Watch's wagon is ready by evening. The caravan limps north on an axle patched with rope, and you hear about it at the next toll.", effects: {brass:-8,local:{"gate-watch":2,saltroad:-1},flags:["eod-wheels-watch"]} },
    { id: 'care', label: "Trade the wheels for passage vouchers for stranded families.", response: "The families ride north without paying, but the Watch spends another day patching its wagon. The caravaner calls it a fair deal, once.", effects: {brass:3,local:{yard:2,"gate-watch":-1},flags:["eod-wheels-families"]} },
  ],
  "wild-harvest": [
    { id: 'collect', label: "Keep the miraculous turnips for seed, although the kitchens need food now.", response: "The gardener slices one turnip into hundreds of ugly pieces. The cook writes the weight of each on the wall, to remember what tomorrow cost.", effects: {brass:-3,local:{yard:1},flags:["eod-turnips-seed"]} },
    { id: 'care', label: "Share tonight's turnip stew; let the gardener save whatever survives.", response: "Everyone eats something fresh. When the pot is scraped clean, only three seeds remain. The gardener plants them without complaining.", effects: {brass:2,local:{yard:2},flags:["eod-turnips-stew"]} },
  ],
  "little-omens": [
    { id: 'collect', label: "Let the child keep the spoon. Ask an archivist to record what happens.", response: "The spoon warms each time the child speaks of her missing father. The archivist puts the observation in a plain ledger without announcing a miracle.", effects: {brass:-5,local:{lamplight:2},flags:["eod-spoon-child"]} },
    { id: 'care', label: "Purchase it for the Archive, with a promise the child may visit.", response: "The child comes three times the first week, then never again. The spoon stays warm. The Archive has a valuable object and a blank space in its story.", effects: {brass:-2,local:{lamplight:1,yard:-1},flags:["eod-spoon-archive"]} },
  ],
  "mire-ferry": [
    { id: 'collect', label: "Return the ring to the ferryman and have the duck marked as a passenger.", response: "The ferryman insists he has never carried this duck, but the ring fits an old ferry seal. The dockhands begin charging it an imaginary toll.", effects: {brass:-2,local:{mirefen:2},flags:["eod-duck-ferry"]} },
    { id: 'care', label: "Keep the ring in evidence until its owner arrives.", response: "The court collects three contradictory claims before lunch. The duck wanders into the barracks and settles beneath the boots of the loudest claimant.", effects: {brass:5,local:{ledger:1,mirefen:-1},flags:["eod-duck-ledger"]} },
  ],
  "rustline-signal": [
    { id: 'collect', label: "Give the kettle to Tiller's workshop to trace the impossible note.", response: "The workshop spends three days boiling water. At dusk a rail nail on the bench begins to vibrate in time with the whistle.", effects: {brass:-7,local:{lamplight:2},flags:["eod-kettle-signal"]} },
    { id: 'care', label: "Leave the kettle in the public kitchen and listen for the next whistle.", response: "The cooks make tea around the sound. Travelers recognize the railway note and stop pretending the old lines are entirely dead.", effects: {brass:1,local:{yard:2},flags:["eod-kettle-kitchen"]} },
  ],
  "toll-dispute": [
    { id: 'collect', label: "Tow the two carts apart with the Watch's draft team; charge both drivers.", response: "Both carts cross by sunset. The Watch records a neat fee against each driver. One files a complaint with your own seal on it.", effects: {brass:10,local:{"gate-watch":1,ledger:-1},flags:["eod-carts-towed"]} },
    { id: 'care', label: "Let the drivers settle ownership by carrying each other's cargo across.", response: "They spend an hour accusing the other of stealing. Then both realize the loads are identical, and neither will say who loaded them.", effects: {brass:0,local:{yard:2},flags:["eod-carts-carried"]} },
  ],
  "quiet-witness": [
    { id: 'collect', label: "Open the floorboards with the child present, so everyone knows what was found.", response: "There is a wooden box, a brass hinge, and a name scratched into the lid. The child says the knocking has stopped. The cook will not enter the kitchen.", effects: {brass:-4,local:{lamplight:2,yard:-1},flags:["eod-door-opened"]} },
    { id: 'care', label: "Quietly send the carpenter and let the child return to lessons.", response: "The carpenter finds the same box and brings it to the court. By evening the rumor has grown a staircase and a second voice.", effects: {brass:-1,local:{yard:1,lamplight:-1},flags:["eod-door-quiet"]} },
  ],
  "night-market": [
    { id: 'collect', label: "Permit the button market, but require the traders to explain where the pairs came from.", response: "An elderly woman finds the button she lost on her wedding coat. The traders refuse to say how it got there, and agree to leave before dawn.", effects: {brass:7,local:{ledger:1,yard:1},flags:["eod-buttons-license"]} },
    { id: 'care', label: "Buy the unsold buttons for the quartermaster; let the traders leave unnamed.", response: "The barracks finally has matching coats. On two cuffs, soldiers discover their own initials sewn into buttons older than they are.", effects: {brass:-6,local:{"gate-watch":2},flags:["eod-buttons-watch"]} },
  ],
  "lost-animals": [
    { id: 'collect', label: "Keep the goat as evidence until a claimant offers proof.", response: "Three households produce sketches, each unmistakably the goat. It eats the sketches. The clerk decides to keep the case open another day.", effects: {brass:3,local:{ledger:2,yard:-1},flags:["eod-goat-evidence"]} },
    { id: 'care', label: "Send the goat to the Yard school and let the children decide.", response: "The children name it Chancellor and make it a straw throne. One family says this is theft; another brings lettuce to the school.", effects: {brass:-3,local:{yard:2},flags:["eod-goat-school"]} },
  ],
  "bell-echo": [
    { id: 'collect', label: "Bring the clapper to the tower and try one controlled strike.", response: "The bell rings before the hammer touches it. Two people swear they heard different names. Sera, watching from the street, writes both down.", effects: {brass:-5,local:{lamplight:2},flags:["eod-clapper-tested"]} },
    { id: 'care', label: "Lock the clapper away and pay someone to watch the empty chapel.", response: "At dusk the bell rings anyway. The watchman reports a shadow crossing the stones just as the tower's clock stops for one minute.", effects: {brass:-8,local:{"gate-watch":2},flags:["eod-clapper-guarded"]} },
  ],
  "stranger-tent": [
    { id: 'collect', label: "Offer the barefoot scholar a bed for the night in exchange for a public lecture.", response: "Half the town comes to hear a lecture about a river that no longer exists. The scholar sleeps through breakfast and departs with clean shoes.", effects: {brass:-6,local:{lamplight:2},flags:["eod-scholar-lecture"]} },
    { id: 'care', label: "Buy the ledger first; let the scholar keep the road to themself.", response: "The book contains fifty pages of careful measurements and one page torn out. The missing page is the only one the scholar asked for.", effects: {brass:-7,local:{ledger:1,lamplight:1},flags:["eod-scholar-ledger"]} },
  ],
  "children-games": [
    { id: 'collect', label: "Judge the spoon contest, but write the winners a harmless royal decree.", response: "The two pretend emperors declare a shared day off from chores. Every child cheers; every cook looks at you as though you signed a genuine law.", effects: {brass:0,local:{yard:2},flags:["eod-spoon-decree"]} },
    { id: 'care', label: "Ask the children to assign the crown a chore too, and complete it yourself.", response: "You spend an hour hauling water. The children call you a disappointing peasant. The Yard remembers the emperor carrying buckets longer than it remembers the contest.", effects: {brass:-2,local:{yard:2,"old-houses":-1},flags:["eod-spoon-buckets"]} },
  ],
  "medicine-trade": [
    { id: 'collect', label: "Have Kiyo test one bitter root before you buy the lot.", response: "Kiyo says it is medicine, but for a fever they have never seen. The trader leaves two roots at cost and refuses to describe the other four.", effects: {brass:-4,local:{yard:1,lamplight:1},flags:["eod-herb-tested"]} },
    { id: 'care', label: "Take the trader's price and keep the roots for an emergency.", response: "The infirmary shelves hold six sealed bundles. Nobody knows when to open them. The trader is gone by the time an old patient recognizes the smell.", effects: {brass:-6,local:{ledger:1},flags:["eod-herb-stockpiled"]} },
  ],
  "raider-guest": [
    { id: 'collect', label: "Give the messenger breakfast at a public table, under the eyes of the Watch.", response: "The hyena asks for seconds. The officers hear a useful road warning between bites; by evening they are arguing about whether hospitality counted as a treaty.", effects: {brass:-3,local:{"gate-watch":1,jackalwire:1},flags:["eod-hyena-breakfast"]} },
    { id: 'care', label: "Hear the rider privately and ask what the Pack wants in return.", response: "The messenger names a captured cart and three prisoners. It is a bargain you can refuse, but the story has already reached the barracks.", effects: {brass:4,local:{ledger:1,yard:-1},flags:["eod-hyena-private"]} },
  ],
  "house-feast": [
    { id: 'collect', label: "Seat a cook at the empty fourth setting and see who objects.", response: "The oldest family steward spills wine. The cook has nothing to wear but work clothes, and spends supper learning which dishes are eaten without forks.", effects: {brass:-3,local:{yard:2,"old-houses":-1},flags:["eod-dinner-cook"]} },
    { id: 'care', label: "Leave the setting empty; request its absent owner's name in writing.", response: "The family sends you a folded genealogy with one line erased. No one returns your invitation, though a silver spoon arrives in the morning.", effects: {brass:6,local:{"old-houses":2,lamplight:-1},flags:["eod-dinner-empty"]} },
  ],
  "glass-oracle": [
    { id: 'collect', label: "Let the child demonstrate the sunset jar to the public before it is opened.", response: "The lid comes free at noon and the room briefly looks like evening. No light is lost outside. Everyone disagrees about the color.", effects: {brass:-2,local:{lamplight:2},flags:["eod-sunset-public"]} },
    { id: 'care', label: "Buy the jar for the night watch; use it to signal from the walls.", response: "The watchmen learn to shade the captured light like a lantern. The child keeps the empty jar and discovers it fills again when she dreams.", effects: {brass:-6,local:{"gate-watch":2},flags:["eod-sunset-signal"]} },
  ],
  "courier-trouble": [
    { id: 'collect', label: "Let the courier recite the letter to the clerk, who will sign for the missing envelope.", response: "The courier knows every word, including the part the sender crossed out. The clerk seals a new letter with the wrong person's stamp.", effects: {brass:-3,local:{ledger:2},flags:["eod-courier-recited"]} },
    { id: 'care', label: "Send the rider onward with a blank envelope and your own messenger as witness.", response: "Two riders leave by different gates and meet at the crossroads. The witness returns with no envelope and a description of someone wearing your seal.", effects: {brass:-6,local:{"gate-watch":1,lamplight:1},flags:["eod-courier-witness"]} },
  ],
  "forgotten-song": [
    { id: 'collect', label: "Ask the cook to teach the song to the barracks before the tune is lost.", response: "The kitchen becomes a choir for an hour. In the last verse, the sentries recognize a marching order that predates the fortress itself.", effects: {brass:-2,local:{yard:2,"gate-watch":1},flags:["eod-song-barracks"]} },
    { id: 'care', label: "Record the melody privately and pay the cook for the story behind it.", response: "The cook takes the brass but refuses to name the person who taught them. The archivist discovers the tune written on the back of a casualty list.", effects: {brass:-5,local:{lamplight:2},flags:["eod-song-recorded"]} },
  ],
  "salt-accounts": [
    { id: 'collect', label: "Refund the disputed zero while the Ledger checks every related receipt.", response: "The treasurer calls it reckless. Three merchants return with honest accounts, but one uses the refund to disappear before the audit ends.", effects: {brass:-8,local:{ledger:1,yard:1},flags:["eod-zero-refund"]} },
    { id: 'care', label: "Freeze the disputed sum and publish the receipts for merchants to compare.", response: "The crowd finds three different handwriting styles on identical seals. The market runs late and the traders begin checking each other's work.", effects: {brass:0,local:{ledger:2,yard:-1},flags:["eod-zero-audit"]} },
  ],
  "moonlit-scouts": [
    { id: 'collect', label: "Send a two-person patrol toward the ridge with lanterns extinguished.", response: "The scouts return with an unusual hoofprint cast in clay. One thinks the rider turned back; the other insists nobody was mounted at all.", effects: {brass:-7,local:{"gate-watch":2},flags:["eod-ridge-patrol"]} },
    { id: 'care', label: "Invite the light to approach the gate while the guards watch from cover.", response: "The light moves closer and goes out at the first shout. A traveler appears in daylight asking why the tower hung a lantern on the wrong side.", effects: {brass:-3,local:{lamplight:2,"gate-watch":-1},flags:["eod-ridge-wait"]} },
  ],
  "strange-craft": [
    { id: 'collect', label: "Put the self-counting abacus in the treasury and compare it against the books.", response: "It adds one to the count whenever someone lies about a debt. The bookkeepers cannot agree whether to keep the instrument or dismiss the entire office.", effects: {brass:-4,local:{ledger:2},flags:["eod-abacus-treasury"]} },
    { id: 'care', label: "Loan the machine to the Yard school and ask the children to break its pattern.", response: "The children teach it a new rule on the first afternoon. It stops counting coins and begins moving beads for every visitor at the door.", effects: {brass:-2,local:{yard:2,lamplight:1},flags:["eod-abacus-school"]} },
  ],
  "watch-desertion": [
    { id: 'collect', label: "Find the sentry's family and ask why supper was more urgent than patrol.", response: "The sentry's mother has been ill for three days. The captain takes a replacement watch shift himself and sends a nurse to the house.", effects: {brass:-4,local:{yard:2,"gate-watch":-1},flags:["eod-sentry-family"]} },
    { id: 'care', label: "Post the note at roll call; require the sentry to answer publicly.", response: "The sentry returns and admits he left. Two others admit they have done the same. The captain has new rules to write before dawn.", effects: {brass:0,local:{"gate-watch":2,yard:-1},flags:["eod-sentry-rollcall"]} },
  ],
  "pilgrim-road": [
    { id: 'collect', label: "Lend the pilgrims the council hall for one night; ask their passenger what help is wanted.", response: "The passenger asks only for dry shoes. The pilgrims disagree about where to go next, and sleep easier after arguing it out in the open.", effects: {brass:-5,local:{yard:2},flags:["eod-pilgrims-hall"]} },
    { id: 'care', label: "Pay for a cart guard to escort the travelers to the Abbey.", response: "The guard returns without a wagon and with a sealed letter. He reports the patient arrived safely, but will not say who accepted the letter.", effects: {brass:-8,local:{abbey:1,"gate-watch":1},flags:["eod-pilgrims-abbey"]} },
  ],
  "factions-argue": [
    { id: 'collect', label: "Offer to keep the pig at court until both claimants produce a witness.", response: "The pig escapes its pen twice and returns to the same cook each time. The court's legal clerk says appetite is inadmissible evidence.", effects: {brass:-4,local:{ledger:2},flags:["eod-pig-court"]} },
    { id: 'care', label: "Let the farmer and broker share the animal's next litter instead of fighting over this one.", response: "Both agree until the pig turns out to be a boar. The broker calls it deception; the farmer laughs for the first time in weeks.", effects: {brass:0,local:{yard:2,ledger:-1},flags:["eod-pig-share"]} },
  ],
}
