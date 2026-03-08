FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

RUN npx playwright install-deps chromium
RUN npx playwright install chromium

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV RENDER=true

CMD ["sh", "-c", "npx next start -H 0.0.0.0 -p ${PORT:-10000}"]
