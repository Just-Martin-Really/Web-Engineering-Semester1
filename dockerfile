# Use Node.js as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your code (server.js, public folder, etc.)
COPY . .

# Expose the port your app runs on
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]