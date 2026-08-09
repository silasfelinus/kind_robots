# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS build

WORKDIR /app

ENV NUXT_TELEMETRY_DISABLED=1

COPY . .

RUN DATABASE_URL=mysql://kindrobots:build-only@127.0.0.1:3306/kindrobots npm ci --include=optional
RUN DATABASE_URL=mysql://kindrobots:build-only@127.0.0.1:3306/kindrobots npm run build

FROM node:24-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000 \
    NUXT_TELEMETRY_DISABLED=1

COPY --from=build --chown=node:node /app/.output ./.output
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json

RUN ln -s /app/.output/public /app/public

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health/database').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "--env-file-if-exists=/config/kind-robots.env", ".output/server/index.mjs"]
