// /server/api/art/utils/printEligibility.ts
// Gallery-to-swag print-eligibility gate (digital-storefront/t-029).
// Per projects/digital-storefront/docs/gallery-to-swag-pipeline.md §4:
// an ArtImage is print-eligible only if it is not mature, the caller owns it
// (or it is public), and its generation backend is commercial-safe — base-model
// output (no checkpoint/LoRA override) or an explicitly commercialSafe Resource.

export type PrintEligibilityImage = {
  userId: number | null
  isMature: boolean | null
  isPublic: boolean | null
  isActive: boolean | null
  checkpointResourceId: number | null
}

export type PrintEligibilityResource = {
  commercialSafe: boolean
} | null

export type PrintEligibilityCaller = {
  userId: number | null
  isAdmin?: boolean
}

export type PrintEligibilityResult = {
  eligible: boolean
  reason: string
}

export function checkPrintEligibility(
  image: PrintEligibilityImage,
  checkpointResource: PrintEligibilityResource,
  caller: PrintEligibilityCaller,
): PrintEligibilityResult {
  if (image.isActive === false) {
    return { eligible: false, reason: 'Image is inactive.' }
  }

  if (image.isMature) {
    return {
      eligible: false,
      reason: 'Mature content is not eligible for print-on-demand.',
    }
  }

  const ownedByCaller =
    caller.userId != null &&
    image.userId != null &&
    caller.userId === image.userId

  if (!caller.isAdmin && !ownedByCaller && !image.isPublic) {
    return {
      eligible: false,
      reason: 'You can only print your own art, or public gallery pieces.',
    }
  }

  if (image.checkpointResourceId == null) {
    return {
      eligible: true,
      reason: 'Base-model generation — no checkpoint/LoRA override.',
    }
  }

  if (checkpointResource?.commercialSafe) {
    return {
      eligible: true,
      reason: 'Generated on a commercial-safe checkpoint/LoRA.',
    }
  }

  return {
    eligible: false,
    reason:
      'Generated with a checkpoint/LoRA not yet marked commercial-safe (default-deny until confirmed).',
  }
}
