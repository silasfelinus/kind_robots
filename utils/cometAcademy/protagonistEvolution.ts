import { identityFor } from './identityArcs'
import type { SignaturePowerId } from './specialPowers'

export type PlayerForm = 'student' | 'hero' | 'villain'
export type PlayerEvolution = {
  form: PlayerForm
  protect: number
  exploit: number
  milestones: { day: 16 | 23; form: PlayerForm }[]
}

type EvolutionDialogue = {
  first: Record<PlayerForm, string>
  reckoning: Record<PlayerForm, string>
  outcomes: Record<'hero' | 'villain' | 'independent' | 'stay', string>
}

const PERSONAL_EVOLUTION: Partial<Record<SignaturePowerId, EvolutionDialogue>> =
  {
    'accident-fire': {
      first: {
        student:
          'The union brings a scorched kitchen apron to the oath chamber. Your old boss wants a private agreement before tomorrow’s testimony.',
        hero: 'The kitchen crews ask whether your badge will protect a worker who refuses to name names. Your sister waits outside with a pair of oven mitts.',
        villain:
          'The restaurant owners offer to turn their fire insurance premiums into a scholarship fund. The fine print makes protection conditional on obedience.',
      },
      reckoning: {
        student:
          'After the public betrayal, the cooks split over whether to trust anyone with a mask. They ask you to sit at the negotiating table without making promises for them.',
        hero: 'An injured dishwasher refuses a staged rescue photo. You can defend their decision even if the gas company buys every headline.',
        villain:
          'Your insurance customers want the city to believe the betrayal was your rival’s idea. One cook brings the original receipts and asks what their silence is worth.',
      },
      outcomes: {
        hero: 'Backdraft puts the apron on the witness stand and offers the crew a safe exit without asking them to endorse the testimony.',
        villain:
          'Backdraft accepts the owners’ contracts and puts the gas company under the kitchens’ new protection racket.',
        independent:
          'Backdraft returns the unspent insurance money to the cooks and asks them to write their own demands.',
        stay: 'Backdraft stays at the table as the cooks’ witness, declining to turn their dispute into another costume ceremony.',
      },
    },
    'accident-air': {
      first: {
        student:
          'The airfield sends a damaged harness and asks you to demonstrate a safe landing. The inquiry wants a pilot’s name before it will examine the storm warning.',
        hero: 'A frightened window washer asks you to rescue them without a crowd watching. Your old instructor has brought the original wind log.',
        villain:
          'A bank offers you a contract to silence its demonstrators. The airfield board will drop its investigation if you sign.',
      },
      reckoning: {
        student:
          'Your classmates keep replaying the betrayal on the dormitory screens. You ask them to meet at ground level, where the wind cannot carry their words away.',
        hero: 'The family of a missing jumper asks why their warning was never broadcast. They need the log, not another airborne stunt.',
        villain:
          'Your crew wants to erase the testimony by emptying the air from the hearing room. Your instructor offers to identify the sponsor instead.',
      },
      outcomes: {
        hero: 'Skyline lands beside the inquiry desk and agrees to testify from the ground, with the damaged harness in view.',
        villain:
          'Skyline takes the silence contract and makes the sponsors answer to her instead of the investigators.',
        independent:
          'Skyline hands the harness and wind log to the independent inquiry, leaving the contract unsigned.',
        stay: 'Skyline declines the sponsor’s spectacle and practices another landing on her own terms.',
      },
    },
    'accident-earth': {
      first: {
        student:
          'The tunnel workers bring a cracked inspection helmet. The transit authority has prepared a plaque for the rescuers, leaving off the names of the crew it abandoned.',
        hero: 'A bridge inspector asks you to stand beneath a failing span while the authority empties its offices. The workers ask you to make their records public first.',
        villain:
          'The banks above Old Quarry offer a retainer for keeping their buildings upright. The tunnel workers receive none of it.',
      },
      reckoning: {
        student:
          'Since the betrayal, rumors of another abandoned crew have spread. A retired sandhog brings a map marked with the places nobody searched.',
        hero: 'A worker you rescued refuses to endorse the transit authority’s new monument. You can support the memorial without taking credit for it.',
        villain:
          'The banks demand that you collapse a rival’s empty office as a show of control. A worker points out the inhabited apartments below.',
      },
      outcomes: {
        hero: 'Cornerstone braces the entrance and lets the workers read their own names into the public record.',
        villain:
          'Cornerstone claims the underground easements and makes the banks pay for every building they expect him to support.',
        independent:
          'Cornerstone puts the rescue maps in the union archive and returns to training without accepting a title.',
        stay: 'Cornerstone stays with the workers until they have finished correcting the plaque.',
      },
    },
    'accident-water': {
      first: {
        student:
          'The power company sends a settlement agreement to your family. The lawyer has left a blank line where your own account of the cooling pond should be.',
        hero: 'The harbor rescue crew asks you to sign a statement about contamination. Your family worries that it could complicate the case.',
        villain:
          "A reservoir contractor offers you exclusive access to the city's valves if you stop talking about the cooling pond.",
      },
      reckoning: {
        student:
          'After the betrayal, the harbor crews refuse the academy’s canned statement. They ask you to decide what the city can know about your own experience.',
        hero: 'A fisher asks whether the new rescue fund belongs to the victims or the company whose logo is on the boats.',
        villain:
          'The contractor wants to use the city’s drought as leverage over the power company. Your family asks whether the people at the docks will be exempt.',
      },
      outcomes: {
        hero: 'Tidewarden reads her own statement and makes the rescue fund independent of the company’s publicity.',
        villain:
          'Tidewarden takes control of the reservoir contract, making access to the city’s water a political bargain.',
        independent:
          'Tidewarden refuses to be the company’s exhibit and gives the family time to consider their own legal choices.',
        stay: 'Tidewarden keeps her own account of the pond and offers the harbor crew help without committing to a mantle.',
      },
    },
    'accident-discipline': {
      first: {
        student:
          'The kendo club brings your old wooden sword and the satellite fragment. Your instructor asks for a bout with the fragment locked outside the room.',
        hero: 'The students you teach want the drills to remain free. A satellite contractor offers to sponsor your class if the timing data remains private.',
        villain:
          'The contractor offers to buy an exclusive forecast of every patrol. Your instructor asks whether the club is still a place to learn.',
      },
      reckoning: {
        student:
          'The betrayal has made everyone suspicious of perfect timing. Your former sparring partner asks for a rematch without a prediction of the result.',
        hero: 'A student admits they copied one of your impossible moves and injured their wrist. They ask for a lesson that works at ordinary speed.',
        villain:
          'Your buyers want you to sell them the timetable of the prom guards. Your instructor asks what happens to the students caught in the resulting raid.',
      },
      outcomes: {
        hero: 'The Second Hand returns the fragment for examination and offers a lesson with no clock or sponsor.',
        villain:
          'The Second Hand signs the timing contract and makes the buyers dependent on his forecasts.',
        independent:
          'The Second Hand leaves the fragment in the locker and returns to ordinary practice with the class.',
        stay: 'The Second Hand accepts the rematch and lets an ordinary exchange of blows decide its outcome.',
      },
    },
    'accident-genius': {
      first: {
        student:
          'The lab brings an invention agreement and your old chemistry notebook. Your best friend has written their name in the margin so you do not have to pretend to remember it.',
        hero: 'The rescue engineers ask you to release the plans for a device that could save their crew. The lab claims the patent belongs to it.',
        villain:
          'An investor wants your calculations for ranking which neighborhoods are worth the cost of saving. Your friend asks to see the input data.',
      },
      reckoning: {
        student:
          'After the betrayal, your predictions are everywhere on the news. Your friend asks you to stop calculating long enough to listen to what actually happened.',
        hero: 'A rescue engineer presents a mistake in your published design. You can correct it publicly without blaming the people who trusted you.',
        villain:
          'Your investors want to remove the neighborhoods that keep making your forecasts wrong. Your friend puts a handwritten list of their residents beside the model.',
      },
      outcomes: {
        hero: 'Eureka publishes the repair instructions with the engineers’ corrections and refuses to hide the lab’s role.',
        villain:
          'Eureka signs the exclusive optimization contract and puts her drone network in charge of the allocation model.',
        independent:
          'Eureka walks away from the exclusive contract and asks her friend to help her check the old notebook.',
        stay: 'Eureka sets the model aside and records what the witnesses tell her, including the parts she cannot calculate.',
      },
    },
  }

export function beginPlayerEvolution(
  form: PlayerForm = 'student',
): PlayerEvolution {
  return { form, protect: 0, exploit: 0, milestones: [] }
}

export function recordPlayerValues(
  state: PlayerEvolution,
  choice: { influence: number; danger: number },
): PlayerEvolution {
  return {
    ...state,
    protect:
      state.protect + (choice.influence > 0 && choice.danger <= 0 ? 1 : 0),
    exploit:
      state.exploit + (choice.influence < 0 || choice.danger >= 2 ? 1 : 0),
  }
}

export function canEvolve(
  state: PlayerEvolution,
  target: PlayerForm,
  signature?: SignaturePowerId,
): boolean {
  if (target === 'student') return true
  if (!signature) return false
  return target === 'hero' ? state.protect >= 2 : state.exploit >= 2
}

export function evolutionEncounter(
  signature: SignaturePowerId | undefined,
  state: PlayerEvolution,
  day: 16 | 23,
) {
  const person = signature ? identityFor(signature) : undefined
  const current = person?.[state.form]
  const personal = signature ? PERSONAL_EVOLUTION[signature] : undefined
  const personalScene =
    personal?.[day === 16 ? 'first' : 'reckoning'][state.form]
  const scene = !person
    ? 'Your identity has not been registered. You can continue training but may not borrow another person’s heroic mantle.'
    : day === 16 && state.form === 'student'
      ? `You began as ${person.realName}, known as ${person.student.alias}. ${person.backstory} The heroic ${person.hero.alias} would ${person.hero.method}; the feared ${person.villain.alias} would ${person.villain.method}. Neither path happens automatically.`
      : `${person.realName} arrives for another reckoning as ${current?.alias}. ${person.heroDecision} Or: ${person.villainDecision} Former friends will remember what you choose.`
  const options = [
    ...(state.form !== 'hero' && canEvolve(state, 'hero', signature)
      ? [
          {
            id: 'evolve-hero',
            label: `Choose heroism as ${person!.hero.alias}`,
            text: `${person!.realName} chooses ${person!.hero.alias}. ${person!.heroDecision} ${person!.hero.method} Rescues become easier but covert villain jobs harder.`,
            influence: 2,
            danger: -1,
          },
        ]
      : []),
    ...(state.form !== 'villain' && canEvolve(state, 'villain', signature)
      ? [
          {
            id: 'evolve-villain',
            label: `Choose villainy as ${person!.villain.alias}`,
            text: `${person!.realName} claims ${person!.villain.alias}. ${person!.villainDecision} ${person!.villain.method} Covert jobs become easier but public rescues harder.`,
            influence: -2,
            danger: 2,
          },
        ]
      : []),
    ...(state.form !== 'student'
      ? [
          {
            id: 'evolve-independent',
            label: 'Step back from the mantle and return to student duties',
            text: `${person?.realName ?? 'You'} chooses independence. Your name stays yours, but you return to the student toolkit and its responsibilities.`,
            influence: 0,
            danger: 0,
          },
        ]
      : []),
    {
      id: 'evolve-student',
      label:
        state.form === 'student'
          ? 'Stay a student and build my own future'
          : 'Keep my current identity',
      text: `Nobody gets to impose a costume on ${person?.realName ?? 'you'}. ${state.form === 'student' ? 'You remain a student, with more time to earn a mantle.' : 'Your present mantle stays intact.'}`,
      influence: 0,
      danger: 0,
    },
  ]
  return {
    title: day === 16 ? 'The First Mask' : 'The Reckoning of the Mask',
    location: 'Academy / Public Oath Chamber',
    scene: `${scene}${personalScene ? ' ' + personalScene : ''} Your record: ${state.protect} protective and ${state.exploit} exploitative choices. Two matching choices are required for a new mantle.`,
    options: options.map((option) => {
      const outcome =
        personal?.outcomes[
          option.id === 'evolve-hero'
            ? 'hero'
            : option.id === 'evolve-villain'
              ? 'villain'
              : option.id === 'evolve-independent'
                ? 'independent'
                : 'stay'
        ]
      return outcome ? { ...option, text: `${option.text} ${outcome}` } : option
    }),
  }
}

export function resolveEvolution(
  state: PlayerEvolution,
  choice: string,
  day: number,
  signature?: SignaturePowerId,
): PlayerEvolution | null {
  if (day !== 16 && day !== 23) return null
  if (state.milestones.some((event) => event.day === day)) return null
  const form =
    choice === 'evolve-hero'
      ? 'hero'
      : choice === 'evolve-villain'
        ? 'villain'
        : choice === 'evolve-independent'
          ? 'student'
          : choice === 'evolve-student'
            ? state.form
            : null
  if (!form || (form !== 'student' && !signature)) return null
  if (
    choice !== 'evolve-student' &&
    (form === state.form || !canEvolve(state, form, signature))
  )
    return null
  return { ...state, form, milestones: [...state.milestones, { day, form }] }
}

export function evolutionNightModifier(
  state: PlayerEvolution | undefined,
  mission: 'hero' | 'villain' | 'rogue' | 'shared',
): number {
  if (!state || state.form === 'student') return 0
  if (state.form === 'hero')
    return mission === 'hero' || mission === 'shared'
      ? 2
      : mission === 'villain'
        ? -1
        : 0
  return mission === 'villain' || mission === 'rogue'
    ? 2
    : mission === 'hero'
      ? -1
      : 0
}

export function isValidPlayerEvolution(
  raw: unknown,
  signature?: SignaturePowerId,
  initialForm: PlayerForm = 'student',
): raw is PlayerEvolution {
  if (!raw || typeof raw !== 'object') return false
  const state = raw as Partial<PlayerEvolution>
  if (
    !['student', 'hero', 'villain'].includes(state.form ?? '') ||
    !Number.isInteger(state.protect) ||
    (state.protect ?? -1) < 0 ||
    !Number.isInteger(state.exploit) ||
    (state.exploit ?? -1) < 0 ||
    !Array.isArray(state.milestones) ||
    state.milestones.length > 2
  )
    return false
  let previous = 0
  let last: PlayerForm = initialForm
  for (const event of state.milestones) {
    if (
      !event ||
      ![16, 23].includes(event.day) ||
      event.day <= previous ||
      !['student', 'hero', 'villain'].includes(event.form)
    )
      return false
    if (!signature && event.form !== 'student') return false
    if (event.form !== last) {
      if (event.form === 'hero' && (state.protect ?? 0) < 2) return false
      if (event.form === 'villain' && (state.exploit ?? 0) < 2) return false
    }
    previous = event.day
    last = event.form
  }
  return state.form === last
}
