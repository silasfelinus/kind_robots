# Set up base image
FROM node:slim

# Set working directory
WORKDIR /app

# Copy production version into the image.
COPY .output .

# Expose application ports
EXPOSE 3000

# Start Service
CMD [ "node","server/index.mjs" ]