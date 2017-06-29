# Template scaffolding

Command signature:

```sh
$ umeboshi scaffold <namespace>[/<template-name>]
```

Project's templates are stored locally. Template resolution order:

* `scaffold/<namespace>[/<template-name>]` folder in the project root
* `umeboshi-scaffold-<namespace>[/<template-name>]` local npm module

## User templates

User templates are stored inside a `scaffold` folder in the project root.

Inside this folder, templates are stored in a `<namespace>[/<template-name>]` tree format.  

```
<root>
  -- scaffold/
     -- react/ <-- <namespace>
        -- stateless/ <-- <template-name>
           -- template/ <-- template files
           -- index.js <-- umeboshi template entrypoint

    -- readme/ <-- <namespace> only flat template
        -- template/ <-- template files
        -- index.js <-- umeboshi template entrypoint
```

## NPM templates

NPM templates are a collection of templates installed as local npm modules.

Templates are stored in a `umeboshi-scaffold-<namespace>[/<template-name>]` tree format.  

```
<root>
  -- node_modules/
     -- umeboshi-scaffold-react/ <-- namespaced module name
        -- stateless/ <-- <template-name>
           -- template/ <-- template files
           -- index.js <-- umeboshi template entrypoint

    -- umeboshi-scaffold-readme/ <-- <namespace> only flat template
        -- template/ <-- template files
        -- index.js <-- umeboshi template entrypoint
```

## Template guidelines

Every template is made up of:

* a `template` folder containing the files and folders to scaffolding
* an optional `index.js` entry point that will be read by umeboshi and used to submit prompts to the user and alter / rename scaffolded files.


### Template entry point

If the template contains an `index.js` file, it will be used as entry point and loaded by umeboshi during the scaffolding process. Exposed functions are:


#### `prompt({ program, namespace, folder })`

A function that returns an array of [inquirer](https://github.com/SBoudrias/Inquirer.js#questions) question objects be prompt to the user. Defaults to `() => []`.

**Note**: the only required question object is an object with `name: 'to'` to setup the rendered template destination folder. Resulting path must be relative to the current working directory.

Receives an object with the following properties:

* `program`: a [Commander.js](https://github.com/tj/commander.js/) program instance
* `namespace`: user provided namespace (in `react/stateless` the namespace is `react`)
* `folder`: user provided folder (in `react/stateless` the folder is `stateless`)

Example:

```js
const fs = require('fs');

module.exports.prompts = () => [
    {
        type: 'input',
        name: 'COMPONENT_NAME', // used inside template files as {{ COMPONENT_NAME }}
        message: 'Component Name (CamelCase format)',
        validate: (input) => /^[A-Z][A-Za-z]+$/.test(input) === true
    }, {
        type: 'input',
        name: 'to',
        default: ({ COMPONENT_NAME }) => `app/assets/js/components/${COMPONENT_NAME}`,
        message: 'Destination folder (relative to cwd)',
        validate: (input) => fs.existsSync(input) === false
    }
];
```

#### `beforeRender({ utils, logger })`

A function that returns a [Metalsmith](http://www.metalsmith.io/) middleware to be executed **before** Handlebars rendering. Defaults to a pass-through middleware.

Receives an object with the following properties:

* `utils`: umeboshi-cli utils module
* `logger`: umeboshi-cli logger module

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

* `utils`: umeboshi-cli utils module
* `logger`: umeboshi-cli logger module


#### `fileMaps({ utils, logger, options })`

A function that returns an array of rename patterns. This middleware is executed **after** `afterRender`. Defaults to `() => []`.

Receives an object with the following properties:

* `utils`: umeboshi-cli utils module
* `logger`: umeboshi-cli logger module
* `options`: an object containing answers provided to `prompt()` function

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


### `template` folder files

Every file inside the `template` folder will be parsed with [Handlebars](http://handlebarsjs.com/) and saved onto the provided destination folder. Beside default helpers, you can use all helpers from [handlebars-helpers](https://github.com/helpers/handlebars-helpers)

Example:

```js
// react/stateless/index.js
const fs = require('fs');

module.exports.prompts = () => [
    {
        type: 'input',
        name: 'COMPONENT_NAME', // used inside template files as {{ COMPONENT_NAME }}
        message: 'Component Name (CamelCase format)',
        validate: (input) => /^[A-Z][A-Za-z]+$/.test(input) === true
    }, {
        type: 'input',
        name: 'to',
        default: ({ COMPONENT_NAME }) => `app/assets/js/components/${COMPONENT_NAME}`,
        message: 'Destination folder (relative to cwd)',
        validate: (input) => fs.existsSync(input) === false
    }
];
```

```js
// react/stateless/template/index.js
import React from 'react';
import PropTypes from 'prop-types';

const {{COMPONENT_NAME}} = () => {
    return (
        <div />
    );
};

{{COMPONENT_NAME}}.propTypes = {};
{{COMPONENT_NAME}}.defaultProps = {};

export default {{COMPONENT_NAME}};
```

```js
// input COMPONENT_NAME = 'MyComponent' 
// output app/assets/components/MyComponent/index.js

import React from 'react';
import PropTypes from 'prop-types';

const MyComponent = () => {
    return (
        <div />
    );
};

MyComponent.propTypes = {};
MyComponent.defaultProps = {};

export default MyComponent;
```