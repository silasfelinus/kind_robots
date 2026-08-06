---
title: 'User Admin'
room: 'User Administration'
subtitle: 'The people dashboard'
description: Admin control room for user management — create users, override roles and maturity, reset passwords, shadow-restrict accounts, and log in as any user.
image: 'background/artgallery.webp'
icon: kind-icon:users
tooltip: Manage users, roles, access, and logins.
dottiTip: Every account in one place. Try not to break anything, boss.
amiTip: Roles, resets, restrictions, and login-as — the whole roster, one table.
channelKey: admin
tabKey: user-admin
requiredRole: ADMIN
loadingMessage: Loading user admin...
refreshLabel: Refresh users
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/user-admin-mobile
backgroundTablet: /api/art/backdrop/user-admin-tablet
backgroundDesktop: /api/art/backdrop/user-admin-desktop
---

:user-manager-directory
