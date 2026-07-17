import { readFile, writeFile } from 'node:fs/promises'

const schemaPath = 'prisma/schema.prisma'

function findMatching(source, start, openChar, closeChar) {
  let depth = 0
  let quote = null
  let escaped = false
  let lineComment = false
  let blockComment = false

  for (let index = start; index < source.length; index += 1) {
    const char = source[index]
    const next = source[index + 1]

    if (lineComment) {
      if (char === '\n') lineComment = false
      continue
    }

    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false
        index += 1
      }
      continue
    }

    if (quote) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === quote) quote = null
      continue
    }

    if (char === '/' && next === '/') {
      lineComment = true
      index += 1
      continue
    }

    if (char === '/' && next === '*') {
      blockComment = true
      index += 1
      continue
    }

    if (char === "'" || char === '"' || char === '`') {
      quote = char
      continue
    }

    if (char === openChar) depth += 1
    if (char === closeChar) {
      depth -= 1
      if (depth === 0) return index
    }
  }

  throw new Error(`Unbalanced ${openChar}${closeChar} block starting at ${start}`)
}

function consumeTrailingSeparator(source, end) {
  let cursor = end
  while (cursor < source.length && /[ \t]/.test(source[cursor])) cursor += 1
  if (source[cursor] === ',') cursor += 1
  while (cursor < source.length && /[ \t]/.test(source[cursor])) cursor += 1
  if (source[cursor] === '\r') cursor += 1
  if (source[cursor] === '\n') cursor += 1
  return cursor
}

function lineStart(source, index) {
  return source.lastIndexOf('\n', index) + 1
}

function removeTopLevelBlock(source, declaration) {
  const marker = `${declaration} {`
  const markerIndex = source.indexOf(marker)
  if (markerIndex === -1) throw new Error(`Missing schema block: ${declaration}`)

  const start = lineStart(source, markerIndex)
  const open = source.indexOf('{', markerIndex)
  const close = findMatching(source, open, '{', '}')
  return source.slice(0, start) + source.slice(consumeTrailingSeparator(source, close + 1))
}

function removeLines(source, predicate) {
  return source
    .split('\n')
    .filter((line) => !predicate(line))
    .join('\n')
}

function normalizeWhitespace(source) {
  return source.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n')
}

let schema = await readFile(schemaPath, 'utf8')
schema = removeTopLevelBlock(schema, 'model Code')
schema = removeTopLevelBlock(schema, 'model Composition')
schema = removeTopLevelBlock(schema, 'enum CompositionStatus')
schema = removeLines(schema, (line) => {
  const trimmed = line.trim()
  return (
    trimmed === '/// programmatic blueprints to call one or more art or text servers' ||
    /^\w+\s+Code(?:\[\]|\?)?(?:\s|$)/.test(trimmed) ||
    /^\w+\s+Composition(?:\[\]|\?)?(?:\s|$)/.test(trimmed) ||
    /^compositionId\s+/.test(trimmed) ||
    /^@@index\(\[compositionId\]/.test(trimmed) ||
    trimmed === 'COMPOSITION'
  )
})
schema = normalizeWhitespace(schema)

const forbidden = [
  'model Code',
  'model Composition',
  'enum CompositionStatus',
  'compositionId',
  'Composition[]',
  'Composition?',
  'Code[]',
  '\n  COMPOSITION\n',
]

for (const needle of forbidden) {
  if (schema.includes(needle)) {
    throw new Error(`Retired schema reference remains: ${JSON.stringify(needle)}`)
  }
}

await writeFile(schemaPath, schema)
console.log('Rebuilt the latest main schema without Code or Composition.')
