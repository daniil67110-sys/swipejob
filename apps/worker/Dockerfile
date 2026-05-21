# SwipeJob Worker — Dockerfile multi-stage (Railway-ready)
# Utilise Node 22 Alpine pour minimiser la taille de l'image

# ============================================================
# Stage 1: Base
# ============================================================
FROM node:22-alpine AS base
# git: needed by root `prepare` script (lefthook install) during pnpm install
RUN apk add --no-cache libc6-compat git
RUN npm install -g pnpm

WORKDIR /app

# ============================================================
# Stage 2: Dependencies (installation complète pour le build)
# ============================================================
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/worker/package.json ./apps/worker/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/types/package.json ./packages/types/package.json

# Initialiser un repo git vide : la racine package.json a `prepare: lefthook install`
# qui exige un repo git, même en CI. On évite ainsi de hacker autour des hooks.
RUN git init -q && git config user.email "ci@swipejob.local" && git config user.name "ci"

RUN pnpm install --frozen-lockfile --filter=@swipejob/worker...

# ============================================================
# Stage 3: Build
# ============================================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm --filter=@swipejob/worker build

# Extraire uniquement les dépendances runtime via pnpm deploy
# Cela crée un dossier /app/runtime avec uniquement les deps de prod
RUN pnpm deploy --filter=@swipejob/worker --prod /app/runtime

# ============================================================
# Stage 4: Runtime (production)
# ============================================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV WORKER_PORT=4000

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 worker

# Copier uniquement les artefacts de build et les deps runtime
COPY --from=builder --chown=worker:nodejs /app/apps/worker/dist ./dist
COPY --from=builder --chown=worker:nodejs /app/apps/worker/package.json ./package.json
# Utiliser les deps runtime extraites par pnpm deploy (taille minimale)
COPY --from=builder --chown=worker:nodejs /app/runtime/node_modules ./node_modules

USER worker

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
