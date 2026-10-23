import {
  BRIAR_CROSS_MAP_KEYS,
  BRIAR_REVEAL_WAVES,
} from './memoryDungeonWaves'
import { BRIAR_TILES } from './memoryDungeonWorld'

/**
 * CONTENT PROPOSAL, not hooked into the playable story screen.
 * Exactly one authored illustrated encounter for every 8x8 overworld square.
 *
 * Choices are candidate narrative outcomes; they do not yet grant items or
 * change faction meters. Preserve current mechanical landmarks and save data
 * until a scripted-event executor is implemented and tested.
 */
export type DungeonStoryValue =
  | 'community' | 'nature' | 'truth' | 'mercy' | 'identity'
  | 'court' | 'freedom'

export interface DungeonStoryChoice {
  id: string
  label: string
  result: string
  value: DungeonStoryValue
}
export interface DungeonStoryTile {
  title: string
  introduction: string
  artDirection: string
  choices: readonly DungeonStoryChoice[]
}

export const BRIAR_STORY_ATLAS: Record<string, DungeonStoryTile> = {
  '1,1': {
    title: 'North Star Twin',
    introduction: 'A seven-point star has one point polished by someone who was not there.',
    artDirection: 'A blue-white star-seal at a mossy standing stone beside royal footprints.',
    choices: [
      {
        id: 'c1',
        label: 'Sketch the missing point',
        result: 'You record a shape the court officially denies',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Cover the exposed seal',
        result: 'You protect the little creatures nesting beneath it',
        value: 'nature',
      },
    ],
  },
  '2,1': {
    title: 'The Unclaimed Stair',
    introduction: 'Two sets of identical bootprints descend a staircase, but only one set returns.',
    artDirection: 'A spiral ruin stair half buried in a forest ridge, matched royal bootprints.',
    choices: [
      {
        id: 'c1',
        label: 'Follow the lighter steps',
        result: 'You find a silk thread caught on bramble',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Tend the broken railing',
        result: 'Travelers can now cross without falling',
        value: 'community',
      },
    ],
  },
  '3,1': {
    title: 'Thimble Court',
    introduction: 'Small folk insist the old king promised them a voice, not a throne.',
    artDirection: 'A forest council of tiny carved seats around a stone table.',
    choices: [
      {
        id: 'c1',
        label: 'Hear their petition',
        result: 'The court owes someone smaller a hearing',
        value: 'community',
      },
      {
        id: 'c2',
        label: 'Ask who broke the promise',
        result: 'The royal seal on their decree has been altered',
        value: 'truth',
      },
    ],
  },
  '4,1': {
    title: 'Bellwood Tower',
    introduction: 'A bell rings once for births, once for deaths, and twice for someone in between.',
    artDirection: 'A slanted tower among firs with a suspended silver bell.',
    choices: [
      {
        id: 'c1',
        label: 'Climb for the view',
        result: 'You glimpse two princes on the same road',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Mend the bell rope',
        result: 'The village keeps its warning bell',
        value: 'community',
      },
    ],
  },
  '5,1': {
    title: 'The Wrong Sleeve',
    introduction: "A prince's gold cuff has been sewn to a funeral-black cloak.",
    artDirection: 'An abandoned gold embroidered sleeve laid against a black velvet coat.',
    choices: [
      {
        id: 'c1',
        label: 'Take the scrap to court',
        result: 'The twins must explain an old exchanged costume',
        value: 'court',
      },
      {
        id: 'c2',
        label: 'Leave it for its owner',
        result: 'Someone returns after dusk looking relieved',
        value: 'mercy',
      },
    ],
  },
  '6,1': {
    title: 'Foxglove Shelter',
    introduction: 'Refugees shelter in a flower meadow that the crown calls unused land.',
    artDirection: 'A flower-crowned field canopy with weary travelers and lanterns.',
    choices: [
      {
        id: 'c1',
        label: 'Share your trail map',
        result: 'The travelers gain a route beyond the patrol',
        value: 'community',
      },
      {
        id: 'c2',
        label: 'Warn them of the patrol',
        result: 'They relocate before soldiers arrive',
        value: 'mercy',
      },
    ],
  },
  '7,1': {
    title: 'The Two-Note Bird',
    introduction: 'A songbird repeats the same melody with one altered final note.',
    artDirection: 'A jewel-bright woodland bird perched among two tuning forks.',
    choices: [
      {
        id: 'c1',
        label: 'Memorize the difference',
        result: 'You gain a clue about false-perfect matches',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Teach the song to a child',
        result: 'The refrain survives beyond the court archive',
        value: 'community',
      },
    ],
  },
  '8,1': {
    title: 'Whitewing Cipher',
    introduction: 'Two wing emblems differ by a feather, and the court has burned one copy.',
    artDirection: 'A white bird crest carved in salt stone with one reversed feather.',
    choices: [
      {
        id: 'c1',
        label: 'Record the feather count',
        result: 'The royal heraldry can no longer fool you',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Preserve the stone',
        result: 'The seal remains for a later region to answer',
        value: 'nature',
      },
    ],
  },
  '1,2': {
    title: 'The Mushroom Witness',
    introduction: 'A mushroom insists it saw you pass yesterday while you were elsewhere.',
    artDirection: 'An enormous amber mushroom shading a tiny witness under roots.',
    choices: [
      {
        id: 'c1',
        label: 'Ask it to repeat your words',
        result: 'It quotes a voice that sounds exactly like yours',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Pay for its silence',
        result: 'You protect a frightened witness from the court',
        value: 'mercy',
      },
    ],
  },
  '2,2': {
    title: "Lark's False Welcome",
    introduction: 'A welcome sign has your handwriting, although you never wrote it.',
    artDirection: 'A welcome arch tangled with ribbons and two near-identical signatures.',
    choices: [
      {
        id: 'c1',
        label: 'Compare the lettering',
        result: 'The final curl belongs to someone imitating you',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Keep the sign standing',
        result: 'The road remains kind to newcomers',
        value: 'community',
      },
    ],
  },
  '3,2': {
    title: 'Latchless Door',
    introduction: 'A door without walls has a keyhole shaped like a hand.',
    artDirection: 'A free-standing wooden doorway wrapped in flowering vines.',
    choices: [
      {
        id: 'c1',
        label: 'Try your own hand',
        result: 'The latch recognizes a shape but not your name',
        value: 'identity',
      },
      {
        id: 'c2',
        label: 'Ask permission first',
        result: 'A quiet voice grants entry to a later clue',
        value: 'mercy',
      },
    ],
  },
  '4,2': {
    title: "Mosswick's Stall",
    introduction: 'Mosswick sells lanterns, rumors, and receipts that everyone claims to have lost.',
    artDirection: 'A friendly old stall with hanging lanterns, herbs, and a lockbox.',
    choices: [
      {
        id: 'c1',
        label: 'Ask about the identical visitors',
        result: 'Mosswick remembers a second you buying road bread',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Check his ledger honestly',
        result: 'You learn who has been paying for refugee meals',
        value: 'community',
      },
      {
        id: 'c3',
        label: 'Barter for a clue',
        result: 'Mosswick owes you a clearer account of the court',
        value: 'court',
      },
    ],
  },
  '5,2': {
    title: 'Sleeping Sigil',
    introduction: 'The crest looks the same as a distant one, except for the direction of its roots.',
    artDirection: 'A violet seal embedded in a flat river stone, mirror-like rootwork.',
    choices: [
      {
        id: 'c1',
        label: 'Draw both halves',
        result: 'You preserve the clue for the next overworld',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Protect the carving',
        result: 'The seal survives its next long winter',
        value: 'nature',
      },
    ],
  },
  '6,2': {
    title: 'Rootbound Vault',
    introduction: 'The vault does not ask who you resemble, only what you remember.',
    artDirection: 'A vine-shrouded wooden gate with twin brass locks and glowing seams.',
    choices: [
      {
        id: 'c1',
        label: 'Listen at the threshold',
        result: "You hear another person's memories through the door",
        value: 'truth',
      },
      {
        id: 'c2',
        label: "Seek the keeper's consent",
        result: 'The old wards turn less hostile',
        value: 'mercy',
      },
      {
        id: 'c3',
        label: 'Ready your matching deck',
        result: 'The inner chambers await a fair challenge',
        value: 'identity',
      },
    ],
  },
  '7,2': {
    title: 'The Petition Line',
    introduction: 'Villagers have queued for days to prove they are themselves.',
    artDirection: 'A winding forest queue under royal identity-check banners.',
    choices: [
      {
        id: 'c1',
        label: 'Stand with the petitioners',
        result: 'The crowd gains a witness against the decree',
        value: 'community',
      },
      {
        id: 'c2',
        label: 'Study the official papers',
        result: 'The seal changes color under moonlight',
        value: 'truth',
      },
    ],
  },
  '8,2': {
    title: 'Rose-Court Tribunal',
    introduction: 'A sleeping judge wrote a verdict before hearing testimony.',
    artDirection: "An abandoned woodland dais with a blooming rose on a judge's chair.",
    choices: [
      {
        id: 'c1',
        label: 'Read the sealed verdict',
        result: 'The case was decided before you arrived',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Wake the clerk gently',
        result: 'The clerk admits the trial was staged',
        value: 'mercy',
      },
    ],
  },
  '1,3': {
    title: 'Briar Ferryman',
    introduction: 'A ferryman refuses coins, accepting only stories that have not been told.',
    artDirection: 'A narrow reed boat crossing a black-green river between pines.',
    choices: [
      {
        id: 'c1',
        label: 'Tell an uncomfortable truth',
        result: 'The ferryman points toward a safe crossing',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Offer a story about others',
        result: 'The water returns the tale with missing names',
        value: 'identity',
      },
    ],
  },
  '2,3': {
    title: 'Duet Hollow',
    introduction: 'A voice answers every note of a tune, one heartbeat late.',
    artDirection: 'A circular grove with twin carved wooden flutes and moonlit leaves.',
    choices: [
      {
        id: 'c1',
        label: 'Sing the second part',
        result: 'You learn that harmony is not the same as sameness',
        value: 'identity',
      },
      {
        id: 'c2',
        label: 'Listen without answering',
        result: 'A hidden third voice reveals itself',
        value: 'truth',
      },
    ],
  },
  '3,3': {
    title: 'The Counterfeit Market',
    introduction: 'Sellers offer memories in jars; every price tag uses your name.',
    artDirection: 'A twilight flea market of glass jars and half-hidden faces.',
    choices: [
      {
        id: 'c1',
        label: 'Reject the bargain',
        result: 'The seller admits not every memory can be owned',
        value: 'freedom',
      },
      {
        id: 'c2',
        label: 'Ask who bottled them',
        result: 'A displaced family tells you the jars were seized',
        value: 'community',
      },
    ],
  },
  '4,3': {
    title: 'Oath-Fern Crossing',
    introduction: 'A bridge blooms only for a promise made with witnesses.',
    artDirection: 'A fern bridge rising across a creek as people watch from both banks.',
    choices: [
      {
        id: 'c1',
        label: 'Promise to return',
        result: 'The bridge grows in trust but remembers your word',
        value: 'identity',
      },
      {
        id: 'c2',
        label: 'Invite the crowd to decide',
        result: 'Everyone shares responsibility for the crossing',
        value: 'community',
      },
    ],
  },
  '5,3': {
    title: 'The River Lock',
    introduction: 'A dam protects homes but starves the spawning pools.',
    artDirection: 'A wooden floodgate over a river with salmon-like silver shadows.',
    choices: [
      {
        id: 'c1',
        label: 'Open a side channel',
        result: 'Fish return, but the mill must alter its work',
        value: 'nature',
      },
      {
        id: 'c2',
        label: 'Recruit mill workers',
        result: 'The people design a slower shared solution',
        value: 'community',
      },
    ],
  },
  '6,3': {
    title: 'Waxen Testament',
    introduction: 'A wax seal depicts two identical infants with different shadows.',
    artDirection: 'A royal document in a bronze lantern, two infant silhouettes in wax.',
    choices: [
      {
        id: 'c1',
        label: 'Warm the parchment',
        result: 'A secret oath emerges beneath the royal seal',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Leave the wax untouched',
        result: 'The fragile testament remains evidence',
        value: 'mercy',
      },
    ],
  },
  '7,3': {
    title: 'Thorn Patrol',
    introduction: 'Two sentries are ordered to seize anyone who cannot prove a unique identity.',
    artDirection: 'A forest checkpoint with shields, thorn pennants and worried guards.',
    choices: [
      {
        id: 'c1',
        label: 'Talk to the younger guard',
        result: 'He doubts an order that punished his sister',
        value: 'mercy',
      },
      {
        id: 'c2',
        label: 'Challenge the officers',
        result: 'You may earn passage through a matching duel',
        value: 'identity',
      },
    ],
  },
  '8,3': {
    title: 'The Border Cairn',
    introduction: 'Someone moved the old border stones into the village graveyard.',
    artDirection: 'A row of tiny carved standing stones among old graves.',
    choices: [
      {
        id: 'c1',
        label: 'Restore the old markers',
        result: 'The shared commons regain their original boundary',
        value: 'community',
      },
      {
        id: 'c2',
        label: 'Ask why they were moved',
        result: 'A royal surveyor names the hidden beneficiary',
        value: 'truth',
      },
    ],
  },
  '1,4': {
    title: 'The Sighing Ferry',
    introduction: 'A ghost ferries arguments to the opposite shore and returns them kinder.',
    artDirection: 'A half-sunken ferry lit by fireflies and mist.',
    choices: [
      {
        id: 'c1',
        label: 'Speak of your lost home',
        result: 'The ghost asks whether anyone there still knows you',
        value: 'identity',
      },
      {
        id: 'c2',
        label: 'Listen to the ghost',
        result: 'You learn that even dead promises can be renewed',
        value: 'mercy',
      },
    ],
  },
  '2,4': {
    title: 'Briar Camp',
    introduction: 'A signpost welcomes you by name. Someone altered it yesterday.',
    artDirection: 'A friendly woodland campfire beside a sign bearing two different handwriting styles.',
    choices: [
      {
        id: 'c1',
        label: 'Ask who changed the sign',
        result: 'A traveler recalls another you passing at dawn',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Help prepare supper',
        result: 'The camp remembers that you gave without being asked',
        value: 'community',
      },
      {
        id: 'c3',
        label: 'Study the trail map',
        result: 'You discover the royal road was drawn over an older path',
        value: 'nature',
      },
    ],
  },
  '3,4': {
    title: 'The Double Footprints',
    introduction: 'Two sets of your footprints run parallel until one veers homeward.',
    artDirection: 'A damp path imprinted with twin sets of identical boots.',
    choices: [
      {
        id: 'c1',
        label: 'Follow the homeward pair',
        result: 'You find a ribbon from your own old coat',
        value: 'identity',
      },
      {
        id: 'c2',
        label: 'Follow the forestward pair',
        result: 'You learn the imitation was also frightened',
        value: 'mercy',
      },
    ],
  },
  '4,4': {
    title: 'The Courtesy Fork',
    introduction: 'One path is paved by royal decree, the other kept open by walkers.',
    artDirection: 'A forest fork, one paved and formal, one soft with animal tracks.',
    choices: [
      {
        id: 'c1',
        label: 'Take the public path',
        result: 'A family offers directions freely',
        value: 'community',
      },
      {
        id: 'c2',
        label: 'Study the neglected trail',
        result: 'You find roots bending around an old trap',
        value: 'nature',
      },
    ],
  },
  '5,4': {
    title: 'Council of Hollow Oaks',
    introduction: 'The village is divided about letting changelings rent houses.',
    artDirection: 'A ring of hollow oaks with lantern-lit neighbors in heated debate.',
    choices: [
      {
        id: 'c1',
        label: 'Defend fair hearings',
        result: 'The council agrees to hear each case',
        value: 'community',
      },
      {
        id: 'c2',
        label: 'Demand safeguards',
        result: 'The elders create a transparent witness process',
        value: 'truth',
      },
    ],
  },
  '6,4': {
    title: 'A Letter to Yourself',
    introduction: 'A letter in your handwriting begs you not to believe the next letter.',
    artDirection: 'A creased letter floating in a small paper boat.',
    choices: [
      {
        id: 'c1',
        label: 'Read every line aloud',
        result: "Someone else's memory answers one sentence",
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Seal it for later',
        result: 'You retain a promise that has not yet been tested',
        value: 'identity',
      },
    ],
  },
  '7,4': {
    title: 'The Crooked Bridge',
    introduction: 'A bridge bends toward the traveler carrying the heavier regret.',
    artDirection: 'An arching crooked wooden bridge with two figures at opposite ends.',
    choices: [
      {
        id: 'c1',
        label: 'Cross without excuses',
        result: 'The bridge steadies beneath your honest steps',
        value: 'identity',
      },
      {
        id: 'c2',
        label: 'Help the other traveler',
        result: "Two people cross despite the bridge's complaints",
        value: 'community',
      },
    ],
  },
  '8,4': {
    title: 'Thorn Gate',
    introduction: 'The gate can be opened by the Chime, but the keeper insists someone will be displaced.',
    artDirection: 'A monumental living-thorn gate framing a glimpse of an enchanted orchard.',
    choices: [
      {
        id: 'c1',
        label: 'Ask who pays the price',
        result: "The keeper tells you about the gate's forgotten guardians",
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Ring the Bramble Chime',
        result: 'The road beyond opens without ending its moral debt',
        value: 'identity',
      },
    ],
  },
  '1,5': {
    title: 'The Root Nursery',
    introduction: 'Seedlings rise from a path the soldiers ordered cleared.',
    artDirection: 'A low woodland nursery of tiny tree seedlings protected by moss.',
    choices: [
      {
        id: 'c1',
        label: 'Care for the seedlings',
        result: 'The path may close later but the forest persists',
        value: 'nature',
      },
      {
        id: 'c2',
        label: 'Mark a safe detour',
        result: 'People gain passage without trampling roots',
        value: 'community',
      },
    ],
  },
  '2,5': {
    title: 'The Ribbon Trap',
    introduction: 'A beautiful bow hides a snare, meant to catch something with your face.',
    artDirection: 'A scarlet ribbon tied around a bent sapling snare.',
    choices: [
      {
        id: 'c1',
        label: 'Disarm the wire',
        result: 'No passerby will be caught by the trap',
        value: 'mercy',
      },
      {
        id: 'c2',
        label: 'Follow its maker',
        result: 'You spot a crest once worn by the court',
        value: 'truth',
      },
    ],
  },
  '3,5': {
    title: 'Glass-Leaf Trail',
    introduction: "Transparent leaves show yesterday's sky, even during rain.",
    artDirection: 'A carpet of translucent leaves reflecting a sunset that is not here.',
    choices: [
      {
        id: 'c1',
        label: 'Study the reflections',
        result: 'The changeling crossed beneath two different skies',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Gather fallen leaves only',
        result: 'The living tree remains undisturbed',
        value: 'nature',
      },
    ],
  },
  '4,5': {
    title: 'A Lost Courier',
    introduction: 'A courier carries royal letters for two princes who claim the same throne.',
    artDirection: 'A weary courier in a muddy blue cloak clutching two sealed bags.',
    choices: [
      {
        id: 'c1',
        label: 'Deliver both letters',
        result: 'Neither twin can accuse you of suppressing a voice',
        value: 'community',
      },
      {
        id: 'c2',
        label: 'Ask who wrote them',
        result: 'Both letters use the same careful handwriting',
        value: 'truth',
      },
    ],
  },
  '5,5': {
    title: 'Moss Sprite',
    introduction: 'A mischievous sprite demands a fair match and recognizes your stolen reflection.',
    artDirection: 'A clever woodland trickster perched on a floating memory card.',
    choices: [
      {
        id: 'c1',
        label: 'Ask what the sprite saw',
        result: 'It saw your double crying at the creek',
        value: 'mercy',
      },
      {
        id: 'c2',
        label: 'Accept a memory duel',
        result: 'The sprite reveals what it knows through fair play',
        value: 'truth',
      },
    ],
  },
  '6,5': {
    title: 'The Orchard Without Fruit',
    introduction: 'The old trees bloom each year, yet every harvest belongs to the palace.',
    artDirection: 'An uncanny orchard of lush blossom and empty baskets.',
    choices: [
      {
        id: 'c1',
        label: 'Question the harvest tithe',
        result: 'Villagers describe an unequal bargain',
        value: 'community',
      },
      {
        id: 'c2',
        label: 'Examine the flowering roots',
        result: 'The trees are exhausted by a secret charm',
        value: 'nature',
      },
    ],
  },
  '7,5': {
    title: 'The Shared Cradle',
    introduction: 'Two families insist the same child is theirs; the child recognizes both.',
    artDirection: 'A woven cradle between two homes in a peaceful glade.',
    choices: [
      {
        id: 'c1',
        label: 'Hear the child first',
        result: 'Her voice changes the terms of the argument',
        value: 'mercy',
      },
      {
        id: 'c2',
        label: 'Trace the adoption record',
        result: 'A forged seal explains the dispute',
        value: 'truth',
      },
    ],
  },
  '8,5': {
    title: 'Ink-Stained Pact',
    introduction: "A contract promises safety but takes the signer's true name.",
    artDirection: 'A floating parchment with dark ink traveling up living vines.',
    choices: [
      {
        id: 'c1',
        label: 'Read the small print',
        result: "You learn the court's name magic has loopholes",
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Refuse the contract',
        result: 'You preserve the right to walk away',
        value: 'freedom',
      },
    ],
  },
  '1,6': {
    title: 'Scent of Home',
    introduction: 'A familiar supper smell travels from a house that burned years ago.',
    artDirection: 'A warm phantom kitchen visible through trunks at dusk.',
    choices: [
      {
        id: 'c1',
        label: 'Follow the scent',
        result: 'A memory of home is real even if the house is not',
        value: 'identity',
      },
      {
        id: 'c2',
        label: 'Share food with a stranger',
        result: 'Someone remembers your kindness rather than your face',
        value: 'community',
      },
    ],
  },
  '2,6': {
    title: 'Moss Inscription',
    introduction: 'An old carving holds the order leaf, leaf, sun, and a second pattern beneath it.',
    artDirection: 'An ancient mossy rock showing overlapping carved leaf and sun runes.',
    choices: [
      {
        id: 'c1',
        label: 'Read the shallow pattern',
        result: 'The Three Quiet Stones hint becomes clear',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Rubb the weathered edge',
        result: 'The deeper inscription suggests a later reversal',
        value: 'truth',
      },
    ],
  },
  '3,6': {
    title: 'Creekside Cache',
    introduction: 'Someone hid medicine beside coins and marked the box for a family.',
    artDirection: 'A small oak chest beneath wet ferns beside a narrow creek.',
    choices: [
      {
        id: 'c1',
        label: 'Open with care',
        result: "You discover wildflowers and a child's request",
        value: 'community',
      },
      {
        id: 'c2',
        label: 'Leave the medicine intact',
        result: 'Another traveler may still need what was saved',
        value: 'mercy',
      },
    ],
  },
  '4,6': {
    title: 'A Small Oath',
    introduction: 'A tree has grown around an old promise; cutting it free would end the vow.',
    artDirection: 'A tree embracing a rusted oath chain, dappled green light.',
    choices: [
      {
        id: 'c1',
        label: 'Honor the living tree',
        result: 'You learn that some promises should adapt',
        value: 'nature',
      },
      {
        id: 'c2',
        label: 'Search for the oathmaker',
        result: 'An elderly neighbor admits the vow hurt others',
        value: 'truth',
      },
    ],
  },
  '5,6': {
    title: 'The Spyglass Clearing',
    introduction: 'A cracked spyglass shows two identical figures taking different roads.',
    artDirection: 'A brass telescope trained on a far-off two-road clearing.',
    choices: [
      {
        id: 'c1',
        label: 'Align the split lenses',
        result: 'Both royal heirs appear in the same reflection',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Share the view',
        result: 'Travelers stop confusing appearance with loyalty',
        value: 'community',
      },
    ],
  },
  '6,6': {
    title: 'Broken Crowns',
    introduction: "Two coronets lie beneath one tree, each missing the other's gemstone.",
    artDirection: 'A pair of battered gold crowns, one tied with black silk.',
    choices: [
      {
        id: 'c1',
        label: 'Repair neither yet',
        result: 'You hear why both heirs surrendered their right',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Bring them together',
        result: 'The crowns almost fit but expose different dents',
        value: 'identity',
      },
    ],
  },
  '7,6': {
    title: 'Riverbank Chest',
    introduction: 'A chest glows under reeds, its lock decorated with a tiny sleeping moth.',
    artDirection: 'A glowing treasure chest beside a river among silver reeds.',
    choices: [
      {
        id: 'c1',
        label: 'Open the lock gently',
        result: 'You find a lantern for a later memory challenge',
        value: 'mercy',
      },
      {
        id: 'c2',
        label: "Inspect the old maker's mark",
        result: 'The royal armorer once worked for the refugees',
        value: 'truth',
      },
    ],
  },
  '8,6': {
    title: 'The Thirsty Well',
    introduction: 'A town well is fresh but the forest spring runs dry.',
    artDirection: 'A cracked community well and root network beside thirsty trees.',
    choices: [
      {
        id: 'c1',
        label: 'Share water with the grove',
        result: 'The villagers must ration until rain',
        value: 'nature',
      },
      {
        id: 'c2',
        label: 'Repair the broken aqueduct',
        result: 'People and roots gain a fairer supply',
        value: 'community',
      },
    ],
  },
  '1,7': {
    title: 'The Tangled Chorus',
    introduction: 'A choir sings one note until a stranger introduces a needed discord.',
    artDirection: 'A chorus of woodland travelers singing under woven branches.',
    choices: [
      {
        id: 'c1',
        label: 'Sing a different note',
        result: 'The choir finds harmony without erasing voices',
        value: 'freedom',
      },
      {
        id: 'c2',
        label: 'Conduct the whole circle',
        result: 'Everyone finds room to contribute',
        value: 'community',
      },
    ],
  },
  '2,7': {
    title: 'Three Quiet Stones',
    introduction: 'The stones ask for two forest marks, then sunlight. Somebody hid a second truth beneath the sequence.',
    artDirection: 'Three luminous standing stones with leaf and sun runes and an inset clue groove.',
    choices: [
      {
        id: 'c1',
        label: 'Compare the carved layers',
        result: 'You spot a sequence the official plaque omits',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Ask the stones who set the test',
        result: 'The answer points to a grieving court mason',
        value: 'mercy',
      },
      {
        id: 'c3',
        label: 'Enter a remembered rune',
        result: 'The stones answer your chosen symbol with light',
        value: 'identity',
      },
    ],
  },
  '3,7': {
    title: 'The Sister Garden',
    introduction: 'A gardener plants flowers for a sister the court claims never existed.',
    artDirection: 'A delicate moonlit garden with two adjoining paths and one empty bench.',
    choices: [
      {
        id: 'c1',
        label: 'Help restore her name',
        result: 'A lost family gains a public remembrance',
        value: 'community',
      },
      {
        id: 'c2',
        label: 'Read the seed ledger',
        result: 'A deliberate erasure appears among the dates',
        value: 'truth',
      },
    ],
  },
  '4,7': {
    title: 'The Sacred Root',
    introduction: 'A village needs wood, but this root network keeps the valley from sliding.',
    artDirection: 'A huge exposed root lattice above a cliffside village.',
    choices: [
      {
        id: 'c1',
        label: 'Seek fallen timber instead',
        result: 'The village sacrifices speed to protect the slope',
        value: 'nature',
      },
      {
        id: 'c2',
        label: 'Invent a shared quota',
        result: 'The forest is harvested more carefully',
        value: 'community',
      },
    ],
  },
  '5,7': {
    title: 'Smoke Without Fire',
    introduction: 'Smoke signals from the hills describe a battle that has not happened.',
    artDirection: 'A distant smoke column over a wet meadow with no flame.',
    choices: [
      {
        id: 'c1',
        label: 'Track the source',
        result: 'You discover a warning sent through time',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Warn the settlements',
        result: 'The villagers prepare before danger arrives',
        value: 'community',
      },
    ],
  },
  '6,7': {
    title: 'Mirror Meadow',
    introduction: 'A pool gives each traveler the face they fear becoming.',
    artDirection: 'A violet meadow of shallow reflecting pools and whispering reeds.',
    choices: [
      {
        id: 'c1',
        label: 'Face the borrowed reflection',
        result: 'You recognize a kindness you feared losing',
        value: 'identity',
      },
      {
        id: 'c2',
        label: 'Help another traveler look',
        result: "They see themselves without the court's labels",
        value: 'mercy',
      },
    ],
  },
  '7,7': {
    title: 'Shadows of the Palace',
    introduction: 'The princes meet in secret to trade costumes before a public appearance.',
    artDirection: 'A palace terrace where identical princes exchange white silk and black velvet.',
    choices: [
      {
        id: 'c1',
        label: 'Watch without accusing',
        result: 'Their performance reveals a more complicated rivalry',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Ask who chose the costumes',
        result: 'Neither brother remembers when the disguise began',
        value: 'identity',
      },
    ],
  },
  '8,7': {
    title: "The Queen's Unsent Reply",
    introduction: 'A draft decree tells the twins they can both be loved without sharing a crown.',
    artDirection: 'An unfinished letter beneath a small portrait of a sorrowful queen.',
    choices: [
      {
        id: 'c1',
        label: 'Deliver the message',
        result: 'Both heirs must confront a kindness they distrust',
        value: 'mercy',
      },
      {
        id: 'c2',
        label: 'Preserve it as evidence',
        result: "The court's missing history gains an anchor",
        value: 'truth',
      },
    ],
  },
  '1,8': {
    title: 'The Briar Refuge',
    introduction: 'Families keep a hidden sanctuary for travelers without proper names.',
    artDirection: 'A candlelit forest refuge under intertwined branches.',
    choices: [
      {
        id: 'c1',
        label: 'Offer to repair the shelter',
        result: 'The refuge can outlast one heroic visitor',
        value: 'community',
      },
      {
        id: 'c2',
        label: 'Ask how they choose whom to trust',
        result: 'You learn mercy also needs boundaries',
        value: 'truth',
      },
    ],
  },
  '2,8': {
    title: 'Mill of Lost Hours',
    introduction: 'A broken mill grinds discarded memories into flour for the town.',
    artDirection: 'A whimsical old mill with luminous grain and a turning clockwheel.',
    choices: [
      {
        id: 'c1',
        label: 'Stop the hidden millstone',
        result: 'No more memories are burned to feed the village',
        value: 'freedom',
      },
      {
        id: 'c2',
        label: 'Help find another fuel',
        result: 'The millers have time to change their work',
        value: 'community',
      },
    ],
  },
  '3,8': {
    title: 'The Truth Pool',
    introduction: 'Two visitors see the same childhood, but one remembers an extra person.',
    artDirection: 'A black mirror pond revealing a third shadow between two figures.',
    choices: [
      {
        id: 'c1',
        label: 'Name the missing witness',
        result: 'A family secret becomes speakable',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Leave the image unclaimed',
        result: 'Someone else may tell the memory in their own time',
        value: 'mercy',
      },
    ],
  },
  '4,8': {
    title: "Saint's Spring",
    introduction: 'The famous healing water works, but takes strength from nearby roots.',
    artDirection: 'A sparkling forest spring surrounded by fragile luminous trees.',
    choices: [
      {
        id: 'c1',
        label: 'Heal the wounded first',
        result: 'You accept a temporary debt to the grove',
        value: 'mercy',
      },
      {
        id: 'c2',
        label: 'Design a gentler ritual',
        result: 'The spring endures with smaller miracles',
        value: 'nature',
      },
    ],
  },
  '5,8': {
    title: 'The Candle Grove',
    introduction: 'A flickering candle goes out each time the court declares someone false.',
    artDirection: 'A grove of floating candles, one flame shaped like a small star.',
    choices: [
      {
        id: 'c1',
        label: 'Shield the weakest flame',
        result: 'A forgotten citizen keeps their name',
        value: 'community',
      },
      {
        id: 'c2',
        label: 'Count the extinguished lights',
        result: 'The missing people have left a pattern',
        value: 'truth',
      },
    ],
  },
  '6,8': {
    title: "The Keeper's Ledger",
    introduction: 'A caretaker keeps two columns: faces recognized and kindness received.',
    artDirection: 'A leather ledger spread under lanternlight with mismatched entries.',
    choices: [
      {
        id: 'c1',
        label: 'Compare the two lists',
        result: 'You learn how poor a witness likeness can be',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Protect the ledger',
        result: 'The names survive a planned royal inspection',
        value: 'community',
      },
    ],
  },
  '7,8': {
    title: 'Portal Sketch',
    introduction: 'An unsigned map shows home beyond the next region, but the door is drawn twice.',
    artDirection: 'A folded map of a fey portal with twin doorways and different shadows.',
    choices: [
      {
        id: 'c1',
        label: 'Mark both possible doors',
        result: 'You avoid choosing by appearance alone',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Share the map with companions',
        result: 'The return journey becomes a shared responsibility',
        value: 'community',
      },
    ],
  },
  '8,8': {
    title: 'Moonroot Knot',
    introduction: 'The final Briar sigil has a root reversed from the one promised in Moonwell Vale.',
    artDirection: 'A moonlit carved knot under a black fern, its mirrored root glinting.',
    choices: [
      {
        id: 'c1',
        label: 'Remember the reversal',
        result: 'You know what to compare across later maps',
        value: 'truth',
      },
      {
        id: 'c2',
        label: 'Keep the carving intact',
        result: 'The future matching test remains honest',
        value: 'nature',
      },
    ],
  },
}

export function validateBriarStoryAtlas(): string[] {
  const issues: string[] = []
  const keys = BRIAR_TILES.map((tile) => tile.key)
  if (Object.keys(BRIAR_STORY_ATLAS).length !== keys.length) {
    issues.push('Every one of the 64 map squares needs its own story encounter')
  }
  for (const key of keys) {
    const scene = BRIAR_STORY_ATLAS[key]
    if (!scene) { issues.push(`Missing story scene at ${key}`); continue }
    if (!scene.title.trim() || !scene.introduction.trim() || !scene.artDirection.trim())
      issues.push(`Incomplete illustration/story hook at ${key}`)
    if (scene.choices.length < 2 || scene.choices.length > 5)
      issues.push(`Scene ${key} must offer 2-5 purposeful choices`)
    if (new Set(scene.choices.map((choice) => choice.id)).size !== scene.choices.length)
      issues.push(`Duplicate choice ID at ${key}`)
    for (const choice of scene.choices) {
      if (!choice.label.trim() || !choice.result.trim())
        issues.push(`Choice without a visible consequence at ${key}`)
    }
  }
  const normalKeys = BRIAR_REVEAL_WAVES.flat()
  if (normalKeys.length !== 60 || BRIAR_CROSS_MAP_KEYS.length !== 4)
    issues.push('Atlas must preserve 60 memory reveals and 4 cross-map sigils')
  return issues
}
