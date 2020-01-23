FROM node:10-alpine as builder

WORKDIR /app

COPY . ./

RUN yarn install
RUN yarn lint
#RUN yarn testCI
RUN yarn build

FROM nginx:alpine
COPY --from=builder /app/build/ /usr/share/nginx/html/
COPY --from=builder /app/config/nginx.conf /etc/nginx/conf.d/default.conf
