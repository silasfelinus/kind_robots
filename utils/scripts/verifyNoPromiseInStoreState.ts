// /utils/scripts/verifyNoPromiseInStoreState.ts
//
// A Promise in Pinia state takes production down. Every page, every route.
//
// WHAT HAPPENED, 2026-08-07
// -------------------------
// kind-robots.vercel.app returned 500 on every content route:
//
//   DevalueError: Cannot stringify a Promise or thenable
//     path: '.pinia.pageStore.initializePromise'
//     at renderPayloadJsonScript (chunks/routes/renderer.mjs:192:52)
//
// In a Pinia SETUP STORE every returned ref becomes state. Nuxt serializes that
// state into the SSR payload with devalue, and devalue cannot stringify a
// Promise -- so the render throws before a single byte reaches the browser.
//
// WHY THIS IS A CONTRACT AND NOT A CODE REVIEW NOTE
// -------------------------------------------------
// It was fixed twice by hand and came back both times, because devalue reports
// only the FIRST unserializable value it meets:
//
//   fix pageStore   -> error moves to .pinia.chatStore.initializePromise
//   fix chatStore   -> error moves to .pinia.navStore.initializePromise
//
// Each fix looked like a success and shipped a still-broken site. An exhaustive
// sweep then found 37 returned Promise refs across 20 stores -- every one a
// latent 500 waiting for the render that happens to populate it. This is not a
// bug that can be chased; it has to be made unrepresentable.
//
// The rule is simple and total: a store may hold a Promise ref, but must not
// RETURN one. Keeping it private preserves every re-entrancy guard in the repo
// (initialize() still returns the promise VALUE to its caller) while keeping it
// out of the serialized payload. serverStore already did this correctly, which
// is how the intended pattern was known.
//
// If a consumer genuinely needs to know a request is in flight, export a
// boolean computed -- see chatStore's isFetchingHumanChats, added for the one
// component that was reading a promise for its truthiness.
//
//   npx tsx utils/scripts/verifyNoPromiseInStoreState.ts

import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const STORES = resolve(root, 'stores')

type Offence = { file: string; name: string }

/**
 * Refs whose declared type mentions Promise.
 *
 * Type-based rather than name-based on purpose: `actionLock`, `createLocks`
 * and `mutationLocks` hold Promises without saying "promise" anywhere, and a
 * name-shaped rule would miss exactly the ones nobody thought to name clearly.
 */
export function promiseRefNames(source: string): string[] {
  const names: string[] = []
  const declaration = /const\s+(\w+)\s*=\s*ref</g

  for (
    let match = declaration.exec(source);
    match;
    match = declaration.exec(source)
  ) {
    const name = match?.[1]
    if (!name) continue
    /*
     * Read the BALANCED <...> rather than regexing to the next `Promise`.
     *
     * The first version used `ref<[^=]*?Promise\b`, which happily spanned
     * newlines into a LATER declaration and reported `lastError` (a plain
     * string ref) as a Promise -- 34 false positives on an already-fixed tree.
     * Generic arguments nest and wrap across lines here
     * (`ref<Record<number, Promise<Server | null>>>`), so the only honest way
     * to read the type is to match the brackets.
     */
    let depth = 0
    let end = match.index + match[0].length - 1
    for (; end < source.length; end += 1) {
      const char = source[end]
      if (char === '<') depth += 1
      else if (char === '>') {
        depth -= 1
        if (depth === 0) break
      }
    }
    const type = source.slice(match.index, end + 1)
    if (/\bPromise\b/.test(type)) names.push(name)
  }
  return names
}

/**
 * Is `name` listed in a returned object literal — i.e. does it become state?
 *
 * A bare `  name,` line. Shorthand is how every store in this repo exposes its
 * refs, so this is the shape that matters; an explicit `name: name` would slip
 * past, and is worth revisiting if that style ever appears.
 */
export function isReturnedShorthand(source: string, name: string): boolean {
  return new RegExp(`^[ \\t]+${name},[ \\t]*$`, 'm').test(source)
}

export function findOffences(
  files: { file: string; source: string }[],
): Offence[] {
  const offences: Offence[] = []
  for (const { file, source } of files) {
    for (const name of promiseRefNames(source)) {
      if (isReturnedShorthand(source, name)) offences.push({ file, name })
    }
  }
  return offences.sort(
    (a, b) => a.file.localeCompare(b.file) || a.name.localeCompare(b.name),
  )
}

/* -------------------------------------------------------------------------- */

function selfTest(): void {
  const fail = (message: string): never => {
    throw new Error(message)
  }

  const returned = `
    const initializePromise = ref<Promise<void> | null>(null)
    return {
      things,
      initializePromise,
    }
  `
  const kept = `
    const initializePromise = ref<Promise<void> | null>(null)
    return {
      things,
    }
  `
  if (!findOffences([{ file: 'a.ts', source: returned }]).length) {
    fail('a returned Promise ref must be reported')
  }
  if (findOffences([{ file: 'a.ts', source: kept }]).length) {
    fail(
      'a PRIVATE Promise ref must not be reported — that is the fix, not the bug',
    )
  }

  // Type-shaped, not name-shaped: these are the ones a name rule would miss.
  const unnamed = `
    const actionLock = ref<Promise<any> | null>(null)
    const mutationLocks = ref<Partial<Record<string, Promise<void>>>>({})
    return {
      actionLock,
      mutationLocks,
    }
  `
  if (findOffences([{ file: 'b.ts', source: unnamed }]).length !== 2) {
    fail('Promise-typed refs must be caught regardless of their name')
  }

  // A plain ref is not an offence, however it is named.
  const innocent = `
    const promiseCount = ref<number>(0)
    return { promiseCount }
  `
  if (findOffences([{ file: 'c.ts', source: innocent }]).length) {
    fail(
      'a non-Promise ref must not be reported just for being called promise-ish',
    )
  }

  console.log('✅ verifyNoPromiseInStoreState self-test passed.')
}

/* -------------------------------------------------------------------------- */

selfTest()

const files = readdirSync(STORES)
  .filter((entry) => entry.endsWith('.ts') && !entry.endsWith('.test.ts'))
  .map((entry) => ({
    file: `stores/${entry}`,
    source: readFileSync(resolve(STORES, entry), 'utf8'),
  }))

const offences = findOffences(files)

if (offences.length) {
  console.error(
    `\nFAIL - ${offences.length} Promise ref(s) are returned from a Pinia store, and` +
      ` will be serialized into the SSR payload:\n`,
  )
  for (const { file, name } of offences) {
    console.error(`  ${file} -> ${name}`)
  }
  console.error(
    `\nEach one is a 500 on every page the moment it is populated during a render:\n` +
      `  DevalueError: Cannot stringify a Promise or thenable\n\n` +
      `Keep the ref PRIVATE -- drop it from the returned object. Re-entrancy still\n` +
      `works, because initialize() returns the promise VALUE to its caller. If a\n` +
      `consumer needs "is this in flight?", export a boolean computed instead\n` +
      `(see chatStore's isFetchingHumanChats).`,
  )
  process.exitCode = 1
} else {
  console.log(
    `\nNo Promise reaches Pinia state: checked ${files.length} stores.` +
      ` SSR payload serialization is safe.`,
  )
}
