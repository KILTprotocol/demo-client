![](https://user-images.githubusercontent.com/1248214/57789522-600fcc00-7739-11e9-86d9-73d7032f40fc.png)

# KILT client

The KILT demo client demonstrates the functionality of the KILT SDK and acts as a playground for KILT use cases.

## Installation for local development
To use the demo client locally, you have to install all dependencies with yarn.
```
yarn install
```

## Run
To build it and launch a dev server, run
```
yarn start
```

## Run in docker container

### Build docker image
```
docker build -t kilt/prototype-client .
```

### Run docker image
```
docker run -p 80:80 kilt/prototype-client   
```
The client can now be accessed with a browser on http://localhost:80


## Readme from "Create React App"
This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).

See full documentation [here](https://facebook.github.io/create-react-app/docs/getting-started)
