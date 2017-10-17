const path = require('path');
const minimatch = require('minimatch');

const logger = require('../logger');

const { result, deleteFile } = require('../utils');

module.exports = (patterns) => function renameMiddleware(files, metalsmith, done) {
    patterns.forEach(({ pattern, rename }) => {
        const matcher = minimatch.Minimatch(pattern);

        Object.keys(files).forEach((file) => {
            if (!matcher.match(file)) {
                return;
            }

            const renamedEntry = `${path.dirname(file)}/${result(rename, path.basename(file))}`;

            files[renamedEntry] = files[file]; //eslint-disable-line no-param-reassign
            deleteFile(files, file);

            logger.verbose(`[rename] File ${file} renamed to ${renamedEntry}`);
        });
    });
    done();
};