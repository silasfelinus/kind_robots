import type {
  Effects,
  LocalFactionId,
  KingdomFactionId,
  Requirement,
} from './types'
import { ACT_ONE_CHOICES } from './dailyEventsActOne'

/**
 * One distinct scene per motif per act. The 25 motifs change their setting,
 * conflict, and stakes as the wasteland changes: 125 authored scenes plus five
 * hand-authored secret-recruit encounters. This is NOT a random one-line buff
 * table. Each choice is voluntary and its outcome persists in the save.
 */
export type ChanceEventChoice = {
  id: string
  label: string
  response: string
  effects: Effects
  requires?: Requirement
}
export type ChanceEvent = {
  id: string
  act: number
  series: string
  title: string
  text: string
  choices: readonly ChanceEventChoice[]
  secretFollower?: string
}
type Motif = {
  id: string
  local: LocalFactionId
  faction: KingdomFactionId
  collect: string
  care: string
  collectResponse: string
  careResponse: string
  scenes: readonly (readonly [string, string])[]
}
const MOTIFS: readonly Motif[] = [
  {
    id: 'dust-weather',
    local: 'gate-watch',
    faction: 'freeholds',
    collect: 'Sell the salvage before the next squall.',
    care: 'Pay the watch to shelter the travelers.',
    collectResponse:
      'The recovered goods are counted and the carts keep moving.',
    careResponse:
      'The Watch works beside the locals until the last tent holds.',
    scenes: [
      [
        'Dust in the Courtyard',
        'A fine orange dust comes down at breakfast. A little girl discovers it has filled every empty cup at the well.',
      ],
      [
        'The Three-Day Wind',
        'A wind flattens two roadside camps without touching the bell tower. The tent pegs are twisted like nails.',
      ],
      [
        'The Black Sand Morning',
        'Sand dark as coal falls from a clear sky. Cart drivers argue about whether it can poison the grain.',
      ],
      [
        'The Wind That Named Us',
        'A dust front arrives with the sound of voices in it. The Watch claims one of them called the emperor by name.',
      ],
      [
        'The Ashen Noon',
        'The whole horizon turns the color of a bruise. Travelers have one hour to get below stone before the front reaches them.',
      ],
    ],
  },
  {
    id: 'river-weather',
    local: 'yard',
    faction: 'mire-mothers',
    collect: 'Sell the gathered rainwater to the caravans.',
    care: 'Give it to the low wards and thirsty horses.',
    collectResponse: 'The caravaners pay in brass and hire two extra barrels.',
    careResponse:
      'Water finds the people whose cisterns have been empty longest.',
    scenes: [
      [
        'A Rain Worth Keeping',
        'Seven minutes of clean rain fall on the Yard. The cooks run out with their biggest pots.',
      ],
      [
        'Copper Rain',
        'The rain tastes faintly of pennies and leaves a red ring on every bucket. No one has become sick, yet.',
      ],
      [
        'Storm over the Ford',
        'The first real storm of the season threatens to take the Ford bridge. The river looks harmless at dawn.',
      ],
      [
        'The Second Flood',
        'Water comes from upstream before the storm. A tunnel engineer says the order of things is wrong.',
      ],
      [
        'The Wet Wasteland',
        'Rain lasts until every dried creek is a river. The farmers dance and the sentries watch the retaining walls bend.',
      ],
    ],
  },
  {
    id: 'salt-caravan',
    local: 'ledger',
    faction: 'saltroad',
    collect: "Take the merchant's cash offer.",
    care: 'Let the goods travel at a generous rate.',
    collectResponse:
      'The Ledger notes the sale; everyone gets a fresh price to argue over.',
    careResponse:
      'The merchants carry good news about a court that left room to bargain.',
    scenes: [
      [
        'Two Spare Wheels',
        'A caravan arrives with two fine spare wheels and asks if the tower wants them before they leave.',
      ],
      [
        'Salt at Half Price',
        'A trader fears the south road and will sell their salt for less than they paid. Their guards have quit.',
      ],
      [
        'The Missing Measure',
        "A caravan claims the tower's scales are wrong. The factor has brought weights from three other cities.",
      ],
      [
        'An Entire Road for Sale',
        'A cart guild offers exclusive rights to the northern gate for one season. Its contract is thirty pages long.',
      ],
      [
        'The Last Market',
        'A traveling bazaar unfolds beside the hideout. Some merchants call it charity. None admit who told them where to come.',
      ],
    ],
  },
  {
    id: 'wild-harvest',
    local: 'yard',
    faction: 'freeholds',
    collect: 'Sell the rare crop while it is fresh.',
    care: 'Keep the harvest for the kitchens.',
    collectResponse: 'The goods fetch enough brass to keep the accounts quiet.',
    careResponse: 'The kitchen keeps feeding people when the road goes hungry.',
    scenes: [
      [
        'Three Red Turnips',
        "An old farmer grows three turnips the size of a child's head in soil that should be dead.",
      ],
      [
        'Orchard Behind the Wall',
        'A tree nobody remembers planting bears fruit behind the old granary. Half of it is sweet and half is bitter.',
      ],
      [
        'The Honey Wind',
        'Bees arrive from nowhere and swarm an empty grain silo. The keeper claims the honey belongs to the Crown.',
      ],
      [
        "The Orchard's Second Spring",
        'A dead grove flowers overnight. The blossoms smell of smoke and the roots are warm as living skin.',
      ],
      [
        'Bread from the Dust',
        'A farmer brings sacks of wheat from a field where all the other crops burned. She wants no questions.',
      ],
    ],
  },
  {
    id: 'little-omens',
    local: 'lamplight',
    faction: 'hollow-bell',
    collect: 'Auction the odd trinket to collectors.',
    care: 'Let the Archive keep it in plain sight.',
    collectResponse:
      "Collectors pay promptly and whisper about the court's strange holdings.",
    careResponse:
      'An archivist writes down every witness before memory improves the story.',
    scenes: [
      [
        'A Spoon That Stays Warm',
        'A tinker finds a spoon still warm in the rubble of a house abandoned forty years ago.',
      ],
      [
        'The Sleeping Clock',
        'An empty wall clock begins ticking at noon. It has no hands, and nobody owns the building.',
      ],
      [
        'Three False Shadows',
        'A child casts three shadows at the gate. One of them reaches toward the bell even after the child moves.',
      ],
      [
        'The Hour That Went Missing',
        'Nobody in the Yard can remember the fourth bell. Every lamp burned down the same length.',
      ],
      [
        'The Last Minute',
        'A clock in the crypt strikes at a time the sun cannot make. A messenger swears he has already lived tomorrow.',
      ],
    ],
  },
  {
    id: 'mire-ferry',
    local: 'yard',
    faction: 'mire-mothers',
    collect: "Take a fee from the ferry's waiting passengers.",
    care: 'Subsidize a safe crossing for the stranded.',
    collectResponse:
      'The ferryman makes the crossing by sundown and leaves a payment at the gate.',
    careResponse:
      'Mire boats ferry the worst-off first; the mothers remember the favor.',
    scenes: [
      [
        'A Raft and a Duck',
        'The ferryman brings back a small duck wearing a brass ring. Nobody claims it. Everyone claims the ring.',
      ],
      [
        'The Boat Without a Pole',
        'A raft drifts into the shallows with three passengers asleep upright and no ferryman.',
      ],
      [
        'A Crossing in Fog',
        'The ferry rope rings like a stringed instrument in the mist. The ferryman refuses to cross at the usual landing.',
      ],
      [
        'The River Forgets Its Bank',
        'A channel moves fifty paces overnight. Three farm plots wake on the wrong side of the river.',
      ],
      [
        'The Ferry of the Dead',
        'A raft passes the hideout carrying silent figures under lanterns. Their wet footprints stop at the waterline.',
      ],
    ],
  },
  {
    id: 'rustline-signal',
    local: 'lamplight',
    faction: 'rustline',
    collect: 'Sell the signal parts to the market.',
    care: 'Fund an inspection before the wire is cut.',
    collectResponse: 'The copper and brass buy food no scholar can conjure.',
    careResponse:
      'The Archive gets a map of the sound and one answer worth keeping.',
    scenes: [
      [
        'A Whistle in a Kettle',
        'A kettle in the Yard gives the note of a train whistle even when it is empty.',
      ],
      [
        'Rail Nails in the Bread',
        'Three old railway spikes turn up in the wheat sacks. They are polished and still warm.',
      ],
      [
        'A Semaphore Turns',
        'A tower semaphore changes position during the night. Its gears were stolen decades ago.',
      ],
      [
        'A Train Behind the Hill',
        'The hills rumble at dusk and a headlamp moves along rails that exist only on old maps.',
      ],
      [
        'The Track Under the Hideout',
        'An iron vibration rises through the floor. In the distance, the dead station answers.',
      ],
    ],
  },
  {
    id: 'toll-dispute',
    local: 'ledger',
    faction: 'jackalwire',
    collect: 'Collect a settlement in brass.',
    care: 'Arbitrate openly and pay for witnesses.',
    collectResponse:
      'One party pays and both leave with their grievances intact.',
    careResponse:
      'The people hear their case tried without a noose, which costs time and patience.',
    scenes: [
      [
        'Two Carts and One Bridge',
        'Two drivers arrive claiming the same crossing place. Their wagons are locked axle to axle.',
      ],
      [
        'A Toll Written Twice',
        'Two collectors present stamped licenses for the same bridge. Both seals appear genuine.',
      ],
      [
        "The Captain's Granddaughter",
        "A child brings the Pack's toll ledger to court and refuses to say who gave it to her.",
      ],
      [
        'The Road Under Arrest',
        'A tax sergeant arrests a road marker on the theory that it belongs to the Black Verge.',
      ],
      [
        'The Price of Leaving',
        'A toll guild charges refugees for the road away from the fallen tower. It sends a copy of its charter.',
      ],
    ],
  },
  {
    id: 'quiet-witness',
    local: 'lamplight',
    faction: 'moles',
    collect: 'Accept payment to seal the statement.',
    care: 'Protect the witness and record their words.',
    collectResponse: 'The affidavit stays private. The money is very public.',
    careResponse:
      'The testimony is copied by three hands and kept in different places.',
    scenes: [
      [
        'The Girl Who Heard the Door',
        'A child says she heard somebody knocking under the kitchen floor. The cook says it was the stove.',
      ],
      [
        "The Miller's Second Ledger",
        'A bookkeeper brings an account with two columns of names, one scratched away after the last war.',
      ],
      [
        "The Witness Who Won't Name",
        "A caravan guard swears she saw a murder but will describe only the victim's boots.",
      ],
      [
        'A Witness in the Stone',
        'A workman opens a wall and finds a testimony scratched into the back of every brick.',
      ],
      [
        'The Witnesses of Tomorrow',
        'Three strangers arrive separately to report a crime no one at court has yet heard happened.',
      ],
    ],
  },
  {
    id: 'night-market',
    local: 'old-houses',
    faction: 'saltroad',
    collect: 'License the market stalls for a fee.',
    care: 'Permit them freely so the outskirts can trade.',
    collectResponse:
      'The treasury receives a few bright coins and the stalls move on.',
    careResponse:
      'Old enemies stand in one market long enough to buy bread from each other.',
    scenes: [
      [
        'A Market of Buttons',
        'Five traders sell mismatched buttons by lantern-light. People come from three villages to find the missing halves.',
      ],
      [
        'The Traveling Barber',
        'A barber offers cuts and news under the north arch. His gossip is better than his scissors.',
      ],
      [
        'The Bone Lottery',
        'A night market sells tickets cut from polished bone. Each prize belongs to someone who vanished on the road.',
      ],
      [
        'The Masked Exchange',
        'No trader shows a face at the night market. The prices are written in favors rather than brass.',
      ],
      [
        'The Market After Midnight',
        "The exiled court wakes to find a market pitched on the dry riverbed, every stall bearing the tower's old crest.",
      ],
    ],
  },
  {
    id: 'lost-animals',
    local: 'yard',
    faction: 'freeholds',
    collect: 'Sell the stray animals to a drover.',
    care: 'Help find the owners, even if some live beyond the border.',
    collectResponse: 'The drover pays for the hard work of feeding them.',
    careResponse:
      'A trail of lanterns follows the animals home, and a few doors open to the court.',
    scenes: [
      [
        'One Goat on the Stairs',
        "A goat climbs to the throne room and eats part of the day's tax report. Nobody admits whose goat it is.",
      ],
      [
        "The Pack's Red Dog",
        'A red dog follows the Watch for a mile. Its collar carries a Jackalwire knot tied inside out.',
      ],
      [
        'The Horse That Knows the Route',
        "A riderless horse turns at every old caravan stop and waits for someone to speak its rider's name.",
      ],
      [
        'The Returning Herd',
        'Animals that fled the war appear together under the walls at dawn, all facing south.',
      ],
      [
        'The Beasts Leave First',
        "The hideout's draft animals refuse to move toward one particular valley. They choose a new road themselves.",
      ],
    ],
  },
  {
    id: 'bell-echo',
    local: 'lamplight',
    faction: 'hollow-bell',
    collect: 'Sell the recovered metal to the founders.',
    care: 'Pay to trace who is ringing it.',
    collectResponse:
      'The metal goes into new tools; the ringing does not stop.',
    careResponse:
      'A careful inquiry finds the person behind the echo, or at least their reasons.',
    scenes: [
      [
        'The Bell with No Clapper',
        'A brass bell rings from the abandoned chapel although its clapper sits in the gatehouse.',
      ],
      [
        'The Fourth Bell',
        'Hollow Bell hears four strokes at sunrise, a number its tower has never struck.',
      ],
      [
        'A Bell Buried Upright',
        'Diggers find a bell standing in the earth like a buried flower, still clean inside.',
      ],
      [
        "The Bell's Other Voice",
        "A bell that has always warned of fire begins ringing for the people it couldn't save.",
      ],
      [
        'The Silent Toll',
        'At the edge of defeat, the bell rings once without sound. Everyone in the hideout feels it.',
      ],
    ],
  },
  {
    id: 'stranger-tent',
    local: 'yard',
    faction: 'freeholds',
    collect: 'Offer the traveler paid work and a bed.',
    care: 'Invite them to tell their story to the whole court.',
    collectResponse:
      'An extra pair of hands joins the day laborers, and the purse gets lighter only a little.',
    careResponse:
      "The stranger's account becomes common knowledge, and old assumptions break.",
    scenes: [
      [
        'A Scholar with No Shoes',
        'A figure arrives carrying their shoes in one hand and a heavy ledger in the other. They ask only for shade.',
      ],
      [
        "The Weather Reader's Tent",
        'A traveler sets up a tiny tent beyond the yard and measures the wind with a broken fork.',
      ],
      [
        'The Fen Cartographer',
        'A traveler offers a map of channels that change each night. The paper smells of river mud.',
      ],
      [
        'The Keeper Who Remembers',
        'A tired wanderer arrives with fifty sketches of buildings that no longer exist.',
      ],
      [
        'The Cook from the Old Court',
        'A kitchen worker reaches the hideout with their cart empty and their recipe book intact.',
      ],
    ],
  },
  {
    id: 'children-games',
    local: 'yard',
    faction: 'hollow-bell',
    collect: "Accept the tournament's harmless little entry fees.",
    care: 'Help the children build a playing field.',
    collectResponse:
      'The bowls fill with brass. The children will spend it on something surprising.',
    careResponse:
      'The field is muddy, loud, and the first place the factions have shared in weeks.',
    scenes: [
      [
        'Spoons for Crowns',
        'Yard children appoint themselves rival emperors using wooden spoons. One has already outlawed porridge.',
      ],
      [
        'The Paper Crown Contest',
        'Children from two villages arrive for a crown-making contest and demand the emperor judge it.',
      ],
      [
        'A Game of Borders',
        'Children draw the map in chalk. Their borders are kinder than the ones in the map room.',
      ],
      [
        "The Children's Parliament",
        'A gang of children presents seventeen demands, most of them about the right to sleep late.',
      ],
      [
        'The Last Game',
        'In the hideout, children invent a game where losing means everyone escapes together.',
      ],
    ],
  },
  {
    id: 'medicine-trade',
    local: 'yard',
    faction: 'abbey',
    collect: 'Sell the rare ingredients to a healer passing through.',
    care: 'Keep the herbs for the infirmary.',
    collectResponse:
      'The supplier pays enough for common bandages and leaves before dark.',
    careResponse:
      'Kiyo has a little more time to close wounds that should have been fatal.',
    scenes: [
      [
        'A Jar of Bitter Roots',
        'A peddler offers six dried roots labeled only with the name of a season. Kiyo recognizes the smell but not the writing.',
      ],
      [
        'The Traveling Midwife',
        'A midwife arrives with a cracked herb press and demands clean water before negotiation.',
      ],
      [
        'Fever in the Salt Wagons',
        'A spice wagon carries an unexpected medicine and a rider with a suspicious fever.',
      ],
      [
        'The Last Apothecary',
        'A chemist sells medicine made with ash from a ruined abbey. Their receipts have the wrong year.',
      ],
      [
        'A Cure for the Road',
        'An exiled herbalist brings enough bitter leaves for the sick, if someone can spare the pots to brew them.',
      ],
    ],
  },
  {
    id: 'raider-guest',
    local: 'gate-watch',
    faction: 'jackalwire',
    collect: 'Collect a border fee and let them pass.',
    care: 'Offer safe conduct under a temporary truce.',
    collectResponse:
      'The Pack rider pays in silver and goes back to warn the next caravan.',
    careResponse:
      'For one night, enemies sleep on opposite sides of a fire without reaching for knives.',
    scenes: [
      [
        'A Raider at Breakfast',
        'A Jackalwire messenger requests breakfast instead of a fight. The Watch cannot decide which is worse.',
      ],
      [
        "The Painted Wagon's Gift",
        'A Pack scout returns a stolen shovel polished bright. There is a note nailed to the handle.',
      ],
      [
        'A Truce with Bad Handwriting',
        'The Pack sends a truce letter written by someone who has never learned all the letters.',
      ],
      [
        'The Captain Without a Banner',
        'A raider captain arrives alone with a folded flag and one broken axle. The watchmen have orders to shoot on sight.',
      ],
      [
        "The Pack's Empty Camp",
        'On the exile road you find a raider camp abandoned in haste. Dinner is still warm.',
      ],
    ],
  },
  {
    id: 'house-feast',
    local: 'old-houses',
    faction: 'freeholds',
    collect: 'Take a gift of ceremonial silver.',
    care: 'Ask that the feast include the kitchen staff.',
    collectResponse:
      'The silver is melted for brass, to the horror of three stewards.',
    careResponse:
      'Kitchen hands sit beside old pedigrees. Neither side quite knows how to behave.',
    scenes: [
      [
        'A Dinner Invitation',
        'An Old House sends four place settings to the court and no explanation of who should sit at them.',
      ],
      [
        'Candles for the Commons',
        'A family offers to host the whole Yard but wants to choose who serves the meal.',
      ],
      [
        'The Unspoken Toast',
        'At a banquet, everyone raises a cup at an empty chair. Nobody will name its owner.',
      ],
      [
        'The Feast with No Meat',
        'The old families host a feast during rationing. Every platter arrives covered and empty.',
      ],
      [
        'Supper Under Exile',
        'A steward brings fine porcelain to the hideout and sets it down on bare earth without a word.',
      ],
    ],
  },
  {
    id: 'glass-oracle',
    local: 'lamplight',
    faction: 'storm-crows',
    collect: 'Trade the unusual glass for useful supplies.',
    care: 'Keep it to study what it remembers.',
    collectResponse:
      'The buyer asks no questions and pays without looking at its reflection.',
    careResponse:
      'In lamplight, the object tells a story differently each time someone watches.',
    scenes: [
      [
        'A Jar of Yesterday',
        "A child brings a jar with yesterday's sunset caught inside like dust. It is still warm.",
      ],
      [
        'A Glass Seed',
        'A Conclave messenger leaves a clear stone that sprouts a tiny glass leaf when warmed. The branch shatters at the sound of a bell.',
      ],
      [
        'The Mirror with the Wrong Door',
        "An old mirror shows a door in the west wall that hasn't been built. A guard swears he watched somebody knock. The latch rattles.",
      ],
      [
        "The Crow's Prism",
        'A prism splits candlelight into colors none of the court has names for. One color darkens whenever a guest lies.',
      ],
      [
        'The Glass That Shows the Road',
        'The object shows an ordinary road until someone asks where it ends. Then the answer moves.',
      ],
    ],
  },
  {
    id: 'courier-trouble',
    local: 'gate-watch',
    faction: 'saltroad',
    collect: 'Buy a copy of the message for the Archive.',
    care: 'Send the courier onward with no inspection.',
    collectResponse:
      'The copied words are mundane enough to be alarming. The envelope is saved.',
    careResponse:
      "The seal goes unbroken. A courier remembers a ruler who didn't always pry.",
    scenes: [
      [
        'A Letter Without a Name',
        'A courier loses the envelope but has memorized every word. He refuses to tell anyone who sent it.',
      ],
      [
        'The Wrong Recipient',
        'A rider arrives with letters for people who died a generation ago, and demands signatures.',
      ],
      [
        'A Seal Not Yet Cast',
        "A letter bears the crown's seal before the new stamp has been made. The wax is warm and the signer is missing. The ink is fresh.",
      ],
      [
        "The Courier Who Won't Dismount",
        'A courier keeps circling the Yard until somebody promises not to open his saddlebag.',
      ],
      [
        'The Last Dispatch',
        'A messenger finds the hideout by following a road that appears on no map, and says the next message is already late.',
      ],
    ],
  },
  {
    id: 'forgotten-song',
    local: 'yard',
    faction: 'mire-mothers',
    collect: 'Sell the old sheet music to the musicians.',
    care: 'Pay the singer to teach the tune to the Yard.',
    collectResponse:
      'The parchment is worth money. The melody stays with whoever heard it.',
    careResponse:
      'The tune passes from cook to guard until strangers sing it together.',
    scenes: [
      [
        'A Song in the Bread Line',
        'An elderly cook sings a tune nobody has heard here and someone at the gate starts weeping.',
      ],
      [
        'The Second Voice',
        'The singers in the Yard hear a second voice from the empty storeroom, perfectly in time.',
      ],
      [
        'The Choir under the Floor',
        'A shift of stone reveals a chamber where sound travels without air. Someone has scratched notes into it.',
      ],
      [
        'The Music of the Broken Well',
        'A well with no water begins to sing when the wind comes from the north. The tune changes when someone speaks a name.',
      ],
      [
        'The Song without an Ending',
        'At the hideout, the old tune returns with a final verse that nobody remembers learning.',
      ],
    ],
  },
  {
    id: 'salt-accounts',
    local: 'ledger',
    faction: 'saltroad',
    collect: 'Collect the disputed payments now.',
    care: 'Audit the books before anyone is fined.',
    collectResponse:
      'The cashbox closes cleanly; the books remain a nest of questions.',
    careResponse:
      'A clerk begins following a trail of lies, which is slow but hard to stop.',
    scenes: [
      [
        'An Extra Zero',
        'The market clerk finds one extra zero in the receipts and three merchants arguing over who deserves it.',
      ],
      [
        'The Double Entry',
        'A Saltroad account pays the same wagon twice for two separate journeys made on the same afternoon.',
      ],
      [
        'The Missing Merchant',
        'A ledger continues posting sales under the name of a merchant buried last winter.',
      ],
      [
        "The King's Invisible Debt",
        "A claim arrives with forty pages of figures and a signature that looks like the emperor's.",
      ],
      [
        'The Account of the Fallen Tower',
        'A ledger arrives at the hideout showing every tax the tower will collect after it has already fallen.',
      ],
    ],
  },
  {
    id: 'moonlit-scouts',
    local: 'gate-watch',
    faction: 'storm-crows',
    collect: 'Hire the scouts for the next road patrol.',
    care: 'Let the scouts exchange observations with the Archive.',
    collectResponse:
      'The scouts take their brass and bring back a useful road report.',
    careResponse:
      'The Archive gathers the contradictory reports and finds a pattern nobody expected.',
    scenes: [
      [
        'A Light on the Ridge',
        'Two scouts see a light where the Watch keeps no patrol. At dawn there are only hoofprints.',
      ],
      [
        'The Scout with No Tracks',
        'A courier says an unseen scout followed them through the valley for six miles.',
      ],
      [
        'The Lantern Wall',
        'Twenty distant lights move together across the dry flats as though strung on a line.',
      ],
      [
        'The Ridge Has Eyes',
        'Every Watch patrol reports a different stranger watching the same ridge from a different direction.',
      ],
      [
        'The Lamps at the Grave',
        'On the exile road, lanterns appear over the places where the fallen were buried.',
      ],
    ],
  },
  {
    id: 'strange-craft',
    local: 'lamplight',
    faction: 'rustline',
    collect: 'Sell the contraption to a buyer who knows its price.',
    care: 'Let the craftsmen dismantle it for knowledge.',
    collectResponse:
      'The buyer can pay, though nobody understands what they bought.',
    careResponse:
      'The workbench fills with gears and questions. The answer may be useful later.',
    scenes: [
      [
        'The Self-Counting Abacus',
        'An abacus in the old office slides its own beads whenever the market opens.',
      ],
      [
        'The Brass Bird',
        'A small metal bird winds itself from a spring, sings once, and folds back into a box.',
      ],
      [
        "The Well-Engine's Heart",
        'A brass pump begins turning with no water, producing a pulse that can be felt in the floor.',
      ],
      [
        'The Maker of Shadows',
        'A craftsman builds a lamp that throws the shadows of objects left outside its light.',
      ],
      [
        'The Machine with No Master',
        'A device from the lost century starts working when the last engineer leaves the room.',
      ],
    ],
  },
  {
    id: 'watch-desertion',
    local: 'gate-watch',
    faction: 'freeholds',
    collect: 'Pay the witness for an honest account.',
    care: 'Offer safe shelter while the facts are examined.',
    collectResponse:
      'A witness takes the reward, and the officers get one statement they can act on.',
    careResponse:
      'The deserter or accuser sleeps safely for a night, and the case can wait until daylight.',
    scenes: [
      [
        'An Empty Watch Cloak',
        "A sentry's cloak hangs on the gate hook. The sentry has left a note saying he will be home for supper.",
      ],
      [
        "The Sergeant's Dice",
        "A sergeant's lucky dice arrive in the barracks without him. His squad denies knowing where he went.",
      ],
      [
        'The Watchman in the Orchard',
        'A soldier hides in the Freehold orchard and asks not to be returned until somebody hears why he fled.',
      ],
      [
        "The Captain's Promise",
        'The Watch demands a deserter be punished. A farmer claims the soldier saved a village.',
      ],
      [
        'The Watch Without a Wall',
        'Soldiers who lost the tower offer to guard the hideout but refuse to wear the old badge.',
      ],
    ],
  },
  {
    id: 'pilgrim-road',
    local: 'yard',
    faction: 'abbey',
    collect: "Accept the pilgrims' donation and let them rest.",
    care: 'Escort them through the dangerous approach.',
    collectResponse:
      'The travelers leave coin and a rumor of a court that takes in strangers.',
    careResponse:
      'The pilgrims arrive intact. They light candles in places where nobody has prayed in years.',
    scenes: [
      [
        'Two Pilgrims and a Cart',
        "Two pilgrims share a cart with a bed-ridden stranger and ask for one night's dry floor.",
      ],
      [
        "The Pilgrim's Boots",
        'A pilgrim reaches the gate barefoot, carrying a pair of boots tied together with black thread.',
      ],
      [
        'The Silent Procession',
        'Pilgrims walk past the fortress without greeting it, all carrying empty bowls.',
      ],
      [
        'The Pilgrim Who Returned',
        'A pilgrim who left for the Abbey years ago arrives older than the number of years can explain.',
      ],
      [
        'The Road of a Hundred Candles',
        "A line of pilgrims walks toward the hideout with lanterns shielded from a wind that hasn't arrived.",
      ],
    ],
  },
  {
    id: 'factions-argue',
    local: 'ledger',
    faction: 'freeholds',
    collect: 'Charge a fee for mediating the quarrel.',
    care: 'Hear both petitions without charging either side.',
    collectResponse: "The factions pay for an answer they don't quite accept.",
    careResponse:
      'Both sides leave with fewer certainties and one shared responsibility.',
    scenes: [
      [
        'Who Owns the Stray Pig',
        "A Freehold farmer and a Ledger broker claim the same escaped pig. It eats the broker's claim.",
      ],
      [
        "The Creek's Real Name",
        'Two villages dispute which name belongs on the map beside the new canal. Each claims their ancestors dug it.',
      ],
      [
        'Whose Bridge Is It',
        'The same river bridge appears on two tax rolls, each with different owners and damaged stones.',
      ],
      [
        'The Order That Cannot Stand',
        "Three factions present contradictory orders bearing the tower's official seal.",
      ],
      [
        'The Border of Exile',
        'Refugees ask whether the realm has ended where the emperor sleeps now or where the banner was left behind.',
      ],
    ],
  },
]

const actOneOptions = (motif: Motif): ChanceEventChoice[] =>
  ACT_ONE_CHOICES[motif.id]!.map((option) => ({
    ...option,
    effects: {
      ...option.effects,
      // The old care decision led into a later callback. Preserve that
      // history when switching to bespoke prose and consequence flags.
      flags: [
        ...(option.effects.flags ?? []),
        ...(option.id === 'care' ? [`chance:${motif.id}:1`] : []),
      ],
    },
  }))

const ordinaryEvents: ChanceEvent[] = MOTIFS.flatMap((motif) =>
  motif.scenes.map(([title, text], index) => {
    const act = index + 1
    return {
      id: `${motif.id}-${act}`,
      act,
      series: motif.id,
      title,
      text,
      choices:
        act === 1
          ? actOneOptions(motif)
          : [
              {
                id: 'collect',
                label: motif.collect,
                response: motif.collectResponse,
                effects: {
                  brass: 4 + act * 4,
                  local: { [motif.local]: -1 },
                  affinity: { [motif.faction]: act },
                },
              },
              {
                id: 'care',
                label: motif.care,
                response: motif.careResponse,
                effects: {
                  brass: act === 1 ? 0 : -act * 2,
                  local: { [motif.local]: act + 1 },
                  flags: [`chance:${motif.id}:${act}`],
                },
              },
            ],
    }
  }),
)

const SECRET_VISITORS: readonly {
  act: number
  follower: string
  title: string
  text: string
  welcome: string
  decline: string
  yes: string
  no: string
}[] = [
  {
    act: 1,
    follower: 'F021',
    title: 'A Midwife at the South Gate',
    text: 'A midwife arrives with red thread, no bedroll and the news that three Freehold households have disappeared. She would stay if the court can spare a bed.',
    welcome: 'Invite Nettle to serve the wounded without swearing fealty.',
    decline: 'Give her safe passage to continue her search.',
    yes: 'Nettle looks at the infirmary, then the roads. She says she will wait by the gate until there is space for her.',
    no: 'She ties a red thread on the gate latch. It is a promise to return if the roads allow it.',
  },
  {
    act: 2,
    follower: 'F022',
    title: 'The Signal Under the Tracks',
    text: 'A small traveler taps the railway sleeper with a spoon. An answer comes from beneath the metal. Tiller Brassfin has followed that sound for years and wants companions for the next stretch.',
    welcome: 'Offer Tiller a place near the smithy and a share of the watch.',
    decline: 'Trade notes with Tiller, but leave the rails to him.',
    yes: 'Tiller asks whether the old rail station has power. When you say no, his smile widens.',
    no: 'The tapping recedes into the night, three knocks at a time.',
  },
  {
    act: 3,
    follower: 'F023',
    title: 'The Keeper with the Clapper',
    text: 'Sera Vell arrives with a bronze bell clapper and a list of names the Hollow Bell registers do not hold. The last name on her list is yours.',
    welcome: 'Invite Sera to read the bells alongside the court.',
    decline: 'Send an archivist with her to compare records.',
    yes: 'Sera places the clapper on the floor. It rings once against no bell.',
    no: 'The archivist leaves a lamp in your doorway. It burns blue until dawn.',
  },
  {
    act: 4,
    follower: 'F024',
    title: 'The Runner without a Wagon',
    text: 'A Jackalwire outrider arrives on foot, chased by the people they used to collect tolls for. Tarn offers a map of every southern ambush but asks that the court leave their past unnamed.',
    welcome: 'Give Tarn work as a scout, not a prisoner.',
    decline: 'Trade a safe route out for an honest warning.',
    yes: 'Tarn points to three turns in the road that no cart should take. Then they sit down for the first time all day.',
    no: 'Tarn draws a crossing on the dirt and erases it before leaving.',
  },
  {
    act: 5,
    follower: 'F025',
    title: 'A Rain Gauge Filled with Sand',
    text: "A weather-reader steps from a storm that hasn't reached the hideout. Odo Rainglass says the weather is arriving backwards and has brought news of one possible tomorrow.",
    welcome: 'Invite Odo to face the coming road with the exiles.',
    decline: 'Ask for the forecast and let Odo travel freely.',
    yes: 'Odo pours out the dry rain. It makes a sound like water hitting the roof.',
    no: "They hand you a piece of blue glass and say, 'Keep this for a future you can change.'",
  },
]
const visitorEvents: ChanceEvent[] = SECRET_VISITORS.map((person) => ({
  id: `secret-${person.follower}`,
  act: person.act,
  series: `visitor-${person.follower}`,
  title: person.title,
  text: person.text,
  secretFollower: person.follower,
  choices: [
    {
      id: 'welcome',
      label: person.welcome,
      response: person.yes,
      effects: {
        recruitable: [person.follower],
        local: { yard: 1 },
        flags: [`met:${person.follower}`],
      },
    },
    {
      id: 'part',
      label: person.decline,
      response: person.no,
      effects: {
        brass: 5 + person.act * 2,
        local: { lamplight: 1 },
        flags: [`farewell:${person.follower}`],
      },
    },
  ],
}))

export const CHANCE_EVENTS: readonly ChanceEvent[] = [
  ...ordinaryEvents,
  ...visitorEvents,
]
export const chanceEvent = (id: string): ChanceEvent | undefined =>
  CHANCE_EVENTS.find((event) => event.id === id)
