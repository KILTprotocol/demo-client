# KILT client

## Installation
You might have to configure yarn to use the npm registry to access the private repositories there.
Execute 
```yarn config set @kiltprotocol:registry https://registry.npmjs.org``` 
and either

* login to npm with `npm login`, or
* place a file `.npmrc` in the root directory of this repo and paste a valid auth token for the NPM registry in there:

```
//registry.npmjs.org/:_authToken=xxx
```

## Build and Run

This project is using semantic UI. Source code in /semantic will be build by `yarn start` and places within /src/dist.

If you are likely to adapt the theme or anything regarding semantic UI, use `yarn run watch-semantic`. This will push new code automatically to /src/dist, which triggers a reload of the app (by previous `yarn start`)


## Run in docker container

### Build docker image
You need to provide the auth token to access the NPM registry (for the sdk) as an environment variable. So when building the docker image pass `--build-arg $KILT_NPM_AUTH_TOKEN` to the command line.

```
docker build --build-arg KILT_NPM_AUTH_TOKEN=xxx -t kilt/prototype-client .
```

### Run docker image
```
docker run -p 80:80 kilt/prototype-client   
```
The client can now be accessed with a browser on http://localhost:80


## Readme from "Create React App"
This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).

See full documentation [here](https://facebook.github.io/create-react-app/docs/getting-started)
