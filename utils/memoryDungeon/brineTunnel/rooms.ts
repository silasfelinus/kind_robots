import type { DungeonRoomContent } from '../authoredDungeon/types'
import type { BrineTunnelEntry, BrineTunnelRoomId } from './types'

export const BRINE_TUNNEL_ROOMS: readonly DungeonRoomContent<
  BrineTunnelRoomId,
  BrineTunnelEntry
>[] = [
  {
    id: 'BT-01',
    title: 'The Bell Below the Terrace',
    kind: 'entry',
    speaker: 'Pip',
    opening:
      'The terrace railway runs straight into the hill, and the sea comes out to meet it. Warm brine climbs the sleepers against every rule of slope, carrying small silver fish that swim uphill without effort. Coral has crept over the rails in pink lace. Deep inside, a bell rings once, and a transfer cart glides past them into the dark on its own: five singers sitting upright in it, asleep, mouths open on one long shared note, a paper tag at every ankle. Pip lifts the lantern. ‘That’s Hiro from the low terrace,’ he says. ‘He can’t even hold a note.’',
    artSubject:
      'The mouth of a hillside railway tunnel flooded with warm glowing seawater, pink coral lacing the rails, a small cart gliding into the dark with five sleeping singers seated upright in straw hats and paper tags at their ankles, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, standing knee-deep at the entrance, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, lifting a dripping lantern beside them',
    echoes: [
      {
        flag: 'entry:bell-marks',
        text: 'The rubbing is rolled in Vesper’s satchel, charcoal still black on their fingers from an hour at the coral. The cart that passed while they copied is the one ahead of them now. Pip does not say so. He does not have to.',
      },
      {
        flag: 'entry:singers',
        text: 'Old Rin wades in at Vesper’s elbow, straw hat tied down, and the two volunteers, Nae and Goro, hold hands behind her like children at a ford. All three are humming under their breath, without meaning to, the note the cart is singing.',
      },
      {
        flag: 'e12:5,2:answer-silence',
        text: 'Vesper taught the terraces to answer a bought name with a held rest. These five never learned it. They were taken the week before.',
      },
      {
        flag: 'e12:5,2:read-segments',
        text: 'Two of the sleeping faces are names Vesper copied off the ticket centipede’s back. The copy is in the satchel. It did not keep them home.',
      },
    ],
    choices: [
      {
        id: 'follow-the-cart',
        label: 'Wade after the loaded cart before the dark takes its song',
        outcome:
          'Vesper runs splashing after it, Pip’s lantern swinging. The cart outpaces them on the level and vanishes round the first bend, but Vesper gets close enough to read the nearest tag: a singer’s name, and under it, in a clerk’s hand, a house on the cedar bridge road. Not where he lives. Where he sings at harvest.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'Vesper, wings half open, splashing along a flooded railway after a cart of sleeping singers disappearing round a dark bend, a lantern swinging behind them',
      },
      {
        id: 'read-the-water',
        label: 'Kneel and learn which way the water truly runs before going in',
        outcome:
          'Vesper lays a palm flat on the brine. It runs uphill on top and downhill underneath, two currents sliding over each other like hands in a sleeve. The top one comes from the sea gate. The bottom one is going home to it. Anything that sinks in this tunnel will be carried down to the palace.',
        gain: { evidence: 1 },
        artSubject:
          'Vesper kneeling on a coral-crusted sleeper with one grey palm flat on glowing seawater, two faint currents visible sliding past each other beneath their hand',
      },
      {
        id: 'lay-the-rubbing',
        label:
          'Unroll the bell rubbing against the coral at the mouth and compare',
        outcome:
          'The rubbing and the coral agree on every promise but one. Since the hour they spent copying, the coral has grown a new scratch at the very front of the order: five short strokes, close together, like the five sleeping singers. The bell has put its newest departure first.',
        gain: { evidence: 2 },
        requires: { entry: 'bell-marks' },
        lockedHint: 'Only if Vesper copied the bell marks before coming in',
        artSubject:
          'A long sheet of rice paper covered in charcoal marks pressed flat against pink coral by grey moth-folk hands, five fresh scratches showing pale beside the rubbing’s edge',
      },
      {
        id: 'rin-names-them',
        label:
          'Let Old Rin name the five sleepers aloud, softly, so someone has',
        outcome:
          'Rin names them in a whisper, oldest first, and then a sixth she has carried all week: Kiri, her youngest apprentice, who was in no cart she saw. The cart’s note wavers for one breath, as if the sleepers heard. Then it steadies and carries them in. Nae is crying. Goro wades on ahead of everyone.',
        gain: { trust: 2, danger: 1 },
        requires: { entry: 'singers' },
        lockedHint: 'Only if Old Rin came in with you',
        artSubject:
          'An old singer in a wide straw hat with her hand at her mouth whispering toward a cart of sleepers rolling into a tunnel, two young volunteers holding hands behind her in the glowing water',
      },
    ],
  },
  {
    id: 'BT-02',
    title: 'The Water That Climbs',
    kind: 'lore',
    speaker: 'Pip',
    opening:
      'Fifty paces in, the tunnel tilts down toward the sea, and the water climbs it regardless, lapping up each sleeper in warm, patient steps. It is the temperature of a bath someone drew for you. It smells of salt and of something Pip knows better than his own coat: the caramel crust of the Red Oven’s morning loaves. Crumbs of it drift uphill with the fish. Pip fishes one out, sniffs it, and goes pale. ‘That’s not burnt sugar,’ he says. ‘That’s the Oven’s ink.’',
    artSubject:
      'A descending railway tunnel with warm seawater flowing uphill over the sleepers in small steps, tiny fish and golden bread crumbs drifting upward in the current, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, holding a soggy crumb to his nose, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, behind him with antennae lowered',
    autoChoiceId: 'taste-the-brine',
    echoes: [
      {
        flag: 'BT-01:read-the-water',
        text: 'Vesper already knows the water runs two ways. The crumbs ride the top current uphill. Down below, in the slow current, something heavier is going the other way.',
      },
    ],
    choices: [
      {
        id: 'taste-the-brine',
        label: 'Touch the warm brine to your tongue and learn what it carries',
        outcome:
          'Salt, crust, and under both a thin bitter flavour like licking a written page. The sea gate and the Oven are pouring into the same water, and the water is carrying their bread uphill to the terraces, where the singers eat. Pip spits on Vesper’s behalf, twice, for luck.',
        gain: { evidence: 1 },
        artSubject:
          'Vesper touching a wet fingertip to their lips in a dim flooded tunnel while Pip pulls a face and spits sideways into the water',
      },
    ],
  },
  {
    id: 'BT-03',
    title: 'The Linesman’s Locker',
    kind: 'treasure',
    speaker: 'Pip',
    opening:
      'A rusted locker is bolted into a niche where the linesmen kept their kit when this was only a railway. Its door hangs open. Inside are two tins of lamp oil, a lunch box with a cat painted on it, a rain cape, and a thick bundle of transfer slips tied with a child’s hair ribbon. Somebody left in a hurry. The lunch box still holds two rice balls, gone hard. A note in the lid reads, in a child’s careful hand: DAD, DON’T WORK LATE.',
    artSubject:
      'A rusted railway locker in a tunnel niche with its door open on two oil tins, a lunch box painted with a cat, a folded rain cape and a bundle of papers tied with a red ribbon, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, reaching for an oil tin, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, looking at the note in the lunch box lid',
    echoes: [
      {
        flag: 'BT-01:follow-the-cart',
        text: 'The house on that sleeper’s tag is on the top slip of this bundle too, ticked off in red, with the time.',
      },
      {
        flag: 'BT-01:lay-the-rubbing',
        text: 'The five new strokes Vesper found on the coral are pencilled on the inside of the locker door, with a date. Somebody else noticed them first.',
      },
    ],
    choices: [
      {
        id: 'take-the-oil',
        label: 'Take both tins of lamp oil and leave everything else as it is',
        outcome:
          'Pip fills the lantern to the brim and tucks the second tin under his coat. The flame lengthens and the whole niche turns gold. He closes the lunch box gently on the hard rice balls and the note. ‘Someone’s dad is coming back for that,’ he says, which is a kind of prayer.',
        gain: { battery: 2 },
        artSubject:
          'Pip pouring lamp oil into a lantern whose flame leaps up gold inside a rusted tunnel locker, a cat-painted lunch box shut neatly on the shelf',
      },
      {
        id: 'untie-the-slips',
        label: 'Untie the hair ribbon and read the bundle of transfer slips',
        outcome:
          'Forty slips, each a departure: a promise mark, a singer’s name, a house the singer knows. The linesman ticked each one off, neatly, until the last nine, which he crossed out so hard the pen went through. Then he left his child’s lunch and ran. Vesper reties the ribbon with unsteady fingers.',
        gain: { evidence: 2, danger: 1 },
        artSubject:
          'Vesper holding a fan of damp transfer slips by lantern light, the last few scored through with heavy pen strokes, a loose red hair ribbon over their wrist',
      },
    ],
  },
  {
    id: 'BT-04',
    title: 'The Pillar of Promises',
    kind: 'puzzle',
    speaker: 'Vesper',
    opening:
      'Where the tunnel widens, a coral pillar has grown up through the track bed and taken a signal post with it. Its surface is scratched from rail to roof with the same marks as the toll bell on the cedar bridge: tallies, fishhooks, knots, a cup, a closed eye. Each scratch is a promise someone once made on a road through Hoshimori. When the bell rings deep below, one mark glows faintly and somewhere a cart moves. Low on the pillar, worn nearly smooth by water, is a tiny moth.',
    artSubject:
      'A thick pink coral pillar swallowing an old railway signal post in a widening flooded tunnel, its surface covered in scratched tallies, knots, fishhooks and a closed eye, one mark glowing faintly, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, crouching to look at a tiny worn moth carved near the waterline',
    echoes: [
      {
        flag: 'e12:6,1:read-scratches',
        text: 'At the toll bell Vesper read the moth as the third promise: to guide without recording. Here below it has been moved to the very bottom. Not third. Foundation.',
      },
      {
        flag: 'e12:6,1:invite-witnesses',
        text: 'At the toll bell the pilots and Ume rang their own memories, and the bridge held half weight. This pillar keeps only one order, and nobody has argued with it in years.',
      },
    ],
    choices: [
      {
        id: 'read-the-order',
        label:
          'Watch three rings and work out how the pillar chooses its next promise',
        outcome:
          'Three rings, three glows, and the pattern shows. Every mark that lights is a promise to hide someone: a knot for a cellar, a cup for a loft, a closed eye for a door nobody knocks at. With each glow a cart goes to fetch whoever knows where that hiding place is. The bell is collecting promises of safety and reading them as addresses.',
        gain: { evidence: 2, danger: 1 },
        artSubject:
          'Vesper standing back from a scratched coral pillar as one knot-shaped mark glows, Pip writing fast in a small ledger by lantern light',
      },
      {
        id: 'cover-the-moth',
        label: 'Press a palm over the moth mark and feel what the pillar does',
        outcome:
          'Vesper kneels in the brine and covers their own childhood mark. The bell below misses a beat. Every glowing scratch dims at once and the water stops climbing for one held breath. Then it all resumes, and a voice comes faintly up the tunnel, a young woman’s, calling the next departure with a catch in it.',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'Vesper kneeling in glowing water with one grey hand pressed flat over a small carved moth at the foot of a coral pillar, all the marks above them dimmed',
      },
      {
        id: 'match-the-rubbing',
        label:
          'Lay the bell rubbing over the pillar and see what has been added',
        outcome:
          'The rubbing fits the pillar like a glove and shows the difference plainly. Twelve new marks have been scratched in above the old ones, all in one hand: small tidy fishhooks, sea-court style, each with a singer’s initial. The promises are not all Hoshimori’s any more. The sea is writing them now.',
        gain: { evidence: 2 },
        requires: { entry: 'bell-marks' },
        lockedHint: 'Only if Vesper copied the bell marks before coming in',
        artSubject:
          'A charcoal rubbing held against a coral pillar by Vesper and Pip together, a cluster of newer neat fishhook scratches standing out above the old worn marks',
      },
    ],
  },
  {
    id: 'BT-05',
    title: 'The Culvert of Floating Words',
    kind: 'hazard',
    speaker: 'Pip',
    opening:
      'A side culvert runs off the main line, and it is dark as the inside of a pocket. Things float in it: soft pale bells of jelly trailing threads, and inside each jelly a single spoken word. Tomorrow. Promise. Safe. Where a thread touches skin, the word is said again in the voice that first said it, and it stings like nettle. Pip’s lantern shows the first five yards. After that the culvert is only sound, a soft overlapping murmur of things people once meant.',
    artSubject:
      'A low brick culvert flooded with black water where pale translucent jellyfish drift with faint glowing words curled inside them, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, holding a lantern at the edge of the light, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, peering past him with antennae spread into the dark',
    echoes: [
      {
        flag: 'BT-18:shortcut-back',
        text: 'The platelayers’ ladder hangs down the culvert’s far shaft now, dropped from below, a rag tied to its bottom rung. Anyone coming back this way has something to aim for.',
      },
    ],
    choices: [
      {
        id: 'light-a-way-through',
        label:
          'Burn lamp oil to light the culvert end to end and walk between the jellies',
        outcome:
          'Pip turns the wick up as far as it goes. In full light the jellies drift aside like shy cattle and Vesper threads between them without a sting. The words inside are all promises, and every one of them was made to a child. The oil burns low. Pip wishes, aloud, that he had not seen that.',
        gain: { battery: -1, evidence: 1 },
        requires: { battery: 1 },
        lockedHint: 'Needs lantern oil to light the culvert',
        artSubject:
          'A bright lantern held high in a brick culvert as pale jellyfish drift aside, Vesper walking carefully between them with wings tucked tight',
      },
      {
        id: 'wade-by-antennae',
        label: 'Shutter the lantern and wade through by antennae alone',
        outcome:
          'Vesper goes through blind, antennae spread, steering by the faint hum each word makes. They mostly manage. Three threads catch an ankle and say Safe, Safe, Tomorrow in three voices Vesper half knows from the old terraces. They come out the other side stung and shaking, the words still ringing in their skin.',
        gain: { danger: 2 },
        artSubject:
          'Vesper wading waist-deep through near-total darkness with feathery antennae stretched forward, faint glowing threads trailing across their legs',
      },
    ],
  },
  {
    id: 'BT-06',
    title: 'The Timetable in Verses',
    kind: 'choice',
    speaker: 'Pip',
    opening:
      'At the end of the first gallery a station board is bolted to the rock, its enamel wet and blistered. Every departure is listed against a verse of the harvest song instead of a time: the threshing verse, the lantern verse, the verse for a house with its shutters down. Beside each verse is a door symbol, never an address, and beside each door a tally of how many carts have gone. Some tallies are very long. Pip reads it like a ledger, and slowly takes his pencil from behind his ear.',
    artSubject:
      'A blistered enamel station board bolted to wet tunnel rock, rows of painted song verses beside little door symbols and long chalk tallies, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, with his pencil raised, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, holding the lantern up to the highest row',
    echoes: [
      {
        flag: 'e12:8,2:sing-a-rest',
        text: 'Up on the mountain Vesper wrote a held rest into the last row of a timetable. This board has a fermata chalked into one row too, and beside it the tally is zero.',
      },
      {
        flag: 'e12:8,2:write-obligations',
        text: 'Pip’s rules from the mountaintop board are chalked here as well, copied in another hand: whoever leaves may return. Someone below has crossed out may and written shall.',
      },
    ],
    choices: [
      {
        id: 'copy-the-board',
        label: 'Copy the board’s verses and tallies into Pip’s ledger',
        outcome:
          'Pip copies it in a shorthand only he and three other goblins can read, verses on the left, tallies on the right. It takes long enough for two carts to pass. When he is done he has the clearest record anyone has made of what this tunnel takes. He holds it out at arm’s length, as if it were hot.',
        gain: { evidence: 2, danger: 1 },
        artSubject:
          'Pip writing in a small ledger propped on his knee beneath a blistered station board while Vesper holds the lantern and a loaded cart rolls past behind them',
      },
      {
        id: 'chalk-a-rest',
        label:
          'Chalk a held rest over the busiest verse and see whether the board obeys',
        outcome:
          'Vesper chalks a fermata over the shuttered-house verse. For one ring the board obeys: no cart. Then the enamel sweats, the chalk runs off in a milky trickle, and the tally clicks up by two to make up for the one it missed. Pip says the tunnel just charged them interest. Still, one family slept unfetched tonight.',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'Vesper drawing a chalk fermata across one painted row of a wet station board, the chalk already running down the enamel in milky streaks',
      },
    ],
  },
  {
    id: 'BT-07',
    title: 'The Wall the Oven Warms',
    kind: 'rest',
    speaker: 'Pip',
    opening:
      'Here the tunnel runs beneath the Red Oven’s foundations, and the rock overhead is warm as a loaf. The brine steams. Railway workers once took their tea against this wall in winter, and their cups still hang on nails, chipped and named in paint: GRANDPA, TOSHI, NOT YOURS. Through the stone comes the Oven’s heartbeat, the slow thud of its great door. Pip puts both palms flat on the rock. He owes this building more than he can count, and it is the warmest he has been all day.',
    artSubject:
      'A steaming stretch of flooded tunnel under warm reddish rock, chipped tea cups hanging on nails with painted names, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, pressing both palms against the warm wall with his eyes closed, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, sitting on a dry ledge drying their folded wings',
    choices: [
      {
        id: 'rest-against-the-wall',
        label:
          'Sit against the warm stone and let wings and lantern wick dry out',
        outcome:
          'They sit with their backs to the Oven. Vesper’s wings unstick one vein at a time. Pip trims the wick and it burns clean again. For a little while neither of them talks about debts or maps, and Pip falls asleep with his mouth open, and Vesper lets him, counting the Oven’s heartbeats until he wakes.',
        gain: { battery: 1, trust: 1 },
        artSubject:
          'Pip asleep with his mouth open against a warm stone wall, a freshly trimmed lantern glowing at his feet, Vesper beside him with wings spread to dry',
      },
      {
        id: 'read-the-crust',
        label:
          'Pry a brick of brine-soaked crust from the wall’s seam and read its stamp',
        outcome:
          'Bread has been pressed into the wall’s seams like mortar, swollen with seawater. The crust is stamped the way the Oven stamps its loaves, but the stamp is a house number. Pip knows the house. ‘I delivered there,’ he says. ‘Every Thursday. She paid in plums.’ He pockets the crust so the tunnel cannot have it.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'Vesper prising a swollen golden crust from a mortar seam in warm tunnel rock, a small stamped number visible on it, Pip staring at it with recognition',
      },
    ],
  },
  {
    id: 'BT-08',
    title: 'The Bay of Returned Carts',
    kind: 'puzzle',
    speaker: 'Vesper',
    opening:
      'A siding off the main line is full of carts that came back empty, parked nose to tail, coral climbing their wheels. Each has a brake lever with a promise mark cast into its handle: a knot, a cup, a closed eye. Every brake is off. Vesper tries one and it will not move. Pip tries it and it will not move for him either. A sign in railway enamel hangs over the bay: BRAKE MAY BE SET ONLY BY THE ONE WHO MADE THE PROMISE.',
    artSubject:
      'A long flooded siding lined with empty railway carts parked nose to tail, coral growing up their wheels, brass brake levers each cast with a small symbol, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, hauling on one lever with both hands, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, reading an enamel sign overhead',
    choices: [
      {
        id: 'set-the-moth-brake',
        label: 'Find a cart with a moth on its brake and set it yourself',
        outcome:
          'At the very back of the bay one cart has a tiny moth cast on its lever. Vesper sets it, and it goes down like a held breath. Every other cart in the bay rattles. The rule is real: a cart stops when its promise-maker stands and claims it. Which means the moth cart has been running all this time on Vesper’s word.',
        gain: { evidence: 2, danger: 1 },
        artSubject:
          'Vesper pulling down a brass brake lever marked with a tiny moth at the end of a row of empty carts, every other cart in the siding shuddering on its rails',
      },
      {
        id: 'chalk-every-cart',
        label:
          'Chalk a singer’s rest on every empty cart so the ones coming back know someone saw',
        outcome:
          'Vesper and Pip go down the siding chalking a small held rest on each cart’s side, forty-one of them. It stops nothing. But the next empty cart that clanks in from the dark slows as it passes the chalk, the way a person slows passing a shrine, and Pip says that counts for something.',
        gain: { trust: 1 },
        artSubject:
          'Pip and Vesper chalking small curved musical rests on the sides of a long row of empty railway carts, a returning cart slowing as it passes',
      },
    ],
  },
  {
    id: 'BT-09',
    title: 'The Singer in the Coal Bunker',
    kind: 'companion',
    speaker: 'Kiri',
    opening:
      'Something is breathing in the old coal bunker. When Pip holds the lantern to the hatch, a girl of about twelve is curled on the coke, hands clamped over her mouth, a ridge of pink coral grown along her throat like a scar. She is Kiri, Old Rin’s youngest apprentice, taken last week. She jumped from her cart at the bend. She tries to speak and cannot; only a sung note comes out, pure and high, and far below the bell answers it, and the water quickens.',
    artSubject:
      'Inside an open coal bunker hatch, Kiri, a thin girl of about twelve with a cropped fringe and a ridge of pink coral along her throat, curled on black coke with her hands over her mouth, lantern light from Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, falling across her, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, crouched at the hatch with a hand held out',
    echoes: [
      {
        flag: 'BT-01:rin-names-them',
        text: 'At the tunnel mouth Rin said Kiri’s name into the dark. Kiri heard it. She sings one small note at Rin, and it means yes.',
      },
      {
        flag: 'e12:5,2:read-segments',
        text: 'Vesper copied Kiri’s name off the ticket centipede once, from the stub nearest its head. The torn copy is in the satchel, beside the dozen names that could not be returned.',
      },
    ],
    choices: [
      {
        id: 'hush-her-gently',
        label:
          'Sit by the hatch and hum her a rest until she can breathe without singing',
        outcome:
          'Vesper hums the gap from the terrace song, and Kiri copies it, and the bell below gets nothing. It takes a long while. When she is calm she climbs out, coal-black to the elbows, and takes Pip’s hand without asking. She will come with them. She cannot say where the others are, but she can point.',
        gain: { trust: 2 },
        artSubject:
          'A coal-blackened girl with pink coral on her throat climbing out of a bunker hatch holding a goblin’s hand, Vesper humming beside them with eyes half closed',
      },
      {
        id: 'let-her-sing',
        label:
          'Ask her to sing the note again and watch what the bell does with it',
        outcome:
          'Kiri sings, and the bell answers, and down the tunnel a points lever clanks over by itself. Her voice moves the railway. Vesper understands at once why the singers were taken, and so does Kiri, who starts to cry without a sound. She comes with them, but she will not sing again unless Vesper asks, and Vesper hates that they might.',
        gain: { evidence: 2, danger: 1 },
        artSubject:
          'A young girl singing a single high note from a coal bunker as a distant points lever swings over on its own down the lamplit tunnel, Vesper turning toward the sound',
      },
      {
        id: 'rin-calls-her',
        label:
          'Let Old Rin sing the apprentices’ warm-up and wait for Kiri to answer it',
        outcome:
          'Rin sings the silly warm-up she teaches every child, the one about the radish, and Kiri answers, and the answer is a spoken word: ‘Radish.’ It is the first word she has managed in a week. The bell does not hear speech. Rin wraps her in a hat ribbon and does not let go of her for an hour.',
        gain: { trust: 2, danger: -1 },
        requires: { entry: 'singers' },
        lockedHint: 'Only if Old Rin came in with you',
        artSubject:
          'An old singer in a wide straw hat kneeling at a coal bunker with her arms around a coal-dusted girl, two young volunteers and Vesper standing close in the lantern light',
      },
    ],
  },
  {
    id: 'BT-10',
    title: 'Under the Ash Flue',
    kind: 'hazard',
    speaker: 'Pip',
    opening:
      'The Red Oven’s ash flue crosses the tunnel roof here, a brick throat leaking grey flakes. Where the ash lands on the climbing brine it does not dissolve. It sets like skin on milk into thin grey pages, and on each page a name has burned away and left only the house it belonged to, door and all. The pages ride the water uphill in a slow paper flotilla. One drifts against Pip’s boot. He reads it before he can stop himself, and makes a small noise.',
    artSubject:
      'A brick flue crossing a tunnel roof and shedding grey ash onto flowing seawater, the ash setting into thin floating pages marked with small house shapes, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, looking down at one caught against his boot, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, shielding the lantern with a wing',
    choices: [
      {
        id: 'cross-quickly',
        label:
          'Shield the lantern and cross under the flue without reading another page',
        outcome:
          'They cross in a crouch, wings over the lantern, ash settling on Vesper’s antennae like snow. Neither reads anything. On the far side Pip says the page at his boot was his own first lodging, the room above the lantern stall, and then asks Vesper to forget he said it. Vesper says they already have.',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'Vesper and Pip crouching under a curtain of falling grey ash with a wing held over the lantern, floating ash pages drifting around their legs',
      },
      {
        id: 'skim-the-pages',
        label:
          'Skim the ash pages for a pattern, never saying an address aloud',
        outcome:
          'Vesper lifts a dozen pages on a slate and reads in silence. Every house on them is a house the harvest singers visit: every door the song goes to in autumn. The Oven burns the names, the tunnel keeps the doors, and the singers are the thread between them. Vesper sinks the slate and its pages in the downhill current.',
        gain: { evidence: 2, danger: 1 },
        artSubject:
          'Vesper holding a slate stacked with thin grey ash pages close to the lantern, reading silently with lips pressed shut, ash still falling around them',
      },
    ],
  },
  {
    id: 'BT-11',
    title: 'The Platelayers’ Shelter',
    kind: 'rest',
    speaker: 'Vesper',
    opening:
      'A brick shelter is let into the tunnel wall: three bunks and a pot-bellied stove still warm. Someone has been here since the flood. A pan of rice is wrapped in a quilt to keep, and beside it sit a stack of leaf parcels and a note in an old woman’s careful hand: FOR WHOEVER COMES DOWN AFTER US. EAT. DON’T SIGN ANYTHING. Three straw hats hang on pegs. The quilt is a harvest-singer’s quilt, every patch a different terrace.',
    artSubject:
      'A small brick railway shelter with three bunks, a glowing pot-bellied stove, a rice pan wrapped in a patchwork quilt and three straw hats on pegs, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, reading a handwritten note by the stove, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, already eyeing the leaf parcels',
    echoes: [
      {
        flag: 'BT-09:hush-her-gently',
        text: 'Kiri knows this shelter. She touches the middle hat, then her own throat, and says nothing: the singers who hid here were taken from it.',
      },
      {
        flag: 'BT-09:let-her-sing',
        text: 'Kiri will not go near the stove. The last time she sang in here, she tells them with her hands, the bell heard, and the badges came.',
      },
    ],
    choices: [
      {
        id: 'eat-and-sleep',
        label: 'Eat the singers’ rice, bank the stove and sleep one hour',
        outcome:
          'They eat from the pan with their fingers, and it is the best rice in Hoshimori, a little burnt at the bottom the way home rice is. Pip takes the bunk under the hats. Vesper banks the stove and sets the lantern beside it to warm the oil. One hour, and the whole world is quiet, and nobody signs anything.',
        gain: { battery: 2, trust: 1 },
        artSubject:
          'Pip asleep on a narrow bunk beneath three straw hats while Vesper sits by a banked stove with a lantern warming on its lid and an empty rice pan on their knee',
      },
      {
        id: 'leave-it-for-the-next',
        label:
          'Leave the food for whoever comes next, and add a line to the note',
        outcome:
          'Vesper takes a single leaf parcel to share with Pip, and under the old woman’s words writes: STILL TRUE. A MOTH WAS HERE. They do not sign it. The stove stays warm for someone else. Walking on, Pip says it was very noble, and also that he is very hungry.',
        gain: { trust: 1, danger: -1 },
        artSubject:
          'Vesper adding a line in pencil beneath a handwritten note pinned by a warm stove, a stack of leaf-wrapped parcels left untouched beside it',
      },
    ],
  },
  {
    id: 'BT-12',
    title: 'The Brakeman’s Last Entry',
    kind: 'lore',
    speaker: 'Hask',
    opening:
      'Where the line from the timetable board comes in, a brake hut leans against the rock, its logbook chained to the desk. Most entries are railway plain: CART 31 DOWN. CART 31 UP, EMPTY. The handwriting has claw marks through the downstrokes, a Briar wolf writing with a pen made for hands. The last page is different. It is a question, written three times, each time larger: WHERE DO THEY GO. Under it, in a clerk’s neat hand: HOME. RETURN TO DUTY.',
    artSubject:
      'A cramped wooden brake hut against wet rock, a heavy logbook chained to a desk lying open on a page of large clawed handwriting, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, bending over it with the lantern, a wolf-sized conductor’s coat hanging on a peg',
    autoChoiceId: 'read-the-log',
    choices: [
      {
        id: 'read-the-log',
        label: 'Read the brakeman’s logbook from the first page to the last',
        outcome:
          'The wolf signed every page Hask, conductor, Briar Patrol seconded to Transfers. For a month the entries are proud. Then he starts counting empty returns. Then he starts drawing small hats beside them. Wolves are bound by what they witness, and Hask has witnessed too much. Vesper closes the book, and its chain clinks like a lanyard.',
        gain: { evidence: 1 },
        artSubject:
          'Vesper closing a chained logbook whose margins are filled with tiny drawn straw hats, lantern light on a wolf’s empty coat hanging behind them',
      },
    ],
  },
  {
    id: 'BT-13',
    title: 'The Platform of Hats',
    kind: 'choice',
    speaker: 'Pip',
    opening:
      'The tunnel opens into a long underground platform under a vaulted roof, its gas lamps long dead, brine lapping at the platform edge. This is where the empty carts come back. They are not quite empty. In each one, neatly stacked, are the straw hats of the singers it carried down, brims dry, chin-ribbons tied in bows. A porter’s trolley holds hundreds more. LOST PROPERTY, says a sign, and below it, in smaller letters: NOT TO BE CLAIMED.',
    artSubject:
      'A vaulted underground railway platform with dead gas lamps and seawater at its edge, empty carts each holding a neat stack of straw hats tied with ribbon bows, a porter’s trolley heaped with hundreds more, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, standing at the trolley with the lantern, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, reading the sign',
    echoes: [
      {
        flag: 'BT-09:hush-her-gently',
        text: 'Kiri walks straight to the trolley and lifts out a hat with a radish stitched inside the crown. Hers. She puts it on. Nobody tells her not to.',
      },
      {
        flag: 'BT-09:let-her-sing',
        text: 'Kiri stays behind Vesper’s wings and will not look at the trolley, because she knows exactly which of the hats is hers.',
      },
    ],
    choices: [
      {
        id: 'count-the-hats',
        label: 'Count the hats on the trolley, one ribbon at a time',
        outcome:
          'Two hundred and six. Pip counts and Vesper checks. Some are terrace hats Vesper knows from childhood harvests, the weaves of particular families. Some are sea-court hats of plaited kelp, and a few are office caps, folded flat. The tunnel has been taking singers from more than one world, and sending their hats back politely.',
        gain: { evidence: 2 },
        artSubject:
          'Pip lifting straw hats one by one from a heaped porter’s trolley while Vesper ticks a tally on the trolley handle, kelp hats and folded office caps among the straw',
      },
      {
        id: 'carry-hats-up',
        label:
          'Load an armful of hats into the next cart heading uphill, so they get home',
        outcome:
          'Vesper loads forty hats into a cart about to roll back to the terraces and ties the bows to its rail. The cart goes. In the morning, families will find the hats on the terrace platform and know, at least, which way their singer went. It is a terrible gift. It is also the truth, and Old Rin would want it given.',
        gain: { trust: 2, danger: 1 },
        artSubject:
          'Vesper tying straw hat ribbons to the rail of a cart piled with hats as it begins to roll uphill out of a vaulted platform toward a faint grey light',
      },
    ],
  },
  {
    id: 'BT-14',
    title: 'The Manifest Office',
    kind: 'puzzle',
    speaker: 'Vesper',
    opening:
      'A glass-walled office sits at the platform’s end, dark as a shut eye. The door is unlocked. Inside, papers hang from iron spikes in long rows, hundreds of manifests, the ink still running in the damp. Without a light it is only a smell of wet paper and sea. Pip’s lantern is burning lower than he would like, and there is a long way still to go downhill. To read even one row of spikes properly would burn real oil.',
    artSubject:
      'A dark glass-walled railway office at the end of a flooded platform, rows of iron spikes stacked with sodden paper manifests, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, pausing in the doorway with antennae raised, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, holding up a lantern with a low flame',
    choices: [
      {
        id: 'read-the-manifests',
        label: 'Burn oil to read the manifest spikes properly, one whole row',
        outcome:
          'Every manifest has two columns. On the left, a singer’s name and the harvest doors they know. On the right, each door is marked with where its household will be moved, and who asked. The askers are buyers, with money beside their names. Some bought routes from Vesper years ago. Vesper recognizes the handwriting of their own old receipts.',
        gain: { battery: -1, evidence: 2, danger: 1 },
        requires: { battery: 1 },
        lockedHint: 'Needs lantern oil to read in the dark',
        artSubject:
          'Vesper holding a sodden manifest close to a bright lantern inside a glass office, rows of iron spikes behind them, their face stricken at a line of handwriting',
      },
      {
        id: 'take-a-spike-unread',
        label: 'Pull one whole spike of manifests and carry it out unread',
        outcome:
          'Vesper slides a spike free and rolls its sodden pages in oilcloth without looking. Whatever it says will be read later, in daylight, by the people it names, if they want to. Pip approves. He also points out that a cartographer carrying a bundle of addresses through a tunnel is the exact problem they came down here to stop.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'Vesper wrapping a thick sheaf of wet papers in oilcloth by feel in a dark office, Pip watching with arms folded and a doubtful face',
      },
    ],
  },
  {
    id: 'BT-15',
    title: 'The Conductor at the Buffer',
    kind: 'hazard',
    speaker: 'Hask',
    opening:
      'A grey Briar wolf in a conductor’s cap stands at the platform buffer with a ticket punch on a cord and an office badge on his lanyard: HASK, BRIAR PATROL, SECONDED. He is thin under the cap. Wolf law says he may not let a traveller pass without a ticket or a reason; office law says reasons are not tickets. He holds out a paw for Vesper’s ticket, and his ears go flat, because he can smell food on them, and he is very hungry.',
    artSubject:
      'At the end of a flooded underground platform, Hask, a rangy grey Briar wolf in a conductor’s cap with an office badge on a lanyard, holding out a paw beside an iron buffer, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, facing him with empty hands, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, peeking from behind their wing',
    echoes: [
      {
        flag: 'e12:2,2:count-not-name',
        text: 'Hask has heard about the stepping stones. ‘You’re the moth who made Grisel count and not name,’ he says, and his punch hovers. He would like that rule down here.',
      },
      {
        flag: 'e12:2,2:confess-the-sale',
        text: 'Hask knows the face. Every wolf on the line does, since the stepping stones. ‘The one who sold the route,’ he says, not unkindly. ‘Grisel says you said it yourself.’',
      },
      {
        flag: 'BT-12:read-the-log',
        text: 'Vesper has read his logbook. They know he asked where the carts go three times, and that nobody ever answered him properly.',
      },
    ],
    choices: [
      {
        id: 'share-a-feast',
        label:
          'Share whatever food the party carries with Hask, so wolf feast-law binds him',
        outcome:
          'Pip turns out his coat: two dried plums, a heel of rice cracker, a toffee with fluff on it. Vesper lays it on the buffer between them. Hask resists as long as a hungry wolf can, which is not long. Food shared at a crossing is a feast, and a feast binds a Briar wolf. He punches a ticket out of nothing and whispers that the carts stop at the choir.',
        gain: { trust: 2 },
        artSubject:
          'A thin grey wolf in a conductor’s cap eating a dried plum from an iron buffer while Vesper and Pip share the rest of a tiny feast with him',
      },
      {
        id: 'race-to-the-points',
        label:
          'Challenge Hask to a fair race to the far points lever, under wolf contest-law',
        outcome:
          'Wolf law yields to a fair contest, and Hask cannot refuse one. They race the length of the flooded platform, Vesper skimming low on wet wings, Hask throwing up spray. Vesper touches the lever a nose ahead. Hask yields, as he must, then files a report, as he also must, and the bell below rings one beat early.',
        gain: { evidence: 1, danger: 2 },
        artSubject:
          'Vesper skimming low over a flooded platform on spread grey wings, a grey wolf in a conductor’s cap bounding beside them through spray toward a points lever',
      },
      {
        id: 'answer-his-question',
        label:
          'Answer the question in his logbook and tell Hask where the carts go',
        outcome:
          'Vesper tells him: down to a choir under the bell, then to doors on buyers’ lists. Hask takes off his cap. A wolf is bound by what he witnesses, and nobody ever told him plainly. He unclips his badge, lays it on the buffer, and says he will walk this platform tonight and count, and not name, and not punch.',
        gain: { trust: 1, evidence: 1, danger: -1 },
        requires: { evidence: 3 },
        lockedHint: 'Needs more evidence of where the carts go (3)',
        artSubject:
          'A grey wolf holding his conductor’s cap to his chest, an office badge lying on an iron buffer between him and Vesper in the lantern light',
      },
    ],
  },
  {
    id: 'BT-16',
    title: 'The Turntable of Promises',
    kind: 'choice',
    speaker: 'Kiri',
    opening:
      'Beyond the buffer a railway turntable fills a round chamber, its deck awash, a loaded cart sitting on it with four sleeping singers. Around the rim, sidings branch off like the spokes of a wheel, each marked with a promise scratch. When the bell rings, the deck turns to the promise rung and the cart goes. Kiri plucks Vesper’s sleeve and points at the next spoke: a closed eye. She mouths the house that goes with it. She knows the door.',
    artSubject:
      'A round flooded chamber with a railway turntable at its centre carrying a cart of four sleeping singers, sidings radiating like spokes each marked with a scratched symbol, Kiri, a thin girl of about twelve with a cropped fringe and a ridge of pink coral along her throat, pointing at one, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, gripping the capstan bar',
    choices: [
      {
        id: 'turn-it-back',
        label:
          'Haul the turntable round by hand and send the loaded cart back uphill',
        outcome:
          'Vesper and Pip throw their weight on the capstan bar and the deck groans round to the up line. The cart rolls back toward the terraces with its four sleepers. The bell below rings angrily, twice, and a different cart, one they cannot see, goes to the closed-eye door instead. Four come home. Somebody else is fetched.',
        gain: { trust: 1, danger: 2 },
        artSubject:
          'Vesper and Pip straining against a capstan bar as a turntable swings a cart of sleeping singers onto an uphill track, water slopping across the deck',
      },
      {
        id: 'let-it-turn',
        label: 'Leave the turntable alone and memorize where each spoke goes',
        outcome:
          'They stand back and watch it work. Each spoke is a promise, each promise a door, each door a household some singer knows. By the third turn Vesper could draw the whole wheel from memory, and that frightens them more than anything else down here. They memorize it anyway, and do not draw it.',
        gain: { evidence: 2 },
        artSubject:
          'Vesper standing very still at the edge of a turning railway turntable, eyes following its spokes, one hand pressed flat against their closed map satchel',
      },
      {
        id: 'sing-out-of-order',
        label:
          'Have Nae and Goro sing the verses out of order so the turntable cannot settle',
        outcome:
          'The two volunteers sing the threshing verse before the lantern verse, wrong on purpose, then the other way round. The turntable tries to follow, shudders, and stops halfway between two spokes, cart and all. The four sleepers stir. It holds for three rings before the bell corrects it. Goro’s voice is gone by the end.',
        gain: { trust: 2, danger: 1 },
        requires: { entry: 'singers' },
        lockedHint: 'Only if the two volunteers came in with you',
        artSubject:
          'Two young singers in straw hats singing hard with fists clenched as a turntable jams halfway between two sidings, four sleepers stirring in the stalled cart',
      },
    ],
  },
  {
    id: 'BT-17',
    title: 'The Speaking Tube',
    kind: 'choice',
    speaker: 'Amane',
    opening:
      'A brass speaking tube comes up through the platform floor, its mouth crusted with coral, and every few minutes a voice climbs it from far below to call the next departure. It is a young woman’s voice, Hoshimori-accented, steady as a timetable. ‘The cup promise. Third house above the dye works.’ Then, very quietly, as if she forgets the tube is open: a few bars of the harvest song, sung the old terrace way. Vesper knows that way of singing. Old Rin taught it to every child.',
    artSubject:
      'A coral-crusted brass speaking tube rising from a wet platform floor like a flower stem, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, kneeling beside it with one antenna bent toward its mouth, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, holding the lantern close',
    echoes: [
      {
        flag: 'BT-04:cover-the-moth',
        text: 'When Vesper covered the moth at the pillar this voice faltered. It falters again now, as Vesper’s shadow falls across the tube. ‘Someone’s on the platform,’ it says, to no one.',
      },
    ],
    choices: [
      {
        id: 'answer-the-tube',
        label: 'Lean to the tube and tell the voice who is listening',
        outcome:
          'Vesper says their name into the brass. The silence that comes back is very long. ‘I know your wings,’ the voice says at last. ‘You drew the road my mother and I walked. Come down, then. I’m Amane. I keep the bell.’ The next departure is called one ring late.',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'Vesper speaking into the mouth of a coral-crusted brass tube with both hands cupped around it, Pip frozen beside them with the lantern',
      },
      {
        id: 'listen-only',
        label:
          'Stay silent and listen to three departures and the song between them',
        outcome:
          'Three departures, three doors. Between them the voice sings, and stops, and sings again. Once she sings a line wrong and corrects herself, the way a child does in front of a teacher. Whoever she is, she learned on the terraces, and she is alone down there, calling out other people’s homes.',
        gain: { evidence: 1 },
        artSubject:
          'Vesper sitting silently beside a brass speaking tube on a dark platform with eyes closed and antennae tilted to listen, Pip asleep against their wing',
      },
    ],
  },
  {
    id: 'BT-18',
    title: 'The Platelayers’ Ladder',
    kind: 'shortcut',
    speaker: 'Pip',
    opening:
      'At the platform’s far end a maintenance shaft climbs straight up into the rock, an iron ladder bolted to its wall and hooked off short by a chain. Wind breathes down it, and it smells of jelly and nettle: it must come out in the dark culvert near the tunnel mouth. The hook is on this side. Pip rattles the chain. ‘If we drop it,’ he says, ‘we can go up and come down again. So can anything else.’',
    artSubject:
      'A narrow rock shaft rising into darkness above a flooded platform, an iron ladder hooked short on a heavy chain, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, rattling the chain, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, looking up the shaft with the lantern raised',
    choices: [
      {
        id: 'shortcut-back',
        label: 'Unhook the ladder and drop it down the shaft to the culvert',
        outcome:
          'The chain runs out with a scream and the ladder slams home far above. Now there is a way back to the tunnel mouth that skips the whole first gallery. Vesper ties a rag to the bottom rung, so that anyone fleeing up it, Kiri, the volunteers, a stranger, can find it in the dark.',
        gain: { trust: 1 },
        artSubject:
          'An iron ladder clattering down a dark shaft as its chain runs free, Vesper tying a pale rag to the lowest rung with quick hands',
      },
      {
        id: 'leave-it-hooked',
        label: 'Leave the ladder hooked so nothing from below can climb it',
        outcome:
          'Pip shrugs and they go on. The ladder stays up. Nobody gets an easy way out, and nobody gets an easy way in. Vesper has spent a life deciding which roads exist. This is the first one they have simply declined to make, and it feels like a small, odd victory.',
        gain: { danger: -1 },
        artSubject:
          'Vesper and Pip walking away from a hooked-up iron ladder at the end of a lamplit platform, the chain hanging still behind them',
      },
    ],
  },
  {
    id: 'BT-19',
    title: 'The Sluice of Sung Notes',
    kind: 'lore',
    speaker: 'Pip',
    opening:
      'The line descends steeply into the Choir Sluice, where coral pipes as thick as an arm run down every wall, all flowing one way, toward the bell. They are full of sound. Put an ear to one and there is a voice inside holding a single note, then the next voice, then the next: the harvest song chopped into pieces and carried downhill like rain in a gutter. Some notes are rich and old. Some are very young. One pipe is wrapped in a singer’s scarf, as if someone tried to keep it warm.',
    artSubject:
      'A steep flooded railway gallery whose walls are covered in thick pale coral pipes running downward, one wrapped in a knitted scarf, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, pressing an ear to a pipe, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, shivering beside them with the lantern',
    choices: [
      {
        id: 'follow-the-pipes',
        label: 'Follow the pipes by ear and learn which ones run to the bell',
        outcome:
          'Vesper walks with one antenna touching the coral. The pipes braid as they go down, four into two, two into one, and the one runs into the dark toward a slow, enormous hum. All the singers’ voices are being gathered into a single throat. The bell does not ring with brass. It rings with them.',
        gain: { evidence: 2 },
        artSubject:
          'Vesper following a braid of coral pipes down a dark gallery with one feathery antenna trailing along them, the pipes converging into one in the distance',
      },
      {
        id: 'stop-a-pipe',
        label:
          'Stuff Pip’s coat into the scarfed pipe to stop one voice going down',
        outcome:
          'Pip gives up his coat without a word, and Vesper packs it into a crack in the scarfed pipe. The note inside backs up, swells, and comes out of the crack as a small, cross, sleepy hum. Somebody’s grandfather. It is not a rescue. It is one held breath on its way home. Pip shivers in his shirtsleeves and pretends he does not.',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'Vesper stuffing an oversized goblin coat into a crack in a scarf-wrapped coral pipe while Pip stands shivering in his shirtsleeves holding the lantern',
      },
    ],
  },
  {
    id: 'BT-20',
    title: 'The Drowned Sleepers',
    kind: 'hazard',
    speaker: 'Vesper',
    opening:
      'The water is chest-deep here, and black. The rails run on beneath it, and so do the sleepers, but a third of the sleepers have been taken up and stacked against the wall, and where they were is only a gap with the downhill current pulling through it like a drain. In daylight it would be an easy walk. In this dark, any second step might be a hole straight into the slow water that runs to the sea gate.',
    artSubject:
      'A chest-deep stretch of black floodwater over railway tracks with wooden sleepers stacked against the wall, gaps in the track pulling at the current, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, standing at the edge with wings lifted clear of the water, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, clinging to their satchel strap',
    choices: [
      {
        id: 'light-the-gaps',
        label:
          'Hold the lantern low over the water and step only where it shows wood',
        outcome:
          'Pip holds the lantern at the surface and the light goes down green and clear. Every gap shows plainly, and so does what lies at the bottom of the nearest one: a cart’s brass number plate and a single child’s sandal, carried halfway to the sea and caught. They cross on the wood, and Vesper does not look down again.',
        gain: { battery: -1, evidence: 1 },
        requires: { battery: 1 },
        lockedHint: 'Needs lantern oil to see the gaps',
        artSubject:
          'A lantern held at the surface of clear green floodwater lighting submerged railway sleepers and a small sandal caught in a gap below, Vesper stepping carefully across',
      },
      {
        id: 'fly-it-wet',
        label:
          'Spread wet wings and glide the flooded stretch with Pip on your back',
        outcome:
          'Moth wings are not made for water. Vesper beats them anyway, heavy as wet sheets, Pip clinging to the satchel, and makes most of the way before the wings give and they both go under at the far end. The current grabs at them. Pip comes up first and hauls Vesper out by an antenna, which hurts, and which saves them.',
        gain: { danger: 2, trust: 1 },
        artSubject:
          'Vesper beating heavy soaked grey wings low over black water with Pip clinging to their back, spray flying as they sink toward the far end of the flood',
      },
    ],
  },
  {
    id: 'BT-21',
    title: 'Kiri’s Note in the Pipe',
    kind: 'companion',
    speaker: 'Kiri',
    opening:
      'Kiri stops dead beside a narrow pipe at knee height and presses her ear to it. Then she presses her throat to it, where the coral is. Inside, small and clear and tired, a girl’s voice is holding one note: hers. It is the note she was singing when the badges came. If she takes it back, she will be able to talk again. If she takes it back, there will be a gap in tonight’s song, and the bell will notice and send someone to fill it.',
    artSubject:
      'In a gallery of coral pipes, Kiri, a thin girl of about twelve with a cropped fringe and a ridge of pink coral along her throat, kneeling with her throat pressed to a narrow pipe at knee height, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, crouched beside her with the lantern, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, watching anxiously',
    echoes: [
      {
        flag: 'BT-09:let-her-sing',
        text: 'Kiri already knows what her voice does to the railway. She looks at Vesper, and waits for them to ask, and hopes they will not.',
      },
      {
        flag: 'BT-09:rin-calls-her',
        text: 'Kiri says her one spoken word, ‘Radish,’ which is how she asks Rin whether this is all right. Rin says it is, and holds her hand.',
      },
    ],
    choices: [
      {
        id: 'take-it-back',
        label: 'Help Kiri break the coral and take her own note back',
        outcome:
          'Vesper cracks the pipe with the lantern’s base and Kiri breathes the note in like air after a dive. ‘Thank you,’ she says, out loud, and then a great deal else, very fast. Far below, the song stumbles. The bell rings a sharp double, and somewhere a cart is sent to fetch a voice to fill her place.',
        gain: { trust: 2, danger: 1 },
        artSubject:
          'A girl gasping in a breath of light as a cracked coral pipe spills a faint glowing note into her mouth, Vesper holding the lantern that broke it',
      },
      {
        id: 'wait-for-everyone',
        label:
          'Ask Kiri to wait, and take her note back only when every singer can',
        outcome:
          'Kiri listens. She is twelve and furious and she understands perfectly. She lets go of the pipe. Her note stays in it, keeping the song whole and the bell calm, so that nobody else is fetched tonight on her account. She does not look at Vesper for a long while afterward, and she is right not to.',
        gain: { evidence: 1, danger: -1 },
        artSubject:
          'A girl with coral on her throat walking away from a narrow pipe with her fists clenched, Vesper standing behind her with their head bowed',
      },
      {
        id: 'rin-holds-the-note',
        label:
          'Let Old Rin sing Kiri’s note into the pipe as Kiri draws hers out',
        outcome:
          'Rin puts her old mouth to the coral and sings the note exactly, an old woman’s version of a girl’s, while Kiri draws her own voice back out. The bell hears no gap at all. But now Rin’s note is in the pipe, and her speaking voice comes out thin and cracked, and she says it is a fair trade and will not discuss it.',
        gain: { trust: 2, danger: -1 },
        requires: { entry: 'singers' },
        lockedHint: 'Only if Old Rin came in with you',
        artSubject:
          'An old singer in a straw hat singing into a cracked coral pipe as a young girl beside her draws a faint glowing thread of sound from it',
      },
    ],
  },
  {
    id: 'BT-22',
    title: 'The Pumphouse Stove',
    kind: 'rest',
    speaker: 'Pip',
    opening:
      'A pumphouse straddles the line where the station once pumped seepage up and out. Its great iron pumps have been reversed, and now they draw the sea uphill in long slow strokes, like the breathing of someone asleep. In the corner a coal stove still has embers, and a kettle, and a tea tin with HOME written on the lid in three scripts: village, office and sea court. Pip sits down on a crate as if his legs have been cut. ‘Five minutes,’ he says. ‘Then we’re heroes again.’',
    artSubject:
      'A brick pumphouse with huge iron beam pumps rising and falling over the flooded line, a small coal stove glowing in the corner with a kettle and a tea tin, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, slumped on a crate, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, lifting the kettle',
    echoes: [
      {
        flag: 'BT-07:rest-against-the-wall',
        text: 'Pip slept against the Oven’s wall earlier. He says this stove is better, because it has never once asked him what he owes.',
      },
      {
        flag: 'BT-19:stop-a-pipe',
        text: 'Pip is still in shirtsleeves. He stands very close to the stove, and Vesper drapes a wing round him without comment.',
      },
    ],
    choices: [
      {
        id: 'brew-the-tea',
        label: 'Brew the tea from the HOME tin, refill the lantern and rest',
        outcome:
          'The tea is three kinds mixed: smoky village leaf, office bags, a salty sea-court kelp brew. It tastes like an argument and warms like a quilt. Pip finds a can of pump oil that burns well enough in the lantern. For five whole minutes they are not heroes, and that is restful too.',
        gain: { battery: 2 },
        artSubject:
          'Pip and Vesper sharing steaming tea from chipped cups beside a coal stove in a pumphouse, the lantern refilled and burning brightly on the crate between them',
      },
      {
        id: 'stop-a-pump',
        label:
          'Throw one pump’s clutch so the sea climbs a little slower tonight',
        outcome:
          'The clutch is stiff, and Vesper hangs off it with their full weight until it bangs out. One pump stops. The water uphill drops a hand’s breadth, and every cart on the line runs a little slower, a little later. Somewhere above, a family has an extra hour. Somewhere below, a voice notices, and the next call is sharper.',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'Vesper hanging from a heavy iron clutch lever with their full weight as one great beam pump shudders to a stop in a steaming pumphouse',
      },
    ],
  },
  {
    id: 'BT-23',
    title: 'The Master Order',
    kind: 'puzzle',
    speaker: 'Vesper',
    opening:
      'The sluice ends at a wall of white coral as wide as a house, scratched from floor to roof with every promise the bell keeps, in order: the full sequence the pillar above took its few marks from. It is beautiful, the way a correctly drawn map is beautiful. Reading it would let Vesper stop carts, because a promise rung out of order by the one who made it halts its cart. At the very bottom, where any list starts, the first mark is a moth. It is small, and drawn by a child.',
    artSubject:
      'A vast wall of white coral as wide as a house covered from floor to roof in hundreds of scratched symbols in orderly rows, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, kneeling at its foot beside a tiny child-drawn moth mark, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, holding the lantern up toward the endless rows',
    echoes: [
      {
        flag: 'e12:6,3:sort-by-scratches',
        text: 'Scylla’s sorted conch witnesses would fit this wall exactly. The three shells she set aside as unverified appear nowhere on it, which is either a flaw or a mercy.',
      },
      {
        flag: 'e12:6,3:cross-examine',
        text: 'Scylla taught a square of witnesses to test one another’s promises. Nobody has tested this wall. It has the confidence of something nobody ever argued with.',
      },
      {
        flag: 'BT-04:read-the-order',
        text: 'Vesper already knows the rule: every promise of safety, read as an address. Here it is in full, and the full thing is worse.',
      },
    ],
    choices: [
      {
        id: 'read-the-wall',
        label: 'Read the whole wall, promise by promise, from the moth upward',
        outcome:
          'It takes an hour. Pip writes; Vesper reads. The wall holds four hundred promises, every safe-keeping in Hoshimori and some from the sea and Briar too, and each is now a departure. With this, Vesper could ring the carts to a stop. So could anyone. Pip looks at his finished page and says, ‘We’ve made the thing we came to break.’',
        gain: { evidence: 2, danger: 1 },
        artSubject:
          'Pip filling page after page of a small ledger at the foot of a vast scratched coral wall while Vesper traces the rows above with one finger',
      },
      {
        id: 'read-only-the-first',
        label: 'Read only the first mark, the moth, and leave the rest unread',
        outcome:
          'Vesper kneels and reads the child’s moth alone. It is a promise made at seven to two people on a road: I will show you the way and tell no one. Everything else on the wall was built on top of it. Vesper reads no further. Of all the promises down here, they know the one they have the right to ring.',
        gain: { trust: 1, evidence: 1 },
        artSubject:
          'Vesper kneeling in shallow water with their forehead almost touching a tiny child-drawn moth scratched at the foot of a towering coral wall',
      },
      {
        id: 'lay-the-rubbing-down',
        label:
          'Lay the bell rubbing at the foot of the wall and compare the order',
        outcome:
          'The rubbing and the wall disagree in exactly one place. Here the moth is first. On the rubbing, taken from the oldest scratches on the coral, the moth is third, behind two older marks: a knot and a cup. Someone scraped those two off the bottom of this wall and set the moth under everything. Someone wanted it to look as though Vesper started all of this.',
        gain: { evidence: 2, trust: 1 },
        requires: { entry: 'bell-marks' },
        lockedHint: 'Only if Vesper copied the bell marks before coming in',
        artSubject:
          'A charcoal rubbing spread on wet stone at the foot of a coral wall, Vesper pointing from a knot and a cup on the paper to two pale scraped patches on the coral',
      },
    ],
  },
  {
    id: 'BT-24',
    title: 'The Express Incline',
    kind: 'shortcut',
    speaker: 'Pip',
    opening:
      'Beside the master wall a steep incline drops straight down through the rock toward the hum of the bell, a maintenance track for carts in a hurry. An empty cart waits at the top on a chock, its brake marked with a fishhook. It would be a fast and frightening ride straight to the bell’s door, skipping the junction and everything at it. Pip looks down the incline, then at Vesper. ‘I want it on record,’ he says, ‘that I said no first.’',
    artSubject:
      'The top of a steep narrow rail incline plunging into darkness, an empty cart held on a wooden chock with a fishhook-marked brake, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, peering down the slope with an appalled face, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, testing the chock with one foot',
    choices: [
      {
        id: 'shortcut-down',
        label:
          'Kick out the chock and ride the empty cart down the express incline',
        outcome:
          'Pip says no, and then gets in. The chock goes and the cart drops. They scream down through the dark, sparks spraying off the rails, Vesper’s wings braced against the sides, and slam to a halt on the buffer of the bell’s anteroom. The way between the incline top and the anteroom is open now, both directions.',
        gain: { danger: 1 },
        artSubject:
          'An empty railway cart hurtling down a steep dark incline in a spray of sparks, Vesper braced inside with wings jammed against its sides and Pip clinging on screaming',
      },
      {
        id: 'chock-it-harder',
        label: 'Jam the chock tight so no cart can run the incline tonight',
        outcome:
          'Vesper wedges a stacked sleeper under the chock, and Pip ties the brake with his belt. Nothing will run down this way in a hurry, and nothing will come up it either. Below, the bell will have one fewer fast cart to call. They take the long way round, through the tide junction.',
        gain: { danger: -1, trust: 1 },
        artSubject:
          'Vesper hammering a heavy wooden sleeper under a cart’s chock at the top of an incline while Pip knots his belt around the brake lever',
      },
    ],
  },
  {
    id: 'BT-25',
    title: 'Where the Chimney Meets the Sea',
    kind: 'lore',
    speaker: 'Pip',
    opening:
      'The junction is a vast drowned cavern where the Red Oven’s chimney comes down through the roof, a brick throat breathing hot smoke into the sea. Seawater from the palace gate boils up from below to meet it. Together they make a warm fog that smells of bread and kelp and burning, the smell Pip caught at the tunnel mouth, now at full strength. Carts dip from the rails here straight down into green water toward the palace, and rise again empty. The bell’s hum is very near.',
    artSubject:
      'A vast drowned cavern where a brick chimney descends from the roof breathing smoke into boiling green seawater, warm fog everywhere, rails dipping down into the water with a cart sinking along them, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, on a coral ledge holding the lantern, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, drifting toward the fog',
    echoes: [
      {
        flag: 'e12:7,6:cut-the-contract',
        text: 'Since Vesper cut the tide contract at the shrine, the fog is thinner and the water rougher. Wreckage from the flooded shrine bobs here: a sandal rack, a length of Oren’s rope.',
      },
      {
        flag: 'e12:7,6:testify-no-consent',
        text: 'Since Seri swore at the palace gate that no donor ever consented, the chimney’s smoke has changed. It is plain grey now, ordinary bread smoke, and it does not cling.',
      },
      {
        flag: 'e12:7,6:pay-in-bread',
        text: 'Since the bread tithe was agreed, a basket of loaves rides each dawn cart down into the sea. One floats here now, soaked through, and the fish have been at it.',
      },
    ],
    choices: [
      {
        id: 'watch-a-departure',
        label:
          'Watch one loaded cart dip into the sea and see what the water does to its sleepers',
        outcome:
          'The cart goes under, and the sleepers do not drown. A bubble of warm air from the chimney holds round each of them, Oven-breath, as it carries them down. They are being delivered, not killed. Vesper does not know if that is better. Pip says it is, firmly, and then is sick into the water.',
        gain: { evidence: 2, danger: 1 },
        artSubject:
          'A railway cart sinking into green seawater with each sleeping singer inside held in a glowing bubble of warm air, Vesper and Pip watching from a foggy ledge',
      },
      {
        id: 'pull-pip-back',
        label: 'Hold Pip back from the chimney’s smell before it calls him in',
        outcome:
          'Pip has been drifting toward the hot fog without knowing it, the way he once walked to the Oven door every dawn to work off his debt. Vesper catches his collar. He comes to with a jerk and says, too brightly, that he was only looking. Vesper keeps a hand on his collar until the junction is behind them.',
        gain: { trust: 2 },
        artSubject:
          'Vesper gripping the collar of a small goblin who is stepping toward a column of warm bread-scented fog, his face blank and dreamy in the lantern light',
      },
    ],
  },
  {
    id: 'BT-26',
    title: 'The Eel’s Toll Booth',
    kind: 'hazard',
    speaker: 'The moray toll-keeper',
    opening:
      'A little toll booth stands on stilts where the junction’s side line runs off into the dark, and coiled round its stilts is a moray eel in a court official’s collar. Sea law holds here: every passage pays a memory. The eel’s eyes are milky. It cannot see in this blackness any better than Vesper can, and it has been down here long enough to be hungry for something other than memories. Light, perhaps. In the deep sea, light is the rarest coin there is.',
    artSubject:
      'A small wooden toll booth on stilts in black water with a huge moray eel in a frilled official’s collar coiled around its legs, its milky eyes turned toward a lantern, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, standing before it, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, clutching the lantern to his chest',
    echoes: [
      {
        flag: 'e12:7,6:testify-no-consent',
        text: 'The eel has heard about the palace gate and the three sworn witnesses. ‘Consent,’ it says, as if the word were sour. ‘Very well. You may offer. I may refuse.’',
      },
    ],
    choices: [
      {
        id: 'pay-in-light',
        label: 'Pay the toll in lamplight instead of a memory',
        outcome:
          'Pip opens the lantern door and the eel puts its whole blind face into the glow and sighs. It drinks the light down to a blue bead, and the lantern gutters. ‘Paid,’ it says, dreamily. ‘Pass. And tell nobody upstairs that light buys passage, or I will have every lamp in Hoshimori down here.’',
        gain: { battery: -2, trust: 1 },
        requires: { battery: 2 },
        lockedHint: 'Needs a well-filled lantern',
        artSubject:
          'A huge moray eel pressing its milky-eyed face into the open door of a lantern held by a goblin, the flame shrinking to a small blue bead, Vesper watching',
      },
      {
        id: 'pay-a-memory',
        label:
          'Pay the toll the sea-court way, with one memory of Vesper’s own choosing',
        outcome:
          'Vesper offers a small one: the smell of Tallow’s lamp oil on a winter night in the nest. The eel takes it gently, with its teeth. Vesper passes. Afterward they cannot remember what their mother’s workroom smelled of, only that it smelled of something, and that they loved it.',
        gain: { danger: 1, trust: -1 },
        artSubject:
          'A moray eel delicately drawing a faint glowing wisp from Vesper’s temple with its teeth, Vesper standing very still with eyes closed beside a stilted toll booth',
      },
    ],
  },
  {
    id: 'BT-27',
    title: 'Char in the Signal Box',
    kind: 'companion',
    speaker: 'Char',
    opening:
      'A flooded signal box stands up to its windows in the junction’s side water, and someone is sitting inside on the lever frame, tail in the water and elbows on her knees: Char, black lipstick immaculate, dark fin flicking. She swam up from the palace gate the wrong way because she heard the bell from the sea court and did not like its manners. ‘Vesper. Good. You know maps. I have a plan, and it’s steal the bell. Tell me why it’s a bad plan. Use small words, I’m wet.’',
    artSubject:
      'Inside a flooded railway signal box with a row of tall levers, Char, a sturdy goth mermaid princess with black lipstick and a dark fin, sitting on the lever frame with her tail in the water and elbows on her knees, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, leaning in at the broken window with the lantern',
    echoes: [
      {
        flag: 'e12:5,5:stop-the-sale',
        text: 'Char grins with all her teeth. ‘We voided an auction together,’ she says. ‘I thought we might void a railway next.’',
      },
      {
        flag: 'e12:5,5:hear-the-washerwoman',
        text: 'Char has not entirely forgiven Vesper for the washerwoman. ‘This time,’ she says, ‘nobody asks anybody what they want for an hour. We just do it.’',
      },
    ],
    choices: [
      {
        id: 'hear-her-out',
        label:
          'Hear her plan through, then ask her to scout the bell instead of stealing it',
        outcome:
          'Char’s plan is genuinely clever, involves three levers and a cart full of seawater, and would drop the bell into the sea, choir and all. Vesper says so. Char goes quiet, then says fine, she will scout. She slides off the frame into the dark water and comes back an hour later to draw the bell chamber in bubbles on the glass.',
        gain: { evidence: 1, trust: 1 },
        artSubject:
          'A goth mermaid with black lipstick tracing a diagram of a domed chamber in bubbles and condensation on a signal box window while Vesper studies it closely',
      },
      {
        id: 'let-her-pull-a-lever',
        label: 'Let Char throw the junction signals to red her way, right now',
        outcome:
          'Char hauls the biggest lever over with both arms and a grunt of pure satisfaction. Every signal in the junction goes red. Three carts stop dead, sleepers rocking. Then the bell rings, deep and annoyed, and the signals turn themselves green again one by one. Char swears beautifully. ‘Fine. It has to be done from inside. I hate that.’',
        gain: { evidence: 1, danger: 2 },
        artSubject:
          'A sturdy goth mermaid hauling a tall signal lever over with both arms as red lamps flare across a foggy flooded junction outside the box window',
      },
    ],
  },
  {
    id: 'BT-28',
    title: 'The Lost-Property Pool',
    kind: 'treasure',
    speaker: 'Pip',
    opening:
      'Below the signal box the side line ends in a still, deep pool where carts tip their small leavings, the things that fall out of sleepers’ pockets on the way down. The bottom is carpeted with them, glowing faintly under the brine: combs, coins, ferry tokens, a hair ribbon, an office lanyard, a child’s wooden bird. Glow-coral grows over everything, softly lit, the colour of lantern light through rice paper. Sooner or later the current will take all of it down to the sea.',
    artSubject:
      'A still clear pool at the end of a flooded siding, its floor heaped with combs, coins, tokens, a lanyard and a small wooden bird under soft pink glowing coral, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, kneeling at the edge with a lantern hook, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, peering in beside them',
    echoes: [
      {
        flag: 'BT-27:hear-her-out',
        text: 'Char is back from scouting, floating in the pool on her back and sorting lost things into little piles by how sad they are.',
      },
      {
        flag: 'BT-27:let-her-pull-a-lever',
        text: 'Char is sulking in the pool after the signals, chin on the edge, flicking ferry tokens at the wall one by one.',
      },
    ],
    choices: [
      {
        id: 'gather-glow-coral',
        label: 'Break off a fist of glow-coral to feed the lantern',
        outcome:
          'The coral burns cool and steady in the lantern’s cage, a pink light that makes every face look kinder than it is. It will last a long while. Pip says it is the prettiest thing he has ever carried, and that he hates where it grew.',
        gain: { battery: 2 },
        artSubject:
          'Pip closing a lantern door on a glowing lump of pink coral, soft rosy light spilling over Vesper’s grey wings at the edge of a still pool',
      },
      {
        id: 'raise-the-bird',
        label:
          'Hook up the child’s wooden bird, so somebody up there can have it back',
        outcome:
          'The bird is carved from cedar, worn smooth by a small thumb, with a name burned under one wing. Vesper does not read the name. They wrap the bird in a strip of map-silk and tuck it in the satchel among the maps, where it does not belong and is very safe. Somebody on the terraces is missing it badly.',
        gain: { trust: 2 },
        artSubject:
          'Vesper lifting a small dripping cedar bird from a glowing pool on the end of a lantern hook, a strip of silk ready in their other hand',
      },
    ],
  },
  {
    id: 'BT-29',
    title: 'The Pressing Room',
    kind: 'hazard',
    speaker: 'Kiri',
    opening:
      'Behind the pool is a long low room where coral is made. Singers’ notes come down thin pipes into stone moulds, and presses squeeze them, slowly, into bricks of pale coral, each brick humming one sound. The bricks ride a belt toward the bell. The room is unlit; the presses work by sound, not sight. Kiri will not go in. She stands at the door with her hands over her ears, because she can hear which bricks are people she knows.',
    artSubject:
      'The dark doorway of a long low room where massive stone presses squeeze faintly glowing pale coral bricks onto a moving belt, Kiri, a thin girl of about twelve with a cropped fringe and a ridge of pink coral along her throat, standing at the threshold with her hands over her ears, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, stepping past her into the dark',
    echoes: [
      {
        flag: 'BT-21:take-it-back',
        text: 'Kiri can talk now, and at the door she talks the whole time, fast and quiet, so that she cannot hear the bricks.',
      },
      {
        flag: 'BT-21:wait-for-everyone',
        text: 'Kiri’s own note is still in its pipe somewhere above. She listens to the bricks for it, and is relieved not to hear it, and ashamed of being relieved.',
      },
    ],
    choices: [
      {
        id: 'light-the-presses',
        label: 'Light the room and read the stamps on the coral bricks',
        outcome:
          'In the lantern light every brick shows a stamp: a promise mark and a harvest verse. The bricks become the bell’s body. The bell is built of the singers’ voices, laid like masonry, and every departure adds a brick. Stop the bell and the voices could go home. Break it carelessly and they break with it.',
        gain: { battery: -1, evidence: 2 },
        requires: { battery: 1 },
        lockedHint: 'Needs lantern oil to see the presses',
        artSubject:
          'Vesper holding a lantern over a moving belt of pale coral bricks each stamped with a small symbol, huge stone presses looming in the light behind',
      },
      {
        id: 'jam-a-press',
        label:
          'Feel along the dark for the nearest press and jam it with a sleeper',
        outcome:
          'Vesper finds the press by its groan and wedges a sleeper into its jaws. It stops with a crack. The note in its mould, released, floats back up the pipe like a fish let go. One voice will get home whole. The other presses speed up to make the difference good, and somewhere a supervisor will hear of it.',
        gain: { trust: 1, danger: 2 },
        artSubject:
          'Vesper ramming a wooden railway sleeper into the jaws of a great stone press in near darkness, a faint glowing note rising free from its mould',
      },
    ],
  },
  {
    id: 'BT-30',
    title: 'The Siding Nobody Timetabled',
    kind: 'secret',
    speaker: 'A palace refugee',
    opening:
      'Behind a coral curtain, a short siding ends at a buffer that appears on no board. Three carts stand there, never called, and they are lived in. Washing hangs between them. A family from the drowned palace, a selkie grandmother, two boys and a woman in a kelp-woven hat, have made a home in the one place the bell does not know about. The woman steps between Vesper and the boys. She has seen the satchel of maps. ‘Who are you drawing for?’ she says.',
    artSubject:
      'A hidden railway siding behind a curtain of hanging coral, three old carts made into a home with washing strung between them, a woman in a kelp-woven hat standing protectively before two boys and a selkie grandmother, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, stopping short with the map satchel at their hip',
    choices: [
      {
        id: 'leave-no-mark',
        label: 'Promise to leave this siding off every map, and mean it',
        outcome:
          'Vesper takes out their working sketch of the tunnel and burns the corner where this siding would go, there in front of her. The woman watches it curl. ‘Promise,’ she says, and Vesper does: no scratch, no tally, no witness but her. She gives them a cup of kelp tea for the road.',
        gain: { trust: 2 },
        artSubject:
          'Vesper holding the corner of a hand-drawn map to the lantern flame as a woman in a kelp hat watches it burn, two boys peering from a lived-in cart behind her',
      },
      {
        id: 'ask-their-help',
        label:
          'Ask what they know of the bell, and promise their answer stays theirs',
        outcome:
          'She considers for a long time. Then: ‘The bell-wright comes here. She brings the boys sweets. She has never put us on the wall.’ The guardian keeps one secret of her own. It is the most useful thing Vesper learns all night, and saying it costs the woman a great deal of fear.',
        gain: { evidence: 2, danger: 1 },
        artSubject:
          'A woman in a kelp-woven hat speaking quietly to Vesper beside a cart hung with washing, a paper bag of boiled sweets visible on the cart step',
      },
    ],
  },
  {
    id: 'BT-31',
    title: 'The Bell Anteroom',
    kind: 'hazard',
    speaker: 'Pip',
    opening:
      'The rails end at a buffer in a round anteroom of white coral. Beyond a coral arch, the bell’s hum fills everything; each ring shivers the water into circles and makes the lantern flame lie flat. On the walls hang the draft pages of a great atlas, pinned up to dry like fish, every page a square of Hoshimori with its hidden doors inked in red. A desk holds a teacup, a bag of boiled sweets and a child’s map drawn in green crayon, framed.',
    artSubject:
      'A round anteroom of white coral at the end of the rails, draft map pages with red-inked doors pinned to the walls like drying fish, a desk with a teacup, a paper bag of sweets and a small framed crayon drawing, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, staring at the frame, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, shielding the flattened lantern flame',
    echoes: [
      {
        flag: 'BT-24:shortcut-down',
        text: 'The express cart they rode down is still smoking on the buffer, one wheel off the rail. Pip pats it like a horse that has behaved badly.',
      },
      {
        flag: 'BT-17:answer-the-tube',
        text: 'The speaking tube’s lower end opens beside the desk. A note hangs on it in neat terrace script: COME THROUGH. I WON’T RING WHILE YOU CROSS.',
      },
    ],
    choices: [
      {
        id: 'burn-the-drafts',
        label: 'Burn the pinned draft pages in the lantern, one by one',
        outcome:
          'Vesper feeds the drafts to the lantern flame one page at a time, red doors curling to grey. It takes the last of the good oil. It does not touch the atlas itself, which waits somewhere beyond the arch, finished. But these drafts will never be pinned up anywhere else, and for a moment the anteroom smells of an honest fire.',
        gain: { battery: -1, trust: 1, danger: 1 },
        requires: { battery: 1 },
        lockedHint: 'Needs lantern oil to burn them',
        artSubject:
          'Vesper holding a map page with red-inked doors into the lantern flame as it curls to grey ash, bare pins left in the coral walls around them',
      },
      {
        id: 'look-at-the-crayon-map',
        label: 'Look closely at the framed crayon map on the desk',
        outcome:
          'It is Vesper’s. Not a copy but the original: the first safe road they ever drew, at seven, in green crayon on rice paper, with a cup and a knot at its start and a small moth at its end. It was sold with all the others. Someone down here has kept it framed, and dusted, and left a sweet on top of it.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'Vesper holding a small wooden frame containing a child’s green crayon road on rice paper, a boiled sweet resting on top of the glass, Pip looking over their arm',
      },
    ],
  },
  {
    id: 'BT-32',
    title: 'The Bell-Wright',
    kind: 'guardian',
    speaker: 'Amane',
    opening:
      'Through the arch, on a coral ledge above black water, a young woman sits on a stool beside the bell rope, a salt-stiff indigo harvest coat over her shoulders and pale coral grown across one shoulder and half her jaw. She does not stand. ‘Amane,’ she says. ‘You drew my road. My mother and I walked it when I was six. Years later you sold it, and they found her.’ She turns the rope in her hands. ‘Secrecy didn’t save us. It made us for sale. Tell me why the atlas shouldn’t belong to everyone.’',
    artSubject:
      'On a coral ledge above black water beneath the dark curve of an enormous bell, Amane, a young bell-wright in a salt-stiff indigo harvest coat with pale coral grown over one shoulder and half her jaw, seated on a stool with the bell rope across her knees, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, standing before her with wings folded, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, waiting under the arch with the lantern',
    echoes: [
      {
        flag: 'BT-17:answer-the-tube',
        text: 'She knew Vesper’s voice on the tube before she knew their face. She has been rehearsing this since, and it shows.',
      },
      {
        flag: 'BT-17:listen-only',
        text: 'She never heard Vesper on the platform. She looks at them now as though a page of her own atlas had walked in.',
      },
      {
        flag: 'BT-30:leave-no-mark',
        text: 'Her eyes go to the burnt corner of the sketch in Vesper’s satchel. She knows what siding was there. Something in her face eases.',
      },
      {
        flag: 'BT-30:ask-their-help',
        text: 'Vesper knows about the sweets for the boys in the untimetabled siding. Amane can tell they know, and her hands go still on the rope.',
      },
      {
        flag: 'entry:singers',
        text: 'Old Rin has come as far as the arch and stops there and takes her hat off. Amane looks at her for a long moment, and looks away first.',
      },
      {
        flag: 'entry:bell-marks',
        text: 'The rubbing is rolled under Vesper’s arm. Amane eyes it the way a clerk eyes a document nobody has filed.',
      },
    ],
    choices: [
      {
        id: 'own-the-sale',
        label:
          'Tell her the truth: you drew her road, you sold it, and you were paid',
        outcome:
          'No excuses, no age, no hunger. Vesper names the buyer, the price and the year. Amane listens with her jaw set. ‘At least you didn’t say you were a child,’ she says at last. ‘You were. It doesn’t matter.’ She forgives nothing. She shifts her stool aside so the vault door is clear. ‘Go and see what it built, then.’',
        gain: { trust: 1, danger: 1 },
        passesGuardian: true,
        artSubject:
          'Vesper standing with empty open hands before a seated young woman with coral on her jaw, who drags her stool aside to reveal a pale coral door behind her',
      },
      {
        id: 'show-the-manifests',
        label:
          'Lay out what the tunnel showed you: hats, tallies, buyers, the choir in the bricks',
        outcome:
          'Vesper lays it out on the ledge. Amane reads it the way a ledger is read, provenance first. When she reaches a buyer’s name she knows, she stops. ‘They told me the atlas finds people,’ she says. ‘They never said for whom.’ She lets go of the rope and does not pick it up again.',
        gain: { evidence: 1, trust: 1 },
        requires: { evidence: 5 },
        lockedHint: 'Needs more evidence of what the carts are for (5)',
        passesGuardian: true,
        artSubject:
          'Papers, a stamped coral brick and a straw hat laid out on a coral ledge, a young woman with coral on her jaw bent over them with the bell rope slack in her lap, Vesper waiting',
      },
      {
        id: 'show-the-scraped-cup',
        label:
          'Unroll the rubbing and show her the cup mark scraped from under the moth',
        outcome:
          'Amane studies the rubbing, and her hand goes to the coral on her jaw. The cup was her mother’s promise, to hide a stranger’s child in her loft. It came before Vesper’s moth, and the office scraped it away to make the cartographer the origin of everything. ‘They made you the reason,’ she says. ‘You were still a reason.’ She opens the vault.',
        gain: { evidence: 2, trust: 1 },
        requires: { entry: 'bell-marks' },
        lockedHint: 'Only if Vesper copied the bell marks before coming in',
        passesGuardian: true,
        artSubject:
          'A young woman with coral on her jaw holding a charcoal rubbing to the light, one finger on a small cup symbol, Vesper beside her with antennae lowered',
      },
      {
        id: 'rin-sings-the-cradle-verse',
        label:
          'Let Old Rin sing Amane the terrace cradle verse she taught her as a child',
        outcome:
          'Rin sings it badly, her voice wrecked: the verse every hidden child on the terraces learned on her knee. Amane’s lips move with it before she can stop them. She was one of those children. ‘You hid me before the moth’s road ever did,’ she tells Rin. ‘Nobody wrote you down.’ She steps aside, and does not look at Vesper.',
        gain: { trust: 2, danger: -1 },
        requires: { entry: 'singers' },
        lockedHint: 'Only if Old Rin came in with you',
        passesGuardian: true,
        artSubject:
          'An old singer holding her straw hat to her chest and singing under a coral arch, a young woman with coral on her jaw mouthing the words with wet eyes, Vesper standing apart',
      },
    ],
  },
  {
    id: 'BT-33',
    title: 'The Clean Atlas',
    kind: 'treasure',
    speaker: 'Amane',
    opening:
      'The vault is a coral chamber under the bell, and in it, on a lectern of the same pale stone, lies the finished atlas. Its pages are coral thin as paper, and every one is a perfect map: every hidden loft, cellar, closed-eye door and shuttered house in Hoshimori, Briar, the office city and the sea court, drawn from the singers’ voices and the sold routes. It is the most beautiful map Vesper has ever seen. Its first page is a child’s green crayon road. The whole tunnel above was dug along that line.',
    artSubject:
      'A small domed coral vault where a thick book of translucent coral pages rests open on a pale stone lectern, its first page showing a child’s green crayon road, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, standing over it with one hand hovering above the page, Amane, a young bell-wright in a salt-stiff indigo harvest coat with pale coral grown over one shoulder and half her jaw, watching from the wall',
    echoes: [
      {
        flag: 'BT-32:own-the-sale',
        text: 'Amane follows them in and stands against the wall with her arms folded, a witness and not a guide.',
      },
      {
        flag: 'BT-32:show-the-manifests',
        text: 'Amane brings the manifests in and sets them beside the atlas. The two documents look like each other, which is the point.',
      },
      {
        flag: 'BT-32:show-the-scraped-cup',
        text: 'The atlas’s first page has a pale scar at its corner, where a cup and a knot were cut away and the crayon road made to start from nothing.',
      },
      {
        flag: 'BT-32:rin-sings-the-cradle-verse',
        text: 'Old Rin follows them in, lays a hand on the lectern, and says, ‘Well. That’s every cellar I ever hid anyone in.’',
      },
      {
        flag: 'e12:1,7:unpick-route-thread',
        text: 'Vesper unpicked their sold route from the four-map seam with Tallow’s needle. Here on the first page that route is still drawn in a seven-year-old’s crayon, untouched.',
      },
      {
        flag: 'e12:1,7:restitch-public',
        text: 'Tallow restitched the seam along a public lane. The atlas has copied that too, and then added in red where each of the lane’s walkers goes home.',
      },
    ],
    choices: [
      {
        id: 'read-the-first-page',
        label:
          'Read the atlas’s first page, your own crayon road, and what was written over it',
        outcome:
          'Over the child’s road, in clerk’s ink, the office has written a title, SOURCE, and a note: all subsequent routes derived from or verified against this original. Vesper’s first promise is the measuring stick for every other betrayal in the book. Pip reads it over their shoulder, puts his hand on Vesper’s arm, and leaves it there.',
        gain: { evidence: 2, danger: 1 },
        artSubject:
          'A child’s green crayon road on a coral page overwritten with one word in severe clerk’s ink, Vesper reading it with Pip’s small hand resting on their arm',
      },
      {
        id: 'count-without-opening',
        label: 'Count the pages by their edges without opening a single one',
        outcome:
          'Vesper runs a thumb down the edge and counts: one thousand two hundred and eleven pages, each a household. They open none of them. Amane, watching, says she has never read past the first page either. ‘I was looking for my mother’s,’ she says. ‘I couldn’t do it to everyone else.’',
        gain: { trust: 2 },
        artSubject:
          'Vesper running a grey thumb down the closed edge of a thick coral-paged book on a lectern, a young woman with coral on her jaw watching with tears held back',
      },
      {
        id: 'take-the-crayon-page',
        label:
          'Ask Amane for the first page, the crayon road, as the one page that is yours',
        outcome:
          'Amane looks at Vesper a long time, then lifts the first page free with two fingers. The atlas shivers but holds; everything else was copied from it long ago. Vesper folds their childhood road into the satchel. It is theirs again, and it is still a confession, and they will have to carry both.',
        gain: { trust: 1, evidence: 1 },
        requires: { trust: 4 },
        lockedHint: 'Only if Amane trusts you enough (4)',
        artSubject:
          'A young woman with coral on her jaw handing a single folded page of green crayon on rice paper to Vesper across a stone lectern',
      },
    ],
  },
  {
    id: 'BT-34',
    title: 'The Choir Under the Bell',
    kind: 'secret',
    speaker: 'Kiri',
    opening:
      'Below the vault, in a gallery ringed round the bell’s mouth, the taken singers stand in a long crescent, coral grown over their feet to the ankle, eyes closed, singing in their sleep. Every ring of the bell draws a note from one of them and sends it up through the coral into the bell’s body. Forty-one, by Pip’s count: singers from the terraces, from office choirs, from the sea court. Kiri finds her teacher’s friends. Some are thin. All are alive. With each ring, one of them sways.',
    artSubject:
      'A curved gallery beneath the mouth of a vast coral bell where a long crescent of sleeping singers stands with eyes closed and coral grown over their feet, mouths open in song, Kiri, a thin girl of about twelve with a cropped fringe and a ridge of pink coral along her throat, running toward them, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, following with the lantern raised',
    echoes: [
      {
        flag: 'BT-21:rin-holds-the-note',
        text: 'Old Rin is very quiet beside the crescent. Her own note is up in a pipe now, and she can hear it in the bell.',
      },
      {
        flag: 'BT-29:light-the-presses',
        text: 'Vesper knows now what the bell is made of. Every brick above them is one of these forty-one, a little at a time.',
      },
      {
        flag: 'BT-29:jam-a-press',
        text: 'One singer at the end of the crescent is awake, blinking, holding his own voice in his mouth: the note freed from the jammed press found him.',
      },
    ],
    choices: [
      {
        id: 'wake-them-gently',
        label: 'Wake the singers one at a time, softly, by name',
        outcome:
          'Kiri knows most of the names, and Vesper reads the rest from the hats. One by one the sleepers open their eyes, do not know where they are, and are held until they do. Each one who wakes takes a note back from the bell. It rings thinner and angrier. By the last name the whole chamber shakes.',
        gain: { trust: 2, danger: 1 },
        artSubject:
          'A singer waking with a start in a crescent of sleepers as a girl with coral on her throat holds his hands, Vesper calling a name from a straw hat, the bell above trembling',
      },
      {
        id: 'leave-them-singing',
        label:
          'Leave them singing until the bell is answered, so it cannot shake down on them',
        outcome:
          'Vesper makes the hard call: wake them now and the bell might fall on them. They leave the forty-one asleep and singing, and Kiri shouts at Vesper for the first time, in a voice that is all her own. She is not wrong. She is not right either. The bell keeps ringing over them all.',
        gain: { evidence: 1, danger: -1 },
        artSubject:
          'A furious girl shouting up at Vesper in front of a crescent of sleeping singers, Vesper holding the lantern steady with a set, unhappy face',
      },
      {
        id: 'rin-sings-them-up',
        label:
          'Let Old Rin sing the terrace waking verse to the whole crescent at once',
        outcome:
          'Rin cannot sing well any more. She sings anyway, and Nae and Goro take the parts her voice cannot reach, and the waking verse for harvest mornings goes round the crescent like warm water. All forty-one wake together, holding each other up. The bell, deprived of every voice at once, hangs silent, waiting.',
        gain: { trust: 2, danger: -1 },
        requires: { entry: 'singers' },
        lockedHint: 'Only if Old Rin came in with you',
        artSubject:
          'An old singer and two young volunteers singing with arms spread before a crescent of singers all opening their eyes at once beneath a silent coral bell',
      },
    ],
  },
  {
    id: 'BT-35',
    title: 'The Great Bell',
    kind: 'climax',
    speaker: 'Vesper',
    opening:
      'The bell hangs in the domed heart of the tunnel, pale coral and taller than a house, its body laid in humming bricks, its rope running down to the ledge. Beneath it the brine runs two ways: up to the terraces, down to the sea gate. The atlas lies below it. One ring from whoever made the first promise, Amane says, and the bell will do as that ring asks. Vesper takes the rope. Every way of ringing it costs someone who is not here to argue.',
    artSubject:
      'A domed cavern dominated by an immense pale coral bell built of glowing bricks, seawater running two ways beneath it, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, gripping the thick bell rope on a ledge, Amane, a young bell-wright in a salt-stiff indigo harvest coat with pale coral grown over one shoulder and half her jaw, and Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, standing behind them, the coral atlas on its lectern below',
    echoes: [
      {
        flag: 'BT-33:take-the-crayon-page',
        text: 'The crayon road is folded in the satchel. The atlas has no first page now, and the bell’s note has an odd hollow in it.',
      },
      {
        flag: 'BT-30:leave-no-mark',
        text: 'Somewhere off the timetable a selkie grandmother and two boys are asleep in carts nobody has ever called. Whatever Vesper rings must not reach them.',
      },
      {
        flag: 'BT-34:leave-them-singing',
        text: 'The forty-one are still asleep below, singing. Whatever happens to the bell next happens to them too.',
      },
      {
        flag: 'BT-27:hear-her-out',
        text: 'Char’s bubble drawing of this chamber is still in Vesper’s head, and Char was right: the bell’s weak side faces the sea.',
      },
    ],
    choices: [
      {
        id: 'ring-a-held-rest',
        label:
          'Ring a held rest: silence the bell and let the sea carry the atlas down',
        outcome:
          'Vesper pulls the rope and holds it, a rest the bell cannot sound. The singers’ notes flow back up the pipes. The brine falters, turns, and runs downhill to the sea gate, taking the atlas page by page. No door in it will ever be read. Nor will the record of the departures already sent: nobody will learn from it where they went. Amane’s mother’s page goes down with the rest, and so does every proof of what Vesper sold.',
        gain: { trust: 1, evidence: -2, danger: -1 },
        artSubject:
          'Vesper hanging from a taut bell rope in perfect silence as seawater rushes downhill beneath them carrying translucent coral pages away into the dark',
      },
      {
        id: 'ring-each-route-home',
        label:
          'Ring the order backward, one household at a time, and let each choose its page',
        outcome:
          'Vesper rings the first promise backward, and carts begin to run uphill, full. It will be slow: one ring per household, one household’s choice per page, burn or keep. Amane takes the rope from Vesper and says she will stay and ring them home, all of them, however long it takes. The tunnel stays open, its rails known to every badge, and the atlas lives until its last page is answered.',
        gain: { trust: 2, danger: 1 },
        artSubject:
          'A young woman with coral on her jaw taking a bell rope from Vesper’s hands as a full cart begins climbing an uphill rail behind them toward a far grey light',
      },
      {
        id: 'sign-as-the-source',
        label:
          'Sign the first page as its source, so every route leads back to who sold and bought it',
        outcome:
          'Vesper writes their nest-name under the crayon road and rings once. The bell takes the oldest broken promise as answered and rewrites the atlas from first page to last: every hidden door goes blank, and in its place stands who sold that road and who paid. The carts stop, their destinations now buyers. Vesper’s name is the spine of a public book, Tallow’s and Wick’s beside it, and some buyers paid only to find their own lost children.',
        gain: { evidence: 2, trust: -1, danger: 2 },
        artSubject:
          'Vesper writing a name in ink beneath a child’s crayon road on a coral page while the great bell above them sounds a single deep note',
      },
    ],
  },
  {
    id: 'BT-36',
    title: 'The Road Back Uphill',
    kind: 'exit',
    speaker: 'Pip',
    opening:
      'The way out is the way in, uphill through the sluice and the platform and the warm wall under the Oven, back to the terraces where morning is starting. The water behaves differently now, whatever Vesper rang. The singers who can walk are walking. Kiri carries her own hat. Pip carries the lantern and the ledger and will not let go of either. At the tunnel mouth the families of the terraces have come down to the rails to see who is coming out.',
    artSubject:
      'The bright mouth of a railway tunnel at dawn seen from inside, a straggling line of singers in straw hats wading out toward waiting terrace families, Vesper, a dusty-grey moth-folk map-smuggler with feathery antennae, veined folded wings and a satchel of folded maps, walking last with wings folded and satchel heavy, Pip, a small goblin ledger apprentice with a pencil behind one ear and an oversized coat, ahead of them with the lantern still lit',
    echoes: [
      {
        flag: 'BT-35:ring-a-held-rest',
        text: 'The brine runs downhill the whole way now, toward the sea, as water should. The tunnel will be dry by winter, and nobody will ever use it again, for anything.',
      },
      {
        flag: 'BT-35:ring-each-route-home',
        text: 'Behind them the bell rings, slow and patient, every few minutes, and each time a full cart climbs past them toward the light. Amane calls each one home by verse, never by door.',
      },
      {
        flag: 'BT-35:sign-as-the-source',
        text: 'At the mouth someone has already pinned up a copy of the atlas’s new first page, with Vesper’s nest-name on it. Families read it as Vesper passes, and nobody says anything at all.',
      },
      {
        flag: 'entry:singers',
        text: 'Old Rin walks out between Nae and Goro, all three of them hoarse, all three humming the harvest song with the rest left in it.',
      },
      {
        flag: 'entry:bell-marks',
        text: 'The rubbing is still in the satchel, the record of an order that no longer holds. Vesper decides to give it to Ume for her ledger and let her argue with it.',
      },
    ],
    choices: [
      {
        id: 'climb-into-morning',
        label:
          'Climb out of the tunnel into the morning, carrying what you rang',
        outcome:
          'Vesper steps out of the brine onto dry sleepers. The terrace families come down the slope to meet the singers, and Vesper stands aside to let them, wings folded, the satchel heavy. Some people thank them. Some do not. Both are owed. Pip finds a dry straw hat on the rails, nobody’s, and puts it on Vesper’s head against the sun.',
        artSubject:
          'Vesper standing aside on dry sleepers at a sunlit tunnel mouth as families embrace returning singers, Pip reaching up to set a straw hat on their head',
      },
    ],
  },
]
