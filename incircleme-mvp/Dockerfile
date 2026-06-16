# IncircleMe API + worker — staging image. Runs TS directly via tsx (matches the
# repo; no separate build step). amd64 (Fly builders).
FROM node:22-bookworm-slim

RUN corepack enable && corepack prepare pnpm@11.5.3 --activate
WORKDIR /app

# Copy the whole workspace (pnpm needs the graph), then install ONLY the API and
# its workspace deps (config/db/types/i18n) — no react-native/expo/next bloat.
COPY . .
RUN pnpm install --frozen-lockfile --filter "@incircleme/api..."

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Default command = API server; Fly's [processes] overrides it for the worker.
CMD ["pnpm", "--filter", "@incircleme/api", "start"]
