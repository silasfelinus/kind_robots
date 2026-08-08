// /stores/seeds/cartItems.ts
//
// The generic, per-type catalog for the general multi-item giftshop cart.
// server/api/stripe/checkout.post.ts trusts this array as its server-side
// price source (looked up by id) -- it answers "what does a sticker
// generically cost," not "what does this specific printed sticker of
// ArtImage #42 cost."
//
// This intentionally coexists with real `Product` rows (digital-storefront/
// t-003, item 4): product-checkout.post.ts and pod-checkout.post.ts price
// per-(printType, artImageId) *instances* against the Product table, upserting
// a row per specific print rather than per generic type. The two aren't
// duplicate catalogs of the same thing -- they operate at different
// granularities and the webhook bridges them: server/api/stripe/webhook.post.ts's
// GIFTSHOP_TYPE_TO_PRODUCT_TYPE map + handleGiftshopCartPurchase takes whichever
// cartItems.ts entry was purchased and lazily upserts a matching Product row
// (slug: `giftshop-${catalogEntry.id}`) at fulfillment time, so every general-cart
// purchase still ends up with a real Product audit row -- just created on
// demand instead of pre-seeded. `donation` and `tokens` have no Product-table
// equivalent at all (donation is recorded via the same lazy webhook upsert;
// tokens calls applyMana() directly, no Entitlement/PrintJob involved).
// Retiring this file in favor of pre-seeded Product rows would need either two
// different key shapes in one table (generic-type rows and per-instance rows)
// or rewriting checkout.post.ts's cart-price-trust model entirely -- a real
// design change, not something to do incidentally alongside a catalog task.

export interface CartItem {
  id: string
  label: string
  type: 'print' | 'shirt' | 'sticker' | 'mug' | 'donation' | 'tokens' | 'book'
  price: number
  image: string
  description?: string
  needsArt: boolean
}

export const cartItems: CartItem[] = [
  {
    id: 'print',
    label: 'Art Print',
    type: 'print',
    price: 12.99,
    image: '/img/products/print.png',
    description: 'High-quality matte paper print for your wall.',
    needsArt: true,
  },
  {
    id: 'shirt',
    label: 'T-Shirt',
    type: 'shirt',
    price: 24.99,
    image: '/img/products/shirt.png',
    description: 'Comfy cotton tee with your art printed front and center.',
    needsArt: true,
  },
  {
    id: 'sticker',
    label: 'Sticker',
    type: 'sticker',
    price: 4.99,
    image: '/img/products/sticker.png',
    description: 'Durable vinyl sticker with vibrant color.',
    needsArt: true,
  },
  {
    id: 'mug',
    label: 'Mug',
    type: 'mug',
    price: 16.49,
    image: '/img/products/mug.png',
    description: '11oz ceramic mug, microwave & dishwasher safe.',
    needsArt: true,
  },
  {
    id: 'donation',
    label: '$1 AMF-Designated Donation',
    type: 'donation',
    price: 1.0,
    image: '/img/products/donation.png',
    description:
      'Collected by Kind Robots through Stripe and recorded separately for Against Malaria Foundation remittance.',
    needsArt: false,
  },
  {
    id: 'tokens',
    label: '100 Boost Tokens',
    type: 'tokens',
    price: 5.0,
    image: '/img/products/tokens.png',
    description: 'Get 100 boost tokens for art, bots, or bonus features.',
    needsArt: false,
  },
  {
    id: 'book',
    label: 'Mermaids of Venice (Signed)',
    type: 'book',
    price: 20.0,
    image: '/img/products/book.png',
    description: 'Silas Knight’s stunning debut. Signed. Ships globally.',
    needsArt: false,
  },
]
