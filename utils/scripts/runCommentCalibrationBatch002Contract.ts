// /utils/scripts/runCommentCalibrationBatch002Contract.ts
//
// Tiny CI wrapper so GitHub Actions surfaces the actual batch-002 assertion as
// a check annotation instead of only reporting "Process completed with exit code 1".
function workflowEscape(value: string): string {
  return value
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A')
}

try {
  await import('./verifyCommentCalibrationBatch002')
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`::error title=Comment calibration batch 002::${workflowEscape(message)}`)
  throw error
}
