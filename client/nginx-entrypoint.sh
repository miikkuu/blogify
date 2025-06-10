#!/bin/sh
# Substitute environment variables into config.template.js
# The variables VITE_API_BACKEND_URL and VITE_GOOGLE_CLIENT_ID are passed to the Nginx container
# by Docker Compose from the .env file on the EC2 instance.
envsubst '$$VITE_API_BACKEND_URL,$$VITE_GOOGLE_CLIENT_ID' < /usr/share/nginx/html/config.template.js > /usr/share/nginx/html/config.js

# Inject the config.js script tag into index.html
# This ensures config.js is loaded as a module before the main app bundle
sed -i '/<script type="module" crossorigin src="\/assets\/index-.*\.js"><\/script>/i \  <script type="module" src="/config.js"></script>' /usr/share/nginx/html/index.html

# Start Nginx
exec nginx -c /etc/nginx/nginx.conf -g 'daemon off;'