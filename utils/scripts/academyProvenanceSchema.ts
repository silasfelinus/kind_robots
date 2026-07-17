// utils/scripts/academyProvenanceSchema.ts
//
// Shared provenance schema (conductor's PUBLIC-DOMAIN-POLICY.md §3) for the
// Academy's two image-provenance manifests: the starter-image library
// (starters.manifest.json) and the curriculum example-works manifest
// (examples.manifest.json). Extracted per ai-art-academy/t-028 so both
// contract tests validate the same field-list/license-enum instead of
// duplicating it by hand a second time.

export const REQUIRED_PROVENANCE_STRING_FIELDS = [
  'workTitle',
  'artist',
  'year',
  'collection',
  'accessionId',
  'sourceUrl',
  'license',
  'retrievedDate',
] as const

export const VALID_LICENSES = ['CC0', 'PD-Mark', 'Open-Access-Terms'] as const
export type ValidLicense = (typeof VALID_LICENSES)[number]

export function isValidLicense(value: unknown): value is ValidLicense {
  return (
    typeof value === 'string' &&
    (VALID_LICENSES as readonly string[]).includes(value)
  )
}

/**
 * Validates the shared provenance fields on a single manifest entry and
 * appends any violations to `errors`. Callers add their own manifest-specific
 * required fields (e.g. `file`, `movement`) before/after calling this.
 */
export function validateProvenanceRecord(
  record: Record<string, unknown>,
  label: string,
  errors: string[],
): void {
  for (const field of REQUIRED_PROVENANCE_STRING_FIELDS) {
    const value = record[field]
    if (typeof value !== 'string' || value.trim() === '') {
      errors.push(`${label}: missing or empty required field "${field}"`)
    }
  }

  // artistDied is a required field per PUBLIC-DOMAIN-POLICY.md §3, but is
  // numeric (a year), not a string.
  if (
    typeof record.artistDied !== 'number' ||
    !Number.isFinite(record.artistDied)
  ) {
    errors.push(`${label}: missing or non-numeric required field "artistDied"`)
  }

  const license = record.license
  if (typeof license === 'string' && !isValidLicense(license)) {
    errors.push(
      `${label}: invalid license "${license}" — must be one of ${VALID_LICENSES.join(', ')}`,
    )
  }

  if (license === 'Open-Access-Terms') {
    const termsUrl = record.licenseTermsUrl
    if (typeof termsUrl !== 'string' || termsUrl.trim() === '') {
      errors.push(
        `${label}: license "Open-Access-Terms" requires a non-empty "licenseTermsUrl"`,
      )
    }
  }
}
