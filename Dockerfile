# ==========================================
# Stage 1: Build the React Application
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install dependencies (using legacy peer deps for compatibility)
RUN npm ci --legacy-peer-deps

# Copy application source code
COPY . .

# Build production bundle
RUN npm run build

# ==========================================
# Stage 2: Production Nginx Server
# ==========================================
FROM nginx:alpine AS runner

# Remove default Nginx HTML files
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Health check to ensure Nginx is serving content
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/healthz || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

