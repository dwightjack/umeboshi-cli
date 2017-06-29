const async = require('async');
const Handlebars = require('handlebars');
const render = require('consolidate').handlebars.render;

require('handlebars-helpers')({
    handlebars: Handlebars
});

const logger = require('../logger');

Handlebars.registerHelper('if_eq', function ifEq(a, b, opts) {
    return a === b
        ? opts.fn(this)
        : opts.inverse(this);
});

Handlebars.registerHelper('unless_eq', function unlessEq(a, b, opts) {
    return a === b
        ? opts.inverse(this)
        : opts.fn(this);
});

module.exports = (files, metalsmith, done) => {

    const keys = Object.keys(files);
    const metadata = Object.assign(metalsmith.metadata(), { cache: false });

    async.each(keys, (file, next) => {
        const str = files[file].contents.toString();
        // do not attempt to render files that do not have mustaches
        if (!/{{([^{}]+)}}/g.test(str)) {
            logger.verbose(`File "${file}" copied`);
            next();
            return;
        }

        render(str, metadata, (err, res) => {
            if (err) {
                err.message = `[${file}] ${err.message}`; //eslint-disable-line no-param-reassign
                logger.fatal(err.message);
                next(err);
                return;
            }
            files[file].contents = new Buffer(res); //eslint-disable-line no-param-reassign
            logger.verbose(`File "${file}" parsed and copied`);
            next();
        });
    }, done);

};