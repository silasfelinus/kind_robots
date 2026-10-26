// utils/scripts/verifyHomeShowcaseLabels.test.ts
// The logged-out home's "Freshly made" pane showed raw generation prompts as
// art titles, with near-identical renders side by side. Visitors get a short
// name instead, and renders that clean to the same name collapse to one.
import assert from 'node:assert/strict'
import {
  freshShowcaseCards,
  showcaseDisplayTitle,
  type ShowcaseCard,
} from '../homeShowcase'

const card = (patch: Partial<ShowcaseCard>): ShowcaseCard => ({
  kind: 'art',
  id: 1,
  title: 'Untitled render',
  subtitle: null,
  slug: null,
  badge: null,
  createdAt: '2026-10-20T00:00:00.000Z',
  theme: null,
  art: {
    imagePath: '/images/x.webp',
    cardPath: null,
    heroPath: null,
    iconPath: null,
    fileType: null,
  },
  href: null,
  conductorSlug: null,
  ...patch,
})

assert.equal(
  showcaseDisplayTitle(
    card({
      title:
        'Wide painted indoor scene. Western animated mature Grimm fantasy, a single story scene: a woman in a red cloak, lantern light, rain',
    }),
  ),
  'Woman in a red cloak',
)
assert.equal(
  showcaseDisplayTitle(
    card({
      title:
        'masterpiece, best quality, (koala ronin:1.2) <lora:zuzu:0.8> standing on a bell tower at dusk, embers',
    }),
  ),
  'Koala ronin standing on a bell…',
)
assert.equal(
  showcaseDisplayTitle(card({ title: 'Untitled render' })),
  'New artwork',
)
assert.equal(
  showcaseDisplayTitle(card({ kind: 'animation', title: '' })),
  'New animation',
)
assert.equal(
  showcaseDisplayTitle(card({ title: 'Western fantasy: , , ,' })),
  'New artwork',
)
assert.equal(
  showcaseDisplayTitle(card({ kind: 'character', title: 'Zuzu: Koala Ronin' })),
  'Zuzu: Koala Ronin',
)
assert.equal(
  showcaseDisplayTitle(card({ kind: 'dream', title: 'The Lantern Market' })),
  'The Lantern Market',
)

const preamble =
  'Wide painted indoor scene. Western animated mature Grimm fantasy, a single story scene: '
const fresh = freshShowcaseCards([
  card({
    id: 1,
    title: preamble + 'a woman in a red cloak, rain',
    createdAt: '2026-10-21T00:00:00.000Z',
  }),
  card({
    id: 2,
    title: preamble + 'A woman in a red cloak, lantern light',
    createdAt: '2026-10-22T00:00:00.000Z',
  }),
  card({ id: 3, title: 'Untitled render' }),
  card({ id: 4, title: 'Untitled render' }),
  card({
    id: 5,
    title: preamble + 'a wolf at the door',
    art: {
      imagePath: null,
      cardPath: null,
      heroPath: null,
      iconPath: null,
      fileType: null,
    },
  }),
  card({ kind: 'character', id: 6, title: 'Zuzu' }),
])
assert.deepEqual(
  fresh.map((item) => [item.kind, item.id, item.label]),
  [
    ['art', 2, 'Woman in a red cloak'],
    ['art', 3, 'New artwork'],
    ['art', 4, 'New artwork'],
    ['character', 6, 'Zuzu'],
  ],
  'newest render wins a duplicate label; generic labels and art-less cards behave',
)
assert.equal(
  freshShowcaseCards([card({ id: 1 }), card({ id: 2 })], 1).length,
  1,
)

console.log('home showcase visitor labels contract: ok')
