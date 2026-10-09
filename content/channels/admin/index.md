---
contentType: channel
channelKey: admin
label: Admin
title: Admin
room: Control Room
subtitle: Operational controls for managers
description: Queues, servers, permissions, moderation, system health, and other dangerous buttons.
icon: kind-icon:server
route: /artjob
defaultTab: artjob
sort: 70
requiredRole: ADMIN
loadingMessage: Loading admin systems...
refreshLabel: Refresh Admin
dottiTip: Admin tools are powerful, so I brought validation.
amiTip: I brought a helmet.
tutorial:
  title: Admin
  tagline: Keep the robots running, and build what is not public yet.
  overview: >-
    Admin is the control room for Kind Robots. It holds the operational tools that keep the site working and the studios that are still being built, and it is only visible to administrators.
  hero: /images/channels/admin/channel.webp
  sections:
    - key: operations
      title: Watch the pipelines
      body: >-
        Most days start with the pipelines. ArtJob shows whether art is rendering and why anything failed, Resources shows what the art servers can draw with, and Projects shows what the agents are working on. When something on the public site looks wrong, one of these usually explains it.
      image: /images/channels/admin/resources.webp
    - key: studios
      title: Studios still in the workshop
      body: >-
        Some tabs are real creative tools that are not public yet. They live here while they are built and checked, and each one moves to Play once Silas has accepted it. Expect them to change between visits.
      image: /images/channels/admin/zuzu-world.webp
    - key: care
      title: These buttons touch real data
      body: >-
        Retries, imports, role changes, and moderation decisions act on live accounts, art, and records. Private and mature material imported here stays private unless someone deliberately publishes it, and every tab explains its own controls in its page help.
      image: /images/channels/admin/art-archive.webp
    - key: boundaries
      title: Know the neighboring rooms
      body: >-
        Home is your own account, Storybook holds the ingredients of stories, and Play is where finished tools and games live for everyone. Admin is for running the place and for work that is not ready to be seen yet; retired surfaces stay reachable under Retired without crowding the menu.
      image: /images/channels/admin/channel.webp
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/admin-mobile
backgroundTablet: /api/art/backdrop/admin-tablet
backgroundDesktop: /api/art/backdrop/admin-desktop
---

Manage the systems and queues that keep Kind Robots running.
