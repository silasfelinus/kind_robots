---
contentType: channel
channelKey: story
label: Story
title: Story
room: The Story Hall
subtitle: Weave stories from characters, places, and rewards
description: Storybook plus everything a story is made of. Dreams, bots, characters, facets, rewards, and scenarios.
icon: kind-icon:story
route: /storybook
defaultTab: storybook
sort: 30
loadingMessage: Opening the story hall...
refreshLabel: Refresh Story
dottiTip: Story is where characters, places, and rewards come together into something that happens.
amiTip: Every bot here is one plot twist away from a starring role.
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
# The slug stays `play` (renamed to Story 2026-10-06) so its generated art keeps resolving.
backgroundMobile: /api/art/backdrop/play-mobile
backgroundTablet: /api/art/backdrop/play-tablet
backgroundDesktop: /api/art/backdrop/play-desktop
---

Gather the characters, places, and rewards, then let Storybook weave them into a story.
