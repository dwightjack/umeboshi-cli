const fs = require('fs');
const path = require('path');
const Metalsmith = require('metalsmith');

const render = require('./middlewares/render');
const partials = require('./middlewares/partials');
const empty = require('./middlewares/empty');
const rename = require('./middlewares/rename');
const pkgResolve = require('./middlewares/pkg-resolve');
const promptsMiddleware = require('./middlewares/prompts');
const utils = require('./utils');
const logger = require('./logger');

module.exports = function generate(options, done) {

    let templatePath = path.resolve(options.src, 'template');
    let customizer = {};

    if (fs.existsSync(templatePath)) {
        const templateIndex = path.join(options.src, 'index.js');
        customizer = fs.existsSync(templateIndex) ? require(templateIndex) : {};
    } else {
        templatePath = options.src;
    }

    const {
        beforeRender = () => empty,
        afterRender = () => empty,
        fileMaps = () => [],
        prompts = () => [],
        afterBuild = () => done
    } = customizer;

    const generator = Metalsmith(templatePath);

    generator
        .metadata(options)
        .clean(false)
        .use(options.command === 'scaffold' ? empty : promptsMiddleware(prompts({ utils, logger, options: generator.metadata() })))
        .use(beforeRender({ utils, logger }))
        .use(render)
        .use(afterRender({ utils, logger }))
        .use(partials)
        .use(rename(fileMaps({ utils, logger, options: generator.metadata() })))
        .use(pkgResolve)
        .source('.')
        .destination(options.to)
        .build(afterBuild({ utils, logger }));

};