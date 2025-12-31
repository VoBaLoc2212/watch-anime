# Stage 1: Build Node
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve bằng Nginx
FROM nginx:alpine
# Copy file build từ stage 1 vào thư mục nginx
COPY --from=build /app/dist /usr/share/nginx/html
# (Tùy chọn) Copy file cấu hình nginx nếu cần custom routing
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]