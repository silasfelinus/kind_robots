// /server/api/store/podCatalog.ts
// Shared print-on-demand catalog for the two checkout paths that create
// PrintJob rows: pod-checkout.post.ts (single-item POD flow) and the
// webhook's handleGiftshopCartPurchase (general multi-item cart, t-033).
// Keys match both stores/seeds/cartItems.ts ids and pod-checkout.post.ts's
// printType param — not real Printful catalog ids (no vendor account/API key
// exists yet, digital-storefront/t-015, needs-human). Every printfulVariantId
// below is a PLACEHOLDER_* string until then; server/utils/podVendorClient.ts's
// isPlaceholderVariantId()/submitPodOrder() refuse to submit one to Printful,
// so replacing these with real catalog ids is what actually unblocks
// submission (digital-storefront/t-040) once an account exists.
export const POD_CATALOG: Record<
  string,
  { title: string; priceCents: number; printfulVariantId: string }
> = {
  print: {
    title: 'Art Print',
    priceCents: 1299,
    printfulVariantId: 'PLACEHOLDER_PRINT',
  },
  shirt: {
    title: 'T-Shirt',
    priceCents: 2499,
    printfulVariantId: 'PLACEHOLDER_SHIRT',
  },
  sticker: {
    title: 'Sticker',
    priceCents: 499,
    printfulVariantId: 'PLACEHOLDER_STICKER',
  },
  mug: {
    title: 'Mug',
    priceCents: 1649,
    printfulVariantId: 'PLACEHOLDER_MUG',
  },
}
