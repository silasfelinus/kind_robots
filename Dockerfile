# syntax = docker/dockerfile:1

FROM node:alpine AS base

WORKDIR /src

RUN chown -R node:node /src

# Build
FROM base AS build

USER root

COPY --link package.json package-lock.json ./
COPY --link prisma/* ./prisma

RUN npm install --omit=dev

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

# Define PORT at build time and set it as an environment variable
ARG PORT=3000
ENV PORT=$PORT

EXPOSE $PORT

COPY --from=build /src/.output /src/.output
COPY --from=build /src/node_modules /src/node_modules

CMD ["node", ".output/server/index.mjs"]
