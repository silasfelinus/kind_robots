# Use the official Node.js 19 image as a parent image
FROM node:19 AS build-stage

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Copy the Prisma schema file into the image before running npm install
COPY prisma/schema.prisma ./prisma/

# Now run npm install, the Prisma schema is present, so postinstall should not fail
RUN npm install --silent

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . .

# Define the argument
ARG DATABASE_URL

# Set the environment variable
ENV DATABASE_URL=${DATABASE_URL}

# Generate Prisma Client
RUN npx prisma generate

# Build the app for production
RUN npm run build

# Remove development dependencies if you want to make the image lighter
# RUN npm prune --production

# Change ownership of the current directory to the 'silasfelinus' user for security purposes
RUN chown -R 1000 /usr/src/app

# Switch to 'silasfelinus' user
USER 1000


# Your application will bind to port 3000
EXPOSE 3000

# Start the server using the production build
CMD ["npm", "start"]

# You can use a multi-stage build to make the final image lighter
# by copying only the necessary files from the 'build-stage'
