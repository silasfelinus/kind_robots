import type { TrialResult } from './authoredBosses'
import type { JourneyStateV6 } from './deckV6'
import type { AuthoredEndingV6 } from './endingsV6'
import { JOURNEY_WORLD } from './journey'
import { trialForLandV7 } from './trialRulesV7'

type Phase = 'complete' | 'fallen' | 'retired'
type Constellation = {
  id: string
  title: string
  path: string
  ending: Record<Phase, string>
}

// The higher reward for a harder good path is a different future, not free HP.
// A dark victory is genuinely easier; these outcomes remember who paid.
const CONSTELLATIONS: Record<string, Constellation> = {
  commons: {
    id: 'commons',
    title: 'The Lantern Commons',
    path: 'Collective shelter, earned in hardship',
    ending: {
      complete:
        'Beyond the final threshold there is no palace, only an agreement made by the people you refused to abandon. River crews provide boats, caravan elders maintain the lamps, and witnesses keep the ledger open to everyone. The first winter is still hungry. No one is made to face it alone, and no one owns the road.',
      fallen:
        'You never see the road wide enough for everyone. The witnesses you gathered build the first lantern station anyway. They use your name for its opening night, then stop: the station belongs to those who keep it lit.',
      retired:
        'You stop before the far gate. Behind you the people who learned to stand together begin building shelters of their own. They quarrel over grain, shifts, and responsibility, then meet again the next morning. That is the work your choices left them.',
    },
  },
  publicRecord: {
    id: 'public-record',
    title: 'The Book Nobody Owns',
    path: 'Truth defended by a community',
    ending: {
      complete:
        'Your evidence passes from hand to hand after the gate opens. The missing names go into a public register that no Abbess, keeper, warden or judge can close alone. Families can finally find one another. Some entries stay blank. You refuse to fill them with a comforting lie.',
      fallen:
        'You do not live to read the last account. The witnesses take turns keeping the book dry and carrying it between households. An erased name appears again, in ink too stubborn for a single official to remove.',
      retired:
        'You stop walking and become one of several custodians of an open record. The names you cannot verify remain marked as unknown. The people who come to read them have the right to disagree with you.',
    },
  },
  wayfinders: {
    id: 'wayfinders',
    title: 'A Ford With No Toll',
    path: 'Careful passage shared freely',
    ending: {
      complete:
        'The stone measurements and hidden routes you nearly died gathering become a map anyone may copy. The first travelers across are the people who cannot afford a keeper. You place no signature beneath the ford. You know exactly how quickly a map can turn into somebody else’s tax.',
      fallen:
        'Your surveyed marks outlast the road that took your life. A courier copies them onto the back of a meal receipt, and a lost family finds a crossing nobody charges them to use.',
      retired:
        'You trade your worn tools for a table where routes can be copied for free. You have not ended the tollkeepers, but their roads are no longer the only roads anyone can find.',
    },
  },
  tribute: {
    id: 'tribute',
    title: 'The Franchise of Hunger',
    path: 'Prosperity purchased with other people’s waiting',
    ending: {
      complete:
        'You arrive wealthy in passes, receipts, and introductions. The keepers greet you by name. Downriver, the smallest boats still queue in the cold; each official you paid has raised the toll for somebody else. You can afford the road. You have helped make it unaffordable.',
      fallen:
        'Your receipts survive your final journey and find their way into other hands. The keepers continue charging their improved rates. The families who waited cannot afford to remember you fondly.',
      retired:
        'You settle beside a crossing where the keeper owes you favors. Every morning you hear travelers counting provisions through the window. Your seat is warm and your breakfast plentiful; the counting never stops.',
    },
  },
  coercion: {
    id: 'coercion',
    title: 'The Province of Empty Hands',
    path: 'Power held by fear and left without company',
    ending: {
      complete:
        'At the last gate nobody dares ask for your permission to leave. You have made a road that obeys you. The people who carried its danger step aside when you pass, and even the guards will not meet your eyes. The crossing is yours. There is no one left who wishes to share it.',
      fallen:
        'People once stepped aside because you were coming. When word of your fall reaches the road, they move together for the first time without your orders. No one mistakes that for gratitude.',
      retired:
        'You can still empty a common room by opening its door. You sit at the best table and hear no arguments, no laughter, no news of anybody else. The silence once felt like victory.',
    },
  },
  mixedDominion: {
    id: 'mixed-dominion',
    title: 'The Market of Silence',
    path: 'An efficient bargain with a human cost',
    ending: {
      complete:
        'You taught the wardens how to sell precedence and taught the frightened how to enforce it. Now the crossings run efficiently. Receipts are stamped, queues are quiet, and families learn which neighbors can be sacrificed to keep the price low. Everything works, except the word fair.',
      fallen:
        'The machinery you helped arrange survives its maker. Someone else takes the ledger, another takes the stick, and neither needs to invent a rule. You left them a system ready to use.',
      retired:
        'You leave the gate with enough savings to live comfortably. The keeper and guards continue the system you helped teach them. In the market people lower their voices whenever a receipt changes hands.',
    },
  },
  restitution: {
    id: 'restitution',
    title: 'A Bridge Without Forgiveness',
    path: 'Repair undertaken without erasing the harm',
    ending: {
      complete:
        'You finally stand among the people you once left to wait or used as cover. Some accept the work you do to open a common road. Others cross by a different bridge rather than walk beside you. You leave both bridges standing. No one owes you absolution for choosing better so late.',
      fallen:
        'Your last attempt to stand with the travelers does not erase the earlier bargain. Those who were harmed disagree about whether to finish your work. They finish the shared crossing anyway, for their own reasons.',
      retired:
        'You offer to mend the bridge you once made others defend. The people who feared you accept the work but do not invite you to decide its rules. It is an unfamiliar kindness to be given a task and not the authority.',
    },
  },
}

type SuccessfulRoute = { landId: string; choiceId: string }

// Only the recorded boss ledger can prove a successful trial. A trial outcome
// supplied without its matching boss, roll, turn and authored check is not a deed.
export function verifiedSuccessfulRoutesV7(
  state: JourneyStateV6,
  results: readonly TrialResult[],
): SuccessfulRoute[] {
  const routes: SuccessfulRoute[] = []
  const seen = new Set<string>()
  for (const boss of state.journey.bosses) {
    const index = JOURNEY_WORLD.lands.findIndex(
      (land) => land.id === boss.landId && land.boss.id === boss.id,
    )
    if (index < 0 || index > state.journey.landIndex || seen.has(boss.landId))
      continue
    const trial = trialForLandV7(boss.landId)
    const result = results.find(
      (entry) =>
        entry.landId === boss.landId &&
        entry.bossId === boss.id &&
        entry.turn === boss.turn &&
        entry.roll.success &&
        JSON.stringify(entry.roll) === JSON.stringify(boss.roll),
    )
    const choice = trial?.choices.find((entry) => entry.id === result?.choiceId)
    if (
      !result ||
      !choice ||
      !boss.roll.success ||
      choice.skill !== result.roll.skill ||
      choice.target !== result.roll.difficulty ||
      boss.approach !== (choice.id === 'confront' ? 'challenge' : 'parley')
    )
      continue
    seen.add(boss.landId)
    routes.push({ landId: boss.landId, choiceId: choice.id })
  }
  return routes
}

export function moralConstellationEndingV7(
  original: AuthoredEndingV6,
  state: JourneyStateV6,
  trials: readonly TrialResult[],
): AuthoredEndingV6 {
  const phase = state.journey.phase
  if (phase !== 'complete' && phase !== 'fallen' && phase !== 'retired')
    return original
  const routes = verifiedSuccessfulRoutesV7(state, trials)
  const count = (choice: string) =>
    routes.filter((route) => route.choiceId === choice).length
  const coerce = count('coerce')
  const tribute = count('tribute')
  const witness = count('witness')
  const solidarity = count('solidarity')
  const evidence = count('evidence')
  const scout = count('scout')
  // Even an unsuccessful attempt to sell or threaten another traveler
  // precludes a clean utopia. The base ending still remembers that bargain.
  const attemptedHarm = trials.some(
    (trial) => trial.choiceId === 'coerce' || trial.choiceId === 'tribute',
  )
  let key: keyof typeof CONSTELLATIONS | null = null
  if (attemptedHarm) {
    if (coerce + tribute >= 2 && solidarity >= 1) key = 'restitution'
    else if (coerce >= 3 && tribute === 0) key = 'coercion'
    else if (tribute >= 3 && coerce === 0) key = 'tribute'
    else if (coerce >= 1 && tribute >= 1) key = 'mixedDominion'
  } else if (
    solidarity >= 2 &&
    witness >= 1 &&
    state.marks.mercy >= 4 &&
    state.marks.honesty >= 2
  ) {
    key = 'commons'
  } else if (witness >= 2 && evidence >= 1 && state.marks.honesty >= 3) {
    key = 'publicRecord'
  } else if (scout >= 2 && evidence >= 1 && state.marks.mercy >= 2) {
    key = 'wayfinders'
  }
  const ending = key ? CONSTELLATIONS[key] : null
  if (!ending) return original
  return {
    ...original,
    title: ending.title,
    path: ending.path,
    paragraphs: [...original.paragraphs, ending.ending[phase]],
  }
}

export const MORAL_CONSTELLATION_IDS_V7 = Object.freeze(
  Object.values(CONSTELLATIONS).map((ending) => ending.id),
)
