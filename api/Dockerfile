# Use a smaller base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock first
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies for production only
RUN yarn install --production

# Copy only necessary files (consider using a .dockerignore file to exclude unnecessary files)
COPY . .

# Remove unnecessary files
RUN rm -rf /app/*.log

# Expose port
EXPOSE 4000

# Start the application
CMD ["node", "index.js"]
