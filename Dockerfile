FROM node:20-alpine

WORKDIR /app

# Copy application files (zero npm dependencies required)
COPY package.json server.js index.html ./
COPY data ./data

# Expose server port
EXPOSE 4321

# Volume for data persistence across container restarts
VOLUME ["/app/data"]

ENV PORT=4321

CMD ["node", "server.js"]
