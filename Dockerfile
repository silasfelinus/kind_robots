# syntax=docker/dockerfile:1

# Base stage with node image and setting up the working directory
FROM node:alpine as base

WORKDIR /src
RUN chown -R node:node /src

# Set the node user for security
USER node

# Build stage to install dependencies and build the project
FROM base as build

# Copying package files
COPY --chown=node:node package.json package-lock.json ./

# Install all dependencies, then remove dev dependencies to slim down the build
RUN npm install && npm prune --production

# Copy prisma schemas and generate prisma client
COPY --chown=node:node prisma ./prisma
RUN npx prisma generate

# Copy the rest of the application code
COPY --chown=node:node . .

# Build the application using Nuxt
RUN ./node_modules/.bin/nuxt build

# Run stage to execute the application
FROM base as runtime

# Set environment variables
ENV PORT=3000

# Expose the port the app runs on
EXPOSE $PORT

# Copy necessary build outputs and node_modules from the build stage
COPY --from=build --chown=node:node /src/.output /src/.output
COPY --from=build --chown=node:node /src/node_modules /src/node_modules

# Command to run the application
CMD ["node", ".output/server/index.mjs"]
