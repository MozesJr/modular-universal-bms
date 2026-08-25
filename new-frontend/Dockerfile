# =============================================
# Frontend Dockerfile — React (Vite) + Nginx
# Modular Universal BMS
# =============================================

# ─── Stage 1: Build ────────────────────────
# node:20-alpine matches .nvmrc — Vite 5 requires Node ^18 or >=20.
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# No VITE_API_URL is passed here on purpose: src/services/api.ts and
# socket.ts fall back to a same-origin relative path (/api, same host) when
# it's unset, which is what lets this build work behind the nginx reverse
# proxy below without baking in a domain/IP at build time.
RUN npm run build

# ─── Stage 2: Serve with Nginx ─────────────
FROM nginx:alpine AS production
RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
