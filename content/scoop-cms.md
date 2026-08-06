---
title: 'Humboldt Scoop CMS'
room: 'Scoop CMS'
subtitle: 'The back office behind the tidy yards.'
description: Admin console for the Humboldt Scoop customer, schedule, and route management.
image: nav/heroes/conductor.webp
icon: kind-icon:heart
tooltip: Manage the Humboldt Scoop service, admin only.
channelKey: admin
tabKey: scoop-cms
dashboardKey: conductor
dashboardTab: scoop-cms
requiredRole: ADMIN
cards: navCards
loadingMessage: Opening the back office...
refreshLabel: Refresh Scoop CMS
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/scoop-cms-mobile
backgroundTablet: /api/art/backdrop/scoop-cms-tablet
backgroundDesktop: /api/art/backdrop/scoop-cms-desktop
---

:scoop-cms-page
