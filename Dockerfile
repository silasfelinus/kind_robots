# Use the official Node.js 19 image as a parent image
FROM node:19

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install project dependencies
# Use `npm ci` instead of `npm install` if you have a package-lock.json
# `npm ci` is faster and more reliable for production builds
RUN npm ci

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . .

# Build the app for production
RUN npm run build

# Inform Docker that the container is listening on the specified port at runtime.
# Nuxt 3 by default runs on port 3000, but check your nuxt.config.js to be sure
EXPOSE 3000

# Start the server using the production build
CMD [ "npm", "start" ]
