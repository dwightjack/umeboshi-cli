const fs = require('fs');
const path = require('path');
const Metalsmith = require('metalsmith');

const render = require('./middlewares/render');
const partials = require('./middlewares/partials');
const empty = require('./middlewares/empty');
const utils = require('./utils');

module.exports = function generate(options, done) {

    const generator = Metalsmith(path.join(options.src, 'template'));
    const templateIndex = path.join(options.src, 'index.js');

    generator
        .metadata(options)
        .clean(false);

    const customizer = fs.existsSync(templateIndex) ? require(templateIndex)({ generator, utils }) : {};
    const { beforeRender = empty, afterRender = empty } = customizer;

    generator
        .use(beforeRender)
        .use(render)
        .use(afterRender)
        .use(partials)
        .source('.')
        .destination(options.to)
        .build(done);


};