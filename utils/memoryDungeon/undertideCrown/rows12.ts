import type { MorrowShiftSite } from '../morrowShift/types'

/**
 * e06 "Undertide Crown", rows 1–2: the Pearl Stair and the Council Gallery
 * again, warped. The stair loops to the morning before anything was
 * decided; the gallery's portraits disagree about what happened.
 * Anchors here: 2,1 (the looping stair) and 4,2 (the contradictory
 * portraits). 6,2 is the fixed Chronicle photograph "An Honest Mistake".
 */
const STYLE =
  'the same mermaid palace distorted by impossible tides, confiscated choices and duplicate royal portraits'
const SCYLLA =
  'a young mermaid princess with a pearl circlet, pale aquamarine scales and an older, worried gaze'
const CHAR =
  'her identical twin with dark violet scales, black lace and a furious, sardonic face'
const OREN =
  'Oren Pike, a very tall broad headsman whose whole head is covered by a rough brown cloth hood with two eyeholes, an axe at his side'

export const UNDERTIDE_CROWN_ROWS_1_2: readonly MorrowShiftSite[] = [
  {
    key: '1,1',
    place: 'Foot of the Pearl Stair',
    title: 'The Same Fourth Step',
    speaker: 'Char',
    kind: 'memory',
    opening:
      'Scylla wakes face-down on the fourth step of the Pearl Stair, her circlet knotted into her hair exactly as before, to the strand. The tide-clock says three days to the new moon. It said three days yesterday. Beside her hand, scratched into the pearl, are eleven short lines in Char’s crooked hand. From the top Char is not calling. She is shouting: ‘It’s happened again. Don’t you dare tell me it’s a morning.’',
    artSubject: `The foot of a spiralling pearl staircase in ${STYLE}, the light from above the same green-gold dawn repeated in every lamp; ${SCYLLA} lifts her head from a step, circlet tangled in her hair, beside eleven short scratched tally lines in the pearl; high above, leaning hard over the rail, ${CHAR} shouts down; a round tidal clock of glass dials in the wall, its hand stuck`,
    choices: [
      {
        id: 'care',
        label: 'Tell her yes, it has happened again',
        outcome:
          '‘Yes,’ Scylla calls. ‘Again.’ The tide below booms once, displeased, as if the stair had been listening. Char lets out a breath like a door unbarred. ‘Good. Then I’m not mad. Then we’re both in it.’ She comes down three steps to meet her, which she has never once done.',
        effects: { trust: 2, danger: 1 },
        artSubject: `On a pearl spiral staircase in ${STYLE}, ${SCYLLA} calls upward with her hand cupped to her mouth while ${CHAR} swims down three steps toward her, jaw set but relieved; a surge of tide foams angrily far below`,
      },
      {
        id: 'risk',
        label: 'Call back that it’s only a morning',
        outcome:
          '‘Only a morning,’ Scylla says, and the words come out easily, already worn smooth. The tide below goes quiet, satisfied. Char does not answer. When Scylla looks down, the newest of the eleven marks has been rubbed away, as if the stair agreed with her.',
        effects: { danger: -1, trust: -2 },
        artSubject: `${SCYLLA} smiles a practised, ordinary smile up a pearl staircase in ${STYLE}, while by her hand one of eleven scratched tally marks fades from the pearl; far above, ${CHAR} has gone silent and turned away from the rail`,
      },
      {
        id: 'count-the-marks',
        label: 'Count the marks before you answer',
        outcome:
          'Eleven in Char’s hand. Then a twelfth below the rest, straight and careful, in Scylla’s own grown-up hand, which she does not remember making. ‘You’re counting,’ Char shouts. ‘Don’t count. Answer me.’',
        effects: { evidence: 2, trust: -1 },
        artSubject: `Close view of ${SCYLLA} tracing scratched tally marks on a pearl step with one finger, eleven crooked lines and a twelfth, neat and straight, set apart below them, in ${STYLE}; a shadow of her twin leaning over the rail far above`,
      },
    ],
    echoes: [
      {
        flag: 'e05:run-again',
        text: 'Scylla remembers the Landward Gate, the boots, the two of them going. She remembers it twice now. Both times she woke here.',
      },
      {
        flag: 'e05:stay',
        text: 'They stayed. Scylla chose safety at the gate, and every morning since has been this morning: perfectly safe, the tide coming, nothing yet decided.',
      },
      {
        flag: 'e05:tell-char',
        text: 'Scylla told her everything at the gate, and Char remembers it. That is what she is shouting about. Something spent the night trying to make her forget, and she has the scratched knuckles to prove she did not let it.',
      },
      {
        flag: 'e05:1,1:care',
        text: '‘And don’t say “dramatic”,’ Char adds. ‘You said dramatic yesterday. You said it exactly the same.’',
      },
      {
        flag: 'e05:1,1:risk',
        text: 'Char stays at the top, out of reach. ‘And no hugging. Last time you held on like I was already gone.’',
      },
      {
        flag: 'e05:1,1:read-the-clock',
        text: 'Scylla once read this clock to the tide. Every number on it since has been the same number. The guard change is still at the second bell, and will be, if the palace has its way.',
      },
    ],
  },
  {
    key: '2,1',
    place: 'The Racing Step',
    title: 'The Stair That Comes Back',
    speaker: 'Char',
    kind: 'companion',
    opening:
      'Climb the Pearl Stair now and you arrive at its foot, on the morning before anything was decided. Char has raced it eleven times. She is crouched on the racing step, knuckles split from the rail, shaking with fury. ‘It wants a race. It wants me to win by a fin and you to say nothing, forever. I am not doing what a staircase wants.’ Below, the tide booms the same boom on the same beat.',
    artSubject: `A broad pearl landing on a spiral staircase in ${STYLE}, the stair visibly curling back on itself so its top step joins its own foot; ${CHAR} crouches on the starting line with split knuckles, glaring at the stair rather than the race; ${SCYLLA} hovers beside her; a white surge of tide breaking below on the same beat`,
    choices: [
      {
        id: 'care',
        label: 'Ask Char how she wants to break it, and follow her lead',
        outcome:
          'Char looks at her as if the question were a door. Then she turns her back on the top and swims down, against the tide, the way no race ever went. Scylla follows. The stair, given nothing it expected, lets them out sideways at the wrack step, into a morning that is finally a different morning.',
        effects: { trust: 2, evidence: 1, danger: 1 },
        artSubject: `${CHAR} dives head-first down a pearl spiral staircase against a foaming incoming tide, ${SCYLLA} following close behind her, both of them leaving the looping stair through a side landing heaped with tide-wrack, in ${STYLE}`,
      },
      {
        id: 'risk',
        label: 'Race her, win this time, and break the pattern yourself',
        outcome:
          'Scylla has never raced like this: older, colder, knowing every step. She wins by a whole stair, and the loop shudders and lets them both through, because she decided it. Char sits on the top step and will not look at her. ‘You won it for me. I didn’t ask to be won for.’',
        effects: { evidence: 2, trust: -2, danger: -1 },
        artSubject: `${SCYLLA} reaches the top of a pearl spiral staircase a whole stair ahead, the stair behind her straightening out of its loop, in ${STYLE}; ${CHAR} sits on the top step with her back turned, arms wrapped round her tail`,
      },
    ],
    echoes: [
      {
        flag: 'e05:2,1:care',
        text: 'Scylla raced this honestly once and lost by a fin. The stair has kept that race like a pressed flower, and plays it on the same beat every morning.',
      },
      {
        flag: 'e05:2,1:risk',
        text: 'Scylla once stopped halfway and asked what if land isn’t what they think. The stair stops her at that same step every loop, and Char has started stopping there too, waiting for the rest of the sentence.',
      },
      {
        flag: 'e04:char-lost-in-present',
        text: 'Each loop, at the fourth step, Scylla hears an older Char’s last cry inside the boom of the tide. This Char hears only the boom, and hates that her sister flinches.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'The lower doors of the stair knock all morning on the tide’s beat, like palms on glass. Char has started knocking back.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'At the bottom of the stair the service rooms flood each loop, drain, and flood. Each time, the same wet handprint is left on the inside of the door.',
      },
    ],
  },
  {
    key: '3,1',
    place: 'The Wrack Step',
    title: 'What the Tide Confiscates',
    speaker: 'Scylla',
    kind: 'memory',
    opening:
      'The wrack step still keeps what the tide brings, but now the tide brings what the court takes. Small white shells lie heaped here, each sealed in palace wax, each holding a whisper someone was not allowed to keep: I’ll go. I won’t. I told her. One near the top hums in Char’s voice. Its seal is still warm.',
    artSubject: `A curved pearl step in ${STYLE}, heaped not with tide-wrack but with hundreds of small white shells each sealed with a blob of red palace wax, faint ripples of sound coming off them; ${SCYLLA} kneels and lifts one shell that glows faintly violet`,
    choices: [
      {
        id: 'care',
        label: 'Carry Char’s shell to her unopened, so she can choose',
        outcome:
          'Char turns it over twice, then cracks the seal with a thumbnail and listens alone, her back to Scylla. She does not say what she heard. She tucks the shell inside her lace collar. ‘Mine,’ she says. ‘They don’t get to file it.’',
        effects: { trust: 2, danger: 1 },
        artSubject: `${CHAR} holds a small sealed shell to her ear with her back turned, eyes closed, while ${SCYLLA} waits a little way off with empty hands, on a pearl step heaped with wax-sealed shells, in ${STYLE}`,
      },
      {
        id: 'risk',
        label: 'Open it yourself and hear what Char decided',
        outcome:
          'Char’s voice, small and certain, says a sentence Scylla will not repeat to anyone. Then the shell goes grey and dull, used up. Scylla knows what her sister chose. Char will now never hear herself choose it.',
        effects: { evidence: 2, trust: -1 },
        artSubject: `${SCYLLA} holds a cracked shell to her ear as it fades from violet to dull grey in her hand, her face stricken, on a step of wax-sealed shells in ${STYLE}`,
      },
      {
        id: 'break-the-seals',
        label: 'Break every court seal and let the tide take them home',
        outcome:
          'Scylla cracks seal after seal until her fingers are thick with wax. The step empties on the ebb in a rush of whispers, I will, I won’t, I’m sorry, going back to whoever said them. Somewhere above, a bell rings for an inventory that has just come up short.',
        effects: { danger: 2, trust: 1, supplies: -1 },
        artSubject: `${SCYLLA} breaks wax seals off a heap of white shells with both hands while dozens of them tumble away down the stair on the ebbing tide, trailing ripples like voices, in ${STYLE}`,
      },
    ],
    echoes: [
      {
        flag: 'e06:2,1:care',
        text: 'Char is already beside her, still breathing hard from the swim down the stair. She has not seen the shell yet.',
      },
      {
        flag: 'e06:2,1:risk',
        text: 'Char came down by the servants’ steps rather than swim beside her. Scylla can hear her somewhere above, not coming closer.',
      },
      {
        flag: 'e05:tell-char',
        text: 'Most of the shells hum with one voice: Char’s, telling the court what Scylla told her. It has been confiscated eleven times. Char has told it twelve.',
      },
    ],
  },
  {
    key: '4,1',
    place: 'Lamp Niche Landing',
    title: 'The Eel That Keeps Time',
    speaker: 'Scylla',
    kind: 'monster',
    opening:
      'Every lamp-jar on this landing is lit, each showing the same dawn, and the glimmer eel has fed on that dawn until it fills the niche and loops twice round the rail. It still bites anything that shines. Now it bites anything that moves out of turn: Kip the lamp-boy, caught by the fin on the wrong step this morning, has been holding very still since the second bell.',
    artSubject: `A landing on a pearl staircase in ${STYLE}, every lamp-jar glowing with the identical pink dawn; a huge swollen pale eel coiled twice round the rail, its jaws clamped on the tail-fin of a frightened small mer-boy with a lamp-pole who holds perfectly still; ${SCYLLA} pressed against the wall below, circlet glinting`,
    choices: [
      {
        id: 'care',
        label: 'Hide your circlet and talk Kip through moving only in turn',
        outcome:
          'Scylla wraps her circlet in her sleeve and counts aloud, step by step, the way the stair wants. Kip moves only on her count. At last the eel lets go of a fin it has no reason left to hold. It takes an hour. Kip does not let go of her hand all the way to the top.',
        effects: { danger: -1, trust: 1, supplies: -1 },
        artSubject: `${SCYLLA}, circlet bundled in her sleeve, holds a small mer-boy’s hand and counts aloud as he eases his tail-fin out of a giant pale eel’s slackening jaws, one step at a time, in ${STYLE}`,
      },
      {
        id: 'risk',
        label: 'Flash the circlet in its eyes and pull him free',
        outcome:
          'The eel strikes at the shine and Scylla hauls Kip clear by the collar. It takes a strip of her tail-fin for its trouble and does not let go of that either. Kip stares at the bite, then at her. ‘They’ll write you down for that, Highness.’ He sounds proud.',
        effects: { danger: 2, trust: 2 },
        artSubject: `${SCYLLA} holds her pearl circlet out like a mirror into a huge pale eel’s eyes while hauling a small mer-boy free by the collar, the eel’s jaws closing on her own tail-fin instead, in ${STYLE}`,
      },
      {
        id: 'break-the-dawn',
        label: 'Smash the dawn lamps so it has nothing to feed on',
        outcome:
          'Glass and glow-shrimp everywhere. In the dark the eel shrinks to its old size and slides off sulking, and for a moment the stair-shaft shows a real hour: late, grey, not morning at all. Kip runs. The court will want to know who broke the dawn.',
        effects: { evidence: 2, danger: 1, supplies: -1 },
        artSubject: `Shattered lamp-jars and scattering glow-shrimp on a dark pearl landing in ${STYLE}, a shrinking pale eel slithering away, a small mer-boy fleeing up the stair, ${SCYLLA} looking up a stair-shaft lit by cold grey real daylight`,
      },
    ],
    echoes: [
      {
        flag: 'e05:4,1:care',
        text: 'The pearl Scylla lost on this stair once, climbing blind, glows in the eel’s coils. It has kept it safe. It is still shining.',
      },
      {
        flag: 'e05:4,1:risk',
        text: 'The eel remembers being tricked with a reflection. Every polished step on this landing has been scratched dull.',
      },
      {
        flag: 'e05:4,1:wake-the-lamp',
        text: 'There are two of it now: one on the lower stair, where Scylla once lured it, and this one, identical, which was never lured anywhere.',
      },
    ],
  },
  {
    key: '5,1',
    place: 'Riddle Landing',
    title: 'Not Where They’ve Been',
    speaker: 'Char',
    kind: 'puzzle',
    opening:
      'Char hides the route map somewhere new every loop, because the court finds it every loop. Three shell niches: coral, pearl, abalone. A court seal is pressed into the coral, where the map lay the first time. The pearl niche is scrubbed so bright it shines, the way the court leaves a niche it has emptied. The abalone is dark and smells of eel. Char’s chalk: ‘Not where they’ve sealed. Not where they’ve scrubbed.’',
    artSubject: `A turning landing on a pearl staircase in ${STYLE}, three shell-lined niches in the wall: red coral stamped with a wax court seal, pearl scrubbed to a hard shine, and dark iridescent abalone; half-wiped chalk smudges on the step; ${SCYLLA} considers them, finger to her lips`,
    choices: [
      {
        id: 'care',
        label: 'Reach into the shining pearl niche',
        outcome:
          'One slip of court paper: the official route, in a careful forgery of Char’s hand. Back down, always back down. Scylla’s fingers leave prints on the scrubbed shell, and before long a clerk will notice the niche is no longer clean.',
        effects: { danger: 1, evidence: -1 },
        artSubject: `${SCYLLA} holds up a stiff slip of court paper from a scrubbed pearl niche, frowning at forged handwriting, her fingerprints smudging the shining shell, in ${STYLE}`,
      },
      {
        id: 'risk',
        label: 'Reach into the dark abalone niche',
        outcome:
          'Cold, slick, and empty of eel. The map is rolled at the back in black ribbon, redrawn: a crooked, fearless route that goes down to go up and never takes the same turn twice. In the corner Char has written: ‘mine. drawn by me. ask before you change it.’',
        effects: { evidence: 2, trust: 1 },
        artSubject: `${SCYLLA} unrolls a hand-drawn map tied in black ribbon beside a dark abalone niche, a crooked inked route spiralling down and then up across it, in ${STYLE}`,
      },
      {
        id: 'coral-niche',
        label: 'Break the court seal on the coral niche',
        outcome:
          'The wax cracks and somewhere above a bell answers, small and precise. The coral holds only a receipt in the court’s square hand: ‘One route, surrendered.’ By the time a guard comes, Scylla is three landings away and no wiser.',
        effects: { danger: 1, trust: -1 },
        artSubject: `${SCYLLA} peels a cracked wax seal from a red coral niche and finds only a small square receipt inside, while a bell trembles on the wall above, in ${STYLE}`,
      },
    ],
    echoes: [
      {
        flag: 'e05:5,1:coral-niche',
        text: 'Scylla found the map in the coral once and carried it up this stair. She has wondered since whether that is how the court learned where to look.',
      },
      {
        flag: 'e05:5,1:care',
        text: 'Over the scrubbing on the pearl niche someone has chalked PREDICTABLE again, in Char’s writing. It is either a joke or a warning.',
      },
      {
        flag: 'e05:5,1:risk',
        text: 'Scylla’s hand remembers the eel’s teeth in that abalone niche. That, she suspects, is exactly why Char chose it.',
      },
      {
        flag: 'e06:2,1:risk',
        text: 'Char’s chalk has a line beneath it, hard enough to snap the chalk: ‘and don’t win this one for me either.’',
      },
    ],
  },
  {
    key: '6,1',
    place: 'Fin-Rack Landing',
    title: 'Returned by Order',
    speaker: 'Scylla',
    kind: 'treasure',
    instant: true,
    opening:
      'The scruffy black fin-sheaths are gone. Scylla’s good pair hangs on her own hook again, polished, with a court tag on the strap: ‘Returned to its rightful owner. Borrowing is not permitted.’ Char’s old note is still pinned beneath it, scratched over so hard by the tag-clerk’s stylus that only one word survives: ‘love’.',
    artSubject: `A carved pearl rack on a staircase landing in ${STYLE}, every hook hung with two identical pairs of racing fin-sheaths, one hook holding a single polished pair with a stiff official tag tied to the strap; ${SCYLLA} lifts a scratched-over note pinned beneath it`,
    choices: [
      {
        id: 'notice',
        label: 'Unpin the court tag and keep Char’s note',
        outcome:
          'Behind the tag, in letters so small the clerk missed them, Char has written: ‘borrowed anyway.’ Scylla packs the good pair for Char and leaves her own hook bare. Let the court tag that.',
        effects: { supplies: 1, trust: 1 },
        artSubject: `${SCYLLA} tears an official tag from a fin-sheath strap and smiles at tiny handwriting hidden beneath it, folding the sheaths into a satchel beside an empty hook, in ${STYLE}`,
      },
    ],
    echoes: [
      {
        flag: 'e05:6,1:notice',
        text: 'Scylla’s own reply, ‘borrowed back, love, the faster one’, has been scraped off entirely. The court does not record jokes.',
      },
      {
        flag: 'e06:2,1:care',
        text: 'Fresh chalk on the rack, Char’s hand: ‘the stair lost.’ For once there is no argument about who won.',
      },
      {
        flag: 'e06:2,1:risk',
        text: 'Fresh chalk on the rack, Char’s hand: ‘won FOR me. not BY me.’',
      },
    ],
  },
  {
    key: '7,1',
    place: 'Moonlit Landing',
    title: 'Forty-One Every Night',
    speaker: 'Oren Pike',
    kind: 'companion',
    opening:
      'Moonlight still falls down the shaft like a ribbon, and Oren Pike is still knotting his cord in it. The tide climbs to the forty-first knot every night now, exactly, and a court clerk has told him to write it once and call that the record. Oren writes it every night, dated, twice. ‘If the nights are the same, the book will show it,’ he says. ‘Then someone will have to explain it.’',
    artSubject: `A ribbon of moonlight down a pearl stair-shaft in ${STYLE}, the high-water stain on the wall the same height repeated in identical rings; ${OREN}, knots a long measuring cord and writes in a thick book with dated columns; ${SCYLLA} watches from the steps`,
    choices: [
      {
        id: 'care',
        label: 'Hold the cord and sign tonight’s count beside his',
        outcome:
          'They count to forty-one together, and Scylla signs under his printed hand as witness. Oren looks at the signature a long moment. ‘That makes two of us the clerk will ask about.’ He copies it onto the second page, so it is two of them, twice.',
        effects: { trust: 1, evidence: 1, danger: 1 },
        artSubject: `In moonlight underwater, ${SCYLLA} signs her name in a thick ledger held open by ${OREN}, a knotted cord looped between them, in ${STYLE}`,
      },
      {
        id: 'risk',
        label: 'Ask him to write it once, as the clerk wants, to keep him safe',
        outcome:
          'Oren stops knotting. ‘Princess. You are asking me to agree the nights are one night.’ He writes it once, for her, and Scylla watches a careful man make himself less careful. When he thinks she has gone, he writes the rest in the back of the book.',
        effects: { danger: -1, trust: -1 },
        artSubject: `${OREN} stands very still with a stylus over a ledger, his hooded head bowed toward ${SCYLLA}, a knotted cord slack in his other hand, moonlight between them, in ${STYLE}`,
      },
    ],
    echoes: [
      {
        flag: 'e05:7,1:care',
        text: '‘Forty-one,’ Oren says. ‘You counted to forty-one once, with me. The tide has been doing it ever since, as if it learned it from you.’',
      },
      {
        flag: 'e05:7,1:risk',
        text: '‘The third night,’ he says, unasked. ‘I told you about the third night. It has been the third night for some time.’',
      },
      {
        flag: 'e05:4,4:care',
        text: 'There are three packs on his list, the third in his own name. Somebody has struck it through in court ink. Oren has written it back underneath.',
      },
      {
        flag: 'e05:4,4:risk',
        text: 'In the margin, angled away from her: Char’s pack, a pound light, one grapple. He has not forgotten. He has not told Char. He is waiting for Scylla to.',
      },
    ],
  },
  {
    key: '8,1',
    place: 'Top of the Pearl Stair',
    title: 'The Mirror Moves First',
    speaker: 'Scylla',
    kind: 'memory',
    instant: true,
    opening:
      'At the top step the tide-worn mirror still shows faces softly. But the reflection has stopped lagging a breath behind. It moves a breath ahead now: straightening its circlet before Scylla’s hand rises, turning toward the stair before she has decided to turn. It looks very sure of what she will do.',
    artSubject: `The top of a pearl staircase in ${STYLE}, a tall cloudy tide-scoured mirror in a shell frame; ${SCYLLA} rests her arms on the top step, hands still, while her reflection has already raised a hand to straighten its circlet`,
    choices: [
      {
        id: 'notice',
        label: 'Do something it hasn’t done yet',
        outcome:
          'Scylla crosses her eyes, which is Char’s trick and never hers. The reflection hesitates, then copies her a breath late, as it should. It looks almost relieved to be behind again. She does not trust the relief.',
        effects: { evidence: 1 },
        artSubject: `Close view of a cloudy tide-worn mirror in ${STYLE}: ${SCYLLA} crosses her eyes comically while her reflection, a beat behind, only begins to copy her`,
      },
    ],
    echoes: [
      {
        flag: 'e04:char-lost-in-present',
        text: 'For one breath the glass shows an older Char at the tide gate, turning toward the water before anyone could stop her. Then only Scylla again, moving first.',
      },
      {
        flag: 'e04:char-alive-commuters-stranded',
        text: 'Behind her reflection: rows of lit windows, a stalled train under the sea. Every face at the glass turns toward her a breath before she looks.',
      },
      {
        flag: 'e04:char-alive-district-at-risk',
        text: 'In the worn corner of the glass the plain service door stands open now, and someone’s reflection waits in it, a breath ahead of whoever it belongs to.',
      },
      {
        flag: 'e05:8,1:notice',
        text: 'Once this mirror took a breath to remember how to copy her. Now it remembers in advance.',
      },
    ],
  },
  {
    key: '1,2',
    place: 'Coronet Cabinet',
    title: 'Two of Every Crown',
    speaker: 'Scylla',
    kind: 'treasure',
    instant: true,
    opening:
      'Every child’s coronet in the cabinet has been straightened, polished and duplicated, so each hook holds two identical crowns, as if every princess had been crowned twice to be sure. Char’s fish-hook coronet is gone. In its place hang two perfect ones, her name engraved on both, neither of them bent by a bored seven-year-old.',
    artSubject: `A tall glass-fronted cabinet at the entrance of a portrait gallery in ${STYLE}, dozens of tiny gleaming coronets hung in exact identical pairs; ${SCYLLA} opens the glass toward a pair of perfect little crowns`,
    choices: [
      {
        id: 'notice',
        label: 'Bend one of Char’s back into a fish-hook',
        outcome:
          'The metal remembers. It curls into the hook almost gladly, and on the hook beside it the twin crown tarnishes as Scylla watches, as if the cabinet has been forced to decide which one is real. She keeps the bent one for Char to judge.',
        effects: { supplies: 1, evidence: 1 },
        artSubject: `Close view of ${SCYLLA}’s hands bending a small polished coronet into a crooked fish-hook shape while its identical twin on a hook beside it turns dull and tarnished, in ${STYLE}`,
      },
    ],
    echoes: [
      {
        flag: 'e05:1,2:notice',
        text: 'Scylla’s pocket is empty. The black pearl she shook out of Char’s coronet is gone from it, and through the glass she can see one inside each perfect copy. The court returns things to where it says they belong.',
      },
    ],
  },
  {
    key: '2,2',
    place: 'The Twins’ Portrait',
    title: 'One Princess, Painted',
    speaker: 'Char',
    kind: 'memory',
    opening:
      'The newest portrait shows one princess now, smiling, crowned. To Scylla she is Scylla. Char stands before it with folded arms and says, very flatly, ‘It’s me. Only me, in a crown I never wanted. There’s your crack. They painted one of us out, and they haven’t decided which.’ Two guards drift nearer. A clerk’s note on the frame says the painter’s double fee is to be refunded.',
    artSubject: `A long gallery in ${STYLE}, portraits of queens hung in duplicate; before a fresh portrait of a single smiling crowned girl, ${CHAR} stands with folded arms and ${SCYLLA} beside her, the painted face seeming to shift between them; two guards in shell armour drift closer`,
    choices: [
      {
        id: 'care',
        label: 'Tell her what you see, and believe what she sees',
        outcome:
          '‘I see me,’ Scylla says. ‘You see you. Then it’s lying to both of us.’ Char’s arms come down. Together they say both their names aloud, to the portrait. The guards write both names down, which is, for once, exactly right.',
        effects: { trust: 2, evidence: 1, danger: 1 },
        artSubject: `Two identical young mermaid princesses, ${SCYLLA} and ${CHAR}, stand shoulder to shoulder facing a portrait of a single crowned girl, speaking aloud together, while a guard writes on a wax tablet, in ${STYLE}`,
      },
      {
        id: 'risk',
        label: 'Tell her it shows you both, so she won’t be frightened',
        outcome:
          'Char looks from the portrait to her sister and back. ‘You’re doing it,’ she says quietly. ‘You’re doing what it does. Deciding what I saw.’ The portrait’s smile does not move, but at the edge of Scylla’s eye it seems pleased.',
        effects: { danger: -1, trust: -2 },
        artSubject: `${CHAR} turns away from her twin ${SCYLLA}, hurt and cold, while behind them the painted single princess in the portrait smiles a fraction wider, in ${STYLE}`,
      },
    ],
    echoes: [
      {
        flag: 'e05:2,2:care',
        text: '‘You said memorising,’ Char says. ‘In case we never came back. Well. One of us had better remember it right.’',
      },
      {
        flag: 'e05:2,2:risk',
        text: '‘I said I’d paint over the crowns,’ Char says. ‘They heard. They painted a bigger one.’',
      },
      {
        flag: 'e05:tell-char',
        text: '‘You told me how it ends,’ Char says, not looking away from the paint. ‘That doesn’t make it yours to tell me what I see.’',
      },
    ],
  },
  {
    key: '3,2',
    place: 'Pearl-Lock Chest',
    title: 'Two Books, Kept Even',
    speaker: 'Mrs Pilchard',
    kind: 'merchant',
    instant: true,
    opening:
      'Mrs Pilchard still sits on the pearl-lock chest, but by order it is the Confiscations Chest now, and she has been issued a book to log them in. She keeps two. The court’s is very thin. Her own is very thick and lists, for every glove and hairpin and whispered plan, whose it is. ‘Something for something, Highness. The court likes the place kept empty. I keep it even.’',
    artSubject: `A stout elderly mer-woman attendant with a ring of keys sits on a heavy chest with a great pearl lock in an alcove of ${STYLE}, a thin official ledger on one knee and a fat battered one hidden under her shawl; ${SCYLLA} holds out a hairpin`,
    choices: [
      {
        id: 'notice',
        label: 'Swap a hairpin for whatever’s on top',
        outcome:
          'On top is a coil of sealskin boot-laces, landward work. Mrs Pilchard writes ‘hairpin, surrendered’ in the court’s book, and in her own: ‘laces, lent, to be returned to whoever needs them next.’ She blots both with the same thumb.',
        effects: { supplies: 1, trust: 1 },
        artSubject: `An elderly attendant writes in two ledgers at once, one thin and one fat, while ${SCYLLA} tucks a coil of sealskin boot-laces into her sleeve, the pearl-lock chest between them, in ${STYLE}`,
      },
    ],
    echoes: [
      {
        flag: 'e05:3,2:notice',
        text: 'Scylla’s second-best hairpin is already lying in the chest, though she remembers swapping it away three days ago. Mrs Pilchard says, mildly, that things come back now, and she has stopped being surprised.',
      },
    ],
  },
  {
    key: '4,2',
    place: 'Petition Lectern',
    title: 'Three Decrees, One Frame',
    speaker: 'Councilor Neve Salter',
    kind: 'memory',
    opening:
      'Above the lectern, where one stern queen hung, three now share a single frame: the same face three times, each holding a different decree. The princesses ran. The princesses stayed. The princesses never meant to go. Each swears to her own aloud, all day. Councilor Neve Salter has put her petition away and is taking testimony instead, on a fresh scroll, from anyone willing to give it in their own name.',
    artSubject: `In ${STYLE}, one great frame holding three identical severe crowned queens side by side, each holding up a different sealed decree, their mouths open mid-speech; beneath them a brisk middle-aged councilor with ink-stained fingers and spectacles writes on a long fresh scroll at a lectern; ${SCYLLA} stands before her`,
    choices: [
      {
        id: 'care',
        label: 'Give your own testimony, and leave Char’s line for her',
        outcome:
          'Scylla says what she remembers, only that, in her own name, and Salter writes it plainly. Below it she leaves a line empty and rules it with a ruler. ‘Hers,’ Salter says, ‘when she wants it.’ The three queens shout over one another. None of them can make the empty line agree.',
        effects: { trust: 2, evidence: 1, danger: 1 },
        artSubject: `A councilor in spectacles rules a neat empty line beneath ${SCYLLA}’s testimony on a long scroll, while above them three identical painted queens in one frame shout over each other, in ${STYLE}`,
      },
      {
        id: 'risk',
        label: 'Testify for both of you, so Char needn’t face the portraits',
        outcome:
          'Scylla speaks for two, carefully, kindly. Salter writes it, then stops with the pen up. Above them one of the three queens falls silent, satisfied, her decree accepted. Scylla understands too late that she has just helped the court choose its history, and chosen it in Char’s name.',
        effects: { evidence: 2, trust: -2, danger: -1 },
        artSubject: `${SCYLLA} speaks earnestly at a lectern while a councilor’s pen hovers motionless over a scroll; above them, of three identical queens in one frame, one has closed her mouth and smiles, in ${STYLE}`,
      },
    ],
    echoes: [
      {
        flag: 'e05:4,2:care',
        text: 'Scylla’s signature from the reform petition has been cut out and pasted under the decree that says the princesses ran: proof, the court calls it, of intent.',
      },
      {
        flag: 'e05:4,2:risk',
        text: 'Under the decree that says the princesses stayed, the court has pasted Char’s signature from the petition: the one Scylla forged. It is being used to prove Char consented. Salter has noticed, and waits.',
      },
      {
        flag: 'e05:tell-char',
        text: 'Salter shows her yesterday’s scroll: Char’s testimony, entered in full, a whole page. This morning the page is blank, and the blank has been sealed.',
      },
      {
        flag: 'e05:stay',
        text: '‘You stayed,’ the second queen tells everyone who passes, ‘and were perfectly safe.’ She says it in Mother’s voice, very kindly.',
      },
      {
        flag: 'e05:run-again',
        text: '‘You ran,’ the first queen says, ‘and you know how it ended,’ and the whole gallery is meant to understand that this is why running is forbidden.',
      },
    ],
  },
  {
    key: '5,2',
    place: 'The Young Queen’s Portrait',
    title: 'Say It Back',
    speaker: 'Scylla',
    kind: 'challenge',
    opening:
      'The portrait of Mother as a girl speaks in Scylla’s own grown voice now, one sentence, over and over: ‘Nothing was decided.’ Two guards stand beneath it, and everyone who passes must say it back. Ahead of Scylla, a kitchen girl says it with her fingers crossed behind her. The guard has seen. So has Scylla.',
    artSubject: `A portrait of a solemn girl-queen in a pearl frame in ${STYLE}, ripples spreading from its painted lips; two guards in shell armour beneath it, one stepping toward a nervous kitchen girl whose fingers are crossed behind her back; ${SCYLLA} next in line`,
    choices: [
      {
        id: 'care',
        label: 'Say it wrong, loudly, so the girl can slip away',
        outcome:
          '‘Everything was decided,’ Scylla says, in a princess’s carrying voice, ‘and I was there.’ Both guards turn. The kitchen girl is round the corner before either remembers her. The portrait stutters and starts again, and Scylla’s name goes into a guard’s tablet in very neat letters.',
        effects: { danger: 2, trust: 1, evidence: 1 },
        artSubject: `${SCYLLA} speaks out loudly with her chin raised before a murmuring portrait while two guards turn toward her and a kitchen girl darts away round a corner behind them, in ${STYLE}`,
      },
      {
        id: 'risk',
        label: 'Say it word-perfect and walk on',
        outcome:
          '‘Nothing was decided.’ It is her voice twice, the portrait’s and her own, and they fit like a lid. The guards nod her through. She tastes the sentence for an hour. When she looks for the kitchen girl later, she is not at the kitchens.',
        effects: { danger: -1, trust: -1 },
        artSubject: `${SCYLLA} glides past two nodding guards beneath a speaking portrait, her lips pressed tight, a pale ripple of words trailing from her mouth to the painting’s, in ${STYLE}`,
      },
      {
        id: 'cover-portrait',
        label: 'Throw your shawl over the frame mid-sentence',
        outcome:
          'The voice cuts off at ‘Nothing was—’ and for a moment the gallery hears its own silence. In the confusion the girl uncrosses her fingers and walks on. The guards take the shawl down, fold it, and enter it in a book as evidence.',
        effects: { danger: 1, supplies: -1, trust: 1 },
        artSubject: `A sea-green shawl flies over a gilded portrait frame mid-speech while two startled guards look up and a kitchen girl slips away behind them, ${SCYLLA} with empty outstretched hands, in ${STYLE}`,
      },
    ],
    echoes: [
      {
        flag: 'e05:5,2:care',
        text: 'The best shawl Scylla hung over this frame three days ago is displayed beside it now, under glass, as an exhibit.',
      },
      {
        flag: 'e05:5,2:risk',
        text: 'Scylla once heard everything this portrait had to say. It has been cut down since to one sentence. That is somehow worse.',
      },
      {
        flag: 'e06:4,2:care',
        text: 'The guard knows she testified at the lectern in her own name. ‘You’ll say it, Highness,’ he says, not unkindly. ‘Everyone does, in the end.’',
      },
      {
        flag: 'e06:4,2:risk',
        text: 'One guard bows to her. ‘Your Highness testified for both princesses. You needn’t say it back. You already have.’',
      },
    ],
  },
  {
    key: '6,2',
    place: 'Chamberlain’s Door',
    title: 'Corrections Without Names',
    speaker: 'Scylla',
    kind: 'memory',
    opening:
      'The Chamberlain’s Door has become a corrections desk. Every record bound for the gallery passes under his scraper: errors shaved off, the proper answer inked in, no name beside it, as if no mistake had ever had an owner. In his tray, between two scraped minutes, lies something dry, square and glossy that no tide should have carried. Scylla knows it at once for the dry world: an office, grey window light, and red ink.',
    artSubject: `A tall shell-inlaid doorway in ${STYLE} turned into a clerk’s desk heaped with scraped and rewritten scrolls and a little bone scraper; in a wooden tray among them lies a dry glossy square photograph; ${SCYLLA} reaches for it while an elderly chamberlain’s staff of office leans unattended against the desk`,
    choices: [],
  },
  {
    key: '7,2',
    place: 'Three Queens Alcove',
    title: 'Now the Queens Tell Everything',
    speaker: 'Char',
    kind: 'puzzle',
    opening:
      'Char wants somewhere to speak her testimony aloud and keep it. The court has been at the three queens over the alcove. Ottilie has a second conch painted at her other ear. Brannagh’s pearl stitches have been snipped by order; her mouth hangs open. Ise has been painted awake, a court coif tied tight over both ears. The nursery verse still holds: ‘Ears to hear and mouth to tell, a queen needs both to tattle well.’',
    artSubject: `A curtained alcove in ${STYLE} beneath three altered portraits of queens: one with a conch painted at each ear, one with cut pearl stitches dangling from an open mouth, one painted wide awake with a tight white coif over her ears; ${CHAR} pulls ${SCYLLA} toward them`,
    choices: [
      {
        id: 'care',
        label: 'Whisper under Ise, the coifed queen',
        outcome:
          'Ise’s mouth moves, but there is nothing behind her ears for it to repeat. Char says all of it, out loud, in her own words, and Scylla only listens and corrects nothing. When she is done Char looks lighter. ‘Witnessed,’ she says. ‘By you. That’ll do.’',
        effects: { evidence: 2, trust: 1 },
        artSubject: `Beneath a portrait of a queen with a white coif over her ears, ${CHAR} speaks intently with her hands moving, while ${SCYLLA} listens with her own hands folded, in ${STYLE}`,
      },
      {
        id: 'risk',
        label: 'Whisper under Brannagh, the unstitched queen',
        outcome:
          'Brannagh hears every word, and now she can tell. Down the gallery she repeats it in Char’s voice, but wrong: ‘The princess consents to remain.’ Char goes white, then furious. ‘That isn’t what I said.’ It is what the gallery heard.',
        effects: { danger: 1, trust: -1 },
        artSubject: `A portrait of a queen with cut pearl stitches speaking, ripples spreading down a long gallery, while ${CHAR} stares at it white-faced and furious beside ${SCYLLA}, in ${STYLE}`,
      },
      {
        id: 'ottilie-conch',
        label: 'Whisper under Ottilie, the twice-eared queen',
        outcome:
          'Ottilie hears it twice and tells it twice. By lunch the under-clerk has two copies of Char’s testimony. He files one, burns the other, and cannot remember which he burned.',
        effects: { danger: 1, evidence: -1 },
        artSubject: `A portrait of a queen with a conch at each ear in ${STYLE}, and through a cutaway wall a fussy under-clerk holding two identical scrolls, one over a brazier, frowning at both`,
      },
    ],
    echoes: [
      {
        flag: 'e05:7,2:care',
        text: 'Ise once talked in her sleep at the turn of a tide and said too much in Char’s voice. That is why the court has painted her awake.',
      },
      {
        flag: 'e05:7,2:risk',
        text: 'Brannagh once kept every word of Char’s plan. The court found out. That is why her stitches are cut.',
      },
      {
        flag: 'e05:7,2:ottilie-conch',
        text: 'Ottilie once told the under-clerk about the boots. The court rewarded her with a second ear.',
      },
    ],
  },
  {
    key: '8,2',
    place: 'Gallery Tide-Clock',
    title: 'Three Days, Every Day',
    speaker: 'Steward Pellow',
    kind: 'memory',
    instant: true,
    opening:
      'The great tide-clock’s pearl hand creeps forward all day and is found every dawn back at three days. Steward Pellow has been ordered to wind it back each morning, and does, with a face like a closed ledger. On the frame beside the dial, very small and very neat, she has cut a notch for every time.',
    artSubject: `A vast tidal clock of nested glass dials filling the end wall of a gallery in ${STYLE}, its pearl hand at the third moon; a stern mer-woman steward with a winding key stands on a ladder beside a row of tiny neat notches cut into the frame; ${SCYLLA} looks up from below`,
    choices: [
      {
        id: 'notice',
        label: 'Count Pellow’s notches',
        outcome:
          'Twelve: one more than the chalk marks on the fourth step. Scylla wonders which of them lost count, and is afraid it was her. Pellow, passing with her winding key, sneezes and says without looking, ‘I count everything, Highness. Somebody has to count this.’',
        effects: { evidence: 1, trust: 1 },
        artSubject: `Close view of ${SCYLLA}’s finger tracing twelve tiny neat notches on the frame of a great glass tidal clock, a steward with a winding key passing behind her, in ${STYLE}`,
      },
    ],
    echoes: [
      {
        flag: 'e05:8,2:notice',
        text: 'High water at the landward gate in three nights, an hour after the guard change. Scylla read it to the minute once. It has said the same minute ever since.',
      },
      {
        flag: 'e06:4,2:care',
        text: 'Salter has tucked her testimony scroll behind the clock glass to keep it dry. An empty ruled line shows through the dial, under the mark for high water.',
      },
      {
        flag: 'e06:4,2:risk',
        text: 'Behind the clock glass the court has tucked a fair copy of Scylla’s testimony for two. The clock ticks over it, pleased with itself.',
      },
    ],
  },
]
