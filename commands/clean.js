const fs = require('fs');
const program = require('commander');
const ora = require('ora');
const semver = require('semver');
const chalk = require('chalk');
const rimraf = require('rimraf');

const pkg = require('../package.json');
const logger = require('../lib/logger');
const { tmpDir, listFolders } = require('../lib/utils');

if (semver.satisfies(process.version, pkg.engines.node) === false) {
    logger.fatal(`Your current version of Node.js doesn't satisfy the minimun requirement: ${pkg.engines.node}`);
}

/**
 * Usage.
 */

program
    .version(pkg.version)
    .option('--verbose', 'Verbose output')
    .option('--log-level <n>', `Log levels: ${logger.asString()}`, parseInt);

/**
 * Help.
 */

program.on('--help', () => {
    console.log('  Examples:');
    console.log();
    console.log(chalk.gray('    # clean up temporary files folder'));
    console.log('    $ umeboshi clean');
    console.log();
});

program.parse(process.argv);

if (!program.verbose && Number.isFinite(program.logLevel)) {
    logger.setLevel(program.logLevel);
} else if (program.verbose) {
    logger.setLevel(0);
}

const tmpFolder = tmpDir('');
const folderList = fs.existsSync(tmpFolder) ? listFolders(tmpFolder) : [];

if (folderList.length === 0) {
    logger.message(`Temporary folder ${tmpFolder} is empty`);
    process.exit();
}

const spinner = ora(`Cleaning up ${tmpFolder}...`);
spinner.start();

logger.verbose('\n\nCleaning up the following folders:');
folderList.forEach((f) => logger.verbose(f));
logger.verbose('');

spinner.start();

rimraf(`${tmpFolder}/*`, (err) => {
    if (err) {
        spinner.fail(`Error cleaning up temporary folder: ${err}`);
        process.exit(1);
    }
    spinner.succeed('Cleanup completed');
});