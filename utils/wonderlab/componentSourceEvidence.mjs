const MAX_ITEMS = 14
const NATIVE_TAGS = new Set([
  'a',
  'article',
  'aside',
  'button',
  'canvas',
  'dialog',
  'div',
  'form',
  'header',
  'iframe',
  'img',
  'input',
  'label',
  'li',
  'main',
  'nav',
  'ol',
  'option',
  'p',
  'section',
  'select',
  'span',
  'textarea',
  'ul',
  'video',
])

function unique(values, limit = MAX_ITEMS) {
  return [...new Set(values.filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'en'))
    .slice(0, limit)
}

function block(source, name) {
  return (
    source.match(
      new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'),
    )?.[1] || ''
  )
}

function propertyNames(body) {
  return unique(
    [
      ...body.matchAll(
        /^\s*(?:readonly\s+)?['"]?([A-Za-z_$][\w$:-]*)['"]?\??\s*:/gm,
      ),
    ].map((match) => match[1] || ''),
  )
}

function genericBody(script, name) {
  return (
    script.match(
      new RegExp(`${name}\\s*<\\s*\\{([\\s\\S]*?)\\}\\s*>\\s*\\(`),
    )?.[1] || ''
  )
}

function props(script) {
  const inline = genericBody(script, 'defineProps')
  if (inline) return propertyNames(inline)
  const typeName = script.match(
    /defineProps\s*<\s*([A-Za-z_$][\w$]*)\s*>\s*\(/,
  )?.[1]
  if (!typeName) return []
  const escaped = typeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const typed =
    script.match(
      new RegExp(
        `(?:interface\\s+${escaped}|type\\s+${escaped}\\s*=)\\s*\\{([\\s\\S]*?)\\}`,
      ),
    )?.[1] || ''
  return propertyNames(typed)
}

function emits(script) {
  const body = genericBody(script, 'defineEmits')
  const values = propertyNames(body)
  for (const match of body.matchAll(/(?:event|e)\s*:\s*['"]([^'"]+)['"]/g)) {
    values.push(match[1] || '')
  }
  for (const match of script.matchAll(/defineEmits\s*\(\s*\[([\s\S]*?)\]\s*\)/g)) {
    for (const event of (match[1] || '').matchAll(/['"]([^'"]+)['"]/g)) {
      values.push(event[1] || '')
    }
  }
  return unique(values)
}

function tags(template) {
  const nativeElements = []
  const customComponents = []
  for (const match of template.matchAll(/<([A-Za-z][A-Za-z0-9-]*)\b/g)) {
    const raw = match[1] || ''
    const lower = raw.toLowerCase()
    if (NATIVE_TAGS.has(lower)) nativeElements.push(lower)
    else if (raw.includes('-') || /^[A-Z]/.test(raw)) customComponents.push(raw)
  }
  return {
    nativeElements: unique(nativeElements),
    customComponents: unique(customComponents),
  }
}

function labels(template) {
  return unique(
    template
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/\{\{[\s\S]*?\}\}/g, ' ')
      .replace(/<[^>]+>/g, '\n')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .split(/\n+/)
      .map((value) => value.replace(/\s+/g, ' ').trim())
      .filter(
        (value) =>
          value.length >= 2 && value.length <= 120 && /[A-Za-z]/.test(value),
      ),
    12,
  )
}

function functions(script) {
  return unique([
    ...[
      ...script.matchAll(
        /(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g,
      ),
    ].map((match) => match[1] || ''),
    ...[
      ...script.matchAll(
        /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g,
      ),
    ].map((match) => match[1] || ''),
  ])
}

function imports(script) {
  const values = []
  for (const match of script.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const source = match[1] || ''
    if (
      !source.startsWith('.') &&
      !source.startsWith('@/') &&
      !source.startsWith('~/')
    ) {
      continue
    }
    values.push(source.split('/').pop()?.replace(/\.[^.]+$/, '') || source)
  }
  return unique(values)
}

function fact(label, values) {
  return values.length ? `${label}: ${values.join(', ')}.` : null
}

export function extractWonderLabComponentSourceEvidence(input) {
  const source = String(input || '')
  const template = block(source, 'template')
  const script = block(source, 'script')
  const foundTags = tags(template)
  const evidence = {
    version: 1,
    lineCount: source.split(/\r?\n/).length,
    blocks: ['template', 'script', 'style'].filter((name) =>
      new RegExp(`<${name}(?:\\s[^>]*)?>`, 'i').test(source),
    ),
    props: props(script),
    emits: emits(script),
    customComponents: foundTags.customComponents,
    nativeElements: foundTags.nativeElements,
    staticText: labels(template),
    functionNames: functions(script),
    localImports: imports(script),
    facts: [],
  }
  evidence.facts = [
    fact('Declared props', evidence.props),
    fact('Declared emitted events', evidence.emits),
    fact('Template composes custom components', evidence.customComponents),
    fact('Template uses native elements', evidence.nativeElements),
    fact('Static interface text includes', evidence.staticText),
    fact('Source-defined functions include', evidence.functionNames),
    fact('Local source imports include', evidence.localImports),
  ].filter(Boolean)
  return evidence
}
