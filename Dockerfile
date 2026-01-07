# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN bun ci

# Copy source
COPY . .

# Build arguments
ARG VITE_MCP_BRIDGE_URL
ARG VITE_GITHUB_ORGANIZATION

# Build
RUN bun run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config (if you have custom config)
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
