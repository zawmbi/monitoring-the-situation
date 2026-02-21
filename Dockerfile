FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache curl dumb-init

# Copy root workspace config first for better layer caching
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install from root so npm workspaces resolves the file:.. dependency
RUN npm install --workspace=backend --production --ignore-scripts

# Copy backend source
COPY backend/ ./backend/

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

# dumb-init ensures signals (SIGTERM) are forwarded properly to Node
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/src/index.js"]
