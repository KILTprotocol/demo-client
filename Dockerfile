FROM node:10-alpine

WORKDIR /app

RUN apk add yarn python make g++ binutils binutils-dev

COPY . ./

RUN yarn config set @kiltprotocol:registry https://registry.npmjs.org
RUN yarn install

EXPOSE 3000

CMD ["yarn", "start"]
