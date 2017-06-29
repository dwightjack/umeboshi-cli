# umeboshi-cli

> simple project sacaffolding for SPA applications, inspired by [vue-cli](https://github.com/vuejs/vue-cli)

## Requirements

* Node.js >= 6.9.0 (we strongly suggest to use something like [nvm](https://github.com/creationix/nvm))
* npm or [yarn](https://yarnpkg.com/lang/en/)

## Installation

Install as a global node package:

```
$ npm install -g umeboshi-cli
```

## Usage

Once installed umeboshi-cli commands are available through the `umeboshi` or `ume` executable.

**Available commands are:**

* `create`: scaffolds a new project based on a remote template
* `scaffold`: scaffolds project's folders and files based on templates
* `clean`: deletes locally stored project templates

### `create`

This command scaffolds a new project based on a remote template. The target folder must be empty.

```sh
$ umeboshi create <template> <project-folder|.>
```

Example:

```sh
$ umeboshi create base my-project-folder

# use the current folder as project root
$ umeboshi create base .
```

_More docs to come..._

### `scaffold`

This command scaffolds project's folders and files based on templates.

```sh
$ umeboshi scaffold <namespace>[/<template-name>]
```

Example:

```sh
$ umeboshi scaffold react/stateless
```

Learn more about `scaffold` [here](docs/scaffold.md)

## Official Project Templates

Available project templates:

* [Base](https://github.com/dwightjack/umeboshi-base)
* [React](https://github.com/dwightjack/umeboshi-react)
* [Vue.js](https://github.com/dwightjack/umeboshi-vue)