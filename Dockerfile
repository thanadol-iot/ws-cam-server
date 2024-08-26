# Use an official Node.js runtime as a parent image
FROM node:18-alpine

RUN apk update
RUN apk upgrade
RUN apk add --no-cache ffmpeg

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Set the working directory to the src folder
WORKDIR /app

# Expose the WebSocket port (9999 in your case)
EXPOSE 9999
EXPOSE 8093

# Define the command to run your application
CMD ["node", "server.js"]


