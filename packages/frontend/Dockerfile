FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile 2>/dev/null || bun install

COPY . .

EXPOSE 5173

CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0"]
