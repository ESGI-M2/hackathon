FROM node:23-alpine AS node_upstream
WORKDIR /srv/app

# Development image
FROM node_upstream as dev

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME localhost

COPY package.json .
RUN npm install

CMD ["npm", "run", "dev"]

FROM node_upstream AS builder

COPY --link . .
RUN npm ci && \
	npm run build

# Production image, copy all the files and run next
FROM node_upstream AS prod

WORKDIR /srv/app

ENV NODE_ENV production
# Delete the following line in case you want to enable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

#RUN addgroup --gid 1001 nodejs; \
#	adduser --uid 1001 nextjs

COPY --from=builder --link /srv/app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next;
#	chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --link --chown=1001:1001 /srv/app/.next/standalone ./
COPY --from=builder --link --chown=1001:1001 /srv/app/.next/static ./.next/static

#USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
