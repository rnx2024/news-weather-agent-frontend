FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
# --ignore-scripts blocks arbitrary lifecycle scripts from untrusted/unreviewed
# dependencies; sharp and unrs-resolver are the two reviewed packages that
# genuinely need their install scripts (native binaries), so they're rebuilt
# explicitly right after.
RUN npm ci --ignore-scripts && npm rebuild sharp unrs-resolver

FROM node:22-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY public ./public
COPY next.config.ts tsconfig.json next-env.d.ts postcss.config.mjs eslint.config.mjs ./
COPY package.json package-lock.json ./
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

COPY package.json package-lock.json ./
# Same rationale as the deps stage: block untrusted lifecycle scripts, but
# still allow sharp/unrs-resolver's native binaries — sharp specifically is
# what next/image uses to optimize images at runtime in this stage.
RUN npm ci --omit=dev --ignore-scripts && npm rebuild sharp unrs-resolver

COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/next.config.ts ./next.config.ts

USER nextjs

EXPOSE 3000
CMD ["npm", "run", "start"]

