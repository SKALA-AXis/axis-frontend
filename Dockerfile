FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# non-root nginx — skala overlay 의 runAsUser:0 패치 제거 가능.
RUN mkdir -p /var/cache/nginx /var/run/nginx \
    && chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/run/nginx \
    && chmod -R g+w /var/cache/nginx /var/run/nginx
USER nginx
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
