# syntax=docker/dockerfile:1

# --- deps: everything npm ci produces, keyed ONLY on package.json + lockfile ---
# Until 2026-11-02 the build stage ran `COPY . .` before `npm ci`, so every
# commit invalidated the ~80s install and every later layer, the runtime image's
# ~1 GB node_modules layer got a new digest on every build, and GHCR push plus
# the Unraid pull re-transferred it each deploy. Now an ordinary code commit
# reuses this stage from cache (see publish-container.yml) and the runtime
# node_modules layer is byte-identical between deploys.
FROM node:24-bookworm-slim AS deps

WORKDIR /app

ENV NUXT_TELEMETRY_DISABLED=1 \
    CYPRESS_INSTALL_BINARY=0

COPY package.json package-lock.json ./

# --ignore-scripts skips the ROOT lifecycle scripts, which need the full source
# tree: postinstall `nuxi prepare` (npm run build runs it again anyway) and
# prepare's git format hook (meaningless in an image). The dependency install
# scripts that matter are then run explicitly: Prisma's engines (the image runs
# production migrations), esbuild's binary check, Sharp's native check and the
# unrs-resolver binding. Cypress is deliberately absent: no binary in the image.
RUN npm ci --include=optional --ignore-scripts \
  && DATABASE_URL=mysql://kindrobots:build-only@127.0.0.1:3306/kindrobots \
     npm rebuild prisma @prisma/engines esbuild sharp unrs-resolver
# Nuxt Image/IPX uses Sharp at runtime. package-lock.json carries the Linux x64
# glibc pair (@img/sharp-linux-x64 and @img/sharp-libvips-linux-x64), so npm ci
# installs the native binding and its libvips; the check below fails the build
# if a lockfile regenerated elsewhere ever drops them. To take newer
# dependencies, update package-lock.json in a PR: the image is exactly the
# lockfile (the old `npm install --no-save sharp@...` re-resolve was removed
# 2026-10-20).
RUN test -d /app/node_modules/@img/sharp-libvips-linux-x64/lib

# --- build: the Nuxt/Nitro production build on top of the cached deps ---
FROM deps AS build

# The commit this image is built from. nuxt.config.ts bakes runtimeConfig.public
# .buildId at BUILD time, so this has to be present before `npm run build` or the
# deployed app reports itself as 'development'. publish-container.yml passes
# github.sha; a local `docker build` without it still works and just says so.
# Declared here, after deps, so a new SHA never invalidates the install.
ARG COMMIT_SHA=unknown

# The Nuxt build's heap: it peaked near 5.5 GB under a 6 GB cap and began running out on PRs that only
# added game code (2026-10-17). It then reached the 8 GB cap during the Nitro server build: every push
# to main from #4264 through #4277 (2026-10-27) died with "Reached heap limit", so production stayed on
# #4263. The image builds only on GitHub's 16 GB ubuntu-latest runner; the Unraid deployer pulls the
# published image and never builds it, so this does not touch the production host.
ENV NUXT_PUBLIC_BUILD_ID=$COMMIT_SHA \
    NODE_OPTIONS=--max-old-space-size=12288

COPY . .

RUN DATABASE_URL=mysql://kindrobots:build-only@127.0.0.1:3306/kindrobots npm run build

FROM node:24-bookworm-slim AS runtime

WORKDIR /app


ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000 \
    NUXT_TELEMETRY_DISABLED=1

# Layer order is deliberate: everything that only changes with the base image
# or the lockfile comes first, so those layers keep the same digest from one
# deploy to the next and neither GHCR nor the Unraid pull moves them again.
# Only the app build (.output) and the small source copies below change per commit.
# node:24-bookworm-slim ships without openssl, so the Prisma CLI cannot detect a
# version and warns that it is "Defaulting to openssl-1.1.x" -- a guess, in the
# image that now runs production migrations. Installing it lets Prisma pick the
# right query engine rather than hoping.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Nitro bundles Sharp's native binding privately. Make the matching prebuilt
# libvips shared libraries available to the system dynamic linker so the
# binding can load regardless of Nitro's nested node_modules layout.
COPY --from=deps /app/node_modules/@img/sharp-libvips-linux-x64/lib/ /usr/local/lib/
RUN ldconfig && test -e /usr/local/lib/libvips-cpp.so.8.17.3

# From deps, not build: the build stage writes caches into node_modules, which
# would give this ~1 GB layer a new digest every commit. Nothing the runtime
# reads is generated there (the Prisma client is emitted to prisma/generated).
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
# Repeated because ARGs do not cross stage boundaries. /api/version reads
# COMMIT_SHA at request time, which is what the deploy-wait in cypress.yml polls
# for; it used to be unset outside Vercel, so the endpoint always answered
# `commit: null` and the wait could never succeed.
# Declared after the stable layers above so a new SHA does not rebuild them.
ARG COMMIT_SHA=unknown
ENV COMMIT_SHA=$COMMIT_SHA

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/.output ./.output

# Everything `scripts/prisma-migrate-deploy.mjs` needs to run against this exact
# build. The runtime image used to carry .output, node_modules and package.json
# only, which meant migrations could not be applied from the image at all: the
# wrapper was absent, and so were the schema and the migration SQL that Prisma
# reads. That is why migrations had to be run from a separate repo checkout on
# the host, against whatever revision that checkout happened to be on.
#
# Carrying them here makes the image self-sufficient, so the migration that runs
# is always the one belonging to the code about to serve -- and lets
# docker-compose gate the app behind a one-shot migrate service. It is cheap:
# migration SQL and a handful of .mjs files.
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/scripts ./scripts
COPY --from=build --chown=node:node /app/prisma.config.ts ./prisma.config.ts
# The TLS-aware database adapter the scripts above connect through. Without it
# a script run with `docker exec` cannot import it, and the bare fallback
# connection is refused by ProxySQL ("SSL is required" / an empty pool) -- what
# stopped the media-watchlist seed on 2026-10-02. Two side-effect-free files.
COPY --from=build --chown=node:node /app/server/utils/databaseAdapterConfig.ts ./server/utils/databaseAdapterConfig.ts
COPY --from=build --chown=node:node /app/server/utils/databasePoolDefaults.ts ./server/utils/databasePoolDefaults.ts


RUN ln -s /app/.output/public /app/public

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health/database').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "--env-file-if-exists=/config/kind-robots.env", ".output/server/index.mjs"]