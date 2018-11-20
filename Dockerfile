FROM nginx:stable-alpine

# Create app directory
WORKDIR /app

RUN apk add yarn

COPY . ./

RUN yarn install
RUN yarn build

EXPOSE 80
RUN cp -R build/* /usr/share/nginx/html