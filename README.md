[![](https://user-images.githubusercontent.com/39338561/122415864-8d6a7c00-cf88-11eb-846f-a98a936f88da.png)](https://kilt.io)

# KILT client

The KILT demo client demonstrates the functionality of the KILT SDK and acts as a playground for KILT use cases.

## Installation for local development
Because the demo client will try to connect to our [prototype services](https://github.com/KILTprotocol/prototype-services) and [mashnet-node](https://github.com/KILTprotocol/mashnet-node), we recommend spinning up the whole stack using `docker-compose` (see below).

To run the demo client natively, you have to install all dependencies with yarn.
```
yarn install
```
Then start a develop build with
```
yarn start
```
The client can now be accessed with a browser on http://localhost:3000.

Follow the setup steps from our [prototype services](https://github.com/KILTprotocol/prototype-services) and [mashnet-node](https://github.com/KILTprotocol/mashnet-node) to get these running.

## Run in docker container

Use docker-compose to build and run the demo client and its dependencies (prototype services and mashnet node) in a set of docker containers.
```
docker-compose up demo-client
```
Again, the client is now available on http://localhost:3000.
Stop and remove all containers (resetting state) with 
```
docker-compose down -v
```
The `src` directory will be mounted to the demo-client's container, which applys all changes on save.
If you make changes that require reinstalling dependencies, rebuild the images with
```
docker-compose up --build demo-client
```

## Readme from "Create React App"
This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).

See full documentation [here](https://facebook.github.io/create-react-app/docs/getting-started)
