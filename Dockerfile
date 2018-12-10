FROM node:10-alpine as builder

WORKDIR /app
RUN apk add yarn

COPY . ./

# environment variable $KILT_NPM_AUTH_TOKEN must be provided when building the image:
# docker built --build-arg KILT_NPM_AUTH_TOKEN=xxx ...
ARG KILT_NPM_AUTH_TOKEN=""
RUN echo "//registry.npmjs.org/:_authToken=$KILT_NPM_AUTH_TOKEN" > .npmrc
RUN less .npmrc
RUN yarn config set @kiltprotocol:registry https://registry.npmjs.org
RUN yarn install && yarn build

FROM nginx:alpine
COPY --from=builder /app/build/ /usr/share/nginx/html/