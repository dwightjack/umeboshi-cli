const fs = require('fs');
const path = require('path');
const Metalsmith = require('metalsmith');

const render = require('./middlewares/render');
//const partials = require('./middlewares/partials');
const empty = require('./middlewares/empty');
const rename = require('./middlewares/rename');
const pkgResolve = require('./middlewares/pkg-resolve');
const promptsMiddleware = require('./middlewares/prompts');
const utils = require('./utils');
const logger = require('./logger');

module.exports = function generate(options, done) {

    let templatePath = path.resolve(options.src, 'template');
    const isTemplate = fs.existsSync(templatePath);
    let customizer = {};

    if (isTemplate) {
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
        .use(rename(fileMaps))
        .use(beforeRender({ utils, logger }))
        .use(isTemplate ? render : empty)
        .use(afterRender({ utils, logger }))
        //.use(partials)
        .use(pkgResolve)
        .source('.')
        .destination(options.to);

    if (options.dryRun) {
        generator.process(afterBuild(done, { utils, logger }));
    } else {
        generator.build(afterBuild(done, { utils, logger }));
    }

};