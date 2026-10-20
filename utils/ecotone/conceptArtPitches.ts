import {
  ENCOUNTERS,
  ENDING_IDS,
  type Fate,
  type EndingLine,
  type LensId,
} from './content'
import { BEATS, FUTURES, SIGNATURES } from './story'
import { FUTURE_BOOKENDS, NEW_SIGNATURES } from './finaleExpansion'
import { REVISED_COMPANION_SIGNATURES } from './journeySignatures'
import { REGIONAL_CALLBACKS } from './regionalCallbacks'
import { cardArtKey, endingArtKey, outcomeArtKey } from './artSlots'
import { openingLensChoices } from './openingLensChoices'

/**
 * These are text-only scene requirements, not prompts with a prescribed style.
 * An artist or a dedicated styler controls palette, medium, character design
 * and shot treatment. No image jobs or approvals are implied here.
 */
export type ConceptArtPitch = {
  key: string
  phase: 'introduction' | 'paragraph' | 'outcome' | 'ending' | 'epilogue'
  title: string
  placeTime: string
  subject: string
  action: string
  visibleEvidence: string[]
  mustNotImply: string[]
  sourceConditions: string[]
  altTextDraft: string
  status: 'editorial-draft'
}

const NEVER_ASSUME = [
  'Do not depict a choice, victory, companion, relationship or civic result that the player has not earned.',
  'No identifiable real person or cultural/tribal authority should be invented for a supernatural role.',
]

function presentation(card: (typeof ENCOUNTERS)[number]): ConceptArtPitch {
  return {
    key: cardArtKey(card.id),
    phase: 'introduction',
    title: `${card.title}: arrival`,
    placeTime: card.place,
    subject: card.title,
    action: card.body[0] ?? card.title,
    visibleEvidence: [card.scene, card.place, card.body[0] ?? ''],
    mustNotImply: [
      ...NEVER_ASSUME,
      'This is the dilemma before any player choice; no solution is visible.',
    ],
    sourceConditions: [`seen:${card.id}`],
    altTextDraft: `${card.title} at ${card.place}: ${card.body[0] ?? 'the scene before a decision'}`,
    status: 'editorial-draft',
  }
}

function paragraphPitch(
  card: (typeof ENCOUNTERS)[number],
  i: number,
): ConceptArtPitch {
  return {
    key: `paragraphs/${card.id.toLowerCase()}/${i + 1}`,
    phase: 'paragraph',
    title: `${card.title}: page ${i + 1}`,
    placeTime: card.place,
    subject: card.title,
    action: card.body[i]!,
    visibleEvidence: [card.scene, card.place, card.body[i]!],
    mustNotImply: [
      ...NEVER_ASSUME,
      'Remain before the decision; do not show any later outcome.',
    ],
    sourceConditions: [`seen:${card.id}`, `paragraph:${i + 1}`],
    altTextDraft: `${card.title}, scene ${i + 1}: ${card.body[i]}`,
    status: 'editorial-draft',
  }
}

function outcomePitch(
  card: (typeof ENCOUNTERS)[number],
  choice: (typeof card.choices)[number],
  result: 'success' | 'failure',
): ConceptArtPitch {
  const outcome = result === 'success' ? choice.success : choice.failure!
  const conditions = [
    `played:${card.id}`,
    `chosen:${card.id}:${choice.id}`,
    `result:${result}`,
  ]
  if (outcome.effects.flag) conditions.push(`flag:${outcome.effects.flag}`)
  return {
    key: outcomeArtKey(card.id, choice.id, result),
    phase: 'outcome',
    title: `${card.title}: ${choice.label} (${result})`,
    placeTime: card.place,
    subject: card.title,
    action: outcome.text,
    visibleEvidence: [
      choice.label,
      outcome.text,
      ...(outcome.effects.evidence ? [outcome.effects.evidence] : []),
    ],
    mustNotImply: [
      ...NEVER_ASSUME,
      'The alternate result of this roll is not part of the same picture.',
      'Do not turn a partial failure into a definitive victory, or a kind choice into an unearned solved mystery.',
    ],
    sourceConditions: conditions,
    altTextDraft: `${card.title}, ${result} after ${choice.label}: ${outcome.text}`,
    status: 'editorial-draft',
  }
}

export function encounterArtPitches(): ConceptArtPitch[] {
  return [...BEATS, ...ENCOUNTERS].flatMap((card) => [
    presentation(card),
    ...card.body.slice(1).map((_, i) => paragraphPitch(card, i + 1)),
    ...openingLensChoices(card)
      .filter((choice) => !choice.locked)
      .flatMap((choice) => [
        outcomePitch(card, choice, 'success'),
        ...(choice.failure ? [outcomePitch(card, choice, 'failure')] : []),
      ]),
  ])
}

export function endingArtPitches(): ConceptArtPitch[] {
  return ENDING_IDS.flatMap((id) => {
    const [lead, lens, fate] = id.split('.') as [EndingLine, LensId, Fate]
    const signature =
      SIGNATURES[`${lead}.${lens}`]?.[fate] ??
      NEW_SIGNATURES[`${lead}.${lens}`]?.[fate]
    const journeyLine =
      REVISED_COMPANION_SIGNATURES[`${lead}.${lens}`]?.[fate] ?? signature?.line
    const base: ConceptArtPitch = {
      key: endingArtKey(id),
      phase: 'ending',
      title: signature?.title ?? `${lead}, ${lens}, ${fate}`,
      placeTime: 'Humboldt County, a possible earned future',
      subject: `${lead} / ${lens} / ${fate}`,
      action: journeyLine ?? FUTURES[lead][fate][0]!,
      visibleEvidence: [journeyLine ?? FUTURES[lead][fate][0]!],
      mustNotImply: [
        ...NEVER_ASSUME,
        'The initial substance does not cause or define the moral outcome.',
      ],
      sourceConditions: [`earned-ending:${id}`],
      altTextDraft: `${signature?.title ?? id}: ${journeyLine ?? FUTURES[lead][fate][0]}`,
      status: 'editorial-draft',
    }
    const bookends = FUTURE_BOOKENDS[lead]?.[fate]
    const temporal = [
      bookends?.[0] ?? FUTURES[lead][fate][0]!,
      FUTURES[lead][fate][0]!,
      bookends?.[1] ?? FUTURES[lead][fate].at(-1)!,
    ]
    return [
      base,
      ...(['one-year', 'ten-year', 'thirty-year'] as const).map(
        (phase, index): ConceptArtPitch => ({
          ...base,
          key: `epilogues/${id.replaceAll('.', '-')}/${phase}`,
          phase: 'epilogue',
          title: `${base.title}: ${phase}`,
          placeTime: `Humboldt County, ${phase} future`,
          action: temporal[index]!,
          visibleEvidence: [temporal[index]!],
          mustNotImply: [
            ...base.mustNotImply,
            'Only draw an institution, agreement or personal milestone if the cited ending text actually establishes it.',
          ],
          sourceConditions: [`earned-ending:${id}`, `time:${phase}`],
          altTextDraft: `${base.title} at ${phase}: ${temporal[index]}`,
        }),
      ),
    ]
  })
}

export function callbackArtPitches(): ConceptArtPitch[] {
  return REGIONAL_CALLBACKS.map((callback) => ({
    key: `callbacks/${callback.id.toLowerCase()}/${callback.choice}`,
    phase: 'epilogue',
    title: `${callback.id}: ${callback.choice} consequence`,
    placeTime: 'Humboldt County, aftermath of a verified choice',
    subject: callback.id,
    action: callback.artMoment,
    visibleEvidence: [callback.artMoment],
    mustNotImply: [
      ...NEVER_ASSUME,
      'Do not show the paired alternate choice or a universal county-wide outcome from this one action.',
    ],
    sourceConditions: [`played:${callback.id}`, `flag:${callback.flag}`],
    altTextDraft: `Because this choice was earned: ${callback.artMoment}`,
    status: 'editorial-draft' as const,
  }))
}

export function allConceptArtPitches(): ConceptArtPitch[] {
  return [
    ...encounterArtPitches(),
    ...endingArtPitches(),
    ...callbackArtPitches(),
  ]
}
