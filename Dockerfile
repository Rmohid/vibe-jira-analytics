# Multi-stage build for production-ready Jira Analytics Dashboard
# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm ci --only=development

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Stage 2: Production server
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy server and built frontend from builder stage
COPY --from=frontend-builder --chown=nodejs:nodejs /app/dist ./dist
COPY --chown=nodejs:nodejs server.js ./
COPY --chown=nodejs:nodejs src/config ./src/config
COPY --chown=nodejs:nodejs src/utils ./src/utils
COPY --chown=nodejs:nodejs api ./api

# Copy documentation files that the app needs to serve
COPY --chown=nodejs:nodejs *.md ./

# Create data directory for config storage
RUN mkdir -p /app/data && \
    chown -R nodejs:nodejs /app/data

# Switch to non-root user
USER nodejs

# Expose the application port
EXPOSE 3001

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {if(r.statusCode !== 200) process.exit(1)})" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]