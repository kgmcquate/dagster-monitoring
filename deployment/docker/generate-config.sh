#!/bin/sh

# Generate runtime configuration file and modify asset paths
# This script reads environment variables and creates configuration files

CONFIG_FILE="${CONFIG_FILE:-/usr/share/nginx/html/config.js}"
HTML_FILE="/usr/share/nginx/html/index.html"
NGINX_CONF_FILE="/etc/nginx/nginx.conf"

# Use environment variables if set, otherwise use defaults
DAGSTER_GRAPHQL_URL=${DAGSTER_GRAPHQL_URL:-'/graphql'}
DAGSTER_BASE_URL=${DAGSTER_BASE_URL:-'http://localhost:3000'}
BASE_PATH=${BASE_PATH:-''}

# Clean and format BASE_PATH
if [ -n "$BASE_PATH" ] && [ "$BASE_PATH" != "" ] && [ "$BASE_PATH" != "/" ]; then
    # Remove leading/trailing slashes and ensure proper format
    BASE_PATH=$(echo "$BASE_PATH" | sed 's|^/||' | sed 's|/$||')
    if [ -n "$BASE_PATH" ]; then
        BASE_PATH="/$BASE_PATH"
    fi
else
    BASE_PATH=""
fi

echo "Configuration values:"
echo "DAGSTER_GRAPHQL_URL: $DAGSTER_GRAPHQL_URL"
echo "DAGSTER_BASE_URL: $DAGSTER_BASE_URL"
echo "BASE_PATH: '$BASE_PATH'"

# Generate the JavaScript configuration file
cat > "$CONFIG_FILE" << EOF
// Runtime configuration
// This file is generated at container startup with actual environment values
window.__RUNTIME_CONFIG__ = {
  DAGSTER_GRAPHQL_URL: '$DAGSTER_GRAPHQL_URL',
  DAGSTER_BASE_URL: '$DAGSTER_BASE_URL',
  BASE_PATH: '$BASE_PATH'
};
EOF

echo "Generated runtime configuration"

# Modify HTML file to use correct base path for assets
if [ -n "$BASE_PATH" ] && [ "$BASE_PATH" != "" ]; then
    echo "Modifying asset paths for BASE_PATH: $BASE_PATH"
    
    # Create backup if it doesn't exist
    if [ ! -f "$HTML_FILE.original" ]; then
        cp "$HTML_FILE" "$HTML_FILE.original"
    fi
    
    # Restore from original and apply new base path
    cp "$HTML_FILE.original" "$HTML_FILE"
    
    # Replace asset paths (href and src attributes that start with /)
    sed -i "s|href=\"/|href=\"$BASE_PATH/|g" "$HTML_FILE"
    sed -i "s|src=\"/|src=\"$BASE_PATH/|g" "$HTML_FILE"
    
    echo "Updated asset paths in index.html"
else
    echo "No BASE_PATH set, using original asset paths"
    
    # Restore original if no base path
    if [ -f "$HTML_FILE.original" ]; then
        cp "$HTML_FILE.original" "$HTML_FILE"
    fi
fi

# Generate nginx configuration
cat > "$NGINX_CONF_FILE" << 'NGINX_EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml+rss;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html index.htm;
NGINX_EOF

# Add BASE_PATH specific nginx configuration
if [ -n "$BASE_PATH" ] && [ "$BASE_PATH" != "" ]; then
    cat >> "$NGINX_CONF_FILE" << NGINX_EOF

        # Redirect root to base path
        location = / {
            return 301 $BASE_PATH/;
        }

        # Handle base path without trailing slash
        location = $BASE_PATH {
            return 301 $BASE_PATH/;
        }

        # Handle assets and other files under BASE_PATH
        location ~ ^$BASE_PATH/(assets/.*|.*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot))$ {
            try_files /\$1 =404;
        }
        
        # Handle other files under BASE_PATH (fallback to index.html for SPA)
        location ~ ^$BASE_PATH/(.*)$ {
            try_files /\$1 /\$1/ /index.html;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\\n";
            add_header Content-Type text/plain;
        }

        # Handle all root-level requests (including rewritten ones)
        location / {
            try_files \$uri \$uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Cache HTML files for a short time  
        location ~* \.html$ {
            expires 5m;
            add_header Cache-Control "public";
        }
NGINX_EOF
else
    cat >> "$NGINX_CONF_FILE" << 'NGINX_EOF'

        # Handle React Router (SPA) - default root serving
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Cache HTML files for a short time
        location ~* \.html$ {
            expires 5m;
            add_header Cache-Control "public";
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
NGINX_EOF
fi

# Close the server block
cat >> "$NGINX_CONF_FILE" << 'NGINX_EOF'
    }
}
NGINX_EOF

echo "Generated nginx configuration for BASE_PATH: '$BASE_PATH'"