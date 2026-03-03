FROM oven/bun:1

WORKDIR /app

# Copy workspace manifests for install layer caching
COPY package.json bun.lockb* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/frontend/package.json ./packages/frontend/

RUN bun install

# Copy source
COPY packages/shared/src ./packages/shared/src
COPY packages/frontend/src ./packages/frontend/src
COPY packages/frontend/static ./packages/frontend/static
COPY packages/frontend/svelte.config.js ./packages/frontend/
COPY packages/frontend/vite.config.ts ./packages/frontend/

WORKDIR /app/packages/frontend

EXPOSE 5173

CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0"]
