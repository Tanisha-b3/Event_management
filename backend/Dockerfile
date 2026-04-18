# Base image
FROM node:18

# Create app directory
WORKDIR /app

# Install dependencies first (for caching)
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Expose backend port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]