FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

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

CMD ["node", "backend/src/index.js"]
