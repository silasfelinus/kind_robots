import type { MorrowShiftSite } from '../morrowShift/types'

/**
 * e05 "Scylla's Shore", rows 1–2: the Pearl Stair and the Council Gallery
 * of the sea palace, three days before the sisters first ran away to land.
 * Anchors here: 2,1 (the Pearl Stair race) and 4,2 (the reform petition).
 * 3,1 is a fixed Chronicle photograph site, "A Very Formal Postcard".
 */
export const SCYLLAS_SHORE_ROWS_1_2: readonly MorrowShiftSite[] = [
  {
    key: '1,1',
    place: 'Foot of the Pearl Stair',
    title: 'Char Calls from Above',
    speaker: 'Char',
    kind: 'memory',
    opening:
      'Scylla wakes face-down on the fourth step of the Pearl Stair, her circlet knotted into her hair the way it always was when she was young enough to fall asleep on stairs. The tide-clock in the wall says three days to the new moon: three days to the road to land. From the top, a voice she has not heard this young in years: ‘Your Properness! Dead, or just being dramatic? The tide’s coming.’',
    artSubject:
      'The foot of a spiralling staircase of pale pearl inside a luminous underwater palace, green-gold light falling down the stairwell from far above; a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze lifts her head from a step, the circlet tangled in her hair; high above, leaning over the rail, a small figure with dark violet scales and black lace calls down; a round tidal clock of glass dials is set into the wall',
    choices: [
      {
        id: 'care',
        label: 'Call back as if it’s any morning',
        outcome:
          '‘Dramatic,’ Scylla calls, and her voice comes out high and ordinary. Char laughs, the real laugh, and the sound goes through Scylla like cold water. She climbs. She does not let her hands shake until Char has turned away.',
        effects: { danger: -1 },
        artSubject:
          'A young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze swims up a pearl staircase with one hand on the rail, smiling upward with effort, her other hand clenched at her side; above, her identical twin with dark violet scales, black lace and a sardonic grin is already turning away, laughing; shafts of light through water',
      },
      {
        id: 'risk',
        label: 'Swim straight up and hold her',
        outcome:
          'Scylla reaches the top in four strokes and holds on far too hard. Char goes stiff, then pats her back twice, the way you soothe a jellyfish. ‘Bad dream?’ She files the hug away. Char notices things. She will notice the next one too.',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'At the top landing of a pearl staircase underwater, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze hugs her identical twin with dark violet scales, black lace and a sardonic grin, who stands stiff with surprise and pats her back awkwardly; bubbles drifting up, luminous pearl walls',
      },
      {
        id: 'read-the-clock',
        label: 'Untangle the circlet and read the tide-clock first',
        outcome:
          'Three days, six tides, the guard change at the second bell. Scylla knows this clock; she knows how much time it has left. Char comes down to fetch her, unimpressed. ‘You were counting. You’re always counting.’',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'A young mermaid princess with a pearl circlet in her hand and pale aquamarine scales studies a round tidal clock of nested glass dials set in a pearl wall, her older, worried gaze fixed on a slow pearl hand; behind her on the stair, her twin with dark violet scales and black lace hangs upside down from the rail, arms folded, grinning',
      },
    ],
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'The last time Scylla heard Char’s voice, it was saying her name under a great deal of water. This one is saying it with its mouth full of breakfast.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'Scylla left an older Char alive. She also left a train of strangers under the sea, palms to the glass, and the tide coming up the stair sounds like their knocking.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'Somewhere in a future city, a district that was meant to be empty is full of water. Scylla still does not know whose name was on a door there. Char calls again, as if nothing was ever traded for her.',
      },
    ],
  },
  {
    key: '2,1',
    place: 'The Racing Step',
    title: 'Race the Tide',
    speaker: 'Char',
    kind: 'companion',
    opening:
      'Char is crouched on the racing step, tail coiled, while the flood tide booms below like a door being tried. ‘Usual rules. Loser carries the boots.’ The boots are their secret; so is the road. Scylla has run this race a hundred times. She remembers this exact one: Char won by a fin. She also remembers where the road goes after.',
    artSubject:
      'A broad pearl landing on a spiral staircase in an underwater palace, a white surge of incoming tide foaming up the steps below; a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze hesitates at the starting line beside her identical twin with dark violet scales, black lace and a sardonic grin, crouched and coiled to spring; glowing lamp-jars along the rail',
    choices: [
      {
        id: 'care',
        label: 'Race her honestly and say nothing of the future',
        outcome:
          'They go up in a white roar of tide, elbows and laughter, and Char wins by a fin, exactly as before. The memory and the morning lie on top of each other and match. Char crows. Nothing has been changed yet, which is the gift and the problem.',
        effects: { trust: 2, evidence: -1 },
        artSubject:
          'Two identical young mermaid princesses race up a pearl spiral staircase just ahead of a foaming surge of tide, the one with dark violet scales and black lace a fin-length ahead and laughing, the one with a pearl circlet and pale aquamarine scales reaching after her with a smile that is almost grief; bubbles and light everywhere',
      },
      {
        id: 'risk',
        label: 'Stop on the stairs and hint at what’s coming',
        outcome:
          'Scylla stops halfway, and the tide slaps her into the rail. ‘What if land isn’t what we think?’ Char looks down from three steps up, frowning their mother’s frown. ‘Then we find out. That’s what land is for.’ She wins by a whole stair, and keeps glancing back all morning.',
        effects: { evidence: 1, trust: -1, danger: 1 },
        artSubject:
          'Halfway up a pearl staircase underwater, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze clings to the rail as surging tide breaks around her; three steps above, her identical twin with dark violet scales and black lace looks back over her shoulder with a hard little frown',
      },
    ],
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'The last time the two of them raced a tide, Char lost. Scylla does not know yet what to do with her hands.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'Below, the flood knocks at the stair’s lower doors, and Scylla hears a carriage of strangers knocking on glass. Char only hears a starting gun.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'The tide always fills the empty service rooms at the bottom of the stair first. In all these years, Scylla has never once checked that they are empty.',
      },
    ],
  },
  {
    key: '3,1',
    place: 'The Wrack Step',
    title: 'Drift from the Dry World',
    speaker: 'Scylla',
    kind: 'memory',
    opening:
      'Where the tide turns, the Pearl Stair keeps what it brings: a cup of broken shell, a ribbon, once a whole lost harp. This morning the wrack step holds a flat packet sealed in wax and dry inside, which nothing from the sea ever is. Scylla knows the paper before she opens it. It smells of rain on pavements, and of a country that puts stamps on things.',
    artSubject:
      'A curved pearl step heaped with tide-wrack in an underwater palace stairwell: broken shells, a faded ribbon, a small wax-sealed paper packet; a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze kneels over the packet with both hands, shafts of green-gold light from above, a tidal clock glimmering in the wall behind her',
    choices: [],
  },
  {
    key: '4,1',
    place: 'Lamp Niche Landing',
    title: 'The Glimmer Eel',
    speaker: 'Scylla',
    kind: 'monster',
    opening:
      'Halfway up, the stair lamps have gone dark one by one, and in the last lit niche something long and pale is eating the light. The glimmer eel has nested here since before the sisters were born. It bites anything that shines, and it has never once let go. Scylla’s circlet is shining. So, unfortunately, are her scales.',
    artSubject:
      'A dim landing on a pearl staircase underwater, a row of dead lamp-jars along the wall and one still glowing, a long pale luminous eel coiled around it with its jaws open on the light; a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze pressed against the rail below, her circlet catching the glow',
    choices: [
      {
        id: 'care',
        label: 'Hide the circlet and climb past in the dark',
        outcome:
          'She wraps the circlet in her sleeve and climbs blind, counting steps, a hand on the cold rail. The eel tastes the water an inch from her ear and loses interest. At the next landing a pearl is missing from the circlet, somewhere on the stair behind her.',
        effects: { danger: -1, supplies: -1 },
        artSubject:
          'Near darkness on a pearl staircase, a young mermaid princess with pale aquamarine scales and an older, worried gaze climbs with eyes shut, one hand on the rail and a bundled sleeve held to her chest, a pale eel’s head hovering close beside her ear in the faint light',
      },
      {
        id: 'risk',
        label: 'Flash the circlet in its eyes and dart by',
        outcome:
          'The eel strikes at its own reflection, and keeps striking, while she goes by. It takes a nip of tail-fin as toll. Up the stair someone whistles: Char, who saw the whole thing and will tell it at supper with improvements.',
        effects: { danger: 1, trust: 1 },
        artSubject:
          'A young mermaid princess with pale aquamarine scales and an older, worried gaze holds her pearl circlet out like a mirror into a glowing niche as a pale eel lunges at its reflection, while she darts past; at the top of the frame her twin with dark violet scales and black lace whistles with two fingers',
      },
      {
        id: 'wake-the-lamp',
        label: 'Shake the dim lamp below awake to lure it down',
        outcome:
          'The glow-shrimp in the lower jar wake up indignant and bright. The eel pours down toward them like spilled milk and coils there, content. Scylla goes up through the dark it left. The lower stair is the eel’s now, and the servants who use it at dawn will have to be told.',
        effects: { evidence: 1, danger: 1 },
        artSubject:
          'A young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze shakes a lamp-jar of glowing shrimp on a lower step while a long pale eel uncoils from a niche above and streams down toward the new light',
      },
    ],
  },
  {
    key: '5,1',
    place: 'Riddle Landing',
    title: 'Char’s Riddle',
    speaker: 'Char',
    kind: 'puzzle',
    opening:
      'Three shell niches at the turn of the stair: coral, pearl and abalone. Char has hidden today’s route map in one and chalked on the step: ‘Not where the eel goes. Not where Her Properness would put it.’ A pale eel’s tail drapes out of the abalone niche. Scylla has put things in the pearl niche every time since she could reach it.',
    artSubject:
      'A turning landing on a pearl staircase underwater with three shell-lined niches in the wall, one of red coral, one of pearl, one of iridescent abalone with a pale eel’s tail hanging out of it; chalked writing smudged on the step; a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze considers them with a finger to her lips',
    choices: [
      {
        id: 'care',
        label: 'Reach into the pearl niche',
        outcome:
          'One slip of kelp-paper: ‘PREDICTABLE.’ Char’s writing, with a drawing of Scylla in an enormous crown. Scylla laughs before she remembers to be sad, and by then the tide has come up to the landing.',
        effects: { danger: 1 },
        artSubject:
          'A young mermaid princess with a pearl circlet and pale aquamarine scales holds up a slip of kelp-paper bearing a cartoon of a girl in a huge crown, laughing helplessly, as foaming tide rises over the step behind her',
      },
      {
        id: 'risk',
        label: 'Reach into the abalone niche',
        outcome:
          'The eel’s tail is not spare. It is attached to the eel. Scylla gets her hand back, and most of her sleeve, and a lesson Char will deny arranging.',
        effects: { danger: 1, supplies: -1 },
        artSubject:
          'A young mermaid princess with a pearl circlet and pale aquamarine scales yanks her hand out of an abalone niche, a torn sleeve trailing, as a pale eel’s offended head emerges after it',
      },
      {
        id: 'coral-niche',
        label: 'Reach into the coral niche',
        outcome:
          'The map is rolled in the coral, tied with Char’s black ribbon: the whole route to the Landward Gate in a fearless, crooked hand. Scylla has travelled it. She did not know, the first time, that Char drew it alone.',
        effects: { evidence: 2 },
        artSubject:
          'A young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze unrolls a hand-drawn map tied with black ribbon beside a red coral niche, a crooked inked route running across it to a gate',
      },
    ],
  },
  {
    key: '6,1',
    place: 'Fin-Rack Landing',
    title: 'Borrowed Fins',
    speaker: 'Scylla',
    kind: 'treasure',
    instant: true,
    opening:
      'On the rack where the sisters hang their racing fin-sheaths, Scylla’s good pair is missing and a scruffy black-dyed pair hangs in its place. The good pair is in Char’s cubby, as it has been for a year, with a note pinned through the strap: ‘borrowed. permanently. love, the better racer.’',
    artSubject:
      'A carved pearl rack on a staircase landing underwater, hung with translucent racing fin-sheaths, one scruffy black-dyed pair conspicuous among them; a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze reads a note pinned to a strap in a cubby crammed with black lace and odds and ends',
    choices: [
      {
        id: 'notice',
        label: 'Pack the black pair for the road',
        outcome:
          'They are mended in four places with Char’s enormous stitches and fit better than they should. Scylla writes underneath the note: ‘borrowed back. love, the faster one.’ She is grinning for nearly a minute before she notices.',
        effects: { supplies: 1 },
        artSubject:
          'A young mermaid princess with a pearl circlet and pale aquamarine scales, grinning, folds a pair of black fin-sheaths with huge clumsy stitches into a satchel while writing on a pinned note with a stick of chalk',
      },
    ],
    echoes: [
      {
        flag: 'e05:2,1:care',
        text: 'Char won this morning’s race. The note somehow reads smugger for it.',
      },
      {
        flag: 'e05:2,1:risk',
        text: 'Under the note is a newer one: ‘what aren’t you telling me.’ No question mark. Char never uses them.',
      },
    ],
  },
  {
    key: '7,1',
    place: 'Moonlit Landing',
    title: 'Oren Measures the Tide',
    speaker: 'Oren Pike',
    kind: 'companion',
    opening:
      'Near the top, moonlight comes down the stair-shaft like a ribbon, and Oren Pike is knotting a long cord in it. Hood, axe, wax tablet; he measures how high the tide climbs each night and writes it down twice. ‘Princess.’ He doesn’t say which knots are for what. Scylla has read his manifests. Years from now, but she has.',
    artSubject:
      'A ribbon of moonlight falling down a pearl stair-shaft underwater onto a landing where a very tall, broad hooded headsman, his whole head covered by a rough brown cloth hood with two eyeholes, a heavy axe at his side, knots a long measuring cord against the wall beside a wax tablet; a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze watches from the steps',
    choices: [
      {
        id: 'care',
        label: 'Hold the cord and count the knots with him',
        outcome:
          'They count together, low, to forty-one. Oren writes it twice. ‘Your sister counts to forty and calls it enough,’ he says. ‘You count to forty-one.’ It is the nearest he comes to a question, and he lets her not answer.',
        effects: { trust: 1, evidence: 1 },
        artSubject:
          'In a shaft of moonlight underwater, a hooded headsman and a young mermaid princess with a pearl circlet and pale aquamarine scales hold a long knotted cord between them, counting, his huge hand marking a knot, her lips moving',
      },
      {
        id: 'risk',
        label: 'Ask him what Char asked him to measure',
        outcome:
          'Oren winds the cord around his wrist. ‘Ask her.’ Then, because he is kind and cannot help it: ‘The landward tide is highest the third night. Nobody leaves on the third night if they can count.’ Scylla can count. She remembers leaving on the third night anyway.',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'A hooded headsman with an axe at his side slowly winds a knotted cord around his wrist, his eyeholes turned toward a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze, moonlight between them',
      },
    ],
    echoes: [
      {
        flag: 'e05:2,1:care',
        text: '‘Heard you lost the race,’ Oren says. ‘By a fin.’ Somewhere under the hood, he is smiling.',
      },
      {
        flag: 'e05:2,1:risk',
        text: '‘Your sister came by,’ Oren says. ‘Asked what you’d asked me. I told her you hadn’t.’ He waits to learn whether that was right.',
      },
    ],
  },
  {
    key: '8,1',
    place: 'Top of the Pearl Stair',
    title: 'The Tide-Worn Mirror',
    speaker: 'Scylla',
    kind: 'memory',
    instant: true,
    opening:
      'At the top step, where the stair breaks into the dry air of the sea-cave, an old mirror has been scrubbed by so many tides that it shows faces softly, the way grandmothers do. The young princess in it has Scylla’s circlet and Scylla’s scales. The eyes are older. They have been somewhere.',
    artSubject:
      'The top of a pearl staircase emerging from water into a moonlit sea-cave, a tall old mirror with a tide-scoured cloudy surface in a shell frame; a young mermaid princess with a pearl circlet and pale aquamarine scales rests her arms on the top step and gazes at her reflection, whose eyes look older and more worried than her face',
    choices: [
      {
        id: 'notice',
        label: 'Look until the reflection blinks first',
        outcome:
          'It never does. Scylla straightens her circlet, and the reflection follows a breath late, as if it had to remember how. Behind her in the glass: the dark stair, and the sound of the tide coming up it.',
        effects: { evidence: 1 },
        artSubject:
          'Close view of a cloudy tide-worn mirror in which a young mermaid princess with a pearl circlet adjusts it a moment out of step with her own hand, the dark spiral stair behind her in the glass',
      },
    ],
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'She has seen eyes like these once before: on an older Char, at the tide gate, the moment before the water. They were looking at Scylla.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'Behind her reflection the glass goes faintly bright in rows, like the lit windows of a stalled train. When she turns, it is only the stair-lamps.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'In the corner of the glass, where the tide has worn it thinnest, there is a doorway that is not on this stair: low, plain, a service door. Scylla looks for a name on it. There isn’t one.',
      },
    ],
  },
  {
    key: '1,2',
    place: 'Coronet Cabinet',
    title: 'Tangled Coronets',
    speaker: 'Scylla',
    kind: 'treasure',
    instant: true,
    opening:
      'At the Council Gallery’s door stands the cabinet of children’s coronets, every princess’s first crown on its hook, tangled together by a hundred years of tides. Scylla’s is easy to find; it is polished. Char’s is bent into the shape of a fish-hook, the work of one afternoon and one very bored seven-year-old.',
    artSubject:
      'A tall glass-fronted cabinet at the entrance of a luminous underwater portrait gallery, crowded with dozens of tiny tarnished coronets tangled together on hooks; a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze works two of them free, one polished, one bent like a fish-hook',
    choices: [
      {
        id: 'notice',
        label: 'Work the two coronets free together',
        outcome:
          'It takes patience and both hands. When they part, a black pearl drops out of Char’s, hidden there at seven: savings, for running away. Even then. Scylla pockets it to give back at the right moment, a phrase she has started to distrust.',
        effects: { supplies: 1 },
        artSubject:
          'Close view of a young mermaid princess’s hands untangling a polished child’s coronet from a bent one, a single black pearl falling from the bent one and drifting through the water, pearl gallery light',
      },
    ],
  },
  {
    key: '2,2',
    place: 'The Twins’ Portrait',
    title: 'Looking for the Crack',
    speaker: 'Char',
    kind: 'memory',
    opening:
      'The newest portrait in the gallery shows both princesses smiling, painted last spring, so alike the painter charged double. Scylla has stopped in front of it four times. ‘You keep looking for a crack in the paint,’ Char says, sucking a sea-sweet. ‘There isn’t one. I checked. I was going to put one there.’',
    artSubject:
      'A long luminous underwater gallery hung with portraits of crowned queens; in front of a fresh portrait of two identical smiling girls, one in pearls, one in black lace, a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze searches the paint, while her identical twin with dark violet scales, black lace and a sardonic grin leans on the frame sucking a sweet',
    choices: [
      {
        id: 'care',
        label: 'Tell her you’re memorising it',
        outcome:
          '‘In case we never come back,’ Scylla says, which is true in more ways than she can afford. Char considers it, then stands where the painter stood and stares too. ‘Fine. Memorising.’ They stay until a guard coughs.',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'Two identical young mermaid princesses, one with a pearl circlet and pale aquamarine scales, one with dark violet scales and black lace, float side by side in silence before their own smiling portrait, a guard in shell armour clearing his throat in the background',
      },
      {
        id: 'risk',
        label: 'Ask what she’d paint over, if she could',
        outcome:
          'Char doesn’t hesitate: ‘The crowns. Mine, anyway. You’d keep yours.’ A sideways look. ‘Unless you wouldn’t. You’ve been weird for a day.’ Scylla learns something true about the girl Char was before the road, and gives away something of her own.',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'A young mermaid princess with dark violet scales, black lace and a sardonic grin points a sea-sweet at the painted crown in a portrait while giving her pearl-circleted twin with pale aquamarine scales a sharp sideways look',
      },
    ],
    echoes: [
      {
        flag: 'e05:2,1:care',
        text: 'Char still smells of race-tide and victory. She has not stopped bringing up the fin.',
      },
      {
        flag: 'e05:2,1:risk',
        text: 'She is watching Scylla, not the painting. ‘You stopped on the stair,’ she says. ‘You never stop.’',
      },
    ],
  },
  {
    key: '3,2',
    place: 'Pearl-Lock Chest',
    title: 'Something for Something',
    speaker: 'Mrs Pilchard',
    kind: 'merchant',
    instant: true,
    opening:
      'Mrs Pilchard, the gallery attendant, sits on the pearl-lock chest where everything left under the portraits ends up: gloves, hairpins, a councilor’s spectacles, one confession on a scrap. She doesn’t sell. She swaps. ‘Something for something, Highness. The queens like the place kept even.’',
    artSubject:
      'A stout elderly mer-woman attendant with a ring of keys sits on a heavy chest sealed with a great pearl lock in an alcove of an underwater portrait gallery, its open lid spilling gloves, hairpins and spectacles; a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze holds out a hairpin',
    choices: [
      {
        id: 'notice',
        label: 'Swap your second-best hairpin for whatever’s on top',
        outcome:
          'On top is a pair of sealskin boot-laces, landward work, coiled as if waiting. Mrs Pilchard tests the hairpin on her teeth and says nothing about boots, laces, or why a princess with a tail might want either.',
        effects: { supplies: 1 },
        artSubject:
          'An elderly attendant bites a pearl hairpin to test it while a young mermaid princess with a pearl circlet and pale aquamarine scales tucks a coil of sealskin boot-laces into her sleeve, the pearl-lock chest between them',
      },
    ],
  },
  {
    key: '4,2',
    place: 'Petition Lectern',
    title: 'The Reform Petition',
    speaker: 'Councilor Neve Salter',
    kind: 'memory',
    opening:
      'Under the sternest queen in the gallery, Councilor Neve Salter has set up a lectern and a petition: that princesses of the sea may choose their own marriages and travel where they please. Eleven signatures and a fish-shaped inkblot. ‘It won’t pass,’ she says cheerfully. ‘But the portraits hear who signs, and portraits outlast queens.’ Char’s name is not on it.',
    artSubject:
      'Beneath a towering portrait of a severe crowned queen in a luminous underwater gallery, a brisk middle-aged councilor with ink-stained fingers and spectacles stands at a lectern holding a petition scroll with a few signatures and an inkblot; a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze holds a quill above it',
    choices: [
      {
        id: 'care',
        label: 'Sign it openly, in your own name',
        outcome:
          'Scylla signs in her best court hand, large enough for the sternest queen to read. Salter beams; a page boy runs to tell someone. By supper Mother will know, and so will Char, who can decide for herself what Scylla’s name beside an empty space means.',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'A young mermaid princess with a pearl circlet and pale aquamarine scales signs a petition in large flowing letters at a lectern while a delighted councilor claps once and a small page boy darts off down the portrait gallery',
      },
      {
        id: 'risk',
        label: 'Sign it with Char’s name too, without asking her',
        outcome:
          'Scylla writes both names, Char’s in a fair copy of her crooked hand. Salter hesitates, then blots it. To the portraits it is twice as loud. It is also the first thing in this life Scylla has decided for her sister, and she knows it before the ink is dry.',
        effects: { evidence: 2, trust: -1, danger: 1 },
        artSubject:
          'A young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze carefully forges a second, crooked signature beneath her own on a petition, while a councilor in spectacles watches with a hesitating blotter in hand',
      },
    ],
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'Salter has left a space at the bottom for Char. Scylla looks at it longer than she means to.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'One clause says no door of the realm may be sealed against anyone drowning behind it. Scylla reads it twice.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'The petition has a second page: complaints from the service wards about flooding in rooms the council lists as empty.',
      },
    ],
  },
  {
    key: '5,2',
    place: 'The Young Queen’s Portrait',
    title: 'The Portrait Repeats',
    speaker: 'Scylla',
    kind: 'memory',
    opening:
      'The portraits hear every word said beneath them; everyone knows that, and nobody is rude in the gallery. But the portrait of Mother as a girl is murmuring, and the voice is Scylla’s own, grown-up and hoarse, saying words she has not said yet in this life. The guards at the far door have not noticed. They will.',
    artSubject:
      'A portrait of a solemn girl-queen in a pearl frame in a luminous underwater gallery, faint ripples spreading from its painted lips as if it speaks; a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze stands very still beneath it, two guards in shell armour distant at the far door',
    choices: [
      {
        id: 'care',
        label: 'Hang your shawl over the frame',
        outcome:
          'The murmuring stops under the wool. Nobody else will hear it, and Scylla will not hear the rest either. She keeps a hand on the frame a moment, as if on a shoulder. It was her best shawl. She will have to explain that, and won’t.',
        effects: { danger: -1, supplies: -1 },
        artSubject:
          'A young mermaid princess with a pearl circlet and pale aquamarine scales drapes a woven sea-green shawl over a gilded portrait frame, one hand resting on the covered frame, the gallery quiet around her',
      },
      {
        id: 'risk',
        label: 'Stand beneath it and hear the rest',
        outcome:
          'Scylla listens to herself to the end. It is worse said slowly. A guard drifts over to see what the princess is staring at, and she tells him the brushwork. He agrees it is very fine brushwork.',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'A young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze stares up at a murmuring portrait with wet eyes, while a puzzled guard in shell armour leans in beside her to admire the paint',
      },
    ],
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: '‘Char. Hold on to me. Char.’ The same words over and over, in the voice Scylla used at the gate.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: '‘Seal it. I said seal it.’ And under that, faintly, a sound like palms on glass.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: '‘Down the depot channel. It’s empty. They said it’s empty.’ The voice is trying very hard to believe it.',
      },
    ],
  },
  {
    key: '6,2',
    place: 'Chamberlain’s Door',
    title: 'The Chamberlain’s Rounds',
    speaker: 'Char',
    kind: 'challenge',
    opening:
      'The gallery tide-clock chimes the quarter, and the Chamberlain’s ringing staff comes down the corridor on his rounds. Char has a satchel over her shoulder that clanks like a departure: lantern, rope, a bag of hard sea-biscuit. ‘Don’t,’ she says, before Scylla can do anything. ‘I’ve got this.’ She almost certainly hasn’t.',
    artSubject:
      'A tall shell-inlaid doorway at the end of an underwater portrait gallery, a pompous elderly chamberlain with a ringing staff of office approaching through it; a young mermaid princess with dark violet scales, black lace and a sardonic grin clutches a lumpy clanking satchel, while her twin with a pearl circlet, pale aquamarine scales and an older, worried gaze hovers at her shoulder',
    choices: [
      {
        id: 'care',
        label: 'Stand beside her and let her do the talking',
        outcome:
          'Char tells the Chamberlain the satchel holds gifts for the coral nursery, in such solemn detail that he thanks her for her charity. He also counts the biscuits. Scylla watches her sister lie beautifully, and is proud, and is frightened.',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'A young mermaid princess with dark violet scales and black lace earnestly explains the contents of her satchel to a stooping chamberlain who peers in and counts biscuits, while her pearl-circleted twin with pale aquamarine scales stands beside her, silent and very straight',
      },
      {
        id: 'risk',
        label: 'Take the satchel and claim it’s yours',
        outcome:
          'The Chamberlain is so astonished that Princess Scylla is carrying rope that he forgets to search it. The satchel is safe. Char is furious, in a whisper, for the length of the gallery: ‘I said I had it.’',
        effects: { danger: -1, trust: -1 },
        artSubject:
          'A young mermaid princess with a pearl circlet and pale aquamarine scales holds a coil of rope up to a flabbergasted chamberlain with a staff, while behind her back her twin with dark violet scales and black lace glares daggers',
      },
      {
        id: 'current-vent',
        label: 'Pull her into the current vent behind the portraits',
        outcome:
          'They wedge into the vent where the gallery breathes out to sea, tail to tail, while the current tries to take them both out of the palace. The Chamberlain passes. The lantern does not survive. ‘That,’ Char gasps, ‘was the best thing all week.’',
        effects: { danger: 1, supplies: -1, trust: 1 },
        artSubject:
          'Two identical young mermaid princesses, one with pale aquamarine scales and a pearl circlet, one with dark violet scales and black lace, wedged laughing in a narrow rushing vent behind a portrait frame, a lantern tumbling away in the current',
      },
    ],
    echoes: [
      {
        flag: 'e05:4,2:care',
        text: 'Scylla’s name is on Salter’s petition. The Chamberlain has heard; all the portraits have. He will look at her first.',
      },
      {
        flag: 'e05:4,2:risk',
        text: 'Char’s name is on Salter’s petition in a hand almost hers. She found out an hour ago. She hasn’t mentioned it, which is how Scylla knows she will.',
      },
    ],
  },
  {
    key: '7,2',
    place: 'Three Queens Alcove',
    title: 'Where the Queens Can’t Tell',
    speaker: 'Char',
    kind: 'puzzle',
    opening:
      'Char needs somewhere to whisper the plan. Three queens hang over the alcove: Ottilie, a conch held to her ear; Brannagh, lips stitched shut with pearl thread; Ise, painted asleep, mouth a little open. The nursery verse: ‘Ears to hear and mouth to tell, a queen needs both to tattle well. The sleeper tells when tides turn round.’ The clock says the tide turns in minutes.',
    artSubject:
      'A curtained alcove in a luminous underwater gallery beneath three portraits of queens: one holding a conch to her ear, one with lips stitched shut in pearl thread, one asleep with her mouth slightly open; a young mermaid princess with dark violet scales, black lace and a sardonic grin tugs her twin with a pearl circlet, pale aquamarine scales and an older, worried gaze toward them',
    choices: [
      {
        id: 'care',
        label: 'Whisper under sleeping Ise',
        outcome:
          'The tide turns halfway through the route, and Ise says, distinctly and in Char’s voice, ‘the anchor at the landward gate.’ Down the gallery a guard looks up. Char finishes the plan in hand signs, rudely.',
        effects: { danger: 1 },
        artSubject:
          'A painted sleeping queen’s lips moving in her portrait as ripples spread from it, a guard turning his head far down the gallery, and two identical young mermaid princesses frozen mid-whisper beneath',
      },
      {
        id: 'risk',
        label: 'Whisper under Brannagh, the stitched queen',
        outcome:
          'Brannagh hears every word and can tell none. Char lays out the route, the boots, the gate, the night, while a stitched queen listens with what looks like sympathy. Scylla says nothing. She is hearing Char plan it alone, which she never heard the first time.',
        effects: { evidence: 2, trust: 1 },
        artSubject:
          'Beneath a portrait of a queen with pearl-stitched lips, a young mermaid princess with dark violet scales and black lace whispers eagerly, sketching a route in the water with one finger, while her pearl-circleted twin with pale aquamarine scales and an older, worried gaze listens closely',
      },
      {
        id: 'ottilie-conch',
        label: 'Whisper under Ottilie with the conch',
        outcome:
          'Ottilie has ears, a mouth, and a shell to hear through walls. By lunch the council’s under-clerk knows Char wants ‘new boots, urgently’, and is puzzled. So, now, is Mother.',
        effects: { danger: 1, trust: -1 },
        artSubject:
          'A portrait of a queen holding a conch to her ear in an underwater gallery, and through a cutaway wall a fussy under-clerk at a desk scribbling a note with a puzzled frown',
      },
    ],
  },
  {
    key: '8,2',
    place: 'Gallery Tide-Clock',
    title: 'Three Days on the Dial',
    speaker: 'Scylla',
    kind: 'memory',
    instant: true,
    opening:
      'At the end of the gallery the great tide-clock turns its glass dials: moons, tides, and a slow pearl hand that marks the days to the new moon. Three. Scylla remembers this clock stopping, years from now, the night the palace learned its princesses were gone. Today it ticks along like a heart that doesn’t know anything yet.',
    artSubject:
      'A vast tidal clock of nested glass dials and a slow pearl hand filling the end wall of a luminous underwater portrait gallery, moons and tides etched on the glass; a small young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze looks up at it',
    choices: [
      {
        id: 'notice',
        label: 'Read the clock to the minute',
        outcome:
          'High water at the landward gate in three nights, an hour after the guard change. Scylla notes it, and notes that she noted it, the way Oren would. Whatever she chooses, she will at least choose it on time.',
        effects: { evidence: 1 },
        artSubject:
          'Close view of a young mermaid princess’s reflection in the glass face of a great tidal clock, a pearl hand just past a third etched moon, her lips moving as she counts',
      },
    ],
    echoes: [
      {
        flag: 'e05:4,2:care',
        text: 'Someone has tucked Salter’s petition behind the clock glass to keep it dry. Scylla’s signature shows through the dial, under the mark for high water.',
      },
      {
        flag: 'e05:4,2:risk',
        text: 'Behind the clock glass, Salter’s petition: two royal names, one of them borrowed. The clock ticks over it like a finger tapping.',
      },
    ],
  },
]
