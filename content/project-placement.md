---
title: Project Placement
room: Control Room
subtitle: Apply the canonical Project navigation map
description: Load existing Projects, backfill channel and tab placement, optionally repair live URLs, and review the migration report.
image: dashboard-tabs/conductor/conductor.webp
icon: kind-icon:map
tooltip: Apply the canonical projectPlacements map to existing Project rows.
channelKey: admin
tabKey: project-placement
dashboardKey: conductor
dashboardTab: conductor
requiredRole: ADMIN
loadingMessage: Loading project placement controls...
refreshLabel: Reload Projects
dottiTip: I made the placement migration visible so it cannot hide behind a store method forever.
amiTip: Excellent. Dangerous buttons should at least have labels.
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/project-placement-mobile
backgroundTablet: /api/art/backdrop/project-placement-tablet
backgroundDesktop: /api/art/backdrop/project-placement-desktop
---

:project-placement-manager
