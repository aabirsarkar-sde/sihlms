# Build context: repository root (see docker-compose.yml)
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates curl && rm -rf /var/lib/apt/lists/* \
  && corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile
COPY apps/web apps/web
WORKDIR /app/apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm prisma generate && pnpm build
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
# Apply migrations, then serve. Seed separately: `pnpm db:seed` (host) or `docker compose exec web pnpm db:seed`.
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm start"]
