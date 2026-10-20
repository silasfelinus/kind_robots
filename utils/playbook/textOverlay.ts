// The Playbook Manager's text overlay for games other than Ecotone (conductor
// weird-humboldt t-037). An edit replaces a beat's words only: its title, its
// story text and its choices' labels and outcome text. Ids, rolls, effects
// and links stay authored, so seeded play is unchanged. Each game applies the
// overlay inside its own lookup (v6Card, encounterById, scene(), questDef...),
// and the same sanitizer runs on the server and before an edit touches play.

import type { PlaybookNode } from './types'

export type TextChoiceEdit = {
  label?: string
  success?: string
  failure?: string
}

export type TextEdit = {
  title?: string
  body?: string[]
  choices?: Record<string, TextChoiceEdit>
}

/** Which parts of a beat its game lets the overlay replace. */
export type EditFields = {
  body: boolean
  outcomes: boolean
}

const TEXT_LIMIT = 4000
const SHORT_LIMIT = 200

function clean(value: unknown, limit: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, limit) : undefined
}

export function sanitizeTextEdit(raw: unknown): TextEdit {
  const source =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {}
  const edit: TextEdit = {}
  const title = clean(source.title, SHORT_LIMIT)
  if (title) edit.title = title
  if (Array.isArray(source.body)) {
    const body = source.body
      .flatMap((p) => clean(p, TEXT_LIMIT) ?? [])
      .slice(0, 12)
    if (body.length) edit.body = body
  }
  const choices =
    source.choices && typeof source.choices === 'object'
      ? (source.choices as Record<string, unknown>)
      : null
  if (choices) {
    const out: Record<string, TextChoiceEdit> = {}
    for (const [id, value] of Object.entries(choices).slice(0, 40)) {
      if (!/^[A-Za-z0-9._:@-]{1,96}$/.test(id) || !value) continue
      const c = value as Record<string, unknown>
      const choice: TextChoiceEdit = {}
      const label = clean(c.label, SHORT_LIMIT)
      const success = clean(c.success, TEXT_LIMIT)
      const failure = clean(c.failure, TEXT_LIMIT)
      if (label) choice.label = label
      if (success) choice.success = success
      if (failure) choice.failure = failure
      if (Object.keys(choice).length) out[id] = choice
    }
    if (Object.keys(out).length) edit.choices = out
  }
  return edit
}

/** Paragraphs back into one block of story text. */
export function joinBody(edit: TextEdit | undefined, fallback: string): string {
  return edit?.body?.length ? edit.body.join('\n\n') : fallback
}

/** Applies an overlay to a list of choices, leaving every non-text field alone. */
export function editChoices<C extends { id: string; label: string }>(
  choices: readonly C[],
  edit: TextEdit | undefined,
  outcomes: (choice: C, change: TextChoiceEdit) => Partial<C> = () => ({}),
): C[] {
  return choices.map((choice) => {
    const change = edit?.choices?.[choice.id]
    if (!change) return choice
    return {
      ...choice,
      label: change.label ?? choice.label,
      ...outcomes(choice, change),
    }
  })
}

/** How a text edit reads in the Playbook Manager: the node with its words replaced. */
export function applyTextEditToNode(
  node: PlaybookNode,
  edit: TextEdit | undefined,
): PlaybookNode {
  if (!edit) return node
  const fields = node.editFields ?? { body: true, outcomes: true }
  return {
    ...node,
    title: edit.title ?? node.title,
    body: fields.body && edit.body?.length ? edit.body : node.body,
    choices: node.choices.map((choice) => {
      const change = edit.choices?.[choice.id]
      if (!change) return choice
      return {
        ...choice,
        label:
          fields.labels === false
            ? choice.label
            : (change.label ?? choice.label),
        success:
          fields.outcomes && change.success
            ? { text: change.success }
            : choice.success,
        failure:
          fields.outcomes && change.failure && choice.failure
            ? { text: change.failure }
            : choice.failure,
      }
    }),
  }
}

/** A live-overlay registry for one game: sanitized edits by node key. */
export function liveTextStore() {
  let edits = new Map<string, TextEdit>()
  let version = 0
  return {
    set(next: Record<string, unknown>) {
      edits = new Map(
        Object.entries(next).map(([key, raw]) => [key, sanitizeTextEdit(raw)]),
      )
      version += 1
    },
    get(key: string): TextEdit | undefined {
      return edits.get(key)
    },
    get version() {
      return version
    },
  }
}
