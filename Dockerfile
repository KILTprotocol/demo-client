ARG NODE_VERSION=10
FROM node:${NODE_VERSION}-alpine as develop
ARG NODE_AUTH_TOKEN=""

WORKDIR /app

RUN apk add --no-cache bash

COPY package.json yarn.lock ./
COPY ?npmrc ?yarnrc ./
RUN yarn install

COPY . ./

RUN rm -f .npmrc

EXPOSE 3001
CMD [ "yarn", "start" ]

FROM develop as builder
RUN yarn lint
#RUN yarn testCI
RUN yarn build

FROM nginx:alpine as release
COPY --from=builder /app/build/ /usr/share/nginx/html/
COPY --from=builder /app/config/nginx.conf /etc/nginx/conf.d/default.conf

# Copy .env file and shell script to container
WORKDIR /usr/share/nginx/html
COPY ./env.sh .
COPY .env .

# Add bash
RUN apk add --no-cache bash

# Make our shell script executable
RUN chmod +x env.sh

# Start Nginx server
CMD ["/bin/bash", "-c", "/usr/share/nginx/html/env.sh && nginx -g \"daemon off;\""]