# Используем официальный Node-образ
FROM node:18 AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package.json ./

# Если у тебя уже есть lock-файл — раскомментируй строку ниже:
 COPY package-lock.json ./

# Используем npm install вместо npm ci
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
