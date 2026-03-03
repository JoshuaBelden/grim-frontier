FROM oven/bun:1

WORKDIR /app

# Copy workspace manifests for install layer caching
COPY package.json bun.lockb* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/

RUN bun install

# Copy source
COPY packages/shared/src ./packages/shared/src
COPY packages/backend/src ./packages/backend/src

WORKDIR /app/packages/backend

EXPOSE 3000

CMD ["bun", "--watch", "src/index.ts"]
