const path = require('path');
const minimatch = require('minimatch');

const logger = require('../logger');

const result = (fn, ...args) => (typeof fn === 'function' ? fn(...args) : fn);

module.exports = (patterns) => function renameMiddleware(files, metalsmith, done) {
    patterns.forEach(({ pattern, rename }) => {
        const matcher = minimatch.Minimatch(pattern);

        Object.keys(files).forEach((file) => {
            if (!matcher.match(file)) {
                return;
            }

            const renamedEntry = `${path.dirname(file)}/${result(rename, path.basename(file))}`;

            files[renamedEntry] = files[file]; //eslint-disable-line no-param-reassign
            delete files[file]; //eslint-disable-line no-param-reassign

            logger.verbose(`File ${file} renamed to ${renamedEntry}`);
        });
    });
    done();
};