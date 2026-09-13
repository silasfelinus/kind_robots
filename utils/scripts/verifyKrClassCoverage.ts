// /utils/scripts/verifyKrClassCoverage.ts
/*
 * kr-* class coverage verifier for conductor interface-vision/t-136.
 *
 * WHY THIS EXISTS
 * interface-vision/t-104 slice 255 (kind_robots#2691, ruler-hooked-card.vue)
 * referenced `kr-badge-accent-sm` in a template without ever defining it in
 * assets/css/tailwind.css. Three more slices (#2692 video-lora-picker.vue,
 * #2693 user-dashboard.vue, #2694 video-generator.vue) copied the same
 * undefined class name into three more files before anyone noticed -- none
 * of TypeScript, eslint, verifyLayoutContract.ts, or the Storybook/Narrative
 * contract suite catch an undefined Tailwind `@apply` target, since a
 * missing CSS class is not a syntax error to any of those tools. All four
 * call sites rendered as unstyled plain text instead of a DaisyUI badge for
 * two days before the gap was noticed and fixed (interface-vision/t-135,
 * kind_robots#2695).
 *
 * This script extracts every static `class="..."` token starting with
 * `kr-` from components/ and pages/ templates, and asserts each one has a
 * matching `.kr-*` selector -- either a shared primitive in
 * assets/css/tailwind.css, or a component-scoped rule in that same file's
 * own <style> block. The one deliberate exception is a class that exactly
 * echoes its own file's kebab-case name (a common root-element/query-hook
 * pattern styled entirely by adjacent Tailwind utilities, never meant to
 * resolve to a shared primitive) -- see isSelfNamingRootClass(). Unlike
 * verifyLayoutContract.ts's ratchet baseline (which tolerates pre-existing
 * debt), an undefined kr-* class reference is never intentional -- there is
 * no legacy case where shipping unstyled markup is correct -- so this fails
 * CI outright on any violation rather than ratcheting a count down over
 * time.
 *
 *   npm run test:kr-class-coverage
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, extname, basename } from 'node:path'

const ROOT = process.cwd()
const TAILWIND_CSS_PATH = join(ROOT, 'assets/css/tailwind.css')

const SKIP_DIRS = new Set([
  'node_modules',
  '.nuxt',
  '.git',
  'dist',
  '.output',
  'abandonware',
  'archives',
  'cypress',
  'sample',
])

function walk(dir: string, ext: string, out: string[] = []): string[] {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue

    const full = join(dir, entry)
    let isDir: boolean
    try {
      isDir = statSync(full).isDirectory()
    } catch {
      continue
    }

    if (isDir) walk(full, ext, out)
    else if (extname(entry) === ext) out.push(full)
  }
  return out
}

const read = (path: string): string => readFileSync(path, 'utf8')
const rel = (path: string): string => relative(ROOT, path).replace(/\\/g, '/')

/*
 * Strip <script> and <style> so we only ever match real template markup --
 * same convention as verifyLayoutContract.ts's templateOf(), so a kr-*
 * class name mentioned only in a comment or a scoped <style> selector never
 * counts as "used".
 */
function templateOf(source: string): string {
  return source
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
}

/*
 * Static `class="..."` tokens only -- same idiom as verifyLayoutContract.ts's
 * staticClassLists(): iterate opening tags, then match `\sclass=` (never
 * `:class=`/`v-bind:class=`, since neither is ever preceded by whitespace
 * directly before the literal word "class") within each tag. A dynamically
 * bound class list can't be statically verified, so it is out of scope here,
 * same as every kr_*_codemod.py's shared CLASS_ATTR guard
 * (utils/scripts/codemods/_class_attr.py).
 */
function staticKrClassTokens(template: string): string[] {
  const tokens: string[] = []
  for (const tag of template.matchAll(/<[A-Za-z][\w-]*\b[^>]*>/g)) {
    const openingTag = tag[0]
    for (const attribute of openingTag.matchAll(
      /\sclass\s*=\s*(["'])([\s\S]*?)\1/g,
    )) {
      for (const token of (attribute[2] ?? '').split(/\s+/)) {
        if (/^kr-[\w-]+$/.test(token)) tokens.push(token)
      }
    }
  }
  return tokens
}

/*
 * Every `.kr-*` selector name defined anywhere in a block of CSS, comments
 * stripped first -- a kr-* class name mentioned only inside a /* comment * /
 * (e.g. proposing a sibling primitive that doesn't exist yet, a real pattern
 * already found in tailwind.css's own kaizen notes) must not count as a real
 * definition.
 */
function definedKrSelectors(css: string): Set<string> {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, ' ')
  const defined = new Set<string>()
  for (const match of withoutComments.matchAll(/\.(kr-[\w-]+)/g)) {
    if (match[1]) defined.add(match[1])
  }
  return defined
}

/*
 * Every `<style>` block in a Vue SFC (scoped or not), concatenated. A
 * component-scoped kr-* class (e.g. kr-card-flip.vue's own `.kr-flip-panel`)
 * is a real CSS rule, just not a shared assets/css/tailwind.css primitive --
 * it must count as defined, or every component that styles its own
 * kr-prefixed root/child elements locally would false-positive here.
 */
function styleBlocksOf(source: string): string {
  return [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
    .map((match) => match[1])
    .join('\n')
}

/*
 * A component's root element commonly carries a class matching the
 * component's own kebab-case filename (e.g. kr-search-field.vue's root
 * <div class="kr-search-field ...">, kr-narrator-stage.vue's
 * <div class="kr-narrator-stage ...">) purely as a semantic/query-selector
 * hook, styled entirely by the Tailwind utility classes alongside it --
 * never intended to resolve to a shared design-system primitive the way
 * kr-badge-, kr-icon-, or kr-panel do. Excluding a class that exactly
 * echoes its own file's name keeps that legitimate pattern from drowning out
 * real findings (an assumed sibling primitive that was never defined, t-135's
 * actual bug) in false positives.
 */
function isSelfNamingRootClass(token: string, file: string): boolean {
  return token === basename(file, '.vue')
}

function main(): void {
  const templateFiles = [
    ...walk(join(ROOT, 'components'), '.vue'),
    ...walk(join(ROOT, 'pages'), '.vue'),
  ]

  const globalDefined = definedKrSelectors(read(TAILWIND_CSS_PATH))

  /* file -> sorted unique undefined kr-* tokens used in it */
  const violations = new Map<string, string[]>()

  for (const file of templateFiles) {
    const source = read(file)
    const locallyDefined = definedKrSelectors(styleBlocksOf(source))
    const used = new Set(staticKrClassTokens(templateOf(source)))
    const missing = [...used]
      .filter((token) => !globalDefined.has(token))
      .filter((token) => !locallyDefined.has(token))
      .filter((token) => !isSelfNamingRootClass(token, file))
      .sort()
    if (missing.length > 0) violations.set(rel(file), missing)
  }

  if (violations.size === 0) {
    console.log(
      `kr-class-coverage: OK -- every kr-* class referenced in ${templateFiles.length} components/+pages/ template(s) has a matching .kr-* rule in assets/css/tailwind.css.`,
    )
    return
  }

  console.error(
    'kr-class-coverage: FAILED -- undefined kr-* class(es) referenced in templates:\n',
  )
  for (const [file, tokens] of [...violations.entries()].sort()) {
    console.error(`  ${file}`)
    for (const token of tokens) console.error(`    - ${token}`)
  }
  console.error(
    `\n${violations.size} file(s) reference a kr-* class with no matching selector in assets/css/tailwind.css. Either define the missing primitive(s) there, or fix the typo/stale reference in the template(s) above.`,
  )
  process.exitCode = 1
}

main()
