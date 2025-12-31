FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

# Disable GPU if not using ORT GPU
ENV ORT_FORCE_CPU=1

EXPOSE 3000
CMD ["node", "src/server.js"]