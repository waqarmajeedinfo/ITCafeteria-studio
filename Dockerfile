FROM node:22-slim AS build
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=1536"
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js
COPY data ./data
COPY user-data ./user-data
COPY character-refs ./character-refs
RUN mkdir -p /app/data /app/user-data && chown -R node:node /app
USER node
EXPOSE 10000
CMD ["node", "server.js"]

