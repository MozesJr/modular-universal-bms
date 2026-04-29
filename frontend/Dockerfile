# =============================================
# Frontend Dockerfile — Vue 3 + Vite + Nginx
# Modular Universal BMS
# =============================================

# ─── Stage 1: Build ───────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# ─── Stage 2: Serve with Nginx ────────────
FROM nginx:1.25-alpine AS production
WORKDIR /usr/share/nginx/html

# Remove default nginx page
RUN rm -rf ./*

# Copy built app from builder stage
COPY --from=builder /app/dist .

# Custom nginx config for Vue Router (HTML5 history mode)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
