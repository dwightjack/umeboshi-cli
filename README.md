# Umeboshi (WIP)

> lean Webpack Template for SPA applications, inspired by [vue-cli](https://github.com/vuejs/vue-cli)

## Requirements

* Node.js >= 6.9.0 (we strongly suggest to use something like [nvm](https://github.com/creationix/nvm))
* npm or [yarn](https://yarnpkg.com/lang/en/)

## Installation

Install as a global node package:

```
$ npm install -g umeboshi-cli
```

## Usage

```
$ umeboshi create <template> <project-folder>
```

Example: 

```
$ umeboshi create base my-project-folder
```

### Project Templates

Available project templates:

* [Base](https://github.com/dwightjack/umeboshi-base)
* [React](https://github.com/dwightjack/umeboshi-react) (WIP)
* Vue (WIP)

## Scripts

Either use `npm run <script>` or `yarn run <script>`

* `start`: start development mode
* `server`: run a static web server
* `test`: run jest
* `build`: generate a development build (will also lint files)
* `build:production`: generate a production build
* `eslint`: lint JS files
* `stylelint`: lint SCSS/CSS files
* `lint`: lint both styles and JS files


## Development 

To run the project in development mode (uses [webpack dev server](https://webpack.js.org/configuration/dev-server/)) run:

```
yarn start
```

