FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl dumb-init

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
