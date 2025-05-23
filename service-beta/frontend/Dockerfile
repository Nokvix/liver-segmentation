
FROM node:18 AS builder

WORKDIR /app

# Устанавливаем зависимости
COPY package.json package-lock.json ./
RUN npm install

# Копируем весь фронтенд и собираем
COPY . .
# результат - /app/dist
RUN npm run build


