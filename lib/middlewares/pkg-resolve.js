const async = require('async');
const isPlainObject = require('lodash/isPlainObject');
const npa = require('npm-package-arg');
const { getJSON, JSONtoBuffer, fileToJSON } = require('../utils');

const logger = require('../logger');

const REGISTRY_URI = 'https://registry.npmjs.org';
const PKG_TEST_REGEXP = /-?umeboshi-?/;

module.exports = (files, metalsmith, done) => {

    const pgkFile = files['package.json'];

    if (!pgkFile) {
        logger.verbose('[pkg-resolve] File "package.json" not found. Skipping...');
        done();
        return;
    }

    try {

        const pkg = fileToJSON(files, 'package.json');
        const { devDependencies = {} } = pkg;

        const collection = Object.keys(devDependencies).filter((p) => PKG_TEST_REGEXP.test(p));

        if (collection.length === 0) {
            logger.verbose('[pkg-resolve] No Umeboshi peer dependencies found. Skip...');
            done();
            return;
        }

        logger.verbose('[pkg-resolve] collecting peer dependencies...');


        async.eachSeries(collection, (packageName, next) => {

            const { escapedName } = npa(packageName);
            const version = devDependencies[packageName];
            const pkgUrl = `${REGISTRY_URI}/${escapedName}/${version}`;

            getJSON(pkgUrl).then(
                ({ peerDependencies = {} }) => {
                    if (isPlainObject(peerDependencies) && Object.keys(peerDependencies).lenght > 0) {
                        logger.verbose(`[pkg-resolve] found peerDependencies: ${JSON.stringify(peerDependencies)}`);
                        pkg.devDependencies = Object.assign(peerDependencies, pkg.devDependencies);
                    }
                    next();
                },
                (errStatus) => {
                    logger.verbose(`[pkg-resolve] unable to load data for ${pkgUrl}. ${errStatus}`);
                    next();
                }
            );

        }, (err) => {

            if (err) {
                logger.error(`[pkg-resolve] Unable to process "package.json". ${err.toString()}`);
                done();
                return;
            }

            files['package.json'].contents = JSONtoBuffer(pkg); //eslint-disable-line no-param-reassign
            done();
        });



    } catch (e) {
        logger.error(`[pkg-resolve] Unable to parse "packag.json". ${e.toString()}`);
        done();
    }

};