FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 py3-pip build-base && \
    pip3 install chromadb-client --break-system-packages

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

COPY web ./web

RUN mkdir -p /data

ENV AGENT_MEMORY_DB=/data/memory.db
ENV PORT=37800
ENV NODE_ENV=production

EXPOSE 37800

CMD ["node", "dist/worker/index.js"]
