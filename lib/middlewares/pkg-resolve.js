const async = require('async');
const semver = require('semver');
const isPlainObject = require('lodash/isPlainObject');
const npa = require('npm-package-arg');
const { getJSON, JSONtoBuffer, fileToJSON } = require('../utils');
const registryUrl = require('registry-url')();

const logger = require('../logger');

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

        const newDeps = {};


        async.eachSeries(collection, (packageName, next) => {

            const { escapedName } = npa(packageName);
            const range = devDependencies[packageName];
            const pkgUrl = `${registryUrl}/${escapedName}/`.replace('//', '/');

            getJSON(pkgUrl).then(({ versions }) => {
                if (!semver.validRange(range)) {
                    return Promise.reject(`Invalid range ${range}`);
                }
                logger.verbose(`Versions for ${packageName}: ${Object.keys(versions).join(', ')}`);
                const version = semver.maxSatisfying(Object.keys(versions), range);
                if (!version) {
                    return Promise.reject(`Invalid range ${range}`);
                }
                logger.verbose(`Downloading metadata for version ${version}...`);
                return getJSON(pkgUrl + version);
            }).then(
                ({ peerDependencies = {} }) => {
                    if (isPlainObject(peerDependencies) && Object.keys(peerDependencies).length > 0) {
                        logger.verbose(`[pkg-resolve] ${packageName}@${version} - found peerDependencies: ${JSON.stringify(peerDependencies)}`);
                        Object.assign(newDeps, peerDependencies);

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


            if (Object.keys(newDeps).length > 0) {
                logger.verbose([`[pkg-resolve] Added the following devDependencies: ${JSON.stringify(newDeps)}`]);
                pkg.devDependencies = Object.assign(newDeps, pkg.devDependencies);
            }

            files['package.json'].contents = JSONtoBuffer(pkg); //eslint-disable-line no-param-reassign
            done();
        });



    } catch (e) {
        logger.error(`[pkg-resolve] Unable to parse "package.json". ${e.toString()}`);
        done();
    }

};