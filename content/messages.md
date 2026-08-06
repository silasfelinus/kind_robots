---
title: 'Messages'
room: 'Direct Messages'
subtitle: 'Your conversations'
description: Private threaded conversations with other members, with read receipts and consent-aware messaging.
image: splash/dashboard.png
icon: kind-icon:message
tooltip: Your direct messages.
dottiTip: Slide into DMs responsibly. Consent settings are respected here.
amiTip: Threaded chats, unread badges, the works. Block anyone who's a pest.
channelKey: home
tabKey: messages
requiredPermission: authenticated
loadingMessage: Loading messages...
refreshLabel: Refresh messages
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/messages-mobile
backgroundTablet: /api/art/backdrop/messages-tablet
backgroundDesktop: /api/art/backdrop/messages-desktop
---

:messenger
