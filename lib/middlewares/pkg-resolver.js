const async = require('async');
const npa = require('npm-package-arg');
const request = require('request');

const logger = require('../logger');

const REGISTRY_URI = 'https://registry.npmjs.org';
const PKG_TEST_REGEXP = /-?umeboshi-?/;

module.exports = (files, metalsmith, done) => {

    const pgkFile = files['package.json'];

    if (!pgkFile) {
        logger.verbose('[pkg-resolver] File "package.json" not found. Skipping...');
        return done();
    }

    try {

        const pkg = JSON.parse(pgkFile.contents.toString());
        const { devDependencies = {} } = pkg;

        logger.verbose('[pkg-resolver] collecting peer dependencies...');

        async.eachSeries(Object.keys(devDependencies), (package, next) => {

            if (PKG_TEST_REGEXP.test(package) === false) {
                //skip
                next();
                return;
            }

            const { escapedName } = npa(package);
            const version = devDependencies[package];
            const pkgUrl = `${REGISTRY_URI}/${escapedName}/${version}`;

            request.get(pkgUrl, { json: true }, (err, res, packageJson) => {
                if (err || (res.statusCode < 200 || res.statusCode >= 400)) {

                    const message = res ? `(status: ${res.statusCode})` : `(error: ${err.message})`;
                    logger.verbose(`[pkg-resolver] unable to load data for ${pkgUrl}. ${message}`);

                } else if (packageJson.peerDependencies && Object.keys(packageJson.peerDependencies).lenght > 0) {

                    logger.verbose(`[pkg-resolver] found peerDependencies: ${JSON.stringify(packageJson.peerDependencies)}`);
                    pkg.devDependencies = Object.assign(packageJson.peerDependencies, pkg.devDependencies);

                }
                next();

              });

        }, (err) => {
            if (err) {
                logger.error(`[pkg-resolver] Unable to process "package.json". ${err.toString()}`)
                return done();
            }
            files['package.json'].contents = new Buffer( //eslint-disable-line no-param-reassign
                JSON.stringify(pkg, null, 2)
            );
            done();
        });



    } catch (e) {
        logger.error(`[pkg-resolver] Unable to parse "packag.json". ${e.toString()}`)
        done();
    }

};