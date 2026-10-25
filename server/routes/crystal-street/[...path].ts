import { defineEventHandler, setResponseHeader, setResponseStatus } from 'h3'

// Crystal Street art that hasn't been delivered yet (rounds 2 and 3 cover
// thousands of scene and outcome paths) would otherwise fall through to the
// app and come back as a full rendered page, about 320KB and a server render
// per card. Delivered files under public/crystal-street are served as static
// assets before any route runs, so only misses reach this handler. An empty
// 404 lets the <img> fall back to the drawn scene at once; the CDN copy lasts
// until the next deploy, which is when new art arrives.
export default defineEventHandler((event) => {
  setResponseStatus(event, 404)
  setResponseHeader(
    event,
    'Cache-Control',
    'public, max-age=300, s-maxage=86400',
  )
  return ''
})
