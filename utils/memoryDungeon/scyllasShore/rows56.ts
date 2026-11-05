import type { MorrowShiftSite } from '../morrowShift/types'

const SCYLLA =
  'a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze'
const CHAR =
  'her identical twin with dark violet scales, black lace and a sardonic grin'
const BRAM =
  'a lanky, irreverent court musician with an eel-grey tail and a drumstick tucked behind one ear'
const OREN =
  'a very tall, broad headsman whose whole head is covered by a rough brown cloth hood with two eyeholes, a heavy axe at his side and a long dark eel-grey tail'
const WENNA =
  'a lean middle-aged tidal scholar with ink-stained fingers, a brass loupe on a cord and a silver-scaled tail'

export const SCYLLAS_SHORE_ROWS_5_6: readonly MorrowShiftSite[] = [
  {
    key: '1,5',
    place: 'Coronet Rack',
    title: 'The Two Smallest Crowns',
    speaker: 'Scylla',
    kind: 'treasure',
    instant: true,
    opening:
      'Behind the Festival Court’s bandstand stands the coronet rack, where every crown a royal child ever outgrew hangs tangled in its neighbours. The two smallest are knotted together at the bottom: Scylla’s pearl one, and Char’s, onto which a six-year-old Char glued black limpet shells and then, defiantly, a fish bone. Scylla remembers the glue. She remembers the bone. She has not thought of either in a very long time.',
    artSubject: `Behind a shell-canopied festival bandstand in a pearl-walled underwater court lit by drifting lanterns, a tall rack of outgrown royal coronets hangs tangled like coral; ${SCYLLA} kneels at the bottom, gently working loose two tiny crowns, one of pearls, one crusted with black limpet shells and a glued fish bone.`,
    choices: [
      {
        id: 'notice',
        label: 'Untangle the two smallest coronets',
        outcome:
          'It takes patience and one broken fingernail. Wedged under the fish bone is a single seed pearl, hidden there by a six-year-old ‘for emergencies’. Scylla pockets it. She suspects this counts.',
        effects: { supplies: 1 },
        artSubject: `Close on the hands of ${SCYLLA}, holding a tiny shell-crusted coronet up to warm lantern light as a single seed pearl rolls free from under a glued fish bone.`,
      },
    ],
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'Scylla holds Char’s little crown longer than the knot needs. The girl who glued that bone is alive, two corridors away, arguing with a drummer. That is true. So is the gate.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'Scylla left an older Char alive above lit train windows that never opened. Small crowns, she thinks, are so much easier to set straight.',
      },
    ],
  },
  {
    key: '2,5',
    place: 'Festival Invitation Table',
    title: 'Letters Nobody Will Send',
    speaker: 'Char',
    kind: 'companion',
    opening:
      'At the table where festival invitations are folded, Char is writing letters that are not invitations. One for Oren, one for the nursery keeper, one for the drummer who owes her a shell. None for their mother. ‘Check my spelling,’ she says, sliding them across. ‘Only the spelling. You’re doing the face where you’re about to have opinions.’',
    artSubject: `A long table in a pearl-lit underwater festival court heaped with folded shell-paper invitations and ribbon; ${CHAR} writes with a quill at one end, elbow guarding her pages, while ${SCYLLA} leans over her shoulder; no legible writing anywhere.`,
    choices: [
      {
        id: 'care',
        label: 'Check only the spelling, as asked',
        outcome:
          'Scylla fixes three words and one heroic misuse of a semicolon. Char reads the corrections, grins, and stacks the letters under a festival plate. There is still no letter for their mother, and Scylla carries that in silence.',
        effects: { trust: 2, evidence: -1 },
        artSubject: `${CHAR} grinning as she slides a stack of folded letters under a festival plate, ${SCYLLA} beside her with a quill, holding very still; warm lantern light, no legible writing.`,
      },
      {
        id: 'risk',
        label: 'Ask why there’s no letter for Mother',
        outcome:
          '‘Because she’d read it,’ Char says, and the quill stops. She writes one line on a scrap, folds it very small and won’t show it. Scylla has learned something true about her sister, and spent a little of the ease between them to learn it.',
        effects: { evidence: 2, trust: -1 },
        artSubject: `${CHAR}, grin gone, folding a tiny scrap of shell-paper very small between two fingers, while ${SCYLLA} watches across a table of invitations; no legible writing.`,
      },
    ],
    echoes: [
      {
        flag: 'e05:4,2:care',
        text: 'Char has heard about Councilor Salter’s petition and the princess who signed it in plain sight. There is a fourth letter now, to the councilor. She doesn’t explain it.',
      },
      {
        flag: 'e05:4,2:risk',
        text: 'Char has heard her own name is on Councilor Salter’s petition. ‘Funny,’ she says, not looking up. ‘I don’t remember signing anything.’ The spelling check goes cooler for it.',
      },
    ],
  },
  {
    key: '3,5',
    place: 'Festival Mask Chest',
    title: 'Me Before Her',
    speaker: 'Bram Lowry',
    kind: 'puzzle',
    opening:
      'The festival mask chest has a pearl-lock: three pearls, set in order. Bram Lowry, the court musician, taps it with a drumstick. ‘Your sister reset it so the guards can’t borrow the good masks. White is you, black is her, rose is everyone else.’ Under the lid’s edge, in Char’s chalk: ME BEFORE HER. NEITHER OF US LAST.',
    artSubject: `A carved coral chest with a lock of three empty pearl sockets beside a festival bandstand; ${BRAM} points at the lock with his drumstick while ${SCYLLA} weighs three pearls, white, black and rose, in her open palm; warm lantern light, chalk smudges, no legible writing.`,
    choices: [
      {
        id: 'care',
        label: 'Set the pearls white, black, rose',
        outcome:
          'The lock clicks tighter and a little spring flicks a pearl into Scylla’s palm, hard. Bram winces on her behalf. ‘She’d have loved that,’ he says. The lock takes a while to forgive her.',
        effects: { danger: 1 },
        artSubject: `${SCYLLA} shaking a stung palm beside a coral chest that has snapped tighter, a white pearl bouncing away through the water, ${BRAM} wincing.`,
      },
      {
        id: 'risk',
        label: 'Set the pearls black, white, rose',
        outcome:
          'The lid sighs open. Under the festival masks lie two plain travel hoods, folded small, which are not festival costume at all. Bram looks at them, then at the ceiling, and starts whistling something innocent.',
        effects: { evidence: 2, supplies: 1 },
        artSubject: `An open coral chest spilling glittering festival masks, two plain grey travel hoods folded small beneath them; ${SCYLLA} lifts one, while ${BRAM} gazes at the ceiling, whistling.`,
      },
      {
        id: 'rose-first',
        label: 'Set the pearls rose, black, white',
        outcome:
          'Nothing. Bram coughs. ‘Rose is everyone else,’ he says gently. ‘When has Char ever let everyone else go first?’ The lock waits, patient as a clam.',
        effects: { trust: -1 },
        artSubject: `${SCYLLA} frowning at a coral chest that stays shut, a rose pearl in the first socket, ${BRAM} leaning on the lid with a sympathetic cough.`,
      },
    ],
  },
  {
    key: '4,5',
    place: 'Festival Eel Globes',
    title: 'The Loose Light',
    speaker: 'Scylla',
    kind: 'monster',
    opening:
      'The Festival Court is lit by glimmer eels in glass globes. One globe has cracked, and its eel, the length of an oar and very frightened, is loose among the rehearsing dancers, crackling blue every time someone shrieks. Which is often. Char has already picked up a lantern net and is grinning the grin that, Scylla remembers, came before most of their childhood scars.',
    artSubject: `A pearl-columned underwater festival court flickering with crackling blue light, an oar-long glowing eel thrashing free of a cracked glass globe among startled dancers in ribbon costumes; ${CHAR} lunges with a lantern net while ${SCYLLA} spreads her arms in front of the dancers.`,
    choices: [
      {
        id: 'care',
        label: 'Hold the dancers back and let Char make the catch',
        outcome:
          'Char nets it on the second lunge and takes a jolt that stands every lace frill on end. She laughs until she hiccups. Scylla keeps her own hands at her sides, which is harder than catching any eel, and Char notices.',
        effects: { trust: 2, danger: 1 },
        artSubject: `${CHAR}, every lace frill standing on end from a blue jolt, laughing with a glowing eel tangled in her net, while ${SCYLLA} shields a cluster of dancers behind her.`,
      },
      {
        id: 'risk',
        label: 'Take the net from Char and do it yourself',
        outcome:
          'Scylla knows how eels turn; she has had years of practice Char hasn’t. The catch is clean. Char, empty-handed, narrows her eyes. ‘Since when are you good at this?’ It is a very good question.',
        effects: { danger: -1, trust: -1 },
        artSubject: `${SCYLLA} sweeping a lantern net neatly around a glowing eel with practised calm, while ${CHAR} floats empty-handed behind her, eyes narrowed.`,
      },
      {
        id: 'call-the-guard',
        label: 'Send a dancer running for the guard',
        outcome:
          'Two guards arrive with a proper net and a sergeant’s whistle, and the eel is safe in a minute. The guards stay longer, admiring the masks, the musicians, and the princesses suspiciously close to both.',
        effects: { supplies: 1, danger: 1 },
        artSubject: `Two armoured palace guards with a long net and a whistle bagging a glowing eel in a festival court, lingering and glancing at ${SCYLLA} and ${CHAR}, who stand too near the musicians’ corner.`,
      },
    ],
  },
  {
    key: '5,5',
    place: 'Festival Bandstand',
    title: 'The Farewell Song',
    speaker: 'Bram Lowry',
    kind: 'memory',
    opening:
      'Under the bandstand canopy, Bram Lowry and two fiddlers are rehearsing the song the crown forbade: the old farewell, sung for anyone who leaves the sea for land. They play it the way people whisper in a library. Char mouths every word. Down the colonnade a guard’s bell marks the patrol’s turn, getting louder. Bram raises an eyebrow. ‘Well, Highness? Verse or silence?’',
    artSubject: `A shell-canopied bandstand in an underwater festival court strung with lanterns and ribbons, ${BRAM} at a drum beside two fiddlers playing softly; ${CHAR} mouths the words beside them while ${SCYLLA} looks down a long pearl colonnade where a guard’s bell-lantern swings closer.`,
    choices: [
      {
        id: 'care',
        label: 'Sing the verse with them',
        outcome:
          'Scylla’s young voice knows the tune better than it should. Char stops mouthing and sings out, loud and delighted, and for one verse the forbidden song fills the court. The patrol’s bell stops at the colonnade. Then, slowly, it moves on. Someone heard, and decided not to have.',
        effects: { trust: 2, danger: 1 },
        artSubject: `${SCYLLA} and ${CHAR} singing side by side under a lantern-hung bandstand, ${BRAM} drumming with a wide grin, a guard’s bell-lantern paused at the far end of the colonnade.`,
      },
      {
        id: 'risk',
        label: 'Stop them before the guards hear',
        outcome:
          'Scylla lays a hand flat on Bram’s drum and the fiddles stop mid-phrase. The patrol drifts past, bored, none the wiser. ‘You sounded exactly like Mother just then,’ says Char, and swims off before Scylla can decide whether that was cruel.',
        effects: { danger: -2, trust: -1 },
        artSubject: `${SCYLLA} pressing her palm flat on a drumhead as two fiddlers lower their bows, ${BRAM} raising his hands, and ${CHAR} swimming away across the lantern-lit court without looking back.`,
      },
    ],
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'Scylla last heard this tune hummed by an older Char on land, over the washing, years from now. This Char is alive and mouthing it off-key on purpose. Scylla lets both be true.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'Scylla thinks of the faces at the stalled train’s windows. Nobody sang them a farewell. Nobody could reach them to.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'A farewell song is for people you know are leaving. Scylla keeps thinking of whoever lived in the yard that was meant to be empty, and how nobody knew to sing them one.',
      },
      {
        flag: 'e05:2,1:care',
        text: 'Char is still smug from the Pearl Stair race, which Scylla ran honestly, and she sings like someone who has never once been told what’s coming.',
      },
      {
        flag: 'e05:2,1:risk',
        text: 'Since the Pearl Stair, Char has been watching Scylla for hints. She watches her now, to see whether the song means something.',
      },
    ],
  },
  {
    key: '6,5',
    place: 'Costume Fin Stall',
    title: 'Plain Grey, Very Plain',
    speaker: 'Hester Mull',
    kind: 'merchant',
    instant: true,
    opening:
      'Hester Mull rents festival fins: gauze extensions, sequinned tail-wraps, a seahorse costume nobody has worn since an incident. ‘Something showy, Highness? The gold, for the procession?’ Scylla’s eye goes to the back of the stall, where two plain grey fin-wraps hang, the colour of nothing at all. Plain, she remembers, is what lets you leave a room without anyone writing it down.',
    artSubject: `A cluttered underwater festival costume stall of gauze fins, sequinned tail-wraps and a faded seahorse costume in pearl lantern light; a stout elderly costumer with spectacles and a pincushion bracelet holds up two drab grey fin-wraps with comic disdain, as ${SCYLLA} offers her a single pearl.`,
    choices: [
      {
        id: 'notice',
        label: 'Trade a loose circlet pearl for the two grey wraps',
        outcome:
          '‘Those?’ Hester holds them up as if they have personally disappointed her. ‘For a princess?’ But she bites the pearl and wraps the grey in gold festival paper. Hester, it turns out, has rented to runaways before.',
        effects: { supplies: 1, trust: 1 },
        artSubject: `A stout elderly costumer with spectacles wrapping two plain grey fin-wraps in shimmering gold paper with a knowing look, ${SCYLLA} watching, a bitten pearl on the counter between them.`,
      },
    ],
  },
  {
    key: '7,5',
    place: 'Moon Post',
    title: 'A Knot You Mean',
    speaker: 'Char',
    kind: 'memory',
    opening:
      'At every festival each royal ties a ribbon to the Moon Post, a promise to be here for the next one. Char ties hers in a slipknot, tugs it loose, ties it again. ‘Comes undone when I’m gone,’ she whispers. ‘Elegant, no?’ The ribbon-keeper is busy with the dancers. Scylla’s own ribbon is in her hand, silver, waiting for her to mean something by it.',
    artSubject: `A tall pearl-inlaid post in a moonlit corner of an underwater festival court, hundreds of tied silk ribbons streaming in the current; ${CHAR} ties a loose slipknot with a wink while ${SCYLLA} holds a silver ribbon, undecided, moonlight slanting down through the water.`,
    choices: [
      {
        id: 'care',
        label: 'Tie yours in a slipknot beside hers',
        outcome:
          'Two slipknots, side by side, ready to slide. Char bumps her shoulder, delighted. Then the ribbon-keeper drifts past, pauses at the post, and frowns at the knots for a long moment before moving on.',
        effects: { trust: 2, danger: 1 },
        artSubject: `Two loose silver and black ribbons knotted side by side on a moonlit post, ${CHAR} bumping shoulders with ${SCYLLA}, and an elderly ribbon-keeper in the background frowning at the knots.`,
      },
      {
        id: 'risk',
        label: 'Tie yours fast and true, a promise to stay',
        outcome:
          'Scylla ties a knot that will outlast the post. Char looks at it, then at her, and says nothing at all, which from Char is a speech. Whatever Scylla does at the gate, someone here will be able to point at this knot.',
        effects: { trust: -1, danger: -1 },
        artSubject: `${SCYLLA} pulling a silver ribbon into a hard, tight knot on a moonlit post while ${CHAR} watches beside her, silent, her own slipknot fluttering.`,
      },
      {
        id: 'tie-for-strangers',
        label: 'Tie a third ribbon, for people you haven’t met yet',
        outcome:
          '‘That’s not how it works,’ says Char. ‘You can’t promise for strangers.’ ‘No,’ says Scylla, and ties it anyway. Char watches the third ribbon lift in the current and, for once, doesn’t make a joke.',
        effects: { evidence: 1, supplies: -1 },
        artSubject: `${SCYLLA} tying a third, plain ribbon beneath two others on a moonlit post, ${CHAR} watching it lift in the current with an unusually serious face.`,
      },
    ],
  },
  {
    key: '8,5',
    place: 'Drift-Night Table',
    title: 'What the Surface Drops',
    speaker: 'Scylla',
    kind: 'memory',
    opening:
      'On festival night the court lays out the year’s drift, everything that sank from the land: a kettle lid, one spectacle lens, a spoon bent into a question. Children dare each other to touch it. At the end of the table, in a clear sleeve that never quite let the water in, lies a photograph. Scylla knows before she lifts it. Only Earth makes queues that orderly, or paper slips that numbered.',
    artSubject: `A long driftwood table in a lantern-lit underwater festival court laid with sunken land objects, a kettle lid, a single spectacle lens, a bent spoon, as small merchildren peer and dare each other; at the end ${SCYLLA} lifts a photograph in a clear plastic sleeve, its image turned away from the viewer.`,
    choices: [],
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'Scylla and Char once stood in queues like that together, on land, sharing one slip and complaining in whispers. Scylla is the only one of them who remembers it now.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'The last people Scylla saw waiting this patiently were behind train glass, under the sea, for a rescue that did not come.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'Scylla wonders, before she can stop herself, whether there is a counter on land where people from a district that was meant to be empty are waiting to be called.',
      },
    ],
  },
  {
    key: '1,6',
    place: 'Observatory Doorframe',
    title: 'High-Water Marks',
    speaker: 'Scylla',
    kind: 'memory',
    instant: true,
    opening:
      'The Tide Observatory’s doorframe is scored with high-water marks, and beside them, smaller scratches: the twins, measured every birthday by the scholar. Char’s mark is always a finger higher, because Char always puffed up her hair. Scylla’s newest scratch reaches her shoulder now. Her older self knows exactly how tall they will both get, and it is strange to be waiting for it again.',
    artSubject: `The carved coral doorframe of an underwater tide observatory scored with high-water lines and small childhood height scratches, lit green by glass dials inside; ${SCYLLA} stands with her back to the frame as ${CHAR} reaches over her head with a shell to scratch a mark.`,
    choices: [
      {
        id: 'notice',
        label: 'Stand against the marks',
        outcome:
          'She lines her back up with the frame. She is exactly as tall as she was three days before they left, which is to say, not very. Char, passing, scratches a new mark a finger above Scylla’s head without asking and keeps swimming.',
        effects: { trust: 1 },
        artSubject: `${CHAR} swimming past and scratching a cheeky mark high above the head of ${SCYLLA}, who stands very straight against a scored coral doorframe, trying not to smile.`,
      },
    ],
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'Every scratch on this frame is a year Char got to have. Scylla knows the number of the rest. She does not count it here.',
      },
    ],
  },
  {
    key: '2,6',
    place: 'Scholar’s Workbench',
    title: 'The Cracked Tide-Glass',
    speaker: 'Scylla',
    kind: 'treasure',
    instant: true,
    opening:
      'On the scholar’s workbench lies a pocket tide-glass, a lens the size of a scallop, rejected for a hairline crack. Through it the water in the room flows a little ahead of itself, showing where the currents will be in the next few minutes. Held up to the door, it shows Char arriving in about four, looking pleased with herself.',
    artSubject: `A cluttered scholar’s workbench in a green-glowing underwater observatory, brass tools and glass dial parts scattered; ${SCYLLA} holds a scallop-sized cracked lens to her eye, and through it a faint ghost of ${CHAR} appears in the empty doorway ahead of time.`,
    choices: [
      {
        id: 'notice',
        label: 'Pocket the cracked tide-glass',
        outcome:
          'It predicts nothing grand: a drifting crumb, a guard’s yawn, which way a ribbon will flutter. But a few minutes’ warning is a few minutes, and Scylla has learned what those are worth. Char arrives four minutes later, extremely pleased with herself, as forecast.',
        effects: { evidence: 1, supplies: 1 },
        artSubject: `${SCYLLA} slipping a small cracked lens into a pouch at her waist as ${CHAR} swims through the observatory doorway looking enormously pleased with herself.`,
      },
    ],
  },
  {
    key: '3,6',
    place: 'Current Dials',
    title: 'Which Way Is Land',
    speaker: 'Scylla',
    kind: 'puzzle',
    opening:
      'Three glass dials show tomorrow’s currents. The conch dial spins clockwise, the whelk dial spins the other way, and the scallop dial lies perfectly still. The scholar’s rule is cut into the rim: clockwise runs out to the deep; widdershins runs home to the palace; the landward tide sleeps until dawn. Scylla needs the landward way.',
    artSubject: `Three large round glass dials in a brass rim inside a green-glowing underwater observatory, one swirling clockwise, one swirling the opposite way, one perfectly still with a sleeping pearl at its centre; ${SCYLLA} leans close, a finger tracing the carved rim; no legible writing.`,
    choices: [
      {
        id: 'care',
        label: 'Study the still scallop dial',
        outcome:
          'Still now, but marked to wake each dawn and run hard toward the hidden gate for less than an hour. Scylla counts forward to the third night and traces that dawn’s hour onto her palm. It is the hour she remembers. That is either a comfort or the worst thing she has learned all day.',
        effects: { evidence: 2 },
        artSubject: `${SCYLLA} bent over a still glass dial whose sleeping pearl has begun to glow at one edge, tracing a line on her own palm with a fingertip.`,
      },
      {
        id: 'risk',
        label: 'Study the clockwise conch dial',
        outcome:
          'Scylla follows its spin to a current that runs straight out to the deep, where nobody escapes to anything. She loses half an hour and a little nerve before she rereads the rim.',
        effects: { danger: 1 },
        artSubject: `${SCYLLA} staring into a clockwise-swirling glass dial that pulls down into dark blue depths, her reflection small and uneasy on the glass.`,
      },
      {
        id: 'whelk',
        label: 'Study the widdershins whelk dial',
        outcome:
          'It curls neatly back to the palace kitchens: ideal for anyone fleeing to breakfast. Scylla rereads the rim and feels exactly as young as she looks.',
        effects: { supplies: -1 },
        artSubject: `${SCYLLA} rubbing her forehead beside a glass dial whose current curls back toward a tiny glowing model of palace kitchens.`,
      },
    ],
  },
  {
    key: '4,6',
    place: 'Intake Grate',
    title: 'The Glass Throat',
    speaker: 'Scylla',
    kind: 'dungeon',
    opening:
      'The observatory drinks the sea through an intake shaft the scholars call the glass throat; its draw is what turns the dials. Pinned against the grate is a nursery hermit crab in a borrowed thimble, too small to swim free. Scylla’s older mind knows exactly how to cross a current like this. Her younger fins, it turns out, have not been told. Below the grate the shaft drops into the palace’s old service tunnels, where the whole sea-works breathes.',
    artSubject: `A dim, green-lit shaft in an underwater observatory where a great round glass-and-brass intake grate drags a visible streaming current; a tiny hermit crab in a silver thimble is pinned against the bars as ${SCYLLA} braces one hand on a brass rail and reaches against the pull.`,
    choices: [
      {
        id: 'care',
        label: 'Fight the draw and pull the crab free',
        outcome:
          'The current takes her tail out from under her twice. The third time she gets two fingers under the thimble and comes away scraped, shaking and holding a very offended crab. It pinches her, which she decides to count as thanks.',
        effects: { trust: 1, danger: 1 },
        artSubject: `${SCYLLA}, hair streaming sideways in a hard current, clinging to a brass rail with one hand and cradling a tiny thimble-shelled crab that pinches her finger with the other.`,
      },
      {
        id: 'risk',
        label: 'Shut the intake valve',
        outcome:
          'The draw dies and the crab toddles free. So does every dial in the building: they wind down to a stop. For an hour the Tide Observatory cannot see tomorrow, and the scholar’s apprentices come swimming to ask who did it.',
        effects: { danger: -1, evidence: -1 },
        artSubject: `${SCYLLA} hauling a big brass valve wheel shut as a tiny crab wanders free of a still grate, and through an archway behind her the great glass dials slow to a halt.`,
      },
    ],
  },
  {
    key: '5,6',
    place: 'Tide Table Desk',
    title: 'Twice Counted, Once Weighed',
    speaker: 'Oren Pike',
    kind: 'companion',
    opening:
      'Oren Pike fills the observatory’s reading desk, hood on as always, axe propped against a chart of tomorrow, copying tide tables into a ledger in a hand so neat it looks printed. He has counted the hours to the landward tide twice. ‘I file nothing until both Highnesses approve it,’ he says. ‘Princess Char has approved nothing. She says she is improvising.’',
    artSubject: `${OREN} hunches over a brass reading desk in a green-glowing underwater observatory, copying tide tables into a ledger, while ${SCYLLA} stands beside the desk; no legible writing.`,
    choices: [
      {
        id: 'care',
        label: 'Tell him to wait for Char’s approval',
        outcome:
          'Oren nods once and leaves Char’s line in the ledger blank, somehow respectfully. ‘Then we improvise,’ he says, as if the word tastes of sand. He packs two more coils of rope against the possibility.',
        effects: { trust: 2, supplies: -1 },
        artSubject: `${OREN} closing a ledger with great care and lifting two coils of rope from a shelf, while ${SCYLLA} watches with relief.`,
      },
      {
        id: 'risk',
        label: 'Give him the departure hour yourself',
        outcome:
          'Scylla names the hour she remembers, to the minute. Oren writes it down, then studies her through the eyeholes for a long, quiet count. ‘Princess Char will ask where that came from.’ He files it, and does not offer to lie for her.',
        effects: { evidence: 1, supplies: 1, trust: -1 },
        artSubject: `${OREN} pausing with his pen above a ledger, hooded head turned toward ${SCYLLA}, who stands very straight beside the desk; no legible writing.`,
      },
    ],
    echoes: [
      {
        flag: 'e05:4,4:care',
        text: 'There are three packs in Oren’s ledger now. He has written the third one very small, as if it might be confiscated for impertinence.',
      },
      {
        flag: 'e05:4,4:risk',
        text: 'Char’s pack is listed in Oren’s ledger at a weight that is not the weight he packed. Beside it he has drawn one small, neat question mark, and nothing else.',
      },
    ],
  },
  {
    key: '6,6',
    place: 'Tomorrow Dials',
    title: 'A Tide Not Yet Born',
    speaker: 'Wenna Brack',
    kind: 'memory',
    opening:
      'The great dials show tomorrow, and Wenna Brack, the tidal scholar, has been frowning at one of them since breakfast. At its edge the glass is folded, as if a sea very far off were pushing back. ‘That isn’t a tide,’ she says. ‘It’s a scar. Something hasn’t happened yet, and the water already flinches.’ She glances at Scylla, who has gone very still.',
    artSubject: `A vaulted underwater tide observatory of great round glass dials swirling with green-gold currents set in brass, one dial’s edge creased like folded glass; ${WENNA} frowns at the crease through her loupe while ${SCYLLA} goes very still beside her.`,
    choices: [
      {
        id: 'care',
        label: 'Tell Wenna what you remember of the tide gate',
        outcome:
          'Wenna listens like a scientist: no gasps, many questions, three pages of notes. She believes the data. She believes Scylla, which is rarer. ‘I’ll have to record this,’ she says, apologetic, ‘and records get read.’ The court now has one more document about the princesses.',
        effects: { evidence: 2, trust: 1, danger: 1 },
        artSubject: `${WENNA} writing quickly in a notebook by the creased dial, loupe pushed up on her forehead, as ${SCYLLA} talks with her hands, describing a gate and a flood; no legible writing.`,
      },
      {
        id: 'risk',
        label: 'Nudge the dials yourself while she isn’t looking',
        outcome:
          'One turn of a brass screw and the fold smooths out; the dial shows a calm tomorrow. Wenna looks back, blinks, and spends the next hour rechecking instruments she built herself, quietly, as if she has started to doubt her own eyes.',
        effects: { danger: -2, trust: -1, evidence: -1 },
        artSubject: `${SCYLLA} turning a small brass screw at the rim of a glass dial while ${WENNA}, in the background, has her back turned over a desk of instruments.`,
      },
    ],
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'Scylla knows that fold. It is the shape the sea made when the gate opened and came down on her sister. She would know it on any glass.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'The fold is lit faintly from inside, like train windows under water. Scylla knows who is behind them, and that they are still waiting.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'The fold runs down one side of the dial and pools in a corner, like a surge turned into a yard everyone swore was empty.',
      },
    ],
  },
  {
    key: '7,6',
    place: 'Observatory Dome',
    title: 'What Land Smells Like',
    speaker: 'Char',
    kind: 'memory',
    opening:
      'On the observatory dome, where the water thins and the moon is a wobbling coin far above, Char lies on her back with her tail hooked over the rail. ‘What do you think land smells like? Oren says wet dog. Bram says regret.’ Scylla knows: rain on hot stone, bread, burnt coffee, salt that isn’t the sea. Char is watching her mouth, waiting.',
    artSubject: `Atop a glass observatory dome deep underwater, a wobbling moon shining far above through the water; ${CHAR} lies back with her tail hooked over a brass rail while ${SCYLLA} sits beside her, looking up, moonlight rippling over both.`,
    choices: [
      {
        id: 'care',
        label: 'Let her guess first, then guess along with her',
        outcome:
          '‘Oranges,’ says Char. ‘Something called toast.’ Scylla agrees with every guess and adds a wrong one, wild garlic, to be fair. They stay out long past the patrol, laughing, and get caught sneaking down. Worth it, says Char. Scylla agrees.',
        effects: { trust: 2, danger: 1 },
        artSubject: `${CHAR} and ${SCYLLA} lying side by side on a moonlit observatory dome, laughing, while far below a guard’s lantern swings up the stair toward them.`,
      },
      {
        id: 'risk',
        label: 'Tell her exactly, as if you’d been',
        outcome:
          'Scylla says rain, bread, burnt coffee, and stops too late. Char sits up. ‘That’s specific.’ She doesn’t press. She files it in the look she gives Scylla, the one that means later, and the moon wobbles between them.',
        effects: { evidence: 1, trust: -1 },
        artSubject: `${CHAR} sitting up sharply on a moonlit observatory dome, studying ${SCYLLA}, who has one hand halfway to her own mouth.`,
      },
    ],
    echoes: [
      {
        flag: 'e05:2,1:care',
        text: 'Char is still bragging about the Pearl Stair race. It was honest, she says, which is how she knows she won it.',
      },
      {
        flag: 'e05:2,1:risk',
        text: 'Since Scylla stopped on the Pearl Stair and hinted, Char has asked her small, sideways questions. This is the biggest one yet, dressed up as a small one.',
      },
      {
        flag: 'e05:5,5:care',
        text: 'Char is humming the farewell song, the verse Scylla sang with her. She doesn’t seem to know she’s doing it.',
      },
      {
        flag: 'e05:5,5:risk',
        text: 'Char hasn’t hummed a note since the bandstand. The quiet up here has a shape, and the shape is Mother.',
      },
    ],
  },
  {
    key: '8,6',
    place: 'Observatory Mirror',
    title: 'A Breath Behind',
    speaker: 'Scylla',
    kind: 'memory',
    instant: true,
    opening:
      'At the far end of the observatory hangs a mirror so tide-worn that reflections reach it a breath late. Scylla turns her head; the girl in the glass turns hers a moment after. And in that late moment the young face wears an expression Scylla knows from years ahead: older around the eyes, braced, as if for a gate.',
    artSubject: `A tall, tide-worn mirror with a clouded silver surface in a dim green corner of an underwater observatory; ${SCYLLA} has turned her head away, while her reflection, a breath behind, still faces the viewer with a tired, braced, much older expression.`,
    choices: [
      {
        id: 'notice',
        label: 'Wait for the reflection to catch up',
        outcome:
          'It catches up. The worried look doesn’t go anywhere; it was never the mirror’s. Scylla straightens her circlet, practises Char’s sardonic grin, gets it badly wrong, and laughs at herself, which the mirror shows her a breath later, kindly.',
        effects: { evidence: 1 },
        artSubject: `${SCYLLA} attempting a crooked, unconvincing sardonic grin at a tide-worn mirror and dissolving into laughter, her reflection a breath behind, still mid-grin.`,
      },
    ],
    echoes: [
      {
        flag: 'e05:6,6:care',
        text: 'Wenna believed her. In the late glass, for one breath, Scylla looks like someone who has been believed.',
      },
      {
        flag: 'e05:6,6:risk',
        text: 'Behind her in the glass, a breath late, Wenna is still rechecking the dial Scylla nudged. The mirror lets Scylla watch it twice.',
      },
    ],
  },
]
