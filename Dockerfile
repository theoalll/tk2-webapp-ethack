FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
