FROM node:20-slim AS base

WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

ARG API_PROXY_URL=http://localhost:3001
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV API_PROXY_URL=${API_PROXY_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
