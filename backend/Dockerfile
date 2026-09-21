# Backend image: Express + Prisma, run with tsx (no separate build step).
FROM node:26-slim

WORKDIR /app

# Prisma's query engine needs openssl on slim images.
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install deps first for better layer caching. Dev deps are needed at runtime
# here because we run via `tsx` and use the Prisma CLI for migrations.
COPY package*.json ./
RUN npm install

# Generate the Prisma client (needs the schema, not the database).
# The schema lives in db/ rather than the default prisma/, so every CLI call
# passes --schema explicitly.
COPY db ./db
RUN npx prisma generate --schema=db/schema.prisma

# App source + startup script.
COPY . .
RUN chmod +x docker-entrypoint.sh

EXPOSE 4000
CMD ["./docker-entrypoint.sh"]