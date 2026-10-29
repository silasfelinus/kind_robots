import type { CaptainId, CrewId, VoyageRun } from './rules'

export type CaptainInstinctChoice = 'impulse' | 'restraint'
export type CaptainInstinct = {
  title: string
  situation: string
  impulse: string
  restraint: string
  impulseOutcome: string
  restraintOutcome: string
  crewReplies: readonly { crew: CrewId; line: string }[]
}

/**
 * An optional, once-per-chapter act of character. A captain's bravado,
 * paranoia or curiosity can help on a mission, but always changes something.
 */
export const CAPTAIN_INSTINCTS: Record<CaptainId, CaptainInstinct> = {
  fluke: {
    title: 'Nine Seconds Nobody Has Lived Yet',
    situation:
      'Three possible Flukes knock from different sides of the couch. All three are bored. Only one admits to having caused this distress call.',
    impulse: 'Borrow nine seconds from tomorrow before anybody notices',
    restraint: 'Stay in the present, even if it has a dreadful plot',
    impulseOutcome:
      'Fluke st-st-stops a clock that has not been invented. A future version will want those seconds returned.',
    restraintOutcome:
      'Fluke declines to peek. The crew realizes this is the first genuinely surprising thing their captain has done in centuries.',
    crewReplies: [
      {
        crew: 'kivo',
        line: 'Please stop postdating my sealed letters. Some things are allowed to arrive in order.',
      },
      {
        crew: 'mox',
        line: 'I decline to learn what I will want before I have wanted it.',
      },
    ],
  },
  vale: {
    title: 'Do Not Void This Warranty',
    situation:
      'The route board has a regulatory lockout. Vale identifies three vulnerabilities and wants to solder a fourth onto the captain’s chair cushion.',
    impulse: 'Jailbreak the safety board with a stolen physics theorem',
    restraint: 'Publish the exploit and let the crew decide',
    impulseOutcome:
      'Vale rewrites an immutable navigation condition in fluorescent marker. The replacement components are not under warranty.',
    restraintOutcome:
      'Vale opens the circuit diagram and waits for objections. She is furious to discover that listening is also a type of genius.',
    crewReplies: [
      {
        crew: 'sora',
        line: 'You asked the generator if it wanted to be upgraded. It said no. This is excellent progress.',
      },
      {
        crew: 'pell',
        line: 'If the couch explodes, I want it recorded that the sparks were not union-approved.',
      },
    ],
  },
  solace: {
    title: 'The Third Emergency Exit',
    situation:
      'The distress signal has stopped mid-sentence. Solace recognizes the ominous silence. The couch is, once again, a room with no doors.',
    impulse: 'Install panic lines on every cushion and rehearse the escape',
    restraint: 'Tell the crew what you fear and let them make the plan',
    impulseOutcome:
      'Solace knots safety ropes into the sofa. A pursuing monster might laugh. It would be the last thing it laughs at.',
    restraintOutcome:
      'Solace shares the eleven rules that kept the last crew alive. For once, other people help carry the responsibility.',
    crewReplies: [
      {
        crew: 'fen',
        line: 'I have opened a corridor with no checkpoint. Stop asking me where the checkpoint is.',
      },
      {
        crew: 'tess',
        line: 'I found an exit you did not draw. That does not make it a trap. Probably.',
      },
    ],
  },
  rex: {
    title: 'The Hero Shot, Take Four',
    situation:
      'Rex projects a thirty-foot hologram of himself rescuing a planet. The actual planet politely asks whether he can arrive without the music.',
    impulse: 'Stage a spectacular first contact to distract the enemy',
    restraint: 'Give the crew the credit and keep the cameras dark',
    impulseOutcome:
      'Rex delivers the speech while the hologram draws hostile fire. The actual Rex discovers that courage includes ducking.',
    restraintOutcome:
      'Rex turns off the heroic spotlight. The crew notices the rescue still counts without anyone applauding.',
    crewReplies: [
      {
        crew: 'jex',
        line: 'I can play you a hero anthem. I can also play the unpaid musicians’ complaints.',
      },
      {
        crew: 'pell',
        line: 'There is no medal for a working emergency exit. You could start there.',
      },
    ],
  },
  quill: {
    title: 'The Human Recycling Department',
    situation:
      'Quill regards the force bubble as a wasteful external organ. His gothic bodysuit has suggested a direct, deeply unhygienic connection.',
    impulse: 'Link the closed-loop suit to the couch’s shield',
    restraint: 'Invite a consent review before altering anybody’s air',
    impulseOutcome:
      'Quill sacrifices a measure of shield charge, then solemnly drinks from the flask labeled ME, VINTAGE. Everyone else takes a step back.',
    restraintOutcome:
      'Quill permits an independent review of the biofilter. Nobody has ever made him feel more vulnerable than a form with a blank answer.',
    crewReplies: [
      {
        crew: 'vela',
        line: 'I will check the suit. I will not check your fluids during lunch.',
      },
      {
        crew: 'brin',
        line: 'Your filters contain a living colony. I regret to report that it has opinions.',
      },
    ],
  },
  ro: {
    title: 'An Exquisite Misunderstanding',
    situation:
      'Ro discovers that the civilian distress signal includes a funeral march. Their fog machine produces a scandalously lovely amount of mourning.',
    impulse: 'Broadcast the grand gothic spectacle as a decoy',
    restraint: 'Ask the mourners how they want their story told',
    impulseOutcome:
      'Ro bathes the couch in theatrical mist. The enemy takes the bait; the audience is upset to learn they were watching a rescue.',
    restraintOutcome:
      'Ro lets the witnesses speak without music. The velvet-clad master of ceremonies discovers the power of standing very still.',
    crewReplies: [
      {
        crew: 'omi',
        line: 'This is not the thunder bell. This is the bell that means please listen.',
      },
      {
        crew: 'rue',
        line: 'Your royal credentials remain fraudulent. The courtesy, unfortunately, appears genuine.',
      },
    ],
  },
}

export function captainInstinctAvailable(run: VoyageRun): boolean {
  return (
    run.phase === 'briefing' &&
    !(run.captainInstincts ?? []).some((item) => item.chapter === run.chapter)
  )
}

export function captainInstinctReply(run: VoyageRun): string {
  const repertoire = CAPTAIN_INSTINCTS[run.captain].crewReplies
  const speaker = repertoire.find((item) => run.crew.includes(item.crew))
  return (
    speaker?.line ??
    'The crew watches the captain carefully and reserves the right to disagree.'
  )
}

export function chooseCaptainInstinct(
  run: VoyageRun,
  choice: CaptainInstinctChoice,
): VoyageRun {
  if (
    !captainInstinctAvailable(run) ||
    !['impulse', 'restraint'].includes(choice)
  )
    return run
  const current = CAPTAIN_INSTINCTS[run.captain]
  const impulse = choice === 'impulse'
  if (
    impulse &&
    (run.captain === 'vale' || run.captain === 'solace') &&
    run.supplies < 1
  )
    return run
  if (impulse && run.captain === 'quill' && (run.shieldCharge ?? 2) < 1)
    return run
  const impulseChanges: Record<CaptainId, Partial<VoyageRun>> = {
    fluke: { reputation: run.reputation - 1 },
    vale: { supplies: run.supplies - 1 },
    solace: { supplies: run.supplies - 1 },
    rex: { reputation: run.reputation - 1 },
    quill: { shieldCharge: (run.shieldCharge ?? 2) - 1 },
    ro: { trust: run.trust - 1 },
  }
  const restraintChanges: Record<CaptainId, Partial<VoyageRun>> = {
    fluke: { trust: run.trust + 1 },
    vale: { trust: run.trust + 1 },
    solace: { trust: run.trust + 1 },
    rex: { reputation: run.reputation + 1 },
    quill: { reputation: run.reputation + 1 },
    ro: { trust: run.trust + 1 },
  }
  const outcome = impulse ? current.impulseOutcome : current.restraintOutcome
  const response = captainInstinctReply(run)
  return {
    ...run,
    ...(impulse ? impulseChanges[run.captain] : restraintChanges[run.captain]),
    captainBonus: impulse ? 10 : 0,
    captainInstincts: [
      ...(run.captainInstincts ?? []),
      { chapter: run.chapter, approach: choice },
    ],
    scene: outcome + ' ' + response,
    log: [
      ...run.log,
      'Captain’s signature / chapter ' +
        run.chapter +
        ': ' +
        outcome +
        ' ' +
        response,
    ],
  }
}
