import { ZODIAC_CAUSAL_ALIENS } from './alienZodiacCausal'
import { HYBRID_CAUSAL_ALIENS } from './alienHybridCausal'
import { COSMIC_CAUSAL_ALIENS } from './alienCosmicCausal'
import { SOCIAL_CAUSAL_ALIENS } from './alienSocialCausal'
import { ECOLOGY_CAUSAL_ALIENS } from './alienEcologyCausal'
import { LEGENDARY_CAUSAL_ALIENS_A } from './alienLegendaryCausalA'
import { LEGENDARY_CAUSAL_ALIENS_B } from './alienLegendaryCausalB'
import type { AlienChoice, AlienMood } from './alienFieldGuide'

// Each line narrates what the player actually did before the creature responds.
// These are complete outcomes, not generic prefixes grafted onto unrelated acts.
export const ALIEN_CHOICE_STORIES: Readonly<
  Record<string, Record<AlienMood, Record<AlienChoice, string>>>
> = {
  'ramray-of-the-rising-house': {
    wary: {
      approach:
        'You step out of the bubble with a gift before the Ramray is ready. It folds its fins over the lamp and disappears with the grandstand; the stranded technician files a request for a less enthusiastic audience.',
      observe:
        "You let the stage go quiet and notice the technician's shaking hands. The Ramray studies your patient signal, lowers its fins and sends the couch a sunrise small enough to fit in a teacup.",
      improvise:
        'You turn the couch cushions into a ridiculous applause machine. The Ramray mistakes the racket for its curtain call and triggers every sunrise at once; half the planet demands its morning back.',
    },
    playful: {
      approach:
        "You answer the Ramray's tapping rhythm with a gentle greeting and a small gift. It invites the technician down from the ladder and rolls a pocket-sized sunrise toward the couch like a curtain-call rose.",
      observe:
        "You stay back to document the Ramray's rhythm. It decides that a quiet audience deserves a bigger show and cues six simultaneous dawns; astronomers file noise complaints against daylight.",
      improvise:
        "You rig the cushions to beat out a spectacular drum solo, drowning out the Ramray's invitation. Offended by the competition, it folds away the spotlight and takes tomorrow's sunrise into the wings.",
    },
    protective: {
      approach:
        'You approach the struggling technician with an open bubble and a gift. The Ramray reads your sudden arrival as a threat to its fragile support and swings its grandstand into the ladder; the emergency spotlight becomes a firework.',
      observe:
        'You watch from a distance while the ladder sways. The Ramray shields the technician with one fin but decides it cannot risk a larger audience; it carries the entire show into a private, uncharted dawn.',
      improvise:
        "You stretch the couch's safety bubble beneath the ladder as a ridiculous inflatable orchestra pit. The technician lands unharmed, the Ramray relaxes its aching fin, and both grant you a sunrise in a teacup.",
    },
  },
  'snail-fox': {
    wary: {
      approach:
        'You extend a gift through the bubble before the Snail Fox has decided which day it is. It slips back into yesterday with the permit; the mayors spend the afternoon arguing over a blank calendar.',
      observe:
        'You sit quietly and read the two signatures on the permit. When you point out they belong to the same official, the Snail Fox emerges from yesterday and helps the mayors sign a single apology.',
      improvise:
        'You use three couch cushions as a calendar with an extra Tuesday. The Snail Fox tries to stand on all three days at once, opening the bridge tomorrow, today, and yesterday; yesterday immediately sends an invoice.',
    },
    playful: {
      approach:
        'You accept the rolled calendar page and offer the fox a tiny origami bridge. Delighted, it draws the real bridge into the right day and invites both mayors to cross together, with one sensible permit.',
      observe:
        "You quietly sketch the fox's calendar game in your notebook. It adds another day for every pencil stroke until the village wakes in three Tuesdays and sends the construction crew a bill for time itself.",
      improvise:
        'You build a towering cushion calendar and declare the impossible date a holiday. The Snail Fox decides the game has become a municipal hearing, curls into its shell, and hides inside last Thursday.',
    },
    protective: {
      approach:
        'You step toward the child on the far bank without asking how the fox is holding yesterday in place. Startled, it drops a whole afternoon into the river; the mayors flee an unexpected parade of floating clocks.',
      observe:
        'You watch the fox keep the child warm without signaling any help. It sees your still silhouette reflected in the river, worries another adult is coming to take the child, and retreats with its pocket of yesterday.',
      improvise:
        "You knot the couch's blankets into a bridge across the missing day. The child crosses safely; the Snail Fox reveals the duplicated signature and lets both mayors sign a treaty that exists on the same morning.",
    },
  },
  'wormhole-wombat': {
    wary: {
      approach:
        "You lean through an unfamiliar doorway with a welcome gift. The Wombat bolts, and the door closes on the housing officer's forms; six planets receive a notice about a vanished lounge.",
      observe:
        "You remain on the couch and listen for the real door's familiar creak. The Wombat follows your quiet directions, finds its original threshold and rewards you with an address plaque reading PROBABLY HERE.",
      improvise:
        "You build an outrageous doorknob compass from the couch's cup holders. Every portal briefly points to the ship's bathroom, and a galaxy-wide privacy complaint reaches the housing office before you do.",
    },
    playful: {
      approach:
        'You roll a spare doorknob toward the Wombat like a ball. It answers with the missing front door, laughs at the surprise, and invites you in for a cup of tea in the correct solar system.',
      observe:
        'You watch the rolling doorknob without returning it. The Wombat enthusiastically performs the trick again, linking six doors into one rotating corridor; the housing officer issues a permit for a temporary merry-go-round.',
      improvise:
        'You juggle doorknobs while making the couch beep at every toss. The Wombat mistakes this for an eviction alarm and disappears through an unlabeled portal, leaving only the tea kettle behind.',
    },
    protective: {
      approach:
        "You step toward the trapped neighbor with a gift but cross the doorway the Wombat is holding open. The portals rearrange around your feet, turning the housing inspector's paperwork into six emergency evacuation maps.",
      observe:
        'You keep a respectful distance while the Wombat strains against the collapsing portal. Unable to tell why you are watching the neighbor, it closes the door to protect them and vanishes into a safer room.',
      improvise:
        'You turn the sofa into a temporary doorstop the size of a small moon. The neighbor slips free, the Wombat restores its front entrance and nails PROBABLY HERE above the frame, with your permission.',
    },
  },
  'panic-finch': {
    wary: {
      approach:
        'You offer the Finch a calming gift in front of the guards. It reads the crowd gathering around you as another official interrogation and ducks into one of its imaginary doors; the mayor orders an inquiry into invisible hinges.',
      observe:
        'You listen instead of joining the guards. The Finch notices you following its repeated warning about the market wall, leads you to the painted-shut fire hatch and accepts a medal marked OCCASIONALLY CORRECT.',
      improvise:
        "You deploy the couch's improvised door detector to prove the Finch is onto something. It identifies four hundred and six door-shaped shadows; the town council budgets for emergency hinges on every cloud.",
    },
    playful: {
      approach:
        "You answer the Finch's exaggerated pointing with a gentle greeting and the tiniest door-shaped gift. It proudly escorts you to the real emergency hatch, which the two of you clear before the market opens.",
      observe:
        "You write down each of the Finch's pointing gestures as though reviewing a stage act. Encouraged, it performs an elaborate pantomime of every door in town; the mayor installs a ticket booth and forgets the fire hatch.",
      improvise:
        'You project a hundred fake doorways onto the wall as a dramatic encore. The Finch cannot decide which one to warn the town about and flees into a doorway that was only on your projector.',
    },
    protective: {
      approach:
        "You move toward the smoking hatch with a gift, drawing a curious crowd into the Finch's narrow escape route. Its alarm becomes a stampede of market carts, and the guards have to rescue a wheelbarrow from itself.",
      observe:
        "You stand still and take careful notes while smoke thickens behind the painted hatch. The Finch cannot risk waiting for another official report; it vanishes into the market's back wall to seek help elsewhere.",
      improvise:
        "You use the couch's force bubble as a rubber battering ram for the painted-shut hatch. Shoppers stumble safely into the open while the Finch receives a badge reading OCCASIONALLY CORRECT, which it wears upside down.",
    },
  },
  'root-mimic': {
    wary: {
      approach:
        "You step into the grove offering a gift, but the Root Mimic feels your weight near the old tree's fragile roots. It withdraws underground; the loggers are left arguing whether the empty roots count as permission.",
      observe:
        'You keep the saws out of the grove and study the fresh growth where the Mimic feeds the trees. It uncurls a root to show the loggers the living network, then leaves a seed beside the couch.',
      improvise:
        "You launch a makeshift root scanner from the couch's cushions. It interprets every tree as an independent citizen and prints eviction notices for the logging crew in seventeen dialects of leaf.",
    },
    playful: {
      approach:
        'You accept the seed the Mimic pushes through the soil and give it a little planter from the couch. The roots curl into a bridge to a safer nursery, and the loggers agree to leave the oldest tree standing.',
      observe:
        "You sketch the root's playful spiral without planting its seed. The Mimic treats your notebook as a set of marching orders and rearranges the forest into one enormous legal signature, blocking the logging road for a week.",
      improvise:
        'You fashion a juggling act with seed pods and a portable grow lamp. The Mimic mistakes the lamp for a harvesting machine and pulls every root out of reach; the loggers find nothing but a baffling empty grove.',
    },
    protective: {
      approach:
        "You step forward with a gift just as the Mimic braces the cracked sapling. The sudden movement knocks loose the loggers' survey stakes, sending the paperwork into the canopy and the work crew chasing its own maps.",
      observe:
        "You remain behind the survey line, watching the Mimic strain beneath the young tree. It mistakes your stillness for another inspection and slips underground with the sapling's roots wrapped safely around it.",
      improvise:
        "You stretch the couch's shield into an absurd transparent tree brace. The sapling stands, the loggers finally see the living network, and the Mimic grows a small shelter beside the sofa in thanks.",
    },
  },
  'last-upholsterer': {
    wary: {
      approach:
        'You step toward the ancient needle with a gift before the Upholsterer has secured its cosmic thread. It gathers the fragile seam and disappears behind the couch; every chair in the galaxy wobbles once in farewell.',
      observe:
        'You sit motionless and watch which thread actually supports the sleeping nursery. The Upholsterer lets you hold the safe end, stitches a new beam for the children and offers the couch a patch of original chair fabric.',
      improvise:
        'You build a makeshift fourth chair leg from a collapsed star and a pair of cup holders. The Upholsterer tries to attach it without checking your math; every seat gains a seventh leg and symmetry files a complaint.',
    },
    playful: {
      approach:
        "You offer the Upholsterer a spare cushion and compliment its peculiar stitch. It unrolls the first chair's pattern, teaches the crew a celebratory knot, and gives the sofa a tiny embroidered star.",
      observe:
        'You quietly examine the familiar cushion pattern and begin taking notes. The Upholsterer decides this is a design competition, conjures six rival chairs and accidentally changes the definition of sitting in four dimensions.',
      improvise:
        'You turn a cushion into an enormous novelty pincushion for the cosmic needle. The Upholsterer takes the joke as criticism of its craft, folds the original pattern away and leaves the couch with an inexplicable extra armrest.',
    },
    protective: {
      approach:
        'You approach the nursery carrying a gift, but your open force bubble snags the thread holding its roof together. Chairs across six worlds briefly lose their legs while the Upholsterer races to catch the beam.',
      observe:
        'You stay at a respectful distance as the Upholsterer braces the nursery. It interprets the fixed gaze as a survey for salvage rights and carries the children and their beam somewhere your map cannot follow.',
      improvise:
        "You unfold the sofa's hidden pocket room beneath the nursery as a ridiculous emergency foundation. The children stay asleep while the Upholsterer stitches a replacement beam and teaches the couch a durable new seam.",
    },
  },
  ...ZODIAC_CAUSAL_ALIENS,
  ...HYBRID_CAUSAL_ALIENS,
  ...COSMIC_CAUSAL_ALIENS,
  ...SOCIAL_CAUSAL_ALIENS,
  ...ECOLOGY_CAUSAL_ALIENS,
  ...LEGENDARY_CAUSAL_ALIENS_A,
  ...LEGENDARY_CAUSAL_ALIENS_B,
}
