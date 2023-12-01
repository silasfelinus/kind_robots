# syntax = docker/dockerfile:1

ARG NODE_VERSION=18.14.2

FROM node:${NODE_VERSION}-slim as base

ARG PORT=3000

ENV NODE_ENV=production

WORKDIR /src

RUN chown -R node:node /src

# Build
FROM base as build

USER root

COPY --link package.json package-lock.json ./
RUN npm install --production=false

RUN npm install prisma

COPY --link . .
COPY --link ./node_modules/.prisma ./node_modules/.prisma

RUN chown -R node:node /src

USER root

RUN chmod +x ./node_modules/.bin/prisma
RUN chmod +x ./node_modules/.bin/nuxt

USER node

RUN npx prisma generate

RUN ./node_modules/.bin/nuxt build


# Run
FROM base

USER node

ENV PORT=$PORT

EXPOSE $PORT

COPY --from=build /src/.output /src/.output
COPY --from=build /src/node_modules /src/node_modules

CMD ["node", ".output/server/index.mjs"]
