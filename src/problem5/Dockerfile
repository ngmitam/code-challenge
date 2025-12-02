# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

RUN apk add --no-cache curl dumb-init jq

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S user -u 1001

# Copy built application
COPY --from=builder /app/dist/ ./dist/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER user

EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]