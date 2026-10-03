// Shared types for Kind Robots Adventures (kr-adventures/t-004): pre-written,
// fully illustrated branching gamebooks shipped as one static JSON bundle per
// book. Contract defined in projects/kr-adventures/DESIGN-BRIEF.md (conductor repo).

export type AdventureEndingKind = 'triumph' | 'bittersweet' | 'funny' | 'tragic' | 'secret'

export type AdventureChoice = {
  label: string
  to: string
  requires?: string[]
  sets?: string[]
}

export type AdventureNode = {
  id: string
  text: string
  art: { file: string; alt: string; prompt: string; model?: string }
  choices?: AdventureChoice[]
  ending?: { kind: AdventureEndingKind; title: string }
}

export type Adventure = {
  version: 1
  slug: string
  title: string
  scenarioSlug: string
  hero: { characterSlug: string; name: string; blurb: string }
  styleBible: string
  start: string
  nodes: Record<string, AdventureNode>
}

export type AdventureIssue = {
  code: string
  nodeId?: string
  message: string
}

export type AdventureValidation = {
  ok: boolean
  errors: AdventureIssue[]
  warnings: AdventureIssue[]
  stats: { nodes: number; endings: number; reachable: number }
}
