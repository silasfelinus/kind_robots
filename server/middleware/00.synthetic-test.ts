import {
  defineEventHandler,
  getHeader,
  getRequestURL,
  setResponseHeader,
} from 'h3'

const clean = (value: string | undefined, maxLength = 220) =>
  String(value || '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .trim()
    .slice(0, maxLength)

export default defineEventHandler((event) => {
  const source = clean(getHeader(event, 'x-kindrobots-test-source'))
  if (!source) return

  const runId = clean(getHeader(event, 'x-kindrobots-test-run-id'))
  const spec = clean(getHeader(event, 'x-kindrobots-test-spec'))
  const test = clean(getHeader(event, 'x-kindrobots-test-name'))

  setResponseHeader(event, 'x-kindrobots-synthetic-test', 'true')
  if (runId) setResponseHeader(event, 'x-kindrobots-test-run-id', runId)

  event.node.res.once('finish', () => {
    const statusCode = event.node.res.statusCode
    if (statusCode < 400) return

    console.info('[synthetic-test-request]', {
      source,
      runId: runId || 'unknown',
      spec: spec || 'unknown',
      test: test || 'unknown',
      method: event.method,
      path: getRequestURL(event).pathname,
      statusCode,
    })
  })
})
