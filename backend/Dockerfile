FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Expose default port
EXPOSE 5000

ENV PORT=5000 \
    NODE_ENV=production

CMD ["npm", "start"]
