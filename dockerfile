# Use Node.js as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your code (server.js, public folder, etc.)
COPY . .

# Copy Docker environment file as .env for the container
# This ensures the app has all required environment variables
RUN if [ -f .env.docker ]; then cp .env.docker .env; fi

# Create logs directory (for Winston logger)
RUN mkdir -p /app/logs

# Expose the port your app runs on
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]