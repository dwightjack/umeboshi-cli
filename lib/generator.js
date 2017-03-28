const fs = require('fs');
const path = require('path');
const async = require('async');
const Metalsmith = require('metalsmith');
const render = require('consolidate').handlebars.render;

const empty = (files, metalsmith, done) => done();


const renderFiles = (files, metalsmith, done) => {
    const keys = Object.keys(files);
    const metadata = metalsmith.metadata();
    async.each(keys, (file, next) => {
        const str = files[file].contents.toString();
        // do not attempt to render files that do not have mustaches
        if (!/{{([^{}]+)}}/g.test(str)) {
            next();
            return;
        }
        render(str, metadata, (err, res) => {
            if (err) {
                err.message = `[${file}] ${err.message}`; //eslint-disable-line no-param-reassign
                next(err);
                return;
            }
            files[file].contents = new Buffer(res); //eslint-disable-line no-param-reassign
            next();
        });
    }, done);
};

module.exports = function generate(options, done) {

    const generator = Metalsmith(path.join(options.src, 'template'))
        .metadata(options)
        .clean(false)
        .src('.');

    const customizer = fs.existsSync(path.join(options.src, 'index.js')) ? require(path.join(options.src, 'index.js'))(generator) : {};
    const { beforeRender = empty, afterRender = empty } = customizer;

    generator

        .use(beforeRender)
        .use(renderFiles)
        .use(afterRender)
        .destination(options.to)
        .build(done);


};