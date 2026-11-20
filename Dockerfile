FROM node:22-slim AS build
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=1536"
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    fonts-dejavu-core \
    fontconfig \
    python3 \
    python3-flask \
    python3-flask-cors \
    python3-pil \
    python3-numpy \
  && rm -rf /var/lib/apt/lists/*
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js
COPY data ./data
COPY user-data ./user-data
COPY character-refs ./character-refs
COPY backend_wcg/assets ./backend_wcg/assets
COPY backend_ugc ./backend_ugc
RUN mkdir -p /app/data /app/user-data /app/data/wcg-renders /app/data/ugc-renders /app/data/ugc-library && chown -R node:node /app
USER node
EXPOSE 10000
CMD ["node", "server.js"]
