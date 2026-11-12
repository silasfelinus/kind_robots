import {
  COMPANIONS,
  ENDING_IDS,
  LENSES,
  type EndingLine,
  type Fate,
  type LensId,
  type SceneKind,
} from './content'
// The engine folds the finale expansion into SIGNATURES, FUTURES and LENS_CODAS
// when it loads, so the dossier reads the same words the end screen shows.
import './engine'
import { endingArtKey } from './artSlots'
import { EVENTS, FUTURES, LENS_CODAS, SIGNATURES } from './story'

export type EndingDossierFact = {
  label: string
  value: string
  detail?: string
}

/**
 * Everything the Endings gallery can say about one ending without a run in
 * hand: the lead, lens and fate that earn it, its signature and epilogue, and
 * its picture. An earned card shows all of it; a locked card shows only the
 * `recipe`, which repeats what the grid already says and spoils nothing.
 */
export type EndingDossier = {
  id: string
  number: number
  total: number
  lead: EndingLine
  lens: LensId
  fate: Fate
  leadName: string
  lensLabel: string
  title: string
  line: string
  paragraphs: string[]
  coda: string | null
  art: string
  scene: SceneKind
  facts: EndingDossierFact[]
  recipe: string[]
  twin: { id: string; title: string }
}

const FATE_LABEL: Record<Fate, string> = { hope: 'Hopeful', dark: 'Dark' }

function sentence(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function endingFateLabel(fate: Fate): string {
  return FATE_LABEL[fate]
}

export function endingDossier(endingId: string): EndingDossier | null {
  const index = ENDING_IDS.indexOf(endingId)
  if (index < 0) return null
  const [lead, lens, fate] = endingId.split('.') as [EndingLine, LensId, Fate]
  const companion = COMPANIONS.find((item) => item.id === lead) ?? null
  const lensInfo = LENSES.find((item) => item.id === lens)
  const lensLabel = lensInfo?.label ?? lens
  const leadName =
    companion?.name ?? (lead === 'ecotopia' ? 'The Wild Way' : 'Alone')
  const signature = SIGNATURES[`${lead}.${lens}`]
  const otherFate: Fate = fate === 'hope' ? 'dark' : 'hope'
  const wild = lead === 'ecotopia'

  const facts: EndingDossierFact[] = [
    companion
      ? {
          label: 'Finished with',
          value: companion.name,
          detail: companion.role,
        }
      : wild
        ? {
            label: 'Finished with',
            value: 'The animals',
            detail: 'The Quiet Way, walked without a guide.',
          }
        : {
            label: 'Finished with',
            value: 'Nobody',
            detail: 'You saw the weekend through on your own.',
          },
    ...(companion
      ? [
          { label: 'Met at', value: sentence(companion.meetAt) },
          { label: 'What followed them', value: companion.anomaly },
        ]
      : []),
    {
      label: 'Opening lens',
      value: lensLabel,
      ...(lensInfo?.question ? { detail: lensInfo.question } : {}),
    },
    {
      label: 'Future',
      value: FATE_LABEL[fate],
      detail: wild
        ? fate === 'hope'
          ? 'You kept choosing the animals.'
          : 'The animal-first choices came up short.'
        : fate === 'hope'
          ? 'Goodwill, evidence and nerve carried the weekend.'
          : 'Goodwill, evidence and nerve came up short.',
    },
  ]

  return {
    id: endingId,
    number: index + 1,
    total: ENDING_IDS.length,
    lead,
    lens,
    fate,
    leadName,
    lensLabel,
    title: signature?.[fate]?.title || `${leadName} · ${lensLabel}`,
    line: signature?.[fate]?.line ?? '',
    paragraphs: FUTURES[lead][fate],
    coda: LENS_CODAS[lens] ?? null,
    art: endingArtKey(endingId),
    scene: wild
      ? 'marsh'
      : (EVENTS.find((event) => event.id === companion?.event)?.scene ??
        'plaza'),
    facts,
    recipe: [
      companion
        ? `Finish the weekend with ${companion.name}.`
        : wild
          ? 'Take the Quiet Way and finish it without a guide.'
          : 'Finish the weekend without a guide.',
      `Choose ${lensLabel} as your opening lens.`,
      wild
        ? fate === 'hope'
          ? 'Keep choosing the animals.'
          : 'Let the animal-first choices come up short.'
        : fate === 'hope'
          ? 'Earn the hopeful future.'
          : 'Fall short of the hopeful future.',
    ],
    twin: {
      id: `${lead}.${lens}.${otherFate}`,
      title:
        signature?.[otherFate]?.title ||
        `${leadName} · ${lensLabel} · ${FATE_LABEL[otherFate]}`,
    },
  }
}
