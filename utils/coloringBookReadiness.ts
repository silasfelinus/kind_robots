import type {
  ColoringBookProductionState,
  ColoringBookProposal,
  ColoringBookStudioBook,
} from '~/types/coloringBookStudio'

export type ColoringBookReadinessKey =
  | 'blocked'
  | 'needs-prompt'
  | 'needs-color'
  | 'accept-color'
  | 'needs-bw'
  | 'accept-bw'
  | 'finalize'
  | 'final'

export type ColoringBookProposalReadiness = {
  key: ColoringBookReadinessKey
  label: string
  detail: string
  actionable: boolean
}

export type ColoringBookReadinessSummary = {
  total: number
  final: number
  finalize: number
  acceptColor: number
  acceptBw: number
  needsColor: number
  needsBw: number
  needsPrompt: number
  blocked: number
  actionable: number
  coverPending: boolean
  interiorReady: boolean
  printReady: boolean
}

const IMAGE_PATH = /\.(?:webp|png|jpe?g)$/i

function isSetAssetPath(
  value: string | null | undefined,
  bookSlug: string,
): boolean {
  const path = String(value || '').trim().replace(/\\/g, '/')
  const prefix = `projects/coloring-book/sets/${bookSlug}/`
  return Boolean(
    path &&
      !path.startsWith('/') &&
      !path.includes(':') &&
      !path.startsWith('user-attachment') &&
      !path.split('/').includes('..') &&
      (!path.startsWith('projects/') || path.startsWith(prefix)) &&
      IMAGE_PATH.test(path),
  )
}

function colorCandidateAvailable(
  bookSlug: string,
  proposal: ColoringBookProposal,
): boolean {
  if (proposal.queue.status === 'done' && proposal.queue.renderedPath) return true
  return isSetAssetPath(proposal.colorPath, bookSlug)
}

function bwCandidateAvailable(
  bookSlug: string,
  proposal: ColoringBookProposal,
  production: ColoringBookProductionState | null,
): boolean {
  if (production?.bwStatus === 'done' && production.bwRenderedPath) return true
  return isSetAssetPath(proposal.bwPath, bookSlug)
}

function firstReason(reasons: string[] | undefined): string | null {
  return reasons?.find((reason) => reason.trim())?.trim() ?? null
}

export function proposalReadiness(
  bookSlug: string,
  proposal: ColoringBookProposal,
  production: ColoringBookProductionState | null,
): ColoringBookProposalReadiness {
  if (proposal.final.color && proposal.final.bw) {
    return {
      key: 'final',
      label: 'Final pair',
      detail: 'Color and black-and-white masters are finalized.',
      actionable: false,
    }
  }

  if (!proposal.accepted.color) {
    if (!proposal.prompt.trim()) {
      return {
        key: 'needs-prompt',
        label: 'Needs prompt',
        detail: 'Write the canonical production prompt before generating art.',
        actionable: true,
      }
    }
    if (proposal.queue.status === 'needs_review' || proposal.queue.semanticGateError) {
      return {
        key: 'blocked',
        label: 'Color blocked',
        detail:
          proposal.queue.semanticGateError ||
          'The current color candidate needs human review.',
        actionable: true,
      }
    }
    if (colorCandidateAvailable(bookSlug, proposal)) {
      return {
        key: 'accept-color',
        label: 'Accept color',
        detail: 'A set-local color candidate is ready for human acceptance.',
        actionable: true,
      }
    }
    return {
      key: 'needs-color',
      label: 'Needs color',
      detail: 'Generate or curate a full-color composition candidate.',
      actionable: true,
    }
  }

  if (!proposal.accepted.bw) {
    if (production?.bwStatus === 'needs_review') {
      return {
        key: 'blocked',
        label: 'B&W blocked',
        detail:
          firstReason(production.bwSemanticReasons) ||
          'The current black-and-white candidate needs human review.',
        actionable: true,
      }
    }
    if (bwCandidateAvailable(bookSlug, proposal, production)) {
      return {
        key: 'accept-bw',
        label: 'Accept B&W',
        detail: 'A matched black-and-white candidate is ready for human acceptance.',
        actionable: true,
      }
    }
    return {
      key: 'needs-bw',
      label: 'Needs B&W',
      detail:
        production?.bwStatus === 'failed'
          ? 'The previous B&W job failed; request a new counterpart.'
          : 'Generate or adopt a faithful line-art counterpart.',
      actionable: true,
    }
  }

  if (production?.pairStatus === 'needs_review') {
    return {
      key: 'blocked',
      label: 'Pair blocked',
      detail:
        firstReason(production.pairSemanticReasons) ||
        'The accepted pair failed fidelity review.',
      actionable: true,
    }
  }

  return {
    key: 'finalize',
    label: 'Finalize pair',
    detail: 'Both masters are accepted and ready for final pair validation.',
    actionable: true,
  }
}

export function summarizeBookReadiness(
  book: ColoringBookStudioBook,
  productionStates: Record<string, ColoringBookProductionState>,
): ColoringBookReadinessSummary {
  const summary: ColoringBookReadinessSummary = {
    total: book.proposals.length,
    final: 0,
    finalize: 0,
    acceptColor: 0,
    acceptBw: 0,
    needsColor: 0,
    needsBw: 0,
    needsPrompt: 0,
    blocked: 0,
    actionable: 0,
    coverPending: book.coverIsSeparate,
    interiorReady: false,
    printReady: false,
  }

  for (const proposal of book.proposals) {
    const production =
      productionStates[`${book.slug}:${proposal.id}`] ?? null
    const readiness = proposalReadiness(book.slug, proposal, production)
    if (readiness.actionable) summary.actionable += 1
    if (readiness.key === 'final') summary.final += 1
    else if (readiness.key === 'finalize') summary.finalize += 1
    else if (readiness.key === 'accept-color') summary.acceptColor += 1
    else if (readiness.key === 'accept-bw') summary.acceptBw += 1
    else if (readiness.key === 'needs-color') summary.needsColor += 1
    else if (readiness.key === 'needs-bw') summary.needsBw += 1
    else if (readiness.key === 'needs-prompt') summary.needsPrompt += 1
    else summary.blocked += 1
  }

  summary.interiorReady = summary.total > 0 && summary.final === summary.total
  summary.printReady = summary.interiorReady && !summary.coverPending
  return summary
}

export function readinessTone(key: ColoringBookReadinessKey): string {
  if (key === 'final') return 'badge-success'
  if (key === 'finalize') return 'badge-primary'
  if (key === 'accept-color' || key === 'accept-bw') return 'badge-secondary'
  if (key === 'blocked') return 'badge-error'
  if (key === 'needs-prompt') return 'badge-warning'
  return 'badge-info'
}
