# Gunakan Node.js versi LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy semua file
COPY . .

# Expose port
EXPOSE 3000

# Jalankan server
CMD ["node", "server.js"]
