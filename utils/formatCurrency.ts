// /utils/formatCurrency.ts
//
// No shared cents-to-dollars formatter existed anywhere in this repo (every
// call site that formats money hand-rolls its own toFixed(2)) -- added here,
// not in a store or component, because it is stateless and used by both a
// store-owned page (kind-economy/t-009's creator earnings view) and any
// future money-adjacent surface. Integer cents in, a "$X.XX" string out --
// never floats, matching server/utils/revenueSplit.ts's integer-cents-only
// discipline.
export function formatUsdCents(cents: number): string {
  if (!Number.isFinite(cents)) return '$0.00'
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  const dollars = Math.floor(abs / 100)
  const remainder = String(abs % 100).padStart(2, '0')
  return `${sign}$${dollars.toLocaleString('en-US')}.${remainder}`
}
