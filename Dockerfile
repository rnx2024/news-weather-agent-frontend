FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY public ./public
COPY next.config.ts tsconfig.json next-env.d.ts postcss.config.mjs eslint.config.mjs ./
COPY package.json package-lock.json ./
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/next.config.ts ./next.config.ts

USER nextjs

EXPOSE 3000
CMD ["npm", "run", "start"]
