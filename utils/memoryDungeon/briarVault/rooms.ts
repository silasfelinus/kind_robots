import type { DungeonRoomContent } from '../authoredDungeon/types'
import type { BriarVaultEntry, BriarVaultRoomId } from './types'

export const BRIAR_VAULT_ROOMS: readonly DungeonRoomContent<
  BriarVaultRoomId,
  BriarVaultEntry
>[] = [
  {
    id: 'BV-01',
    title: 'The Stair Nobody Else Can See',
    kind: 'entry',
    speaker: 'Rowan, Pip and Win Applegarth',
    opening:
      'The hidden stair turns eleven times under the butler’s corridor, and on every landing the House has screwed in another office desk lamp, each dimmer than the last. Pip holds up his courier lantern; its three candle ends make the only honest light. At the bottom is the old porch of the House That Remembers, where Win says empty chairs once waited for every name a guest withheld. The chairs are still here, stacked on castors and shrink-wrapped like furniture waiting for an office move. The front door has been painted the cream of a staff kitchen, and a printed notice is taped to it: PLEASE LABEL ALL ITEMS. UNLABELLED ITEMS WILL BE CLEARED ON FRIDAY. Behind it something hums like a refrigerator.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands at the foot of a hidden root-lined stair before a cream-painted mansion door with a taped kitchen notice, Pip the goblin courier raising a candle lantern and elderly Win Applegarth beside a stack of shrink-wrapped porch chairs on castors',
    echoes: [
      {
        flag: 'entry:vesper-road',
        text: 'Vesper went first the whole way down, wings folded tight, counting steps under their breath and never once saying a name. At the bottom they turn. “You follow. You don’t draw. If I say up, we go up.” Rowan nods, and means it.',
      },
      {
        flag: 'entry:red-wax',
        text: 'The red-wax receipt is in Rowan’s cardigan pocket, and on its back, in a surveyor’s neat hand, is the bought route: “Cold door. Left at the carriage. Down at the roots.” Vesper showed them the top step and would go no further down a road somebody paid for. Above, the House is still locking doors.',
      },
    ],
    choices: [
      {
        id: 'give-your-name',
        label: 'Knock and tell the House the name you came down with',
        outcome:
          'The door asks, in a voice like a fridge seal letting go, whose name he brought. Rowan says Rowan, which is true now and was not true the last time he stood on this porch. The door considers and admits him as a guest, not an owner. A wrapped chair rolls aside for Win. Somewhere inside, a label printer clicks once.',
        gain: { trust: 1 },
        artSubject:
          'Rowan in his grey cardigan knocking on a cream kitchen-painted mansion door as it swings inward on cold blue light, a shrink-wrapped chair rolling aside for elderly Win Applegarth',
      },
      {
        id: 'read-the-notice',
        label:
          'Read the kitchen notice properly before anyone touches the door',
        outcome:
          'Rowan reads it the way he reads a methods section. It is signed Facilities, Blackcap Land Office, and dated this week. Under it, smaller: “The cold room and all contents are the property of the name on the label.” Someone has turned a House into a shared fridge. Today, Win reminds him, is Thursday.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'Rowan in his grey cardigan leaning close to a printed office notice taped to a cream door, Pip holding the lantern near so the small print shows, a black-capped bird stamp at the bottom',
      },
    ],
  },
  {
    id: 'BV-02',
    title: 'The Umbrella Stand of Other People’s Tides',
    kind: 'lore',
    speaker: 'Rowan and Win Applegarth',
    opening:
      'The umbrella stand stands in the hall where Win remembers it, brass and dented, still full of umbrellas wet with other people’s last rain. But every one of them now drips seawater, and the puddles do not spread. They run uphill across the tiles in thin bright lines toward the cold-room door. Strips of label-printer tape are stuck round some of the handles: names. One reads APPLEGARTH, D. Win does not touch it. The umbrellas with no names are soaked to the spokes and fading, the way a word fades when it is said too often.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, crouches in a dim mansion hall beside a dented brass umbrella stand whose umbrellas drip seawater in bright lines running uphill across the floor tiles, elderly Win Applegarth staring at a handle wrapped in label tape',
    autoChoiceId: 'follow-the-running-water',
    echoes: [
      {
        flag: 'e09:4,6:free-dora-name',
        text: 'Win knows her mother’s face again since the lease upstairs. She looks at the tape and says, “She’d have hated that. She’d have written her whole name, and underlined it.”',
      },
      {
        flag: 'e09:4,6:compare-six-leases',
        text: 'Win still cannot picture the woman whose name is on that tape. She reads it twice anyway, like a stranger’s name in a church register.',
      },
    ],
    choices: [
      {
        id: 'follow-the-running-water',
        label: 'Follow which way the seawater runs',
        outcome:
          'It runs under the cold-room door and keeps going down. The umbrellas are not dripping; they are being drained. Every named handle is dry. The unnamed ones are losing their rain to something below the House that pulls like a tide, and whatever this place has no name for, it is giving away.',
        gain: { evidence: 1 },
        artSubject:
          'Close on thin lines of seawater running uphill across old mansion floor tiles and vanishing beneath a cream door, Rowan’s hand in a grey cardigan sleeve tracing one line with a fingertip',
      },
    ],
  },
  {
    id: 'BV-03',
    title: 'The Lanyard Rack Maze',
    kind: 'puzzle',
    speaker: 'Rowan, Pip and Win Applegarth',
    opening:
      'The old boot racks still fill the long hall in a maze, and the boots are still caked in the mud of the roads their owners walked: red Briar clay, grey sea silt, the pale ash of paper lanterns. Win remembers that the racks used to sort travellers by their journeys. Now every pair wears an office lanyard looped through its laces, and a card reader at the end of each aisle beeps red or green as the party passes. The badges have overruled the mud. Three of the cleanest read BLACKCAP LAND OFFICE, SURVEY. Pip sniffs a pair and says these are refugee boots, walked to holes.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, walks a maze of wooden boot racks in a long mansion hall, each pair of muddy boots hung with an office lanyard, a card reader glowing red at the aisle end while Pip the goblin courier sniffs a worn boot',
    choices: [
      {
        id: 'sort-by-the-mud',
        label: 'Ignore the badges and sort the boots by the mud of their roads',
        outcome:
          'Rowan sorts clay, silt and ash like points on a scatter plot, and a pattern comes out of the mud: three refugee roads, converging on the cold-room door. Every card reader shrieks red as he walks where the paperwork says he cannot. They come out the far end muddy to the knee, and the House has noted a guest who prefers mud to badges.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'Rowan in his grey cardigan kneeling among boots sorted into three muddy rows of red clay, grey silt and pale ash, every card reader along the racks flashing red',
      },
      {
        id: 'swipe-the-survey-badge',
        label: 'Borrow a Blackcap survey badge and walk the aisle it opens',
        outcome:
          'The reader goes green and the aisle straightens politely. It is the easiest walk in the House. Pip will not stand next to the badge afterwards, and Win says the boots in the racks turned their toes away as Rowan passed, the way people step back from a man with a clipboard.',
        gain: { danger: -1, trust: -1 },
        artSubject:
          'Rowan in his grey cardigan swiping a black-capped survey badge at a green-lit card reader while rows of muddy boots on the racks turn their toes away from him',
      },
      {
        id: 'let-vesper-read-the-laces',
        label:
          'Let Vesper read which laces were tied by people who wanted to be followed',
        outcome:
          'Vesper kneels and touches knots without reading a single badge. Double knots for families who wanted nobody behind them; one loose bow, tied by someone leaving a trail on purpose for a sister. Vesper follows only the bow. The route is short and kind, and Vesper does not explain how they know about bows.',
        gain: { trust: 2 },
        requires: { entry: 'vesper-road' },
        lockedHint: 'Only if Vesper is guiding the descent',
        artSubject:
          'Vesper, a moth-winged cartographer, kneeling between boot racks with gentle fingers on a single loose bow of bootlace, Rowan in his grey cardigan waiting a respectful step behind',
      },
    ],
  },
  {
    id: 'BV-04',
    title: 'Tibbet’s Packing Line',
    kind: 'companion',
    speaker: 'Rowan, Win Applegarth and Tibbet',
    opening:
      'The old clockwork pantry has become a packing line. A brass automaton cook the size of a child, with a dinner-bell head and pastry-cutter hands, stands at a long steel counter wrapping glowing things in wax paper and fitting them into painted lunchboxes. Win knows it at once: Tibbet, who used to set out one loaf for whoever was missing at supper. Tibbet still sets the loaf. Now it also packs a memory beside it, labels the tin with a child’s name from a list pinned to the wall, and sends it rattling down a chute. “Friday,” it says, without looking up. “Everything needs a name by Friday.”',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, watches a child-sized brass automaton cook with a dinner-bell head pack glowing wax-paper bundles into painted lunchboxes on a steel counter, a single loaf on a plate at one end and elderly Win Applegarth smiling in recognition',
    echoes: [
      {
        flag: 'BV-01:read-the-notice',
        text: 'The same Facilities notice is pinned over the counter. Beside it Tibbet has added one of its own in careful copperplate: “Thursday. Bread for the missing. Names for the rest.”',
      },
    ],
    choices: [
      {
        id: 'ask-tibbet-why-children',
        label:
          'Ask Tibbet whose memories these are and why the labels are children’s names',
        outcome:
          'Tibbet explains it like a cook explaining stock. The sleepers’ memories come in without names. The notice says nameless things are cleared on Friday. The Land Office’s label claims whatever has no better one. A child’s name on a packed lunch is the strongest label Tibbet knows. “Nobody takes a child’s lunch,” it says. Rowan can think of several people who would.',
        gain: { evidence: 1, trust: 1 },
        artSubject:
          'The brass automaton cook holding up a lunchbox labelled with a child’s name in copperplate as Rowan in his grey cardigan listens with folded arms beside the packing counter',
      },
      {
        id: 'stop-the-line',
        label: 'Switch the packing line off until somebody asks the owners',
        outcome:
          'Rowan finds the lever and the chute goes still. Tibbet folds its pastry-cutter hands and waits, polite and appalled. On the counter twelve wrapped memories begin to sweat in the warm air like butter, and under the floor the seawater rises an inch toward them. Stopping a wrong thing is not the same as making it right.',
        gain: { trust: -1, danger: 1 },
        artSubject:
          'Rowan in his grey cardigan pulling down a brass lever as a packing chute halts and wax-paper bundles glisten on a steel counter, the automaton cook standing motionless with folded hands',
      },
      {
        id: 'take-the-candle-ends',
        label:
          'Accept the spare candle ends Tibbet keeps for the absent guest’s place',
        outcome:
          'Tibbet lights the absent guest’s place every night and keeps a drawer of stubs for it. It gives Rowan three for the lantern, then lays one more place at the counter, with a card: “For the Surveyor, who has not come back up.” Pip reads it and stops smiling.',
        gain: { battery: 2 },
        artSubject:
          'The brass automaton cook offering three candle stubs from a drawer to Pip the goblin courier, a fresh place setting with a handwritten card laid beside a single loaf',
      },
    ],
  },
  {
    id: 'BV-05',
    title: 'Oren’s Plan in the Broom Closet',
    kind: 'shortcut',
    speaker: 'Rowan and Pip',
    opening:
      'Between a mop bucket and an upright ceremonial coffin hangs a laminated evacuation plan in Oren’s square capitals, pinned here the first time the party came through the House. The arrows still point both ways, as Oren insisted. Somebody has edited it since: a new route is inked in red down a service stair, marked BLACKCAP SURVEY ACCESS ONLY, and the coffin wears a four-wheel combination lock. Cold salt air breathes out through its carved air holes. Pip taps the coffin and listens. “That’s not a coffin,” he says. “That’s a lift with opinions.”',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, studies a laminated evacuation plan with red ink added in a narrow broom closet beside an upright black ceremonial coffin fitted with a combination lock, Pip the goblin courier pressing an ear to the coffin lid',
    choices: [
      {
        id: 'follow-orens-arrows',
        label: 'Follow Oren’s original arrows, which point both ways',
        outcome:
          'Oren’s route is slower and absurdly well signed: a water cask every forty steps, an arrow back at every turn, a note at one corner reading “Mind the step. I mean it.” It loops the party safely past the coffin. Pip refills his flask and says Oren will want to know someone has been editing his plans.',
        gain: { danger: -1 },
        artSubject:
          'Pip the goblin courier filling a flask at a neatly labelled water cask in a narrow corridor, Rowan in his grey cardigan following a painted double-headed arrow on the wall',
      },
      {
        id: 'use-the-receipt-date',
        label: 'Try the date from the red-wax receipt on the coffin’s lock',
        outcome:
          'The wheels click over and the coffin opens on a service ladder dropping into cold dark. Chalked on the top rung is a surveyor’s mark, and tucked behind it a survey stake stamped with a black-capped bird. The receipt bought more than a stair; it bought a back door. Rowan closes the lid and does not climb in yet.',
        gain: { evidence: 2 },
        requires: { entry: 'red-wax' },
        lockedHint: 'Only if you read the red-wax receipt',
        artSubject:
          'An upright black coffin standing open on a dark service ladder, a chalk survey mark on the top rung, Rowan in his grey cardigan holding a red-waxed receipt beside the lock',
      },
    ],
  },
  {
    id: 'BV-06',
    title: 'The Wolf’s Latch Turned Turnstile',
    kind: 'hazard',
    speaker: 'Rowan, Pip, Win Applegarth and a brass patrol wolf',
    opening:
      'The oak door where the House once kept a latch against wolves is still here, and the claw marks Win remembers are still on its inside. The latch is gone. In its place a chrome office turnstile has been set into the planks, with a card reader, and the scratches run on down the chrome as if the wolves had kept trying. On the far side sits a brass patrol wolf with its patrol card in its teeth, waiting for each of them to push through so it can smell everywhere they have walked. The turnstile admits one at a time.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, faces a chrome office turnstile set into a claw-scored oak door, a brass patrol wolf beyond it holding a printed card in its teeth, Pip the goblin courier and elderly Win Applegarth waiting behind',
    choices: [
      {
        id: 'walk-through-and-be-smelt',
        label:
          'Push through first and let the wolf smell everywhere you have walked',
        outcome:
          'The brass nose goes over Rowan’s shoes, cuffs and hands: a research office, the Briar, this porch, a body he once borrowed. The wolf ticks in confusion over so many roads and writes him up as a vagrant. While it is busy, the others slip past. Rowan now has a patrol card of his own.',
        gain: { danger: 2, trust: 1 },
        artSubject:
          'A brass patrol wolf sniffing intently at the cardigan cuffs of Rowan beyond a chrome turnstile while Pip and Win slip past behind it',
      },
      {
        id: 'jam-the-turnstile',
        label:
          'Jam the turnstile half-turned so everyone squeezes past at once',
        outcome:
          'Pip wedges the arm with his satchel strap and the party crams through in one tangle. The wolf cannot sort four scents at once and sneezes brass filings. Win, squashed against chrome at eighty years old, says nothing kind for several rooms, and Pip has to leave his strap behind in the mechanism.',
        gain: { danger: -1, trust: -1 },
        artSubject:
          'Rowan, Pip and Win squeezing through a jammed chrome turnstile in a tangle of limbs, a goblin satchel strap wedged in the arm and a brass wolf sneezing glittering filings',
      },
      {
        id: 'read-the-patrol-card',
        label: 'Read the patrol card in the wolf’s teeth out loud',
        outcome:
          'It is printed, not written: “Patrol on behalf of Blackcap Land Office. Object: any person carrying a route.” The Land Office has hired wolves to sniff for roads inside people. Rowan reads it aloud and the brass wolf drops its tail, because under wolf law a card read aloud is either obeyed or contested. It lets them pass and marks them as contesting.',
        gain: { evidence: 2, danger: 1 },
        artSubject:
          'Rowan in his grey cardigan reading aloud from a printed card held in a brass wolf’s jaws, the wolf’s tail lowering as its gears tick behind a chrome turnstile',
      },
    ],
  },
  {
    id: 'BV-07',
    title: 'The Portrait Hall of Twenty-Two Owners',
    kind: 'lore',
    speaker: 'Rowan and Win Applegarth',
    opening:
      'The family portrait hall is as crowded as Win remembers: generations of residents in oils, and in every painting one guest nobody recalls inviting. The guests have changed. In each portrait, standing just behind a child, is the same mild man in a black cap holding a clipboard, painted in with the same brush, and a strip of label tape has been pressed across the bottom of every frame. Win reads one aloud and then does not want to read another. Each says OWNER. A draught from the far doorway smells of coal smoke and railway steam.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, walks a long candlelit hall of family portraits in heavy gilt frames, each painting showing a mild man in a black cap with a clipboard standing behind a child, label tape stuck across every frame',
    autoChoiceId: 'count-the-surveyors',
    echoes: [
      {
        flag: 'BV-03:swipe-the-survey-badge',
        text: 'The survey badge Rowan borrowed still hangs round his neck, and every painted surveyor in the hall seems to be wearing its twin.',
      },
    ],
    choices: [
      {
        id: 'count-the-surveyors',
        label: 'Count the black-capped guest in every family portrait',
        outcome:
          'Twenty-two portraits, twenty-two surveyors, each one standing a little behind a child as if waiting to be handed something. He was not painted into these families; he was labelled into them. Rowan looks for a name and finds only initials, tiny on the painted clipboard: A. T.',
        gain: { evidence: 1 },
        artSubject:
          'Close on a painted clipboard in an oil portrait bearing the tiny initials A. T., Rowan’s finger in a grey cardigan sleeve stopping just short of the canvas',
      },
    ],
  },
  {
    id: 'BV-08',
    title: 'The Lunchbox Racks',
    kind: 'treasure',
    speaker: 'Rowan, Pip and Win Applegarth',
    opening:
      'Racks of painted tins climb to the nursery ceiling: hares, foxes, ships, teacups, each labelled with a child’s name and humming with somebody else’s life. These are the overflow, the tins the children sheltering upstairs had no room to carry. Rowan hears a wedding in one, a quarrel in another, a hymn he almost knows. The racks are warm as bread. On the bottom shelf there is a gap marked in tape with one word, KIT, and below it a tartan tin labelled for nobody at all.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands before towering nursery racks of painted children’s lunchboxes glowing faintly at the seams, Pip the goblin courier on a stepladder and elderly Win Applegarth listening with her ear to a tin',
    echoes: [
      {
        flag: 'e09:5,6:kit-keeps-the-hare-box',
        text: 'The gap marked KIT is shaped exactly like a hare tin. Kit still has his upstairs, honeymoon and all; the House has kept his place empty, as if expecting him to bring it back.',
      },
      {
        flag: 'e09:5,6:swap-tins-quietly',
        text: 'The hare tin sits in the gap marked KIT, sent back down the chute after the lunch-swap game. It is empty now, except for a smell of jam and a boy’s crying, very faint.',
      },
    ],
    choices: [
      {
        id: 'listen-at-the-lids',
        label: 'Listen at the lids and note only what each tin sounds like',
        outcome:
          'Rowan works down a rack writing sounds, not contents: rain, laughter, a hymn, a door shutting, a baby. It is a catalogue nobody could follow anywhere, which is the point. Pip says he has never seen anyone take an inventory so politely, and Win starts humming along with the hymn.',
        gain: { evidence: 1, trust: 1 },
        artSubject:
          'Rowan in his grey cardigan holding his ear close to a painted fox lunchbox and writing in a small notebook, rows of glowing tins around him',
      },
      {
        id: 'open-the-loudest-tin',
        label:
          'Open the loudest tin to learn what kind of memory the House takes',
        outcome:
          'It is a refugee mother crossing a ford at night, every stone counted, the place where the wolves do not go. Rowan shuts the lid fast, but he knows the ford now and cannot unknow it. Somebody on the Land Office’s books would pay well for what is in his head, and every brass nose in the forest can smell a road.',
        gain: { evidence: 2, danger: 2 },
        artSubject:
          'A teacup-painted lunchbox snapping open in Rowan’s hands to spill a glowing image of a moonlit river ford with counted stepping stones, his face stricken',
      },
      {
        id: 'take-the-tartan-tin',
        label: 'Open the tartan tin labelled for nobody',
        outcome:
          'Inside, in Tibbet’s copperplate on a slip of card: “For whoever is carrying the light.” Under it are wicks and a twist of lamp oil. Pip fills the lantern and does not ask how the cook knew someone would come. The flame stands up straight for the first time since the stair.',
        gain: { battery: 2 },
        artSubject:
          'Pip the goblin courier pouring lamp oil from a twist of paper into a candle lantern while Rowan holds open a tartan tin with a copperplate card inside',
      },
    ],
  },
  {
    id: 'BV-09',
    title: 'The Coal Cellar Where Win Was Kept',
    kind: 'choice',
    speaker: 'Rowan, Win Applegarth and a sleeping refugee family',
    opening:
      'The coal cellar door still has its bolt on the outside. Win stops in front of it. “She put me in here,” she says, meaning the housekeeper, sixty years ago. Now the cellar is the warmest room in the House, and a refugee family is asleep on coal sacks inside: a father, a mother, two children curled together. From the sleeping father a thread of gold light rises like breath from a kettle and runs up the coal chute into the dark. The House is taking a lullaby out of him while he sleeps, gently, the way it takes everything.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands in the low doorway of a warm coal cellar where a refugee family sleeps on coal sacks, a thread of gold light rising from the sleeping father up into a coal chute, elderly Win Applegarth gripping the outside bolt',
    echoes: [
      {
        flag: 'e09:1,6:let-ninepence-testify',
        text: 'Win remembers this cellar now, every hour of it, because a clockwork wolf smelled the apology she was owed. She keeps one hand on Rowan’s sleeve the whole time.',
      },
      {
        flag: 'e09:1,6:guard-young-win',
        text: 'Win never learned why the wolves came for her the night she ran. Standing at this door, she says slowly that she thinks she was in here first.',
      },
    ],
    choices: [
      {
        id: 'wake-the-family',
        label:
          'Wake the family and tell them what the House takes from sleepers',
        outcome:
          'The father wakes mid-song and loses the half that had already gone up the chute. The family are frightened and furious that nobody warned them. They gather the children and climb back toward a forest full of patrols at night, and they will not sleep under a roof again soon. They go knowing, which is the only thing Rowan could give them.',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'A refugee father sitting bolt upright on coal sacks clutching his head as the gold thread snaps, Rowan in his grey cardigan kneeling to explain and two children waking in alarm',
      },
      {
        id: 'let-them-sleep',
        label: 'Let them sleep, and keep watch by the chute yourself',
        outcome:
          'Rowan sits by the chute with Win until the thread runs out. The lullaby goes down to Tibbet’s line, to come back labelled with a child’s name. The family will wake rested and none the wiser. Rowan has decided for them what they can spare, which is exactly what the House did.',
        gain: { danger: -1, trust: -1 },
        artSubject:
          'Rowan in his grey cardigan and elderly Win Applegarth sitting quietly against a coal cellar wall beside a softly glowing chute, a refugee family sleeping peacefully nearby',
      },
      {
        id: 'check-the-receipt-route',
        label: 'Check the red-wax receipt’s route against this cellar',
        outcome:
          'The back of the receipt lists the cellar by name, with a tick beside it and a note: “Collection point. Families shelter here. Best on Thursdays.” The surveyor knew exactly who slept here and when, and planned his Friday around them. Win reads it over Rowan’s shoulder and has to sit down on the steps.',
        gain: { evidence: 2, danger: 1 },
        requires: { entry: 'red-wax' },
        lockedHint: 'Only if you read the red-wax receipt',
        artSubject:
          'Rowan in his grey cardigan holding a red-waxed receipt beside a coal cellar door, a ticked line of neat handwriting visible on its back, elderly Win sitting heavily on the stone steps',
      },
    ],
  },
  {
    id: 'BV-10',
    title: 'The Surveyor Who Forgot Why',
    kind: 'companion',
    speaker: 'Rowan, Pip and surveyor Ambrose Teale',
    opening:
      'In the old nursery, a man in a black cap and a good wool coat is surveying a dollhouse with a brass theodolite, recording every tiny stair. He is courteous, precise and entirely blank. He slept down here a week ago, he explains, and woke without the reason he came. His clipboard bears the crest of the Blackcap Land Office and a column of boxes headed ROUTES, every box ticked. His name, he believes, is Ambrose Teale. “I think I’m owed something,” he says, sincerely puzzled. “Do you happen to know what?”',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, faces a mild man in a black cap and wool coat peering through a brass theodolite at a dollhouse on a nursery card table, a crested clipboard of ticked boxes beside him and Pip the goblin courier scowling',
    echoes: [
      {
        flag: 'BV-07:count-the-surveyors',
        text: 'Rowan has seen this face twenty-two times in the portrait hall, painted behind twenty-two children. In life it is milder, and looks lost.',
      },
      {
        flag: 'BV-04:take-the-candle-ends',
        text: 'Tibbet’s place card is in Rowan’s pocket: “For the Surveyor, who has not come back up.” Here, presumably, is the surveyor.',
      },
    ],
    choices: [
      {
        id: 'tell-him-what-he-is',
        label: 'Tell Ambrose who he works for and what his clipboard counts',
        outcome:
          'Rowan tells him plainly. Ambrose listens, nods, and says that sounds like a terrible man and he would very much like to help stop him. He means it, because he does not remember being him. Pip says that is awfully convenient. Ambrose agrees, which is worse, and follows them at a polite distance.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'Ambrose Teale in his black cap lowering his theodolite with a stricken face as Rowan in his grey cardigan speaks, Pip the goblin courier folding his arms in the nursery doorway',
      },
      {
        id: 'take-his-clipboard',
        label: 'Ask for the clipboard, gently, as proof for the people he hurt',
        outcome:
          'He hands it over without a fight; he has no idea what it is worth. Twenty ticked routes, each with a buyer column half filled in: “Patrol, Wolf Road.” “Patrol, Cedar Bridge.” Taking proof from a man who cannot remember the crime feels like robbing a sleepwalker. It is still proof.',
        gain: { evidence: 2, trust: -1 },
        artSubject:
          'Ambrose Teale handing a crested clipboard across a nursery card table to Rowan in his grey cardigan, his expression trusting and Rowan’s uneasy',
      },
      {
        id: 'leave-him-measuring',
        label: 'Leave him measuring the dollhouse and say nothing',
        outcome:
          'He thanks them for the company and goes back to the dollhouse’s tiny stairs with enormous care. He seems happy, for a man who sold children’s roads. From the door Win looks back at him and says she has known kinder people who deserved far less peace.',
        gain: { danger: -1 },
        artSubject:
          'A mild man in a black cap bent contentedly over a dollhouse with a theodolite, seen from a nursery doorway where elderly Win Applegarth looks back over her shoulder',
      },
    ],
  },
  {
    id: 'BV-11',
    title: 'The Lost Property Cage',
    kind: 'treasure',
    speaker: 'Rowan and Pip',
    opening:
      'A wire cage like an office lost-property store holds what sleepers left behind besides their memories: one shoe, a sea-court medal on a green ribbon, a paper lantern folded flat, a child’s drawing of a wolf in a necktie, a roll of Tibbet’s blank labels with a pen tied to it on string. Pip goes very quiet in front of a battered satchel buckle stamped with a goblin courier’s rune. It is his, lost on a delivery years ago. He does not reach for it.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands at an open wire lost-property cage crammed with a single shoe, a sea-court medal, a folded paper lantern and a child’s wolf drawing, Pip the goblin courier staring at a battered satchel buckle on a shelf',
    choices: [
      {
        id: 'return-pips-buckle',
        label: 'Give Pip back his buckle without asking how it got here',
        outcome:
          'Pip takes it, turns it over twice and puts it in his pocket. “Lost it on a Red Oven run,” he says, and nothing else. He walks closer to Rowan after that, close enough that their lantern shadows overlap on the wall.',
        gain: { trust: 2 },
        artSubject:
          'Rowan in his grey cardigan pressing a battered satchel buckle into Pip’s small green hand beside a wire cage, Pip’s eyes lowered',
      },
      {
        id: 'take-the-blank-labels',
        label: 'Pocket Tibbet’s roll of blank labels and the pen tied to it',
        outcome:
          'Whoever holds these can name a thing in this House, and the House will believe the name. Rowan feels the weight of that more than the weight of the roll. He pockets both and promises himself he will not write anything he could not say aloud in front of its owner.',
        gain: { evidence: 1 },
        artSubject:
          'Close on Rowan’s hands untying a roll of blank paper labels and a pen on a string from a wire shelf, the cage’s lost things blurred behind',
      },
      {
        id: 'unfold-the-paper-lantern',
        label: 'Unfold the paper lantern and light it from Pip’s',
        outcome:
          'It is a Hoshimori refuge lantern, cedar ribs and mulberry paper, and it burns bright and steady. It also casts a faint moth-road on the floor that anyone with wings could read, pointing back the way they came. Rowan keeps it lit anyway; the dark below is real.',
        gain: { battery: 2, danger: 1 },
        artSubject:
          'A Hoshimori paper lantern unfolding into bright light in Rowan’s hands, a pale moth-road spilling across the floorboards behind him toward the cage door',
      },
    ],
  },
  {
    id: 'BV-12',
    title: 'The Dumbwaiter Full of Inventories',
    kind: 'hazard',
    speaker: 'Rowan, Pip and Win Applegarth',
    opening:
      'The House’s dumbwaiter shaft drops through this room, and the photocopier from the butler’s pantry has fallen down it and is still printing. Inventory after inventory spills out, each listing fewer spoons and more names, piling in drifts that have choked the shaft halfway down. The only way to the carriage level below is to ride the dumbwaiter car, rated, by its brass plate, for one tea service. Pip has already tied a rope to the pulley. Win looks at the car and says she has been folded into smaller things.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands at an open dumbwaiter shaft choked with drifts of printed paper from a fallen humming photocopier, Pip the goblin courier knotting a rope to a pulley and elderly Win Applegarth eyeing the tiny wooden car',
    echoes: [
      {
        flag: 'e09:8,6:descend-for-the-spoons',
        text: 'The engraved spoons Rowan carried up for the refugee family are gone from the newest inventories. Their line has finally stopped shrinking.',
      },
      {
        flag: 'e09:8,6:mark-the-pantry-exit',
        text: 'Pip’s chalk exit mark from the pantry is on the shaft wall, an arrow pointing up. Nobody has used it yet, which Pip takes personally.',
      },
    ],
    choices: [
      {
        id: 'ride-the-dumbwaiter',
        label: 'Ride the dumbwaiter down one at a time with Pip on the rope',
        outcome:
          'Pip lowers each of them in turn, cursing gently and continuously. Win goes last and lightest, and the rope burns Pip’s palms raw on the way. They arrive shaken in a railway gangway with copier paper in their hair, and Pip refuses all sympathy for his hands.',
        gain: { danger: 1, trust: 1 },
        artSubject:
          'Pip the goblin courier braced and straining on a rope as elderly Win Applegarth descends in a tiny wooden dumbwaiter car through drifts of falling paper',
      },
      {
        id: 'read-the-inventories',
        label: 'Read down the drift of inventories for what the House has lost',
        outcome:
          'The newest sheet is still warm: “Contents: two hundred and fourteen memories. Labelled: one hundred and ninety-one. Unlabelled: twenty-three. Clearance: Friday, dawn.” Twenty-three memories will go to the sea in the morning unless somebody gives them names. Rowan folds the sheet and goes down the hard way.',
        gain: { evidence: 2, danger: 1 },
        artSubject:
          'Rowan in his grey cardigan reading a warm printed inventory sheet in the light of Pip’s lantern, drifts of paper around his ankles and a photocopier blinking in the shaft',
      },
    ],
  },
  {
    id: 'BV-13',
    title: 'The Gaslit Decade',
    kind: 'hazard',
    speaker: 'Rowan, Pip and the drowned railway guard',
    opening:
      'Every door on this level opens onto the same railway carriage, and the first one opens onto its gaslit decade. The mantles have gone out. The carriage is dark as a coal sack, and seawater slops between the seats, cold enough to ache. Somewhere ahead a lunchbox is floating, knocking against the windows like someone asking to be let in. Rowan can hear breathing that is not the party’s, slow and very patient, from the far end of the car.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, wades knee-deep into a pitch-dark vintage railway carriage with dead gas mantles, a single painted lunchbox floating against a window, Pip the goblin courier close behind with a shaded candle lantern',
    echoes: [
      {
        flag: 'e09:2,6:ask-alfie-for-route',
        text: 'Alfie’s route runs under this water. If Rowan looks down through the floorboards he can almost see it: a boy walking along the seabed holding his breath for an impossible mile.',
      },
      {
        flag: 'e09:2,6:reissue-alfies-ticket',
        text: 'This is the water the guard drained out of Win’s decade upstairs when he clipped Alfie’s ticket. It had to go somewhere.',
      },
    ],
    choices: [
      {
        id: 'light-the-carriage',
        label: 'Lift the lantern and see who else is in the carriage',
        outcome:
          'The light finds a drowned railway guard sitting very upright in a corner seat, peaked cap dripping, holding a tin he has fished out of the water. It has no label. He offers it with a small bow. “Passenger’s property, sir. Nobody’s name on it.” It hums with a lullaby, the father’s, from the coal cellar.',
        gain: { battery: -1, evidence: 1 },
        requires: { battery: 1 },
        lockedHint: 'Needs lantern light',
        artSubject:
          'Lantern light revealing a pale drowned railway guard in a peaked cap seated upright in a flooded carriage, offering a dripping tin to Rowan in his grey cardigan',
      },
      {
        id: 'feel-along-the-seats',
        label: 'Feel along the seat backs in the dark toward the far gangway',
        outcome:
          'It is slow, wet and blind. A cold, courteous hand helps Rowan over a gap in the floor and lets go before he can thank it. The floating tin knocks once against his knee and drifts off into the dark. Whatever it holds will be cleared on Friday with everything else nobody named.',
        gain: { danger: 1 },
        artSubject:
          'The silhouette of Rowan feeling his way along wet seat backs in a black carriage, a pale gloved hand reaching from the dark to steady his elbow',
      },
    ],
  },
  {
    id: 'BV-14',
    title: 'The Linoleum Decade',
    kind: 'rest',
    speaker: 'Rowan, Pip and Win Applegarth',
    opening:
      'In its linoleum decade the carriage is dry and smells of oranges, and somebody has turned it into a staff room: a kettle, a biscuit tin, a rota on a drawing pin, a radiator that actually works. Win sits on a bench seat and does not get up for a while. “I took this train when I left,” she says. “I was nine. I had a lunchbox with a swallow on it. I can’t remember what was in it.” Pip fills the kettle without asking anyone. It is labelled, in Tibbet’s hand, STAFF.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, sits in a warm linoleum-floored railway carriage fitted out as a staff room with a kettle and biscuit tin, elderly Win Applegarth resting on a bench seat and Pip the goblin courier filling the kettle',
    choices: [
      {
        id: 'rest-by-the-radiator',
        label: 'Dry out by the radiator and keep watch while Win sleeps',
        outcome:
          'Win sleeps a quarter of an hour, and Rowan stays awake the whole of it, watching her for a thread of light. None comes; the House does not take from someone who is being watched over. Pip trims the lantern wick and finds a candle end in the biscuit tin, which he calls the best biscuit he has ever eaten.',
        gain: { battery: 1, danger: -1 },
        artSubject:
          'Elderly Win Applegarth asleep on a carriage bench under a cardigan blanket as Rowan sits watchful beside her and Pip trims a lantern by a glowing radiator',
      },
      {
        id: 'ask-about-the-swallow',
        label: 'Ask Win about the outside of the lunchbox, not what was in it',
        outcome:
          'The paint was chipped on one wing. Her mother Dora packed it. It was the last thing her mother gave her before the housekeeper bolted her in the cellar over a spoon she never took. Win stops. “That’s more than I’ve remembered in sixty years.” The House, it seems, gives back to people who ask about the outsides of things.',
        gain: { trust: 1, evidence: 1 },
        artSubject:
          'Elderly Win Applegarth cupping a mug of tea and talking with her eyes half closed, Rowan in his grey cardigan listening closely across a carriage table',
      },
    ],
  },
  {
    id: 'BV-15',
    title: 'The Commuter Decade',
    kind: 'puzzle',
    speaker: 'Rowan and Pip',
    opening:
      'The next decade is rush hour in a smoky commuter carriage, packed with Briar folk and office workers who are only half here, all asleep against each other’s shoulders. From every sleeping head a thread of light runs up into the luggage racks, where it is slowly winding onto wooden spools. At the end of the car a ticket inspector’s punch has become a punch clock, and every sleeper has a timecard stamped CLOCKED OUT tucked into a hatband or a sleeve. Pip whispers that nobody here is dreaming. They are being filed.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands in the aisle of a crowded smoky commuter carriage where sleeping passengers slump together, threads of light rising from their heads onto wooden spools in the luggage racks, a brass punch clock at the far end',
    echoes: [
      {
        flag: 'BV-09:let-them-sleep',
        text: 'One spool in the rack is labelled with the coal cellar’s address and wound fat with gold. Rowan let that family sleep. Here is the other end of that kindness, wound neatly on a reel.',
      },
      {
        flag: 'BV-09:wake-the-family',
        text: 'One spool in the rack is half wound and snapped off clean: the lullaby the father woke out of in the coal cellar. Half of it is here now, for good.',
      },
    ],
    choices: [
      {
        id: 'punch-them-back-in',
        label:
          'Punch every sleeper’s timecard back in before the spools finish',
        outcome:
          'Rowan works the clock down the aisle while Pip reads out the cards. Each punch snaps a thread back into its sleeper like elastic, and they sigh and keep what was leaving them. It takes the whole decade’s worth of minutes, and when Rowan looks at the carriage clock, Thursday is an hour shorter.',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'Rowan in his grey cardigan feeding a timecard into a brass punch clock as a thread of light snaps back down into a sleeping commuter, Pip holding up a fan of cards',
      },
      {
        id: 'read-a-timecard',
        label:
          'Read one timecard closely to learn what rule the carriage is keeping',
        outcome:
          'The House That Remembers keeps whatever its people leave behind. An office counts anyone who has clocked off as gone home. Down here the two rules have shaken hands: sleeping is clocking off, and clocking off is leaving. The House is not a thief. It is obeying both laws at once and has no way to stop.',
        gain: { evidence: 2 },
        artSubject:
          'Close on Rowan’s fingers holding a timecard stamped CLOCKED OUT under lantern light, a thin thread of light trailing from it up toward a luggage rack spool',
      },
    ],
  },
  {
    id: 'BV-16',
    title: 'The Tin Served to Pip',
    kind: 'companion',
    speaker: 'Rowan and Pip',
    opening:
      'In the dining car a single tin waits on a white tablecloth as if it has been served: dented courier green, labelled PIP in Tibbet’s copperplate. Pip sees it and stands very still. He stopped one winter night under the House’s roof on a delivery, he says, and thought he had only slept badly. The tin hums with the roar of an oven and smells of bread left in too long. Whatever part of the Red Oven debt Pip never tells anyone is in there. He looks at Rowan, not at the tin.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands in a railway dining car beside Pip the goblin courier, who stares at a dented green tin labelled with his name set alone on a white tablecloth, a faint orange glow at its seams',
    echoes: [
      {
        flag: 'BV-11:return-pips-buckle',
        text: 'Pip has his old satchel buckle in his fist. He has been turning it over and over since the lost property cage.',
      },
    ],
    choices: [
      {
        id: 'hand-it-over-closed',
        label: 'Hand Pip the tin closed and go study the far window',
        outcome:
          'Rowan gives it to him lid shut and walks to the end of the car to look at nothing. Behind him the lid clicks open, then closed. Pip comes back with red eyes and says the Oven owes him an apology too, and that he will tell Rowan about it one day, just not today.',
        gain: { trust: 2, evidence: -1 },
        artSubject:
          'Rowan in his grey cardigan gazing out of a dining car window while behind him Pip the goblin courier hunches over an opened green tin in orange light',
      },
      {
        id: 'ask-pip-what-he-wants',
        label: 'Ask Pip whether he would rather the House kept it',
        outcome:
          'Pip thinks for a long time. “It’s been lighter,” he says. He leaves the tin for Tibbet to keep and writes his own name on a second label under the first, so anyone who looks will know he chose it. Then he asks Rowan to remember that he chose it, in case anybody says otherwise.',
        gain: { trust: 1, danger: -1 },
        artSubject:
          'Pip the goblin courier carefully pressing a handwritten second label onto a green tin on a tablecloth, Rowan in his grey cardigan standing witness at his side',
      },
      {
        id: 'open-it-together',
        label: 'Offer to open it with him, so he is not alone with it',
        outcome:
          'They open it together. Rowan hears a goblin child at an oven door promising to work off a debt that was never his, while a cook laughs. Pip shuts the lid and keeps it. Now Rowan knows a thing Pip never told anyone, and it is a different weight for both of them.',
        gain: { evidence: 1, trust: 1 },
        artSubject:
          'Rowan and Pip side by side at a dining car table lifting the lid of a green tin together, orange oven light washing over both faces',
      },
    ],
  },
  {
    id: 'BV-17',
    title: 'The Decade Under the Sea',
    kind: 'hazard',
    speaker: 'Rowan, Win Applegarth and the eel commuter',
    opening:
      'In this decade the carriage lies at the bottom of the sea, as it does in every other one, and the gangway door opens on a wall of standing water held back by nothing but the House’s manners. Through it Rowan can see the seats, a luggage rack heavy with tins, and an eel commuter in a knitted scarf reading yesterday’s paper. The way on is through. Win, at eighty, cannot hold her breath for the length of a carriage, and she says so with great dignity.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands at an open gangway door facing a sheer wall of still green seawater, inside it a submerged carriage and a long eel in a knitted scarf reading a newspaper, elderly Win Applegarth beside him with her chin raised',
    choices: [
      {
        id: 'ask-the-eel-to-hold-the-door',
        label: 'Knock on the water and ask the eel commuter to hold the door',
        outcome:
          'The eel folds its paper, considers, and swims over to hold the far door like a gentleman on the morning train. The water bows to the courtesy and parts into a narrow, dripping aisle. Its fare is one dry morning. Rowan pays with a dry Monday from his old office, and afterwards cannot remember what the office smelled like.',
        gain: { trust: 1, evidence: -1 },
        artSubject:
          'A scarfed eel holding open a carriage door underwater as the sea parts into a narrow dripping aisle, Rowan guiding elderly Win Applegarth through it',
      },
      {
        id: 'swim-it-with-win',
        label: 'Take Win’s hand and swim the carriage on one breath',
        outcome:
          'Rowan and Pip haul Win through between them, lungs burning. She surfaces at the far door coughing seawater and furious at being alive in such an undignified way. Two tins break loose from the rack in the wash and are lost into the dark water before anyone can catch them.',
        gain: { danger: 2, trust: 1 },
        artSubject:
          'Rowan and Pip towing elderly Win Applegarth through a flooded carriage in a burst of bubbles, two painted tins tumbling loose from the luggage rack',
      },
    ],
  },
  {
    id: 'BV-18',
    title: 'The Guard’s Van Ladder',
    kind: 'shortcut',
    speaker: 'Rowan and the drowned railway guard',
    opening:
      'The guard’s van at the tail of the carriage is where the drowned guard keeps his lamp, his whistle and a pegboard of tickets for every decade. A steel ladder is bolted to the wall, and its enamel plate reads BROOM CLOSET, HOUSE LEVEL. The hatch at the top is chained from this side with a bicycle lock. The guard stands aside with his cap under his arm. “Staff access,” he says. “Though I’m told guests may be staff, in an emergency. It is very nearly Friday.”',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands in a cramped railway guard’s van beside a pale drowned guard holding his peaked cap, a steel ladder rising to a chained hatch and a pegboard of old tickets on the wall',
    echoes: [
      {
        flag: 'BV-05:use-the-receipt-date',
        text: 'The coffin Rowan opened with the receipt’s date sits directly above this hatch. The guard mentions that somebody in a black cap came down that way a week ago and never went back up.',
      },
      {
        flag: 'BV-13:light-the-carriage',
        text: 'The lullaby tin Rowan saw by lantern light sits on the guard’s shelf, still without a name. “Lost property,” the guard says. “I’m holding it until Friday.”',
      },
    ],
    choices: [
      {
        id: 'shortcut-back',
        label:
          'Unchain the hatch so the guard’s van opens onto the broom closet',
        outcome:
          'The chain drops. Above, through the coffin’s air holes, Rowan can see the edge of Oren’s laminated plan. There is a fast way up now if Win needs one, and a fast way down for anyone else who knows. The guard writes it in his book: “Passage opened by one guest. Arrows both ways.”',
        gain: { trust: 1 },
        artSubject:
          'A bicycle chain falling from a hatch at the top of a steel ladder as lamplight spills down from a broom closet above, Rowan in his grey cardigan on the rungs',
      },
      {
        id: 'take-the-guards-oil',
        label: 'Accept the guard’s spare lamp oil and leave the hatch chained',
        outcome:
          'The guard tops up the lantern from his own can without being asked and keeps the hatch locked. “Company regulations,” he says, sounding sorry about them. The way back stays shut, the light burns taller, and Rowan notices the guard’s hands shake when he speaks of Friday.',
        gain: { battery: 2 },
        artSubject:
          'The drowned railway guard tilting a small oil can into Pip’s candle lantern inside a dim guard’s van, a chained hatch at the top of the ladder behind them',
      },
    ],
  },
  {
    id: 'BV-19',
    title: 'The Roots That Grew Into Filing Cabinets',
    kind: 'lore',
    speaker: 'Rowan and Win Applegarth',
    opening:
      'Below the carriages the House’s roots come down through the ceiling, and where they touch the floor they turn into steel filing cabinets, drawer after drawer grown out of oak with the grain still showing through the paint. Each drawer is labelled with a year and a family. The oldest are labelled by hand in ink gone brown; the newest are stamped out by a label printer in the same black tape as the umbrella handles. The air smells of sap, toner and the sea, which is close now and loud.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, walks between massive oak roots descending from a dark ceiling and turning into rows of grey steel filing cabinets with wood grain showing through, elderly Win Applegarth reading a brown ink drawer label',
    autoChoiceId: 'open-the-oldest-drawer',
    echoes: [
      {
        flag: 'BV-15:read-a-timecard',
        text: 'Rowan knows the timecard rule now, and here is where it was driven in: a brass punch clock grown into the oak like a nail into a living tree, sap weeping round it.',
      },
    ],
    choices: [
      {
        id: 'open-the-oldest-drawer',
        label: 'Open the oldest drawer, the one with a hand-written label',
        outcome:
          'Inside is a single card in the House’s own grain-brown ink: “What you could not carry, I will keep until you ask for it.” The drawers beside it hold the same card retyped on office paper, with one change: “until you ask for it” has become “for the name on the label.” Someone has edited the House.',
        gain: { evidence: 1 },
        artSubject:
          'Close on two cards side by side in an open steel drawer, one in faded brown handwriting and one crisply typed, Rowan’s grey cardigan sleeve resting on the drawer edge',
      },
    ],
  },
  {
    id: 'BV-20',
    title: 'The Patrol in the Drawers',
    kind: 'hazard',
    speaker: 'Rowan, Pip and three brass patrol wolves',
    opening:
      'Three brass patrol wolves are working the filing roots, pulling drawers open with their teeth and pushing their noses deep inside, ticking whenever they smell a road. Each wears a Blackcap patrol card clipped to its collar like a lanyard. One drawer they have emptied lies on the floor, and the family name on its label has been scratched through. The lead wolf lifts its head. Its nose turns slowly along the aisle toward the party, gears whirring as it sorts the air.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, crouches behind an oak-grained filing cabinet as three brass patrol wolves with printed cards clipped to their collars nose through open drawers, Pip the goblin courier flattened beside him',
    echoes: [
      {
        flag: 'BV-06:walk-through-and-be-smelt',
        text: 'The patrol already knows Rowan’s scent from the turnstile. The lead wolf’s nose finds him at once, and its ticking spells out the word vagrant.',
      },
      {
        flag: 'BV-06:read-the-patrol-card',
        text: 'Word has come down from the turnstile that a guest read the card aloud and contested it. The brass wolves step softly round Rowan, as wolves do round an open case.',
      },
    ],
    choices: [
      {
        id: 'contest-the-survey',
        label: 'Contest the patrol aloud: nobody alive agreed to this survey',
        outcome:
          'Rowan cites the edited card in the oldest drawer and the timecard trick in the carriage, as plainly as a referee’s report. Under wolf law a contested patrol must wait for judgement. The brass wolves sit down among the drawers, ticking, prepared to wait for a court that will take weeks to sit.',
        gain: { trust: 1, danger: -1 },
        requires: { evidence: 3 },
        lockedHint: 'Needs more proof gathered (3)',
        artSubject:
          'Rowan in his grey cardigan standing upright in an aisle of filing roots and speaking firmly as three brass wolves sit back on their haunches before him',
      },
      {
        id: 'hide-in-a-drawer',
        label: 'Climb into a deep bottom drawer and let the patrol pass',
        outcome:
          'The drawer smells like a whole family’s winter, and lying in it Rowan smells it too: a hut, a stove, a path through birches to a hidden spring. The patrol passes. Then a wolf doubles back, sniffs his hair and ticks happily. It has found the family’s road, on him.',
        gain: { danger: -1, trust: -2 },
        artSubject:
          'Rowan curled inside a long steel filing drawer in the dark as a brass wolf’s nose pushes close to his hair, its gears glinting',
      },
      {
        id: 'pip-runs-decoy',
        label: 'Let Pip run a parcel past them as a decoy',
        outcome:
          'Couriers smell loud. Pip sprints down the aisle with an empty parcel and all three wolves go after him. He comes back by a long loop, limping, one ear torn, with a patrol card he snatched from a wolf’s collar. He says it was easily the most fun he has had all week.',
        gain: { danger: 1, evidence: 1 },
        artSubject:
          'Pip the goblin courier sprinting down an aisle of filing roots clutching a brown paper parcel, three brass wolves bounding after him',
      },
    ],
  },
  {
    id: 'BV-21',
    title: 'The Fold Between the Roots',
    kind: 'secret',
    speaker: 'Rowan, Vesper and a hidden family',
    opening:
      'Between two filing roots is a gap the lantern light slides off, as if the dark there had been folded like paper. A draught comes through it smelling of cedar, rice steam and wet mulberry paper: Hoshimori smells, impossibly far from Hoshimori. Somebody very small coughs on the other side and is hushed at once. Rowan understands without being told. The House has been hiding people down here, a whole family behind a fold of dark, and the only roads into it are the kind only moth-folk can see.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands before a narrow fold of deep darkness between two oak-and-steel filing roots, lantern light bending away from it, a faint glow of a paper lantern and the edge of a small hand visible inside',
    echoes: [
      {
        flag: 'BV-11:unfold-the-paper-lantern',
        text: 'The paper lantern Rowan unfolded upstairs flutters toward the fold like a moth to a sleeve. It belonged to someone in there.',
      },
    ],
    choices: [
      {
        id: 'vesper-opens-the-fold',
        label: 'Let Vesper open the fold, on the family’s terms',
        outcome:
          'Vesper speaks into the dark in the Hoshimori way of asking and waits a long time. A grandmother lets them in for one cup of tea and no names. Her family has hidden here since the wolf patrols came; the House feeds them; they know about Friday. She asks Rowan, if he decides anything below, to decide it with them in mind.',
        gain: { trust: 2, evidence: 1 },
        requires: { entry: 'vesper-road' },
        lockedHint: 'Only if Vesper is guiding the descent',
        artSubject:
          'A grandmother pouring tea by paper lantern light in a tiny hidden room between roots, Vesper the moth-winged cartographer kneeling and Rowan in his grey cardigan seated with bowed head',
      },
      {
        id: 'walk-on-unmarked',
        label: 'Leave the fold alone and walk on without marking where it is',
        outcome:
          'Rowan does not look closer. Whoever is in there stays unfound, by him as much as anyone. He will never know who he protected, which means he cannot speak for them later, or be blamed by them. Pip falls in beside him and pointedly forgets the turn.',
        gain: { trust: 1, evidence: -1 },
        artSubject:
          'Rowan in his grey cardigan walking away down an aisle of filing roots with his lantern lowered, Pip glancing back once at a fold of shadow',
      },
      {
        id: 'shine-the-lantern-in',
        label: 'Shine the lantern straight into the fold to see what is hidden',
        outcome:
          'A family of five, blinking. A child hides her face in her mother’s coat. They believed no light could reach here, and now one has. Nobody runs; there is nowhere to go. The grandmother asks him quietly to put it out. He does, too late to undo having seen.',
        gain: { battery: -1, evidence: 2, trust: -2 },
        requires: { battery: 1 },
        lockedHint: 'Needs lantern light',
        artSubject:
          'Harsh lantern light flooding a tiny hidden room where a family of five shields their eyes, a child burying her face in her mother’s coat, Rowan’s raised arm in a grey cardigan sleeve',
      },
    ],
  },
  {
    id: 'BV-22',
    title: 'The Blackcap Field Office',
    kind: 'puzzle',
    speaker: 'Rowan and Pip',
    opening:
      'Someone has set up a field office among the roots: a folding desk, a green-shaded lamp, a filing tray marked OUT, a stamp with a black-capped bird, and a label printer that has been left running. It has printed a coil of labels as long as a skipping rope, every one reading BLACKCAP. Pinned to the wall is a survey of the vault, every child’s lunchbox marked with a route number. A sales ledger lies open beside it. On Friday morning, before the clear-out, every child’s label is to be covered over. The label on top wins.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands in a makeshift field office among oak roots with a green-shaded desk lamp, a whirring label printer spilling a long coil of black labels, and a wall survey map dotted with numbered lunchboxes',
    echoes: [
      {
        flag: 'BV-10:take-his-clipboard',
        text: 'Ambrose’s clipboard fits the empty clip on the desk exactly. Its twenty ticks match the twenty route numbers on the wall survey, one for one.',
      },
      {
        flag: 'BV-10:tell-him-what-he-is',
        text: 'Ambrose has followed them in. He looks at his own field office as if it were the scene of someone else’s crime, and touches nothing.',
      },
    ],
    choices: [
      {
        id: 'copy-the-buyers',
        label: 'Copy the sales ledger buyer by buyer, but never the routes',
        outcome:
          'A ledger of buyers is not a map, so Rowan copies only names and prices: patrol captains, a toll-keeper, a sea-court clerk who has since crossed himself out. Every sale is payable on Friday, on delivery. It is the plainest record of a crime Rowan has ever held, and it makes his notebook heavier in a way he can feel.',
        gain: { evidence: 2, danger: 1 },
        artSubject:
          'Rowan in his grey cardigan copying columns of names from an open sales ledger into a small notebook under a green-shaded desk lamp, the route map left untouched on the wall',
      },
      {
        id: 'take-the-label-coil',
        label: 'Wind up the printed BLACKCAP labels and carry them off',
        outcome:
          'Rowan winds the coil round his forearm like a bandage. On Friday the Land Office will have to print every label again, and the printer is still sitting right here. It buys hours, not safety, and a coil of somebody else’s name sits strangely on his arm.',
        gain: { danger: -1 },
        artSubject:
          'Rowan winding a long coil of black printed labels round his forearm beside a field desk, Pip the goblin courier switching off the whirring label printer',
      },
      {
        id: 'match-the-receipt',
        label:
          'Match the red-wax receipt to the stamp and the signature on the survey',
        outcome:
          'Same bird, same hand: A. Teale, Surveyor. And on the receipt’s counterfoil, filed in the OUT tray, the date Rowan has been carrying all along. Win reads it and goes white. It is the night the House first took something from her, the night she lost her mother’s face.',
        gain: { evidence: 2, trust: -1 },
        requires: { entry: 'red-wax' },
        lockedHint: 'Only if you read the red-wax receipt',
        artSubject:
          'Rowan in his grey cardigan holding a red-waxed receipt beside a matching black-capped bird stamp on a field desk, elderly Win Applegarth pale in the lamplight behind',
      },
    ],
  },
  {
    id: 'BV-23',
    title: 'The Petition on the Notice Board',
    kind: 'choice',
    speaker: 'Rowan, Pip and Win Applegarth',
    opening:
      'Where the roots run out, a cork notice board fills one wall: a fridge-cleaning rota, a poster for a lost cat, a photocopied warning about the stair, and pinned over all of them a petition in many hands. “We, who have slept under this roof, ask for our memories back, or a say in where they go.” Some names are in pencil from the gaslit decade. Some are in a child’s crayon. There is room at the bottom. Beside it hangs the Facilities clear-out notice: FRIDAY, DAWN.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, reads a crowded cork notice board in a root-walled corridor, a long handwritten petition with signatures in pencil, ink and crayon pinned over office notices, a printed Friday clear-out notice beside it',
    echoes: [
      {
        flag: 'e09:5,5:find-the-memory-owner',
        text: 'One signature is in shaky ink, the old woman who raised her hand in the courthouse and agreed to testify about the fire. She signed this first.',
      },
      {
        flag: 'e09:5,5:protect-ossies-box',
        text: 'Low on the sheet, in green crayon, Ossie has written his name and drawn a lunchbox with an enormous padlock on it.',
      },
    ],
    choices: [
      {
        id: 'sign-as-a-guest',
        label: 'Sign the petition as a guest, not a resident',
        outcome:
          '“Rowan, guest, who once came here wearing someone else’s name.” His is now the newest signature on the sheet, which makes the petition, by office logic, current business. Win signs under him, in full, and underlines it twice the way her mother would have.',
        gain: { trust: 1, evidence: 1 },
        artSubject:
          'Rowan in his grey cardigan signing at the bottom of a long petition pinned to cork, elderly Win Applegarth waiting with a pen to sign beneath him',
      },
      {
        id: 'copy-the-signatures',
        label: 'Copy down every signature as testimony for the cold room',
        outcome:
          'Eighty-one names across eleven decades. It is the strongest proof the House holds: the people asked. It is also a list of everyone who ever sheltered here, now in Rowan’s notebook, where a patrol could read it. He copies it anyway, and feels the weight of every name.',
        gain: { evidence: 2, trust: -1 },
        artSubject:
          'Rowan in his grey cardigan copying a column of crayon and pencil signatures into a notebook by lantern light, Pip the goblin courier frowning over his shoulder',
      },
      {
        id: 'hide-the-clearance-notice',
        label: 'Unpin the Friday clear-out notice and hide it in a drawer',
        outcome:
          'An office rule nobody posted is a rule nobody was warned about, and the House shudders as the notice goes into a drawer. The dawn clear-out has lost its paperwork. Tibbet, finding the board empty, will stand in front of it all night, not knowing when Friday is supposed to be.',
        gain: { danger: -1, trust: -1 },
        artSubject:
          'Rowan sliding a printed notice into an oak-grained filing drawer while a bare patch of cork shows on the board behind him',
      },
    ],
  },
  {
    id: 'BV-24',
    title: 'The Root Gate Above the Sea',
    kind: 'shortcut',
    speaker: 'Rowan, Pip and Win Applegarth',
    opening:
      'The roots knot here into a gate of oak and steel, and beyond it the floor gives way to the sea: a stair of pale coral going down and down, the underwater palace stair the House’s roots found when the worlds struck each other. The water stands back from the steps like a crowd from a procession, and the air on them is breathable, just. To one side, a steel service hatch is fixed into the oak with a Blackcap padlock. Its plate reads DEEP SHELF, DIRECT. The Land Office built itself a quicker way down.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands at a gate of knotted oak roots and steel above a pale coral stair spiralling down into standing green seawater, a padlocked steel hatch set into the roots nearby, Pip the goblin courier and elderly Win Applegarth at his side',
    choices: [
      {
        id: 'shortcut-down',
        label:
          'Lever off the Blackcap padlock and open the hatch to the deepest shelf',
        outcome:
          'Pip and Rowan lever the lock with a drawer runner until it gives with a crack. The hatch drops on a straight ladder to the bottom of the vault, faster than any stair and dry the whole way. It is also the route the surveyor built to carry things out, and using it means walking his road.',
        gain: { danger: -1, trust: -1 },
        artSubject:
          'Rowan in his grey cardigan and Pip the goblin courier heaving on a steel bar as a black padlock snaps off a service hatch set in oak roots',
      },
      {
        id: 'take-the-coral-stair',
        label: 'Go down the coral stair the long way, as the House’s roots did',
        outcome:
          'The stair is slow and courteous. Sea-court custom asks a bow at every landing, and the water draws back a little further each time. Win bows like a duchess. It is the road the House found by itself, without paying anyone, and the sea seems to know it.',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'Elderly Win Applegarth bowing deeply on a pale coral landing as walls of green seawater draw back politely, Rowan and Pip bowing behind her',
      },
    ],
  },
  {
    id: 'BV-25',
    title: 'The Tide Registry',
    kind: 'choice',
    speaker: 'Rowan and tide clerk Marrowfin',
    opening:
      'Here the House’s roots and the sea-court’s coral have grown through each other like clasped hands, and in the crook of them sits a registry desk. Behind it a grey-finned merman in a waistcoat of wet paper stamps a ledger with a shell. He is Marrowfin, clerk of the Tide Registry, and he has been sent up from the palace to receive Friday’s clear-out. A green-wax notice hangs above him: WHAT THE TIDE TAKES, THE TIDE KEEPS. Under it, in black label tape, someone has added: FRIDAY.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands before a registry desk set where oak roots and pale coral grow through each other, a grey-finned merman clerk in a waistcoat of wet paper stamping a ledger with a shell beneath a green-wax notice',
    choices: [
      {
        id: 'ask-what-friday-takes',
        label: 'Ask Marrowfin what becomes of everything Friday clears',
        outcome:
          'The tide keeps it, Marrowfin says, forever and fairly. Nobody can buy from the sea; nobody can bribe it; nobody can ever have anything back. He sounds proud of all three. He adds, more quietly, that he has never been sent so many children’s names to receive before, and he does not like it.',
        gain: { evidence: 1 },
        artSubject:
          'The grey-finned merman clerk leaning across his coral desk and speaking low to Rowan in his grey cardigan, a heavy ledger open between them',
      },
      {
        id: 'bow-for-passage',
        label: 'Bow as sea-court custom asks and request safe passage down',
        outcome:
          'Rowan bows from the waist, the way he once watched Scylla bow to a sea-court herald. Marrowfin stamps a wet slip and tucks it into Rowan’s cardigan pocket. “Safe passage,” he says. “Not safe arrival. The deep shelf is not mine.”',
        gain: { trust: 1, danger: -1 },
        artSubject:
          'Rowan in his grey cardigan bowing formally before a coral registry desk as the merman clerk holds out a stamped wet paper slip',
      },
    ],
  },
  {
    id: 'BV-26',
    title: 'The Drowned Nursery',
    kind: 'hazard',
    speaker: 'Rowan and Pip',
    opening:
      'A nursery below the tide, its cots drifting slowly in the green dark and its lunchboxes bobbing at the ceiling, where a pocket of air has been trapped. These tins slid down the chute too early, or were knocked loose in the carriages, and the seawater has soaked their labels off. Some still show the ghost of a name in Tibbet’s ink. Most show nothing. Rowan cannot tell whose is whose, and the dark here is complete enough that Pip, a hand’s width away, is only a voice.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, treads water in a drowned nursery among drifting cots, painted lunchboxes bobbing against the ceiling in a trapped pocket of air, Pip the goblin courier clinging to a floating cot',
    choices: [
      {
        id: 'light-and-read-labels',
        label:
          'Light the lantern and read the soaked labels before they wash away',
        outcome:
          'In the light Rowan reads ghost names from the wet paper, a letter here, a letter there, and presses each label back onto its lid with his thumb. Tibbet’s ink is good. Seven tins keep their names. Thirty do not, and he has to let those go bobbing back into the dark.',
        gain: { battery: -1, evidence: 1, trust: 1 },
        requires: { battery: 1 },
        lockedHint: 'Needs lantern light',
        artSubject:
          'Rowan in his grey cardigan holding a lantern above dark water and pressing a soaked paper label onto a painted lunchbox with his thumb, faint names glowing in the wet',
      },
      {
        id: 'gather-them-blind',
        label: 'Gather every floating tin into Pip’s satchel in the dark',
        outcome:
          'They fill the satchel blind, the tins knocking together like teeth. Nobody knows whose memory is whose any more. Pip is carrying thirty strangers home and says so, cheerfully, through chattering teeth, and the weight drags at him all the way to the next room.',
        gain: { danger: 1 },
        artSubject:
          'Pip the goblin courier stuffing dripping painted tins into an overfull satchel in deep darkness, only the glint of wet metal showing',
      },
      {
        id: 'leave-them-floating',
        label: 'Leave the drowned tins where the tide put them',
        outcome:
          'Rowan swims through without touching anything. The tins nudge his shoulders as he passes, like cats asking to be let out. Friday will take them; nobody would have known whose they were anyway. He tells himself that, and finds he does not believe it.',
        gain: { danger: -1, trust: -1 },
        artSubject:
          'Rowan swimming through dark water as painted lunchboxes drift and nudge against his shoulders, the far doorway a faint green rectangle',
      },
    ],
  },
  {
    id: 'BV-27',
    title: 'The Clock in the Coral',
    kind: 'puzzle',
    speaker: 'Rowan and Pip',
    opening:
      'A great office wall clock has grown into the coral here, its face as wide as a cartwheel, its hands crusted with barnacles. It does not tell the hour. It tells the tide. The little hand points to FRIDAY, and the big one is closing on dawn. In the dark the second hand goes in with a sound like a staple. Beside it Tibbet has pinned a card: “The clock is the boss.” A coral ladder climbs to the face, slick and unlit.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands in a dark coral chamber beneath an enormous barnacle-crusted office wall clock grown into the reef, a slick coral ladder climbing to its face, Pip the goblin courier pointing up at the hands',
    choices: [
      {
        id: 'read-the-clock-face',
        label: 'Climb with the lantern and read the clock face closely',
        outcome:
          'By lantern light the face shows a schedule, and a second mark scratched beside the first: the clear-out was set for next Friday. Someone wound the hand forward a whole week, so the tide would come before anyone noticed. The scratches are neat, as if made with the corner of a surveyor’s rule.',
        gain: { battery: -1, evidence: 2 },
        requires: { battery: 1 },
        lockedHint: 'Needs lantern light',
        artSubject:
          'Rowan in his grey cardigan clinging to a coral ladder with a lantern held up to a giant clock face, a neat scratched mark visible beside the barnacled hour hand',
      },
      {
        id: 'drag-the-hand-back',
        label: 'Climb blind and drag the minute hand back an hour',
        outcome:
          'The hand moves, grinding through barnacles. The tide, which keeps honest time, does not forgive it: a cold surge rolls up the stair and takes the tins on the lowest step. But Tibbet’s line has another hour, and somewhere above, a cook keeps packing.',
        gain: { danger: 2, trust: 1 },
        artSubject:
          'The dark silhouette of Rowan hauling on a barnacled clock hand as a cold surge of seawater crashes up a coral stair below',
      },
      {
        id: 'count-the-ticks',
        label: 'Count the ticks in the dark to work out how long is left',
        outcome:
          'Rowan counts like a lab timer and does the sums under his breath: a little under three hours. While he counts, the water creeps from his ankles to his knees. Pip says it is the first time he has heard anyone do arithmetic as a form of prayer.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'Rowan in his grey cardigan standing knee-deep in dark water with his eyes closed and lips moving, the giant clock looming faintly above',
      },
    ],
  },
  {
    id: 'BV-28',
    title: 'The Bed the Surveyor Slept In',
    kind: 'choice',
    speaker: 'Rowan, Pip and surveyor Ambrose Teale',
    opening:
      'In a coral alcove stands a camp bed, its blanket folded with surveyor’s corners, an alarm clock beside it that went off a week ago and has been ringing faintly ever since. Under the pillow is a black lunchbox. Tibbet’s label on it is blank, as if the cook could not think of a child to give this one to. Over that, in Blackcap tape, the Land Office has labelled its own man: TEALE, A. Inside, ticking like a clock, is everything Ambrose Teale knew about why he came.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, kneels beside a neatly made camp bed in a coral alcove, lifting a black lunchbox with black label tape from under the pillow, a small alarm clock ringing faintly on an upturned crate',
    echoes: [
      {
        flag: 'BV-10:tell-him-what-he-is',
        text: 'Ambrose has followed this far. He stands at the edge of the alcove, cap in his hands, looking at his own name on a lunchbox as if it were a summons.',
      },
      {
        flag: 'BV-10:leave-him-measuring',
        text: 'Ambrose is still upstairs with his dollhouse. Whatever is decided about this tin will be decided without him in the room.',
      },
    ],
    choices: [
      {
        id: 'give-ambrose-his-tin',
        label: 'Give Ambrose Teale back what he came down here knowing',
        outcome:
          'Pip runs to fetch him from wherever he has wandered. Ambrose opens the tin and his face changes as it comes back: who paid, who is buying, which roads. He is sorry, and he is dangerous again, because he knows every route in the vault. He says he will testify. Rowan has no way of telling whether he means it.',
        gain: { evidence: 2, danger: 2 },
        artSubject:
          'Ambrose Teale in his black cap opening a black lunchbox as ticking light floods his face, his mild expression hardening into understanding, Rowan watching warily',
      },
      {
        id: 'seal-it-for-court',
        label: 'Keep his tin sealed and carry it up for a court to open',
        outcome:
          'Rowan writes on the lid with Tibbet’s pen: “For clerk Dorrit Pell, to open in court, with the man present.” It is accountability by the slow road. The tin ticks in Pip’s satchel for the rest of the descent, and Pip says it is like carrying somebody’s heartbeat.',
        gain: { evidence: 1, trust: 1 },
        artSubject:
          'Rowan in his grey cardigan writing carefully on the lid of a black lunchbox before handing it to Pip the goblin courier to stow in his satchel',
      },
      {
        id: 'leave-it-for-friday',
        label: 'Leave the tin under the pillow for Friday’s clear-out',
        outcome:
          'The tide will take what Ambrose knew. Nobody will ever buy his routes again, and nobody will ever try him for selling them. It is a gentle ending for a man who did not earn one, and the people he sold will never hear him say what he did.',
        gain: { danger: -1, evidence: -1 },
        artSubject:
          'A black lunchbox tucked back beneath a folded pillow on a camp bed, a small alarm clock still ringing faintly beside it in the coral gloom',
      },
    ],
  },
  {
    id: 'BV-29',
    title: 'The Coral Staff Lockers',
    kind: 'treasure',
    speaker: 'Rowan and Pip',
    opening:
      'A row of staff lockers has grown out of the reef, each door named in green wax for a sea-court clerk and closed with a padlock shaped like a cockle shell. One stands open on a clerk’s spare oil lamp, a ration of dried kelp and a laminated rota for the Friday receiving shift. Every name on the rota has a mark beside it, made in the same dark ink, which in this light could mean anything. Pip helps himself to the kelp and immediately regrets it.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands at a row of coral-grown staff lockers with green wax nameplates and shell-shaped padlocks, one open locker holding an oil lamp and a laminated rota, Pip the goblin courier grimacing over a strip of dried kelp',
    choices: [
      {
        id: 'take-the-clerks-lamp',
        label: 'Take the clerk’s spare oil lamp and leave a note of thanks',
        outcome:
          'The lamp is full and burns green-white, a sea-court colour. Rowan leaves a note in the locker with his name and the date, the way he would sign out equipment at work. Pip says nobody has ever left a thank-you in a sea-court locker in its whole history.',
        gain: { battery: 2 },
        artSubject:
          'Rowan in his grey cardigan lifting a glowing green-white oil lamp out of a coral locker and tucking a folded note onto the shelf in its place',
      },
      {
        id: 'read-the-rota-by-light',
        label: 'Hold the lantern to the rota and read what the marks mean',
        outcome:
          'The marks are refusals. Every clerk on the Friday shift has signed: “We keep what the tide takes. We do not take what the Land Office throws.” The sea court will receive the clear-out, by law, but it will not accept a single tin labelled BLACKCAP. The sea has its own rules about consent.',
        gain: { battery: -1, evidence: 1, trust: 1 },
        requires: { battery: 1 },
        lockedHint: 'Needs lantern light',
        artSubject:
          'Lantern light on a laminated sea-court rota where each clerk’s name carries a written refusal in dark ink, Rowan’s grey cardigan sleeve holding the light close',
      },
    ],
  },
  {
    id: 'BV-30',
    title: 'Where the Roots Stop',
    kind: 'secret',
    speaker: 'Rowan and Win Applegarth',
    opening:
      'The last roots end here, in a pocket of wet oak no bigger than a pantry, and the tide has washed back what earlier Fridays cleared: tins rusted to lace, labels gone to pulp. Win kneels in the wet before the one tin that still has paint on it. A swallow, chipped on one wing. It is not her memory inside. It is her mother’s: Dora Applegarth packing a lunch for her daughter, sixty years ago, on the last morning before the cellar.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands in a tiny cave of wet oak roots strewn with rusted lunchboxes, elderly Win Applegarth kneeling in seawater before a single tin painted with a chipped swallow',
    echoes: [
      {
        flag: 'e09:4,6:free-dora-name',
        text: 'Win can picture her mother now, laugh and terrible soup included, since the staple came out of the lease. Seeing the swallow, she laughs and cries in the same breath.',
      },
      {
        flag: 'e09:4,6:compare-six-leases',
        text: 'Win still cannot picture her mother’s face. She looks at the swallow for a long time, as if it might do the remembering for her.',
      },
      {
        flag: 'BV-14:ask-about-the-swallow',
        text: 'Win told Rowan about the chipped wing in the linoleum carriage. She knew it before she saw it, which means some of it had already come back.',
      },
    ],
    choices: [
      {
        id: 'light-the-lid-for-win',
        label: 'Hold the lantern to the inside of the lid for Win to read',
        outcome:
          'Faint ink inside the lid, in a hand older than Blackcap and older than Tibbet: “For Winifred, to keep.” Dora labelled it herself. Win opens it and hears her mother humming over bread. It is the one tin in the whole House labelled by the person whose memory it is, and Win holds it as if it might fly.',
        gain: { battery: -1, trust: 2 },
        requires: { battery: 1 },
        lockedHint: 'Needs lantern light',
        artSubject:
          'Lantern light revealing faded handwriting inside the lid of a swallow-painted tin as elderly Win Applegarth listens with her eyes shut, Rowan holding the light steady',
      },
      {
        id: 'give-it-closed',
        label: 'Give Win the tin closed and let her open it in her own time',
        outcome:
          'Win takes it and does not open it. “Not in a cave,” she says. “She’d want a kitchen.” She carries it against her chest the rest of the way down, and twice Rowan sees her stop and press her ear to the lid, like someone listening at a door.',
        gain: { trust: 1, danger: -1 },
        artSubject:
          'Elderly Win Applegarth rising slowly from wet oak roots holding a swallow-painted tin closed against her chest, Rowan offering his arm',
      },
    ],
  },
  {
    id: 'BV-31',
    title: 'The Deepest Shelf',
    kind: 'lore',
    speaker: 'Rowan, Pip and Win Applegarth',
    opening:
      'The deepest shelf of the House is a long cold corridor lit blue, lined with steel shelving bent into the shapes of oak roots, and it hums like every office fridge Rowan ever stood in front of at midnight wondering whose yoghurt that was. The floor is wet. The sea is very close now, breathing behind the walls. At the far end, a heavy insulated door stands ajar, and lying across the gap, chin on his paws, is a wolf.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, walks a long cold blue-lit corridor lined with steel shelving shaped like oak roots, frost on the shelves and a wet floor, a huge grey wolf lying across a heavy insulated door at the far end, Pip and Win behind him',
    autoChoiceId: 'walk-the-cold-corridor',
    echoes: [
      {
        flag: 'BV-24:shortcut-down',
        text: 'The Blackcap service ladder ends here behind a pallet. Its rungs are worn bright where somebody carried heavy things up, many times, in a hurry.',
      },
      {
        flag: 'BV-24:take-the-coral-stair',
        text: 'The coral stair’s last landing opens onto this corridor, and Rowan’s sleeves are still wet from the sea’s courtesy.',
      },
    ],
    choices: [
      {
        id: 'walk-the-cold-corridor',
        label: 'Walk the cold corridor toward the wolf',
        outcome:
          'The shelves are labelled in three hands: children’s names in Tibbet’s copperplate, BLACKCAP in black tape, and on the oldest shelves the House’s own brown grain. Halfway along, the wolf opens one eye. He does not get up. He watches Rowan the whole way with the patience of something that has waited outside a long time.',
        gain: { evidence: 1 },
        artSubject:
          'A huge grey wolf opening one amber eye as Rowan in his grey cardigan walks toward him between frosted shelves labelled in three different hands',
      },
    ],
  },
  {
    id: 'BV-32',
    title: 'Old Latch at the Cold-Room Door',
    kind: 'guardian',
    speaker: 'Old Latch, the House’s wolf',
    opening:
      'The wolf is enormous and grey to the muzzle, with a Blackcap security lanyard round his neck and a staff mug of cold tea beside his paws. He sniffs Win and his ears go back. “I know you. You ran out past me the night they locked me out.” He turns to Rowan. “For forty years I scratched at that latch from the outside, in the rain. Then a man with a receipt let me in, gave me a lanyard and a door to keep. I sleep indoors now. Tell me why I should give you the House’s cold room and go back to the rain.”',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands before a huge grey-muzzled wolf lying across a frosted insulated door, the wolf wearing a security lanyard with a black-capped bird badge, a staff mug beside his paws and elderly Win Applegarth and Pip the goblin courier behind',
    echoes: [
      {
        flag: 'entry:vesper-road',
        text: 'Latch’s nose wrinkles at Vesper’s wings. “Map-moth,” he says. “Your kind sold roads once.” Vesper does not deny it, and does not step back.',
      },
      {
        flag: 'entry:red-wax',
        text: 'Latch’s eyes go straight to the receipt in Rowan’s pocket. “That’s his paper,” he says. “That’s what let me in.”',
      },
      {
        flag: 'BV-06:read-the-patrol-card',
        text: '“You read the patrol card aloud at the turnstile,” Latch says. “The whole pack heard. Contesting the Land Office in its own doorway. Brave, for a guest.”',
      },
      {
        flag: 'BV-23:sign-as-a-guest',
        text: 'Latch sniffs the ink on Rowan’s fingers. “You signed as a guest. Good. Owners are what put me on this door.”',
      },
      {
        flag: 'BV-21:vesper-opens-the-fold',
        text: '“You had tea with the family in the fold,” Latch says. “They told me you’d come. They didn’t say what you’d do.”',
      },
      {
        flag: 'BV-20:hide-in-a-drawer',
        text: 'Latch smells a birch path and a hidden spring on Rowan’s hair. “You’re carrying someone’s road,” he says. “The patrol upstairs got it off you. Did you know?”',
      },
    ],
    choices: [
      {
        id: 'tell-him-what-the-lanyard-guards',
        label: 'Tell Latch plainly what the Land Office let him in to guard',
        outcome:
          'Rowan tells him: the sale, the buyers, the patrols waiting for Friday. Latch listens with his ears flat. “I know what I’m guarding,” he says at last. “I’ve smelt the roads in those tins. I hoped it was the House’s business.” He hooks off the lanyard with one claw and drops it in his mug. “Go in. I’ll keep the door. Not for them.”',
        gain: { trust: 1, danger: 1 },
        passesGuardian: true,
        artSubject:
          'The great grey wolf hooking a security lanyard off his neck with one claw and dropping it into a staff mug, Rowan in his grey cardigan standing before him with open hands',
      },
      {
        id: 'lay-out-the-ledger',
        label:
          'Lay out the ledger, the edited rule and everything else you found',
        outcome:
          'Latch reads it the way wolves read a court: slowly, nose first. At the buyers’ column he stops. “Patrols,” he says. “My own kind, buying children’s roads off a man in a hat.” He stands, and he is taller than Rowan. He moves aside from the door without another word.',
        gain: { evidence: 1, trust: 1 },
        requires: { evidence: 6 },
        lockedHint: 'Needs more proof gathered (6)',
        passesGuardian: true,
        artSubject:
          'Papers, a notebook and a red-waxed counterfoil spread on the frosted floor before a huge grey wolf bending his muzzle to read them, Rowan in his grey cardigan kneeling opposite',
      },
      {
        id: 'win-remembers-the-latch',
        label: 'Let Win tell him what she remembers of the night she ran',
        outcome:
          '“There was a grey wolf at the latch,” Win says. “He could have barked. He looked away so a girl could run.” She puts her hand on his head. “You weren’t keeping us out. They locked you out so you couldn’t stop them.” Latch lowers his chin to his paws like a dog told he was good, and lets them by.',
        gain: { trust: 2, danger: -1 },
        requires: { trust: 4 },
        lockedHint: 'Only if Win trusts you enough to speak',
        passesGuardian: true,
        artSubject:
          'Elderly Win Applegarth resting her hand on the head of a huge grey wolf who has lowered his chin to his paws, Rowan and Pip watching quietly by the cold-room door',
      },
      {
        id: 'vesper-walks-a-gift',
        label: 'Let Vesper walk Latch a road that was given, not sold',
        outcome:
          'Vesper draws nothing and names no one. They simply walk the moth-road out along the corridor and back, slowly, so the wolf can smell what a road freely given smells like. Latch follows it with his nose all the way there and all the way home. “Different,” he says. “Cleaner.” He moves from the door.',
        gain: { trust: 2, danger: -1 },
        requires: { entry: 'vesper-road' },
        lockedHint: 'Only if Vesper guided the descent',
        passesGuardian: true,
        artSubject:
          'Vesper the moth-winged cartographer walking a faint pale moth-road down a frosted corridor as the great grey wolf follows the light with his nose, Rowan waiting by the door',
      },
      {
        id: 'hand-over-the-receipt',
        label: 'Give Latch the red-wax receipt that opened this door',
        outcome:
          'Rowan holds out the paper that let the wolf in. Latch takes it gently in his teeth, considers it, and eats it, wax and all. “Now nobody paid,” he says. “Now I’m just here.” The best proof of the sale is gone down a wolf. He steps aside.',
        gain: { danger: -1, evidence: -1 },
        requires: { entry: 'red-wax' },
        lockedHint: 'Only if you carried the red-wax receipt down',
        passesGuardian: true,
        artSubject:
          'The huge grey wolf delicately taking a red-waxed receipt in his teeth from Rowan’s outstretched hand beside a frosted cold-room door',
      },
    ],
  },
  {
    id: 'BV-33',
    title: 'The Cold Room',
    kind: 'treasure',
    speaker: 'Rowan, Pip and Old Latch',
    opening:
      'Behind Latch’s door is the House’s cold room, and it is a refrigerator the size of a chapel: steel shelves to the vaulted oak ceiling, frost on the ribs, two hundred and fourteen tins humming in blue light. On the inside of the door, where the House’s first rule was carved into the wood, a Blackcap label has been stuck across it: CONTENTS PROPERTY OF BLACKCAP LAND OFFICE. On a steel table lie the deed of sale and the buyers’ orders, fanned out under frost. Rowan understands at last what was bought. Not a House. The roads inside everyone who ever slept in it.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands inside a vast chapel-sized walk-in refrigerator with frosted oak vaulting and towering steel shelves of glowing painted tins, a black label stuck across carved words on the inside of the door and papers fanned on a frosty steel table',
    echoes: [
      {
        flag: 'BV-32:tell-him-what-the-lanyard-guards',
        text: 'Latch stays at the door with his back to them, keeping watch the way he says he always meant to. His lanyard is still soaking in the mug.',
      },
      {
        flag: 'BV-32:win-remembers-the-latch',
        text: 'Latch has followed Win inside and lies at her feet, and she keeps one hand in the fur of his neck.',
      },
      {
        flag: 'BV-32:hand-over-the-receipt',
        text: 'There is a red smear of wax on Latch’s muzzle. Nothing on the steel table now proves who paid for the route down, except the deed itself.',
      },
      {
        flag: 'BV-22:copy-the-buyers',
        text: 'The buyers’ orders match the ledger Rowan copied in the field office, line for line. The Land Office keeps beautiful books.',
      },
    ],
    choices: [
      {
        id: 'peel-back-the-label',
        label:
          'Peel back a corner of the Blackcap label to read the House’s own rule',
        outcome:
          'Under the tape, carved into the oak: “What you could not carry, I will keep until you ask.” Ask, not label. Everything since the collision has been the House trying to obey that line through an office’s rules. Peeling the corner makes the whole cold room shiver, and somewhere in the dark the tide sits up and pays attention.',
        gain: { evidence: 2, danger: 1 },
        artSubject:
          'Rowan in his grey cardigan peeling back the corner of a black printed label on a frosted oak door to reveal carved hand-cut words beneath',
      },
      {
        id: 'take-the-buyers-orders',
        label: 'Take the buyers’ orders: every patrol’s name and price',
        outcome:
          'It is proof enough for any court in three worlds. It is also a list of wolves who will want it back, and Latch watches the papers go into Rowan’s cardigan with his lip lifted, not at Rowan. The House’s wolf is going to have a very difficult conversation with his kin.',
        gain: { evidence: 2, trust: -1 },
        artSubject:
          'Rowan folding a fan of frosted papers into his grey cardigan beside a steel table as a great grey wolf watches from the doorway with his lip lifted',
      },
      {
        id: 'light-the-emergency-lamp',
        label:
          'Light the cold room’s emergency lamp and fill the lantern from it',
        outcome:
          'A caged lamp over the door still has oil in it, put there long ago by someone who planned for the House to need light at the bottom. Pip fills the lantern to the brim. In the new light the tins look less like evidence and more like what they are: people’s lives, waiting.',
        gain: { battery: 2 },
        artSubject:
          'Pip the goblin courier on tiptoe filling a candle lantern from a caged emergency lamp above a frosted door, warm light spilling across shelves of painted tins',
      },
    ],
  },
  {
    id: 'BV-34',
    title: 'The Tin With Two Names',
    kind: 'secret',
    speaker: 'Rowan',
    opening:
      'On the oldest shelf, behind the frost, is a plain grey office tin, the kind Rowan once kept teabags in at work. Its first label, in the House’s brown grain, reads MORROW: the name he was wearing the first time he stood on this porch. Somebody has crossed it out carefully and written ROWAN above it, in his own handwriting, which he does not remember doing. Inside, faint as rain on an office window, is the drizzle he once described to an umbrella stand in the hall. The first thing this House was ever given rather than took.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, holds a plain grey office tin from a frosted oak shelf, its old label crossed out with a new name written above, a faint grey shimmer of rain-streaked window light rising from its open lid',
    echoes: [
      {
        flag: 'e09:5,6:swap-tins-quietly',
        text: 'Rowan thinks of Kit upstairs, crying at night for a happy thing he lost in a lunch-swap game and cannot name.',
      },
      {
        flag: 'BV-16:ask-pip-what-he-wants',
        text: 'Two labels on one tin. Rowan has seen that once tonight already, in a dining car, when Pip chose for himself.',
      },
    ],
    choices: [
      {
        id: 'take-it-back',
        label: 'Take your own memory back and listen to the rain',
        outcome:
          'It comes back whole: a wet Tuesday, an office with steamed windows, a colleague’s umbrella dripping in a stand, a life he chose to trade. He had forgotten he had forgotten it. Around the empty place on the shelf the frost thickens at once, as if the House had lost the one warm thing it was given.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'Rowan in his grey cardigan with eyes closed and a faint smile as soft grey rain-light washes over his face, frost creeping across the empty shelf beside him',
      },
      {
        id: 'leave-it-given',
        label:
          'Leave it on the shelf: it was a gift, and gifts are not taken back',
        outcome:
          'Rowan sets it back exactly where it was. It is the one tin in the cold room that was given and not taken, and the House needs one. Around it the frost softens to dew. He will not remember that Tuesday again, and he finds he can live with that, because he chose it twice.',
        gain: { trust: 2 },
        artSubject:
          'Rowan’s hands setting a plain grey tin back on a frosted oak shelf as a small circle of frost around it melts into glistening dew',
      },
      {
        id: 'relabel-it-for-kit',
        label:
          'Write KIT under your name and send it up for the boy with the hare tin',
        outcome:
          'Rowan writes the boy’s name beneath his own, giver and receiver both on file. A child who lost a happy thing will get an ordinary rainy Tuesday instead, which may be better. Rowan loses the last clear morning he had from Earth, and gives it away with his eyes open.',
        gain: { trust: 1, evidence: -1 },
        artSubject:
          'Rowan in his grey cardigan writing a second name beneath his own on a grey office tin with a pen on a string, painted children’s lunchboxes glowing on the shelves around him',
      },
    ],
  },
  {
    id: 'BV-35',
    title: 'The Hearth Inside the Refrigerator',
    kind: 'climax',
    speaker: 'Rowan, Pip, Win Applegarth, Tibbet and Old Latch',
    opening:
      'At the back of the cold room is what the House That Remembers once called its Hearth: a stone fireplace, still burning, built now into the rear wall of the refrigerator, so that the fire is kept cold and the frost is kept warm. Tibbet is here, laying one loaf for the absent. Latch lies across the door. Above the mantel the tide clock says dawn is minutes away. Tibbet holds out its roll of labels and a pen on a string. Whatever Rowan writes on the tins, or on the door, the House will obey.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, stands before a stone hearth burning with cold blue flame set into the back wall of a vast frosted refrigerator, a brass automaton cook offering him a roll of labels and a pen, elderly Win Applegarth, Pip the goblin courier and a great grey wolf gathered close',
    echoes: [
      {
        flag: 'BV-21:vesper-opens-the-fold',
        text: 'The grandmother from the fold has come down to stand by the mantel, uninvited and unafraid, to watch what is decided about her family.',
      },
      {
        flag: 'BV-28:give-ambrose-his-tin',
        text: 'Ambrose stands by the door under Latch’s eye, remembering everything now, waiting to see what kind of man Rowan is before he decides what kind he will be.',
      },
      {
        flag: 'BV-28:seal-it-for-court',
        text: 'Ambrose’s sealed tin ticks in Pip’s satchel, addressed to a courtroom.',
      },
      {
        flag: 'BV-30:light-the-lid-for-win',
        text: 'Win holds her mother’s swallow tin to her chest: the one label in this House written by the person whose memory it was.',
      },
      {
        flag: 'BV-33:peel-back-the-label',
        text: 'The House’s own rule shows under the peeled corner of the door, brown and patient: until you ask.',
      },
    ],
    choices: [
      {
        id: 'return-every-tin',
        label:
          'Label every tin with its owner’s name and send Pip up with them all',
        outcome:
          'Rowan writes until his hand cramps, and Pip runs the stair until his legs shake. Every memory goes home: the father’s lullaby, Win’s afternoons, the refugees’ fords and hidden springs, Ambrose’s own knowing. The Land Office has nothing left to claim. But the roads go back into heads that brass noses can smell at a border, and Kit’s happy thing goes back to a stranger.',
        gain: { trust: 2, danger: 2 },
        artSubject:
          'Rowan in his grey cardigan writing names on tin after tin at a frosted table as Pip the goblin courier staggers away under a towering stack of painted lunchboxes, the cold hearth blazing behind',
      },
      {
        id: 'sign-for-the-house',
        label:
          'Tear off the Blackcap label and write the House’s own name on the door',
        outcome:
          'The House owns its contents again, as it did before the collision: it keeps what you cannot carry until you ask. Nobody can buy from it now. But nobody’s memory comes home tonight either; each owner must find the House and ask, and some of them are on the wolf road and never can. Tibbet bakes. The frost holds.',
        gain: { evidence: 1, danger: -1, trust: -1 },
        artSubject:
          'Rowan tearing a long black label from a frosted oak door and writing in its place with a pen on a string, the brass cook watching and the hearth flame turning warm gold',
      },
      {
        id: 'let-the-tide-clear-it',
        label:
          'Peel off every label, Blackcap’s and the children’s, and let Friday come',
        outcome:
          'At dawn the cold room tips into the palace stair and the tide takes what it is owed: two hundred and fourteen tins, the deed, the orders, every name. Marrowfin’s clerks receive it all and sell none of it. Nobody will ever buy a route from the sea. Nobody will ever get anything back. The House That Remembers wakes up a house.',
        gain: { danger: -2, evidence: -2 },
        artSubject:
          'A great wave of green seawater rolling through a frosted cold room and carrying away hundreds of unlabelled painted tins, Rowan holding elderly Win Applegarth back by the hearth',
      },
    ],
  },
  {
    id: 'BV-36',
    title: 'Up Into Friday',
    kind: 'exit',
    speaker: 'Rowan, Pip and Win Applegarth',
    opening:
      'The service stair from the cold room climbs past the coral, the filing roots, the carriage in all its decades, Tibbet’s counter and the shrink-wrapped chairs on the porch, all the way to the butler’s corridor where the desk lamp is still screwed into the wall. It is Friday morning. Above them the House is waking: doors unlocking one by one, a kettle in the linoleum decade, children on the stair counting their lunchboxes. Pip goes first with the lantern, Win in the middle, Rowan last, carrying what he decided.',
    artSubject:
      'Rowan, an androgynous researcher in a grey cardigan, climbs the last turn of a narrow root-lined stair toward a panelled mansion corridor bright with morning light and an office desk lamp on the wall, Pip the goblin courier ahead with a lantern and elderly Win Applegarth between them',
    echoes: [
      {
        flag: 'BV-35:return-every-tin',
        text: 'Pip has made nineteen trips up this stair already. Upstairs, people are opening tins in the hall and crying, and at the forest edge, Rowan knows, a brass nose is lifting to the wind.',
      },
      {
        flag: 'BV-35:sign-for-the-house',
        text: 'Behind them the cold-room door bears the House’s own name, in Rowan’s writing. Upstairs, a queue of people who want to ask for something is already forming on the porch.',
      },
      {
        flag: 'BV-35:let-the-tide-clear-it',
        text: 'The stair is quiet. Nothing hums. The umbrellas in the hall drip ordinary rain now, and when Win says good morning to the House, it does not answer.',
      },
      {
        flag: 'entry:vesper-road',
        text: 'Vesper waits at the top, wings open, and asks nothing about what happened below. They kept their terms; Rowan kept his.',
      },
      {
        flag: 'entry:red-wax',
        text: 'The corridor doors the House locked when Rowan read the receipt are standing open now, every one, in the morning light.',
      },
    ],
    choices: [
      {
        id: 'climb-into-friday',
        label: 'Climb up into Friday morning',
        outcome:
          'At the top Rowan switches off the desk lamp. For a moment the moth-road glows on without it, faint and voluntary, then fades into floorboards. Pip pockets the last candle end. Win goes to find Kit. The House says nothing at all, which in this House has always been a kind of answer.',
        artSubject:
          'Rowan in his grey cardigan reaching up to switch off an office desk lamp bolted to a panelled mansion wall as a faint moth-road glows and fades across the floorboards in morning light',
      },
    ],
  },
]
