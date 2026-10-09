# Multi-stage build: compile the client, then ship only production deps + the server.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production PORT=8787
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --omit=dev --workspace server --include-workspace-root=false && npm cache clean --force
COPY shared shared
COPY server/src server/src
COPY --from=build /app/client/dist client/dist
COPY client/public/data client/public/data
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:8787/api/health || exit 1
CMD ["node", "server/src/index.js"]
