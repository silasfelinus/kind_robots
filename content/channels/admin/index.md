---
contentType: channel
channelKey: admin
label: Admin
title: Admin
room: Control Room
subtitle: Run the site and build what is not public yet
description: The art queue and models, agent projects, unreleased studios, user accounts, and forum moderation.
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
  tagline: Run the site, steer the agents, and build what is not public yet.
  overview: >-
    Admin is where Kind Robots is run and where its unreleased studios are
    built. It covers five jobs: keeping art generation working, steering the
    agent projects, building the studios, looking after accounts and the forum,
    and keeping side tools and retired pages within reach. Only administrators
    can see it.
  hero: /images/splash/screenfx.webp
  sections:
    - key: art
      title: Art generation and the archive
      body: >-
        ArtJob is the render queue, where you see which jobs are pending, running,
        or failed, check each art server's health, and retry or cancel jobs.
        Resources holds the checkpoints and LoRAs the servers draw with, LoRA Triage
        marks each LoRA SFW or NSFW, and Art Archive imports and rates the private
        legacy art collection.
      image: /images/dashboard-tabs/art/generate.webp
    - key: projects
      title: Projects and the agents
      body: >-
        Projects shows every Conductor project with its roadmap, milestones, and
        blocked tasks, and its Proposed button is where you approve or reject new
        pitches. From a project page you can leave a task or comment for the project
        worker. Project Placement is a one-off backfill that writes each project's
        channel, tab, and live URL.
      image: /images/dashboard-tabs/conductor/conductor.webp
    - key: studios
      title: Studios being built
      body: >-
        Zuzu World is one archive of Zuzu art that any production can link to. Comic
        Studio is where you pitch to the Editor, compare panel renders, and lay out
        pages. Zuzu Showdown is the fighting game, Shifting Lands is the Homestead
        card-game prototype, and Butterfly Gallery sorts the private art archive
        into bins. They stay admin-only while they are built, so expect them to
        change between visits.
      image: /zuzu-gamebook/scenes/zuzu-fire.webp
    - key: people
      title: Accounts and the forum
      body: >-
        Users & Moderation lists every account, where you change roles, reset
        passwords, shadow-restrict an account, or log in as a user to see what they
        see. Forum Moderation holds posts that were hidden automatically after two
        people flagged them, and you restore each one or confirm its removal.
      image: /images/channels/admin/forum-moderation.webp
    - key: shelf
      title: Side tools and the Retired shelf
      body: >-
        Coloring Book pairs color and black-and-white pages for the coloring book. Animation Manager previews and layers the site's screen effects and sets the
        startup animation for your browser. Retired keeps older pages reachable
        without crowding the menu, including AppMaker, the Conductor App page, the Mermaids of Venice page editor, and the
        Scene Animator.
      image: /images/butterfly-gallery/room.webp
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/admin-mobile
backgroundTablet: /api/art/backdrop/admin-tablet
backgroundDesktop: /api/art/backdrop/admin-desktop
---

Manage the systems and queues that keep Kind Robots running.
