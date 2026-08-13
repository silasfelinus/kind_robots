# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS build

WORKDIR /app

# The commit this image is built from. nuxt.config.ts bakes runtimeConfig.public
# .buildId at BUILD time, so this has to be present before `npm run build` or the
# deployed app reports itself as 'development'. publish-container.yml passes
# github.sha; a local `docker build` without it still works and just says so.
ARG COMMIT_SHA=unknown

ENV NUXT_TELEMETRY_DISABLED=1 \
    NUXT_PUBLIC_BUILD_ID=$COMMIT_SHA

COPY . .

RUN DATABASE_URL=mysql://kindrobots:build-only@127.0.0.1:3306/kindrobots npm ci --include=optional
# Nuxt Image/IPX uses Sharp at runtime. Ask npm explicitly for the Linux x64
# glibc platform pair so both the native Sharp binding and its matching libvips
# package are guaranteed to exist even when the lockfile was produced elsewhere.
RUN npm install --no-save --package-lock=false --os=linux --cpu=x64 --libc=glibc sharp@0.34.5
RUN test -d /app/node_modules/@img/sharp-libvips-linux-x64/lib
RUN DATABASE_URL=mysql://kindrobots:build-only@127.0.0.1:3306/kindrobots npm run build

FROM node:24-bookworm-slim AS runtime

WORKDIR /app

# Repeated because ARGs do not cross stage boundaries. /api/version reads
# COMMIT_SHA at request time, which is what the deploy-wait in cypress.yml polls
# for; it used to be unset outside Vercel, so the endpoint always answered
# `commit: null` and the wait could never succeed.
ARG COMMIT_SHA=unknown

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000 \
    NUXT_TELEMETRY_DISABLED=1 \
    COMMIT_SHA=$COMMIT_SHA

COPY --from=build --chown=node:node /app/.output ./.output
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json

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
# Nitro bundles Sharp's native binding privately. Make the matching prebuilt
# libvips shared libraries available to the system dynamic linker so the
# binding can load regardless of Nitro's nested node_modules layout.
COPY --from=build /app/node_modules/@img/sharp-libvips-linux-x64/lib/ /usr/local/lib/
RUN ldconfig && test -e /usr/local/lib/libvips-cpp.so.8.17.3

# node:24-bookworm-slim ships without openssl, so the Prisma CLI cannot detect a
# version and warns that it is "Defaulting to openssl-1.1.x" -- a guess, in the
# image that now runs production migrations. Installing it lets Prisma pick the
# right query engine rather than hoping.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN ln -s /app/.output/public /app/public

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health/database').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "--env-file-if-exists=/config/kind-robots.env", ".output/server/index.mjs"]
