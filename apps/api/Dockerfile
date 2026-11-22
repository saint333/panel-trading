FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/domain/package.json packages/domain/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/testing/package.json packages/testing/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile --filter @binomo/api... --filter @binomo/domain --filter @binomo/contracts

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/domain packages/domain
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN pnpm --filter @binomo/domain build \
  && pnpm --filter @binomo/contracts build \
  && pnpm --filter @binomo/api exec prisma generate \
  && pnpm --filter @binomo/api build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/packages ./packages
COPY package.json ./
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
