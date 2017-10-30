# Project Scaffolding

Command signature:

```sh
$ umeboshi create <template-name> <folder>|. [--dry-run]
```

## Options

* `--dry-run`: process files but don't output anything

## Arguments

* `<template>`: scaffolding template
* `<folder>`: destination folder. Use `.` to use the current folder

## Templates

A project scaffolding template could be:

1) an [official umeboshi template](../README.md#official-project-templates)
1) a custom template from a GitHub or Bitbucket repository
1) a _plain_ GitHub or Bitbucket repository (will just copy the repository)
1) a path to a local folder (starting with `.` or `/`)


Examples:

```sh
ume create base my-folder
# resolves to github.com/dwightjack/umeboshi-template-base

ume create user/custom-umeboshi-template my-folder
# resolves to github.com/user/custom-umeboshi-template

ume create github:user/custom-umeboshi-template my-folder
# resolves to github.com/user/custom-umeboshi-template

ume create bitbucket:user/custom-umeboshi-template my-folder
# resolves to bitbucket.org/user/custom-umeboshi-template

ume create user/my-repo my-folder
# resolves to plain repository github.com/user/my-repo

ume create /my-local/template my-folder
# resolves to local folder /my-local/template
```

### Tags and Branches

You can target specific branches and tags of templates and GitHub repositories by appending `#<tag|branch>` to the `template` argument. Tags must comply to [semver](http://semver.org/) ranges and versions.

By default resolves to the latest valid tag version number or `master`.

Examples:

```sh
ume create base#master my-folder
# master branch

ume create base#3 my-folder
# target tags >= 3.0.0 < 4.0.0

ume create base#^3.1.0 my-folder
# target tags >= 3.1.0 < 3.2.0

ume create base#3.1.2 my-folder
# target tag 3.1.2
```

## Template authoring guidelines

Every template is made up of:

* a `template` folder containing the files and folders to scaffold
* an optional `index.js` entry point used by umeboshi to alter the scaffolding process.

### `template` folder files

Every file inside the `template` folder will be parsed with [Handlebars](http://handlebarsjs.com/) and saved onto the provided destination folder. Beside default helpers, you can use all helpers from [handlebars-helpers](https://github.com/helpers/handlebars-helpers).

The following variables are available inside templates:

* `{{ name }}`: project name
* `{{ description }}`: project description
* `{{ author }}`: project author
* `{{ fullName }}`: `name` in _Title Case_ format
* `{{ version }}`: template version
* `{{ templateName }}`: template name
* `{{ to }}`: destination folder


### Template entry point

If the template contains an `index.js` file, it will be used as entry point and loaded by umeboshi during the scaffolding process. Exposed functions are:


#### `prompt({ utils, logger, options })`

A function that returns an array of [inquirer](https://github.com/SBoudrias/Inquirer.js#questions) question objects prompted to the user. Defaults to `() => []`. Answers will be merged into the instance options.

Receives an object with the following properties:

* `utils`: umeboshi-cli [utils](../lib/utils.js) module
* `logger`: umeboshi-cli [logger](../lib/logger.js) module
* `options`: current instance options

Example:

```js
const fs = require('fs');

module.exports.prompts = () => [
    {
        type: 'confirm',
        name: 'hmr',
        message: 'Enable Hot Module Replacement',
        default: false
    }
];
```

#### `beforeRender({ utils, logger })`

A function that returns a [Metalsmith](http://www.metalsmith.io/) middleware to be executed **before** Handlebars rendering. Defaults to a pass-through middleware.

Receives an object with the following properties:

* `utils`: umeboshi-cli [utils](../lib/utils.js) module
* `logger`: umeboshi-cli [logger](../lib/logger.js) module

```js
const fs = require('fs');

module.exports.beforeRender = ({ logger }) => (files, metalsmith, done) => {

    //cycle template files and log their contents
    Object.keys(files).forEach((file) => {
        logger.log(files[file].contents.toString());
    });
};
```

#### `afterRender({ utils, logger })`

A function that returns a [Metalsmith](http://www.metalsmith.io/) middleware to be executed **after** Handlebars rendering. Defaults to a pass-through middleware.

Receives an object with the following properties:

* `utils`: umeboshi-cli [utils](../lib/utils.js) module
* `logger`: umeboshi-cli [logger](../lib/logger.js) module


#### `fileMaps({ utils, logger, options })`

A function that returns an array of rename patterns. The associated middleware is executed **after** `afterRender`. Defaults to `() => []`.

Receives an object with the following properties:

* `utils`: umeboshi-cli [utils](../lib/utils.js) module
* `logger`: umeboshi-cli [logger](../lib/logger.js) module
* `options`: current instance options

Example: 

```js
module.exports.fileMaps = ({ options }) => [
    {
        pattern: 'style.css',
        rename: 'renamed-style.css'
    }, 
    {
        pattern: '*.js', // minimatch match pattern.
        rename: (filename) => `renamed-${filename}`
    }
];
```