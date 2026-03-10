# ---- Build Stage ----
FROM cgr.dev/chainguard/node:latest-dev AS builder

WORKDIR /app

ENV NODE_ENV=development

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate && npm run build && npm prune --omit=dev && npm cache clean --force


# ---- Production Stage ----
FROM gcr.io/distroless/nodejs22-debian12:nonroot AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["/nodejs/bin/node", "-e", "fetch('http://127.0.0.1:8000/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

ENTRYPOINT ["/nodejs/bin/node"]

CMD ["dist/server.js"]
