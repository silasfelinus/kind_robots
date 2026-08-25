# Mandarin Tutor art direction v2

Mandarin Tutor uses one canonical vocabulary catalog and a versioned illustration recipe. Art recipe versions are not vocabulary editions.

## Goal

The deck should feel intentionally art-directed rather than like a collection of unrelated generated images. v2 gives every image-eligible card a coherent modern Chinese educational illustration language while keeping pedagogy ahead of decoration.

The target is **modern Chinese picture-book gouache**: hand-painted educational illustration with restrained watercolor and ink-wash influence, matte pigments, subtle paper texture, clean silhouettes, limited deliberate detail, harmonious color, and generous negative space.

## Cultural grounding

Chinese identity should come from believable lived detail, not tourist shorthand. Use contemporary domestic life, foodways, ceramics, bamboo, wood, textiles, markets, neighborhood streets, transit, furnishings, games, landscapes, tableware, kitchens, classrooms, and workplaces when they naturally support the concept.

Do not decorate unrelated cards with pagodas, lantern walls, dragons, Great Wall imagery, calligraphy, red-and-gold festival styling, or historical costume. Those elements belong only when they are actually the concept being taught.

People should appear as ordinary contemporary people in believable situations, with natural variety in age, body, presentation, and role. Avoid costume-like ethnic shorthand.

## Anti-synthetic-image rules

Prefer deliberate simplification and visible illustration decisions over maximal rendering. Avoid the visual habits that make generated art feel interchangeable:

- photorealism or glossy CGI surfaces
- plastic-looking skin
- indiscriminate micro-detail
- perfect mechanical symmetry
- excessive cinematic rim lighting
- lens flare, bokeh, and neon glow used as filler
- crowded object fields and decorative nonsense
- elaborate hand poses when a simpler pose teaches the word better
- uncanny facial close-ups
- impossible object relationships or anatomy

A successful card should look as though an illustrator chose what **not** to paint.

## Composition

Every illustration should have one strong memory anchor or one compact scene. The learner should understand the intended concept before studying background detail.

Prefer:

- one focal subject
- one clear action
- natural asymmetry
- modest perspective
- restrained lighting
- readable silhouette
- simple, believable props

Avoid crowds, spectacle, dramatic camera tricks, and busy scenery unless the vocabulary genuinely requires them.

## Category direction

### Food and drink

Use Chinese everyday food culture naturally: ceramic bowls and cups, chopsticks, bamboo steamers, shared dishes, market ingredients, ordinary kitchens, and table settings. The food or action remains the focal subject.

### Family and home

Use contemporary domestic life such as apartments, homes, courtyards, or neighborhoods. Relationships should read through interaction rather than labels.

### Everyday actions

Show one person clearly performing the action. Favor simple, believable poses and hands over cinematic staging.

### Travel and places

Use contemporary Chinese urban, neighborhood, transit, street, or room contexts when useful. Never depend on readable signage.

### Greetings and social phrases

Use concise human interactions with natural gesture and distance. Avoid speech bubbles and close-up generated faces.

### Time and calendar

Use lighting and ordinary routines such as breakfast, commuting, school, work, dinner, or evening neighborhood activity rather than written calendars or numerals.

### Numbers

Communicate quantity with groups of countable objects, preferably familiar household, food, school, market, or game objects when appropriate. Do not render digits.

### Colors

Make the target color unmistakable through one familiar object or simple scene. Chinese ceramics, textiles, food, plants, or household materials can provide subtle cultural grounding.

### Animals

Keep species recognition dominant. Landscape, garden, farm, or neighborhood cues should remain secondary.

### Casino Mandarin

Use a real working table-game visual language: believable felt, chips, playing cards, tiles, dealer gestures, payouts, cash handling, and player interactions. Chinese or Chinese-speaking casino context may be used where natural, but avoid fantasy luxury and invented table text, chip denominations, or card-face numerals.

### Grammar and function words

Do not force decorative metaphors onto particles, classifiers, components, or abstract sentence machinery when an image would misteach. These remain `glyph-only` until a pedagogically useful visual treatment is explicitly designed.

## Text policy

Generated card art contains no Hanzi, pinyin, English, Latin letters, numerals, pseudo-writing, labels, captions, signage, speech bubbles, logos, or watermarks. The tutor UI owns language rendering.

## Versioning and regeneration

v2 is a full art-direction reset.

- recipe version: `v2`
- art direction id: `modern-chinese-picturebook-v2`
- canonical media root: `/images/mandarin-tutor/cards/v2/`
- request identity includes `v2`
- every `illustrate` card is eligible for a new v2 render regardless of v1 coverage
- v1 files remain historical assets and never suppress a v2 request
- `glyph-only` cards are intentionally excluded from the render queue

A future art-direction change should become v3 rather than mutating v2 in place once v2 is in broad production.

## Quality rubric

Before accepting an image, ask:

1. Does the picture teach the intended meaning quickly?
2. Does it visibly belong to the Mandarin Tutor house style?
3. Does its Chinese cultural grounding feel lived-in rather than decorative or stereotyped?
4. Does it avoid common synthetic-image tells?
5. Would it sit comfortably beside hundreds of other cards without visual whiplash?

Failure on any of these is a reason to regenerate, not to create another vocabulary edition.
