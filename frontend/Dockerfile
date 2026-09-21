# Frontend image: build the Vite app, serve the static bundle with nginx.
# nginx also proxies /api → backend so the browser sees a single origin.

# --- build stage ---
FROM node:26-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- serve stage ---
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]