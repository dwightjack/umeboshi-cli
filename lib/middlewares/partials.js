const async = require('async');
const merge = require('lodash/merge');
const { JSONtoBuffer, deleteFile, fileToJSON } = require('../utils');
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
            logger.verbose(`[partials] Source file "${srcFile}" not found. Partial "${file}" discarted`);

            deleteFile(files, file);

            next();
            return;
        }

        try {
            const srcFileContent = fileToJSON(files, srcFile);
            const contents = fileToJSON(files, file);

            files[srcFile] = merge({}, files[srcFile]); //eslint-disable-line no-param-reassign

            files[srcFile].contents = JSONtoBuffer(merge(srcFileContent, contents)); //eslint-disable-line no-param-reassign
            deleteFile(files, file);

            logger.verbose(`[partials] Merged partial "${file}" onto source file"${srcFile}"`);

            next();
        } catch (e) {
            next(e);
        }


    }, done);

};