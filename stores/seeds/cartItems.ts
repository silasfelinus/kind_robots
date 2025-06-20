// /stores/seeds/cartItems.ts

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
    label: '$1 Donation to Against Malaria',
    type: 'donation',
    price: 1.0,
    image: '/img/products/donation.png',
    description: 'Buy a treated net and save lives. 100% goes to AMF.',
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
