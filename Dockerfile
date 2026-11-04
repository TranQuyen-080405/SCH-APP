FROM node:26.13.0-bookworm-slim AS client

WORKDIR /src/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:26.13.0-bookworm-slim AS server

WORKDIR /src/server
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/src ./src

FROM node:26.13.0-bookworm-slim

ENV PORT=3000 \
    DATABASE_PATH=/app/server/data/app.db \
    CLIENT_ORIGIN=http://localhost:3000

WORKDIR /app
COPY --from=server --chown=node:node /src/server /app/server
COPY --from=client --chown=node:node /src/client/dist /app/client/dist
RUN mkdir -p /app/server/data && chown node:node /app/server/data

USER node
WORKDIR /app/server
EXPOSE 3000
CMD ["node", "src/server.js"]
