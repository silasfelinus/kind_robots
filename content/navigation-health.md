---
title: Navigation Health
room: Control Room
subtitle: Inspect the resolved channel graph
description: Review content-driven channels, tabs, route sharing, permissions, compatibility adapters, and browser-detected artwork failures.
icon: kind-icon:compass
channelKey: admin
tabKey: navigation-health
requiredRole: ADMIN
loadingMessage: Loading navigation health...
refreshLabel: Reload Navigation
dottiTip: The navigation has a navigation page now. I promise this is less silly than it sounds.
amiTip: Maps need legends. Systems need mirrors.
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/navigation-health-mobile
backgroundTablet: /api/art/backdrop/navigation-health-tablet
backgroundDesktop: /api/art/backdrop/navigation-health-desktop
---

:navigation-health
