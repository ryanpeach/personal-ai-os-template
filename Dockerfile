FROM node:24

WORKDIR /app

# Copy manifests and install — cached until package files change
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/
COPY apps/portal/package.json ./apps/portal/

RUN npm ci

# Copy source and config — separate layer so npm ci cache isn't invalidated by source changes
COPY tsconfig.base.json .eslintrc.js ./
COPY packages/shared/ ./packages/shared/
COPY apps/backend/ ./apps/backend/
COPY apps/portal/ ./apps/portal/

CMD ["sh", "-c", "npm run build --workspace=packages/shared && npm run migrate --workspace=apps/backend && npm run dev"]
