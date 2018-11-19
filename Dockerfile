FROM node:10-alpine

# Create app directory
WORKDIR /app

RUN apk add yarn

COPY . ./

RUN yarn install

EXPOSE 3000
CMD [ "yarn", "run", "start"]
