# Node.js API
FROM node:18-alpine AS server

WORKDIR /app/server

# Copy package files
COPY server/package*.json ./
RUN npm ci --only=production

# Copy source code
COPY server/src ./src
COPY server/tsconfig.json ./

# Build TypeScript
RUN npm run build

# React Client
FROM node:18-alpine AS client-builder

WORKDIR /app/client

# Copy package files
COPY client/package*.json ./
RUN npm ci

# Copy source code
COPY client/ ./

# Build React app
RUN npm run build

# Final production image
FROM node:18-alpine

RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy server build
COPY --from=server /app/server/dist ./server
COPY --from=server /app/server/node_modules ./node_modules
COPY --from=server /app/server/package*.json ./

# Copy client build
COPY --from=client-builder /app/client/dist ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S wartracker -u 1001

# Set ownership
RUN chown -R wartracker:nodejs /app
USER wartracker

EXPOSE 5000

ENV NODE_ENV=production

CMD ["dumb-init", "node", "server/index.js"]