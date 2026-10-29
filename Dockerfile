FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Fail during build, not after rollout, if Node cannot resolve the voucher worker runtime imports.
RUN node -e "import('./src/lib/voucher-service.ts').then(() => console.log('Voucher worker runtime imports OK'))"
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Operator commands run from this exact runner, using Node 24 native TypeScript support.
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src/lib/identity ./src/lib/identity
COPY --from=builder /app/src/lib/network-domain.ts /app/src/lib/network-service.ts ./src/lib/
COPY --from=builder /app/src/lib/voucher-domain.ts /app/src/lib/voucher-api.ts /app/src/lib/voucher-service.ts ./src/lib/
COPY --from=deps /app/node_modules/postgres ./node_modules/postgres
COPY --from=builder /app/src/lib/learning-service.ts /app/src/lib/slug.ts /app/src/lib/portal-ui.ts /app/src/lib/starsender-client.ts /app/src/lib/integration-settings.ts ./src/lib/
RUN mkdir -p /app/storage/learning /app/storage/stifin-sources && chown -R node:node /app
USER node
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "scripts/start-with-worker.mjs"]
