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
COPY public/config.template.js /usr/share/nginx/html/config.template.js
COPY nginx-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
