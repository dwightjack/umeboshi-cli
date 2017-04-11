const async = require('async');
const merge = require('lodash/merge');

const logger = require('../logger');

module.exports = (files, metalsmith, done) => {

    const keys = Object.keys(files);

    async.each(keys, (file, next) => {

        if (file.indexOf('.__partial') === -1) {
            next();
            return;
        }

        const srcFile = file.replace('.__partial', '');

        if (keys.indexOf(srcFile) === -1) {
            logger.verbose(`Source file "${srcFile}" not found. Partial "${file}" discarted`);
            delete files[file]; //eslint-disable-line no-param-reassign
            next();
            return;
        }

        try {
            const srcFileContent = JSON.parse(files[srcFile].contents.toString());
            const contents = JSON.parse(files[file].contents.toString());

            files[srcFile] = merge({}, files[srcFile]); //eslint-disable-line no-param-reassign

            files[srcFile].contents = new Buffer( //eslint-disable-line no-param-reassign
                JSON.stringify(merge(srcFileContent, contents), null, 2)
            );
            logger.verbose(`Merged partial "${file}" onto source file"${srcFile}"`);
            delete files[file]; //eslint-disable-line no-param-reassign
            next();
        } catch (e) {
            next(e);
        }


    }, done);

};