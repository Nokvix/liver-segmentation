# Используем официальный Node-образ
FROM node:18 AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package.json ./

COPY package-lock.json ./

RUN npm install

# Копируем остальные файлы
COPY . .

# Собираем приложение
RUN npm run build

# ====================
# Production image
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
