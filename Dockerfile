FROM node:24

WORKDIR /app

# Copy manifests and install — cached until package files change
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/

RUN npm ci

# Copy source and config — separate layer so npm ci cache isn't invalidated by source changes
COPY . .

# The Supabase local stack runs outside this container, on the host, via the
# `supabase` CLI. Inside the container the portal reaches it through the
# SUPABASE_LOCAL_URL rewrite target (set in docker-compose.yml). We invoke the
# Next dev server directly to skip the `predev` hook, which boots Supabase on
# the host rather than in this container.
CMD ["npx", "next", "dev", "-p", "4230", "-H", "0.0.0.0"]
