const path = require('path');
const isRegExp = require('lodash/isRegExp');
const extend = require('lodash/extend');
const minimatch = require('minimatch');
const Handlebars = require('handlebars');
const slash = require('slash');
const logger = require('../logger');
const utils = require('../utils');

const { result, deleteFile } = utils;

const parsePath = (filename) => {
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);

    return {
        ext,
        name,
        dir: path.dirname(filename),
        base: name + ext
    };
};

const regExpMatch = (pattern) => ({
    match: (file) => slash(file).match(pattern)
});

module.exports = (fileMaps) => function renameMiddleware(files, metalsmith, done) {
    const patternsArray = result(fileMaps, { utils, logger, options: metalsmith.metadata() });
    patternsArray.forEach(({ pattern, rename, preserve = false }) => {
        const matcher = isRegExp(pattern) ? regExpMatch(pattern) : minimatch.Minimatch(pattern);

        Object.keys(files).forEach((file) => {
            const match = matcher.match(file);
            if (!match) {
                return;
            }

            if (rename === null) {
                deleteFile(files, file, 'rename');
                return;
            }

            const ctx = extend({ path: parsePath(file), file, match }, metalsmith.metadata());

            //by default
            let renamedEntry = rename;

            //an handlebars template, compile it
            if (typeof rename === 'string' && rename.indexOf('{') !== -1) {
                renamedEntry = Handlebars.compile(rename);
            }

            const newName = result(renamedEntry, ctx);

            if (!newName || typeof newName !== 'string') {
                logger.warning(`[rename] the "rename" option for pattern "${pattern}" on file ${file} should resolve to a string. Skipping...`);
                return;
            }

            files[path.normalize(newName)] = files[file]; //eslint-disable-line no-param-reassign
            logger.verbose(`[rename] File ${file} renamed to ${path.normalize(newName)}`);

            if (!preserve) {
                deleteFile(files, file, 'rename');
            }

        });
    });
    done();
};