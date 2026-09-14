// /utils/scripts/verifyErrorHandlerStatusPropagation.test.ts
//
// Regression test for verifyErrorHandlerStatusPropagation.ts (kind-robots/
// t-098, kaizen from t-096). Exercises `findOffences()` against synthetic
// fixtures covering: a catch block calling `errorHandler(` with none of the
// three propagation shapes anywhere in the handler (must fail), each of the
// three shapes individually (must each satisfy the guard), a catch block
// that never calls `errorHandler()` at all (must not be flagged), a helper
// module with no `defineEventHandler`/`defineCachedEventHandler` of its own
// (must not be flagged -- see t-096's own exemption of server/api/auth/
// index.ts and friends, and t-098's discovery of two more of the same
// shape), and `defineCachedEventHandler` (must be scanned identically to
// `defineEventHandler`).
import assert from 'node:assert/strict'

import { findOffences } from './verifyErrorHandlerStatusPropagation.js'

function route(body: string, wrap = 'defineEventHandler'): string {
  return `
export default ${wrap}(async (event) => {
  try {
    return await doThing()
  } catch (error) {
${body}
  }
})
`
}

const BUGGY = route(`
    const handled = errorHandler(error)
    return { success: false, message: handled.message }
`)

const FIXED_STATUS_CODE = route(`
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message }
`)

const FIXED_SET_RESPONSE_STATUS = route(`
    const handled = errorHandler(error)
    setResponseStatus(event, handled.statusCode || 500)
    return { success: false, message: handled.message }
`)

const FIXED_CREATE_ERROR_RETHROW = route(`
    throw createError({ statusCode: 500, message: errorHandler(error).message })
`)

const CLEAN_NO_ERROR_HANDLER = route(`
    throw createError({ statusCode: 500 })
`)

const HELPER_MODULE = `
export async function updateThing() {
  try {
    return await doThing()
  } catch (error) {
    throw errorHandler({ success: false, message: 'nope', statusCode: 500 })
  }
}
`

const CACHED_BUGGY = route(
  `
    const handled = errorHandler(error)
    return { success: false, message: handled.message }
`,
  'defineCachedEventHandler',
)

function run(): void {
  const buggyOffences = findOffences([{ file: 'buggy.ts', source: BUGGY }])
  assert.equal(
    buggyOffences.length,
    1,
    `expected the unpropagated fixture to fail, got: ${JSON.stringify(buggyOffences)}`,
  )
  assert.equal(buggyOffences[0]!.file, 'buggy.ts')

  assert.deepEqual(
    findOffences([{ file: 'fixed1.ts', source: FIXED_STATUS_CODE }]),
    [],
    'event.node.res.statusCode anywhere in the handler must satisfy the guard',
  )
  assert.deepEqual(
    findOffences([
      { file: 'fixed2.ts', source: FIXED_SET_RESPONSE_STATUS },
    ]),
    [],
    'setResponseStatus(...) anywhere in the handler must satisfy the guard',
  )
  assert.deepEqual(
    findOffences([
      { file: 'fixed3.ts', source: FIXED_CREATE_ERROR_RETHROW },
    ]),
    [],
    'a createError(...)-based rethrow must satisfy the guard',
  )
  assert.deepEqual(
    findOffences([
      { file: 'clean.ts', source: CLEAN_NO_ERROR_HANDLER },
    ]),
    [],
    'a catch block that never calls errorHandler() must not be flagged',
  )
  assert.deepEqual(
    findOffences([{ file: 'helper.ts', source: HELPER_MODULE }]),
    [],
    'a helper module with no defineEventHandler/defineCachedEventHandler of its ' +
      'own must not be flagged -- it never handles an HTTP response itself',
  )

  const cachedOffences = findOffences([
    { file: 'cached.ts', source: CACHED_BUGGY },
  ])
  assert.equal(
    cachedOffences.length,
    1,
    'defineCachedEventHandler must be scanned the same as defineEventHandler',
  )

  console.log(
    'verifyErrorHandlerStatusPropagation self-test passed: an unpropagated ' +
      'errorHandler() call inside a catch block fails, each of the three known ' +
      'propagation shapes (event.node.res.statusCode, setResponseStatus, a ' +
      'createError rethrow) satisfies the guard, a catch block with no ' +
      'errorHandler() call is never flagged, a helper module with no ' +
      'defineEventHandler/defineCachedEventHandler of its own is never flagged, ' +
      'and defineCachedEventHandler is scanned the same as defineEventHandler.',
  )
}

run()
