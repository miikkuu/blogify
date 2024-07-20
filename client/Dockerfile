# blogify/client/Dockerfile
FROM node:18-alpine AS build
ARG VITE_API_BACKEND_URL
ARG VITE_GOOGLE_CLIENT_ID


WORKDIR /app
COPY package*.json ./
RUN yarn install
COPY . .

# Pass build arguments as environment variables for build time
ENV VITE_API_BACKEND_URL=${VITE_API_BACKEND_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

RUN yarn run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
