/**
 * Every Vue template in the repo must compile.
 *
 * `nuxi build` stops at the first template it cannot compile, and that takes
 * the whole production image with it. vue-tsc does not catch these, and the
 * autoformat commit that lands after a PR's checks start can introduce one:
 * Prettier with `semi: false` rewrites
 *
 *   @click="a = 1; b = 2"   as   @click="
 *                                   a = 1
 *                                   b = 2
 *                                 "
 *
 * and Vue only treats an inline handler as several statements when it finds
 * a semicolon. That broke every production build on 2026-11-19 PT
 * (pages/play/game-of-captains.vue). Use a named handler for more than one
 * statement.
 *
 * node utils/scripts/verifyVueTemplatesCompile.test.mjs [file.vue ...]
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc'

const root = fileURLToPath(new URL('../../', import.meta.url))
const files =
  process.argv.length > 2
    ? process.argv.slice(2)
    : execFileSync('git', ['ls-files', '*.vue'], {
        cwd: root,
        maxBuffer: 64 * 1024 * 1024,
      })
        .toString()
        .trim()
        .split('\n')

/** First line of each compiler error, without the code frame. */
const firstLines = (errors) =>
  errors.map((error) => String(error?.message ?? error).split('\n')[0])

const failures = []
for (const file of files) {
  const source = readFileSync(root + file, 'utf8')
  const { descriptor, errors } = parse(source, { filename: file })
  const problems = firstLines(errors)
  if (descriptor.template && !descriptor.template.lang) {
    // Binding metadata lets the compiler tell setup refs from globals, as the
    // build does. A script the SFC compiler rejects is vue-tsc's to report.
    let bindingMetadata
    const warn = console.warn
    console.warn = () => {}
    try {
      if (descriptor.script || descriptor.scriptSetup)
        bindingMetadata = compileScript(descriptor, { id: file }).bindings
    } catch {
      bindingMetadata = undefined
    } finally {
      console.warn = warn
    }
    const compiled = compileTemplate({
      source: descriptor.template.content,
      filename: file,
      id: file,
      compilerOptions: { bindingMetadata, prefixIdentifiers: true },
    })
    problems.push(...firstLines(compiled.errors))
  }
  if (problems.length) failures.push(file + ': ' + problems[0])
}

if (failures.length) {
  console.error(
    'Vue templates that do not compile (' +
      failures.length +
      '):\n  ' +
      failures.join('\n  '),
  )
  process.exit(1)
}
console.log(
  'Vue templates compile: ' + files.length + ' single-file components',
)
