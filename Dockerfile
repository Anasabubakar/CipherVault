FROM node:20-alpine AS base
WORKDIR /app
COPY package.json ./

FROM base AS client-build
COPY client/package.json ./client/
RUN cd client && npm install
COPY client/ ./client/
RUN cd client && npm run build

FROM base AS server-build
COPY server/package.json ./server/
RUN cd server && npm install
COPY server/ ./server/
RUN cd server && npm run build

FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache tini
COPY --from=server-build /app/server/dist ./dist
COPY --from=server-build /app/server/node_modules ./node_modules
COPY --from=server-build /app/server/package.json ./
COPY --from=server-build /app/server/db ./db
COPY --from=client-build /app/client/dist ./public
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
