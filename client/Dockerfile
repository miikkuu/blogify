# Stage 1 - Build react app
FROM node:alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the client code
COPY . .

# Build the app
RUN npm run build

# Stage 2 - Production build
FROM nginx:alpine

# Copy build output from the first stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy .env file to the container
#COPY .env /usr/share/nginx/html/.env

# Expose port 80 to the outside world
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
