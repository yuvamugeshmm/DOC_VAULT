FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Expose the port (Render/Railway will provide $PORT)
EXPOSE 5001

CMD ["node", "server.js"]
