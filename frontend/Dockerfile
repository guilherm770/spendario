FROM node:20-alpine

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json next.config.mjs tailwind.config.ts postcss.config.js .eslintrc.json ./
COPY app ./app
COPY public ./public

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]
