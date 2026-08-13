---
title: 'Mural'
room: 'Wonder Lab'
subtitle: 'Color Studio'
description: Assign saved paint colors to shared mural sections, then override individual shapes before the real fence paint starts making opinions.
image: dashboard-tabs/wonder/mural.webp
tooltip: Color the mural plan, save paint IDs, and test the palette before anyone opens a can.
icon: kind-icon:paintbrush
sort: wonder
dottiTip: Can a coloring page become project management?
amiTip: Yes, but only if the paint swatches stop wandering off like tiny chromatic ferrets.
channelKey: admin
tabKey: mural
dashboardKey: wonder
dashboardTab: mural
cards: labCards
loadingMessage: Loading mural studio...
refreshLabel: Refresh Mural
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/mural-mobile
backgroundTablet: /api/art/backdrop/mural-tablet
backgroundDesktop: /api/art/backdrop/mural-desktop
---

:mural-manager
