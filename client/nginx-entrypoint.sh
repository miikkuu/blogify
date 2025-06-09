#!/bin/sh
# Substitute environment variables into config.template.js
# The variables VITE_API_BACKEND_URL and VITE_GOOGLE_CLIENT_ID are passed to the Nginx container
# by Docker Compose from the .env file on the EC2 instance.
envsubst '$$VITE_API_BACKEND_URL,$$VITE_GOOGLE_CLIENT_ID' < /usr/share/nginx/html/config.template.js > /usr/share/nginx/html/config.js

# Start Nginx
exec nginx -c /etc/nginx/nginx.conf -g 'daemon off;'