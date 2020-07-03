ARG NODE_VERSION=10
FROM node:${NODE_VERSION}-alpine as develop

WORKDIR /app

COPY package.json yarn.lock ./
COPY ?npmrc ?yarnrc ./
RUN yarn install

COPY . ./

EXPOSE 3001
CMD [ "yarn", "start" ]

FROM develop as builder
ARG BUILD_ENV=.env.production
RUN yarn lint
#RUN yarn testCI
RUN yarn env-cmd -f ${BUILD_ENV} node scripts/build.js

FROM nginx:alpine as release
COPY --from=builder /app/build/ /usr/share/nginx/html/
COPY --from=builder /app/config/nginx.conf /etc/nginx/conf.d/default.conf
