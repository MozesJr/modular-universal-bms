# =============================================
# Backend Dockerfile — Node.js (Express)
# Modular Universal BMS
# =============================================

# ─── Stage 1: Dependencies ────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

# ─── Stage 2: Development ─────────────────
FROM node:20-alpine AS development
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]

# ─── Stage 3: Production ──────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Copy only production deps from stage 1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Non-root user for security
RUN addgroup -S bms && adduser -S bms -G bms
USER bms

EXPOSE 3000
CMD ["node", "src/server.js"]
