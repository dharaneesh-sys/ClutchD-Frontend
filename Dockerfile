# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# We set this to true to skip linting/type checking during build if we want it faster,
# but for a standard "make it work" build, we'll keep it default.
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_PORT=8000
ENV NEXT_PUBLIC_WS_PORT=$NEXT_PUBLIC_WS_PORT

RUN npm run build

# Stage 3: Runner (slim Alpine + minimal Node runtime)
FROM alpine:3.20 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install only runtime libraries needed by Node
RUN apk add --no-cache libstdc++ libgcc libc6-compat ca-certificates

# Copy node binary from builder (avoids pulling full node:20-alpine)
COPY --from=builder /usr/local/bin/node /usr/local/bin/node

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output (minimal node_modules + server.js)
COPY --from=builder /app/.next/standalone ./
# Copy static assets (served by standalone server)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
