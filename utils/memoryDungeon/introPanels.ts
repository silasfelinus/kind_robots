/**
 * The illustrated opening (2026-11-20 PT, conductor memory-dungeon/t-079):
 * six panels before the prologue choice. Each panel names its painted plate;
 * until a plate is delivered the stage falls back to the launcher backdrop.
 */
export interface IntroPanel {
  id: string
  title: string
  text: string
  artPath: string
  artPrompt: string
}

const STYLE =
  'Original painted dark-fairytale illustration, warm lamplight against cold blue shadow, cinematic composition, legible expressions, every surface bare and unmarked'

const ROWAN =
  'Rowan, an androgynous data researcher in his thirties with short dark hair and a grey cardigan'

function panel(
  id: string,
  title: string,
  text: string,
  subject: string,
): IntroPanel {
  return {
    id,
    title,
    text,
    artPath: `/images/memory-dungeon/intro/${id}.webp`,
    artPrompt: `${subject}. ${STYLE}.`,
  }
}

export const INTRO_PANELS: readonly IntroPanel[] = [
  panel(
    'ordinary-life',
    'Forty-One Tabs',
    'Rowan counts things for a living. Survey returns, transit delays, how many people a city forgets each winter. The spreadsheet never quite balances, the coffee is always cold, and every number is exactly as stubborn as it was yesterday. That used to be a comfort.',
    `${ROWAN} at a cluttered office desk late at night, dozens of spreadsheet windows glowing on two monitors, a cold mug of coffee and a stack of printed survey returns, rain on a dark window behind`,
  ),
  panel(
    'after-hours',
    'Nobody Believed in Fairies',
    'After ten the Research Annex hums. The lift stops at floors that are not on the board, and the stairwell smells of wet leaves in a building with no trees. Rowan writes it down the way he writes everything down: noted, unexplained, probably the heating.',
    `An empty fluorescent office corridor after hours, a lift door half open on darkness, a few dead leaves drifting from a stairwell door, ${ROWAN} pausing with a notebook raised`,
  ),
  panel(
    'the-changeling',
    'The Changeling at the Desk',
    'Someone is sitting at Rowan’s desk, reading the spreadsheets as if they were scripture. Morrow is all angles and hunger, a fey stranger in a coat that seems to be mostly leaves. “Your numbers stay put,” Morrow says, delighted. “Where I live, a sum changes if a witch is in a mood.”',
    `A strange androgynous fey figure with long pointed ears and short silver hair hunched hungrily over glowing spreadsheets at an office desk, ${ROWAN} frozen in the doorway holding a coat`,
  ),
  panel(
    'the-trade',
    'The Trade',
    '“You can have my story, Rowan,” Morrow says, holding out a hand that smells of briar and cold rivers. “And I shall try yours.” It sounds like a joke. Rowan shakes it like a joke. The fluorescent tubes go out one by one, and each of them comes back as a star.',
    `${ROWAN} shaking hands with a pointed-eared fey figure across an office desk as the ceiling lights burst into stars and thorny briars climb the filing cabinets`,
  ),
  panel(
    'wrong-reflection',
    'A Body That Is Not Yours',
    'Rowan wakes in wet bracken under a sky with too many moons. His hands are the wrong length. In a puddle, a stranger’s fey face blinks back with Rowan’s own expression, startled and trying very hard to be reasonable about it. Somewhere far away, Morrow is late for the 8:24.',
    `${ROWAN} kneeling in wet bracken under a sky of three moons, staring into a puddle whose reflection shows a pointed-eared fey stranger's face, thorny briar forest all around`,
  ),
  panel(
    'briar-camp',
    'Briar Camp',
    'A goblin with a mail satchel finds him at dawn. “Pip,” he says, “courier, not a rescuer, but I’ll do in a pinch.” Below the camp the Briar Marches roll out like a map someone keeps redrawing, and a crooked House on the far hill watches with every window. “Everything here remembers,” Pip says. “Choose what you hold onto.”',
    `A small goblin courier with a leather mail satchel leading ${ROWAN} into a lantern-lit forest camp at dawn, a crooked many-windowed House on a distant hill above a sea of briars`,
  ),
]
