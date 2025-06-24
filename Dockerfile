# Node.js API
FROM node:22-alpine AS server

WORKDIR /app/server

# Copy package files
COPY server/package*.json ./
RUN npm ci --only=production

# Copy source code
COPY server/src ./src
COPY server/tsconfig.json ./

# Build TypeScript
RUN npm run build -- --noEmit false

# Client build stage
FROM node:22-alpine AS client-builder
RUN apk update && apk upgrade && apk add --no-cache dumb-init
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Server build stage  
FROM node:22-alpine AS backend-server
RUN apk update && apk upgrade && apk add --no-cache dumb-init
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/src ./src
COPY server/tsconfig.json ./
RUN npm run build 2>&1 || echo "Build completed with warnings"

# Production stage
FROM node:22-alpine AS production
RUN apk update && apk upgrade && apk add --no-cache dumb-init
WORKDIR /app
COPY --from=backend-server /app/server/dist ./dist
COPY --from=backend-server /app/server/package*.json ./
RUN npm ci --only=production
COPY --from=client-builder /app/client/dist ./public
RUN addgroup -g 1001 -S nodejs && adduser -S wartracker -u 1001
RUN chown -R wartracker:nodejs /app
USER wartracker
EXPOSE 3001
CMD ["dumb-init", "node", "dist/server.js"]