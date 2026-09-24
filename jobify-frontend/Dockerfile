# Stage 1: Build React/Vite app
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Set VITE_API_URL to relative /api for Nginx reverse proxy
ENV VITE_API_URL=/api
RUN npm run build

# Stage 2: Serve static bundle via Nginx
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
