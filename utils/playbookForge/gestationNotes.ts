import { isMap, isSeq, parseDocument } from 'yaml'

// Writes a note into Conductor's SILAS-NOTES.yaml, keeping its comments.
// Server-side (and tests) only, so the yaml parser stays out of the client.

const HEADER = `# Silas's notes on gestating playbook concepts, written from the Playbook Forge
# Gestation screen (kind_robots /admin/playbook-forge). One list per concept_id.
# Each note: {at, by, note, status: open | addressed | dismissed, addressed_in?}.
notes: {}
`

export function withGestationNote(
  content: string,
  conceptId: string,
  row: Record<string, string>,
): string {
  const doc = parseDocument(content.trim() ? content : HEADER)
  if (!isMap(doc.get('notes'))) doc.set('notes', doc.createNode({}))
  const notes = doc.get('notes')
  if (isMap(notes)) notes.flow = false
  const list = doc.getIn(['notes', conceptId])
  if (isSeq(list)) list.add(doc.createNode(row))
  else doc.setIn(['notes', conceptId], doc.createNode([row]))
  return doc.toString({ lineWidth: 100 })
}
