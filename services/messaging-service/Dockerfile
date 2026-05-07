FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY db.js server.js ./

ENV PORT=7100
EXPOSE 7100

CMD ["npm", "start"]
