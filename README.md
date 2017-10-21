# umeboshi-cli

> simple project scaffolding for SPA applications, inspired by [vue-cli](https://github.com/vuejs/vue-cli)

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

#### Available commands:

* `create`: scaffolds a new project based on a remote template
* `scaffold`: scaffolds project's folders and files based on templates
* `clean`: deletes locally stored project templates

#### Global options:

* `--verbose`: verbose logging (useful for debugging)
* `--log-level=n`: where `n` is `0` (verbose), `1` (default), `2` (messages), `3` (warnings), `4` (errors)

### `create`

This command scaffolds a new project based on a local or remote template into a target folder.

```sh
$ umeboshi create <template> <project-folder|.> [--dry-run]
```

Examples:

```sh
$ umeboshi create base my-project-folder

# process files but don't output anything
$ umeboshi create base my-project-folder --dry-run

# use the current folder as project root
$ umeboshi create base .
```

Learn more about `create` [here](docs/create.md)

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

### `clean`

This command will cleanup cached templates (usually stored under `~/.umeboshi-cli/`).

```sh
$ umeboshi clean
```

## Official Project Templates

Available project templates:

* [Base](https://github.com/dwightjack/umeboshi-template-base) (`ume create base`)
* [React](https://github.com/dwightjack/umeboshi-template-react) (`ume create react`)
* [Vue.js](https://github.com/dwightjack/umeboshi-template-vue) (`ume create vue`)

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2016-2017 Marco Solazzi