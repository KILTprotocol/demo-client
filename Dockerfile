ARG NODE_VERSION=14
FROM node:${NODE_VERSION}-alpine as develop

WORKDIR /app

RUN apk add --no-cache bash

COPY package.json yarn.lock ./env.sh ./
RUN yarn install

COPY . ./

EXPOSE 3000
CMD [ "yarn", "start" ]

FROM develop as builder

RUN yarn build

FROM nginx:alpine as release
COPY --from=builder /app/build/ /usr/share/nginx/html/
COPY ./config/nginx.conf /etc/nginx/conf.d/default.conf

# Copy .env file and shell script to container
WORKDIR /usr/share/nginx/html
COPY env.sh .env ./

# Copy readme & license to container
COPY README.md LICENSE /

# Add bash
RUN apk add --no-cache bash

# Make our shell script executable
RUN chmod +x env.sh

# Start Nginx server
CMD ["/bin/bash", "-c", "/usr/share/nginx/html/env.sh && nginx -g \"daemon off;\""]