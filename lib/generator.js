const fs = require('fs');
const path = require('path');
const Metalsmith = require('metalsmith');

const render = require('./middlewares/render');
const partials = require('./middlewares/partials');
const empty = require('./middlewares/empty');
const rename = require('./middlewares/rename');
const promptsMiddleware = require('./middlewares/prompts');
const utils = require('./utils');
const logger = require('./logger');

module.exports = function generate(options, done) {

    const generator = Metalsmith(path.join(options.src, 'template'));
    const templateIndex = path.join(options.src, 'index.js');

    generator
        .metadata(options)
        .clean(false);

    const customizer = fs.existsSync(templateIndex) ? require(templateIndex) : {};
    const {
        beforeRender = () => empty,
        afterRender = () => empty,
        fileMaps = () => [],
        prompts = () => [],
        afterBuild = () => done
    } = customizer;

    generator
        .use(options.command === 'scaffold' ? empty : promptsMiddleware(prompts({ utils, logger, options: generator.metadata() })))
        .use(beforeRender({ utils, logger }))
        .use(render)
        .use(afterRender({ utils, logger }))
        .use(partials)
        .use(rename(fileMaps({ utils, logger, options: generator.metadata() })))
        .source('.')
        .destination(options.to)
        .build(afterBuild({ utils, logger }));


};