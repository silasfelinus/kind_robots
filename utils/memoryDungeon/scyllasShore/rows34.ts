import type { MorrowShiftSite } from '../morrowShift/types'

const SCYLLA =
  'a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze'
const CHAR =
  'her identical twin with dark violet scales, black lace and a sardonic grin'
const OREN =
  'Oren Pike, a very tall broad headsman whose whole head is covered by a rough brown cloth hood with two eyeholes, a ceremonial axe at his side and a leather apron of pouches'

export const SCYLLAS_SHORE_ROWS_3_4: readonly MorrowShiftSite[] = [
  {
    key: '1,3',
    place: 'Tangled Coronet Basket',
    title: 'The Coronet Basket',
    speaker: 'Scylla',
    kind: 'treasure',
    instant: true,
    opening:
      'The Coral Nursery smells of warm sand and milk-kelp, and every hatchling in it is wearing a hat. They are the princesses’ old play coronets, gone green, knotted together in the dress-up basket into one glittering argument. A small crab pokes out of the tangle in the coronet Scylla wore at five, very solemnly, the way she used to.',
    artSubject: `A luminous coral nursery with pearl walls and shafts of rippling water light, tiny sea creatures in borrowed shells crawling everywhere; ${SCYLLA}, kneels by a woven basket of tarnished toy coronets knotted into one glittering tangle, while a small hermit crab peeks out wearing a miniature crown.`,
    choices: [
      {
        id: 'notice',
        label: 'Untangle the coronets',
        outcome:
          'It takes an adult’s patience. At the bottom is Char’s, filed into points at six with a stolen nail file, and one loose pearl that has fallen out of something. Scylla pockets the pearl for the road and puts Char’s coronet back on the crab, who has earned it.',
        effects: { supplies: 1 },
        artSubject:
          'Close on a young mermaid’s hands lifting a small coronet filed into sharp points out of a tangle of green-tarnished toy crowns, a single loose pearl glowing in her palm, a hermit crab waiting nearby in soft nursery light.',
      },
    ],
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'Scylla holds the little pointed coronet a moment too long. Her hands remember a heavier weight, and a chain.',
      },
    ],
  },
  {
    key: '2,3',
    place: 'Hatchling Post Shelf',
    title: 'An Invitation Worn as a Shell',
    speaker: 'Scylla',
    kind: 'memory',
    opening:
      'A hermit crab has moved into an envelope. It is sealed with their mother’s wax and addressed, in a secretary’s loops, to both princesses: their Coming-of-Tide ball, four nights from now. Scylla knows how that night goes. They will be a day gone, the invitation never answered, and nobody ever told her whether their mother danced.',
    artSubject: `A nursery shelf of shells and pebbles in pearly light; a hermit crab wears a sealed cream envelope as its shell, the wax seal gleaming; ${SCYLLA}, crouches to look at it, one hand half raised, ominous tidal clock glowing on the coral wall behind.`,
    choices: [
      {
        id: 'care',
        label: 'Coax it free and give it to Char, unopened',
        outcome:
          'Char opens it with her teeth and says, ‘Oh no, a ball, however will we bear to miss it.’ Then she reads it again, slower, and folds it into her sleeve instead of throwing it away. It is hers to think about now.',
        effects: { trust: 1, evidence: 1 },
        artSubject: `${CHAR}, tearing open a sealed envelope with her teeth in a pearl-walled nursery, her grin faltering as she reads; Scylla watches beside her, a displaced hermit crab sulking at their tails.`,
      },
      {
        id: 'risk',
        label: 'Answer it yourself: both princesses accept with pleasure',
        outcome:
          'Scylla forges a younger Scylla’s hand perfectly. An acceptance in the palace post means nobody looks for two absent princesses until the music starts; it buys a whole day. It is also a promise to their mother in Char’s name, and Char has not seen it.',
        effects: { supplies: 1, danger: -1, trust: -1 },
        artSubject:
          'A young mermaid princess with a pearl circlet writing a reply with a quill on a shell desk in the dim nursery, shoulders hunched as if hiding it, an empty envelope beside her and a hatchling watching curiously.',
      },
      {
        id: 'leave-the-crab',
        label: 'Leave the crab its house',
        outcome:
          'The crab has already decorated the inside with sand and one blue bead. Scylla lets it keep the invitation, the ball and the question. Some letters are better as roofs.',
        effects: {},
        artSubject:
          'A hermit crab in a cream envelope shell trundling away along a coral shelf, a tiny blue bead visible inside the open flap, a young mermaid’s hand withdrawing in soft pearl light.',
      },
    ],
  },
  {
    key: '3,3',
    place: 'Pearl-Lock Toy Chest',
    title: 'The Running-Away Kit',
    speaker: 'Char',
    kind: 'memory',
    opening:
      'Char is elbow-deep in the nursery’s pearl-lock chest, which opens if you press its pearls in the order of your birthday. She surfaces with the running-away kit they packed at seven: one biscuit, one comb, a drawing of the land. In it the sun has a face, there is a castle, and two girls stand on legs like forks. ‘Be honest,’ says Char. ‘How wrong was I?’',
    artSubject: `An old toy chest studded with pearls open in a coral nursery, childhood treasures spilling out; ${CHAR}, holds up a child’s crayon drawing of a smiling sun, a castle and two stick girls with legs; ${SCYLLA}, looks at it with a careful face, warm lamplight.`,
    choices: [
      {
        id: 'care',
        label: 'Tell her she drew it exactly right',
        outcome:
          '‘Liar,’ says Char, pleased, and pins the drawing inside her pack lid. Scylla has kept the future to herself and given her sister one more day of a sun with a face. It is hard to say which of them that was for.',
        effects: { trust: 1, evidence: -1 },
        artSubject:
          'A violet-scaled mermaid girl in black lace pinning a child’s sunny drawing inside the lid of a leather pack, grinning; her aquamarine twin smiles beside her, eyes sad, in pearly nursery light.',
      },
      {
        id: 'risk',
        label:
          'Tell her it rains more there, and the castles are full of trains',
        outcome:
          'Char looks at her a long moment. ‘That is weirdly specific.’ She adds an umbrella to the drawing, then a train, then, after thought, a small skull on the train. She doesn’t ask how Scylla knows. She is going to.',
        effects: { evidence: 1, danger: 1 },
        artSubject:
          'A violet-scaled mermaid girl in black lace adding an umbrella and a train to a child’s drawing with a stub of charcoal, eyes narrowed at her aquamarine twin, who looks away; nursery shells glowing around them.',
      },
      {
        id: 'eat-the-biscuit',
        label: 'Eat the ancient biscuit, for morale',
        outcome:
          'It tastes of salt and the inside of a chest. Char eats the other half out of solidarity. They are both a little sick, laughing, and for ten whole minutes nobody is planning anything.',
        effects: { trust: 1, supplies: -1 },
        artSubject:
          'Twin mermaid girls, one aquamarine with a pearl circlet, one violet in black lace, sitting on an open toy chest sharing a very old biscuit and grimacing with laughter, crumbs drifting upward in the water.',
      },
    ],
    echoes: [
      {
        flag: 'e05:2,1:care',
        text: 'Char is still flushed from the stair race. She won, has decided Scylla let her, and is annoyed about it.',
      },
      {
        flag: 'e05:2,1:risk',
        text: 'Char has been watching her sideways since the Pearl Stair, where Scylla stopped dead and said that odd thing about the tide.',
      },
    ],
  },
  {
    key: '4,3',
    place: 'Glimmer Eel Grotto',
    title: 'The Eel in the Night-Light',
    speaker: 'Scylla',
    kind: 'monster',
    opening:
      'The hatchlings won’t go to bed, because the glimmer eel is in the bed grotto. She is old, longer than Scylla, and has lived in the lamp niche since before the twins were born; tonight she lies coiled across the sleeping shelf, flickering, snapping at anything that comes near. Glimmer eels go wherever the light is warmest, and the nursery’s warm lamp hangs right above the shelf.',
    artSubject: `A dim sleeping grotto in a coral nursery, a long glowing eel coiled across a shelf of tiny shell beds beneath a hanging warm lamp, jaws open; frightened hatchlings cluster at the entrance; ${SCYLLA}, floats before it, hands raised, its light flickering across her face.`,
    choices: [
      {
        id: 'care',
        label: 'Coax her out with your supper, one strip at a time',
        outcome:
          'It takes the whole of Scylla’s supper and a third of her nerve. The eel slides out in loops and sulks off to her niche, and the hatchlings pile into bed in the warm space she leaves. Scylla’s stomach complains all the way to the vault.',
        effects: { supplies: -1, trust: 1, danger: -1 },
        artSubject:
          'A young aquamarine mermaid holding out a strip of dried fish to a huge glowing eel easing off a shelf of shell beds, hatchlings peeking from behind her tail, soft amber light.',
      },
      {
        id: 'risk',
        label: 'Grab her behind the head, the way Char would',
        outcome:
          'The eel is heavier than she looks and quicker than Scylla. Scylla gets her out, and gets a bite across the knuckles for it, a neat crescent that will scar. Every hatchling in the nursery now thinks she is the bravest person alive.',
        effects: { danger: 1, trust: 1 },
        artSubject:
          'A young aquamarine mermaid wrestling a thrashing glowing eel out of a grotto, gripping it behind the head, a thread of blood at her knuckles, cheering hatchlings swirling around her.',
      },
      {
        id: 'carry-the-lamp',
        label: 'Carry the warm lamp back to her old niche',
        outcome:
          'Scylla unhooks the lamp, scorches her fingers, and sets it in the old niche. The eel follows the heat home like a cat. The sleeping shelf goes dark, and the hatchlings sleep without a night-light for once, complaining.',
        effects: { evidence: 1, trust: -1 },
        artSubject:
          'A young aquamarine mermaid carrying a glowing warm lamp along a coral wall, a long eel gliding obediently after its light, a shelf of shell beds falling into blue darkness behind them.',
      },
    ],
  },
  {
    key: '5,3',
    place: 'Nursery Reef Stair',
    title: 'Which Crab Has the Cowrie',
    speaker: 'Tamsin Rook',
    kind: 'puzzle',
    opening:
      'Char wants her baby cowrie back for luck on the road, and a hermit crab is wearing it. Three crabs sulk on the nursery’s Reef Stair, one per step, buried to the rim in sand: a spiral shell, a ridged shell and the cowrie. Tamsin Rook, the nursery keeper, won’t just say. ‘The spiral sits on the step just above the cowrie. And Ridge never sits on the top step. He’s frightened of heights.’',
    artSubject: `A short stair of living coral in a nursery, three hermit crabs buried to the rim in sand on three steps; an elderly round-faced nursery keeper with spectacles and a shawl of kelp points with a knitting needle; ${SCYLLA}, studies the steps, chin in hand, pearly light.`,
    choices: [
      {
        id: 'care',
        label: 'Reach to the middle step',
        outcome:
          'The middle crab wears the cowrie and is outraged. Scylla trades it a rose spiral from her pocket, far too grand for it, and it moves house with tremendous dignity. Tamsin nods once, the way she did when the twins got their sums right.',
        effects: { evidence: 1, trust: 1 },
        artSubject:
          'A young aquamarine mermaid holding a small cowrie shell up to the light while a hermit crab climbs into a grand rose-pink spiral shell on a coral step, an old nursery keeper nodding behind her.',
      },
      {
        id: 'risk',
        label: 'Reach to the top step',
        outcome:
          'The top crab lives in a spiral and has strong views about fingers. Scylla sucks a pinched thumb while Tamsin explains her clue again, slower.',
        effects: { danger: 1 },
        artSubject:
          'A young aquamarine mermaid jerking her hand back from a hermit crab in a spiral shell clamped on her thumb, an old nursery keeper with spectacles sighing beside the coral stair.',
      },
      {
        id: 'bottom-step',
        label: 'Reach to the bottom step',
        outcome:
          'The bottom crab is Ridge, who is afraid of everything, including Scylla. He clamps to the step and won’t come out, and it is several minutes before he forgives her and the cowrie is found one step up.',
        effects: { supplies: -1 },
        artSubject:
          'A young aquamarine mermaid lying flat on a coral stair coaxing a timid hermit crab in a ridged shell that has clamped itself to the bottom step, sand drifting up in the light.',
      },
    ],
  },
  {
    key: '6,3',
    place: 'Borrowed Fin Rack',
    title: 'The Two Smallest Fins',
    speaker: 'Scylla',
    kind: 'memory',
    instant: true,
    opening:
      'Hatchlings who swim in circles are lent practice fins from the rack by the nursery door: little paddles of shell and sharkskin, each tagged with who lent them. Most tags say only ‘a friend’, and nobody remembers lending any of them. The two smallest pairs, worn soft at the straps, are tagged in Tamsin’s square hand: ‘S. and C. Lent until the princesses want them back.’',
    artSubject: `A rack of tiny practice fins of shell and sharkskin hanging by a rounded nursery door, each with a small blank tag; ${SCYLLA}, touches the two smallest pairs, worn soft, while a hatchling swims crooked circles behind her in pearly light.`,
    choices: [
      {
        id: 'notice',
        label: 'Leave the fins on the rack',
        outcome:
          'Scylla doesn’t want them back. A hatchling is wearing Char’s pair already, swimming in triumphant crooked lines, and Scylla lets that be where their first fins stay: lent to someone smaller, with no date for return.',
        effects: { trust: 1 },
        artSubject:
          'A tiny sea hatchling wearing a pair of worn practice fins, swimming in proud crooked loops past a young aquamarine mermaid who watches with a soft, aching smile.',
      },
    ],
  },
  {
    key: '7,3',
    place: 'Moonlit Ribbon Pillar',
    title: 'One Last Measuring',
    speaker: 'Tamsin Rook',
    kind: 'companion',
    opening:
      'On the nursery pillar a moonlit ribbon carries every birthday the twins have had, two marks each, Char always a hair taller because she cheats. Tamsin Rook, who raised them while the queen ruled, wants one more pair before the Coming-of-Tide. She looks at Scylla over her spectacles. ‘You’ve grown since yesterday, love. Not upward.’',
    artSubject: `A coral pillar wound with a pale ribbon that glows like moonlight, marked with paired notches; an elderly round-faced nursery keeper with spectacles and a kelp shawl holds a marking shell to the ribbon; ${SCYLLA}, stands straight against the pillar, eyes full.`,
    choices: [
      {
        id: 'care',
        label: 'Stand for the mark, and thank her for every one',
        outcome:
          'Tamsin marks the ribbon and doesn’t ask what the thanks is for, which is how Scylla knows she has guessed something. ‘Bring your sister by,’ she says, ‘before whatever it is.’ The new mark is level with Char’s last, for once.',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'An old nursery keeper with spectacles pressing a marking shell to a glowing ribbon above a young aquamarine mermaid’s head, then cupping the girl’s cheek, soft moonlit light.',
      },
      {
        id: 'risk',
        label: 'Tell her you’re leaving, and ask her to slow the search',
        outcome:
          'Tamsin breathes in through her nose. ‘I’ll lose the nursery for this,’ she says, and then, ‘Yes. I’ll tell them you were with me till late.’ It is a gift, and it is Char’s secret too, spent without asking her.',
        effects: { supplies: 1, danger: -1, trust: -1 },
        artSubject:
          'An old nursery keeper with spectacles sitting heavily on a shell stool, holding a young aquamarine mermaid’s hands in hers, both faces grave by a glowing ribboned pillar.',
      },
    ],
    echoes: [
      {
        flag: 'e05:4,3:care',
        text: 'Tamsin has heard about the supper and the eel. A honey-kelp cake appears in Scylla’s pocket without comment.',
      },
      {
        flag: 'e05:4,3:risk',
        text: 'Tamsin sees the eel bite on Scylla’s knuckles and holds them, tutting, far longer than a cut needs.',
      },
      {
        flag: 'e05:4,3:carry-the-lamp',
        text: 'The nursery is dim tonight, and Tamsin is pretending, badly, to be cross about it.',
      },
    ],
  },
  {
    key: '8,3',
    place: 'Tide-Worn Nursery Mirror',
    title: 'Two Faces, One Older',
    speaker: 'Char',
    kind: 'memory',
    opening:
      'The nursery mirror is so old the tides have worn it soft, and hatchlings come to make faces at the blur. Scylla sees a girl with her own face and somebody else’s eyes. Then Char swims up behind her, chin on her shoulder, and pulls the face she has pulled in every mirror since they were born: tongue out, eyes crossed. ‘Your turn. Or are we too royal this week?’',
    artSubject: `A tall old mirror worn soft and silvery by tides, set in a coral nursery wall; reflected in its blur, ${SCYLLA}, and ${CHAR}, resting her chin on her sister’s shoulder and crossing her eyes, tongue out; hatchlings drift past in pearly light.`,
    choices: [
      {
        id: 'care',
        label: 'Pull the face back, tongue and all',
        outcome:
          'Scylla crosses her eyes and sticks out her tongue, and in the soft old glass two identical idiots grin at each other, aquamarine and violet. Char laughs until she hiccups. For one whole breath Scylla is exactly as young as she looks.',
        effects: { trust: 2 },
        artSubject:
          'Two identical mermaid girls, one aquamarine with a pearl circlet, one violet in black lace, both pulling cross-eyed faces with tongues out in a blurred silver mirror, laughing, bubbles rising.',
      },
      {
        id: 'risk',
        label: 'Ask her: if you knew how it ends, would you still go?',
        outcome:
          'Char’s face settles into something older. ‘Everything ends. I’d go anyway, and I’d want to know first.’ She studies Scylla in the glass. ‘Is that a question about me, or about you?’ Scylla has no answer that isn’t the whole truth.',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'In a blurred tide-worn mirror, a violet-scaled mermaid in black lace gazes seriously at her aquamarine twin’s reflection, the playfulness gone, the two faces identical and grave in cold silver light.',
      },
    ],
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'The last time Scylla saw that violet face, it was going under green water. She keeps her eyes on the mirror, where Char is alive and cross-eyed and impatient.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'Char is whole in the glass. Behind her, in the worn silver, Scylla keeps half-seeing palms against a train window, and makes herself look only at her sister.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'Scylla catches herself searching the blurred corners of the mirror, as if someone might be standing in a place the map called empty.',
      },
    ],
  },
  {
    key: '1,4',
    place: 'Vault Swap Hatch',
    title: 'Fennick’s Swap Tray',
    speaker: 'Fennick',
    kind: 'merchant',
    instant: true,
    opening:
      'Outside the Supply Vault, the kitchens’ retired cockle-man Fennick keeps a swap tray in a hatch in the wall: you put something down, he puts something down, and nobody calls it trade, because princesses don’t trade. Today the tray holds a corked tinderbox that has never once been wet. ‘Landward goods,’ he says. ‘Washed down. Up there’s where things go to dry out and complain.’',
    artSubject: `A small hatch in a barnacled stone wall beside a great vault door, a wrinkled old merman with a cockle-shell apron behind a tray of odd salvaged objects, a corked brass tinderbox among them; ${SCYLLA}, sets down a pearl hairpin, lantern light.`,
    choices: [
      {
        id: 'notice',
        label: 'Swap a hairpin for the tinderbox',
        outcome:
          'Fennick weighs the pearl hairpin in his palm and slides the tinderbox across. He doesn’t ask what a princess wants with fire. He has watched more packs go through that vault door than anyone but Oren, and he has a gift for not seeing them.',
        effects: { supplies: 1 },
        artSubject:
          'A wrinkled old merman’s hand sliding a corked brass tinderbox across a wooden tray toward a young mermaid’s hand, a pearl hairpin left in its place, warm lantern light in a stone hatch.',
      },
    ],
  },
  {
    key: '2,4',
    place: 'Vault Shelving Aisle',
    title: 'The Steward Is Counting',
    speaker: 'Steward Pellow',
    kind: 'challenge',
    opening:
      'The queen wants the vault counted before the festival, and Steward Pellow counts aloud: ‘Lamp oil, forty. Net, nine.’ Four shelves along, on the bottom rack, sit two packed bags tagged in Oren’s hand, S. and C. Oren stands at the far end with a ledger, hood perfectly still. Pellow has never miscounted anything in her life, and she has a cold.',
    artSubject: `A long aisle of stone vault shelves stacked with jars, nets and coils lit by hanging lamps; a stern sniffling steward with a slate counts aloud, four shelves from two packed bags on a bottom rack; ${SCYLLA}, freezes mid-aisle; at the far end ${OREN}, holds a ledger, motionless.`,
    choices: [
      {
        id: 'care',
        label: 'Ask Pellow about her cold, and keep her talking by the door',
        outcome:
          'Pellow has views on her cold, on her sister’s remedy, and on her sister. Scylla nods through all of it while Oren moves two bags into the column marked Festival Picnic. Pellow loses her place, counts the picnic twice, and leaves with Scylla’s good scarf round her throat.',
        effects: { trust: 1, supplies: -1 },
        artSubject:
          'A young aquamarine mermaid winding her own scarf round a sniffling steward’s throat by a vault door, nodding earnestly, while far behind them a tall hooded headsman quietly shifts two packs along a shelf.',
      },
      {
        id: 'risk',
        label: 'Pick up the bags and walk out with them, as if they’re yours',
        outcome:
          'Nobody stops a princess carrying luggage; everybody notices one. Pellow writes ‘two bags, Her Highness’ and underlines it. The packs are safe in Scylla’s arms, and her name is now in the queen’s inventory beside a question mark.',
        effects: { supplies: 1, danger: 2 },
        artSubject:
          'A young aquamarine mermaid with a pearl circlet sweeping down a vault aisle with two heavy packs in her arms, chin high, as a steward stares after her and underlines something on her slate.',
      },
      {
        id: 'let-oren',
        label: 'Leave it to Oren and his ledger',
        outcome:
          'Oren steps forward and offers Pellow the vault ledger, sixty pages, cross-referenced. ‘For accuracy,’ he says. Pellow reads for an hour, sneezing, finds nothing wrong, and leaves deeply suspicious that she has found nothing wrong.',
        effects: { evidence: 1, danger: 1 },
        artSubject:
          'A tall hooded headsman holding out an enormous ledger to a sneezing steward in a lamplit vault aisle, a young aquamarine mermaid peering out from behind a shelf of jars.',
      },
    ],
  },
  {
    key: '3,4',
    place: 'Vault Crate Row',
    title: 'Every Label Wrong',
    speaker: 'Oren Pike',
    kind: 'puzzle',
    opening:
      'Three crates stand by Oren’s scales, labelled SALT FISH, KELP CAKES and FISH AND CAKES. ‘My apprentice labelled them,’ Oren says. ‘Every label is wrong. Not some. Every.’ He will open one crate, draw out one thing without looking, and relabel all three from that alone. ‘Counted twice, weighed once, opened once. Which crate, Your Highness?’',
    artSubject: `Three wooden crates in a row beside great bronze scales in a lamplit stone vault, their painted labels turned away from view; ${OREN}, rests one huge hand on a crate lid and waits; ${SCYLLA}, frowns at them in thought.`,
    choices: [
      {
        id: 'care',
        label: 'The crate labelled FISH AND CAKES',
        outcome:
          'Oren draws out a kelp cake. ‘Then this is cakes. The one marked fish can’t be fish, and can’t be cakes now, so it’s both. The last is fish.’ He relabels all three in a hand like print, and under the hood makes a sound that is very nearly a laugh.',
        effects: { evidence: 1, supplies: 1 },
        artSubject:
          'A tall hooded headsman holding up a single kelp cake from an open crate, his other hand chalking a new label, while a young aquamarine mermaid grins beside the bronze scales.',
      },
      {
        id: 'risk',
        label: 'The crate labelled SALT FISH',
        outcome:
          'Oren draws out a kelp cake, which tells them only that the crate isn’t fish, which they knew. He opens a second crate, then a third, recounting each, while the tide clock on the wall ticks off an hour neither princess has to spare.',
        effects: { danger: 1 },
        artSubject:
          'A tall hooded headsman prising open a second crate while a young aquamarine mermaid glances anxiously at a glowing tidal clock on the vault wall, a kelp cake on the lid of the first.',
      },
      {
        id: 'kelp-cakes',
        label: 'The crate labelled KELP CAKES',
        outcome:
          'A salt fish, which could mean fish or both. Oren holds it up like evidence against the whole morning. ‘Now I must open another,’ he says, ‘and the cakes have been out of brine too long.’ Two go soft and go to the hatchlings.',
        effects: { supplies: -1 },
        artSubject:
          'A tall hooded headsman holding up a single salt fish from an open crate with an air of weary accusation, a young aquamarine mermaid wincing beside him in lamplight.',
      },
    ],
  },
  {
    key: '4,4',
    place: 'Oren’s Scales',
    title: 'Two Packs on the Scales',
    speaker: 'Oren Pike',
    kind: 'companion',
    opening:
      'Oren has both departure packs open beside the great bronze scales, his list unrolled to the floor: rations, rope, lamp oil, Char’s iron grapple, Scylla’s comb. He counts it all aloud, then again, and reaches to weigh. Scylla reads down the list for his own name. It isn’t there. There are only two packs. There have only ever been two.',
    artSubject: `The heart of a lamplit stone supply vault, great bronze scales with two leather departure packs open beside them and a long list unrolled across the floor; ${OREN}, counts on his fingers above them; ${SCYLLA}, reads the list over his arm.`,
    choices: [
      {
        id: 'care',
        label: 'Ask him to pack a third, for himself',
        outcome:
          'Oren is still so long the scales settle. ‘A third pack is not on the list,’ he says. Then he unrolls the list a little further and writes it on, in that printed hand. ‘Rations divide by three worse than by two.’ He has not said yes. He has not said no.',
        effects: { trust: 2, supplies: -1 },
        artSubject:
          'A tall hooded headsman kneeling to write at the very end of a long unrolled list, a third empty pack at his knee, a young aquamarine mermaid watching with her hands clasped, bronze scales gleaming.',
      },
      {
        id: 'risk',
        label: 'While he turns away, quietly lighten Char’s pack',
        outcome:
          'Scylla slips the iron grapple out of Char’s pack and into a bin of nails. The pack weighs a pound lighter. Oren writes the new weight without a word, which is worse than a word, then writes something underneath and angles it away from her.',
        effects: { danger: -1, trust: -1 },
        artSubject:
          'A young aquamarine mermaid slipping an iron grapple out of a leather pack behind a tall hooded headsman’s back, his head turned just slightly toward her, the bronze scales tipping.',
      },
    ],
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'Scylla knows this pack. She remembers carrying it, afterward, because there was nobody left to.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'Scylla thinks of a train full of people under a sealed gate, and wants to tell Oren to pack all the rope there is.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'Oren counts everyone, always. Watching him, Scylla wonders who counted the people of the maintenance district, and whether anyone ever weighed it.',
      },
      {
        flag: 'e05:2,1:care',
        text: 'A pearl from the Pearl Stair rattles in Char’s pack pocket: the prize she awarded herself for this morning’s race.',
      },
      {
        flag: 'e05:2,1:risk',
        text: 'Oren has heard that Scylla stopped dead on the Pearl Stair this morning and talked about tides. He hands her the list to check, as if she might know something it doesn’t.',
      },
    ],
  },
  {
    key: '5,4',
    place: 'Vault Packing Bench',
    title: 'Char’s Own List',
    speaker: 'Char',
    kind: 'memory',
    opening:
      'Char sits on the packing bench with her own list, shorter than Oren’s and better in one way: it is in her writing. 1. Boots (hidden, don’t ask). 2. Scylla’s comb, or she’ll cry. 3. NO crowns. She looks up. ‘You’ve been not-saying something since this morning. Say it, or hand me the pencil and let me finish.’',
    artSubject: `A worn wooden packing bench in a lamplit vault heaped with straps and rations; ${CHAR}, sits cross-tailed on it with a short list and a pencil behind her ear, looking up sharply at ${SCYLLA}, who hovers holding a pencil.`,
    choices: [
      {
        id: 'care',
        label: 'Hand her the pencil',
        outcome:
          'Char adds, at 4, ‘whatever Scylla isn’t saying’, underlines it twice and goes back to packing. It is not forgiveness and not a fight. It is a space on the list, saved, and Char will decide when to fill it.',
        effects: { trust: 1 },
        artSubject:
          'A violet-scaled mermaid in black lace writing on a short list on her knee and underlining it hard, her aquamarine twin beside her with an empty hand, lamplit vault shelves behind.',
      },
      {
        id: 'risk',
        label: 'Say it: you want to carry the heavy things this time',
        outcome:
          '‘This time,’ says Char. ‘When was the last time?’ Scylla has no lie ready. Char unhooks the rope from her own pack and drops it on Scylla’s, hard. ‘Fine. Carry it. But you tell me why before we’re through the gate.’',
        effects: { evidence: 1, danger: 1 },
        artSubject:
          'A violet-scaled mermaid in black lace dropping a heavy coil of rope onto her aquamarine twin’s pack with narrowed eyes, the twin flinching, lamplit vault around them.',
      },
      {
        id: 'smuggle-the-circlet',
        label: 'Cross off NO crowns and pack your circlet anyway',
        outcome:
          'Char watches with real admiration. ‘Look at you, smuggling royalty.’ Then she writes ‘except one’ beside item 3, and neither of them says aloud that a crown is the one thing that might buy a way home.',
        effects: { trust: 1, supplies: 1 },
        artSubject:
          'An aquamarine mermaid tucking her pearl circlet deep into a leather pack while her violet-scaled twin in black lace grins and scribbles on a list, lamplight on the pearls.',
      },
    ],
    echoes: [
      {
        flag: 'e05:4,4:care',
        text: 'Char has seen the third pack by Oren’s scales. ‘Oren’s coming?’ she says. ‘Good. Somebody who can count.’',
      },
      {
        flag: 'e05:4,4:risk',
        text: 'Char’s pack sits beside her, a pound too light. She hasn’t opened it yet. She will.',
      },
      {
        flag: 'e05:4,2:care',
        text: 'She has heard about the petition, and that Scylla signed only her own name. ‘Good,’ she says. ‘Mine’s my business.’',
      },
      {
        flag: 'e05:4,2:risk',
        text: 'She has seen the petition, her name on it in Scylla’s hand, and hasn’t decided whether to be grateful or furious, so she is both.',
      },
    ],
  },
  {
    key: '6,4',
    place: 'Vault Record Niche',
    title: 'An Oath for a Lifetime',
    speaker: 'Ismay Coble',
    kind: 'memory',
    opening:
      'Ismay Coble, the court archivist, has followed Scylla into the vault with a fresh sheet and her good ink. ‘A departure oath,’ she says, low. ‘That you go of your own will, and nobody here made you. It keeps Oren’s neck off the block and Tamsin in her nursery.’ Two lines. An oath can be kept for a lifetime by someone who hasn’t lived that lifetime yet.',
    artSubject: `A narrow record niche in a stone vault lined with scroll pigeonholes; a thin grey-haired archivist with ink-stained fingers holds out a sheet with two blank lines and a quill; ${SCYLLA}, takes the quill, hesitating, in candle-like glow.`,
    choices: [
      {
        id: 'care',
        label: 'Sign your own line, and leave Char’s for Char',
        outcome:
          'Ismay blots it and doesn’t push. ‘Half an oath protects half as many people,’ she says, ‘but it’s honest all the way down.’ She files it in a drawer dated three days off, the empty line waiting for whoever Char decides to be.',
        effects: { trust: 1, danger: 1 },
        artSubject:
          'A grey-haired archivist sliding a half-signed sheet into a drawer of pigeonholes while a young aquamarine mermaid watches, the second line on the sheet clearly empty.',
      },
      {
        id: 'risk',
        label: 'Sign, and date it the day of the tide gate',
        outcome:
          'Scylla writes a date years from now under her name, the day of the gate, because that is when she will finally have meant it. Ismay reads it, says nothing, and copies it into the great register. Now the court’s memory holds a day nobody has lived yet.',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'A grey-haired archivist frozen over a great open register, quill lifted, staring at a signed sheet, while a young aquamarine mermaid with an older, worried gaze stands very still beside her.',
      },
      {
        id: 'refuse-oath',
        label: 'Refuse: nobody should swear for a self they haven’t been',
        outcome:
          'Ismay puts the sheet away, unoffended. ‘Then I’ll write that you said so, and that it was wise, and that nobody listened.’ No paper will be found before the princesses go, and none will say whose choice it was after.',
        effects: { danger: -1, trust: -1 },
        artSubject:
          'A grey-haired archivist rolling up a blank sheet with a small sad smile, a young aquamarine mermaid turning away toward the dark vault shelves.',
      },
    ],
    echoes: [
      {
        flag: 'e05:4,2:care',
        text: 'Ismay has read Councilor Salter’s petition, and Scylla’s name on it in Scylla’s own hand. That is why she came to Scylla and not to the queen.',
      },
      {
        flag: 'e05:4,2:risk',
        text: 'Ismay has read Councilor Salter’s petition too. She touches Char’s name on it, in Scylla’s hand, and asks whether this time Char will be signing for herself.',
      },
    ],
  },
  {
    key: '7,4',
    place: 'Vault Rope Locker',
    title: 'A Fathom for What He Didn’t Think Of',
    speaker: 'Scylla',
    kind: 'treasure',
    instant: true,
    opening:
      'In the rope locker every coil is tagged with its length and purpose in Oren’s print. One spare hangs apart, tagged: ‘Landward shaft. Exact depth, plus one fathom for what I did not think of.’ It is the most hopeful thing Scylla has ever seen written down.',
    artSubject: `A dim stone rope locker with neat tarred coils on pegs, one spare coil hanging apart with a small blank tag; ${SCYLLA}, reaches up for it, lamplight catching the rope fibres.`,
    choices: [
      {
        id: 'notice',
        label: 'Coil the spare rope into your pack',
        outcome:
          'It is good rope, tarred and soft, and it fits the pack as if Oren measured the pack too, which he did. Scylla knots the end the way he taught them both: the knot that comes undone only when you mean it to.',
        effects: { supplies: 1 },
        artSubject:
          'A young aquamarine mermaid’s hands tying a neat knot in a coil of tarred rope inside an open leather pack, lamplit stone shelves behind.',
      },
    ],
    echoes: [
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'She thinks of a train of people under a sealed gate, and wishes with her whole chest that someone had brought a fathom for what they didn’t think of.',
      },
    ],
  },
  {
    key: '8,4',
    place: 'Oren’s Weighing Book',
    title: 'A Pack Unpacked',
    speaker: 'Oren Pike',
    kind: 'memory',
    opening:
      'On the vault’s back lectern lies Oren’s Weighing Book: every departure pack he has ever packed, weighed once, and where it went. Most are envoys. One, from before the twins were born, is a pack for one with no destination, and beside it a single word in Oren’s print: ‘Unpacked.’ The initials are their mother’s. At the next shelf, Oren has stopped counting.',
    artSubject: `A heavy ledger open on a stone lectern at the back of a lamplit vault, a tidal clock glowing on the wall above; ${SCYLLA}, rests a finger on one line; nearby ${OREN}, stands stock-still with a half-counted handful of candles.`,
    choices: [
      {
        id: 'care',
        label: 'Ask Oren whose hand unpacked it',
        outcome:
          '‘Hers,’ says Oren. ‘Nobody stopped her. She stopped.’ He takes the book and closes it gently, the way he closes everything. ‘Your mother chose. That is the only part of it I wrote down.’',
        effects: { trust: 1, evidence: 1 },
        artSubject:
          'A tall hooded headsman gently closing a heavy ledger on a lectern, a young aquamarine mermaid looking up at the eyeholes of his hood, lamplight soft between them.',
      },
      {
        id: 'risk',
        label: 'Tear out the page, for Char to read if she ever wants',
        outcome:
          'Oren’s books have never been torn. He watches her do it and doesn’t stop her, and the sound under the hood might be grief or relief. The page folds small. It is Char’s to read or not, whenever she asks what Scylla isn’t saying.',
        effects: { evidence: 2, trust: -1 },
        artSubject:
          'A young aquamarine mermaid carefully tearing a page from a heavy ledger while a tall hooded headsman watches without moving, a candle in his hand, the vault dim around them.',
      },
      {
        id: 'close-the-book',
        label: 'Close the book. Your mother’s choice was hers',
        outcome:
          'Scylla closes it without reading the weight. Whatever their mother nearly did is their mother’s, as Char’s road is Char’s. Oren starts counting again, from one, a little louder than before.',
        effects: { trust: 2 },
        artSubject:
          'A young aquamarine mermaid closing a heavy ledger with both hands on a stone lectern, a tall hooded headsman in the background resuming his count of candles on a shelf.',
      },
    ],
  },
]
