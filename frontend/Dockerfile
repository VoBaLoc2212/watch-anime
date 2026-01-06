# Stage 1: Build
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Chạy build (Code sẽ được build vào folder /app/dist/public)
RUN npx vite build

# Stage 2: Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Xóa html mặc định
RUN rm -rf ./*

# --- KHẮC PHỤC Ở ĐÂY ---
# Thay vì copy /app/dist, ta copy /app/dist/public/
# Dấu gạch chéo cuối cùng rất quan trọng!
COPY --from=build /app/dist/public/ .

# Copy file config nginx (nếu có)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]