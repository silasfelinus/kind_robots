/*
 * A URL pathname is percent-encoded, a filename is not. The missing-image
 * reporter took `new URL(src).pathname` as the file to write, so a legacy
 * gallery file named "...space dance party..." was requested as
 * "...space%20dance%20party...": the relay would have written a second file
 * the page never asks for, and its longer name pushed the relay's scratch copy
 * past the 255-character NTFS limit (ArtJob 31518). Decode per segment, so an
 * encoded "/" can never add a directory, and keep a segment verbatim when it
 * is not valid percent-encoding ("100%.png").
 */
function decodeSegment(segment: string): string {
  try {
    const decoded = decodeURIComponent(segment)
    return /[/\\]/.test(decoded) || decoded === '.' || decoded === '..'
      ? segment
      : decoded
  } catch {
    return segment
  }
}

/** Site-rooted, decoded path of an image URL, with any /_ipx/ wrapper removed. */
export function normalizePublicPath(pathname: string): string {
  const clean = pathname.split('?')[0]!.split('#')[0] || ''
  const ipxMatch = clean.match(/^\/_ipx\/[^/]+\/(.+)$/)
  const path = ipxMatch?.[1] ? `/${ipxMatch[1]}` : clean
  const rooted = path.startsWith('/') ? path : `/${path}`
  return rooted.split('/').map(decodeSegment).join('/')
}
