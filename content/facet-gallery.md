---
title: Facets
room: 'Facets'
subtitle: The shared creative building blocks, on display
description: Browse the canonical genres, species, archetypes, moods, styles, and settings that Characters, Bots, Dreams, Scenarios, and Art all draw from.
image: nav/heroes/facets.webp
icon: kind-icon:tag
tooltip: Explore the reusable Facet catalog by taxonomy.
sort: gallery
channelKey: play
tabKey: facets
dashboardKey: facets
dashboardTab: gallery
loadingMessage: Loading Facets...
refreshLabel: Refresh Facets
redirect: /facets
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/facet-gallery-mobile
backgroundTablet: /api/art/backdrop/facet-gallery-tablet
backgroundDesktop: /api/art/backdrop/facet-gallery-desktop
---

This legacy route redirects to the canonical Facets browser.
