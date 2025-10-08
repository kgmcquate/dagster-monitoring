# Multi-stage build
# Stage 1: Build the React application
FROM node:24-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clear npm cache and install dependencies fresh
RUN npm cache clean --force && \
    npm ci

# Copy source code
COPY . .

# Accept build argument for base path
ARG BASE_PATH=""
ENV BASE_PATH=$BASE_PATH

# Build the application with the base path
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the built application from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the config generation script
COPY deployment/docker/generate-config.sh /usr/local/bin/generate-config.sh
RUN chmod +x /usr/local/bin/generate-config.sh

# Expose port 80
EXPOSE 80

# Generate runtime config and start Nginx
CMD ["/bin/sh", "-c", "/usr/local/bin/generate-config.sh && nginx -g 'daemon off;'"]