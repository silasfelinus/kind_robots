import type { TrialResult } from './authoredBosses'
import type { JourneyStateV6 } from './deckV6'
import { authoredEndingV6, type AuthoredEndingV6 } from './endingsV6'
import { moralConstellationEndingV7 } from './endingsConstellationsV7'

// The road is easier when somebody else pays. The epilogue remembers exactly
// which bargains were attempted; the kindness payoff requires acts, not intent.
function authoredEndingV7Base(
  state: JourneyStateV6,
  trials: readonly TrialResult[],
): AuthoredEndingV6 | null {
  const base = authoredEndingV6(state, trials)
  if (!base) return null
  const phase = state.journey.phase
  const shortcuts = trials.filter(
    (trial) => trial.choiceId === 'tribute' || trial.choiceId === 'coerce',
  )
  const paid = shortcuts.filter((trial) => trial.choiceId === 'tribute')
  const coerced = shortcuts.filter((trial) => trial.choiceId === 'coerce')
  const solidarity = trials.filter(
    (trial) => trial.choiceId === 'solidarity' && trial.roll.success,
  )
  const witnesses = trials.filter(
    (trial) => trial.choiceId === 'witness' && trial.roll.success,
  )
  const paragraphs = [...base.paragraphs]
  if (shortcuts.length) {
    if (paid.length)
      paragraphs.push(
        'There are crossings where your rations bought an open road, and others waited behind a closed gate. You remember the meals you kept. You do not know how the waiting families ate.',
      )
    if (coerced.length)
      paragraphs.push(
        'You learned how quickly a door opens when someone else must stand in its path. Travelers still clear the road when they see you coming. Once, you thought that meant respect.',
      )
    if (phase === 'complete')
      paragraphs.push(
        'The last threshold opens easily for a person practiced in shifting the cost. You cross with provisions, power, and more silence than you remember asking for. Somewhere behind you, an unpaid debt has acquired your name.',
      )
    else
      paragraphs.push(
        'The easy bargains outlive your journey. People who were made to pay them keep the accounts, even if you never return to settle one.',
      )
    if (solidarity.length) {
      paragraphs.push(
        'Later you stood with those who were asked to pay your toll. Some welcomed the help. Others refused to forgive you. You stayed long enough to hear both answers, and no one had to call your change of heart a clean slate.',
      )
    }
    return {
      ...base,
      title: solidarity.length ? 'The Debt Carried Open' : base.title,
      path: solidarity.length
        ? 'Reckoning and partial repair'
        : 'The quick road, and its price',
      paragraphs,
    }
  }
  if (solidarity.length > 0) {
    paragraphs.push(
      phase === 'complete'
        ? 'The road does not become kinder when you cross. But the households you defended now share a warning bell, a public ledger, a food store, and a promise that no traveler will face the next gate alone. They have built something you could not have ordered into being.'
        : 'The people you gathered keep the shared road open without you. No one calls it a utopia. They call it a place where the frightened are no longer forced to stand alone.',
    )
    return {
      ...base,
      title:
        phase === 'complete' ? 'A Road Wide Enough for Everyone' : base.title,
      path: 'Hard-won solidarity',
      paragraphs,
    }
  }
  if (
    witnesses.length >= 2 &&
    (state.marks.mercy >= 3 || state.marks.honesty >= 3)
  ) {
    paragraphs.push(
      phase === 'complete'
        ? 'You cannot carry every stranger beyond the Verge. Instead you leave people who will speak for one another when no hero is there to intervene. It was harder to earn their trust than it would have been to buy an unlocked gate.'
        : 'The witnesses you gathered find each other after your road ends. They disagree over what you would have wanted, then decide to help the next stranger anyway.',
    )
    return { ...base, path: 'Trust earned on the harder road', paragraphs }
  }
  return base
}

export function authoredEndingV7(
  state: JourneyStateV6,
  trials: readonly TrialResult[],
): AuthoredEndingV6 | null {
  const base = authoredEndingV7Base(state, trials)
  return base ? moralConstellationEndingV7(base, state, trials) : null
}
