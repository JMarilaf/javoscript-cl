# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4003
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build --chown=node:node /app/dist/web ./dist/web
# El proceso solo sirve HTML: no necesita root dentro del contenedor.
USER node
EXPOSE 4003
CMD ["node", "dist/web/server/server.mjs"]
