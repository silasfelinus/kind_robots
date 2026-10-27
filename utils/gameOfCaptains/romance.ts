import type { VoyageRun } from './rules'

export type RomanceRoute = 'fourple' | 'rue' | 'tess' | 'none'
export type RomanceStatus =
  'invited' | 'courting' | 'committed' | 'separated' | 'rejected' | 'friends'
export type RomanceChoiceId =
  | 'invite-fourple'
  | 'invite-rue'
  | 'invite-tess'
  | 'friends'
  | 'listen'
  | 'press'
  | 'step-back'
  | 'commit'
  | 'slow'
  | 'part'
export type RomanceRecord = {
  route: RomanceRoute
  status: RomanceStatus
  lastChapter: number
  result: string
  history: string[]
}
export type RomanceVoyage = VoyageRun & { romance?: RomanceRecord }
export type RomanceChoice = { id: RomanceChoiceId; label: string; cost: string }
export type RomanceMoment = {
  title: string
  setting: string
  speakers: readonly { name: string; line: string }[]
  portraits: readonly string[]
  choices: readonly RomanceChoice[]
}

const courtship = {
  fourple: {
    portraitKeys: ['crew-vela', 'crew-taal', 'crew-omi'],
    chapter2: {
      title: 'The Four-Cushion Accord',
      setting:
        'The war room unfolds behind the long red couch, but the four stay beneath its invisible, life-preserving bubble. A charter has four empty signatures.',
      speakers: [
        {
          name: 'Vela',
          line: 'I will not be the emergency department for your conscience.',
        },
        {
          name: 'Taal',
          line: 'We must be able to disagree without turning an argument into an evacuation order.',
        },
        {
          name: 'Omi',
          line: 'I can say yes in several chords. I can say no in one. Please learn the second.',
        },
      ],
    },
    chapter3: {
      title: 'Four Separate Signatures',
      setting:
        'Vox puts four blank spaces on a menu. The sentient Serendipity bar independently adjusts gravity so everyone sits at an equal height. The red couch floats beyond the window.',
      speakers: [
        { name: 'Taal', line: 'I am not voting on a captain.' },
        {
          name: 'Vela',
          line: 'I want affection that survives being told I am wrong.',
        },
        { name: 'Omi', line: 'A quartet is four people who can each leave.' },
      ],
    },
    invitation:
      'Vela agrees to talk without rank. Taal wants everyone asked individually. Omi rings a tentative note. Nobody has agreed to a relationship yet.',
    refusal:
      'Vela cannot trust how the captain treats vulnerable people. Taal refuses to turn a command into a vote. Omi says no clearly. All three remain respected crew.',
  },
  rue: {
    portraitKeys: ['crew-rue'],
    chapter2: {
      title: 'The Missing Signatures',
      setting:
        'Rue folds a Concord Freehold case file and places it between the captain and the stars.',
      speakers: [
        {
          name: 'Rue',
          line: 'I do not need you to be innocent. I need the record to reflect what you did.',
        },
        {
          name: 'Rue',
          line: 'A private promise cannot rest on the public exceptions you refuse other people.',
        },
      ],
    },
    chapter3: {
      title: 'A Clause for Two',
      setting:
        'Rue presents a blank sheet without a signature line as the couch approaches Serendipity.',
      speakers: [
        {
          name: 'Rue',
          line: 'This is not a treaty. Either of us may change our mind tomorrow.',
        },
      ],
    },
    invitation:
      'Rue agrees to discuss a future together after the missing-signatory hearing, without making any promise.',
    refusal:
      'Rue will not build private intimacy on a public record the captain refuses to acknowledge. Their professional work continues.',
  },
  tess: {
    portraitKeys: ['crew-tess'],
    chapter2: {
      title: 'The Unmarked Star',
      setting:
        'Tess projects a star route against the couch upholstery and covers the sanctuary coordinates with her hand.',
      speakers: [
        {
          name: 'Tess',
          line: 'The map is not mine to give you. I could choose to show you where I keep it.',
        },
        {
          name: 'Tess',
          line: 'I need you to leave some safe places undiscovered when the galaxy applauds.',
        },
      ],
    },
    chapter3: {
      title: 'A Route Without a Name',
      setting:
        'Tess shuts off the navigation lens. The map stays hers and the sky is still enormous.',
      speakers: [
        {
          name: 'Tess',
          line: 'I would like you beside me. That does not make you the owner of my map.',
        },
      ],
    },
    invitation:
      'Tess offers one uncharted evening. The refuge route stays private until its owners decide otherwise.',
    refusal:
      'Tess has seen what happens when protected routes become trophies. She chooses professional trust rather than romance.',
  },
} as const

function eligibleRoutes(run: VoyageRun): Exclude<RomanceRoute, 'none'>[] {
  const routes: Exclude<RomanceRoute, 'none'>[] = []
  if (
    run.crew.includes('vela') &&
    run.crew.includes('taal') &&
    run.crew.includes('omi')
  )
    routes.push('fourple')
  if (run.crew.includes('rue')) routes.push('rue')
  if (run.crew.includes('tess')) routes.push('tess')
  return routes
}

function compatible(run: VoyageRun, route: RomanceRoute) {
  return (
    run.trust >= 2 &&
    run.reputation >= 0 &&
    (route === 'fourple'
      ? run.intervention <= 3
      : route === 'tess'
        ? run.intervention <= 2
        : true)
  )
}

export function romanceMoment(run: VoyageRun): RomanceMoment | null {
  if (run.phase !== 'debrief' || run.chapter < 1 || run.chapter > 3) return null
  const record = (run as RomanceVoyage).romance
  if (record?.lastChapter === run.chapter) return null
  if (!record) {
    const routes = eligibleRoutes(run)
    if (run.chapter !== 1 || !routes.length) return null
    const fourple = routes.includes('fourple')
    return {
      title: 'Beyond the Chain of Command',
      setting:
        'The red couch coasts through the dark with the emergency force bubble still intact. Off duty, everyone asks for a conversation in which rank carries no authority.',
      speakers: fourple
        ? [
            {
              name: 'Vela',
              line: 'Is this a personnel evaluation? Mine already comes in writing.',
            },
            {
              name: 'Taal',
              line: 'I do not sign anything warmer than a treaty under an order.',
            },
            {
              name: 'Omi',
              line: 'There are four seats and four people. That is where the accounting must stop.',
            },
          ]
        : routes.flatMap((r) =>
            r === 'rue'
              ? [
                  {
                    name: 'Rue',
                    line: 'Ask me again after you have read the missing-signatory report.',
                  },
                ]
              : [
                  {
                    name: 'Tess',
                    line: 'Perhaps we can share a star without trying to own it.',
                  },
                ],
          ),
      portraits: routes.flatMap((route) => courtship[route].portraitKeys),
      choices: [
        ...(fourple
          ? [
              {
                id: 'invite-fourple' as const,
                label: 'Invite Vela, Taal and Omi to talk as equals',
                cost: 'An invitation, not their consent',
              },
            ]
          : []),
        ...(routes.includes('rue')
          ? [
              {
                id: 'invite-rue' as const,
                label: 'Ask Rue about a future together',
                cost: 'Public accountability comes first',
              },
            ]
          : []),
        ...(routes.includes('tess')
          ? [
              {
                id: 'invite-tess' as const,
                label: 'Ask Tess to share an uncharted evening',
                cost: 'Her map is not yours',
              },
            ]
          : []),
        {
          id: 'friends',
          label: 'Keep your closeness as friendship',
          cost: 'No romantic obligation or penalty',
        },
      ],
    }
  }
  if (record.status !== 'invited' && record.status !== 'courting') return null
  if (record.route === 'none') return null
  const story = courtship[record.route]
  if (run.chapter === 2 && record.status === 'invited') {
    return {
      ...story.chapter2,
      portraits: [...story.portraitKeys],
      choices: [
        {
          id: 'listen',
          label: 'Hear every boundary and keep the agreement revocable',
          cost: 'No one owes a captain affection',
        },
        {
          id: 'press',
          label: 'Demand a decision immediately',
          cost: 'Ends courtship, not employment',
        },
        {
          id: 'step-back',
          label: 'Step away kindly',
          cost: 'Continue as colleagues',
        },
      ],
    }
  }
  if (run.chapter === 3 && record.status === 'courting') {
    return {
      ...story.chapter3,
      portraits: [...story.portraitKeys],
      choices: [
        {
          id: 'commit',
          label:
            record.route === 'fourple'
              ? 'Ask for four freely given signatures'
              : 'Invite a shared future',
          cost: 'Requires earned mutual trust',
        },
        {
          id: 'slow',
          label: 'Continue without a promise',
          cost: 'Love need not resolve today',
        },
        {
          id: 'part',
          label: 'Part as partners and stay colleagues',
          cost: 'No one loses their place on the couch',
        },
      ],
    }
  }
  return null
}

export function chooseRomance(
  run: VoyageRun,
  choice: RomanceChoiceId,
): VoyageRun {
  const moment = romanceMoment(run)
  if (!moment || !moment.choices.some((item) => item.id === choice)) return run
  const previous = (run as RomanceVoyage).romance
  const route: RomanceRoute =
    choice === 'invite-fourple'
      ? 'fourple'
      : choice === 'invite-rue'
        ? 'rue'
        : choice === 'invite-tess'
          ? 'tess'
          : (previous?.route ?? 'none')
  const story = route === 'none' ? null : courtship[route]
  let status: RomanceStatus
  let text: string
  if (choice === 'friends') {
    status = 'friends'
    text =
      'The crew remain close friends. Nobody loses a job, an assignment or a skill point.'
  } else if (choice === 'step-back' || choice === 'part') {
    status = 'separated'
    text =
      'The relationship ends without orders or reprisals. Everyone remains aboard by their own choice.'
  } else if (choice === 'press') {
    status = 'rejected'
    text =
      'A captain cannot issue an order to love. The invitation is firmly declined; the crew keep their professional roles.'
  } else if (choice.startsWith('invite-') && story) {
    status = 'invited'
    text = story.invitation
  } else if (choice === 'listen' && story) {
    status = compatible(run, route) ? 'courting' : 'rejected'
    text =
      status === 'rejected'
        ? story.refusal
        : route === 'fourple'
          ? 'Vela establishes clinic boundaries. Taal reserves a right to disagree. Omi sounds a deliberate yes. Each person independently consents to explore the four-person relationship.'
          : route === 'rue'
            ? 'Rue admits affection but keeps the public record open to correction.'
            : 'Tess chooses companionship without disclosing or surrendering the sanctuary map.'
  } else if (choice === 'slow') {
    status = 'courting'
    text =
      'Nobody signs anything. Their feelings remain real without being a promise.'
  } else if (choice === 'commit' && story) {
    status = compatible(run, route) ? 'committed' : 'separated'
    text =
      status === 'separated'
        ? story.refusal
        : route === 'fourple'
          ? 'Vela says yes freely. Taal decides separately. Omi rings a clear chord of agreement. The captain answers without giving an order. Four people form a relationship any of them may leave.'
          : route === 'rue'
            ? 'Rue chooses the captain and keeps the contentious treaty file open.'
            : 'Tess chooses the captain; the map and the people it protects remain hers to defend.'
  } else return run
  const message = 'Relationship / chapter ' + run.chapter + ': ' + text
  const romance: RomanceRecord = {
    route,
    status,
    result: text,
    lastChapter: run.chapter,
    history: [...(previous?.history ?? []), message],
  }
  return { ...run, romance, log: [...run.log, message] }
}

export function relationshipEpilogue(run: VoyageRun): VoyageRun {
  if (run.phase !== 'ending') return run
  const record = (run as RomanceVoyage).romance
  if (!record || record.route === 'none') return run
  if (run.log.some((line) => line.startsWith('Relationship epilogue: ')))
    return run
  let text: string
  if (record.status === 'committed') {
    text =
      record.route === 'fourple'
        ? 'The red couch has a fourth pillow with no captain’s insignia. Vela keeps a clinic on every return route. Taal negotiates their promises. Omi teaches the other three to hear silence. None calls the four-person relationship a chain of command.'
        : record.route === 'rue'
          ? 'Rue chooses the captain with their own pen, the public records still open and no special immunity granted.'
          : 'Tess makes room for the captain under the stars, while the map remains hers and the sanctuary stays unmarked.'
  } else if (record.status === 'courting' || record.status === 'invited') {
    text =
      'There is room on the couch for a future that neither person is obliged to promise. The relationship remains an open question.'
  } else {
    text =
      record.route === 'fourple'
        ? 'The four-person charter remains unsigned. Vela, Taal and Omi remain skilled and valued officers. The couch is quieter, not weaker.'
        : record.route === 'rue'
          ? 'Rue closes the romantic conversation, not the public case, and continues their essential work.'
          : 'Tess reclaims the unmarked star. The captain retains a friend, not ownership of her secrets.'
  }
  return {
    ...run,
    scene: run.scene + ' ' + text,
    log: [...run.log, 'Relationship epilogue: ' + text],
  }
}
