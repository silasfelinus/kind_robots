---
title: 'Servers'
subtitle: 'Manage generation backends and model endpoints'
description: 'Add, edit, test, and select art, text, and workflow servers.'
image: splash/servers.png
icon: kind-icon:server
tooltip: 'Manage your custom and official servers.'
dottiTip: 'A good server page is like a switchboard for chaos.'
amiTip: 'I like a dropdown full of possibilities and only mild danger.'
sort: highlight
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/servers-mobile
backgroundTablet: /api/art/backdrop/servers-tablet
backgroundDesktop: /api/art/backdrop/servers-desktop
---

:server-manager