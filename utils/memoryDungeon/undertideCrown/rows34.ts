import type { MorrowShiftSite } from '../morrowShift/types'

const SCYLLA =
  'a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze'
const CHAR =
  'her identical twin with dark violet scales, black lace and a sardonic grin'
const OREN =
  'Oren Pike, a very tall broad headsman whose whole head is covered by a rough brown cloth hood with two eyeholes, a ceremonial axe at his side and a leather apron of pouches'
const TAMSIN =
  'Tamsin Rook, an elderly round-faced nursery keeper with spectacles and a shawl of kelp'
const STYLE =
  'the same mermaid palace distorted by impossible tides, confiscated choices and duplicate royal portraits'

export const UNDERTIDE_CROWN_ROWS_3_4: readonly MorrowShiftSite[] = [
  {
    key: '1,3',
    place: 'Tangled Coronet Basket',
    title: 'The Sorted Basket',
    speaker: 'Scylla',
    kind: 'treasure',
    instant: true,
    opening:
      'The coronet basket has been untangled. Someone has sorted every play crown by year into numbered slots and tagged each one Issued, and the hatchlings who used to wear them sit in a row, bareheaded, as if waiting to be issued too. Slot six reads: Princess Char, never made. Scylla remembers Char filing hers into points with a stolen nail file. It is at the bottom of the basket anyway.',
    artSubject: `A coral nursery gone cold and orderly, pearl walls rippling with wrong-way tide light; a woven basket fitted with neat numbered slots, a tarnished toy coronet in each, small blank tags hanging from them; a row of bareheaded hermit crabs waits beside it; ${SCYLLA}, digs to the very bottom of the basket; ${STYLE}.`,
    choices: [
      {
        id: 'notice',
        label: 'Dig out Char’s coronet',
        outcome:
          'Its points have been filed smooth by a patient hand that wasn’t Char’s, the way the court files down anything inconvenient. Scylla keeps it, and the loose pearl under it, and sets the coronet on the smallest crab, who has nothing else to be.',
        effects: { supplies: 1, evidence: 1 },
        artSubject:
          'A young aquamarine mermaid’s hands holding a small toy coronet whose points have been filed round and smooth, a loose pearl in her palm, a tiny hermit crab reaching up for the crown in cold pearly light.',
      },
    ],
    echoes: [
      {
        flag: 'e05:1,3:notice',
        text: 'Her pocket still holds a loose pearl from the last time she untangled this basket. The basket insists it has never been tangled.',
      },
      {
        flag: 'e04:char-lost-in-present',
        text: 'Never made. Scylla reads it twice. The court has found a way to say what the tide gate said, in tidier handwriting.',
      },
    ],
  },
  {
    key: '2,3',
    place: 'Hatchling Post Shelf',
    title: 'Attendance, Already Recorded',
    speaker: 'Scylla',
    kind: 'memory',
    opening:
      'The hermit crab still wears the envelope, but now it is tacked to his back with a silver nail through the flap. The wax is fresh. It is no longer an invitation: in a secretary’s loops, it records that both princesses attended the Coming-of-Tide ball and danced with whom they were told. The ball is four nights away. It has been four nights away for as long as Scylla can count.',
    artSubject: `A nursery shelf of shells and pebbles under a tidal clock whose hands point the same way twice; a hermit crab wears a sealed cream envelope pinned to its back by a small silver tack; ${SCYLLA}, crouches with one hand half raised, a stack of identical envelopes on the shelf behind; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label: 'Work the nail free and give the record to Char',
        outcome:
          'Char reads that she danced, and with whom, and goes white with fury. She doesn’t tear it. She turns it over and writes on the back, in her crooked hand, I did not, and posts it back into the palace post herself. The crab scuttles off, unpinned and furious too.',
        effects: { trust: 1, evidence: 1, danger: 1 },
        artSubject: `${CHAR}, writing hard on the back of a cream envelope against a coral shelf, her grin gone, while ${SCYLLA}, holds a pulled silver tack and a freed hermit crab hurries away.`,
      },
      {
        id: 'risk',
        label: 'Countersign it in both names, and buy a quiet day',
        outcome:
          'Two neat signatures and the court is satisfied: nobody looks for princesses who have already attended. The day goes quiet. The crab stays nailed, and somewhere in the Register Char has danced, smiled and agreed, and Char has not been asked.',
        effects: { danger: -1, supplies: 1, trust: -1 },
        artSubject:
          'A young aquamarine mermaid signing twice at the foot of a sealed record with a quill, shoulders hunched, the hermit crab still pinned beneath it on the shelf, cold clerkly light.',
      },
      {
        id: 'free-the-crab',
        label: 'Pull the nail, free the crab, let the record fall',
        outcome:
          'The crab drops the envelope at once and backs into a plain grey shell of its own choosing. The record slides behind the shelf, where nobody official will reach. It is still true, as far as the court is concerned. It is just harder to find.',
        effects: { trust: 1 },
        artSubject:
          'A hermit crab backing into a plain grey shell on a coral shelf while a cream envelope slides into the dark gap behind, a young mermaid’s hand holding a small silver tack in pearly light.',
      },
    ],
    echoes: [
      {
        flag: 'e05:2,3:care',
        text: 'Char kept the last invitation folded in her sleeve. She takes it out: the same wax, the same loops, and none of the words she wrote in its margin.',
      },
      {
        flag: 'e05:2,3:risk',
        text: 'The hand on this record is Scylla’s own forgery, promoted. The palace kept her acceptance and made it a fact.',
      },
      {
        flag: 'e05:2,3:leave-the-crab',
        text: 'The blue bead is still inside the flap. They nailed it in with him.',
      },
    ],
  },
  {
    key: '3,3',
    place: 'Pearl-Lock Toy Chest',
    title: 'The Nailed Shells',
    speaker: 'Tamsin Rook',
    kind: 'memory',
    opening:
      'The pearl-lock chest is full of nails: silver tacks, one per hatchling, each stamped with the shell the Register says it was born in. By decree no creature may wear a borrowed shell, so overnight every small house in the nursery was nailed shut on the life inside it. Nobody remembers holding the hammer. Tamsin Rook has her pliers out. ‘They have to grow,’ she says. ‘I want every nail out, and I want it known.’',
    artSubject: `An open toy chest studded with pearls, brimming with small silver tacks instead of toys; across the coral nursery floor, hermit crabs in shells pinned shut with silver tacks to the reef; ${TAMSIN}, holds up a pair of pliers; ${SCYLLA}, kneels beside her; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label:
          'Pull them one by one, the slow way, and log each nail in your name',
        outcome:
          'It takes all night. Every crab comes out blinking and whole, and every pulled nail goes in Tamsin’s log beside two signatures, hers and Scylla’s, for whoever comes asking. Tamsin’s hands shake only once, at the last nail, and only because it is over.',
        effects: { trust: 2, danger: 1, supplies: -1 },
        artSubject: `${TAMSIN}, and ${SCYLLA}, side by side on the nursery floor at night, easing a silver tack from a shell rim with pliers, a growing heap of pulled nails and an open log book between them, freed crabs creeping out around them.`,
      },
      {
        id: 'risk',
        label:
          'Nail empty shells instead, so the Register’s count still matches',
        outcome:
          'It is quick, and it works. The hatchlings scatter free; the empty shells sit on the shelf with their tacks, perfectly obedient, and the count will tally. ‘You’ve made their lie tidier,’ says Tamsin, not unkindly, and writes nothing down.',
        effects: { danger: -1, trust: -1, evidence: -1 },
        artSubject:
          'A young aquamarine mermaid tapping a silver tack into an empty shell on a nursery shelf lined with identical empty shells, an old keeper in spectacles watching with folded arms, freed crabs scattering in the shadows.',
      },
      {
        id: 'give-char-the-pliers',
        label: 'Hand Char the pliers',
        outcome:
          'Char pulls nails like pulling teeth from the palace, fast and furious, and cracks not one shell. She keeps the last tack and pins it through her lace collar. ‘So I remember what they wanted,’ she says, and dares anyone to take it off her.',
        effects: { trust: 1, evidence: 1, danger: 1 },
        artSubject: `${CHAR}, working pliers at a pinned shell with fierce concentration, a silver tack already fastened through her black lace collar, an old nursery keeper watching her with startled approval.`,
      },
    ],
    echoes: [
      {
        flag: 'e05:3,3:care',
        text: 'Char’s childhood drawing of the land is still pinned in her pack lid. Someone has driven a silver tack through the sun’s face.',
      },
      {
        flag: 'e05:3,3:risk',
        text: 'The drawing with the umbrella, the train and the little skull has been found. The Register has filed it under Impossible.',
      },
      {
        flag: 'e05:3,3:eat-the-biscuit',
        text: 'The old biscuit is back in the chest, whole, as if nobody ever ate it. Char looks at it and does not laugh.',
      },
    ],
  },
  {
    key: '4,3',
    place: 'Glimmer Eel Grotto',
    title: 'The Lamp That Never Goes Out',
    speaker: 'Scylla',
    kind: 'monster',
    opening:
      'The nursery lamp no longer goes out. A decree of perfect safety forbids dark hours, and its hook wears the Register’s wax seal. Under that endless warmth the old glimmer eel has grown longer than Oren is tall; she lies coiled across the hatchlings’ sleeping shelf, hot-tempered and flickering, snapping at anything near. Glimmer eels go wherever the light is warmest. The hatchlings haven’t slept in three nights.',
    artSubject: `A sleeping grotto of tiny shell beds under a hanging lamp blazing too bright, its hook sealed with red wax; an enormous glowing eel coiled across the shelf, jaws open; exhausted hatchlings huddle at the entrance; ${SCYLLA}, floats before it, hands raised; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label: 'Coax her off the shelf with your supper',
        outcome:
          'She takes the supper and a third of Scylla’s nerve and slides off to her niche, and the hatchlings pile into bed. But the lamp still burns, and by the second watch she will be back. Tamsin pulls up a stool to sit up with them, because someone has to.',
        effects: { supplies: -1, trust: 1, danger: -1 },
        artSubject:
          'A young aquamarine mermaid holding out strips of dried fish to a huge glowing eel easing off a shelf of shell beds under a blazing sealed lamp, an old keeper settling onto a stool beside the sleeping hatchlings.',
      },
      {
        id: 'risk',
        label: 'Break the Register’s seal and put the lamp out',
        outcome:
          'The wax snaps like a twig. The lamp goes dark, and the eel, cooling, follows the warmth home to her old niche like a cat. The hatchlings sleep in the first dark the nursery has had in three nights. In the morning someone will find the seal.',
        effects: { danger: 1, trust: 1, evidence: 1 },
        artSubject:
          'A young aquamarine mermaid snuffing a hanging lamp, a broken red wax seal drifting from its hook, a long eel gliding away toward a glowing niche as the shell beds fall into soft blue darkness.',
      },
      {
        id: 'grab-her',
        label: 'Grab her behind the head, the way Char would',
        outcome:
          'She is bigger now, and her light scalds. Scylla wrestles her off the shelf and earns a blister across both palms for it. The hatchlings cheer, then go quiet, because under the lamp the eel is already uncoiling to come back.',
        effects: { danger: 1, trust: 1 },
        artSubject:
          'A young aquamarine mermaid hauling a thrashing, too-bright eel off a shelf of shell beds by the head, her palms reddened, hatchlings frozen mid-cheer beneath a blazing lamp.',
      },
    ],
    echoes: [
      {
        flag: 'e05:4,3:care',
        text: 'Scylla gave this eel a whole supper once. Her stomach remembers. The eel, apparently, does not.',
      },
      {
        flag: 'e05:4,3:risk',
        text: 'The crescent scar across Scylla’s knuckles itches. The eel lies coiled exactly as she did the night she gave it to her.',
      },
      {
        flag: 'e05:4,3:carry-the-lamp',
        text: 'Scylla carried this lamp to the eel’s niche once. Now a sealed chain holds it to its hook, so it can never be moved again.',
      },
    ],
  },
  {
    key: '5,3',
    place: 'Nursery Reef Stair',
    title: 'Three Flights Down',
    speaker: 'Tamsin Rook',
    kind: 'puzzle',
    opening:
      'The Reef Stair has become three identical flights down from the landing; Tamsin has looped the hatchlings round them all night. ‘Two are the stair as the Register recorded it,’ she says, ‘and its record hasn’t changed since the decree. One is the stair as it is. The night after the decree, Char kicked a step on the real one and chipped it.’ The left flight’s fourth step is chipped. The middle and right flights are flawless.',
    artSubject: `Three identical flights of living coral stairs descending side by side from one landing into blue haze, the left flight with one chipped step; ${TAMSIN}, cradles sleeping hatchlings in her shawl; ${SCYLLA}, studies the steps, chin in hand; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label: 'Lead them down the left flight',
        outcome:
          'The left flight goes down and keeps going down, chip and all, to warm sand and the nursery floor. Tamsin lays the sleepers in their beds and chalks a mark on the chipped step for anyone who comes after: this one is real.',
        effects: { evidence: 1, trust: 1 },
        artSubject:
          'An old nursery keeper laying sleeping hatchlings into shell beds at the foot of a coral stair, a young aquamarine mermaid chalking a mark beside a chipped step, warm sand glowing.',
      },
      {
        id: 'risk',
        label: 'Lead them down the middle flight',
        outcome:
          'Partway down, the middle flight delivers them back onto the landing, facing the same three stairs. One hatchling begins to cry, very quietly, as if it has already learned that crying changes nothing here.',
        effects: { danger: 1, supplies: -1 },
        artSubject:
          'A young aquamarine mermaid and an old keeper arriving back on the same coral landing they left, three identical stairs before them, a tiny hatchling weeping in the keeper’s shawl.',
      },
      {
        id: 'right-flight',
        label: 'Lead them down the right flight',
        outcome:
          'The right flight is flawless all the way down, and all the way down is the landing again. Tamsin says nothing, which is worse than anything she could say, and shifts the sleeping weight in her shawl.',
        effects: { danger: 1 },
        artSubject:
          'An old nursery keeper in spectacles standing silent on a coral landing with an armful of sleeping hatchlings, staring at three identical stairs, a young aquamarine mermaid beside her.',
      },
    ],
    echoes: [
      {
        flag: 'e05:5,3:care',
        text: 'Tamsin gives Scylla the look she gave her over the cowrie, as if the sums are bound to come out right again.',
      },
      {
        flag: 'e05:5,3:risk',
        text: 'Scylla’s thumb remembers the spiral crab. She keeps her hands to herself and her eyes on the steps.',
      },
      {
        flag: 'e05:5,3:bottom-step',
        text: 'Ridge is here, clamped to the landing, refusing every flight. For once nobody thinks he is being silly.',
      },
    ],
  },
  {
    key: '6,3',
    place: 'Borrowed Fin Rack',
    title: 'Never Lent, Never Left',
    speaker: 'Scylla',
    kind: 'memory',
    instant: true,
    opening:
      'The fin rack by the nursery door is bare. Every pair of practice fins has been recalled to whoever the Register lists as its lender, and hatchlings swim crooked circles round the empty hooks. Only the two smallest pairs remain, chained to the rack. Their tags have been rewritten in a clerk’s hand: ‘S. and C. Never lent. Never left.’',
    artSubject: `A rack of empty hooks by a rounded nursery door, two tiny worn pairs of practice fins chained to it with small blank tags; finless hatchlings swim crooked circles behind ${SCYLLA}, who reaches for a tag; ${STYLE}.`,
    choices: [
      {
        id: 'notice',
        label: 'Turn the tags over',
        outcome:
          'On the back of each, very small, in Tamsin’s square hand: ‘Lent until the princesses want them back.’ The court rewrote the front and never thought to check the back. Scylla hangs both tags back side out, so the truth faces the room.',
        effects: { evidence: 1 },
        artSubject:
          'A young aquamarine mermaid’s fingers turning over a small tag on a chained pair of tiny practice fins, a hatchling peering at it over her shoulder, cold pearly light.',
      },
    ],
    echoes: [
      {
        flag: 'e05:6,3:notice',
        text: 'Scylla left Char’s pair on a hatchling once. That hatchling is here, finless, circling the rack as if waiting to be lent them again.',
      },
    ],
  },
  {
    key: '7,3',
    place: 'Moonlit Ribbon Pillar',
    title: 'The Height of Nothing Decided',
    speaker: 'Tamsin Rook',
    kind: 'companion',
    opening:
      'The moonlit ribbon on the nursery pillar has been re-marked. Every notch since the decree sits at one height, because the palace prefers its princesses the size they were before anything was decided. Tamsin is under orders to keep it so. She glances at the door, then lifts her shawl: wound round her waist is a second ribbon, every true mark on it. ‘You’ve grown, love,’ she whispers. ‘They can’t have that.’',
    artSubject: `A coral pillar wound with a glowing pale ribbon whose newest notches are all cut at exactly the same height; ${TAMSIN}, lifts her shawl to show a second hidden ribbon wound round her waist; ${SCYLLA}, stands against the pillar, eyes full; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label: 'Stand for a true mark on her hidden ribbon',
        outcome:
          'Tamsin marks it with a thumbnail, quick, and winds it back under her shawl before the door can open. ‘There. You exist,’ she says, as if prescribing a remedy. If the Register searches her, they will find it. She has decided to be searched.',
        effects: { trust: 2, danger: 1 },
        artSubject:
          'An old nursery keeper pressing her thumbnail to a hidden glowing ribbon held against a young aquamarine mermaid’s head, both glancing toward a shut door, moonlit light.',
      },
      {
        id: 'risk',
        label: 'Ask her to cut the official mark, and keep her nursery',
        outcome:
          'Tamsin cuts the false notch at the false height, the same as yesterday, and her mouth goes thin. The nursery stays hers, and the hatchlings stay with someone who pulls nails. That is worth something. She does not say what it cost.',
        effects: { danger: -1, trust: -1, supplies: 1 },
        artSubject:
          'An old nursery keeper cutting a notch into a glowing ribbon at the same height as all the others, lips pressed thin, a young aquamarine mermaid looking away.',
      },
      {
        id: 'char-marks-herself',
        label: 'Fetch Char, and let her mark her own height',
        outcome:
          'Char stands against the pillar, takes the marking shell and gouges her own notch a full inch above the official one, then signs it: C., her choice. Tamsin laughs aloud for the first time in days. The Register will find that mark. Char intends it to.',
        effects: { trust: 1, evidence: 1, danger: 1 },
        artSubject: `${CHAR}, standing defiantly against a glowing ribboned pillar and gouging a notch above her own head with a marking shell, an old keeper laughing behind her hand.`,
      },
    ],
    echoes: [
      {
        flag: 'e05:7,3:care',
        text: 'Tamsin asked her once to bring her sister by. Char is already here, arms crossed, as if she came on her own. She did.',
      },
      {
        flag: 'e05:7,3:risk',
        text: 'Tamsin slowed the search for them once. She has been called before the Register twice about it, and went on knitting both times.',
      },
      {
        flag: 'e05:stay',
        text: 'They stayed. Tamsin has measured them every morning since, and every morning the ribbon is told they have not grown.',
      },
    ],
  },
  {
    key: '8,3',
    place: 'Tide-Worn Nursery Mirror',
    title: 'The Sister in the Glass',
    speaker: 'Char',
    kind: 'memory',
    opening:
      'The nursery mirror no longer blurs. It shows two sisters, and only one is right: Scylla, young, with somebody else’s eyes, and beside her not this Char but an older one, the Char Scylla remembers, standing still while the real Char moves. Char pulls her face, tongue out. The reflection doesn’t. ‘Who is that?’ Char asks, very quietly. ‘Why is she wearing me?’',
    artSubject: `A tall old mirror in a coral nursery wall, sharp now instead of soft; in front of it ${SCYLLA}, and ${CHAR}, pulling a face with her tongue out; in the glass, beside Scylla's reflection, stands a solemn older woman with the same violet scales who does not move; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label: 'Tell her the truth: that is the sister you remember, not her',
        outcome:
          'Char looks at the older woman in the glass a long time. ‘Then remember me less loudly,’ she says, and pulls the face again, and again, until the reflection, slowly, as if forced, pulls it back. It is hers now. She made it hers.',
        effects: { evidence: 1, trust: 1, danger: 1 },
        artSubject:
          'A violet-scaled mermaid girl in black lace pulling a fierce face at a mirror while the reflection, an older violet-scaled woman, begins reluctantly to copy her, an aquamarine twin watching with wet eyes.',
      },
      {
        id: 'risk',
        label: 'Throw your shawl over the mirror and pull her away',
        outcome:
          'Char tears the shawl off before it settles. ‘Don’t you dare decide what I get to look at.’ The older face waits in the glass, patient. Char stares it down and stays behind alone with it when Scylla leaves, which is her right and is terrible.',
        effects: { trust: -1, evidence: -1 },
        artSubject:
          'A violet-scaled mermaid girl in black lace ripping a shawl off a tall mirror, glaring at an older woman’s still reflection, her aquamarine twin backing away toward the nursery door.',
      },
      {
        id: 'pull-the-face',
        label: 'Pull the old face back at her, tongue and all',
        outcome:
          'Scylla crosses her eyes and sticks out her tongue, and Char laughs because she will not let the glass have her. Only two of the faces in the mirror are laughing. The older Char watches them, solemn, until they swim away.',
        effects: { trust: 1, danger: 1 },
        artSubject:
          'Two identical mermaid girls, aquamarine and violet, pulling cross-eyed faces at a mirror and laughing, while in the glass a solemn older violet-scaled woman watches them without expression.',
      },
    ],
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'Scylla knows when that older face was last alive: going under green water at the tide gate. Char is staring at it, and Scylla cannot make herself say how it ends.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'The older Char in the glass is alive and grim, and behind her in the silver, palms press against a train window that nobody opened.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'Behind the older Char, in the corner of the glass, someone small stands in a place the map called empty.',
      },
      {
        flag: 'e05:8,3:care',
        text: 'They pulled this face together here once, two grinning idiots in soft silver. Char remembers. The glass has decided not to.',
      },
      {
        flag: 'e05:8,3:risk',
        text: 'Char told her here once that she’d go anyway, and want to know first. She looks at the older woman now as if she might finally be told.',
      },
    ],
  },
  {
    key: '1,4',
    place: 'Vault Swap Hatch',
    title: 'Fennick Trades in Dates',
    speaker: 'Fennick',
    kind: 'merchant',
    instant: true,
    opening:
      'Fennick’s swap tray holds nine identical tinderboxes, corked and unlabelled, and he won’t take any of them. ‘Things breed in the vault now,’ he says. ‘Whatever I put down comes back tomorrow, twice. Whatever you put down doesn’t.’ He no longer trades for things. Inside his hatch he keeps a column of true dates, scratched into the stone. ‘What day is it, Highness? Truly?’',
    artSubject: `A small hatch in a barnacled wall beside a great vault door, a wrinkled old merman in a cockle-shell apron behind a tray of nine identical brass tinderboxes, a column of scratch marks on the stone inside the hatch; ${SCYLLA}, leans close to answer; ${STYLE}.`,
    choices: [
      {
        id: 'notice',
        label: 'Tell him the true date',
        outcome:
          'Scylla tells him the day she counts, not the day the clocks insist on. Fennick scratches it under the others and slides a tinderbox across. ‘Take two,’ he says. ‘They’ll be four by morning, and I’d rather they were yours.’',
        effects: { supplies: 1, trust: 1 },
        artSubject:
          'A wrinkled old merman scratching a new mark into the stone inside his hatch with a nail, sliding two brass tinderboxes toward a young mermaid’s hand, dim lantern light.',
      },
    ],
    echoes: [
      {
        flag: 'e05:1,4:notice',
        text: 'The pearl hairpin she swapped for his first tinderbox lies on the tray too. So do four more, identical. Fennick won’t look at them.',
      },
    ],
  },
  {
    key: '2,4',
    place: 'Vault Shelving Aisle',
    title: 'Lamp Oil, Forty',
    speaker: 'Steward Pellow',
    kind: 'challenge',
    opening:
      'Steward Pellow has been counting the same aisle since the first bell. ‘Lamp oil, forty. Net, nine.’ The shelves hold hundreds now: jars have budded from jars overnight, every label gone blank. Above her the top shelf bows under oil that wasn’t there yesterday. She doesn’t look up. The Register’s number is forty, and she is reading the number, in a voice worn to a thread.',
    artSubject: `A long aisle of stone vault shelves crammed with hundreds of identical unlabelled jars, the top shelf bowing and cracking; a stern hoarse steward reads aloud from a slate beneath it without looking up; ${SCYLLA}, darts toward her down the aisle; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label: 'Say the real number aloud, so she can stop',
        outcome:
          '‘Two hundred and six,’ says Scylla, who has counted. Pellow stops. She looks up, sees the shelf and steps back as it cracks and comes down in a slick of oil. Then she writes the true count on her slate in her own hand, underlines it, and begins to cry with relief.',
        effects: { trust: 1, evidence: 1, danger: 1 },
        artSubject:
          'A stern steward stepping back as a vault shelf collapses in a spray of oil and jars, a young aquamarine mermaid beside her, the steward clutching her slate to her chest, tears in her eyes.',
      },
      {
        id: 'risk',
        label: 'Haul her clear by the arm before the shelf goes',
        outcome:
          'The shelf comes down where she stood, and oil runs everywhere. Pellow is safe, and shaking, and when she has her breath back she wipes her slate and starts again from the door: ‘Lamp oil, forty.’ Scylla saved her body. The count still has her voice.',
        effects: { danger: -1, supplies: -1 },
        artSubject:
          'A young aquamarine mermaid dragging a startled steward clear by the arm as a vault shelf crashes behind them, oil blooming through the water, the steward’s slate still raised.',
      },
      {
        id: 'call-oren',
        label: 'Call Oren down the aisle with his manifest',
        outcome:
          'Oren props the shelf with his axe haft in one movement and hands Pellow a page of his manifest: the real counts, checked twice. Pellow reads them like a letter from home. Now she knows he keeps true numbers, and so will anyone who asks her.',
        effects: { evidence: 1, trust: 1, danger: 1 },
        artSubject: `${OREN}, bracing a bowing vault shelf with the haft of his axe while handing a page to a hoarse steward who reads it with trembling relief, a young aquamarine mermaid between them.`,
      },
    ],
    echoes: [
      {
        flag: 'e05:2,4:care',
        text: 'Pellow still wears Scylla’s good scarf round her throat. It is the only thing in this aisle that hasn’t multiplied.',
      },
      {
        flag: 'e05:2,4:risk',
        text: '‘Two bags, Her Highness’ is still on her slate, underlined, copied out down the whole edge in a hand getting smaller.',
      },
      {
        flag: 'e05:2,4:let-oren',
        text: 'She once read Oren’s sixty-page ledger and found nothing wrong, and has distrusted this vault ever since. Now, that is a mercy.',
      },
    ],
  },
  {
    key: '3,4',
    place: 'Vault Crate Row',
    title: 'The Crate That Weighs Less',
    speaker: 'Oren Pike',
    kind: 'puzzle',
    opening:
      'Three unlabelled crates stand by Oren’s scales; the vault breeds copies now, and copies vanish by the next bell. ‘One is true salt fish,’ Oren says. ‘The Register lists each at forty pounds, and a copy weighs exactly what the Register lists. Last night I took two fish, a pound each, from the true crate for Tibby Dunlin, and wrote it down.’ The scales read: left, forty; middle, forty; right, thirty-eight.',
    artSubject: `Three identical unlabelled wooden crates beside great bronze scales in a lamplit vault whose shelves repeat into haze; ${OREN}, rests one huge hand on a crate lid and waits; ${SCYLLA}, frowns at the scales; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label: 'Open the right crate, at thirty-eight',
        outcome:
          'Real fish, salt-stiff and smelling of brine, with a gap where two are missing. Oren closes the lid and chalks a mark on it. ‘The Register writes what should be,’ he says. ‘The scales are not interested.’',
        effects: { evidence: 1, supplies: 1 },
        artSubject:
          'A tall hooded headsman lifting the lid of a crate of real salt fish with a small gap in the packing, a young aquamarine mermaid leaning in beside the bronze scales.',
      },
      {
        id: 'risk',
        label: 'Open the left crate, at the Register’s forty',
        outcome:
          'Inside are fish that look perfect and taste of nothing, and by the next bell the crate is empty and gone. Oren writes it in the manifest anyway: one crate, copy, vanished. He counts what isn’t there, too.',
        effects: { supplies: -1 },
        artSubject:
          'A young aquamarine mermaid holding up a flawless, faintly translucent fish from an open crate, a tall hooded headsman already writing in a small book beside her.',
      },
      {
        id: 'middle-crate',
        label: 'Open the middle crate, at forty',
        outcome:
          'Perfect fish again, weightless in the hand. While they wait to watch it vanish, the tide clock on the wall ticks, then ticks the same tick twice. Oren lifts the right crate onto his shoulder without a word.',
        effects: { danger: 1 },
        artSubject:
          'A tall hooded headsman hoisting a crate onto his shoulder while a young aquamarine mermaid stares at a glowing tidal clock on the vault wall, an open crate of too-perfect fish at her tail.',
      },
    ],
    echoes: [
      {
        flag: 'e05:3,4:care',
        text: '‘You read my labels right once,’ Oren says. ‘There are no labels now. Weight still tells the truth.’',
      },
      {
        flag: 'e05:3,4:risk',
        text: 'Oren remembers the hour lost to the wrong crate last time. He gives her every number twice.',
      },
      {
        flag: 'e05:3,4:kelp-cakes',
        text: 'Oren remembers the cakes that went soft. He has brought only fish this time, and every number he has.',
      },
    ],
  },
  {
    key: '4,4',
    place: 'Oren’s Scales',
    title: 'The Stranded, the Rescued and the Missing',
    speaker: 'Oren Pike',
    kind: 'companion',
    opening:
      'The packs have multiplied: two became twenty overnight, then two hundred, every one tagged S. and C., every label fading as Scylla reads it. Oren has stopped weighing them. On his scales lies a manifest in his printed hand, three columns, the stranded, the rescued and the missing, every name counted twice. A clerk’s note is pinned to it: Missing column to be surrendered by the evening bell.',
    artSubject: `The heart of a stone supply vault drowned in hundreds of identical leather packs with fading blank tags, great bronze scales at the centre holding a long three-column manifest with a pinned note; ${OREN}, stands over it, one finger on a name; ${SCYLLA}, reads beside him; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label: 'Read every name with him, and sign beneath as witness',
        outcome:
          'Oren reads them aloud, each twice, and Scylla signs under his name in her largest hand. The missing column stays. ‘They will come for it at the bell,’ he says. ‘Then they’ll find two names under it,’ says Scylla, and he makes the sound that is nearly a laugh.',
        effects: { trust: 2, evidence: 1, danger: 1 },
        artSubject:
          'A tall hooded headsman and a young aquamarine mermaid bent together over a long manifest on bronze scales, she signing at its foot with a quill, packs piled to the vault ceiling around them.',
      },
      {
        id: 'risk',
        label:
          'Tear off the missing column and surrender it, so the rest survives',
        outcome:
          'The stranded and the rescued stay safe in Oren’s apron, and with them every route he still means to use. The missing go into the court’s drawer. Oren watches the strip go. ‘I counted them twice,’ he says. ‘Now I must remember them once.’',
        effects: { danger: -1, supplies: 1, trust: -1 },
        artSubject:
          'A young aquamarine mermaid handing a long torn strip of names to a faceless clerk’s outstretched hand, a tall hooded headsman behind her folding the rest of the manifest into his apron, very still.',
      },
    ],
    echoes: [
      {
        flag: 'e05:4,4:care',
        text: 'The third pack she asked him for once is here too, multiplied with the rest. Oren’s name on its tag is the only label that hasn’t faded.',
      },
      {
        flag: 'e05:4,4:risk',
        text: 'Char’s iron grapple is back in her pack. Oren put it there. In the manifest’s margin, small: C. carries what C. chooses.',
      },
      {
        flag: 'e05:run-again',
        text: 'They ran, and the palace ran it back. At the top of the rescued column two names have been written, struck through and written again, more than once.',
      },
      {
        flag: 'e05:stay',
        text: 'They stayed, and safety closed like a lid: every tide sealed, nobody in, nobody out. The stranded column is the longest Oren has ever kept.',
      },
      {
        flag: 'e05:7,7:care',
        text: 'Tansy’s letter to Fenn is still in Scylla’s satchel, undelivered. Oren has the Dunlins under stranded, and Fenn, landward, under missing.',
      },
      {
        flag: 'e05:7,7:risk',
        text: 'The workers’ route Marl scratched on his slate has been closed. The Dunlins head the stranded column, underlined.',
      },
    ],
  },
  {
    key: '5,4',
    place: 'Vault Packing Bench',
    title: 'Char’s List, Overwritten',
    speaker: 'Char',
    kind: 'memory',
    opening:
      'Char sits on the packing bench with her list, which is not her list any more. In a clerk’s loops it reads: 1. Gratitude. 2. The ball. 3. Stay. She has written her own over it so often the paper has gone soft as felt, and every morning it is theirs again. Now she writes on her forearm, in ink. ‘Don’t you dare remember it for me,’ she says. ‘Just read it back, so I know I’m not mad.’',
    artSubject: `A worn packing bench in a vault of endlessly repeating shelves; ${CHAR}, sits with a sleeve pushed up and ink lines down her forearm, a soft overwritten sheet of paper on her knee, glaring up at ${SCYLLA}; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label: 'Read her arm back to her, word for word',
        outcome:
          '‘One. Boots. Two. Scylla’s comb. Three. Nobody decides for me: not them, not you.’ Scylla reads it exactly and adds nothing. Char lets go of a breath she has held since the stair. ‘Good,’ she says. ‘Again tomorrow.’',
        effects: { trust: 1, evidence: 1 },
        artSubject:
          'A young aquamarine mermaid reading carefully from the inked forearm of her violet-scaled twin in black lace, who listens with eyes closed and jaw set, lamplit vault behind.',
      },
      {
        id: 'risk',
        label: 'Tell her what her list said before, from your memory',
        outcome:
          'Scylla recites the old list perfectly. Char listens with her jaw set. ‘That’s your list,’ she says. ‘Of me.’ She writes none of it down. She keeps her own arm, and turns it away from her sister.',
        effects: { evidence: 1, trust: -1 },
        artSubject:
          'A violet-scaled mermaid in black lace turning her inked forearm away from her aquamarine twin, who is mid-sentence with one hand raised, on a packing bench in a dim vault.',
      },
      {
        id: 'ink-your-own',
        label: 'Write your own list on your arm beside hers',
        outcome:
          'Scylla’s list is short: 1. Ask her. Char reads it upside down and snorts. They sit on the bench with inked arms like two prisoners comparing tallies, and when the clerk comes by, neither will roll her sleeve down.',
        effects: { trust: 1, danger: 1 },
        artSubject:
          'Twin mermaid girls, one aquamarine with a pearl circlet, one violet in black lace, sitting shoulder to shoulder on a packing bench with ink lines on their bare forearms, defiant, as a clerk’s shadow falls across them.',
      },
    ],
    echoes: [
      {
        flag: 'e05:5,4:care',
        text: 'Line four, whatever Scylla isn’t saying, is the only line the clerk’s hand hasn’t touched. It is still empty, still saved, still Char’s.',
      },
      {
        flag: 'e05:5,4:risk',
        text: 'Char dropped the rope on Scylla’s pack once and demanded to know why. She is still waiting, and running out of patience.',
      },
      {
        flag: 'e05:5,4:smuggle-the-circlet',
        text: 'Her ‘except one’ survives in the margin, in Char’s hand, stubborn as a barnacle.',
      },
      {
        flag: 'e06:2,1:care',
        text: 'Char is still raw from the stair that ran her back to the morning, but whatever Scylla did there, she did it beside her.',
      },
      {
        flag: 'e06:2,1:risk',
        text: 'Char still has the looping stair in her jaw. She hasn’t forgiven the palace for it, and hasn’t decided about Scylla.',
      },
    ],
  },
  {
    key: '6,4',
    place: 'Vault Record Niche',
    title: 'An Oath Signed for Her',
    speaker: 'Ismay Coble',
    kind: 'memory',
    opening:
      'Ismay Coble has brought a departure oath out of the court’s own drawer: two lines, both signed, Scylla’s and Char’s, in hands that are almost theirs. ‘The Register drew it up for the official history,’ she says, very low. ‘I was told to file it. I have not filed it yet.’ Her good ink has been confiscated; she writes with soot now. ‘Somebody has signed your sister for her.’',
    artSubject: `A narrow record niche whose scroll pigeonholes repeat into darkness; a thin grey-haired archivist with soot-blackened fingers holds out a sheet with two signed lines; ${SCYLLA}, stares at the second signature; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label: 'Take it to Char, and let her strike it or keep it',
        outcome:
          'Char reads her own forged name a long moment, then draws one hard line through it and writes beside it, crooked: Not me. Ismay files that instead, the line showing. ‘Now it’s a record,’ she says. ‘Before, it was a story.’',
        effects: { trust: 1, evidence: 1, danger: 1 },
        artSubject: `${CHAR}, scoring a hard line through a signature on a sheet with a stub of soot, a grey-haired archivist waiting with an open drawer, her aquamarine twin standing back.`,
      },
      {
        id: 'risk',
        label: 'Burn the oath, both lines, before anyone can use it',
        outcome:
          'It goes up in the lamp, both forged names together. Nothing now says the princesses swore anything. Nothing says they didn’t, either, and Ismay, watching the ash drift, says that is how the court likes its gaps: empty, and theirs to fill.',
        effects: { danger: -1, evidence: -1, trust: -1 },
        artSubject:
          'A young aquamarine mermaid holding a sheet into a lamp flame in a narrow record niche, ash drifting upward through the water, a grey-haired archivist watching with a grim face.',
      },
      {
        id: 'file-a-correction',
        label: 'Ask Ismay to file a correction beside it, in plain words',
        outcome:
          'Ismay writes in soot beneath the court’s copy that the second signature is not Princess Char’s, and that the archivist saw it made. She signs it, which no archivist has done in a hundred years. ‘They want one history,’ she says. ‘They can have it with a footnote.’',
        effects: { evidence: 2, danger: 1 },
        artSubject:
          'A grey-haired archivist writing with a soot stick beneath a document on a slanted desk, her face set and brave, a young aquamarine mermaid holding the lamp for her.',
      },
    ],
    echoes: [
      {
        flag: 'e05:6,4:care',
        text: 'Scylla left the second line empty for Char once. It is not empty now.',
      },
      {
        flag: 'e05:6,4:risk',
        text: 'Scylla’s own line still bears the date of the tide gate, years ahead. The court has begun treating that date as a deadline.',
      },
      {
        flag: 'e05:6,4:refuse-oath',
        text: 'Scylla refused to swear once. The court drew up an oath anyway, with both lines signed, and filed her refusal under Lost.',
      },
      {
        flag: 'e05:tell-char',
        text: 'Char knows the future now, and said so before the court. Ismay was ordered to file her testimony under Dreams. She filed it under Testimony, and is waiting to be caught.',
      },
      {
        flag: 'e06:4,2:care',
        text: 'Ismay has heard how Scylla answered Councilor Salter in the gallery. It is why she came to her and not to the Register.',
      },
      {
        flag: 'e06:4,2:risk',
        text: 'Ismay has heard what passed under the disagreeing portraits, and weighs Scylla a long moment before she shows her anything.',
      },
    ],
  },
  {
    key: '7,4',
    place: 'Vault Rope Locker',
    title: 'Depth Unknown',
    speaker: 'Scylla',
    kind: 'treasure',
    instant: true,
    opening:
      'The rope locker has filled: coils on every peg and across the floor, more than the vault ever held, every tag blank. One spare hangs apart. Its tag once gave the landward shaft’s exact depth, but the tides have made that depth impossible, and Oren has struck the number out. Beneath, in his print: ‘Depth unknown. Plus one fathom for what I did not think of. Take all of it.’',
    artSubject: `A stone rope locker overflowing with identical tarred coils with blank tags, one spare coil hanging apart on its own peg; ${SCYLLA}, reaches up for it, lamplight catching the fibres; ${STYLE}.`,
    choices: [
      {
        id: 'notice',
        label: 'Measure the spare with your own arms',
        outcome:
          'Scylla measures it fathom by fathom, arm-span by arm-span, and it comes out the same length twice: the only thing in the vault that does. She coils it into her pack. Whatever the tides do, this rope means what it says.',
        effects: { supplies: 1 },
        artSubject:
          'A young aquamarine mermaid measuring a tarred rope between outstretched arms in a dim locker, coils of identical rope heaped around her tail.',
      },
    ],
    echoes: [
      {
        flag: 'e05:7,4:notice',
        text: 'The knot she tied in its end last time is still there, the one that comes undone only when you mean it to. Nobody has meant it to.',
      },
    ],
  },
  {
    key: '8,4',
    place: 'Oren’s Weighing Book',
    title: 'The Book Going Blank',
    speaker: 'Oren Pike',
    kind: 'memory',
    opening:
      'Oren’s Weighing Book is going blank from the edges in, like a tide going out: the Register is unwriting every pack that ever left. Oren copies vanishing lines into his manifest’s margin as fast as his pen will go. Two pages are fading now, side by side: the twins’ departure, and their mother’s unpacked pack. ‘I can hold one,’ he says, ‘if you read it to me.’',
    artSubject: `A heavy ledger open on a stone lectern, its pages whitening from the edges inward like a receding tide; ${OREN}, writes furiously in the margin of a long manifest beside it; ${SCYLLA}, stands with a finger on a fading line; ${STYLE}.`,
    choices: [
      {
        id: 'care',
        label: 'Read him the twins’ line, so it stays',
        outcome:
          'Scylla reads it aloud, every weight, and Oren copies it as the page whitens under her finger. In the margin of his manifest, the sisters’ departure still exists, in a hand like print. Their mother’s page goes white without a sound.',
        effects: { trust: 1, evidence: 1, danger: 1 },
        artSubject:
          'A young aquamarine mermaid reading aloud from a fading ledger page while a tall hooded headsman copies fast into a manifest, the facing page already blank white.',
      },
      {
        id: 'risk',
        label: 'Let the twins’ page go blank, so the court has nothing on Char',
        outcome:
          'Scylla says nothing, and the twins’ line fades. Nothing in the book can be used against Char now, and nothing in it says she ever chose. Oren holds their mother’s page instead, and says, very quietly, ‘You decided that for both of you.’',
        effects: { danger: -1, trust: -1 },
        artSubject:
          'A tall hooded headsman copying from one page of a fading ledger while a young aquamarine mermaid watches the facing page whiten to nothing, her hands folded tight.',
      },
      {
        id: 'save-mothers-page',
        label: 'Read him your mother’s page: proof a queen once chose',
        outcome:
          'A pack for one, no destination, Unpacked. Oren copies it whole. The twins’ page goes white, but the court’s one history now has a hole in it the shape of a queen who chose to stay. Oren underlines chose.',
        effects: { evidence: 2, trust: 1 },
        artSubject:
          'A tall hooded headsman underlining a copied line in a manifest with great care, a young aquamarine mermaid beside him looking at an old ledger whose pages are going blank.',
      },
    ],
    echoes: [
      {
        flag: 'e05:8,4:care',
        text: 'Oren told her once that their mother chose, and that it was the only part he wrote down. That line is fading first.',
      },
      {
        flag: 'e05:8,4:risk',
        text: 'Scylla tore the queen’s page out once, for Char. The book has grown it back word for word, and now it fades like the rest. The torn page is still folded in Char’s collar.',
      },
      {
        flag: 'e05:8,4:close-the-book',
        text: 'Scylla closed this book once without reading the weight. The Register has read it for her, and is taking it.',
      },
      {
        flag: 'e05:run-again',
        text: 'The twins’ line records their leaving, and then, in the same ink, their leaving again, on the same day twice.',
      },
    ],
  },
]
