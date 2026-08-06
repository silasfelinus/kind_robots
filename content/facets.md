---
title: Facets
room: 'Facet Library'
subtitle: The reusable flavor of the ecosystem
description: Browse and refine the genres, animals, colors, themes, moods, styles, and settings that Dreams, Scenarios, and Art share.
image: nav/heroes/facets.webp
icon: kind-icon:tag
tooltip: Manage the reusable creative building blocks shared across the site.
sort: utility
channelKey: play
tabKey: facets
dashboardKey: facets
dashboardTab: gallery
loadingMessage: Loading facets...
refreshLabel: Refresh Facets
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/facets-mobile
backgroundTablet: /api/art/backdrop/facets-tablet
backgroundDesktop: /api/art/backdrop/facets-desktop
---

:facet-manager
