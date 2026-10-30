import type { TrainingState } from './training'

export type Perspective = 'hero' | 'villain' | 'henchman' | 'sidekick'
export type Beat = 'arrival' | 'alarm' | 'reckoning' | 'victory' | 'defeat'
export type ChoiceEffect =
  'catwalk' | 'service' | 'rescue' | 'contain' | 'spare' | 'press' | 'finish'
export type StoryLine = { speaker: string; text: string }
export type StoryChoice = {
  label: string
  detail: string
  effect: ChoiceEffect
}
export type StoryMoment = {
  id: Beat
  title: string
  kicker: string
  lines: StoryLine[]
  choices: StoryChoice[]
}
export type StoryRun = {
  current: Beat | null
  seen: Beat[]
  decisions: ChoiceEffect[]
  approach: 'catwalk' | 'service' | null
  civilians: number
  evidence: number
  mercy: boolean
  completed: boolean
}

const a = (speaker: string, text: string): StoryLine => ({ speaker, text })
const option = (
  effect: ChoiceEffect,
  label: string,
  detail: string,
): StoryChoice => ({ effect, label, detail })
const finish = (label: string): StoryChoice[] => [
  option('finish', label, 'Return to the field report'),
]

const SCRIPT: Record<Perspective, Record<Beat, StoryMoment>> = {
  hero: {
    arrival: {
      id: 'arrival',
      kicker: 'FIRST BELL / THE HERO',
      title: 'The doors are locked from the inside',
      lines: [
        a(
          'PRIYA',
          'Three heat signatures under the auditorium stage. Somebody cut the alarm so no one would hear them.',
        ),
        a(
          'BACKDRAFT',
          'Then we get everybody out. Nobody gets to decide those kids are acceptable losses.',
        ),
        a(
          'HATTIE',
          'Two ways in. Up the lighting catwalk, or beneath the service doors. Both expose us to the rival patrol.',
        ),
      ],
      choices: [
        option(
          'catwalk',
          'Take the high catwalk',
          'Gain elevation and a clear scouting angle; risk being seen first.',
        ),
        option(
          'service',
          'Breach the service corridor',
          'Advance behind the seats and keep the rescue team together.',
        ),
      ],
    },
    alarm: {
      id: 'alarm',
      kicker: 'MID-FIGHT / THE HERO',
      title: 'A second bell, a second emergency',
      lines: [
        a(
          'PRIYA',
          'The sprinkler override is cycling! Three students are trapped, and the rival captain is about to seal the exits.',
        ),
        a(
          'BACKDRAFT',
          'I can reach the kids, but somebody has to keep our flank from folding. We do not have enough hands.',
        ),
      ],
      choices: [
        option(
          'rescue',
          'Split off a rescue team',
          'Evacuate two students now; restore one wounded squadmate.',
        ),
        option(
          'contain',
          'Hold the stairwell',
          'Gather the alarm-control evidence; suppress the nearest rival.',
        ),
      ],
    },
    reckoning: {
      id: 'reckoning',
      kicker: 'TURNING POINT / THE HERO',
      title: 'The first enemy is down',
      lines: [
        a(
          'HATTIE',
          'They are students. They have families, and someone told them we were the monsters.',
        ),
        a(
          'BACKDRAFT',
          'We can win this fight without turning them into our enemies forever. Or we can finish it before anyone else gets hurt.',
        ),
      ],
      choices: [
        option(
          'spare',
          'Offer them a way out',
          'Hold fire on the fallen; gain a chance to de-escalate.',
        ),
        option(
          'press',
          'Push for the barricade',
          'Gain momentum by suppressing the remaining rivals.',
        ),
      ],
    },
    victory: {
      id: 'victory',
      kicker: 'AFTER THE BELL / THE HERO',
      title: 'The auditorium opens',
      lines: [
        a(
          'PRIYA',
          'The doors are open. The people you saved will remember who reached them first.',
        ),
        a(
          'BACKDRAFT',
          'And the ones on the other side? If nobody listens to their story, we have not fixed anything.',
        ),
      ],
      choices: finish('File the rescue report'),
    },
    defeat: {
      id: 'defeat',
      kicker: 'AFTER THE BELL / THE HERO',
      title: 'The doors do not open',
      lines: [
        a(
          'HATTIE',
          'We lost the hallway. I got the last student away from the windows.',
        ),
        a(
          'BACKDRAFT',
          'Then we tell the truth about what happened here, even if it makes the evening news ugly. We are coming back.',
        ),
      ],
      choices: finish('Record the failed rescue'),
    },
  },
  villain: {
    arrival: {
      id: 'arrival',
      kicker: 'FIRST BELL / THE VILLAIN',
      title: 'A sealed door is not a prison',
      lines: [
        a(
          'REMY',
          'The heroes are already calling it a hostage situation. They have no idea what the thing beneath the stage can do.',
        ),
        a(
          'BACKDRAFT',
          'The vault was built to contain a prototype, not children. Our orders are clear.',
        ),
        a(
          'VEE',
          'We can control the roof or cut through the service hall before the cameras catch us. Either way, they will name us villains.',
        ),
      ],
      choices: [
        option(
          'catwalk',
          'Watch from the rigging',
          'Take the catwalk, keeping the unstable stage in view.',
        ),
        option(
          'service',
          'Secure the service hall',
          'Approach unseen to block a reckless breach.',
        ),
      ],
    },
    alarm: {
      id: 'alarm',
      kicker: 'MID-FIGHT / THE VILLAIN',
      title: 'The containment gauges break',
      lines: [
        a(
          'REMY',
          'That pulse was not an alarm. It is a warning from the vault. Opening it could turn the entire school into glass.',
        ),
        a(
          'BACKDRAFT',
          'Students are still inside. We choose whose safety our orders actually protect.',
        ),
      ],
      choices: [
        option(
          'rescue',
          'Break protocol for the students',
          'Bring two students out and recover one ally.',
        ),
        option(
          'contain',
          'Recover the vault telemetry',
          'Save proof of the hazard and disable a rival weapon.',
        ),
      ],
    },
    reckoning: {
      id: 'reckoning',
      kicker: 'TURNING POINT / THE VILLAIN',
      title: 'Their hero is bleeding',
      lines: [
        a(
          'VEE',
          'Their side is going to say we opened fire first. We could stop and ask what they saw.',
        ),
        a(
          'BACKDRAFT',
          'Mercy is not weakness. But if they reach the stage before we do, nothing outside this building survives.',
        ),
      ],
      choices: [
        option(
          'spare',
          'Accept a temporary truce',
          'Leave the fallen rival alive and invite a ceasefire.',
        ),
        option(
          'press',
          'Finish containment',
          'Suppress the remaining attackers before the vault breaks.',
        ),
      ],
    },
    victory: {
      id: 'victory',
      kicker: 'AFTER THE BELL / THE VILLAIN',
      title: 'The seal still holds',
      lines: [
        a(
          'REMY',
          'We kept the breach from spreading. Tomorrow their parents will see a villain squad holding the school doors shut.',
        ),
        a(
          'BACKDRAFT',
          'History can give us the black masks. The children get to have tomorrow.',
        ),
      ],
      choices: finish('Seal the classified report'),
    },
    defeat: {
      id: 'defeat',
      kicker: 'AFTER THE BELL / THE VILLAIN',
      title: 'The story gets its monster',
      lines: [
        a('VEE', 'The vault is exposed and every camera is pointed at us.'),
        a(
          'BACKDRAFT',
          'Then tell them what was in that vault. If the price is my reputation, I have already paid it.',
        ),
      ],
      choices: finish('Release the containment testimony'),
    },
  },
  henchman: {
    arrival: {
      id: 'arrival',
      kicker: 'FIRST BELL / THE HENCHMAN',
      title: 'Nobody mentioned the children',
      lines: [
        a(
          'PIP',
          'Boss said guard the auditorium, collect the overtime and ask nothing. The overtime better be real.',
        ),
        a(
          'BACKDRAFT',
          'That radio is full of kids crying. It was not in the briefing.',
        ),
        a(
          'PRIYA',
          'We have a catwalk and a service tunnel. Which order do we break first?',
        ),
      ],
      choices: [
        option(
          'catwalk',
          'Disobey the watch-post order',
          'Climb to the rigging and search for survivors yourself.',
        ),
        option(
          'service',
          'Use the old maintenance key',
          'Slip underneath the hall and learn who locked the doors.',
        ),
      ],
    },
    alarm: {
      id: 'alarm',
      kicker: 'MID-FIGHT / THE HENCHMAN',
      title: 'A bonus for keeping quiet',
      lines: [
        a(
          'PIP',
          'Management just doubled the hazard pay. Three trapped kids were not included in the hazard-pay memo.',
        ),
        a(
          'BACKDRAFT',
          'My badge says henchman. It does not say I have to leave children behind.',
        ),
      ],
      choices: [
        option(
          'rescue',
          'Abandon the shift for a rescue',
          'Get two students out, even if it costs your job.',
        ),
        option(
          'contain',
          'Steal the dispatch recording',
          'Save the orders as evidence and jam a rival radio.',
        ),
      ],
    },
    reckoning: {
      id: 'reckoning',
      kicker: 'TURNING POINT / THE HENCHMAN',
      title: 'The uniform comes off',
      lines: [
        a(
          'PRIYA',
          'That rival is down. Security is offering to wipe your employment file if you keep fighting.',
        ),
        a(
          'BACKDRAFT',
          'They never paid me enough to hate somebody I have never met.',
        ),
      ],
      choices: [
        option(
          'spare',
          'Help the fallen patrol member',
          'Choose a person over an order; open a path to mercy.',
        ),
        option(
          'press',
          'Take the dispatch desk',
          'Press the advantage and silence the remaining squad.',
        ),
      ],
    },
    victory: {
      id: 'victory',
      kicker: 'AFTER THE BELL / THE HENCHMAN',
      title: 'No longer on the payroll',
      lines: [
        a(
          'PIP',
          'They fired me before I could quit. Apparently saving children violates the uniform policy.',
        ),
        a(
          'BACKDRAFT',
          'Good. Now I can finally decide what kind of person the uniform was hiding.',
        ),
      ],
      choices: finish('Clock out permanently'),
    },
    defeat: {
      id: 'defeat',
      kicker: 'AFTER THE BELL / THE HENCHMAN',
      title: 'The wrong kind of loyalty',
      lines: [
        a(
          'PRIYA',
          'They used us as a shield and abandoned us when the hall collapsed.',
        ),
        a(
          'BACKDRAFT',
          'I used to think loyalty meant following orders. Now I know it means remembering who you left behind.',
        ),
      ],
      choices: finish('Record the betrayal'),
    },
  },
  sidekick: {
    arrival: {
      id: 'arrival',
      kicker: 'FIRST BELL / THE SIDEKICK',
      title: 'The orders are not the mission',
      lines: [
        a(
          'BACKDRAFT',
          'Stick with me and do exactly what I say. We get the students out, then you get the credit.',
        ),
        a(
          'PRIYA',
          'Your partner did not hear the voice behind the wall. The voice asked for you.',
        ),
        a(
          'HATTIE',
          'There are two entrances. Your partner has picked the loud one. You still get a vote.',
        ),
      ],
      choices: [
        option(
          'catwalk',
          'Take initiative above the stage',
          'Scout the catwalk before your mentor can veto it.',
        ),
        option(
          'service',
          'Cover your partner through maintenance',
          'Keep the squad together and approach from below.',
        ),
      ],
    },
    alarm: {
      id: 'alarm',
      kicker: 'MID-FIGHT / THE SIDEKICK',
      title: 'Two calls, one decision',
      lines: [
        a(
          'BACKDRAFT',
          'Keep pressure on the patrol! If they reach the switchboard, the stairs will seal.',
        ),
        a(
          'PRIYA',
          'The trapped students are on the other channel. Your mentor cannot hear both calls. You can.',
        ),
      ],
      choices: [
        option(
          'rescue',
          'Make the rescue call yourself',
          'Save two students and patch up a wounded teammate.',
        ),
        option(
          'contain',
          'Trust the tactical objective',
          'Capture evidence and jam the rivals before they regroup.',
        ),
      ],
    },
    reckoning: {
      id: 'reckoning',
      kicker: 'TURNING POINT / THE SIDEKICK',
      title: 'The mentor looks to you',
      lines: [
        a(
          'HATTIE',
          'The rival patrol is breaking. Backdraft wants to chase. He is waiting for you to say it is right.',
        ),
        a(
          'PRIYA',
          'You are not the assistant in this decision. Whatever happens next has your name on it.',
        ),
      ],
      choices: [
        option(
          'spare',
          'Ask your mentor to stand down',
          'Offer mercy and prove that leadership can change minds.',
        ),
        option(
          'press',
          'Order a decisive advance',
          'Take command of the remaining fight and suppress the rivals.',
        ),
      ],
    },
    victory: {
      id: 'victory',
      kicker: 'AFTER THE BELL / THE SIDEKICK',
      title: 'The sidekick speaks first',
      lines: [
        a(
          'BACKDRAFT',
          'I was about to call the wrong play. You saw the whole board.',
        ),
        a(
          'PRIYA',
          'There is room for more than one hero on this report. Make sure they spell your name right.',
        ),
      ],
      choices: finish('Sign the report as a leader'),
    },
    defeat: {
      id: 'defeat',
      kicker: 'AFTER THE BELL / THE SIDEKICK',
      title: 'A lesson without applause',
      lines: [
        a('BACKDRAFT', 'I told you to follow me. It was a terrible order.'),
        a(
          'PRIYA',
          'No trophy tonight. But you made a decision nobody else would make. That will matter next time.',
        ),
      ],
      choices: finish('Write your own debrief'),
    },
  },
}

const PERSONAL_ROUTE: Record<Perspective, StoryLine> = {
  hero: a(
    'BACKDRAFT',
    'I survived the food-truck explosion because strangers ran toward the fire. Dr. Frog, Hattie and I promised we would be those strangers for somebody else.',
  ),
  villain: a(
    'BACKDRAFT',
    'The city keeps calling me an accident waiting to happen. Tonight Dr. Frog and Hattie are the only witnesses who know why I agreed to guard the seal.',
  ),
  henchman: a(
    'BACKDRAFT',
    'Before the blast I was invisible. Afterward I was somebody else’s weapon. Dr. Frog, Hattie and I are going to write our own orders.',
  ),
  sidekick: a(
    'BACKDRAFT',
    'I thought my job was to teach you how to be fireproof. Dr. Frog reminded me that what makes you a hero is deciding when not to burn.',
  ),
}
export function createStory(): StoryRun {
  return {
    current: 'arrival',
    seen: [],
    decisions: [],
    approach: null,
    civilians: 0,
    evidence: 0,
    mercy: false,
    completed: false,
  }
}
export function storyMoment(
  role: Perspective,
  beat: Beat,
  lead: string,
  run: StoryRun,
): StoryMoment {
  const scene = SCRIPT[role][beat]
  const lines = [...scene.lines]
  if (beat === 'arrival' && lead === 'accident-fire')
    lines.splice(1, 0, PERSONAL_ROUTE[role])
  if (beat === 'victory' || beat === 'defeat') {
    const outcome =
      run.civilians > 0
        ? a(
            'FIELD REPORT',
            run.civilians +
              ' students evacuated. ' +
              (run.mercy
                ? 'An injured rival accepted aid.'
                : 'The remaining rivals retreated.'),
          )
        : a(
            'FIELD REPORT',
            'Nobody reached the stranded students before the bell. ' +
              (run.evidence
                ? 'But the recorded orders survived.'
                : 'There is still no official account of the sealed hall.'),
          )
    lines.push(outcome)
  }
  return { ...scene, lines }
}
const allied = (state: TrainingState) =>
  state.units.filter((u) => u.team === 'squad' && u.hp > 0)
const rivals = (state: TrainingState) =>
  state.units.filter((u) => u.team === 'rival' && u.hp > 0)
const byId = (state: TrainingState, id: string) =>
  state.units.find((u) => u.id === id)
function healOne(state: TrainingState) {
  const unit = allied(state).sort(
    (a, b) => b.maxHp - b.hp - (a.maxHp - a.hp) || a.id.localeCompare(b.id),
  )[0]
  if (unit) unit.hp = Math.min(unit.maxHp, unit.hp + 1)
}
function suppressOne(state: TrainingState) {
  const unit = rivals(state).sort(
    (a, b) => a.hp - b.hp || a.id.localeCompare(b.id),
  )[0]
  if (unit && !unit.statuses.includes('suppressed'))
    unit.statuses.push('suppressed')
}
export function applyChoice(
  run: StoryRun,
  state: TrainingState,
  role: Perspective,
  effect: ChoiceEffect,
): boolean {
  const beat = run.current
  if (!beat || !SCRIPT[role][beat].choices.some((c) => c.effect === effect))
    return false
  if (beat === 'arrival') {
    run.approach = effect === 'catwalk' ? 'catwalk' : 'service'
    // One free pre-battle reposition. Distinct approach lanes give different
    // first-turn sightlines, but never cost or secretly award action points.
    const leader = byId(state, 'backdraft')
    if (leader) {
      leader.x = 1
      leader.y = effect === 'catwalk' ? 2 : 4
    }
  } else if (beat === 'alarm') {
    if (effect === 'rescue') {
      run.civilians += 2
      healOne(state)
    } else {
      run.evidence += 1
      suppressOne(state)
    }
  } else if (beat === 'reckoning') {
    if (effect === 'spare') {
      run.mercy = true
      healOne(state)
    } else suppressOne(state)
  } else if (beat === 'victory' || beat === 'defeat') {
    run.completed = true
  }
  run.decisions.push(effect)
  run.seen.push(beat)
  run.current = null
  enqueueBeat(run, state)
  return true
}
export function enqueueBeat(run: StoryRun, state: TrainingState) {
  if (run.current || run.completed) return
  const next: Beat | null =
    state.phase === 'victory'
      ? 'victory'
      : state.phase === 'defeat'
        ? 'defeat'
        : state.units.some((u) => u.team === 'rival' && u.hp === 0) &&
            !run.seen.includes('reckoning')
          ? 'reckoning'
          : state.turn >= 2 && !run.seen.includes('alarm')
            ? 'alarm'
            : null
  if (next && !run.seen.includes(next)) run.current = next
}
export const allPerspectives: readonly Perspective[] = [
  'hero',
  'villain',
  'henchman',
  'sidekick',
]
export const storyBeats: readonly Beat[] = [
  'arrival',
  'alarm',
  'reckoning',
  'victory',
  'defeat',
]
