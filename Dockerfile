# Dockerfile for deploying the unified scraper API and serving frontend static assets in Google Cloud Run
FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Copy root configurations
COPY package*.json ./
RUN npm install --only=production

# Copy backend configurations and install dependencies
COPY codespace_backend/package*.json ./codespace_backend/
RUN npm --prefix codespace_backend install --only=production

# Copy remaining source code
COPY . .

# Set running environments
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "codespace_backend/server.js"]
